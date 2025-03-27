const core = require('@actions/core');
const github = require('@actions/github');

async function run() {
  try {
    console.log("🔍 Starting the auto-assignment script...");

    const issue = github.context.payload.issue || github.context.payload.comment?.issue;
    if (!issue) {
      console.log("⚠️ No issue found in the payload.");
      return;
    }

    const repoOwner = github.context.repo.owner;
    const repoName = github.context.repo.repo;
    const issueNumber = issue.number;
    const assignedUsers = issue.assignees?.map(user => user.login) || [];
    const commenter = github.context.payload.comment?.user?.login;
    const comment = github.context.payload.comment?.body?.toLowerCase();

    console.log(`📌 Issue identified: #${issueNumber}`);
    console.log(`👤 User that commented: ${commenter || "None"}`);
    console.log(`💬 Comment received: "${comment || "None"}"`);
    console.log(`📝 Currently assigned users: ${assignedUsers.length > 0 ? assignedUsers.join(", ") : "None"}`);

    if (!commenter || !comment) {
      console.log("⚠️ No valid comments found. Ignoring...");
      return;
    }

    // 🚫 Ignores comments containing 🤖 (from the bot itself)
    if (comment.includes("🤖")) {
      console.log("🤖 Bot comment detected. Ignoring...");
      return;
    }
    // Check that the comment is only “no”
    if (comment.trim() === "no") {
      if (assignedUsers.length === 0) {
        console.log("⚠️ No user assigned, so nothing to do.");
        await github.rest.issues.createComment({
          owner: repoOwner,
          repo: repoName,
          issue_number: issueNumber,
          body: "🤖 No user was assigned to this issue, so no changes were made."
        });
      } else {
        console.log(`🔄 Removing attribution from @${assignedUsers[0]}...`);
        await github.rest.issues.removeAssignees({
          owner: repoOwner,
          repo: repoName,
          issue_number: issueNumber,
          assignees: assignedUsers
        });

        await github.rest.issues.createComment({
          owner: repoOwner,
          repo: repoName,
          issue_number: issueNumber,
          body: `🤖 @${assignedUsers[0]} has been removed from the issue. Now anyone can assign themselves!`
        });
      }
      return;
    }

    // List of keywords that trigger self-attribution
    const keywords = [
      "assign me",
      "i would like to work on this"
    ];

    // If the comment contains one of the auto-attribution keywords
    if (keywords.some(keyword => comment.includes(keyword))) {
      if (assignedUsers.length > 0) {
        const assignedUser = assignedUsers[0];

        if (assignedUser === commenter) {
          console.log(`⚠️ ${commenter} is already assigned.`);
          
          await github.rest.issues.createComment({
            owner: repoOwner,
            repo: repoName,
            issue_number: issueNumber,
            body: `🤖 @${assignedUser}, you are already assigned!`
          });

          return;
        }

        console.log(`❓ Asking @${assignedUser} if he is still working on the issue...`);
        await github.rest.issues.createComment({
          owner: repoOwner,
          repo: repoName,
          issue_number: issueNumber,
          body: `🤖 @${assignedUser}, are you still working on this issue? If not, @${commenter} is interested in taking it over. Answer “no” if you are no longer working on it.`
        });

        console.log("📌 Adding a pendency label...");
        await github.rest.issues.addLabels({
          owner: repoOwner,
          repo: repoName,
          issue_number: issueNumber,
          labels: [`pending-reassignment`]
        });

        return;
      }

      console.log(`🔹 Assigning issue to @${commenter}...`);
      await github.rest.issues.addAssignees({
        owner: repoOwner,
        repo: repoName,
        issue_number: issueNumber,
        assignees: [commenter]
      });

      await github.rest.issues.createComment({
        owner: repoOwner,
        repo: repoName,
        issue_number: issueNumber,
        body: `🤖 @${commenter}, you have been assigned to this issue! ☕`
      });

      console.log(`✅ Issue assigned to @${commenter}`);
    }
  } catch (error) {
    console.error("❌ Error executing the script:", error);
  }
}

run();