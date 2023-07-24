# PHPUnit Tests

This directory is meant to be used for a combination of PHPUnit tests and WorDBless tests.

## Usage

The monorepo relies on the `test-php` Composer script defined in the plugins `composer.json` config to trigger all PHP tests for the CRM plugin when pushing to GitHub.

The main drawback by this solution is that we have some custom acceptance (codecept) tests that cannot run locally because the script bails early. So we have to trigger PHP tests directly through Composer instead.

### Create new test suites

To create a new test suite, you need to:

* Add a new `<testsuite>` element to the `../phpunit.xml.dist` file.
  * To make naming consistent with other test suites, you should end the file with `*-test.php` and end the class name with `_Test`.
* Follow WordPress code standards (e.g.: name the file `class-my-test.php` if you create a `My_Test` class).

#### Example

```xml
<testsuite name="rest-api">
	<directory suffix="test.php">tests/php/rest-api</directory>
</testsuite>
```

### Running locally

These instructions assume that you've successfully gone through the [Development Environment](https://github.com/Automattic/jetpack/blob/trunk/docs/development-environment.md) guide.

1. Run `jetpack install plugins/crm`
2. Go to the crm plugins directory `projects/plugins/crm`
3. Run `composer run-script phpunit`
	* This is to overcome the `test-php` limitation described above.

## Resources

* [Jetpack Monorepo Test Documentation](https://github.com/Automattic/jetpack/blob/trunk/docs/automated-testing.md#phpunit-tests)
	* [Unit tests](https://github.com/Automattic/jetpack/blob/trunk/docs/automated-testing.md#unit-tests)
	* [Integration tests](https://github.com/Automattic/jetpack/blob/trunk/docs/automated-testing.md#integration-tests)
* [PHPUnit Documentation](https://docs.phpunit.de/en/9.6/index.html)

## Characteristics of a good test

The main goal of a good test is to provide you and your team with confidence before shipping code.

One way to write tests that inspires confidence is to consider the following characteristics:

* Complete
* Reliable
* Isolated
* Fast
* Maintainable
* Expressive

### Comprehensive

A good test should cover all aspects of the functionality or behavior being tested. It should test all possible scenarios and edge cases to ensure that the system being tested is robust and reliable.

### Reliable

A good test should produce consistent results each time it is run. This means that if the same test is run multiple times with the same inputs, it should produce the same outputs.

If a developer is trying to address a bug in their codebase, they will need to run their test suite a few times to see if they’ve addressed the issue. What if they run the test suite two times in-a-row and don’t change their implementation, but receive different sets of failing tests? This is a sign that the developer’s test suite is unreliable. It’s like trying to hit a moving target — they can’t trust if their implementation is wrong or if their test suite is unreliable.

### Isolated

For example, you may want to test whether your software properly writes to a database. You don’t want any changes to the database persisting outside of this test. If a change to the database does persist, it may cause unexpected behavior in a test that reads from the database.

### Fast

A good test should be designed to run quickly and efficiently, while still providing accurate and comprehensive results. This allows for faster feedback cycles and quicker identification of issues.

_A rule-of-thumbs is that: Unit tests are fast, integration tests are slower, and E2E tests are slowest._

### Maintainable

A good test should be easy to maintain over time. It should be modular and have a clear separation of concerns, so that changes to the system do not require major changes to the test code.

### Expressive

The easy-to-read nature of test suites make them a great form of documentation. You should always write code that is descriptive of the features you are testing.

You should try to build a test suite that is descriptive enough for another developer to read, and be able to fully understand the purpose of the web application. Also, because your test suite is part of your software, it is more likely to stay up-to-date than a README or documentation that isn’t a functional piece of the software.
