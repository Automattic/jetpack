<?php
/**
 * Map block.
 *
 * @since 6.8.0
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\Map;

use Automattic\Jetpack\Blocks;
use Automattic\Jetpack\Tracking;
use Jetpack;
use Jetpack_Gutenberg;
use Jetpack_Mapbox_Helper;

const FEATURE_NAME = 'map';
const BLOCK_NAME   = 'jetpack/' . FEATURE_NAME;

if ( ! class_exists( 'Jetpack_Mapbox_Helper' ) ) {
	\jetpack_require_lib( 'class-jetpack-mapbox-helper' );
}

/**
 * Registers the block for use in Gutenberg
 * This is done via an action so that we can disable
 * registration if we need to.
 */
function register_block() {
	Blocks::jetpack_register_block(
		BLOCK_NAME,
		array(
			'render_callback' => __NAMESPACE__ . '\load_assets',
		)
	);
}
add_action( 'init', __NAMESPACE__ . '\register_block' );

/**
 * Record a Tracks event every time the Map block is loaded on WordPress.com and Atomic.
 *
 * @param string $access_token_source The Mapbox API access token source.
 */
function wpcom_load_event( $access_token_source ) {
	if ( 'wpcom' !== $access_token_source ) {
		return;
	}

	$event_name = 'map_block_mapbox_wpcom_key_load';
	if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
		jetpack_require_lib( 'tracks/client' );
		tracks_record_event( wp_get_current_user(), $event_name );
	} elseif ( jetpack_is_atomic_site() && Jetpack::is_active() ) {
		$tracking = new Tracking();
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
function load_assets( $attr, $content ) {
	$access_token = Jetpack_Mapbox_Helper::get_access_token();

	wpcom_load_event( $access_token['source'] );

	if ( Blocks::is_amp_request() ) {
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

	// TODO: See if we can skip loading JS if the $attr['isStaticMap'] attribute is set.
	Jetpack_Gutenberg::load_assets_as_required( FEATURE_NAME );

	if ( ! empty( $attr['isStaticMap'] ) && true === boolval( $attr['isStaticMap'] ) ) {
		return render_static_map_image_block( $attr, $content, $access_token['key'] );
	}

	return preg_replace( '/<div /', '<div data-api-key="' . esc_attr( $access_token['key'] ) . '" ', $content, 1 );
}

/**
 * Render a map image using the Mapbox Static Images API
 *
 * @param array  $attr             Array containing the map block attributes.
 * @param string $content          String containing the map block content.
 * @param string $access_token_key Mapbox access token key to be used for the static image API request.
 *
 * @return string Block content markup containing a static image URL.
 */
function render_static_map_image_block( $attr, $content, $access_token_key ) {
	// Set default and passed in values to be used in generating the image url.
	$width        = 1000;
	$height       = isset( $attr['mapHeight'] ) && is_numeric( $attr['mapHeight'] ) ? $attr['mapHeight'] : 400;
	$zoom         = isset( $attr['zoom'] ) && is_numeric( $attr['zoom'] ) ? $attr['zoom'] : 13;
	$bearing      = 0;
	$longitude    = is_numeric( $attr['mapCenter']['lng'] ) ? $attr['mapCenter']['lng'] : -122.41941550000001;
	$latitude     = is_numeric( $attr['mapCenter']['lat'] ) ? $attr['mapCenter']['lat'] : 37.7749295;
	$show_streets = isset( $attr['mapDetails'] ) && false === $attr['mapDetails'] ? false : true;
	$marker_color = 'ff0000'; // Default to bright red.

	// Use custom marker color if provided colour is a valid hex code.
	if ( isset( $attr['markerColor'] ) ) {
		$stripped_color = str_replace( '#', '', $attr['markerColor'] );
		if ( \ctype_xdigit( $stripped_color ) ) {
			$marker_color = $stripped_color;
		}
	}

	// Generate slug for all markers on the map.
	$markers_slug = '';
	if ( ! empty( $attr['points'] ) ) {
		foreach ( $attr['points'] as $point ) {
			$marker  = empty( $markers_slug ) ? '' : ',';
			$marker .= 'pin-s+' . $marker_color;
			if (
				is_numeric( $point['coordinates']['longitude'] ) &&
				is_numeric( $point['coordinates']['latitude'] )
			) {
				$marker       .= sprintf(
					'(%s,%s)',
					$point['coordinates']['longitude'],
					$point['coordinates']['latitude']
				);
				$markers_slug .= $marker;
			}
		}
	}
	if ( ! empty( $markers_slug ) ) {
		$markers_slug .= '/';
	}

	// Set the type of map or map style, known in the Static Image API as an overlay.
	// Default to basic / street overlay.
	$overlay = 'streets-v11';
	if ( isset( $attr['className'] ) ) {
		if ( 'is-style-satellite' === $attr['className'] ) {
			if ( $show_streets ) {
				$overlay = 'satellite-streets-v11';
			} else {
				$overlay = 'satellite-v9';
			}
		}

		if ( 'is-style-black_and_white' === $attr['className'] ) {
			$overlay = 'light-v10';
		}

		if ( 'is-style-terrain' === $attr['className'] ) {
			$overlay = 'outdoors-v11';
		}
	}

	// Generate a Mapbox Image API URL in the appropriate format:
	// https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/pin-s+555555(-77,52),pin-s+555555(-77.5,54)/-77.25,53.0116,6,0/1000x4002x?access_token=YOUR_MAPBOX_ACCESS_TOKEN.

	$url_base       = 'https://api.mapbox.com/styles/v1/mapbox';
	$url_with_paths = "{$url_base}/{$overlay}/static/{$markers_slug}{$longitude},{$latitude},{$zoom},{$bearing}/{$width}x{$height}@2x";

	$url = add_query_arg(
		array(
			'access_token' => $access_token_key,
		),
		$url_with_paths
	);

	// Set alignment class to support wide and full width alignment.
	$class_names = 'wp-block-jetpack-map--static_image';
	if ( isset( $attr['align'] ) ) {
		$class_names .= ' align' . esc_attr( $attr['align'] );
	}

	return sprintf(
		'<div class="%s"><img src="%s" /></div>',
		$class_names,
		$url
	);
}

/**
 * Render a page containing only a single Map block.
 */
function render_single_block_page() {
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

	$post_html = new \DOMDocument();
	/** This filter is already documented in core/wp-includes/post-template.php */
	$content = apply_filters( 'the_content', $post->post_content );

	/* Suppress warnings */
	libxml_use_internal_errors( true );
	@$post_html->loadHTML( $content ); // phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged
	libxml_use_internal_errors( false );

	$xpath     = new \DOMXPath( $post_html );
	$container = $xpath->query( '//div[ contains( @class, "wp-block-jetpack-map" ) ]' )->item( $map_block_counter - 1 );

	/* Check that we have a block matching the counter position */
	if ( ! $container ) {
		return;
	}

	/* Compile scripts and styles */
	ob_start();

	add_filter( 'jetpack_is_amp_request', '__return_false' );

	Jetpack_Gutenberg::load_assets_as_required( FEATURE_NAME );
	wp_scripts()->do_items();
	wp_styles()->do_items();

	add_filter( 'jetpack_is_amp_request', '__return_true' );

	$head_content = ob_get_clean();

	/* Put together a new complete document containing only the requested block markup and the scripts/styles needed to render it */
	$block_markup = $post_html->saveHTML( $container );
	$access_token = Jetpack_Mapbox_Helper::get_access_token();
	$page_html    = sprintf(
		'<!DOCTYPE html><head><style>html, body { margin: 0; padding: 0; }</style>%s</head><body>%s</body>',
		$head_content,
		preg_replace( '/(?<=<div\s)/', 'data-api-key="' . esc_attr( $access_token['key'] ) . '" ', $block_markup, 1 )
	);
	echo $page_html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	exit;
}
add_action( 'wp', __NAMESPACE__ . '\render_single_block_page' );
