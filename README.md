# Slack Workflow Status

This action will post workflow status notifications into your Slack channel

## Action Inputs

| Name                       | Required | Description |
|----------------------------| -------- | ----------- |
| **slack_webhook_url**      | _required_ | Create a Slack Webhook URL using the [Incoming Webhooks App](https://slack.com/apps/A0F7XDUAZ-incoming-webhooks?next_id=0). It is recommended that you create a new secret on your repo `SLACK_WEBHOOK_URL` for holding this value, and passing it to the action with `${{secrets.SLACK_WEBHOOK_URL}}`.
| **repo_token**             | _required_ | A token is automatically available in your workflow secrets var. `${{secrets.GITHUB_TOKEN}}`. You can optionally send an alternative self-generated token.
| **include_jobs**           | _optional_ | When set to `true`, include individual job status and durations in the slack notification. When `false` only the event status and workflow status lines are included. When set to `on-failure` — individual job status is reported only if workflow failed. Default is `true`.
| **jobs_to_fetch**          | _optional_ | Sets the number of jobs to fetch (for workflows with big number of jobs). Default is 30.
| **include_commit_message** | _optional_ | When set to `true`, include the workflow head commit message title in the slack notification. Default is `false`.
| **channel**                | _optional_ | Accepts a Slack channel name where you would like the notifications to appear. Overrides the default channel created with your webhook.
| **name**                   | _optional_ | Allows you to provide a name for the slack bot user posting the notifications. Overrides the default name created with your webhook.
| **icon_emoji**             | _optional_ | Allows you to provide an emoji as the slack bot user image when posting notifications. Overrides the default image created with your webhook. _[Emoji Code Cheat Sheet](https://www.webfx.com/tools/emoji-cheat-sheet/)_
| **icon_url**               | _optional_ | Allows you to provide a URL for an image to use as the slack bot user image when posting notifications. Overrides the default image created with your webhook.
| **pretext**                | _optional_ | Optional pre-text that appears above the attachment block.
| **names_of_jobs_to_fetch** | _optional_ | when to display specific jobs, format - `job_name1,job_name2`
| **mention_users_on_fail** | _optional_ | List of users to mention in case of failure, format - `userId1,userId2`

## Example usage

```yaml
- name: notify
  id: slack
  uses: biboukat/slack-notification@v1.11
  with:
    channel: "#git-action-test"
    repo_token: ${{secrets.GITHUB_TOKEN}}
    slack_webhook_url: ${{secrets.SLACK_WEBHOOK_URL}}
```

_copypasted from: [Gamesight/slack-workflow-status](https://github.com/Gamesight/slack-workflow-status/tree/master)_

added new properties: pretext, names_of_jobs_to_fetch, mention_users_on_fail
