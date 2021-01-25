## Jetpack Monorepo Overview

Welcome to the Jetpack Monorepo! This document will give you some idea of the layout, and what is required for your project to fit in with our tooling.

### Layout

Projects are divided into WordPress plugins, Composer packages, and Gutenberg editor extensions.

* WordPress plugins live in subdirectories of `projects/plugins/`. The directory name should probably match the WordPress plugin name, with a leading "jetpack-" removed if applicable.
* Composer packages live in subdirectories of `projects/packages/`. The directory name should probably match the package name with the leading "Automattic/jetpack-" removed.
* Editor extensions live in subdirectories of `projects/editor-extensions/`. The directory name should match the feature name (without a "jetpack/" prefix).

Tooling that's applicable to the monorepo as a whole, including tooling for generically handling projects, lives in `tools/`.

WordPress, being a part of the Docker environment, gets installed into the directory `tools/docker/wordpress`, with non-monorepo plugins stored in `tools/docker/wordpress/wp-content/plugins`.

Documentation that's applicable to the monorepo as a whole lives in `docs/`.

All GitHub Actions configuration for the monorepo, including CI, lives in `.github`. We should strive to make things here generic rather than specifc to any one project.

* Actual actions live in `.github/actions/`. If it doesn't have an `action.yml` file, it shouldn't be in there.
* Pattern matchers (not associated with an action) go in `.github/matchers/`.
* Other files specific to actions, including scripts used with `run:`, go in `.github/files/`.

### Compatibility

All projects should be compatible with PHP versions WordPress supports. That's currently PHP 5.6 to 8.0.

We use eslint and phpcs to lint JavaScript and PHP code. Projects should comply with the [coding standards](development-environment.md#coding-standards) enforced by these tools.

* Projects may include `.eslintrc.js` to adjust eslint configuration as necessary, but try to keep to the spirit of it.
* As eslint does not support per-directory `.eslintignore`, any necessary ignore rules should be added to the file in the monorepo.
* As phpcs does not support per-directory configuration, any necessary file ignore clauses should be added to `.phpcs.config.xml`.

### Project structure

We use `composer.json` to hold metadata about projects. Much of our generic tooling reads this metadata to customize handling of the project. Metadata keys used are:

* `.name`: Generally "Automattic/jetpack-_something_". Used to report names in various places. For Composer packages, this must, of course, match the name on Packagist.
* `.version`: If present, updated by `tools/plugin-version.sh`. This should not be included on Composer packages that will be served through Packagist.
* `.repositories`: If you include a repository entry referencing monorepo packages, it must have `.options.monorepo` set to true. This allows the build tooling to recognize and remove it.
* `.scripts.build-production`: If your project requires a build step, this must run the necessary commands.
* `.scripts.phpunit`: Packages must either set this to run PHPUnit tests, or must include a file `tests/php/ci-can-run.sh` that exits with a failure status.
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

TBD. Currently we only have semi-generic testing set up for packages via `.scripts.phpunit` in `composer.json`, with an override via `tests/php/ci-can-run.sh` existing and exiting with a failure status.

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
