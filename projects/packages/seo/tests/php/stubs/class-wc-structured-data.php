<?php
/**
 * Minimal WooCommerce structured-data stub for schema tests.
 *
 * @package automattic/jetpack-seo
 */

if ( ! class_exists( 'WC_Structured_Data' ) ) {

	/**
	 * Stand-in for WooCommerce's structured-data callback owner.
	 */
	class WC_Structured_Data {

		/**
		 * Generated structured-data nodes.
		 *
		 * @var array<int, array>
		 */
		private $data = array();

		/**
		 * Whether the breadcrumb callback should produce data.
		 *
		 * @var bool
		 */
		public $generate_breadcrumb_data = true;

		/**
		 * Stand-in BreadcrumbList generator.
		 *
		 * @return void
		 */
		public function generate_breadcrumblist_data() {
			if ( ! $this->generate_breadcrumb_data ) {
				return;
			}

			// Marker node: tests only inspect @type and @id (the @id distinguishes
			// Woo's node from Jetpack's fallback).
			$this->data[] = array(
				'@type' => 'BreadcrumbList',
				'@id'   => 'https://example.test/#woocommerce-breadcrumb',
			);
		}

		/**
		 * Return generated structured-data nodes.
		 *
		 * @return array<int, array>
		 */
		public function get_data() {
			return $this->data;
		}

		/**
		 * Stand-in structured-data output callback.
		 *
		 * @return void
		 */
		public function output_structured_data() {
			if ( empty( $this->data ) ) {
				return;
			}

			$document = array(
				'@context' => 'https://schema.org',
				'@graph'   => $this->data,
			);

			printf(
				'<script type="application/ld+json">%s</script>',
				wp_json_encode( $document, JSON_UNESCAPED_UNICODE ) // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
			);
		}

		/**
		 * Reset generated data and callback behavior between tests.
		 *
		 * @return void
		 */
		public function reset_data() {
			$this->data                     = array();
			$this->generate_breadcrumb_data = true;
		}
	}
}
