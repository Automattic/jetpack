<?php
/**
 * Handles generation and deletion of the bootstrap for the standalone WAF mode.
 *
 * @package automattic/jetpack-waf
 */

namespace Automattic\Jetpack\Waf;

/**
 * Handles the bootstrap.
 */
class Waf_Standalone_Bootstrap {
	/**
	 * Generates the bootstrap file.
	 *
	 * @throws File_System_Exception If the filesystem is not available.
	 * @throws File_System_Exception If the WAF directory can not be created.
	 * @throws File_System_Exception If the bootstrap file can not be created.
	 *
	 * @return string Absolute path to the bootstrap file.
	 */
	public function generate() {
		$Filesystem = new Waf_Filesystem();
		$fs         = $Filesystem->initialize_filesystem();

		$Constants = new Waf_Constants();
		$Constants->initialize_constants();

		$bootstrap_file = trailingslashit( JETPACK_WAF_DIR ) . 'bootstrap.php';

		$code = "<?php\n";
		foreach ( $Constants::CONSTANTS as $constant_name ) {
			$constant_value = $Constants->get( $constant_name );
			$code          .= sprintf( "define( '%s', %s );\n", $constant_name, var_export( $constant_value, true ) ); // phpcs:disable WordPress.PHP.DevelopmentFunctions
		}
		$code .= "Automattic\Jetpack\Waf_Runtime\Runner::run();\n";

		if ( ! $fs->is_dir( JETPACK_WAF_DIR ) ) {
			if ( ! $fs->mkdir( JETPACK_WAF_DIR ) ) {
				throw new File_System_Exception( 'Failed creating WAF standalone bootstrap file directory: ' . JETPACK_WAF_DIR );
			}
		}

		if ( ! $fs->put_contents( $bootstrap_file, $code ) ) {
			throw new File_System_Exception( 'Failed writing WAF standalone bootstrap file to: ' . $bootstrap_file );
		}

		return $bootstrap_file;
	}
}
