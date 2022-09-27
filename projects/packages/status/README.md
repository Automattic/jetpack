# Jetpack Status

A status class for Jetpack.

Used to retrieve information about the current status of Jetpack and the site overall.

### Usage

Find out whether the site is in offline mode:

```php
use Automattic\Jetpack\Status;

$status = new Status();
$is_offline_mode = $status->is_offline_mode();
```

Find out whether this is a system with multiple networks:

```php
use Automattic\Jetpack\Status;

$status = new Status();
$is_multi_network = $status->is_multi_network();
```

Find out whether this site is a single user site:

```php
use Automattic\Jetpack\Status;

$status = new Status();
$is_single_user_site = $status->is_single_user_site();
```

#### Jetpack Module handling

To handle Jetpack modules status and activation/deactivation you can use the Modules class.

```php
use Automattic\Jetpack\Modules;

$modules = new Modules();
$is_my_module_active = $modules->is_active( 'stats' );
```

To receive a list of active modules you can use `is_active`:

```php
use Automattic\Jetpack\Modules;

$modules = new Modules();
$active_modules = $modules->get_active();
```

The same thing you can do with available modules - the method will return a list of all available modules regardless of their activity status:

```php
use Automattic\Jetpack\Modules;

$modules = new Modules();
$available_modules = $modules->get_available();
```

You can also use a shorthand for checking whether a module exists without getting the full list:

```php
use Automattic\Jetpack\Modules;

$modules = new Modules();
$is_slug_a_valid_module = $modules->is_module( 'foobar' );
```

Manipulating the module status can also be done using this class. You can activate the module with all necessary underlying changes made using this method:

```php
use Automattic\Jetpack\Modules;

$modules = new Modules();
$exit_after_activation = false;
$redirect_after_activation = true;

$modules->activate( 'stats', $exit_after_activation, $redirect_after_activation );
```

You can also enforce a certain module's active state. This has previously been done using a filter, but now you can simply run this method to make sure a module always stays active:

```php
use Automattic\Jetpack\Modules;

$modules = new Modules();
$modules->enforce( 'publicize' );
```

You can also remove the enforcing by using a corresponding method:


```php
use Automattic\Jetpack\Modules;

$modules = new Modules();
$modules->stop_enforcing( 'publicize' );
```

When enforcing modules you can make sure your code runs before that only once, that can be achieved by using another filter:

```php
add_action( 'jetpack_pre_activate_module', 'my_module_activation_handler' );
function my_module_activation_handler( $slug ) {
	if ( 'my_slug' === $slug ) {
		// Handle my module activation here.
	}
}
```
