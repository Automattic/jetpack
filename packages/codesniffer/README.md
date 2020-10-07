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
