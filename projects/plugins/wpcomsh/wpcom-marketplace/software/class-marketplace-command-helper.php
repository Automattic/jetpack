<?php
/**
 * Helper class for marketplace commands.
 *
 * @since 5.5.0
 * @package WPCOM_Marketplace
 */

/**
 * Helper class for generating WP CLI commands required to install marketplace product.
 */
class Marketplace_Command_Helper {

	/**
	 * Generate the commands to install the dependencies of a product.
	 *
	 * @param array<string> $plugin_dependencies List of plugins the product depends on.
	 * @param array<string> $theme_dependencies  List of themes the product depends on.
	 *
	 * @return string[]
	 */
	public function generate_dependency_install_commands( array $plugin_dependencies, array $theme_dependencies ) {
		/**
		 * This can be extended in the future to support advanced dependency trees or multiple types of products.
		 *
		 * We first try to symlink it, if it fails, it reverts to installing the plugin.
		 */
		$dependency_command_template = '--skip-themes --skip-plugins atomic %2$s use-managed %1$s --remove-existing --activate || --skip-themes --skip-plugins %2$s install %1$s --activate --force';
		$plugin_dependency_commands  = \array_map( fn( $plugin ) => \sprintf( $dependency_command_template, $plugin, 'plugin' ), $plugin_dependencies );
		$theme_dependency_commands   = \array_map( fn( $theme ) => \sprintf( $dependency_command_template, $theme, 'theme' ), $theme_dependencies );

		return array_merge( $plugin_dependency_commands, $theme_dependency_commands );
	}

	/**
	 * Get the list of installed plugins.
	 *
	 * @return string
	 */
	public function get_installed_plugins_names_command(): string {
		return '--skip-themes --skip-plugins plugin list --field=name';
	}

	/**
	 * Get the list of installed themes.
	 *
	 * @return string
	 */
	public function get_installed_themes_names_command(): string {
		return '--skip-themes --skip-plugins theme list --field=name';
	}

	/**
	 * Generate the commands to install a plugin.
	 *
	 * @param string $software_slug_or_url The plugin slug or URL to install.
	 * @param bool   $is_managed           Whether to use the managed version of the plugin or not.
	 * @param array  $skip_plugins         List of plugins to skip when installing the plugin.
	 * @param array  $skip_themes          List of themes to skip when installing the plugin.
	 *
	 * @return string[]
	 */
	public function generate_plugin_install_commands( string $software_slug_or_url, bool $is_managed, array $skip_plugins, array $skip_themes ) {
		$skip_plugins = implode( ',', $skip_plugins );
		$skip_themes  = implode( ',', $skip_themes );

		$skip_plugins_parameter = '--skip-plugins';
		if ( ! empty( $skip_plugins ) ) {
			$skip_plugins_parameter .= '="' . $skip_plugins . '" ';
		}

		$skip_themes_parameter = '--skip-themes';
		if ( ! empty( $skip_themes ) ) {
			$skip_themes_parameter .= '="' . $skip_themes . '" ';
		}

		$plugin_install_commands = array(
			'add_managed_plugin_command' => ' atomic plugin use-managed %1$s --remove-existing',
			'activate_plugin_command'    => ' plugin activate %1$s',
		);

		if ( ! $is_managed ) {
			$plugin_install_commands = array(
				'add_remote_plugin_command' => ' plugin install "%1$s" --activate --force',
			);
		}

		return array(
			...array_map(
				fn( $command ) => sprintf( $skip_plugins_parameter . $skip_themes_parameter . $command, $software_slug_or_url ),
				array_values( $plugin_install_commands )
			),
		);
	}

	/**
	 * Generate the command to install a theme.
	 *
	 * @param string $theme_slug The theme slug to install.
	 * @param bool   $is_managed Whether to use the managed version of the theme or not.
	 * @param array  $skip_plugins List of plugins to skip when installing the theme.
	 * @param array  $skip_themes List of themes to skip when installing the theme.
	 *
	 * @return string
	 */
	public function generate_theme_install_command( string $theme_slug, bool $is_managed, array $skip_plugins, array $skip_themes ) {
		$skip_plugins = implode( ',', $skip_plugins );
		$skip_themes  = implode( ',', $skip_themes );

		$skip_plugins_parameter = '--skip-plugins';
		if ( ! empty( $skip_plugins ) ) {
			$skip_plugins_parameter .= '="' . $skip_plugins . '" ';
		}

		$skip_themes_parameter = '--skip-themes';
		if ( ! empty( $skip_themes ) ) {
			$skip_themes_parameter .= '="' . $skip_themes . '" ';
		}

		if ( ! $is_managed ) {
			$command = sprintf( $skip_plugins_parameter . $skip_themes_parameter . ' theme install "%s" --force', $theme_slug );
		} else {
			$command = sprintf( $skip_plugins_parameter . $skip_themes_parameter . ' atomic theme use-managed %s --remove-existing', $theme_slug );
		}

		return $command;
	}

	/**
	 * Generate the commands to verify the installation of the plugins.
	 *
	 * @param array $expected_plugins A list of plugins that will be checked.
	 * @param array $expected_themes A list of themes that will be checked.
	 *
	 * @return array
	 */
	public function generate_verify_plugin_installation_commands( array $expected_plugins, array $expected_themes ) {
		$expected_plugins = \array_filter( $expected_plugins );

		if ( empty( $expected_plugins ) ) {
			return array();
		}

		$plugin_commands = \array_map(
			fn( $plugin_slug ) => '--skip-themes --skip-plugins plugin get ' . $plugin_slug . ' --field=status',
			$expected_plugins
		);

		$theme_commands = \array_map(
			fn( $theme_slug ) => '--skip-themes --skip-plugins theme get ' . $theme_slug . ' --field=status',
			$expected_themes
		);

		return array( ...$plugin_commands, ...$theme_commands );
	}

	/**
	 * Generate the command to verify the theme installation.
	 *
	 * @param string $expected_theme The theme that will be checked.
	 *
	 * @return string
	 */
	public function generate_verify_theme_installation_command( string $expected_theme ) {
		return '--skip-themes --skip-plugins theme get ' . $expected_theme . ' --field=status';
	}
}
