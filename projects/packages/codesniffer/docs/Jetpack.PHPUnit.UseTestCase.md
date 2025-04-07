## Jetpack.PHPUnit.UseTestCase

Require that `use ClassName as Alias` preserves a "TestCase" or "TestBase" suffix on the class name.

The Jetpack.PHPUnit sniffs identify test classes primarily based on the name of the class extended. A poorly chosen alias can break this identification.

Examples of allowed and rejected `use` statements:

* ✅ `use PHPUnit\Framework\TestCase;`
* ✅ `use PHPUnit\Framework\TestCase as PHPUnitTestCase;`
* ✅ `use PHPUnit\Framework\TestCase as PHPUnit_TestCase;`
* ✅ `use MyTestBase as TestBase;`
* ❌ `use PHPUnit\Framework\TestCase as TC;`
* ❌ `use PHPUnit\Framework\TestCase as Test_Case;`
* ❌ `use MyTestBase as Base;`
* ❌ `use MyTestBase as TestCase;` (clearer to require a direct match)

### Messages

* `DoesNotEndWithTestCase`: Alias '%s' for likely PHPUnit TestCase class name '%s' should end in 'TestCase'.
* `DoesNotEndWithTestBase`: Alias '%s' for likely PHPUnit TestCase class name '%s' should end in 'TestBase'.

### Configuration

This sniff has no configuration options.
