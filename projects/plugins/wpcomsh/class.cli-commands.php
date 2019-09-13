<?php

if ( ! class_exists( 'WP_CLI' ) ) {
	return;
}

/**
 *  Force WordPress to always output English at the command line.
 */
WP_CLI::add_wp_hook( 'pre_option_WPLANG', function() {
    return 'en_US';
});

/**
 * Public methods of this class which are not marked as "Not a WP CLI command"
 * are WP CLI commands which can be used to perform actions on an AT site.
 *
 *
 * Class WPCOMSH_CLI_Commands
 */
class WPCOMSH_CLI_Commands extends WP_CLI_Command {
	const OPTION_DEACTIVATED_USER_PLUGINS = 'wpcomsh_deactivated_user_installed_plugins';

	private function get_active_user_installed_plugins() {
		// phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedHooknameFound -- Calling native WordPress hook.
		$all_plugins = array_keys( apply_filters( 'all_plugins', get_plugins() ) );

		$user_installed_plugins = array_filter(
			$all_plugins,
			function( $file ) {
				$name = WP_CLI\Utils\get_plugin_name( $file );

				return ! in_array(
					$name,
					[
						'jetpack',
						'akismet',
						'amp',
					]
				);
			}
		);

		$active_user_installed_plugins = array_filter(
			$user_installed_plugins,
			function( $file ) {
				return is_plugin_active_for_network( $file ) || is_plugin_active( $file );
			}
		);

		$active_user_installed_plugin_names = array_map(
			function( $file ) {
					return WP_CLI\Utils\get_plugin_name( $file );
			},
			$active_user_installed_plugins
		);

		return $active_user_installed_plugin_names;
	}

	/**
	 * Deactivate all plugins except for important ones for Atomic.
	 */
	function deactivate_user_installed_plugins() {
		$user_installed_plugins = $this->get_active_user_installed_plugins();
		if ( empty( $user_installed_plugins ) ) {
			WP_CLI::warning( 'No active user installed plugins found.' );
			return;
		}

		update_option( self::OPTION_DEACTIVATED_USER_PLUGINS, $user_installed_plugins );

		// This prpeares to execute the CLI command: wp plugin deactivate plugin1 plugin2 ...
		array_unshift( $user_installed_plugins, 'plugin', 'deactivate' );

		WP_CLI::run_command( $user_installed_plugins );
	}

	/**
	 * Deactivate all plugins except for important ones for Atomic.
	 */
	function toggle_user_installed_plugins() {
		$previously_deactivated_plugins = get_option( self::OPTION_DEACTIVATED_USER_PLUGINS );

		if ( false === $previously_deactivated_plugins ) {
			WP_CLI::log( 'Deactivating user installed plugins.' );

			return $this->deactivate_user_installed_plugins();
		}

		WP_CLI::log( 'Activating previously deactivated user installed plugins.' );

		// This prpeares to execute the CLI command: wp plugin deactivate plugin1 plugin2 ...
		array_unshift( $previously_deactivated_plugins, 'plugin', 'activate' );

		WP_CLI::run_command( $previously_deactivated_plugins );
		delete_option( self::OPTION_DEACTIVATED_USER_PLUGINS );
	}
}
/*
 * This works just like plugin verify-checksums except it filters language translation files.
 * Language files are not part of WordPress.org's checksums so they are listed as added and
 * they obfuscate the output. This makes it hard to spot actual checksum verification errors.
 */
class Checksum_Plugin_Command_WPCOMSH extends Checksum_Plugin_Command {
	protected function filter_file( $filepath ) {
		return ! preg_match( '#^(languages/)?[a-z0-9-]+-[a-z]{2}_[A-Z]{2}(_[a-z]+)?([.](mo|po)|-[a-f0-9]{32}[.]json)$#', $filepath );
	}
}

WP_CLI::add_command( 'wpcomsh', 'WPCOMSH_CLI_Commands' );
WP_CLI::add_command( 'wpcomsh plugin verify-checksums', 'Checksum_Plugin_Command_WPCOMSH' );
