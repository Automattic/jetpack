<?php // phpcs:ignore Squiz.Commenting.FileComment.Missing
/**
 * Class that allows to install a marketplace theme.
 *
 * @since 5.2.0
 * @package WPCOM_Marketplace
 */

/**
 * Class that allows to install a marketplace theme by generating and running the installation commands.
 */
class Marketplace_Theme_Installer extends Marketplace_Product_Installer {

	/**
	 * Install the product.
	 *
	 * @param Marketplace_Product_Software $product_software The product to install.
	 */
	public function install( Marketplace_Product_Software $product_software ) {
		$commands = $this->command_helper->generate_install_commands(
			null,
			$product_software->get_plugin_dependencies(),
			$product_software->get_theme_dependencies(),
			$product_software->get_theme_slug(),
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
				return new WP_Error( 'theme_installation_failed', 'Theme installation failed.', $this->results );
			}

			$result = WP_CLI::runcommand(
				$command,
				array(
					'return'     => 'all',   // Return 'STDOUT'; use 'all' for full object.
					'parse'      => 'json', // Parse captured STDOUT to JSON array.
					'launch'     => true,  // Reuse the current process.
					'exit_error' => false,  // Halt script execution on error.
				)
			);

			if ( $result->return_code !== 0 ) {
				return new WP_Error( 'theme_installation_failed', 'Theme installation failed.' );
			}
		}

		return $this->command_helper->verify_installation( $product_software->get_plugin_dependencies(), array(), $product_software->get_theme_slug() );
	}
}
