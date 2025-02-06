<?php // phpcs:ignore Squiz.Commenting.FileComment.Missing
/**
 * Factory class to create a new instance of Marketplace_Product_Software and Marketplace_Product_Installer.
 *
 * @since 5.5.0
 * @package WPCOM_Marketplace
 */
require_once __DIR__ . '/products/class-marketplace-product-software.php';
require_once __DIR__ . '/products/class-marketplace-plugin-software.php';
require_once __DIR__ . '/products/class-marketplace-theme-software.php';
require_once __DIR__ . '/installers/class-marketplace-product-installer.php';
require_once __DIR__ . '/installers/class-marketplace-plugin-installer.php';
require_once __DIR__ . '/installers/class-marketplace-theme-installer.php';
require_once __DIR__ . '/class-marketplace-command-helper.php';

/**
 *  Factory class to create a new instance of Marketplace_Product_Software.
 *
 *  This class is responsible for creating a new instance of Marketplace_Product_Software based on the product type.
 *  This class also validates the input data before creating the instance.
 */
class Marketplace_Software_Factory {

	/**
	 * Create a new instance of Marketplace_Product_Software depending on the product type.
	 *
	 * @param array $software The software data.
	 *
	 * array{
	 *      'product_type': string,
	 *      'software_slug': string,
	 *      'download_url': string,
	 *      'is_managed': bool,
	 *      'plugin_dependencies': array<string>,
	 *      'theme_dependencies': array<string>,
	 * } The software data.
	 *
	 * @return Marketplace_Product_Software|WP_Error
	 */
	public static function get_product_software( array $software ) {
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

		switch ( $software['product_type'] ) {
			case 'plugin':
				return new Marketplace_Plugin_Software(
					$software['software_slug'],
					$software['is_managed'],
					$software['download_url'],
					$software['plugin_dependencies'],
					$software['theme_dependencies']
				);
			case 'theme':
				return new Marketplace_Theme_Software(
					$software['software_slug'],
					$software['is_managed'],
					$software['download_url'],
					$software['plugin_dependencies']
				);
			default:
				return new WP_Error( 'invalid_product_type', 'Invalid product type.' );
		}
	}

	/**
	 * Get the product installer instance depending on the product type.
	 *
	 * @param Marketplace_Product_Software $product_software The product software.
	 *
	 * @return Marketplace_Product_Installer|WP_Error
	 */
	public static function get_product_installer( Marketplace_Product_Software $product_software ) {
		$command_helper = new Marketplace_Command_Helper();

		if ( $product_software instanceof Marketplace_Plugin_Software ) {
			return new Marketplace_Plugin_Installer( $command_helper, $product_software );
		}

		if ( $product_software instanceof Marketplace_Theme_Software ) {
			return new Marketplace_Theme_Installer( $command_helper, $product_software );
		}

		return new WP_Error( 'invalid_product_type', 'Invalid product type.' );
	}
}
