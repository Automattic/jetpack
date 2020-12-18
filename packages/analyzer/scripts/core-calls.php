<?php //phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Function call finder script.
 *
 * @package automattic/jetpack-analyzer
 */

namespace Automattic\Jetpack\Analyzer;

use Composer\Script\Event;

/**
 * This class holds the callback for the WordPress API function analyzer.
 */
class CoreCalls {

	/**
	 * A static method to handle the Composer script call that
	 * triggers a repository code scan for WordPress Core function
	 * calls.
	 *
	 * @param Composer\Script\Event $event a script call event.
	 */
	public static function callback( Event $event ) {
		$arguments = $event->getArguments();
		$scan_path = isset( $arguments[0] ) ? $arguments[0] : null;
		$io        = $event->getIO();

		if ( is_null( $scan_path ) ) {
			$io->writeError( 'Scan path is required for this script to work. Pass it as the argument.' );
			return;
		}

		$io->write( "Find invocations\n" );
		try {
			$invocations = new Invocations();
			$invocations->scan( $scan_path );
			foreach ( $invocations->get() as $invocation ) {

				// TODO: Need a way to separate Core calls from others.
				if ( $invocation instanceof Invocations\Function_Call ) {
					$io->write(
						$invocation->func_name . ', ' .
						$invocation->path . ', ' .
						$invocation->line
					);
				}
			}
		} catch ( Exception $e ) {
			$io->writeError( 'Exception caught' );
			$io->writeError( $e->getMessage() );
			return;
		}
	}
}
