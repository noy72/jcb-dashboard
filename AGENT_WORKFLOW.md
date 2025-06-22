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

## Debugging and Testing Workflow

When implementing tasks that involve testing, follow this workflow:

1.  **Execute Tests in Non-Watch Mode:** When running tests, use commands that execute the tests once and then exit, rather than running in watch mode. This provides a clear, final result for each test run.
    *   For `vitest`, use `npx vitest run`.

2.  **Use Debug Logs for Failures:** If a test fails, add temporary debug logs (e.g., `console.log`) to the relevant code sections to inspect the state and data flow.

3.  **Iterate Until Success:** Rerun the tests with the debug logs to analyze the output and identify the root cause of the failure. Repeat the process of modifying the code and re-running tests until all tests pass.

4.  **Remove Debug Logs:** Once all tests are passing and the feature is confirmed to be working correctly, remove all temporary debug logs before finalizing the task.