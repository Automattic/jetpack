<?php // phpcs:ignore Squiz.Commenting.FileComment.Missing
/**
 * Abstract class that allows to install a marketplace product.
 *
 * @since 5.2.0
 * @package WPCOM_Marketplace
 */

/**
 * Abstract class that allows to install a marketplace product by generating and running the installation commands.
 * This class implements methods that are common to all marketplace products.
 */
abstract class Marketplace_Product_Installer {

	/**
	 * Command helper.
	 *
	 * @var Marketplace_Command_Helper
	 */
	protected Marketplace_Command_Helper $command_helper;

	/**
	 * List of command results.
	 *
	 * @var array
	 */
	protected array $results = array();

	/**
	 * List of installed products.
	 *
	 * @var array
	 */
	protected array $installed_products = array();

	/**
	 * Marketplace_Product_Installer constructor.
	 *
	 * @param Marketplace_Command_Helper $command_helper The command helper.
	 */
	public function __construct( Marketplace_Command_Helper $command_helper ) {
		$this->command_helper = $command_helper;
	}

	/**
	 * Install the product.
	 *
	 * This method generates and run the installation commands depending on the product type.
	 *
	 * @param Marketplace_Product_Software $product_software The product to install.
	 *
	 * @return WP_Error|bool
	 */
	abstract public function install( Marketplace_Product_Software $product_software );
}
