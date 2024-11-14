<?php
/**
 * Utils class.
 *
 * @package automattic/jetpack-google-analytics
 */

namespace Automattic\Jetpack\Google_Analytics;

/**
 * Utils main class.
 */
class Utils {
	/**
	 * Gets product categories or varation attributes as a formatted concatenated string
	 *
	 * @phan-suppress PhanUndeclaredTypeParameter
	 *
	 * @param \WC_Product $product Product to get categories/variations for.
	 * @return string
	 */
	public static function get_product_categories_concatenated( $product ) {
		if ( ! class_exists( 'WooCommerce' ) ) {
			return '';
		}

		if ( ! $product ) {
			return '';
		}

		// @phan-suppress-next-line PhanUndeclaredClassMethod, PhanUndeclaredFunction
		$variation_data = $product->is_type( 'variation' ) ? \wc_get_product_variation_attributes( $product->get_id() ) : '';
		if ( is_array( $variation_data ) && ! empty( $variation_data ) ) {
			// @phan-suppress-next-line PhanUndeclaredFunction
			$line = \wc_get_formatted_variation( $variation_data, true );
		} else {
			$out = array();
			// @phan-suppress-next-line PhanUndeclaredClassMethod
			$categories = get_the_terms( $product->get_id(), 'product_cat' );
			if ( is_array( $categories ) ) {
				foreach ( $categories as $category ) {
					$out[] = $category->name;
				}
			}
			$line = implode( '/', $out );
		}
		return $line;
	}

	/**
	 * Gets a product's SKU with fallback to just ID. IDs are prepended with a hash symbol.
	 *
	 * @phan-suppress PhanUndeclaredTypeParameter
	 *
	 * @param \WC_Product $product Product to get SKU/ID for.
	 * @return string
	 */
	public static function get_product_sku_or_id( $product ) {
		if ( ! class_exists( 'WooCommerce' ) ) {
			return '';
		}

		if ( ! $product ) {
			return '';
		}

		// @phan-suppress-next-line PhanUndeclaredClassMethod
		return $product->get_sku() ? $product->get_sku() : '#' . $product->get_id();
	}

	/**
	 * Checks if filter is set and dnt is enabled.
	 *
	 * @return bool
	 */
	public static function is_dnt_enabled() {
		/**
		 * Filter the option which decides honor DNT or not.
		 *
		 * @module google-analytics
		 * @since jetpack-11.3
		 *
		 * @param bool $honor_dnt Honors DNT for clients who don't want to be tracked. Set to true to enable.
		 */
		if ( false === apply_filters( 'jetpack_honor_dnt_header_for_wga', Options::honor_dnt_is_enabled() ) ) {
			return false;
		}

		foreach ( $_SERVER as $name => $value ) {
			if ( 'http_dnt' === strtolower( $name ) && 1 === (int) $value ) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Determine if a string is truthy. If it's not a string, which can happen with
	 * not well-formed data coming from Jetpack sites, we still consider it a truthy value.
	 *
	 * @since 0.2.0
	 *
	 * @param mixed $value true, 1, "1", "t", and "true" (case insensitive) are truthy, everything else isn't.
	 * @return bool
	 */
	public static function is_truthy( $value ) {
		if ( true === $value ) {
			return true;
		}

		if ( 1 === $value ) {
			return true;
		}

		if ( ! is_string( $value ) ) {
			return false;
		}

		switch ( strtolower( $value ) ) {
			case '1':
			case 't':
			case 'true':
				return true;
		}

		return false;
	}
}
