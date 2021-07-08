# jetpack CLI

The `jetpack` CLI tool is used to help with development in [the Jetpack monorepo].

## Installation

If you normally use just one Jetpack Monorepo checkout, you can add `jetpack` to your path by running
```sh
pnpm install
pnpm cli-setup
```
from the monorepo root.

You can also use `pnpx --no jetpack` from (almost) anywhere in the monorepo. If you commonly use multiple checkouts, you might add this as a shell alias or a stub script in your path so as to always run the current checkout's instance.

## Usage

To get a full list of available commands, you can run `jetpack help`.

You run a command by using `jetpack [command] [arguments]`. Every command supports a verbose flag, `-v`, that you can use to the see the output of the tool for troubleshooting, and you can use the help flag with any command to see more info.

**Linking and Unlinking the CLI**

The CLI commands can be run from anywhere, and the changes will be made in whichever directory it’s symlinked to. To change the directory that you want the CLI to run commands in, you can first run jetpack cli unlink, then change into the directory you want and run pnpm cli-setup again.

## Examples

**Build**: Build a project in the monorepo.

This command lets you build a project in the monorepo by selecting a project from a list, or providing one as an argument.

- Build the Jetpack plugin: `jetpack build plugins/jetpack`
- Build the production version of Jetpack: `jetpack build plugins/jetpack -p`

**Changelog**: Manage changelog files for a project.

This command lets you manage changelog files for a specific project. Each argument accepts an optional [project] parameter in the form of `project-type/project`, otherwise defaults to letting you choose a project from a list.

- Add a changelog file to a the Jetpack plugin: `jetpack changelog add plugins/jetpack`
- Return a project version: `jetpack changelog version projects/plugins current`

[the Jetpack monorepo]: https://github.com/Automattic/jetpack
