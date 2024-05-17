# Testsuite: REST API

All tests in this directory are strictly meant to cover rest-api package in Jetpack CRM located in the internal `src/php/rest-api` package.

## Usage

Generally, you should just [follow the instructions in the readme file](../readme.md) in the root of our PHPUnit tests.

You can also run _just_ the REST API test suite by:

* Go to the root of the CRM plugin (`projects/plugins/crm`)
* Run `./vendor/bin/phpunit --testsuite rest-api`

### Running locally

These instructions assume that you've successfully gone through the [Development Environment](https://github.com/Automattic/jetpack/blob/trunk/docs/development-environment.md) guide.

1. Run `jetpack install plugins/crm`
2. Go to the crm plugins directory `projects/plugins/crm`
3. Run `composer run-script phpunit`
	* This is to overcome the `test-php` limitation(s) described in [the root readme file](../readme.md).
