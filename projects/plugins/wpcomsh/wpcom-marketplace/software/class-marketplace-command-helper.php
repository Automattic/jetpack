<?php
/**
 * Helper class for marketplace commands.
 *
 * @since 5.2.0
 * @package WPCOM_Marketplace
 */

/**
 * Helper class for marketplace commands.
 */
class Marketplace_Command_Helper {

	/**
	 * Generate the commands that install a plugin, some dependencies, and a possible theme.
	 *
	 * @param string|null   $plugin_slug_or_url     The plugin slug or URL to install.
	 * @param array<string> $plugin_dependencies    List of plugins the product depends on.
	 * @param array<string> $theme_dependencies     List of themes the product depends on.
	 * @param string|null   $theme_slug             The theme slug to install.
	 * @param bool|null     $use_managed            Whether to use the managed version of the product or not.
	 *
	 * @return string[]
	 */
	public function generate_install_commands( ?string $plugin_slug_or_url, array $plugin_dependencies, array $theme_dependencies, ?string $theme_slug = null, ?bool $use_managed = true ): array {
		/**
		 * This can be extended in the future to support advanced dependency trees or multiple types of products.
		 *
		 * We first try to symlink it, if it fails, it reverts to installing the plugin.
		 */
		$dependency_command_template = '--skip-themes --skip-plugins atomic %2$s use-managed %1$s --remove-existing --activate || --skip-themes --skip-plugins %2$s install %1$s --activate --force';
		$plugin_dependency_commands  = \array_map( fn( $plugin ) => \sprintf( $dependency_command_template, $plugin, 'plugin' ), $plugin_dependencies );
		$theme_dependency_commands   = \array_map( fn( $theme ) => \sprintf( $dependency_command_template, $theme, 'theme' ), $theme_dependencies );

		$required_plugins_regex = \array_map( fn( $plugin ) => \sprintf( "-e '^%1\$s$'", $plugin ), $plugin_dependencies );
		$required_plugins_regex = implode( ' ', $required_plugins_regex );

		$required_themes_regex = \array_map( fn( $theme ) => \sprintf( "-e '^%1\$s$'", $theme ), $theme_dependencies );
		$required_themes_regex = implode( ' ', $required_themes_regex );

		$dependency_commands = array_merge( $plugin_dependency_commands, $theme_dependency_commands );

		if ( empty( $plugin_slug_or_url ) && empty( $theme_slug ) ) {
			return array( ...$dependency_commands );
		}

		/**
		 * Generate the command that installs and activates the plugins. This handles plugins that are from wp.org repo, managed or paid from remote urls.
		 *
		 * To make sure that there are no 3rd party plugins that might interfere in the installation process, this command is executing by skipping non-required plugins and themes.
		 * 1. We get a list of themes or plugins by name
		 * 2. We pipe the result to grep to exclude dependencies that are required
		 * 3. We pipe the result to tr to escape space characters
		 * 4. We pipe the result to tr to created a comma separated list
		 */
		$command_template = '';

		if ( array() === $theme_dependencies ) {
			$command_template .= ' --skip-themes';
		} else {
			$command_template .= " --skip-themes=\"$(wp --skip-themes --skip-plugins theme list --field=name | grep -v %2\$s | tr '\n' ',')\"";
		}

		if ( array() === $plugin_dependencies ) {
			$command_template .= ' --skip-plugins';
		} else {
			$command_template .= " --skip-plugins=\"$(wp --skip-themes --skip-plugins plugin list --field=name | grep -v %3\$s | tr '\n' ',')\"";
		}

		$commands = array(
			...$dependency_commands,
		);

		// If we have a plugin slug, install and activate the plugin.
		if ( ! empty( $plugin_slug_or_url ) ) {
			$software_commands = array(
				'add_managed_plugin_command' => ' atomic plugin use-managed %1$s --remove-existing',
				'activate_plugin_command'    => ' plugin activate %1$s',
			);

			if ( ! $use_managed ) {
				$software_commands = array(
					'add_remote_plugin_command' => ' plugin install "%1$s" --activate --force',
				);
			}

			// Append the dependencies first so that they are installed before the actual product.
			$commands = array(
				...$dependency_commands,
				...array_map( fn( $command ) => sprintf( $command_template . $command, $plugin_slug_or_url, $required_themes_regex, $required_plugins_regex ), array_values( $software_commands ) ),
			);
		}

		// We can bail early if we don't need to install a theme.
		if ( empty( $theme_slug ) ) {
			return $commands;
		}

		// Install a theme either from remote url or use managed version and activate
		if ( ! $use_managed ) {
			$commands[] = sprintf( $command_template . ' theme install "%1$s" --force', $theme_slug, $required_themes_regex, $required_plugins_regex );
		} else {
			$commands[] = sprintf( $command_template . ' atomic theme use-managed %1$s --remove-existing', $theme_slug, $required_themes_regex, $required_plugins_regex );
		}

		return $commands;
	}

