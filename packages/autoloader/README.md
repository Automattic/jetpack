Autoloader for Composer
=====================================

This is a custom autoloader generator and class map loader Composer plugin.

It diverges from the default Composer autoloader setup in the following ways:

* It creates a autoload_classmap_package.php file in the vender/composer directory.
* This files includes the version numbers that each package that are being used. 
* The autoloader will only load the latest version of the library no matter what plugin loads the library. 
* Only call the library classes after all the plugins have loaded and the `plugins_loaded` action has fired. 


Usage
-----

In your project's `composer.json`, add the following lines:

```json
{
    "require": {
        "automattic/autoloader": "^1"
    },
    "scripts": {
        "post-install-cmd": [
            "Jetpack\\Autoload\\Generator::dump"
        ],
        "post-update-cmd": [
            "Jetpack\\Autoload\\Generator::dump"
        ],
        "post-autoload-dump": [
            "Jetpack\\Autoload\\Generator::dump"
        ]
    }
}
```

After the next update/install, you will have a `vendor/autoload_packages.php` file. 
Load the file in your plugin via main plugin file.



