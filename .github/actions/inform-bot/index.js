const core = require('@actions/core');
const github = require('@actions/github');

async function run() {
  try {
    console.log("🔍 Posting instructions on the issue...");

    const issue = github.context.payload.issue;
    if (!issue) {
      console.log("⚠️ No issue found in the payload.");
      return;
    }

    const repoOwner = github.context.repo.owner;
    const repoName = github.context.repo.repo;
    const issueNumber = issue.number;

    console.log(`📌 Issue identified: #${issueNumber}`);

    const instructions = `🤖 To be assigned to this issue, comment with one of the following phrases:
    - "Assign me"
    - "I would like to work on this"
    If the issue is already assigned, the assigned user will be asked if they are still working on it.`;

    await github.rest.issues.createComment({
      owner: repoOwner,
      repo: repoName,
      issue_number: issueNumber,
      body: instructions
    });

    console.log("✅ Instructions posted when the issue was created.");
  } catch (error) {
    console.error("❌ Error posting instructions:", error);
  }
}

run();