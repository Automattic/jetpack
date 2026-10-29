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
		// Check optimizations object for fetchpriority.
		// If no optimizations object exists (old cloud response), default to applying.
		$apply_fetchpriority = LCP_Optimization_Util::should_apply_optimization( $this->lcp_data, 'fetchpriority' );

		if ( $apply_fetchpriority ) {
			$buffer_processor->set_attribute( 'fetchpriority', 'high' );
		}

		// Check optimizations object for loading.
		$apply_loading = LCP_Optimization_Util::should_apply_optimization( $this->lcp_data, 'loading' );

		if ( $apply_loading ) {
			$buffer_processor->set_attribute( 'loading', 'eager' );
		}

		$buffer_processor->set_attribute( 'data-jp-lcp-optimized', 'true' );

		$image_url = $buffer_processor->get_attribute( 'src' );
		// Ensure the image URL is valid.
		if ( ! wp_http_validate_url( $image_url ) ) {
			return $buffer_processor->get_updated_html();
		}

		$resized_src = '';

		// If the image isn't photonized, it might be resized by WP.
		// We need the original image URL, as we'll be generating
		// the necessary sizes based on it.
		if ( ! Image_CDN_Core::is_cdn_url( $image_url ) ) {
			$original_src = (string) $image_url;
			$image_url    = Image_CDN::strip_image_dimensions_maybe( $original_src );

			// Its -WxH suffix names a WordPress size only if stripping found the original.
			if ( $image_url !== $original_src ) {
				$resized_src = $original_src;
			}
		} else {
			// In case it's Photonized, we need to remove any size change arguments.
			$image_url = remove_query_arg( array( 'w', 'h' ), $image_url );
		}

		// Additional validation after cleaning.
		if ( ! wp_http_validate_url( $image_url ) ) {
			return $buffer_processor->get_updated_html();
		}

		// Check optimizations object for cdnUrl.
		$apply_cdn = LCP_Optimization_Util::should_apply_optimization( $this->lcp_data, 'cdnUrl' );

		if ( $apply_cdn ) {
			$buffer_processor->set_attribute( 'src', Image_CDN_Core::cdn_url( $image_url ) );
		}

		// Check optimizations object for srcset.
		// The cloud sets srcset to false when custom focal points are detected
		// (resize would use center-crop, losing the author's object-position).
		$apply_srcset = LCP_Optimization_Util::should_apply_optimization( $this->lcp_data, 'srcset' );

		// srcset uses CDN URLs internally (via Image_CDN_Core::cdn_url), so skip if CDN is disabled.
		if ( $apply_srcset && $apply_cdn ) {
			$this->add_responsive_image_attributes( $buffer_processor, $image_url, $resized_src );
		}

		return $buffer_processor->get_updated_html();
	}

	/**
	 * Optimize an image tag by adding srcset and sizes attributes.
	 *
	 * @param WP_HTML_Tag_Processor $element The original image tag.
	 * @param string                $image_url The image URL.
	 * @param string                $resized_src The WordPress-resized src swapped for the original, if any.
	 * @return WP_HTML_Tag_Processor The optimized image tag.
	 *
	 * @since 4.0.0
	 */
	private function add_responsive_image_attributes( $element, $image_url, $resized_src = '' ) {
		// is_array() as well as empty(): empty( 'not-an-array' ) is false, so a string
		// breakpoints field would reach the foreach in get_srcset() and get_sizes().
		if ( empty( $this->lcp_data['breakpoints'] ) || ! is_array( $this->lcp_data['breakpoints'] ) ) {
			return $element;
		}

		$object_fit = $this->get_object_fit( $element );

		// Under cover, a file cropped to the box shows the same picture and is smaller.
		$aspect_ratio = 'cover' === $object_fit ? null : $this->get_aspect_ratio( $element, $resized_src );

		$srcset = $this->get_srcset( $image_url, $aspect_ratio, 'contain' === $object_fit );
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
	 * Get the image's object-fit: the computed one the cloud reports, which sees stylesheets too,
	 * else the one the markup sets, for reports from before the cloud sent it.
	 *
	 * @param WP_HTML_Tag_Processor $element The image tag.
	 * @return string|null 'cover', 'contain', or null for any other fit.
	 */
	private function get_object_fit( $element ) {
		$fit = $this->get_marked_object_fit( $element );

		if ( isset( $this->lcp_data['objectFit'] ) && is_string( $this->lcp_data['objectFit'] ) ) {
			$reported = strtolower( $this->lcp_data['objectFit'] );

			// A template save doesn't redo the analysis, so when the markup disagrees, assume no fit: it never crops.
			$fit = null === $fit || $fit === $reported ? $reported : null;
		}

		return in_array( $fit, array( 'cover', 'contain' ), true ) ? $fit : null;
	}

	/**
	 * Get the object-fit the markup sets, as core's Featured Image (inline style) and Cover
	 * (data-object-fit) blocks do.
	 *
	 * @param WP_HTML_Tag_Processor $element The image tag.
	 * @return string|null The fit, lowercased, or null if the markup sets none.
	 */
	private function get_marked_object_fit( $element ) {
		// Inline style first: its last !important declaration, else its last, as CSS applies them.
		$style = $element->get_attribute( 'style' );
		if ( is_string( $style ) && preg_match_all( '/(?:^|;)\s*object-fit\s*:\s*([a-z-]+)\s*(!important\s*)?(?=;|$)/i', $style, $matches ) ) {
			$important = array_filter( $matches[2] );
			$fits      = $important ? array_intersect_key( $matches[1], $important ) : $matches[1];
			return strtolower( end( $fits ) );
		}

		if ( 'cover' === $element->get_attribute( 'data-object-fit' ) ) {
			return 'cover';
		}

		return null;
	}

	/**
	 * Get the aspect ratio of the file the page asked for.
	 *
	 * @param WP_HTML_Tag_Processor $element     The image tag.
	 * @param string                $resized_src The WordPress-resized src swapped for the original, if any.
	 * @return float|null Width divided by height, or null if neither source gives both.
	 */
	private function get_aspect_ratio( $element, $resized_src ) {
		// The size's -WxH suffix first: the attributes can describe a different size than the file.
		list( $width, $height ) = Image_CDN::parse_dimensions_from_filename( (string) $resized_src );
		if ( ! $width || ! $height ) {
			$width  = $element->get_attribute( 'width' );
			$height = $element->get_attribute( 'height' );
		}

		$width  = $this->to_dimension( $width );
		$height = $this->to_dimension( $height );

		return $width && $height ? $width / $height : null;
	}

	/**
	 * Read a pixel size, as digits only like Image CDN does.
	 *
	 * @param mixed $value An attribute or filename value.
	 * @return int|null The size, or null if it is not a whole number from 1 to 65535.
	 */
	private function to_dimension( $value ) {
		if ( is_int( $value ) ) {
			$value = (string) $value;
		}

		// The cap keeps the widened sizes below in int range.
		if ( ! is_string( $value ) || ! ctype_digit( $value ) || (int) $value < 1 || (int) $value > 65535 ) {
			return null;
		}

		return (int) $value;
	}

	/**
	 * Get the srcsets for an image.
	 *
	 * @param string     $original_url The original image URL.
	 * @param float|null $aspect_ratio The image's width divided by its height, if known.
	 * @param bool       $fit_inside   Whether the image is drawn inside the box (object-fit: contain).
	 * @return string The srcset for the image.
	 *
	 * @since 4.1.0
	 */
	private function get_srcset( $original_url, $aspect_ratio = null, $fit_inside = false ) {
		$dimensions = array();
		foreach ( $this->lcp_data['breakpoints'] as $breakpoint ) {
			// The field is optional; the background-image sibling has always carried
			// this guard, and without it an absent one is a foreach() TypeError on
			// wp_head.
			if ( empty( $breakpoint['imageDimensions'] ) || ! is_array( $breakpoint['imageDimensions'] ) ) {
				continue;
			}

			foreach ( $breakpoint['imageDimensions'] as $breakpoint_dimensions ) {
				if ( ! is_array( $breakpoint_dimensions ) ) {
					continue;
				}

				// isset() as well as is_numeric(): is_numeric( $absent ) is an undefined
				// key warning before it is false.
				if ( ! isset( $breakpoint_dimensions['width'] ) || ! isset( $breakpoint_dimensions['height'] ) ) {
					continue;
				}

				if ( ! is_numeric( $breakpoint_dimensions['width'] ) || ! is_numeric( $breakpoint_dimensions['height'] ) ) {
					continue;
				}

				$width  = (int) $breakpoint_dimensions['width'];
				$height = (int) $breakpoint_dimensions['height'];

				// Resize to the image's own proportions, covering the box or fitting inside it: a box
				// shaped differently would otherwise be cropped into the file, where CSS cannot undo it.
				$file_width  = $width;
				$file_height = $height;
				if ( $aspect_ratio ) {
					$width_at_box_height = (int) ceil( $height * $aspect_ratio );

					$file_width  = $fit_inside ? min( $width, $width_at_box_height ) : max( $width, $width_at_box_height );
					$file_height = (int) round( $file_width / $aspect_ratio );
				}

				// Keyed by the box width, not the file's: the w descriptors must match `sizes`,
				// or object-fit: cover draws the widened file at a lower density than the DPR.
				$add = function ( $dpr ) use ( &$dimensions, $width, $file_width, $file_height ) {
					$dimensions[ (int) round( $width * $dpr ) ] = array( (int) round( $file_width * $dpr ), (int) round( $file_height * $dpr ) );
				};

				$add( 1 );

				// If it's a Moto G Power, include a 1.75 DPR for accurate lighthouse representation of the optimized image.
				if ( isset( $breakpoint['maxWidth'] ) && $breakpoint['maxWidth'] === 412 ) {
					$add( 1.75 );
				}

				// Include 2x DPR.
				$add( 2 );

				// If it's a mobile breakpoint, include 3x DPR.
				if ( isset( $breakpoint['maxWidth'] ) && $breakpoint['maxWidth'] <= 480 ) {
					$add( 3 );
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
					'resize' => $dimensions[ $width ],
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
			// is_string() as well as isset(): an array widthValue is a TypeError from
			// preg_match(), inside the output buffer callback.
			if ( ! isset( $breakpoint['widthValue'] ) || ! is_string( $breakpoint['widthValue'] ) || ! preg_match( '/^[0-9]+(?:\.[0-9]+)?(?:px|vw)$/', $breakpoint['widthValue'] ) ) {
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
