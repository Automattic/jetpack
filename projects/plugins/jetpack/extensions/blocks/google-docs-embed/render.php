<?php
/**
 * Google Docs Embed block render implementation.
 *
 * Loaded lazily from google-docs-embed.php only when the block is rendered, to
 * keep the render body out of the eager front-end PHP/opcache footprint.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\GoogleDocsEmbed;

use Automattic\Jetpack\Blocks;
use Jetpack_Gutenberg;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/*
 * map_gsuite_url() lives in google-docs-embed.php (a WPCOM v2 endpoint calls it
 * directly). It is normally loaded before this file via the render wrapper, but
 * guard against this file being required on its own so it never fatals.
 */
if ( ! function_exists( __NAMESPACE__ . '\\map_gsuite_url' ) ) {
	require_once __DIR__ . '/google-docs-embed.php';
}

/**
 * The block rendering implementation.
 *
 * @param array $attributes attributes.
 * @return string
 */
function render_callback_implementation( $attributes ) {
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

	switch ( str_replace( 'jetpack/', '', $attributes['variation'] ?? 'google-docs' ) ) {
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

	if ( ! preg_match( $pattern, $url ) ) {
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
