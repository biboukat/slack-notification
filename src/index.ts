import * as core from "@actions/core";
import { context, getOctokit } from "@actions/github";
import { IncomingWebhook } from "@slack/webhook";
import {
  IncludeJobs,
  PullRequest,
  SlackMessageAttachmentFields,
} from "./types";
import { compute_duration } from "./helpers";

process.on("unhandledRejection", handleError);
main().catch(handleError);

async function main(): Promise<void> {
  // Collect Action Inputs
  const webhook_url = core.getInput("slack_webhook_url", { required: true });
  const github_token = core.getInput("repo_token", { required: true });
  const jobs_to_fetch = core.getInput("jobs_to_fetch", { required: true });
  const include_jobs = core.getInput("include_jobs", {
    required: true,
  }) as IncludeJobs;
  const include_commit_message =
    core.getInput("include_commit_message", {
      required: true,
    }) === "true";
  const slack_channel = core.getInput("channel");
  const slack_name = core.getInput("name");
  const slack_icon = core.getInput("icon_url");
  const slack_emoji = core.getInput("icon_emoji"); // https://www.webfx.com/tools/emoji-cheat-sheet/
  const pretext_message = core.getInput("pretext");
  // Force as secret, forces *** when trying to print or log values
  core.setSecret(github_token);
  core.setSecret(webhook_url);
  // Auth github with octokit module
  const octokit = getOctokit(github_token);
  // Fetch workflow run data

  const { data: workflow_run } = await octokit.rest.actions.getWorkflowRun({
    owner: context.repo.owner,
    repo: context.repo.repo,
    run_id: context.runId,
  });

  // Fetch workflow job information
  const { data: jobs_response } =
    await octokit.rest.actions.listJobsForWorkflowRun({
      owner: context.repo.owner,
      repo: context.repo.repo,
      run_id: context.runId,
      per_page: parseInt(jobs_to_fetch, 30),
    });

  const completed_jobs = jobs_response.jobs.filter(
    (job) => job.status === "completed"
  );

  console.log("bla ----> completed_jobs", JSON.stringify(completed_jobs));

  // Configure slack attachment styling
  let workflow_color; // can be good, danger, warning or a HEX color (#00FF00)
  let workflow_msg;

  let job_fields: SlackMessageAttachmentFields;

  if (
    completed_jobs.every((job) =>
      ["success", "skipped"].includes(job.conclusion ?? "null")
    )
  ) {
    workflow_color = "good";
    workflow_msg = "Success:";
    if (include_jobs === "on-failure") {
      job_fields = [];
    }
  } else if (completed_jobs.some((job) => job.conclusion === "cancelled")) {
    workflow_color = "warning";
    workflow_msg = "Cancelled:";
    if (include_jobs === "on-failure") {
      job_fields = [];
    }
  } else {
    // (jobs_response.jobs.some(job => job.conclusion === 'failed')
    workflow_color = "danger";
    workflow_msg = "Failed:";
  }

  if (include_jobs === "false") {
    job_fields = [];
  }

  // Build Job Data Fields
  job_fields ??= completed_jobs.map((job) => {
    let job_status_icon;

    switch (job.conclusion) {
      case "success":
        job_status_icon = "✓";
        break;
      case "cancelled":
      case "skipped":
        job_status_icon = "⃠";
        break;
      default:
        // case 'failure'
        job_status_icon = "✗";
    }

    const job_duration = compute_duration({
      start: new Date(job.started_at),
      end: new Date(job.completed_at ?? ""),
    });

    return {
      title: "", // FIXME: it's required in slack type, we should workaround that somehow
      short: true,
      value: `${job_status_icon} <${job.html_url}|${job.name}> (${job_duration})`,
    };
  });

  // Payload Formatting Shortcuts
  const workflow_duration = compute_duration({
    start: new Date(workflow_run.created_at),
    end: new Date(workflow_run.updated_at),
  });
  const repo_url = `<${workflow_run.repository.html_url}|*${workflow_run.repository.full_name}*>`;
  const branch_url = `<${workflow_run.repository.html_url}/tree/${workflow_run.head_branch}|*${workflow_run.head_branch}*>`;
  const workflow_run_url = `<${workflow_run.html_url}|#${workflow_run.run_number}>`;
  // Example: Success: AnthonyKinson's `push` on `master` for pull_request
  let status_string = `${workflow_msg} ${context.actor}'s \`${context.eventName}\` on \`${branch_url}\``;
  // Example: Workflow: My Workflow #14 completed in `1m 30s`
  const details_string = `Workflow: ${context.workflow} ${workflow_run_url} completed in \`${workflow_duration}\``;

  // Build Pull Request string if required
  const pull_requests = (workflow_run.pull_requests as PullRequest[])
    .filter(
      (pull_request) =>
        pull_request.base.repo.url === workflow_run.repository.url // exclude PRs from external repositories
    )
    .map(
      (pull_request) =>
        `<${workflow_run.repository.html_url}/pull/${pull_request.number}|#${pull_request.number}> from \`${pull_request.head.ref}\` to \`${pull_request.base.ref}\``
    )
    .join(", ");

  if (pull_requests !== "") {
    status_string = `${workflow_msg} ${context.actor}'s \`pull_request\` ${pull_requests}`;
  }

  const commit_message = `Commit: ${workflow_run?.head_commit?.message}`;

  // We're using old style attachments rather than the new blocks because:
  // - Blocks don't allow colour indicators on messages
  // - Block are limited to 10 fields. >10 jobs in a workflow results in payload failure

  // Build our notification attachment
  const slack_attachment = {
    mrkdwn_in: ["text" as const],
    color: workflow_color,
    text: [status_string, details_string]
      .concat(include_commit_message ? [commit_message] : [])
      .join("\n"),
    footer: repo_url,
    footer_icon: "https://github.githubassets.com/favicon.ico",
    fields: job_fields,
    pretext: pretext_message,
  };
  // Build our notification payload
  const slack_payload_body = {
    attachments: [slack_attachment],
    ...(slack_name && { username: slack_name }),
    ...(slack_channel && { channel: slack_channel }),
    ...(slack_emoji && { icon_emoji: slack_emoji }),
    ...(slack_icon && { icon_url: slack_icon }),
  };

  const slack_webhook = new IncomingWebhook(webhook_url);

  try {
    await slack_webhook.send(slack_payload_body);
  } catch (err) {
    if (err instanceof Error) {
      core.setFailed(err.message);
    }
  }
}

function handleError(err: Error): void {
  core.error(err);
  if (err && err.message) {
    core.setFailed(err.message);
  } else {
    core.setFailed(`Unhandled Error: ${err}`);
  }
}
