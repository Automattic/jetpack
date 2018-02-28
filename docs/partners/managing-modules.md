# Customizing Jetpack's Modules

Occasionally, hosts have asked how they could customize Jetpack's modules. The documentation below will provide use cases and instructions on how to manage modules.

If you have any questions or issues, our contact information can be found on the [README.md document](README.md).

### How to get a list of modules

Before we can disable or force a module on or off, we need to know the slug of the module we want to modify. To get the slugs, we have a couple of options:modules

1) You can run `wp jetpack module list` to get list of module slugs as well as the status for each module.
2) You can view the PHP files directly in the `modules` directory in Jetpack. Each PHP file that is in the top-level `modules` direcory is loaded as a module. The module slug is the file name minus the extension.

### Disabling modules

In cases where Jetpack has a competing feature with a host, it may be preferable to disable the module in Jetpack. This is easily done via a filter in Jetpack, however, we would caution hosts to consider user experience when making this decision. If a user expects a commonly used module to be available, and it's not, that could cause confusion and a support request for the host and/or Jetpack support.

Now that we've got that warning out of the way, let's get to it!

The filter that we'll use to disable a module is `jetpack_get_available_modules`. You can find documentation as well as an example for that filter here:PHP

[https://developer.jetpack.com/hooks/jetpack_get_available_modules](https://developer.jetpack.com/hooks/jetpack_get_available_modules/)

Here are a couple more alternative examples:

#### Disabling the Photon module

```php
add_filter( 'jetpack_get_available_modules', 'jetpack_docs_filter_module_example' );
function jetpack_docs_filter_module_example( $modules ) {
	if( isset( $modules['photon'] ) ) {
		unset( $modules['photon'] );
	}

	return $modules;
}
```

#### Disabling the Lazy Images module

```php
add_filter( 'jetpack_get_available_modules', 'jetpack_docs_filter_module_example' );
function jetpack_docs_filter_module_example( $modules ) {
	return array_diff_key( $modules, array( 'photon' => 'Does not matter' ) );
}
```

Note: As of Jetpack 5.8.0, there is a regression in filtering out the Photon module. While the module can be filtered out with the code above, the Jetpack admin UI shows an `undefined` string instead of hiding the setting. This behavior also applies to the Lazy Images module which was introduced in 5.8.0. This issue has been fixed in Automattic/jetpack#8780 which should go out in Jetpack 5.9.0.

### Forcing modules to be active

In some cases, a host may decide that forcing a module to be active may be preferable. For example, to minimize bandwidth on the host's server, a host could force the Photon module to be active. In these cases, it is possible to force a module on with the `jetpack_active_modules` filter.

Documentation for that filter can be found at the following URL:preferable

[https://developer.jetpack.com/hooks/jetpack_active_modules](https://developer.jetpack.com/hooks/jetpack_active_modules/)

Here's an example of how to force the Photon module to be activated:preferable

```php
add_filter( 'option_jetpack_active_modules', 'jetpack_docs_filter_active_modules' );
function jetpack_docs_filter_active_modules( $modules ) {
	return array_values( array_merge( $modules, array( 'photon' ) ) );
}
```

Note: The Jetpack admin UI isn't yet aware of this filter. So, if you force a filter to be active, the UI to enable/disable that module still displays. This issue is being tracked at this URL:

[https://github.com/Automattic/jetpack/issues/8800](https://github.com/Automattic/jetpack/issues/8800)
