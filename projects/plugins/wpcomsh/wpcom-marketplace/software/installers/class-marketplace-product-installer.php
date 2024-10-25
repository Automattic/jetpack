<?php // phpcs:ignore Squiz.Commenting.FileComment.Missing
/**
 * Abstract class that allows to install a marketplace product.
 *
 * @since 5.5.0
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
	 * Product software.
	 *
	 * @var Marketplace_Product_Software
	 */
	protected Marketplace_Product_Software $product_software;

	/**
	 * List of command results.
	 *
	 * @var array
	 */
	protected array $results = array();

	/**
	 * Marketplace_Product_Installer constructor.
	 *
	 * @param Marketplace_Command_Helper   $command_helper The command helper.
	 * @param Marketplace_Product_Software $product_software The product software.
	 */
	public function __construct( Marketplace_Command_Helper $command_helper, Marketplace_Product_Software $product_software ) {
		$this->command_helper   = $command_helper;
		$this->product_software = $product_software;
	}

	/**
	 * Get the list of command results.
	 *
	 * @return array
	 */
	public function get_results() {
		return $this->results;
	}

	/**
	 * Install the product.
	 *
	 * This method generates and run the installation commands depending on the product type.
	 *
	 * @return WP_Error|bool
	 */
	abstract public function install();

	/**
	 * Get the list of plugins to skip when installing the product.
	 * To make sure that there are no 3rd party plugins that might interfere in the installation process,
	 * this method gets the list of installed plugins and filters out the ones that are dependencies of the product.
	 *
	 * @return array|WP_Error
	 */
	protected function get_skip_plugins() {
		if ( empty( $this->product_software->get_plugin_dependencies() ) ) {
			return array();
		}

		$installed_plugins_names_command = $this->command_helper->get_installed_plugins_names_command();
		$installed_plugins_names         = $this->run_command( $installed_plugins_names_command );
		if ( is_wp_error( $installed_plugins_names ) ) {
			return $installed_plugins_names;
		}

		$plugin_dependencies = $this->product_software->get_plugin_dependencies();
		return array_filter(
			explode( PHP_EOL, $installed_plugins_names->stdout ),
			function ( $plugin_name ) use ( $plugin_dependencies ) {
				return ! in_array( $plugin_name, $plugin_dependencies, true );
			},
		);
	}

	/**
	 * Get the list of themes to skip when installing the product.
	 * To make sure that there are no 3rd party themes that might interfere in the installation process,
	 * this method gets the list of installed themes and filters out the ones that are dependencies of the product.
	 *
	 * @return array|WP_Error
	 */
	protected function get_skip_themes() {
		if ( empty( $this->product_software->get_theme_dependencies() ) ) {
			return array();
		}

		$installed_themes_names_command = $this->command_helper->get_installed_themes_names_command();
		$installed_themes_names         = $this->run_command( $installed_themes_names_command );
		if ( is_wp_error( $installed_themes_names ) ) {
			return $installed_themes_names;
		}

		$theme_dependencies = $this->product_software->get_theme_dependencies();
		return array_filter(
			explode( PHP_EOL, $installed_themes_names->stdout ),
			function ( $theme_name ) use ( $theme_dependencies ) {
				return ! in_array( $theme_name, $theme_dependencies, true );
			},
		);
	}

	/**
	 * Install the product dependencies.
	 *
	 * This method installs the dependencies of the product.
	 */
	protected function install_dependencies() {
		$dependency_commands = $this->command_helper->generate_dependency_install_commands(
			$this->product_software->get_plugin_dependencies(),
			$this->product_software->get_theme_dependencies()
		);

		foreach ( $dependency_commands as $command ) {
			$conditional_commands = explode( '||', $command );

			foreach ( $conditional_commands as $conditional_command ) {
				$dependency_installation = $this->run_command( $conditional_command );

				// If the command failed, continue to the next command.
				if ( is_wp_error( $dependency_installation ) ) {
					continue;
				}

				// If the command was successful, the remaining commands are not executed.
				if ( $dependency_installation->return_code === 0 ) {
					continue 2;
				}
			}

			// If all conditional commands failed, return an error.
			return new WP_Error(
				'plugin_installation_failed',
				sprintf( '%s: Plugin installation failed. A dependency could not be installed ', $this->product_software->get_software_slug() ),
				$this->results
			);
		}

		return true;
	}

	/**
	 * Wrapper for WP_CLI::runcommand that logs the command and the result.
	 *
	 * @param string $command The command to run.
	 *
	 * @return WP_Error|object
	 */
	protected function run_command( string $command ) {
		$result = WP_CLI::runcommand(
			$command,
			array(
				'return'     => 'all',
				'parse'      => 'json',
				'launch'     => true,
				'exit_error' => false,
			)
		);

		$this->results[] = $result;

		if ( $result->return_code !== 0 ) {
			return new WP_Error( 'command_failed', 'Command failed.', $result );
		}

		return $result;
	}
}
