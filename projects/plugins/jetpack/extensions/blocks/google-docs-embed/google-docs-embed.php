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
use Jetpack_Gutenberg;

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
 * @param array $attributes attributes.
 * @return string
 */
function render_callback( $attributes ) {

	Jetpack_Gutenberg::load_assets_as_required( __DIR__ );
	wp_localize_script(
		'jetpack-block-' . sanitize_title_with_dashes( Blocks::get_block_feature( __DIR__ ) ),
		'Jetpack_Google_Docs',
		array(
			'error_msg' => __( 'This document is private. To view the document, log in to a Google account that the document has been shared with and then refresh this page.', 'jetpack' ),
		)
	);

	$url          = empty( $attributes['url'] ) ? '' : map_gsuite_url( $attributes['url'] );
	$aspect_ratio = empty( $attributes['aspectRatio'] ) ? '' : $attributes['aspectRatio'];

	switch ( $attributes['variation'] ) {
		case 'google-docs':
		default:
			$pattern = '/^http[s]?:\/\/((?:www\.)?docs\.google\.com(?:.*)?(?:document)\/[a-z0-9\/\?=_\-\.\,&%$#\@\!\+]*)\/preview/i';
			break;
		case 'google-sheets':
			$pattern = '/^http[s]?:\/\/((?:www\.)?docs\.google\.com(?:.*)?(?:spreadsheets)\/[a-z0-9\/\?=_\-\.\,&%$#\@\!\+]*)\/preview/i';
			break;
		case 'google-slides':
			$pattern = '/^http[s]?:\/\/((?:www\.)?docs\.google\.com(?:.*)?(?:presentation)\/[a-z0-9\/\?=_\-\.\,&%$#\@\!\+]*)\/preview/i';
			break;
	}

	if ( empty( $attributes['url'] ) ) {
		return '';
	}

	if ( $pattern && ! preg_match( $pattern, $url ) ) {
		return '';
	}

	// Add loader for Google Document/Spreadsheets/Presentation blocks.
	$iframe_markup  = '<iframe src="' . esc_url( $url ) . '" allowFullScreen frameborder="0" title="' . esc_html__( 'Google Document Embed', 'jetpack' ) . '" height="450"></iframe>';
	$loading_markup = '';
	$amp_markup     = '';

	if (
		str_contains( $url, '/document/d/' ) ||
		str_contains( $url, '/spreadsheets/d/' ) ||
		str_contains( $url, '/presentation/d/' )
	) {
		if ( function_exists( 'amp_is_request' ) && amp_is_request() ) {

			$type = str_contains( $url, '/document/d/' ) ? __( 'Google Docs', 'jetpack' ) : '';
			$type = empty( $type ) && str_contains( $url, '/spreadsheets/d/' ) ? __( 'Google Sheets', 'jetpack' ) : $type;
			$type = empty( $type ) && str_contains( $url, '/presentation/d/' ) ? __( 'Google Slides', 'jetpack' ) : $type;

			$iframe_markup = '';

			$amp_markup_message = sprintf(
				/* translators: Placeholder is a google product, eg. Google Docs, Google Sheets, or Google Slides. */
				__( 'Tap to open embedded document in %s.', 'jetpack' ),
				esc_html( $type )
			);

			$amp_markup = sprintf(
				'<p class="wp-block-jetpack-google-docs-embed__error-msg"><a target="_blank" rel="noopener noreferrer" href="%s">%s</a></p>',
				esc_url( $url ),
				$amp_markup_message
			);

		} else {
			$loading_markup = '<div class="loader is-active"><span>' . esc_html__( 'Loading...', 'jetpack' ) . '</span></div>';
		}
	}

	$block_classes = Blocks::classes( Blocks::get_block_feature( __DIR__ ), $attributes, array( $aspect_ratio ) );

	$html =
		'<figure class="' . esc_attr( $block_classes ) . '">' .
			'<div class="wp-block-jetpack-google-docs-embed__wrapper">' .
				$loading_markup .
				$amp_markup .
				$iframe_markup .
			'</div>' .
		'</figure>';
	return $html;
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
