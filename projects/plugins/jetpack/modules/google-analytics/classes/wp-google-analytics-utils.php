<?php

/**
* Jetpack_Google_Analytics_Options provides a single interface to module options
*
* @author allendav 
*/

/**
* Bail if accessed directly
*/
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Jetpack_Google_Analytics_Utils {
	/**
	 * Gets product categories or varation attributes as a formatted concatenated string
	 * @param WC_Product
	 * @return string
	 */
	public static function get_product_categories_concatenated( $product ) {
		if ( ! class_exists( 'WooCommerce' ) ) {
			return '';
		}

		if ( ! $product ) {
			return '';
		}

		$variation_data = $product->is_type( 'variation' ) ? wc_get_product_variation_attributes( $product->get_id() ) : '';
		if ( is_array( $variation_data ) && ! empty( $variation_data ) ) {
			$line = wc_get_formatted_variation( $variation_data, true );
		} else {
			$out = array();
			$categories = get_the_terms( $product->get_id(), 'product_cat' );
			if ( $categories ) {
				foreach ( $categories as $category ) {
					$out[] = $category->name;
				}
			}
			$line = join( "/", $out );
		}
		return $line;
	}

	/**
	 * Gets a product's SKU with fallback to just ID. IDs are prepended with a hash symbol.
	 * @param WC_Product
	 * @return string
	 */
	public static function get_product_sku_or_id( $product ) {
		if ( ! class_exists( 'WooCommerce' ) ) {
			return '';
		}

		if ( ! $product ) {
			return '';
		}

		return $product->get_sku() ? $product->get_sku() : '#' . $product->get_id();
	}
}