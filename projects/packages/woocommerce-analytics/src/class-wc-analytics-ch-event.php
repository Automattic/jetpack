<?php
/**
 * WooCommerce Analytics ClickHouse Event
 *
 * @package automattic/woocommerce-analytics
 */

namespace Automattic\Woocommerce_Analytics;

use WP_Error;

/**
 * WooCommerce Analytics ClickHouse Event class
 */
#[AllowDynamicProperties]
class WC_Analytics_Ch_Event {

	/**
	 * The ClickHouse pixel URL.
	 *
	 * @var string
	 */
	const PIXEL = 'https://pixel.wp.com/w.gif';

	/**
	 * Error message as WP_Error.
	 *
	 * @var WP_Error|null
	 */
	public $error;

	/**
	 * Event properties.
	 *
	 * @var array
	 */
	private $properties;

	/**
	 * Constructor.
	 *
	 * @param array $properties Event properties.
	 */
	public function __construct( $properties ) {
		$this->properties = $properties;

		// Validate the properties.
		$validated = Pixel_Builder::validate_and_sanitize( $properties );

		if ( is_wp_error( $validated ) ) {
			$this->error = $validated;
			return;
		}

		// Store validated properties as object properties for backwards compatibility.
		foreach ( $validated as $key => $value ) {
			$this->{$key} = $value;
		}
	}

	/**
	 * Build a pixel URL that will send a ClickHouse event when fired.
	 * On error, returns an empty string ('').
	 *
	 * @return string A pixel URL or empty string ('') if there were invalid args.
	 */
	public function build_pixel_url() {
		if ( $this->error ) {
			return '';
		}

		$pixel_url = Pixel_Builder::build_ch_url( $this->properties );

		if ( is_wp_error( $pixel_url ) ) {
			return '';
		}

		return $pixel_url;
	}
}
