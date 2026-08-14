<?php
/**
 * GSuite Block.
 *
 * @since 11.3
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\GoogleDocsEmbed;

use Automattic\Jetpack\Blocks;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Registers the blocks for use in Gutenberg
 * This is done via an action so that we can disable
 * registration if we need to.
 */
function register_blocks() {

	Blocks::jetpack_register_block(
		__DIR__,
		array(
			'render_callback' => __NAMESPACE__ . '\render_callback',
		)
	);
}
add_action( 'init', __NAMESPACE__ . '\register_blocks' );

/**
 * The block rendering callback.
 *
 * The render implementation lives in render.php and is only loaded when the
 * block is actually rendered, keeping it out of the eager front-end path.
 *
 * @param array $attributes attributes.
 * @return string
 */
function render_callback( $attributes ) {
	require_once __DIR__ . '/render.php';
	return render_callback_implementation( $attributes );
}

/**
 * Convert GSuite URL to a preview URL.
 *
 * @param string $url The URL of the published Doc/Spreadsheet/Presentation.
 *
 * @return string
 */
function map_gsuite_url( $url ) {

	// Default regex for all the URLs.
	$gsuite_regex = '/^(http|https):\/\/(docs\.google.com)\/(spreadsheets|document|presentation)\/d\/([A-Za-z0-9_-]+).*?$/i';

	/**
	 * Check if the URL is valid.
	 *
	 * If not, return the original URL as is.
	 */
	preg_match( $gsuite_regex, $url, $matches );
	if (
		empty( $matches ) ||
		empty( $matches[1] ) ||
		empty( $matches[2] ) ||
		empty( $matches[3] ) ||
		empty( $matches[4] )
	) {
		return $url;
	}

	return "{$matches[1]}://$matches[2]/$matches[3]/d/$matches[4]/preview";
}
