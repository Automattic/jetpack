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
<config name="minimum_supported_wp_version" value="5.4" />
<config name="testVersion" value="5.6-"/>
```

Included Standards
------------------

The Jetpack standard includes the following other standards:

* [PHPCompatibilityWP](https://packagist.org/packages/phpcompatibility/phpcompatibility-wp)
* [WordPress-Core, WordPress-Docs, and WordPress-Extra](https://packagist.org/packages/wp-coding-standards/wpcs)
* [VariableAnalysis](https://packagist.org/packages/sirbrillig/phpcs-variable-analysis)
* Selected sniffs from [MediaWiki](https://packagist.org/packages/mediawiki/mediawiki-codesniffer)
