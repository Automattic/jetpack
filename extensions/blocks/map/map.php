<?php
/**
 * Map block.
 *
 * @since 6.8.0
 *
 * @package Jetpack
 */

jetpack_register_block(
	'jetpack/map',
	array(
		'render_callback' => 'jetpack_map_block_load_assets',
	)
);

/**
 * Return the site's own Mapbox access token if set, or the WordPress.com's one otherwise,
 * and its source ("site" or "wpcom").
 *
 * @return array
 */
function jetpack_get_mapbox_api_key() {
	if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
		$endpoint = sprintf(
			'https://public-api.wordpress.com/wpcom/v2/sites/%d/service-api-keys/mapbox',
			get_current_blog_id()
		);
	} else {
		$endpoint = rest_url( 'wpcom/v2/service-api-keys/mapbox' );
	}

	$response      = wp_remote_get( esc_url_raw( $endpoint ) );
	$response_code = wp_remote_retrieve_response_code( $response );

	if ( 200 === $response_code ) {
		$response_body = json_decode( wp_remote_retrieve_body( $response ) );
		return array(
			'token'  => $response_body->service_api_key,
			'source' => $response_body->service_api_key_source,
		);
	}

	return array(
		'token'  => Jetpack_Options::get_option( 'mapbox_api_key' ),
		'source' => 'site',
	);
}

/**
 * Record a Tracks event every time the Map block is loaded on WordPress.com and Atomic.
 *
 * @param string $api_key_source The Mapbox API key's source.
 */
function jetpack_record_mapbox_wpcom_load_event( $api_key_source ) {
	if ( 'wpcom' !== $api_key_source ) {
		return;
	}

	$event_name = 'map_block_mapbox_wpcom_key_load';
	if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
		require_lib( 'tracks/client' );
		tracks_record_event( wp_get_current_user(), $event_name );
	} elseif ( jetpack_is_atomic_site() && Jetpack::is_active() ) {
		$tracking = new Automattic\Jetpack\Tracking();
		$tracking->record_user_event( $event_name );
	}
}

/**
 * Map block registration/dependency declaration.
 *
 * @param array  $attr    Array containing the map block attributes.
 * @param string $content String containing the map block content.
 *
 * @return string
 */
function jetpack_map_block_load_assets( $attr, $content ) {
	$api_key = jetpack_get_mapbox_api_key();

	jetpack_record_mapbox_wpcom_load_event( $api_key['source'] );

	if ( class_exists( 'Jetpack_AMP_Support' ) && Jetpack_AMP_Support::is_amp_request() ) {
		static $map_block_counter = array();

		$id = get_the_ID();
		if ( ! isset( $map_block_counter[ $id ] ) ) {
			$map_block_counter[ $id ] = 0;
		}
		$map_block_counter[ $id ]++;

		$iframe_url = add_query_arg(
			array(
				'map-block-counter' => absint( $map_block_counter[ $id ] ),
				'map-block-post-id' => $id,
			),
			get_permalink()
		);

		$placeholder = preg_replace( '/(?<=<div\s)/', 'placeholder ', $content );

		return sprintf(
			'<amp-iframe src="%s" width="%d" height="%d" layout="responsive" allowfullscreen sandbox="allow-scripts">%s</amp-iframe>',
			esc_url( $iframe_url ),
			4,
			3,
			$placeholder
		);
	}

	Jetpack_Gutenberg::load_assets_as_required( 'map' );

	return preg_replace( '/<div /', '<div data-api-key="' . esc_attr( $api_key['token'] ) . '" ', $content, 1 );
}

/**
 * Render a page containing only a single Map block.
 */
function jetpack_map_block_render_single_block_page() {
	// phpcs:ignore WordPress.Security.NonceVerification
	$map_block_counter = isset( $_GET, $_GET['map-block-counter'] ) ? absint( $_GET['map-block-counter'] ) : null;
	// phpcs:ignore WordPress.Security.NonceVerification
	$map_block_post_id = isset( $_GET, $_GET['map-block-post-id'] ) ? absint( $_GET['map-block-post-id'] ) : null;

	if ( ! $map_block_counter || ! $map_block_post_id ) {
		return;
	}

	/* Create an array of all root-level DIVs that are Map Blocks */
	$post = get_post( $map_block_post_id );

	if ( ! class_exists( 'DOMDocument' ) ) {
		return;
	}

	$post_html = new DOMDocument();
	/** This filter is already documented in core/wp-includes/post-template.php */
	$content = apply_filters( 'the_content', $post->post_content );

	/* Suppress warnings */
	libxml_use_internal_errors( true );
	@$post_html->loadHTML( $content ); // phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged
	libxml_use_internal_errors( false );

	$xpath     = new DOMXPath( $post_html );
	$container = $xpath->query( '//div[ contains( @class, "wp-block-jetpack-map" ) ]' )->item( $map_block_counter - 1 );

	/* Check that we have a block matching the counter position */
	if ( ! $container ) {
		return;
	}

	/* Compile scripts and styles */
	ob_start();

	add_filter( 'jetpack_is_amp_request', '__return_false' );

	Jetpack_Gutenberg::load_assets_as_required( 'map' );
	wp_scripts()->do_items();
	wp_styles()->do_items();

	add_filter( 'jetpack_is_amp_request', '__return_true' );

	$head_content = ob_get_clean();

	/* Put together a new complete document containing only the requested block markup and the scripts/styles needed to render it */
	$block_markup = $post_html->saveHTML( $container );
	$api_key      = jetpack_get_mapbox_api_key();
	$page_html    = sprintf(
		'<!DOCTYPE html><head><style>html, body { margin: 0; padding: 0; }</style>%s</head><body>%s</body>',
		$head_content,
		preg_replace( '/(?<=<div\s)/', 'data-api-key="' . esc_attr( $api_key['token'] ) . '" ', $block_markup, 1 )
	);
	echo $page_html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	exit;
}

add_action( 'wp', 'jetpack_map_block_render_single_block_page' );
