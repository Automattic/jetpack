Jetpack includes several [unit tests](https://github.com/Automattic/jetpack/tree/master/tests) that you can run in your
 local environment before you submit a new Pull Request.

## Prerequisites

To get started, you can follow the instructions [here](https://phpunit.de/getting-started.html) to install PHPUnit on 
your machine.

You'll also need to install a mySQL server, to run the tests.

We've included two styles to run unit tests here, depending on whichever you feel most comfortable with. Whichever you
choose, the end result will be the same. 

Option #1: putting everything inside the Jetpack repo you've already cloned.
This option is probably the best option if you already cloned the repo and you just want to test that your changes didn't
break anything.
 
Option #2: clone the repo inside a WordPress svn checkout. This option is the simplest. It's the best if you don't already
have any work in progress or are just starting out.

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
