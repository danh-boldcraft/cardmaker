Commit all outstanding changes in the current worktree, then merge them into the parent branch by switching to the main worktree, then switch back to the original linked worktree. Steps:

1. Commit all outstanding changes in the current worktree
2. Determine the main worktree directory using `git worktree list` (first entry)
3. Get the current branch name
4. Determine the parent/target branch by checking the upstream tracking branch (`git rev-parse --abbrev-ref @{upstream}` if it exists, otherwise use `master`)
5. Save the current directory
6. cd to the main worktree directory
7. Check if the main worktree has uncommitted changes that would prevent checking out the parent branch (using `git status --porcelain`)
8. If the main worktree is clean, checkout the parent branch
9. Merge the current branch into the parent branch
10. cd back to the original linked worktree directory
11. Report the results

If the main worktree has uncommitted changes, warn the user and do not proceed with the merge.
