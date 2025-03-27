#!/bin/bash

set -e

echo "Checking PR description for linked issues..."

# Extract the issue number using a more reliable method
ISSUE_NUMBER=$(echo "$PR_BODY" | grep -oE 'Closes #([0-9]+)|Fixes #([0-9]+)' | grep -oE '[0-9]+')

if [ -n "$ISSUE_NUMBER" ]; then
  echo "Closing issue #$ISSUE_NUMBER"
  curl -X PATCH \
    -H "Authorization: token $GITHUB_TOKEN" \
    -H "Accept: application/vnd.github+json" \
    https://api.github.com/repos/$REPO/issues/$ISSUE_NUMBER \
    -d '{"state":"closed"}'

  echo "Adding comment to issue #$ISSUE_NUMBER"
  COMMENT_BODY="The issue has been successfully closed as the related PR has been merged."
  curl -X POST \
    -H "Authorization: token $GITHUB_TOKEN" \
    -H "Accept: application/vnd.github+json" \
    https://api.github.com/repos/$REPO/issues/$ISSUE_NUMBER/comments \
    -d "{\"body\": \"$COMMENT_BODY\"}"
else
  echo "No linked issue found in PR description. Commenting on PR."
  COMMENT_BODY="@${{ github.actor }} Please ensure this PR references an issue using 'Closes #ISSUE_NUMBER' or 'Fixes #ISSUE_NUMBER'."
  curl -X POST \
    -H "Authorization: token $GITHUB_TOKEN" \
    -H "Accept: application/vnd.github+json" \
    https://api.github.com/repos/$REPO/issues/$PR_NUMBER/comments \
    -d "{\"body\": \"$COMMENT_BODY\"}"
fi
echo "Process completed."