<?php
/**
 * Handles generation and deletion of the bootstrap for the standalone WAF mode.
 *
 * @package automattic/jetpack-waf
 */

namespace Automattic\Jetpack\Waf;

use Composer\InstalledVersions;

/**
 * Handles the bootstrap.
 *
 * @phan-constructor-used-for-side-effects
 */
class Waf_Standalone_Bootstrap {

	/**
	 * Ensures that constants are initialized if this class is used.
	 *
	 * @return void
	 */
	public function __construct() {
		$this->guard_against_missing_abspath();
		$this->initialize_constants();
	}

	/**
	 * Ensures that this class is not used unless we are in the right context.
	 *
	 * @throws Waf_Exception If we are outside of WordPress.
	 *
	 * @return void
	 */
	private function guard_against_missing_abspath() {

		if ( ! defined( 'ABSPATH' ) ) {
			throw new Waf_Exception( 'Cannot generate the WAF bootstrap if we are not running in WordPress context.' );
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
	 * Should only be implemented after the wp_loaded action hook:
	 *
	 * @link https://developer.wordpress.org/reference/functions/wp_filesystem/#more-information
	 *
	 * @return void
	 */
	protected function initialize_filesystem() {
		if ( ! function_exists( '\\WP_Filesystem' ) ) {
			require_once ABSPATH . 'wp-admin/includes/file.php';
		}

		WP_Filesystem();
	}

	/**
	 * Finds the path to Composer's generated classmap, which the generated bootstrap file uses to autoload WAF classes.
	 *
	 * @throws Waf_Exception In case the classmap file cannot be found.
	 *
	 * @return string
	 */
	private function locate_classmap_file() {
		global $jetpack_autoloader_loader;

		$vendor_dirs = array();

		// Try the Jetpack autoloader.
		if ( isset( $jetpack_autoloader_loader ) ) {
			$class_file = $jetpack_autoloader_loader->find_class_file( Waf_Runner::class );
			if ( $class_file ) {
				$vendor_dirs[] = dirname( $class_file, 5 ) . '/vendor';
			}
		}

		// Try Composer's autoloader.
		if ( is_callable( array( InstalledVersions::class, 'getInstallPath' ) )
			&& InstalledVersions::isInstalled( 'automattic/jetpack-waf' )
		) {
			$package_file = InstalledVersions::getInstallPath( 'automattic/jetpack-waf' );
			if ( substr( $package_file, -23 ) === '/automattic/jetpack-waf' ) {
				$vendor_dirs[] = dirname( $package_file, 3 ) . '/vendor';
			}
		}

		// Guess. First look for being in a `vendor/automattic/jetpack-waf/src/', then see if we're standalone with our own vendor dir.
		$vendor_dirs[] = dirname( __DIR__, 4 ) . '/vendor';
		$vendor_dirs[] = dirname( __DIR__ ) . '/vendor';

		// A candidate can exist without containing this package, e.g. a monorepo's root vendor dir.
		foreach ( $vendor_dirs as $vendor_dir ) {
			$classmap_file = $vendor_dir . '/composer/autoload_classmap.php';
			if ( ! file_exists( $classmap_file ) ) {
				continue;
			}
			$classmap = require $classmap_file;
			if ( isset( $classmap[ Waf_Runner::class ] ) ) {
				return $classmap_file;
			}
		}

		throw new Waf_Exception( 'Cannot find the Composer classmap, and the WAF standalone bootstrap will not work without it.' );
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
	 * Gets the entrypoint file.
	 *
	 * @return string The entrypoint file.
	 */
	private function get_entrypoint() {
		return defined( 'JETPACK_WAF_ENTRYPOINT' ) ? JETPACK_WAF_ENTRYPOINT : 'rules/rules.php';
	}

	/**
	 * Generates the bootstrap file.
	 *
	 * @throws File_System_Exception If the filesystem is not available.
	 * @throws File_System_Exception If the WAF directory cannot be created.
	 * @throws File_System_Exception If the bootstrap file cannot be created.
	 *
	 * @return string Absolute path to the bootstrap file.
	 */
	public function generate() {

		$this->initialize_filesystem();

		global $wp_filesystem;
		if ( ! $wp_filesystem ) {
			throw new File_System_Exception( 'Cannot work without the file system being initialized.' );
		}

		$classmap_file = $this->locate_classmap_file();

		$bootstrap_file          = $this->get_bootstrap_file_path();
		$entrypoint              = $this->get_entrypoint();
		$mode_option             = get_option( Waf_Runner::MODE_OPTION_NAME, false );
		$share_data_option       = get_option( Waf_Runner::SHARE_DATA_OPTION_NAME, false );
		$share_debug_data_option = get_option( Waf_Runner::SHARE_DEBUG_DATA_OPTION_NAME, false );

		// Autoload from the classmap alone rather than `vendor/autoload.php`: Composer's loader would also run every
		// package's `files` entries and mark them loaded, so the Jetpack autoloader later skips its own, possibly newer, copies.
		// The closure keeps every variable, including the classmap's own `$vendorDir`/`$baseDir`, out of the global scope.
		$template = <<<'PHP'
		<?php
		define( 'DISABLE_JETPACK_WAF', {{disable}} );
		if ( defined( 'DISABLE_JETPACK_WAF' ) && DISABLE_JETPACK_WAF ) return;
		define( 'JETPACK_WAF_MODE', {{mode}} );
		define( 'JETPACK_WAF_SHARE_DATA', {{share_data}} );
		define( 'JETPACK_WAF_SHARE_DEBUG_DATA', {{share_debug_data}} );
		define( 'JETPACK_WAF_DIR', {{dir}} );
		define( 'JETPACK_WAF_WPCONFIG', {{wpconfig}} );
		define( 'JETPACK_WAF_ENTRYPOINT', {{entrypoint}} );
		( static function () {
			$classmap_file = {{classmap_file}};
			if ( ! is_file( $classmap_file ) ) {
				return;
			}
			$classmap   = require $classmap_file;
			$autoloader = static function ( $class_name ) use ( $classmap ) {
				if ( isset( $classmap[ $class_name ] ) ) {
					require $classmap[ $class_name ];
				}
			};
			spl_autoload_register( $autoloader );
			Automattic\Jetpack\Waf\Waf_Runner::initialize();
			spl_autoload_unregister( $autoloader );
		} )();

		PHP;

		$code = strtr(
			$template,
			array(
				'{{disable}}'          => var_export( defined( 'DISABLE_JETPACK_WAF' ) && DISABLE_JETPACK_WAF, true ),
				'{{mode}}'             => var_export( $mode_option ? $mode_option : 'silent', true ),
				'{{share_data}}'       => var_export( $share_data_option, true ),
				'{{share_debug_data}}' => var_export( $share_debug_data_option, true ),
				'{{dir}}'              => var_export( JETPACK_WAF_DIR, true ),
				'{{wpconfig}}'         => var_export( JETPACK_WAF_WPCONFIG, true ),
				'{{entrypoint}}'       => var_export( $entrypoint, true ),
				'{{classmap_file}}'    => var_export( $classmap_file, true ),
			)
		);

		if ( ! $wp_filesystem->is_dir( JETPACK_WAF_DIR ) ) {
			if ( ! $wp_filesystem->mkdir( JETPACK_WAF_DIR ) ) {
				throw new File_System_Exception( 'Failed creating WAF standalone bootstrap file directory: ' . JETPACK_WAF_DIR );
			}
		}

		if ( ! $wp_filesystem->put_contents( $bootstrap_file, $code ) ) {
			throw new File_System_Exception( 'Failed writing WAF standalone bootstrap file to: ' . $bootstrap_file );
		}

		return $bootstrap_file;
	}
}
