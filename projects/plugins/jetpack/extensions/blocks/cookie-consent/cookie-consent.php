<?php
/**
 * Cookie-consent Block.
 *
 * @since $$next-version$$
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
 * If the site has ads, it will have its own cookie widget. This function checks if the site has ads.
 *
 * @since $$next-version$$
 *
 * @return bool
 */
function should_use_ads_cookie_widget_instead() {
	return ! ( ( defined( 'NOADVERTS' )
	|| defined( 'NOADSUPGRADE' )
	|| 1 == get_option( 'permanent_noadverts' ) // phpcs:ignore Universal.Operators.StrictComparisons.LooseEqual,WordPress.PHP.StrictComparisons.LooseComparison -- This can be stored as string as well.
	|| ( function_exists( 'has_blog_sticker' ) && has_blog_sticker( 'wordads' ) ) ) ); // Enable widget for WordAds users (regardless of plan).
}

/**
 * Should the block be registered?
 * We do not want to register the block when the site has ads,
 * or when we're not on the frontend.
 * In wp-admin, we only want to show the block in the site editor.
 *
 * @since $$next-version$$
 *
 * @return bool
 */
function should_register_block() {
	return true;
	global $pagenow;

	if ( should_use_ads_cookie_widget_instead() ) {
		return false;
	}

	if (
		is_admin()
		&& $pagenow !== 'site-editor.php'
	) {
		return false;
	}

	return true;
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

