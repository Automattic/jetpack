<?php // phpcs:ignore Squiz.Commenting.FileComment.Missing
/**
 * Factory class to create a new instance of Marketplace_Product_Software.
 *
 * @package WPCOM_Marketplace
 * @since 5.1.3
 */

require_once __DIR__ . '/products/interface-marketplace-product-installable.php';
require_once __DIR__ . '/products/class-marketplace-product-software.php';
require_once __DIR__ . '/products/class-marketplace-plugin-software.php';
require_once __DIR__ . '/products/class-marketplace-theme-software.php';

/**
 *  Factory class to create a new instance of Marketplace_Product_Software.
 *
 *  This class is responsible for creating a new instance of Marketplace_Product_Software based on the product type.
 *  This class also validates the input data before creating the instance.
 */
class Marketplace_Product_Software_Factory {

	/**
	 * Create a new instance of Marketplace_Product_Software.
	 *
	 * @param array{
	 *      'product_type': string,
	 *      'software_slug': string,
	 *      'download_url': string,
	 *      'is_managed': bool,
	 *      'plugin_dependencies': array<string>,
	 *      'theme_dependencies': array<string>,
	 * } $software
	 *
	 * @return Marketplace_Product_Software|WP_Error
	 */
	// @phpcs:ignore Squiz.Commenting.FunctionComment
	public static function create( array $software ): Marketplace_Product_Software|WP_Error {
		if ( ! isset( $software['product_type'] ) ) {
			return new WP_Error( 'missing_product_type', 'Product type is missing.' );
		}

		if ( ! isset( $software['software_slug'] ) ) {
			return new WP_Error( 'missing_software_slug', 'Software slug is missing.' );
		}

		if ( ! isset( $software['is_managed'] ) ) {
			return new WP_Error( 'missing_is_managed', 'Is managed is missing.' );
		}

		if ( ! $software['is_managed'] && ! isset( $software['download_url'] ) ) {
			return new WP_Error( 'missing_download_url', 'Download URL is missing.' );
		}

		return match ( $software['product_type'] ) {
			'plugin' => new Marketplace_Plugin_Software(
				$software['software_slug'],
				$software['is_managed'],
				$software['download_url'],
				$software['plugin_dependencies'],
				$software['theme_dependencies']
			),
			'theme'  => new Marketplace_Theme_Software(
				$software['software_slug'],
				$software['is_managed'],
				$software['download_url'],
				$software['plugin_dependencies']
			),
			default  => new WP_Error( 'invalid_product_type', 'Invalid product type.' ),
		};
	}
}
