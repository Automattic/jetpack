<?php

namespace Automattic\Jetpack_Boost\Modules\Optimizations\Lcp;

use Automattic\Jetpack\Schema\Schema;
use Automattic\Jetpack\WP_JS_Data_Sync\Data_Sync;
use Automattic\Jetpack_Boost\Contracts\Changes_Output_After_Activation;
use Automattic\Jetpack_Boost\Contracts\Feature;
use Automattic\Jetpack_Boost\Contracts\Has_Activate;
use Automattic\Jetpack_Boost\Contracts\Has_Data_Sync;
use Automattic\Jetpack_Boost\Contracts\Needs_To_Be_Ready;
use Automattic\Jetpack_Boost\Contracts\Optimization;
use Automattic\Jetpack_Boost\Lib\Output_Filter;
use Automattic\Jetpack_Boost\REST_API\Contracts\Has_Always_Available_Endpoints;
use Automattic\Jetpack_Boost\REST_API\Endpoints\Update_LCP;

class Lcp implements Feature, Changes_Output_After_Activation, Optimization, Has_Activate, Needs_To_Be_Ready, Has_Data_Sync, Has_Always_Available_Endpoints {
	/**
	 * Utility class that supports output filtering.
	 *
	 * @var Output_Filter
	 */
	private $output_filter = null;

	/**
	 * @since $$next-version$$
	 */
	public function setup() {
		$this->output_filter = new Output_Filter();

		add_action( 'template_redirect', array( $this, 'start_output_filtering' ), -999999 );
	}

	/**
	 * @since $$next-version$$
	 */
	public static function activate() {
		( new LCP_Analyzer() )->start();
	}

	/**
	 * @since $$next-version$$
	 */
	public static function get_slug() {
		return 'lcp';
	}

	public function get_always_available_endpoints() {
		return array(
			new Update_LCP(),
		);
	}

	/**
	 * @since $$next-version$$
	 */
	public static function is_available() {
		if ( defined( 'JETPACK_BOOST_ALPHA_FEATURES' ) && JETPACK_BOOST_ALPHA_FEATURES ) {
			return true;
		}

		return false;
	}

	/**
	 * Check if the module is ready and already serving optimized pages.
	 *
	 * @return bool
	 */
	public function is_ready() {
		return ( new LCP_State() )->is_analyzed();
	}

	/**
	 * Get the action names that will be triggered when the module is ready.
	 *
	 * @return string[]
	 */
	public static function get_change_output_action_names() {
		return array( 'jetpack_boost_lcp_analyzed' );
	}

	/**
	 * Register data sync actions.
	 *
	 * @param Data_Sync $instance The Data_Sync object.
	 */
	public function register_data_sync( $instance ) {
		$instance->register(
			'lcp_state',
			Schema::as_assoc_array(
				array(
					'pages'        => Schema::as_array(
						Schema::as_assoc_array(
							array(
								'key'    => Schema::as_string(),
								'url'    => Schema::as_string(),
								'status' => Schema::as_string(),
							)
						)
					),
					'status'       => Schema::enum( array( 'not_analyzed', 'analyzed', 'pending', 'error' ) )->fallback( 'not_analyzed' ),
					'created'      => Schema::as_float()->nullable(),
					'updated'      => Schema::as_float()->nullable(),
					'status_error' => Schema::as_string()->nullable(),
				)
			)->fallback(
				array(
					'pages'   => array(),
					'status'  => 'not_analyzed',
					'created' => null,
					'updated' => null,
				)
			)
		);
	}

