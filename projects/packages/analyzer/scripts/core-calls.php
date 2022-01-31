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
		$core_path = isset( $arguments[1] ) ? $arguments[1] : null;
		$io        = $event->getIO();

		if (
			is_null( $scan_path )
			|| is_null( $core_path )
		) {
			$io->writeError( 'Scan path and WordPress Core source paths are required for this script to work.' );
			$io->writeError( 'Usage: composer run core-calls /path/to/plugin /path/to/wordpress/src' );
			return;
		}

		try {
			$declarations = CoreDefinitions::get_declarations( $core_path );

			$invocations = new Invocations();
			$invocations->scan( $scan_path, array( 'vendor', 'vendor_prefixed' ) );

			$dependencies = new Dependencies();
			$dependencies->generate( $invocations, $declarations );
			foreach ( $dependencies->get() as $dependency ) {

				$io->write(
					$dependency->invocation->display_name() . ', ' .
					$dependency->invocation->path . ', ' .
					$dependency->invocation->line
				);

			}
		} catch ( Exception $e ) {
			$io->writeError( 'Exception caught' );
			$io->writeError( $e->getMessage() );
			return;
		}
	}
}
