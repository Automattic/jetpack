<?php
/**
 * Story Block.
 *
 * @since 8.6.1
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\Story;

use Automattic\Jetpack\Blocks;
use Jetpack;
use Jetpack_Gutenberg;

const FEATURE_NAME = 'story';
const BLOCK_NAME   = 'jetpack/' . FEATURE_NAME;

const EMBED_SIZE        = array( 180, 320 );
const CROP_UP_TO        = 0.2;
const MAX_BULLETS       = 7;
const IMAGE_BREAKPOINTS = '(max-width: 460px) 576w, (max-width: 614px) 768w, 120vw'; // 120vw to match the 20% CROP_UP_TO ratio

/**
 * Registers the block for use in Gutenberg
 * This is done via an action so that we can disable
 * registration if we need to.
 */
function register_block() {
	Blocks::jetpack_register_block(
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
		function ( $media_file ) {
			if ( ! isset( $media_file['id'] ) || ! empty( $media_file['srcset'] ) ) {
				return $media_file;
			}
			$attachment_id = $media_file['id'];
			if ( 'image' === $media_file['type'] ) {
				$image = wp_get_attachment_image_src( $attachment_id, 'full', false );
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
						'width'   => absint( $width ),
						'height'  => absint( $height ),
						'srcset'  => wp_calculate_image_srcset( $size_array, $src, $image_meta, $attachment_id ),
						'sizes'   => IMAGE_BREAKPOINTS,
						'title'   => get_the_title( $attachment_id ),
						'alt'     => get_post_meta( $attachment_id, '_wp_attachment_image_alt', true ),
						'caption' => wp_get_attachment_caption( $attachment_id ),
					)
				);
			} else {
				$video_meta = wp_get_attachment_metadata( $attachment_id );
				if ( ! isset( $video_meta['width'] ) || ! isset( $video_meta['height'] ) ) {
					return $media_file;
				}
				$url         = ! empty( $video_meta['original']['url'] ) ? $video_meta['original']['url'] : $media_file['url'];
				$description = ! empty( $video_meta['videopress']['description'] ) ? $video_meta['videopress']['description'] : $media_file['alt'];
				$media_file  = array_merge(
					$media_file,
					array(
						'width'   => absint( $video_meta['width'] ),
						'height'  => absint( $video_meta['height'] ),
						'alt'     => $description,
						'url'     => $url,
						'title'   => get_the_title( $attachment_id ),
						'caption' => wp_get_attachment_caption( $attachment_id ),
					)
				);

				// Set the poster attribute for the video tag if a poster image is available.
				if ( ! empty( $video_meta['videopress']['poster'] ) ) {
					$poster_url = $video_meta['videopress']['poster'];
				} elseif ( ! empty( $video_meta['thumb'] ) ) {
					$video_url  = wp_get_attachment_url( $attachment_id );
					$poster_url = str_replace( wp_basename( $video_url ), $video_meta['thumb'], $video_url );
				}

				if ( $poster_url ) {
					$poster_width  = esc_attr( $media_file['width'] );
					$poster_height = esc_attr( $media_file['height'] );
					$content_width = (int) Jetpack::get_content_width();
					if ( is_numeric( $content_width ) ) {
						$poster_height = round( ( $content_width * $poster_height ) / $poster_width );
						$poster_width  = $content_width;
					}
					$media_file = array_merge(
						$media_file,
						array(
							'poster' => add_query_arg( 'resize', rawurlencode( $poster_width . ',' . $poster_height ), $poster_url ),
						)
					);
				}
				return $media_file;
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
			'title' => get_the_title( $media['id'] ),
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
		// Use poster image for VideoPress videos.
		$poster_url  = $metadata['videopress']['poster'];
		$description = ! empty( $metadata['videopress']['description'] ) ? $metadata['videopress']['description'] : '';
		$meta_width  = ! empty( $metadata['videopress']['width'] ) ? $metadata['videopress']['width'] : '';
		$meta_height = ! empty( $metadata['videopress']['height'] ) ? $metadata['videopress']['height'] : '';
	} elseif ( ! empty( $metadata['thumb'] ) ) {
		// On WordPress.com, VideoPress videos have a 'thumb' property with the
		// poster image filename instead.
		$video_url   = wp_get_attachment_url( $media['id'] );
		$poster_url  = str_replace( wp_basename( $video_url ), $metadata['thumb'], $video_url );
		$description = ! empty( $media['alt'] ) ? $media['alt'] : '';
		$meta_width  = ! empty( $metadata['width'] ) ? $metadata['width'] : '';
		$meta_height = ! empty( $metadata['height'] ) ? $metadata['height'] : '';
	}

	if ( ! empty( $poster_url ) ) {
		$poster_width  = esc_attr( $meta_width );
		$poster_height = esc_attr( $meta_height );
		$content_width = (int) Jetpack::get_content_width();
		if ( is_numeric( $content_width ) ) {
			$poster_height = round( ( $content_width * $poster_height ) / $poster_width );
			$poster_width  = $content_width;
		}
		return sprintf(
			'<img title="%1$s" alt="%2$s" class="%3$s" src="%4$s"%5$s%6$s>',
			esc_attr( get_the_title( $media['id'] ) ),
			esc_attr( $description ),
			'wp-block-jetpack-story_image wp-story-image ' .
			get_image_crop_class( $meta_width, $meta_height ),
			esc_attr( add_query_arg( 'resize', rawurlencode( $poster_width . ',' . $poster_height ), $poster_url ) ),
			! empty( $meta_width ) ? ' width="' . esc_attr( $meta_width ) . '"' : '',
			! empty( $meta_height ) ? ' height="' . esc_attr( $meta_height ) . '"' : ''
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
		esc_attr( get_the_title( $media['id'] ) ),
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
		case 'file':
			// VideoPress videos can sometimes have type 'file', and mime 'video/videopress' or 'video/mp4'.
			if ( 'video' === substr( $media['mime'], 0, 5 ) ) {
				$media_template = render_video( $media, $index );
			}
			break;
	}
	return sprintf(
		'<div class="wp-story-slide" style="display: %s;">
			<figure>%s</figure>
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
				<svg class="gridicon gridicons-fullscreen" role="img" height="24" width="24" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
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
 * @param array $class_name Optional css class name(s) to customize the bullet element.
 *
 * @return string
 */
function render_pagination_bullet( $slide_index, $class_name = '' ) {
	return sprintf(
		'<a href="#" class="wp-story-pagination-bullet %s" aria-label="%s">
			<div class="wp-story-pagination-bullet-bar"></div>
		</a>',
		esc_attr( $class_name ),
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
	$slide_count     = isset( $settings['slides'] ) ? count( $settings['slides'] ) : 0;
	$bullet_count    = min( $slide_count, MAX_BULLETS );
	$bullet_ellipsis = $slide_count > $bullet_count
		? render_pagination_bullet( $bullet_count + 1, 'wp-story-pagination-ellipsis' )
		: '';
	return sprintf(
		'<div class="wp-story-pagination wp-story-pagination-bullets">
			%s
		</div>',
		join( "\n", array_map( __NAMESPACE__ . '\render_pagination_bullet', range( 1, $bullet_count ) ) ) . $bullet_ellipsis
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
		'<div class="%1$s" aria-labelledby="%2$s" data-settings="%3$s">
			<div style="display: contents;">
				<div class="wp-story-container">
					<div class="wp-story-meta">
						<div class="wp-story-icon">
							<img alt="%4$s" src="%5$s" width="40" height="40">
						</div>
						<div>
							<div class="wp-story-title">
								%6$s
							</div>
						</div>
						<a class="wp-story-exit-fullscreen jetpack-mdc-icon-button">
							<i class="jetpack-material-icons close md-24"></i>
						</a>
					</div>
					<div class="wp-story-wrapper">
						%7$s
					</div>
					<a class="wp-story-overlay" href="%8$s" title="%9$s">
						%10$s
					</a>
					%11$s
				</div>
			</div>
		</div>',
		esc_attr( Blocks::classes( FEATURE_NAME, $attributes, array( 'wp-story', 'aligncenter' ) ) ),
		esc_attr( 'wp-story-' . get_the_ID() ),
		filter_var( wp_json_encode( $settings ), FILTER_SANITIZE_SPECIAL_CHARS ),
		__( 'Site icon', 'jetpack' ),
		esc_attr( get_site_icon_url( 80, includes_url( 'images/w-logo-blue.png' ) ) ),
		esc_html( get_the_title() ),
		! empty( $media_files[0] ) ? render_slide( $media_files[0] ) : '',
		get_permalink() . '?wp-story-load-in-fullscreen=true&amp;wp-story-play-on-load=true',
		__( 'Play story in new tab', 'jetpack' ),
		render_top_right_icon( $settings ),
		render_pagination( $settings )
	);
}
