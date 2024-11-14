## Mu-plugin support

WordPress does not provide user interface for installing and uninstalling mu-plugins. Further, mu-plugins that aren't already a single file need a "loader" that is a single file placed in the mu-plugins directory (generally `wp-content/mu-plugins/`). While there are many ways this can be done, Jetpack Beta Tester makes some assumptions about how mu-plugins it supports are installed:

* The directory of code for the mu-plugin is located in the mu-plugins directory and named after the plugin slug, similar to how plugins are installed. So, for example, a plugin with slug "wpcomsh" would be at `wp-content/mu-plugins/wpcomsh/`.
* The corresponding loader file is named with the plugin slug with `-loader.php` appended. So, for example, a plugin with slug "wpcomsh" would have its loader named `wp-content/mu-plugins/wpcomsh-loader.php`.

If your installation of the mu-plugin does not follow these conventions, attempting to use Jetpack Beta Tester to install development versions of the mu-plugin may result in multiple versions of the plugin being active simultaneously, which will very likely break your site.

Also, be aware that Jetpack Beta Tester will not enable a stable version of a mu-plugin for you. You will have to follow the plugin's instructions for creating the loader to properly enable it.

Jetpack Beta Tester will not auto-update mu-plugins, nor will it prompt when updates are available. WordPress core's plugin update infrastructure does not handle mu-plugins, so we can't hook into it like we do normal plugins.

When a development version is active and no stable version directory exists, a "Deactivate" button will be provided in the UI to easily deactivate the development version.
If a stable directory does exist, only the usual button to activate it will be provided; if you want to deactivate the mu-plugin in this situation, do so in the normal manner by removing the loader file.

### How it works

For those interested in the details of how Jetpack Beta Tester manages mu-plugins, read on.

When installing mu-plugins, Jetpack Beta Tester will unpack them into the mu-plugins directory in the same manner that it unpacks normal plugins into the plugins directory. It even uses WordPress core's `Plugin_Upgrader` class to do most of the work, hooking the 'upgrader_package_options' filter to change the destination from WP_PLUGIN_DIR to WPMU_PLUGIN_DIR.

Activation is done via the loader file:

* If the loader file exists then Jetpack Beta Tester assumes that either a stable or dev version is active.
  * While this may not be entirely accurate for something like wpcomsh where its standard loader checks the `IS_ATOMIC` constant before actually loading, it's good enough for our purposes.
* To activate a dev version, Jetpack Beta Tester changes the opening `<?php` of the loader file to `<?php /* Load Jetpack Beta dev version: */ return require __DIR__ . '/plugin-dev/main.php';`. The presence of this snippet at the start of the loader file indicates that the dev version is active rather than any available stable version.
  * If no loader file exists, Jetpack Beta Tester creates a stub loader to add the snippet to.
* To deactivate a dev version (either to reactivate the stable version or to deactivate the mu-plugin entirely), Jetpack Beta Tester removes the snippet.
  * If the loader file matches the stub that Jetpack Beta Tester creates, the loader file is then deleted.
