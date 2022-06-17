# ESLint Changed

Run [ESLint] on files and only report new warnings and errors.

## Installation

Install via your favorite JS package manager. Note the peer dependency on eslint.

For example,
```
npm install eslint-changed eslint
```

## Usage

To identify the changes, `eslint-changed` needs the ESLint output for both the old and new versions of the file, as well as the diff between them.
If you use git, it can determine this automatically. Otherwise, you can supply the necessary information manually.

Options used in both modes are:

* `--debug`: Enable debug output.
* `--ext <list>`: Comma-separated list of JavaScript file extensions. Ignored if files are listed. (default: ".js")
* `--format <name>`: ESLint format to use for output. (default: "stylish")
* `--in-diff-only`: Only include messages on lines changed in the diff. This may miss things like deleting a `var` that leads to a new `no-undef` elsewhere.

### Manual diff

The following options are used with manual mode:

* `--diff <file>`: A file containing the unified diff of the changes.
* `--diff-base <dir>`: Base directory the diff is relative to. Defaults to the current directory.
* `--eslint-orig <file>`: A file containing the JSON output of eslint on the unchanged files.
* `--eslint-new <file>`: A file containing the JSON output of eslint on the changed files.

### With git

In git mode, `eslint-changed` needs to be able to run `git`. If this is not available by that name in the shell path,
set environment variable `GIT` as appropriate.

The following options are used with manual mode:

* `--git`: Signify that you're using git mode.
* `--git-staged`: Compare the staged version to the HEAD version (this is the default).
* `--git-unstaged`: Compare the working copy version to the staged (or HEAD) version.
* `--git-base <ref>`: Compare the HEAD version to the HEAD of a different base (e.g. branch).

## Examples

This will compare the staged changes with HEAD.
```bash
npx eslint-changed --git
```

This will compare HEAD with origin/trunk.
```bash
npx eslint-changed --git --git-base origin/trunk
```

This does much the same as the previous example, but manually. If you're using something other than git, you might do something like this.
```bash
# Produce a diff.
git diff origin/trunk...HEAD > /tmp/diff

# Check out the merge-base of origin/trunk and HEAD.
git checkout origin/trunk...HEAD

# Run ESLint.
npx eslint --format=json . > /tmp/eslint.orig.json

# Go back to HEAD.
git checkout -

# Run ESLint again.
npx eslint --format=json . > /tmp/eslint.new.json

# Run eslint-changed.
npx eslint-changed --diff /tmp/diff --eslint-orig /tmp/eslint.orig.json --eslint=new /tmp/eslint.new.json
```
Note that, to be exactly the same as the above, you'd want to extract the list of files from the diff instead of linting everything. But this will work.

## Inspiration

We had been using [phpcs-changed] for a while, and wanted the same thing for ESLint.


[ESLint]: https://www.npmjs.com/package/eslint
[phpcs-changed]: https://packagist.org/packages/sirbrillig/phpcs-changed
