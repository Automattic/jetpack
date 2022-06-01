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
		'jetpack/google-docs-embed',
		array(
			'render_callback' => __NAMESPACE__ . '\docs_render_callback',
		)
	);

	Blocks::jetpack_register_block(
		'jetpack/google-sheets-embed',
		array(
			'render_callback' => __NAMESPACE__ . '\sheets_render_callback',
		)
	);

	Blocks::jetpack_register_block(
		'jetpack/google-slides-embed',
		array(
			'render_callback' => __NAMESPACE__ . '\slides_render_callback',
		)
	);
}
add_action( 'init', __NAMESPACE__ . '\register_blocks' );

/**
 * The block rendering callback.
 *
 * @param [type] $attributes attributes.
 * @param [type] $content The block content for this block.
 * @param string $pattern The pattern to match.
 * @return string
 */
function render_callback( $attributes, $content, $pattern = '' ) {

	$url          = $attributes['url'] ?? '';
	$align        = $attributes['align'] ?? '';
	$aspect_ratio = $attributes['aspectRatio'] ?? '';

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
				'<p class="wp-block-p2-embed__error-msg"><a target="_blank" href="%s">%s %s</a>.</p>',
				esc_url( $url ),
				esc_html__( 'Tap to open embedded document in', 'jetpack' ),
				esc_html( $type )
			);

		} else {
			$loading_markup = '<div class="loader is-active"><span>' . esc_html__( 'Loading...', 'jetpack' ) . '</span></div>';
		}
	}

	$block_classes = [
		$align,
		$aspect_ratio,
	];

	$block_classes = array_filter( $block_classes );

	$html =
		'<figure class="wp-block-p2-embed' . esc_attr( implode( $block_classes ) ) . '">' .
			'<div class="wp-block-p2-embed__wrapper">' .
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

/**
 * Render Google Document block markup.
 *
 * @param array  $attributes Block attributes.
 * @param string $content    Block content.
 *
 * @return string
 */
function docs_render_callback( $attributes, $content ) {

	// Map the doc URL.
	$attributes['url'] = empty( $attributes['url'] ) ? '' : map_gsuite_url( $attributes['url'] );

	$pattern = '/^http[s]?:\/\/((?:www\.)?docs\.google\.com(?:.*)?(?:document)\/[a-z0-9\/\?=_\-\.\,&%$#\@\!\+]*)\/preview/i';

	$classes = Blocks::classes( 'jetpack/google-docs-embed', $attributes );

	return render_callback( $attributes, $content, $pattern );
}

/**
 * Render Google Sheets block markup.
 *
 * @param array  $attributes Block attributes.
 * @param string $content    Block content.
 *
 * @return string
 */
function sheets_render_callback( $attributes, $content ) {

	// Map the sheet URL.
	$attributes['url'] = empty( $attributes['url'] ) ? '' : map_gsuite_url( $attributes['url'] );

	$pattern = '/^http[s]?:\/\/((?:www\.)?docs\.google\.com(?:.*)?(?:spreadsheets)\/[a-z0-9\/\?=_\-\.\,&%$#\@\!\+]*)\/preview/i';

	return render_callback( $attributes, $content, $pattern );
}

/**
 * Render Google Slides block markup.
 *
 * @param array  $attributes Block attributes.
 * @param string $content    Block content.
 *
 * @return string
 */
function slides_render_callback( $attributes, $content ) {

	// Map the presentation URL.
	$attributes['url'] = empty( $attributes['url'] ) ? '' : map_gsuite_url( $attributes['url'] );

	$pattern = '/^http[s]?:\/\/((?:www\.)?docs\.google\.com(?:.*)?(?:presentation)\/[a-z0-9\/\?=_\-\.\,&%$#\@\!\+]*)\/preview/i';

	return render_callback( $attributes, $content, $pattern );
}

