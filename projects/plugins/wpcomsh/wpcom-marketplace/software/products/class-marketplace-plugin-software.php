<?php // phpcs:ignore Squiz.Commenting.FileComment.Missing
/**
 * Class that allows to install a marketplace plugin..
 *
 * @since 5.1.3
 * @package WPCOM_Marketplace
 */

/**
 * Marketplace plugin software.
 *
 * Class that allows to install a marketplace plugin by generating and running the installation commands.
 */
class Marketplace_Plugin_Software extends Marketplace_Product_Software implements Marketplace_Product_Installable {

	/**
	 * Install the plugin.
	 *
	 * @return WP_Error|bool
	 */
	public function install(): WP_Error|bool {
		$commands = $this->generate_install_commands( $this->software_slug, $this->plugin_dependencies, $this->theme_dependencies, null, $this->is_managed );
		$command  = \implode( ' && ', $commands );

		$result = WP_CLI::runcommand(
			$command,
			array(
				'return'     => true,                // Return 'STDOUT'; use 'all' for full object.
				'parse'      => 'json',              // Parse captured STDOUT to JSON array.
				'launch'     => false,               // Reuse the current process.
				'exit_error' => true,                // Halt script execution on error.
			)
		);

		if ( is_wp_error( $result ) ) {
			return $result;
		}

		$expected_plugins = array_filter( array( ...$this->plugin_dependencies, $this->software_slug ) );

		return $this->verify_installation( $expected_plugins, $this->theme_dependencies );
	}
}
