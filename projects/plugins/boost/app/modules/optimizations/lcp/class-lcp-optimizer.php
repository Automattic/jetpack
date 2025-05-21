<?php

namespace Automattic\Jetpack_Boost\Modules\Optimizations\Lcp;

use Automattic\Jetpack\Image_CDN\Image_CDN_Core;
use WP_HTML_Tag_Processor;

class LCP_Optimizer {

	/**
	 * Each LCP data is an array that includes the LCP for a certain viewport.
	 *
	 * @var array
	 */
	private $lcp_data;

	public function __construct( $lcp_data ) {
		$this->lcp_data = $lcp_data;
	}

	/**
	 * Check if LCP optimization should be skipped for the current request.
	 *
	 * @since 4.0.0
	 * @return bool True if optimization should be skipped, false otherwise.
	 */
	public static function should_skip_optimization() {
		/**
		 * Filters whether to short-circuit LCP optimization.
		 *
		 * Returning a value other than null from the filter will short-circuit
		 * the optimization check, returning that value instead.
		 *
		 * @since 4.0.0
		 *
		 * @param null|bool $skip Whether to skip optimization. Default null.
		 */
		$pre = apply_filters( 'jetpack_boost_pre_should_skip_lcp_optimization', null );
		if ( null !== $pre ) {
			return $pre;
		}

		// Disable in robots.txt.
		if ( isset( $_SERVER['REQUEST_URI'] ) && strpos( home_url( wp_unslash( $_SERVER['REQUEST_URI'] ) ), 'robots.txt' ) !== false ) { // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- This is validating.
			return true;
		}

		// Disable in other possible AJAX requests setting cors related header.
		if ( isset( $_SERVER['HTTP_SEC_FETCH_MODE'] ) && 'cors' === strtolower( $_SERVER['HTTP_SEC_FETCH_MODE'] ) ) { // phpcs:ignore WordPress.Security.ValidatedSanitizedInput -- This is validating.
			return true;
		}

		// Disable in other possible AJAX requests setting XHR related header.
		if ( isset( $_SERVER['HTTP_X_REQUESTED_WITH'] ) && 'xmlhttprequest' === strtolower( $_SERVER['HTTP_X_REQUESTED_WITH'] ) ) { // phpcs:ignore WordPress.Security.ValidatedSanitizedInput -- This is validating.
			return true;
		}

		// Disable in all XLS (see the WP_Sitemaps_Renderer class).
		if ( isset( $_SERVER['REQUEST_URI'] ) &&
		(
			// phpcs:disable WordPress.Security.ValidatedSanitizedInput -- This is validating.
			str_contains( $_SERVER['REQUEST_URI'], '.xsl' ) ||
			str_contains( $_SERVER['REQUEST_URI'], 'sitemap-stylesheet=index' ) ||
			str_contains( $_SERVER['REQUEST_URI'], 'sitemap-stylesheet=sitemap' )
			// phpcs:enable WordPress.Security.ValidatedSanitizedInput
		) ) {
			return true;
		}

		// Disable in all POST Requests.
		// phpcs:disable WordPress.Security.NonceVerification.Missing
		if ( ! empty( $_POST ) ) {
			return true;
		}

		// Disable in customizer previews
		if ( is_customize_preview() ) {
			return true;
		}

		// Disable in feeds, AJAX, Cron, XML.
		if ( is_feed() || wp_doing_ajax() || wp_doing_cron() || wp_is_xml_request() ) {
			return true;
		}

		// Disable in sitemaps.
		if ( ! empty( get_query_var( 'sitemap' ) ) ) {
			return true;
		}

		// Disable in AMP pages.
		if ( function_exists( 'amp_is_request' ) && amp_is_request() ) {
			return true;
		}

		return false;
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
		if ( ! $this->can_optimize() ) {
			return $buffer;
		}

		// Defensive check to ensure the LCP HTML is not empty.
		if ( empty( $this->lcp_data['html'] ) ) {
			return $buffer;
		}

		// Only optimize if the type is one we know how to handle.
		if ( ! in_array( $this->lcp_data['type'], array( LCP::TYPE_BACKGROUND_IMAGE, LCP::TYPE_IMAGE ), true ) ) {
			return $buffer;
		}

		/*
		 * Quickly check if the tag is in the buffer and return early if it's not found.
		 * The HTML returned from cloud may not have a forward slash at the end of the tag, even if the original HTML had one.
		 * By removing the last character from the LCP HTML, we can quickly check if the tag is in the buffer.
		 *
		 * `substr( '<img src="...">', 0, -1 )` -> `<img src="..."`
		 */
		if ( ! str_contains( $buffer, substr( $this->lcp_data['html'], 0, -1 ) ) ) {
			return $buffer;
		}

		if ( $this->lcp_data['type'] === LCP::TYPE_IMAGE ) {
			// Create the optimized tag with required attributes.
			return $this->optimize_image( $buffer, $this->lcp_data['html'] );
		}

		return $buffer;
	}

