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
		! class_exists( '\Automattic\WooCommerce\EmailEditor\Integrations\Utils\Styles_Helper' ) ||
		! class_exists( '\Automattic\WooCommerce\EmailEditor\Integrations\Utils\Table_Wrapper_Helper' ) ) {
		return '';
	}

	// Email rendering configuration - only extract values used multiple times
	$email_grid_padding_margin = 20; // Total padding/margin space for grid layout
	$email_common_margin       = 16; // Common margin/padding value used multiple times
	$email_cell_padding        = 8; // Cell padding used in multiple places

	$attr = $parsed_block['attrs'];

	// Process images for email rendering
	$images = process_slideshow_images_for_email( $attr );

	if ( empty( $images ) ) {
		return '';
	}

	// Determine target width from the email layout if available
	$target_width = get_email_target_width( $rendering_context );

	// Build grid content
	$grid_content   = '';
	$images_per_row = 2; // Two images per row for better email compatibility
	$image_width    = floor( ( $target_width - $email_grid_padding_margin ) / $images_per_row ); // Account for padding/margins

	// Create rows
	$image_chunks = array_chunk( $images, $images_per_row );

	foreach ( $image_chunks as $row_images ) {
		$grid_content .= '<table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0 0 ' . $email_common_margin . 'px 0; table-layout: fixed;"><tr>';

		foreach ( $row_images as $image ) {
					$grid_content .= sprintf(
						'<td style="width: %dpx; padding: %dpx; vertical-align: top; text-align: center; font-family: Arial, sans-serif;">',
						$image_width,
						$email_cell_padding
					);

			// Build individual image content
			$grid_content .= sprintf(
				'<img src="%s" alt="%s" style="width: 100%%; max-width: %dpx; height: auto; display: block; border: 0; margin: 0 auto; border-radius: 4px;" />',
				esc_url( $image['url'] ),
				esc_attr( $image['alt'] ),
				$image_width - $email_common_margin // Account for padding
			);

			// Add caption if available
			if ( ! empty( $image['caption'] ) ) {
				$grid_content .= sprintf(
					'<p style="margin: 12px 0 0 0; padding: 0; font-size: 14px; color: #666666; line-height: 1.4; text-align: center; font-family: Arial, sans-serif;">%s</p>',
					esc_html( wp_strip_all_tags( $image['caption'] ) )
				);
			}

			$grid_content .= '</td>';
		}

		// Fill remaining cells if odd number of images in last row
		$remaining_cells = $images_per_row - count( $row_images );
		for ( $i = 0; $i < $remaining_cells; $i++ ) {
			$grid_content .= sprintf( '<td style="width: %dpx; padding: %dpx;"></td>', $image_width, $email_cell_padding );
		}

		$grid_content .= '</tr></table>';
	}

	// Use Table_Wrapper_Helper for consistent email rendering
	$image_table_attrs = array(
		'style' => 'margin: ' . $email_common_margin . 'px 0; padding: 0; border-collapse: collapse;',
		'width' => $target_width,
	);

	$html = \Automattic\WooCommerce\EmailEditor\Integrations\Utils\Table_Wrapper_Helper::render_table_wrapper( $grid_content, $image_table_attrs );

	// Add margin below the block
	$html .= '<div style="margin-bottom: 2em;"></div>';

	return $html;
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
 * Get target width for email rendering.
 *
 * @param object $rendering_context Email rendering context.
 * @return int Target width in pixels.
 */
function get_email_target_width( $rendering_context ) {
	$target_width = 600; // Default

	if ( ! empty( $rendering_context ) && is_object( $rendering_context ) && method_exists( $rendering_context, 'get_layout_width_without_padding' ) ) {
		$layout_width_px = $rendering_context->get_layout_width_without_padding();
		if ( is_string( $layout_width_px ) ) {
			$parsed_width = \Automattic\WooCommerce\EmailEditor\Integrations\Utils\Styles_Helper::parse_value( $layout_width_px );
			if ( $parsed_width > 0 ) {
				$target_width = $parsed_width;
			}
		}
	}

	return $target_width;
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
			if ( ! empty( $attr['images'] ) && is_array( $attr['images'] ) && isset( $attr['images'][ $index ]['caption'] ) ) {
				$caption = wp_strip_all_tags( $attr['images'][ $index ]['caption'] );
			}

			// If no caption in images array, get it from attachment post
			if ( empty( $caption ) && $attachment_post && ! empty( $attachment_post->post_excerpt ) ) {
				$caption = wp_strip_all_tags( $attachment_post->post_excerpt );
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
		// Fall back to images array if IDs aren't available (for testing)
		foreach ( $attr['images'] as $image_data ) {
			if ( ! empty( $image_data['url'] ) ) {
				// Validate and sanitize URL
				$url = esc_url_raw( $image_data['url'] );
				if ( ! $url || ! wp_http_validate_url( $url ) ) {
					continue;
				}

				// Sanitize alt text
				$alt_text = ! empty( $image_data['alt'] ) ? sanitize_text_field( $image_data['alt'] ) : '';

				// Sanitize caption
				$caption = ! empty( $image_data['caption'] ) ? wp_strip_all_tags( $image_data['caption'] ) : '';

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
