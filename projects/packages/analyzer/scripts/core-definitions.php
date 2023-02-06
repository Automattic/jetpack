<?php //phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Function definition finder script.
 *
 * @package automattic/jetpack-analyzer
 */

namespace Automattic\Jetpack\Analyzer;

use Composer\Script\Event;

/**
 * This class holds the callback for the WordPress API function definition finder.
 */
class CoreDefinitions {

	/**
	 * A static method to handle the Composer script call that
	 * triggers a WordPress Core code scan for function and method definitions.
	 *
	 * @param Composer\Script\Event $event a script call event.
	 */
	public static function callback( Event $event ) {
		$arguments = $event->getArguments();
		$scan_path = isset( $arguments[0] ) ? $arguments[0] : null;
		$io        = $event->getIO();

		if ( is_null( $scan_path ) ) {
			$io->writeError( 'WordPress Core path is required for this script to work. Pass it as the argument.' );
			return;
		}

		$io->write( "Find invocations\n" );

		try {
			$declarations = self::get_declarations( $scan_path );
			foreach ( $declarations->get() as $declaration ) {

				if ( $declaration instanceof Declarations\Function_ ) {

					$io->write(
						$declaration->func_name . ', ' .
						$declaration->path . ', ' .
						$declaration->line
					);
				} elseif ( $declaration instanceof Declarations\Class_Property ) {

					$io->write(
						$declaration->class_name . '::' . $declaration->prop_name . ', ' .
						$declaration->path . ', ' .
						$declaration->line
					);
				} elseif ( $declaration instanceof Declarations\Class_Method ) {

					$io->write(
						$declaration->class_name . '::' . $declaration->method_name . ', ' .
						$declaration->path . ', ' .
						$declaration->line
					);
				} elseif ( $declaration instanceof Declarations\Class_Const ) {

					$io->write(
						$declaration->class_name . '::' . $declaration->const_name . ', ' .
						$declaration->path . ', ' .
						$declaration->line
					);
				}
			}
		} catch ( Exception $e ) {
			$io->writeError( 'Exception caught' );
			$io->writeError( $e->getMessage() );
			return;
		}
	}

	/**
	 * Returns an object containing found WordPress core declarations in the scan path.
	 * Note: the function simply filters out declarations that are of no interest to us,
	 * not really performing any further analysis.
	 *
	 * @param String $scan_path the file path to scan for declarations in.
	 * @return \Automattic\Jetpack\Analyzer\Declarations $declarations object.
	 * @throws \Exception $exception on an unhandled declaration found.
	 */
	public static function get_declarations( string $scan_path ) { // phpcs:ignore PHPCompatibility
		$core_declarations = new Declarations();
		$core_declarations->scan( $scan_path );
		$filtered_declarations = new Declarations();

		foreach ( $core_declarations->get() as $declaration ) {

			if ( $declaration instanceof Declarations\Class_ ) {

				// We are not interested in class definitions.
				continue;

			} elseif (
				$declaration instanceof Declarations\Class_Property
				&& ! $declaration->static
			) {

				// We are not interested in properties of objects if they are not static.
				continue;

			} elseif (
				$declaration instanceof Declarations\Class_Method
				&& ! $declaration->static
			) {

				// We are not interested in methods of objects if they are not static.
				continue;

			} elseif (
				! (
					$declaration instanceof Declarations\Function_
					|| $declaration instanceof Declarations\Class_Property
					|| $declaration instanceof Declarations\Class_Method
					|| $declaration instanceof Declarations\Class_Const
				)
			) {
				throw new \Exception( 'Unhandled declaration of type ' . get_class( $declaration ) );
			}

			$filtered_declarations->add( $declaration );
		}

		return $filtered_declarations;
	}
}
