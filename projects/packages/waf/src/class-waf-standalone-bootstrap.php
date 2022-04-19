<?php
/**
 * Handles generation and deletion of the bootstrap for the standalone WAF mode.
 *
 * @package automattic/jetpack-waf
 */

namespace Automattic\Jetpack\Waf;

use Composer\InstalledVersions;
use Exception;

/**
 * Handles the bootstrap.
 */
class Waf_Standalone_Bootstrap {

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
		Waf_Constants::initialize_constants();
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
	 * Finds the path to the autoloader, which can then be used to require the autoloader in the generated boostrap file.
	 *
	 * @return string|null
	 * @throws Exception In case the autoloader file can not be found.
	 */
	private function locate_autoloader_file() {
		global $jetpack_autoloader_loader;

		$autoload_file = null;

		// Try the Jetpack autoloader.
		if ( isset( $jetpack_autoloader_loader ) ) {
			$class_file = $jetpack_autoloader_loader->find_class_file( Waf_Runner::class );
			if ( $class_file ) {
				$autoload_file = dirname( dirname( dirname( dirname( dirname( $class_file ) ) ) ) ) . '/vendor/autoload.php';
			}
		}

		// Try Composer's autoloader.
		if ( null === $autoload_file
			&& is_callable( array( InstalledVersions::class, 'getInstallPath' ) )
			&& InstalledVersions::isInstalled( 'automattic/jetpack-waf' )
		) {
			$package_file = InstalledVersions::getInstallPath( 'automattic/jetpack-waf' );
			if ( substr( $package_file, -23 ) === '/automattic/jetpack-waf' ) {
				$autoload_file = dirname( dirname( dirname( $package_file ) ) ) . '/vendor/autoload.php';
			}
		}

		// Guess. First look for being in a `vendor/automattic/jetpack-waf/src/', then see if we're standalone with our own vendor dir.
		if ( null === $autoload_file ) {
			$autoload_file = dirname( dirname( dirname( dirname( __DIR__ ) ) ) ) . '/vendor/autoload.php';
			if ( ! file_exists( $autoload_file ) ) {
				$autoload_file = dirname( __DIR__ ) . '/vendor/autoload.php';
			}
		}

		// Check that the determined file actually exists.
		if ( ! file_exists( $autoload_file ) ) {
			throw new Exception( 'Can not find autoloader, and the WAF standalone boostrap will not work without it.' );
		}

		return $autoload_file;
	}

	/**
	 * Gets the path to the bootstrap.php file.
	 *
	 * @return string The bootstrap.php file path.
	 */
	public function get_bootstrap_file_path() {
		return trailingslashit( JETPACK_WAF_DIR ) . 'bootstrap.php';
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

		$bootstrap_file = $this->get_bootstrap_file_path();
		$mode_option    = get_option( Waf_Runner::MODE_OPTION_NAME, false );

		// phpcs:disable WordPress.PHP.DevelopmentFunctions
		$code = "<?php\n"
			. sprintf( "define( 'JETPACK_WAF_MODE', %s );\n", var_export( $mode_option ? $mode_option : 'silent', true ) )
			. sprintf( "define( 'JETPACK_WAF_DIR', %s );\n", var_export( JETPACK_WAF_DIR, true ) )
			. sprintf( "define( 'JETPACK_WAF_WPCONFIG', %s );\n", var_export( JETPACK_WAF_WPCONFIG, true ) )
			. 'require_once ' . var_export( $this->locate_autoloader_file(), true ) . ";\n"
			. 'include ' . var_export( dirname( __DIR__ ) . '/run.php', true ) . ";\n";
		// phpcs:enable

		if ( ! $wp_filesystem->is_dir( JETPACK_WAF_DIR ) ) {
			if ( ! $wp_filesystem->mkdir( JETPACK_WAF_DIR ) ) {
				throw new Exception( 'Failed creating WAF standalone bootstrap file directory: ' . JETPACK_WAF_DIR );
			}
		}

		if ( ! $wp_filesystem->put_contents( $bootstrap_file, $code ) ) {
			throw new Exception( 'Failed writing WAF standalone bootstrap file to: ' . $bootstrap_file );
		}

		return $bootstrap_file;
	}

}
