# PHP-Mock: mocking built-in PHP functions

PHP-Mock is a testing library which mocks non deterministic built-in PHP functions like
`time()` or `rand()`. This is achieved by [PHP's namespace fallback policy](http://php.net/manual/en/language.namespaces.fallback.php):

> PHP will fall back to global functions […]
> if a namespaced function […] does not exist.

PHP-Mock uses that feature by providing the namespaced function. I.e. you have
to be in a **non global namespace** context and call the function
**unqualified**:

```php
namespace foo;

$time = time(); // This call can be mocked, a call to \time() can't.
```

## Requirements and restrictions

* Only *unqualified* function calls in a namespace context can be mocked.
  E.g. a call for `time()` in the namespace `foo` is mockable,
  a call for `\time()` is not.

* The mock has to be defined before the first call to the unqualified function
  in the tested class. This is documented in [Bug #68541](https://bugs.php.net/bug.php?id=68541).
  In most cases, you can ignore this restriction but if you happen to run into
  this issue you can call [`Mock::define()`](http://php-mock.github.io/php-mock/api/class-phpmock.Mock.html#_define)
  before that first call. This would define a side effectless namespaced
  function which can be enabled later. Another effective
  approach is running your test in an isolated process.

## Alternatives

If you can't rely on or just don't want to use the namespace fallback policy,
there are alternative techniques to mock built-in PHP functions:

* [**PHPBuiltinMock**](https://github.com/jadell/PHPBuiltinMock) relies on
  the [APD](http://php.net/manual/en/book.apd.php) extension.

* [**MockFunction**](https://github.com/tcz/phpunit-mockfunction) is a PHPUnit
  extension. It uses the [runkit](http://php.net/manual/en/book.runkit.php) extension.

* [**UOPZ**](https://github.com/krakjoe/uopz) is a Zend extension which
  allows, among others, renaming and deletion of functions.

* [**vfsStream**](https://github.com/mikey179/vfsStream) is a stream wrapper for
  a virtual file system. This will help you write tests which covers PHP
  stream functions (e.g. `fread()` or `readdir()`).

# Installation

Use [Composer](https://getcomposer.org/):

```sh
composer require --dev php-mock/php-mock
```


# Usage

You don't need to learn yet another API. PHP-Mock has integrations
for these testing frameworks:

- [php-mock/php-mock-phpunit](https://github.com/php-mock/php-mock-phpunit) - PHPUnit integration

- [php-mock/php-mock-mockery](https://github.com/php-mock/php-mock-mockery) - Mockery integration

- [php-mock/php-mock-prophecy](https://github.com/php-mock/php-mock-prophecy) - Prophecy (phpspec) integration

**Note:** If you plan to use one of the above mentioned testing frameworks you can skip
reading any further and just go to the particular integration project.

## PHP-Mock API

You find the API in the namespace
[`phpmock`](http://php-mock.github.io/php-mock/api/namespace-phpmock.html).

Create a [`Mock`](http://php-mock.github.io/php-mock/api/class-phpmock.Mock.html)
object. You can do this with the fluent API of [`MockBuilder`](http://php-mock.github.io/php-mock/api/class-phpmock.MockBuilder.html):

* [`MockBuilder::setNamespace()`](http://php-mock.github.io/php-mock/api/class-phpmock.MockBuilder.html#_setNamespace)
  sets the target namespace of the mocked function.

* [`MockBuilder::setName()`](http://php-mock.github.io/php-mock/api/class-phpmock.MockBuilder.html#_setName)
  sets the name of the mocked function (e.g. `time()`).

* [`MockBuilder::setFunction()`](http://php-mock.github.io/php-mock/api/class-phpmock.MockBuilder.html#_setFunction)
  sets the concrete mock implementation.

* [`MockBuilder::setFunctionProvider()`](http://php-mock.github.io/php-mock/api/class-phpmock.MockBuilder.html#_setFunctionProvider)
  sets, alternativly to `MockBuilder::setFunction()`, the mock implementation as a
  [`FunctionProvider`](http://php-mock.github.io/php-mock/api/class-phpmock.functions.FunctionProvider.html):

   * [`FixedValueFunction`](http://php-mock.github.io/php-mock/api/class-phpmock.functions.FixedValueFunction.html)
     is a simple implementation which returns always the same value.

   * [`FixedMicrotimeFunction`](http://php-mock.github.io/php-mock/api/class-phpmock.functions.FixedMicrotimeFunction.html)
     is a simple implementation which returns always the same microtime. This
     class is different to `FixedValueFunction` as it contains a converter for
     `microtime()`'s float and string format.

   * [`FixedDateFunction`](http://php-mock.github.io/php-mock/api/class-phpmock.functions.FixedDateFunction.html)
     is a simple implementation which returns always a formated date for the fixed timestamp.

   * [`SleepFunction`](http://php-mock.github.io/php-mock/api/class-phpmock.functions.SleepFunction.html)
     is a `sleep()` implementation, which doesn't halt but increases an
     [`Incrementable`](http://php-mock.github.io/php-mock/api/class-phpmock.functions.Incrementable.html)
     e.g. a `time()` mock.

   * [`UsleepFunction`](http://php-mock.github.io/php-mock/api/class-phpmock.functions.UsleepFunction.html)
     is an `usleep()` implementation, which doesn't halt but increases an
     `Incrementable` e.g. a `microtime()` mock.

* [`MockBuilder::build()`](http://php-mock.github.io/php-mock/api/class-phpmock.MockBuilder.html#_build)
  builds a `Mock` object.

After you have build your `Mock` object you have to call [`enable()`](http://php-mock.github.io/php-mock/api/class-phpmock.Mock.html#_enable)
to enable the mock in the given namespace. When you are finished with that mock you
should disable it by calling [`disable()`](http://php-mock.github.io/php-mock/api/class-phpmock.Mock.html#_disable)
on the mock instance. 

This example illustrates mocking of the unqualified function `time()` in the 
namespace `foo`:

```php
namespace foo;

use phpmock\MockBuilder;

$builder = new MockBuilder();
$builder->setNamespace(__NAMESPACE__)
        ->setName("time")
        ->setFunction(
            function () {
                return 1417011228;
            }
        );
                    
$mock = $builder->build();

// The mock is not enabled yet.
assert (time() != 1417011228);

$mock->enable();
assert (time() == 1417011228);

// The mock is disabled and PHP's built-in time() is called.
$mock->disable();
assert (time() != 1417011228);
```

Instead of setting the mock function with `MockBuilder::setFunction()` you could also
use the existing [`FixedValueFunction`](http://php-mock.github.io/php-mock/api/class-phpmock.functions.FixedValueFunction.html):

```php
namespace foo;

use phpmock\MockBuilder;
use phpmock\functions\FixedValueFunction;

$builder = new MockBuilder();
$builder->setNamespace(__NAMESPACE__)
        ->setName("time")
        ->setFunctionProvider(new FixedValueFunction(1417011228));

$mock = $builder->build();
```

### Reset global state

An enabled mock changes global state. This will break subsequent tests if
they run code which would call the mock unintentionally. Therefore
you should always disable a mock after the test case. You will have to disable
the created mock. You could do this for all mocks by calling the
static method
[`Mock::disableAll()`](http://php-mock.github.io/php-mock/api/class-phpmock.Mock.html#_disableAll).

### Mock environments

Complex mock environments of several mocked functions can be grouped in a [`MockEnvironment`](http://php-mock.github.io/php-mock/api/class-phpmock.environment.MockEnvironment.html):

* [`MockEnvironment::enable()`](http://php-mock.github.io/php-mock/api/class-phpmock.environment.MockEnvironment.html#_enable)
  enables all mocked functions of this environment.

* [`MockEnvironment::disable()`](http://php-mock.github.io/php-mock/api/class-phpmock.environment.MockEnvironment.html#_disable)
  disables all mocked functions of this environment.

* [`MockEnvironment::define()`](http://php-mock.github.io/php-mock/api/class-phpmock.environment.MockEnvironment.html#_define)
  defines all mocked functions of this environment.

#### SleepEnvironmentBuilder

The [`SleepEnvironmentBuilder`](http://php-mock.github.io/php-mock/api/class-phpmock.environment.SleepEnvironmentBuilder.html)
builds a mock environment where `sleep()` and `usleep()` return immediatly.
Furthermore they increase the amount of time in the mocked `date()`, `time()` and
`microtime()`:

```php
namespace foo;

use phpmock\environment\SleepEnvironmentBuilder;

$builder = new SleepEnvironmentBuilder();
$builder->addNamespace(__NAMESPACE__)
        ->setTimestamp(1417011228);

$environment = $builder->build();
$environment->enable();

// This won't delay the test for 10 seconds, but increase time().        
sleep(10);

assert(1417011228 + 10 == time());
```

If the mocked functions should be in different namespaces you can
add more namespaces with [`SleepEnvironmentBuilder::addNamespace()`](http://php-mock.github.io/php-mock/api/class-phpmock.environment.SleepEnvironmentBuilder.html#_addNamespace)

### Spies

A [`Spy`](http://php-mock.github.io/php-mock/api/class-phpmock.spy.Spy.html)
gives you access to the function invocations.
[`Spy::getInvocations()`](http://php-mock.github.io/php-mock/api/class-phpmock.spy.Spy.html#_getInvocations)
gives you access to the arguments and return value.

As a `Spy` is a specialization of `Mock` it behaves identically. However you
could ommit the third constructor parameter `callable $function` which
would then create a spy using the existing function.
E.g. a `new Spy(__NAMESPACE__ , "rand")` would create a spy which basically
proxies PHP's built-in `rand()`:

```php
namespace foo;

use phpmock\spy\Spy;

function bar($min, $max) {
    return rand($min, $max) + 3;
}

$spy = new Spy(__NAMESPACE__, "rand");
$spy->enable();

$result = bar(1, 2);

assert ([1, 2]  == $spy->getInvocations()[0]->getArguments());
assert ($result == $spy->getInvocations()[0]->getReturn() + 3);
```


# License and authors

This project is free and under the WTFPL.
Responsable for this project is Markus Malkusch markus@malkusch.de.
This library was inspired by Fabian Schmengler's article
[*PHP: “Mocking” built-in functions like time() in Unit Tests*](http://www.schmengler-se.de/en/2011/03/php-mocking-built-in-functions-like-time-in-unit-tests/).

## Donations

If you like PHP-Mock and feel generous donate a few Bitcoins here:
[1335STSwu9hST4vcMRppEPgENMHD2r1REK](bitcoin:1335STSwu9hST4vcMRppEPgENMHD2r1REK)

[![Build Status](https://travis-ci.org/php-mock/php-mock.svg?branch=master)](https://travis-ci.org/php-mock/php-mock)
