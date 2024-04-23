<?php
/**
 * Stubs automatically generated from PHPUnit 9.6.19
 * using the definition file `tools/stubs/phpunit-stub-defs.php` in the Jetpack monorepo.
 *
 * Do not edit this directly! Run tools/stubs/update-stubs.sh to regenerate it.
 */

namespace PHPUnit;

/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
interface Exception extends \Throwable
{
}
namespace PHPUnit\Framework;

/**
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 */
abstract class Assert
{
    /**
     * Asserts that an array has a specified key.
     *
     * @param int|string        $key
     * @param array|\ArrayAccess $array
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     * @throws Exception
     * @throws ExpectationFailedException
     */
    public static function assertArrayHasKey($key, $array, string $message = ''): void
    {
    }
    /**
     * Asserts that an array does not have a specified key.
     *
     * @param int|string        $key
     * @param array|\ArrayAccess $array
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     * @throws Exception
     * @throws ExpectationFailedException
     */
    public static function assertArrayNotHasKey($key, $array, string $message = ''): void
    {
    }
    /**
     * Asserts that a haystack contains a needle.
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     * @throws Exception
     * @throws ExpectationFailedException
     */
    public static function assertContains($needle, iterable $haystack, string $message = ''): void
    {
    }
    public static function assertContainsEquals($needle, iterable $haystack, string $message = ''): void
    {
    }
    /**
     * Asserts that a haystack does not contain a needle.
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     * @throws Exception
     * @throws ExpectationFailedException
     */
    public static function assertNotContains($needle, iterable $haystack, string $message = ''): void
    {
    }
    public static function assertNotContainsEquals($needle, iterable $haystack, string $message = ''): void
    {
    }
    /**
     * Asserts that a haystack contains only values of a given type.
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     * @throws ExpectationFailedException
     */
    public static function assertContainsOnly(string $type, iterable $haystack, ?bool $isNativeType = null, string $message = ''): void
    {
    }
    /**
     * Asserts that a haystack contains only instances of a given class name.
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     * @throws ExpectationFailedException
     */
    public static function assertContainsOnlyInstancesOf(string $className, iterable $haystack, string $message = ''): void
    {
    }
    /**
     * Asserts that a haystack does not contain only values of a given type.
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     * @throws ExpectationFailedException
     */
    public static function assertNotContainsOnly(string $type, iterable $haystack, ?bool $isNativeType = null, string $message = ''): void
    {
    }
    /**
     * Asserts the number of elements of an array, Countable or Traversable.
     *
     * @param \Countable|iterable $haystack
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     * @throws Exception
     * @throws ExpectationFailedException
     */
    public static function assertCount(int $expectedCount, $haystack, string $message = ''): void
    {
    }
    /**
     * Asserts the number of elements of an array, Countable or Traversable.
     *
     * @param \Countable|iterable $haystack
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     * @throws Exception
     * @throws ExpectationFailedException
     */
    public static function assertNotCount(int $expectedCount, $haystack, string $message = ''): void
    {
    }
    /**
     * Asserts that two variables are equal.
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     * @throws ExpectationFailedException
     */
    public static function assertEquals($expected, $actual, string $message = ''): void
    {
    }
    /**
     * Asserts that two variables are equal (canonicalizing).
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     * @throws ExpectationFailedException
     */
    public static function assertEqualsCanonicalizing($expected, $actual, string $message = ''): void
    {
    }
    /**
     * Asserts that two variables are equal (ignoring case).
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     * @throws ExpectationFailedException
     */
    public static function assertEqualsIgnoringCase($expected, $actual, string $message = ''): void
    {
    }
    /**
     * Asserts that two variables are equal (with delta).
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     * @throws ExpectationFailedException
     */
    public static function assertEqualsWithDelta($expected, $actual, float $delta, string $message = ''): void
    {
    }
    /**
     * Asserts that two variables are not equal.
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     * @throws ExpectationFailedException
     */
    public static function assertNotEquals($expected, $actual, string $message = ''): void
    {
    }
    /**
     * Asserts that two variables are not equal (canonicalizing).
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     * @throws ExpectationFailedException
     */
    public static function assertNotEqualsCanonicalizing($expected, $actual, string $message = ''): void
    {
    }
    /**
     * Asserts that two variables are not equal (ignoring case).
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     * @throws ExpectationFailedException
     */
    public static function assertNotEqualsIgnoringCase($expected, $actual, string $message = ''): void
    {
    }
    /**
     * Asserts that two variables are not equal (with delta).
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     * @throws ExpectationFailedException
     */
    public static function assertNotEqualsWithDelta($expected, $actual, float $delta, string $message = ''): void
    {
    }
    /**
     * @throws ExpectationFailedException
     */
    public static function assertObjectEquals(object $expected, object $actual, string $method = 'equals', string $message = ''): void
    {
    }
    /**
     * Asserts that a variable is empty.
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     * @throws ExpectationFailedException
     *
     * @phan-assert empty $actual
     */
    public static function assertEmpty($actual, string $message = ''): void
    {
    }
    /**
     * Asserts that a variable is not empty.
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     * @throws ExpectationFailedException
     *
     * @phan-assert !empty $actual
     */
    public static function assertNotEmpty($actual, string $message = ''): void
    {
    }
    /**
     * Asserts that a value is greater than another value.
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     * @throws ExpectationFailedException
     */
    public static function assertGreaterThan($expected, $actual, string $message = ''): void
    {
    }
    /**
     * Asserts that a value is greater than or equal to another value.
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     * @throws ExpectationFailedException
     */
    public static function assertGreaterThanOrEqual($expected, $actual, string $message = ''): void
    {
    }
    /**
     * Asserts that a value is smaller than another value.
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     * @throws ExpectationFailedException
     */
    public static function assertLessThan($expected, $actual, string $message = ''): void
    {
    }
    /**
     * Asserts that a value is smaller than or equal to another value.
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     * @throws ExpectationFailedException
     */
    public static function assertLessThanOrEqual($expected, $actual, string $message = ''): void
    {
    }
    /**
     * Asserts that the contents of one file is equal to the contents of another
     * file.
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     * @throws ExpectationFailedException
     */
    public static function assertFileEquals(string $expected, string $actual, string $message = ''): void
    {
    }
    /**
     * Asserts that the contents of one file is equal to the contents of another
     * file (canonicalizing).
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     * @throws ExpectationFailedException
     */
    public static function assertFileEqualsCanonicalizing(string $expected, string $actual, string $message = ''): void
    {
    }
    /**
     * Asserts that the contents of one file is equal to the contents of another
     * file (ignoring case).
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     * @throws ExpectationFailedException
     */
    public static function assertFileEqualsIgnoringCase(string $expected, string $actual, string $message = ''): void
    {
    }
    /**
     * Asserts that the contents of one file is not equal to the contents of
     * another file.
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     * @throws ExpectationFailedException
     */
    public static function assertFileNotEquals(string $expected, string $actual, string $message = ''): void
    {
    }
    /**
     * Asserts that the contents of one file is not equal to the contents of another
     * file (canonicalizing).
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     * @throws ExpectationFailedException
     */
    public static function assertFileNotEqualsCanonicalizing(string $expected, string $actual, string $message = ''): void
    {
    }
    /**
     * Asserts that the contents of one file is not equal to the contents of another
     * file (ignoring case).
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     * @throws ExpectationFailedException
     */
    public static function assertFileNotEqualsIgnoringCase(string $expected, string $actual, string $message = ''): void
    {
    }
    /**
     * Asserts that the contents of a string is equal
     * to the contents of a file.
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     * @throws ExpectationFailedException
     */
    public static function assertStringEqualsFile(string $expectedFile, string $actualString, string $message = ''): void
    {
    }
    /**
     * Asserts that the contents of a string is equal
     * to the contents of a file (canonicalizing).
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     * @throws ExpectationFailedException
     */
    public static function assertStringEqualsFileCanonicalizing(string $expectedFile, string $actualString, string $message = ''): void
    {
    }
    /**
     * Asserts that the contents of a string is equal
     * to the contents of a file (ignoring case).
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     * @throws ExpectationFailedException
     */
    public static function assertStringEqualsFileIgnoringCase(string $expectedFile, string $actualString, string $message = ''): void
    {
    }
    /**
     * Asserts that the contents of a string is not equal
     * to the contents of a file.
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     * @throws ExpectationFailedException
     */
    public static function assertStringNotEqualsFile(string $expectedFile, string $actualString, string $message = ''): void
    {
    }
    /**
     * Asserts that the contents of a string is not equal
     * to the contents of a file (canonicalizing).
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     * @throws ExpectationFailedException
     */
    public static function assertStringNotEqualsFileCanonicalizing(string $expectedFile, string $actualString, string $message = ''): void
    {
    }
    /**
     * Asserts that the contents of a string is not equal
     * to the contents of a file (ignoring case).
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     * @throws ExpectationFailedException
     */
    public static function assertStringNotEqualsFileIgnoringCase(string $expectedFile, string $actualString, string $message = ''): void
    {
    }
    /**
     * Asserts that a file/dir is readable.
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     * @throws ExpectationFailedException
     */
    public static function assertIsReadable(string $filename, string $message = ''): void
    {
    }
    /**
     * Asserts that a file/dir exists and is not readable.
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     * @throws ExpectationFailedException
     */
    public static function assertIsNotReadable(string $filename, string $message = ''): void
    {
    }
    /**
     * Asserts that a file/dir exists and is not readable.
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     * @throws ExpectationFailedException
     *
     * @codeCoverageIgnore
     *
     * @deprecated https://github.com/sebastianbergmann/phpunit/issues/4062
     */
    public static function assertNotIsReadable(string $filename, string $message = ''): void
    {
    }
    /**
     * Asserts that a file/dir exists and is writable.
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     * @throws ExpectationFailedException
     */
    public static function assertIsWritable(string $filename, string $message = ''): void
    {
    }
    /**
     * Asserts that a file/dir exists and is not writable.
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     * @throws ExpectationFailedException
     */
    public static function assertIsNotWritable(string $filename, string $message = ''): void
    {
    }
    /**
     * Asserts that a file/dir exists and is not writable.
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     * @throws ExpectationFailedException
     *
     * @codeCoverageIgnore
     *
     * @deprecated https://github.com/sebastianbergmann/phpunit/issues/4065
     */
    public static function assertNotIsWritable(string $filename, string $message = ''): void
    {
    }
    /**
     * Asserts that a directory exists.
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     * @throws ExpectationFailedException
     */
    public static function assertDirectoryExists(string $directory, string $message = ''): void
    {
    }
    /**
     * Asserts that a directory does not exist.
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     * @throws ExpectationFailedException
     */
    public static function assertDirectoryDoesNotExist(string $directory, string $message = ''): void
    {
    }
    /**
     * Asserts that a directory does not exist.
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     * @throws ExpectationFailedException
     *
     * @codeCoverageIgnore
     *
     * @deprecated https://github.com/sebastianbergmann/phpunit/issues/4068
     */
    public static function assertDirectoryNotExists(string $directory, string $message = ''): void
    {
    }
    /**
     * Asserts that a directory exists and is readable.
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     * @throws ExpectationFailedException
     */
    public static function assertDirectoryIsReadable(string $directory, string $message = ''): void
    {
    }
    /**
     * Asserts that a directory exists and is not readable.
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     * @throws ExpectationFailedException
     */
    public static function assertDirectoryIsNotReadable(string $directory, string $message = ''): void
    {
    }
    /**
     * Asserts that a directory exists and is not readable.
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     * @throws ExpectationFailedException
     *
     * @codeCoverageIgnore
     *
     * @deprecated https://github.com/sebastianbergmann/phpunit/issues/4071
     */
    public static function assertDirectoryNotIsReadable(string $directory, string $message = ''): void
    {
    }
    /**
     * Asserts that a directory exists and is writable.
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     * @throws ExpectationFailedException
     */
    public static function assertDirectoryIsWritable(string $directory, string $message = ''): void
    {
    }
    /**
     * Asserts that a directory exists and is not writable.
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     * @throws ExpectationFailedException
     */
    public static function assertDirectoryIsNotWritable(string $directory, string $message = ''): void
    {
    }
    /**
     * Asserts that a directory exists and is not writable.
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     * @throws ExpectationFailedException
     *
     * @codeCoverageIgnore
     *
     * @deprecated https://github.com/sebastianbergmann/phpunit/issues/4074
     */
    public static function assertDirectoryNotIsWritable(string $directory, string $message = ''): void
    {
    }
    /**
     * Asserts that a file exists.
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     * @throws ExpectationFailedException
     */
    public static function assertFileExists(string $filename, string $message = ''): void
    {
    }
    /**
     * Asserts that a file does not exist.
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     * @throws ExpectationFailedException
     */
    public static function assertFileDoesNotExist(string $filename, string $message = ''): void
    {
    }
    /**
     * Asserts that a file does not exist.
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     * @throws ExpectationFailedException
     *
     * @codeCoverageIgnore
     *
     * @deprecated https://github.com/sebastianbergmann/phpunit/issues/4077
     */
    public static function assertFileNotExists(string $filename, string $message = ''): void
    {
    }
    /**
     * Asserts that a file exists and is readable.
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     * @throws ExpectationFailedException
     */
    public static function assertFileIsReadable(string $file, string $message = ''): void
    {
    }
    /**
     * Asserts that a file exists and is not readable.
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     * @throws ExpectationFailedException
     */
    public static function assertFileIsNotReadable(string $file, string $message = ''): void
    {
    }
    /**
     * Asserts that a file exists and is not readable.
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     * @throws ExpectationFailedException
     *
     * @codeCoverageIgnore
     *
     * @deprecated https://github.com/sebastianbergmann/phpunit/issues/4080
     */
    public static function assertFileNotIsReadable(string $file, string $message = ''): void
    {
    }
    /**
     * Asserts that a file exists and is writable.
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     * @throws ExpectationFailedException
     */
    public static function assertFileIsWritable(string $file, string $message = ''): void
    {
    }
    /**
     * Asserts that a file exists and is not writable.
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     * @throws ExpectationFailedException
     */
    public static function assertFileIsNotWritable(string $file, string $message = ''): void
    {
    }
    /**
     * Asserts that a file exists and is not writable.
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     * @throws ExpectationFailedException
     *
     * @codeCoverageIgnore
     *
     * @deprecated https://github.com/sebastianbergmann/phpunit/issues/4083
     */
    public static function assertFileNotIsWritable(string $file, string $message = ''): void
    {
    }
    /**
     * Asserts that a condition is true.
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     * @throws ExpectationFailedException
     *
     * @phan-assert true $condition
     */
    public static function assertTrue($condition, string $message = ''): void
    {
    }
    /**
     * Asserts that a condition is not true.
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     * @throws ExpectationFailedException
     *
     * @phan-assert !true $condition
     */
    public static function assertNotTrue($condition, string $message = ''): void
    {
    }
    /**
     * Asserts that a condition is false.
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     * @throws ExpectationFailedException
     *
     * @phan-assert false $condition
     */
    public static function assertFalse($condition, string $message = ''): void
    {
    }
    /**
     * Asserts that a condition is not false.
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     * @throws ExpectationFailedException
     *
     * @phan-assert !false $condition
     */
    public static function assertNotFalse($condition, string $message = ''): void
    {
    }
    /**
     * Asserts that a variable is null.
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     * @throws ExpectationFailedException
     *
     * @phan-assert null $actual
     */
    public static function assertNull($actual, string $message = ''): void
    {
    }
    /**
     * Asserts that a variable is not null.
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     * @throws ExpectationFailedException
     *
     * @phan-assert !null $actual
     */
    public static function assertNotNull($actual, string $message = ''): void
    {
    }
    /**
     * Asserts that a variable is finite.
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     * @throws ExpectationFailedException
     */
    public static function assertFinite($actual, string $message = ''): void
    {
    }
    /**
     * Asserts that a variable is infinite.
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     * @throws ExpectationFailedException
     */
    public static function assertInfinite($actual, string $message = ''): void
    {
    }
    /**
     * Asserts that a variable is nan.
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     * @throws ExpectationFailedException
     */
    public static function assertNan($actual, string $message = ''): void
    {
    }
    /**
     * Asserts that a class has a specified attribute.
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     * @throws Exception
     * @throws ExpectationFailedException
     *
     * @deprecated https://github.com/sebastianbergmann/phpunit/issues/4601
     */
    public static function assertClassHasAttribute(string $attributeName, string $className, string $message = ''): void
    {
    }
    /**
     * Asserts that a class does not have a specified attribute.
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     * @throws Exception
     * @throws ExpectationFailedException
     *
     * @deprecated https://github.com/sebastianbergmann/phpunit/issues/4601
     */
    public static function assertClassNotHasAttribute(string $attributeName, string $className, string $message = ''): void
    {
    }
    /**
     * Asserts that a class has a specified static attribute.
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     * @throws Exception
     * @throws ExpectationFailedException
     *
     * @deprecated https://github.com/sebastianbergmann/phpunit/issues/4601
     */
    public static function assertClassHasStaticAttribute(string $attributeName, string $className, string $message = ''): void
    {
    }
    /**
     * Asserts that a class does not have a specified static attribute.
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     * @throws Exception
     * @throws ExpectationFailedException
     *
     * @deprecated https://github.com/sebastianbergmann/phpunit/issues/4601
     */
    public static function assertClassNotHasStaticAttribute(string $attributeName, string $className, string $message = ''): void
    {
    }
    /**
     * Asserts that an object has a specified attribute.
     *
     * @param object $object
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     * @throws Exception
     * @throws ExpectationFailedException
     *
     * @deprecated https://github.com/sebastianbergmann/phpunit/issues/4601
     */
    public static function assertObjectHasAttribute(string $attributeName, $object, string $message = ''): void
    {
    }
    /**
     * Asserts that an object does not have a specified attribute.
     *
     * @param object $object
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     * @throws Exception
     * @throws ExpectationFailedException
     *
     * @deprecated https://github.com/sebastianbergmann/phpunit/issues/4601
     */
    public static function assertObjectNotHasAttribute(string $attributeName, $object, string $message = ''): void
    {
    }
    /**
     * Asserts that an object has a specified property.
     *
     * @throws ExpectationFailedException
     */
    final public static function assertObjectHasProperty(string $propertyName, object $object, string $message = ''): void
    {
    }
    /**
     * Asserts that an object does not have a specified property.
     *
     * @throws ExpectationFailedException
     */
    final public static function assertObjectNotHasProperty(string $propertyName, object $object, string $message = ''): void
    {
    }
    /**
     * Asserts that two variables have the same type and value.
     * Used on objects, it asserts that two variables reference
     * the same object.
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     * @throws ExpectationFailedException
     *
     * @phan-template ExpectedType
     *
     * @phan-param ExpectedType $expected
     *
     * @phan-assert =ExpectedType $actual
     */
    public static function assertSame($expected, $actual, string $message = ''): void
    {
    }
    /**
     * Asserts that two variables do not have the same type and value.
     * Used on objects, it asserts that two variables do not reference
     * the same object.
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     * @throws ExpectationFailedException
     */
    public static function assertNotSame($expected, $actual, string $message = ''): void
    {
    }
    /**
     * Asserts that a variable is of a given type.
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     * @throws Exception
     * @throws ExpectationFailedException
     *
     * @phan-template ExpectedType of object
     *
     * @phan-param class-string<ExpectedType> $expected
     *
     * @phan-assert =ExpectedType $actual
     */
    public static function assertInstanceOf(string $expected, $actual, string $message = ''): void
    {
    }
    /**
     * Asserts that a variable is not of a given type.
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     * @throws Exception
     * @throws ExpectationFailedException
     *
     * @phan-template ExpectedType of object
     *
     * @phan-param class-string<ExpectedType> $expected
     *
     * @phan-assert !ExpectedType $actual
     */
    public static function assertNotInstanceOf(string $expected, $actual, string $message = ''): void
    {
    }
    /**
     * Asserts that a variable is of type array.
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     * @throws ExpectationFailedException
     *
     * @phan-assert array $actual
     */
    public static function assertIsArray($actual, string $message = ''): void
    {
    }
    /**
     * Asserts that a variable is of type bool.
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     * @throws ExpectationFailedException
     *
     * @phan-assert bool $actual
     */
    public static function assertIsBool($actual, string $message = ''): void
    {
    }
    /**
     * Asserts that a variable is of type float.
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     * @throws ExpectationFailedException
     *
     * @phan-assert float $actual
     */
    public static function assertIsFloat($actual, string $message = ''): void
    {
    }
    /**
     * Asserts that a variable is of type int.
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     * @throws ExpectationFailedException
     *
     * @phan-assert int $actual
     */
    public static function assertIsInt($actual, string $message = ''): void
    {
    }
    /**
     * Asserts that a variable is of type numeric.
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     * @throws ExpectationFailedException
     *
     * @phan-assert numeric $actual
     */
    public static function assertIsNumeric($actual, string $message = ''): void
    {
    }
    /**
     * Asserts that a variable is of type object.
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     * @throws ExpectationFailedException
     *
     * @phan-assert object $actual
     */
    public static function assertIsObject($actual, string $message = ''): void
    {
    }
    /**
     * Asserts that a variable is of type resource.
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     * @throws ExpectationFailedException
     *
     * @phan-assert resource $actual
     */
    public static function assertIsResource($actual, string $message = ''): void
    {
    }
    /**
     * Asserts that a variable is of type resource and is closed.
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     * @throws ExpectationFailedException
     *
     * @phan-assert resource $actual
     */
    public static function assertIsClosedResource($actual, string $message = ''): void
    {
    }
    /**
     * Asserts that a variable is of type string.
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     * @throws ExpectationFailedException
     *
     * @phan-assert string $actual
     */
    public static function assertIsString($actual, string $message = ''): void
    {
    }
    /**
     * Asserts that a variable is of type scalar.
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     * @throws ExpectationFailedException
     *
     * @phan-assert scalar $actual
     */
    public static function assertIsScalar($actual, string $message = ''): void
    {
    }
    /**
     * Asserts that a variable is of type callable.
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     * @throws ExpectationFailedException
     *
     * @phan-assert callable $actual
     */
    public static function assertIsCallable($actual, string $message = ''): void
    {
    }
    /**
     * Asserts that a variable is of type iterable.
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     * @throws ExpectationFailedException
     *
     * @phan-assert iterable $actual
     */
    public static function assertIsIterable($actual, string $message = ''): void
    {
    }
    /**
     * Asserts that a variable is not of type array.
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     * @throws ExpectationFailedException
     *
     * @phan-assert !array $actual
     */
    public static function assertIsNotArray($actual, string $message = ''): void
    {
    }
    /**
     * Asserts that a variable is not of type bool.
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     * @throws ExpectationFailedException
     *
     * @phan-assert !bool $actual
     */
    public static function assertIsNotBool($actual, string $message = ''): void
    {
    }
    /**
     * Asserts that a variable is not of type float.
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     * @throws ExpectationFailedException
     *
     * @phan-assert !float $actual
     */
    public static function assertIsNotFloat($actual, string $message = ''): void
    {
    }
    /**
     * Asserts that a variable is not of type int.
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     * @throws ExpectationFailedException
     *
     * @phan-assert !int $actual
     */
    public static function assertIsNotInt($actual, string $message = ''): void
    {
    }
    /**
     * Asserts that a variable is not of type numeric.
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     * @throws ExpectationFailedException
     *
     * @phan-assert !numeric $actual
     */
    public static function assertIsNotNumeric($actual, string $message = ''): void
    {
    }
    /**
     * Asserts that a variable is not of type object.
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     * @throws ExpectationFailedException
     *
     * @phan-assert !object $actual
     */
    public static function assertIsNotObject($actual, string $message = ''): void
    {
    }
    /**
     * Asserts that a variable is not of type resource.
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     * @throws ExpectationFailedException
     *
     * @phan-assert !resource $actual
     */
    public static function assertIsNotResource($actual, string $message = ''): void
    {
    }
    /**
     * Asserts that a variable is not of type resource.
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     * @throws ExpectationFailedException
     *
     * @phan-assert !resource $actual
     */
    public static function assertIsNotClosedResource($actual, string $message = ''): void
    {
    }
    /**
     * Asserts that a variable is not of type string.
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     * @throws ExpectationFailedException
     *
     * @phan-assert !string $actual
     */
    public static function assertIsNotString($actual, string $message = ''): void
    {
    }
    /**
     * Asserts that a variable is not of type scalar.
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     * @throws ExpectationFailedException
     *
     * @phan-assert !scalar $actual
     */
    public static function assertIsNotScalar($actual, string $message = ''): void
    {
    }
    /**
     * Asserts that a variable is not of type callable.
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     * @throws ExpectationFailedException
     *
     * @phan-assert !callable $actual
     */
    public static function assertIsNotCallable($actual, string $message = ''): void
    {
    }
    /**
     * Asserts that a variable is not of type iterable.
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     * @throws ExpectationFailedException
     *
     * @phan-assert !iterable $actual
     */
    public static function assertIsNotIterable($actual, string $message = ''): void
    {
    }
    /**
     * Asserts that a string matches a given regular expression.
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     * @throws ExpectationFailedException
     */
    public static function assertMatchesRegularExpression(string $pattern, string $string, string $message = ''): void
    {
    }
    /**
     * Asserts that a string matches a given regular expression.
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     * @throws ExpectationFailedException
     *
     * @codeCoverageIgnore
     *
     * @deprecated https://github.com/sebastianbergmann/phpunit/issues/4086
     */
    public static function assertRegExp(string $pattern, string $string, string $message = ''): void
    {
    }
    /**
     * Asserts that a string does not match a given regular expression.
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     * @throws ExpectationFailedException
     */
    public static function assertDoesNotMatchRegularExpression(string $pattern, string $string, string $message = ''): void
    {
    }
    /**
     * Asserts that a string does not match a given regular expression.
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     * @throws ExpectationFailedException
     *
     * @codeCoverageIgnore
     *
     * @deprecated https://github.com/sebastianbergmann/phpunit/issues/4089
     */
    public static function assertNotRegExp(string $pattern, string $string, string $message = ''): void
    {
    }
    /**
     * Assert that the size of two arrays (or `Countable` or `Traversable` objects)
     * is the same.
     *
     * @param \Countable|iterable $expected
     * @param \Countable|iterable $actual
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     * @throws Exception
     * @throws ExpectationFailedException
     */
    public static function assertSameSize($expected, $actual, string $message = ''): void
    {
    }
    /**
     * Assert that the size of two arrays (or `Countable` or `Traversable` objects)
     * is not the same.
     *
     * @param \Countable|iterable $expected
     * @param \Countable|iterable $actual
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     * @throws Exception
     * @throws ExpectationFailedException
     */
    public static function assertNotSameSize($expected, $actual, string $message = ''): void
    {
    }
    /**
     * Asserts that a string matches a given format string.
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     * @throws ExpectationFailedException
     */
    public static function assertStringMatchesFormat(string $format, string $string, string $message = ''): void
    {
    }
    /**
     * Asserts that a string does not match a given format string.
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     * @throws ExpectationFailedException
     */
    public static function assertStringNotMatchesFormat(string $format, string $string, string $message = ''): void
    {
    }
    /**
     * Asserts that a string matches a given format file.
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     * @throws ExpectationFailedException
     */
    public static function assertStringMatchesFormatFile(string $formatFile, string $string, string $message = ''): void
    {
    }
    /**
     * Asserts that a string does not match a given format string.
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     * @throws ExpectationFailedException
     */
    public static function assertStringNotMatchesFormatFile(string $formatFile, string $string, string $message = ''): void
    {
    }
    /**
     * Asserts that a string starts with a given prefix.
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     * @throws ExpectationFailedException
     */
    public static function assertStringStartsWith(string $prefix, string $string, string $message = ''): void
    {
    }
    /**
     * Asserts that a string starts not with a given prefix.
     *
     * @param string $prefix
     * @param string $string
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     * @throws ExpectationFailedException
     */
    public static function assertStringStartsNotWith($prefix, $string, string $message = ''): void
    {
    }
    /**
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     * @throws ExpectationFailedException
     */
    public static function assertStringContainsString(string $needle, string $haystack, string $message = ''): void
    {
    }
    /**
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     * @throws ExpectationFailedException
     */
    public static function assertStringContainsStringIgnoringCase(string $needle, string $haystack, string $message = ''): void
    {
    }
    /**
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     * @throws ExpectationFailedException
     */
    public static function assertStringNotContainsString(string $needle, string $haystack, string $message = ''): void
    {
    }
    /**
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     * @throws ExpectationFailedException
     */
    public static function assertStringNotContainsStringIgnoringCase(string $needle, string $haystack, string $message = ''): void
    {
    }
    /**
     * Asserts that a string ends with a given suffix.
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     * @throws ExpectationFailedException
     */
    public static function assertStringEndsWith(string $suffix, string $string, string $message = ''): void
    {
    }
    /**
     * Asserts that a string ends not with a given suffix.
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     * @throws ExpectationFailedException
     */
    public static function assertStringEndsNotWith(string $suffix, string $string, string $message = ''): void
    {
    }
    /**
     * Asserts that two XML files are equal.
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     * @throws Exception
     * @throws ExpectationFailedException
     */
    public static function assertXmlFileEqualsXmlFile(string $expectedFile, string $actualFile, string $message = ''): void
    {
    }
    /**
     * Asserts that two XML files are not equal.
     *
     * @throws \PHPUnit\Util\Exception
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     * @throws ExpectationFailedException
     */
    public static function assertXmlFileNotEqualsXmlFile(string $expectedFile, string $actualFile, string $message = ''): void
    {
    }
    /**
     * Asserts that two XML documents are equal.
     *
     * @param \DOMDocument|string $actualXml
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     * @throws ExpectationFailedException
     * @throws \PHPUnit\Util\Xml\Exception
     */
    public static function assertXmlStringEqualsXmlFile(string $expectedFile, $actualXml, string $message = ''): void
    {
    }
    /**
     * Asserts that two XML documents are not equal.
     *
     * @param \DOMDocument|string $actualXml
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     * @throws ExpectationFailedException
     * @throws \PHPUnit\Util\Xml\Exception
     */
    public static function assertXmlStringNotEqualsXmlFile(string $expectedFile, $actualXml, string $message = ''): void
    {
    }
    /**
     * Asserts that two XML documents are equal.
     *
     * @param \DOMDocument|string $expectedXml
     * @param \DOMDocument|string $actualXml
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     * @throws ExpectationFailedException
     * @throws \PHPUnit\Util\Xml\Exception
     */
    public static function assertXmlStringEqualsXmlString($expectedXml, $actualXml, string $message = ''): void
    {
    }
    /**
     * Asserts that two XML documents are not equal.
     *
     * @param \DOMDocument|string $expectedXml
     * @param \DOMDocument|string $actualXml
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     * @throws ExpectationFailedException
     * @throws \PHPUnit\Util\Xml\Exception
     */
    public static function assertXmlStringNotEqualsXmlString($expectedXml, $actualXml, string $message = ''): void
    {
    }
    /**
     * Asserts that a hierarchy of DOMElements matches.
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     * @throws AssertionFailedError
     * @throws ExpectationFailedException
     *
     * @codeCoverageIgnore
     *
     * @deprecated https://github.com/sebastianbergmann/phpunit/issues/4091
     */
    public static function assertEqualXMLStructure(\DOMElement $expectedElement, \DOMElement $actualElement, bool $checkAttributes = false, string $message = ''): void
    {
    }
    /**
     * Evaluates a PHPUnit\Framework\Constraint matcher object.
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     * @throws ExpectationFailedException
     */
    public static function assertThat($value, \PHPUnit\Framework\Constraint\Constraint $constraint, string $message = ''): void
    {
    }
    /**
     * Asserts that a string is a valid JSON string.
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     * @throws ExpectationFailedException
     */
    public static function assertJson(string $actualJson, string $message = ''): void
    {
    }
    /**
     * Asserts that two given JSON encoded objects or arrays are equal.
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     * @throws ExpectationFailedException
     */
    public static function assertJsonStringEqualsJsonString(string $expectedJson, string $actualJson, string $message = ''): void
    {
    }
    /**
     * Asserts that two given JSON encoded objects or arrays are not equal.
     *
     * @param string $expectedJson
     * @param string $actualJson
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     * @throws ExpectationFailedException
     */
    public static function assertJsonStringNotEqualsJsonString($expectedJson, $actualJson, string $message = ''): void
    {
    }
    /**
     * Asserts that the generated JSON encoded object and the content of the given file are equal.
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     * @throws ExpectationFailedException
     */
    public static function assertJsonStringEqualsJsonFile(string $expectedFile, string $actualJson, string $message = ''): void
    {
    }
    /**
     * Asserts that the generated JSON encoded object and the content of the given file are not equal.
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     * @throws ExpectationFailedException
     */
    public static function assertJsonStringNotEqualsJsonFile(string $expectedFile, string $actualJson, string $message = ''): void
    {
    }
    /**
     * Asserts that two JSON files are equal.
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     * @throws ExpectationFailedException
     */
    public static function assertJsonFileEqualsJsonFile(string $expectedFile, string $actualFile, string $message = ''): void
    {
    }
    /**
     * Asserts that two JSON files are not equal.
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     * @throws ExpectationFailedException
     */
    public static function assertJsonFileNotEqualsJsonFile(string $expectedFile, string $actualFile, string $message = ''): void
    {
    }
    /**
     * @throws Exception
     */
    public static function logicalAnd(...$func_get_args): \PHPUnit\Framework\Constraint\LogicalAnd
    {
    }
    public static function logicalOr(...$func_get_args): \PHPUnit\Framework\Constraint\LogicalOr
    {
    }
    public static function logicalNot(\PHPUnit\Framework\Constraint\Constraint $constraint): \PHPUnit\Framework\Constraint\LogicalNot
    {
    }
    public static function logicalXor(...$func_get_args): \PHPUnit\Framework\Constraint\LogicalXor
    {
    }
    public static function anything(): \PHPUnit\Framework\Constraint\IsAnything
    {
    }
    public static function isTrue(): \PHPUnit\Framework\Constraint\IsTrue
    {
    }
    /**
     * @phan-template CallbackInput of mixed
     *
     * @phan-param callable(CallbackInput $callback): bool $callback
     *
     * @phan-return Constraint\Callback<CallbackInput>
     */
    public static function callback(callable $callback): \PHPUnit\Framework\Constraint\Callback
    {
    }
    public static function isFalse(): \PHPUnit\Framework\Constraint\IsFalse
    {
    }
    public static function isJson(): \PHPUnit\Framework\Constraint\IsJson
    {
    }
    public static function isNull(): \PHPUnit\Framework\Constraint\IsNull
    {
    }
    public static function isFinite(): \PHPUnit\Framework\Constraint\IsFinite
    {
    }
    public static function isInfinite(): \PHPUnit\Framework\Constraint\IsInfinite
    {
    }
    public static function isNan(): \PHPUnit\Framework\Constraint\IsNan
    {
    }
    public static function containsEqual($value): \PHPUnit\Framework\Constraint\TraversableContainsEqual
    {
    }
    public static function containsIdentical($value): \PHPUnit\Framework\Constraint\TraversableContainsIdentical
    {
    }
    public static function containsOnly(string $type): \PHPUnit\Framework\Constraint\TraversableContainsOnly
    {
    }
    public static function containsOnlyInstancesOf(string $className): \PHPUnit\Framework\Constraint\TraversableContainsOnly
    {
    }
    /**
     * @param int|string $key
     */
    public static function arrayHasKey($key): \PHPUnit\Framework\Constraint\ArrayHasKey
    {
    }
    public static function equalTo($value): \PHPUnit\Framework\Constraint\IsEqual
    {
    }
    public static function equalToCanonicalizing($value): \PHPUnit\Framework\Constraint\IsEqualCanonicalizing
    {
    }
    public static function equalToIgnoringCase($value): \PHPUnit\Framework\Constraint\IsEqualIgnoringCase
    {
    }
    public static function equalToWithDelta($value, float $delta): \PHPUnit\Framework\Constraint\IsEqualWithDelta
    {
    }
    public static function isEmpty(): \PHPUnit\Framework\Constraint\IsEmpty
    {
    }
    public static function isWritable(): \PHPUnit\Framework\Constraint\IsWritable
    {
    }
    public static function isReadable(): \PHPUnit\Framework\Constraint\IsReadable
    {
    }
    public static function directoryExists(): \PHPUnit\Framework\Constraint\DirectoryExists
    {
    }
    public static function fileExists(): \PHPUnit\Framework\Constraint\FileExists
    {
    }
    public static function greaterThan($value): \PHPUnit\Framework\Constraint\GreaterThan
    {
    }
    public static function greaterThanOrEqual($value): \PHPUnit\Framework\Constraint\LogicalOr
    {
    }
    /**
     * @deprecated https://github.com/sebastianbergmann/phpunit/issues/4601
     */
    public static function classHasAttribute(string $attributeName): \PHPUnit\Framework\Constraint\ClassHasAttribute
    {
    }
    /**
     * @deprecated https://github.com/sebastianbergmann/phpunit/issues/4601
     */
    public static function classHasStaticAttribute(string $attributeName): \PHPUnit\Framework\Constraint\ClassHasStaticAttribute
    {
    }
    /**
     * @deprecated https://github.com/sebastianbergmann/phpunit/issues/4601
     */
    public static function objectHasAttribute($attributeName): \PHPUnit\Framework\Constraint\ObjectHasAttribute
    {
    }
    public static function identicalTo($value): \PHPUnit\Framework\Constraint\IsIdentical
    {
    }
    public static function isInstanceOf(string $className): \PHPUnit\Framework\Constraint\IsInstanceOf
    {
    }
    public static function isType(string $type): \PHPUnit\Framework\Constraint\IsType
    {
    }
    public static function lessThan($value): \PHPUnit\Framework\Constraint\LessThan
    {
    }
    public static function lessThanOrEqual($value): \PHPUnit\Framework\Constraint\LogicalOr
    {
    }
    public static function matchesRegularExpression(string $pattern): \PHPUnit\Framework\Constraint\RegularExpression
    {
    }
    public static function matches(string $string): \PHPUnit\Framework\Constraint\StringMatchesFormatDescription
    {
    }
    public static function stringStartsWith($prefix): \PHPUnit\Framework\Constraint\StringStartsWith
    {
    }
    public static function stringContains(string $string, bool $case = true): \PHPUnit\Framework\Constraint\StringContains
    {
    }
    public static function stringEndsWith(string $suffix): \PHPUnit\Framework\Constraint\StringEndsWith
    {
    }
    public static function countOf(int $count): \PHPUnit\Framework\Constraint\Count
    {
    }
    public static function objectEquals(object $object, string $method = 'equals'): \PHPUnit\Framework\Constraint\ObjectEquals
    {
    }
    /**
     * Fails a test with the given message.
     *
     * @throws AssertionFailedError
     *
     * @phan-return never-return
     */
    public static function fail(string $message = ''): void
    {
    }
    /**
     * Mark the test as incomplete.
     *
     * @throws IncompleteTestError
     *
     * @phan-return never-return
     */
    public static function markTestIncomplete(string $message = ''): void
    {
    }
    /**
     * Mark the test as skipped.
     *
     * @throws SkippedTestError
     * @throws SyntheticSkippedError
     *
     * @phan-return never-return
     */
    public static function markTestSkipped(string $message = ''): void
    {
    }
    /**
     * Return the current assertion count.
     */
    public static function getCount(): int
    {
    }
    /**
     * Reset the assertion counter.
     */
    public static function resetCount(): void
    {
    }
}
/**
 * Asserts that an array has a specified key.
 *
 * @param int|string        $key
 * @param array|\ArrayAccess $array
 *
 * @throws ExpectationFailedException
 * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
 * @throws Exception
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see Assert::assertArrayHasKey
 */
function assertArrayHasKey($key, $array, string $message = '', ...$func_get_args): void
{
}
/**
 * Asserts that an array does not have a specified key.
 *
 * @param int|string        $key
 * @param array|\ArrayAccess $array
 *
 * @throws ExpectationFailedException
 * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
 * @throws Exception
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see Assert::assertArrayNotHasKey
 */
function assertArrayNotHasKey($key, $array, string $message = '', ...$func_get_args): void
{
}
/**
 * Asserts that a haystack contains a needle.
 *
 * @throws ExpectationFailedException
 * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
 * @throws Exception
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see Assert::assertContains
 */
function assertContains($needle, iterable $haystack, string $message = '', ...$func_get_args): void
{
}
function assertContainsEquals($needle, iterable $haystack, string $message = '', ...$func_get_args): void
{
}
/**
 * Asserts that a haystack does not contain a needle.
 *
 * @throws ExpectationFailedException
 * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
 * @throws Exception
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see Assert::assertNotContains
 */
function assertNotContains($needle, iterable $haystack, string $message = '', ...$func_get_args): void
{
}
function assertNotContainsEquals($needle, iterable $haystack, string $message = '', ...$func_get_args): void
{
}
/**
 * Asserts that a haystack contains only values of a given type.
 *
 * @throws ExpectationFailedException
 * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see Assert::assertContainsOnly
 */
function assertContainsOnly(string $type, iterable $haystack, ?bool $isNativeType = null, string $message = '', ...$func_get_args): void
{
}
/**
 * Asserts that a haystack contains only instances of a given class name.
 *
 * @throws ExpectationFailedException
 * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see Assert::assertContainsOnlyInstancesOf
 */
function assertContainsOnlyInstancesOf(string $className, iterable $haystack, string $message = '', ...$func_get_args): void
{
}
/**
 * Asserts that a haystack does not contain only values of a given type.
 *
 * @throws ExpectationFailedException
 * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see Assert::assertNotContainsOnly
 */
function assertNotContainsOnly(string $type, iterable $haystack, ?bool $isNativeType = null, string $message = '', ...$func_get_args): void
{
}
/**
 * Asserts the number of elements of an array, Countable or Traversable.
 *
 * @param \Countable|iterable $haystack
 *
 * @throws ExpectationFailedException
 * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
 * @throws Exception
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see Assert::assertCount
 */
function assertCount(int $expectedCount, $haystack, string $message = '', ...$func_get_args): void
{
}
/**
 * Asserts the number of elements of an array, Countable or Traversable.
 *
 * @param \Countable|iterable $haystack
 *
 * @throws ExpectationFailedException
 * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
 * @throws Exception
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see Assert::assertNotCount
 */
function assertNotCount(int $expectedCount, $haystack, string $message = '', ...$func_get_args): void
{
}
/**
 * Asserts that two variables are equal.
 *
 * @throws ExpectationFailedException
 * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see Assert::assertEquals
 */
function assertEquals($expected, $actual, string $message = '', ...$func_get_args): void
{
}
/**
 * Asserts that two variables are equal (canonicalizing).
 *
 * @throws ExpectationFailedException
 * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see Assert::assertEqualsCanonicalizing
 */
function assertEqualsCanonicalizing($expected, $actual, string $message = '', ...$func_get_args): void
{
}
/**
 * Asserts that two variables are equal (ignoring case).
 *
 * @throws ExpectationFailedException
 * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see Assert::assertEqualsIgnoringCase
 */
function assertEqualsIgnoringCase($expected, $actual, string $message = '', ...$func_get_args): void
{
}
/**
 * Asserts that two variables are equal (with delta).
 *
 * @throws ExpectationFailedException
 * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see Assert::assertEqualsWithDelta
 */
function assertEqualsWithDelta($expected, $actual, float $delta, string $message = '', ...$func_get_args): void
{
}
/**
 * Asserts that two variables are not equal.
 *
 * @throws ExpectationFailedException
 * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see Assert::assertNotEquals
 */
function assertNotEquals($expected, $actual, string $message = '', ...$func_get_args): void
{
}
/**
 * Asserts that two variables are not equal (canonicalizing).
 *
 * @throws ExpectationFailedException
 * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see Assert::assertNotEqualsCanonicalizing
 */
function assertNotEqualsCanonicalizing($expected, $actual, string $message = '', ...$func_get_args): void
{
}
/**
 * Asserts that two variables are not equal (ignoring case).
 *
 * @throws ExpectationFailedException
 * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see Assert::assertNotEqualsIgnoringCase
 */
function assertNotEqualsIgnoringCase($expected, $actual, string $message = '', ...$func_get_args): void
{
}
/**
 * Asserts that two variables are not equal (with delta).
 *
 * @throws ExpectationFailedException
 * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see Assert::assertNotEqualsWithDelta
 */
function assertNotEqualsWithDelta($expected, $actual, float $delta, string $message = '', ...$func_get_args): void
{
}
/**
 * @throws ExpectationFailedException
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see Assert::assertObjectEquals
 */
function assertObjectEquals(object $expected, object $actual, string $method = 'equals', string $message = '', ...$func_get_args): void
{
}
/**
 * Asserts that a variable is empty.
 *
 * @throws ExpectationFailedException
 * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
 *
 * @phan-assert empty $actual
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see Assert::assertEmpty
 */
function assertEmpty($actual, string $message = '', ...$func_get_args): void
{
}
/**
 * Asserts that a variable is not empty.
 *
 * @throws ExpectationFailedException
 * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
 *
 * @phan-assert !empty $actual
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see Assert::assertNotEmpty
 */
function assertNotEmpty($actual, string $message = '', ...$func_get_args): void
{
}
/**
 * Asserts that a value is greater than another value.
 *
 * @throws ExpectationFailedException
 * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see Assert::assertGreaterThan
 */
function assertGreaterThan($expected, $actual, string $message = '', ...$func_get_args): void
{
}
/**
 * Asserts that a value is greater than or equal to another value.
 *
 * @throws ExpectationFailedException
 * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see Assert::assertGreaterThanOrEqual
 */
function assertGreaterThanOrEqual($expected, $actual, string $message = '', ...$func_get_args): void
{
}
/**
 * Asserts that a value is smaller than another value.
 *
 * @throws ExpectationFailedException
 * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see Assert::assertLessThan
 */
function assertLessThan($expected, $actual, string $message = '', ...$func_get_args): void
{
}
/**
 * Asserts that a value is smaller than or equal to another value.
 *
 * @throws ExpectationFailedException
 * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see Assert::assertLessThanOrEqual
 */
function assertLessThanOrEqual($expected, $actual, string $message = '', ...$func_get_args): void
{
}
/**
 * Asserts that the contents of one file is equal to the contents of another
 * file.
 *
 * @throws ExpectationFailedException
 * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see Assert::assertFileEquals
 */
function assertFileEquals(string $expected, string $actual, string $message = '', ...$func_get_args): void
{
}
/**
 * Asserts that the contents of one file is equal to the contents of another
 * file (canonicalizing).
 *
 * @throws ExpectationFailedException
 * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see Assert::assertFileEqualsCanonicalizing
 */
function assertFileEqualsCanonicalizing(string $expected, string $actual, string $message = '', ...$func_get_args): void
{
}
/**
 * Asserts that the contents of one file is equal to the contents of another
 * file (ignoring case).
 *
 * @throws ExpectationFailedException
 * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see Assert::assertFileEqualsIgnoringCase
 */
function assertFileEqualsIgnoringCase(string $expected, string $actual, string $message = '', ...$func_get_args): void
{
}
/**
 * Asserts that the contents of one file is not equal to the contents of
 * another file.
 *
 * @throws ExpectationFailedException
 * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see Assert::assertFileNotEquals
 */
function assertFileNotEquals(string $expected, string $actual, string $message = '', ...$func_get_args): void
{
}
/**
 * Asserts that the contents of one file is not equal to the contents of another
 * file (canonicalizing).
 *
 * @throws ExpectationFailedException
 * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see Assert::assertFileNotEqualsCanonicalizing
 */
function assertFileNotEqualsCanonicalizing(string $expected, string $actual, string $message = '', ...$func_get_args): void
{
}
/**
 * Asserts that the contents of one file is not equal to the contents of another
 * file (ignoring case).
 *
 * @throws ExpectationFailedException
 * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see Assert::assertFileNotEqualsIgnoringCase
 */
function assertFileNotEqualsIgnoringCase(string $expected, string $actual, string $message = '', ...$func_get_args): void
{
}
/**
 * Asserts that the contents of a string is equal
 * to the contents of a file.
 *
 * @throws ExpectationFailedException
 * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see Assert::assertStringEqualsFile
 */
function assertStringEqualsFile(string $expectedFile, string $actualString, string $message = '', ...$func_get_args): void
{
}
/**
 * Asserts that the contents of a string is equal
 * to the contents of a file (canonicalizing).
 *
 * @throws ExpectationFailedException
 * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see Assert::assertStringEqualsFileCanonicalizing
 */
function assertStringEqualsFileCanonicalizing(string $expectedFile, string $actualString, string $message = '', ...$func_get_args): void
{
}
/**
 * Asserts that the contents of a string is equal
 * to the contents of a file (ignoring case).
 *
 * @throws ExpectationFailedException
 * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see Assert::assertStringEqualsFileIgnoringCase
 */
function assertStringEqualsFileIgnoringCase(string $expectedFile, string $actualString, string $message = '', ...$func_get_args): void
{
}
/**
 * Asserts that the contents of a string is not equal
 * to the contents of a file.
 *
 * @throws ExpectationFailedException
 * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see Assert::assertStringNotEqualsFile
 */
function assertStringNotEqualsFile(string $expectedFile, string $actualString, string $message = '', ...$func_get_args): void
{
}
/**
 * Asserts that the contents of a string is not equal
 * to the contents of a file (canonicalizing).
 *
 * @throws ExpectationFailedException
 * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see Assert::assertStringNotEqualsFileCanonicalizing
 */
function assertStringNotEqualsFileCanonicalizing(string $expectedFile, string $actualString, string $message = '', ...$func_get_args): void
{
}
/**
 * Asserts that the contents of a string is not equal
 * to the contents of a file (ignoring case).
 *
 * @throws ExpectationFailedException
 * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see Assert::assertStringNotEqualsFileIgnoringCase
 */
function assertStringNotEqualsFileIgnoringCase(string $expectedFile, string $actualString, string $message = '', ...$func_get_args): void
{
}
/**
 * Asserts that a file/dir is readable.
 *
 * @throws ExpectationFailedException
 * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see Assert::assertIsReadable
 */
function assertIsReadable(string $filename, string $message = '', ...$func_get_args): void
{
}
/**
 * Asserts that a file/dir exists and is not readable.
 *
 * @throws ExpectationFailedException
 * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see Assert::assertIsNotReadable
 */
function assertIsNotReadable(string $filename, string $message = '', ...$func_get_args): void
{
}
/**
 * Asserts that a file/dir exists and is not readable.
 *
 * @throws ExpectationFailedException
 * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
 *
 * @codeCoverageIgnore
 *
 * @deprecated https://github.com/sebastianbergmann/phpunit/issues/4062
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see Assert::assertNotIsReadable
 */
function assertNotIsReadable(string $filename, string $message = '', ...$func_get_args): void
{
}
/**
 * Asserts that a file/dir exists and is writable.
 *
 * @throws ExpectationFailedException
 * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see Assert::assertIsWritable
 */
function assertIsWritable(string $filename, string $message = '', ...$func_get_args): void
{
}
/**
 * Asserts that a file/dir exists and is not writable.
 *
 * @throws ExpectationFailedException
 * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see Assert::assertIsNotWritable
 */
function assertIsNotWritable(string $filename, string $message = '', ...$func_get_args): void
{
}
/**
 * Asserts that a file/dir exists and is not writable.
 *
 * @throws ExpectationFailedException
 * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
 *
 * @codeCoverageIgnore
 *
 * @deprecated https://github.com/sebastianbergmann/phpunit/issues/4065
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see Assert::assertNotIsWritable
 */
function assertNotIsWritable(string $filename, string $message = '', ...$func_get_args): void
{
}
/**
 * Asserts that a directory exists.
 *
 * @throws ExpectationFailedException
 * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see Assert::assertDirectoryExists
 */
function assertDirectoryExists(string $directory, string $message = '', ...$func_get_args): void
{
}
/**
 * Asserts that a directory does not exist.
 *
 * @throws ExpectationFailedException
 * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see Assert::assertDirectoryDoesNotExist
 */
function assertDirectoryDoesNotExist(string $directory, string $message = '', ...$func_get_args): void
{
}
/**
 * Asserts that a directory does not exist.
 *
 * @throws ExpectationFailedException
 * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
 *
 * @codeCoverageIgnore
 *
 * @deprecated https://github.com/sebastianbergmann/phpunit/issues/4068
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see Assert::assertDirectoryNotExists
 */
function assertDirectoryNotExists(string $directory, string $message = '', ...$func_get_args): void
{
}
/**
 * Asserts that a directory exists and is readable.
 *
 * @throws ExpectationFailedException
 * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see Assert::assertDirectoryIsReadable
 */
function assertDirectoryIsReadable(string $directory, string $message = '', ...$func_get_args): void
{
}
/**
 * Asserts that a directory exists and is not readable.
 *
 * @throws ExpectationFailedException
 * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see Assert::assertDirectoryIsNotReadable
 */
function assertDirectoryIsNotReadable(string $directory, string $message = '', ...$func_get_args): void
{
}
/**
 * Asserts that a directory exists and is not readable.
 *
 * @throws ExpectationFailedException
 * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
 *
 * @codeCoverageIgnore
 *
 * @deprecated https://github.com/sebastianbergmann/phpunit/issues/4071
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see Assert::assertDirectoryNotIsReadable
 */
function assertDirectoryNotIsReadable(string $directory, string $message = '', ...$func_get_args): void
{
}
/**
 * Asserts that a directory exists and is writable.
 *
 * @throws ExpectationFailedException
 * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see Assert::assertDirectoryIsWritable
 */
function assertDirectoryIsWritable(string $directory, string $message = '', ...$func_get_args): void
{
}
/**
 * Asserts that a directory exists and is not writable.
 *
 * @throws ExpectationFailedException
 * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see Assert::assertDirectoryIsNotWritable
 */
function assertDirectoryIsNotWritable(string $directory, string $message = '', ...$func_get_args): void
{
}
/**
 * Asserts that a directory exists and is not writable.
 *
 * @throws ExpectationFailedException
 * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
 *
 * @codeCoverageIgnore
 *
 * @deprecated https://github.com/sebastianbergmann/phpunit/issues/4074
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see Assert::assertDirectoryNotIsWritable
 */
function assertDirectoryNotIsWritable(string $directory, string $message = '', ...$func_get_args): void
{
}
/**
 * Asserts that a file exists.
 *
 * @throws ExpectationFailedException
 * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see Assert::assertFileExists
 */
function assertFileExists(string $filename, string $message = '', ...$func_get_args): void
{
}
/**
 * Asserts that a file does not exist.
 *
 * @throws ExpectationFailedException
 * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see Assert::assertFileDoesNotExist
 */
function assertFileDoesNotExist(string $filename, string $message = '', ...$func_get_args): void
{
}
/**
 * Asserts that a file does not exist.
 *
 * @throws ExpectationFailedException
 * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
 *
 * @codeCoverageIgnore
 *
 * @deprecated https://github.com/sebastianbergmann/phpunit/issues/4077
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see Assert::assertFileNotExists
 */
function assertFileNotExists(string $filename, string $message = '', ...$func_get_args): void
{
}
/**
 * Asserts that a file exists and is readable.
 *
 * @throws ExpectationFailedException
 * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see Assert::assertFileIsReadable
 */
function assertFileIsReadable(string $file, string $message = '', ...$func_get_args): void
{
}
/**
 * Asserts that a file exists and is not readable.
 *
 * @throws ExpectationFailedException
 * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see Assert::assertFileIsNotReadable
 */
function assertFileIsNotReadable(string $file, string $message = '', ...$func_get_args): void
{
}
/**
 * Asserts that a file exists and is not readable.
 *
 * @throws ExpectationFailedException
 * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
 *
 * @codeCoverageIgnore
 *
 * @deprecated https://github.com/sebastianbergmann/phpunit/issues/4080
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see Assert::assertFileNotIsReadable
 */
function assertFileNotIsReadable(string $file, string $message = '', ...$func_get_args): void
{
}
/**
 * Asserts that a file exists and is writable.
 *
 * @throws ExpectationFailedException
 * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see Assert::assertFileIsWritable
 */
function assertFileIsWritable(string $file, string $message = '', ...$func_get_args): void
{
}
/**
 * Asserts that a file exists and is not writable.
 *
 * @throws ExpectationFailedException
 * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see Assert::assertFileIsNotWritable
 */
function assertFileIsNotWritable(string $file, string $message = '', ...$func_get_args): void
{
}
/**
 * Asserts that a file exists and is not writable.
 *
 * @throws ExpectationFailedException
 * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
 *
 * @codeCoverageIgnore
 *
 * @deprecated https://github.com/sebastianbergmann/phpunit/issues/4083
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see Assert::assertFileNotIsWritable
 */
function assertFileNotIsWritable(string $file, string $message = '', ...$func_get_args): void
{
}
/**
 * Asserts that a condition is true.
 *
 * @throws ExpectationFailedException
 * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
 *
 * @phan-assert true $condition
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see Assert::assertTrue
 */
function assertTrue($condition, string $message = '', ...$func_get_args): void
{
}
/**
 * Asserts that a condition is not true.
 *
 * @throws ExpectationFailedException
 * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
 *
 * @phan-assert !true $condition
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see Assert::assertNotTrue
 */
function assertNotTrue($condition, string $message = '', ...$func_get_args): void
{
}
/**
 * Asserts that a condition is false.
 *
 * @throws ExpectationFailedException
 * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
 *
 * @phan-assert false $condition
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see Assert::assertFalse
 */
function assertFalse($condition, string $message = '', ...$func_get_args): void
{
}
/**
 * Asserts that a condition is not false.
 *
 * @throws ExpectationFailedException
 * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
 *
 * @phan-assert !false $condition
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see Assert::assertNotFalse
 */
function assertNotFalse($condition, string $message = '', ...$func_get_args): void
{
}
/**
 * Asserts that a variable is null.
 *
 * @throws ExpectationFailedException
 * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
 *
 * @phan-assert null $actual
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see Assert::assertNull
 */
function assertNull($actual, string $message = '', ...$func_get_args): void
{
}
/**
 * Asserts that a variable is not null.
 *
 * @throws ExpectationFailedException
 * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
 *
 * @phan-assert !null $actual
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see Assert::assertNotNull
 */
function assertNotNull($actual, string $message = '', ...$func_get_args): void
{
}
/**
 * Asserts that a variable is finite.
 *
 * @throws ExpectationFailedException
 * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see Assert::assertFinite
 */
function assertFinite($actual, string $message = '', ...$func_get_args): void
{
}
/**
 * Asserts that a variable is infinite.
 *
 * @throws ExpectationFailedException
 * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see Assert::assertInfinite
 */
function assertInfinite($actual, string $message = '', ...$func_get_args): void
{
}
/**
 * Asserts that a variable is nan.
 *
 * @throws ExpectationFailedException
 * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see Assert::assertNan
 */
function assertNan($actual, string $message = '', ...$func_get_args): void
{
}
/**
 * Asserts that a class has a specified attribute.
 *
 * @throws ExpectationFailedException
 * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
 * @throws Exception
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see Assert::assertClassHasAttribute
 */
function assertClassHasAttribute(string $attributeName, string $className, string $message = '', ...$func_get_args): void
{
}
/**
 * Asserts that a class does not have a specified attribute.
 *
 * @throws ExpectationFailedException
 * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
 * @throws Exception
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see Assert::assertClassNotHasAttribute
 */
function assertClassNotHasAttribute(string $attributeName, string $className, string $message = '', ...$func_get_args): void
{
}
/**
 * Asserts that a class has a specified static attribute.
 *
 * @throws ExpectationFailedException
 * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
 * @throws Exception
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see Assert::assertClassHasStaticAttribute
 */
function assertClassHasStaticAttribute(string $attributeName, string $className, string $message = '', ...$func_get_args): void
{
}
/**
 * Asserts that a class does not have a specified static attribute.
 *
 * @throws ExpectationFailedException
 * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
 * @throws Exception
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see Assert::assertClassNotHasStaticAttribute
 */
function assertClassNotHasStaticAttribute(string $attributeName, string $className, string $message = '', ...$func_get_args): void
{
}
/**
 * Asserts that an object has a specified attribute.
 *
 * @param object $object
 *
 * @throws ExpectationFailedException
 * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
 * @throws Exception
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see Assert::assertObjectHasAttribute
 */
function assertObjectHasAttribute(string $attributeName, $object, string $message = '', ...$func_get_args): void
{
}
/**
 * Asserts that an object does not have a specified attribute.
 *
 * @param object $object
 *
 * @throws ExpectationFailedException
 * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
 * @throws Exception
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see Assert::assertObjectNotHasAttribute
 */
function assertObjectNotHasAttribute(string $attributeName, $object, string $message = '', ...$func_get_args): void
{
}
/**
 * Asserts that an object has a specified property.
 *
 * @throws ExpectationFailedException
 * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
 * @throws Exception
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see Assert::assertObjectHasProperty
 */
function assertObjectHasProperty(string $attributeName, object $object, string $message = '', ...$func_get_args): void
{
}
/**
 * Asserts that an object does not have a specified property.
 *
 * @throws ExpectationFailedException
 * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
 * @throws Exception
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see Assert::assertObjectNotHasProperty
 */
function assertObjectNotHasProperty(string $attributeName, object $object, string $message = '', ...$func_get_args): void
{
}
/**
 * Asserts that two variables have the same type and value.
 * Used on objects, it asserts that two variables reference
 * the same object.
 *
 * @throws ExpectationFailedException
 * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
 *
 * @phan-template ExpectedType
 *
 * @phan-param ExpectedType $expected
 *
 * @phan-assert =ExpectedType $actual
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see Assert::assertSame
 */
function assertSame($expected, $actual, string $message = '', ...$func_get_args): void
{
}
/**
 * Asserts that two variables do not have the same type and value.
 * Used on objects, it asserts that two variables do not reference
 * the same object.
 *
 * @throws ExpectationFailedException
 * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see Assert::assertNotSame
 */
function assertNotSame($expected, $actual, string $message = '', ...$func_get_args): void
{
}
/**
 * Asserts that a variable is of a given type.
 *
 * @throws ExpectationFailedException
 * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
 * @throws Exception
 *
 * @phan-template ExpectedType of object
 *
 * @phan-param class-string<ExpectedType> $expected
 *
 * @phan-assert =ExpectedType $actual
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see Assert::assertInstanceOf
 */
function assertInstanceOf(string $expected, $actual, string $message = '', ...$func_get_args): void
{
}
/**
 * Asserts that a variable is not of a given type.
 *
 * @throws ExpectationFailedException
 * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
 * @throws Exception
 *
 * @phan-template ExpectedType of object
 *
 * @phan-param class-string<ExpectedType> $expected
 *
 * @phan-assert !ExpectedType $actual
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see Assert::assertNotInstanceOf
 */
function assertNotInstanceOf(string $expected, $actual, string $message = '', ...$func_get_args): void
{
}
/**
 * Asserts that a variable is of type array.
 *
 * @throws ExpectationFailedException
 * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
 *
 * @phan-assert array $actual
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see Assert::assertIsArray
 */
function assertIsArray($actual, string $message = '', ...$func_get_args): void
{
}
/**
 * Asserts that a variable is of type bool.
 *
 * @throws ExpectationFailedException
 * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
 *
 * @phan-assert bool $actual
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see Assert::assertIsBool
 */
function assertIsBool($actual, string $message = '', ...$func_get_args): void
{
}
/**
 * Asserts that a variable is of type float.
 *
 * @throws ExpectationFailedException
 * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
 *
 * @phan-assert float $actual
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see Assert::assertIsFloat
 */
function assertIsFloat($actual, string $message = '', ...$func_get_args): void
{
}
/**
 * Asserts that a variable is of type int.
 *
 * @throws ExpectationFailedException
 * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
 *
 * @phan-assert int $actual
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see Assert::assertIsInt
 */
function assertIsInt($actual, string $message = '', ...$func_get_args): void
{
}
/**
 * Asserts that a variable is of type numeric.
 *
 * @throws ExpectationFailedException
 * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
 *
 * @phan-assert numeric $actual
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see Assert::assertIsNumeric
 */
function assertIsNumeric($actual, string $message = '', ...$func_get_args): void
{
}
/**
 * Asserts that a variable is of type object.
 *
 * @throws ExpectationFailedException
 * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
 *
 * @phan-assert object $actual
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see Assert::assertIsObject
 */
function assertIsObject($actual, string $message = '', ...$func_get_args): void
{
}
/**
 * Asserts that a variable is of type resource.
 *
 * @throws ExpectationFailedException
 * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
 *
 * @phan-assert resource $actual
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see Assert::assertIsResource
 */
function assertIsResource($actual, string $message = '', ...$func_get_args): void
{
}
/**
 * Asserts that a variable is of type resource and is closed.
 *
 * @throws ExpectationFailedException
 * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
 *
 * @phan-assert resource $actual
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see Assert::assertIsClosedResource
 */
function assertIsClosedResource($actual, string $message = '', ...$func_get_args): void
{
}
/**
 * Asserts that a variable is of type string.
 *
 * @throws ExpectationFailedException
 * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
 *
 * @phan-assert string $actual
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see Assert::assertIsString
 */
function assertIsString($actual, string $message = '', ...$func_get_args): void
{
}
/**
 * Asserts that a variable is of type scalar.
 *
 * @throws ExpectationFailedException
 * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
 *
 * @phan-assert scalar $actual
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see Assert::assertIsScalar
 */
function assertIsScalar($actual, string $message = '', ...$func_get_args): void
{
}
/**
 * Asserts that a variable is of type callable.
 *
 * @throws ExpectationFailedException
 * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
 *
 * @phan-assert callable $actual
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see Assert::assertIsCallable
 */
function assertIsCallable($actual, string $message = '', ...$func_get_args): void
{
}
/**
 * Asserts that a variable is of type iterable.
 *
 * @throws ExpectationFailedException
 * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
 *
 * @phan-assert iterable $actual
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see Assert::assertIsIterable
 */
function assertIsIterable($actual, string $message = '', ...$func_get_args): void
{
}
/**
 * Asserts that a variable is not of type array.
 *
 * @throws ExpectationFailedException
 * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
 *
 * @phan-assert !array $actual
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see Assert::assertIsNotArray
 */
function assertIsNotArray($actual, string $message = '', ...$func_get_args): void
{
}
/**
 * Asserts that a variable is not of type bool.
 *
 * @throws ExpectationFailedException
 * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
 *
 * @phan-assert !bool $actual
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see Assert::assertIsNotBool
 */
function assertIsNotBool($actual, string $message = '', ...$func_get_args): void
{
}
/**
 * Asserts that a variable is not of type float.
 *
 * @throws ExpectationFailedException
 * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
 *
 * @phan-assert !float $actual
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see Assert::assertIsNotFloat
 */
function assertIsNotFloat($actual, string $message = '', ...$func_get_args): void
{
}
/**
 * Asserts that a variable is not of type int.
 *
 * @throws ExpectationFailedException
 * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
 *
 * @phan-assert !int $actual
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see Assert::assertIsNotInt
 */
function assertIsNotInt($actual, string $message = '', ...$func_get_args): void
{
}
/**
 * Asserts that a variable is not of type numeric.
 *
 * @throws ExpectationFailedException
 * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
 *
 * @phan-assert !numeric $actual
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see Assert::assertIsNotNumeric
 */
function assertIsNotNumeric($actual, string $message = '', ...$func_get_args): void
{
}
/**
 * Asserts that a variable is not of type object.
 *
 * @throws ExpectationFailedException
 * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
 *
 * @phan-assert !object $actual
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see Assert::assertIsNotObject
 */
function assertIsNotObject($actual, string $message = '', ...$func_get_args): void
{
}
/**
 * Asserts that a variable is not of type resource.
 *
 * @throws ExpectationFailedException
 * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
 *
 * @phan-assert !resource $actual
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see Assert::assertIsNotResource
 */
function assertIsNotResource($actual, string $message = '', ...$func_get_args): void
{
}
/**
 * Asserts that a variable is not of type resource.
 *
 * @throws ExpectationFailedException
 * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
 *
 * @phan-assert !resource $actual
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see Assert::assertIsNotClosedResource
 */
function assertIsNotClosedResource($actual, string $message = '', ...$func_get_args): void
{
}
/**
 * Asserts that a variable is not of type string.
 *
 * @throws ExpectationFailedException
 * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
 *
 * @phan-assert !string $actual
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see Assert::assertIsNotString
 */
function assertIsNotString($actual, string $message = '', ...$func_get_args): void
{
}
/**
 * Asserts that a variable is not of type scalar.
 *
 * @throws ExpectationFailedException
 * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
 *
 * @phan-assert !scalar $actual
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see Assert::assertIsNotScalar
 */
function assertIsNotScalar($actual, string $message = '', ...$func_get_args): void
{
}
/**
 * Asserts that a variable is not of type callable.
 *
 * @throws ExpectationFailedException
 * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
 *
 * @phan-assert !callable $actual
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see Assert::assertIsNotCallable
 */
function assertIsNotCallable($actual, string $message = '', ...$func_get_args): void
{
}
/**
 * Asserts that a variable is not of type iterable.
 *
 * @throws ExpectationFailedException
 * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
 *
 * @phan-assert !iterable $actual
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see Assert::assertIsNotIterable
 */
function assertIsNotIterable($actual, string $message = '', ...$func_get_args): void
{
}
/**
 * Asserts that a string matches a given regular expression.
 *
 * @throws ExpectationFailedException
 * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see Assert::assertMatchesRegularExpression
 */
function assertMatchesRegularExpression(string $pattern, string $string, string $message = '', ...$func_get_args): void
{
}
/**
 * Asserts that a string matches a given regular expression.
 *
 * @throws ExpectationFailedException
 * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
 *
 * @codeCoverageIgnore
 *
 * @deprecated https://github.com/sebastianbergmann/phpunit/issues/4086
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see Assert::assertRegExp
 */
function assertRegExp(string $pattern, string $string, string $message = '', ...$func_get_args): void
{
}
/**
 * Asserts that a string does not match a given regular expression.
 *
 * @throws ExpectationFailedException
 * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see Assert::assertDoesNotMatchRegularExpression
 */
function assertDoesNotMatchRegularExpression(string $pattern, string $string, string $message = '', ...$func_get_args): void
{
}
/**
 * Asserts that a string does not match a given regular expression.
 *
 * @throws ExpectationFailedException
 * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
 *
 * @codeCoverageIgnore
 *
 * @deprecated https://github.com/sebastianbergmann/phpunit/issues/4089
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see Assert::assertNotRegExp
 */
function assertNotRegExp(string $pattern, string $string, string $message = '', ...$func_get_args): void
{
}
/**
 * Assert that the size of two arrays (or `Countable` or `Traversable` objects)
 * is the same.
 *
 * @param \Countable|iterable $expected
 * @param \Countable|iterable $actual
 *
 * @throws ExpectationFailedException
 * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
 * @throws Exception
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see Assert::assertSameSize
 */
function assertSameSize($expected, $actual, string $message = '', ...$func_get_args): void
{
}
/**
 * Assert that the size of two arrays (or `Countable` or `Traversable` objects)
 * is not the same.
 *
 * @param \Countable|iterable $expected
 * @param \Countable|iterable $actual
 *
 * @throws ExpectationFailedException
 * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
 * @throws Exception
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see Assert::assertNotSameSize
 */
function assertNotSameSize($expected, $actual, string $message = '', ...$func_get_args): void
{
}
/**
 * Asserts that a string matches a given format string.
 *
 * @throws ExpectationFailedException
 * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see Assert::assertStringMatchesFormat
 */
function assertStringMatchesFormat(string $format, string $string, string $message = '', ...$func_get_args): void
{
}
/**
 * Asserts that a string does not match a given format string.
 *
 * @throws ExpectationFailedException
 * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see Assert::assertStringNotMatchesFormat
 */
function assertStringNotMatchesFormat(string $format, string $string, string $message = '', ...$func_get_args): void
{
}
/**
 * Asserts that a string matches a given format file.
 *
 * @throws ExpectationFailedException
 * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see Assert::assertStringMatchesFormatFile
 */
function assertStringMatchesFormatFile(string $formatFile, string $string, string $message = '', ...$func_get_args): void
{
}
/**
 * Asserts that a string does not match a given format string.
 *
 * @throws ExpectationFailedException
 * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see Assert::assertStringNotMatchesFormatFile
 */
function assertStringNotMatchesFormatFile(string $formatFile, string $string, string $message = '', ...$func_get_args): void
{
}
/**
 * Asserts that a string starts with a given prefix.
 *
 * @throws ExpectationFailedException
 * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see Assert::assertStringStartsWith
 */
function assertStringStartsWith(string $prefix, string $string, string $message = '', ...$func_get_args): void
{
}
/**
 * Asserts that a string starts not with a given prefix.
 *
 * @param string $prefix
 * @param string $string
 *
 * @throws ExpectationFailedException
 * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see Assert::assertStringStartsNotWith
 */
function assertStringStartsNotWith($prefix, $string, string $message = '', ...$func_get_args): void
{
}
/**
 * @throws ExpectationFailedException
 * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see Assert::assertStringContainsString
 */
function assertStringContainsString(string $needle, string $haystack, string $message = '', ...$func_get_args): void
{
}
/**
 * @throws ExpectationFailedException
 * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see Assert::assertStringContainsStringIgnoringCase
 */
function assertStringContainsStringIgnoringCase(string $needle, string $haystack, string $message = '', ...$func_get_args): void
{
}
/**
 * @throws ExpectationFailedException
 * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see Assert::assertStringNotContainsString
 */
function assertStringNotContainsString(string $needle, string $haystack, string $message = '', ...$func_get_args): void
{
}
/**
 * @throws ExpectationFailedException
 * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see Assert::assertStringNotContainsStringIgnoringCase
 */
function assertStringNotContainsStringIgnoringCase(string $needle, string $haystack, string $message = '', ...$func_get_args): void
{
}
/**
 * Asserts that a string ends with a given suffix.
 *
 * @throws ExpectationFailedException
 * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see Assert::assertStringEndsWith
 */
function assertStringEndsWith(string $suffix, string $string, string $message = '', ...$func_get_args): void
{
}
/**
 * Asserts that a string ends not with a given suffix.
 *
 * @throws ExpectationFailedException
 * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see Assert::assertStringEndsNotWith
 */
function assertStringEndsNotWith(string $suffix, string $string, string $message = '', ...$func_get_args): void
{
}
/**
 * Asserts that two XML files are equal.
 *
 * @throws ExpectationFailedException
 * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
 * @throws Exception
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see Assert::assertXmlFileEqualsXmlFile
 */
function assertXmlFileEqualsXmlFile(string $expectedFile, string $actualFile, string $message = '', ...$func_get_args): void
{
}
/**
 * Asserts that two XML files are not equal.
 *
 * @throws ExpectationFailedException
 * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
 * @throws \PHPUnit\Util\Exception
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see Assert::assertXmlFileNotEqualsXmlFile
 */
function assertXmlFileNotEqualsXmlFile(string $expectedFile, string $actualFile, string $message = '', ...$func_get_args): void
{
}
/**
 * Asserts that two XML documents are equal.
 *
 * @param \DOMDocument|string $actualXml
 *
 * @throws ExpectationFailedException
 * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
 * @throws \PHPUnit\Util\Xml\Exception
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see Assert::assertXmlStringEqualsXmlFile
 */
function assertXmlStringEqualsXmlFile(string $expectedFile, $actualXml, string $message = '', ...$func_get_args): void
{
}
/**
 * Asserts that two XML documents are not equal.
 *
 * @param \DOMDocument|string $actualXml
 *
 * @throws ExpectationFailedException
 * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
 * @throws \PHPUnit\Util\Xml\Exception
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see Assert::assertXmlStringNotEqualsXmlFile
 */
function assertXmlStringNotEqualsXmlFile(string $expectedFile, $actualXml, string $message = '', ...$func_get_args): void
{
}
/**
 * Asserts that two XML documents are equal.
 *
 * @param \DOMDocument|string $expectedXml
 * @param \DOMDocument|string $actualXml
 *
 * @throws ExpectationFailedException
 * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
 * @throws \PHPUnit\Util\Xml\Exception
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see Assert::assertXmlStringEqualsXmlString
 */
function assertXmlStringEqualsXmlString($expectedXml, $actualXml, string $message = '', ...$func_get_args): void
{
}
/**
 * Asserts that two XML documents are not equal.
 *
 * @param \DOMDocument|string $expectedXml
 * @param \DOMDocument|string $actualXml
 *
 * @throws ExpectationFailedException
 * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
 * @throws \PHPUnit\Util\Xml\Exception
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see Assert::assertXmlStringNotEqualsXmlString
 */
function assertXmlStringNotEqualsXmlString($expectedXml, $actualXml, string $message = '', ...$func_get_args): void
{
}
/**
 * Asserts that a hierarchy of DOMElements matches.
 *
 * @throws AssertionFailedError
 * @throws ExpectationFailedException
 * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
 *
 * @codeCoverageIgnore
 *
 * @deprecated https://github.com/sebastianbergmann/phpunit/issues/4091
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see Assert::assertEqualXMLStructure
 */
function assertEqualXMLStructure(\DOMElement $expectedElement, \DOMElement $actualElement, bool $checkAttributes = false, string $message = '', ...$func_get_args): void
{
}
/**
 * Evaluates a PHPUnit\Framework\Constraint matcher object.
 *
 * @throws ExpectationFailedException
 * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see Assert::assertThat
 */
function assertThat($value, \PHPUnit\Framework\Constraint\Constraint $constraint, string $message = '', ...$func_get_args): void
{
}
/**
 * Asserts that a string is a valid JSON string.
 *
 * @throws ExpectationFailedException
 * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see Assert::assertJson
 */
function assertJson(string $actualJson, string $message = '', ...$func_get_args): void
{
}
/**
 * Asserts that two given JSON encoded objects or arrays are equal.
 *
 * @throws ExpectationFailedException
 * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see Assert::assertJsonStringEqualsJsonString
 */
function assertJsonStringEqualsJsonString(string $expectedJson, string $actualJson, string $message = '', ...$func_get_args): void
{
}
/**
 * Asserts that two given JSON encoded objects or arrays are not equal.
 *
 * @param string $expectedJson
 * @param string $actualJson
 *
 * @throws ExpectationFailedException
 * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see Assert::assertJsonStringNotEqualsJsonString
 */
function assertJsonStringNotEqualsJsonString($expectedJson, $actualJson, string $message = '', ...$func_get_args): void
{
}
/**
 * Asserts that the generated JSON encoded object and the content of the given file are equal.
 *
 * @throws ExpectationFailedException
 * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see Assert::assertJsonStringEqualsJsonFile
 */
function assertJsonStringEqualsJsonFile(string $expectedFile, string $actualJson, string $message = '', ...$func_get_args): void
{
}
/**
 * Asserts that the generated JSON encoded object and the content of the given file are not equal.
 *
 * @throws ExpectationFailedException
 * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see Assert::assertJsonStringNotEqualsJsonFile
 */
function assertJsonStringNotEqualsJsonFile(string $expectedFile, string $actualJson, string $message = '', ...$func_get_args): void
{
}
/**
 * Asserts that two JSON files are equal.
 *
 * @throws ExpectationFailedException
 * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see Assert::assertJsonFileEqualsJsonFile
 */
function assertJsonFileEqualsJsonFile(string $expectedFile, string $actualFile, string $message = '', ...$func_get_args): void
{
}
/**
 * Asserts that two JSON files are not equal.
 *
 * @throws ExpectationFailedException
 * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see Assert::assertJsonFileNotEqualsJsonFile
 */
function assertJsonFileNotEqualsJsonFile(string $expectedFile, string $actualFile, string $message = '', ...$func_get_args): void
{
}
function logicalAnd(...$func_get_args): \PHPUnit\Framework\Constraint\LogicalAnd
{
}
function logicalOr(...$func_get_args): \PHPUnit\Framework\Constraint\LogicalOr
{
}
function logicalNot(\PHPUnit\Framework\Constraint\Constraint $constraint, ...$func_get_args): \PHPUnit\Framework\Constraint\LogicalNot
{
}
function logicalXor(...$func_get_args): \PHPUnit\Framework\Constraint\LogicalXor
{
}
function anything(...$func_get_args): \PHPUnit\Framework\Constraint\IsAnything
{
}
function isTrue(...$func_get_args): \PHPUnit\Framework\Constraint\IsTrue
{
}
function callback(callable $callback, ...$func_get_args): \PHPUnit\Framework\Constraint\Callback
{
}
function isFalse(...$func_get_args): \PHPUnit\Framework\Constraint\IsFalse
{
}
function isJson(...$func_get_args): \PHPUnit\Framework\Constraint\IsJson
{
}
function isNull(...$func_get_args): \PHPUnit\Framework\Constraint\IsNull
{
}
function isFinite(...$func_get_args): \PHPUnit\Framework\Constraint\IsFinite
{
}
function isInfinite(...$func_get_args): \PHPUnit\Framework\Constraint\IsInfinite
{
}
function isNan(...$func_get_args): \PHPUnit\Framework\Constraint\IsNan
{
}
function containsEqual($value, ...$func_get_args): \PHPUnit\Framework\Constraint\TraversableContainsEqual
{
}
function containsIdentical($value, ...$func_get_args): \PHPUnit\Framework\Constraint\TraversableContainsIdentical
{
}
function containsOnly(string $type, ...$func_get_args): \PHPUnit\Framework\Constraint\TraversableContainsOnly
{
}
function containsOnlyInstancesOf(string $className, ...$func_get_args): \PHPUnit\Framework\Constraint\TraversableContainsOnly
{
}
function arrayHasKey($key, ...$func_get_args): \PHPUnit\Framework\Constraint\ArrayHasKey
{
}
function equalTo($value, ...$func_get_args): \PHPUnit\Framework\Constraint\IsEqual
{
}
function equalToCanonicalizing($value, ...$func_get_args): \PHPUnit\Framework\Constraint\IsEqualCanonicalizing
{
}
function equalToIgnoringCase($value, ...$func_get_args): \PHPUnit\Framework\Constraint\IsEqualIgnoringCase
{
}
function equalToWithDelta($value, float $delta, ...$func_get_args): \PHPUnit\Framework\Constraint\IsEqualWithDelta
{
}
function isEmpty(...$func_get_args): \PHPUnit\Framework\Constraint\IsEmpty
{
}
function isWritable(...$func_get_args): \PHPUnit\Framework\Constraint\IsWritable
{
}
function isReadable(...$func_get_args): \PHPUnit\Framework\Constraint\IsReadable
{
}
function directoryExists(...$func_get_args): \PHPUnit\Framework\Constraint\DirectoryExists
{
}
function fileExists(...$func_get_args): \PHPUnit\Framework\Constraint\FileExists
{
}
function greaterThan($value, ...$func_get_args): \PHPUnit\Framework\Constraint\GreaterThan
{
}
function greaterThanOrEqual($value, ...$func_get_args): \PHPUnit\Framework\Constraint\LogicalOr
{
}
function classHasAttribute(string $attributeName, ...$func_get_args): \PHPUnit\Framework\Constraint\ClassHasAttribute
{
}
function classHasStaticAttribute(string $attributeName, ...$func_get_args): \PHPUnit\Framework\Constraint\ClassHasStaticAttribute
{
}
function objectHasAttribute($attributeName, ...$func_get_args): \PHPUnit\Framework\Constraint\ObjectHasAttribute
{
}
function identicalTo($value, ...$func_get_args): \PHPUnit\Framework\Constraint\IsIdentical
{
}
function isInstanceOf(string $className, ...$func_get_args): \PHPUnit\Framework\Constraint\IsInstanceOf
{
}
function isType(string $type, ...$func_get_args): \PHPUnit\Framework\Constraint\IsType
{
}
function lessThan($value, ...$func_get_args): \PHPUnit\Framework\Constraint\LessThan
{
}
function lessThanOrEqual($value, ...$func_get_args): \PHPUnit\Framework\Constraint\LogicalOr
{
}
function matchesRegularExpression(string $pattern, ...$func_get_args): \PHPUnit\Framework\Constraint\RegularExpression
{
}
function matches(string $string, ...$func_get_args): \PHPUnit\Framework\Constraint\StringMatchesFormatDescription
{
}
function stringStartsWith($prefix, ...$func_get_args): \PHPUnit\Framework\Constraint\StringStartsWith
{
}
function stringContains(string $string, bool $case = true, ...$func_get_args): \PHPUnit\Framework\Constraint\StringContains
{
}
function stringEndsWith(string $suffix, ...$func_get_args): \PHPUnit\Framework\Constraint\StringEndsWith
{
}
function countOf(int $count, ...$func_get_args): \PHPUnit\Framework\Constraint\Count
{
}
function objectEquals(object $object, string $method = 'equals', ...$func_get_args): \PHPUnit\Framework\Constraint\ObjectEquals
{
}
/**
 * Returns a matcher that matches when the method is executed
 * zero or more times.
 */
function any(): \PHPUnit\Framework\MockObject\Rule\AnyInvokedCount
{
}
/**
 * Returns a matcher that matches when the method is never executed.
 */
function never(): \PHPUnit\Framework\MockObject\Rule\InvokedCount
{
}
/**
 * Returns a matcher that matches when the method is executed
 * at least N times.
 */
function atLeast(int $requiredInvocations): \PHPUnit\Framework\MockObject\Rule\InvokedAtLeastCount
{
}
/**
 * Returns a matcher that matches when the method is executed at least once.
 */
function atLeastOnce(): \PHPUnit\Framework\MockObject\Rule\InvokedAtLeastOnce
{
}
/**
 * Returns a matcher that matches when the method is executed exactly once.
 */
function once(): \PHPUnit\Framework\MockObject\Rule\InvokedCount
{
}
/**
 * Returns a matcher that matches when the method is executed
 * exactly $count times.
 */
function exactly(int $count): \PHPUnit\Framework\MockObject\Rule\InvokedCount
{
}
/**
 * Returns a matcher that matches when the method is executed
 * at most N times.
 */
function atMost(int $allowedInvocations): \PHPUnit\Framework\MockObject\Rule\InvokedAtMostCount
{
}
/**
 * Returns a matcher that matches when the method is executed
 * at the given index.
 */
function at(int $index): \PHPUnit\Framework\MockObject\Rule\InvokedAtIndex
{
}
function returnValue($value): \PHPUnit\Framework\MockObject\Stub\ReturnStub
{
}
function returnValueMap(array $valueMap): \PHPUnit\Framework\MockObject\Stub\ReturnValueMap
{
}
function returnArgument(int $argumentIndex): \PHPUnit\Framework\MockObject\Stub\ReturnArgument
{
}
function returnCallback($callback): \PHPUnit\Framework\MockObject\Stub\ReturnCallback
{
}
/**
 * Returns the current object.
 *
 * This method is useful when mocking a fluent interface.
 */
function returnSelf(): \PHPUnit\Framework\MockObject\Stub\ReturnSelf
{
}
function throwException(\Throwable $exception): \PHPUnit\Framework\MockObject\Stub\Exception
{
}
function onConsecutiveCalls(...$func_get_args): \PHPUnit\Framework\MockObject\Stub\ConsecutiveCalls
{
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class DataProviderTestSuite extends \PHPUnit\Framework\TestSuite
{
    /**
     * @param list<ExecutionOrderDependency> $dependencies
     */
    public function setDependencies(array $dependencies): void
    {
    }
    /**
     * @return list<ExecutionOrderDependency>
     */
    public function provides(): array
    {
    }
    /**
     * @return list<ExecutionOrderDependency>
     */
    public function requires(): array
    {
    }
    /**
     * Returns the size of the each test created using the data provider(s).
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     */
    public function getSize(): int
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class ErrorTestCase extends \PHPUnit\Framework\TestCase
{
    public function __construct(string $message = '')
    {
    }
    public function getMessage(): string
    {
    }
    /**
     * Returns a string representation of the test case.
     */
    public function toString(): string
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class ActualValueIsNotAnObjectException extends \PHPUnit\Framework\Exception
{
    public function __construct()
    {
    }
    public function __toString(): string
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
class AssertionFailedError extends \PHPUnit\Framework\Exception implements \PHPUnit\Framework\SelfDescribing
{
    /**
     * Wrapper for getMessage() which is declared as final.
     */
    public function toString(): string
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
class CodeCoverageException extends \PHPUnit\Framework\Exception
{
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class ComparisonMethodDoesNotAcceptParameterTypeException extends \PHPUnit\Framework\Exception
{
    public function __construct(string $className, string $methodName, string $type)
    {
    }
    public function __toString(): string
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class ComparisonMethodDoesNotDeclareBoolReturnTypeException extends \PHPUnit\Framework\Exception
{
    public function __construct(string $className, string $methodName)
    {
    }
    public function __toString(): string
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class ComparisonMethodDoesNotDeclareExactlyOneParameterException extends \PHPUnit\Framework\Exception
{
    public function __construct(string $className, string $methodName)
    {
    }
    public function __toString(): string
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class ComparisonMethodDoesNotDeclareParameterTypeException extends \PHPUnit\Framework\Exception
{
    public function __construct(string $className, string $methodName)
    {
    }
    public function __toString(): string
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class ComparisonMethodDoesNotExistException extends \PHPUnit\Framework\Exception
{
    public function __construct(string $className, string $methodName)
    {
    }
    public function __toString(): string
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class CoveredCodeNotExecutedException extends \PHPUnit\Framework\RiskyTestError
{
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class Error extends \PHPUnit\Framework\Exception implements \PHPUnit\Framework\SelfDescribing
{
    /**
     * Wrapper for getMessage() which is declared as final.
     */
    public function toString(): string
    {
    }
}
/**
 * Base class for all PHPUnit Framework exceptions.
 *
 * Ensures that exceptions thrown during a test run do not leave stray
 * references behind.
 *
 * Every Exception contains a stack trace. Each stack frame contains the 'args'
 * of the called function. The function arguments can contain references to
 * instantiated objects. The references prevent the objects from being
 * destructed (until test results are eventually printed), so memory cannot be
 * freed up.
 *
 * With enabled process isolation, test results are serialized in the child
 * process and unserialized in the parent process. The stack trace of Exceptions
 * may contain objects that cannot be serialized or unserialized (e.g., PDO
 * connections). Unserializing user-space objects from the child process into
 * the parent would break the intended encapsulation of process isolation.
 *
 * @see http://fabien.potencier.org/article/9/php-serialization-stack-traces-and-exceptions
 *
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
class Exception extends \RuntimeException implements \PHPUnit\Exception
{
    /**
     * @var array
     */
    protected $serializableTrace;
    public function __construct($message = '', $code = 0, ?\Throwable $previous = null)
    {
    }
    public function __toString(): string
    {
    }
    public function __sleep(): array
    {
    }
    /**
     * Returns the serializable trace (without 'args').
     */
    public function getSerializableTrace(): array
    {
    }
}
/**
 * Exception for expectations which failed their check.
 *
 * The exception contains the error message and optionally a
 * SebastianBergmann\Comparator\ComparisonFailure which is used to
 * generate diff output of the failed expectations.
 *
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class ExpectationFailedException extends \PHPUnit\Framework\AssertionFailedError
{
    public function __construct(string $message, ?\SebastianBergmann\Comparator\ComparisonFailure $comparisonFailure = null, ?\Exception $previous = null)
    {
    }
    public function getComparisonFailure(): ?\SebastianBergmann\Comparator\ComparisonFailure
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class IncompleteTestError extends \PHPUnit\Framework\AssertionFailedError implements \PHPUnit\Framework\IncompleteTest
{
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class InvalidArgumentException extends \PHPUnit\Framework\Exception
{
    public static function create(int $argument, string $type): self
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class InvalidCoversTargetException extends \PHPUnit\Framework\CodeCoverageException
{
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class InvalidDataProviderException extends \PHPUnit\Framework\Exception
{
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class MissingCoversAnnotationException extends \PHPUnit\Framework\RiskyTestError
{
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class NoChildTestSuiteException extends \PHPUnit\Framework\Exception
{
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class OutputError extends \PHPUnit\Framework\AssertionFailedError
{
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class PHPTAssertionFailedError extends \PHPUnit\Framework\SyntheticError
{
    public function __construct(string $message, int $code, string $file, int $line, array $trace, string $diff)
    {
    }
    public function getDiff(): string
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
class RiskyTestError extends \PHPUnit\Framework\AssertionFailedError
{
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class SkippedTestError extends \PHPUnit\Framework\AssertionFailedError implements \PHPUnit\Framework\SkippedTest
{
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class SkippedTestSuiteError extends \PHPUnit\Framework\AssertionFailedError implements \PHPUnit\Framework\SkippedTest
{
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
class SyntheticError extends \PHPUnit\Framework\AssertionFailedError
{
    /**
     * The synthetic file.
     *
     * @var string
     */
    protected $syntheticFile = '';
    /**
     * The synthetic line number.
     *
     * @var int
     */
    protected $syntheticLine = 0;
    /**
     * The synthetic trace.
     *
     * @var array
     */
    protected $syntheticTrace = [];
    public function __construct(string $message, int $code, string $file, int $line, array $trace)
    {
    }
    public function getSyntheticFile(): string
    {
    }
    public function getSyntheticLine(): int
    {
    }
    public function getSyntheticTrace(): array
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class SyntheticSkippedError extends \PHPUnit\Framework\SyntheticError implements \PHPUnit\Framework\SkippedTest
{
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class UnintentionallyCoveredCodeError extends \PHPUnit\Framework\RiskyTestError
{
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class Warning extends \PHPUnit\Framework\Exception implements \PHPUnit\Framework\SelfDescribing
{
    /**
     * Wrapper for getMessage() which is declared as final.
     */
    public function toString(): string
    {
    }
}
/**
 * Wraps Exceptions thrown by code under test.
 *
 * Re-instantiates Exceptions thrown by user-space code to retain their original
 * class names, properties, and stack traces (but without arguments).
 *
 * Unlike PHPUnit\Framework\Exception, the complete stack of previous Exceptions
 * is processed.
 *
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class ExceptionWrapper extends \PHPUnit\Framework\Exception
{
    public function __construct(\Throwable $t)
    {
    }
    public function __toString(): string
    {
    }
    public function getClassName(): string
    {
    }
    public function getPreviousWrapped(): ?self
    {
    }
    public function setClassName(string $className): void
    {
    }
    public function setOriginalException(\Throwable $t): void
    {
    }
    public function getOriginalException(): ?\Throwable
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class ExecutionOrderDependency
{
    public static function createFromDependsAnnotation(string $className, string $annotation): self
    {
    }
    /**
     * @phan-param list<ExecutionOrderDependency> $dependencies
     *
     * @phan-return list<ExecutionOrderDependency>
     */
    public static function filterInvalid(array $dependencies): array
    {
    }
    /**
     * @phan-param list<ExecutionOrderDependency> $existing
     * @phan-param list<ExecutionOrderDependency> $additional
     *
     * @phan-return list<ExecutionOrderDependency>
     */
    public static function mergeUnique(array $existing, array $additional): array
    {
    }
    /**
     * @phan-param list<ExecutionOrderDependency> $left
     * @phan-param list<ExecutionOrderDependency> $right
     *
     * @phan-return list<ExecutionOrderDependency>
     */
    public static function diff(array $left, array $right): array
    {
    }
    public function __construct(string $classOrCallableName, ?string $methodName = null, ?string $option = null)
    {
    }
    public function __toString(): string
    {
    }
    public function isValid(): bool
    {
    }
    public function useShallowClone(): bool
    {
    }
    public function useDeepClone(): bool
    {
    }
    public function targetIsClass(): bool
    {
    }
    public function getTarget(): string
    {
    }
    public function getTargetClassName(): string
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
interface IncompleteTest extends \Throwable
{
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class IncompleteTestCase extends \PHPUnit\Framework\TestCase
{
    public function __construct(string $className, string $methodName, string $message = '')
    {
    }
    public function getMessage(): string
    {
    }
    /**
     * Returns a string representation of the test case.
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     */
    public function toString(): string
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class InvalidParameterGroupException extends \PHPUnit\Framework\Exception
{
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
interface Reorderable
{
    public function sortId(): string;
    /**
     * @return list<ExecutionOrderDependency>
     */
    public function provides(): array;
    /**
     * @return list<ExecutionOrderDependency>
     */
    public function requires(): array;
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
interface SelfDescribing
{
    /**
     * Returns a string representation of the object.
     */
    public function toString(): string;
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
interface SkippedTest extends \Throwable
{
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class SkippedTestCase extends \PHPUnit\Framework\TestCase
{
    public function __construct(string $className, string $methodName, string $message = '')
    {
    }
    public function getMessage(): string
    {
    }
    /**
     * Returns a string representation of the test case.
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     */
    public function toString(): string
    {
    }
}
/**
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 */
interface Test extends \Countable
{
    /**
     * Runs a test and collects its result in a TestResult instance.
     */
    public function run(?\PHPUnit\Framework\TestResult $result = null): \PHPUnit\Framework\TestResult;
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class TestBuilder
{
    public function build(\ReflectionClass $theClass, string $methodName): \PHPUnit\Framework\Test
    {
    }
}
/**
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 */
abstract class TestCase extends \PHPUnit\Framework\Assert implements \PHPUnit\Framework\Reorderable, \PHPUnit\Framework\SelfDescribing, \PHPUnit\Framework\Test
{
    /**
     * @var ?bool
     */
    protected $backupGlobals;
    /**
     * @var string[]
     */
    protected $backupGlobalsExcludeList = [];
    /**
     * @var string[]
     *
     * @deprecated Use $backupGlobalsExcludeList instead
     */
    protected $backupGlobalsBlacklist = [];
    /**
     * @var ?bool
     */
    protected $backupStaticAttributes;
    /**
     * @var array<string,array<int,string>>
     */
    protected $backupStaticAttributesExcludeList = [];
    /**
     * @var array<string,array<int,string>>
     *
     * @deprecated Use $backupStaticAttributesExcludeList instead
     */
    protected $backupStaticAttributesBlacklist = [];
    /**
     * @var ?bool
     */
    protected $runTestInSeparateProcess;
    /**
     * @var bool
     */
    protected $preserveGlobalState = true;
    /**
     * @var list<ExecutionOrderDependency>
     */
    protected $providedTests = [];
    /**
     * Returns a matcher that matches when the method is executed
     * zero or more times.
     */
    public static function any(): \PHPUnit\Framework\MockObject\Rule\AnyInvokedCount
    {
    }
    /**
     * Returns a matcher that matches when the method is never executed.
     */
    public static function never(): \PHPUnit\Framework\MockObject\Rule\InvokedCount
    {
    }
    /**
     * Returns a matcher that matches when the method is executed
     * at least N times.
     */
    public static function atLeast(int $requiredInvocations): \PHPUnit\Framework\MockObject\Rule\InvokedAtLeastCount
    {
    }
    /**
     * Returns a matcher that matches when the method is executed at least once.
     */
    public static function atLeastOnce(): \PHPUnit\Framework\MockObject\Rule\InvokedAtLeastOnce
    {
    }
    /**
     * Returns a matcher that matches when the method is executed exactly once.
     */
    public static function once(): \PHPUnit\Framework\MockObject\Rule\InvokedCount
    {
    }
    /**
     * Returns a matcher that matches when the method is executed
     * exactly $count times.
     */
    public static function exactly(int $count): \PHPUnit\Framework\MockObject\Rule\InvokedCount
    {
    }
    /**
     * Returns a matcher that matches when the method is executed
     * at most N times.
     */
    public static function atMost(int $allowedInvocations): \PHPUnit\Framework\MockObject\Rule\InvokedAtMostCount
    {
    }
    /**
     * Returns a matcher that matches when the method is executed
     * at the given index.
     *
     * @deprecated https://github.com/sebastianbergmann/phpunit/issues/4297
     *
     * @codeCoverageIgnore
     */
    public static function at(int $index): \PHPUnit\Framework\MockObject\Rule\InvokedAtIndex
    {
    }
    public static function returnValue($value): \PHPUnit\Framework\MockObject\Stub\ReturnStub
    {
    }
    public static function returnValueMap(array $valueMap): \PHPUnit\Framework\MockObject\Stub\ReturnValueMap
    {
    }
    public static function returnArgument(int $argumentIndex): \PHPUnit\Framework\MockObject\Stub\ReturnArgument
    {
    }
    public static function returnCallback($callback): \PHPUnit\Framework\MockObject\Stub\ReturnCallback
    {
    }
    /**
     * Returns the current object.
     *
     * This method is useful when mocking a fluent interface.
     */
    public static function returnSelf(): \PHPUnit\Framework\MockObject\Stub\ReturnSelf
    {
    }
    public static function throwException(\Throwable $exception): \PHPUnit\Framework\MockObject\Stub\Exception
    {
    }
    public static function onConsecutiveCalls(...$args): \PHPUnit\Framework\MockObject\Stub\ConsecutiveCalls
    {
    }
    /**
     * @param int|string $dataName
     *
     * @internal This method is not covered by the backward compatibility promise for PHPUnit
     */
    public function __construct(?string $name = null, array $data = [], $dataName = '')
    {
    }
    /**
     * This method is called before the first test of this test class is run.
     */
    public static function setUpBeforeClass(): void
    {
    }
    /**
     * This method is called after the last test of this test class is run.
     */
    public static function tearDownAfterClass(): void
    {
    }
    /**
     * This method is called before each test.
     */
    protected function setUp(): void
    {
    }
    /**
     * Performs assertions shared by all tests of a test case.
     *
     * This method is called between setUp() and test.
     */
    protected function assertPreConditions(): void
    {
    }
    /**
     * Performs assertions shared by all tests of a test case.
     *
     * This method is called between test and tearDown().
     */
    protected function assertPostConditions(): void
    {
    }
    /**
     * This method is called after each test.
     */
    protected function tearDown(): void
    {
    }
    /**
     * Returns a string representation of the test case.
     *
     * @throws Exception
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     */
    public function toString(): string
    {
    }
    public function count(): int
    {
    }
    public function getActualOutputForAssertion(): string
    {
    }
    public function expectOutputRegex(string $expectedRegex): void
    {
    }
    public function expectOutputString(string $expectedString): void
    {
    }
    /**
     * @phan-param class-string<\Throwable> $exception
     */
    public function expectException(string $exception): void
    {
    }
    /**
     * @param int|string $code
     */
    public function expectExceptionCode($code): void
    {
    }
    public function expectExceptionMessage(string $message): void
    {
    }
    public function expectExceptionMessageMatches(string $regularExpression): void
    {
    }
    /**
     * Sets up an expectation for an exception to be raised by the code under test.
     * Information for expected exception class, expected exception message, and
     * expected exception code are retrieved from a given Exception object.
     */
    public function expectExceptionObject(\Exception $exception): void
    {
    }
    public function expectNotToPerformAssertions(): void
    {
    }
    /**
     * @deprecated https://github.com/sebastianbergmann/phpunit/issues/5062
     */
    public function expectDeprecation(): void
    {
    }
    /**
     * @deprecated https://github.com/sebastianbergmann/phpunit/issues/5062
     */
    public function expectDeprecationMessage(string $message): void
    {
    }
    /**
     * @deprecated https://github.com/sebastianbergmann/phpunit/issues/5062
     */
    public function expectDeprecationMessageMatches(string $regularExpression): void
    {
    }
    /**
     * @deprecated https://github.com/sebastianbergmann/phpunit/issues/5062
     */
    public function expectNotice(): void
    {
    }
    /**
     * @deprecated https://github.com/sebastianbergmann/phpunit/issues/5062
     */
    public function expectNoticeMessage(string $message): void
    {
    }
    /**
     * @deprecated https://github.com/sebastianbergmann/phpunit/issues/5062
     */
    public function expectNoticeMessageMatches(string $regularExpression): void
    {
    }
    /**
     * @deprecated https://github.com/sebastianbergmann/phpunit/issues/5062
     */
    public function expectWarning(): void
    {
    }
    /**
     * @deprecated https://github.com/sebastianbergmann/phpunit/issues/5062
     */
    public function expectWarningMessage(string $message): void
    {
    }
    /**
     * @deprecated https://github.com/sebastianbergmann/phpunit/issues/5062
     */
    public function expectWarningMessageMatches(string $regularExpression): void
    {
    }
    /**
     * @deprecated https://github.com/sebastianbergmann/phpunit/issues/5062
     */
    public function expectError(): void
    {
    }
    /**
     * @deprecated https://github.com/sebastianbergmann/phpunit/issues/5062
     */
    public function expectErrorMessage(string $message): void
    {
    }
    /**
     * @deprecated https://github.com/sebastianbergmann/phpunit/issues/5062
     */
    public function expectErrorMessageMatches(string $regularExpression): void
    {
    }
    public function getStatus(): int
    {
    }
    public function markAsRisky(): void
    {
    }
    public function getStatusMessage(): string
    {
    }
    public function hasFailed(): bool
    {
    }
    /**
     * Runs the test case and collects the results in a TestResult object.
     * If no TestResult object is passed a new one will be created.
     *
     * @throws \SebastianBergmann\CodeCoverage\InvalidArgumentException
     * @throws CodeCoverageException
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     * @throws \SebastianBergmann\CodeCoverage\UnintentionallyCoveredCodeException
     * @throws \PHPUnit\Util\Exception
     */
    public function run(?\PHPUnit\Framework\TestResult $result = null): \PHPUnit\Framework\TestResult
    {
    }
    /**
     * Returns a builder object to create mock objects using a fluent interface.
     *
     * @phan-template RealInstanceType of object
     *
     * @phan-param class-string<RealInstanceType> $className
     *
     * @phan-return MockObject\MockBuilder<RealInstanceType>
     */
    public function getMockBuilder(string $className): \PHPUnit\Framework\MockObject\MockBuilder
    {
    }
    public function registerComparator(\SebastianBergmann\Comparator\Comparator $comparator): void
    {
    }
    /**
     * @return string[]
     *
     * @internal This method is not covered by the backward compatibility promise for PHPUnit
     */
    public function doubledTypes(): array
    {
    }
    /**
     * @internal This method is not covered by the backward compatibility promise for PHPUnit
     */
    public function getGroups(): array
    {
    }
    /**
     * @internal This method is not covered by the backward compatibility promise for PHPUnit
     */
    public function setGroups(array $groups): void
    {
    }
    /**
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     *
     * @internal This method is not covered by the backward compatibility promise for PHPUnit
     */
    public function getName(bool $withDataSet = true): string
    {
    }
    /**
     * Returns the size of the test.
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     *
     * @internal This method is not covered by the backward compatibility promise for PHPUnit
     */
    public function getSize(): int
    {
    }
    /**
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     *
     * @internal This method is not covered by the backward compatibility promise for PHPUnit
     */
    public function hasSize(): bool
    {
    }
    /**
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     *
     * @internal This method is not covered by the backward compatibility promise for PHPUnit
     */
    public function isSmall(): bool
    {
    }
    /**
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     *
     * @internal This method is not covered by the backward compatibility promise for PHPUnit
     */
    public function isMedium(): bool
    {
    }
    /**
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     *
     * @internal This method is not covered by the backward compatibility promise for PHPUnit
     */
    public function isLarge(): bool
    {
    }
    /**
     * @internal This method is not covered by the backward compatibility promise for PHPUnit
     */
    public function getActualOutput(): string
    {
    }
    /**
     * @internal This method is not covered by the backward compatibility promise for PHPUnit
     */
    public function hasOutput(): bool
    {
    }
    /**
     * @internal This method is not covered by the backward compatibility promise for PHPUnit
     */
    public function doesNotPerformAssertions(): bool
    {
    }
    /**
     * @internal This method is not covered by the backward compatibility promise for PHPUnit
     */
    public function hasExpectationOnOutput(): bool
    {
    }
    /**
     * @internal This method is not covered by the backward compatibility promise for PHPUnit
     */
    public function getExpectedException(): ?string
    {
    }
    /**
     * @return null|int|string
     *
     * @internal This method is not covered by the backward compatibility promise for PHPUnit
     */
    public function getExpectedExceptionCode()
    {
    }
    /**
     * @internal This method is not covered by the backward compatibility promise for PHPUnit
     */
    public function getExpectedExceptionMessage(): ?string
    {
    }
    /**
     * @internal This method is not covered by the backward compatibility promise for PHPUnit
     */
    public function getExpectedExceptionMessageRegExp(): ?string
    {
    }
    /**
     * @internal This method is not covered by the backward compatibility promise for PHPUnit
     */
    public function setRegisterMockObjectsFromTestArgumentsRecursively(bool $flag): void
    {
    }
    /**
     * @throws \Throwable
     *
     * @internal This method is not covered by the backward compatibility promise for PHPUnit
     */
    public function runBare(): void
    {
    }
    /**
     * @internal This method is not covered by the backward compatibility promise for PHPUnit
     */
    public function setName(string $name): void
    {
    }
    /**
     * @param list<ExecutionOrderDependency> $dependencies
     *
     * @internal This method is not covered by the backward compatibility promise for PHPUnit
     */
    public function setDependencies(array $dependencies): void
    {
    }
    /**
     * @internal This method is not covered by the backward compatibility promise for PHPUnit
     */
    public function setDependencyInput(array $dependencyInput): void
    {
    }
    /**
     * @internal This method is not covered by the backward compatibility promise for PHPUnit
     */
    public function setBeStrictAboutChangesToGlobalState(?bool $beStrictAboutChangesToGlobalState): void
    {
    }
    /**
     * @internal This method is not covered by the backward compatibility promise for PHPUnit
     */
    public function setBackupGlobals(?bool $backupGlobals): void
    {
    }
    /**
     * @internal This method is not covered by the backward compatibility promise for PHPUnit
     */
    public function setBackupStaticAttributes(?bool $backupStaticAttributes): void
    {
    }
    /**
     * @internal This method is not covered by the backward compatibility promise for PHPUnit
     */
    public function setRunTestInSeparateProcess(bool $runTestInSeparateProcess): void
    {
    }
    /**
     * @internal This method is not covered by the backward compatibility promise for PHPUnit
     */
    public function setRunClassInSeparateProcess(bool $runClassInSeparateProcess): void
    {
    }
    /**
     * @internal This method is not covered by the backward compatibility promise for PHPUnit
     */
    public function setPreserveGlobalState(bool $preserveGlobalState): void
    {
    }
    /**
     * @internal This method is not covered by the backward compatibility promise for PHPUnit
     */
    public function setInIsolation(bool $inIsolation): void
    {
    }
    /**
     * @internal This method is not covered by the backward compatibility promise for PHPUnit
     */
    public function isInIsolation(): bool
    {
    }
    /**
     * @internal This method is not covered by the backward compatibility promise for PHPUnit
     */
    public function getResult()
    {
    }
    /**
     * @internal This method is not covered by the backward compatibility promise for PHPUnit
     */
    public function setResult($result): void
    {
    }
    /**
     * @internal This method is not covered by the backward compatibility promise for PHPUnit
     */
    public function setOutputCallback(callable $callback): void
    {
    }
    /**
     * @internal This method is not covered by the backward compatibility promise for PHPUnit
     */
    public function getTestResultObject(): ?\PHPUnit\Framework\TestResult
    {
    }
    /**
     * @internal This method is not covered by the backward compatibility promise for PHPUnit
     */
    public function setTestResultObject(\PHPUnit\Framework\TestResult $result): void
    {
    }
    /**
     * @internal This method is not covered by the backward compatibility promise for PHPUnit
     */
    public function registerMockObject(\PHPUnit\Framework\MockObject\MockObject $mockObject): void
    {
    }
    /**
     * @internal This method is not covered by the backward compatibility promise for PHPUnit
     */
    public function addToAssertionCount(int $count): void
    {
    }
    /**
     * Returns the number of assertions performed by this test.
     *
     * @internal This method is not covered by the backward compatibility promise for PHPUnit
     */
    public function getNumAssertions(): int
    {
    }
    /**
     * @internal This method is not covered by the backward compatibility promise for PHPUnit
     */
    public function usesDataProvider(): bool
    {
    }
    /**
     * @return int|string
     *
     * @internal This method is not covered by the backward compatibility promise for PHPUnit
     */
    public function dataName()
    {
    }
    /**
     * @internal This method is not covered by the backward compatibility promise for PHPUnit
     */
    public function getDataSetAsString(bool $includeData = true): string
    {
    }
    /**
     * Gets the data set of a TestCase.
     *
     * @internal This method is not covered by the backward compatibility promise for PHPUnit
     */
    public function getProvidedData(): array
    {
    }
    /**
     * @internal This method is not covered by the backward compatibility promise for PHPUnit
     */
    public function addWarning(string $warning): void
    {
    }
    public function sortId(): string
    {
    }
    /**
     * Returns the normalized test name as class::method.
     *
     * @return list<ExecutionOrderDependency>
     */
    public function provides(): array
    {
    }
    /**
     * Returns a list of normalized dependency names, class::method.
     *
     * This list can differ from the raw dependencies as the resolver has
     * no need for the [!][shallow]clone prefix that is filtered out
     * during normalization.
     *
     * @return list<ExecutionOrderDependency>
     */
    public function requires(): array
    {
    }
    /**
     * Override to run the test and assert its state.
     *
     * @throws \SebastianBergmann\ObjectEnumerator\InvalidArgumentException
     * @throws AssertionFailedError
     * @throws Exception
     * @throws ExpectationFailedException
     * @throws \Throwable
     */
    protected function runTest()
    {
    }
    /**
     * This method is a wrapper for the ini_set() function that automatically
     * resets the modified php.ini setting to its original value after the
     * test is run.
     *
     * @throws Exception
     */
    protected function iniSet(string $varName, string $newValue): void
    {
    }
    /**
     * This method is a wrapper for the setlocale() function that automatically
     * resets the locale to its original value after the test is run.
     *
     * @throws Exception
     */
    protected function setLocale(...$args): void
    {
    }
    /**
     * Makes configurable stub for the specified class.
     *
     * @phan-template RealInstanceType of object
     *
     * @phan-param    class-string<RealInstanceType> $originalClassName
     *
     * @phan-return   MockObject\Stub&RealInstanceType
     */
    protected function createStub(string $originalClassName): \PHPUnit\Framework\MockObject\Stub
    {
    }
    /**
     * Returns a mock object for the specified class.
     *
     * @phan-template RealInstanceType of object
     *
     * @phan-param class-string<RealInstanceType> $originalClassName
     *
     * @phan-return MockObject\MockObject&RealInstanceType
     */
    protected function createMock(string $originalClassName): \PHPUnit\Framework\MockObject\MockObject
    {
    }
    /**
     * Returns a configured mock object for the specified class.
     *
     * @phan-template RealInstanceType of object
     *
     * @phan-param class-string<RealInstanceType> $originalClassName
     *
     * @phan-return MockObject\MockObject&RealInstanceType
     */
    protected function createConfiguredMock(string $originalClassName, array $configuration): \PHPUnit\Framework\MockObject\MockObject
    {
    }
    /**
     * Returns a partial mock object for the specified class.
     *
     * @param string[] $methods
     *
     * @phan-template RealInstanceType of object
     *
     * @phan-param class-string<RealInstanceType> $originalClassName
     *
     * @phan-return MockObject\MockObject&RealInstanceType
     */
    protected function createPartialMock(string $originalClassName, array $methods): \PHPUnit\Framework\MockObject\MockObject
    {
    }
    /**
     * Returns a test proxy for the specified class.
     *
     * @phan-template RealInstanceType of object
     *
     * @phan-param class-string<RealInstanceType> $originalClassName
     *
     * @phan-return MockObject\MockObject&RealInstanceType
     */
    protected function createTestProxy(string $originalClassName, array $constructorArguments = []): \PHPUnit\Framework\MockObject\MockObject
    {
    }
    /**
     * Mocks the specified class and returns the name of the mocked class.
     *
     * @param null|array $methods $methods
     *
     * @phan-template RealInstanceType of object
     *
     * @phan-param class-string<RealInstanceType>|string $originalClassName
     *
     * @phan-return class-string<MockObject\MockObject&RealInstanceType>
     *
     * @deprecated
     */
    protected function getMockClass(string $originalClassName, $methods = [], array $arguments = [], string $mockClassName = '', bool $callOriginalConstructor = false, bool $callOriginalClone = true, bool $callAutoload = true, bool $cloneArguments = false): string
    {
    }
    /**
     * Returns a mock object for the specified abstract class with all abstract
     * methods of the class mocked. Concrete methods are not mocked by default.
     * To mock concrete methods, use the 7th parameter ($mockedMethods).
     *
     * @phan-template RealInstanceType of object
     *
     * @phan-param class-string<RealInstanceType> $originalClassName
     *
     * @phan-return MockObject\MockObject&RealInstanceType
     */
    protected function getMockForAbstractClass(string $originalClassName, array $arguments = [], string $mockClassName = '', bool $callOriginalConstructor = true, bool $callOriginalClone = true, bool $callAutoload = true, array $mockedMethods = [], bool $cloneArguments = false): \PHPUnit\Framework\MockObject\MockObject
    {
    }
    /**
     * Returns a mock object based on the given WSDL file.
     *
     * @phan-template RealInstanceType of object
     *
     * @phan-param class-string<RealInstanceType>|string $originalClassName
     *
     * @phan-return MockObject\MockObject&RealInstanceType
     */
    protected function getMockFromWsdl(string $wsdlFile, string $originalClassName = '', string $mockClassName = '', array $methods = [], bool $callOriginalConstructor = true, array $options = []): \PHPUnit\Framework\MockObject\MockObject
    {
    }
    /**
     * Returns a mock object for the specified trait with all abstract methods
     * of the trait mocked. Concrete methods to mock can be specified with the
     * `$mockedMethods` parameter.
     *
     * @phan-param trait-string $traitName
     */
    protected function getMockForTrait(string $traitName, array $arguments = [], string $mockClassName = '', bool $callOriginalConstructor = true, bool $callOriginalClone = true, bool $callAutoload = true, array $mockedMethods = [], bool $cloneArguments = false): \PHPUnit\Framework\MockObject\MockObject
    {
    }
    /**
     * Returns an object for the specified trait.
     *
     * @phan-param trait-string $traitName
     */
    protected function getObjectForTrait(string $traitName, array $arguments = [], string $traitClassName = '', bool $callOriginalConstructor = true, bool $callOriginalClone = true, bool $callAutoload = true): object
    {
    }
    /**
     * @throws \Prophecy\Exception\Doubler\ClassNotFoundException
     * @throws \Prophecy\Exception\Doubler\DoubleException
     * @throws \Prophecy\Exception\Doubler\InterfaceNotFoundException
     *
     * @phan-param class-string|null $classOrInterface
     *
     * @deprecated https://github.com/sebastianbergmann/phpunit/issues/4141
     */
    protected function prophesize(?string $classOrInterface = null): \Prophecy\Prophecy\ObjectProphecy
    {
    }
    /**
     * Creates a default TestResult object.
     *
     * @internal This method is not covered by the backward compatibility promise for PHPUnit
     */
    protected function createResult(): \PHPUnit\Framework\TestResult
    {
    }
    /**
     * This method is called when a test method did not execute successfully.
     *
     * @throws \Throwable
     */
    protected function onNotSuccessfulTest(\Throwable $t): void
    {
    }
    protected function recordDoubledType(string $originalClassName): void
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class TestFailure
{
    /**
     * Returns a description for an exception.
     */
    public static function exceptionToString(\Throwable $e): string
    {
    }
    /**
     * Constructs a TestFailure with the given test and exception.
     */
    public function __construct(\PHPUnit\Framework\Test $failedTest, \Throwable $t)
    {
    }
    /**
     * Returns a short description of the failure.
     */
    public function toString(): string
    {
    }
    /**
     * Returns a description for the thrown exception.
     */
    public function getExceptionAsString(): string
    {
    }
    /**
     * Returns the name of the failing test (including data set, if any).
     */
    public function getTestName(): string
    {
    }
    /**
     * Returns the failing test.
     *
     * Note: The test object is not set when the test is executed in process
     * isolation.
     *
     * @see Exception
     */
    public function failedTest(): ?\PHPUnit\Framework\Test
    {
    }
    /**
     * Gets the thrown exception.
     */
    public function thrownException(): \Throwable
    {
    }
    /**
     * Returns the exception's message.
     */
    public function exceptionMessage(): string
    {
    }
    /**
     * Returns true if the thrown exception
     * is of type AssertionFailedError.
     */
    public function isFailure(): bool
    {
    }
}
/**
 * This interface, as well as the associated mechanism for extending PHPUnit,
 * will be removed in PHPUnit 10. There is no alternative available in this
 * version of PHPUnit.
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @deprecated
 * @see https://github.com/sebastianbergmann/phpunit/issues/4676
 */
interface TestListener
{
    public function addError(\PHPUnit\Framework\Test $test, \Throwable $t, float $time): void;
    public function addWarning(\PHPUnit\Framework\Test $test, \PHPUnit\Framework\Warning $e, float $time): void;
    public function addFailure(\PHPUnit\Framework\Test $test, \PHPUnit\Framework\AssertionFailedError $e, float $time): void;
    public function addIncompleteTest(\PHPUnit\Framework\Test $test, \Throwable $t, float $time): void;
    public function addRiskyTest(\PHPUnit\Framework\Test $test, \Throwable $t, float $time): void;
    public function addSkippedTest(\PHPUnit\Framework\Test $test, \Throwable $t, float $time): void;
    public function startTestSuite(\PHPUnit\Framework\TestSuite $suite): void;
    public function endTestSuite(\PHPUnit\Framework\TestSuite $suite): void;
    public function startTest(\PHPUnit\Framework\Test $test): void;
    public function endTest(\PHPUnit\Framework\Test $test, float $time): void;
}
/**
 * @deprecated The `TestListener` interface is deprecated
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 */
trait TestListenerDefaultImplementation
{
    public function addError(\PHPUnit\Framework\Test $test, \Throwable $t, float $time): void
    {
    }
    public function addWarning(\PHPUnit\Framework\Test $test, \PHPUnit\Framework\Warning $e, float $time): void
    {
    }
    public function addFailure(\PHPUnit\Framework\Test $test, \PHPUnit\Framework\AssertionFailedError $e, float $time): void
    {
    }
    public function addIncompleteTest(\PHPUnit\Framework\Test $test, \Throwable $t, float $time): void
    {
    }
    public function addRiskyTest(\PHPUnit\Framework\Test $test, \Throwable $t, float $time): void
    {
    }
    public function addSkippedTest(\PHPUnit\Framework\Test $test, \Throwable $t, float $time): void
    {
    }
    public function startTestSuite(\PHPUnit\Framework\TestSuite $suite): void
    {
    }
    public function endTestSuite(\PHPUnit\Framework\TestSuite $suite): void
    {
    }
    public function startTest(\PHPUnit\Framework\Test $test): void
    {
    }
    public function endTest(\PHPUnit\Framework\Test $test, float $time): void
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class TestResult implements \Countable
{
    /**
     * @deprecated Use the `TestHook` interfaces instead
     *
     * @codeCoverageIgnore
     *
     * Registers a TestListener.
     */
    public function addListener(\PHPUnit\Framework\TestListener $listener): void
    {
    }
    /**
     * @deprecated Use the `TestHook` interfaces instead
     *
     * @codeCoverageIgnore
     *
     * Unregisters a TestListener.
     */
    public function removeListener(\PHPUnit\Framework\TestListener $listener): void
    {
    }
    /**
     * @deprecated Use the `TestHook` interfaces instead
     *
     * @codeCoverageIgnore
     *
     * Flushes all flushable TestListeners.
     */
    public function flushListeners(): void
    {
    }
    /**
     * Adds an error to the list of errors.
     */
    public function addError(\PHPUnit\Framework\Test $test, \Throwable $t, float $time): void
    {
    }
    /**
     * Adds a warning to the list of warnings.
     * The passed in exception caused the warning.
     */
    public function addWarning(\PHPUnit\Framework\Test $test, \PHPUnit\Framework\Warning $e, float $time): void
    {
    }
    /**
     * Adds a failure to the list of failures.
     * The passed in exception caused the failure.
     */
    public function addFailure(\PHPUnit\Framework\Test $test, \PHPUnit\Framework\AssertionFailedError $e, float $time): void
    {
    }
    /**
     * Informs the result that a test suite will be started.
     */
    public function startTestSuite(\PHPUnit\Framework\TestSuite $suite): void
    {
    }
    /**
     * Informs the result that a test suite was completed.
     */
    public function endTestSuite(\PHPUnit\Framework\TestSuite $suite): void
    {
    }
    /**
     * Informs the result that a test will be started.
     */
    public function startTest(\PHPUnit\Framework\Test $test): void
    {
    }
    /**
     * Informs the result that a test was completed.
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     */
    public function endTest(\PHPUnit\Framework\Test $test, float $time): void
    {
    }
    /**
     * Returns true if no risky test occurred.
     */
    public function allHarmless(): bool
    {
    }
    /**
     * Gets the number of risky tests.
     */
    public function riskyCount(): int
    {
    }
    /**
     * Returns true if no incomplete test occurred.
     */
    public function allCompletelyImplemented(): bool
    {
    }
    /**
     * Gets the number of incomplete tests.
     */
    public function notImplementedCount(): int
    {
    }
    /**
     * Returns an array of TestFailure objects for the risky tests.
     *
     * @return TestFailure[]
     */
    public function risky(): array
    {
    }
    /**
     * Returns an array of TestFailure objects for the incomplete tests.
     *
     * @return TestFailure[]
     */
    public function notImplemented(): array
    {
    }
    /**
     * Returns true if no test has been skipped.
     */
    public function noneSkipped(): bool
    {
    }
    /**
     * Gets the number of skipped tests.
     */
    public function skippedCount(): int
    {
    }
    /**
     * Returns an array of TestFailure objects for the skipped tests.
     *
     * @return TestFailure[]
     */
    public function skipped(): array
    {
    }
    /**
     * Gets the number of detected errors.
     */
    public function errorCount(): int
    {
    }
    /**
     * Returns an array of TestFailure objects for the errors.
     *
     * @return TestFailure[]
     */
    public function errors(): array
    {
    }
    /**
     * Gets the number of detected failures.
     */
    public function failureCount(): int
    {
    }
    /**
     * Returns an array of TestFailure objects for the failures.
     *
     * @return TestFailure[]
     */
    public function failures(): array
    {
    }
    /**
     * Gets the number of detected warnings.
     */
    public function warningCount(): int
    {
    }
    /**
     * Returns an array of TestFailure objects for the warnings.
     *
     * @return TestFailure[]
     */
    public function warnings(): array
    {
    }
    /**
     * Returns the names of the tests that have passed.
     */
    public function passed(): array
    {
    }
    /**
     * Returns the names of the TestSuites that have passed.
     *
     * This enables @depends-annotations for TestClassName::class
     */
    public function passedClasses(): array
    {
    }
    /**
     * Returns whether code coverage information should be collected.
     */
    public function getCollectCodeCoverageInformation(): bool
    {
    }
    /**
     * Runs a TestCase.
     *
     * @throws \SebastianBergmann\CodeCoverage\InvalidArgumentException
     * @throws CodeCoverageException
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     * @throws \SebastianBergmann\CodeCoverage\UnintentionallyCoveredCodeException
     */
    public function run(\PHPUnit\Framework\Test $test): void
    {
    }
    /**
     * Gets the number of run tests.
     */
    public function count(): int
    {
    }
    /**
     * Checks whether the test run should stop.
     */
    public function shouldStop(): bool
    {
    }
    /**
     * Marks that the test run should stop.
     */
    public function stop(): void
    {
    }
    /**
     * Returns the code coverage object.
     */
    public function getCodeCoverage(): ?\SebastianBergmann\CodeCoverage\CodeCoverage
    {
    }
    /**
     * Sets the code coverage object.
     */
    public function setCodeCoverage(\SebastianBergmann\CodeCoverage\CodeCoverage $codeCoverage): void
    {
    }
    /**
     * Enables or disables the deprecation-to-exception conversion.
     */
    public function convertDeprecationsToExceptions(bool $flag): void
    {
    }
    /**
     * Returns the deprecation-to-exception conversion setting.
     */
    public function getConvertDeprecationsToExceptions(): bool
    {
    }
    /**
     * Enables or disables the error-to-exception conversion.
     */
    public function convertErrorsToExceptions(bool $flag): void
    {
    }
    /**
     * Returns the error-to-exception conversion setting.
     */
    public function getConvertErrorsToExceptions(): bool
    {
    }
    /**
     * Enables or disables the notice-to-exception conversion.
     */
    public function convertNoticesToExceptions(bool $flag): void
    {
    }
    /**
     * Returns the notice-to-exception conversion setting.
     */
    public function getConvertNoticesToExceptions(): bool
    {
    }
    /**
     * Enables or disables the warning-to-exception conversion.
     */
    public function convertWarningsToExceptions(bool $flag): void
    {
    }
    /**
     * Returns the warning-to-exception conversion setting.
     */
    public function getConvertWarningsToExceptions(): bool
    {
    }
    /**
     * Enables or disables the stopping when an error occurs.
     */
    public function stopOnError(bool $flag): void
    {
    }
    /**
     * Enables or disables the stopping when a failure occurs.
     */
    public function stopOnFailure(bool $flag): void
    {
    }
    /**
     * Enables or disables the stopping when a warning occurs.
     */
    public function stopOnWarning(bool $flag): void
    {
    }
    public function beStrictAboutTestsThatDoNotTestAnything(bool $flag): void
    {
    }
    public function isStrictAboutTestsThatDoNotTestAnything(): bool
    {
    }
    public function beStrictAboutOutputDuringTests(bool $flag): void
    {
    }
    public function isStrictAboutOutputDuringTests(): bool
    {
    }
    public function beStrictAboutResourceUsageDuringSmallTests(bool $flag): void
    {
    }
    public function isStrictAboutResourceUsageDuringSmallTests(): bool
    {
    }
    public function enforceTimeLimit(bool $flag): void
    {
    }
    public function enforcesTimeLimit(): bool
    {
    }
    public function beStrictAboutTodoAnnotatedTests(bool $flag): void
    {
    }
    public function isStrictAboutTodoAnnotatedTests(): bool
    {
    }
    public function forceCoversAnnotation(): void
    {
    }
    public function forcesCoversAnnotation(): bool
    {
    }
    /**
     * Enables or disables the stopping for risky tests.
     */
    public function stopOnRisky(bool $flag): void
    {
    }
    /**
     * Enables or disables the stopping for incomplete tests.
     */
    public function stopOnIncomplete(bool $flag): void
    {
    }
    /**
     * Enables or disables the stopping for skipped tests.
     */
    public function stopOnSkipped(bool $flag): void
    {
    }
    /**
     * Enables or disables the stopping for defects: error, failure, warning.
     */
    public function stopOnDefect(bool $flag): void
    {
    }
    /**
     * Returns the time spent running the tests.
     */
    public function time(): float
    {
    }
    /**
     * Returns whether the entire test was successful or not.
     */
    public function wasSuccessful(): bool
    {
    }
    public function wasSuccessfulIgnoringWarnings(): bool
    {
    }
    public function wasSuccessfulAndNoTestIsRiskyOrSkippedOrIncomplete(): bool
    {
    }
    /**
     * Sets the default timeout for tests.
     */
    public function setDefaultTimeLimit(int $timeout): void
    {
    }
    /**
     * Sets the timeout for small tests.
     */
    public function setTimeoutForSmallTests(int $timeout): void
    {
    }
    /**
     * Sets the timeout for medium tests.
     */
    public function setTimeoutForMediumTests(int $timeout): void
    {
    }
    /**
     * Sets the timeout for large tests.
     */
    public function setTimeoutForLargeTests(int $timeout): void
    {
    }
    /**
     * Returns the set timeout for large tests.
     */
    public function getTimeoutForLargeTests(): int
    {
    }
    public function setRegisterMockObjectsFromTestArgumentsRecursively(bool $flag): void
    {
    }
}
/**
 * @template-implements \IteratorAggregate<int, Test>
 *
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
class TestSuite implements \IteratorAggregate, \PHPUnit\Framework\Reorderable, \PHPUnit\Framework\SelfDescribing, \PHPUnit\Framework\Test
{
    /**
     * Enable or disable the backup and restoration of the $GLOBALS array.
     *
     * @var bool
     */
    protected $backupGlobals;
    /**
     * Enable or disable the backup and restoration of static attributes.
     *
     * @var bool
     */
    protected $backupStaticAttributes;
    /**
     * @var bool
     */
    protected $runTestInSeparateProcess = false;
    /**
     * The name of the test suite.
     *
     * @var string
     */
    protected $name = '';
    /**
     * The test groups of the test suite.
     *
     * @phan-var array<string,list<Test>>
     */
    protected $groups = [];
    /**
     * The tests in the test suite.
     *
     * @var Test[]
     */
    protected $tests = [];
    /**
     * The number of tests in the test suite.
     *
     * @var int
     */
    protected $numTests = -1;
    /**
     * @var bool
     */
    protected $testCase = false;
    /**
     * @var string[]
     */
    protected $foundClasses = [];
    /**
     * @var null|list<ExecutionOrderDependency>
     */
    protected $providedTests;
    /**
     * @var null|list<ExecutionOrderDependency>
     */
    protected $requiredTests;
    /**
     * Constructs a new TestSuite.
     *
     *   - PHPUnit\Framework\TestSuite() constructs an empty TestSuite.
     *
     *   - PHPUnit\Framework\TestSuite(ReflectionClass) constructs a
     *     TestSuite from the given class.
     *
     *   - PHPUnit\Framework\TestSuite(ReflectionClass, String)
     *     constructs a TestSuite from the given class with the given
     *     name.
     *
     *   - PHPUnit\Framework\TestSuite(String) either constructs a
     *     TestSuite from the given class (if the passed string is the
     *     name of an existing class) or constructs an empty TestSuite
     *     with the given name.
     *
     * @param \ReflectionClass|string $theClass
     *
     * @throws Exception
     */
    public function __construct($theClass = '', string $name = '')
    {
    }
    /**
     * Returns a string representation of the test suite.
     */
    public function toString(): string
    {
    }
    /**
     * Adds a test to the suite.
     *
     * @param array $groups
     */
    public function addTest(\PHPUnit\Framework\Test $test, $groups = []): void
    {
    }
    /**
     * Adds the tests from the given class to the suite.
     *
     * @phan-param object|class-string $testClass
     *
     * @throws Exception
     */
    public function addTestSuite($testClass): void
    {
    }
    public function addWarning(string $warning): void
    {
    }
    /**
     * Wraps both <code>addTest()</code> and <code>addTestSuite</code>
     * as well as the separate import statements for the user's convenience.
     *
     * If the named file cannot be read or there are no new tests that can be
     * added, a <code>PHPUnit\Framework\WarningTestCase</code> will be created instead,
     * leaving the current test run untouched.
     *
     * @throws Exception
     */
    public function addTestFile(string $filename): void
    {
    }
    /**
     * Wrapper for addTestFile() that adds multiple test files.
     *
     * @throws Exception
     */
    public function addTestFiles(iterable $fileNames): void
    {
    }
    /**
     * Counts the number of test cases that will be run by this test.
     *
     * @todo refactor usage of numTests in DefaultResultPrinter
     */
    public function count(): int
    {
    }
    /**
     * Returns the name of the suite.
     */
    public function getName(): string
    {
    }
    /**
     * Returns the test groups of the suite.
     *
     * @phan-return list<string>
     */
    public function getGroups(): array
    {
    }
    public function getGroupDetails(): array
    {
    }
    /**
     * Set tests groups of the test case.
     */
    public function setGroupDetails(array $groups): void
    {
    }
    /**
     * Runs the tests and collects their result in a TestResult.
     *
     * @throws \SebastianBergmann\CodeCoverage\InvalidArgumentException
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     * @throws CodeCoverageException
     * @throws \SebastianBergmann\CodeCoverage\UnintentionallyCoveredCodeException
     * @throws Warning
     */
    public function run(?\PHPUnit\Framework\TestResult $result = null): \PHPUnit\Framework\TestResult
    {
    }
    public function setRunTestInSeparateProcess(bool $runTestInSeparateProcess): void
    {
    }
    public function setName(string $name): void
    {
    }
    /**
     * Returns the tests as an enumeration.
     *
     * @return Test[]
     */
    public function tests(): array
    {
    }
    /**
     * Set tests of the test suite.
     *
     * @param Test[] $tests
     */
    public function setTests(array $tests): void
    {
    }
    /**
     * Mark the test suite as skipped.
     *
     * @param string $message
     *
     * @throws SkippedTestSuiteError
     *
     * @phan-return never-return
     */
    public function markTestSuiteSkipped($message = ''): void
    {
    }
    /**
     * @param bool $beStrictAboutChangesToGlobalState
     */
    public function setBeStrictAboutChangesToGlobalState($beStrictAboutChangesToGlobalState): void
    {
    }
    /**
     * @param bool $backupGlobals
     */
    public function setBackupGlobals($backupGlobals): void
    {
    }
    /**
     * @param bool $backupStaticAttributes
     */
    public function setBackupStaticAttributes($backupStaticAttributes): void
    {
    }
    /**
     * Returns an iterator for this test suite.
     */
    public function getIterator(): \Iterator
    {
    }
    public function injectFilter(\PHPUnit\Runner\Filter\Factory $filter): void
    {
    }
    /**
     * @phan-return array<int,string>
     */
    public function warnings(): array
    {
    }
    /**
     * @return list<ExecutionOrderDependency>
     */
    public function provides(): array
    {
    }
    /**
     * @return list<ExecutionOrderDependency>
     */
    public function requires(): array
    {
    }
    public function sortId(): string
    {
    }
    /**
     * Creates a default TestResult object.
     */
    protected function createResult(): \PHPUnit\Framework\TestResult
    {
    }
    /**
     * @throws Exception
     */
    protected function addTestMethod(\ReflectionClass $class, \ReflectionMethod $method): void
    {
    }
}
/**
 * @template-implements \RecursiveIterator<int, Test>
 *
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class TestSuiteIterator implements \RecursiveIterator
{
    public function __construct(\PHPUnit\Framework\TestSuite $testSuite)
    {
    }
    public function rewind(): void
    {
    }
    public function valid(): bool
    {
    }
    public function key(): int
    {
    }
    public function current(): \PHPUnit\Framework\Test
    {
    }
    public function next(): void
    {
    }
    /**
     * @throws NoChildTestSuiteException
     */
    public function getChildren(): self
    {
    }
    public function hasChildren(): bool
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class WarningTestCase extends \PHPUnit\Framework\TestCase
{
    public function __construct(string $message = '')
    {
    }
    public function getMessage(): string
    {
    }
    /**
     * Returns a string representation of the test case.
     */
    public function toString(): string
    {
    }
}
namespace PHPUnit\Framework\Constraint;

/**
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 */
final class IsFalse extends \PHPUnit\Framework\Constraint\Constraint
{
    /**
     * Returns a string representation of the constraint.
     */
    public function toString(): string
    {
    }
}
/**
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 */
final class IsTrue extends \PHPUnit\Framework\Constraint\Constraint
{
    /**
     * Returns a string representation of the constraint.
     */
    public function toString(): string
    {
    }
}
/**
 * @phan-template CallbackInput of mixed
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 */
final class Callback extends \PHPUnit\Framework\Constraint\Constraint
{
    /** @phan-param callable(CallbackInput $input): bool $callback */
    public function __construct(callable $callback)
    {
    }
    /**
     * Returns a string representation of the constraint.
     */
    public function toString(): string
    {
    }
}
/**
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 */
class Count extends \PHPUnit\Framework\Constraint\Constraint
{
    public function __construct(int $expected)
    {
    }
    public function toString(): string
    {
    }
    /**
     * Evaluates the constraint for parameter $other. Returns true if the
     * constraint is met, false otherwise.
     *
     * @throws \PHPUnit\Framework\Exception
     */
    protected function matches($other): bool
    {
    }
    /**
     * @throws \PHPUnit\Framework\Exception
     */
    protected function getCountOf($other): ?int
    {
    }
    /**
     * Returns the total number of iterations from a generator.
     * This will fully exhaust the generator.
     */
    protected function getCountOfGenerator(\Generator $generator): int
    {
    }
    /**
     * Returns the description of the failure.
     *
     * The beginning of failure messages is "Failed asserting that" in most
     * cases. This method should return the second part of that sentence.
     *
     * @param mixed $other evaluated value or object
     */
    protected function failureDescription($other): string
    {
    }
}
/**
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 */
final class GreaterThan extends \PHPUnit\Framework\Constraint\Constraint
{
    /**
     * @param float|int $value
     */
    public function __construct($value)
    {
    }
    /**
     * Returns a string representation of the constraint.
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     */
    public function toString(): string
    {
    }
}
/**
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 */
final class IsEmpty extends \PHPUnit\Framework\Constraint\Constraint
{
    /**
     * Returns a string representation of the constraint.
     */
    public function toString(): string
    {
    }
}
/**
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 */
final class LessThan extends \PHPUnit\Framework\Constraint\Constraint
{
    /**
     * @param float|int $value
     */
    public function __construct($value)
    {
    }
    /**
     * Returns a string representation of the constraint.
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     */
    public function toString(): string
    {
    }
}
/**
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 */
final class SameSize extends \PHPUnit\Framework\Constraint\Count
{
    public function __construct(iterable $expected)
    {
    }
}
/**
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 */
abstract class Constraint implements \Countable, \PHPUnit\Framework\SelfDescribing
{
    /**
     * Evaluates the constraint for parameter $other.
     *
     * If $returnResult is set to false (the default), an exception is thrown
     * in case of a failure. null is returned otherwise.
     *
     * If $returnResult is true, the result of the evaluation is returned as
     * a boolean value instead: true in case of success, false in case of a
     * failure.
     *
     * @throws \PHPUnit\Framework\ExpectationFailedException
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     */
    public function evaluate($other, string $description = '', bool $returnResult = false): ?bool
    {
    }
    /**
     * Counts the number of constraint elements.
     */
    public function count(): int
    {
    }
    protected function exporter(): \SebastianBergmann\Exporter\Exporter
    {
    }
    /**
     * Evaluates the constraint for parameter $other. Returns true if the
     * constraint is met, false otherwise.
     *
     * This method can be overridden to implement the evaluation algorithm.
     *
     * @param mixed $other value or object to evaluate
     *
     * @codeCoverageIgnore
     */
    protected function matches($other): bool
    {
    }
    /**
     * Throws an exception for the given compared value and test description.
     *
     * @param mixed  $other       evaluated value or object
     * @param string $description Additional information about the test
     *
     * @throws \PHPUnit\Framework\ExpectationFailedException
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     *
     * @phan-return never-return
     */
    protected function fail($other, $description, ?\SebastianBergmann\Comparator\ComparisonFailure $comparisonFailure = null): void
    {
    }
    /**
     * Return additional failure description where needed.
     *
     * The function can be overridden to provide additional failure
     * information like a diff
     *
     * @param mixed $other evaluated value or object
     */
    protected function additionalFailureDescription($other): string
    {
    }
    /**
     * Returns the description of the failure.
     *
     * The beginning of failure messages is "Failed asserting that" in most
     * cases. This method should return the second part of that sentence.
     *
     * To provide additional failure information additionalFailureDescription
     * can be used.
     *
     * @param mixed $other evaluated value or object
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     */
    protected function failureDescription($other): string
    {
    }
    /**
     * Returns a custom string representation of the constraint object when it
     * appears in context of an $operator expression.
     *
     * The purpose of this method is to provide meaningful descriptive string
     * in context of operators such as LogicalNot. Native PHPUnit constraints
     * are supported out of the box by LogicalNot, but externally developed
     * ones had no way to provide correct strings in this context.
     *
     * The method shall return empty string, when it does not handle
     * customization by itself.
     *
     * @param Operator $operator the $operator of the expression
     * @param mixed    $role     role of $this constraint in the $operator expression
     */
    protected function toStringInContext(\PHPUnit\Framework\Constraint\Operator $operator, $role): string
    {
    }
    /**
     * Returns the description of the failure when this constraint appears in
     * context of an $operator expression.
     *
     * The purpose of this method is to provide meaningful failure description
     * in context of operators such as LogicalNot. Native PHPUnit constraints
     * are supported out of the box by LogicalNot, but externally developed
     * ones had no way to provide correct messages in this context.
     *
     * The method shall return empty string, when it does not handle
     * customization by itself.
     *
     * @param Operator $operator the $operator of the expression
     * @param mixed    $role     role of $this constraint in the $operator expression
     * @param mixed    $other    evaluated value or object
     */
    protected function failureDescriptionInContext(\PHPUnit\Framework\Constraint\Operator $operator, $role, $other): string
    {
    }
    /**
     * Reduces the sub-expression starting at $this by skipping degenerate
     * sub-expression and returns first descendant constraint that starts
     * a non-reducible sub-expression.
     *
     * Returns $this for terminal constraints and for operators that start
     * non-reducible sub-expression, or the nearest descendant of $this that
     * starts a non-reducible sub-expression.
     *
     * A constraint expression may be modelled as a tree with non-terminal
     * nodes (operators) and terminal nodes. For example:
     *
     *      LogicalOr           (operator, non-terminal)
     *      + LogicalAnd        (operator, non-terminal)
     *      | + IsType('int')   (terminal)
     *      | + GreaterThan(10) (terminal)
     *      + LogicalNot        (operator, non-terminal)
     *        + IsType('array') (terminal)
     *
     * A degenerate sub-expression is a part of the tree, that effectively does
     * not contribute to the evaluation of the expression it appears in. An example
     * of degenerate sub-expression is a BinaryOperator constructed with single
     * operand or nested BinaryOperators, each with single operand. An
     * expression involving a degenerate sub-expression is equivalent to a
     * reduced expression with the degenerate sub-expression removed, for example
     *
     *      LogicalAnd          (operator)
     *      + LogicalOr         (degenerate operator)
     *      | + LogicalAnd      (degenerate operator)
     *      |   + IsType('int') (terminal)
     *      + GreaterThan(10)   (terminal)
     *
     * is equivalent to
     *
     *      LogicalAnd          (operator)
     *      + IsType('int')     (terminal)
     *      + GreaterThan(10)   (terminal)
     *
     * because the subexpression
     *
     *      + LogicalOr
     *        + LogicalAnd
     *          + -
     *
     * is degenerate. Calling reduce() on the LogicalOr object above, as well
     * as on LogicalAnd, shall return the IsType('int') instance.
     *
     * Other specific reductions can be implemented, for example cascade of
     * LogicalNot operators
     *
     *      + LogicalNot
     *        + LogicalNot
     *          +LogicalNot
     *           + IsTrue
     *
     * can be reduced to
     *
     *      LogicalNot
     *      + IsTrue
     */
    protected function reduce(): self
    {
    }
}
/**
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 */
final class IsEqual extends \PHPUnit\Framework\Constraint\Constraint
{
    public function __construct($value, float $delta = 0.0, bool $canonicalize = false, bool $ignoreCase = false)
    {
    }
    /**
     * Evaluates the constraint for parameter $other.
     *
     * If $returnResult is set to false (the default), an exception is thrown
     * in case of a failure. null is returned otherwise.
     *
     * If $returnResult is true, the result of the evaluation is returned as
     * a boolean value instead: true in case of success, false in case of a
     * failure.
     *
     * @throws \PHPUnit\Framework\ExpectationFailedException
     */
    public function evaluate($other, string $description = '', bool $returnResult = false): ?bool
    {
    }
    /**
     * Returns a string representation of the constraint.
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     */
    public function toString(): string
    {
    }
}
/**
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 */
final class IsEqualCanonicalizing extends \PHPUnit\Framework\Constraint\Constraint
{
    public function __construct($value)
    {
    }
    /**
     * Evaluates the constraint for parameter $other.
     *
     * If $returnResult is set to false (the default), an exception is thrown
     * in case of a failure. null is returned otherwise.
     *
     * If $returnResult is true, the result of the evaluation is returned as
     * a boolean value instead: true in case of success, false in case of a
     * failure.
     *
     * @throws \PHPUnit\Framework\ExpectationFailedException
     */
    public function evaluate($other, string $description = '', bool $returnResult = false): ?bool
    {
    }
    /**
     * Returns a string representation of the constraint.
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     */
    public function toString(): string
    {
    }
}
/**
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 */
final class IsEqualIgnoringCase extends \PHPUnit\Framework\Constraint\Constraint
{
    public function __construct($value)
    {
    }
    /**
     * Evaluates the constraint for parameter $other.
     *
     * If $returnResult is set to false (the default), an exception is thrown
     * in case of a failure. null is returned otherwise.
     *
     * If $returnResult is true, the result of the evaluation is returned as
     * a boolean value instead: true in case of success, false in case of a
     * failure.
     *
     * @throws \PHPUnit\Framework\ExpectationFailedException
     */
    public function evaluate($other, string $description = '', bool $returnResult = false): ?bool
    {
    }
    /**
     * Returns a string representation of the constraint.
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     */
    public function toString(): string
    {
    }
}
/**
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 */
final class IsEqualWithDelta extends \PHPUnit\Framework\Constraint\Constraint
{
    public function __construct($value, float $delta)
    {
    }
    /**
     * Evaluates the constraint for parameter $other.
     *
     * If $returnResult is set to false (the default), an exception is thrown
     * in case of a failure. null is returned otherwise.
     *
     * If $returnResult is true, the result of the evaluation is returned as
     * a boolean value instead: true in case of success, false in case of a
     * failure.
     *
     * @throws \PHPUnit\Framework\ExpectationFailedException
     */
    public function evaluate($other, string $description = '', bool $returnResult = false): ?bool
    {
    }
    /**
     * Returns a string representation of the constraint.
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     */
    public function toString(): string
    {
    }
}
/**
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 */
final class Exception extends \PHPUnit\Framework\Constraint\Constraint
{
    public function __construct(string $className)
    {
    }
    /**
     * Returns a string representation of the constraint.
     */
    public function toString(): string
    {
    }
}
/**
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 */
final class ExceptionCode extends \PHPUnit\Framework\Constraint\Constraint
{
    /**
     * @param int|string $expected
     */
    public function __construct($expected)
    {
    }
    public function toString(): string
    {
    }
}
/**
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 */
final class ExceptionMessage extends \PHPUnit\Framework\Constraint\Constraint
{
    public function __construct(string $expected)
    {
    }
    public function toString(): string
    {
    }
}
/**
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 */
final class ExceptionMessageRegularExpression extends \PHPUnit\Framework\Constraint\Constraint
{
    public function __construct(string $expected)
    {
    }
    public function toString(): string
    {
    }
}
/**
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 */
final class DirectoryExists extends \PHPUnit\Framework\Constraint\Constraint
{
    /**
     * Returns a string representation of the constraint.
     */
    public function toString(): string
    {
    }
}
/**
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 */
final class FileExists extends \PHPUnit\Framework\Constraint\Constraint
{
    /**
     * Returns a string representation of the constraint.
     */
    public function toString(): string
    {
    }
}
/**
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 */
final class IsReadable extends \PHPUnit\Framework\Constraint\Constraint
{
    /**
     * Returns a string representation of the constraint.
     */
    public function toString(): string
    {
    }
}
/**
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 */
final class IsWritable extends \PHPUnit\Framework\Constraint\Constraint
{
    /**
     * Returns a string representation of the constraint.
     */
    public function toString(): string
    {
    }
}
/**
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 */
final class IsAnything extends \PHPUnit\Framework\Constraint\Constraint
{
    /**
     * Evaluates the constraint for parameter $other.
     *
     * If $returnResult is set to false (the default), an exception is thrown
     * in case of a failure. null is returned otherwise.
     *
     * If $returnResult is true, the result of the evaluation is returned as
     * a boolean value instead: true in case of success, false in case of a
     * failure.
     *
     * @throws \PHPUnit\Framework\ExpectationFailedException
     */
    public function evaluate($other, string $description = '', bool $returnResult = false): ?bool
    {
    }
    /**
     * Returns a string representation of the constraint.
     */
    public function toString(): string
    {
    }
    /**
     * Counts the number of constraint elements.
     */
    public function count(): int
    {
    }
}
/**
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 */
final class IsIdentical extends \PHPUnit\Framework\Constraint\Constraint
{
    public function __construct($value)
    {
    }
    /**
     * Evaluates the constraint for parameter $other.
     *
     * If $returnResult is set to false (the default), an exception is thrown
     * in case of a failure. null is returned otherwise.
     *
     * If $returnResult is true, the result of the evaluation is returned as
     * a boolean value instead: true in case of success, false in case of a
     * failure.
     *
     * @throws \PHPUnit\Framework\ExpectationFailedException
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     */
    public function evaluate($other, string $description = '', bool $returnResult = false): ?bool
    {
    }
    /**
     * Returns a string representation of the constraint.
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     */
    public function toString(): string
    {
    }
}
/**
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 */
final class JsonMatches extends \PHPUnit\Framework\Constraint\Constraint
{
    public function __construct(string $value)
    {
    }
    /**
     * Returns a string representation of the object.
     */
    public function toString(): string
    {
    }
}
/**
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 */
final class JsonMatchesErrorMessageProvider
{
    /**
     * Translates JSON error to a human readable string.
     */
    public static function determineJsonError(string $error, string $prefix = ''): ?string
    {
    }
    /**
     * Translates a given type to a human readable message prefix.
     */
    public static function translateTypeToPrefix(string $type): string
    {
    }
}
/**
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 */
final class IsFinite extends \PHPUnit\Framework\Constraint\Constraint
{
    /**
     * Returns a string representation of the constraint.
     */
    public function toString(): string
    {
    }
}
/**
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 */
final class IsInfinite extends \PHPUnit\Framework\Constraint\Constraint
{
    /**
     * Returns a string representation of the constraint.
     */
    public function toString(): string
    {
    }
}
/**
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 */
final class IsNan extends \PHPUnit\Framework\Constraint\Constraint
{
    /**
     * Returns a string representation of the constraint.
     */
    public function toString(): string
    {
    }
}
/**
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @deprecated https://github.com/sebastianbergmann/phpunit/issues/4601
 */
class ClassHasAttribute extends \PHPUnit\Framework\Constraint\Constraint
{
    public function __construct(string $attributeName)
    {
    }
    /**
     * Returns a string representation of the constraint.
     */
    public function toString(): string
    {
    }
    /**
     * Evaluates the constraint for parameter $other. Returns true if the
     * constraint is met, false otherwise.
     *
     * @param mixed $other value or object to evaluate
     */
    protected function matches($other): bool
    {
    }
    /**
     * Returns the description of the failure.
     *
     * The beginning of failure messages is "Failed asserting that" in most
     * cases. This method should return the second part of that sentence.
     *
     * @param mixed $other evaluated value or object
     */
    protected function failureDescription($other): string
    {
    }
    protected function attributeName(): string
    {
    }
}
/**
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @deprecated https://github.com/sebastianbergmann/phpunit/issues/4601
 */
final class ClassHasStaticAttribute extends \PHPUnit\Framework\Constraint\ClassHasAttribute
{
    /**
     * Returns a string representation of the constraint.
     */
    public function toString(): string
    {
    }
}
/**
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 */
final class ObjectEquals extends \PHPUnit\Framework\Constraint\Constraint
{
    public function __construct(object $object, string $method = 'equals')
    {
    }
    public function toString(): string
    {
    }
}
/**
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @deprecated https://github.com/sebastianbergmann/phpunit/issues/4601
 */
final class ObjectHasAttribute extends \PHPUnit\Framework\Constraint\ClassHasAttribute
{
}
/**
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 */
final class ObjectHasProperty extends \PHPUnit\Framework\Constraint\Constraint
{
    public function __construct(string $propertyName)
    {
    }
    /**
     * Returns a string representation of the constraint.
     */
    public function toString(): string
    {
    }
}
/**
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 */
abstract class BinaryOperator extends \PHPUnit\Framework\Constraint\Operator
{
    public static function fromConstraints(\PHPUnit\Framework\Constraint\Constraint ...$constraints): self
    {
    }
    /**
     * @param mixed[] $constraints
     */
    public function setConstraints(array $constraints): void
    {
    }
    /**
     * Returns the number of operands (constraints).
     */
    final public function arity(): int
    {
    }
    /**
     * Returns a string representation of the constraint.
     */
    public function toString(): string
    {
    }
    /**
     * Counts the number of constraint elements.
     */
    public function count(): int
    {
    }
    /**
     * Returns the nested constraints.
     */
    final protected function constraints(): array
    {
    }
    /**
     * Returns true if the $constraint needs to be wrapped with braces.
     */
    final protected function constraintNeedsParentheses(\PHPUnit\Framework\Constraint\Constraint $constraint): bool
    {
    }
    /**
     * Reduces the sub-expression starting at $this by skipping degenerate
     * sub-expression and returns first descendant constraint that starts
     * a non-reducible sub-expression.
     *
     * See Constraint::reduce() for more.
     */
    protected function reduce(): \PHPUnit\Framework\Constraint\Constraint
    {
    }
}
/**
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 */
final class LogicalAnd extends \PHPUnit\Framework\Constraint\BinaryOperator
{
    /**
     * Returns the name of this operator.
     */
    public function operator(): string
    {
    }
    /**
     * Returns this operator's precedence.
     *
     * @see https://www.php.net/manual/en/language.operators.precedence.php
     */
    public function precedence(): int
    {
    }
}
/**
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 */
final class LogicalNot extends \PHPUnit\Framework\Constraint\UnaryOperator
{
    public static function negate(string $string): string
    {
    }
    /**
     * Returns the name of this operator.
     */
    public function operator(): string
    {
    }
    /**
     * Returns this operator's precedence.
     *
     * @see https://www.php.net/manual/en/language.operators.precedence.php
     */
    public function precedence(): int
    {
    }
}
/**
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 */
final class LogicalOr extends \PHPUnit\Framework\Constraint\BinaryOperator
{
    /**
     * Returns the name of this operator.
     */
    public function operator(): string
    {
    }
    /**
     * Returns this operator's precedence.
     *
     * @see https://www.php.net/manual/en/language.operators.precedence.php
     */
    public function precedence(): int
    {
    }
    /**
     * Evaluates the constraint for parameter $other. Returns true if the
     * constraint is met, false otherwise.
     *
     * @param mixed $other value or object to evaluate
     */
    public function matches($other): bool
    {
    }
}
/**
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 */
final class LogicalXor extends \PHPUnit\Framework\Constraint\BinaryOperator
{
    /**
     * Returns the name of this operator.
     */
    public function operator(): string
    {
    }
    /**
     * Returns this operator's precedence.
     *
     * @see https://www.php.net/manual/en/language.operators.precedence.php.
     */
    public function precedence(): int
    {
    }
    /**
     * Evaluates the constraint for parameter $other. Returns true if the
     * constraint is met, false otherwise.
     *
     * @param mixed $other value or object to evaluate
     */
    public function matches($other): bool
    {
    }
}
/**
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 */
abstract class Operator extends \PHPUnit\Framework\Constraint\Constraint
{
    /**
     * Returns the name of this operator.
     */
    abstract public function operator(): string;
    /**
     * Returns this operator's precedence.
     *
     * @see https://www.php.net/manual/en/language.operators.precedence.php
     */
    abstract public function precedence(): int;
    /**
     * Returns the number of operands.
     */
    abstract public function arity(): int;
    /**
     * Validates $constraint argument.
     */
    protected function checkConstraint($constraint): \PHPUnit\Framework\Constraint\Constraint
    {
    }
    /**
     * Returns true if the $constraint needs to be wrapped with braces.
     */
    protected function constraintNeedsParentheses(\PHPUnit\Framework\Constraint\Constraint $constraint): bool
    {
    }
}
/**
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 */
abstract class UnaryOperator extends \PHPUnit\Framework\Constraint\Operator
{
    /**
     * @param Constraint|mixed $constraint
     */
    public function __construct($constraint)
    {
    }
    /**
     * Returns the number of operands (constraints).
     */
    public function arity(): int
    {
    }
    /**
     * Returns a string representation of the constraint.
     */
    public function toString(): string
    {
    }
    /**
     * Counts the number of constraint elements.
     */
    public function count(): int
    {
    }
    /**
     * Returns the description of the failure.
     *
     * The beginning of failure messages is "Failed asserting that" in most
     * cases. This method should return the second part of that sentence.
     *
     * @param mixed $other evaluated value or object
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     */
    protected function failureDescription($other): string
    {
    }
    /**
     * Transforms string returned by the memeber constraint's toString() or
     * failureDescription() such that it reflects constraint's participation in
     * this expression.
     *
     * The method may be overwritten in a subclass to apply default
     * transformation in case the operand constraint does not provide its own
     * custom strings via toStringInContext() or failureDescriptionInContext().
     *
     * @param string $string the string to be transformed
     */
    protected function transformString(string $string): string
    {
    }
    /**
     * Provides access to $this->constraint for subclasses.
     */
    final protected function constraint(): \PHPUnit\Framework\Constraint\Constraint
    {
    }
    /**
     * Returns true if the $constraint needs to be wrapped with parentheses.
     */
    protected function constraintNeedsParentheses(\PHPUnit\Framework\Constraint\Constraint $constraint): bool
    {
    }
}
/**
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 */
final class IsJson extends \PHPUnit\Framework\Constraint\Constraint
{
    /**
     * Returns a string representation of the constraint.
     */
    public function toString(): string
    {
    }
}
/**
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 */
class RegularExpression extends \PHPUnit\Framework\Constraint\Constraint
{
    public function __construct(string $pattern)
    {
    }
    /**
     * Returns a string representation of the constraint.
     */
    public function toString(): string
    {
    }
    /**
     * Evaluates the constraint for parameter $other. Returns true if the
     * constraint is met, false otherwise.
     *
     * @param mixed $other value or object to evaluate
     */
    protected function matches($other): bool
    {
    }
}
/**
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 */
final class StringContains extends \PHPUnit\Framework\Constraint\Constraint
{
    public function __construct(string $string, bool $ignoreCase = false)
    {
    }
    /**
     * Returns a string representation of the constraint.
     */
    public function toString(): string
    {
    }
}
/**
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 */
final class StringEndsWith extends \PHPUnit\Framework\Constraint\Constraint
{
    public function __construct(string $suffix)
    {
    }
    /**
     * Returns a string representation of the constraint.
     */
    public function toString(): string
    {
    }
}
/**
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 */
final class StringMatchesFormatDescription extends \PHPUnit\Framework\Constraint\RegularExpression
{
    public function __construct(string $string)
    {
    }
}
/**
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 */
final class StringStartsWith extends \PHPUnit\Framework\Constraint\Constraint
{
    public function __construct(string $prefix)
    {
    }
    /**
     * Returns a string representation of the constraint.
     */
    public function toString(): string
    {
    }
}
/**
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 */
final class ArrayHasKey extends \PHPUnit\Framework\Constraint\Constraint
{
    /**
     * @param int|string $key
     */
    public function __construct($key)
    {
    }
    /**
     * Returns a string representation of the constraint.
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     */
    public function toString(): string
    {
    }
}
/**
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 */
abstract class TraversableContains extends \PHPUnit\Framework\Constraint\Constraint
{
    public function __construct($value)
    {
    }
    /**
     * Returns a string representation of the constraint.
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     */
    public function toString(): string
    {
    }
    /**
     * Returns the description of the failure.
     *
     * The beginning of failure messages is "Failed asserting that" in most
     * cases. This method should return the second part of that sentence.
     *
     * @param mixed $other evaluated value or object
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     */
    protected function failureDescription($other): string
    {
    }
    protected function value()
    {
    }
}
/**
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 */
final class TraversableContainsEqual extends \PHPUnit\Framework\Constraint\TraversableContains
{
}
/**
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 */
final class TraversableContainsIdentical extends \PHPUnit\Framework\Constraint\TraversableContains
{
}
/**
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 */
final class TraversableContainsOnly extends \PHPUnit\Framework\Constraint\Constraint
{
    /**
     * @throws \PHPUnit\Framework\Exception
     */
    public function __construct(string $type, bool $isNativeType = true)
    {
    }
    /**
     * Evaluates the constraint for parameter $other.
     *
     * If $returnResult is set to false (the default), an exception is thrown
     * in case of a failure. null is returned otherwise.
     *
     * If $returnResult is true, the result of the evaluation is returned as
     * a boolean value instead: true in case of success, false in case of a
     * failure.
     *
     * @param mixed|\Traversable $other
     *
     * @throws \PHPUnit\Framework\ExpectationFailedException
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     */
    public function evaluate($other, string $description = '', bool $returnResult = false): ?bool
    {
    }
    /**
     * Returns a string representation of the constraint.
     */
    public function toString(): string
    {
    }
}
/**
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 */
final class IsInstanceOf extends \PHPUnit\Framework\Constraint\Constraint
{
    public function __construct(string $className)
    {
    }
    /**
     * Returns a string representation of the constraint.
     */
    public function toString(): string
    {
    }
}
/**
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 */
final class IsNull extends \PHPUnit\Framework\Constraint\Constraint
{
    /**
     * Returns a string representation of the constraint.
     */
    public function toString(): string
    {
    }
}
/**
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 */
final class IsType extends \PHPUnit\Framework\Constraint\Constraint
{
    /**
     * @var string
     */
    public const TYPE_ARRAY = 'array';
    /**
     * @var string
     */
    public const TYPE_BOOL = 'bool';
    /**
     * @var string
     */
    public const TYPE_FLOAT = 'float';
    /**
     * @var string
     */
    public const TYPE_INT = 'int';
    /**
     * @var string
     */
    public const TYPE_NULL = 'null';
    /**
     * @var string
     */
    public const TYPE_NUMERIC = 'numeric';
    /**
     * @var string
     */
    public const TYPE_OBJECT = 'object';
    /**
     * @var string
     */
    public const TYPE_RESOURCE = 'resource';
    /**
     * @var string
     */
    public const TYPE_CLOSED_RESOURCE = 'resource (closed)';
    /**
     * @var string
     */
    public const TYPE_STRING = 'string';
    /**
     * @var string
     */
    public const TYPE_SCALAR = 'scalar';
    /**
     * @var string
     */
    public const TYPE_CALLABLE = 'callable';
    /**
     * @var string
     */
    public const TYPE_ITERABLE = 'iterable';
    /**
     * @throws \PHPUnit\Framework\Exception
     */
    public function __construct(string $type)
    {
    }
    /**
     * Returns a string representation of the constraint.
     */
    public function toString(): string
    {
    }
}
namespace PHPUnit\Framework\Error;

/**
 * @internal
 */
final class Deprecated extends \PHPUnit\Framework\Error\Error
{
}
/**
 * @internal
 */
class Error extends \PHPUnit\Framework\Exception
{
    public function __construct(string $message, int $code, string $file, int $line, ?\Exception $previous = null)
    {
    }
}
/**
 * @internal
 */
final class Notice extends \PHPUnit\Framework\Error\Error
{
}
/**
 * @internal
 */
final class Warning extends \PHPUnit\Framework\Error\Error
{
}
namespace PHPUnit\Framework\MockObject;

/**
 * @internal This trait is not covered by the backward compatibility promise for PHPUnit
 */
trait Api
{
    /**
     * @var ConfigurableMethod[]
     */
    private static $__phpunit_configurableMethods;
    /**
     * @var object
     */
    private $__phpunit_originalObject;
    /**
     * @var bool
     */
    private $__phpunit_returnValueGeneration = true;
    /**
     * @var InvocationHandler
     */
    private $__phpunit_invocationMocker;
    /** @noinspection MagicMethodsValidityInspection */
    public static function __phpunit_initConfigurableMethods(\PHPUnit\Framework\MockObject\ConfigurableMethod ...$configurableMethods): void
    {
    }
    /** @noinspection MagicMethodsValidityInspection */
    public function __phpunit_setOriginalObject($originalObject): void
    {
    }
    /** @noinspection MagicMethodsValidityInspection */
    public function __phpunit_setReturnValueGeneration(bool $returnValueGeneration): void
    {
    }
    /** @noinspection MagicMethodsValidityInspection */
    public function __phpunit_getInvocationHandler(): \PHPUnit\Framework\MockObject\InvocationHandler
    {
    }
    /** @noinspection MagicMethodsValidityInspection */
    public function __phpunit_hasMatchers(): bool
    {
    }
    /** @noinspection MagicMethodsValidityInspection */
    public function __phpunit_verify(bool $unsetInvocationMocker = true): void
    {
    }
    public function expects(\PHPUnit\Framework\MockObject\Rule\InvocationOrder $matcher): \PHPUnit\Framework\MockObject\Builder\InvocationMocker
    {
    }
}
/**
 * @internal This trait is not covered by the backward compatibility promise for PHPUnit
 */
trait Method
{
    public function method(...$func_get_args)
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class ConfigurableMethod
{
    public function __construct(string $name, \SebastianBergmann\Type\Type $returnType)
    {
    }
    public function getName(): string
    {
    }
    public function mayReturn($value): bool
    {
    }
    public function getReturnTypeDeclaration(): string
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class BadMethodCallException extends \BadMethodCallException implements \PHPUnit\Framework\MockObject\Exception
{
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class CannotUseAddMethodsException extends \PHPUnit\Framework\Exception implements \PHPUnit\Framework\MockObject\Exception
{
    public function __construct(string $type, string $methodName)
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class CannotUseOnlyMethodsException extends \PHPUnit\Framework\Exception implements \PHPUnit\Framework\MockObject\Exception
{
    public function __construct(string $type, string $methodName)
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class ClassAlreadyExistsException extends \PHPUnit\Framework\Exception implements \PHPUnit\Framework\MockObject\Exception
{
    public function __construct(string $className)
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class ClassIsFinalException extends \PHPUnit\Framework\Exception implements \PHPUnit\Framework\MockObject\Exception
{
    public function __construct(string $className)
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class ClassIsReadonlyException extends \PHPUnit\Framework\Exception implements \PHPUnit\Framework\MockObject\Exception
{
    public function __construct(string $className)
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class ConfigurableMethodsAlreadyInitializedException extends \PHPUnit\Framework\Exception implements \PHPUnit\Framework\MockObject\Exception
{
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class DuplicateMethodException extends \PHPUnit\Framework\Exception implements \PHPUnit\Framework\MockObject\Exception
{
    /**
     * @phan-param list<string> $methods
     */
    public function __construct(array $methods)
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
interface Exception extends \Throwable
{
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class IncompatibleReturnValueException extends \PHPUnit\Framework\Exception implements \PHPUnit\Framework\MockObject\Exception
{
    /**
     * @param mixed $value
     */
    public function __construct(\PHPUnit\Framework\MockObject\ConfigurableMethod $method, $value)
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class InvalidMethodNameException extends \PHPUnit\Framework\Exception implements \PHPUnit\Framework\MockObject\Exception
{
    public function __construct(string $method)
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class MatchBuilderNotFoundException extends \PHPUnit\Framework\Exception implements \PHPUnit\Framework\MockObject\Exception
{
    public function __construct(string $id)
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class MatcherAlreadyRegisteredException extends \PHPUnit\Framework\Exception implements \PHPUnit\Framework\MockObject\Exception
{
    public function __construct(string $id)
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class MethodCannotBeConfiguredException extends \PHPUnit\Framework\Exception implements \PHPUnit\Framework\MockObject\Exception
{
    public function __construct(string $method)
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class MethodNameAlreadyConfiguredException extends \PHPUnit\Framework\Exception implements \PHPUnit\Framework\MockObject\Exception
{
    public function __construct()
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class MethodNameNotConfiguredException extends \PHPUnit\Framework\Exception implements \PHPUnit\Framework\MockObject\Exception
{
    public function __construct()
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class MethodParametersAlreadyConfiguredException extends \PHPUnit\Framework\Exception implements \PHPUnit\Framework\MockObject\Exception
{
    public function __construct()
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class OriginalConstructorInvocationRequiredException extends \PHPUnit\Framework\Exception implements \PHPUnit\Framework\MockObject\Exception
{
    public function __construct()
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class ReflectionException extends \RuntimeException implements \PHPUnit\Framework\MockObject\Exception
{
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class ReturnValueNotConfiguredException extends \PHPUnit\Framework\Exception implements \PHPUnit\Framework\MockObject\Exception
{
    public function __construct(\PHPUnit\Framework\MockObject\Invocation $invocation)
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class RuntimeException extends \RuntimeException implements \PHPUnit\Framework\MockObject\Exception
{
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class SoapExtensionNotAvailableException extends \PHPUnit\Framework\Exception implements \PHPUnit\Framework\MockObject\Exception
{
    public function __construct()
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class UnknownClassException extends \PHPUnit\Framework\Exception implements \PHPUnit\Framework\MockObject\Exception
{
    public function __construct(string $className)
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class UnknownTraitException extends \PHPUnit\Framework\Exception implements \PHPUnit\Framework\MockObject\Exception
{
    public function __construct(string $traitName)
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class UnknownTypeException extends \PHPUnit\Framework\Exception implements \PHPUnit\Framework\MockObject\Exception
{
    public function __construct(string $type)
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class Generator
{
    /**
     * Returns a mock object for the specified class.
     *
     * @param null|array $methods
     *
     * @throws ClassAlreadyExistsException
     * @throws ClassIsFinalException
     * @throws ClassIsReadonlyException
     * @throws DuplicateMethodException
     * @throws \PHPUnit\Framework\InvalidArgumentException
     * @throws InvalidMethodNameException
     * @throws OriginalConstructorInvocationRequiredException
     * @throws ReflectionException
     * @throws RuntimeException
     * @throws UnknownTypeException
     */
    public function getMock(string $type, $methods = [], array $arguments = [], string $mockClassName = '', bool $callOriginalConstructor = true, bool $callOriginalClone = true, bool $callAutoload = true, bool $cloneArguments = true, bool $callOriginalMethods = false, ?object $proxyTarget = null, bool $allowMockingUnknownTypes = true, bool $returnValueGeneration = true): \PHPUnit\Framework\MockObject\MockObject
    {
    }
    /**
     * @phan-param list<class-string> $interfaces
     *
     * @throws RuntimeException
     * @throws UnknownTypeException
     */
    public function getMockForInterfaces(array $interfaces, bool $callAutoload = true): \PHPUnit\Framework\MockObject\MockObject
    {
    }
    /**
     * Returns a mock object for the specified abstract class with all abstract
     * methods of the class mocked.
     *
     * Concrete methods to mock can be specified with the $mockedMethods parameter.
     *
     * @phan-template RealInstanceType of object
     *
     * @phan-param class-string<RealInstanceType> $originalClassName
     *
     * @phan-return MockObject&RealInstanceType
     *
     * @throws ClassAlreadyExistsException
     * @throws ClassIsFinalException
     * @throws ClassIsReadonlyException
     * @throws DuplicateMethodException
     * @throws \PHPUnit\Framework\InvalidArgumentException
     * @throws InvalidMethodNameException
     * @throws OriginalConstructorInvocationRequiredException
     * @throws ReflectionException
     * @throws RuntimeException
     * @throws UnknownClassException
     * @throws UnknownTypeException
     */
    public function getMockForAbstractClass(string $originalClassName, array $arguments = [], string $mockClassName = '', bool $callOriginalConstructor = true, bool $callOriginalClone = true, bool $callAutoload = true, ?array $mockedMethods = null, bool $cloneArguments = true): \PHPUnit\Framework\MockObject\MockObject
    {
    }
    /**
     * Returns a mock object for the specified trait with all abstract methods
     * of the trait mocked. Concrete methods to mock can be specified with the
     * `$mockedMethods` parameter.
     *
     * @phan-param trait-string $traitName
     *
     * @throws ClassAlreadyExistsException
     * @throws ClassIsFinalException
     * @throws ClassIsReadonlyException
     * @throws DuplicateMethodException
     * @throws \PHPUnit\Framework\InvalidArgumentException
     * @throws InvalidMethodNameException
     * @throws OriginalConstructorInvocationRequiredException
     * @throws ReflectionException
     * @throws RuntimeException
     * @throws UnknownClassException
     * @throws UnknownTraitException
     * @throws UnknownTypeException
     */
    public function getMockForTrait(string $traitName, array $arguments = [], string $mockClassName = '', bool $callOriginalConstructor = true, bool $callOriginalClone = true, bool $callAutoload = true, ?array $mockedMethods = null, bool $cloneArguments = true): \PHPUnit\Framework\MockObject\MockObject
    {
    }
    /**
     * Returns an object for the specified trait.
     *
     * @phan-param trait-string $traitName
     *
     * @throws ReflectionException
     * @throws RuntimeException
     * @throws UnknownTraitException
     */
    public function getObjectForTrait(string $traitName, string $traitClassName = '', bool $callAutoload = true, bool $callOriginalConstructor = false, array $arguments = []): object
    {
    }
    /**
     * @throws ClassIsFinalException
     * @throws ClassIsReadonlyException
     * @throws ReflectionException
     * @throws RuntimeException
     */
    public function generate(string $type, ?array $methods = null, string $mockClassName = '', bool $callOriginalClone = true, bool $callAutoload = true, bool $cloneArguments = true, bool $callOriginalMethods = false): \PHPUnit\Framework\MockObject\MockClass
    {
    }
    /**
     * @throws RuntimeException
     * @throws SoapExtensionNotAvailableException
     */
    public function generateClassFromWsdl(string $wsdlFile, string $className, array $methods = [], array $options = []): string
    {
    }
    /**
     * @throws ReflectionException
     *
     * @return string[]
     */
    public function getClassMethods(string $className): array
    {
    }
    /**
     * @throws ReflectionException
     *
     * @return MockMethod[]
     */
    public function mockClassMethods(string $className, bool $callOriginalMethods, bool $cloneArguments): array
    {
    }
    /**
     * @throws ReflectionException
     *
     * @return MockMethod[]
     */
    public function mockInterfaceMethods(string $interfaceName, bool $cloneArguments): array
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class Invocation implements \PHPUnit\Framework\SelfDescribing
{
    public function __construct(string $className, string $methodName, array $parameters, string $returnType, object $object, bool $cloneObjects = false, bool $proxiedCall = false)
    {
    }
    public function getClassName(): string
    {
    }
    public function getMethodName(): string
    {
    }
    public function getParameters(): array
    {
    }
    /**
     * @throws RuntimeException
     *
     * @return mixed Mocked return value
     */
    public function generateReturnValue()
    {
    }
    public function toString(): string
    {
    }
    public function getObject(): object
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class InvocationHandler
{
    public function __construct(array $configurableMethods, bool $returnValueGeneration)
    {
    }
    public function hasMatchers(): bool
    {
    }
    /**
     * Looks up the match builder with identification $id and returns it.
     *
     * @param string $id The identification of the match builder
     */
    public function lookupMatcher(string $id): ?\PHPUnit\Framework\MockObject\Matcher
    {
    }
    /**
     * Registers a matcher with the identification $id. The matcher can later be
     * looked up using lookupMatcher() to figure out if it has been invoked.
     *
     * @param string  $id      The identification of the matcher
     * @param Matcher $matcher The builder which is being registered
     *
     * @throws MatcherAlreadyRegisteredException
     */
    public function registerMatcher(string $id, \PHPUnit\Framework\MockObject\Matcher $matcher): void
    {
    }
    public function expects(\PHPUnit\Framework\MockObject\Rule\InvocationOrder $rule): \PHPUnit\Framework\MockObject\Builder\InvocationMocker
    {
    }
    /**
     * @throws \Exception
     * @throws RuntimeException
     */
    public function invoke(\PHPUnit\Framework\MockObject\Invocation $invocation)
    {
    }
    public function matches(\PHPUnit\Framework\MockObject\Invocation $invocation): bool
    {
    }
    /**
     * @throws \Throwable
     */
    public function verify(): void
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class Matcher
{
    public function __construct(\PHPUnit\Framework\MockObject\Rule\InvocationOrder $rule)
    {
    }
    public function hasMatchers(): bool
    {
    }
    public function hasMethodNameRule(): bool
    {
    }
    public function getMethodNameRule(): \PHPUnit\Framework\MockObject\Rule\MethodName
    {
    }
    public function setMethodNameRule(\PHPUnit\Framework\MockObject\Rule\MethodName $rule): void
    {
    }
    public function hasParametersRule(): bool
    {
    }
    public function setParametersRule(\PHPUnit\Framework\MockObject\Rule\ParametersRule $rule): void
    {
    }
    public function setStub(\PHPUnit\Framework\MockObject\Stub\Stub $stub): void
    {
    }
    public function setAfterMatchBuilderId(string $id): void
    {
    }
    /**
     * @throws \PHPUnit\Framework\ExpectationFailedException
     * @throws MatchBuilderNotFoundException
     * @throws MethodNameNotConfiguredException
     * @throws RuntimeException
     */
    public function invoked(\PHPUnit\Framework\MockObject\Invocation $invocation)
    {
    }
    /**
     * @throws \PHPUnit\Framework\ExpectationFailedException
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     * @throws MatchBuilderNotFoundException
     * @throws MethodNameNotConfiguredException
     * @throws RuntimeException
     */
    public function matches(\PHPUnit\Framework\MockObject\Invocation $invocation): bool
    {
    }
    /**
     * @throws \PHPUnit\Framework\ExpectationFailedException
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     * @throws MethodNameNotConfiguredException
     */
    public function verify(): void
    {
    }
    public function toString(): string
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class MethodNameConstraint extends \PHPUnit\Framework\Constraint\Constraint
{
    public function __construct(string $methodName)
    {
    }
    public function toString(): string
    {
    }
}
/**
 * @phan-template MockedType
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 */
final class MockBuilder
{
    /**
     * @param string|string[] $type
     *
     * @phan-param class-string<MockedType>|string|string[] $type
     */
    public function __construct(\PHPUnit\Framework\TestCase $testCase, $type)
    {
    }
    /**
     * Creates a mock object using a fluent interface.
     *
     * @throws ClassAlreadyExistsException
     * @throws ClassIsFinalException
     * @throws ClassIsReadonlyException
     * @throws DuplicateMethodException
     * @throws \PHPUnit\Framework\InvalidArgumentException
     * @throws InvalidMethodNameException
     * @throws OriginalConstructorInvocationRequiredException
     * @throws ReflectionException
     * @throws RuntimeException
     * @throws UnknownTypeException
     *
     * @phan-return MockObject&MockedType
     */
    public function getMock(): \PHPUnit\Framework\MockObject\MockObject
    {
    }
    /**
     * Creates a mock object for an abstract class using a fluent interface.
     *
     * @phan-return MockObject&MockedType
     *
     * @throws \PHPUnit\Framework\Exception
     * @throws ReflectionException
     * @throws RuntimeException
     */
    public function getMockForAbstractClass(): \PHPUnit\Framework\MockObject\MockObject
    {
    }
    /**
     * Creates a mock object for a trait using a fluent interface.
     *
     * @phan-return MockObject&MockedType
     *
     * @throws \PHPUnit\Framework\Exception
     * @throws ReflectionException
     * @throws RuntimeException
     */
    public function getMockForTrait(): \PHPUnit\Framework\MockObject\MockObject
    {
    }
    /**
     * Specifies the subset of methods to mock. Default is to mock none of them.
     *
     * @deprecated https://github.com/sebastianbergmann/phpunit/pull/3687
     *
     * @return $this
     * @phan-return $this<MockedType>
     */
    public function setMethods(?array $methods = null): self
    {
    }
    /**
     * Specifies the subset of methods to mock, requiring each to exist in the class.
     *
     * @param string[] $methods
     *
     * @throws CannotUseOnlyMethodsException
     * @throws ReflectionException
     *
     * @return $this
     * @phan-return $this<MockedType>
     */
    public function onlyMethods(array $methods): self
    {
    }
    /**
     * Specifies methods that don't exist in the class which you want to mock.
     *
     * @param string[] $methods
     *
     * @throws CannotUseAddMethodsException
     * @throws ReflectionException
     * @throws RuntimeException
     *
     * @return $this
     * @phan-return $this<MockedType>
     */
    public function addMethods(array $methods): self
    {
    }
    /**
     * Specifies the subset of methods to not mock. Default is to mock all of them.
     *
     * @deprecated https://github.com/sebastianbergmann/phpunit/pull/3687
     *
     * @throws ReflectionException
     */
    public function setMethodsExcept(array $methods = []): self
    {
    }
    /**
     * Specifies the arguments for the constructor.
     *
     * @return $this
     * @phan-return $this<MockedType>
     */
    public function setConstructorArgs(array $args): self
    {
    }
    /**
     * Specifies the name for the mock class.
     *
     * @return $this
     * @phan-return $this<MockedType>
     */
    public function setMockClassName(string $name): self
    {
    }
    /**
     * Disables the invocation of the original constructor.
     *
     * @return $this
     * @phan-return $this<MockedType>
     */
    public function disableOriginalConstructor(): self
    {
    }
    /**
     * Enables the invocation of the original constructor.
     *
     * @return $this
     * @phan-return $this<MockedType>
     */
    public function enableOriginalConstructor(): self
    {
    }
    /**
     * Disables the invocation of the original clone constructor.
     *
     * @return $this
     * @phan-return $this<MockedType>
     */
    public function disableOriginalClone(): self
    {
    }
    /**
     * Enables the invocation of the original clone constructor.
     *
     * @return $this
     * @phan-return $this<MockedType>
     */
    public function enableOriginalClone(): self
    {
    }
    /**
     * Disables the use of class autoloading while creating the mock object.
     *
     * @return $this
     * @phan-return $this<MockedType>
     */
    public function disableAutoload(): self
    {
    }
    /**
     * Enables the use of class autoloading while creating the mock object.
     *
     * @return $this
     * @phan-return $this<MockedType>
     */
    public function enableAutoload(): self
    {
    }
    /**
     * Disables the cloning of arguments passed to mocked methods.
     *
     * @return $this
     * @phan-return $this<MockedType>
     */
    public function disableArgumentCloning(): self
    {
    }
    /**
     * Enables the cloning of arguments passed to mocked methods.
     *
     * @return $this
     * @phan-return $this<MockedType>
     */
    public function enableArgumentCloning(): self
    {
    }
    /**
     * Enables the invocation of the original methods.
     *
     * @return $this
     * @phan-return $this<MockedType>
     */
    public function enableProxyingToOriginalMethods(): self
    {
    }
    /**
     * Disables the invocation of the original methods.
     *
     * @return $this
     * @phan-return $this<MockedType>
     */
    public function disableProxyingToOriginalMethods(): self
    {
    }
    /**
     * Sets the proxy target.
     *
     * @return $this
     * @phan-return $this<MockedType>
     */
    public function setProxyTarget(object $object): self
    {
    }
    /**
     * @return $this
     * @phan-return $this<MockedType>
     */
    public function allowMockingUnknownTypes(): self
    {
    }
    /**
     * @return $this
     * @phan-return $this<MockedType>
     */
    public function disallowMockingUnknownTypes(): self
    {
    }
    /**
     * @return $this
     * @phan-return $this<MockedType>
     */
    public function enableAutoReturnValueGeneration(): self
    {
    }
    /**
     * @return $this
     * @phan-return $this<MockedType>
     */
    public function disableAutoReturnValueGeneration(): self
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class MockClass implements \PHPUnit\Framework\MockObject\MockType
{
    /**
     * @phan-param class-string $mockName
     */
    public function __construct(string $classCode, string $mockName, array $configurableMethods)
    {
    }
    /**
     * @phan-return class-string
     */
    public function generate(): string
    {
    }
    public function getClassCode(): string
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class MockMethod
{
    /**
     * @throws ReflectionException
     * @throws RuntimeException
     */
    public static function fromReflection(\ReflectionMethod $method, bool $callOriginalMethod, bool $cloneArguments): self
    {
    }
    public static function fromName(string $fullClassName, string $methodName, bool $cloneArguments): self
    {
    }
    public function __construct(string $className, string $methodName, bool $cloneArguments, string $modifier, string $argumentsForDeclaration, string $argumentsForCall, \SebastianBergmann\Type\Type $returnType, string $reference, bool $callOriginalMethod, bool $static, ?string $deprecation)
    {
    }
    public function getName(): string
    {
    }
    /**
     * @throws RuntimeException
     */
    public function generateCode(): string
    {
    }
    public function getReturnType(): \SebastianBergmann\Type\Type
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class MockMethodSet
{
    public function addMethods(\PHPUnit\Framework\MockObject\MockMethod ...$methods): void
    {
    }
    /**
     * @return MockMethod[]
     */
    public function asArray(): array
    {
    }
    public function hasMethod(string $methodName): bool
    {
    }
}
/**
 * @method Builder\InvocationMocker method($constraint)
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 */
interface MockObject extends \PHPUnit\Framework\MockObject\Stub
{
    public function __phpunit_setOriginalObject($originalObject): void;
    public function __phpunit_verify(bool $unsetInvocationMocker = true): void;
    public function expects(\PHPUnit\Framework\MockObject\Rule\InvocationOrder $invocationRule): \PHPUnit\Framework\MockObject\Builder\InvocationMocker;
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class MockTrait implements \PHPUnit\Framework\MockObject\MockType
{
    /**
     * @phan-param class-string $mockName
     */
    public function __construct(string $classCode, string $mockName)
    {
    }
    /**
     * @phan-return class-string
     */
    public function generate(): string
    {
    }
    public function getClassCode(): string
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
interface MockType
{
    /**
     * @phan-return class-string
     */
    public function generate(): string;
}
/**
 * @method Builder\InvocationStubber method($constraint)
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 */
interface Stub
{
    public function __phpunit_getInvocationHandler(): \PHPUnit\Framework\MockObject\InvocationHandler;
    public function __phpunit_hasMatchers(): bool;
    public function __phpunit_setReturnValueGeneration(bool $returnValueGeneration): void;
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
interface Verifiable
{
    /**
     * Verifies that the current expectation is valid. If everything is OK the
     * code should just return, if not it must throw an exception.
     *
     * @throws \PHPUnit\Framework\ExpectationFailedException
     */
    public function verify(): void;
}
namespace PHPUnit\Framework\MockObject\Builder;

/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
interface Identity
{
    /**
     * Sets the identification of the expectation to $id.
     *
     * @note The identifier is unique per mock object.
     *
     * @param string $id unique identification of expectation
     */
    public function id($id);
}
/**
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 */
final class InvocationMocker implements \PHPUnit\Framework\MockObject\Builder\InvocationStubber, \PHPUnit\Framework\MockObject\Builder\MethodNameMatch
{
    public function __construct(\PHPUnit\Framework\MockObject\InvocationHandler $handler, \PHPUnit\Framework\MockObject\Matcher $matcher, \PHPUnit\Framework\MockObject\ConfigurableMethod ...$configurableMethods)
    {
    }
    /**
     * @throws \PHPUnit\Framework\MockObject\MatcherAlreadyRegisteredException
     *
     * @return $this
     */
    public function id($id): self
    {
    }
    /**
     * @return $this
     */
    public function will(\PHPUnit\Framework\MockObject\Stub\Stub $stub): \PHPUnit\Framework\MockObject\Builder\Identity
    {
    }
    /**
     * @param mixed   $value
     * @param mixed $nextValues
     *
     * @throws \PHPUnit\Framework\MockObject\IncompatibleReturnValueException
     */
    public function willReturn($value, ...$nextValues): self
    {
    }
    public function willReturnReference(&$reference): self
    {
    }
    public function willReturnMap(array $valueMap): self
    {
    }
    public function willReturnArgument($argumentIndex): self
    {
    }
    public function willReturnCallback($callback): self
    {
    }
    public function willReturnSelf(): self
    {
    }
    public function willReturnOnConsecutiveCalls(...$values): self
    {
    }
    public function willThrowException(\Throwable $exception): self
    {
    }
    /**
     * @return $this
     */
    public function after($id): self
    {
    }
    /**
     * @param mixed $nextValues
     *
     * @throws \PHPUnit\Framework\Exception
     * @throws \PHPUnit\Framework\MockObject\MethodNameNotConfiguredException
     * @throws \PHPUnit\Framework\MockObject\MethodParametersAlreadyConfiguredException
     *
     * @return $this
     */
    public function with(...$arguments): self
    {
    }
    /**
     * @param array ...$arguments
     *
     * @throws \PHPUnit\Framework\Exception
     * @throws \PHPUnit\Framework\MockObject\MethodNameNotConfiguredException
     * @throws \PHPUnit\Framework\MockObject\MethodParametersAlreadyConfiguredException
     *
     * @return $this
     *
     * @deprecated
     */
    public function withConsecutive(...$arguments): self
    {
    }
    /**
     * @throws \PHPUnit\Framework\MockObject\MethodNameNotConfiguredException
     * @throws \PHPUnit\Framework\MockObject\MethodParametersAlreadyConfiguredException
     *
     * @return $this
     */
    public function withAnyParameters(): self
    {
    }
    /**
     * @param \PHPUnit\Framework\Constraint\Constraint|string $constraint
     *
     * @throws \PHPUnit\Framework\InvalidArgumentException
     * @throws \PHPUnit\Framework\MockObject\MethodCannotBeConfiguredException
     * @throws \PHPUnit\Framework\MockObject\MethodNameAlreadyConfiguredException
     *
     * @return $this
     */
    public function method($constraint): self
    {
    }
}
/**
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 */
interface InvocationStubber
{
    public function will(\PHPUnit\Framework\MockObject\Stub\Stub $stub): \PHPUnit\Framework\MockObject\Builder\Identity;
    /** @return self */
    public function willReturn($value, ...$nextValues);
    /**
     * @param mixed $reference
     *
     * @return self
     */
    public function willReturnReference(&$reference);
    /**
     * @param array<int, array<int, mixed>> $valueMap
     *
     * @return self
     */
    public function willReturnMap(array $valueMap);
    /**
     * @param int $argumentIndex
     *
     * @return self
     */
    public function willReturnArgument($argumentIndex);
    /**
     * @param callable $callback
     *
     * @return self
     */
    public function willReturnCallback($callback);
    /** @return self */
    public function willReturnSelf();
    /**
     * @param mixed $values
     *
     * @return self
     */
    public function willReturnOnConsecutiveCalls(...$values);
    /** @return self */
    public function willThrowException(\Throwable $exception);
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
interface MethodNameMatch extends \PHPUnit\Framework\MockObject\Builder\ParametersMatch
{
    /**
     * Adds a new method name match and returns the parameter match object for
     * further matching possibilities.
     *
     * @param \PHPUnit\Framework\Constraint\Constraint $constraint Constraint for matching method, if a string is passed it will use the PHPUnit_Framework_Constraint_IsEqual
     *
     * @return ParametersMatch
     */
    public function method($constraint);
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
interface ParametersMatch extends \PHPUnit\Framework\MockObject\Builder\Stub
{
    /**
     * Defines the expectation which must occur before the current is valid.
     *
     * @param string $id the identification of the expectation that should
     *                   occur before this one
     *
     * @return Stub
     */
    public function after($id);
    /**
     * Sets the parameters to match for, each parameter to this function will
     * be part of match. To perform specific matches or constraints create a
     * new PHPUnit\Framework\Constraint\Constraint and use it for the parameter.
     * If the parameter value is not a constraint it will use the
     * PHPUnit\Framework\Constraint\IsEqual for the value.
     *
     * Some examples:
     * <code>
     * // match first parameter with value 2
     * $b->with(2);
     * // match first parameter with value 'smock' and second identical to 42
     * $b->with('smock', new PHPUnit\Framework\Constraint\IsEqual(42));
     * </code>
     *
     * @return ParametersMatch
     */
    public function with(...$arguments);
    /**
     * Sets a rule which allows any kind of parameters.
     *
     * Some examples:
     * <code>
     * // match any number of parameters
     * $b->withAnyParameters();
     * </code>
     *
     * @return ParametersMatch
     */
    public function withAnyParameters();
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
interface Stub extends \PHPUnit\Framework\MockObject\Builder\Identity
{
    /**
     * Stubs the matching method with the stub object $stub. Any invocations of
     * the matched method will now be handled by the stub instead.
     */
    public function will(\PHPUnit\Framework\MockObject\Stub\Stub $stub): \PHPUnit\Framework\MockObject\Builder\Identity;
}
namespace PHPUnit\Framework\MockObject\Rule;

/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class AnyInvokedCount extends \PHPUnit\Framework\MockObject\Rule\InvocationOrder
{
    public function toString(): string
    {
    }
    public function verify(): void
    {
    }
    public function matches(\PHPUnit\Framework\MockObject\Invocation $invocation): bool
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class AnyParameters implements \PHPUnit\Framework\MockObject\Rule\ParametersRule
{
    public function toString(): string
    {
    }
    public function apply(\PHPUnit\Framework\MockObject\Invocation $invocation): void
    {
    }
    public function verify(): void
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 *
 * @deprecated
 */
final class ConsecutiveParameters implements \PHPUnit\Framework\MockObject\Rule\ParametersRule
{
    /**
     * @throws \PHPUnit\Framework\Exception
     */
    public function __construct(array $parameterGroups)
    {
    }
    public function toString(): string
    {
    }
    /**
     * @throws \PHPUnit\Framework\ExpectationFailedException
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     */
    public function apply(\PHPUnit\Framework\MockObject\Invocation $invocation): void
    {
    }
    /**
     * @throws \PHPUnit\Framework\ExpectationFailedException
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     */
    public function verify(): void
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
abstract class InvocationOrder implements \PHPUnit\Framework\SelfDescribing, \PHPUnit\Framework\MockObject\Verifiable
{
    public function getInvocationCount(): int
    {
    }
    public function hasBeenInvoked(): bool
    {
    }
    final public function invoked(\PHPUnit\Framework\MockObject\Invocation $invocation)
    {
    }
    abstract public function matches(\PHPUnit\Framework\MockObject\Invocation $invocation): bool;
    abstract protected function invokedDo(\PHPUnit\Framework\MockObject\Invocation $invocation);
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 *
 * @deprecated https://github.com/sebastianbergmann/phpunit/issues/4297
 *
 * @codeCoverageIgnore
 */
final class InvokedAtIndex extends \PHPUnit\Framework\MockObject\Rule\InvocationOrder
{
    /**
     * @param int $sequenceIndex
     */
    public function __construct($sequenceIndex)
    {
    }
    public function toString(): string
    {
    }
    public function matches(\PHPUnit\Framework\MockObject\Invocation $invocation): bool
    {
    }
    /**
     * Verifies that the current expectation is valid. If everything is OK the
     * code should just return, if not it must throw an exception.
     *
     * @throws \PHPUnit\Framework\ExpectationFailedException
     */
    public function verify(): void
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class InvokedAtLeastCount extends \PHPUnit\Framework\MockObject\Rule\InvocationOrder
{
    /**
     * @param int $requiredInvocations
     */
    public function __construct($requiredInvocations)
    {
    }
    public function toString(): string
    {
    }
    /**
     * Verifies that the current expectation is valid. If everything is OK the
     * code should just return, if not it must throw an exception.
     *
     * @throws \PHPUnit\Framework\ExpectationFailedException
     */
    public function verify(): void
    {
    }
    public function matches(\PHPUnit\Framework\MockObject\Invocation $invocation): bool
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class InvokedAtLeastOnce extends \PHPUnit\Framework\MockObject\Rule\InvocationOrder
{
    public function toString(): string
    {
    }
    /**
     * Verifies that the current expectation is valid. If everything is OK the
     * code should just return, if not it must throw an exception.
     *
     * @throws \PHPUnit\Framework\ExpectationFailedException
     */
    public function verify(): void
    {
    }
    public function matches(\PHPUnit\Framework\MockObject\Invocation $invocation): bool
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class InvokedAtMostCount extends \PHPUnit\Framework\MockObject\Rule\InvocationOrder
{
    /**
     * @param int $allowedInvocations
     */
    public function __construct($allowedInvocations)
    {
    }
    public function toString(): string
    {
    }
    /**
     * Verifies that the current expectation is valid. If everything is OK the
     * code should just return, if not it must throw an exception.
     *
     * @throws \PHPUnit\Framework\ExpectationFailedException
     */
    public function verify(): void
    {
    }
    public function matches(\PHPUnit\Framework\MockObject\Invocation $invocation): bool
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class InvokedCount extends \PHPUnit\Framework\MockObject\Rule\InvocationOrder
{
    /**
     * @param int $expectedCount
     */
    public function __construct($expectedCount)
    {
    }
    public function isNever(): bool
    {
    }
    public function toString(): string
    {
    }
    public function matches(\PHPUnit\Framework\MockObject\Invocation $invocation): bool
    {
    }
    /**
     * Verifies that the current expectation is valid. If everything is OK the
     * code should just return, if not it must throw an exception.
     *
     * @throws \PHPUnit\Framework\ExpectationFailedException
     */
    public function verify(): void
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class MethodName
{
    /**
     * @param \PHPUnit\Framework\Constraint\Constraint|string $constraint
     *
     * @throws \PHPUnit\Framework\InvalidArgumentException
     */
    public function __construct($constraint)
    {
    }
    public function toString(): string
    {
    }
    /**
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     * @throws \PHPUnit\Framework\ExpectationFailedException
     */
    public function matches(\PHPUnit\Framework\MockObject\Invocation $invocation): bool
    {
    }
    /**
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     * @throws \PHPUnit\Framework\ExpectationFailedException
     */
    public function matchesName(string $methodName): bool
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class Parameters implements \PHPUnit\Framework\MockObject\Rule\ParametersRule
{
    /**
     * @throws \PHPUnit\Framework\Exception
     */
    public function __construct(array $parameters)
    {
    }
    public function toString(): string
    {
    }
    /**
     * @throws \Exception
     */
    public function apply(\PHPUnit\Framework\MockObject\Invocation $invocation): void
    {
    }
    /**
     * Checks if the invocation $invocation matches the current rules. If it
     * does the rule will get the invoked() method called which should check
     * if an expectation is met.
     *
     * @throws \PHPUnit\Framework\ExpectationFailedException
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     */
    public function verify(): void
    {
    }
}
/**
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 */
interface ParametersRule extends \PHPUnit\Framework\SelfDescribing, \PHPUnit\Framework\MockObject\Verifiable
{
    /**
     * @throws \PHPUnit\Framework\ExpectationFailedException if the invocation violates the rule
     */
    public function apply(\PHPUnit\Framework\MockObject\Invocation $invocation): void;
    public function verify(): void;
}
namespace PHPUnit\Framework\MockObject\Stub;

/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class ConsecutiveCalls implements \PHPUnit\Framework\MockObject\Stub\Stub
{
    public function __construct(array $stack)
    {
    }
    public function invoke(\PHPUnit\Framework\MockObject\Invocation $invocation)
    {
    }
    public function toString(): string
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class Exception implements \PHPUnit\Framework\MockObject\Stub\Stub
{
    public function __construct(\Throwable $exception)
    {
    }
    /**
     * @throws \Throwable
     */
    public function invoke(\PHPUnit\Framework\MockObject\Invocation $invocation): void
    {
    }
    public function toString(): string
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class ReturnArgument implements \PHPUnit\Framework\MockObject\Stub\Stub
{
    public function __construct($argumentIndex)
    {
    }
    public function invoke(\PHPUnit\Framework\MockObject\Invocation $invocation)
    {
    }
    public function toString(): string
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class ReturnCallback implements \PHPUnit\Framework\MockObject\Stub\Stub
{
    public function __construct($callback)
    {
    }
    public function invoke(\PHPUnit\Framework\MockObject\Invocation $invocation)
    {
    }
    public function toString(): string
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class ReturnReference implements \PHPUnit\Framework\MockObject\Stub\Stub
{
    public function __construct(&$reference)
    {
    }
    public function invoke(\PHPUnit\Framework\MockObject\Invocation $invocation)
    {
    }
    public function toString(): string
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class ReturnSelf implements \PHPUnit\Framework\MockObject\Stub\Stub
{
    /**
     * @throws \PHPUnit\Framework\MockObject\RuntimeException
     */
    public function invoke(\PHPUnit\Framework\MockObject\Invocation $invocation)
    {
    }
    public function toString(): string
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class ReturnStub implements \PHPUnit\Framework\MockObject\Stub\Stub
{
    public function __construct($value)
    {
    }
    public function invoke(\PHPUnit\Framework\MockObject\Invocation $invocation)
    {
    }
    public function toString(): string
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class ReturnValueMap implements \PHPUnit\Framework\MockObject\Stub\Stub
{
    public function __construct(array $valueMap)
    {
    }
    public function invoke(\PHPUnit\Framework\MockObject\Invocation $invocation)
    {
    }
    public function toString(): string
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
interface Stub extends \PHPUnit\Framework\SelfDescribing
{
    /**
     * Fakes the processing of the invocation $invocation by returning a
     * specific value.
     *
     * @param \PHPUnit\Framework\MockObject\Invocation $invocation The invocation which was mocked and matched by the current method and argument matchers
     */
    public function invoke(\PHPUnit\Framework\MockObject\Invocation $invocation);
}
namespace PHPUnit\Runner;

/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
abstract class BaseTestRunner
{
    /**
     * @var int
     */
    public const STATUS_UNKNOWN = -1;
    /**
     * @var int
     */
    public const STATUS_PASSED = 0;
    /**
     * @var int
     */
    public const STATUS_SKIPPED = 1;
    /**
     * @var int
     */
    public const STATUS_INCOMPLETE = 2;
    /**
     * @var int
     */
    public const STATUS_FAILURE = 3;
    /**
     * @var int
     */
    public const STATUS_ERROR = 4;
    /**
     * @var int
     */
    public const STATUS_RISKY = 5;
    /**
     * @var int
     */
    public const STATUS_WARNING = 6;
    /**
     * @var string
     */
    public const SUITE_METHODNAME = 'suite';
    /**
     * Returns the loader to be used.
     */
    public function getLoader(): \PHPUnit\Runner\TestSuiteLoader
    {
    }
    /**
     * Returns the Test corresponding to the given suite.
     * This is a template method, subclasses override
     * the runFailed() and clearStatus() methods.
     *
     * @param string|string[] $suffixes
     *
     * @throws \PHPUnit\Framework\Exception
     */
    public function getTest(string $suiteClassFile, $suffixes = ''): ?\PHPUnit\Framework\TestSuite
    {
    }
    /**
     * Returns the loaded ReflectionClass for a suite name.
     */
    protected function loadSuiteClass(string $suiteClassFile): \ReflectionClass
    {
    }
    /**
     * Clears the status message.
     */
    protected function clearStatus(): void
    {
    }
    /**
     * Override to define how to handle a failed loading of
     * a test suite.
     */
    abstract protected function runFailed(string $message): void;
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class DefaultTestResultCache implements \PHPUnit\Runner\TestResultCache
{
    public function __construct(?string $filepath = null)
    {
    }
    public function setState(string $testName, int $state): void
    {
    }
    public function getState(string $testName): int
    {
    }
    public function setTime(string $testName, float $time): void
    {
    }
    public function getTime(string $testName): float
    {
    }
    public function load(): void
    {
    }
    /**
     * @throws Exception
     */
    public function persist(): void
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class Exception extends \RuntimeException implements \PHPUnit\Exception
{
}
/**
 * This interface, as well as the associated mechanism for extending PHPUnit,
 * will be removed in PHPUnit 10. There is no alternative available in this
 * version of PHPUnit.
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see https://github.com/sebastianbergmann/phpunit/issues/4676
 */
interface AfterIncompleteTestHook extends \PHPUnit\Runner\TestHook
{
    public function executeAfterIncompleteTest(string $test, string $message, float $time): void;
}
/**
 * This interface, as well as the associated mechanism for extending PHPUnit,
 * will be removed in PHPUnit 10. There is no alternative available in this
 * version of PHPUnit.
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see https://github.com/sebastianbergmann/phpunit/issues/4676
 */
interface AfterLastTestHook extends \PHPUnit\Runner\Hook
{
    public function executeAfterLastTest(): void;
}
/**
 * This interface, as well as the associated mechanism for extending PHPUnit,
 * will be removed in PHPUnit 10. There is no alternative available in this
 * version of PHPUnit.
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see https://github.com/sebastianbergmann/phpunit/issues/4676
 */
interface AfterRiskyTestHook extends \PHPUnit\Runner\TestHook
{
    public function executeAfterRiskyTest(string $test, string $message, float $time): void;
}
/**
 * This interface, as well as the associated mechanism for extending PHPUnit,
 * will be removed in PHPUnit 10. There is no alternative available in this
 * version of PHPUnit.
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see https://github.com/sebastianbergmann/phpunit/issues/4676
 */
interface AfterSkippedTestHook extends \PHPUnit\Runner\TestHook
{
    public function executeAfterSkippedTest(string $test, string $message, float $time): void;
}
/**
 * This interface, as well as the associated mechanism for extending PHPUnit,
 * will be removed in PHPUnit 10. There is no alternative available in this
 * version of PHPUnit.
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see https://github.com/sebastianbergmann/phpunit/issues/4676
 */
interface AfterSuccessfulTestHook extends \PHPUnit\Runner\TestHook
{
    public function executeAfterSuccessfulTest(string $test, float $time): void;
}
/**
 * This interface, as well as the associated mechanism for extending PHPUnit,
 * will be removed in PHPUnit 10. There is no alternative available in this
 * version of PHPUnit.
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see https://github.com/sebastianbergmann/phpunit/issues/4676
 */
interface AfterTestErrorHook extends \PHPUnit\Runner\TestHook
{
    public function executeAfterTestError(string $test, string $message, float $time): void;
}
/**
 * This interface, as well as the associated mechanism for extending PHPUnit,
 * will be removed in PHPUnit 10. There is no alternative available in this
 * version of PHPUnit.
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see https://github.com/sebastianbergmann/phpunit/issues/4676
 */
interface AfterTestFailureHook extends \PHPUnit\Runner\TestHook
{
    public function executeAfterTestFailure(string $test, string $message, float $time): void;
}
/**
 * This interface, as well as the associated mechanism for extending PHPUnit,
 * will be removed in PHPUnit 10. There is no alternative available in this
 * version of PHPUnit.
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see https://github.com/sebastianbergmann/phpunit/issues/4676
 */
interface AfterTestHook extends \PHPUnit\Runner\TestHook
{
    /**
     * This hook will fire after any test, regardless of the result.
     *
     * For more fine grained control, have a look at the other hooks
     * that extend PHPUnit\Runner\Hook.
     */
    public function executeAfterTest(string $test, float $time): void;
}
/**
 * This interface, as well as the associated mechanism for extending PHPUnit,
 * will be removed in PHPUnit 10. There is no alternative available in this
 * version of PHPUnit.
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see https://github.com/sebastianbergmann/phpunit/issues/4676
 */
interface AfterTestWarningHook extends \PHPUnit\Runner\TestHook
{
    public function executeAfterTestWarning(string $test, string $message, float $time): void;
}
/**
 * This interface, as well as the associated mechanism for extending PHPUnit,
 * will be removed in PHPUnit 10. There is no alternative available in this
 * version of PHPUnit.
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see https://github.com/sebastianbergmann/phpunit/issues/4676
 */
interface BeforeFirstTestHook extends \PHPUnit\Runner\Hook
{
    public function executeBeforeFirstTest(): void;
}
/**
 * This interface, as well as the associated mechanism for extending PHPUnit,
 * will be removed in PHPUnit 10. There is no alternative available in this
 * version of PHPUnit.
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see https://github.com/sebastianbergmann/phpunit/issues/4676
 */
interface BeforeTestHook extends \PHPUnit\Runner\TestHook
{
    public function executeBeforeTest(string $test): void;
}
/**
 * This interface, as well as the associated mechanism for extending PHPUnit,
 * will be removed in PHPUnit 10. There is no alternative available in this
 * version of PHPUnit.
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see https://github.com/sebastianbergmann/phpunit/issues/4676
 */
interface Hook
{
}
/**
 * This interface, as well as the associated mechanism for extending PHPUnit,
 * will be removed in PHPUnit 10. There is no alternative available in this
 * version of PHPUnit.
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 *
 * @see https://github.com/sebastianbergmann/phpunit/issues/4676
 */
interface TestHook extends \PHPUnit\Runner\Hook
{
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class TestListenerAdapter implements \PHPUnit\Framework\TestListener
{
    public function add(\PHPUnit\Runner\TestHook $hook): void
    {
    }
    public function startTest(\PHPUnit\Framework\Test $test): void
    {
    }
    public function addError(\PHPUnit\Framework\Test $test, \Throwable $t, float $time): void
    {
    }
    public function addWarning(\PHPUnit\Framework\Test $test, \PHPUnit\Framework\Warning $e, float $time): void
    {
    }
    public function addFailure(\PHPUnit\Framework\Test $test, \PHPUnit\Framework\AssertionFailedError $e, float $time): void
    {
    }
    public function addIncompleteTest(\PHPUnit\Framework\Test $test, \Throwable $t, float $time): void
    {
    }
    public function addRiskyTest(\PHPUnit\Framework\Test $test, \Throwable $t, float $time): void
    {
    }
    public function addSkippedTest(\PHPUnit\Framework\Test $test, \Throwable $t, float $time): void
    {
    }
    public function endTest(\PHPUnit\Framework\Test $test, float $time): void
    {
    }
    public function startTestSuite(\PHPUnit\Framework\TestSuite $suite): void
    {
    }
    public function endTestSuite(\PHPUnit\Framework\TestSuite $suite): void
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class NullTestResultCache implements \PHPUnit\Runner\TestResultCache
{
    public function setState(string $testName, int $state): void
    {
    }
    public function getState(string $testName): int
    {
    }
    public function setTime(string $testName, float $time): void
    {
    }
    public function getTime(string $testName): float
    {
    }
    public function load(): void
    {
    }
    public function persist(): void
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class PhptTestCase implements \PHPUnit\Framework\Reorderable, \PHPUnit\Framework\SelfDescribing, \PHPUnit\Framework\Test
{
    /**
     * Constructs a test case with the given filename.
     *
     * @throws Exception
     */
    public function __construct(string $filename, ?\PHPUnit\Util\PHP\AbstractPhpProcess $phpUtil = null)
    {
    }
    /**
     * Counts the number of test cases executed by run(TestResult result).
     */
    public function count(): int
    {
    }
    /**
     * Runs a test and collects its result in a TestResult instance.
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     * @throws Exception
     * @throws \SebastianBergmann\CodeCoverage\InvalidArgumentException
     * @throws \SebastianBergmann\CodeCoverage\UnintentionallyCoveredCodeException
     */
    public function run(?\PHPUnit\Framework\TestResult $result = null): \PHPUnit\Framework\TestResult
    {
    }
    /**
     * Returns the name of the test case.
     */
    public function getName(): string
    {
    }
    /**
     * Returns a string representation of the test case.
     */
    public function toString(): string
    {
    }
    public function usesDataProvider(): bool
    {
    }
    public function getNumAssertions(): int
    {
    }
    public function getActualOutput(): string
    {
    }
    public function hasOutput(): bool
    {
    }
    public function sortId(): string
    {
    }
    /**
     * @return list<\PHPUnit\Framework\ExecutionOrderDependency>
     */
    public function provides(): array
    {
    }
    /**
     * @return list<\PHPUnit\Framework\ExecutionOrderDependency>
     */
    public function requires(): array
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class ResultCacheExtension implements \PHPUnit\Runner\AfterIncompleteTestHook, \PHPUnit\Runner\AfterLastTestHook, \PHPUnit\Runner\AfterRiskyTestHook, \PHPUnit\Runner\AfterSkippedTestHook, \PHPUnit\Runner\AfterSuccessfulTestHook, \PHPUnit\Runner\AfterTestErrorHook, \PHPUnit\Runner\AfterTestFailureHook, \PHPUnit\Runner\AfterTestWarningHook
{
    public function __construct(\PHPUnit\Runner\TestResultCache $cache)
    {
    }
    public function flush(): void
    {
    }
    public function executeAfterSuccessfulTest(string $test, float $time): void
    {
    }
    public function executeAfterIncompleteTest(string $test, string $message, float $time): void
    {
    }
    public function executeAfterRiskyTest(string $test, string $message, float $time): void
    {
    }
    public function executeAfterSkippedTest(string $test, string $message, float $time): void
    {
    }
    public function executeAfterTestError(string $test, string $message, float $time): void
    {
    }
    public function executeAfterTestFailure(string $test, string $message, float $time): void
    {
    }
    public function executeAfterTestWarning(string $test, string $message, float $time): void
    {
    }
    public function executeAfterLastTest(): void
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 *
 * @deprecated see https://github.com/sebastianbergmann/phpunit/issues/4039
 */
final class StandardTestSuiteLoader implements \PHPUnit\Runner\TestSuiteLoader
{
    /**
     * @throws Exception
     */
    public function load(string $suiteClassFile): \ReflectionClass
    {
    }
    public function reload(\ReflectionClass $aClass): \ReflectionClass
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
interface TestResultCache
{
    public function setState(string $testName, int $state): void;
    public function getState(string $testName): int;
    public function setTime(string $testName, float $time): void;
    public function getTime(string $testName): float;
    public function load(): void;
    public function persist(): void;
}
/**
 * @deprecated see https://github.com/sebastianbergmann/phpunit/issues/4039
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 */
interface TestSuiteLoader
{
    public function load(string $suiteClassFile): \ReflectionClass;
    public function reload(\ReflectionClass $aClass): \ReflectionClass;
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class TestSuiteSorter
{
    /**
     * @var int
     */
    public const ORDER_DEFAULT = 0;
    /**
     * @var int
     */
    public const ORDER_RANDOMIZED = 1;
    /**
     * @var int
     */
    public const ORDER_REVERSED = 2;
    /**
     * @var int
     */
    public const ORDER_DEFECTS_FIRST = 3;
    /**
     * @var int
     */
    public const ORDER_DURATION = 4;
    /**
     * Order tests by @size annotation 'small', 'medium', 'large'.
     *
     * @var int
     */
    public const ORDER_SIZE = 5;
    public function __construct(?\PHPUnit\Runner\TestResultCache $cache = null)
    {
    }
    /**
     * @throws Exception
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     */
    public function reorderTestsInSuite(\PHPUnit\Framework\Test $suite, int $order, bool $resolveDependencies, int $orderDefects, bool $isRootTestSuite = true): void
    {
    }
    public function getOriginalExecutionOrder(): array
    {
    }
    public function getExecutionOrder(): array
    {
    }
}
/**
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 */
final class Version
{
    /**
     * Returns the current version of PHPUnit.
     *
     * @phan-return non-empty-string
     */
    public static function id(): string
    {
    }
    /**
     * @phan-return non-empty-string
     */
    public static function series(): string
    {
    }
    /**
     * @phan-return non-empty-string
     */
    public static function getVersionString(): string
    {
    }
}
namespace PHPUnit\Runner\Extension;

/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class ExtensionHandler
{
    /**
     * @throws \PHPUnit\Runner\Exception
     */
    public function registerExtension(\PHPUnit\TextUI\XmlConfiguration\Extension $extensionConfiguration, \PHPUnit\TextUI\TestRunner $runner): void
    {
    }
    /**
     * @throws \PHPUnit\Runner\Exception
     *
     * @deprecated
     */
    public function createTestListenerInstance(\PHPUnit\TextUI\XmlConfiguration\Extension $listenerConfiguration): \PHPUnit\Framework\TestListener
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class PharLoader
{
    /**
     * @phan-return array{loadedExtensions: list<string>, notLoadedExtensions: list<string>}
     */
    public function loadPharExtensionsInDirectory(string $directory): array
    {
    }
}
namespace PHPUnit\Runner\Filter;

/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class ExcludeGroupFilterIterator extends \PHPUnit\Runner\Filter\GroupFilterIterator
{
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class Factory
{
    /**
     * @param array|string $args
     *
     * @throws \PHPUnit\Runner\Exception
     */
    public function addFilter(\ReflectionClass $filter, $args): void
    {
    }
    public function factory(\Iterator $iterator, \PHPUnit\Framework\TestSuite $suite): \FilterIterator
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
abstract class GroupFilterIterator extends \RecursiveFilterIterator
{
    /**
     * @var string[]
     */
    protected $groupTests = [];
    public function __construct(\RecursiveIterator $iterator, array $groups, \PHPUnit\Framework\TestSuite $suite)
    {
    }
    public function accept(): bool
    {
    }
    abstract protected function doAccept(string $hash);
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class IncludeGroupFilterIterator extends \PHPUnit\Runner\Filter\GroupFilterIterator
{
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class NameFilterIterator extends \RecursiveFilterIterator
{
    /**
     * @throws \Exception
     */
    public function __construct(\RecursiveIterator $iterator, string $filter)
    {
    }
    /**
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     */
    public function accept(): bool
    {
    }
}
namespace PHPUnit\TextUI;

/**
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 */
class Command
{
    /**
     * @var array<string,mixed>
     */
    protected $arguments = [];
    /**
     * @var array<string,mixed>
     */
    protected $longOptions = [];
    /**
     * @throws Exception
     */
    public static function main(bool $exit = true): int
    {
    }
    /**
     * @throws Exception
     */
    public function run(array $argv, bool $exit = true): int
    {
    }
    /**
     * Create a TestRunner, override in subclasses.
     */
    protected function createRunner(): \PHPUnit\TextUI\TestRunner
    {
    }
    /**
     * Handles the command-line arguments.
     *
     * A child class of PHPUnit\TextUI\Command can hook into the argument
     * parsing by adding the switch(es) to the $longOptions array and point to a
     * callback method that handles the switch(es) in the child class like this
     *
     * <code>
     * <?php
     * class MyCommand extends PHPUnit\TextUI\Command
     * {
     *     public function __construct()
     *     {
     *         // my-switch won't accept a value, it's an on/off
     *         $this->longOptions['my-switch'] = 'myHandler';
     *         // my-secondswitch will accept a value - note the equals sign
     *         $this->longOptions['my-secondswitch='] = 'myOtherHandler';
     *     }
     *
     *     // --my-switch  -> myHandler()
     *     protected function myHandler()
     *     {
     *     }
     *
     *     // --my-secondswitch foo -> myOtherHandler('foo')
     *     protected function myOtherHandler ($value)
     *     {
     *     }
     *
     *     // You will also need this - the static keyword in the
     *     // PHPUnit\TextUI\Command will mean that it'll be
     *     // PHPUnit\TextUI\Command that gets instantiated,
     *     // not MyCommand
     *     public static function main($exit = true)
     *     {
     *         $command = new static;
     *
     *         return $command->run($_SERVER['argv'], $exit);
     *     }
     *
     * }
     * </code>
     *
     * @throws Exception
     */
    protected function handleArguments(array $argv): void
    {
    }
    /**
     * Handles the loading of the PHPUnit\Runner\TestSuiteLoader implementation.
     *
     * @deprecated see https://github.com/sebastianbergmann/phpunit/issues/4039
     */
    protected function handleLoader(string $loaderClass, string $loaderFile = ''): ?\PHPUnit\Runner\TestSuiteLoader
    {
    }
    /**
     * Handles the loading of the PHPUnit\Util\Printer implementation.
     *
     * @return null|\PHPUnit\Util\Printer|string
     */
    protected function handlePrinter(string $printerClass, string $printerFile = '')
    {
    }
    /**
     * Loads a bootstrap file.
     */
    protected function handleBootstrap(string $filename): void
    {
    }
    protected function handleVersionCheck(): void
    {
    }
    /**
     * Show the help message.
     */
    protected function showHelp(): void
    {
    }
    /**
     * Custom callback for test suite discovery.
     */
    protected function handleCustomTestSuite(): void
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
class DefaultResultPrinter extends \PHPUnit\Util\Printer implements \PHPUnit\TextUI\ResultPrinter
{
    public const EVENT_TEST_START = 0;
    public const EVENT_TEST_END = 1;
    public const EVENT_TESTSUITE_START = 2;
    public const EVENT_TESTSUITE_END = 3;
    public const COLOR_NEVER = 'never';
    public const COLOR_AUTO = 'auto';
    public const COLOR_ALWAYS = 'always';
    public const COLOR_DEFAULT = self::COLOR_NEVER;
    /**
     * @var int
     */
    protected $column = 0;
    /**
     * @var int
     */
    protected $maxColumn;
    /**
     * @var bool
     */
    protected $lastTestFailed = false;
    /**
     * @var int
     */
    protected $numAssertions = 0;
    /**
     * @var int
     */
    protected $numTests = -1;
    /**
     * @var int
     */
    protected $numTestsRun = 0;
    /**
     * @var int
     */
    protected $numTestsWidth;
    /**
     * @var bool
     */
    protected $colors = false;
    /**
     * @var bool
     */
    protected $debug = false;
    /**
     * @var bool
     */
    protected $verbose = false;
    /**
     * Constructor.
     *
     * @param null|resource|string $out
     * @param int|string           $numberOfColumns
     *
     * @throws \PHPUnit\Framework\Exception
     */
    public function __construct($out = null, bool $verbose = false, string $colors = self::COLOR_DEFAULT, bool $debug = false, $numberOfColumns = 80, bool $reverse = false)
    {
    }
    public function printResult(\PHPUnit\Framework\TestResult $result): void
    {
    }
    /**
     * An error occurred.
     */
    public function addError(\PHPUnit\Framework\Test $test, \Throwable $t, float $time): void
    {
    }
    /**
     * A failure occurred.
     */
    public function addFailure(\PHPUnit\Framework\Test $test, \PHPUnit\Framework\AssertionFailedError $e, float $time): void
    {
    }
    /**
     * A warning occurred.
     */
    public function addWarning(\PHPUnit\Framework\Test $test, \PHPUnit\Framework\Warning $e, float $time): void
    {
    }
    /**
     * Incomplete test.
     */
    public function addIncompleteTest(\PHPUnit\Framework\Test $test, \Throwable $t, float $time): void
    {
    }
    /**
     * Risky test.
     */
    public function addRiskyTest(\PHPUnit\Framework\Test $test, \Throwable $t, float $time): void
    {
    }
    /**
     * Skipped test.
     */
    public function addSkippedTest(\PHPUnit\Framework\Test $test, \Throwable $t, float $time): void
    {
    }
    /**
     * A testsuite started.
     */
    public function startTestSuite(\PHPUnit\Framework\TestSuite $suite): void
    {
    }
    /**
     * A testsuite ended.
     */
    public function endTestSuite(\PHPUnit\Framework\TestSuite $suite): void
    {
    }
    /**
     * A test started.
     */
    public function startTest(\PHPUnit\Framework\Test $test): void
    {
    }
    /**
     * A test ended.
     */
    public function endTest(\PHPUnit\Framework\Test $test, float $time): void
    {
    }
    protected function printDefects(array $defects, string $type): void
    {
    }
    protected function printDefect(\PHPUnit\Framework\TestFailure $defect, int $count): void
    {
    }
    protected function printDefectHeader(\PHPUnit\Framework\TestFailure $defect, int $count): void
    {
    }
    protected function printDefectTrace(\PHPUnit\Framework\TestFailure $defect): void
    {
    }
    protected function printErrors(\PHPUnit\Framework\TestResult $result): void
    {
    }
    protected function printFailures(\PHPUnit\Framework\TestResult $result): void
    {
    }
    protected function printWarnings(\PHPUnit\Framework\TestResult $result): void
    {
    }
    protected function printIncompletes(\PHPUnit\Framework\TestResult $result): void
    {
    }
    protected function printRisky(\PHPUnit\Framework\TestResult $result): void
    {
    }
    protected function printSkipped(\PHPUnit\Framework\TestResult $result): void
    {
    }
    protected function printHeader(\PHPUnit\Framework\TestResult $result): void
    {
    }
    protected function printFooter(\PHPUnit\Framework\TestResult $result): void
    {
    }
    protected function writeProgress(string $progress): void
    {
    }
    protected function writeNewLine(): void
    {
    }
    /**
     * Formats a buffer with a specified ANSI color sequence if colors are
     * enabled.
     */
    protected function colorizeTextBox(string $color, string $buffer): string
    {
    }
    /**
     * Writes a buffer out with a color sequence if colors are enabled.
     */
    protected function writeWithColor(string $color, string $buffer, bool $lf = true): void
    {
    }
    /**
     * Writes progress with a color sequence if colors are enabled.
     */
    protected function writeProgressWithColor(string $color, string $buffer): void
    {
    }
}
/**
 * @internal This interface is not covered by the backward compatibility promise for PHPUnit
 */
interface Exception extends \Throwable
{
}
/**
 * @internal This interface is not covered by the backward compatibility promise for PHPUnit
 */
final class ReflectionException extends \RuntimeException implements \PHPUnit\TextUI\Exception
{
}
/**
 * @internal This interface is not covered by the backward compatibility promise for PHPUnit
 */
final class RuntimeException extends \RuntimeException implements \PHPUnit\TextUI\Exception
{
}
/**
 * @internal This interface is not covered by the backward compatibility promise for PHPUnit
 */
final class TestDirectoryNotFoundException extends \RuntimeException implements \PHPUnit\TextUI\Exception
{
    public function __construct(string $path)
    {
    }
}
/**
 * @internal This interface is not covered by the backward compatibility promise for PHPUnit
 */
final class TestFileNotFoundException extends \RuntimeException implements \PHPUnit\TextUI\Exception
{
    public function __construct(string $path)
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class Help
{
    public function __construct(?int $width = null, ?bool $withColor = null)
    {
    }
    /**
     * Write the help file to the CLI, adapting width and colors to the console.
     */
    public function writeToConsole(): void
    {
    }
}
/**
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 */
interface ResultPrinter extends \PHPUnit\Framework\TestListener
{
    public function printResult(\PHPUnit\Framework\TestResult $result): void;
    public function write(string $buffer): void;
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class TestRunner extends \PHPUnit\Runner\BaseTestRunner
{
    public const SUCCESS_EXIT = 0;
    public const FAILURE_EXIT = 1;
    public const EXCEPTION_EXIT = 2;
    public function __construct(?\PHPUnit\Runner\TestSuiteLoader $loader = null, ?\SebastianBergmann\CodeCoverage\Filter $filter = null)
    {
    }
    /**
     * @throws \PHPUnit\Runner\Exception
     * @throws \PHPUnit\Framework\Exception
     * @throws XmlConfiguration\Exception
     */
    public function run(\PHPUnit\Framework\TestSuite $suite, array $arguments = [], array $warnings = [], bool $exit = true): \PHPUnit\Framework\TestResult
    {
    }
    /**
     * Returns the loader to be used.
     */
    public function getLoader(): \PHPUnit\Runner\TestSuiteLoader
    {
    }
    public function addExtension(\PHPUnit\Runner\Hook $extension): void
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class TestSuiteMapper
{
    /**
     * @throws RuntimeException
     * @throws TestDirectoryNotFoundException
     * @throws TestFileNotFoundException
     */
    public function map(\PHPUnit\TextUI\XmlConfiguration\TestSuiteCollection $configuration, string $filter): \PHPUnit\Framework\TestSuite
    {
    }
}
namespace PHPUnit\TextUI\CliArguments;

/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class Builder
{
    public function fromParameters(array $parameters, array $additionalLongOptions): \PHPUnit\TextUI\CliArguments\Configuration
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 *
 * @phan-side-effect-free
 */
final class Configuration
{
    /**
     * @param null|int|string $columns
     */
    public function __construct(?string $argument, ?string $atLeastVersion, ?bool $backupGlobals, ?bool $backupStaticAttributes, ?bool $beStrictAboutChangesToGlobalState, ?bool $beStrictAboutResourceUsageDuringSmallTests, ?string $bootstrap, ?bool $cacheResult, ?string $cacheResultFile, ?bool $checkVersion, ?string $colors, $columns, ?string $configuration, ?string $coverageClover, ?string $coverageCobertura, ?string $coverageCrap4J, ?string $coverageHtml, ?string $coveragePhp, ?string $coverageText, ?bool $coverageTextShowUncoveredFiles, ?bool $coverageTextShowOnlySummary, ?string $coverageXml, ?bool $pathCoverage, ?string $coverageCacheDirectory, ?bool $warmCoverageCache, ?bool $debug, ?int $defaultTimeLimit, ?bool $disableCodeCoverageIgnore, ?bool $disallowTestOutput, ?bool $disallowTodoAnnotatedTests, ?bool $enforceTimeLimit, ?array $excludeGroups, ?int $executionOrder, ?int $executionOrderDefects, ?array $extensions, ?array $unavailableExtensions, ?bool $failOnEmptyTestSuite, ?bool $failOnIncomplete, ?bool $failOnRisky, ?bool $failOnSkipped, ?bool $failOnWarning, ?string $filter, ?bool $generateConfiguration, ?bool $migrateConfiguration, ?array $groups, ?array $testsCovering, ?array $testsUsing, ?bool $help, ?string $includePath, ?array $iniSettings, ?string $junitLogfile, ?bool $listGroups, ?bool $listSuites, ?bool $listTests, ?string $listTestsXml, ?string $loader, ?bool $noCoverage, ?bool $noExtensions, ?bool $noInteraction, ?bool $noLogging, ?string $printer, ?bool $processIsolation, ?int $randomOrderSeed, ?int $repeat, ?bool $reportUselessTests, ?bool $resolveDependencies, ?bool $reverseList, ?bool $stderr, ?bool $strictCoverage, ?bool $stopOnDefect, ?bool $stopOnError, ?bool $stopOnFailure, ?bool $stopOnIncomplete, ?bool $stopOnRisky, ?bool $stopOnSkipped, ?bool $stopOnWarning, ?string $teamcityLogfile, ?array $testdoxExcludeGroups, ?array $testdoxGroups, ?string $testdoxHtmlFile, ?string $testdoxTextFile, ?string $testdoxXmlFile, ?array $testSuffixes, ?string $testSuite, array $unrecognizedOptions, ?string $unrecognizedOrderBy, ?bool $useDefaultConfiguration, ?bool $verbose, ?bool $version, ?array $coverageFilter, ?string $xdebugFilterFile)
    {
    }
    public function hasArgument(): bool
    {
    }
    /**
     * @throws Exception
     */
    public function argument(): string
    {
    }
    public function hasAtLeastVersion(): bool
    {
    }
    /**
     * @throws Exception
     */
    public function atLeastVersion(): string
    {
    }
    public function hasBackupGlobals(): bool
    {
    }
    /**
     * @throws Exception
     */
    public function backupGlobals(): bool
    {
    }
    public function hasBackupStaticAttributes(): bool
    {
    }
    /**
     * @throws Exception
     */
    public function backupStaticAttributes(): bool
    {
    }
    public function hasBeStrictAboutChangesToGlobalState(): bool
    {
    }
    /**
     * @throws Exception
     */
    public function beStrictAboutChangesToGlobalState(): bool
    {
    }
    public function hasBeStrictAboutResourceUsageDuringSmallTests(): bool
    {
    }
    /**
     * @throws Exception
     */
    public function beStrictAboutResourceUsageDuringSmallTests(): bool
    {
    }
    public function hasBootstrap(): bool
    {
    }
    /**
     * @throws Exception
     */
    public function bootstrap(): string
    {
    }
    public function hasCacheResult(): bool
    {
    }
    /**
     * @throws Exception
     */
    public function cacheResult(): bool
    {
    }
    public function hasCacheResultFile(): bool
    {
    }
    /**
     * @throws Exception
     */
    public function cacheResultFile(): string
    {
    }
    public function hasCheckVersion(): bool
    {
    }
    /**
     * @throws Exception
     */
    public function checkVersion(): bool
    {
    }
    public function hasColors(): bool
    {
    }
    /**
     * @throws Exception
     */
    public function colors(): string
    {
    }
    public function hasColumns(): bool
    {
    }
    /**
     * @throws Exception
     */
    public function columns()
    {
    }
    public function hasConfiguration(): bool
    {
    }
    /**
     * @throws Exception
     */
    public function configuration(): string
    {
    }
    public function hasCoverageFilter(): bool
    {
    }
    /**
     * @throws Exception
     */
    public function coverageFilter(): array
    {
    }
    public function hasCoverageClover(): bool
    {
    }
    /**
     * @throws Exception
     */
    public function coverageClover(): string
    {
    }
    public function hasCoverageCobertura(): bool
    {
    }
    /**
     * @throws Exception
     */
    public function coverageCobertura(): string
    {
    }
    public function hasCoverageCrap4J(): bool
    {
    }
    /**
     * @throws Exception
     */
    public function coverageCrap4J(): string
    {
    }
    public function hasCoverageHtml(): bool
    {
    }
    /**
     * @throws Exception
     */
    public function coverageHtml(): string
    {
    }
    public function hasCoveragePhp(): bool
    {
    }
    /**
     * @throws Exception
     */
    public function coveragePhp(): string
    {
    }
    public function hasCoverageText(): bool
    {
    }
    /**
     * @throws Exception
     */
    public function coverageText(): string
    {
    }
    public function hasCoverageTextShowUncoveredFiles(): bool
    {
    }
    /**
     * @throws Exception
     */
    public function coverageTextShowUncoveredFiles(): bool
    {
    }
    public function hasCoverageTextShowOnlySummary(): bool
    {
    }
    /**
     * @throws Exception
     */
    public function coverageTextShowOnlySummary(): bool
    {
    }
    public function hasCoverageXml(): bool
    {
    }
    /**
     * @throws Exception
     */
    public function coverageXml(): string
    {
    }
    public function hasPathCoverage(): bool
    {
    }
    /**
     * @throws Exception
     */
    public function pathCoverage(): bool
    {
    }
    public function hasCoverageCacheDirectory(): bool
    {
    }
    /**
     * @throws Exception
     */
    public function coverageCacheDirectory(): string
    {
    }
    public function hasWarmCoverageCache(): bool
    {
    }
    /**
     * @throws Exception
     */
    public function warmCoverageCache(): bool
    {
    }
    public function hasDebug(): bool
    {
    }
    /**
     * @throws Exception
     */
    public function debug(): bool
    {
    }
    public function hasDefaultTimeLimit(): bool
    {
    }
    /**
     * @throws Exception
     */
    public function defaultTimeLimit(): int
    {
    }
    public function hasDisableCodeCoverageIgnore(): bool
    {
    }
    /**
     * @throws Exception
     */
    public function disableCodeCoverageIgnore(): bool
    {
    }
    public function hasDisallowTestOutput(): bool
    {
    }
    /**
     * @throws Exception
     */
    public function disallowTestOutput(): bool
    {
    }
    public function hasDisallowTodoAnnotatedTests(): bool
    {
    }
    /**
     * @throws Exception
     */
    public function disallowTodoAnnotatedTests(): bool
    {
    }
    public function hasEnforceTimeLimit(): bool
    {
    }
    /**
     * @throws Exception
     */
    public function enforceTimeLimit(): bool
    {
    }
    public function hasExcludeGroups(): bool
    {
    }
    /**
     * @throws Exception
     */
    public function excludeGroups(): array
    {
    }
    public function hasExecutionOrder(): bool
    {
    }
    /**
     * @throws Exception
     */
    public function executionOrder(): int
    {
    }
    public function hasExecutionOrderDefects(): bool
    {
    }
    /**
     * @throws Exception
     */
    public function executionOrderDefects(): int
    {
    }
    public function hasFailOnEmptyTestSuite(): bool
    {
    }
    /**
     * @throws Exception
     */
    public function failOnEmptyTestSuite(): bool
    {
    }
    public function hasFailOnIncomplete(): bool
    {
    }
    /**
     * @throws Exception
     */
    public function failOnIncomplete(): bool
    {
    }
    public function hasFailOnRisky(): bool
    {
    }
    /**
     * @throws Exception
     */
    public function failOnRisky(): bool
    {
    }
    public function hasFailOnSkipped(): bool
    {
    }
    /**
     * @throws Exception
     */
    public function failOnSkipped(): bool
    {
    }
    public function hasFailOnWarning(): bool
    {
    }
    /**
     * @throws Exception
     */
    public function failOnWarning(): bool
    {
    }
    public function hasFilter(): bool
    {
    }
    /**
     * @throws Exception
     */
    public function filter(): string
    {
    }
    public function hasGenerateConfiguration(): bool
    {
    }
    /**
     * @throws Exception
     */
    public function generateConfiguration(): bool
    {
    }
    public function hasMigrateConfiguration(): bool
    {
    }
    /**
     * @throws Exception
     */
    public function migrateConfiguration(): bool
    {
    }
    public function hasGroups(): bool
    {
    }
    /**
     * @throws Exception
     */
    public function groups(): array
    {
    }
    public function hasTestsCovering(): bool
    {
    }
    /**
     * @throws Exception
     */
    public function testsCovering(): array
    {
    }
    public function hasTestsUsing(): bool
    {
    }
    /**
     * @throws Exception
     */
    public function testsUsing(): array
    {
    }
    public function hasHelp(): bool
    {
    }
    /**
     * @throws Exception
     */
    public function help(): bool
    {
    }
    public function hasIncludePath(): bool
    {
    }
    /**
     * @throws Exception
     */
    public function includePath(): string
    {
    }
    public function hasIniSettings(): bool
    {
    }
    /**
     * @throws Exception
     */
    public function iniSettings(): array
    {
    }
    public function hasJunitLogfile(): bool
    {
    }
    /**
     * @throws Exception
     */
    public function junitLogfile(): string
    {
    }
    public function hasListGroups(): bool
    {
    }
    /**
     * @throws Exception
     */
    public function listGroups(): bool
    {
    }
    public function hasListSuites(): bool
    {
    }
    /**
     * @throws Exception
     */
    public function listSuites(): bool
    {
    }
    public function hasListTests(): bool
    {
    }
    /**
     * @throws Exception
     */
    public function listTests(): bool
    {
    }
    public function hasListTestsXml(): bool
    {
    }
    /**
     * @throws Exception
     */
    public function listTestsXml(): string
    {
    }
    public function hasLoader(): bool
    {
    }
    /**
     * @throws Exception
     */
    public function loader(): string
    {
    }
    public function hasNoCoverage(): bool
    {
    }
    /**
     * @throws Exception
     */
    public function noCoverage(): bool
    {
    }
    public function hasNoExtensions(): bool
    {
    }
    /**
     * @throws Exception
     */
    public function noExtensions(): bool
    {
    }
    public function hasExtensions(): bool
    {
    }
    /**
     * @throws Exception
     */
    public function extensions(): array
    {
    }
    public function hasUnavailableExtensions(): bool
    {
    }
    /**
     * @throws Exception
     */
    public function unavailableExtensions(): array
    {
    }
    public function hasNoInteraction(): bool
    {
    }
    /**
     * @throws Exception
     */
    public function noInteraction(): bool
    {
    }
    public function hasNoLogging(): bool
    {
    }
    /**
     * @throws Exception
     */
    public function noLogging(): bool
    {
    }
    public function hasPrinter(): bool
    {
    }
    /**
     * @throws Exception
     */
    public function printer(): string
    {
    }
    public function hasProcessIsolation(): bool
    {
    }
    /**
     * @throws Exception
     */
    public function processIsolation(): bool
    {
    }
    public function hasRandomOrderSeed(): bool
    {
    }
    /**
     * @throws Exception
     */
    public function randomOrderSeed(): int
    {
    }
    public function hasRepeat(): bool
    {
    }
    /**
     * @throws Exception
     */
    public function repeat(): int
    {
    }
    public function hasReportUselessTests(): bool
    {
    }
    /**
     * @throws Exception
     */
    public function reportUselessTests(): bool
    {
    }
    public function hasResolveDependencies(): bool
    {
    }
    /**
     * @throws Exception
     */
    public function resolveDependencies(): bool
    {
    }
    public function hasReverseList(): bool
    {
    }
    /**
     * @throws Exception
     */
    public function reverseList(): bool
    {
    }
    public function hasStderr(): bool
    {
    }
    /**
     * @throws Exception
     */
    public function stderr(): bool
    {
    }
    public function hasStrictCoverage(): bool
    {
    }
    /**
     * @throws Exception
     */
    public function strictCoverage(): bool
    {
    }
    public function hasStopOnDefect(): bool
    {
    }
    /**
     * @throws Exception
     */
    public function stopOnDefect(): bool
    {
    }
    public function hasStopOnError(): bool
    {
    }
    /**
     * @throws Exception
     */
    public function stopOnError(): bool
    {
    }
    public function hasStopOnFailure(): bool
    {
    }
    /**
     * @throws Exception
     */
    public function stopOnFailure(): bool
    {
    }
    public function hasStopOnIncomplete(): bool
    {
    }
    /**
     * @throws Exception
     */
    public function stopOnIncomplete(): bool
    {
    }
    public function hasStopOnRisky(): bool
    {
    }
    /**
     * @throws Exception
     */
    public function stopOnRisky(): bool
    {
    }
    public function hasStopOnSkipped(): bool
    {
    }
    /**
     * @throws Exception
     */
    public function stopOnSkipped(): bool
    {
    }
    public function hasStopOnWarning(): bool
    {
    }
    /**
     * @throws Exception
     */
    public function stopOnWarning(): bool
    {
    }
    public function hasTeamcityLogfile(): bool
    {
    }
    /**
     * @throws Exception
     */
    public function teamcityLogfile(): string
    {
    }
    public function hasTestdoxExcludeGroups(): bool
    {
    }
    /**
     * @throws Exception
     */
    public function testdoxExcludeGroups(): array
    {
    }
    public function hasTestdoxGroups(): bool
    {
    }
    /**
     * @throws Exception
     */
    public function testdoxGroups(): array
    {
    }
    public function hasTestdoxHtmlFile(): bool
    {
    }
    /**
     * @throws Exception
     */
    public function testdoxHtmlFile(): string
    {
    }
    public function hasTestdoxTextFile(): bool
    {
    }
    /**
     * @throws Exception
     */
    public function testdoxTextFile(): string
    {
    }
    public function hasTestdoxXmlFile(): bool
    {
    }
    /**
     * @throws Exception
     */
    public function testdoxXmlFile(): string
    {
    }
    public function hasTestSuffixes(): bool
    {
    }
    /**
     * @throws Exception
     */
    public function testSuffixes(): array
    {
    }
    public function hasTestSuite(): bool
    {
    }
    /**
     * @throws Exception
     */
    public function testSuite(): string
    {
    }
    public function unrecognizedOptions(): array
    {
    }
    public function hasUnrecognizedOrderBy(): bool
    {
    }
    /**
     * @throws Exception
     */
    public function unrecognizedOrderBy(): string
    {
    }
    public function hasUseDefaultConfiguration(): bool
    {
    }
    /**
     * @throws Exception
     */
    public function useDefaultConfiguration(): bool
    {
    }
    public function hasVerbose(): bool
    {
    }
    /**
     * @throws Exception
     */
    public function verbose(): bool
    {
    }
    public function hasVersion(): bool
    {
    }
    /**
     * @throws Exception
     */
    public function version(): bool
    {
    }
    public function hasXdebugFilterFile(): bool
    {
    }
    /**
     * @throws Exception
     */
    public function xdebugFilterFile(): string
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class Exception extends \RuntimeException implements \PHPUnit\Exception
{
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class Mapper
{
    /**
     * @throws Exception
     */
    public function mapToLegacyArray(\PHPUnit\TextUI\CliArguments\Configuration $arguments): array
    {
    }
}
namespace PHPUnit\TextUI\XmlConfiguration;

/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 *
 * @phan-side-effect-free
 */
final class Configuration
{
    public function __construct(string $filename, \PHPUnit\Util\Xml\ValidationResult $validationResult, \PHPUnit\TextUI\XmlConfiguration\ExtensionCollection $extensions, \PHPUnit\TextUI\XmlConfiguration\CodeCoverage\CodeCoverage $codeCoverage, \PHPUnit\TextUI\XmlConfiguration\Groups $groups, \PHPUnit\TextUI\XmlConfiguration\Groups $testdoxGroups, \PHPUnit\TextUI\XmlConfiguration\ExtensionCollection $listeners, \PHPUnit\TextUI\XmlConfiguration\Logging\Logging $logging, \PHPUnit\TextUI\XmlConfiguration\Php $php, \PHPUnit\TextUI\XmlConfiguration\PHPUnit $phpunit, \PHPUnit\TextUI\XmlConfiguration\TestSuiteCollection $testSuite)
    {
    }
    public function filename(): string
    {
    }
    public function hasValidationErrors(): bool
    {
    }
    public function validationErrors(): string
    {
    }
    public function extensions(): \PHPUnit\TextUI\XmlConfiguration\ExtensionCollection
    {
    }
    public function codeCoverage(): \PHPUnit\TextUI\XmlConfiguration\CodeCoverage\CodeCoverage
    {
    }
    public function groups(): \PHPUnit\TextUI\XmlConfiguration\Groups
    {
    }
    public function testdoxGroups(): \PHPUnit\TextUI\XmlConfiguration\Groups
    {
    }
    public function listeners(): \PHPUnit\TextUI\XmlConfiguration\ExtensionCollection
    {
    }
    public function logging(): \PHPUnit\TextUI\XmlConfiguration\Logging\Logging
    {
    }
    public function php(): \PHPUnit\TextUI\XmlConfiguration\Php
    {
    }
    public function phpunit(): \PHPUnit\TextUI\XmlConfiguration\PHPUnit
    {
    }
    public function testSuite(): \PHPUnit\TextUI\XmlConfiguration\TestSuiteCollection
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class Exception extends \RuntimeException implements \PHPUnit\Exception
{
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 *
 * @phan-side-effect-free
 */
final class Directory
{
    public function __construct(string $path)
    {
    }
    public function path(): string
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 *
 * @phan-side-effect-free
 *
 * @template-implements \IteratorAggregate<int, Directory>
 */
final class DirectoryCollection implements \Countable, \IteratorAggregate
{
    /**
     * @param Directory[] $directories
     */
    public static function fromArray(array $directories): self
    {
    }
    /**
     * @return Directory[]
     */
    public function asArray(): array
    {
    }
    public function count(): int
    {
    }
    public function getIterator(): \PHPUnit\TextUI\XmlConfiguration\DirectoryCollectionIterator
    {
    }
    public function isEmpty(): bool
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 *
 * @template-implements \Iterator<int, Directory>
 */
final class DirectoryCollectionIterator implements \Countable, \Iterator
{
    public function __construct(\PHPUnit\TextUI\XmlConfiguration\DirectoryCollection $directories)
    {
    }
    public function count(): int
    {
    }
    public function rewind(): void
    {
    }
    public function valid(): bool
    {
    }
    public function key(): int
    {
    }
    public function current(): \PHPUnit\TextUI\XmlConfiguration\Directory
    {
    }
    public function next(): void
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 *
 * @phan-side-effect-free
 */
final class File
{
    public function __construct(string $path)
    {
    }
    public function path(): string
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 *
 * @phan-side-effect-free
 *
 * @template-implements \IteratorAggregate<int, File>
 */
final class FileCollection implements \Countable, \IteratorAggregate
{
    /**
     * @param File[] $files
     */
    public static function fromArray(array $files): self
    {
    }
    /**
     * @return File[]
     */
    public function asArray(): array
    {
    }
    public function count(): int
    {
    }
    public function getIterator(): \PHPUnit\TextUI\XmlConfiguration\FileCollectionIterator
    {
    }
    public function isEmpty(): bool
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 *
 * @template-implements \Iterator<int, File>
 */
final class FileCollectionIterator implements \Countable, \Iterator
{
    public function __construct(\PHPUnit\TextUI\XmlConfiguration\FileCollection $files)
    {
    }
    public function count(): int
    {
    }
    public function rewind(): void
    {
    }
    public function valid(): bool
    {
    }
    public function key(): int
    {
    }
    public function current(): \PHPUnit\TextUI\XmlConfiguration\File
    {
    }
    public function next(): void
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class Generator
{
    public function generateDefaultConfiguration(string $phpunitVersion, string $bootstrapScript, string $testsDirectory, string $srcDirectory, string $cacheDirectory): string
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 *
 * @phan-side-effect-free
 */
final class Group
{
    public function __construct(string $name)
    {
    }
    public function name(): string
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 *
 * @phan-side-effect-free
 *
 * @template-implements \IteratorAggregate<int, Group>
 */
final class GroupCollection implements \IteratorAggregate
{
    /**
     * @param Group[] $groups
     */
    public static function fromArray(array $groups): self
    {
    }
    /**
     * @return Group[]
     */
    public function asArray(): array
    {
    }
    /**
     * @return string[]
     */
    public function asArrayOfStrings(): array
    {
    }
    public function isEmpty(): bool
    {
    }
    public function getIterator(): \PHPUnit\TextUI\XmlConfiguration\GroupCollectionIterator
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 *
 * @template-implements \Iterator<int, Group>
 */
final class GroupCollectionIterator implements \Countable, \Iterator
{
    public function __construct(\PHPUnit\TextUI\XmlConfiguration\GroupCollection $groups)
    {
    }
    public function count(): int
    {
    }
    public function rewind(): void
    {
    }
    public function valid(): bool
    {
    }
    public function key(): int
    {
    }
    public function current(): \PHPUnit\TextUI\XmlConfiguration\Group
    {
    }
    public function next(): void
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 *
 * @phan-side-effect-free
 */
final class Groups
{
    public function __construct(\PHPUnit\TextUI\XmlConfiguration\GroupCollection $include, \PHPUnit\TextUI\XmlConfiguration\GroupCollection $exclude)
    {
    }
    public function hasInclude(): bool
    {
    }
    public function include(): \PHPUnit\TextUI\XmlConfiguration\GroupCollection
    {
    }
    public function hasExclude(): bool
    {
    }
    public function exclude(): \PHPUnit\TextUI\XmlConfiguration\GroupCollection
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class Loader
{
    /**
     * @throws Exception
     */
    public function load(string $filename): \PHPUnit\TextUI\XmlConfiguration\Configuration
    {
    }
    public function logging(string $filename, \DOMXPath $xpath): \PHPUnit\TextUI\XmlConfiguration\Logging\Logging
    {
    }
    public function legacyLogging(string $filename, \DOMXPath $xpath): \PHPUnit\TextUI\XmlConfiguration\Logging\Logging
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class MigrationBuilder
{
    /**
     * @throws MigrationBuilderException
     */
    public function build(string $fromVersion): array
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class MigrationBuilderException extends \RuntimeException implements \PHPUnit\Exception
{
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class MigrationException extends \RuntimeException implements \PHPUnit\Exception
{
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class ConvertLogTypes implements \PHPUnit\TextUI\XmlConfiguration\Migration
{
    public function migrate(\DOMDocument $document): void
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class CoverageCloverToReport extends \PHPUnit\TextUI\XmlConfiguration\LogToReportMigration
{
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class CoverageCrap4jToReport extends \PHPUnit\TextUI\XmlConfiguration\LogToReportMigration
{
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class CoverageHtmlToReport extends \PHPUnit\TextUI\XmlConfiguration\LogToReportMigration
{
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class CoveragePhpToReport extends \PHPUnit\TextUI\XmlConfiguration\LogToReportMigration
{
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class CoverageTextToReport extends \PHPUnit\TextUI\XmlConfiguration\LogToReportMigration
{
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class CoverageXmlToReport extends \PHPUnit\TextUI\XmlConfiguration\LogToReportMigration
{
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class IntroduceCoverageElement implements \PHPUnit\TextUI\XmlConfiguration\Migration
{
    public function migrate(\DOMDocument $document): void
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
abstract class LogToReportMigration implements \PHPUnit\TextUI\XmlConfiguration\Migration
{
    /**
     * @throws MigrationException
     */
    public function migrate(\DOMDocument $document): void
    {
    }
    protected function migrateAttributes(\DOMElement $src, \DOMElement $dest, array $attributes): void
    {
    }
    abstract protected function forType(): string;
    abstract protected function toReportFormat(\DOMElement $logNode): \DOMElement;
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
interface Migration
{
    public function migrate(\DOMDocument $document): void;
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class MoveAttributesFromFilterWhitelistToCoverage implements \PHPUnit\TextUI\XmlConfiguration\Migration
{
    /**
     * @throws MigrationException
     */
    public function migrate(\DOMDocument $document): void
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class MoveAttributesFromRootToCoverage implements \PHPUnit\TextUI\XmlConfiguration\Migration
{
    /**
     * @throws MigrationException
     */
    public function migrate(\DOMDocument $document): void
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class MoveWhitelistExcludesToCoverage implements \PHPUnit\TextUI\XmlConfiguration\Migration
{
    /**
     * @throws MigrationException
     */
    public function migrate(\DOMDocument $document): void
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class MoveWhitelistIncludesToCoverage implements \PHPUnit\TextUI\XmlConfiguration\Migration
{
    /**
     * @throws MigrationException
     */
    public function migrate(\DOMDocument $document): void
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class RemoveCacheTokensAttribute implements \PHPUnit\TextUI\XmlConfiguration\Migration
{
    public function migrate(\DOMDocument $document): void
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class RemoveEmptyFilter implements \PHPUnit\TextUI\XmlConfiguration\Migration
{
    /**
     * @throws MigrationException
     */
    public function migrate(\DOMDocument $document): void
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class RemoveLogTypes implements \PHPUnit\TextUI\XmlConfiguration\Migration
{
    public function migrate(\DOMDocument $document): void
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class UpdateSchemaLocationTo93 implements \PHPUnit\TextUI\XmlConfiguration\Migration
{
    public function migrate(\DOMDocument $document): void
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class Migrator
{
    /**
     * @throws Exception
     * @throws MigrationBuilderException
     * @throws MigrationException
     * @throws \PHPUnit\Util\Xml\Exception
     */
    public function migrate(string $filename): string
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 *
 * @phan-side-effect-free
 */
final class Constant
{
    public function __construct(string $name, $value)
    {
    }
    public function name(): string
    {
    }
    public function value()
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 *
 * @phan-side-effect-free
 *
 * @template-implements \IteratorAggregate<int, Constant>
 */
final class ConstantCollection implements \Countable, \IteratorAggregate
{
    /**
     * @param Constant[] $constants
     */
    public static function fromArray(array $constants): self
    {
    }
    /**
     * @return Constant[]
     */
    public function asArray(): array
    {
    }
    public function count(): int
    {
    }
    public function getIterator(): \PHPUnit\TextUI\XmlConfiguration\ConstantCollectionIterator
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 *
 * @template-implements \Iterator<int, Constant>
 */
final class ConstantCollectionIterator implements \Countable, \Iterator
{
    public function __construct(\PHPUnit\TextUI\XmlConfiguration\ConstantCollection $constants)
    {
    }
    public function count(): int
    {
    }
    public function rewind(): void
    {
    }
    public function valid(): bool
    {
    }
    public function key(): int
    {
    }
    public function current(): \PHPUnit\TextUI\XmlConfiguration\Constant
    {
    }
    public function next(): void
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 *
 * @phan-side-effect-free
 */
final class IniSetting
{
    public function __construct(string $name, string $value)
    {
    }
    public function name(): string
    {
    }
    public function value(): string
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 *
 * @phan-side-effect-free
 *
 * @template-implements \IteratorAggregate<int, IniSetting>
 */
final class IniSettingCollection implements \Countable, \IteratorAggregate
{
    /**
     * @param IniSetting[] $iniSettings
     */
    public static function fromArray(array $iniSettings): self
    {
    }
    /**
     * @return IniSetting[]
     */
    public function asArray(): array
    {
    }
    public function count(): int
    {
    }
    public function getIterator(): \PHPUnit\TextUI\XmlConfiguration\IniSettingCollectionIterator
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 *
 * @template-implements \Iterator<int, IniSetting>
 */
final class IniSettingCollectionIterator implements \Countable, \Iterator
{
    public function __construct(\PHPUnit\TextUI\XmlConfiguration\IniSettingCollection $iniSettings)
    {
    }
    public function count(): int
    {
    }
    public function rewind(): void
    {
    }
    public function valid(): bool
    {
    }
    public function key(): int
    {
    }
    public function current(): \PHPUnit\TextUI\XmlConfiguration\IniSetting
    {
    }
    public function next(): void
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 *
 * @phan-side-effect-free
 */
final class Php
{
    public function __construct(\PHPUnit\TextUI\XmlConfiguration\DirectoryCollection $includePaths, \PHPUnit\TextUI\XmlConfiguration\IniSettingCollection $iniSettings, \PHPUnit\TextUI\XmlConfiguration\ConstantCollection $constants, \PHPUnit\TextUI\XmlConfiguration\VariableCollection $globalVariables, \PHPUnit\TextUI\XmlConfiguration\VariableCollection $envVariables, \PHPUnit\TextUI\XmlConfiguration\VariableCollection $postVariables, \PHPUnit\TextUI\XmlConfiguration\VariableCollection $getVariables, \PHPUnit\TextUI\XmlConfiguration\VariableCollection $cookieVariables, \PHPUnit\TextUI\XmlConfiguration\VariableCollection $serverVariables, \PHPUnit\TextUI\XmlConfiguration\VariableCollection $filesVariables, \PHPUnit\TextUI\XmlConfiguration\VariableCollection $requestVariables)
    {
    }
    public function includePaths(): \PHPUnit\TextUI\XmlConfiguration\DirectoryCollection
    {
    }
    public function iniSettings(): \PHPUnit\TextUI\XmlConfiguration\IniSettingCollection
    {
    }
    public function constants(): \PHPUnit\TextUI\XmlConfiguration\ConstantCollection
    {
    }
    public function globalVariables(): \PHPUnit\TextUI\XmlConfiguration\VariableCollection
    {
    }
    public function envVariables(): \PHPUnit\TextUI\XmlConfiguration\VariableCollection
    {
    }
    public function postVariables(): \PHPUnit\TextUI\XmlConfiguration\VariableCollection
    {
    }
    public function getVariables(): \PHPUnit\TextUI\XmlConfiguration\VariableCollection
    {
    }
    public function cookieVariables(): \PHPUnit\TextUI\XmlConfiguration\VariableCollection
    {
    }
    public function serverVariables(): \PHPUnit\TextUI\XmlConfiguration\VariableCollection
    {
    }
    public function filesVariables(): \PHPUnit\TextUI\XmlConfiguration\VariableCollection
    {
    }
    public function requestVariables(): \PHPUnit\TextUI\XmlConfiguration\VariableCollection
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class PhpHandler
{
    public function handle(\PHPUnit\TextUI\XmlConfiguration\Php $configuration): void
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 *
 * @phan-side-effect-free
 */
final class Variable
{
    public function __construct(string $name, $value, bool $force)
    {
    }
    public function name(): string
    {
    }
    public function value()
    {
    }
    public function force(): bool
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 *
 * @phan-side-effect-free
 *
 * @template-implements \IteratorAggregate<int, Variable>
 */
final class VariableCollection implements \Countable, \IteratorAggregate
{
    /**
     * @param Variable[] $variables
     */
    public static function fromArray(array $variables): self
    {
    }
    /**
     * @return Variable[]
     */
    public function asArray(): array
    {
    }
    public function count(): int
    {
    }
    public function getIterator(): \PHPUnit\TextUI\XmlConfiguration\VariableCollectionIterator
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 *
 * @template-implements \Iterator<int, Variable>
 */
final class VariableCollectionIterator implements \Countable, \Iterator
{
    public function __construct(\PHPUnit\TextUI\XmlConfiguration\VariableCollection $variables)
    {
    }
    public function count(): int
    {
    }
    public function rewind(): void
    {
    }
    public function valid(): bool
    {
    }
    public function key(): int
    {
    }
    public function current(): \PHPUnit\TextUI\XmlConfiguration\Variable
    {
    }
    public function next(): void
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 *
 * @phan-side-effect-free
 */
final class Extension
{
    /**
     * @phan-param class-string $className
     */
    public function __construct(string $className, string $sourceFile, array $arguments)
    {
    }
    /**
     * @phan-return class-string
     */
    public function className(): string
    {
    }
    public function hasSourceFile(): bool
    {
    }
    public function sourceFile(): string
    {
    }
    public function hasArguments(): bool
    {
    }
    public function arguments(): array
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 *
 * @phan-side-effect-free
 *
 * @template-implements \IteratorAggregate<int, Extension>
 */
final class ExtensionCollection implements \IteratorAggregate
{
    /**
     * @param Extension[] $extensions
     */
    public static function fromArray(array $extensions): self
    {
    }
    /**
     * @return Extension[]
     */
    public function asArray(): array
    {
    }
    public function getIterator(): \PHPUnit\TextUI\XmlConfiguration\ExtensionCollectionIterator
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 *
 * @template-implements \Iterator<int, Extension>
 */
final class ExtensionCollectionIterator implements \Countable, \Iterator
{
    public function __construct(\PHPUnit\TextUI\XmlConfiguration\ExtensionCollection $extensions)
    {
    }
    public function count(): int
    {
    }
    public function rewind(): void
    {
    }
    public function valid(): bool
    {
    }
    public function key(): int
    {
    }
    public function current(): \PHPUnit\TextUI\XmlConfiguration\Extension
    {
    }
    public function next(): void
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 *
 * @phan-side-effect-free
 */
final class PHPUnit
{
    public function __construct(bool $cacheResult, ?string $cacheResultFile, $columns, string $colors, bool $stderr, bool $noInteraction, bool $verbose, bool $reverseDefectList, bool $convertDeprecationsToExceptions, bool $convertErrorsToExceptions, bool $convertNoticesToExceptions, bool $convertWarningsToExceptions, bool $forceCoversAnnotation, ?string $bootstrap, bool $processIsolation, bool $failOnEmptyTestSuite, bool $failOnIncomplete, bool $failOnRisky, bool $failOnSkipped, bool $failOnWarning, bool $stopOnDefect, bool $stopOnError, bool $stopOnFailure, bool $stopOnWarning, bool $stopOnIncomplete, bool $stopOnRisky, bool $stopOnSkipped, ?string $extensionsDirectory, ?string $testSuiteLoaderClass, ?string $testSuiteLoaderFile, ?string $printerClass, ?string $printerFile, bool $beStrictAboutChangesToGlobalState, bool $beStrictAboutOutputDuringTests, bool $beStrictAboutResourceUsageDuringSmallTests, bool $beStrictAboutTestsThatDoNotTestAnything, bool $beStrictAboutTodoAnnotatedTests, bool $beStrictAboutCoversAnnotation, bool $enforceTimeLimit, int $defaultTimeLimit, int $timeoutForSmallTests, int $timeoutForMediumTests, int $timeoutForLargeTests, ?string $defaultTestSuite, int $executionOrder, bool $resolveDependencies, bool $defectsFirst, bool $backupGlobals, bool $backupStaticAttributes, bool $registerMockObjectsFromTestArgumentsRecursively, bool $conflictBetweenPrinterClassAndTestdox)
    {
    }
    public function cacheResult(): bool
    {
    }
    /**
     * @psalm-assert-if-true !null $this->cacheResultFile
     */
    public function hasCacheResultFile(): bool
    {
    }
    /**
     * @throws Exception
     */
    public function cacheResultFile(): string
    {
    }
    public function columns()
    {
    }
    public function colors(): string
    {
    }
    public function stderr(): bool
    {
    }
    public function noInteraction(): bool
    {
    }
    public function verbose(): bool
    {
    }
    public function reverseDefectList(): bool
    {
    }
    public function convertDeprecationsToExceptions(): bool
    {
    }
    public function convertErrorsToExceptions(): bool
    {
    }
    public function convertNoticesToExceptions(): bool
    {
    }
    public function convertWarningsToExceptions(): bool
    {
    }
    public function forceCoversAnnotation(): bool
    {
    }
    /**
     * @psalm-assert-if-true !null $this->bootstrap
     */
    public function hasBootstrap(): bool
    {
    }
    /**
     * @throws Exception
     */
    public function bootstrap(): string
    {
    }
    public function processIsolation(): bool
    {
    }
    public function failOnEmptyTestSuite(): bool
    {
    }
    public function failOnIncomplete(): bool
    {
    }
    public function failOnRisky(): bool
    {
    }
    public function failOnSkipped(): bool
    {
    }
    public function failOnWarning(): bool
    {
    }
    public function stopOnDefect(): bool
    {
    }
    public function stopOnError(): bool
    {
    }
    public function stopOnFailure(): bool
    {
    }
    public function stopOnWarning(): bool
    {
    }
    public function stopOnIncomplete(): bool
    {
    }
    public function stopOnRisky(): bool
    {
    }
    public function stopOnSkipped(): bool
    {
    }
    /**
     * @psalm-assert-if-true !null $this->extensionsDirectory
     */
    public function hasExtensionsDirectory(): bool
    {
    }
    /**
     * @throws Exception
     */
    public function extensionsDirectory(): string
    {
    }
    /**
     * @psalm-assert-if-true !null $this->testSuiteLoaderClass
     *
     * @deprecated see https://github.com/sebastianbergmann/phpunit/issues/4039
     */
    public function hasTestSuiteLoaderClass(): bool
    {
    }
    /**
     * @throws Exception
     *
     * @deprecated see https://github.com/sebastianbergmann/phpunit/issues/4039
     */
    public function testSuiteLoaderClass(): string
    {
    }
    /**
     * @psalm-assert-if-true !null $this->testSuiteLoaderFile
     *
     * @deprecated see https://github.com/sebastianbergmann/phpunit/issues/4039
     */
    public function hasTestSuiteLoaderFile(): bool
    {
    }
    /**
     * @throws Exception
     *
     * @deprecated see https://github.com/sebastianbergmann/phpunit/issues/4039
     */
    public function testSuiteLoaderFile(): string
    {
    }
    /**
     * @psalm-assert-if-true !null $this->printerClass
     */
    public function hasPrinterClass(): bool
    {
    }
    /**
     * @throws Exception
     */
    public function printerClass(): string
    {
    }
    /**
     * @psalm-assert-if-true !null $this->printerFile
     */
    public function hasPrinterFile(): bool
    {
    }
    /**
     * @throws Exception
     */
    public function printerFile(): string
    {
    }
    public function beStrictAboutChangesToGlobalState(): bool
    {
    }
    public function beStrictAboutOutputDuringTests(): bool
    {
    }
    public function beStrictAboutResourceUsageDuringSmallTests(): bool
    {
    }
    public function beStrictAboutTestsThatDoNotTestAnything(): bool
    {
    }
    public function beStrictAboutTodoAnnotatedTests(): bool
    {
    }
    public function beStrictAboutCoversAnnotation(): bool
    {
    }
    public function enforceTimeLimit(): bool
    {
    }
    public function defaultTimeLimit(): int
    {
    }
    public function timeoutForSmallTests(): int
    {
    }
    public function timeoutForMediumTests(): int
    {
    }
    public function timeoutForLargeTests(): int
    {
    }
    /**
     * @psalm-assert-if-true !null $this->defaultTestSuite
     */
    public function hasDefaultTestSuite(): bool
    {
    }
    /**
     * @throws Exception
     */
    public function defaultTestSuite(): string
    {
    }
    public function executionOrder(): int
    {
    }
    public function resolveDependencies(): bool
    {
    }
    public function defectsFirst(): bool
    {
    }
    public function backupGlobals(): bool
    {
    }
    public function backupStaticAttributes(): bool
    {
    }
    public function registerMockObjectsFromTestArgumentsRecursively(): bool
    {
    }
    public function conflictBetweenPrinterClassAndTestdox(): bool
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 *
 * @phan-side-effect-free
 */
final class TestDirectory
{
    public function __construct(string $path, string $prefix, string $suffix, string $phpVersion, \PHPUnit\Util\VersionComparisonOperator $phpVersionOperator)
    {
    }
    public function path(): string
    {
    }
    public function prefix(): string
    {
    }
    public function suffix(): string
    {
    }
    public function phpVersion(): string
    {
    }
    public function phpVersionOperator(): \PHPUnit\Util\VersionComparisonOperator
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 *
 * @phan-side-effect-free
 *
 * @template-implements \IteratorAggregate<int, TestDirectory>
 */
final class TestDirectoryCollection implements \Countable, \IteratorAggregate
{
    /**
     * @param TestDirectory[] $directories
     */
    public static function fromArray(array $directories): self
    {
    }
    /**
     * @return TestDirectory[]
     */
    public function asArray(): array
    {
    }
    public function count(): int
    {
    }
    public function getIterator(): \PHPUnit\TextUI\XmlConfiguration\TestDirectoryCollectionIterator
    {
    }
    public function isEmpty(): bool
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 *
 * @template-implements \Iterator<int, TestDirectory>
 */
final class TestDirectoryCollectionIterator implements \Countable, \Iterator
{
    public function __construct(\PHPUnit\TextUI\XmlConfiguration\TestDirectoryCollection $directories)
    {
    }
    public function count(): int
    {
    }
    public function rewind(): void
    {
    }
    public function valid(): bool
    {
    }
    public function key(): int
    {
    }
    public function current(): \PHPUnit\TextUI\XmlConfiguration\TestDirectory
    {
    }
    public function next(): void
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 *
 * @phan-side-effect-free
 */
final class TestFile
{
    public function __construct(string $path, string $phpVersion, \PHPUnit\Util\VersionComparisonOperator $phpVersionOperator)
    {
    }
    public function path(): string
    {
    }
    public function phpVersion(): string
    {
    }
    public function phpVersionOperator(): \PHPUnit\Util\VersionComparisonOperator
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 *
 * @phan-side-effect-free
 *
 * @template-implements \IteratorAggregate<int, TestFile>
 */
final class TestFileCollection implements \Countable, \IteratorAggregate
{
    /**
     * @param TestFile[] $files
     */
    public static function fromArray(array $files): self
    {
    }
    /**
     * @return TestFile[]
     */
    public function asArray(): array
    {
    }
    public function count(): int
    {
    }
    public function getIterator(): \PHPUnit\TextUI\XmlConfiguration\TestFileCollectionIterator
    {
    }
    public function isEmpty(): bool
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 *
 * @template-implements \Iterator<int, TestFile>
 */
final class TestFileCollectionIterator implements \Countable, \Iterator
{
    public function __construct(\PHPUnit\TextUI\XmlConfiguration\TestFileCollection $files)
    {
    }
    public function count(): int
    {
    }
    public function rewind(): void
    {
    }
    public function valid(): bool
    {
    }
    public function key(): int
    {
    }
    public function current(): \PHPUnit\TextUI\XmlConfiguration\TestFile
    {
    }
    public function next(): void
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 *
 * @phan-side-effect-free
 */
final class TestSuite
{
    public function __construct(string $name, \PHPUnit\TextUI\XmlConfiguration\TestDirectoryCollection $directories, \PHPUnit\TextUI\XmlConfiguration\TestFileCollection $files, \PHPUnit\TextUI\XmlConfiguration\FileCollection $exclude)
    {
    }
    public function name(): string
    {
    }
    public function directories(): \PHPUnit\TextUI\XmlConfiguration\TestDirectoryCollection
    {
    }
    public function files(): \PHPUnit\TextUI\XmlConfiguration\TestFileCollection
    {
    }
    public function exclude(): \PHPUnit\TextUI\XmlConfiguration\FileCollection
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 *
 * @phan-side-effect-free
 *
 * @template-implements \IteratorAggregate<int, TestSuite>
 */
final class TestSuiteCollection implements \Countable, \IteratorAggregate
{
    /**
     * @param TestSuite[] $testSuites
     */
    public static function fromArray(array $testSuites): self
    {
    }
    /**
     * @return TestSuite[]
     */
    public function asArray(): array
    {
    }
    public function count(): int
    {
    }
    public function getIterator(): \PHPUnit\TextUI\XmlConfiguration\TestSuiteCollectionIterator
    {
    }
    public function isEmpty(): bool
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 *
 * @template-implements \Iterator<int, TestSuite>
 */
final class TestSuiteCollectionIterator implements \Countable, \Iterator
{
    public function __construct(\PHPUnit\TextUI\XmlConfiguration\TestSuiteCollection $testSuites)
    {
    }
    public function count(): int
    {
    }
    public function rewind(): void
    {
    }
    public function valid(): bool
    {
    }
    public function key(): int
    {
    }
    public function current(): \PHPUnit\TextUI\XmlConfiguration\TestSuite
    {
    }
    public function next(): void
    {
    }
}
namespace PHPUnit\TextUI\XmlConfiguration\CodeCoverage;

/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 *
 * @phan-side-effect-free
 */
final class CodeCoverage
{
    public function __construct(?\PHPUnit\TextUI\XmlConfiguration\Directory $cacheDirectory, \PHPUnit\TextUI\XmlConfiguration\CodeCoverage\Filter\DirectoryCollection $directories, \PHPUnit\TextUI\XmlConfiguration\FileCollection $files, \PHPUnit\TextUI\XmlConfiguration\CodeCoverage\Filter\DirectoryCollection $excludeDirectories, \PHPUnit\TextUI\XmlConfiguration\FileCollection $excludeFiles, bool $pathCoverage, bool $includeUncoveredFiles, bool $processUncoveredFiles, bool $ignoreDeprecatedCodeUnits, bool $disableCodeCoverageIgnore, ?\PHPUnit\TextUI\XmlConfiguration\CodeCoverage\Report\Clover $clover, ?\PHPUnit\TextUI\XmlConfiguration\CodeCoverage\Report\Cobertura $cobertura, ?\PHPUnit\TextUI\XmlConfiguration\CodeCoverage\Report\Crap4j $crap4j, ?\PHPUnit\TextUI\XmlConfiguration\CodeCoverage\Report\Html $html, ?\PHPUnit\TextUI\XmlConfiguration\CodeCoverage\Report\Php $php, ?\PHPUnit\TextUI\XmlConfiguration\CodeCoverage\Report\Text $text, ?\PHPUnit\TextUI\XmlConfiguration\CodeCoverage\Report\Xml $xml)
    {
    }
    /**
     * @psalm-assert-if-true !null $this->cacheDirectory
     */
    public function hasCacheDirectory(): bool
    {
    }
    /**
     * @throws \PHPUnit\TextUI\XmlConfiguration\Exception
     */
    public function cacheDirectory(): \PHPUnit\TextUI\XmlConfiguration\Directory
    {
    }
    public function hasNonEmptyListOfFilesToBeIncludedInCodeCoverageReport(): bool
    {
    }
    public function directories(): \PHPUnit\TextUI\XmlConfiguration\CodeCoverage\Filter\DirectoryCollection
    {
    }
    public function files(): \PHPUnit\TextUI\XmlConfiguration\FileCollection
    {
    }
    public function excludeDirectories(): \PHPUnit\TextUI\XmlConfiguration\CodeCoverage\Filter\DirectoryCollection
    {
    }
    public function excludeFiles(): \PHPUnit\TextUI\XmlConfiguration\FileCollection
    {
    }
    public function pathCoverage(): bool
    {
    }
    public function includeUncoveredFiles(): bool
    {
    }
    public function ignoreDeprecatedCodeUnits(): bool
    {
    }
    public function disableCodeCoverageIgnore(): bool
    {
    }
    public function processUncoveredFiles(): bool
    {
    }
    /**
     * @psalm-assert-if-true !null $this->clover
     */
    public function hasClover(): bool
    {
    }
    /**
     * @throws \PHPUnit\TextUI\XmlConfiguration\Exception
     */
    public function clover(): \PHPUnit\TextUI\XmlConfiguration\CodeCoverage\Report\Clover
    {
    }
    /**
     * @psalm-assert-if-true !null $this->cobertura
     */
    public function hasCobertura(): bool
    {
    }
    /**
     * @throws \PHPUnit\TextUI\XmlConfiguration\Exception
     */
    public function cobertura(): \PHPUnit\TextUI\XmlConfiguration\CodeCoverage\Report\Cobertura
    {
    }
    /**
     * @psalm-assert-if-true !null $this->crap4j
     */
    public function hasCrap4j(): bool
    {
    }
    /**
     * @throws \PHPUnit\TextUI\XmlConfiguration\Exception
     */
    public function crap4j(): \PHPUnit\TextUI\XmlConfiguration\CodeCoverage\Report\Crap4j
    {
    }
    /**
     * @psalm-assert-if-true !null $this->html
     */
    public function hasHtml(): bool
    {
    }
    /**
     * @throws \PHPUnit\TextUI\XmlConfiguration\Exception
     */
    public function html(): \PHPUnit\TextUI\XmlConfiguration\CodeCoverage\Report\Html
    {
    }
    /**
     * @psalm-assert-if-true !null $this->php
     */
    public function hasPhp(): bool
    {
    }
    /**
     * @throws \PHPUnit\TextUI\XmlConfiguration\Exception
     */
    public function php(): \PHPUnit\TextUI\XmlConfiguration\CodeCoverage\Report\Php
    {
    }
    /**
     * @psalm-assert-if-true !null $this->text
     */
    public function hasText(): bool
    {
    }
    /**
     * @throws \PHPUnit\TextUI\XmlConfiguration\Exception
     */
    public function text(): \PHPUnit\TextUI\XmlConfiguration\CodeCoverage\Report\Text
    {
    }
    /**
     * @psalm-assert-if-true !null $this->xml
     */
    public function hasXml(): bool
    {
    }
    /**
     * @throws \PHPUnit\TextUI\XmlConfiguration\Exception
     */
    public function xml(): \PHPUnit\TextUI\XmlConfiguration\CodeCoverage\Report\Xml
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class FilterMapper
{
    public function map(\SebastianBergmann\CodeCoverage\Filter $filter, \PHPUnit\TextUI\XmlConfiguration\CodeCoverage\CodeCoverage $configuration): void
    {
    }
}
namespace PHPUnit\TextUI\XmlConfiguration\CodeCoverage\Filter;

/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 *
 * @phan-side-effect-free
 */
final class Directory
{
    public function __construct(string $path, string $prefix, string $suffix, string $group)
    {
    }
    public function path(): string
    {
    }
    public function prefix(): string
    {
    }
    public function suffix(): string
    {
    }
    public function group(): string
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 *
 * @phan-side-effect-free
 *
 * @template-implements \IteratorAggregate<int, Directory>
 */
final class DirectoryCollection implements \Countable, \IteratorAggregate
{
    /**
     * @param Directory[] $directories
     */
    public static function fromArray(array $directories): self
    {
    }
    /**
     * @return Directory[]
     */
    public function asArray(): array
    {
    }
    public function count(): int
    {
    }
    public function getIterator(): \PHPUnit\TextUI\XmlConfiguration\CodeCoverage\Filter\DirectoryCollectionIterator
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 *
 * @template-implements \Iterator<int, Directory>
 */
final class DirectoryCollectionIterator implements \Countable, \Iterator
{
    public function __construct(\PHPUnit\TextUI\XmlConfiguration\CodeCoverage\Filter\DirectoryCollection $directories)
    {
    }
    public function count(): int
    {
    }
    public function rewind(): void
    {
    }
    public function valid(): bool
    {
    }
    public function key(): int
    {
    }
    public function current(): \PHPUnit\TextUI\XmlConfiguration\CodeCoverage\Filter\Directory
    {
    }
    public function next(): void
    {
    }
}
namespace PHPUnit\TextUI\XmlConfiguration\CodeCoverage\Report;

/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 *
 * @phan-side-effect-free
 */
final class Clover
{
    public function __construct(\PHPUnit\TextUI\XmlConfiguration\File $target)
    {
    }
    public function target(): \PHPUnit\TextUI\XmlConfiguration\File
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 *
 * @phan-side-effect-free
 */
final class Cobertura
{
    public function __construct(\PHPUnit\TextUI\XmlConfiguration\File $target)
    {
    }
    public function target(): \PHPUnit\TextUI\XmlConfiguration\File
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 *
 * @phan-side-effect-free
 */
final class Crap4j
{
    public function __construct(\PHPUnit\TextUI\XmlConfiguration\File $target, int $threshold)
    {
    }
    public function target(): \PHPUnit\TextUI\XmlConfiguration\File
    {
    }
    public function threshold(): int
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 *
 * @phan-side-effect-free
 */
final class Html
{
    public function __construct(\PHPUnit\TextUI\XmlConfiguration\Directory $target, int $lowUpperBound, int $highLowerBound)
    {
    }
    public function target(): \PHPUnit\TextUI\XmlConfiguration\Directory
    {
    }
    public function lowUpperBound(): int
    {
    }
    public function highLowerBound(): int
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 *
 * @phan-side-effect-free
 */
final class Php
{
    public function __construct(\PHPUnit\TextUI\XmlConfiguration\File $target)
    {
    }
    public function target(): \PHPUnit\TextUI\XmlConfiguration\File
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 *
 * @phan-side-effect-free
 */
final class Text
{
    public function __construct(\PHPUnit\TextUI\XmlConfiguration\File $target, bool $showUncoveredFiles, bool $showOnlySummary)
    {
    }
    public function target(): \PHPUnit\TextUI\XmlConfiguration\File
    {
    }
    public function showUncoveredFiles(): bool
    {
    }
    public function showOnlySummary(): bool
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 *
 * @phan-side-effect-free
 */
final class Xml
{
    public function __construct(\PHPUnit\TextUI\XmlConfiguration\Directory $target)
    {
    }
    public function target(): \PHPUnit\TextUI\XmlConfiguration\Directory
    {
    }
}
namespace PHPUnit\TextUI\XmlConfiguration\Logging;

/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 *
 * @phan-side-effect-free
 */
final class Junit
{
    public function __construct(\PHPUnit\TextUI\XmlConfiguration\File $target)
    {
    }
    public function target(): \PHPUnit\TextUI\XmlConfiguration\File
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 *
 * @phan-side-effect-free
 */
final class Logging
{
    public function __construct(?\PHPUnit\TextUI\XmlConfiguration\Logging\Junit $junit, ?\PHPUnit\TextUI\XmlConfiguration\Logging\Text $text, ?\PHPUnit\TextUI\XmlConfiguration\Logging\TeamCity $teamCity, ?\PHPUnit\TextUI\XmlConfiguration\Logging\TestDox\Html $testDoxHtml, ?\PHPUnit\TextUI\XmlConfiguration\Logging\TestDox\Text $testDoxText, ?\PHPUnit\TextUI\XmlConfiguration\Logging\TestDox\Xml $testDoxXml)
    {
    }
    public function hasJunit(): bool
    {
    }
    public function junit(): \PHPUnit\TextUI\XmlConfiguration\Logging\Junit
    {
    }
    public function hasText(): bool
    {
    }
    public function text(): \PHPUnit\TextUI\XmlConfiguration\Logging\Text
    {
    }
    public function hasTeamCity(): bool
    {
    }
    public function teamCity(): \PHPUnit\TextUI\XmlConfiguration\Logging\TeamCity
    {
    }
    public function hasTestDoxHtml(): bool
    {
    }
    public function testDoxHtml(): \PHPUnit\TextUI\XmlConfiguration\Logging\TestDox\Html
    {
    }
    public function hasTestDoxText(): bool
    {
    }
    public function testDoxText(): \PHPUnit\TextUI\XmlConfiguration\Logging\TestDox\Text
    {
    }
    public function hasTestDoxXml(): bool
    {
    }
    public function testDoxXml(): \PHPUnit\TextUI\XmlConfiguration\Logging\TestDox\Xml
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 *
 * @phan-side-effect-free
 */
final class TeamCity
{
    public function __construct(\PHPUnit\TextUI\XmlConfiguration\File $target)
    {
    }
    public function target(): \PHPUnit\TextUI\XmlConfiguration\File
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 *
 * @phan-side-effect-free
 */
final class Text
{
    public function __construct(\PHPUnit\TextUI\XmlConfiguration\File $target)
    {
    }
    public function target(): \PHPUnit\TextUI\XmlConfiguration\File
    {
    }
}
namespace PHPUnit\TextUI\XmlConfiguration\Logging\TestDox;

/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 *
 * @phan-side-effect-free
 */
final class Html
{
    public function __construct(\PHPUnit\TextUI\XmlConfiguration\File $target)
    {
    }
    public function target(): \PHPUnit\TextUI\XmlConfiguration\File
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 *
 * @phan-side-effect-free
 */
final class Text
{
    public function __construct(\PHPUnit\TextUI\XmlConfiguration\File $target)
    {
    }
    public function target(): \PHPUnit\TextUI\XmlConfiguration\File
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 *
 * @phan-side-effect-free
 */
final class Xml
{
    public function __construct(\PHPUnit\TextUI\XmlConfiguration\File $target)
    {
    }
    public function target(): \PHPUnit\TextUI\XmlConfiguration\File
    {
    }
}
namespace PHPUnit\Util;

/**
 * @deprecated Use ExcludeList instead
 *
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 */
final class Blacklist
{
    public static function addDirectory(string $directory): void
    {
    }
    /**
     * @throws Exception
     *
     * @return string[]
     */
    public function getBlacklistedDirectories(): array
    {
    }
    /**
     * @throws Exception
     */
    public function isBlacklisted(string $file): bool
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class Cloner
{
    /**
     * @phan-template OriginalType
     *
     * @phan-param OriginalType $original
     *
     * @phan-return OriginalType
     */
    public static function clone(object $original): object
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class Color
{
    public static function colorize(string $color, string $buffer): string
    {
    }
    public static function colorizePath(string $path, ?string $prevPath = null, bool $colorizeFilename = false): string
    {
    }
    public static function dim(string $buffer): string
    {
    }
    public static function visualizeWhitespace(string $buffer, bool $visualizeEOL = false): string
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class ErrorHandler
{
    public static function invokeIgnoringWarnings(callable $callable)
    {
    }
    public function __construct(bool $convertDeprecationsToExceptions, bool $convertErrorsToExceptions, bool $convertNoticesToExceptions, bool $convertWarningsToExceptions)
    {
    }
    public function __invoke(int $errorNumber, string $errorString, string $errorFile, int $errorLine): bool
    {
    }
    public function register(): void
    {
    }
    public function unregister(): void
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class Exception extends \RuntimeException implements \PHPUnit\Exception
{
}
/**
 * @no-named-arguments Parameter names are not covered by the backward compatibility promise for PHPUnit
 */
final class ExcludeList
{
    public static function addDirectory(string $directory): void
    {
    }
    /**
     * @throws Exception
     *
     * @return string[]
     */
    public function getExcludedDirectories(): array
    {
    }
    /**
     * @throws Exception
     */
    public function isExcluded(string $file): bool
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class FileLoader
{
    /**
     * Checks if a PHP sourcecode file is readable. The sourcecode file is loaded through the load() method.
     *
     * As a fallback, PHP looks in the directory of the file executing the stream_resolve_include_path function.
     * We do not want to load the Test.php file here, so skip it if it found that.
     * PHP prioritizes the include_path setting, so if the current directory is in there, it will first look in the
     * current working directory.
     *
     * @throws Exception
     */
    public static function checkAndLoad(string $filename): string
    {
    }
    /**
     * Loads a PHP sourcefile.
     */
    public static function load(string $filename): void
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class Filesystem
{
    /**
     * Maps class names to source file names.
     *
     *   - PEAR CS:   Foo_Bar_Baz -> Foo/Bar/Baz.php
     *   - Namespace: Foo\Bar\Baz -> Foo/Bar/Baz.php
     */
    public static function classNameToFilename(string $className): string
    {
    }
    public static function createDirectory(string $directory): bool
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class Filter
{
    /**
     * @throws \PHPUnit\Framework\Exception
     */
    public static function getFilteredStacktrace(\Throwable $t): string
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class GlobalState
{
    /**
     * @throws Exception
     */
    public static function getIncludedFilesAsString(): string
    {
    }
    /**
     * @param string[] $files
     *
     * @throws Exception
     */
    public static function processIncludedFilesAsString(array $files): string
    {
    }
    public static function getIniSettingsAsString(): string
    {
    }
    public static function getConstantsAsString(): string
    {
    }
    public static function getGlobalsAsString(): string
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class InvalidDataSetException extends \RuntimeException implements \PHPUnit\Exception
{
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class Json
{
    /**
     * Prettify json string.
     *
     * @throws \PHPUnit\Framework\Exception
     */
    public static function prettify(string $json): string
    {
    }
    /**
     * To allow comparison of JSON strings, first process them into a consistent
     * format so that they can be compared as strings.
     *
     * @return array ($error, $canonicalized_json)  The $error parameter is used
     *               to indicate an error decoding the json. This is used to avoid ambiguity
     *               with JSON strings consisting entirely of 'null' or 'false'.
     */
    public static function canonicalize(string $json): array
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
class Printer
{
    /**
     * @param null|resource|string $out
     *
     * @throws Exception
     */
    public function __construct($out = null)
    {
    }
    public function write(string $buffer): void
    {
    }
    public function flush(): void
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class Reflection
{
    /**
     * @phan-return list<\ReflectionMethod>
     */
    public function publicMethodsInTestClass(\ReflectionClass $class): array
    {
    }
    /**
     * @phan-return list<\ReflectionMethod>
     */
    public function methodsInTestClass(\ReflectionClass $class): array
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class RegularExpression
{
    /**
     * @return false|int
     */
    public static function safeMatch(string $pattern, string $subject)
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class Test
{
    /**
     * @var int
     */
    public const UNKNOWN = -1;
    /**
     * @var int
     */
    public const SMALL = 0;
    /**
     * @var int
     */
    public const MEDIUM = 1;
    /**
     * @var int
     */
    public const LARGE = 2;
    /**
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     */
    public static function describe(\PHPUnit\Framework\Test $test): array
    {
    }
    public static function describeAsString(\PHPUnit\Framework\Test $test): string
    {
    }
    /**
     * @throws \PHPUnit\Framework\CodeCoverageException
     *
     * @return array|bool
     *
     * @phan-param class-string $className
     */
    public static function getLinesToBeCovered(string $className, string $methodName)
    {
    }
    /**
     * Returns lines of code specified with the @uses annotation.
     *
     * @throws \PHPUnit\Framework\CodeCoverageException
     *
     * @phan-param class-string $className
     */
    public static function getLinesToBeUsed(string $className, string $methodName): array
    {
    }
    public static function requiresCodeCoverageDataCollection(\PHPUnit\Framework\TestCase $test): bool
    {
    }
    /**
     * @throws Exception
     *
     * @phan-param class-string $className
     */
    public static function getRequirements(string $className, string $methodName): array
    {
    }
    /**
     * Returns the missing requirements for a test.
     *
     * @throws Exception
     * @throws \PHPUnit\Framework\Warning
     *
     * @phan-param class-string $className
     */
    public static function getMissingRequirements(string $className, string $methodName): array
    {
    }
    /**
     * Returns the provided data for a method.
     *
     * @throws Exception
     *
     * @phan-param class-string $className
     */
    public static function getProvidedData(string $className, string $methodName): ?array
    {
    }
    /**
     * @phan-param class-string $className
     */
    public static function parseTestMethodAnnotations(string $className, ?string $methodName = null): array
    {
    }
    /**
     * @phan-param class-string $className
     */
    public static function getInlineAnnotations(string $className, string $methodName): array
    {
    }
    /** @phan-param class-string $className */
    public static function getBackupSettings(string $className, string $methodName): array
    {
    }
    /**
     * @phan-param class-string $className
     *
     * @return \PHPUnit\Framework\ExecutionOrderDependency[]
     */
    public static function getDependencies(string $className, string $methodName): array
    {
    }
    /** @phan-param class-string $className */
    public static function getGroups(string $className, ?string $methodName = ''): array
    {
    }
    /** @phan-param class-string $className */
    public static function getSize(string $className, ?string $methodName): int
    {
    }
    /** @phan-param class-string $className */
    public static function getProcessIsolationSettings(string $className, string $methodName): bool
    {
    }
    /** @phan-param class-string $className */
    public static function getClassProcessIsolationSettings(string $className, string $methodName): bool
    {
    }
    /** @phan-param class-string $className */
    public static function getPreserveGlobalStateSettings(string $className, string $methodName): ?bool
    {
    }
    /** @phan-param class-string $className */
    public static function getHookMethods(string $className): array
    {
    }
    public static function isTestMethod(\ReflectionMethod $method): bool
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class TextTestListRenderer
{
    /**
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     */
    public function render(\PHPUnit\Framework\TestSuite $suite): string
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class Type
{
    public static function isType(string $type): bool
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 *
 * @phan-side-effect-free
 */
final class VersionComparisonOperator
{
    public function __construct(string $operator)
    {
    }
    /**
     * @return '!='|'<'|'<='|'<>'|'='|'=='|'>'|'>='|'eq'|'ge'|'gt'|'le'|'lt'|'ne'
     */
    public function asString(): string
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 *
 * @deprecated
 */
final class XdebugFilterScriptGenerator
{
    public function generate(\PHPUnit\TextUI\XmlConfiguration\CodeCoverage\CodeCoverage $filter): string
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class Xml
{
    /**
     * @deprecated Only used by assertEqualXMLStructure()
     */
    public static function import(\DOMElement $element): \DOMElement
    {
    }
    /**
     * @deprecated Only used by assertEqualXMLStructure()
     */
    public static function removeCharacterDataNodes(\DOMNode $node): void
    {
    }
    /**
     * Escapes a string for the use in XML documents.
     *
     * Any Unicode character is allowed, excluding the surrogate blocks, FFFE,
     * and FFFF (not even as character reference).
     *
     * @see https://www.w3.org/TR/xml/#charsets
     */
    public static function prepareString(string $string): string
    {
    }
    /**
     * "Convert" a DOMElement object into a PHP variable.
     */
    public static function xmlToVariable(\DOMElement $element)
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class XmlTestListRenderer
{
    /**
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     */
    public function render(\PHPUnit\Framework\TestSuite $suite): string
    {
    }
}
namespace PHPUnit\Util\Annotation;

/**
 * This is an abstraction around a PHPUnit-specific docBlock,
 * allowing us to ask meaningful questions about a specific
 * reflection symbol.
 *
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class DocBlock
{
    /**
     * @todo This constant should be private (it's public because of TestTest::testGetProvidedDataRegEx)
     */
    public const REGEX_DATA_PROVIDER = '/@dataProvider\s+([a-zA-Z0-9._:-\\\\x7f-\xff]+)/';
    public static function ofClass(\ReflectionClass $class): self
    {
    }
    /**
     * @phan-param class-string $classNameInHierarchy
     */
    public static function ofMethod(\ReflectionMethod $method, string $classNameInHierarchy): self
    {
    }
    /**
     * @phan-return array{
     *   __OFFSET: array<string, int>&array{__FILE: string},
     *   setting?: array<string, string>,
     *   extension_versions?: array<string, array{version: string, operator: string}>
     * }&array<
     *   string,
     *   string|array{version: string, operator: string}|array{constraint: string}|array<int|string, string>
     * >
     *
     * @throws \PHPUnit\Framework\Warning if the requirements version constraint is not well-formed
     */
    public function requirements(): array
    {
    }
    /**
     * Returns the provided data for a method.
     *
     * @throws \PHPUnit\Util\Exception
     */
    public function getProvidedData(): ?array
    {
    }
    /**
     * @phan-return array<string, array{line: int, value: string}>
     */
    public function getInlineAnnotations(): array
    {
    }
    public function symbolAnnotations(): array
    {
    }
    public function isHookToBeExecutedBeforeClass(): bool
    {
    }
    public function isHookToBeExecutedAfterClass(): bool
    {
    }
    public function isToBeExecutedBeforeTest(): bool
    {
    }
    public function isToBeExecutedAfterTest(): bool
    {
    }
    public function isToBeExecutedAsPreCondition(): bool
    {
    }
    public function isToBeExecutedAsPostCondition(): bool
    {
    }
}
/**
 * Reflection information, and therefore DocBlock information, is static within
 * a single PHP process. It is therefore okay to use a Singleton registry here.
 *
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class Registry
{
    public static function getInstance(): self
    {
    }
    /**
     * @throws \PHPUnit\Util\Exception
     *
     * @phan-param class-string $class
     */
    public function forClassName(string $class): \PHPUnit\Util\Annotation\DocBlock
    {
    }
    /**
     * @throws \PHPUnit\Util\Exception
     *
     * @phan-param class-string $classInHierarchy
     */
    public function forMethod(string $classInHierarchy, string $method): \PHPUnit\Util\Annotation\DocBlock
    {
    }
}
namespace PHPUnit\Util\Log;

/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class JUnit extends \PHPUnit\Util\Printer implements \PHPUnit\Framework\TestListener
{
    /**
     * @param null|mixed $out
     */
    public function __construct($out = null, bool $reportRiskyTests = false)
    {
    }
    /**
     * Flush buffer and close output.
     */
    public function flush(): void
    {
    }
    /**
     * An error occurred.
     */
    public function addError(\PHPUnit\Framework\Test $test, \Throwable $t, float $time): void
    {
    }
    /**
     * A warning occurred.
     */
    public function addWarning(\PHPUnit\Framework\Test $test, \PHPUnit\Framework\Warning $e, float $time): void
    {
    }
    /**
     * A failure occurred.
     */
    public function addFailure(\PHPUnit\Framework\Test $test, \PHPUnit\Framework\AssertionFailedError $e, float $time): void
    {
    }
    /**
     * Incomplete test.
     */
    public function addIncompleteTest(\PHPUnit\Framework\Test $test, \Throwable $t, float $time): void
    {
    }
    /**
     * Risky test.
     */
    public function addRiskyTest(\PHPUnit\Framework\Test $test, \Throwable $t, float $time): void
    {
    }
    /**
     * Skipped test.
     */
    public function addSkippedTest(\PHPUnit\Framework\Test $test, \Throwable $t, float $time): void
    {
    }
    /**
     * A testsuite started.
     */
    public function startTestSuite(\PHPUnit\Framework\TestSuite $suite): void
    {
    }
    /**
     * A testsuite ended.
     */
    public function endTestSuite(\PHPUnit\Framework\TestSuite $suite): void
    {
    }
    /**
     * A test started.
     */
    public function startTest(\PHPUnit\Framework\Test $test): void
    {
    }
    /**
     * A test ended.
     */
    public function endTest(\PHPUnit\Framework\Test $test, float $time): void
    {
    }
    /**
     * Returns the XML as a string.
     */
    public function getXML(): string
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class TeamCity extends \PHPUnit\TextUI\DefaultResultPrinter
{
    public function printResult(\PHPUnit\Framework\TestResult $result): void
    {
    }
    /**
     * An error occurred.
     */
    public function addError(\PHPUnit\Framework\Test $test, \Throwable $t, float $time): void
    {
    }
    /**
     * A warning occurred.
     */
    public function addWarning(\PHPUnit\Framework\Test $test, \PHPUnit\Framework\Warning $e, float $time): void
    {
    }
    /**
     * A failure occurred.
     */
    public function addFailure(\PHPUnit\Framework\Test $test, \PHPUnit\Framework\AssertionFailedError $e, float $time): void
    {
    }
    /**
     * Incomplete test.
     */
    public function addIncompleteTest(\PHPUnit\Framework\Test $test, \Throwable $t, float $time): void
    {
    }
    /**
     * Risky test.
     */
    public function addRiskyTest(\PHPUnit\Framework\Test $test, \Throwable $t, float $time): void
    {
    }
    /**
     * Skipped test.
     */
    public function addSkippedTest(\PHPUnit\Framework\Test $test, \Throwable $t, float $time): void
    {
    }
    public function printIgnoredTest(string $testName, \Throwable $t, float $time): void
    {
    }
    /**
     * A testsuite started.
     */
    public function startTestSuite(\PHPUnit\Framework\TestSuite $suite): void
    {
    }
    /**
     * A testsuite ended.
     */
    public function endTestSuite(\PHPUnit\Framework\TestSuite $suite): void
    {
    }
    /**
     * A test started.
     */
    public function startTest(\PHPUnit\Framework\Test $test): void
    {
    }
    /**
     * A test ended.
     */
    public function endTest(\PHPUnit\Framework\Test $test, float $time): void
    {
    }
}
namespace PHPUnit\Util\PHP;

/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
abstract class AbstractPhpProcess
{
    /**
     * @var \SebastianBergmann\Environment\Runtime
     */
    protected $runtime;
    /**
     * @var bool
     */
    protected $stderrRedirection = false;
    /**
     * @var string
     */
    protected $stdin = '';
    /**
     * @var string
     */
    protected $args = '';
    /**
     * @var array<string, string>
     */
    protected $env = [];
    /**
     * @var int
     */
    protected $timeout = 0;
    public static function factory(): self
    {
    }
    public function __construct()
    {
    }
    /**
     * Defines if should use STDERR redirection or not.
     *
     * Then $stderrRedirection is TRUE, STDERR is redirected to STDOUT.
     */
    public function setUseStderrRedirection(bool $stderrRedirection): void
    {
    }
    /**
     * Returns TRUE if uses STDERR redirection or FALSE if not.
     */
    public function useStderrRedirection(): bool
    {
    }
    /**
     * Sets the input string to be sent via STDIN.
     */
    public function setStdin(string $stdin): void
    {
    }
    /**
     * Returns the input string to be sent via STDIN.
     */
    public function getStdin(): string
    {
    }
    /**
     * Sets the string of arguments to pass to the php job.
     */
    public function setArgs(string $args): void
    {
    }
    /**
     * Returns the string of arguments to pass to the php job.
     */
    public function getArgs(): string
    {
    }
    /**
     * Sets the array of environment variables to start the child process with.
     *
     * @param array<string, string> $env
     */
    public function setEnv(array $env): void
    {
    }
    /**
     * Returns the array of environment variables to start the child process with.
     */
    public function getEnv(): array
    {
    }
    /**
     * Sets the amount of seconds to wait before timing out.
     */
    public function setTimeout(int $timeout): void
    {
    }
    /**
     * Returns the amount of seconds to wait before timing out.
     */
    public function getTimeout(): int
    {
    }
    /**
     * Runs a single test in a separate PHP process.
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     */
    public function runTestJob(string $job, \PHPUnit\Framework\Test $test, \PHPUnit\Framework\TestResult $result, string $processResultFile): void
    {
    }
    /**
     * Returns the command based into the configurations.
     */
    public function getCommand(array $settings, ?string $file = null): string
    {
    }
    /**
     * Runs a single job (PHP code) using a separate PHP process.
     */
    abstract public function runJob(string $job, array $settings = []): array;
    protected function settingsToParameters(array $settings): string
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
class DefaultPhpProcess extends \PHPUnit\Util\PHP\AbstractPhpProcess
{
    /**
     * @var string
     */
    protected $tempFile;
    /**
     * Runs a single job (PHP code) using a separate PHP process.
     *
     * @throws \PHPUnit\Framework\Exception
     */
    public function runJob(string $job, array $settings = []): array
    {
    }
    /**
     * Returns an array of file handles to be used in place of pipes.
     */
    protected function getHandles(): array
    {
    }
    /**
     * Handles creating the child process and returning the STDOUT and STDERR.
     *
     * @throws \PHPUnit\Framework\Exception
     */
    protected function runProcess(string $job, array $settings): array
    {
    }
    /**
     * @param resource $pipe
     */
    protected function process($pipe, string $job): void
    {
    }
    protected function cleanup(): void
    {
    }
    protected function useTemporaryFile(): bool
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 *
 * @see https://bugs.php.net/bug.php?id=51800
 */
final class WindowsPhpProcess extends \PHPUnit\Util\PHP\DefaultPhpProcess
{
    public function getCommand(array $settings, ?string $file = null): string
    {
    }
}
namespace PHPUnit\Util\TestDox;

/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
class CliTestDoxPrinter extends \PHPUnit\Util\TestDox\TestDoxPrinter
{
    /**
     * @param null|resource|string $out
     * @param int|string           $numberOfColumns
     *
     * @throws \PHPUnit\Framework\Exception
     */
    public function __construct($out = null, bool $verbose = false, string $colors = self::COLOR_DEFAULT, bool $debug = false, $numberOfColumns = 80, bool $reverse = false)
    {
    }
    public function printResult(\PHPUnit\Framework\TestResult $result): void
    {
    }
    protected function printHeader(\PHPUnit\Framework\TestResult $result): void
    {
    }
    protected function formatClassName(\PHPUnit\Framework\Test $test): string
    {
    }
    /**
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     */
    protected function registerTestResult(\PHPUnit\Framework\Test $test, ?\Throwable $t, int $status, float $time, bool $verbose): void
    {
    }
    /**
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     */
    protected function formatTestName(\PHPUnit\Framework\Test $test): string
    {
    }
    protected function writeTestResult(array $prevResult, array $result): void
    {
    }
    protected function formatThrowable(\Throwable $t, ?int $status = null): string
    {
    }
    protected function colorizeMessageAndDiff(string $style, string $buffer): array
    {
    }
    protected function formatStacktrace(\Throwable $t): string
    {
    }
    protected function formatTestResultMessage(\Throwable $t, array $result, ?string $prefix = null): string
    {
    }
    protected function drawSpinner(): void
    {
    }
    protected function undrawSpinner(): void
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class HtmlResultPrinter extends \PHPUnit\Util\TestDox\ResultPrinter
{
    public function printResult(\PHPUnit\Framework\TestResult $result): void
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class NamePrettifier
{
    public function __construct(bool $useColor = false)
    {
    }
    /**
     * Prettifies the name of a test class.
     *
     * @phan-param class-string $className
     */
    public function prettifyTestClass(string $className): string
    {
    }
    /**
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     */
    public function prettifyTestCase(\PHPUnit\Framework\TestCase $test): string
    {
    }
    public function prettifyDataSet(\PHPUnit\Framework\TestCase $test): string
    {
    }
    /**
     * Prettifies the name of a test method.
     */
    public function prettifyTestMethod(string $name): string
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
abstract class ResultPrinter extends \PHPUnit\Util\Printer implements \PHPUnit\TextUI\ResultPrinter
{
    /**
     * @var NamePrettifier
     */
    protected $prettifier;
    /**
     * @var string
     */
    protected $testClass = '';
    /**
     * @var int
     */
    protected $testStatus;
    /**
     * @var array
     */
    protected $tests = [];
    /**
     * @var int
     */
    protected $successful = 0;
    /**
     * @var int
     */
    protected $warned = 0;
    /**
     * @var int
     */
    protected $failed = 0;
    /**
     * @var int
     */
    protected $risky = 0;
    /**
     * @var int
     */
    protected $skipped = 0;
    /**
     * @var int
     */
    protected $incomplete = 0;
    /**
     * @var null|string
     */
    protected $currentTestClassPrettified;
    /**
     * @var null|string
     */
    protected $currentTestMethodPrettified;
    /**
     * @param resource $out
     *
     * @throws \PHPUnit\Framework\Exception
     */
    public function __construct($out = null, array $groups = [], array $excludeGroups = [])
    {
    }
    /**
     * Flush buffer and close output.
     */
    public function flush(): void
    {
    }
    /**
     * An error occurred.
     */
    public function addError(\PHPUnit\Framework\Test $test, \Throwable $t, float $time): void
    {
    }
    /**
     * A warning occurred.
     */
    public function addWarning(\PHPUnit\Framework\Test $test, \PHPUnit\Framework\Warning $e, float $time): void
    {
    }
    /**
     * A failure occurred.
     */
    public function addFailure(\PHPUnit\Framework\Test $test, \PHPUnit\Framework\AssertionFailedError $e, float $time): void
    {
    }
    /**
     * Incomplete test.
     */
    public function addIncompleteTest(\PHPUnit\Framework\Test $test, \Throwable $t, float $time): void
    {
    }
    /**
     * Risky test.
     */
    public function addRiskyTest(\PHPUnit\Framework\Test $test, \Throwable $t, float $time): void
    {
    }
    /**
     * Skipped test.
     */
    public function addSkippedTest(\PHPUnit\Framework\Test $test, \Throwable $t, float $time): void
    {
    }
    /**
     * A testsuite started.
     */
    public function startTestSuite(\PHPUnit\Framework\TestSuite $suite): void
    {
    }
    /**
     * A testsuite ended.
     */
    public function endTestSuite(\PHPUnit\Framework\TestSuite $suite): void
    {
    }
    /**
     * A test started.
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     */
    public function startTest(\PHPUnit\Framework\Test $test): void
    {
    }
    /**
     * A test ended.
     */
    public function endTest(\PHPUnit\Framework\Test $test, float $time): void
    {
    }
    protected function doEndClass(): void
    {
    }
    /**
     * Handler for 'start run' event.
     */
    protected function startRun(): void
    {
    }
    /**
     * Handler for 'start class' event.
     */
    protected function startClass(string $name): void
    {
    }
    /**
     * Handler for 'on test' event.
     */
    protected function onTest(string $name, bool $success = true): void
    {
    }
    /**
     * Handler for 'end class' event.
     */
    protected function endClass(string $name): void
    {
    }
    /**
     * Handler for 'end run' event.
     */
    protected function endRun(): void
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
class TestDoxPrinter extends \PHPUnit\TextUI\DefaultResultPrinter
{
    /**
     * @var NamePrettifier
     */
    protected $prettifier;
    /**
     * @var int The number of test results received from the TestRunner
     */
    protected $testIndex = 0;
    /**
     * @var int The number of test results already sent to the output
     */
    protected $testFlushIndex = 0;
    /**
     * @var array<int, array> Buffer for test results
     */
    protected $testResults = [];
    /**
     * @var array<string, int> Lookup table for testname to testResults[index]
     */
    protected $testNameResultIndex = [];
    /**
     * @var bool
     */
    protected $enableOutputBuffer = false;
    /**
     * @var array array<string>
     */
    protected $originalExecutionOrder = [];
    /**
     * @var int
     */
    protected $spinState = 0;
    /**
     * @var bool
     */
    protected $showProgress = true;
    /**
     * @param null|resource|string $out
     * @param int|string           $numberOfColumns
     *
     * @throws \PHPUnit\Framework\Exception
     */
    public function __construct($out = null, bool $verbose = false, string $colors = self::COLOR_DEFAULT, bool $debug = false, $numberOfColumns = 80, bool $reverse = false)
    {
    }
    public function setOriginalExecutionOrder(array $order): void
    {
    }
    public function setShowProgressAnimation(bool $showProgress): void
    {
    }
    public function printResult(\PHPUnit\Framework\TestResult $result): void
    {
    }
    /**
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     */
    public function endTest(\PHPUnit\Framework\Test $test, float $time): void
    {
    }
    /**
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     */
    public function addError(\PHPUnit\Framework\Test $test, \Throwable $t, float $time): void
    {
    }
    /**
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     */
    public function addWarning(\PHPUnit\Framework\Test $test, \PHPUnit\Framework\Warning $e, float $time): void
    {
    }
    /**
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     */
    public function addFailure(\PHPUnit\Framework\Test $test, \PHPUnit\Framework\AssertionFailedError $e, float $time): void
    {
    }
    /**
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     */
    public function addIncompleteTest(\PHPUnit\Framework\Test $test, \Throwable $t, float $time): void
    {
    }
    /**
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     */
    public function addRiskyTest(\PHPUnit\Framework\Test $test, \Throwable $t, float $time): void
    {
    }
    /**
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     */
    public function addSkippedTest(\PHPUnit\Framework\Test $test, \Throwable $t, float $time): void
    {
    }
    public function writeProgress(string $progress): void
    {
    }
    public function flush(): void
    {
    }
    /**
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     */
    protected function registerTestResult(\PHPUnit\Framework\Test $test, ?\Throwable $t, int $status, float $time, bool $verbose): void
    {
    }
    protected function formatTestName(\PHPUnit\Framework\Test $test): string
    {
    }
    protected function formatClassName(\PHPUnit\Framework\Test $test): string
    {
    }
    protected function testHasPassed(): bool
    {
    }
    protected function flushOutputBuffer(bool $forceFlush = false): void
    {
    }
    protected function showSpinner(): void
    {
    }
    protected function hideSpinner(): void
    {
    }
    protected function drawSpinner(): void
    {
    }
    protected function undrawSpinner(): void
    {
    }
    protected function writeTestResult(array $prevResult, array $result): void
    {
    }
    protected function getEmptyTestResult(): array
    {
    }
    protected function getTestResultByName(?string $testName): array
    {
    }
    protected function formatThrowable(\Throwable $t, ?int $status = null): string
    {
    }
    protected function formatStacktrace(\Throwable $t): string
    {
    }
    protected function formatTestResultMessage(\Throwable $t, array $result, string $prefix = '│'): string
    {
    }
    protected function prefixLines(string $prefix, string $message): string
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class TextResultPrinter extends \PHPUnit\Util\TestDox\ResultPrinter
{
    public function printResult(\PHPUnit\Framework\TestResult $result): void
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class XmlResultPrinter extends \PHPUnit\Util\Printer implements \PHPUnit\Framework\TestListener
{
    /**
     * @param resource|string $out
     *
     * @throws \PHPUnit\Framework\Exception
     */
    public function __construct($out = null)
    {
    }
    /**
     * Flush buffer and close output.
     */
    public function flush(): void
    {
    }
    /**
     * An error occurred.
     */
    public function addError(\PHPUnit\Framework\Test $test, \Throwable $t, float $time): void
    {
    }
    /**
     * A warning occurred.
     */
    public function addWarning(\PHPUnit\Framework\Test $test, \PHPUnit\Framework\Warning $e, float $time): void
    {
    }
    /**
     * A failure occurred.
     */
    public function addFailure(\PHPUnit\Framework\Test $test, \PHPUnit\Framework\AssertionFailedError $e, float $time): void
    {
    }
    /**
     * Incomplete test.
     */
    public function addIncompleteTest(\PHPUnit\Framework\Test $test, \Throwable $t, float $time): void
    {
    }
    /**
     * Risky test.
     */
    public function addRiskyTest(\PHPUnit\Framework\Test $test, \Throwable $t, float $time): void
    {
    }
    /**
     * Skipped test.
     */
    public function addSkippedTest(\PHPUnit\Framework\Test $test, \Throwable $t, float $time): void
    {
    }
    /**
     * A test suite started.
     */
    public function startTestSuite(\PHPUnit\Framework\TestSuite $suite): void
    {
    }
    /**
     * A test suite ended.
     */
    public function endTestSuite(\PHPUnit\Framework\TestSuite $suite): void
    {
    }
    /**
     * A test started.
     */
    public function startTest(\PHPUnit\Framework\Test $test): void
    {
    }
    /**
     * A test ended.
     *
     * @throws \SebastianBergmann\RecursionContext\InvalidArgumentException
     */
    public function endTest(\PHPUnit\Framework\Test $test, float $time): void
    {
    }
}
namespace PHPUnit\Util\Xml;

/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class Exception extends \RuntimeException implements \PHPUnit\Exception
{
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 *
 * @phan-side-effect-free
 */
final class FailedSchemaDetectionResult extends \PHPUnit\Util\Xml\SchemaDetectionResult
{
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class Loader
{
    /**
     * @throws Exception
     */
    public function loadFile(string $filename, bool $isHtml = false, bool $xinclude = false, bool $strict = false): \DOMDocument
    {
    }
    /**
     * @throws Exception
     */
    public function load(string $actual, bool $isHtml = false, string $filename = '', bool $xinclude = false, bool $strict = false): \DOMDocument
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 *
 * @phan-side-effect-free
 */
abstract class SchemaDetectionResult
{
    /**
     * @psalm-assert-if-true SuccessfulSchemaDetectionResult $this
     */
    public function detected(): bool
    {
    }
    /**
     * @throws Exception
     */
    public function version(): string
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class SchemaDetector
{
    /**
     * @throws Exception
     */
    public function detect(string $filename): \PHPUnit\Util\Xml\SchemaDetectionResult
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class SchemaFinder
{
    /**
     * @phan-return non-empty-list<non-empty-string>
     */
    public function available(): array
    {
    }
    /**
     * @throws Exception
     */
    public function find(string $version): string
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 *
 * @template-implements \IteratorAggregate<int, \DOMNode>
 */
final class SnapshotNodeList implements \Countable, \IteratorAggregate
{
    public static function fromNodeList(\DOMNodeList $list): self
    {
    }
    public function count(): int
    {
    }
    public function getIterator(): \ArrayIterator
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 *
 * @phan-side-effect-free
 */
final class SuccessfulSchemaDetectionResult extends \PHPUnit\Util\Xml\SchemaDetectionResult
{
    /**
     * @phan-param non-empty-string $version
     */
    public function __construct(string $version)
    {
    }
    /**
     * @psalm-assert-if-true SuccessfulSchemaDetectionResult $this
     */
    public function detected(): bool
    {
    }
    /**
     * @phan-return non-empty-string
     */
    public function version(): string
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 *
 * @phan-side-effect-free
 */
final class ValidationResult
{
    /**
     * @phan-param array<int,\LibXMLError> $errors
     */
    public static function fromArray(array $errors): self
    {
    }
    public function hasValidationErrors(): bool
    {
    }
    public function asString(): string
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for PHPUnit
 */
final class Validator
{
    public function validate(\DOMDocument $document, string $xsdFilename): \PHPUnit\Util\Xml\ValidationResult
    {
    }
}
namespace SebastianBergmann;

final class Version
{
    public function __construct(string $release, string $path)
    {
    }
    public function getVersion(): string
    {
    }
}
namespace SebastianBergmann\CliParser;

final class Parser
{
    /**
     * @phan-param list<string> $argv
     * @phan-param list<string> $longOptions
     *
     * @throws AmbiguousOptionException
     * @throws RequiredOptionArgumentMissingException
     * @throws OptionDoesNotAllowArgumentException
     * @throws UnknownOptionException
     */
    public function parse(array $argv, string $shortOptions, ?array $longOptions = null): array
    {
    }
}
final class AmbiguousOptionException extends \RuntimeException implements \SebastianBergmann\CliParser\Exception
{
    public function __construct(string $option)
    {
    }
}
interface Exception extends \Throwable
{
}
final class OptionDoesNotAllowArgumentException extends \RuntimeException implements \SebastianBergmann\CliParser\Exception
{
    public function __construct(string $option)
    {
    }
}
final class RequiredOptionArgumentMissingException extends \RuntimeException implements \SebastianBergmann\CliParser\Exception
{
    public function __construct(string $option)
    {
    }
}
final class UnknownOptionException extends \RuntimeException implements \SebastianBergmann\CliParser\Exception
{
    public function __construct(string $option)
    {
    }
}
namespace SebastianBergmann\CodeCoverage;

/**
 * Provides collection functionality for PHP code coverage information.
 */
final class CodeCoverage
{
    public function __construct(\SebastianBergmann\CodeCoverage\Driver\Driver $driver, \SebastianBergmann\CodeCoverage\Filter $filter)
    {
    }
    /**
     * Returns the code coverage information as a graph of node objects.
     */
    public function getReport(): \SebastianBergmann\CodeCoverage\Node\Directory
    {
    }
    /**
     * Clears collected code coverage data.
     */
    public function clear(): void
    {
    }
    /**
     * @internal
     */
    public function clearCache(): void
    {
    }
    /**
     * Returns the filter object used.
     */
    public function filter(): \SebastianBergmann\CodeCoverage\Filter
    {
    }
    /**
     * Returns the collected code coverage data.
     */
    public function getData(bool $raw = false): \SebastianBergmann\CodeCoverage\ProcessedCodeCoverageData
    {
    }
    /**
     * Sets the coverage data.
     */
    public function setData(\SebastianBergmann\CodeCoverage\ProcessedCodeCoverageData $data): void
    {
    }
    /**
     * Returns the test data.
     */
    public function getTests(): array
    {
    }
    /**
     * Sets the test data.
     */
    public function setTests(array $tests): void
    {
    }
    /**
     * Start collection of code coverage information.
     *
     * @param \PHPUnit\Runner\PhptTestCase|string|\PHPUnit\Framework\TestCase $id
     */
    public function start($id, bool $clear = false): void
    {
    }
    /**
     * Stop collection of code coverage information.
     *
     * @param array|false $linesToBeCovered
     */
    public function stop(bool $append = true, $linesToBeCovered = [], array $linesToBeUsed = []): \SebastianBergmann\CodeCoverage\RawCodeCoverageData
    {
    }
    /**
     * Appends code coverage data.
     *
     * @param \PHPUnit\Runner\PhptTestCase|string|\PHPUnit\Framework\TestCase $id
     * @param array|false                  $linesToBeCovered
     *
     * @throws ReflectionException
     * @throws TestIdMissingException
     * @throws UnintentionallyCoveredCodeException
     */
    public function append(\SebastianBergmann\CodeCoverage\RawCodeCoverageData $rawData, $id = null, bool $append = true, $linesToBeCovered = [], array $linesToBeUsed = []): void
    {
    }
    /**
     * Merges the data from another instance.
     */
    public function merge(self $that): void
    {
    }
    public function enableCheckForUnintentionallyCoveredCode(): void
    {
    }
    public function disableCheckForUnintentionallyCoveredCode(): void
    {
    }
    public function includeUncoveredFiles(): void
    {
    }
    public function excludeUncoveredFiles(): void
    {
    }
    public function processUncoveredFiles(): void
    {
    }
    public function doNotProcessUncoveredFiles(): void
    {
    }
    public function enableAnnotationsForIgnoringCode(): void
    {
    }
    public function disableAnnotationsForIgnoringCode(): void
    {
    }
    public function ignoreDeprecatedCode(): void
    {
    }
    public function doNotIgnoreDeprecatedCode(): void
    {
    }
    /**
     * @psalm-assert-if-true !null $this->cacheDirectory
     */
    public function cachesStaticAnalysis(): bool
    {
    }
    public function cacheStaticAnalysis(string $directory): void
    {
    }
    public function doNotCacheStaticAnalysis(): void
    {
    }
    /**
     * @throws StaticAnalysisCacheNotConfiguredException
     */
    public function cacheDirectory(): string
    {
    }
    /**
     * @phan-param class-string $className
     */
    public function excludeSubclassesOfThisClassFromUnintentionallyCoveredCodeCheck(string $className): void
    {
    }
    public function enableBranchAndPathCoverage(): void
    {
    }
    public function disableBranchAndPathCoverage(): void
    {
    }
    public function collectsBranchAndPathCoverage(): bool
    {
    }
    public function detectsDeadCode(): bool
    {
    }
}
final class BranchAndPathCoverageNotSupportedException extends \RuntimeException implements \SebastianBergmann\CodeCoverage\Exception
{
}
final class DeadCodeDetectionNotSupportedException extends \RuntimeException implements \SebastianBergmann\CodeCoverage\Exception
{
}
interface Exception extends \Throwable
{
}
final class InvalidArgumentException extends \InvalidArgumentException implements \SebastianBergmann\CodeCoverage\Exception
{
}
final class NoCodeCoverageDriverAvailableException extends \RuntimeException implements \SebastianBergmann\CodeCoverage\Exception
{
    public function __construct()
    {
    }
}
final class NoCodeCoverageDriverWithPathCoverageSupportAvailableException extends \RuntimeException implements \SebastianBergmann\CodeCoverage\Exception
{
    public function __construct()
    {
    }
}
final class ParserException extends \RuntimeException implements \SebastianBergmann\CodeCoverage\Exception
{
}
final class ReflectionException extends \RuntimeException implements \SebastianBergmann\CodeCoverage\Exception
{
}
final class ReportAlreadyFinalizedException extends \RuntimeException implements \SebastianBergmann\CodeCoverage\Exception
{
    public function __construct()
    {
    }
}
final class StaticAnalysisCacheNotConfiguredException extends \RuntimeException implements \SebastianBergmann\CodeCoverage\Exception
{
}
final class TestIdMissingException extends \RuntimeException implements \SebastianBergmann\CodeCoverage\Exception
{
    public function __construct()
    {
    }
}
final class UnintentionallyCoveredCodeException extends \RuntimeException implements \SebastianBergmann\CodeCoverage\Exception
{
    public function __construct(array $unintentionallyCoveredUnits)
    {
    }
    public function getUnintentionallyCoveredUnits(): array
    {
    }
}
final class XmlException extends \RuntimeException implements \SebastianBergmann\CodeCoverage\Exception
{
}
final class Filter
{
    public function includeDirectory(string $directory, string $suffix = '.php', string $prefix = ''): void
    {
    }
    /**
     * @phan-param list<string> $files
     */
    public function includeFiles(array $filenames): void
    {
    }
    public function includeFile(string $filename): void
    {
    }
    public function excludeDirectory(string $directory, string $suffix = '.php', string $prefix = ''): void
    {
    }
    public function excludeFile(string $filename): void
    {
    }
    public function isFile(string $filename): bool
    {
    }
    public function isExcluded(string $filename): bool
    {
    }
    /**
     * @phan-return list<string>
     */
    public function files(): array
    {
    }
    public function isEmpty(): bool
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for phpunit/php-code-coverage
 */
final class ProcessedCodeCoverageData
{
    public function initializeUnseenData(\SebastianBergmann\CodeCoverage\RawCodeCoverageData $rawData): void
    {
    }
    public function markCodeAsExecutedByTestCase(string $testCaseId, \SebastianBergmann\CodeCoverage\RawCodeCoverageData $executedCode): void
    {
    }
    public function setLineCoverage(array $lineCoverage): void
    {
    }
    public function lineCoverage(): array
    {
    }
    public function setFunctionCoverage(array $functionCoverage): void
    {
    }
    public function functionCoverage(): array
    {
    }
    public function coveredFiles(): array
    {
    }
    public function renameFile(string $oldFile, string $newFile): void
    {
    }
    public function merge(self $newData): void
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for phpunit/php-code-coverage
 */
final class RawCodeCoverageData
{
    public static function fromXdebugWithoutPathCoverage(array $rawCoverage): self
    {
    }
    public static function fromXdebugWithPathCoverage(array $rawCoverage): self
    {
    }
    public static function fromXdebugWithMixedCoverage(array $rawCoverage): self
    {
    }
    public static function fromUncoveredFile(string $filename, \SebastianBergmann\CodeCoverage\StaticAnalysis\FileAnalyser $analyser): self
    {
    }
    public function clear(): void
    {
    }
    public function lineCoverage(): array
    {
    }
    public function functionCoverage(): array
    {
    }
    public function removeCoverageDataForFile(string $filename): void
    {
    }
    /**
     * @param int[] $lines
     */
    public function keepLineCoverageDataOnlyForLines(string $filename, array $lines): void
    {
    }
    /**
     * @param int[] $linesToBranchMap
     */
    public function markExecutableLineByBranch(string $filename, array $linesToBranchMap): void
    {
    }
    /**
     * @param int[] $lines
     */
    public function keepFunctionCoverageDataOnlyForLines(string $filename, array $lines): void
    {
    }
    /**
     * @param int[] $lines
     */
    public function removeCoverageDataForLines(string $filename, array $lines): void
    {
    }
}
final class Version
{
    public static function id(): string
    {
    }
}
namespace SebastianBergmann\CodeCoverage\Driver;

/**
 * @internal This class is not covered by the backward compatibility promise for phpunit/php-code-coverage
 */
abstract class Driver
{
    /**
     * @var int
     *
     * @see http://xdebug.org/docs/code_coverage
     */
    public const LINE_NOT_EXECUTABLE = -2;
    /**
     * @var int
     *
     * @see http://xdebug.org/docs/code_coverage
     */
    public const LINE_NOT_EXECUTED = -1;
    /**
     * @var int
     *
     * @see http://xdebug.org/docs/code_coverage
     */
    public const LINE_EXECUTED = 1;
    /**
     * @var int
     *
     * @see http://xdebug.org/docs/code_coverage
     */
    public const BRANCH_NOT_HIT = 0;
    /**
     * @var int
     *
     * @see http://xdebug.org/docs/code_coverage
     */
    public const BRANCH_HIT = 1;
    /**
     * @throws \SebastianBergmann\CodeCoverage\NoCodeCoverageDriverAvailableException
     * @throws PcovNotAvailableException
     * @throws PhpdbgNotAvailableException
     * @throws Xdebug2NotEnabledException
     * @throws Xdebug3NotEnabledException
     * @throws XdebugNotAvailableException
     *
     * @deprecated Use DriverSelector::forLineCoverage() instead
     */
    public static function forLineCoverage(\SebastianBergmann\CodeCoverage\Filter $filter): self
    {
    }
    /**
     * @throws \SebastianBergmann\CodeCoverage\NoCodeCoverageDriverWithPathCoverageSupportAvailableException
     * @throws Xdebug2NotEnabledException
     * @throws Xdebug3NotEnabledException
     * @throws XdebugNotAvailableException
     *
     * @deprecated Use DriverSelector::forLineAndPathCoverage() instead
     */
    public static function forLineAndPathCoverage(\SebastianBergmann\CodeCoverage\Filter $filter): self
    {
    }
    public function canCollectBranchAndPathCoverage(): bool
    {
    }
    public function collectsBranchAndPathCoverage(): bool
    {
    }
    /**
     * @throws \SebastianBergmann\CodeCoverage\BranchAndPathCoverageNotSupportedException
     */
    public function enableBranchAndPathCoverage(): void
    {
    }
    public function disableBranchAndPathCoverage(): void
    {
    }
    public function canDetectDeadCode(): bool
    {
    }
    public function detectsDeadCode(): bool
    {
    }
    /**
     * @throws \SebastianBergmann\CodeCoverage\DeadCodeDetectionNotSupportedException
     */
    public function enableDeadCodeDetection(): void
    {
    }
    public function disableDeadCodeDetection(): void
    {
    }
    abstract public function nameAndVersion(): string;
    abstract public function start(): void;
    abstract public function stop(): \SebastianBergmann\CodeCoverage\RawCodeCoverageData;
}
/**
 * @internal This class is not covered by the backward compatibility promise for phpunit/php-code-coverage
 */
final class PcovDriver extends \SebastianBergmann\CodeCoverage\Driver\Driver
{
    /**
     * @throws PcovNotAvailableException
     */
    public function __construct(\SebastianBergmann\CodeCoverage\Filter $filter)
    {
    }
    public function start(): void
    {
    }
    public function stop(): \SebastianBergmann\CodeCoverage\RawCodeCoverageData
    {
    }
    public function nameAndVersion(): string
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for phpunit/php-code-coverage
 */
final class PhpdbgDriver extends \SebastianBergmann\CodeCoverage\Driver\Driver
{
    /**
     * @throws PhpdbgNotAvailableException
     */
    public function __construct()
    {
    }
    public function start(): void
    {
    }
    public function stop(): \SebastianBergmann\CodeCoverage\RawCodeCoverageData
    {
    }
    public function nameAndVersion(): string
    {
    }
}
final class Selector
{
    /**
     * @throws \SebastianBergmann\CodeCoverage\NoCodeCoverageDriverAvailableException
     * @throws PcovNotAvailableException
     * @throws PhpdbgNotAvailableException
     * @throws Xdebug2NotEnabledException
     * @throws Xdebug3NotEnabledException
     * @throws XdebugNotAvailableException
     */
    public function forLineCoverage(\SebastianBergmann\CodeCoverage\Filter $filter): \SebastianBergmann\CodeCoverage\Driver\Driver
    {
    }
    /**
     * @throws \SebastianBergmann\CodeCoverage\NoCodeCoverageDriverWithPathCoverageSupportAvailableException
     * @throws Xdebug2NotEnabledException
     * @throws Xdebug3NotEnabledException
     * @throws XdebugNotAvailableException
     */
    public function forLineAndPathCoverage(\SebastianBergmann\CodeCoverage\Filter $filter): \SebastianBergmann\CodeCoverage\Driver\Driver
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for phpunit/php-code-coverage
 */
final class Xdebug2Driver extends \SebastianBergmann\CodeCoverage\Driver\Driver
{
    /**
     * @throws WrongXdebugVersionException
     * @throws Xdebug2NotEnabledException
     * @throws XdebugNotAvailableException
     */
    public function __construct(\SebastianBergmann\CodeCoverage\Filter $filter)
    {
    }
    public function canCollectBranchAndPathCoverage(): bool
    {
    }
    public function canDetectDeadCode(): bool
    {
    }
    public function start(): void
    {
    }
    public function stop(): \SebastianBergmann\CodeCoverage\RawCodeCoverageData
    {
    }
    public function nameAndVersion(): string
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for phpunit/php-code-coverage
 */
final class Xdebug3Driver extends \SebastianBergmann\CodeCoverage\Driver\Driver
{
    /**
     * @throws WrongXdebugVersionException
     * @throws Xdebug3NotEnabledException
     * @throws XdebugNotAvailableException
     */
    public function __construct(\SebastianBergmann\CodeCoverage\Filter $filter)
    {
    }
    public function canCollectBranchAndPathCoverage(): bool
    {
    }
    public function canDetectDeadCode(): bool
    {
    }
    public function start(): void
    {
    }
    public function stop(): \SebastianBergmann\CodeCoverage\RawCodeCoverageData
    {
    }
    public function nameAndVersion(): string
    {
    }
}
final class PathExistsButIsNotDirectoryException extends \RuntimeException implements \SebastianBergmann\CodeCoverage\Exception
{
    public function __construct(string $path)
    {
    }
}
final class PcovNotAvailableException extends \RuntimeException implements \SebastianBergmann\CodeCoverage\Exception
{
    public function __construct()
    {
    }
}
final class PhpdbgNotAvailableException extends \RuntimeException implements \SebastianBergmann\CodeCoverage\Exception
{
    public function __construct()
    {
    }
}
final class WriteOperationFailedException extends \RuntimeException implements \SebastianBergmann\CodeCoverage\Exception
{
    public function __construct(string $path)
    {
    }
}
final class WrongXdebugVersionException extends \RuntimeException implements \SebastianBergmann\CodeCoverage\Exception
{
}
final class Xdebug2NotEnabledException extends \RuntimeException implements \SebastianBergmann\CodeCoverage\Exception
{
    public function __construct()
    {
    }
}
final class Xdebug3NotEnabledException extends \RuntimeException implements \SebastianBergmann\CodeCoverage\Exception
{
    public function __construct()
    {
    }
}
final class XdebugNotAvailableException extends \RuntimeException implements \SebastianBergmann\CodeCoverage\Exception
{
    public function __construct()
    {
    }
}
namespace SebastianBergmann\CodeCoverage\Node;

/**
 * @internal This class is not covered by the backward compatibility promise for phpunit/php-code-coverage
 */
abstract class AbstractNode implements \Countable
{
    public function __construct(string $name, ?self $parent = null)
    {
    }
    public function name(): string
    {
    }
    public function id(): string
    {
    }
    public function pathAsString(): string
    {
    }
    public function pathAsArray(): array
    {
    }
    public function parent(): ?self
    {
    }
    public function percentageOfTestedClasses(): \SebastianBergmann\CodeCoverage\Util\Percentage
    {
    }
    public function percentageOfTestedTraits(): \SebastianBergmann\CodeCoverage\Util\Percentage
    {
    }
    public function percentageOfTestedClassesAndTraits(): \SebastianBergmann\CodeCoverage\Util\Percentage
    {
    }
    public function percentageOfTestedFunctions(): \SebastianBergmann\CodeCoverage\Util\Percentage
    {
    }
    public function percentageOfTestedMethods(): \SebastianBergmann\CodeCoverage\Util\Percentage
    {
    }
    public function percentageOfTestedFunctionsAndMethods(): \SebastianBergmann\CodeCoverage\Util\Percentage
    {
    }
    public function percentageOfExecutedLines(): \SebastianBergmann\CodeCoverage\Util\Percentage
    {
    }
    public function percentageOfExecutedBranches(): \SebastianBergmann\CodeCoverage\Util\Percentage
    {
    }
    public function percentageOfExecutedPaths(): \SebastianBergmann\CodeCoverage\Util\Percentage
    {
    }
    public function numberOfClassesAndTraits(): int
    {
    }
    public function numberOfTestedClassesAndTraits(): int
    {
    }
    public function classesAndTraits(): array
    {
    }
    public function numberOfFunctionsAndMethods(): int
    {
    }
    public function numberOfTestedFunctionsAndMethods(): int
    {
    }
    abstract public function classes(): array;
    abstract public function traits(): array;
    abstract public function functions(): array;
    /**
     * @phan-return array{linesOfCode: int, commentLinesOfCode: int, nonCommentLinesOfCode: int}
     */
    abstract public function linesOfCode(): array;
    abstract public function numberOfExecutableLines(): int;
    abstract public function numberOfExecutedLines(): int;
    abstract public function numberOfExecutableBranches(): int;
    abstract public function numberOfExecutedBranches(): int;
    abstract public function numberOfExecutablePaths(): int;
    abstract public function numberOfExecutedPaths(): int;
    abstract public function numberOfClasses(): int;
    abstract public function numberOfTestedClasses(): int;
    abstract public function numberOfTraits(): int;
    abstract public function numberOfTestedTraits(): int;
    abstract public function numberOfMethods(): int;
    abstract public function numberOfTestedMethods(): int;
    abstract public function numberOfFunctions(): int;
    abstract public function numberOfTestedFunctions(): int;
}
/**
 * @internal This class is not covered by the backward compatibility promise for phpunit/php-code-coverage
 */
final class Builder
{
    public function __construct(\SebastianBergmann\CodeCoverage\StaticAnalysis\FileAnalyser $analyser)
    {
    }
    public function build(\SebastianBergmann\CodeCoverage\CodeCoverage $coverage): \SebastianBergmann\CodeCoverage\Node\Directory
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for phpunit/php-code-coverage
 */
final class CrapIndex
{
    public function __construct(int $cyclomaticComplexity, float $codeCoverage)
    {
    }
    public function asString(): string
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for phpunit/php-code-coverage
 */
final class Directory extends \SebastianBergmann\CodeCoverage\Node\AbstractNode implements \IteratorAggregate
{
    public function count(): int
    {
    }
    public function getIterator(): \RecursiveIteratorIterator
    {
    }
    public function addDirectory(string $name): self
    {
    }
    public function addFile(\SebastianBergmann\CodeCoverage\Node\File $file): void
    {
    }
    public function directories(): array
    {
    }
    public function files(): array
    {
    }
    public function children(): array
    {
    }
    public function classes(): array
    {
    }
    public function traits(): array
    {
    }
    public function functions(): array
    {
    }
    /**
     * @phan-return array{linesOfCode: int, commentLinesOfCode: int, nonCommentLinesOfCode: int}
     */
    public function linesOfCode(): array
    {
    }
    public function numberOfExecutableLines(): int
    {
    }
    public function numberOfExecutedLines(): int
    {
    }
    public function numberOfExecutableBranches(): int
    {
    }
    public function numberOfExecutedBranches(): int
    {
    }
    public function numberOfExecutablePaths(): int
    {
    }
    public function numberOfExecutedPaths(): int
    {
    }
    public function numberOfClasses(): int
    {
    }
    public function numberOfTestedClasses(): int
    {
    }
    public function numberOfTraits(): int
    {
    }
    public function numberOfTestedTraits(): int
    {
    }
    public function numberOfMethods(): int
    {
    }
    public function numberOfTestedMethods(): int
    {
    }
    public function numberOfFunctions(): int
    {
    }
    public function numberOfTestedFunctions(): int
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for phpunit/php-code-coverage
 */
final class File extends \SebastianBergmann\CodeCoverage\Node\AbstractNode
{
    /**
     * @phan-param array{linesOfCode: int, commentLinesOfCode: int, nonCommentLinesOfCode: int} $linesOfCode
     */
    public function __construct(string $name, \SebastianBergmann\CodeCoverage\Node\AbstractNode $parent, array $lineCoverageData, array $functionCoverageData, array $testData, array $classes, array $traits, array $functions, array $linesOfCode)
    {
    }
    public function count(): int
    {
    }
    public function lineCoverageData(): array
    {
    }
    public function functionCoverageData(): array
    {
    }
    public function testData(): array
    {
    }
    public function classes(): array
    {
    }
    public function traits(): array
    {
    }
    public function functions(): array
    {
    }
    /**
     * @phan-return array{linesOfCode: int, commentLinesOfCode: int, nonCommentLinesOfCode: int}
     */
    public function linesOfCode(): array
    {
    }
    public function numberOfExecutableLines(): int
    {
    }
    public function numberOfExecutedLines(): int
    {
    }
    public function numberOfExecutableBranches(): int
    {
    }
    public function numberOfExecutedBranches(): int
    {
    }
    public function numberOfExecutablePaths(): int
    {
    }
    public function numberOfExecutedPaths(): int
    {
    }
    public function numberOfClasses(): int
    {
    }
    public function numberOfTestedClasses(): int
    {
    }
    public function numberOfTraits(): int
    {
    }
    public function numberOfTestedTraits(): int
    {
    }
    public function numberOfMethods(): int
    {
    }
    public function numberOfTestedMethods(): int
    {
    }
    public function numberOfFunctions(): int
    {
    }
    public function numberOfTestedFunctions(): int
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for phpunit/php-code-coverage
 */
final class Iterator implements \RecursiveIterator
{
    public function __construct(\SebastianBergmann\CodeCoverage\Node\Directory $node)
    {
    }
    /**
     * Rewinds the Iterator to the first element.
     */
    public function rewind(): void
    {
    }
    /**
     * Checks if there is a current element after calls to rewind() or next().
     */
    public function valid(): bool
    {
    }
    /**
     * Returns the key of the current element.
     */
    public function key(): int
    {
    }
    /**
     * Returns the current element.
     */
    public function current(): ?\SebastianBergmann\CodeCoverage\Node\AbstractNode
    {
    }
    /**
     * Moves forward to next element.
     */
    public function next(): void
    {
    }
    /**
     * Returns the sub iterator for the current element.
     */
    public function getChildren(): self
    {
    }
    /**
     * Checks whether the current element has children.
     */
    public function hasChildren(): bool
    {
    }
}
namespace SebastianBergmann\CodeCoverage\Report;

final class Clover
{
    /**
     * @throws \SebastianBergmann\CodeCoverage\Driver\WriteOperationFailedException
     */
    public function process(\SebastianBergmann\CodeCoverage\CodeCoverage $coverage, ?string $target = null, ?string $name = null): string
    {
    }
}
final class Cobertura
{
    /**
     * @throws \SebastianBergmann\CodeCoverage\Driver\WriteOperationFailedException
     */
    public function process(\SebastianBergmann\CodeCoverage\CodeCoverage $coverage, ?string $target = null): string
    {
    }
}
final class Crap4j
{
    public function __construct(int $threshold = 30)
    {
    }
    /**
     * @throws \SebastianBergmann\CodeCoverage\Driver\WriteOperationFailedException
     */
    public function process(\SebastianBergmann\CodeCoverage\CodeCoverage $coverage, ?string $target = null, ?string $name = null): string
    {
    }
}
final class PHP
{
    public function process(\SebastianBergmann\CodeCoverage\CodeCoverage $coverage, ?string $target = null): string
    {
    }
}
final class Text
{
    public function __construct(int $lowUpperBound = 50, int $highLowerBound = 90, bool $showUncoveredFiles = false, bool $showOnlySummary = false)
    {
    }
    public function process(\SebastianBergmann\CodeCoverage\CodeCoverage $coverage, bool $showColors = false): string
    {
    }
}
namespace SebastianBergmann\CodeCoverage\Report\Html;

final class Facade
{
    public function __construct(int $lowUpperBound = 50, int $highLowerBound = 90, string $generator = '')
    {
    }
    public function process(\SebastianBergmann\CodeCoverage\CodeCoverage $coverage, string $target): void
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for phpunit/php-code-coverage
 */
abstract class Renderer
{
    /**
     * @var string
     */
    protected $templatePath;
    /**
     * @var string
     */
    protected $generator;
    /**
     * @var string
     */
    protected $date;
    /**
     * @var int
     */
    protected $lowUpperBound;
    /**
     * @var int
     */
    protected $highLowerBound;
    /**
     * @var bool
     */
    protected $hasBranchCoverage;
    /**
     * @var string
     */
    protected $version;
    public function __construct(string $templatePath, string $generator, string $date, int $lowUpperBound, int $highLowerBound, bool $hasBranchCoverage)
    {
    }
    protected function renderItemTemplate(\SebastianBergmann\Template\Template $template, array $data): string
    {
    }
    protected function setCommonTemplateVariables(\SebastianBergmann\Template\Template $template, \SebastianBergmann\CodeCoverage\Node\AbstractNode $node): void
    {
    }
    protected function breadcrumbs(\SebastianBergmann\CodeCoverage\Node\AbstractNode $node): string
    {
    }
    protected function activeBreadcrumb(\SebastianBergmann\CodeCoverage\Node\AbstractNode $node): string
    {
    }
    protected function inactiveBreadcrumb(\SebastianBergmann\CodeCoverage\Node\AbstractNode $node, string $pathToRoot): string
    {
    }
    protected function pathToRoot(\SebastianBergmann\CodeCoverage\Node\AbstractNode $node): string
    {
    }
    protected function coverageBar(float $percent): string
    {
    }
    protected function colorLevel(float $percent): string
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for phpunit/php-code-coverage
 */
final class Dashboard extends \SebastianBergmann\CodeCoverage\Report\Html\Renderer
{
    public function render(\SebastianBergmann\CodeCoverage\Node\Directory $node, string $file): void
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for phpunit/php-code-coverage
 */
final class Directory extends \SebastianBergmann\CodeCoverage\Report\Html\Renderer
{
    public function render(\SebastianBergmann\CodeCoverage\Node\Directory $node, string $file): void
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for phpunit/php-code-coverage
 */
final class File extends \SebastianBergmann\CodeCoverage\Report\Html\Renderer
{
    public function render(\SebastianBergmann\CodeCoverage\Node\File $node, string $file): void
    {
    }
}
namespace SebastianBergmann\CodeCoverage\Report\Xml;

/**
 * @internal This class is not covered by the backward compatibility promise for phpunit/php-code-coverage
 */
final class BuildInformation
{
    public function __construct(\DOMElement $contextNode)
    {
    }
    public function setRuntimeInformation(\SebastianBergmann\Environment\Runtime $runtime): void
    {
    }
    public function setBuildTime(\DateTimeImmutable $date): void
    {
    }
    public function setGeneratorVersions(string $phpUnitVersion, string $coverageVersion): void
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for phpunit/php-code-coverage
 */
final class Coverage
{
    public function __construct(\DOMElement $context, string $line)
    {
    }
    /**
     * @throws \SebastianBergmann\CodeCoverage\ReportAlreadyFinalizedException
     */
    public function addTest(string $test): void
    {
    }
    public function finalize(): void
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for phpunit/php-code-coverage
 */
final class Directory extends \SebastianBergmann\CodeCoverage\Report\Xml\Node
{
}
final class Facade
{
    public function __construct(string $version)
    {
    }
    /**
     * @throws \SebastianBergmann\CodeCoverage\XmlException
     */
    public function process(\SebastianBergmann\CodeCoverage\CodeCoverage $coverage, string $target): void
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for phpunit/php-code-coverage
 */
class File
{
    public function __construct(\DOMElement $context)
    {
    }
    public function totals(): \SebastianBergmann\CodeCoverage\Report\Xml\Totals
    {
    }
    public function lineCoverage(string $line): \SebastianBergmann\CodeCoverage\Report\Xml\Coverage
    {
    }
    protected function contextNode(): \DOMElement
    {
    }
    protected function dom(): \DOMDocument
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for phpunit/php-code-coverage
 */
final class Method
{
    public function __construct(\DOMElement $context, string $name)
    {
    }
    public function setSignature(string $signature): void
    {
    }
    public function setLines(string $start, ?string $end = null): void
    {
    }
    public function setTotals(string $executable, string $executed, string $coverage): void
    {
    }
    public function setCrap(string $crap): void
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for phpunit/php-code-coverage
 */
abstract class Node
{
    public function __construct(\DOMElement $context)
    {
    }
    public function dom(): \DOMDocument
    {
    }
    public function totals(): \SebastianBergmann\CodeCoverage\Report\Xml\Totals
    {
    }
    public function addDirectory(string $name): \SebastianBergmann\CodeCoverage\Report\Xml\Directory
    {
    }
    public function addFile(string $name, string $href): \SebastianBergmann\CodeCoverage\Report\Xml\File
    {
    }
    protected function setContextNode(\DOMElement $context): void
    {
    }
    protected function contextNode(): \DOMElement
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for phpunit/php-code-coverage
 */
final class Project extends \SebastianBergmann\CodeCoverage\Report\Xml\Node
{
    public function __construct(string $directory)
    {
    }
    public function projectSourceDirectory(): string
    {
    }
    public function buildInformation(): \SebastianBergmann\CodeCoverage\Report\Xml\BuildInformation
    {
    }
    public function tests(): \SebastianBergmann\CodeCoverage\Report\Xml\Tests
    {
    }
    public function asDom(): \DOMDocument
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for phpunit/php-code-coverage
 */
final class Report extends \SebastianBergmann\CodeCoverage\Report\Xml\File
{
    public function __construct(string $name)
    {
    }
    public function asDom(): \DOMDocument
    {
    }
    public function functionObject($name): \SebastianBergmann\CodeCoverage\Report\Xml\Method
    {
    }
    public function classObject($name): \SebastianBergmann\CodeCoverage\Report\Xml\Unit
    {
    }
    public function traitObject($name): \SebastianBergmann\CodeCoverage\Report\Xml\Unit
    {
    }
    public function source(): \SebastianBergmann\CodeCoverage\Report\Xml\Source
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for phpunit/php-code-coverage
 */
final class Source
{
    public function __construct(\DOMElement $context)
    {
    }
    public function setSourceCode(string $source): void
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for phpunit/php-code-coverage
 */
final class Tests
{
    public function __construct(\DOMElement $context)
    {
    }
    public function addTest(string $test, array $result): void
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for phpunit/php-code-coverage
 */
final class Totals
{
    public function __construct(\DOMElement $container)
    {
    }
    public function container(): \DOMNode
    {
    }
    public function setNumLines(int $loc, int $cloc, int $ncloc, int $executable, int $executed): void
    {
    }
    public function setNumClasses(int $count, int $tested): void
    {
    }
    public function setNumTraits(int $count, int $tested): void
    {
    }
    public function setNumMethods(int $count, int $tested): void
    {
    }
    public function setNumFunctions(int $count, int $tested): void
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for phpunit/php-code-coverage
 */
final class Unit
{
    public function __construct(\DOMElement $context, string $name)
    {
    }
    public function setLines(int $start, int $executable, int $executed): void
    {
    }
    public function setCrap(float $crap): void
    {
    }
    public function setNamespace(string $namespace): void
    {
    }
    public function addMethod(string $name): \SebastianBergmann\CodeCoverage\Report\Xml\Method
    {
    }
}
namespace SebastianBergmann\CodeCoverage\StaticAnalysis;

final class CacheWarmer
{
    public function warmCache(string $cacheDirectory, bool $useAnnotationsForIgnoringCode, bool $ignoreDeprecatedCode, \SebastianBergmann\CodeCoverage\Filter $filter): void
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for phpunit/php-code-coverage
 */
final class CachingFileAnalyser implements \SebastianBergmann\CodeCoverage\StaticAnalysis\FileAnalyser
{
    public function __construct(string $directory, \SebastianBergmann\CodeCoverage\StaticAnalysis\FileAnalyser $analyser, bool $useAnnotationsForIgnoringCode, bool $ignoreDeprecatedCode)
    {
    }
    public function classesIn(string $filename): array
    {
    }
    public function traitsIn(string $filename): array
    {
    }
    public function functionsIn(string $filename): array
    {
    }
    /**
     * @phan-return array{linesOfCode: int, commentLinesOfCode: int, nonCommentLinesOfCode: int}
     */
    public function linesOfCodeFor(string $filename): array
    {
    }
    public function executableLinesIn(string $filename): array
    {
    }
    public function ignoredLinesFor(string $filename): array
    {
    }
    public function process(string $filename): void
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for phpunit/php-code-coverage
 */
final class CodeUnitFindingVisitor extends \PhpParser\NodeVisitorAbstract
{
    public function enterNode(\PhpParser\Node $node): void
    {
    }
    /**
     * @phan-return array<string,array{name: string, namespacedName: string, namespace: string, startLine: int, endLine: int, methods: array<string,array{methodName: string, signature: string, visibility: string, startLine: int, endLine: int, ccn: int}>}>
     */
    public function classes(): array
    {
    }
    /**
     * @phan-return array<string,array{name: string, namespacedName: string, namespace: string, startLine: int, endLine: int, methods: array<string,array{methodName: string, signature: string, visibility: string, startLine: int, endLine: int, ccn: int}>}>
     */
    public function traits(): array
    {
    }
    /**
     * @phan-return array<string,array{name: string, namespacedName: string, namespace: string, signature: string, startLine: int, endLine: int, ccn: int}>
     */
    public function functions(): array
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for phpunit/php-code-coverage
 */
final class ExecutableLinesFindingVisitor extends \PhpParser\NodeVisitorAbstract
{
    public function __construct(string $source)
    {
    }
    public function enterNode(\PhpParser\Node $node): void
    {
    }
    public function afterTraverse(array $nodes): void
    {
    }
    public function executableLinesGroupedByBranch(): array
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for phpunit/php-code-coverage
 */
interface FileAnalyser
{
    public function classesIn(string $filename): array;
    public function traitsIn(string $filename): array;
    public function functionsIn(string $filename): array;
    /**
     * @phan-return array{linesOfCode: int, commentLinesOfCode: int, nonCommentLinesOfCode: int}
     */
    public function linesOfCodeFor(string $filename): array;
    public function executableLinesIn(string $filename): array;
    public function ignoredLinesFor(string $filename): array;
}
/**
 * @internal This class is not covered by the backward compatibility promise for phpunit/php-code-coverage
 */
final class IgnoredLinesFindingVisitor extends \PhpParser\NodeVisitorAbstract
{
    public function __construct(bool $useAnnotationsForIgnoringCode, bool $ignoreDeprecated)
    {
    }
    public function enterNode(\PhpParser\Node $node): void
    {
    }
    /**
     * @phan-return list<int>
     */
    public function ignoredLines(): array
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for phpunit/php-code-coverage
 */
final class ParsingFileAnalyser implements \SebastianBergmann\CodeCoverage\StaticAnalysis\FileAnalyser
{
    public function __construct(bool $useAnnotationsForIgnoringCode, bool $ignoreDeprecatedCode)
    {
    }
    public function classesIn(string $filename): array
    {
    }
    public function traitsIn(string $filename): array
    {
    }
    public function functionsIn(string $filename): array
    {
    }
    /**
     * @phan-return array{linesOfCode: int, commentLinesOfCode: int, nonCommentLinesOfCode: int}
     */
    public function linesOfCodeFor(string $filename): array
    {
    }
    public function executableLinesIn(string $filename): array
    {
    }
    public function ignoredLinesFor(string $filename): array
    {
    }
}
namespace SebastianBergmann\CodeCoverage\Util;

final class DirectoryCouldNotBeCreatedException extends \RuntimeException implements \SebastianBergmann\CodeCoverage\Exception
{
}
/**
 * @internal This class is not covered by the backward compatibility promise for phpunit/php-code-coverage
 */
final class Filesystem
{
    /**
     * @throws DirectoryCouldNotBeCreatedException
     */
    public static function createDirectory(string $directory): void
    {
    }
}
/**
 * @internal This class is not covered by the backward compatibility promise for phpunit/php-code-coverage
 */
final class Percentage
{
    public static function fromFractionAndTotal(float $fraction, float $total): self
    {
    }
    public function asFloat(): float
    {
    }
    public function asString(): string
    {
    }
    public function asFixedWidthString(): string
    {
    }
}
namespace SebastianBergmann\CodeUnit;

/**
 * @phan-side-effect-free
 */
final class ClassMethodUnit extends \SebastianBergmann\CodeUnit\CodeUnit
{
    /**
     * @psalm-assert-if-true ClassMethodUnit $this
     */
    public function isClassMethod(): bool
    {
    }
}
/**
 * @phan-side-effect-free
 */
final class ClassUnit extends \SebastianBergmann\CodeUnit\CodeUnit
{
    /**
     * @psalm-assert-if-true ClassUnit $this
     */
    public function isClass(): bool
    {
    }
}
/**
 * @phan-side-effect-free
 */
abstract class CodeUnit
{
    /**
     * @phan-param class-string $className
     *
     * @throws InvalidCodeUnitException
     * @throws ReflectionException
     */
    public static function forClass(string $className): \SebastianBergmann\CodeUnit\ClassUnit
    {
    }
    /**
     * @phan-param class-string $className
     *
     * @throws InvalidCodeUnitException
     * @throws ReflectionException
     */
    public static function forClassMethod(string $className, string $methodName): \SebastianBergmann\CodeUnit\ClassMethodUnit
    {
    }
    /**
     * @phan-param class-string $interfaceName
     *
     * @throws InvalidCodeUnitException
     * @throws ReflectionException
     */
    public static function forInterface(string $interfaceName): \SebastianBergmann\CodeUnit\InterfaceUnit
    {
    }
    /**
     * @phan-param class-string $interfaceName
     *
     * @throws InvalidCodeUnitException
     * @throws ReflectionException
     */
    public static function forInterfaceMethod(string $interfaceName, string $methodName): \SebastianBergmann\CodeUnit\InterfaceMethodUnit
    {
    }
    /**
     * @phan-param class-string $traitName
     *
     * @throws InvalidCodeUnitException
     * @throws ReflectionException
     */
    public static function forTrait(string $traitName): \SebastianBergmann\CodeUnit\TraitUnit
    {
    }
    /**
     * @phan-param class-string $traitName
     *
     * @throws InvalidCodeUnitException
     * @throws ReflectionException
     */
    public static function forTraitMethod(string $traitName, string $methodName): \SebastianBergmann\CodeUnit\TraitMethodUnit
    {
    }
    /**
     * @phan-param callable-string $functionName
     *
     * @throws InvalidCodeUnitException
     * @throws ReflectionException
     */
    public static function forFunction(string $functionName): \SebastianBergmann\CodeUnit\FunctionUnit
    {
    }
    public function name(): string
    {
    }
    public function sourceFileName(): string
    {
    }
    /**
     * @phan-return list<int>
     */
    public function sourceLines(): array
    {
    }
    public function isClass(): bool
    {
    }
    public function isClassMethod(): bool
    {
    }
    public function isInterface(): bool
    {
    }
    public function isInterfaceMethod(): bool
    {
    }
    public function isTrait(): bool
    {
    }
    public function isTraitMethod(): bool
    {
    }
    public function isFunction(): bool
    {
    }
}
final class CodeUnitCollection implements \Countable, \IteratorAggregate
{
    /**
     * @phan-param list<CodeUnit> $items
     */
    public static function fromArray(array $items): self
    {
    }
    public static function fromList(\SebastianBergmann\CodeUnit\CodeUnit ...$items): self
    {
    }
    /**
     * @phan-return list<CodeUnit>
     */
    public function asArray(): array
    {
    }
    public function getIterator(): \SebastianBergmann\CodeUnit\CodeUnitCollectionIterator
    {
    }
    public function count(): int
    {
    }
    public function isEmpty(): bool
    {
    }
    public function mergeWith(self $other): self
    {
    }
}
final class CodeUnitCollectionIterator implements \Iterator
{
    public function __construct(\SebastianBergmann\CodeUnit\CodeUnitCollection $collection)
    {
    }
    public function rewind(): void
    {
    }
    public function valid(): bool
    {
    }
    public function key(): int
    {
    }
    public function current(): \SebastianBergmann\CodeUnit\CodeUnit
    {
    }
    public function next(): void
    {
    }
}
/**
 * @phan-side-effect-free
 */
final class FunctionUnit extends \SebastianBergmann\CodeUnit\CodeUnit
{
    /**
     * @psalm-assert-if-true FunctionUnit $this
     */
    public function isFunction(): bool
    {
    }
}
/**
 * @phan-side-effect-free
 */
final class InterfaceMethodUnit extends \SebastianBergmann\CodeUnit\CodeUnit
{
    /**
     * @psalm-assert-if-true InterfaceMethod $this
     */
    public function isInterfaceMethod(): bool
    {
    }
}
/**
 * @phan-side-effect-free
 */
final class InterfaceUnit extends \SebastianBergmann\CodeUnit\CodeUnit
{
    /**
     * @psalm-assert-if-true InterfaceUnit $this
     */
    public function isInterface(): bool
    {
    }
}
final class Mapper
{
    /**
     * @phan-return array<string,list<int>>
     */
    public function codeUnitsToSourceLines(\SebastianBergmann\CodeUnit\CodeUnitCollection $codeUnits): array
    {
    }
    /**
     * @throws InvalidCodeUnitException
     * @throws ReflectionException
     */
    public function stringToCodeUnits(string $unit): \SebastianBergmann\CodeUnit\CodeUnitCollection
    {
    }
}
/**
 * @phan-side-effect-free
 */
final class TraitMethodUnit extends \SebastianBergmann\CodeUnit\CodeUnit
{
    /**
     * @psalm-assert-if-true TraitMethodUnit $this
     */
    public function isTraitMethod(): bool
    {
    }
}
/**
 * @phan-side-effect-free
 */
final class TraitUnit extends \SebastianBergmann\CodeUnit\CodeUnit
{
    /**
     * @psalm-assert-if-true TraitUnit $this
     */
    public function isTrait(): bool
    {
    }
}
interface Exception extends \Throwable
{
}
final class InvalidCodeUnitException extends \RuntimeException implements \SebastianBergmann\CodeUnit\Exception
{
}
final class NoTraitException extends \RuntimeException implements \SebastianBergmann\CodeUnit\Exception
{
}
final class ReflectionException extends \RuntimeException implements \SebastianBergmann\CodeUnit\Exception
{
}
namespace SebastianBergmann\CodeUnitReverseLookup;

/**
 * @since Class available since Release 1.0.0
 */
class Wizard
{
    /**
     * @param string $filename
     * @param int    $lineNumber
     *
     * @return string
     */
    public function lookup($filename, $lineNumber)
    {
    }
}
namespace SebastianBergmann\Comparator;

/**
 * Compares arrays for equality.
 *
 * Arrays are equal if they contain the same key-value pairs.
 * The order of the keys does not matter.
 * The types of key-value pairs do not matter.
 */
class ArrayComparator extends \SebastianBergmann\Comparator\Comparator
{
    /**
     * Returns whether the comparator can compare two values.
     *
     * @param mixed $expected The first value to compare
     * @param mixed $actual   The second value to compare
     *
     * @return bool
     */
    public function accepts($expected, $actual)
    {
    }
    /**
     * Asserts that two arrays are equal.
     *
     * @param mixed $expected     First value to compare
     * @param mixed $actual       Second value to compare
     * @param float $delta        Allowed numerical distance between two values to consider them equal
     * @param bool  $canonicalize Arrays are sorted before comparison when set to true
     * @param bool  $ignoreCase   Case is ignored when set to true
     * @param array $processed    List of already processed elements (used to prevent infinite recursion)
     *
     * @throws ComparisonFailure
     */
    public function assertEquals($expected, $actual, $delta = 0.0, $canonicalize = false, $ignoreCase = false, array &$processed = [])
    {
    }
    protected function indent($lines)
    {
    }
}
/**
 * Abstract base class for comparators which compare values for equality.
 */
abstract class Comparator
{
    /**
     * @var Factory
     */
    protected $factory;
    /**
     * @var \SebastianBergmann\Exporter\Exporter
     */
    protected $exporter;
    public function __construct()
    {
    }
    public function setFactory(\SebastianBergmann\Comparator\Factory $factory)
    {
    }
    /**
     * Returns whether the comparator can compare two values.
     *
     * @param mixed $expected The first value to compare
     * @param mixed $actual   The second value to compare
     *
     * @return bool
     */
    abstract public function accepts($expected, $actual);
    /**
     * Asserts that two values are equal.
     *
     * @param mixed $expected     First value to compare
     * @param mixed $actual       Second value to compare
     * @param float $delta        Allowed numerical distance between two values to consider them equal
     * @param bool  $canonicalize Arrays are sorted before comparison when set to true
     * @param bool  $ignoreCase   Case is ignored when set to true
     *
     * @throws ComparisonFailure
     */
    abstract public function assertEquals($expected, $actual, $delta = 0.0, $canonicalize = false, $ignoreCase = false);
}
/**
 * Thrown when an assertion for string equality failed.
 */
class ComparisonFailure extends \RuntimeException
{
    /**
     * Expected value of the retrieval which does not match $actual.
     *
     * @var mixed
     */
    protected $expected;
    /**
     * Actually retrieved value which does not match $expected.
     *
     * @var mixed
     */
    protected $actual;
    /**
     * The string representation of the expected value.
     *
     * @var string
     */
    protected $expectedAsString;
    /**
     * The string representation of the actual value.
     *
     * @var string
     */
    protected $actualAsString;
    /**
     * @var bool
     */
    protected $identical;
    /**
     * Optional message which is placed in front of the first line
     * returned by toString().
     *
     * @var string
     */
    protected $message;
    /**
     * Initialises with the expected value and the actual value.
     *
     * @param mixed  $expected         expected value retrieved
     * @param mixed  $actual           actual value retrieved
     * @param string $expectedAsString
     * @param string $actualAsString
     * @param bool   $identical
     * @param string $message          a string which is prefixed on all returned lines
     *                                 in the difference output
     */
    public function __construct($expected, $actual, $expectedAsString, $actualAsString, $identical = false, $message = '')
    {
    }
    public function getActual()
    {
    }
    public function getExpected()
    {
    }
    /**
     * @return string
     */
    public function getActualAsString()
    {
    }
    /**
     * @return string
     */
    public function getExpectedAsString()
    {
    }
    /**
     * @return string
     */
    public function getDiff()
    {
    }
    /**
     * @return string
     */
    public function toString()
    {
    }
}
/**
 * Compares DOMNode instances for equality.
 */
class DOMNodeComparator extends \SebastianBergmann\Comparator\ObjectComparator
{
    /**
     * Returns whether the comparator can compare two values.
     *
     * @param mixed $expected The first value to compare
     * @param mixed $actual   The second value to compare
     *
     * @return bool
     */
    public function accepts($expected, $actual)
    {
    }
    /**
     * Asserts that two values are equal.
     *
     * @param mixed $expected     First value to compare
     * @param mixed $actual       Second value to compare
     * @param float $delta        Allowed numerical distance between two values to consider them equal
     * @param bool  $canonicalize Arrays are sorted before comparison when set to true
     * @param bool  $ignoreCase   Case is ignored when set to true
     * @param array $processed    List of already processed elements (used to prevent infinite recursion)
     *
     * @throws ComparisonFailure
     */
    public function assertEquals($expected, $actual, $delta = 0.0, $canonicalize = false, $ignoreCase = false, array &$processed = [])
    {
    }
}
/**
 * Compares DateTimeInterface instances for equality.
 */
class DateTimeComparator extends \SebastianBergmann\Comparator\ObjectComparator
{
    /**
     * Returns whether the comparator can compare two values.
     *
     * @param mixed $expected The first value to compare
     * @param mixed $actual   The second value to compare
     *
     * @return bool
     */
    public function accepts($expected, $actual)
    {
    }
    /**
     * Asserts that two values are equal.
     *
     * @param mixed $expected     First value to compare
     * @param mixed $actual       Second value to compare
     * @param float $delta        Allowed numerical distance between two values to consider them equal
     * @param bool  $canonicalize Arrays are sorted before comparison when set to true
     * @param bool  $ignoreCase   Case is ignored when set to true
     * @param array $processed    List of already processed elements (used to prevent infinite recursion)
     *
     * @throws \Exception
     * @throws ComparisonFailure
     */
    public function assertEquals($expected, $actual, $delta = 0.0, $canonicalize = false, $ignoreCase = false, array &$processed = [])
    {
    }
}
/**
 * Compares doubles for equality.
 *
 * @deprecated since v3.0.5 and v4.0.8
 */
class DoubleComparator extends \SebastianBergmann\Comparator\NumericComparator
{
    /**
     * Smallest value available in PHP.
     *
     * @var float
     */
    public const EPSILON = 1.0E-10;
    /**
     * Returns whether the comparator can compare two values.
     *
     * @param mixed $expected The first value to compare
     * @param mixed $actual   The second value to compare
     *
     * @return bool
     */
    public function accepts($expected, $actual)
    {
    }
    /**
     * Asserts that two values are equal.
     *
     * @param mixed $expected     First value to compare
     * @param mixed $actual       Second value to compare
     * @param float $delta        Allowed numerical distance between two values to consider them equal
     * @param bool  $canonicalize Arrays are sorted before comparison when set to true
     * @param bool  $ignoreCase   Case is ignored when set to true
     *
     * @throws ComparisonFailure
     */
    public function assertEquals($expected, $actual, $delta = 0.0, $canonicalize = false, $ignoreCase = false)
    {
    }
}
/**
 * Compares Exception instances for equality.
 */
class ExceptionComparator extends \SebastianBergmann\Comparator\ObjectComparator
{
    /**
     * Returns whether the comparator can compare two values.
     *
     * @param mixed $expected The first value to compare
     * @param mixed $actual   The second value to compare
     *
     * @return bool
     */
    public function accepts($expected, $actual)
    {
    }
    /**
     * Converts an object to an array containing all of its private, protected
     * and public properties.
     *
     * @param object $object
     *
     * @return array
     */
    protected function toArray($object)
    {
    }
}
/**
 * Factory for comparators which compare values for equality.
 */
class Factory
{
    /**
     * @return Factory
     */
    public static function getInstance()
    {
    }
    /**
     * Constructs a new factory.
     */
    public function __construct()
    {
    }
    /**
     * Returns the correct comparator for comparing two values.
     *
     * @param mixed $expected The first value to compare
     * @param mixed $actual   The second value to compare
     *
     * @return Comparator
     */
    public function getComparatorFor($expected, $actual)
    {
    }
    /**
     * Registers a new comparator.
     *
     * This comparator will be returned by getComparatorFor() if its accept() method
     * returns TRUE for the compared values. It has higher priority than the
     * existing comparators, meaning that its accept() method will be invoked
     * before those of the other comparators.
     *
     * @param Comparator $comparator The comparator to be registered
     */
    public function register(\SebastianBergmann\Comparator\Comparator $comparator)
    {
    }
    /**
     * Unregisters a comparator.
     *
     * This comparator will no longer be considered by getComparatorFor().
     *
     * @param Comparator $comparator The comparator to be unregistered
     */
    public function unregister(\SebastianBergmann\Comparator\Comparator $comparator)
    {
    }
    /**
     * Unregisters all non-default comparators.
     */
    public function reset()
    {
    }
}
/**
 * Compares PHPUnit\Framework\MockObject\MockObject instances for equality.
 */
class MockObjectComparator extends \SebastianBergmann\Comparator\ObjectComparator
{
    /**
     * Returns whether the comparator can compare two values.
     *
     * @param mixed $expected The first value to compare
     * @param mixed $actual   The second value to compare
     *
     * @return bool
     */
    public function accepts($expected, $actual)
    {
    }
    /**
     * Converts an object to an array containing all of its private, protected
     * and public properties.
     *
     * @param object $object
     *
     * @return array
     */
    protected function toArray($object)
    {
    }
}
/**
 * Compares numerical values for equality.
 */
class NumericComparator extends \SebastianBergmann\Comparator\ScalarComparator
{
    /**
     * Returns whether the comparator can compare two values.
     *
     * @param mixed $expected The first value to compare
     * @param mixed $actual   The second value to compare
     *
     * @return bool
     */
    public function accepts($expected, $actual)
    {
    }
    /**
     * Asserts that two values are equal.
     *
     * @param mixed $expected     First value to compare
     * @param mixed $actual       Second value to compare
     * @param float $delta        Allowed numerical distance between two values to consider them equal
     * @param bool  $canonicalize Arrays are sorted before comparison when set to true
     * @param bool  $ignoreCase   Case is ignored when set to true
     *
     * @throws ComparisonFailure
     */
    public function assertEquals($expected, $actual, $delta = 0.0, $canonicalize = false, $ignoreCase = false)
    {
    }
}
/**
 * Compares objects for equality.
 */
class ObjectComparator extends \SebastianBergmann\Comparator\ArrayComparator
{
    /**
     * Returns whether the comparator can compare two values.
     *
     * @param mixed $expected The first value to compare
     * @param mixed $actual   The second value to compare
     *
     * @return bool
     */
    public function accepts($expected, $actual)
    {
    }
    /**
     * Asserts that two values are equal.
     *
     * @param mixed $expected     First value to compare
     * @param mixed $actual       Second value to compare
     * @param float $delta        Allowed numerical distance between two values to consider them equal
     * @param bool  $canonicalize Arrays are sorted before comparison when set to true
     * @param bool  $ignoreCase   Case is ignored when set to true
     * @param array $processed    List of already processed elements (used to prevent infinite recursion)
     *
     * @throws ComparisonFailure
     */
    public function assertEquals($expected, $actual, $delta = 0.0, $canonicalize = false, $ignoreCase = false, array &$processed = [])
    {
    }
    /**
     * Converts an object to an array containing all of its private, protected
     * and public properties.
     *
     * @param object $object
     *
     * @return array
     */
    protected function toArray($object)
    {
    }
}
/**
 * Compares resources for equality.
 */
class ResourceComparator extends \SebastianBergmann\Comparator\Comparator
{
    /**
     * Returns whether the comparator can compare two values.
     *
     * @param mixed $expected The first value to compare
     * @param mixed $actual   The second value to compare
     *
     * @return bool
     */
    public function accepts($expected, $actual)
    {
    }
    /**
     * Asserts that two values are equal.
     *
     * @param mixed $expected     First value to compare
     * @param mixed $actual       Second value to compare
     * @param float $delta        Allowed numerical distance between two values to consider them equal
     * @param bool  $canonicalize Arrays are sorted before comparison when set to true
     * @param bool  $ignoreCase   Case is ignored when set to true
     *
     * @throws ComparisonFailure
     */
    public function assertEquals($expected, $actual, $delta = 0.0, $canonicalize = false, $ignoreCase = false)
    {
    }
}
/**
 * Compares scalar or NULL values for equality.
 */
class ScalarComparator extends \SebastianBergmann\Comparator\Comparator
{
    /**
     * Returns whether the comparator can compare two values.
     *
     * @param mixed $expected The first value to compare
     * @param mixed $actual   The second value to compare
     *
     * @return bool
     *
     * @since  Method available since Release 3.6.0
     */
    public function accepts($expected, $actual)
    {
    }
    /**
     * Asserts that two values are equal.
     *
     * @param mixed $expected     First value to compare
     * @param mixed $actual       Second value to compare
     * @param float $delta        Allowed numerical distance between two values to consider them equal
     * @param bool  $canonicalize Arrays are sorted before comparison when set to true
     * @param bool  $ignoreCase   Case is ignored when set to true
     *
     * @throws ComparisonFailure
     */
    public function assertEquals($expected, $actual, $delta = 0.0, $canonicalize = false, $ignoreCase = false)
    {
    }
}
/**
 * Compares \SplObjectStorage instances for equality.
 */
class SplObjectStorageComparator extends \SebastianBergmann\Comparator\Comparator
{
    /**
     * Returns whether the comparator can compare two values.
     *
     * @param mixed $expected The first value to compare
     * @param mixed $actual   The second value to compare
     *
     * @return bool
     */
    public function accepts($expected, $actual)
    {
    }
    /**
     * Asserts that two values are equal.
     *
     * @param mixed $expected     First value to compare
     * @param mixed $actual       Second value to compare
     * @param float $delta        Allowed numerical distance between two values to consider them equal
     * @param bool  $canonicalize Arrays are sorted before comparison when set to true
     * @param bool  $ignoreCase   Case is ignored when set to true
     *
     * @throws ComparisonFailure
     */
    public function assertEquals($expected, $actual, $delta = 0.0, $canonicalize = false, $ignoreCase = false)
    {
    }
}
/**
 * Compares values for type equality.
 */
class TypeComparator extends \SebastianBergmann\Comparator\Comparator
{
    /**
     * Returns whether the comparator can compare two values.
     *
     * @param mixed $expected The first value to compare
     * @param mixed $actual   The second value to compare
     *
     * @return bool
     */
    public function accepts($expected, $actual)
    {
    }
    /**
     * Asserts that two values are equal.
     *
     * @param mixed $expected     First value to compare
     * @param mixed $actual       Second value to compare
     * @param float $delta        Allowed numerical distance between two values to consider them equal
     * @param bool  $canonicalize Arrays are sorted before comparison when set to true
     * @param bool  $ignoreCase   Case is ignored when set to true
     *
     * @throws ComparisonFailure
     */
    public function assertEquals($expected, $actual, $delta = 0.0, $canonicalize = false, $ignoreCase = false)
    {
    }
}
interface Exception extends \Throwable
{
}
final class RuntimeException extends \RuntimeException implements \SebastianBergmann\Comparator\Exception
{
}
namespace SebastianBergmann\Complexity;

final class Calculator
{
    /**
     * @throws RuntimeException
     */
    public function calculateForSourceFile(string $sourceFile): \SebastianBergmann\Complexity\ComplexityCollection
    {
    }
    /**
     * @throws RuntimeException
     */
    public function calculateForSourceString(string $source): \SebastianBergmann\Complexity\ComplexityCollection
    {
    }
    /**
     * @param \PhpParser\Node[] $nodes
     *
     * @throws RuntimeException
     */
    public function calculateForAbstractSyntaxTree(array $nodes): \SebastianBergmann\Complexity\ComplexityCollection
    {
    }
}
/**
 * @phan-side-effect-free
 */
final class Complexity
{
    public function __construct(string $name, int $cyclomaticComplexity)
    {
    }
    public function name(): string
    {
    }
    public function cyclomaticComplexity(): int
    {
    }
}
/**
 * @phan-side-effect-free
 */
final class ComplexityCollection implements \Countable, \IteratorAggregate
{
    public static function fromList(\SebastianBergmann\Complexity\Complexity ...$items): self
    {
    }
    /**
     * @phan-return list<Complexity>
     */
    public function asArray(): array
    {
    }
    public function getIterator(): \SebastianBergmann\Complexity\ComplexityCollectionIterator
    {
    }
    public function count(): int
    {
    }
    public function isEmpty(): bool
    {
    }
    public function cyclomaticComplexity(): int
    {
    }
}
final class ComplexityCollectionIterator implements \Iterator
{
    public function __construct(\SebastianBergmann\Complexity\ComplexityCollection $items)
    {
    }
    public function rewind(): void
    {
    }
    public function valid(): bool
    {
    }
    public function key(): int
    {
    }
    public function current(): \SebastianBergmann\Complexity\Complexity
    {
    }
    public function next(): void
    {
    }
}
interface Exception extends \Throwable
{
}
final class RuntimeException extends \RuntimeException implements \SebastianBergmann\Complexity\Exception
{
}
final class ComplexityCalculatingVisitor extends \PhpParser\NodeVisitorAbstract
{
    public function __construct(bool $shortCircuitTraversal)
    {
    }
    public function enterNode(\PhpParser\Node $node): ?int
    {
    }
    public function result(): \SebastianBergmann\Complexity\ComplexityCollection
    {
    }
}
final class CyclomaticComplexityCalculatingVisitor extends \PhpParser\NodeVisitorAbstract
{
    public function enterNode(\PhpParser\Node $node): void
    {
    }
    public function cyclomaticComplexity(): int
    {
    }
}
namespace SebastianBergmann\Diff;

final class Chunk
{
    public function __construct(int $start = 0, int $startRange = 1, int $end = 0, int $endRange = 1, array $lines = [])
    {
    }
    public function getStart(): int
    {
    }
    public function getStartRange(): int
    {
    }
    public function getEnd(): int
    {
    }
    public function getEndRange(): int
    {
    }
    /**
     * @return Line[]
     */
    public function getLines(): array
    {
    }
    /**
     * @param Line[] $lines
     */
    public function setLines(array $lines): void
    {
    }
}
final class Diff
{
    /**
     * @param Chunk[] $chunks
     */
    public function __construct(string $from, string $to, array $chunks = [])
    {
    }
    public function getFrom(): string
    {
    }
    public function getTo(): string
    {
    }
    /**
     * @return Chunk[]
     */
    public function getChunks(): array
    {
    }
    /**
     * @param Chunk[] $chunks
     */
    public function setChunks(array $chunks): void
    {
    }
}
final class Differ
{
    public const OLD = 0;
    public const ADDED = 1;
    public const REMOVED = 2;
    public const DIFF_LINE_END_WARNING = 3;
    public const NO_LINE_END_EOF_WARNING = 4;
    /**
     * @param Output\DiffOutputBuilderInterface $outputBuilder
     *
     * @throws InvalidArgumentException
     */
    public function __construct($outputBuilder = null)
    {
    }
    /**
     * Returns the diff between two arrays or strings as string.
     *
     * @param array|string $from
     * @param array|string $to
     */
    public function diff($from, $to, ?\SebastianBergmann\Diff\LongestCommonSubsequenceCalculator $lcs = null): string
    {
    }
    /**
     * Returns the diff between two arrays or strings as array.
     *
     * Each array element contains two elements:
     *   - [0] => mixed $token
     *   - [1] => 2|1|0
     *
     * - 2: REMOVED: $token was removed from $from
     * - 1: ADDED: $token was added to $from
     * - 0: OLD: $token is not changed in $to
     *
     * @param array|string                       $from
     * @param array|string                       $to
     * @param LongestCommonSubsequenceCalculator $lcs
     */
    public function diffToArray($from, $to, ?\SebastianBergmann\Diff\LongestCommonSubsequenceCalculator $lcs = null): array
    {
    }
}
final class ConfigurationException extends \SebastianBergmann\Diff\InvalidArgumentException
{
    public function __construct(string $option, string $expected, $value, int $code = 0, ?\Exception $previous = null)
    {
    }
}
interface Exception extends \Throwable
{
}
class InvalidArgumentException extends \InvalidArgumentException implements \SebastianBergmann\Diff\Exception
{
}
final class Line
{
    public const ADDED = 1;
    public const REMOVED = 2;
    public const UNCHANGED = 3;
    public function __construct(int $type = self::UNCHANGED, string $content = '')
    {
    }
    public function getContent(): string
    {
    }
    public function getType(): int
    {
    }
}
interface LongestCommonSubsequenceCalculator
{
    /**
     * Calculates the longest common subsequence of two arrays.
     */
    public function calculate(array $from, array $to): array;
}
final class MemoryEfficientLongestCommonSubsequenceCalculator implements \SebastianBergmann\Diff\LongestCommonSubsequenceCalculator
{
    /**
     * {@inheritdoc}
     */
    public function calculate(array $from, array $to): array
    {
    }
}
/**
 * Unified diff parser.
 */
final class Parser
{
    /**
     * @return Diff[]
     */
    public function parse(string $string): array
    {
    }
}
final class TimeEfficientLongestCommonSubsequenceCalculator implements \SebastianBergmann\Diff\LongestCommonSubsequenceCalculator
{
    /**
     * {@inheritdoc}
     */
    public function calculate(array $from, array $to): array
    {
    }
}
namespace SebastianBergmann\Diff\Output;

abstract class AbstractChunkOutputBuilder implements \SebastianBergmann\Diff\Output\DiffOutputBuilderInterface
{
    /**
     * Takes input of the diff array and returns the common parts.
     * Iterates through diff line by line.
     */
    protected function getCommonChunks(array $diff, int $lineThreshold = 5): array
    {
    }
}
/**
 * Builds a diff string representation in a loose unified diff format
 * listing only changes lines. Does not include line numbers.
 */
final class DiffOnlyOutputBuilder implements \SebastianBergmann\Diff\Output\DiffOutputBuilderInterface
{
    public function __construct(string $header = "--- Original\n+++ New\n")
    {
    }
    public function getDiff(array $diff): string
    {
    }
}
/**
 * Defines how an output builder should take a generated
 * diff array and return a string representation of that diff.
 */
interface DiffOutputBuilderInterface
{
    public function getDiff(array $diff): string;
}
/**
 * Strict Unified diff output builder.
 *
 * Generates (strict) Unified diff's (unidiffs) with hunks.
 */
final class StrictUnifiedDiffOutputBuilder implements \SebastianBergmann\Diff\Output\DiffOutputBuilderInterface
{
    public function __construct(array $options = [])
    {
    }
    public function getDiff(array $diff): string
    {
    }
}
/**
 * Builds a diff string representation in unified diff format in chunks.
 */
final class UnifiedDiffOutputBuilder extends \SebastianBergmann\Diff\Output\AbstractChunkOutputBuilder
{
    public function __construct(string $header = "--- Original\n+++ New\n", bool $addLineNumbers = false)
    {
    }
    public function getDiff(array $diff): string
    {
    }
}
namespace SebastianBergmann\Environment;

final class Console
{
    /**
     * @var int
     */
    public const STDIN = 0;
    /**
     * @var int
     */
    public const STDOUT = 1;
    /**
     * @var int
     */
    public const STDERR = 2;
    /**
     * Returns true if STDOUT supports colorization.
     *
     * This code has been copied and adapted from
     * Symfony\Component\Console\Output\StreamOutput.
     */
    public function hasColorSupport(): bool
    {
    }
    /**
     * Returns the number of columns of the terminal.
     *
     * @codeCoverageIgnore
     */
    public function getNumberOfColumns(): int
    {
    }
    /**
     * Returns if the file descriptor is an interactive terminal or not.
     *
     * Normally, we want to use a resource as a parameter, yet sadly it's not always awailable,
     * eg when running code in interactive console (`php -a`), STDIN/STDOUT/STDERR constants are not defined.
     *
     * @param int|resource $fileDescriptor
     */
    public function isInteractive($fileDescriptor = self::STDOUT): bool
    {
    }
}
final class OperatingSystem
{
    /**
     * Returns PHP_OS_FAMILY (if defined (which it is on PHP >= 7.2)).
     * Returns a string (compatible with PHP_OS_FAMILY) derived from PHP_OS otherwise.
     */
    public function getFamily(): string
    {
    }
}
/**
 * Utility class for HHVM/PHP environment handling.
 */
final class Runtime
{
    /**
     * Returns true when Xdebug or PCOV is available or
     * the runtime used is PHPDBG.
     */
    public function canCollectCodeCoverage(): bool
    {
    }
    /**
     * Returns true when Zend OPcache is loaded, enabled,
     * and is configured to discard comments.
     */
    public function discardsComments(): bool
    {
    }
    /**
     * Returns true when Zend OPcache is loaded, enabled,
     * and is configured to perform just-in-time compilation.
     */
    public function performsJustInTimeCompilation(): bool
    {
    }
    /**
     * Returns the path to the binary of the current runtime.
     * Appends ' --php' to the path when the runtime is HHVM.
     */
    public function getBinary(): string
    {
    }
    public function getNameWithVersion(): string
    {
    }
    public function getNameWithVersionAndCodeCoverageDriver(): string
    {
    }
    public function getName(): string
    {
    }
    public function getVendorUrl(): string
    {
    }
    public function getVersion(): string
    {
    }
    /**
     * Returns true when the runtime used is PHP and Xdebug is loaded.
     */
    public function hasXdebug(): bool
    {
    }
    /**
     * Returns true when the runtime used is HHVM.
     */
    public function isHHVM(): bool
    {
    }
    /**
     * Returns true when the runtime used is PHP without the PHPDBG SAPI.
     */
    public function isPHP(): bool
    {
    }
    /**
     * Returns true when the runtime used is PHP with the PHPDBG SAPI.
     */
    public function isPHPDBG(): bool
    {
    }
    /**
     * Returns true when the runtime used is PHP with the PHPDBG SAPI
     * and the phpdbg_*_oplog() functions are available (PHP >= 7.0).
     */
    public function hasPHPDBGCodeCoverage(): bool
    {
    }
    /**
     * Returns true when the runtime used is PHP with PCOV loaded and enabled.
     */
    public function hasPCOV(): bool
    {
    }
    /**
     * Parses the loaded php.ini file (if any) as well as all
     * additional php.ini files from the additional ini dir for
     * a list of all configuration settings loaded from files
     * at startup. Then checks for each php.ini setting passed
     * via the `$values` parameter whether this setting has
     * been changed at runtime. Returns an array of strings
     * where each string has the format `key=value` denoting
     * the name of a changed php.ini setting with its new value.
     *
     * @return string[]
     */
    public function getCurrentSettings(array $values): array
    {
    }
}
namespace SebastianBergmann\Exporter;

/**
 * A nifty utility for visualizing PHP variables.
 *
 * <code>
 * <?php
 * use SebastianBergmann\Exporter\Exporter;
 *
 * $exporter = new Exporter;
 * print $exporter->export(new Exception);
 * </code>
 */
class Exporter
{
    /**
     * Exports a value as a string.
     *
     * The output of this method is similar to the output of print_r(), but
     * improved in various aspects:
     *
     *  - NULL is rendered as "null" (instead of "")
     *  - TRUE is rendered as "true" (instead of "1")
     *  - FALSE is rendered as "false" (instead of "")
     *  - Strings are always quoted with single quotes
     *  - Carriage returns and newlines are normalized to \n
     *  - Recursion and repeated rendering is treated properly
     *
     * @param int $indentation The indentation level of the 2nd+ line
     *
     * @return string
     */
    public function export($value, $indentation = 0)
    {
    }
    /**
     * @param array<mixed> $data
     * @param \SebastianBergmann\RecursionContext\Context      $context
     *
     * @return string
     */
    public function shortenedRecursiveExport(&$data, ?\SebastianBergmann\RecursionContext\Context $context = null)
    {
    }
    /**
     * Exports a value into a single-line string.
     *
     * The output of this method is similar to the output of
     * SebastianBergmann\Exporter\Exporter::export().
     *
     * Newlines are replaced by the visible string '\n'.
     * Contents of arrays and objects (if any) are replaced by '...'.
     *
     * @return string
     *
     * @see    SebastianBergmann\Exporter\Exporter::export
     */
    public function shortenedExport($value)
    {
    }
    /**
     * Converts an object to an array containing all of its private, protected
     * and public properties.
     *
     * @return array
     */
    public function toArray($value)
    {
    }
    /**
     * Recursive implementation of export.
     *
     * @param mixed                                       $value       The value to export
     * @param int                                         $indentation The indentation level of the 2nd+ line
     * @param \SebastianBergmann\RecursionContext\Context $processed   Previously processed objects
     *
     * @return string
     *
     * @see    SebastianBergmann\Exporter\Exporter::export
     */
    protected function recursiveExport(&$value, $indentation, $processed = null)
    {
    }
}
namespace SebastianBergmann\FileIterator;

class Facade
{
    /**
     * @param array|string $paths
     * @param array|string $suffixes
     * @param array|string $prefixes
     */
    public function getFilesAsArray($paths, $suffixes = '', $prefixes = '', array $exclude = [], bool $commonPath = false): array
    {
    }
    protected function getCommonPath(array $files): string
    {
    }
}
class Factory
{
    /**
     * @param array|string $paths
     * @param array|string $suffixes
     * @param array|string $prefixes
     */
    public function getFileIterator($paths, $suffixes = '', $prefixes = '', array $exclude = []): \AppendIterator
    {
    }
    protected function getPathsAfterResolvingWildcards(array $paths): array
    {
    }
}
class Iterator extends \FilterIterator
{
    public const PREFIX = 0;
    public const SUFFIX = 1;
    public function __construct(string $basePath, \Iterator $iterator, array $suffixes = [], array $prefixes = [], array $exclude = [])
    {
    }
    public function accept(): bool
    {
    }
}
namespace SebastianBergmann\GlobalState;

/**
 * Exports parts of a Snapshot as PHP code.
 */
final class CodeExporter
{
    public function constants(\SebastianBergmann\GlobalState\Snapshot $snapshot): string
    {
    }
    public function globalVariables(\SebastianBergmann\GlobalState\Snapshot $snapshot): string
    {
    }
    public function iniSettings(\SebastianBergmann\GlobalState\Snapshot $snapshot): string
    {
    }
}
final class ExcludeList
{
    public function addGlobalVariable(string $variableName): void
    {
    }
    public function addClass(string $className): void
    {
    }
    public function addSubclassesOf(string $className): void
    {
    }
    public function addImplementorsOf(string $interfaceName): void
    {
    }
    public function addClassNamePrefix(string $classNamePrefix): void
    {
    }
    public function addStaticAttribute(string $className, string $attributeName): void
    {
    }
    public function isGlobalVariableExcluded(string $variableName): bool
    {
    }
    public function isStaticAttributeExcluded(string $className, string $attributeName): bool
    {
    }
}
/**
 * Restorer of snapshots of global state.
 */
class Restorer
{
    /**
     * Deletes function definitions that are not defined in a snapshot.
     *
     * @throws RuntimeException when the uopz_delete() function is not available
     *
     * @see https://github.com/krakjoe/uopz
     */
    public function restoreFunctions(\SebastianBergmann\GlobalState\Snapshot $snapshot): void
    {
    }
    /**
     * Restores all global and super-global variables from a snapshot.
     */
    public function restoreGlobalVariables(\SebastianBergmann\GlobalState\Snapshot $snapshot): void
    {
    }
    /**
     * Restores all static attributes in user-defined classes from this snapshot.
     */
    public function restoreStaticAttributes(\SebastianBergmann\GlobalState\Snapshot $snapshot): void
    {
    }
}
/**
 * A snapshot of global state.
 */
class Snapshot
{
    /**
     * Creates a snapshot of the current global state.
     */
    public function __construct(?\SebastianBergmann\GlobalState\ExcludeList $excludeList = null, bool $includeGlobalVariables = true, bool $includeStaticAttributes = true, bool $includeConstants = true, bool $includeFunctions = true, bool $includeClasses = true, bool $includeInterfaces = true, bool $includeTraits = true, bool $includeIniSettings = true, bool $includeIncludedFiles = true)
    {
    }
    public function excludeList(): \SebastianBergmann\GlobalState\ExcludeList
    {
    }
    public function globalVariables(): array
    {
    }
    public function superGlobalVariables(): array
    {
    }
    public function superGlobalArrays(): array
    {
    }
    public function staticAttributes(): array
    {
    }
    public function iniSettings(): array
    {
    }
    public function includedFiles(): array
    {
    }
    public function constants(): array
    {
    }
    public function functions(): array
    {
    }
    public function interfaces(): array
    {
    }
    public function classes(): array
    {
    }
    public function traits(): array
    {
    }
}
interface Exception extends \Throwable
{
}
final class RuntimeException extends \RuntimeException implements \SebastianBergmann\GlobalState\Exception
{
}
namespace SebastianBergmann\Invoker;

final class Invoker
{
    /**
     * @throws \Throwable
     */
    public function invoke(callable $callable, array $arguments, int $timeout)
    {
    }
    public function canInvokeWithTimeout(): bool
    {
    }
}
interface Exception extends \Throwable
{
}
final class ProcessControlExtensionNotLoadedException extends \RuntimeException implements \SebastianBergmann\Invoker\Exception
{
}
final class TimeoutException extends \RuntimeException implements \SebastianBergmann\Invoker\Exception
{
}
namespace SebastianBergmann\LinesOfCode;

final class Counter
{
    /**
     * @throws RuntimeException
     */
    public function countInSourceFile(string $sourceFile): \SebastianBergmann\LinesOfCode\LinesOfCode
    {
    }
    /**
     * @throws RuntimeException
     */
    public function countInSourceString(string $source): \SebastianBergmann\LinesOfCode\LinesOfCode
    {
    }
    /**
     * @param \PhpParser\Node[] $nodes
     *
     * @throws RuntimeException
     */
    public function countInAbstractSyntaxTree(int $linesOfCode, array $nodes): \SebastianBergmann\LinesOfCode\LinesOfCode
    {
    }
}
interface Exception extends \Throwable
{
}
final class IllogicalValuesException extends \LogicException implements \SebastianBergmann\LinesOfCode\Exception
{
}
final class NegativeValueException extends \InvalidArgumentException implements \SebastianBergmann\LinesOfCode\Exception
{
}
final class RuntimeException extends \RuntimeException implements \SebastianBergmann\LinesOfCode\Exception
{
}
final class LineCountingVisitor extends \PhpParser\NodeVisitorAbstract
{
    public function __construct(int $linesOfCode)
    {
    }
    public function enterNode(\PhpParser\Node $node): void
    {
    }
    public function result(): \SebastianBergmann\LinesOfCode\LinesOfCode
    {
    }
}
/**
 * @phan-side-effect-free
 */
final class LinesOfCode
{
    /**
     * @throws IllogicalValuesException
     * @throws NegativeValueException
     */
    public function __construct(int $linesOfCode, int $commentLinesOfCode, int $nonCommentLinesOfCode, int $logicalLinesOfCode)
    {
    }
    public function linesOfCode(): int
    {
    }
    public function commentLinesOfCode(): int
    {
    }
    public function nonCommentLinesOfCode(): int
    {
    }
    public function logicalLinesOfCode(): int
    {
    }
    public function plus(self $other): self
    {
    }
}
namespace SebastianBergmann\ObjectEnumerator;

/**
 * Traverses array structures and object graphs
 * to enumerate all referenced objects.
 */
class Enumerator
{
    /**
     * Returns an array of all objects referenced either
     * directly or indirectly by a variable.
     *
     * @param array|object $variable
     *
     * @return object[]
     */
    public function enumerate($variable, ...$func_get_args)
    {
    }
}
interface Exception extends \Throwable
{
}
class InvalidArgumentException extends \InvalidArgumentException implements \SebastianBergmann\ObjectEnumerator\Exception
{
}
namespace SebastianBergmann\ObjectReflector;

interface Exception extends \Throwable
{
}
class InvalidArgumentException extends \InvalidArgumentException implements \SebastianBergmann\ObjectReflector\Exception
{
}
class ObjectReflector
{
    /**
     * @param object $object
     *
     * @throws InvalidArgumentException
     */
    public function getAttributes($object): array
    {
    }
}
namespace SebastianBergmann\RecursionContext;

/**
 * A context containing previously processed arrays and objects
 * when recursively processing a value.
 */
final class Context
{
    /**
     * Initialises the context.
     */
    public function __construct()
    {
    }
    /**
     * @codeCoverageIgnore
     */
    public function __destruct()
    {
    }
    /**
     * Adds a value to the context.
     *
     * @param array|object $value the value to add
     *
     * @throws InvalidArgumentException Thrown if $value is not an array or object
     *
     * @return bool|int|string the ID of the stored value, either as a string or integer
     *
     * @phan-template T
     * @phan-param T $value
     * @param-out T $value
     */
    public function add(&$value)
    {
    }
    /**
     * Checks if the given value exists within the context.
     *
     * @param array|object $value the value to check
     *
     * @throws InvalidArgumentException Thrown if $value is not an array or object
     *
     * @return false|int|string the string or integer ID of the stored value if it has already been seen, or false if the value is not stored
     *
     * @phan-template T
     * @phan-param T $value
     * @param-out T $value
     */
    public function contains(&$value)
    {
    }
}
interface Exception extends \Throwable
{
}
final class InvalidArgumentException extends \InvalidArgumentException implements \SebastianBergmann\RecursionContext\Exception
{
}
namespace SebastianBergmann\ResourceOperations;

final class ResourceOperations
{
    /**
     * @return string[]
     */
    public static function getFunctions(): array
    {
    }
}
namespace SebastianBergmann\Template;

final class Template
{
    /**
     * @throws InvalidArgumentException
     */
    public function __construct(string $file = '', string $openDelimiter = '{', string $closeDelimiter = '}')
    {
    }
    /**
     * @throws InvalidArgumentException
     */
    public function setFile(string $file): void
    {
    }
    public function setVar(array $values, bool $merge = true): void
    {
    }
    public function render(): string
    {
    }
    /**
     * @codeCoverageIgnore
     */
    public function renderTo(string $target): void
    {
    }
}
interface Exception extends \Throwable
{
}
final class InvalidArgumentException extends \InvalidArgumentException implements \SebastianBergmann\Template\Exception
{
}
final class RuntimeException extends \InvalidArgumentException implements \SebastianBergmann\Template\Exception
{
}
namespace SebastianBergmann\Timer;

/**
 * @phan-side-effect-free
 */
final class Duration
{
    public static function fromMicroseconds(float $microseconds): self
    {
    }
    public static function fromNanoseconds(float $nanoseconds): self
    {
    }
    public function asNanoseconds(): float
    {
    }
    public function asMicroseconds(): float
    {
    }
    public function asMilliseconds(): float
    {
    }
    public function asSeconds(): float
    {
    }
    public function asString(): string
    {
    }
}
final class ResourceUsageFormatter
{
    public function resourceUsage(\SebastianBergmann\Timer\Duration $duration): string
    {
    }
    /**
     * @throws TimeSinceStartOfRequestNotAvailableException
     */
    public function resourceUsageSinceStartOfRequest(): string
    {
    }
}
final class Timer
{
    public function start(): void
    {
    }
    /**
     * @throws NoActiveTimerException
     */
    public function stop(): \SebastianBergmann\Timer\Duration
    {
    }
}
interface Exception extends \Throwable
{
}
final class NoActiveTimerException extends \LogicException implements \SebastianBergmann\Timer\Exception
{
}
final class TimeSinceStartOfRequestNotAvailableException extends \RuntimeException implements \SebastianBergmann\Timer\Exception
{
}
namespace SebastianBergmann\Type;

final class Parameter
{
    /**
     * @phan-param non-empty-string $name
     */
    public function __construct(string $name, \SebastianBergmann\Type\Type $type)
    {
    }
    public function name(): string
    {
    }
    public function type(): \SebastianBergmann\Type\Type
    {
    }
}
final class ReflectionMapper
{
    /**
     * @phan-return list<Parameter>
     */
    public function fromParameterTypes(\ReflectionFunctionAbstract $functionOrMethod): array
    {
    }
    public function fromReturnType(\ReflectionFunctionAbstract $functionOrMethod): \SebastianBergmann\Type\Type
    {
    }
}
final class TypeName
{
    public static function fromQualifiedName(string $fullClassName): self
    {
    }
    public static function fromReflection(\ReflectionClass $type): self
    {
    }
    public function __construct(?string $namespaceName, string $simpleName)
    {
    }
    public function namespaceName(): ?string
    {
    }
    public function simpleName(): string
    {
    }
    public function qualifiedName(): string
    {
    }
    public function isNamespaced(): bool
    {
    }
}
interface Exception extends \Throwable
{
}
final class RuntimeException extends \RuntimeException implements \SebastianBergmann\Type\Exception
{
}
final class CallableType extends \SebastianBergmann\Type\Type
{
    public function __construct(bool $nullable)
    {
    }
    /**
     * @throws RuntimeException
     */
    public function isAssignable(\SebastianBergmann\Type\Type $other): bool
    {
    }
    public function name(): string
    {
    }
    public function allowsNull(): bool
    {
    }
    /**
     * @psalm-assert-if-true CallableType $this
     */
    public function isCallable(): bool
    {
    }
}
final class FalseType extends \SebastianBergmann\Type\Type
{
    public function isAssignable(\SebastianBergmann\Type\Type $other): bool
    {
    }
    public function name(): string
    {
    }
    public function allowsNull(): bool
    {
    }
    /**
     * @psalm-assert-if-true FalseType $this
     */
    public function isFalse(): bool
    {
    }
}
final class GenericObjectType extends \SebastianBergmann\Type\Type
{
    public function __construct(bool $nullable)
    {
    }
    public function isAssignable(\SebastianBergmann\Type\Type $other): bool
    {
    }
    public function name(): string
    {
    }
    public function allowsNull(): bool
    {
    }
    /**
     * @psalm-assert-if-true GenericObjectType $this
     */
    public function isGenericObject(): bool
    {
    }
}
final class IntersectionType extends \SebastianBergmann\Type\Type
{
    /**
     * @throws RuntimeException
     */
    public function __construct(\SebastianBergmann\Type\Type ...$types)
    {
    }
    public function isAssignable(\SebastianBergmann\Type\Type $other): bool
    {
    }
    public function asString(): string
    {
    }
    public function name(): string
    {
    }
    public function allowsNull(): bool
    {
    }
    /**
     * @psalm-assert-if-true IntersectionType $this
     */
    public function isIntersection(): bool
    {
    }
    /**
     * @phan-return non-empty-list<Type>
     */
    public function types(): array
    {
    }
}
final class IterableType extends \SebastianBergmann\Type\Type
{
    public function __construct(bool $nullable)
    {
    }
    /**
     * @throws RuntimeException
     */
    public function isAssignable(\SebastianBergmann\Type\Type $other): bool
    {
    }
    public function name(): string
    {
    }
    public function allowsNull(): bool
    {
    }
    /**
     * @psalm-assert-if-true IterableType $this
     */
    public function isIterable(): bool
    {
    }
}
final class MixedType extends \SebastianBergmann\Type\Type
{
    public function isAssignable(\SebastianBergmann\Type\Type $other): bool
    {
    }
    public function asString(): string
    {
    }
    public function name(): string
    {
    }
    public function allowsNull(): bool
    {
    }
    /**
     * @psalm-assert-if-true MixedType $this
     */
    public function isMixed(): bool
    {
    }
}
final class NeverType extends \SebastianBergmann\Type\Type
{
    public function isAssignable(\SebastianBergmann\Type\Type $other): bool
    {
    }
    public function name(): string
    {
    }
    public function allowsNull(): bool
    {
    }
    /**
     * @psalm-assert-if-true NeverType $this
     */
    public function isNever(): bool
    {
    }
}
final class NullType extends \SebastianBergmann\Type\Type
{
    public function isAssignable(\SebastianBergmann\Type\Type $other): bool
    {
    }
    public function name(): string
    {
    }
    public function asString(): string
    {
    }
    public function allowsNull(): bool
    {
    }
    /**
     * @psalm-assert-if-true NullType $this
     */
    public function isNull(): bool
    {
    }
}
final class ObjectType extends \SebastianBergmann\Type\Type
{
    public function __construct(\SebastianBergmann\Type\TypeName $className, bool $allowsNull)
    {
    }
    public function isAssignable(\SebastianBergmann\Type\Type $other): bool
    {
    }
    public function name(): string
    {
    }
    public function allowsNull(): bool
    {
    }
    public function className(): \SebastianBergmann\Type\TypeName
    {
    }
    /**
     * @psalm-assert-if-true ObjectType $this
     */
    public function isObject(): bool
    {
    }
}
final class SimpleType extends \SebastianBergmann\Type\Type
{
    public function __construct(string $name, bool $nullable, $value = null)
    {
    }
    public function isAssignable(\SebastianBergmann\Type\Type $other): bool
    {
    }
    public function name(): string
    {
    }
    public function allowsNull(): bool
    {
    }
    public function value()
    {
    }
    /**
     * @psalm-assert-if-true SimpleType $this
     */
    public function isSimple(): bool
    {
    }
}
final class StaticType extends \SebastianBergmann\Type\Type
{
    public function __construct(\SebastianBergmann\Type\TypeName $className, bool $allowsNull)
    {
    }
    public function isAssignable(\SebastianBergmann\Type\Type $other): bool
    {
    }
    public function name(): string
    {
    }
    public function allowsNull(): bool
    {
    }
    /**
     * @psalm-assert-if-true StaticType $this
     */
    public function isStatic(): bool
    {
    }
}
final class TrueType extends \SebastianBergmann\Type\Type
{
    public function isAssignable(\SebastianBergmann\Type\Type $other): bool
    {
    }
    public function name(): string
    {
    }
    public function allowsNull(): bool
    {
    }
    /**
     * @psalm-assert-if-true TrueType $this
     */
    public function isTrue(): bool
    {
    }
}
abstract class Type
{
    public static function fromValue($value, bool $allowsNull): self
    {
    }
    public static function fromName(string $typeName, bool $allowsNull): self
    {
    }
    public function asString(): string
    {
    }
    /**
     * @psalm-assert-if-true CallableType $this
     */
    public function isCallable(): bool
    {
    }
    /**
     * @psalm-assert-if-true TrueType $this
     */
    public function isTrue(): bool
    {
    }
    /**
     * @psalm-assert-if-true FalseType $this
     */
    public function isFalse(): bool
    {
    }
    /**
     * @psalm-assert-if-true GenericObjectType $this
     */
    public function isGenericObject(): bool
    {
    }
    /**
     * @psalm-assert-if-true IntersectionType $this
     */
    public function isIntersection(): bool
    {
    }
    /**
     * @psalm-assert-if-true IterableType $this
     */
    public function isIterable(): bool
    {
    }
    /**
     * @psalm-assert-if-true MixedType $this
     */
    public function isMixed(): bool
    {
    }
    /**
     * @psalm-assert-if-true NeverType $this
     */
    public function isNever(): bool
    {
    }
    /**
     * @psalm-assert-if-true NullType $this
     */
    public function isNull(): bool
    {
    }
    /**
     * @psalm-assert-if-true ObjectType $this
     */
    public function isObject(): bool
    {
    }
    /**
     * @psalm-assert-if-true SimpleType $this
     */
    public function isSimple(): bool
    {
    }
    /**
     * @psalm-assert-if-true StaticType $this
     */
    public function isStatic(): bool
    {
    }
    /**
     * @psalm-assert-if-true UnionType $this
     */
    public function isUnion(): bool
    {
    }
    /**
     * @psalm-assert-if-true UnknownType $this
     */
    public function isUnknown(): bool
    {
    }
    /**
     * @psalm-assert-if-true VoidType $this
     */
    public function isVoid(): bool
    {
    }
    abstract public function isAssignable(self $other): bool;
    abstract public function name(): string;
    abstract public function allowsNull(): bool;
}
final class UnionType extends \SebastianBergmann\Type\Type
{
    /**
     * @throws RuntimeException
     */
    public function __construct(\SebastianBergmann\Type\Type ...$types)
    {
    }
    public function isAssignable(\SebastianBergmann\Type\Type $other): bool
    {
    }
    public function asString(): string
    {
    }
    public function name(): string
    {
    }
    public function allowsNull(): bool
    {
    }
    /**
     * @psalm-assert-if-true UnionType $this
     */
    public function isUnion(): bool
    {
    }
    public function containsIntersectionTypes(): bool
    {
    }
    /**
     * @phan-return non-empty-list<Type>
     */
    public function types(): array
    {
    }
}
final class UnknownType extends \SebastianBergmann\Type\Type
{
    public function isAssignable(\SebastianBergmann\Type\Type $other): bool
    {
    }
    public function name(): string
    {
    }
    public function asString(): string
    {
    }
    public function allowsNull(): bool
    {
    }
    /**
     * @psalm-assert-if-true UnknownType $this
     */
    public function isUnknown(): bool
    {
    }
}
final class VoidType extends \SebastianBergmann\Type\Type
{
    public function isAssignable(\SebastianBergmann\Type\Type $other): bool
    {
    }
    public function name(): string
    {
    }
    public function allowsNull(): bool
    {
    }
    /**
     * @psalm-assert-if-true VoidType $this
     */
    public function isVoid(): bool
    {
    }
}
