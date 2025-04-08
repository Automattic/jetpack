# test-environment

Shared WordPress test environment for Jetpack monorepo projects.

This package is not intended for use outside of the Jetpack monorepo.

Many projects within the monorepo use WordPress for unit testing, previously all depending directly on WordBless for a database-free WordPress environment.

This led to many, many full installs of WordPress existing in the monorepo on local machines and CI servers, which used a lot of space and caused IDEs to suffer trying to parse dozens of WordPress installs.

This package provides a shared init script for WorDBless that can be used without separate installs of WordPress. It depends on `composer install` running from the monorepo root, which triggers `composer install` for `tools/php-test-env` which installs WorDBless.

Then, this package can be used to initalize the WordPress test environment in the current package.

## How to use test-environment

1. `"automattic/jetpack-test-environment":"@dev"` in the project's `composer.json`.
2. In the php test's boostrap.php, include `\Automattic\Jetpack\Test_Environment::init();` after the autoloader.
3. Write unit tests assuming the WordPress test environment is already initialized.

You can see examples of this in `projects/plugins/social/tests/php/bootstrap.php` and associated test files.

## Security

Need to report a security vulnerability? Go to [https://automattic.com/security/](https://automattic.com/security/) or directly to our security bug bounty site [https://hackerone.com/automattic](https://hackerone.com/automattic).

## License

test-environment is licensed under [GNU General Public License v2 (or later)](./LICENSE.txt)

