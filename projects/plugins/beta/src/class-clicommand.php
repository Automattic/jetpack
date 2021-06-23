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
	 * Activate a branch version
	 *
	 * ## OPTIONS
	 *
	 * activate master: Get a version of the master branch built every 15 minutes
	 * activate stable: Get the latest stable version of Jetpack
	 * activate branch_name: Get a version of PR. PR must be built and unit-tested before it become availabe
	 * list: Get list of available jetpack branches to install
	 *
	 * ## EXAMPLES
	 *
	 * wp jetpack-beta branch activate master
	 * wp jetpack-beta branch activate stable
	 * wp jetpack-beta branch activate branch_name
	 * wp jetpack-beta branch list
	 *
	 * @param array $args arguments passed to CLI, per the examples above.
	 */
	public function branch( $args ) {

		$this->validation_checks( $args );

		if ( 'list' === $args[0] ) {
			return $this->branches_list();
		}

		$branches = array( 'master', 'stable', 'rc' );

		if ( in_array( $args[1], $branches, true ) ) {
			return $this->install_jetpack( $args[1], $args[1] );
		} else {
			$branch_name = str_replace( '/', '_', $args[1] );
			$url         = Utils::get_install_url( $branch_name, 'pr' );
			if ( null === $url ) {
				return WP_CLI::error( __( 'Invalid branch name. Try `wp jetpack-beta branch list` for list of available branches', 'jetpack-beta' ) );
			}
			return $this->install_jetpack( $branch_name, 'pr' );
		}
		return WP_CLI::error( __( 'Unrecognized branch version. ', 'jetpack-beta' ) );
	}

	/**
	 * Validate that we can switch branches.
	 *
	 * @param array $args arguments passed to CLI.
	 */
	private function validation_checks( $args ) {

		if ( is_multisite() && ! is_main_site() ) {
			return WP_CLI::error( __( 'Secondary sites in multisite instalations are not supported', 'jetpack-beta' ) );
		}

		if ( empty( $args ) ) {
			return WP_CLI::error( __( 'Specify subcommand. "activate" and "list" subcommands are supported', 'jetpack-beta' ) );
		}

		if ( 'activate' !== $args[0] && 'list' !== $args[0] ) {
			return WP_CLI::error( __( 'Only "activate" and "list" subcommands are supported', 'jetpack-beta' ) );
		}

		if ( 'activate' === $args[0] && empty( $args[1] ) ) {
			return WP_CLI::error( __( 'Specify branch name. Try `wp jetpack-beta branch list` for list of available branches', 'jetpack-beta' ) );
		}
	}

	/**
	 * Install Jetpack using selected branch.
	 *
	 * @param array $branch is the selected branch.
	 * @param array $section what we're specifically installing (PR, master, stable, etc).
	 */
	private function install_jetpack( $branch, $section ) {

		WP_CLI::line( 'Activating ' . $branch . ' branch...' );

		$result = Utils::install_and_activate( $branch, $section );
		if ( is_wp_error( $result ) ) {
			return WP_CLI::error( __( 'Error', 'jetpack-beta' ) . $result->get_error_message() );
		}
		// translators: $branch is what branch we've switched to.
		return WP_CLI::success( printf( esc_html__( 'Jetpack is currently on %s branch', 'jetpack-beta' ), esc_html( $branch ) ) );
	}

	/**
	 * Display list of branches.
	 */
	private function branches_list() {
		$manifest            = Utils::get_beta_manifest();
		$jetpack_beta_active = get_option( 'jetpack_beta_active' );
		$current_branch      = str_replace( '_', '/', $jetpack_beta_active[0] );
		$branches            = array( 'stable', 'master', 'rc' );
		foreach ( get_object_vars( $manifest->pr ) as $key ) {
			$branches[] = $key->branch;
		}
		sort( $branches );
		WP_CLI::line( 'Available branches: ' );
		foreach ( $branches as $branch ) {
			WP_CLI::line( $current_branch === $branch ? '* ' . $branch : '  ' . $branch );
		}
	}
}
