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

const EMBED_SIZE        = array( 180, 320 );
const CROP_UP_TO        = 0.2;
const IMAGE_BREAKPOINTS = '(max-width: 460px) 576w, (max-width: 614px) 768w, 120vw'; // 120vw to match the 20% CROP_UP_TO ratio

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
			if ( 'image' === $media_file['type'] ) {
				$image = wp_get_attachment_image_src( $attachment_id, EMBED_SIZE, false );
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
						'sizes'  => IMAGE_BREAKPOINTS,
					)
				);
			} else {
				$video_meta = wp_get_attachment_metadata( $attachment_id );
				if ( ! isset( $video_meta['width'] ) || ! isset( $video_meta['width'] ) ) {
					return $media_file;
				}
				$url         = ! empty( $video_meta['original']['url'] ) ? $video_meta['original']['url'] : $media_file['url'];
				$description = ! empty( $video_meta['videopress']['description'] ) ? $video_meta['videopress']['description'] : $media_file['alt'];
				return array_merge(
					$media_file,
					array(
						'width'  => absint( $video_meta['width'] ),
						'height' => absint( $video_meta['height'] ),
						'alt'    => $description,
						'url'    => $url,
					)
				);
			}
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
	$image      = wp_get_attachment_image_src( $media['id'], 'full', false );
	$crop_class = '';
	if ( $image ) {
		list( , $width, $height ) = $image;
		$crop_class               = get_image_crop_class( $width, $height );
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
			'class' => sprintf( 'wp-story-image wp-image-%d %s', $media['id'], $crop_class ),
			'sizes' => IMAGE_BREAKPOINTS,
		)
	);
}

/**
 * Return the css crop class if image width and height requires it
 *
 * @param array $width  Image width.
 * @param array $height  Image height.
 *
 * @return string The CSS class which will display a cropped image
 */
