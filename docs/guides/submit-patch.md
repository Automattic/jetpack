# Creating and Submitting Patches

## Bug Zapping

If you're fixing a bug, [start by forking Jetpack's repository](get-started-with-git.md) and clone that new fork of Jetpack to your computer. Once you're done, [create a new branch following our guidelines](/docs/git-workflow.md). Then, checkout that branch.

```
git branch branch-name

git checkout branch-name
```

You can then edit files and commit your changes as you go.

- To get a list of files you've changed, use the [status command](http://git-scm.com/docs/git-status): `git status`
- To show the changes you've made in a line-by-line patch format, use the [diff command](http://git-scm.com/docs/git-diff) to output a [unified diff](http://www.gnu.org/software/diffutils/manual/html_node/Detailed-Unified.html#Detailed%20Unified) of all the changes you made to the source code: `git diff`
- To show the differences in a single file, use the diff command (or include multiple file paths to show differences between a set of pages): `git diff path/to/file`

## Create a Pull Request

To share the changes you've made, you'll need to push your changes to your repository on GitHub, and [submit a pull request](/docs/pull-request.md).

1. Start by committing the changes you've made to your local repository. To do so, you'll need to add the files you've changed to the staging area first: `git add .`
2. Then, commit your changes: `git commit`
You'll want to keep the first line of your commit message brief, giving a quick explanation of your changes. You can then give more details in the following lines.
3. Now that you've committed your changes, they're ready to be pushed to your fork on Github, like so: `git push origin branch-name`
4.  The last step is to create a Pull Request to let us know about your changes. GitHub will prompt you to create this Pull Request when you access your fork:

![pull-request](https://cloud.githubusercontent.com/assets/426388/21441595/2494b560-c899-11e6-8438-92130bfc399b.png)

5. Click on "Compare &amp; Pull Request" to create the Pull request.
6. When creating that Pull Request, be sure to [follow our guidelines here.](/docs/pull-request.md)
