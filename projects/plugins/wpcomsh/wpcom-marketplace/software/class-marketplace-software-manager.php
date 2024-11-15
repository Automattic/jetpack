<?php // phpcs:ignore Squiz.Commenting.FileComment.Missing
/**
 * This class is responsible for installing the marketplace software.
 *
 * @since 5.5.0
 * @package WPCOM_Marketplace
 */
require_once __DIR__ . '/class-marketplace-software-factory.php';

/**
 * Class Marketplace_Software_Manager.
 *
 * This class is responsible for installing the marketplace software by loading the software details from the atomic
 * persistent data, generating and executing the WP_CLI installation commands.
 */
class Marketplace_Software_Manager {

	/**
	 * Install the marketplace software by loading the software details from the atomic persistent data, generating
	 * and executing the WP_CLI installation commands.
	 *
	 * @return WP_Error|bool
	 */
	public function install_marketplace_software() {
		$wpcom_marketplace_software = $this->get_apd_marketplace_software();
		if ( is_wp_error( $wpcom_marketplace_software ) ) {
			return $wpcom_marketplace_software;
		}

		// @phan-suppress-next-line PhanTypeSuspiciousNonTraversableForeach -- $wpcom_marketplace_software is an array.
		foreach ( $wpcom_marketplace_software as $software ) {
			$product_software = Marketplace_Software_Factory::get_product_software( $software );
			if ( is_wp_error( $product_software ) ) {
				WPCOMSH_Log::unsafe_direct_log( $product_software->get_error_message() );
				continue;
			}

			$installer    = Marketplace_Software_Factory::get_product_installer( $product_software );
			$installation = $installer->install();
			if ( is_wp_error( $installation ) ) {
				WPCOMSH_Log::unsafe_direct_log( $installation->get_error_message(), $installer->get_results() );
			}
		}

		return true;
	}

	/**
	 * Get the marketplace software from Atomic Persist Data. This data is persisted by the
	 * woa_post_transfer_wpcomsh_cli_flags_install_marketplace_software_filter on WPCOM.
	 *
	 * @return array|WP_Error
	 */
	protected function get_apd_marketplace_software() {
		$atomic_persist_data = new Atomic_Persistent_Data();
		if ( empty( $atomic_persist_data->WPCOM_MARKETPLACE_SOFTWARE ) ) { // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
			return new WP_Error( 'marketplace_software_not_found', 'WPCOM_Marketplace_Software Atomic persist data is empty. No Marketplace Software installed.' );
		}

		return json_decode( $atomic_persist_data->WPCOM_MARKETPLACE_SOFTWARE, true ); // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
	}
}
