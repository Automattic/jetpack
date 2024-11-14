# Git Workflow

## Branch Naming Scheme

All changes should be developed in a new branch created from the `trunk` branch.

Branches use the following naming conventions:

* `add/{something}` -- When you are adding a completely new feature
* `update/{something}` -- When you are iterating on an existing feature
* `fix/{something}` -- When you are fixing something broken in a feature
* `try/{something}` -- When you are trying out an idea and want feedback

For example, you can run: `git checkout trunk` and then `git checkout -b fix/whatsits` to create a new `fix/whatsits` branch off of `origin/trunk`.

The Jetpack repo uses the following "reserved" branch name conventions:

* `prerelease` -- Used for the release process.
* `{something}/branch-{X.Y|something}` -- Used for release branches.
* `feature/{something}` -- Used for feature branches for larger feature projects when anticipated there will be multiple PRs into that feature branch.

## Mind your commits

* [Check In Early, Check In Often](http://blog.codinghorror.com/check-in-early-check-in-often/).
* Ensure that your commit messages are [meaningful.](http://robots.thoughtbot.com/5-useful-tips-for-a-better-commit-message)

## Keeping Your Branch Up To Date

There are two ways to update your branch with changes to `trunk` or a parent PR.

1. **Merge:** After a `git fetch`, execute `git merge origin/trunk` (or `git merge origin/yourbranchname` for a parent PR) to pull in the latest changes. If there are conflicts, you'll need to resolve them by hand and then commit manually.
   * Pro: GitHub deals with this much better.
   * Pro: Collaborators can just `git pull` to update their local copy of the branch.
   * Con: Can lead to a messy-looking history while the branch is in progress. Since we use "squash and merge" to commit PRs, though, this isn't an issue once the PR is finally accepted.
   * Con: If there's a conflict while merging, you might wind up having to commit the merge commit with `--no-verify` to avoid our pre-commit hook complaining about things.
   * Note: To get a clean view of the branch's history, use `git log --first-parent`.
   * Note: To get a clean diff of the branch versus trunk, like what GitHub shows, use `git diff origin/trunk...HEAD` (note the three dots).
2. **[Rebase](https://github.com/edx/edx-platform/wiki/How-to-Rebase-a-Pull-Request):** Execute `git pull --rebase origin trunk` (or `git pull --rebase origin yourbranchname` for a parent PR), or do a `git fetch` then execute `git rebase origin/trunk` (or `git rebase origin/yourbranchname`). It will reapply each patch, and if there are conflicts at any step you'll have to resolve them by hand and then `git rebase --continue`.
   * Pro: Keeps the branch's history cleaner.
   * Con: GitHub doesn't handle it very well. It may lose inline comments on the pre-rebase commits, and it will remove the old commit entries from the conversation (making it harder to determine the state of the PR when earlier comments were left) and instead show every one in the rebase as being "added" again at the time that the rebase was pushed.
   * Con: Anyone else who has checked out your branch pre-rebase can't just `git pull`.
   * Note: When pushing the rebase to GitHub, use `git push --force-with-lease` as it's safer than the older `git push --force`.

**In general, it's best to rebase if you haven't yet created the PR, and, in particular, it's good to rebase just before doing so. After the PR has been created, it's better for collaboration to merge instead.**

If you're working on a collaborative branch, it's also a good idea to rebase your new commits on top of anyone else's new commits to the shared branch before pushing them. Once your updated branch has been pushed, rebasing will require coordination with everyone else working on the branch and thus should be avoided.

### Keeping your PR up to date as an external contributor

If you're a contributor and have forked the Jetpack repository, you may need to follow some git steps to keep your PRs up to date.

* We can usually ask you to "rebase against latest trunk" in these situations.

  1. Your PR has conflicts due to some recent changes in Jetpack trunk.
  2. We changed code in the unit tests setup or dependencies and thus we need you to update your PR so we can run automated tests on your code.

If we eventually ask you that, here are the commands that may help you achieve it.

```sh
# Add the original Jetpack repository as a remote under the name `jetpack`
# you only need to do this once
$ git remote add jetpack git@github.com:Automattic/jetpack.git

# Checkout to the branch you're working on locally
$ git checkout update/my-changes

# Ask git to bring in the changes that are currently on original Jetpack repo's trunk branch and
# put them in your local copy of the repo before your commits.
$ git fetch jetpack
$ git rebase jetpack/trunk

# Make more changes and commit OR resolve conflicts.
# Then push your changes to your forked version of Jetpack
$ git push -f origin update/my-changes
```

### Updating an external contributor's PR

If you're working directly with Jetpack trunk and need to update an external contributor's PR, the below commands will be helpful. 
This method assumes you are using the `gh` shorthand from the [Github CLI](https://cli.github.com/):

```sh
# Use the Github CLI to checkout the PR with the PR number - for example gh pr checkout 12345.
gh pr checkout xxxxx

# Run merge-base to check where that branch differed from trunk - example git merge-base update/broken-jetpack-feature trunk.
git merge-base forkedbranchname trunk

## With the SHA returned from the above command, we can rebase from that.
git rebase -i the-sha

## Rebase the current branch onto origin/trunk.
git rebase origin/trunk

## Push the updated branch to the forked branch. Note that using --force-with-lease won't work due to an existing GitHub CLI issue, but --force will)
git push --force
```

### Tips for common issues when merging

#### Dealing with lock files

It's seldom worth manually merging changes to lock files. It's usually better to regenerate the changes instead. Assuming you've just done a `git merge origin/trunk`,

* For `composer.lock`, you can do something like `git checkout origin/trunk projects/x/y/composer.lock && tools/composer-update-monorepo.sh --root-reqs projects/x/y/`.
* For `pnpm-lock.yaml`, you can do `git checkout origin/trunk pnpm-lock.yaml && pnpm install`.

For the pnpm lock file in particular, it's easy for a `git merge` or `git rebase` to do weird things resulting in a diff with unnecessary changes or outdated versions of indirect dependencies.

#### Project version updates

If the merged changes include a release of one or more projects, you may run into merge conflicts or CI complaints around project versions.
This is particularly common in `package.json` files, as the dependencies there tend to be more specific.

You should first resolve any merge conflicts as best you can. You can then run `tools/fixup-project-versions.sh` to check for and fix version update issues that CI would otherwise complain about.
