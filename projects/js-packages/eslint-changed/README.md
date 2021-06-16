# Eslint-changed

Run [eslint] on files and only report new warnings and errors.

## Installation

Install via your favorite JS package manager. Note the peer dependency on eslint.

## Usage

To identify the changes, `eslint-changed` needs the eslint output for both the old and new versions of the file, as well as the diff between them.
If you use git, it can determine this automatically. Otherwise, you can supply the necessary information manually.

Options used in both modes are:

* `--debug`: Enable debug output.
* `--ext <list>`: Comma-separated list of JavaScript file extensions. Ignored if files are listed. (default: ".js")
* `--format <name>`: Eslint format to use for output. (default: "stylish")

### Manual diff

The following options are used with manual mode:

* `--diff <file>`: A file containing the unified diff of the changes.
* `--diff-base <dir>`: Base directory the diff is relative to. Defaults to the current directory.
* `--eslint-orig <file>`: A file containing the JSON output of eslint on the unchanged files.
* `--eslint-new <file>`: A file containing the JSON output of eslint on the changed files.

### With git

In git mode, `eslint-changed` needs to be able to run `git` and `eslint`. If these are not available by those names in the shell path,
set environment variables `GIT` and/or `ESLINT` as appropriate.

The following options are used with manual mode:

* `--git`: Signify that you're using git mode.
* `--git-staged`: Compare the staged version to the HEAD version (this is the default).
* `--git-unstaged`: Compare the working copy version to the staged (or HEAD) version.
* `--git-base <ref>`: Compare the HEAD version to the HEAD of a different base (e.g. branch).

## Inspiration

We had been using [phpcs-changed] for a while, and wanted the same thing for eslint.


[eslint]: https://www.npmjs.com/package/eslint
[phpcs-changed]: https://packagist.org/packages/sirbrillig/phpcs-changed
