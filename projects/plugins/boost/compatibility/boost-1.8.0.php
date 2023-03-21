<?php
/**
 * Compatibility file for changes in Jetpack Boost 1.8.0
 */

/**
 * Migrate module status to the new data sync entry.
 */
function jetpack_boost_180_option_fallback( $value, $option ) {
	$config_name     = str_replace( 'jetpack_boost_ds_module_status_', '', $option );
	$config_name     = str_replace( '_', '-', $config_name );
	$old_option_name = 'jetpack_boost_status_' . $config_name;

	// Avoid recursion by removing the filter. `add_option` will trigger the filter again.
	remove_filter( 'default_option_' . $option, 'jetpack_boost_180_option_fallback', 10, 2 );

	$old_value = get_option( $old_option_name, 'nonexistent' );
	if ( 'nonexistent' !== $old_value ) {
		add_option( $option, $old_value );
		delete_option( $old_option_name );
	}

	return $old_value;
}

add_filter( 'default_option_jetpack_boost_ds_module_status_critical_css', 'jetpack_boost_180_option_fallback', 10, 2 );
add_filter( 'default_option_jetpack_boost_ds_module_status_cloud_css', 'jetpack_boost_180_option_fallback', 10, 2 );
add_filter( 'default_option_jetpack_boost_ds_module_status_render_blocking_js', 'jetpack_boost_180_option_fallback', 10, 2 );
add_filter( 'default_option_jetpack_boost_ds_module_status_lazy_images', 'jetpack_boost_180_option_fallback', 10, 2 );
add_filter( 'default_option_jetpack_boost_ds_module_status_image_guide', 'jetpack_boost_180_option_fallback', 10, 2 );
