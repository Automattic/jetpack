<?php
/**
 * Story Block.
 *
 * @since 8.6.1
 *
 * @package Jetpack
 */

namespace Automattic\Jetpack\Extensions\Story;

use Jetpack_AMP_Support;
use Jetpack_Gutenberg;

const FEATURE_NAME = 'story';
const BLOCK_NAME   = 'jetpack/' . FEATURE_NAME;

/**
 * Registers the block for use in Gutenberg
 * This is done via an action so that we can disable
 * registration if we need to.
 */
function register_block() {
	jetpack_register_block(
		BLOCK_NAME,
		array( 'render_callback' => __NAMESPACE__ . '\render' )
	);
}
add_action( 'init', __NAMESPACE__ . '\register_block' );

/**
 * Render story block
 *
 * @param array $attributes  Block attributes.
 *
 * @return string
 */
function render( $attributes ) {
	Jetpack_Gutenberg::load_assets_as_required( FEATURE_NAME );

	$get_image_template = function( $media, $index ) {
		if ( ! isset( $media['id'] ) || ! isset( $media['url'] ) ) {
			return 'Error retrieving media';
		}
		return sprintf(
			'<img
				alt="%s"
				class="wp-block-jetpack-story_image wp-story-image wp-image-%d"
				data-id="%d"
				src="%s">',
			esc_attr( $media['alt'] ),
			$index,
			$media['id'],
			esc_attr( $media['url'] )
		);
	};
	$get_video_template = function( $media, $index ) {
		if ( ! isset( $media['id'] ) || ! isset( $media['mime'] ) || ! isset( $media['url'] ) ) {
			return 'Error retrieving media';
		}
		return sprintf(
			'<video
				title="%s"
				type="%s"
				class="wp-block-jetpack-story_video wp-story-video intrinsic-ignore wp-video-%d"
				data-id="%d"
				src="%s">
			</video>',
			esc_attr( $media['alt'] ),
			esc_attr( $media['mime'] ),
			$index,
			$media['id'],
			esc_attr( $media['url'] )
		);
	};
	$get_slide_template = function( $media, $index ) use ( $get_image_template, $get_video_template ) {
		return sprintf(
			'<li class="wp-block-jetpack-story_slide wp-story-slide" style="display: %s;">
				<figure>
					%s
				</figure>
			</li>',
			0 === $index ? 'block' : 'none',
			'image' === $media['type']
				? $get_image_template( $media, $index )
				: $get_video_template( $media, $index )
		);
	};
	$settings           = array(
		'loadInFullscreen' => ! is_page() && is_singular(),
	);

	$media_files = isset( $attributes['mediaFiles'] ) ? $attributes['mediaFiles'] : array();

	return sprintf(
		'<div class="wp-block-jetpack-story wp-story aligncenter" data-settings="%s">
			<div class="wp-story-container">
				<div class="wp-story-meta">
					<div class="wp-story-icon">
						<img alt="%s" src="%s" width="32" height=32>
					</div>
					<div>
						<div class="wp-story-title">
							%s
						</div>
					</div>
					<button class="wp-story-exit-fullscreen jetpack-mdc-icon-button">
						<i class="jetpack-material-icons close md-24"></i>
					</button>
				</div>
				<ul class="wp-story-wrapper">
					%s
				</ul>
				<div class="wp-story-overlay">
					<button class="jetpack-mdc-icon-button circle-icon outlined bordered" aria-label="%s" aria-pressed="false">
						<i class="jetpack-material-icons play_arrow" style="font-size: 56px;"></i>
					</button>
				</div>
			</div>
		</div>',
		filter_var( wp_json_encode( $settings ), FILTER_SANITIZE_SPECIAL_CHARS ),
		__( 'Site icon', 'jetpack' ),
		esc_attr( get_site_icon_url( 32, includes_url( 'images/w-logo-blue.png' ) ) ),
		esc_html( get_the_title() ),
		join( "\n", array_map( $get_slide_template, $media_files, array_keys( $media_files ) ) ),
		__( 'Exit Fullscreen', 'jetpack' )
	);
}
