<?php
/**
 * Jetpack Beta Tester CLI controls
 *
 * @package automattic/jetpack-beta
 */

namespace Automattic\JetpackBeta;

use WP_CLI;
use WP_CLI_Command;

if ( ! class_exists( 'WP_CLI_Command' ) ) {
	return;
}

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
			try {
				$plugins = Plugin::get_all_plugins( true );
			} catch ( PluginDataException $ex ) {
				WP_CLI::error( $ex->getMessage() );
			}
			if ( ! $plugins ) {
				WP_CLI::error( __( 'No plugins are available', 'jetpack-beta' ) );
			}

			$l = 0;
			foreach ( $plugins as $slug => $plugin ) {
				$l = max( $l, strlen( $slug ) );
			}
			WP_CLI::line( 'Available plugins: ' );
			foreach ( $plugins as $slug => $plugin ) {
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
		$dev_info      = $plugin->dev_info();
		$active_branch = $dev_info ? $dev_info->branch : null;
		$branches      = array( 'stable', 'trunk', 'rc' );
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
	 *     wp jetpack-beta activate jetpack trunk
	 *     wp jetpack-beta activate jetpack master (deprecated alias for trunk)
	 *     wp jetpack-beta activate jetpack stable
	 *     wp jetpack-beta activate jetpack rc
	 *     wp jetpack-beta activate jetpack 9.8
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

		if ( 'trunk' === $args[1] || 'master' === $args[1] ) {
			$source = 'trunk';
			$id     = '';
			// translators: %1$s: Plugin name.
			$premsg = __( 'Activating %1$s trunk branch', 'jetpack-beta' );
			// translators: %1$s: Plugin name.
			$postmsg = __( '%1$s is now on the trunk branch', 'jetpack-beta' );
		} elseif ( 'stable' === $args[1] ) {
			$source = 'stable';
			$id     = '';
			// translators: %1$s: Plugin name.
			$premsg = __( 'Activating %1$s latest release', 'jetpack-beta' );
			// translators: %1$s: Plugin name.
			$postmsg = __( '%1$s is now on the latest release', 'jetpack-beta' );
		} elseif ( 'rc' === $args[1] ) {
			$source = 'rc';
			$id     = '';
			// translators: %1$s: Plugin name.
			$premsg = __( 'Activating %1$s release candidate', 'jetpack-beta' );
			// translators: %1$s: Plugin name.
			$postmsg = __( '%1$s is now on the latest release candidate', 'jetpack-beta' );
		} elseif ( preg_match( '/^\d+(?:\.\d+)(?:-beta\d*)?$/', $args[1] ) ) {
			$source = 'release';
			$id     = $args[1];
			// translators: %1$s: Plugin name. %2$s: Version number.
			$premsg = __( 'Activating %1$s release version %2$s', 'jetpack-beta' );
			// translators: %1$s: Plugin name. %2$s: Version number.
			$postmsg = __( '%1$s is now on release version %2$s', 'jetpack-beta' );
		} else {
			$source = 'pr';
			$id     = $args[1];
			// translators: %1$s: Plugin name. %2$s: Branch name.
			$premsg = __( 'Activating %1$s branch %2$s', 'jetpack-beta' );
			// translators: %1$s: Plugin name. %2$s: Branch name.
			$postmsg = __( '%1$s is now on branch %2$s', 'jetpack-beta' );
		}

		WP_CLI::line( sprintf( $premsg, $plugin->get_name(), $id ) );
		$ret = $plugin->install_and_activate( $source, $id );
		if ( is_wp_error( $ret ) ) {
			WP_CLI::error( $ret->get_error_message() );
		} else {
			WP_CLI::line( sprintf( $postmsg, $plugin->get_name(), $id ) );
		}
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
