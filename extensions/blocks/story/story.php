<?php
/**
 * Story Block.
 *
 * @since 8.6.1
 *
 * @package Jetpack
 */

namespace Automattic\Jetpack\Extensions\Story;

use Jetpack_Gutenberg;

const FEATURE_NAME = 'story';
const BLOCK_NAME   = 'jetpack/' . FEATURE_NAME;

const EMBED_SIZE = array( 180, 320 );

/**
 * Registers the block for use in Gutenberg
 * This is done via an action so that we can disable
 * registration if we need to.
 */
function register_block() {
	jetpack_register_block(
		BLOCK_NAME,
		array( 'render_callback' => __NAMESPACE__ . '\render_block' )
	);
}
add_action( 'init', __NAMESPACE__ . '\register_block' );

/**
 * Add missing `width`, `height`, `srcset` and `sizes` properties to images of the mediaFiles block attributes
 *
 * @param array $media_files  List of media, each as an array containing the media attributes.
 *
 * @return array $media_files
 */
function with_width_height_srcset_and_sizes( $media_files ) {
	return array_map(
		function( $media_file ) {
			if ( ! isset( $media_file['id'] ) || ! empty( $media_file['srcset'] ) ) {
				return $media_file;
			}
			$attachment_id = $media_file['id'];
			$image         = wp_get_attachment_image_src( $attachment_id, EMBED_SIZE, false );
			if ( ! $image ) {
				return $media_file;
			}
			list( $src, $width, $height ) = $image;
			$image_meta                   = wp_get_attachment_metadata( $attachment_id );
			if ( ! is_array( $image_meta ) ) {
				return $media_file;
			}
			$size_array = array( absint( $width ), absint( $height ) );
			return array_merge(
				$media_file,
				array(
					'width'  => absint( $width ),
					'height' => absint( $height ),
					'srcset' => wp_calculate_image_srcset( $size_array, $src, $image_meta, $attachment_id ),
					'sizes'  => '(max-width: 169px) 169w, (max-width: 576px) 576w, (max-width: 768px) 768w, 1080w',
				)
			);
		},
		$media_files
	);
}

/**
 * Render an image inside a slide
 *
 * @param array $media  Image information.
 *
 * @return string
 */
function render_image( $media ) {
	if ( empty( $media['id'] ) || empty( $media['url'] ) ) {
		return __( 'Error retrieving media', 'jetpack' );
	}
	// need to specify the size of the embed so it picks an image that is large enough for the `src` attribute
	// `sizes` is optimized for 1080x1920 (9:16) images
	// Note that the Story block does not have thumbnail support, it will load the right
	// image based on the viewport size only.
	return wp_get_attachment_image(
		$media['id'],
		EMBED_SIZE,
		false,
		array(
			'class' => sprintf( 'wp-story-image wp-image-%d', $media['id'] ),
			'sizes' => '(max-width: 169px) 169w, (max-width: 576px) 576w, (max-width: 768px) 768w, 1080w',
		)
	);
}

/**
 * Render a video inside a slide
 *
 * @param array $media  Video information.
 *
 * @return string
 */
function render_video( $media ) {
	if ( empty( $media['id'] ) || empty( $media['mime'] ) || empty( $media['url'] ) ) {
		return __( 'Error retrieving media', 'jetpack' );
	}
	return sprintf(
		'<video
			title="%1$s"
			type="%2$s"
			class="wp-story-video intrinsic-ignore wp-video-%3$s"
			data-id="%3$s"
			src="%4$s">
		</video>',
		esc_attr( $media['alt'] ),
		esc_attr( $media['mime'] ),
		$media['id'],
		esc_attr( $media['url'] )
	);
}

/**
 * Render a slide
 *
 * @param array $media  Media information.
 * @param array $index  Index of the slide, first slide will be displayed by default, others hidden.
 *
 * @return string
 */
function render_slide( $media, $index = 0 ) {
	$media_template = '';
	switch ( ! empty( $media['type'] ) && $media['type'] ) {
		case 'image':
			$media_template = render_image( $media, $index );
			break;
		case 'video':
			$media_template = render_video( $media, $index );
			break;
	}
	return sprintf(
		'<div class="wp-story-slide" style="display: %s;">
			<figure>
				%s
			</figure>
		</div>',
		0 === $index ? 'block' : 'none',
		$media_template
	);
}

/**
 * Render story block
 *
 * @param array $attributes  Block attributes.
 *
 * @return string
 */
function render_block( $attributes ) {
	Jetpack_Gutenberg::load_assets_as_required( FEATURE_NAME );

	$media_files = isset( $attributes['mediaFiles'] ) ? $attributes['mediaFiles'] : array();

	$settings = array(
		'slides' => with_width_height_srcset_and_sizes( $media_files ),
	);

	return sprintf(
		'<div class="%1$s" data-settings="%2$s">
			<div style="display: contents;">
				<div class="wp-story-container">
					<div class="wp-story-meta">
						<div class="wp-story-icon">
							<img alt="%3$s" src="%4$s" width="32" height=32>
						</div>
						<div>
							<div class="wp-story-title">
								%5$s
							</div>
						</div>
						<button class="wp-story-exit-fullscreen jetpack-mdc-icon-button">
							<i class="jetpack-material-icons close md-24"></i>
						</button>
					</div>
					<div class="wp-story-wrapper">
						%6$s
					</div>
					<div role="button" class="wp-story-overlay wp-story-clickable">
						<div class="wp-story-embed-icon">
							<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" role="img" aria-hidden="true" focusable="false">
								<path d="M0 0h24v24H0z" fill="none"></path>
								<path fill-rule="evenodd" clip-rule="evenodd" d="M6 3H14V17H6L6 3ZM4 3C4 1.89543 4.89543 1 6 1H14C15.1046 1 16 1.89543 16 3V17C16 18.1046 15.1046 19 14 19H6C4.89543 19 4 18.1046 4 17V3ZM18 5C19.1046 5 20 5.89543 20 7V21C20 22.1046 19.1046 23 18 23H10C8.89543 23 8 22.1046 8 21H18V5Z"></path>
							</svg>
							<span>%7$s</span>
						</div>
				</div>
			</div>
		</div>',
		esc_attr( Jetpack_Gutenberg::block_classes( FEATURE_NAME, $attributes, array( 'wp-story', 'aligncenter' ) ) ),
		filter_var( wp_json_encode( $settings ), FILTER_SANITIZE_SPECIAL_CHARS ),
		__( 'Site icon', 'jetpack' ),
		esc_attr( get_site_icon_url( 32, includes_url( 'images/w-logo-blue.png' ) ) ),
		esc_html( get_the_title() ),
		! empty( $media_files[0] ) ? render_slide( $media_files[0] ) : '',
		count( $media_files )
	);
}
