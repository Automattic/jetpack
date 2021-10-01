# Jetpack Monorepo Overview

Welcome to the Jetpack Monorepo! This document will give you some idea of the layout, and what is required for your project to fit in with our tooling.

## Table of contents

- [Layout](#layout)
- [Compatibility](#compatibility)
- [First Time](#first-time)
- [Jetpack Generate Wizard](#jetpack-generate-wizard)
- [Project Structure](#project-structure)
- [Testing](#testing)
- [Mirror Repositories](#mirror-repositories)
- [Plugin Release Tooling](#plugin-release-tooling)
- [Jetpack Changelogger](#jetpack-changelogger)
	- [Using the Jetpack Changelogger](#using-the-jetpack-changelogger)
- [New Projects](#new-projects)
	- [Creating a new Composer Package](#creating-a-new-composer-package)
	- [Creating a new plugin](#creating-a-new-plugin)

## Layout

Projects are divided into WordPress plugins, Composer packages, JS packages, and Gutenberg editor extensions.

* WordPress plugins live in subdirectories of `projects/plugins/`. The directory name should probably match the WordPress plugin name, with a leading "jetpack-" removed if applicable.
* Composer packages live in subdirectories of `projects/packages/`. The directory name should probably match the package name with the leading "Automattic/jetpack-" removed.
* JS packages live in subdirectories of `projects/js-packages/`. The directory name should probably match the package name with the leading "Automattic/jetpack-" removed.
* Editor extensions live in subdirectories of `projects/editor-extensions/`. The directory name should match the feature name (without a "jetpack/" prefix).
* GitHub Actions live in subdirectories of `projects/github-actions/`. The directory name should match the action name with the leading "Automattic/action-" removed.

Tooling that's applicable to the monorepo as a whole, including tooling for generically handling projects, lives in `tools/`.

WordPress, being a part of the Docker environment, gets installed into the directory `tools/docker/wordpress`, with non-monorepo plugins stored in `tools/docker/wordpress/wp-content/plugins`.

Documentation that's applicable to the monorepo as a whole lives in `docs/`.

All GitHub Actions configuration for the monorepo, including CI, lives in `.github`. We should strive to make things here generic rather than specifc to any one project.

* Actual actions live in `.github/actions/`. If it doesn't have an `action.yml` file, it shouldn't be in there.
* Pattern matchers (not associated with an action) go in `.github/matchers/`.
* Other files specific to actions, including scripts used with `run:`, go in `.github/files/`.

## Compatibility

All projects should be compatible with PHP versions WordPress supports. That's currently PHP 5.6 to 8.0.

## First Time

First time working with the monorepo? We got you covered.

For the first time only:

* From the root of the repo, run `pnpm cli-setup` (if you want the `jetpack` CLI tool installed globally) or `pnpm install` (if you don't).
* That’s it. You won’t need to do that again unless you nuke your node_modules directory.

Once you’ve done that, it’s easy: run `jetpack` (or `pnpx jetpack`) while anywhere in the Jetpack repo. To explore on your own, run `jetpack --help` to see the available commands.

## Jetpack Generate Wizard

Starting a new project? Great! Let the Jetpack Generate Wizard help jumpstart the files you need. To get started:

* Make sure you're checked out to the branch you want.
* Use the CLI command `jetpack generate` to start the process.
* The wizard will walk you through the steps of starting a new package, plugin, or Github action.

### Accepted Arguments

The wizard accepts a few arguments to speed things up:

* `[project type]` - Accepted values: `package`, `plugin`, `github-action`
* `--name`, `--n` - The name of your project (no spaces)

Example: `jetpack generate plugin --name my_cool_plugin` will generate plugin files for a plugin called `my_cool_plugin` under `../jetpack/projects/plugins`

### What's Included

The Jetpack Generate Wizard includes the following for each project: 
#### All Projects:

- composer.json
- package.json
- readme.md
- license.txt
- .gitignore
#### Packages

- bootstrap.php
- .gitkeep
- .gitattributes
- phpunit.xml.dist
#### Plugins

- bootstrap.php
- .gitkeep
- .gitattributes
- phpunit.xml.dist
- readme.txt
- A main plugin.php (plugin_name.php), with filled in header

#### Github Actions

- action.yml

### Next Steps

* The wizard should auto-generate common information
* Check things over to make sure it looks correct
* If your project requires a build step, add steps to `composer.json` and `package.json`
* Create a mirror repo if necessary. See [Mirror repositories](#mirror-repositories).

## Project structure

We use `composer.json` to hold metadata about projects. Much of our generic tooling reads this metadata to customize handling of the project. Metadata keys used are:

* `.name`: Generally "Automattic/jetpack-_something_". Used to report names in various places. For Composer packages, this must, of course, match the name on Packagist.
* `.version`: If present, updated by `tools/project-version.sh`. This should not be included on Composer packages that will be served through Packagist.
* `.repositories`: If you include a repository entry referencing monorepo packages, it must have `.options.monorepo` set to true. This allows the build tooling to recognize and remove it.
* `.scripts.build-development`: If your project has a general build step, this must run the necessary commands. This command or build-production below are required for projects requiring a build step.
* `.scripts.build-production`: If your project requires a production-specific build step, this must run the necessary commands. This command or build-development above are required for projects requiring a build step.
* `.scripts.test-coverage`: If the package contains any tests, this must run the necessary commands to generate a coverage report. See [Code coverage](#code-coverage) for details.
* `.scripts.test-e2e`: If the package contains any E2E tests, this must run the necessary commands. See [E2E tests](#e2e-tests) for details.
* `.scripts.test-js`: If the package contains any JavaScript tests, this must run the necessary commands. See [JavaScript tests](#javascript-tests) for details.
* `.scripts.test-php`: If the package contains any PHPUnit tests, this must run the necessary commands. See [PHP tests](#php-tests) for details.
* `.extra.autotagger`: Set truthy to enable automatic release-version tagging in the mirror repo. See [Mirror repositories > Autotagger](#autotagger) for details.
* `.extra.changelogger`: Configuration object for [Changelogger](#jetpack-changelogger). See [its documentation](https://github.com/Automattic/jetpack-changelogger#configuration) for details.
* `.extra.changelogger-default-type`: Certain of our tools automatically create Changelogger change entries. This is the value to use for `--type` when doing so. Default type is `changed`.
* `.extra.dependencies`: This optional array specifies the "slugs" of any within-monorepo dependencies that can't otherwise be inferred. The "slug" consists of the two levels of directory under `projects/`, e.g. `plugins/jetpack` or `packages/lazy-images`. See [Testing](#testing) for details.
* `.extra.mirror-repo`: This specifies the name of the GitHub mirror repo, i.e. the "Automattic/jetpack-_something_" in "<span>https://</span>github.com/Automattic/jetpack-_something_".
* `.extra.npmjs-autopublish`: Set truthy to enable automatic publishing of tagged versions to npmjs.com. See [Mirror repositories > Npmjs Auto-publisher](#npmjs-auto-publisher) for details.
* `.extra.release-branch-prefix`: Our mirroring and release tooling considers any branch named like "_prefix_/branch-_version_" to be a release branch, and this specifies which _prefix_ belongs to the project.
* `.extra.version-constants`: When `tools/project-version.sh` is checking or updating versions, this specifies PHP constants to check or update. The value is an object matching constants to the file (relative to the package root) in which the constant is defined.
  * Note that constant definitions must be on a single line and use single quotes to be detected by the script. Like this:
    ```php
    define( 'CONSTANT', 'version' );
    ```
  * Class constants may be specified by prefixing the constant name with "::", e.g. `::CONSTANT`. In that case the definition must look like this:
    ```php
    const CONSTANT = 'version';
    ```
* `.extra.wp-plugin-slug`: This specifies the WordPress.org plugin slug, for use by scripts that deploy the plugin to WordPress.org.
  * `.extra.beta-plugin-slug`: This specifies the plugin slug for the Jetpack Beta Tester plugin, for cases where a plugin has not been published to WordPress.org but should still be offered by that plugin.

Our mirroring tooling also uses `.gitattributes` to specify built files to include in the mirror and unnecessary files to exclude.

## Testing

The Jetpack Monorepo includes GitHub actions to run a number of CI checks on all projects.

Tests for a project are only run for a PR if changes are made to the project or its dependencies. Dependencies may be specified as:

* For Composer packages included in the monorepo, via `.require` and `.require-dev` in `composer.json`.
* For any other dependencies, via `.extra.dependencies` in `composer.json`.

The test environment will be set up with appropriate tools, including node, pnpm, php, phpdbg, and composer. Unless otherwise specified below, the versions of node and php will be those specified in `.github/versions.sh`. Other necessary tools may be pulled in via composer and pnpm.

All test commands must return a shell failure status when tests fail and a success status if tests pass or are skipped; usually your testing framework will already do this for you, but if you write custom shell scripts you'll need to make sure any failure is propagated.

If your project has multiple logical groups of tests, feel free to make use of GitHub Actions's [grouping commands](https://docs.github.com/en/actions/reference/workflow-commands-for-github-actions#grouping-log-lines).

The following environment variables are avaliable for all tests:

- `ARTIFACTS_DIR`: If your tests generate any artifacts that might be useful for debugging, you may place them in the directory specified by this variable and they will be uploaded to GitHub after the test run. There's no need to be concerned about collisions with other projects' artifacts, a separate directory is used per project.
- `MONOREPO_BASE`: Path to the monorepo. Useful if you're using things in `tools/` from plugin tests.
- `NODE_VERSION`: The version of Node in use, as specified in `.github/versions.sh`.
- `PHP_VERSION`: The version of PHP in use. Unless otherwise specified below, it will be the same as in `.github/versions.sh`.
- `TEST_SCRIPT`: The test script being run.

### Linting

We use eslint and phpcs to lint JavaScript and PHP code. Projects should comply with the [coding standards](development-environment.md#coding-standards) enforced by these tools.

* Projects may include `.eslintrc.js` to adjust eslint configuration as necessary, but try to keep to the spirit of it.
* As eslint does not support per-directory `.eslintignore`, any necessary ignore rules should be added to the file in the root of the monorepo.
* As phpcs does not support per-directory configuration, any necessary file ignore clauses should be added to `.phpcs.config.xml` in the root of the monorepo.

### PHP tests

If a project contains PHP tests (typically PHPUnit), it must define `.scripts.test-php` in `composer.json` to run the tests. If a build step is required before running tests, the necessary commands for that should also be included.

A MySQL database is available if needed; credentials may be found in `~/.my.cnf`. Note that the host must be specified as `127.0.0.1`, as when passed `localhost` PHP will try to connect via a Unix domain socket which is not available in the Actions environment.

Tests are run with a variety of supported PHP versions from 5.6 to 8.0. If you have tests that only need to be run once, run them when `PHP_VERSION` matches that in `.github/versions.sh`.

#### PHP tests for non-plugins

For all project types other than WordPress plugins, the necessary version of PHPUnit and/or any other tools should be pulled in via Composer.

We currently make use of the following packages in testing; it's encouraged to use these rather than introducing other tools that serve the same purpose.

* [yoast/phpunit-polyfills](https://packagist.org/packages/yoast/phpunit-polyfills) supplies polyfills for compatibility with PHPUnit 5.7 to 9.0, to support PHP 5.6 to 8.0.
  * Do not use `Yoast\PHPUnitPolyfills\TestCases\TestCase` or `Yoast\PHPUnitPolyfills\TestCases\XTestCase`. Just use the `@before`, `@after`, `@beforeClass`, and `@afterClass` annotations directly.
* PHPUnit's built-in mocking is used for class mocks.
* [brain/monkey](https://packagist.org/packages/brain/monkey) is used for mocking functions, and can also provide some functions for minimal WordPress compatibility.
* [automattic/wordbless](https://packagist.org/packages/automattic/wordbless) is used to pull in WordPress for testing.
  * If using both Brain Monkey and WorDBless, note the following requirements:
    * You must `require_once __DIR__ . '/../../vendor/antecedent/patchwork/Patchwork.php';` in `bootstrap.php` before WorDBless's setup, so Brain Monkey can mock WordPress functions.
    * Follow Brain Monkey's [functions-setup.md](https://github.com/Brain-WP/BrainMonkey/blob/master/docs/functions-testing-tools/functions-setup.md) instead of [wordpress-setup.md](https://github.com/Brain-WP/BrainMonkey/blob/master/docs/wordpress-specific-tools/wordpress-setup.md); don't call `Monkey\setUp()` or try to use its WordPress-specific tools.

#### PHP tests for plugins

WordPress plugins generally want to run within WordPress. All monorepo plugins are copied into place in a WordPress installation and tests are run from there.

Tests will be run against the latest version of WordPress using the variety of supported PHP versions, and against the previous and master versions of WordPress using the PHP version in `.github/versions.sh`. The environment variable `WP_BRANCH` will be set to 'latest', 'previous', or 'master' accordingly. If you have tests that only need to be run once, run them when `WP_BRANCH` is 'latest'.

<!-- @todo: Update this once we drop support for WP 5.8. -->
Note that the state of WordPress's own PHPUnit integration is currently in flux. For WordPress 5.8 and earlier you need to both use `yoast/phpunit-polyfills` to supply polyfills and need to run with PHPUnit < 8.0 (even on PHP 8, where monkey-patching is required), while for 5.9 you can use `yoast/phpunit-polyfills` normally. Your best bet for the moment is to copy what Jetpack is doing; once the situation has stabilized, we'll update this documentation and [the example bootstrap.php](./examples/bootstrap.php).

### JavaScript tests

If a project contains JavaScript tests, it must define `.scripts.test-js` in `composer.json` to run the tests. If a build step is required before running tests, the necessary commands for that should also be included.

### E2E tests

**This is not implemented yet!**

If a project contains end-to-end tests, it must define `.scripts.test-e2e` in `composer.json` to run the tests. If a build step is required before running tests, the necessary commands for that should also be included.

### Code coverage

If a project contains PHP or JavaScript tests, it should also define `.scripts.test-coverage` in `composer.json` to run the tests in a mode that will generate code coverage output.

Output should be written to the path specified via the `COVERAGE_DIR` environment variable. Subdirectories of that path may be used as desired.

For PHP tests, you'll probably run PHPUnit as `phpdbg -qrr "$(command -v phpunit)" --coverage-clover "$COVERAGE_DIR/clover.xml"`.

There's no need to be concerned about collisions with other projects' coverage files, a separate directory is used per project. The coverage files are also automatically copied to `ARTIFACTS_DIR`.

## Mirror repositories

Most projects in the monorepo should have a mirror repository holding a built version of the project, ready for deployment. Follow these steps to create the mirror repo and configure the monorepo tooling to push to it.

1. Create the mirror repo on GitHub. It will most likely be named like "<span>https://</span>github.com/Automattic/jetpack-_something_".
   1. The repo's description should begin with `[READ ONLY]` and end with `This repository is a mirror, for issue tracking and development head to: https://github.com/automattic/jetpack`.
   2. The default branch should be `master`, matching the monorepo.
   3. In the repo's settings, turn off wikis, issues, projects, and so on.
   4. Make sure that [matticbot](https://github.com/matticbot) can push to the repo.
   5. Make sure that Actions are enabled. The build process copies workflows from `.github/files/mirror-.github` into the mirror to do useful things like automatically close PRs with a reference back to the monorepo.
   6. Create any secrets needed (e.g. for Autotagger or Npmjs-Autopublisher). See PCYsg-xsv-p2#mirror-repo-secrets for details.
2. If your project requires building, configure `.scripts.build-production` in your project's `composer.json` to run the necessary commands.
3. If there are any files included in the monorepo that should not be included in the mirror, use `.gitattributes` to tag them with "production-exclude".
4. If there are any built files in `.gitignore` that should be included in the mirror, use `.gitattributes` to tag them with "production-include".
5. Set `.extra.mirror-repo` in your project's `composer.json` to the name of the repo.
   * When you push the PR making this change to `composer.json`, pay attention to the Build workflow. Download the "jetpack-build" artifact and make sure it contains your project, and that there are no extra or missing files.

### Autotagger

If `.extra.autotagger` is set to a truthy value in the project's `composer.json`, a GitHub Action will be included in the mirror repo that will read the most recent version from the mirrored `CHANGELOG.md` in each push to master, and create the tag if that version has no prerelease or build suffix.

If `.extra.autotagger` is set to an object with a truthy value for `major` (i.e. if `.extra.autotagger.major` is truthy), the GitHub Action will additionally create or update a major-version tag as is common for GitHub Action repositories.

Note that, for this to work, you'll need to create a secret `API_TOKEN_GITHUB` in the mirror repo. The value of the secret must be a GitHub access token. See PCYsg-xsv-p2#mirror-repo-secrets for details.

This is intended to work in combination with [Changelogger](#jetpack-changelogger): When any change files are present in the project, a `-alpha` version entry will be written to the changelog so the autotagging will not be triggered. To release a new version, you'd do the following:

1. (optional) Go to the [monorepo's branch settings page](https://github.com/Automattic/jetpack/settings/branches), and turn on "Require branches to be up to date before merging" for the master branch.
2. Use `tools/changelogger-release.sh` to create a PR rolling the change files into a new changelog entry.
3. Push and merge that PR.
4. If you turned on "Require branches to be up to date before merging" in step 1, go turn it off. If you didn't, check that no one merged any PRs in between steps 2 and 3 that added change files to the projects being released.
   * If they did, you'll likely have to create a release branch in the affected projects' mirror repos and manually tag.
5. Verify that the Build workflow run for your PR's merge to master succeeded. [This search](https://github.com/Automattic/jetpack/actions/workflows/build.yml?query=branch%3Amaster) will show the runs of that workflow for all merges to master.
   * If it failed, you can try re-running it as long as no other PRs were merged adding change files to the projects being released. If some were merged, you'll have to manually tag the affected projects.

### Npmjs Auto-publisher

If `.extra.npmjs-autopublish` is set to a truthy value in the project's `composer.json`, a GitHub Action will be included in the mirror repo that will run `npm publish` when a version tag is created. This works with Autotagger.

Note that, for this to work, you'll need to create a secret `NPMJS_AUTOMATION_TOKEN` in the mirror repo. The value of the secret must be an npmjs.com automation token for an account with the ability to publish the package.
See PCYsg-xsv-p2#mirror-repo-secrets for details.

Note the following will also be done by the build process:

* In `package.json`, the `.engines` will be deleted. If there is a `.publish_engines`, it will be renamed to `.engines`.
* Entries will be prepended to `.npmignore` to ignore `.github` and `composer.json` during the NPM publish. This file will be created if not present.

Before you create the first release tag, you may want to check out the mirror and run `npm publish --dry-run` to ensure that only the files you want published will be published.
If additional files need to be excluded, create an `.npmignore`.

## Plugin release tooling

If you have set `.extra.mirror-repo`, `.extra.release-branch-prefix`, and `.extra.wp-plugin-slug` in your plugin's `composer.json`, we have tooling to make releasing to WordPress.org easier.

* `tools/create-release-branch.sh` will help you create the correctly named release branch, and will automatically update version numbers and versions of monorepo packages for you. The GitHub Action will then mirror this branch to your plugin's mirror repo.
* `tools/deploy-to-svn.sh` will prepare a temporary directory with the content of the mirror repo branch that is ready to be pushed to WordPress.org SVN.
* `tools/revert-release.sh` will prepare a temporary directory that updates the "Stable version" tag in `readme.txt` to the previous version, in case an emergency rollback is required.

## Jetpack Changelogger

The [Jetpack Changelogger](https://packagist.org/packages/automattic/jetpack-changelogger) tool helps in managing a changelog for a project by having each PR drop a specially-formatted "change file" into a changelog directory, which the tool can then process for a release.

As implemented by the Jetpack Monorepo, any PR that touches the Jetpack plugin itself, or anything else in the `/projects` directory will need to add a specially-formatted file to the project's specified `changelog` directory; there is a [command](#using-the-jetpack-changelogger) mentioned below that can help create the change file.

**What does the change file look like?** It’s a text file with a header-and-body format, like HTTP or email. A change file might look like this:

```
Significance: patch
Type: compat

Block Editor: update all blocks to be fully compatible with WordPress 5.7.
```

The “Significance” header specifies the significance of change in the style of [semantic versioning](https://semver.org/): patch, minor, or major.

The “Type” header categorizes the change in the changelog. In Jetpack, for example, our changelog divides changes into “Major Enhancements”, “Enhancements”, “Improved compatibility”, and “Bugfixes”.

The body is separated from the headers by a blank line, and is the text that actually goes into the changelog. This should follow our recommendations for [writing a good changelog entry](./writing-a-good-changelog-entry.md). Feel free to (sparingly) use Markdown in the body text.

### Using the Jetpack Changelogger

The changelogger tool can be used via [Jetpack's CLI tool](#first-time). You may use the following command to generate changelog entries for each project that needs one:

`jetpack changelog add`

**Does it matter what the change file is named?** Starting the file name with `.` should not be used. Also consider avoiding names that have extensions like `.php` or `.js` to avoid confusing other tools.

**What if a change is so trivial that it doesn’t need a changelog entry?** The change file is still required. If you specify the significance as “patch”, changelogger will allow the body section to be empty so as to not generate an entry in the changelog. In this case, use the “Comment” header instead, for example:

```
Significance: patch
Type: compat
Comment: Update composer.lock, no need for a changelog entry
```

**Adding the first PR to a project after a release?** If a PR is the first to Jetpack after a release, version numbers may need to be bumped. This also applies to the first semantic versioning “minor” or “major” change to any projects that use semantic versioning.

The “Linting / Changelogger validity” GitHub Actions check will help in making sure that all these version numbers are in sync with the version inferred from the changelog and change files. You can also check this locally with `tools/changelogger-validate-all.sh`.

Within a single project, changlogger’s `version next` command can tell you the next version, and the monorepo script `tools/project-version.sh` can be used to check and update the version numbers.

## New Projects

### Creating a new Composer Package

To add a Composer package:
* For Automatticians, drop us a line in #jetpack-crew to discuss your needs, just to be sure we don't have something already.
* Use the `jetpack generate package` command to create a skeleton project.
* Create your package and submit a PR as usual.

Once reviewed and approved, the Crew team does the following:
* Creates a GitHub repo in the Automattic repo to be the mirror repo for this project, if not done already. The new repo follows the [mirror repo guidelines](#mirror-repositories).
* Adds a `composer.json` file to the repo, with some basic information about the package. This file is used by Packagist to generate the package page.
* Creates a new Packagist package on packagist.org under the Automattic org. @jeherve, @dsmart, and @kraftbj are added as maintainers of all Jetpack monorepo packages.

### Creating a new plugin

If you're thinking about developing a new plugin in the monorepo, come chat with us in #jetpack-crew. We'll help you get started.

Once you are ready to start working on a first version of your plugin in the monorepo, use the `jetpack generate plugin` command to create the first files for your plugin. Then, open a new PR with that skeleton.

Before you can merge your PR, the Crew team will do the following:

* Create the mirror repo for the plugin following the [mirror repo guidelines](#mirror-repositories).
* Add a first version of a `composer.json` file to the mirror repo.
* Add the plugin to Packagist, for folks who may be consuming it through Composer.
* Add maintainers to the Packagist entry, just like for Composer packages above.
* Add an entry for the new plugin in the Beta server settings. Find extra details on this process in the Jetpack Beta Builder repository. More information: PCYsg-gDE-p2
