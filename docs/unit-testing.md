Jetpack includes several [unit tests](https://github.com/Automattic/jetpack/tree/master/tests) that you can run in your
 local environment before to submit a new Pull Request.

## Prerequisites

To get started, you can follow the instructions [here](https://phpunit.de/getting-started.html) to install PHPUnit on 
your machine. Once you've done so, you can get the WordPress testing codebase like so:

You'll also need to install a mySQL server, to run the tests.

# Option 1: Everything inside Jetpack folder

## The Code

The easiest way to get up and running is to download trunk, of WordPress:

`svn checkout http://develop.svn.wordpress.org/trunk wordpress-tests`

This will checkout the codebase into the folder `wordpress-tests` in the root of the repo.

You'll need to copy `wp-tests-config-sample.php` to `wp-tests-config.php` and update the credentials to point to an existing database.
This database will be wiped clean every time you run `phpunit`, so don't use a production database or any database whose
content you might care about.

## Testing

Before running tests, we'll need to tell PHPUnit where the bootstrapping code lives:

```sh
export WP_DEVELOP_DIR=wordpress-tests/tests/phpunit
```

To run tests on your machine, you can run `phpunit` while in the Jetpack directory.

If you're not familiar with PHP Unit Testing, you can also check
 [this tutorial](https://pippinsplugins.com/series/unit-tests-wordpress-plugins/)

# Option 2: Existing WordPress trunk

## The Code

Simply checkout Jetpack as a plugin into the wp-content/plugins directory

## Testing

Run `phpunit` while in the Jetpack directory.
