<?php
/**
 * Jetpack compatibility for Boost
 *
 * @package automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Compatibility\Jetpack;

require_once __DIR__ . '/lib/class-sync-jetpack-module-status.php';

( new Sync_Jetpack_Module_Status( 'image_cdn', 'photon' ) )->init();

/**
 * Exclude Jetpack likes scripts from deferred JS. They are already in the footer,
 * and are sensitive to having their order changed relative to their companion iframe.
 *
 * The queue handler is listed unconditionally: the Like block and Comment Likes enqueue it
 * without the `likes` module, so is_module_active( 'likes' ) would miss them.
 *
 * @param array $exclusions The default array of scripts to exclude from deferral.
 */
function exclude_jetpack_likes_scripts_defer( $exclusions ) {
	static $likes_enabled = null;

	$exclusions[] = 'jetpack_likes_queuehandler';

	if ( null === $likes_enabled ) {
		$likes_enabled = \Jetpack::is_module_active( 'likes' );
	}

	if ( $likes_enabled ) {
		return array_merge(
			$exclusions,
			array(
				'jquery-core',
				'postmessage',
			)
		);
	}

	return $exclusions;
}

add_filter( 'jetpack_boost_render_blocking_js_exclude_handles', __NAMESPACE__ . '\exclude_jetpack_likes_scripts_defer', 10, 1 );
