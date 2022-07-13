<?php
/**
 * GSuite Block.
 *
 * @since TBD
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\GoogleDocsEmbed;

use Automattic\Jetpack\Blocks;
use Jetpack_Gutenberg;

const FEATURE_NAME = 'google-docs-embed';

/**
 * Add custom rest endpoints
 */
function add_endpoints() {
	register_rest_route(
		'gsuite/v1',
		'/checkDocumentVisibility',
		array(
			'methods'             => 'GET',
			'callback'            => __NAMESPACE__ . '\check_document_visibility',
			'permission_callback' => '__return_true',
		)
	);
}
add_action( 'rest_api_init', __NAMESPACE__ . '\add_endpoints' );

/**
 * Check URL
 *
 * @param \WP_REST_Request $request request object.
 *
 * @return \WP_REST_Response|\WP_Error
 */
function check_document_visibility( $request ) {

	$document_url       = $request->get_param( 'url' );
	$document_url       = map_gsuite_url( $document_url );
	$response_head      = wp_safe_remote_head( $document_url );
	$is_public_document = ! is_wp_error( $response_head ) && ! empty( $response_head['response']['code'] ) && 200 === absint( $response_head['response']['code'] );

	if ( ! $is_public_document ) {
		return new \WP_Error( 'Unauthorized', 'The document is not publicly accessible', array( 'status' => 401 ) );
	}

	return new \WP_REST_Response( '', 200 );
}

/**
 * Registers the blocks for use in Gutenberg
 * This is done via an action so that we can disable
 * registration if we need to.
 */
function register_blocks() {

	Blocks::jetpack_register_block(
		'jetpack/' . FEATURE_NAME,
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

	$url          = empty( $attributes['url'] ) ? '' : map_gsuite_url( $attributes['url'] );
	$align        = empty( $attributes['align'] ) ? '' : $attributes['align'];
	$aspect_ratio = empty( $attributes['aspectRatio'] ) ? '' : $attributes['aspectRatio'];

	Jetpack_Gutenberg::load_assets_as_required( FEATURE_NAME );

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

	// The class name that affects alignment is called alignwide, alignfull, etc
	$align        = $align ? " align$align" : '';
	$aspect_ratio = $aspect_ratio ? " $aspect_ratio" : '';

	if ( '' === $attributes['url'] ) {
		return '';
	}

	if ( $pattern && ! preg_match( $pattern, $url ) ) {
		return '';
	}

	// Add loader for Google Document/Spreadsheets/Presentation blocks.
	$iframe_markup  = '<iframe src="' . esc_url( $url ) . '" allowFullScreen frameborder="0" title="An embed" height="450"></iframe>';
	$loading_markup = '';
	$amp_markup     = '';

	if (
		false !== strpos( $url, '/document/d/' ) ||
		false !== strpos( $url, '/spreadsheets/d/' ) ||
		false !== strpos( $url, '/presentation/d/' )
	) {
		if ( function_exists( 'amp_is_request' ) && amp_is_request() ) {

			$type = false !== strpos( $url, '/document/d/' ) ? __( 'Google Docs', 'jetpack' ) : '';
			$type = empty( $type ) && false !== strpos( $url, '/spreadsheets/d/' ) ? __( 'Google Sheets', 'jetpack' ) : $type;
			$type = empty( $type ) && false !== strpos( $url, '/presentation/d/' ) ? __( 'Google Slides', 'jetpack' ) : $type;

			$iframe_markup = '';
			$amp_markup    = sprintf(
				'<p class="wp-block-jetpack-google-docs-embed__error-msg"><a target="_blank" href="%s">%s %s</a>.</p>',
				esc_url( $url ),
				esc_html__( 'Tap to open embedded document in', 'jetpack' ),
				esc_html( $type )
			);

		} else {
			$loading_markup = '<div class="loader is-active"><span>' . esc_html__( 'Loading...', 'jetpack' ) . '</span></div>';
		}
	}

	$block_classes = Blocks::classes( FEATURE_NAME, $attributes );

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
