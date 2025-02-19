# phpunit-select-config

This is a shim to run PHPUnit while selecting a configuration file based on the PHPUnit major version number.

This is intended for use in projects that have to test with a wide variety of PHP versions, which typically
also means a wide variety of PHPUnit versions which may have incompatible configuration file formats.

## Installation

Require using `composer require --dev automattic/phpunit-select-config`.

This will install the `phpunit-select-config` tool into `vendor/bin/`, which you might add to your PATH, or
you might run it via `composer exec -- phpunit-select-config`.

## Usage

Create PHPUnit configuration files for each relevant PHPUnit version following a common naming pattern.
For example, you might name the config for PHPUnit 8 `phpunit.8.xml.dist`, the one for PHPUnit 9 `phpunit.9.xml.dist`,
the one for PHPUnit 10 `phpunit.10.xml.dist`, and so on.

Then, instead of running `phpunit` directly, run `phpunit-select-config phpunit.#.xml.dist`. Any additional arguments to PHPUnit may follow.
The `#` character in the filename-pattern will be replaced with the PHPUnit major version and passed as the `--configuration` argument to PHPUnit.
