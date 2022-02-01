<?php
/**
 * Jetpack compatibility for Boost
 *
 * @package automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Compatibility\Jetpack;

/**
 * Exclude Jetpack likes scripts from deferred JS. They are already in the footer,
 * and are sensitive to having their order changed relative to their companion iframe.
 *
 * @param array $exclusions The default array of scripts to exclude from deferral.
 */
function exclude_jetpack_likes_scripts_defer( $exclusions ) {
	static $likes_enabled = null;

	if ( null === $likes_enabled ) {
		$likes_enabled = \Jetpack::is_module_active( 'likes' );
	}

	if ( $likes_enabled ) {
		return array_merge(
			$exclusions,
			array(
				'jquery-core',
				'postmessage',
				'jetpack_likes_queuehandler',
			)
		);
	}

	return $exclusions;
}

add_filter( 'jetpack_boost_render_blocking_js_exclude_handles', __NAMESPACE__ . '\exclude_jetpack_likes_scripts_defer', 10, 1 );

/**
 * Use Jetpack options as the single source of truth,
 * when Jetpack is active
 *
 * @return string
 */
function lazy_images_override_status() {
	return (string) \Jetpack::is_module_active( 'lazy-images' );
}

add_filter( 'default_option_jetpack_boost_status_lazy-images', __NAMESPACE__ . '\lazy_images_override_status' );
add_filter( 'option_jetpack_boost_status_lazy-images', __NAMESPACE__ . '\lazy_images_override_status' );

/**
 * Forward all lazy image settings changes to Jetpack
 * when interacting with Jetpack Boost dashboard.
 */
function lazy_images_sync_status( $_unused, $new_value ) {
	if ( $new_value ) {
		\Jetpack::activate_module( 'lazy-images', false, false );
	} else {
		\Jetpack::deactivate_module( 'lazy-images' );
	}

	return $new_value;
}

add_action( 'add_option_jetpack_boost_status_lazy-images', __NAMESPACE__ . '\lazy_images_sync_status', 10, 2 );
add_action( 'update_option_jetpack_boost_status_lazy-images', __NAMESPACE__ . '\lazy_images_sync_status', 10, 2 );
