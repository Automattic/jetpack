<?php

namespace Automattic\Jetpack_Boost\Modules\Optimizations\Lcp;

use Automattic\Jetpack\Image_CDN\Image_CDN_Core;

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

		// Remove the last (closing) character from the LCP HTML in case the buffer adds a closing forward slash to the img tag. Which is not found by the Cloud.
		$lcp_html = substr( $this->lcp_data['html'], 0, -1 );

		// If the LCP HTML is not found in the buffer, return early.
		if ( ! str_contains( $buffer, $lcp_html ) ) {
			return $buffer;
		}

		if ( $this->lcp_data['type'] === LCP::TYPE_IMAGE ) {
			// Create the optimized tag with required attributes.
			$optimized_tag = $this->optimize_image( $lcp_html );

			return str_replace( $lcp_html, $optimized_tag, $buffer );
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
	 * @param string $tag The original image tag.
	 * @return string The optimized image tag.
	 *
	 * @since 4.0.0
	 */
	private function optimize_image( $tag ) {
		// Add fetchpriority="high" if not present
		if ( ! preg_match( '/fetchpriority\s*=\s*["\']high["\']/i', $tag ) ) {
			$tag = preg_replace( '/<img\s/i', '<img fetchpriority="high" ', $tag );
		}

		// Add loading="eager" if not present
		if ( ! preg_match( '/loading\s*=\s*["\']eager["\']/i', $tag ) ) {
			$tag = preg_replace( '/<img\s/i', '<img loading="eager" ', $tag );
		}

		if ( ! preg_match( '/src\s*=\s*["\']([^"\']+)["\']/i', $tag, $matches ) ) {
			return $tag;
		}

		$image_url = $matches[1];

		// Update the src attribute with the CDN URL
		$tag = str_replace(
			$image_url,
			Image_CDN_Core::cdn_url( $image_url ),
			$tag
		);
		$tag = $this->add_responsive_image_attributes( $tag, $image_url );

		return $tag;
	}

	/**
	 * Optimize an image tag by adding srcset and sizes attributes.
	 *
	 * @param string $tag The original image tag.
	 * @param string $image_url The image URL.
	 * @return string The optimized image tag.
	 *
	 * @since 4.0.0
	 */
	private function add_responsive_image_attributes( $tag, $image_url ) {
		$image_sizes = array( 300, 600, 900, 1200, 1600 );
		$sizes       = array();
		foreach ( $image_sizes as $size ) {
			$sizes[ $size ] = array( 'w' => $size );
		}

		// Generate srcset
		$srcset = array();
		foreach ( $sizes as $width => $args ) {
			$srcset[] = Image_CDN_Core::cdn_url( $image_url, $args ) . ' ' . $width . 'w';
		}

		// Add srcset attribute
		$tag = preg_replace( '/srcset\s*=\s*["\'][^"\']*["\']/i', '', $tag );
		$tag = preg_replace( '/<img\s/i', '<img srcset="' . esc_attr( implode( ', ', $srcset ) ) . '" ', $tag );

		// Add sizes attribute
		$sizes_string = '';
		foreach ( $image_sizes as $width ) {
			$sizes_string .= '(max-width: ' . $width . 'px) 100vw, ';
		}
		$sizes_string = rtrim( $sizes_string, ', ' );

		// Update the sizes attribute
		$tag = preg_replace( '/sizes\s*=\s*["\'][^"\']*["\']/i', '', $tag );
		$tag = preg_replace( '/<img\s/i', '<img sizes="' . esc_attr( $sizes_string ) . '" ', $tag );

		return $tag;
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
