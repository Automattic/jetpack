<?php
/**
 * Seamlessly migrate to the new options format. Even if no admin hooks are fired as the plugin is updated,
 * the visitor will never notice a difference, because we'll use the old options in the background.
 */
function jetpack_boost_131_option_fallback( $default, $option ) {
	$old_config = get_option( 'jetpack_boost_config' );
	if ( ! $old_config ) {
		return $default;
	}

	$key = str_replace( 'jetpack_boost_state_', '', $option );
	if ( ! isset( $old_config[ $key ] ) || ! isset( $old_config[ $key ]['enabled'] ) ) {
		return $default;
	}

	return (string) $old_config[ $key ]['enabled'];
}

add_filter( 'default_option_jetpack_boost_state_critical-css', 'jetpack_boost_131_option_fallback', 10, 2 );
add_filter( 'default_option_jetpack_boost_state_render-blocking-js', 'jetpack_boost_131_option_fallback', 10, 2 );

/**
 * When something interacts with boost option toggles,
 * silently migrate the options to the new format,
 * that way the code above is never run.
 */
function jetpack_boost_131_option_migration() {

	/**
	 * This function is hooked into add_option
	 * and also is using add_option
	 *
	 * That can cause quite a bit of recursion.
	 * Use static variables to guard that.
	 */
	static $has_run = false;
	if ( false !== $has_run ) {
		return;
	}
	$has_run = true;

	$old_config = get_option( 'jetpack_boost_config' );

	if ( ! $old_config ) {
		return;
	}

	$migration_keys = array( 'critical-css', 'render-blocking-js' );
	foreach ( $migration_keys as $migration_key ) {
		if ( ! isset( $old_config[ $migration_key ] ) || ! isset( $old_config[ $migration_key ]['enabled'] ) ) {
			continue;
		}
		add_option( "jetpack_boost_state_{$migration_key}", $old_config[ $migration_key ]['enabled'] );
	}

	delete_option( 'jetpack_boost_config' );
}

add_action( 'add_option_jetpack_boost_state_critical-css', 'jetpack_boost_131_option_migration', 10, 0 );
add_action( 'add_option_jetpack_boost_state_render-blocking-js', 'jetpack_boost_131_option_migration', 10, 0 );
