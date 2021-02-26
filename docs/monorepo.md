## Jetpack Monorepo Overview

Welcome to the Jetpack Monorepo! This document will give you some idea of the layout, and what is required for your project to fit in with our tooling.

### Layout

Projects are divided into WordPress plugins, Composer packages, and Gutenberg editor extensions.

* WordPress plugins live in subdirectories of `projects/plugins/`. The directory name should probably match the WordPress plugin name, with a leading "jetpack-" removed if applicable.
* Composer packages live in subdirectories of `projects/packages/`. The directory name should probably match the package name with the leading "Automattic/jetpack-" removed.
* Editor extensions live in subdirectories of `projects/editor-extensions/`. The directory name should match the feature name (without a "jetpack/" prefix).
* GitHub Actions live in subdirectories of `projects/github-actions/`. The directory name should match the action name with the leading "Automattic/action-" removed.

Tooling that's applicable to the monorepo as a whole, including tooling for generically handling projects, lives in `tools/`.

WordPress, being a part of the Docker environment, gets installed into the directory `tools/docker/wordpress`, with non-monorepo plugins stored in `tools/docker/wordpress/wp-content/plugins`.

Documentation that's applicable to the monorepo as a whole lives in `docs/`.

All GitHub Actions configuration for the monorepo, including CI, lives in `.github`. We should strive to make things here generic rather than specifc to any one project.

* Actual actions live in `.github/actions/`. If it doesn't have an `action.yml` file, it shouldn't be in there.
* Pattern matchers (not associated with an action) go in `.github/matchers/`.
* Other files specific to actions, including scripts used with `run:`, go in `.github/files/`.

### Compatibility

All projects should be compatible with PHP versions WordPress supports. That's currently PHP 5.6 to 8.0.

### Project structure

We use `composer.json` to hold metadata about projects. Much of our generic tooling reads this metadata to customize handling of the project. Metadata keys used are:

