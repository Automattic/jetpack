<?php
/**
 * Handles generation and deletion of the bootstrap for the standalone WAF mode.
 *
 * @package automattic/jetpack-waf
 */

namespace Automattic\Jetpack\Waf;

use Exception;

/**
 * Handles the bootstrap.
 */
class WafStandaloneBootstrap {

	/**
	 * Ensures that constants are initialized if this class is used.
	 */
	public function __construct() {
		$this->guard_against_missing_abspath();
		$this->initialize_constants();
	}

	/**
	 * Ensures that this class is not used unless we are in the right context.
	 *
	 * @return void
	 * @throws Exception If we are outside of WordPress.
	 */
	private function guard_against_missing_abspath() {

		if ( ! defined( 'ABSPATH' ) ) {
			throw new Exception( 'Cannot generate the WAF bootstrap if we are not running in WordPress context.' );
		}
	}

	/**
	 * Initializes the constants required for generating the bootstrap, if they have not been initialized yet.
	 *
	 * @return void
	 */
	private function initialize_constants() {
		if ( ! defined( 'JETPACK_WAF_DIR' ) ) {
			define( 'JETPACK_WAF_DIR', trailingslashit( WP_CONTENT_DIR ) . 'jetpack-waf' );
		}
		if ( ! defined( 'JETPACK_WAF_WPCONFIG' ) ) {
			define( 'JETPACK_WAF_WPCONFIG', trailingslashit( dirname( WP_CONTENT_DIR ) ) . 'wp-config.php' );
		}
	}

	/**
	 * Initialized the WP filesystem and serves as a mocking hook for tests.
	 *
	 * @return void
	 */
	protected function initialize_filesystem() {
		WP_Filesystem();
	}

	/**
	 * Generates the bootstrap file.
	 *
	 * @return string Absolute path to the bootstrap file.
	 * @throws Exception In case the file can not be written.
	 */
	public function generate() {

		$this->initialize_filesystem();

		global $wp_filesystem;
		if ( ! $wp_filesystem ) {
			throw new Exception( 'Can not work without the file system being initialized.' );
		}

		$bootstrap_file = trailingslashit( JETPACK_WAF_DIR ) . 'bootstrap.php';

		// phpcs:disable
		$code = "<?php\n"
			. sprintf( "define( 'JETPACK_WAF_MODE', %s );\n", var_export( get_option( WafRunner::MODE_OPTION_NAME, false ) ?: 'silent', true ) )
			. sprintf( "define( 'JETPACK_WAF_DIR', %s );\n", var_export( JETPACK_WAF_DIR, true ) )
			. sprintf( "define( 'JETPACK_WAF_WPCONFIG', %s );\n", var_export( JETPACK_WAF_WPCONFIG, true ) )
			. "include " . var_export( dirname( __DIR__ ) . '/run.php', true ) . ";\n";
		// phpcs:enable

		if ( ! $wp_filesystem->put_contents( $bootstrap_file, $code ) ) {
			throw new Exception( 'Failed writing WAF standalone bootstrap file to: ' . $bootstrap_file );
		}

		return $bootstrap_file;
	}

}
