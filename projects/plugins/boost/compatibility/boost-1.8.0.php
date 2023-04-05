<?php
/**
 * Compatibility file for changes in Jetpack Boost 1.8.0
 */

use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Schema;
use Automattic\Jetpack_Boost\Modules\Modules_Index;

/**
 * Migrate module status to the new data sync entry.
 */
function jetpack_boost_180_option_fallback( $value, $option ) {

	$existing_module_status = array_reduce(
		Modules_Index::MODULES,
		function ( $result, $module_class ) {
			$status_schema                       = Schema::as_boolean()->fallback( false );
			$config_name                         = str_replace( '_', '-', $module_class::get_slug() );
			$old_option_name                     = 'jetpack_boost_status_' . $config_name;
			$result[ $module_class::get_slug() ] = $status_schema->parse( get_option( $old_option_name ) );

			delete_option( $old_option_name );

			return $result;
		},
		array()
	);

	// Avoid recursion by removing the filter.
	remove_filter( 'default_option_' . $option, 'jetpack_boost_180_option_fallback', 10, 2 );

	jetpack_boost_ds_set( 'modules_state', $existing_module_status );

	return $existing_module_status;
}

add_filter( 'default_option_jetpack_boost_ds_modules_state', 'jetpack_boost_180_option_fallback', 10, 2 );
