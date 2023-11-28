Jetpack Coding Standard
=======================

This is a package implementing phpcs sniffs for the Jetpack Coding Standard.

This standard is generally that of WordPress, with a few additions.

Usage
-----

In your project's `composer.json`, add the following lines:

```json
{
    "require-dev": {
        "dealerdirect/phpcodesniffer-composer-installer": "*",
        "automattic/jetpack-codesniffer": "^1"
    }
}
```

Your project must use the default composer vendor directory, `vendor`.

You should then include the Jetpack rules in your `.phpcs.xml.dist`, like
```xml
<rule ref="Jetpack" />
```
You will also likely want to set some configuration for other included rulesets:
```xml
<config name="minimum_supported_wp_version" value="6.3" />
<config name="testVersion" value="7.0-"/>
```

Included Standards
------------------

The Jetpack standard includes the following other standards:

* [PHPCompatibilityWP](https://packagist.org/packages/phpcompatibility/phpcompatibility-wp)
* [WordPress-Core, WordPress-Docs, and WordPress-Extra](https://packagist.org/packages/wp-coding-standards/wpcs)
* [VariableAnalysis](https://packagist.org/packages/sirbrillig/phpcs-variable-analysis)
* Selected sniffs from [MediaWiki](https://packagist.org/packages/mediawiki/mediawiki-codesniffer)

Per-dir Compatibility
---------------------

This ruleset is intended to be used with PHPCompatibiity's `testVersion` set to `7.0-`.
If used with [automattic/jetpack-phpcs-filter](https://github.com/Automattic/jetpack/blob/trunk/projects/packages/phpcs-filter/)'s per-directory configuration,
you may run into a situation where a subdir wants to be compatible down to a later version, but as PHPCompatibiity uses `<config>` for `testVersion` the setting cannot be directly altered per directory.

To assist with this case, we provide additional rulesets that disable PHPCompatibility rules detecting issues that only apply to older versions:

* `<rule ref="Jetpack-Compat-71" />` will disable rules detecting issues that only apply to PHP < 7.1.
* `<rule ref="Jetpack-Compat-72" />` will disable rules detecting issues that only apply to PHP < 7.2.
* `<rule ref="Jetpack-Compat-73" />` will disable rules detecting issues that only apply to PHP < 7.3.
* `<rule ref="Jetpack-Compat-74" />` will disable rules detecting issues that only apply to PHP < 7.4.
* `<rule ref="Jetpack-Compat-80" />` will disable rules detecting issues that only apply to PHP < 8.0.
* `<rule ref="Jetpack-Compat-81" />` will disable rules detecting issues that only apply to PHP < 8.1.
* `<rule ref="Jetpack-Compat-82" />` will disable rules detecting issues that only apply to PHP < 8.2.
* `<rule ref="Jetpack-Compat-83" />` will disable rules detecting issues that only apply to PHP < 8.3.

Note this isn't a perfect replacement for raising `testVersion`, as it cannot _add_ PHPCompatibility rules that do not trigger when `testVersion` indicates support for PHP 7.0.
For example, `Jetpack-Compat-74` disables the `PHPCompatibility.Classes.NewTypedProperties.Found` rule ("Typed properties are not supported in PHP 7.3 or earlier") but cannot enable more specific rules like `PHPCompatibility.Classes.NewTypedProperties.UnionTypeFound` ("Union types are not present in PHP version 7.4 or earlier") that would be triggered if `testVersion` were set to `7.4-`.

You may also run into cases where certain subdirectories contain code that is not intended to run under WordPress. We provide additional rulesets to help with this situation as well:

* `<rule ref="Jetpack-Compat-NoWP" />` will re-enable rules that PHPCompatibilityWP disables because WordPress provides polyfills for various functions.
* `<rule ref="Jetpack-NoWP" />` includes Jetpack-Compat-NoWP and disables additional rules checking for use of WordPress-provided functions over PHP-native ones.
* `<rule ref="Jetpack-Tests" />` will disable certain rules that do not make much sense in PHPUnit tests.
