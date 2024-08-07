<?php // phpcs:ignore Squiz.Commenting.FileComment.Missing
/**
 * Class that allows to install a marketplace plugin.
 *
 * @since 5.2.0
 * @package WPCOM_Marketplace
 */

/**
 * Class that allows to install a marketplace plugin by generating and running the installation commands.
 */
class Marketplace_Plugin_Installer extends Marketplace_Product_Installer {

	/**
	 * Install the product.
	 *
	 * @param Marketplace_Product_Software $product_software The product to install.
	 */
	public function install( Marketplace_Product_Software $product_software ) {
		$commands = $this->command_helper->generate_install_commands(
			$product_software->get_software_slug(),
			$product_software->get_plugin_dependencies(),
			$product_software->get_theme_dependencies(),
			null,
			$product_software->is_managed()
		);

		foreach ( $commands as $command ) {
			if ( str_contains( $command, '||' ) ) {
				$conditional_commands = explode( '||', $command );

				foreach ( $conditional_commands as $conditional_command ) {
					$result = WP_CLI::runcommand(
						$conditional_command,
						array(
							'return'     => 'all',
							'parse'      => 'json',
							'launch'     => true,
							'exit_error' => false,
						)
					);

					$this->results[] = $result;

					// If the command was successful, the remaining commands are not executed.
					if ( $result->return_code === 0 ) {
						continue 2;
					}
				}

				// If all conditional commands failed, return an error.
				return new WP_Error( 'plugin_installation_failed', 'Plugin installation failed.', $this->results );
			}

			$result = WP_CLI::runcommand(
				$commands,
				array(
					'return'     => 'all',   // Return 'STDOUT'; use 'all' for full object.
					'parse'      => 'json', // Parse captured STDOUT to JSON array.
					'launch'     => true,  // Reuse the current process.
					'exit_error' => false,  // Halt script execution on error.
				)
			);

			if ( $result->return_code !== 0 ) {
				return new WP_Error( 'plugin_installation_failed', 'Plugin installation failed.' );
			}
		}

		$expected_plugins = array_filter( array( ...$product_software->get_plugin_dependencies(), $product_software->get_software_slug() ) );

		return $this->command_helper->verify_installation( $expected_plugins, $product_software->get_theme_dependencies() );
	}
}