	public function get_image_to_preload() {
		if ( ! $this->can_optimize() ) {
			return null;
		}

		if ( LCP::TYPE_BACKGROUND_IMAGE !== $this->lcp_data['type'] ) {
			return null;
		}

		if ( empty( $this->lcp_data['elementData'] ) || ! is_array( $this->lcp_data['elementData'] ) ) {
			return null;
		}

		if ( empty( $this->lcp_data['elementData']['url'] ) ) {
			return null;
		}

		if ( ! wp_http_validate_url( $this->lcp_data['elementData']['url'] ) ) {
			return null;
		}

		return $this->lcp_data['elementData']['url'];
	}

	/**
	 * Optimize an image tag by adding required attributes.
	 *
	 * @param string $buffer The original HTML chunk of the page..
	 * @param string $lcp_html The LCP HTML detected by cloud.
	 *
	 * @return string The optimized buffer.
	 *
	 * @since 4.0.0
	 */
	private function optimize_image( $buffer, $lcp_html ) {
		$lcp_processor = new WP_HTML_Tag_Processor( $lcp_html );

		// Ensure the LCP HTML is a valid image tag before proceeding.
		if ( ! $lcp_processor->next_tag( 'img' ) ) {
			return $buffer;
		}

		$id    = $lcp_processor->get_attribute( 'id' );
		$class = $lcp_processor->get_attribute( 'class' );
		$src   = $lcp_processor->get_attribute( 'src' );

		$buffer_processor = new WP_HTML_Tag_Processor( $buffer );
		$tag_found        = $buffer_processor->next_tag(
			array(
				'tag_name' => 'img',
				'id'       => $id,
				'class'    => $class,
				'src'      => $src,
			)
		);

		// Tag not found in buffer
		if ( ! $tag_found ) {
			return $buffer;
		}

		if ( $buffer_processor->get_tag() !== 'IMG' ) {
			return $buffer;
		}

		$buffer_processor->set_attribute( 'fetchpriority', 'high' );
		$buffer_processor->set_attribute( 'loading', 'eager' );
		$buffer_processor->set_attribute( 'data-jp-lcp-optimized', 'true' );

		$image_url = $buffer_processor->get_attribute( 'src' );

		$buffer_processor->set_attribute( 'src', Image_CDN_Core::cdn_url( $image_url ) );

		$this->add_responsive_image_attributes( $buffer_processor, $image_url );

		return $buffer_processor->get_updated_html();
	}

	/**
	 * Optimize an image tag by adding srcset and sizes attributes.
	 *
	 * @param WP_HTML_Tag_Processor $element The original image tag.
	 * @param string                $image_url The image URL.
	 * @return string The optimized image tag.
	 *
	 * @since 4.0.0
	 */
	private function add_responsive_image_attributes( $element, $image_url ) {
		$srcset = $this->get_srcsets( $image_url );
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
	 * @since $$next-version$$
	 */
	public function get_srcsets( $original_url ) {
		if ( empty( $this->lcp_data['srcsets'] ) ) {
			return '';
		}

		// Cater for 412px devices with a 1.75x DPR (721px wide).
		$widths = array( 721 );
		foreach ( $this->lcp_data['srcsets'] as $width ) {
			if ( ! is_numeric( $width ) ) {
				continue;
			}
			$width = (int) $width;

			// For each width, generate srcset entries for 1x and 2x device pixel ratios.
			if ( ! in_array( $width, $widths, true ) ) {
				$widths[] = $width;
			}
			$dpr_width = $width * 2;
			if ( ! in_array( $dpr_width, $widths, true ) ) {
				$widths[] = $dpr_width;
			}

			if ( $width < 500 ) {
				// If the width is less than 500, also include entries for 3x DPR.
				$dpr_width = $width * 3;
				if ( ! in_array( $dpr_width, $widths, true ) ) {
					$widths[] = $dpr_width;
				}
			}
		}

		$srcset = array();
		foreach ( $widths as $width ) {
			$srcset[] = Image_CDN_Core::cdn_url( $original_url, array( 'w' => $width ) ) . " {$width}w";
		}

		return implode( ', ', $srcset );
	}

	/**
	 * Get the sizes for an image.
	 *
	 * @return string The sizes for the image.
	 *
	 * @since $$next-version$$
	 */
	public function get_sizes() {
		if ( empty( $this->lcp_data['sizes'] ) ) {
			return '';
		}

		$sizes = array();
		foreach ( $this->lcp_data['sizes'] as $size ) {
			if ( empty( $size ) ) {
				continue;
			}

			if ( ! isset( $size['viewport'] ) || ! is_numeric( $size['viewport'] ) ) {
				continue;
			}

			$viewport = (int) $size['viewport'];
			$sizes[]  = '(min-width: ' . $viewport . 'px) ' . $size['viewportValue'];
		}

		return implode( ', ', $sizes );
	}

	/**
	 * Check if the LCP data is valid and can be optimized.
	 *
	 * @return bool True if the LCP data is valid and can be optimized, false otherwise.
	 *
	 * @since $$next-version$$
	 */
	private function can_optimize() {
		if ( empty( $this->lcp_data ) || ! is_array( $this->lcp_data ) ) {
			return false;
		}

		if ( ! isset( $this->lcp_data['success'] ) || ! $this->lcp_data['success'] ) {
			return false;
		}

		return true;
	}
}
