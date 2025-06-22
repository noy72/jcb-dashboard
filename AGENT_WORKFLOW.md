# AI Agent Workflow

This document outlines the development workflow for AI agents working on this project.

## Task Completion Workflow

1.  **Create a Feature Branch:** For each new task, create a new feature branch from the `main` branch. The branch name should be descriptive of the task, e.g., `feature/setup-project`.

    ```bash
    git checkout -b feature/your-branch-name
    ```

2.  **Implement the Task:** Complete the task requirements on the feature branch.

3.  **Commit Changes:** Once the task is complete, commit all changes with a descriptive commit message.

    ```bash
    git add .
    git commit -m "feat: your descriptive commit message"
    ```

4.  **Merge to Main:** Switch to the `main` branch, merge the feature branch, and then delete the feature branch.

    ```bash
    git checkout main
    git merge feature/your-branch-name
    git branch -d feature/your-branch-name
    ```

5.  **Report Completion:** Use the `attempt_completion` tool to report the work done, including the branch name, commands executed, and files created or modified.