# VideoPress TUS Client

This simplified PHP TUS Client is a copy of [ankitpokhrel's tusPHP client](https://github.com/ankitpokhrel/tus-php) backported to work with PHP 5.6.

In this folder you will find files copied over from the original codebase and modified to work with PHP 5.6.

Note that this is as close as a "unmodified" version of the original code. Further cusomization needed from the VideoPress package are added in the `src/class-tus-client.php` file. If one day we start supporting php 7.2 and want to use the full library, that's the only place where we need to look to know what we need.

## What was done

In [#25302](https://github.com/Automattic/jetpack/pull/25302) you'll find all the commits that:

* Add the files as a verbatim code from the original codebase
* Adapt each file so they work with PHP 5.6
* Remove the the dispatcher dependency: This is a feature not used by us and that would introduce further dependencies to be copied and adapted
* Remove Symfony Response dependency
* Remove Carbon dependency, as versions <2.0, which are compatible with PHP 5.6, are now deprecated
* Lint all the files to the monorepo rules, one by one

When linting, you will notice that we added several `phpcs:disable` rules in each file, for rules that would require us to rewrite too much coded or come up with argument descriptions not present in the original code. As we are still treating this as an external library, it's fine to ignore some of these rules.