* `.name`: Generally "Automattic/jetpack-_something_". Used to report names in various places. For Composer packages, this must, of course, match the name on Packagist.
* `.version`: If present, updated by `tools/plugin-version.sh`. This should not be included on Composer packages that will be served through Packagist.
* `.repositories`: If you include a repository entry referencing monorepo packages, it must have `.options.monorepo` set to true. This allows the build tooling to recognize and remove it.
* `.scripts.build-development`: If your project has a general build step, this must run the necessary commands. This command or build-production below are required for projects requiring a build step.
* `.scripts.build-production`: If your project requires a production-specific build step, this must run the necessary commands. This command or build-development above are required for projects requiring a build step.
* `.scripts.test-coverage`: If the package contains any tests, this must run the necessary commands to generate a coverage report. See [Code coverage](#code-coverage) for details.
* `.scripts.test-e2e`: If the package contains any E2E tests, this must run the necessary commands. See [E2E tests](#e2e-tests) for details.
* `.scripts.test-js`: If the package contains any JavaScript tests, this must run the necessary commands. See [JavaScript tests](#javascript-tests) for details.
* `.scripts.test-php`: If the package contains any PHPUnit tests, this must run the necessary commands. See [PHP tests](#php-tests) for details.
* `.extra.dependencies`: This optional array specifies the "slugs" of any within-monorepo dependencies that can't otherwise be inferred. The "slug" consists of the two levels of directory under `projects/`, e.g. `plugins/jetpack` or `packages/lazy-images`. See [Testing](#testing) for details.
* `.extra.mirror-repo`: This specifies the name of the GitHub mirror repo, i.e. the "Automattic/jetpack-_something_" in "https://github.com/Automattic/jetpack-_something_".
* `.extra.release-branch-prefix`: Our mirroring and release tooling considers any branch named like "_prefix_/branch-_version_" to be a release branch, and this specifies which _prefix_ belongs to the project.
* `.extra.version-constants`: When `tools/plugin-version.sh` is updating versions, this specifies PHP constants to replace. The value is an object matching constants to the file (relative to the plugin root) in which the constant is defined.
  * Note that constant definitions must be on a single line and use single quotes to be detected by the script. Like this:
    ```php
    define( 'CONSTANT', 'version' );
    ```
* `.extra.wp-plugin-slug`: This specifies the WordPress.org plugin slug, for use by scripts that deploy the plugin to WordPress.org.

Our mirroring tooling also uses `.gitattributes` to specify built files to include in the mirror and unnecessary files to exclude.

### Testing

The Jetpack Monorepo includes GitHub actions to run a number of CI checks on all projects.

Tests for a project are only run for a PR if changes are made to the project or its dependencies. Dependencies may be specified as:

* For Composer packages included in the monorepo, via `.require' and `.require-dev` in `composer.json`.
* For any other dependencies, via `.extra.dependencies` in `composer.json`.

The test environment will be set up with appropriate tools, including node, yarn, php, phpdbg, and composer. Unless otherwise specified below, the version of node will be that specified in the monorepo root's `.nvmrc` and php will be that specified in the monorepo root's `.github/php-version`. Other necessary tools may be pulled in via composer and yarn.

All test commands must return a shell failure status when tests fail and a success status if tests pass or are skipped; usually your testing framework will already do this for you, but if you write custom shell scripts you'll need to make sure any failure is propagated.

If your project has multiple logical groups of tests, feel free to make use of GitHub Actions's [grouping commands](https://docs.github.com/en/actions/reference/workflow-commands-for-github-actions#grouping-log-lines).

#### Linting

We use eslint and phpcs to lint JavaScript and PHP code. Projects should comply with the [coding standards](development-environment.md#coding-standards) enforced by these tools.

* Projects may include `.eslintrc.js` to adjust eslint configuration as necessary, but try to keep to the spirit of it.
* As eslint does not support per-directory `.eslintignore`, any necessary ignore rules should be added to the file in the root of the monorepo.
* As phpcs does not support per-directory configuration, any necessary file ignore clauses should be added to `.phpcs.config.xml` in the root of the monorepo.

#### PHP tests

If a project contains PHP tests (typically PHPUnit), it must define `.scripts.test-php` in `composer.json` to run the tests. If a build step is required before running tests, the necessary commands for that should also be included.

A MySQL database is available if needed; credentials may be found in `~/.my.cnf`. Note that the host must be specified as `127.0.0.1`, as when passed `localhost` PHP will try to connect via a Unix domain socket which is not available in the Actions environment.

Tests are run with a variety of supported PHP versions from 5.6 to 8.0. The PHP version for a run is available in the environment variable `PHP_VERSION`. If you have tests that only need to be run once, run them when `PHP_VERSION` matches `.github/php-version`.

If your tests generate any artifacts that might be useful for debugging, you may place them in the directory specified in the environemnt variable `ARTIFACTS_DIR` and they will be uploaded to GitHub after the test run. There's no need to be concerned about collisions with other projects' artifacts, a separate directory is used per project.

##### PHP tests for non-plugins

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

##### PHP tests for plugins

WordPress plugins generally want to run within WordPress. All monorepo plugins are copied into place in a WordPress installation and tests are run from there. An appropriate version of PHPUnit is made available in the path; installing it via Composer is not needed.

Tests will be run against the latest version of WordPress using the variety of supported PHP versions, and against the previous and master versions of WordPress using the version in `.github/php-version`. The environment variable `WP_BRANCH` will be set to 'latest', 'previous', or 'master' accordingly. If you have tests that only need to be run once, run them when `WP_BRANCH` is 'latest'.

Note that WordPress currently requires a version of PHPUnit that does not natively support PHP 8.0. Their current approach is to monkey-patch it via `composer.json` which monorepo plugins cannot duplicate. [This example bootstrap.php](./examples/bootstrap.php) illustrates how to handle it.

#### JavaScript tests

If a project contains JavaScript tests, it must define `.scripts.test-js` in `composer.json` to run the tests. If a build step is required before running tests, the necessary commands for that should also be included.

If your tests generate any artifacts that might be useful for debugging, you may place them in the directory specified in the environemnt variable `ARTIFACTS_DIR` and they will be uploaded to GitHub after the test run. There's no need to be concerned about collisions with other projects' artifacts, a separate directory is used per project.

#### E2E tests

**This is not implemented yet!**

If a project contains end-to-end tests, it must define `.scripts.test-e2e` in `composer.json` to run the tests. If a build step is required before running tests, the necessary commands for that should also be included.

If your tests generate any artifacts that might be useful for debugging, you may place them in the directory specified in the environemnt variable `ARTIFACTS_DIR` and they will be uploaded to GitHub after the test run. There's no need to be concerned about collisions with other projects' artifacts, a separate directory is used per project.

#### Code coverage

If a project contains PHP or JavaScript tests, it should also define `.scripts.test-coverage` in `composer.json` to run the tests in a mode that will generate code coverage output.

Output should be written to the path specified via the `COVERAGE_DIR` environment variable. Subdirectories of that path may be used as desired, as long as the files themselves are named appropriately. Supported formats are:

* clover: Name files to end in `clover.xml`.
* lcov: Name files to end in `lcov.info`. Remove any `lcov-report` directories.

For PHP tests, you'll probably run PHPUnit as `phpdbg -qrr "$(which phpunit)" --coverage-clover "$COVERAGE_DIR/clover.xml"`.

If your tests generate any artifacts that might be useful for debugging, you may place them in the directory specified in the environemnt variable `ARTIFACTS_DIR` and they will be uploaded to GitHub after the test run.

There's no need to be concerned about collisions with other projects' coverage files or artifacts, a separate directory is used per project.

### Mirror repositories

Most projects in the monorepo should have a mirror repository holding a built version of the project, ready for deployment. Follow these steps to create the mirror repo and configure the monorepo tooling to push to it.

1. Create the mirror repo on GitHub. It will most likely be named like "https://github.com/Automattic/jetpack-_something_".
   1. The repo's description should begin with `[READ ONLY]` and end with `This repository is a mirror, for issue tracking and development head to: https://github.com/automattic/jetpack`.
   2. The default branch should be `master`, matching the monorepo.
   3. In the repo's settings, turn off wikis, issues, projects, and so on.
   4. Make sure that [matticbot](https://github.com/matticbot) can push to the repo.
   5. Make sure that Actions are enabled. The build process copies workflows from `.github/files/mirror-.github` into the mirror to do useful things like automatically close PRs with a reference back to the monorepo.
2. If your project requires building, configure `.scripts.build-production` in your project's `composer.json` to run the necessary commands.
3. If there are any files included in the monorepo that should not be included in the mirror, use `.gitattributes` to tag them with "production-exclude".
4. If there are any built files in `.gitignore` that should be included in the mirror, use `.gitattributes` to tag them with "production-include".
5. Set `.extra.mirror-repo` in your project's `composer.json` to the name of the repo.
   * When you push the PR making this change to `composer.json`, pay attention to the Build workflow. Download the "jetpack-build" artifact and make sure it contains your project, and that there are no extra or missing files.

### Plugin release tooling

If you have set `.extra.mirror-repo`, `.extra.release-branch-prefix`, and `.extra.wp-plugin-slug` in your plugin's `composer.json`, we have tooling to make releasing to WordPress.org easier.

* `tools/create-release-branch.sh` will help you create the correctly named release branch, and will automatically update version numbers and versions of monorepo packages for you. The GitHub Action will then mirror this branch to your plugin's mirror repo.
* `tools/deploy-to-svn.sh` will prepare a temporary directory with the content of the mirror repo branch that is ready to be pushed to WordPress.org SVN.
* `tools/revert-release.sh` will prepare a temporary directory that updates the "Stable version" tag in `readme.txt` to the previous version, in case an emergency rollback is required.
