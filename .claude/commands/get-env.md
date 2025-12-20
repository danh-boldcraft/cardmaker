If we're in a linked worktree and a .env file doesn't exist, copy the .env file from the original worktree.
If the .env file does exist, ask if we want to overwrite it.
If we're not in a linked worktree, state that and take no action.