function get_image_crop_class( $width, $height ) {
	$crop_class          = '';
	$media_aspect_ratio  = $width / $height;
	$target_aspect_ratio = EMBED_SIZE[0] / EMBED_SIZE[1];
	if ( $media_aspect_ratio >= $target_aspect_ratio ) {
		// image wider than canvas.
		$media_too_wide_to_crop = $media_aspect_ratio > $target_aspect_ratio / ( 1 - CROP_UP_TO );
		if ( ! $media_too_wide_to_crop ) {
			$crop_class = 'wp-story-crop-wide';
		}
	} else {
		// image narrower than canvas.
		$media_too_narrow_to_crop = $media_aspect_ratio < $target_aspect_ratio * ( 1 - CROP_UP_TO );
		if ( ! $media_too_narrow_to_crop ) {
			$crop_class = 'wp-story-crop-narrow';
		}
	}
	return $crop_class;
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

	$metadata = wp_get_attachment_metadata( $media['id'] );
	if ( ! empty( $metadata ) && ! empty( $metadata['videopress'] ) ) {
		$poster_url  = $metadata['videopress']['poster'];
		$description = ! empty( $metadata['videopress']['description'] ) ? $metadata['videopress']['description'] : '';
		return sprintf(
			'<img
				alt="%s"
				class="wp-block-jetpack-story_image wp-story-image %s"
				src="%s">',
			esc_attr( $description ),
			get_image_crop_class( $metadata['videopress']['width'], $metadata['videopress']['height'] ),
			esc_attr( $poster_url )
		);
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
	$media_type     = ! empty( $media['type'] ) ? $media['type'] : null;
	if ( ! $media_type ) {
		return '';
	}
	switch ( $media_type ) {
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
 * Render the top right icon on top of the story embed
 *
 * @param array $settings The block settings.
 *
 * @return string
 */
function render_top_right_icon( $settings ) {
	$show_slide_count = isset( $settings['showSlideCount'] ) ? $settings['showSlideCount'] : false;
	$slide_count      = isset( $settings['slides'] ) ? count( $settings['slides'] ) : 0;
	if ( $show_slide_count ) {
		// Render the story block icon along with the slide count.
		return sprintf(
			'<div class="wp-story-embed-icon">
				<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" role="img" aria-hidden="true" focusable="false">
					<path d="M0 0h24v24H0z" fill="none"></path>
					<path fill-rule="evenodd" clip-rule="evenodd" d="M6 3H14V17H6L6 3ZM4 3C4 1.89543 4.89543 1 6 1H14C15.1046 1 16 1.89543 16 3V17C16 18.1046 15.1046 19 14 19H6C4.89543 19 4 18.1046 4 17V3ZM18 5C19.1046 5 20 5.89543 20 7V21C20 22.1046 19.1046 23 18 23H10C8.89543 23 8 22.1046 8 21H18V5Z"></path>
				</svg>
				<span>%d</span>
			</div>',
			$slide_count
		);
	} else {
		// Render the Fullscreen Gridicon.
		return (
			'<div class="wp-story-embed-icon-expand">
				<svg class="gridicon gridicons-fullscreen" height="24" width="24" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
					<g>
						<path d="M21 3v6h-2V6.41l-3.29 3.3-1.42-1.42L17.59 5H15V3zM3 3v6h2V6.41l3.29 3.3 1.42-1.42L6.41 5H9V3zm18 18v-6h-2v2.59l-3.29-3.29-1.41 1.41L17.59 19H15v2zM9 21v-2H6.41l3.29-3.29-1.41-1.42L5 17.59V15H3v6z"></path>
					</g>
				</svg>
			</div>'
		);
	}
}

/**
 * Render a pagination bullet
 *
 * @param array $slide_index The slide index it corresponds to.
 *
 * @return string
 */
function render_pagination_bullet( $slide_index ) {
	return sprintf(
		'<a href="#" class="wp-story-pagination-bullet" aria-label="%s">
			<div class="wp-story-pagination-bullet-bar"></div>
		</a>',
		/* translators: %d is the slide number (1, 2, 3...) */
		sprintf( __( 'Go to slide %d', 'jetpack' ), $slide_index )
	);
}

/**
 * Render pagination on top of the story embed
 *
 * @param array $settings The block settings.
 *
 * @return string
 */
function render_pagination( $settings ) {
	$show_slide_count = isset( $settings['showSlideCount'] ) ? $settings['showSlideCount'] : false;
	if ( $show_slide_count ) {
		return '';
	}
	$slide_count = isset( $settings['slides'] ) ? count( $settings['slides'] ) : 0;
	return sprintf(
		'<div class="wp-story-pagination wp-story-pagination-bullets">
			%s
		</div>',
		join( "\n", array_map( __NAMESPACE__ . '\render_pagination_bullet', range( 1, $slide_count ) ) )
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

	$media_files              = isset( $attributes['mediaFiles'] ) ? $attributes['mediaFiles'] : array();
	$settings_from_attributes = isset( $attributes['settings'] ) ? $attributes['settings'] : array();

	$settings = array_merge(
		$settings_from_attributes,
		array(
			'slides' => with_width_height_srcset_and_sizes( $media_files ),
		)
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
						<a class="wp-story-exit-fullscreen jetpack-mdc-icon-button">
							<i class="jetpack-material-icons close md-24"></i>
						</a>
					</div>
					<div class="wp-story-wrapper">
						%6$s
					</div>
					<a class="wp-story-overlay" href="%7$s">
						%8$s
					</a>
					%9$s
				</div>
			</div>
		</div>',
		esc_attr( Jetpack_Gutenberg::block_classes( FEATURE_NAME, $attributes, array( 'wp-story', 'aligncenter' ) ) ),
		filter_var( wp_json_encode( $settings ), FILTER_SANITIZE_SPECIAL_CHARS ),
		__( 'Site icon', 'jetpack' ),
		esc_attr( get_site_icon_url( 32, includes_url( 'images/w-logo-blue.png' ) ) ),
		esc_html( get_the_title() ),
		! empty( $media_files[0] ) ? render_slide( $media_files[0] ) : '',
		get_permalink(),
		render_top_right_icon( $settings ),
		render_pagination( $settings )
	);
}
