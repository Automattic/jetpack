# automattic/patchwork-redefine-exit

This package uses [antecedent/patchwork] to redefine `exit` and `die` for more robust PHPUnit testing.

## Installation

Require using `composer require --dev automattic/patchwork-redefine-exit`.

## Configuration

You'll need to configure Patchwork to allow redefining of `exit()` and `die()` by setting `redefinable-internals` in your `patchwork.json`.
At minimum that would look like this:
```json
{
	"redefinable-internals": [ "exit", "die" ]
}
```
(you can place `patchwork.json` in the same directory as your PHPUnit boostrap file).

You'll also need to configure PHPUnit to load Patchwork and this package, which is normally done by including something like this in your PHPUnit boostrap file.
```php
// Require Patchwork.
require_once __DIR__ . '/../vendor/antecedent/patchwork/Patchwork.php';

// Enable Automattic/patchwork-redefine-exit.
\Automattic\RedefineExit::setup();
```

### Use with other testing frameworks

For other testing frameworks, you'll need to use a bootstrap file or similar mechanism to load Patchwork before any code under test is loaded, and call `Automattic\RedefineExit::setup()` before any tests are run.

If the testing framework itself calls `exit` or `die` in a manner that gets caught incorrectly (e.g. to terminate with an appropriate exit code at the end of the test run), you may subclass `Automattic\RedefineExit` and implement the `ignoreExitCall()` method to identify and ignore such calls.

## Usage

If everything is set up correctly, calls to `exit` or `die` outside of PHPUnit itself will throw an instance of `Automattic\RedefineExit\ExitException` instead of exiting.
If not caught or expected (using PHPUnit's `expectException()` and related methods), this will cause the test to gracefully fail with a message about the uncaught exception.

The message on the exception will describe how `exit` or `die` was called, and the code will match the code the process would have exited with.

If you catch the exception in your test, you can determine whether it was `exit` or `die` by checking `$ex->getFunction()`, and you can access the actual argument passed with `$ex->getArgument()`.

## Caveats

In addition to the [limitations of Patchwork itself](https://antecedent.github.io/patchwork/limitations/) around redefining builtin functions, note that Patchwork's `restoreAll()` function should be avoided as it would also restore the exit handlers.
To avoid the problems that causes, we normally set up our `exit` and `die` redefinitions with "expiration" handlers that will kill the process (with a helpful message) if `Patchwork\restoreAll()` is called.
If you want to restore all other handlers except ours, a replacement function `Automattic\RedefineExit::restoreAll()` is provided.
Or, if you'd rather avoid the expiration handlers entirely, call `Automattic\RedefineExit::setupDangerously()` instead of `::setup()`. In this case you may want to call `::setupDangerously()` again every time you call `Patchwork\restoreAll()`.

## Security

Need to report a security vulnerability? Go to [https://automattic.com/security/](https://automattic.com/security/) or directly to our security bug bounty site [https://hackerone.com/automattic](https://hackerone.com/automattic).

## License

patchwork-redefine-exit is licensed under [GNU General Public License v2 (or later)](./LICENSE.txt)

[antecedent/patchwork]: https://github.com/antecedent/patchwork
