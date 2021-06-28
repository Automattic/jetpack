<?php
/**
 * Jetpack Beta Tester CLI controls
 *
 * @package automattic/jetpack-beta
 */

namespace Automattic\JetpackBeta;

use WP_CLI;
use WP_CLI_Command;

/**
 * Control your local Jetpack Beta Tester plugin.
 */
class CliCommand extends WP_CLI_Command {

	/**
	 * Deprecated entry point.
	 *
	 * ## Options
	 *
	 * <subcommand>
	 * : Subcommand to run. Either 'list' or 'activate'.
	 *
	 * [<args>...]
	 * : Any additional args to the subcommand.
	 *
	 * @deprecated since 3.0.0
	 * @param array $args Arguments passed to CLI.
	 */
	public function branch( $args ) {
		$this->validation_checks();

		$subcommand = array_shift( $args );
		if ( 'list' === $subcommand ) {
			WP_CLI::warning( __( 'Command `wp jetpack-beta branch list` is deprecated. Use `wp jetpack-beta list jetpack` instead.', 'jetpack-beta' ) );
			WP_CLI::run_command( array( 'jetpack-beta', 'list', 'jetpack' ) );
		} elseif ( 'activate' === $subcommand ) {
			WP_CLI::warning( __( 'Command `wp jetpack-beta branch activate <branch>` is deprecated. Use `wp jetpack-beta activate jetpack <branch>` instead.', 'jetpack-beta' ) );
			WP_CLI::run_command( array_merge( array( 'jetpack-beta', 'activate', 'jetpack' ), $args ) );
		} else {
			WP_CLI::warning( __( 'Command `wp jetpack-beta branch` is deprecated. See `wp help jetpack-beta` for available commands.', 'jetpack-beta' ) );
			WP_CLI::error( __( 'Specify subcommand. "activate" and "list" subcommands are supported', 'jetpack-beta' ) );
		}
	}

	/**
	 * List available plugins or branches.
	 *
	 * ## Options
	 *
	 * [<plugin>]
	 * : If specified, list branches available for the plugin.
	 *
	 * ## Examples
	 *
	 *     wp jetpack-beta list
	 *     wp jetpack-beta list jetpack
	 *
	 * @subcommand list
	 * @param array $args Arguments passed to CLI.
	 */
	public function do_list( $args ) {
		$this->validation_checks();

		if ( ! $args ) {
			$plugins = Plugin::get_all_plugins( true );
			if ( ! $plugins ) {
				WP_CLI::error( __( 'No plugins are available', 'jetpack-beta' ) );
			}

			$l = 0;
			foreach ( $plugins as $slug => $plugin ) {
				$l = max( $l, strlen( $slug ) );
			}
			WP_CLI::line( 'Available plugins: ' );
			foreach ( Plugin::get_all_plugins( true ) as $slug => $plugin ) {
				WP_CLI::line( sprintf( "  %-{$l}s - %s", $slug, $plugin->get_name() ) );
			}
			return;
		}

		$plugin = Plugin::get_plugin( $args[0], true );
		if ( ! $plugin ) {
			// translators: %s: subcommand that was not found.
			WP_CLI::error( sprintf( __( 'Plugin \'%s\' is not known. Use `wp jetpack-beta list` to list known plugins', 'jetpack-beta' ), $args[0] ) );
		}

		$manifest      = $plugin->get_manifest();
		$active_branch = $plugin->active_branch();
		$branches      = array( 'stable', 'master', 'rc' );
		foreach ( $manifest->pr as $pr ) {
			$branches[] = $pr->branch;
		}
		asort( $branches );
		WP_CLI::line( 'Available branches: ' );
		foreach ( $branches as $branch ) {
			WP_CLI::line( ( $active_branch === $branch ? '* ' : '  ' ) . $branch );
		}
	}

	/**
	 * Activate a branch for a plugin.
	 *
	 * ## Options
	 *
	 * <plugin>
	 * : The plugin to activate a branch for.
	 *
	 * <branch>
	 * : The branch to activate.
	 *
	 * ## Examples
	 *
	 *     wp jetpack-beta activate jetpack master
	 *     wp jetpack-beta activate jetpack stable
	 *     wp jetpack-beta activate jetpack update/some-branch
	 *
	 * @param array $args Arguments passed to CLI.
	 */
	public function activate( $args ) {
		$this->validation_checks();

		$plugin = Plugin::get_plugin( $args[0], true );
		if ( ! $plugin ) {
			// translators: %s: Plugin slug that was not found.
			WP_CLI::error( sprintf( __( 'Plugin \'%s\' is not known. Use `wp jetpack-beta list` to list known plugins', 'jetpack-beta' ), $args[0] ) );
		}

		$branch = $args[1];
		WP_CLI::line( "Activating {$plugin->get_name()} branch $branch..." );
		$plugin->install_and_activate( $branch );
		// translators: %1$s: Plugin name. %2$s: Branch name.
		WP_CLI::success( sprintf( __( '%1$s is now on branch %2$s', 'jetpack-beta' ), $plugin->get_name(), $branch ) );
	}

	/**
	 * Validate environment.
	 */
	private function validation_checks() {
		if ( is_multisite() && ! is_main_site() ) {
			WP_CLI::error( __( 'Secondary sites in multisite instalations are not supported', 'jetpack-beta' ) );
		}
	}

}