	/**
	 * @since $$next-version$$
	 */
	public function start_output_filtering() {
		/**
		 * Filter to disable LCP optimization
		 *
		 * @param bool $optimize return false to disable optimization
		 *
		 * @since   $$next-version$$
		 */
		if ( false === apply_filters( 'jetpack_boost_should_optimize_lcp', true ) ) {
			return;
		}

		// If there's no LCP image tag set, don't proceed
		if ( ! $this->get_lcp_image_tag() ) {
			return;
		}

		// Disable in robots.txt.
		if ( isset( $_SERVER['REQUEST_URI'] ) && strpos( home_url( wp_unslash( $_SERVER['REQUEST_URI'] ) ), 'robots.txt' ) !== false ) { // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- This is validating.
			return;
		}

		// Disable in other possible AJAX requests setting cors related header.
		if ( isset( $_SERVER['HTTP_SEC_FETCH_MODE'] ) && 'cors' === strtolower( $_SERVER['HTTP_SEC_FETCH_MODE'] ) ) { // phpcs:ignore WordPress.Security.ValidatedSanitizedInput -- This is validating.
			return;
		}

		// Disable in other possible AJAX requests setting XHR related header.
		if ( isset( $_SERVER['HTTP_X_REQUESTED_WITH'] ) && 'xmlhttprequest' === strtolower( $_SERVER['HTTP_X_REQUESTED_WITH'] ) ) { // phpcs:ignore WordPress.Security.ValidatedSanitizedInput -- This is validating.
			return;
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
			return;
		}

		// Disable in all POST Requests.
		// phpcs:disable WordPress.Security.NonceVerification.Missing
		if ( ! empty( $_POST ) ) {
			return;
		}

		// Disable in customizer previews
		if ( is_customize_preview() ) {
			return;
		}

		// Disable in feeds, AJAX, Cron, XML.
		if ( is_feed() || wp_doing_ajax() || wp_doing_cron() || wp_is_xml_request() ) {
			return;
		}

		// Disable in sitemaps.
		if ( ! empty( get_query_var( 'sitemap' ) ) ) {
			return;
		}

		// Disable in AMP pages.
		if ( function_exists( 'amp_is_request' ) && amp_is_request() ) {
			return;
		}

		$this->output_filter->add_callback( array( $this, 'optimize' ) );
	}

	/**
	 * Optimize the HTML content by finding the LCP image and adding required attributes.
	 *
	 * @param string $buffer_start First part of the buffer.
	 * @param string $buffer_end   Second part of the buffer.
	 *
	 * @return array Parts of the buffer.
	 *
	 * @since $$next-version$$
	 */
	public function optimize( $buffer_start, $buffer_end ) {
		// Get the LCP image tag from WP option
		$lcp_image_tag = $this->get_lcp_image_tag();

		// Early return if no tag is configured
		if ( empty( $lcp_image_tag ) ) {
			return array( $buffer_start, $buffer_end );
		}

		// Combine the buffers for processing
		$combined_buffer = $buffer_start . $buffer_end;

		// Check if the tag exists in the combined buffer
		if ( strpos( $combined_buffer, $lcp_image_tag ) === false ) {
			return array( $buffer_start, $buffer_end );
		}

		// Create the optimized tag with required attributes
		$optimized_tag = $this->optimize_image_tag( $lcp_image_tag );

		// If no optimization was needed, return early
		if ( $optimized_tag === $lcp_image_tag ) {
			return array( $buffer_start, $buffer_end );
		}

		// Simple string replacement (since we're looking for an exact tag)
		$modified_buffer = str_replace( $lcp_image_tag, $optimized_tag, $combined_buffer );

		// Split the modified buffer back into two parts
		$buffer_start_length = strlen( $buffer_start );
		$new_buffer_start    = substr( $modified_buffer, 0, $buffer_start_length );
		$new_buffer_end      = substr( $modified_buffer, $buffer_start_length );

		// Check for successful split
		if ( false === $new_buffer_start || false === $new_buffer_end ) {
			// If splitting failed, return the original buffers
			return array( $buffer_start, $buffer_end );
		}

		return array( $new_buffer_start, $new_buffer_end );
	}

	/**
	 * Optimize an image tag by adding required attributes.
	 *
	 * @param string $tag The original image tag.
	 * @return string The optimized image tag.
	 *
	 * @since $$next-version$$
	 */
	private function optimize_image_tag( $tag ) {
		// Add fetchpriority="high" if not present
		if ( ! preg_match( '/fetchpriority\s*=\s*["\']high["\']/i', $tag ) ) {
			$tag = preg_replace( '/<img\s/i', '<img fetchpriority="high" ', $tag );
		}

		// Add loading="eager" if not present
		if ( ! preg_match( '/loading\s*=\s*["\']eager["\']/i', $tag ) ) {
			$tag = preg_replace( '/<img\s/i', '<img loading="eager" ', $tag );
		}

		return $tag;
	}

	/**
	 * Get the LCP image tag from the option.
	 *
	 * @return string The LCP image HTML tag.
	 *
	 * @since $$next-version$$
	 */
	private function get_lcp_image_tag() {
		// TODO: We need to decide on how the data will be stored within Boost. For now, this is a simple option that returns a string.
		return get_option( 'jetpack_boost_lcp_image_tag', '' );
	}
}
