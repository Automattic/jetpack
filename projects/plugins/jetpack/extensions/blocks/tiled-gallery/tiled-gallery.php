<?php //phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Tiled Gallery block.
 * Relies on Photon, but can be used even when the module is not active.
 *
 * @since 6.9.0
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions;

use Automattic\Jetpack\Blocks;
use Automattic\Jetpack\Current_Plan as Jetpack_Plan;
use Automattic\Jetpack\Status;
use Automattic\Jetpack\Status\Host;
use Jetpack;
use Jetpack_Gutenberg;

/**
 * Jetpack Tiled Gallery Block class
 *
 * @since 7.3
 */
class Tiled_Gallery {
	/* Values for building srcsets */
	const IMG_SRCSET_WIDTH_MAX  = 2000;
	const IMG_SRCSET_WIDTH_MIN  = 600;
	const IMG_SRCSET_WIDTH_STEP = 300;

	/**
	 * Register the block
	 */
	public static function register() {
		if (
			( defined( 'IS_WPCOM' ) && IS_WPCOM )
			|| Jetpack::is_connection_ready()
			|| ( new Status() )->is_offline_mode()
		) {
			Blocks::jetpack_register_block(
				__DIR__,
				array(
					'render_callback' => array( __CLASS__, 'render' ),
				)
			);
		}
	}

	/**
	 * Tiled gallery block registration
	 *
	 * @param array  $attr    Array containing the block attributes.
	 * @param string $content String containing the block content.
	 *
	 * @return string
	 */
	public static function render( $attr, $content ) {
		Jetpack_Gutenberg::load_assets_as_required( __DIR__ );

		$is_squareish_layout = self::is_squareish_layout( $attr );
		// For backward compatibility (ensuring Tiled Galleries using now deprecated versions of the block are not affected).
		// See isVIP() in utils/index.js.
		$jetpack_plan = Jetpack_Plan::get();
		wp_localize_script( 'jetpack-gallery-settings', 'jetpack_plan', array( 'data' => $jetpack_plan['product_slug'] ) );

		if ( preg_match_all( '/<img [^>]+>/', $content, $images ) ) {
			/**
			 * This block processes all of the images that are found and builds $find and $replace.
			 *
			 * The original img is added to the $find array and the replacement is made and added
			 * to the $replace array. This is so that the same find and replace operations can be
			 * made on the entire $content.
			 */
			$find          = array();
			$replace       = array();
			$image_index   = 0;
			$number_images = count( $images[0] );

			foreach ( $images[0] as $image_html ) {
				if (
					preg_match( '/data-width="([0-9]+)"/', $image_html, $img_width )
					&& preg_match( '/data-height="([0-9]+)"/', $image_html, $img_height )
					&& preg_match( '/src="([^"]+)"/', $image_html, $img_src )
				) {
					++$image_index;
					// Drop img src query string so it can be used as a base to add photon params
					// for the srcset.
					$src_parts   = explode( '?', $img_src[1], 2 );
					$orig_src    = $src_parts[0];
					$orig_height = absint( $img_height[1] );
					$orig_width  = absint( $img_width[1] );

					// Because URLs are already "photon", the photon function used short-circuits
					// before ssl is added. Detect ssl and add is if necessary.
					$is_ssl = ! empty( $src_parts[1] ) && str_contains( $src_parts[1], 'ssl=1' );

					if ( ! $orig_width || ! $orig_height || ! $orig_src ) {
						continue;
					}

					$srcset_parts = array();
					if ( $is_squareish_layout ) {
						$min_width = min( self::IMG_SRCSET_WIDTH_MIN, $orig_width, $orig_height );
						$max_width = min( self::IMG_SRCSET_WIDTH_MAX, $orig_width, $orig_height );

						for ( $w = $min_width; $w <= $max_width; $w = min( $max_width, $w + self::IMG_SRCSET_WIDTH_STEP ) ) {
							$srcset_src = add_query_arg(
								array(
									'resize' => $w . ',' . $w,
									'strip'  => 'info',
								),
								$orig_src
							);
							if ( $is_ssl ) {
								$srcset_src = add_query_arg( 'ssl', '1', $srcset_src );
							}
							$srcset_parts[] = esc_url( $srcset_src ) . ' ' . $w . 'w';
							if ( $w >= $max_width ) {
								break;
							}
						}
					} else {
						$min_width = min( self::IMG_SRCSET_WIDTH_MIN, $orig_width );
						$max_width = min( self::IMG_SRCSET_WIDTH_MAX, $orig_width );

						for ( $w = $min_width; $w <= $max_width; $w = min( $max_width, $w + self::IMG_SRCSET_WIDTH_STEP ) ) {
							$srcset_src = add_query_arg(
								array(
									'strip' => 'info',
									'w'     => $w,
								),
								$orig_src
							);
							if ( $is_ssl ) {
								$srcset_src = add_query_arg( 'ssl', '1', $srcset_src );
							}
							$srcset_parts[] = esc_url( $srcset_src ) . ' ' . $w . 'w';
							if ( $w >= $max_width ) {
								break;
							}
						}
					}

					$img_element = self::interactive_markup( $image_index, $number_images );

					if ( ! empty( $srcset_parts ) ) {
						$srcset = 'srcset="' . esc_attr( implode( ',', $srcset_parts ) ) . '"';

						$find[]    = $image_html;
						$replace[] = str_replace( '<img', $img_element . $srcset, $image_html );
					}
				}
			}

			if ( ! empty( $find ) ) {
				$content = str_replace( $find, $replace, $content );
			}
		}

		/**
		 * Filter the output of the Tiled Galleries content.
		 *
		 * @module tiled-gallery
		 *
		 * @since 6.9.0
		 *
		 * @param string $content Tiled Gallery block content.
		 */
		return apply_filters( 'jetpack_tiled_galleries_block_content', $content );
	}

	/**
	 * Adds tabindex, role and aria-label markup for images that should be interactive (front-end only).
	 *
	 * @param integer $image_index Integer The current image index.
	 * @param integer $number_images Integer The total number of images.
	 */
	private static function interactive_markup( $image_index, $number_images ) {

		$host             = new Host();
		$is_module_active = $host->is_wpcom_simple()
		? get_option( 'carousel_enable_it' )
		: Jetpack::is_module_active( 'carousel' );

		if ( $is_module_active ) {
			$aria_label_content = sprintf(
				/* Translators: %1$d is the current image index, %2$d is the total number of images. */
				__( 'Open image %1$d of %2$d in full-screen', 'jetpack' ),
				$image_index,
				$number_images
			);
			$img_element = '<img role="button" tabindex="0" aria-label="' . esc_attr( $aria_label_content ) . '"';
		} else {
			$img_element = '<img ';
		}
		return $img_element;
	}

	/**
	 * Determines whether a Tiled Gallery block uses square or circle images (1:1 ratio)
	 *
	 * Layouts are block styles and will be available as `is-style-[LAYOUT]` in the className
	 * attribute. The default (rectangular) will be omitted.
	 *
	 * @param array $attr Attributes key/value array.
	 * @return boolean True if layout is squareish, otherwise false.
	 */
	private static function is_squareish_layout( $attr ) {
		return isset( $attr['className'] )
			&& (
				'is-style-square' === $attr['className']
				|| 'is-style-circle' === $attr['className']
			);
	}
}

add_action( 'init', array( Tiled_Gallery::class, 'register' ) );
