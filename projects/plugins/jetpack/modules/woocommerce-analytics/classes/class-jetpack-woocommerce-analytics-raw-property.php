<?php
/**
 * Jetpack_WooCommerce_Analytics_Universal
 *
 * @package automattic/jetpack
 * @author Automattic
 */

/**
 * Value object to include raw property.
 *
 * Class Jetpack_WooCommerce_Analytics_Raw_Property
 */
class Jetpack_WooCommerce_Analytics_Raw_Property {
	/**
	 * Value to be included.
	 *
	 * @var string value to be included.
	 */
	private $value;

	/**
	 * Jetpack_WooCommerce_Analytics_Raw_Property constructor.
	 *
	 * @param string $value value to be included.
	 */
	public function __construct( $value ) {
		$this->value = $value;
	}

	/**
	 * Get value.
	 *
	 * @return string
	 */
	public function get_value() {
		return esc_js( $this->value );
	}
}
