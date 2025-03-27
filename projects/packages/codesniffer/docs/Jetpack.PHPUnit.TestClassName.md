## Jetpack.PHPUnit.TestClassName

Enforce naming requirements for PHPUnit test classes.

* PHPUnit 10+ require that the filename match the name of the test class. This is similar to PSR-4 naming, but the directory structure does not need to match the namespace.
* PHPUnit also strongly encourages that test class names end in "Test".
* Test case base classes should end in "TestCase" or "TestBase". This makes it easier to identify misnamed subclasses.

> [!TIP]
> PHPUnit test classes and test case base classes are identified by the following:
>
> * Class name ends in "Test", "TestCase", "TestBase", "TestCaseBase", or "Suite".
> * Extends a class with a name ending in "Test", "TestCase", "TestBase", "TestCaseBase", or "Suite".
> * Extends `WP_UnitTestCase_Base` or any class with a name like `WP_Test_*_Case`, `WP_Test_*_Base`, or `WP_Test_*_Suite`.
>
> The difference between a "test class" and a "test case base class" is that the latter is abstract. If it's only for extending and not for PHPUnit to run directly, make it abstract to indicate this even if it has no abstract methods.

### Messages

* `DoesNotEndWithTest`: PHPUnit test class name '%s' should end with 'Test'.
* `DoesNotEndWithTestCase`: PHPUnit test case custom base class name '%s' should end with 'TestCase' or 'TestBase'.
* `DoesNotMatchFileName`: PHPUnit test class name '%s' does not match filename '%s'. This mismatch was deprecated in PHPUnit 9 and fails in PHPUnit 10+.

### Configuration

This sniff has no configuration options.
