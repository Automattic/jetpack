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
		array( 'render_callback' => __NAMESPACE__ . '\load_assets' )
	);
}
add_action( 'init', __NAMESPACE__ . '\register_block' );

/**
 * Story block registration/dependency declaration.
 *
 * @param array $attributes  Array containing the story block attributes.
 *
 * @return string
 */
function load_assets( $attributes ) {
	Jetpack_Gutenberg::load_assets_as_required( FEATURE_NAME );

	return render( $attributes );
}

/**
 * Render story block
 *
 * @param array $attributes Array containing the story block attributes.
 *
 * @return string
 */
function render( $attributes ) {
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
		'loadInFullScreen' => ! is_page() && is_singular(),
	);

	$media_files = isset( $attributes['mediaFiles'] ) ? $attributes['mediaFiles'] : array();

	return sprintf(
		'<div class="wp-block-jetpack-story wp-story aligncenter" data-settings="%s">
			<div class="wp-block-jetpack-story_container wp-story-container" style="display: block; opacity: 1;">
				<div class="wp-story-meta">
					<div class="wp-story-icon">
						<img alt="Site icon" src="%s" width="32" height=32>
					</div>
					<div>
						<div class="wp-story-site-name">
							%s
						</div>
						<div class="wp-story-site-description">
							%s
						</div>
					</div>
					<button class="wp-story-exit-fullscreen mdc-icon-button" aria-label="Exit Fullscreen" aria-pressed="false">
						<i class="material-icons close md-24"></i>
					</button>
				</div>
				<ul class="wp-story-wrapper">
					%s
				</ul>
				<div class="wp-story-pagination wp-story-pagination-bullets"></div>
			</div>
		</div>',
		filter_var( wp_json_encode( $settings ), FILTER_SANITIZE_SPECIAL_CHARS ),
		esc_attr( get_site_icon_url( 32, includes_url( 'images/w-logo-blue.png' ) ) ),
		esc_html( get_bloginfo( 'name' ) ),
		esc_html( get_bloginfo( 'description' ) ),
		join( "\n", array_map( $get_slide_template, $media_files, array_keys( $media_files ) ) )
	);
}
