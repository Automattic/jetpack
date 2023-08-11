# Jetpack Roles

A user roles class for Jetpack.

Contains utilities for translating user roles to capabilities and vice versa.

### Usage

Get the role of the current user:

```php
use Automattic\Jetpack\Roles;

$roles = new Roles();
$current_user_role = $roles->translate_current_user_to_role();
```

Get the role of a particular user:

```php
use Automattic\Jetpack\Roles;

$roles = new Roles();
$user  = get_user_by( 'contact@yourjetpack.blog' );
$user_role = $roles->translate_user_to_role( $user );
```

Get the capability we require for a role:

```php
use Automattic\Jetpack\Roles;

$roles = new Roles();
$capability = $roles->translate_role_to_cap( 'administrator' );
```

## Using this package in your WordPress plugin

If you plan on using this package in your WordPress plugin, we would recommend that you use [Jetpack Autoloader](https://packagist.org/packages/automattic/jetpack-autoloader) as your autoloader. This will allow for maximum interoperability with other plugins that use this package as well.

## Security

Need to report a security vulnerability? Go to [https://automattic.com/security/](https://automattic.com/security/) or directly to our security bug bounty site [https://hackerone.com/automattic](https://hackerone.com/automattic).

## License

jetpack-roles is licensed under [GNU General Public License v2 (or later)](./LICENSE.txt)
