<?php
/**
 * Slideshow Block.
 *
 * @since 7.1.0
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\Slideshow;

use Automattic\Jetpack\Blocks;
use Jetpack_Gutenberg;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Registers the block for use in Gutenberg
 * This is done via an action so that we can disable
 * registration if we need to.
 */
function register_block() {
	Blocks::jetpack_register_block(
		__DIR__,
		array(
			'render_callback'       => __NAMESPACE__ . '\load_assets',
			'render_email_callback' => __NAMESPACE__ . '\render_email',
		)
	);
}
add_action( 'init', __NAMESPACE__ . '\register_block' );

/**
 * Slideshow block registration/dependency declaration.
 *
 * @param array  $attr    Array containing the slideshow block attributes.
 * @param string $content String containing the slideshow block content.
 *
 * @return string
 */
function load_assets( $attr, $content ) {
	Jetpack_Gutenberg::load_assets_as_required( __DIR__ );
	if ( Blocks::is_amp_request() ) {
		return render_amp( $attr );
	}

	// Enqueue Swiper bundle for dynamic loading
	if ( ! is_admin() && ! Blocks::is_amp_request() ) {
		enqueue_swiper_library();
	}

	// Fix for lazy loading conflict with slideshow images.
	if ( ! is_admin() ) {
		add_filter(
			'wp_content_img_tag',
			function ( $image ) {
				if ( str_contains( $image, 'loading="lazy"' ) && str_contains( $image, 'wp-block-jetpack-slideshow_image' ) ) {
					$image = str_replace( 'sizes="auto, ', 'sizes="', $image );
				}
				return $image;
			}
		);
	}

	return $content;
}

/**
 * Render slideshow block for email.
 *
 * @since 15.0
 *
 * @param string $block_content     The original block HTML content.
 * @param array  $parsed_block      The parsed block data including attributes.
 * @param object $rendering_context Email rendering context.
 *
 * @return string
 */
function render_email( $block_content, array $parsed_block, $rendering_context ) {
	// Validate input parameters and required dependencies
	if ( ! isset( $parsed_block['attrs'] ) || ! is_array( $parsed_block['attrs'] ) ||
		! class_exists( '\Automattic\WooCommerce\EmailEditor\Integrations\Core\Renderer\Blocks\Gallery' ) ) {
		return '';
	}

	$attributes = $parsed_block['attrs'];

	// Process images for email rendering
	$images = process_slideshow_images_for_email( $attributes );

	if ( empty( $images ) ) {
		return '';
	}

	// Build innerBlocks that WooCommerce's gallery renderer expects
	// The renderer looks for innerBlocks with blockName 'core/image' and innerHTML
	$inner_blocks = array();
	foreach ( $images as $image ) {
		// Build image HTML in the format that extract_image_from_html() can parse
		$img_html = sprintf(
			'<img src="%s" alt="%s"',
			esc_url( $image['url'] ),
			esc_attr( $image['alt'] )
		);

		if ( ! empty( $image['id'] ) ) {
			$img_html .= sprintf( ' class="wp-image-%d"', absint( $image['id'] ) );
		}

		$img_html .= ' />';

		// Add caption if available (extract_image_from_html looks for figcaption)
		// Preserve HTML in captions - the gallery renderer will sanitize it
		if ( ! empty( $image['caption'] ) ) {
			$img_html .= sprintf(
				'<figcaption>%s</figcaption>',
				wp_kses_post( $image['caption'] )
			);
		}

		// Create inner block structure that the gallery renderer expects
		// The renderer only uses innerHTML, not attrs
		$inner_blocks[] = array(
			'blockName' => 'core/image',
			'innerHTML' => $img_html,
		);
	}

	// Build block content HTML for gallery caption extraction (if needed)
	// The renderer uses $block_content parameter to extract gallery-level captions
	$block_content_html = '<figure class="wp-block-gallery has-nested-images columns-default is-cropped"><ul class="blocks-gallery-grid"></ul></figure>';

	// Create a mock parsed block that WooCommerce's gallery renderer can handle
	// The renderer uses columns from attrs (defaults to 3, but 2 works better for email)
	$mock_parsed_block = array(
		'innerBlocks' => $inner_blocks,
		'attrs'       => array(
			'columns' => 2,
		),
	);

	// Preserve email_attrs if present (used for width calculation)
	if ( ! empty( $parsed_block['email_attrs'] ) ) {
		$mock_parsed_block['email_attrs'] = $parsed_block['email_attrs'];
	}

	// Use WooCommerce's core gallery renderer
	$woo_gallery_renderer = new \Automattic\WooCommerce\EmailEditor\Integrations\Core\Renderer\Blocks\Gallery();

	return $woo_gallery_renderer->render( $block_content_html, $mock_parsed_block, $rendering_context );
}

