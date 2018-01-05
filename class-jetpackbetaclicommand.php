<?php

if ( defined( 'WP_CLI' ) && WP_CLI ) {
	/**
	 * Control your local Jetpack Beta Tester plugin.
	 */
	class JetpackBetaCliCommand extends WP_CLI_Command {
		/**
		 * Activate a branch version
		 *
		 * ## OPTIONS
		 *
		 *
		 * activate master: Get a version of the master branch built every 15 minutes
		 *
		 * activate stable: Get the latest stable version of Jetpack
		 *
		 * ## EXAMPLES
		 *
		 * wp jetpack-beta branch activate master
		 * wp jetpack-beta branch activate stable
		 *
		 */
		public function branch( $args ) {

			$this->validation_checks( $args );
				
			if ( 'master' === $args[1] ) {
				$retvalue = Jetpack_Beta::install_and_activate( 'master', 'master' );
				if ( is_wp_error( $retvalue ) ) {
					return WP_CLI::error( __( 'Error', 'jetpack' ) . $retvalue->get_error_message() );
				}
				return WP_CLI::success( __( 'Jetpack is currently on Bleeding Edge', 'jetpack-beta' ) );
			}
			if ( 'stable' === $args[1] ) {
				$retvalue = Jetpack_Beta::install_and_activate( 'stable', 'stable' );
				if ( is_wp_error( $retvalue ) ) {
					return WP_CLI::error( __( 'Error', 'jetpack' ) . $retvalue->get_error_message() );
				}
				return WP_CLI::success( __( 'Jetpack is currently on Latest Stable', 'jetpack-beta' ) );
			}
			return WP_CLI::error( __( 'Unrecognized branch version. ', 'jetpack' ) );
		}

		private function validation_checks($args) {
			if ( is_multisite() && ! is_main_site() ) {
				return WP_CLI::error( __( 'Secondary sites in multisite instalations are not supported', 'jetpack' ) );				
			}

			if ( empty( $args ) ) {
				return WP_CLI::error( __( 'Specify subcommand', 'jetpack' ) );
			}

			if ( 'activate' !== $args[0] ) {
				return WP_CLI::error( __( 'Only "activate" subcommand is supported', 'jetpack' ) );				
			}

			if ( empty( $args[1] ) ) {
				return WP_CLI::error( __( 'Specify branch name', 'jetpack' ) );				
			}
		}
	}

	WP_CLI::add_command( 'jetpack-beta', 'JetpackBetaCliCommand' );
}
