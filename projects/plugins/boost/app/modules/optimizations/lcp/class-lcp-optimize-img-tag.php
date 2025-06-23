<?php

namespace Automattic\Jetpack_Boost\Modules\Optimizations\Lcp;

use Automattic\Jetpack\Image_CDN\Image_CDN;
use Automattic\Jetpack\Image_CDN\Image_CDN_Core;
use WP_HTML_Tag_Processor;

class LCP_Optimize_Img_Tag {

	/**
	 * LCP data.
	 *
	 * @var array
	 */
	private $lcp_data;

	public function __construct( $lcp_data ) {
		$this->lcp_data = $lcp_data;
	}

	/**
	 * Optimize a viewport's LCP HTML.
	 *
	 * @param string $buffer The buffer/html to optimize.
	 * @return string The optimized buffer, or the original buffer if no optimization was needed
	 *
	 * @since 4.0.0
	 */
	public function optimize_buffer( $buffer ) {
		$optimization_util = new LCP_Optimization_Util( $this->lcp_data );
		if ( ! $optimization_util->can_optimize() ) {
			return $buffer;
		}

		// Defensive check to ensure the LCP HTML is not empty.
		if ( empty( $this->lcp_data['html'] ) ) {
			return $buffer;
		}

		// Only optimize if the type is one we know how to handle.
		if ( $this->lcp_data['type'] !== LCP::TYPE_IMAGE ) {
			return $buffer;
		}

		$buffer_processor = $optimization_util->find_element( $buffer );
		if ( ! $buffer_processor ) {
			return $buffer;
		}

		// Create the optimized tag with required attributes.
		return $this->optimize_image( $buffer_processor );
	}

	/**
	 * Optimize an image tag by adding required attributes.
	 *
	 * @param WP_HTML_Tag_Processor $buffer_processor The original HTML chunk of the page..
	 *
	 * @return string The optimized buffer.
	 *
	 * @since 4.0.0
	 */
	private function optimize_image( $buffer_processor ) {
		// Apply optimizations to the matched tag
		$buffer_processor->set_attribute( 'fetchpriority', 'high' );
		$buffer_processor->set_attribute( 'loading', 'eager' );
		$buffer_processor->set_attribute( 'data-jp-lcp-optimized', 'true' );

		$image_url = $buffer_processor->get_attribute( 'src' );
		// Ensure the image URL is valid.
		if ( ! wp_http_validate_url( $image_url ) ) {
			return $buffer_processor->get_updated_html();
		}

		// If the image isn't photonized, it might be resized by WP.
		// We need the original image URL, as we'll be generating
		// the necessary sizes based on it.
		if ( ! Image_CDN_Core::is_cdn_url( $image_url ) ) {
			$image_url = Image_CDN::strip_image_dimensions_maybe( $image_url );
		} else {
			// In case it's Photonized, we need to remove any size change arguments.
			$image_url = remove_query_arg( array( 'w', 'h' ), $image_url );
		}

		// Additional validation after cleaning.
		if ( ! wp_http_validate_url( $image_url ) ) {
			return $buffer_processor->get_updated_html();
		}

		$buffer_processor->set_attribute( 'src', Image_CDN_Core::cdn_url( $image_url ) );

		$this->add_responsive_image_attributes( $buffer_processor, $image_url );

		return $buffer_processor->get_updated_html();
	}

	/**
	 * Optimize an image tag by adding srcset and sizes attributes.
	 *
	 * @param WP_HTML_Tag_Processor $element The original image tag.
	 * @param string                $image_url The image URL.
	 * @return WP_HTML_Tag_Processor The optimized image tag.
	 *
	 * @since 4.0.0
	 */
	private function add_responsive_image_attributes( $element, $image_url ) {
		if ( empty( $this->lcp_data['breakpoints'] ) ) {
			return $element;
		}

		$srcset = $this->get_srcset( $image_url );
		if ( ! empty( $srcset ) ) {
			$element->set_attribute( 'srcset', $srcset );
		}

		$sizes = $this->get_sizes();
		if ( ! empty( $sizes ) ) {
			$element->set_attribute( 'sizes', $sizes );
		}

		return $element;
	}

	/**
	 * Get the srcsets for an image.
	 *
	 * @param string $original_url The original image URL.
	 * @return string The srcset for the image.
	 *
	 * @since 4.1.0
	 */
	private function get_srcset( $original_url ) {
		$dimensions = array();
		foreach ( $this->lcp_data['breakpoints'] as $breakpoint ) {
			foreach ( $breakpoint['imageDimensions'] as $breakpoint_dimensions ) {
				if ( ! is_numeric( $breakpoint_dimensions['width'] ) || ! is_numeric( $breakpoint_dimensions['height'] ) ) {
					continue;
				}

				$width                = (int) $breakpoint_dimensions['width'];
				$height               = (int) $breakpoint_dimensions['height'];
				$dimensions[ $width ] = $height;

				// If it's a Moto G Power, include a 1.75 DPR for accurate lighthouse representation of the optimized image.
				if ( isset( $breakpoint['maxWidth'] ) && $breakpoint['maxWidth'] === 412 ) {
					$dimensions[ (int) round( $width * 1.75 ) ] = round( $height * 1.75 );
				}

				// Include 2x DPR.
				$dimensions[ $width * 2 ] = $height * 2;

				// If it's a mobile breakpoint, include 3x DPR.
				if ( isset( $breakpoint['maxWidth'] ) && $breakpoint['maxWidth'] <= 480 ) {
					$dimensions[ $width * 3 ] = $height * 3;
				}
			}
		}

		// Remove unnecessary widths to save some bytes in the HTML.
		$reduced_widths = $this->reduce_widths( array_keys( $dimensions ) );

		$srcset = array();
		foreach ( $reduced_widths as $width ) {
			$srcset[] = Image_CDN_Core::cdn_url(
				$original_url,
				array(
					'resize' => array( $width, $dimensions[ $width ] ),
				)
			) . " {$width}w";
		}

		return implode( ', ', $srcset );
	}

	/**
	 * Remove any width if we have another higher width that is within 20px.
	 *
	 * @param array $widths The widths to reduce.
	 * @return array The reduced widths.
	 */
	private function reduce_widths( $widths ) {
		rsort( $widths );
		$reduced_widths = array();
		$previous_width = 999999;
		foreach ( $widths as $width ) {
			if ( $previous_width - 20 < $width ) {
				continue;
			}

			$previous_width   = $width;
			$reduced_widths[] = $width;
		}
		return $reduced_widths;
	}

	/**
	 * Get the sizes for an image.
	 *
	 * @return string The sizes for the image.
	 *
	 * @since 4.1.0
	 */
	private function get_sizes() {
		$sizes = array();
		foreach ( $this->lcp_data['breakpoints'] as $breakpoint ) {
			// Make sure widthValue is a known format.
			if ( ! isset( $breakpoint['widthValue'] ) || ! preg_match( '/^[0-9]+(?:\.[0-9]+)?(?:px|vw)$/', $breakpoint['widthValue'] ) ) {
				continue;
			}

			// Make sure minWidth is valid if set.
			if ( isset( $breakpoint['minWidth'] ) && ! is_numeric( $breakpoint['minWidth'] ) ) {
				continue;
			}

			$min_width_query = isset( $breakpoint['minWidth'] ) ? '(min-width: ' . $breakpoint['minWidth'] . 'px) ' : '';

			$sizes[] = $min_width_query . $breakpoint['widthValue'];
		}

		return implode( ', ', $sizes );
	}
}
