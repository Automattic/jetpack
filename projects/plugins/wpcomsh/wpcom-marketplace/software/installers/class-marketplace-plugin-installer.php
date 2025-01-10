<?php // phpcs:ignore Squiz.Commenting.FileComment.Missing
/**
 * Class that allows to install a marketplace plugin.
 *
 * @since 5.5.0
 * @package WPCOM_Marketplace
 */

/**
 * Class that allows to install a marketplace plugin by generating and running the installation commands.
 */
class Marketplace_Plugin_Installer extends Marketplace_Product_Installer {

	/**
	 * Install the plugin.
	 *
	 * @return WP_Error|bool
	 */
	public function install() {
		// 1. Install the plugin dependencies.
		$install_dependencies = $this->install_dependencies();
		if ( is_wp_error( $install_dependencies ) ) {
			return $install_dependencies;
		}

		// 2. Get the list of plugins to skip when installing the plugin.
		$skip_plugins = $this->get_skip_plugins();
		if ( is_wp_error( $skip_plugins ) ) {
			return $skip_plugins;
		}

		// 3. Get the list of themes to skip when installing the plugin.
		$skip_themes = $this->get_skip_themes();
		if ( is_wp_error( $skip_themes ) ) {
			return $skip_themes;
		}

		// 4. Generate and run the plugin installation command.
		$plugin_install_commands = $this->command_helper->generate_plugin_install_commands(
			$this->product_software->get_product_slug_or_url(),
			$this->product_software->is_managed(),
			$skip_plugins,
			$skip_themes
		);

		foreach ( $plugin_install_commands as $command ) {
			$plugin_install = $this->run_command( $command );
			if ( is_wp_error( $plugin_install ) ) {
				return $plugin_install;
			}
		}

		// 5. Verify the plugin installation.
		$expected_plugins = array_filter(
			array( ...$this->product_software->get_plugin_dependencies(), $this->product_software->get_software_slug() )
		);

		$verify_plugin_installation_commands = $this->command_helper->generate_verify_plugin_installation_commands( $expected_plugins, $this->product_software->get_theme_dependencies() );

		foreach ( $verify_plugin_installation_commands as $command ) {
			$verify_installation = $this->run_command( $command );
			if ( is_wp_error( $verify_installation ) ) {
				return $verify_installation;
			}

			if ( $verify_installation->stdout !== 'active' ) {
				return new WP_Error(
					'plugin_installation_failed',
					sprintf( '%s: Plugin installation failed. The plugin is not active.', $this->product_software->get_software_slug() ),
					$this->results
				);
			}
		}

		return true;
	}
}
