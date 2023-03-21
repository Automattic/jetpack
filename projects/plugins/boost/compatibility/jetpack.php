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

add_filter( 'default_option_jetpack_boost_ds_module_status_lazy_images', __NAMESPACE__ . '\lazy_images_override_status' );
add_filter( 'option_jetpack_boost_ds_module_status_lazy_images', __NAMESPACE__ . '\lazy_images_override_status' );

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

add_action( 'add_option_jetpack_boost_ds_module_status_lazy_images', __NAMESPACE__ . '\lazy_images_sync_status', 10, 2 );
add_action( 'update_optionjetpack_boost_ds_module_status_lazy_images', __NAMESPACE__ . '\lazy_images_sync_status', 10, 2 );

/**
 * The compatibility layer uses Jetpack as the single source of truth for lazy images.
 * As a fallback, Boost still keeps track of the value in the database,
 * This ensures that the value is still present when Jetpack is deactivated.
 *
 * This filter is going to track changes to the Jetpack lazy-images option
 * And make sure that Jetpack Boost is in sync.
 */
function lazy_images_sync_with_jetpack() {
	update_option( 'jetpack_boost_ds_module_status_lazy_images', \Jetpack::is_module_active( 'lazy-images' ) );
}

add_action( 'jetpack_deactivate_module_lazy-images', __NAMESPACE__ . '\lazy_images_sync_with_jetpack', 10, 2 );
add_action( 'jetpack_activate_module_lazy-images', __NAMESPACE__ . '\lazy_images_sync_with_jetpack', 10, 2 );

/**
 * Update the Jetpack Boost option to match the Jetpack option,
 * in case the options are out of sync when the page is loaded.
 */
add_action( 'load-jetpack_page_jetpack-boost', __NAMESPACE__ . '\lazy_images_sync_with_jetpack' );

/**
 * Disable the unpackaged photon version living in Jetpack.
 *
 * We added image CDN on boost by copying the photon functionality in Jetpack to a new package in monorepo.
 * At the time of writing, Jetpack still has the photon functionality in the Jetpack plugin. To avoid double
 * activation, we need to disable the photon functionality in Jetpack. If boost is installed, Image CDN should
 * be served instead.
 */
function jetpack_photon_compat() {
	remove_filter( 'jetpack_photon_url', 'jetpack_photon_url', 10, 3 );
	remove_filter( 'jetpack_photon_pre_args', 'jetpack_photon_parse_wpcom_query_args', 10, 2 );
	remove_filter( 'jetpack_photon_skip_for_url', 'jetpack_photon_banned_domains', 9, 2 );
	remove_filter( 'widget_text', 'jetpack_photon_support_text_widgets' );

	// If photon is active, fake loading the module in Jetpack itself. This will prevent jetpack from loading
	// the photon module, and we will use the image CDN package instead.
	if ( \Jetpack::is_module_active( 'photon' ) ) {
		do_action( 'jetpack_module_loaded_photon' );
	}
}

// This compatibility file loads on plugins loaded. So, this is the right time to disable photon.
jetpack_photon_compat();
