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