/**
 * Render slideshow block for AMP
 *
 * @param array $attr Array containing the slideshow block attributes.
 *
 * @return string
 */
function render_amp( $attr ) {
	if ( empty( $attr['ids'] ) ) {
		return '';
	}

	static $wp_block_jetpack_slideshow_id = 0;
	++$wp_block_jetpack_slideshow_id;

	$ids      = $attr['ids'];
	$autoplay = empty( $attr['autoplay'] ) ? false : true;
	$extras   = array(
		'wp-amp-block',
		$autoplay ? 'wp-block-jetpack-slideshow__autoplay' : null,
		$autoplay ? 'wp-block-jetpack-slideshow__autoplay-playing' : null,
	);
	$classes  = Blocks::classes( Blocks::get_block_feature( __DIR__ ), $attr, $extras );

	return sprintf(
		'<div class="%1$s" id="wp-block-jetpack-slideshow__%2$d"><div class="wp-block-jetpack-slideshow_container swiper">%3$s%4$s%5$s</div></div>',
		esc_attr( $classes ),
		absint( $wp_block_jetpack_slideshow_id ),
		amp_carousel( $attr, $wp_block_jetpack_slideshow_id ),
		$autoplay ? autoplay_ui( $wp_block_jetpack_slideshow_id ) : '',
		render_paginator( $ids, $wp_block_jetpack_slideshow_id )
	);
}

/**
 * Generate amp-carousel markup
 *
 * @param array $attr Array of block attributes.
 * @param int   $block_ordinal The ordinal number of the block, used in unique ID.
 *
 * @return string amp-carousel markup.
 */
function amp_carousel( $attr, $block_ordinal ) {
	$ids         = empty( $attr['ids'] ) ? array() : $attr['ids'];
	$first_image = wp_get_attachment_metadata( $ids[0] );
	$delay       = empty( $attr['delay'] ) ? 3 : absint( $attr['delay'] );
	$autoplay    = empty( $attr['autoplay'] ) ? false : $attr['autoplay'];
	$width       = empty( $first_image['width'] ) ? 800 : $first_image['width'];
	$height      = empty( $first_image['height'] ) ? 600 : $first_image['height'];
	return sprintf(
		'<amp-carousel width="%1$d" height="%2$d" layout="responsive" type="slides" data-next-button-aria-label="%3$s" data-prev-button-aria-label="%4$s" controls loop %5$s id="wp-block-jetpack-slideshow__amp-carousel__%6$s" on="slideChange:wp-block-jetpack-slideshow__amp-pagination__%6$s.toggle(index=event.index, value=true)">%7$s</amp-carousel>',
		esc_attr( $width ),
		esc_attr( $height ),
		esc_attr__( 'Next Slide', 'jetpack' ),
		esc_attr__( 'Previous Slide', 'jetpack' ),
		$autoplay ? 'autoplay delay=' . esc_attr( $delay * 1000 ) : '',
		absint( $block_ordinal ),
		implode( '', slides( $ids, $width, $height ) )
	);
}

/**
 * Generate array of slides markup
 *
 * @param array $ids Array of image ids.
 * @param int   $width Width of the container.
 * @param int   $height Height of the container.
 *
 * @return array Array of slides markup.
 */
