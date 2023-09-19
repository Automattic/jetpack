<?php
/**
 * Blogroll Block.
 *
 * @since 12.1
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\Blogroll;

require_once __DIR__ . '/blogroll-item/blogroll-item.php';

use Automattic\Jetpack\Blocks;
use Jetpack_Gutenberg;

/**
 * Registers the block for use in Gutenberg
 * This is done via an action so that we can disable
 * registration if we need to.
 */
function register_block() {
	Blocks::jetpack_register_block(
		__DIR__,
		array(
			'render_callback'  => __NAMESPACE__ . '\load_assets',
			'provides_context' => array(
				'openLinksNewWindow' => 'open_links_new_window',
			),
		)
	);
}
add_action( 'init', __NAMESPACE__ . '\register_block' );

/**
 * Blogroll block registration/dependency declaration.
 *
 * @param array  $attr    Array containing the Blogroll block attributes.
 * @param string $content String containing the Blogroll block content.
 *
 * @return string
 */
function load_assets( $attr, $content ) {
	global $wp;

	/*
	 * Enqueue necessary scripts and styles.
	 */
	Jetpack_Gutenberg::load_assets_as_required( __DIR__ );

	$current_location = home_url( $wp->request );

	$content = <<<HTML
		<form method="post" action="https://subscribe.wordpress.com" accept-charset="utf-8">
			<input name="action" type="hidden" value="subscribe">
			<input name="source" type="hidden" value="$current_location">
			<input name="sub-type" type="hidden" value="blogroll-follow">
			$content
		</form>
HTML;

	return sprintf(
		'<div class="%1$s">%2$s</div>',
		esc_attr( Blocks::classes( FEATURE_NAME, $attr ) ),
		$content
	);
}
