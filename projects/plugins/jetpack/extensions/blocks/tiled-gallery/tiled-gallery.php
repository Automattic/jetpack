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

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

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
					'render_callback'       => array( __CLASS__, 'render' ),
					'render_email_callback' => array( __CLASS__, 'render_email' ),
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

	/**
	 * Render tiled gallery block for email.
	 *
	 * @since 15.0
	 *
	 * @param string $block_content     The original block HTML content.
	 * @param array  $parsed_block      The parsed block data including attributes.
	 * @param object $rendering_context Email rendering context.
	 *
	 * @return string
	 */
	public static function render_email( $block_content, array $parsed_block, $rendering_context ) {
		// Validate input parameters and required dependencies
		if ( ! isset( $parsed_block['attrs'] ) || ! is_array( $parsed_block['attrs'] ) ||
			! class_exists( '\Automattic\WooCommerce\EmailEditor\Integrations\Utils\Styles_Helper' ) ||
			! class_exists( '\Automattic\WooCommerce\EmailEditor\Integrations\Utils\Table_Wrapper_Helper' ) ) {
			return '';
		}

		// Get spacing from email_attrs for better consistency with core blocks
		$email_attrs        = $parsed_block['email_attrs'] ?? array();
		$table_margin_style = '';

		if ( ! empty( $email_attrs ) && class_exists( '\WP_Style_Engine' ) ) {
			// Get margin for table styling
			$table_margin_style = \WP_Style_Engine::compile_css( array_intersect_key( $email_attrs, array_flip( array( 'margin' ) ) ), '' ) ?? '';
		}

		// Email cell padding
		$email_cell_padding = 2;  // Cell padding

		$attr = $parsed_block['attrs'];

		// Determine layout style and columns from attributes (needed for both image processing and layout building)
		$layout_info = self::get_layout_style_from_attributes( $attr );

		// Process images for email rendering
		$images = self::process_tiled_gallery_images_for_email( $attr, $layout_info );

		if ( empty( $images ) ) {
			return '';
		}

		// Determine target width from the email layout if available
		$target_width = self::get_email_target_width( $rendering_context );

		// Build layout content based on style and columns
		$grid_content = self::build_email_layout_content( $images, $layout_info, $email_cell_padding, $attr );

		// Use Table_Wrapper_Helper for consistent email rendering
		$table_style = sprintf( 'width: 100%%; max-width: %dpx; padding: 0; border-collapse: collapse;', $target_width );
		if ( ! empty( $table_margin_style ) ) {
			$table_style = $table_margin_style . '; ' . $table_style;
		} else {
			$table_style = 'margin: 16px 0; ' . $table_style;
		}

		$image_table_attrs = array(
			'style' => $table_style,
		);

		$html = \Automattic\WooCommerce\EmailEditor\Integrations\Utils\Table_Wrapper_Helper::render_table_wrapper( $grid_content, $image_table_attrs );

		return $html;
	}

	/**
	 * Get target width for email rendering.
	 *
	 * @param object $rendering_context Email rendering context.
	 * @return int Target width in pixels.
	 */
	private static function get_email_target_width( $rendering_context ) {
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
	 * Process tiled gallery images for email rendering.
	 *
	 * @param array $attr Block attributes containing image data.
	 * @param array $layout_info Layout information from get_layout_style_from_attributes.
	 * @return array Processed image data for email rendering.
	 */
	private static function process_tiled_gallery_images_for_email( $attr, $layout_info ) {
		$images = array();

		// Determine if this is a squareish layout
		$is_squareish = in_array( $layout_info['style'], array( 'square', 'circle' ), true );

		// Get images from IDs (primary data source)
		if ( ! empty( $attr['ids'] ) && is_array( $attr['ids'] ) ) {
			foreach ( $attr['ids'] as $id ) {
				// Validate ID is a positive integer and attachment exists
				$id = absint( $id );
				if ( ! $id || ! wp_attachment_is_image( $id ) ) {
					continue;
				}

				// For square/circle layouts, get a high-quality square crop
				if ( $is_squareish ) {
					// Start with full size image for better quality when resizing
					$image_url = wp_get_attachment_image_url( $id, 'full' );

					// If we have Photon/Jetpack image processing, request high-quality square crop
					if ( function_exists( 'jetpack_photon_url' ) && $image_url ) {
						$image_url = add_query_arg(
							array(
								'resize' => '1300,1300', // High-quality square crop for email
								'crop'   => '1',
							),
							$image_url
						);
					}
				} else {
					$image_url = wp_get_attachment_image_url( $id, 'large' );
				}

				// Sanitize alt text from post meta
				$alt_text = get_post_meta( $id, '_wp_attachment_image_alt', true );
				$alt_text = sanitize_text_field( $alt_text );

				if ( $image_url ) {
					$images[] = array(
						'url' => $image_url,
						'alt' => $alt_text,
						'id'  => $id,
					);
				}
			}
		} elseif ( ! empty( $attr['images'] ) && is_array( $attr['images'] ) ) {
			// Fall back to images array if IDs aren't available
			foreach ( $attr['images'] as $image_data ) {
				if ( ! empty( $image_data['url'] ) ) {
					// Validate and sanitize URL
					$url = esc_url_raw( $image_data['url'] );
					if ( ! $url || ! wp_http_validate_url( $url ) ) {
						continue;
					}

					// Sanitize alt text
					$alt_text = ! empty( $image_data['alt'] ) ? sanitize_text_field( $image_data['alt'] ) : '';

					// Validate ID if present
					$id = ! empty( $image_data['id'] ) ? absint( $image_data['id'] ) : 0;

					$images[] = array(
						'url' => $url,
						'alt' => $alt_text,
						'id'  => $id,
					);
				}
			}
		}

		return $images;
	}

	/**
	 * Get layout style and columns from block attributes.
	 *
	 * @param array $attr Block attributes.
	 * @return array Array with 'style', 'columns', and 'border_radius' keys.
	 */
	private static function get_layout_style_from_attributes( $attr ) {
		$layout_info = array(
			'style'         => 'rectangular', // Default to rectangular/mosaic layout
			'columns'       => 3, // Default to 3 columns
			'border_radius' => 0, // Default to no border radius
		);

		// Get number of columns from attributes with validation
		if ( ! empty( $attr['columns'] ) && is_numeric( $attr['columns'] ) ) {
			$columns = absint( $attr['columns'] );
			// Clamp columns between 1 and 6 for reasonable layouts
			$layout_info['columns'] = max( 1, min( 6, $columns ) );
		}

		// Get border radius from roundedCorners attribute (preferred method)
		if ( ! empty( $attr['roundedCorners'] ) && is_numeric( $attr['roundedCorners'] ) ) {
			$border_radius_value = absint( $attr['roundedCorners'] );
			// Clamp value between 0 and 20
			$layout_info['border_radius'] = max( 0, min( 20, $border_radius_value ) );
		}

		// Get layout style and border radius from className
		if ( ! empty( $attr['className'] ) ) {
			if ( str_contains( $attr['className'], 'is-style-square' ) ) {
				$layout_info['style'] = 'square';
			} elseif ( str_contains( $attr['className'], 'is-style-circle' ) ) {
				$layout_info['style'] = 'circle';
			} elseif ( str_contains( $attr['className'], 'is-style-columns' ) ) {
				$layout_info['style'] = 'columns';
			}

			// Extract border radius from has-rounded-corners-{value} class (fallback method)
			if ( $layout_info['border_radius'] === 0 && preg_match( '/has-rounded-corners-(\d+)/', $attr['className'], $matches ) ) {
				$border_radius_value = absint( $matches[1] );
					// Clamp value between 0 and 20
				$layout_info['border_radius'] = max( 0, min( 20, $border_radius_value ) );
			}
		}

		return $layout_info;
	}

	/**
	 * Build email layout content based on layout style and columns.
	 *
	 * @param array $images Array of image data.
	 * @param array $layout_info Array with 'style' and 'columns' keys.
	 * @param int   $cell_padding Cell padding.
	 * @param array $attr Block attributes.
	 * @return string HTML content.
	 */
	private static function build_email_layout_content( $images, $layout_info, $cell_padding, $attr ) {
		$layout_style  = $layout_info['style'];
		$columns       = $layout_info['columns'];
		$border_radius = $layout_info['border_radius'];

		switch ( $layout_style ) {
			case 'square':
				return self::build_square_layout_content( $images, $cell_padding, $columns, 'square', $border_radius, $attr );
			case 'circle':
				return self::build_square_layout_content( $images, $cell_padding, $columns, 'circle', $border_radius, $attr );
			case 'columns':
				return self::build_columns_layout_content( $images, $cell_padding, $columns, $border_radius, $attr );
			case 'rectangular':
			default:
				return self::build_mosaic_layout_content( $images, $cell_padding, $border_radius, $attr );
		}
	}

	/**
	 * Build square/circle layout content.
	 *
	 * @param array  $images Array of image data.
	 * @param int    $cell_padding Cell padding.
	 * @param int    $columns Number of columns for the layout.
	 * @param string $style Layout style (square or circle).
	 * @param int    $border_radius Border radius value (0-20).
	 * @param array  $attr Block attributes.
	 * @return string HTML content.
	 */
	private static function build_square_layout_content( $images, $cell_padding, $columns, $style = 'square', $border_radius = 0, $attr = array() ) {
		$content_parts = array();

		// Create rows of images with hierarchical chunks for square/circle layouts
		$image_chunks = self::create_hierarchical_chunks( $images, $columns );

		$border_radius_style = self::generate_border_radius_style( $style, $border_radius );

		foreach ( $image_chunks as $row_images ) {
			$images_in_row      = count( $row_images );
			$cell_width_percent = ( 100 / $images_in_row );

			// Build table cells for this row
			$row_cells = '';
			foreach ( $row_images as $image ) {
				// Calculate cell attributes with consistent padding
				$cell_attrs = array(
					'style' => sprintf(
						'width: %s%%; padding: %dpx; vertical-align: top; text-align: center;',
						$cell_width_percent,
						$cell_padding
					),
				);

				$image_styles = self::generate_image_styles( false );

				$cell_content = self::generate_image_html( $image, $image_styles, $border_radius_style, $attr );

				$row_cells .= \Automattic\WooCommerce\EmailEditor\Integrations\Utils\Table_Wrapper_Helper::render_table_cell(
					$cell_content,
					$cell_attrs
				);
			}

			// Use Table_Wrapper_Helper for email-compatible table rendering
			$table_attrs = array(
				'style' => 'width: 100%; border-collapse: collapse;',
			);

			$content_parts[] = \Automattic\WooCommerce\EmailEditor\Integrations\Utils\Table_Wrapper_Helper::render_table_wrapper(
				$row_cells,
				$table_attrs
			);
		}

		// Use Table_Wrapper_Helper for consistent email rendering
		$wrapper_attrs = array(
			'style' => 'width: 100%; border-collapse: collapse;',
		);

		return \Automattic\WooCommerce\EmailEditor\Integrations\Utils\Table_Wrapper_Helper::render_table_wrapper(
			implode( '', $content_parts ),
			$wrapper_attrs
		);
	}

	/**
	 * Build columns layout content using mosaic logic organized into columns.
	 *
	 * @param array $images Array of image data.
	 * @param int   $cell_padding Cell padding.
	 * @param int   $columns Number of columns for the layout.
	 * @param int   $border_radius Border radius value (0-20).
	 * @param array $attr Block attributes.
	 * @return string HTML content.
	 */
	private static function build_columns_layout_content( $images, $cell_padding, $columns, $border_radius = 0, $attr = array() ) {
		$content_parts       = array();
		$border_radius_style = self::generate_border_radius_style( '', $border_radius );

		// Distribute images across columns using round-robin approach for better balance
		$column_arrays = array_fill( 0, $columns, array() );
		foreach ( $images as $index => $image ) {
			$column_index                     = $index % $columns;
			$column_arrays[ $column_index ][] = $image;
		}

		// Build table cells for columns layout
		$row_cells = '';
		foreach ( $column_arrays as $column_images ) {
			if ( empty( $column_images ) ) {
				// Add empty cell for balance
				$cell_attrs = array(
					'style' => sprintf(
						'width: %s%%; padding: %dpx; vertical-align: top;',
						( 100 / $columns ),
						$cell_padding
					),
				);
				$row_cells .= \Automattic\WooCommerce\EmailEditor\Integrations\Utils\Table_Wrapper_Helper::render_table_cell(
					'',
					$cell_attrs
				);
				continue;
			}

			// Calculate cell attributes
			$cell_width_percent = ( 100 / $columns );
			$cell_attrs         = array(
				'style' => sprintf(
					'width: %s%%; padding: %dpx; vertical-align: top;',
					$cell_width_percent,
					$cell_padding
				),
			);

			// Generate mosaic-style groupings within this column
			$column_rows = self::generate_column_mosaic_rows( $column_images );

			$cell_content = '';
			foreach ( $column_rows as $row_index => $row_images ) {
				foreach ( $row_images as $image ) {
					$image_styles = self::generate_image_styles( false );

					// Add top margin to all images except the first one in the column
					if ( $row_index > 0 || $cell_content !== '' ) {
						$image_styles .= ' margin-top: ' . ( $cell_padding * 2 ) . 'px;';
					}

					$cell_content .= self::generate_image_html( $image, $image_styles, $border_radius_style, $attr );
				}
			}

			$row_cells .= \Automattic\WooCommerce\EmailEditor\Integrations\Utils\Table_Wrapper_Helper::render_table_cell(
				$cell_content,
				$cell_attrs
			);
		}

		// Use Table_Wrapper_Helper for email-compatible table rendering
		$table_attrs = array(
			'style' => 'width: 100%; border-collapse: collapse;',
		);

		$content_parts[] = \Automattic\WooCommerce\EmailEditor\Integrations\Utils\Table_Wrapper_Helper::render_table_wrapper(
			$row_cells,
			$table_attrs
		);

		// Use Table_Wrapper_Helper for consistent email rendering
		$wrapper_attrs = array(
			'style' => 'width: 100%; border-collapse: collapse;',
		);

		return \Automattic\WooCommerce\EmailEditor\Integrations\Utils\Table_Wrapper_Helper::render_table_wrapper(
			implode( '', $content_parts ),
			$wrapper_attrs
		);
	}

	/**
	 * Build mosaic layout content with flexible row/column structure.
	 *
	 * @param array $images Array of image data.
	 * @param int   $cell_padding Cell padding.
	 * @param int   $border_radius Border radius value (0-20).
	 * @param array $attr Block attributes.
	 * @return string HTML content.
	 */
	private static function build_mosaic_layout_content( $images, $cell_padding, $border_radius = 0, $attr = array() ) {
		$border_radius_style = self::generate_border_radius_style( '', $border_radius );

		// Generate mosaic layout rows
		$rows = self::generate_mosaic_rows( $images );

		// Determine the maximum number of columns to ensure consistent layout
		$max_columns = 0;
		foreach ( $rows as $row ) {
			$max_columns = max( $max_columns, count( $row ) );
		}

		// Build each row as a separate table to match flexbox behavior
		$content_parts = array();
		foreach ( $rows as $row ) {
			$images_in_row = count( $row );

			// Calculate width for each cell in this row (like flexbox)
			$cell_width_percent = ( 100 / $images_in_row );

			// Build table cells for this row
			$row_cells = '';
			foreach ( $row as $image ) {
				$cell_style = sprintf(
					'width: %s%%; padding: %dpx; vertical-align: top; text-align: center;',
					$cell_width_percent,
					$cell_padding
				);

				// Set consistent height for all images in this row to ensure alignment
				// Use progressive enhancement: object-fit for supported clients, natural layout for others
				$image_styles = self::generate_image_styles( true );

				$cell_content = self::generate_image_html( $image, $image_styles, $border_radius_style, $attr );

				$row_cells .= sprintf(
					'<td style="%s">%s</td>',
					esc_attr( $cell_style ),
					$cell_content
				);
			}

			// Create a separate table for each row with flexible height for alignment
			$row_table = sprintf(
				'<table role="presentation" style="width: 100%%; border-collapse: collapse; table-layout: fixed;"><tr>%s</tr></table>',
				$row_cells
			);

			$content_parts[] = $row_table;
		}

		// Use Table_Wrapper_Helper for the main container
		$table_attrs = array(
			'style' => 'width: 100%; border-collapse: collapse;',
		);

		return \Automattic\WooCommerce\EmailEditor\Integrations\Utils\Table_Wrapper_Helper::render_table_wrapper(
			implode( '', $content_parts ),
			$table_attrs
		);
	}

	/**
	 * Generate mosaic layout rows based on image count.
	 *
	 * @param array $images Array of image data.
	 * @return array Array of rows, each containing images.
	 */
	private static function generate_mosaic_rows( $images ) {
		$rows        = array();
		$image_count = count( $images );

		// More sophisticated mosaic algorithm based on image count
		if ( $image_count <= 3 ) {
			// For 3 or fewer images, use simple layout
			$rows[] = $images;
		} else {
			// For more images, create varied row patterns
			$patterns = array(
				4 => array( 2, 2 ),      // 4 images: 2 + 2
				5 => array( 2, 3 ),      // 5 images: 2 + 3
				6 => array( 3, 3 ),      // 6 images: 3 + 3
				7 => array( 3, 2, 2 ),   // 7 images: 3 + 2 + 2
				8 => array( 3, 3, 2 ),   // 8 images: 3 + 3 + 2
				9 => array( 3, 3, 3 ),   // 9 images: 3 + 3 + 3
			);

			if ( isset( $patterns[ $image_count ] ) ) {
				// Use predefined pattern for 4-9 images
				$pattern     = $patterns[ $image_count ];
				$image_index = 0;

				foreach ( $pattern as $images_in_row ) {
					$row = array();
					for ( $i = 0; $i < $images_in_row; $i++ ) {
						$row[] = $images[ $image_index ];
						++$image_index;
					}
					$rows[] = $row;
				}
			} else {
				// For 10+ images, create rows of 3 with remainder handling
				$full_rows = intval( $image_count / 3 );
				$remainder = $image_count % 3;

				$image_index = 0;

				// Create full rows of 3
				for ( $row = 0; $row < $full_rows; $row++ ) {
					$rows[]       = array(
						$images[ $image_index ],
						$images[ $image_index + 1 ],
						$images[ $image_index + 2 ],
					);
					$image_index += 3;
				}

				// Handle remainder
				if ( $remainder > 0 ) {
					$remaining = array_slice( $images, $image_index );
					$rows[]    = $remaining;
				}
			}
		}

		return $rows;
	}

	/**
	 * Generate mosaic-style rows within a single column for columns layout.
	 *
	 * @param array $images Array of image data for this column.
	 * @return array Array of rows, each containing 1-2 images for variety.
	 */
	private static function generate_column_mosaic_rows( $images ) {
		$rows        = array();
		$image_count = count( $images );

		if ( $image_count <= 2 ) {
			// For 2 or fewer images, each gets its own row
			foreach ( $images as $image ) {
				$rows[] = array( $image );
			}
		} else {
			// Create varied patterns: mix of single and paired images
			$image_index = 0;

			while ( $image_index < $image_count ) {
				$remaining = $image_count - $image_index;

				if ( $remaining === 1 ) {
					// Last image - single row
					$rows[] = array( $images[ $image_index ] );
					++$image_index;
				} elseif ( $remaining === 3 ) {
					// 3 remaining - do 1 + 2 for better balance
					$rows[] = array( $images[ $image_index ] );
					++$image_index;
					$rows[]       = array( $images[ $image_index ], $images[ $image_index + 1 ] );
					$image_index += 2;
				} else {
					// 2 or more remaining - alternate between single and pairs
					$use_pair = ( count( $rows ) % 2 === 1 ); // Alternate pattern

					if ( $use_pair && $remaining >= 2 ) {
						// Create a pair
						$rows[]       = array( $images[ $image_index ], $images[ $image_index + 1 ] );
						$image_index += 2;
					} else {
						// Single image
						$rows[] = array( $images[ $image_index ] );
						++$image_index;
					}
				}
			}
		}

		return $rows;
	}

	/**
	 * Generate border radius style based on layout style and border radius value.
	 *
	 * @param string $style Layout style (square, circle, etc.).
	 * @param int    $border_radius Border radius value.
	 * @return string CSS border-radius style.
	 */
	private static function generate_border_radius_style( $style, $border_radius ) {
		if ( 'circle' === $style ) {
			return 'border-radius:50%;';
		} elseif ( $border_radius > 0 ) {
			return 'border-radius:' . $border_radius . 'px;';
		}
		return '';
	}

	/**
	 * Generate image styles for email rendering.
	 *
	 * @param bool $use_fixed_height Whether to use fixed height with object-fit.
	 * @return string CSS style string.
	 */
	private static function generate_image_styles( $use_fixed_height = false ) {
		$base_styles = 'margin: 0; width: 100%; max-width: 100%; display: block;';

		if ( $use_fixed_height ) {
			return $base_styles . ' height: 200px; object-fit: cover; object-position: center;';
		}

		return $base_styles . ' height: auto;';
	}

	/**
	 * Generate image HTML with consistent styling.
	 *
	 * @param array  $image Image data array.
	 * @param string $additional_styles Additional CSS styles.
	 * @param string $border_radius_style Border radius CSS.
	 * @param array  $attr Block attributes (optional, for link processing).
	 * @return string Image HTML.
	 */
	private static function generate_image_html( $image, $additional_styles = '', $border_radius_style = '', $attr = array() ) {
		$base_styles     = 'border:none;background-color:#0000001a;display:block;height:auto;max-width:100%;padding:0;';
		$combined_styles = $base_styles . $additional_styles . $border_radius_style;

		$img_html = sprintf(
			'<img alt="%s" src="%s" style="%s" />',
			esc_attr( $image['alt'] ),
			esc_url( $image['url'] ),
			$combined_styles
		);

		// Handle link settings for email
		$link_to = ! empty( $attr['linkTo'] ) ? $attr['linkTo'] : 'none';
		$href    = self::get_image_link_href( $image, $attr, $link_to );

		if ( ! empty( $href ) ) {
			return sprintf( '<a href="%s">%s</a>', esc_url( $href ), $img_html );
		}

		return $img_html;
	}

	/**
	 * Get the href for an image based on link settings (used for email rendering).
	 * Excludes custom links which email clients will replace with the image.
	 *
	 * @since 15.0
	 *
	 * @param array  $image Image data array.
	 * @param array  $attr Block attributes.
	 * @param string $link_to Link setting.
	 * @return string The href URL or empty string.
	 */
	private static function get_image_link_href( $image, $attr, $link_to ) {
		switch ( $link_to ) {
			case 'media':
				return ! empty( $image['url'] ) ? $image['url'] : '';

			case 'attachment':
				// For email, we need to generate the attachment page URL from the image ID
				if ( ! empty( $image['id'] ) ) {
					$attachment_url = get_permalink( $image['id'] );
					return $attachment_url ? $attachment_url : '';
				}
				return '';
			default:
				return '';
		}
	}

	/**
	 * Create hierarchical chunks for square/circle layouts with larger items first.
	 *
	 * @param array $images Array of image data.
	 * @param int   $columns Number of columns for the layout.
	 * @return array Array of rows with different sized chunks.
	 */
	private static function create_hierarchical_chunks( $images, $columns ) {
		$image_count = count( $images );
		$chunks      = array();

		if ( $image_count <= $columns ) {
			// For column count or fewer, single row
			$chunks[] = $images;
		} else {
			// Calculate remainder when dividing by columns
			$remainder   = $image_count % $columns;
			$start_index = 0;

			// Handle all remainder cases to create proper hierarchy
			if ( $remainder > 0 ) {
				// Create a row with the remainder images (larger items first)
				$chunks[]    = array_slice( $images, 0, $remainder );
				$start_index = $remainder;
			}
			// If remainder === 0, start_index stays 0

			// Rest in groups of $columns
			$remaining        = array_slice( $images, $start_index );
			$remaining_chunks = array_chunk( $remaining, $columns );
			$chunks           = array_merge( $chunks, $remaining_chunks );
		}

		return $chunks;
	}
}

add_action( 'init', array( Tiled_Gallery::class, 'register' ) );
