<?php
/**
 * CLI handler for Jetpack Waf.
 *
 * @package automattic/jetpack-waf
 */

namespace Automattic\Jetpack\Waf;

use \WP_CLI;
use \WP_CLI_Command;

/**
 * Just a few sample commands to learn how WP-CLI works
 */
class CLI extends WP_CLI_Command {
	/**
	 * View or set the current mode of the WAF.
	 * ## OPTIONS
	 *
	 * [<mode>]
	 * : The new mode to be set.
	 * ---
	 * options:
	 *   - silent
	 *   - normal
	 * ---
	 *
	 * @param array $args Arguments passed to CLI.
	 * @return void|null
	 * @throws WP_CLI\ExitException If there is an error switching the mode.
	 */
	public function mode( $args ) {
		if ( count( $args ) > 1 ) {

			return WP_CLI::error( __( 'Only one mode may be specified.', 'jetpack-waf' ) );
		}
		if ( count( $args ) === 1 ) {
			if ( ! Waf_Runner::is_allowed_mode( $args[0] ) ) {

				return WP_CLI::error(
					sprintf(
						/* translators: %1$s is the mode that was actually found. Also note that the expected "silent" and "normal" are hard-coded strings and must therefore stay the same in any translation. */
						__( 'Invalid mode: %1$s. Expected "silent" or "normal".', 'jetpack-waf' ),
						$args[0]
					)
				);
			}

			update_option( Waf_Runner::MODE_OPTION_NAME, $args[0] );

			try {
				( new Waf_Standalone_Bootstrap() )->generate();
			} catch ( \Exception $e ) {
				WP_CLI::warning(
					sprintf(
						/* translators: %1$s is the unexpected error message. */
						__( 'Unable to generate waf bootstrap - standalone mode may not work properly: %1$s', 'jetpack-waf' ),
						$e->getMessage()
					)
				);
			}

			return WP_CLI::success(
				sprintf(
					/* translators: %1$s is the name of the mode that was just switched to. */
					__( 'Jetpack WAF mode switched to "%1$s".', 'jetpack-waf' ),
					get_option( Waf_Runner::MODE_OPTION_NAME )
				)
			);
		}
		WP_CLI::line(
			sprintf(
				/* translators: %1$s is the name of the mode that the waf is currently running in. */
				__( 'Jetpack WAF is running in "%1$s" mode.', 'jetpack-waf' ),
				get_option( Waf_Runner::MODE_OPTION_NAME )
			)
		);
	}

	/**
	 * Setup the WAF to run.
	 * ## OPTIONS
	 *
	 * [<mode>]
	 * : The new mode to be set.
	 * ---
	 * options:
	 *   - silent
	 *   - normal
	 * ---
	 *
	 * @param array $args Arguments passed to CLI.
	 * @return void|null
	 * @throws WP_CLI\ExitException If there is an error switching the mode.
	 */
	public function setup( $args ) {
		if ( ! Waf_Runner::is_allowed_mode( $args[0] ) ) {

			return WP_CLI::error(
				sprintf(
					/* translators: %1$s is the mode that was actually found. Also note that the expected "silent" and "normal" are hard-coded strings and must therefore stay the same in any translation. */
					__( 'Invalid mode: %1$s. Expected "silent" or "normal".', 'jetpack-waf' ),
					$args[0]
				)
			);
		}
		// Add the option or update if already exists.
		if ( ! add_option( Waf_Runner::MODE_OPTION_NAME, $args[0] ) ) {
			$this->mode( array( $args[0] ) );
		}

		try {
			Waf_Runner::activate();
		} catch ( \Exception $e ) {

			return WP_CLI::error(
				sprintf(
					/* translators: %1$s is the unexpected error message. */
					__( 'Jetpack WAF rules file failed to generate: %1$s', 'jetpack-waf' ),
					$e->getMessage()
				)
			);
		}

		return WP_CLI::success( __( 'Jetpack WAF has successfully been setup.', 'jetpack-waf' ) );
	}

	/**
	 * Generate the rules.php file with latest rules for the WAF.
	 *
	 * @return void|null
	 * @throws WP_CLI\ExitException If there is an error switching the mode.
	 */
	public function generate_rules() {
		try {
			Waf_Runner::generate_rules();
		} catch ( \Exception $e ) {

			return WP_CLI::error(
				sprintf(
					/* translators: %1$s is the unexpected error message. */
					__( 'Jetpack WAF rules file failed to generate: %1$s', 'jetpack-waf' ),
					$e->getMessage()
				)
			);
		}

		return WP_CLI::success(
			sprintf(
				/* translators: %1$s is the name of the mode that was just switched to. */
				__( 'Jetpack WAF rules successfully created to: "%1$s".', 'jetpack-waf' ),
				Waf_Runner::RULES_FILE
			)
		);
	}
}
