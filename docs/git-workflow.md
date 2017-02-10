# Git Workflow

## Familiar with Git?

If you're not familiar with Git, you can [follow these detailed steps to find out how to submit your first patch.](guides/submit-patch.md)

## Branch Naming Scheme

All changes should be developed in a new branch created from the `master` branch.

Branches use the following naming conventions:

* `add/{something}` -- When you are adding a completely new feature
* `update/{something}` -- When you are iterating on an existing feature
* `fix/{something}` -- When you are fixing something broken in a feature
* `try/{something}` -- When you are trying out an idea and want feedback

For example, you can run: `git checkout master` and then `git checkout -b fix/whatsits` to create a new `fix/whatsits` branch off of `origin/master`.

## Mind your commits

- [Check In Early, Check In Often](http://blog.codinghorror.com/check-in-early-check-in-often/).
- Ensure that your commit messages are [meaningful.](http://robots.thoughtbot.com/5-useful-tips-for-a-better-commit-message)

## Keeping Your Branch Up To Date

While it is tempting to merge from `master` into your branch frequently, this leads to a messy history because each merge creates a merge commit. When working by yourself, it is best to use `git pull --rebase master`, but if you're pushing to a shared repo, it is best to not do any merging or rebasing until the feature is ready for final testing, and then do a [rebase](https://github.com/edx/edx-platform/wiki/How-to-Rebase-a-Pull-Request) at the very end. This is one reason why it is important to open pull requests whenever you have working code.

If you have a Pull Request branch that cannot be merged into `master` due to a conflict (this can happen for long-running Pull Request discussions), it's still best to rebase the branch (rather than merge) and resolve any conflicts on your local copy before updating the Pull Request with `git push --force`. **Be aware** that this will **replace** any commits currently in your shared branch, so anyone who is also using that branch will be in trouble. Only use `git push --force` if the Pull Request is ready to merge and no one else is using it (or of you have coordinated the force-push with the other developers working on the branch).
