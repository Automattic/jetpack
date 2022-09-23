# jetpack CLI

The `jetpack` CLI tool is used to help with development in [the Jetpack monorepo].

## Installation

If you normally use just one Jetpack Monorepo checkout, you can add `jetpack` to your path by running
```sh
pnpm install
pnpm jetpack cli link
```
from the monorepo root.

You can also use `pnpm jetpack` from (almost) anywhere in the monorepo. If you commonly use multiple checkouts, you might add this as a shell alias or a stub script in your path so as to always run the current checkout's instance.

## Usage

To get a full list of available commands, you can run `jetpack help`.

You run a command by using `jetpack [command] [arguments]`. Every command supports a verbose flag, `-v`, that you can use to the see the output of the tool for troubleshooting, and you can use the help flag with any command to see more info.

**Linking and Unlinking the CLI**

The CLI commands can be run from anywhere, and the changes will be made in whichever directory it’s symlinked to. To change the directory that you want the CLI to run commands in, you can first run `jetpack cli unlink`, then change into the directory you want and run `pnpm jetpack cli link` again.

## Available Commands

* `build` - Build a project in the monorepo.
* `changelog` -  Manage changelog files for a project.
* `clean` - Clean unwanted files in the monorepo.
* `cli` - Manage global symlink for the CLI.
* `completion` - Generate bash/zsh completions
* `docker` - Manage docker containers.
* `generate` - Create a new project in the monorepo.
* `install` - Install project dependencies.
* `watch` - Watch a specific project.
* `rsync` - rsync projects/plugins to external destinations.

## Examples

**Build**: Build a project in the monorepo.

This command lets you build a project in the monorepo by selecting a project from a list, or providing one as an argument.

- Build the Jetpack plugin: `jetpack build plugins/jetpack`

**Changelog**: Manage changelog files for a project.

This command lets you manage changelog files for a specific project. Each argument accepts an optional [project] parameter in the form of `project-type/project`, otherwise defaults to letting you choose a project from a list.

- Add a changelog file to a the Jetpack plugin: `jetpack changelog add plugins/jetpack`
- Return a project version: `jetpack changelog version projects/plugins current`

**Clean**: Clean unwanted files in the monorepo.

This command lets you clean the monorepo of unneeded files. As this action is destructive, the command runs a dry run that displays a list of files to be cleaned first before asking for final confirmation and cleaning.

- Clean untracked files in a specific project: `jetpack clean plugins/jetpack untracked`
- Clean all package manager directories for the entire monorepo: `jetpack clean --dist`

**Docker**: Manage docker containers.

Let’s you manage docker containers directly from the CLI.

There are a lot of docker commands that you can pass to `jetpack docker`. You can view [comprehensive docker documentation here](https://github.com/Automattic/jetpack/blob/trunk/tools/docker/README.md), or see a full list of commands by running jetpack docker --help.

- Start a docker container in detached mode: `jetpack docker up -d`
- Start a second docker container for e2e tests on port 8888: `jetpack docker --type e2e --name test1 --port 8888 up`
- Install WordPress for the default dev container: `jetpack docker install`
- Spin down the default dev container: `jetpack docker down`

**Generate**: Create a new project in the monorepo.

Lets you create a new project in the monorepo. Running the command with no arguments will walk you through the project creation process, or you can specify the project type and name as arguments.

- Create a new plugin called test: `jetpack generate plugin --name test`

**Install**: Install project dependencies.

- Install dependencies for the Jetpack plugin project: `jetpack install projects/plugins`
- Installs dependencies for all projects in the monorepo: `jetpack install --all`

Lets you install project dependencies by selecting a project from a list, or providing one as an argument.

**Watch**: Watch a specific project.

Watch a monorepo project, which will rebuild the project as changes are made so you don’t need to keep building.

- Watch the Jetpack plugin: `jetpack watch plugins/jetpack`

**Rsync**: rsync projects/plugins to external destinations.

Maybe you'd prefer to develop against a live site instead of Docker. Or maybe you want to quickly push the plugin you're building to a live JN site without waiting for the builds. This rsync wrapper knows which files to send and not send. 

- Rsync the Jetpack plugin to server destination and watch for changes: `jetpack rsync --plugin jetpack --dest user@your.server.example.com:/home/path/to/wp-content/plugins --watch`

[the Jetpack monorepo]: https://github.com/Automattic/jetpack

**Draft**: Enable or disable "draft mode" for the repo.

This is an experimental feature as of August 2021.

Sometimes you're doing a lot of collaborative refactoring or working on a draft PR and you want to share your changes without passing all the pre-commit and pre-push checks. However, of course you still want to enable the more serious checks when you need them!

For this situation, we have Draft Mode.

To enable:

```
$ jetpack draft enable
```

To disable:

```
$ jetpack draft disable
```

Currently, this has the following effects on pre-commit:

* raise the number of allowable warnings in eslint and eslint-changed to 100
* don't bail if phpcs fails
* don't bail if phplinter fails
* don't bail if renovate changes are missing

And the following effects on pre-push:

* don't bail if changelog files are missing

You will still see all the output from these various commands, it's just that fewer of them will block the commit or push from succeeding.

In addition, when you run `jetpack draft disable`, it will offer to run the pre-commit checks for you right away so you can start fixing errors.
