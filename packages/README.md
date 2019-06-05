# Jetpack packages for Development

These Composer packages offer a unified codebase that we will share among projects under the Jetpack brand.

## Installing Composer

Composer can be installed using [Homebrew](https://brew.sh/). If you still don't have Homebrew, install it with

```
/usr/bin/ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"

```

And then install Composer:

```
brew install composer
```

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
use Automattic\Jetpack\Assets\Jetpack_Logo;

// other code...

$logo = new Jetpack_Logo();
```
