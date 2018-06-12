# Check out Jetpack's Source Code

Most software projects, including WordPress, use a version-control system to keep track of source code and revisions. Jetpack is available right here on [GitHub](https://github.com/). Here are the basics of downloading Jetpack using Git.

(If you're not familiar with Git and GitHub, [the GitHub Guides videos](http://www.youtube.com/user/GitHubGuides) are a great place to start.)

## Installing Git

The easiest way to get Git is to download a binary package for your operating system from [Git's website](http://git-scm.com/downloads) -- there are packages for most major operating systems, including Mac OSX, Windows, several versions of Linux, and more.

For more, check out [the documentation](http://git-scm.com/doc) on Git's website.

## Creating a GitHub account, and generating SSH keys

Jetpack's code is hosted on GitHub.com. Although you can browse the plugin code, and even download it without creating an account, you will need to sign-up if you want to contribute by reporting bugs or proposing patches.

Once you've signed up, we recommend that you generate SSH keys to establish a secure connection between your computer and GitHub. This will allow you to pull code from GitHub, and push patches without having to enter your password every single time. You can follow [this guide](https://help.github.com/articles/generating-ssh-keys) to add SSH keys to your computer and to your GitHub account.

## Checking Out the Code

Once you install Git, you'll need to check out the code before you can work on it -- that is, you'll download the code from a remote location (repository) to your computer. Here's how:

- Navigate to [Jetpack's GitHub page](https://github.com/Automattic/jetpack), and hit the "Fork" button:

![fork](https://cloud.githubusercontent.com/assets/426388/21441169/f2f809c8-c896-11e6-9531-b7854e9b2455.png)

When doing so, you make a copy of the current development version of Jetpack to your own GitHub account.
- On your computer, open your terminal and navigate to the directory where you want Jetpack to be located.
- Execute the [clone command](http://git-scm.com/docs/git-clone). For instance, to check out the copy of the Jetpack repository you've just created on GitHub:
`git clone git@github.com:YOUR_GITHUB_USERNAME/jetpack.git jetpack`

- Navigate to the `jetpack` directory: `cd jetpack`
- Add the original Jetpack repository as a new remote: it will allow you to pull changes we make to the original repository, thus keeping your local copy up to date.
`git remote add upstream git@github.com:Automattic/jetpack.git`

If it's been a while since you created that fork, you'll want to make sure you're using Jetpack's latest development version, use the [fetch and merge commands](https://help.github.com/articles/syncing-a-fork) to apply the latest Jetpack changes to your local repository, without losing any of your local changes.

```
git fetch upstream

git checkout master

git merge upstream/master
```
