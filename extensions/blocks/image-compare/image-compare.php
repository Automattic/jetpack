<?php
/**
 * Image Compare Block.
 *
 * @since 8.6
 *
 * @package Jetpack
 */

namespace Automattic\Jetpack\Extensions\ImageCompare;

use Jetpack_AMP_Support;
use Jetpack_Gutenberg;

const FEATURE_NAME = 'image-compare';
const BLOCK_NAME   = 'jetpack/' . FEATURE_NAME;

/**
 * Registers the block for use in Gutenberg
 * This is done via an action so that we can disable
 * registration if we need to.
 */
function register_block() {
	jetpack_register_block(
		BLOCK_NAME,
		array( 'render_callback' => __NAMESPACE__ . '\load_assets' )
	);
}
add_action( 'init', __NAMESPACE__ . '\register_block' );

/**
 * Image Compare block registration/dependency declaration.
 *
 * @param array  $attr    Array containing the image-compare block attributes.
 * @param string $content String containing the image-compare block content.
 *
 * @return string
 */
function load_assets( $attr, $content ) {
	Jetpack_Gutenberg::load_assets_as_required( FEATURE_NAME );
	if ( class_exists( 'Jetpack_AMP_Support' ) && Jetpack_AMP_Support::is_amp_request() ) {
		return render_amp( $attr, $content );
	}

	return $content;
}


/**
 * Render image compare block for AMP
 *
 * @param array  $attr    Array containing the image-compare block attributes.
 * @param string $content String containing the image-compare block content.
 *
 * @return string
 */
function render_amp( $attr, $content ) {
	// Attributes that are parsed in JavaScript are not passed in, so to get
	// the URLs we need to parse the content in PHP, which is rather lame.
	preg_match_all( '/src="([^"]+)"/', $content, $imgs );
	if ( empty( $imgs ) || ( count( $imgs ) < 2 ) || empty( $imgs[1] ) || ( count( $imgs[1] ) < 2 ) ) {
		return '';
	}
	return sprintf(
		'<amp-image-slider layout="responsive" width="300" height="200"><amp-img src="%s" layout="fill"></amp-img><amp-img src="%s" layout="fill"></amp-img></amp-image-slider>',
		$imgs[1][0],
		$imgs[1][1]
	);
}
