# AI-Assisted PR Workflow

This document describes the improved workflow for handling PR feedback with AI assistance.

## Quick Commands

Instead of copying and pasting PR feedback, use these simple commands:

### 1. Review and Apply PR Feedback

```text
"Check PR #30 feedback and make the changes"
"Apply Copilot's suggestions from PR #30"
"Fix issues in PR #30"
```

### 2. Create Feature Branch from PR Feedback

```text
"Create a new branch to address PR #30 feedback"
"Start working on PR #30 fixes in a new branch"
```

### 3. Check Multiple PRs

```text
"Check all open PRs for feedback"
"Show me PRs that need attention"
```

## What the AI Assistant Can Do

1. **View PR Details**: Using `gh pr view [number]`
2. **Read Comments**: Using `gh pr view [number] --comments`
3. **Check Review Status**: Using `gh pr reviews [number]`
4. **List All PRs**: Using `gh pr list`
5. **Create Branches**: Using `git checkout -b [branch-name]`
6. **Make Changes**: Edit files based on feedback
7. **Run Tests**: Execute `npm run check`
8. **Prepare for Commit**: Stage changes and show status

## Recommended Workflow

The best practice is to work directly on the existing PR branch rather than creating new branches. Here's the recommended workflow:

1. **You**: "Apply Copilot feedback from PR #30"
2. **AI will automatically**:
   - Check which branch the PR is from
   - Switch to that branch
   - Apply all changes based on the feedback
   - Run tests to ensure everything works
   - Show you a summary of all changes made
   - Stage the changes for your review
   - Check if there's any other feedback on the PR we missed
   - **Provide a recommended commit message** (under 50 chars, conventional format)
3. **You**: Decide whether to commit and push

## Example Commands

```text
"Apply Copilot feedback from PR #30"
"Show me what changed"
"Looks good, stage the changes"
"Commit with message: address copilot feedback"
```

## Detailed Example

1. You: "Apply Copilot feedback from PR #30"
2. AI will:

   ```bash
   # Check PR details and find the branch
   gh pr view 30 --json headRefName
   
   # Switch to the PR branch
   git checkout update-deps
   
   # Apply all suggested changes
   # (automated based on feedback)
   
   # Run tests
   npm run check
   
   # Show summary of changes
   git status
   git diff --stat
   
   # Stage changes for review
   git add -A
   
   # Show detailed diff
   git diff --staged
   
   # Check for any missed feedback
   gh pr view 30 --comments
   ```

3. AI will provide a recommended commit message following conventional commits
4. You: Decide to use the suggestion or write your own

## Commit Message Standards

This project follows [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) with these guidelines:

### Format
```text
<type>: <description>

[optional body]
```

### Rules
- **Keep the first line under 50 characters**
- Use present tense ("add" not "added")
- Don't capitalize first letter after colon
- No period at the end

### Common Types
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation only
- `style:` - Formatting, semicolons, etc.
- `refactor:` - Code restructuring
- `test:` - Adding tests
- `chore:` - Maintenance, deps update

### Examples
```text
"fix: address copilot pr feedback"
"feat: add timeout validation"
"test: improve disposable domain coverage"
"chore: update dev dependencies"
"docs: add ai workflow guide"
```

## Benefits

- **No Copy/Paste**: Direct access to GitHub PR data
- **Automated**: Changes are made automatically
- **Tested**: All changes are validated before commit
- **Efficient**: Single command instead of multiple manual steps

## Advanced Usage

### View Specific PR Review Comments

```text
"Show me what Copilot said about the timeout validation in PR #30"
```

### Check CI Status

```text
"Check if PR #30 is passing CI"
```

### Compare Changes

```text
"Show me what changed between main and PR #30"
```

## Tips

1. Always mention the PR number
2. Be specific about what you want (e.g., "apply security fixes from PR #30")
3. Ask for a summary if you want to review changes before applying
4. Request a dry run if you want to see what would be changed

## GitHub CLI Commands Available

- `gh pr list` - List PRs
- `gh pr view` - View PR details
- `gh pr checkout` - Check out a PR locally
- `gh pr review` - View PR reviews
- `gh pr comment` - Add comments
- `gh pr checks` - View CI status
- `gh issue list` - List issues
- `gh workflow run` - Trigger workflows
