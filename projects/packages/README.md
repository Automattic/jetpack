# Jetpack packages for Development

These Composer packages offer a unified code base that we will share among projects under the Jetpack brand.

## Installing Composer

You need Composer to use the packages. If you don't have it installed, go and check how to [install Composer](https://github.com/Automattic/jetpack/blob/trunk/docs/development-environment.md#composer) and then continue here.

## Defining required packages

You need to create a `composer.json` file in your project root. For example, this is the file in VaultPress that requires the Jetpack logo package.

```json
{
    "name": "automattic/vaultpress",
    "description": "VaultPress is a subscription service offering real-time backup, automated security scanning, and support from WordPress experts.",
    "homepage": "https://vaultpress.com/",
    "type": "wordpress-plugin",
    "license": "GPL-2.0-or-later",
    "support": {
    	"issues": "https://github.com/Automattic/vaultpress/issues"
    },
    "require": {
        "automattic/jetpack-logo": "1.0.0"
    },
    "require-dev": {
        "automattic/jetpack-standards": "master-dev"
    }
}
```

## Installing packages

Once you have defined your package requirements, run

```
composer install
```

and that will install the required Composer packages.

### Using packages

To use something from a package, you have to declare it at the top of the file before any other instruction, and then use it in the code. For example, the logo can be used like this:

```php
use Automattic\Jetpack\Assets\Logo;

// other code...

$logo = new Logo();
```

If you need to rule out conflicts, you can alias it:

```php
use Automattic\Jetpack\Assets\Logo as Jetpack_Logo;

// other code...

$logo = new Jetpack_Logo();
```

## Deploying packages

While the script we use to deploy the package takes care of everything, we might need to setup some stuff online in GitHub and Packagist. Let's use the Autoloader package as an example. 

1. Before you merge the PR introducing the new package in Jetpack, run through the steps below.
2. Create an online repository in GitHub for the package. In this case, it's https://github.com/Automattic/jetpack-autoloader.
3. Add an initial valid `composer.json` to the repository. You can copy it from your PR in the Jetpack repo.
4. You'll want to update the repository settings to be just like the Autoloader repo; check the repository description, disable issues, set up branch protection rules for the `trunk` branch.
5. Go to https://packagist.org/packages/submit and insert the URL of the GitHub repository.
6. Upon submission, add Crew members as package maintainers, as well as the `automattic` account.


Once this is all done, you can merge your PR in the Jetpack repo. When you do so, the changes will be automatically pushed to the new package repo, and your changes will become available in the `dev-trunk` version of the package available to the public.

## Unit Tests
You may run unit tests locally for any given package by running `composer phpunit` within the package directory.

## Developing Jetpack Packages

### Creating a New Package

#### Should my code be in a Package?

Not sure if your code should be in a Package? Here are some general guidelines we follow when deciding: 

|   | Consider |
|---|---|
| ❌ | Your code will not work without the Jetpack plugin. |
| ❌ | There is no use for your code outside of the Jetpack Plugin context. |
| ✅ | A need to ship this code independently of the Jetpack plugin. |
| ✅ | Other plugins will find this code useful. |
| ✅ | You are building a completely new plugin. |
| ✅ | Your code has dependencies that are only within itself or other Packages. |


### Package Autoloading

All new Jetpack package development should use classmap autoloading, which allows the class and file names to comply with the WordPress Coding Standards.

### Textdomains

Jetpack packages must use the 'jetpack' textdomain. The consuming plugin is responsible for updating the packages to use the plugin's textdomain.

### Package Version Annotations

When needing to add a package version number inside a DocBlock, please use `$$next-version$$` as such:

- `@since $$next-version$$`
- `@deprecated $$next-version$$`
- `@deprecated since $$next-version$$`
- `_deprecated_function( __METHOD__, 'package-$$next-version$$' );` (other WordPress deprecation functions also work, but note it must be all on one line).

The `$$next-version$$` specifier will be automatically replaced with the correct package version number the next time a new version of that package is released.
