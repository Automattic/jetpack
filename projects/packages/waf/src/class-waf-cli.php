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

			return WP_CLI::error( 'Only one mode may be specified.' );
		}
		if ( count( $args ) === 1 ) {
			if ( ! WafRunner::is_allowed_mode( $args[0] ) ) {

				return WP_CLI::error( "Invalid mode: \"{$args[0]}\". Expected \"silent\" or \"normal\"." );
			}

			update_option( WafRunner::MODE_OPTION_NAME, $args[0] );

			try {
				( new WafStandaloneBootstrap() )->generate();
			} catch ( \Exception $e ) {
				WP_CLI::warning( 'Unable to generate waf bootstrap - standalone mode may not work properly: ' . $e->getMessage() );
			}

			return WP_CLI::success( 'Jetpack WAF mode switched to "' . get_option( WafRunner::MODE_OPTION_NAME ) . '".' );
		}
		WP_CLI::line( 'Jetpack WAF is running in "' . get_option( WafRunner::MODE_OPTION_NAME ) . '" mode.' );
	}
}
