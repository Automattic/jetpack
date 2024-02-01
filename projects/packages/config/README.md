# Jetpack Configuration

Allows for enabling and initializing of Jetpack features provided by
other packages.

# Usage

Add this package as a dependency to your project:

```
composer require automattic/jetpack-config
```

Add every other package you're planning to configure:

```
composer require automattic/jetpack-sync
composer require automattic/jetpack-options
composer require automattic/jetpack-my-jetpack
```

In your code initialize the configuration package at or before
plugins_loaded priority 1:

```
use Automattic/Jetpack/Config;

// Configuring Jetpack as early as plugins_loaded priority 1
// to make sure every action handler gets properly set.
add_action( 'plugins_loaded', 'configure_jetpack', 1 );

function configure_jetpack() {
    $config = new Config();

    foreach (
        array(
            'sync',
            'tracking',
            'tos',
        )
        as $feature
    ) {
        $config->ensure( $feature );
    }
}
```

# Adding your package to the config class

You can have your package initialized using the Config class by
adding several things.

## The configure method

It's better to have one static configure method in your package
class. That method will be called early on the `plugins_loaded`
hook. This way you can add your own `plugins_loaded` handlers with
standard priority and they will get executed:

```
class Configurable_Package {

    public static function configure() {
        add_action( 'plugins_loaded', array( __CLASS__, 'on_plugins_loaded' );
    }

    public static function on_plugins_loaded() {
        self::do_interesting_stuff();
    }

}
```

## The feature enabling method

An enabling method should be added to the Config class and should only contain your configuration method call.

```

public function enable_configurable_package() {
    Configurable_Package::configure();

    return true;
}
```

Note that the method name should use the feature slug, in this case
your feature slug is `configurable_package` for the sake of
simplicity. When you're adding your feature it should be unique and
recognizable, like `sync` or `tracking`.

## The feature slug

To make sure the feature is supported by the Config class, you need to
add its slug to the config class property:

```
    /**
     * The initial setting values.
     *
     * @var Array
     */
    protected $config = array(
        // ...
        'configurable_package' => false,
        // ...
    );
```

## The ensure_options call

Each consumer will initialize your package from its own instance of the `Config` class, and each consumer can call `$config->ensure( 'your-feature', $options )` passing different options.

Your package will need to handle these options and decide what to do with them when different consumers pass diferent options.

You do that by creating a `ensure_options_{$package_slug}` method to the `Config` class. For example:

```

public function ensure_options_configurable_package() {
    $options = $this->get_feature_options( 'configurable_package' );
    Configurable_Package::handle_initialization_options( $options );
	return true;
}
```

This method will be called every time a different consumer "ensures" your feature and pass some options. It will run BEFORE the `enable_$feature` method is called, so your package must be prepare to receive and treat this options before it is initialized. By the time it is initialized, it should have received all the different options consumers have passed and decided what to do with them.

## The ensure call

Finally you need to add a block that will check if your package is
loaded and mark it to be initialized:

```
if ( $this->config['configurable_package'] ) {
    $this->ensure_class( 'Configurable_Package' ) && $this->ensure_feature( 'configurable_package' );
}
```

This code does three things: it checks whether the current setup has
requested your package to be loaded. Next it checks if the class that
you need for the package to run is present, and then it adds the hook
handlers that initialize your class. After that you can use the config
package's interface in a Jetpack package consumer application and load
your package as shown in the first section of this README.

# Config Package Dependencies

The Config package does not have any composer package dependencies. The consumer plugins must require the packages that they need.

Before using a package class, the Config package will verify that the class exists using the `Config::ensure_class()` method. This allows the consumer plugins to use the Config package to enable and initialize Jetpack features while requiring only the packages that they need.

## Using this package in your WordPress plugin

If you plan on using this package in your WordPress plugin, we would recommend that you use [Jetpack Autoloader](https://packagist.org/packages/automattic/jetpack-autoloader) as your autoloader. This will allow for maximum interoperability with other plugins that use this package as well.

## Security

Need to report a security vulnerability? Go to [https://automattic.com/security/](https://automattic.com/security/) or directly to our security bug bounty site [https://hackerone.com/automattic](https://hackerone.com/automattic).

## License

jetpack-config is licensed under [GNU General Public License v2 (or later)](./LICENSE.txt)