	/**
	 * Verify that the product software is installed and activated.
	 *
	 * @param array       $expected_plugins A list of plugins that will be checked.
	 * @param array       $expected_themes  A list of themes that will be checked.
	 * @param string|null $expected_theme   The theme that will be checked.
	 *
	 * @return bool|WP_Error
	 */
	public function verify_installation( array $expected_plugins, array $expected_themes, string $expected_theme = null ) {
		$plugins_verification = $this->verify_plugins_software_is_installed( $expected_plugins, $expected_themes );

		if ( ! $plugins_verification || \is_wp_error( $plugins_verification ) ) {
			return new \WP_Error(
				'software_not_installed',
				'Failed to verify plugin activation',
				array(
					'verification_result' => $plugins_verification,
				)
			);
		}

		if ( null !== $expected_theme ) {
			$theme_verification = $this->verify_theme_software_is_installed( $expected_theme );

			if ( false === $theme_verification || \is_wp_error( $theme_verification ) ) {
				return new \WP_Error(
					'software_not_installed',
					'Failed to verify theme activation',
					array(
						'verification_result' => $theme_verification,
					)
				);
			}
		}

		return true;
	}

	/**
	 * Check if the given plugins are activated on the Atomic site.
	 *
	 * @param array $expected_plugins A list of plugins that will be checked.
	 * @param array $expected_themes A list of themes that will be checked.
	 *
	 * @return bool|WP_Error
	 */
	private function verify_plugins_software_is_installed( array $expected_plugins, array $expected_themes ) {
		$expected_plugins = \array_filter( $expected_plugins );

		if ( empty( $expected_plugins ) ) {
			return true;
		}

		$plugin_commands = \array_map(
			fn( $plugin_slug ) => 'wp --skip-themes --skip-plugins plugin get ' . $plugin_slug . ' --field=status',
			$expected_plugins
		);

		$theme_commands = \array_map(
			fn( $plugin_slug ) => 'wp --skip-themes --skip-plugins theme get ' . $plugin_slug . ' --field=status',
			$expected_themes
		);
		$commands       = array( ...$plugin_commands, ...$theme_commands );

		return $this->run_verify_commands( $commands );
	}

	/**
	 * Check if the given theme is activated on the Atomic site.
	 *
	 * @param string $expected_theme The theme that will be checked.
	 *
	 * @return bool|WP_Error
	 */
	private function verify_theme_software_is_installed( string $expected_theme ) {
		$commands = array( 'wp --skip-themes --skip-plugins theme get ' . $expected_theme . ' --field=status' );

		return $this->run_verify_commands( $commands, true );
	}

	/**
	 * Run the commands that verifies if the software is either installed/active or installed/inactive.
	 *
	 * @param array $commands The list of verification commands to be run.
	 * @param bool  $verify_only_installation Whether to verify only installation or installation and activation.
	 *
	 * @return bool|WP_Error
	 */
	private function run_verify_commands( array $commands, bool $verify_only_installation = false ) {
		$command = \implode( ' && ', $commands );

		WP_CLI::debug( 'Running command: ' . $command );
		$result = WP_CLI::runcommand(
			$command,
			array(
				'launch'     => false,
				'exit_error' => false,
			)
		);

		if ( \is_wp_error( $result ) ) {
			return $result;
		}

		if ( $verify_only_installation ) {
			// Only verify installation, we can return true as the command did not return any errors
			return true;
		}

		// Returns true if the output displays "active" for each $software item.
		return \substr_count( $result->stdout, 'active' ) === \count( $commands );
	}
}
