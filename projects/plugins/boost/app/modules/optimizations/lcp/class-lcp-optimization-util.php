<?php

namespace Automattic\Jetpack_Boost\Modules\Optimizations\Lcp;

use WP_HTML_Tag_Processor;

class LCP_Optimization_Util {

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

	public function get_lcp_image_url() {
		if ( ! $this->can_optimize() ) {
			return null;
		}

		if ( LCP::TYPE_BACKGROUND_IMAGE !== $this->lcp_data['type'] && LCP::TYPE_IMAGE !== $this->lcp_data['type'] ) {
			return null;
		}

		if ( empty( $this->lcp_data['url'] ) ) {
			return null;
		}

		if ( ! wp_http_validate_url( $this->lcp_data['url'] ) ) {
			return null;
		}

		return $this->lcp_data['url'];
	}

	/**
	 * Check if the LCP data is valid and can be optimized.
	 *
	 * @return bool True if the LCP data is valid and can be optimized, false otherwise.
	 *
	 * @since 4.1.0
	 */
	public function can_optimize() {
		if ( empty( $this->lcp_data ) || ! is_array( $this->lcp_data ) ) {
			return false;
		}

		if ( ! isset( $this->lcp_data['success'] ) || ! $this->lcp_data['success'] ) {
			return false;
		}

		return true;
	}

	/**
	 * Check if the element is present in the LCP data.
	 *
	 * @param string $buffer The HTML to check.
	 * @param string $tag The tag to check. Default is 'img'.
	 * @return WP_HTML_Tag_Processor|false The HTML tag processor if the element is present, false otherwise.
	 *
	 * @since 4.1.0
	 */
	public function find_element( $buffer, $tag = 'img' ) {
		$html_processor = new WP_HTML_Tag_Processor( $buffer );
		$element        = new WP_HTML_Tag_Processor( $this->lcp_data['html'] );

		// Ensure the LCP HTML is a valid tag before proceeding.
		if ( ! $element->next_tag( $tag ) ) {
			return false;
		}

		// Extract attributes from the LCP tag for matching
		$lcp_id    = $element->get_attribute( 'id' );
		$lcp_class = $element->get_attribute( 'class' );

		// Perform a quick check to see if the class is present in the HTML.
		if ( ! empty( $lcp_class ) && ! str_contains( $buffer, $lcp_class ) ) {
			return false;
		}

		// Loop through all img tags in the buffer with the same class until we find a match.
		// We do this because next_tag does not support matching on IDs and sources.
		while ( $html_processor->next_tag( $tag ) ) {
			// Tag is considered a match if the class and id match.
			if ( $lcp_id === $html_processor->get_attribute( 'id' ) &&
				$lcp_class === $html_processor->get_attribute( 'class' ) ) {
				return $html_processor;
			}
		}

		return false;
	}
}