function slides( $ids = array(), $width = 400, $height = 300 ) {
	return array_map(
		function ( $id ) use ( $width, $height ) {
			$caption    = wp_get_attachment_caption( $id );
			$figcaption = $caption ? sprintf(
				'<figcaption class="wp-block-jetpack-slideshow_caption gallery-caption">%s</figcaption>',
				wp_kses_post( $caption )
			) : '';
			$image      = wp_get_attachment_image(
				$id,
				array( $width, $height ),
				false,
				array(
					'class'      => 'wp-block-jetpack-slideshow_image',
					'object-fit' => 'contain',
				)
			);
			return sprintf(
				'<div class="wp-block-jetpack-slideshow_slide"><figure>%s%s</figure></div>',
				$image,
				$figcaption
			);
		},
		$ids
	);
}

/**
 * Render blocks paginator section
 *
 * @param array $ids Array of image ids.
 * @param int   $block_ordinal The ordinal number of the block, used in unique ID.
 *
 * @return array Array of bullets markup.
 */
function render_paginator( $ids = array(), $block_ordinal = 0 ) {
	$total = count( $ids );

	if ( $total < 6 ) {
		return bullets( $ids, $block_ordinal );
	}

	return sprintf(
		'<div class="swiper-pagination-simple">%s / %s</div>',
		absint( $block_ordinal ),
		absint( $total )
	);
}

/**
 * Generate array of bullets markup
 *
 * @param array $ids Array of image ids.
 * @param int   $block_ordinal The ordinal number of the block, used in unique ID.
 *
 * @return array Array of bullets markup.
 */
function bullets( $ids = array(), $block_ordinal = 0 ) {
	$buttons = array_map(
		function ( $index ) {
			$aria_label = sprintf(
				/* translators: %d: Slide number. */
				__( 'Go to slide %d', 'jetpack' ),
				absint( $index + 1 )
			);
			return sprintf(
				'<button option="%d" class="swiper-pagination-bullet" tabindex="0" role="button" aria-label="%s" %s></button>',
				absint( $index ),
				esc_attr( $aria_label ),
				0 === $index ? 'selected' : ''
			);
		},
		array_keys( $ids )
	);

	return sprintf(
		'<amp-selector id="wp-block-jetpack-slideshow__amp-pagination__%1$d" class="wp-block-jetpack-slideshow_pagination swiper-pagination swiper-pagination-custom amp-pagination" on="select:wp-block-jetpack-slideshow__amp-carousel__%1$d.goToSlide(index=event.targetOption)" layout="container">%2$s</amp-selector>',
		absint( $block_ordinal ),
		implode( '', $buttons )
	);
}

/**
 * Generate autoplay play/pause UI.
 *
 * @param int $block_ordinal The ordinal number of the block, used in unique ID.
 *
 * @return string Autoplay UI markup.
 */
function autoplay_ui( $block_ordinal = 0 ) {
	$block_id        = sprintf(
		'wp-block-jetpack-slideshow__%d',
		absint( $block_ordinal )
	);
	$amp_carousel_id = sprintf(
		'wp-block-jetpack-slideshow__amp-carousel__%d',
		absint( $block_ordinal )
	);
	$autoplay_pause  = sprintf(
		'<a aria-label="%s" class="wp-block-jetpack-slideshow_button-pause" role="button" on="tap:%s.toggleAutoplay(toggleOn=false),%s.toggleClass(class=wp-block-jetpack-slideshow__autoplay-playing,force=false)"></a>',
		esc_attr__( 'Pause Slideshow', 'jetpack' ),
		esc_attr( $amp_carousel_id ),
		esc_attr( $block_id )
	);
	$autoplay_play   = sprintf(
		'<a aria-label="%s" class="wp-block-jetpack-slideshow_button-play" role="button" on="tap:%s.toggleAutoplay(toggleOn=true),%s.toggleClass(class=wp-block-jetpack-slideshow__autoplay-playing,force=true)"></a>',
		esc_attr__( 'Play Slideshow', 'jetpack' ),
		esc_attr( $amp_carousel_id ),
		esc_attr( $block_id )
	);
	return $autoplay_pause . $autoplay_play;
}

