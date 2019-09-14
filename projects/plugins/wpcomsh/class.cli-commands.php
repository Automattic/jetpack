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
 * Class WPCOMSH_CLI_Commands
 */
class WPCOMSH_CLI_Commands extends WP_CLI_Command {
	const TRANSIENT_DEACTIVATED_USER_PLUGINS = 'wpcomsh_deactivated_user_installed_plugins';

	// Plugins used by the e-commerce plan.
	// see https://wpcom.trac.automattic.com/browser/trunk/wp-content/lib/atomic/class-plan-manager.php#L96
	const ECOMMERCE_PLAN_PLUGINS = [
		'storefront-powerpack',
		'woocommerce',
		'facebook-for-woocommerce',
		'mailchimp-for-woocommerce',
		'woocommerce-services',
		'woocommerce-product-addons',
		'taxjar-simplified-taxes-for-woocommerce',
	];

	private function confirm( $question ) {
		fwrite( STDOUT, $question . ' [Y/n] ' );
		$answer = strtolower( trim( fgets( STDIN ) ) );
		return 'y' === $answer || ! $answer;
	}

	private function get_active_user_installed_plugins( $include_ecommerce = false ) {
		// phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedHooknameFound -- Calling native WordPress hook.
		$all_plugins = array_keys( apply_filters( 'all_plugins', get_plugins() ) );

		$user_installed_plugins = array_filter(
			$all_plugins,
			function( $file ) use ( $include_ecommerce ) {
				$name = WP_CLI\Utils\get_plugin_name( $file );

				if (
					in_array(
						$name,
						[
							'akismet',
							'amp',
							'jetpack',
						]
					)
				) {
					return false;
				}

				if ( ! $include_ecommerce && in_array( $name, self::ECOMMERCE_PLAN_PLUGINS ) ) {
					return false;
				}

				return true;
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
	 * Bulk deactivate user installed plugins
	 *
	 * Deactivate all user installed plugins except for important ones for Atomic.
	 *
	 * @subcommand deactivate-user-plugins
	 * @synopsis [--interactive] [--include-ecommerce]
	 * ## OPTIONS
	 *
	 * [--include-ecommerce]
	 * : Include deactivating plugins of the ecommerce plan
	 *
	 * [--interactive]
	 * : Ask for each active plugin whether to deactivate
	 */
	function deactivate_user_installed_plugins( $args, $assoc_args = array() ) {
		$include_ecommerce = WP_CLI\Utils\get_flag_value( $assoc_args, 'include-ecommerce', false );

		$user_installed_plugins = $this->get_active_user_installed_plugins( $include_ecommerce );
		if ( empty( $user_installed_plugins ) ) {
			WP_CLI::warning( 'No active user installed plugins found.' );
			return;
		}

		if ( WP_CLI\Utils\get_flag_value( $assoc_args, 'interactive', false ) ) {
			foreach ( $user_installed_plugins as $k => $plugin ) {
				if ( $this->confirm( 'Deactivate plugin "' . $plugin . '"?' ) ) {
					WP_CLI::run_command( array( 'plugin', 'deactivate', $plugin ) );
				}
			}

		} else {
			// This prepares to execute the CLI command: wp plugin deactivate plugin1 plugin2 ...
			array_unshift( $user_installed_plugins, 'plugin', 'deactivate' );

			WP_CLI::run_command( $user_installed_plugins );
		}
	}

	/**
	 * Bulk re-activate user installed plugins
	 *
	 * If previously user installed plugins had been deactivated, this re-activates these plugins.
	 *
	 * @subcommand reactivate-user-plugins
	 * @synopsis [--interactive] [--include-ecommerce]
	 * ## OPTIONS
	 *
	 * [--include-ecommerce]
	 * : Include deactivating plugins of the ecommerce plan
	 *
	 * [--interactive]
	 * : Ask for each previously deactivated plugin whether to activate
	 */
	function reactivate_user_installed_plugins( $args, $assoc_args = array() ) {
		$previously_deactivated_plugins = get_transient( self::TRANSIENT_DEACTIVATED_USER_PLUGINS );

		if ( false === $previously_deactivated_plugins ) {
			WP_CLI::log( "Can't find any previously deactivated plugins." );
			exit;
		}

		WP_CLI::log( 'Activating previously deactivated user installed plugins.' );

		if ( WP_CLI\Utils\get_flag_value( $assoc_args, 'interactive', false ) ) {
			foreach ( $previously_deactivated_plugins as $k => $plugin ) {
				if ( $this->confirm( 'Activate plugin "' . $plugin . '"?' ) ) {
					WP_CLI::run_command( array( 'plugin', 'activate', $plugin ) );
					unset( $previously_deactivated_plugins[ $k ] );
					// Update transient everytime to prevent using the original transient if loop breaks/terminated
					set_transient( self::TRANSIENT_DEACTIVATED_USER_PLUGINS, $previously_deactivated_plugins, DAY_IN_SECONDS );
				}
			}

			if ( empty( $previously_deactivated_plugins ) ) {
				delete_transient( self::TRANSIENT_DEACTIVATED_USER_PLUGINS );
			}
		} else {
			WP_CLI::log( 'The following will be activated:' );
			foreach( $previously_deactivated_plugins as $plugin ) {
				WP_CLI::log( '- ' . $plugin );
			}
			if ( ! $this->confirm( 'Do you wish to proceed?' ) ) {
				WP_CLI::error( 'Action cancelled.' );
				exit;
			}

			// This prepares to execute the CLI command: wp plugin deactivate plugin1 plugin2 ...
			array_unshift( $previously_deactivated_plugins, 'plugin', 'activate' );

			WP_CLI::run_command( $previously_deactivated_plugins );
			delete_transient( self::TRANSIENT_DEACTIVATED_USER_PLUGINS );
		}

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

// Keep a record of deactivated plugins so that they can be reactivated.
add_action( 'deactivate_plugin', function( $file ) {
	$previously_deactivated_plugins = get_transient( WPCOMSH_CLI_Commands::TRANSIENT_DEACTIVATED_USER_PLUGINS );
	$previously_deactivated_plugins[] = WP_CLI\Utils\get_plugin_name( $file );
	set_transient( WPCOMSH_CLI_Commands::TRANSIENT_DEACTIVATED_USER_PLUGINS, array_values( array_unique( $previously_deactivated_plugins ) ), DAY_IN_SECONDS );
} );

WP_CLI::add_command( 'wpcomsh', 'WPCOMSH_CLI_Commands' );
WP_CLI::add_command( 'wpcomsh plugin verify-checksums', 'Checksum_Plugin_Command_WPCOMSH' );
