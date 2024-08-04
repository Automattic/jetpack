<?php // phpcs:ignore Squiz.Commenting.FileComment.Missing
/**
 * Interface for installable marketplace products.
 *
 * @since 5.1.3
 * @package WPCOM_Marketplace
 */

/**
 * This interface defines the method that should be implemented by a class that installs a marketplace product.
 */
interface Marketplace_Product_Installable {

	/**
	 * Install the product.
	 *
	 * This method should generate and run the installation commands depending on the product type.
	 *
	 * @return WP_Error|bool
	 */
	public function install(): WP_Error|bool;
}
