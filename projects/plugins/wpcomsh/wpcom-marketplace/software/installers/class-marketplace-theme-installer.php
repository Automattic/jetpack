<?php // phpcs:ignore Squiz.Commenting.FileComment.Missing
/**
 * Class that allows to install a marketplace theme.
 *
 * @since 5.5.0
 * @package WPCOM_Marketplace
 */

/**
 * Class that allows to install a marketplace theme by generating and running the installation commands.
 */
class Marketplace_Theme_Installer extends Marketplace_Product_Installer {

	/**
	 * Install the theme.
	 *
	 * @return WP_Error|bool
	 */
	public function install() {
		if ( ! $this->product_software instanceof Marketplace_Theme_Software ) {
			return new WP_Error( 'invalid_product_software', 'Invalid product software.' );
		}

		// 1. Install the theme dependencies.
		$install_dependencies = $this->install_dependencies();
		if ( is_wp_error( $install_dependencies ) ) {
			return $install_dependencies;
		}

		// 2. Get the list of plugins to skip when installing the theme.
		$skip_plugins = $this->get_skip_plugins();
		if ( is_wp_error( $skip_plugins ) ) {
			return $skip_plugins;
		}

		// 3. Get the list of themes to skip when installing the theme.
		$skip_themes = $this->get_skip_themes();
		if ( is_wp_error( $skip_themes ) ) {
			return $skip_themes;
		}

		// 4. Generate and run the theme installation command.
		$theme_install_command = $this->command_helper->generate_theme_install_command(
			$this->product_software->get_theme_slug(),
			$this->product_software->is_managed(),
			$skip_plugins,
			$skip_themes
		);

		$theme_install = $this->run_command( $theme_install_command );
		if ( is_wp_error( $theme_install ) ) {
			return $theme_install;
		}

		// 5. Verify the theme installation.
		$verify_theme_installation_command = $this->command_helper->generate_verify_theme_installation_command( $this->product_software->get_theme_slug() );
		$verify_theme_installation         = $this->run_command( $verify_theme_installation_command );
		if ( is_wp_error( $verify_theme_installation ) ) {
			return $verify_theme_installation;
		}

		if ( $verify_theme_installation->stdout !== 'active' ) {
			return new WP_Error(
				'theme_installation_failed',
				'Theme installation failed.'
			);
		}

		return true;
	}
}
