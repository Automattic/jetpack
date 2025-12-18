<?php
/**
 * WooCommerce function mocks for testing
 *
 * @package automattic/jetpack-search
 */

if ( ! function_exists( 'wc_get_attribute_taxonomies' ) ) {
	/**
	 * Mock WooCommerce function to get product attribute taxonomies.
	 *
	 * @return array Array of attribute objects.
	 */
	function wc_get_attribute_taxonomies() {
		return array(
			(object) array(
				'attribute_name'  => 'color',
				'attribute_label' => 'Color',
			),
			(object) array(
				'attribute_name'  => 'size',
				'attribute_label' => 'Size',
			),
			(object) array(
				'attribute_name'  => 'material',
				'attribute_label' => 'Material',
			),
		);
	}
}

if ( ! function_exists( 'wc_attribute_taxonomy_name' ) ) {
	/**
	 * Mock WooCommerce function to get taxonomy name from attribute name.
	 *
	 * @param string $attribute_name The attribute name.
	 * @return string The taxonomy name with 'pa_' prefix.
	 */
	function wc_attribute_taxonomy_name( $attribute_name ) {
		return 'pa_' . $attribute_name;
	}
}
