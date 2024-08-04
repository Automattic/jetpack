<?php // phpcs:ignore Squiz.Commenting.FileComment.Missing
/**
 * Abstract class that allows to install a marketplace product.
 *
 * @since 5.1.3
 * @package WPCOM_Marketplace
 */

/**
 * Abstract class that allows to install a marketplace product by generating and running the installation commands.
 * This class implements methods that are common to all marketplace products.
 *
 * @since 5.1.3
 * @package WPCOM_Marketplace
 */
abstract class Marketplace_Product_Software {

	/**
	 * Product software slug. Used to install the product.
	 *
	 * @var string
	 */
	protected string $software_slug;

	/**
	 * Download URL of the product. Used to install the product if it's not managed.
	 *
	 * @var string
	 */
	protected string $download_url;

	/**
	 * List of plugin the product depends on.
	 *
	 * @var array<string>
	 */
	protected array $plugin_dependencies;

	/**
	 * List of themes the product depends on.
	 *
	 * @var array<string>
	 */
	protected array $theme_dependencies;

	/**
	 * Whether the product is managed or not.
	 *
	 * @var bool
	 */
	protected bool $is_managed;

	/**
	 * Marketplace_Product_Software constructor.
	 *
	 * @param string        $software_slug          The product slug used to install the product.
	 * @param bool          $is_managed             Whether the product is managed or not.
	 * @param string        $download_url           The download URL of the product.
	 * @param array<string> $plugin_dependencies    List of plugins the product depends on.
	 * @param array<string> $theme_dependencies     List of themes the product depends on.
	 */
	public function __construct( string $software_slug, bool $is_managed, string $download_url, array $plugin_dependencies = array(), array $theme_dependencies = array() ) {
		$this->software_slug       = $software_slug;
		$this->download_url        = $download_url;
		$this->plugin_dependencies = $plugin_dependencies;
		$this->theme_dependencies  = $theme_dependencies;
		$this->is_managed          = $is_managed;
	}

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
	protected function generate_install_commands( ?string $plugin_slug_or_url, array $plugin_dependencies, array $theme_dependencies, ?string $theme_slug = null, ?bool $use_managed = true ): array {
		/**
		 * This can be extended in the future to support advanced dependency trees or multiple types of products.
		 *
		 * We first try to symlink it, if it fails, it reverts to installing the plugin.
		 */
		$dependency_command_template = '(wp --skip-themes --skip-plugins atomic %2$s use-managed %1$s --remove-existing --activate || wp --skip-themes --skip-plugins %2$s install %1$s --activate --force)';
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
		$command_template = 'wp';

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
	protected function verify_installation( array $expected_plugins, array $expected_themes, string $expected_theme = null ): bool|WP_Error {
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
	private function verify_plugins_software_is_installed( array $expected_plugins, array $expected_themes ): WP_Error|bool {
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
	private function verify_theme_software_is_installed( string $expected_theme ): WP_Error|bool {
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
	private function run_verify_commands( array $commands, bool $verify_only_installation = false ): WP_Error|bool {
		$command = \implode( ' && ', $commands );
		$result  = WP_CLI::runcommand(
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
