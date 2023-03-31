<?php
/**
 * Cookie-consent Block.
 *
 * @since 12.0
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\CookieConsent;

use Automattic\Jetpack\Blocks;
use Jetpack_Gutenberg;

const FEATURE_NAME = 'cookie-consent';
const BLOCK_NAME   = 'jetpack/' . FEATURE_NAME;
const COOKIE_NAME  = 'eucookielaw';

/**
 * Should the block be registered?
 * In wp-admin, we only want to show the block in the site editor.
 *
 * @since 12.0
 *
 * @return bool
 */
function should_register_block() {
	global $pagenow;

	// Always register the widget if we're on the front end
	if ( ! is_admin() ) {
		return true;
	}

	if ( is_admin() && $pagenow === 'site-editor.php' ) {
		return true;
	}
}

/**
 * Registers the block for use in Gutenberg
 * This is done via an action so that we can disable
 * registration if we need to.
 */
function register_block() {
	if ( ! should_register_block() ) {
		return;
	}

	notify_betacache_that_content_changed();

	Blocks::jetpack_register_block(
		BLOCK_NAME,
		array( 'render_callback' => __NAMESPACE__ . '\load_assets' )
	);
}
add_action( 'init', __NAMESPACE__ . '\register_block' );

/**
 * Cookie-consent block registration/dependency declaration.
 *
 * @param array  $attr    Array containing the Cookie-consent block attributes.
 * @param string $content String containing the Cookie-consent block content.
 *
 * @return string
 */
function load_assets( $attr, $content ) {
	// If the user has already accepted the cookie consent, don't show the block.
	if ( isset( $_COOKIE[ COOKIE_NAME ] ) ) {
		return '';
	}

	/*
	 * Enqueue necessary scripts and styles.
	 */
	Jetpack_Gutenberg::load_assets_as_required( FEATURE_NAME );

	return sprintf(
		'<div class="%1$s">%2$s</div>',
		esc_attr( Blocks::classes( FEATURE_NAME, $attr ) ),
		$content
	);
}

/**
 * Since the cookie consent is part of the cached response HTML, it can still render even when the cookie is set (when it shouldn't).
 * Because, by default, the cache doesn't vary around the cookie's value.
 * This let's the cache know that the content has changed to return fresh content.
 */
function notify_betacache_that_content_changed() {
	if ( function_exists( 'vary_cache_on_function' ) ) {
		// Cast the cookie down to a boolean, to avoid arbitrary code execution.
		vary_cache_on_function( 'return isset( $_COOKIE[ "' . COOKIE_NAME . '" ] );' );
	}
}
