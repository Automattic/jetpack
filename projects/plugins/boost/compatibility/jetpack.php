<?php
/**
 * Jetpack compatibility for Boost
 *
 * @package automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Compatibility\Jetpack;

require_once __DIR__ . '/lib/class-sync-jetpack-module-status.php';

( new Sync_Jetpack_Module_Status( 'lazy-images', 'lazy-images' ) )->init();
( new Sync_Jetpack_Module_Status( 'image-cdn', 'photon' ) )->init();

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
