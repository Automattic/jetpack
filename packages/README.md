# Jetpack packages for Development

These Composer packages offer a unified code base that we will share among projects under the Jetpack brand.

## Installing Composer

You need Composer to use the packages. If you don't have it installed, go and check how to [install Composer](https://github.com/Automattic/jetpack/blob/master/docs/development-environment.md#installing-composer) and then continue here.

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

While the script we use to deploy the package takes care of everything, we might need to setup some stuff online in GitHub and Packagist. Let's use the Autoload package as an example. 

You must first have an online repository in GitHub for the package. In this case, it's https://github.com/Automattic/jetpack-autoloader. The code here comes from the Jetpack plugin in `packages/autoloader`.

You also need a package home in Packagist. For the Autoloader, it's https://packagist.org/packages/automattic/jetpack-autoloader. To create a new one, go to https://packagist.org/packages/submit and insert the URL of the GitHub repository.

To establish a link between the two, so the packages are updated in Packagist when they're updated in GitHub, you need to add a Webhook to the GitHub repo. You can find more information about it on the [Packagist docs](https://packagist.org/about#how-to-update-packages), and you can also check the [Packagist Webhook in Autoloader](https://github.com/Automattic/jetpack-autoloader/settings/hooks) to see how it's setup.

Once you've all this ready, you should be standing in the Jetpack plugin root and run:

```
php bin/release-package.php autoloader 5.6.7 
```

The PHP script admits two parameters, the package name and the new target version (`5.6.7` is just an example). Once it's run, the script will:

- create and push a new `automattic/jetpack-autoloader@5.6.7` tag in the main Jetpack repository.
- filter the current Jetpack repository to the contents and history of the package subdirectory.
- add the `automattic/jetpack-autoloader` package as a git remote.
- push the new contents and history to the package repository.
- fetch all current tags of the package repository.
- create and push a new `v5.6.7` tag in the package repository.
- reset the local repository to its original state and clean up.

## Should my code be in a Package? 

Not sure if your code should be in a Package? Here are some general guidelines we follow when deciding: 

|   | Consider |
|---|---|
| ❌ | Your code will not work without the Jetpack plugin. |
| ❌ | There is no use for your code outside of the Jetpack Plugin context. |
| ✅ | A need to ship this code independently of the Jetpack plugin. |
| ✅ | Other plugins will find this code useful. |
| ✅ | You are building a completely new plugin. |
| ✅ | Your code has dependencies that are only within itself or other Packages. |
