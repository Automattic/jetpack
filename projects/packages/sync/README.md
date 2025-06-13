# Jetpack Sync

Everything needed to allow syncing to the WordPress.com infrastructure.

## Get Started

The easiest way to get started with Sync is via the [Jetpack Configuration package](https://packagist.org/packages/automattic/jetpack-config).

### Configuring Sync with all Sync Modules enabled

Assuming a `$config` instance of `Automattic/Jetpack/Config`, the following code will configure Sync with all its Modules enabled:

`$config->ensure( 'sync' )`

### Configuring Sync with limited functionality

It's possible to limit Sync functionality by providing an explicit list of data to be synced.

Using the Config package those data settings can be passed as an array in the `ensure` call for `sync`.

Here's an example:

```
$config->ensure(
    'sync',
    array( 
        'jetpack_sync_options_whitelist'  => array( 'my_plugin_option' ),
    )
);
```

Alteratively, if you prefer to use the Sync package directly, you can set the Sync data settings using the `Main::set_sync_data_options` method. For example:

```
Jetpack\Sync\Main::set_sync_data_options(
    array( 
        'jetpack_sync_options_whitelist'  => array( 'my_plugin_option' ),
    )
); 
```

#### Configurable Sync data settings

Here's a list of all the Sync data settings that are configurable:

##### `jetpack_sync_modules`

The list of Sync modules to enable. By default all Sync modules are enabled. 
You can override this behaviour by passing an array of Sync modules as follows:

```
$config->ensure(
	'sync',
	array(
		'jetpack_sync_modules' => array(
			'Automattic\\Jetpack\\Sync\\Modules\\Posts', // Only sync Post related data.
		)
	)
);
```

It's important to note that we consider a list of certain Sync modules required for Sync to properly function, therefore
the following modules will be enabled no matter the configuration:

- `Automattic\\Jetpack\\Sync\\Modules\\Options`
- `Automattic\\Jetpack\\Sync\\Modules\\Callables`
- `Automattic\\Jetpack\\Sync\\Modules\\Constants`
- `Automattic\\Jetpack\\Sync\\Modules\\Full_Sync_Immediately`
- `Automattic\\Jetpack\\Sync\\Modules\\Stats`
- `Automattic\\Jetpack\\Sync\\Modules\\Updates`

**Attention**: Sync currently only supports configuring the list of [default Sync modules](https://github.com/Automattic/jetpack/blob/trunk/projects/packages/sync/src/class-modules.php#L25). Any modules that Sync already loads conditionally, such as `WooCommerce` or `Search` are **NOT** configurable.

##### `jetpack_sync_options_whitelist` / `jetpack_sync_options_contentless`

**Controlled by the Sync Options Module, which is required.**
You can limit the site options to sync by specifying a list of explicit options as follows:

```
$config->ensure(
    'sync',
    array( 
        'jetpack_sync_options_whitelist' => array( 'my_plugin_option' ),
    )
);
```

It's important to note that we consider a list of certain options required for Sync to properly function, therefore the following options will be synced no matter the configuration:

- `jetpack_sync_active_modules`, // Sync related option
- `jetpack_sync_non_blocking`, // Sync related option
- `jetpack_sync_non_public_post_stati`, // Sync related option
- `jetpack_sync_settings_comment_meta_whitelist`, // Sync related option
- `jetpack_sync_settings_post_meta_whitelist`, // Sync related option
- `jetpack_sync_settings_post_types_blacklist`, // Sync related option
- `jetpack_sync_settings_taxonomies_blacklist`, // Sync related option
- `jetpack_sync_settings_dedicated_sync_enabled`, // Sync related option
- `blog_charset`, // Generic site option
- `blog_public`, // Generic site option
- `blogdescription`, // Generic site option
- `blogname`, // Generic site option
- `permalink_structure`, // Generic site option
- `stylesheet`, // Generic site option
- `time_format`, // Generic site option
- `timezone_string`, // Generic site option
- `active_plugins`, // Generic site option

Passing a list of options will result in syncing those options plus the required ones.

Passing an empty array will result in syncing only the required options.

Not configuring this setting will result in syncing all default options, as defined by Sync (see `Automattic\Jetpack\Sync\Defaults::$default_options_whitelist`)

Same logic applies for the list of "Contentless" options we sync. For those options we DO NOT sync contents, only the option name - Good for sensitive information that Sync does not need.

The exception here is that there are no required ones. **Therefore, passing an empty array will result in NOT syncing any contentless options.**

Not configuring this setting will result in syncing all default contentless options, as defined by Sync (see `Automattic\Jetpack\Sync\Defaults::$default_options_contentless`)


##### `jetpack_sync_callable_whitelist` / `jetpack_sync_multisite_callable_whitelist`

**Controlled by the Sync Callable Module, which is required.**
You can limit the callables to sync by specifying a list of explicit callables as follows:

```
$config->ensure(
    'sync',
    array(
	    'jetpack_sync_callable_whitelist' => array(
			'my_plugin_settings' => array( 'My_Plugin_Class', 'get_settings' ),
		),
	)
);
```

**When it comes to configuring callables, you need to pass an associative array where the key is the name of your callable and the value the corresponding callback function.**
It's important to note that we consider a list of certain callables required for Sync to properly function, therefore the following callables will be synced no matter the configuration:

- `site_url`               
- `home_url`
- `get_plugins`
- `get_themes`
- `paused_plugins`
- `paused_themes`
- `timezone`
- `wp_get_environment_type`
- `wp_max_upload_size`
- `wp_version`
- `jetpack_connection_active_plugins` // Connection related callable
- `jetpack_package_versions` // Connection related callable

Passing a list of callables will result in syncing those callables plus the required ones.

Passing an empty array will result in syncing only the required callables.

Not configuring this setting will result in syncing all default callables, as defined by Sync (see `Automattic\Jetpack\Sync\Defaults::$default_callable_whitelist`) 

Same logic applies for the list of multisite callables we sync.

The exception here is that there are no required ones. **Therefore, passing an empty array will result in NOT syncing any multisite callables.**

Not configuring this setting will result in syncing all default multisite callables, as defined by Sync (see `Automattic\Jetpack\Sync\Defaults::$default_multisite_callable_whitelist`)

##### `jetpack_sync_constants_whitelist`

**Controlled by the Sync Constants Module, which is required.**
You can limit the constants to sync by specifying a list of explicit constants as follows:

```
$config->ensure(
    'sync',
    array(
	    'jetpack_sync_constants_whitelist' => array(
			'MY_PLUGIN_CONSTANT'
		),
	)
);
```

It's important to note that we consider a list of certain constants required for Sync to properly function, therefore the following constants will be synced no matter the configuration:

- `ABSPATH`
- `ALTERNATE_WP_CRON`
- `ATOMIC_CLIENT_ID`
- `AUTOMATIC_UPDATER_DISABLED`
- `DISABLE_WP_CRON`
- `DISALLOW_FILE_EDIT`
- `DISALLOW_FILE_MODS`
- `EMPTY_TRASH_DAYS`
- `FS_METHOD`
- `IS_PRESSABLE`
- `PHP_VERSION`
- `WP_ACCESSIBLE_HOSTS`
- `WP_AUTO_UPDATE_CORE`
- `WP_CONTENT_DIR`
- `WP_CRON_LOCK_TIMEOUT`
- `WP_DEBUG`
- `WP_HTTP_BLOCK_EXTERNAL`
- `WP_MAX_MEMORY_LIMIT`
- `WP_MEMORY_LIMIT`
- `WP_POST_REVISIONS`

Passing a list of constants will result in syncing those constants plus the required ones.

Passing an empty array will result in syncing only the required constants.

Not configuring this setting will result in syncing all default constants, as defined by Sync (see `Automattic\Jetpack\Sync\Defaults::$default_constants_whitelist`)

##### `jetpack_sync_post_meta_whitelist`

**Controlled by the Sync Posts Module, which is NOT required. This means that you also need to add the Posts module in `jetpack_sync_modules` otherwise this setting will be ignored.**
You can limit the Post meta to sync by specifying a list of explicit Post meta as follows:

```
$config->ensure(
    'sync',
    array(
    	'jetpack_sync_modules' => array(
			'Automattic\\Jetpack\\Sync\\Modules\\Posts', // Only sync Post related data.
		),
	    'jetpack_sync_post_meta_whitelist' => array(
			'my_custom_post_meta'
		),
	)
);
```

Passing an empty array will result in NOT syncing any Post meta.

Not configuring this setting will result in syncing all default Post meta, as defined by Sync (see `Automattic\Jetpack\Sync\Defaults::$post_meta_whitelist`)

##### `jetpack_sync_comment_meta_whitelist`

**Controlled by the Sync Comments Module, which is NOT required. This means that you also need to add the Comments module in `jetpack_sync_modules` otherwise this setting will be ignored.**
You can limit the Comment meta to sync by specifying a list of explicit Comment meta as follows:

```
$config->ensure(
    'sync',
    array(
    	'jetpack_sync_modules' => array(
			'Automattic\\Jetpack\\Sync\\Modules\\Comments', // Only sync Comment related data.
		),
	    'jetpack_sync_comment_meta_whitelist' => array(
			'my_custom_comment_meta'
		),
	)
);
```

Passing an empty array will result in NOT syncing any Comment meta.

Not configuring this setting will result in syncing all default Comment meta, as defined by Sync (see `Automattic\Jetpack\Sync\Defaults::$comment_meta_whitelist`)

##### `jetpack_sync_capabilities_whitelist`

**Controlled by the Sync Users Module, which is NOT required. This means that you also need to add the Users module in `jetpack_sync_modules` otherwise this setting will be ignored.**
You can limit the capabilities to sync by specifying a list of explicit Comment meta as follows:

```
$config->ensure(
    'sync',
    array(
    	'jetpack_sync_modules' => array(
			'Automattic\\Jetpack\\Sync\\Modules\\Users', // Only sync User related data.
		),
	    'jetpack_sync_capabilities_whitelist' => array(
			'list_users'
		),
	)
);
```

Passing an empty array will result in NOT syncing any capabilities.

Not configuring this setting will result in syncing all default capabilities, as defined by Sync (see `Automattic\Jetpack\Sync\Defaults::$default_capabilities_whitelist`)


## Initial Full Sync

An initial full sync of the site is started when the site is registered or when a user is authorized.

### `Actions::do_only_first_initial_sync`

The `Actions::do_only_first_initial_sync` method can be used to start an initial full sync when a site has not already had a full sync started. This is useful for situations in which a plugin needs to start an initial full sync only if no other plugin has already started one.

## Examples

## Using this package in your WordPress plugin

If you plan on using this package in your WordPress plugin, we would recommend that you use [Jetpack Autoloader](https://packagist.org/packages/automattic/jetpack-autoloader) as your autoloader. This will allow for maximum interoperability with other plugins that use this package as well.

## Security

Need to report a security vulnerability? Go to [https://automattic.com/security/](https://automattic.com/security/) or directly to our security bug bounty site [https://hackerone.com/automattic](https://hackerone.com/automattic).

## License

jetpack-sync is licensed under [GNU General Public License v2 (or later)](./LICENSE.txt)
