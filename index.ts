import * as core from "@actions/core";
import github from "@actions/github";

process.on("unhandledRejection", handleError);
main().catch(handleError);

async function main(): Promise<void> {
  try {
    console.log("bla 1");

    // `who-to-greet` input defined in action metadata file
    const nameToGreet = core.getInput("who-to-greet");
    console.log(`Hello ${nameToGreet}!`);
    const time = new Date().toTimeString();
    core.setOutput("time", time);
    // Get the JSON webhook payload for the event that triggered the workflow
    const payload = JSON.stringify(github.context.payload, undefined, 2);
    console.log(`The event payload: ${payload}`);
  } catch (error: any) {
    console.log("bla error ------>", error);
    console.log("bla error ------>", JSON.stringify(error));
    core.setFailed(error.message);
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