/**
 * Enqueue Swiper library assets for dynamic loading.
 *
 * @return void
 */
function enqueue_swiper_library() {
	$swiper_js_path  = Jetpack_Gutenberg::get_blocks_directory() . 'swiper.js';
	$swiper_css_path = Jetpack_Gutenberg::get_blocks_directory() . 'swiper' . ( is_rtl() ? '.rtl' : '' ) . '.css';

	if ( Jetpack_Gutenberg::block_has_asset( $swiper_js_path ) ) {
		wp_enqueue_script(
			'jetpack-swiper-library',
			plugins_url( $swiper_js_path, JETPACK__PLUGIN_FILE ),
			array(),
			JETPACK__VERSION,
			true
		);
	}

	if ( Jetpack_Gutenberg::block_has_asset( $swiper_css_path ) ) {
		wp_enqueue_style(
			'jetpack-swiper-library',
			plugins_url( $swiper_css_path, JETPACK__PLUGIN_FILE ),
			array(),
			JETPACK__VERSION
		);
	}
}

/**
 * Process slideshow images for email rendering.
 *
 * @param array $attr Block attributes containing image data.
 * @return array Processed image data for email rendering.
 */
function process_slideshow_images_for_email( $attr ) {
	$images = array();

	// Get images from IDs (primary data source)
	if ( ! empty( $attr['ids'] ) && is_array( $attr['ids'] ) ) {
		foreach ( $attr['ids'] as $index => $id ) {
			// Validate ID is a positive integer
			$id = absint( $id );
			if ( ! $id ) {
				continue;
			}

			$image_url = wp_get_attachment_image_url( $id, 'medium' );

			// Sanitize alt text from post meta
			$alt_text = get_post_meta( $id, '_wp_attachment_image_alt', true );
			$alt_text = sanitize_text_field( $alt_text );

			// Get caption from attachment post (stored in post_excerpt)
			$attachment_post = get_post( $id );
			$caption         = '';

			// First try to get caption from images array if available (with validation)
			// Preserve HTML in captions - the gallery renderer will sanitize it
			if ( ! empty( $attr['images'] ) && is_array( $attr['images'] ) && isset( $attr['images'][ $index ]['caption'] ) ) {
				$caption = wp_kses_post( $attr['images'][ $index ]['caption'] );
			}

			// If no caption in images array, get it from attachment post
			if ( empty( $caption ) && $attachment_post && ! empty( $attachment_post->post_excerpt ) ) {
				$caption = wp_kses_post( $attachment_post->post_excerpt );
			}

			if ( $image_url ) {
				$images[] = array(
					'url'     => $image_url,
					'alt'     => $alt_text,
					'caption' => $caption,
					'id'      => $id,
				);
			}
		}
	} elseif ( ! empty( $attr['images'] ) && is_array( $attr['images'] ) ) {
		// Fall back to images array if IDs aren't available (for edge cases/testing)
		foreach ( $attr['images'] as $image_data ) {
			if ( ! empty( $image_data['url'] ) ) {
				// Sanitize URL - esc_url_raw returns empty string for invalid URLs
				$url = esc_url_raw( $image_data['url'] );
				if ( ! $url ) {
					continue;
				}

				// Sanitize alt text
				$alt_text = ! empty( $image_data['alt'] ) ? sanitize_text_field( $image_data['alt'] ) : '';

				// Preserve HTML in captions - the gallery renderer will sanitize it
				$caption = ! empty( $image_data['caption'] ) ? wp_kses_post( $image_data['caption'] ) : '';

				// Validate ID if present
				$id = ! empty( $image_data['id'] ) ? absint( $image_data['id'] ) : 0;

				$images[] = array(
					'url'     => $url,
					'alt'     => $alt_text,
					'caption' => $caption,
					'id'      => $id,
				);
			}
		}
	}

	return $images;
}
