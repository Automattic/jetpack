<?php
/**
 * Entrypoint for actually executing the WAF.
 *
 * @package automattic/jetpack-waf
 */

namespace Automattic\Jetpack\Waf;

use Automattic\Jetpack\Modules;
use Automattic\Jetpack\Status\Host;

/**
 * Executes the WAF.
 */
class Waf_Runner {

	const WAF_MODULE_NAME        = 'waf';
	const MODE_OPTION_NAME       = 'jetpack_waf_mode';
	const SHARE_DATA_OPTION_NAME = 'jetpack_waf_share_data';

	/**
	 * Run the WAF
	 */
	public static function initialize() {
		if ( ! self::is_enabled() ) {
			return;
		}
		self::define_mode();
		self::define_share_data();
		if ( ! self::is_allowed_mode( JETPACK_WAF_MODE ) ) {
			return;
		}
		// Don't run if in standalone mode
		if ( function_exists( 'add_action' ) ) {
			self::add_hooks();
			Waf_Rules_Manager::add_hooks();
			Waf_Rules_Manager::schedule_rules_cron();
		}
		if ( ! self::did_run() ) {
			self::run();
		}
	}

	/**
	 * Set action hooks
	 *
	 * @return void
	 */
	public static function add_hooks() {
		// Register REST routes.
		add_action( 'rest_api_init', array( new REST_Controller(), 'register_rest_routes' ) );
	}

	/**
	 * Set the mode definition if it has not been set.
	 *
	 * @return void
	 */
	public static function define_mode() {
		if ( ! defined( 'JETPACK_WAF_MODE' ) ) {
			$mode_option = get_option( self::MODE_OPTION_NAME );
			define( 'JETPACK_WAF_MODE', $mode_option );
		}
	}

	/**
	 * Set the share data definition if it has not been set.
	 *
	 * @return void
	 */
	public static function define_share_data() {
		if ( ! defined( 'JETPACK_WAF_SHARE_DATA' ) ) {
			$share_data_option = get_option( self::SHARE_DATA_OPTION_NAME, false );
			define( 'JETPACK_WAF_SHARE_DATA', $share_data_option );
		}
	}

	/**
	 * Did the WAF run yet or not?
	 *
	 * @return bool
	 */
	public static function did_run() {
		return defined( 'JETPACK_WAF_RUN' );
	}

	/**
	 * Determines if the passed $option is one of the allowed WAF operation modes.
	 *
	 * @param  string $option The mode option.
	 * @return bool
	 */
	public static function is_allowed_mode( $option ) {
		// Normal constants are defined prior to WP_CLI running causing problems for activation
		if ( defined( 'WAF_CLI_MODE' ) ) {
			$option = WAF_CLI_MODE;
		}

		$allowed_modes = array(
			'normal',
			'silent',
		);

		return in_array( $option, $allowed_modes, true );
	}

	/**
	 * Determines if the WAF is supported in the current environment.
	 *
	 * @since 0.8.0
	 * @return bool
	 */
	public static function is_supported_environment() {
		// Do not run when killswitch is enabled
		if ( defined( 'DISABLE_JETPACK_WAF' ) && DISABLE_JETPACK_WAF ) {
			return false;
		}

		// Do not run in the WPCOM context
		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			return false;
		}

		// Do not run on the Atomic platform
		if ( ( new Host() )->is_atomic_platform() ) {
			return false;
		}

		return true;
	}

	/**
	 * Determines if the WAF module is enabled on the site.
	 *
	 * @return bool
	 */
	public static function is_enabled() {
		// if ABSPATH is defined, then WordPress has already been instantiated,
		// so we can check to see if the waf module is activated.
		if ( defined( 'ABSPATH' ) ) {
			return ( new Modules() )->is_active( self::WAF_MODULE_NAME );
		}

		return true;
	}

	/**
	 * Enables the WAF module on the site.
	 */
	public static function enable() {
		return ( new Modules() )->activate( self::WAF_MODULE_NAME, false, false );
	}

	/**
	 * Disabled the WAF module on the site.
	 */
	public static function disable() {
		return ( new Modules() )->deactivate( self::WAF_MODULE_NAME );
	}

	/**
	 * Get Config
	 *
	 * @return array The WAF settings and current configuration data.
	 */
	public static function get_config() {
		return array(
			Waf_Rules_Manager::AUTOMATIC_RULES_ENABLED_OPTION_NAME => get_option( Waf_Rules_Manager::AUTOMATIC_RULES_ENABLED_OPTION_NAME ),
			Waf_Rules_Manager::IP_LISTS_ENABLED_OPTION_NAME => get_option( Waf_Rules_Manager::IP_LISTS_ENABLED_OPTION_NAME ),
			Waf_Rules_Manager::IP_ALLOW_LIST_OPTION_NAME => get_option( Waf_Rules_Manager::IP_ALLOW_LIST_OPTION_NAME ),
			Waf_Rules_Manager::IP_BLOCK_LIST_OPTION_NAME => get_option( Waf_Rules_Manager::IP_BLOCK_LIST_OPTION_NAME ),
			self::SHARE_DATA_OPTION_NAME                 => get_option( self::SHARE_DATA_OPTION_NAME ),
			'bootstrap_path'                             => self::get_bootstrap_file_path(),
			'automatic_rules_available'                  => (bool) self::automatic_rules_available(),
		);
	}

	/**
	 * Get Bootstrap File Path
	 *
	 * @return string The path to the Jetpack Firewall's bootstrap.php file.
	 */
	private static function get_bootstrap_file_path() {
		$bootstrap = new Waf_Standalone_Bootstrap();
		return $bootstrap->get_bootstrap_file_path();
	}

	/**
	 * Get WAF File Path
	 *
	 * @param string $file The file path starting in the WAF directory.
	 * @return string The full file path to the provided file in the WAF directory.
	 */
	public static function get_waf_file_path( $file ) {
		Waf_Constants::initialize_constants();

		// Ensure the file path starts with a slash.
		if ( '/' !== substr( $file, 0, 1 ) ) {
			$file = "/$file";
		}

		return JETPACK_WAF_DIR . $file;
	}

	/**
	 * Runs the WAF and potentially stops the request if a problem is found.
	 *
	 * @return void
	 */
	public static function run() {
		// Make double-sure we are only running once.
		if ( self::did_run() ) {
			return;
		}

		Waf_Constants::initialize_constants();

		// if ABSPATH is defined, then WordPress has already been instantiated,
		// and we're running as a plugin (meh). Otherwise, we're running via something
		// like PHP's prepend_file setting (yay!).
		define( 'JETPACK_WAF_RUN', defined( 'ABSPATH' ) ? 'plugin' : 'preload' );

		// if the WAF is being run before a command line script, don't try to execute rules (there's no request).
		if ( PHP_SAPI === 'cli' ) {
			return;
		}

		// if something terrible happens during the WAF running, we don't want to interfere with the rest of the site,
		// so we intercept errors ONLY while the WAF is running, then we remove our handler after the WAF finishes.
		$display_errors = ini_get( 'display_errors' );
		// phpcs:ignore
		ini_set( 'display_errors', 'Off' );
		// phpcs:ignore
		set_error_handler( array( self::class, 'errorHandler' ) );

		try {

			// phpcs:ignore
			$waf = new Waf_Runtime( new Waf_Transforms(), new Waf_Operators() );

			// execute waf rules.
			$rules_file_path = self::get_waf_file_path( Waf_Rules_Manager::RULES_ENTRYPOINT_FILE );
			if ( file_exists( $rules_file_path ) ) {
				// phpcs:ignore
				include $rules_file_path;
			}
} catch ( \Exception $err ) { // phpcs:ignore
			// Intentionally doing nothing.
		}

		// remove the custom error handler, so we don't interfere with the site.
		restore_error_handler();
		// phpcs:ignore
		ini_set( 'display_errors', $display_errors );
	}

	/**
	 * Error handler to be used while the WAF is being executed.
	 *
	 * @param int    $code The error code.
	 * @param string $message The error message.
	 * @param string $file File with the error.
	 * @param string $line Line of the error.
	 * @return void
	 */
	public static function errorHandler( $code, $message, $file, $line ) { // phpcs:ignore
		// Intentionally doing nothing for now.
	}

	/**
	 * Initializes the WP filesystem.
	 *
	 * @return void
	 * @throws \Exception If filesystem is unavailable.
	 */
	public static function initialize_filesystem() {
		if ( ! function_exists( '\\WP_Filesystem' ) ) {
			require_once ABSPATH . 'wp-admin/includes/file.php';
		}

		if ( ! \WP_Filesystem() ) {
			throw new \Exception( 'No filesystem available.' );
		}
	}

	/**
	 * Activates the WAF by generating the rules script and setting the version
	 *
	 * @return void
	 */
	public static function activate() {
		self::define_mode();
		if ( ! self::is_allowed_mode( JETPACK_WAF_MODE ) ) {
			return;
		}
		$version = get_option( Waf_Rules_Manager::VERSION_OPTION_NAME );
		if ( ! $version ) {
			add_option( Waf_Rules_Manager::VERSION_OPTION_NAME, Waf_Rules_Manager::RULES_VERSION );
		}

		add_option( self::SHARE_DATA_OPTION_NAME, true );

		self::initialize_filesystem();
		self::create_waf_directory();
		Waf_Rules_Manager::generate_automatic_rules();
		Waf_Rules_Manager::generate_ip_rules();
		self::create_blocklog_table();
		Waf_Rules_Manager::generate_rules();
	}

	/**
	 * Created the waf directory on activation.
	 *
	 * @return void
	 * @throws \Exception In case there's a problem when creating the directory.
	 */
	public static function create_waf_directory() {
		WP_Filesystem();
		Waf_Constants::initialize_constants();

		global $wp_filesystem;
		if ( ! $wp_filesystem ) {
			throw new \Exception( 'Can not work without the file system being initialized.' );
		}

		if ( ! $wp_filesystem->is_dir( JETPACK_WAF_DIR ) ) {
			if ( ! $wp_filesystem->mkdir( JETPACK_WAF_DIR ) ) {
				throw new \Exception( 'Failed creating WAF standalone bootstrap file directory: ' . JETPACK_WAF_DIR );
			}
		}
	}

	/**
	 * Create the log table when plugin is activated.
	 *
	 * @return void
	 */
	public static function create_blocklog_table() {
		global $wpdb;

		require_once ABSPATH . 'wp-admin/includes/upgrade.php';

		$sql = "
		CREATE TABLE {$wpdb->prefix}jetpack_waf_blocklog (
			log_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
			timestamp datetime NOT NULL,
			rule_id BIGINT NOT NULL,
			reason longtext NOT NULL,
			PRIMARY KEY (log_id),
			KEY timestamp (timestamp)
		)
		";

		dbDelta( $sql );
	}

	/**
	 * Deactivates the WAF by deleting the relevant options and emptying rules file.
	 *
	 * @return void
	 * @throws \Exception If file writing fails.
	 */
	public static function deactivate() {
		delete_option( self::MODE_OPTION_NAME );
		delete_option( Waf_Rules_Manager::VERSION_OPTION_NAME );

		global $wp_filesystem;

		self::initialize_filesystem();

		// If the rules file doesn't exist, there's nothing else to do.
		if ( ! $wp_filesystem->exists( self::get_waf_file_path( Waf_Rules_Manager::RULES_ENTRYPOINT_FILE ) ) ) {
			return;
		}

		// Empty the rules entrypoint file.
		if ( ! $wp_filesystem->put_contents( self::get_waf_file_path( Waf_Rules_Manager::RULES_ENTRYPOINT_FILE ), "<?php\n" ) ) {
			throw new \Exception( 'Failed to empty rules.php file.' );
		}
	}

	/**
	 * Handle updates to the WAF
	 */
	public static function update_waf() {
		Waf_Rules_Manager::update_rules_if_changed();
		// Re-generate the standalone bootstrap file on every update
		// TODO: We may consider only doing this when the WAF version changes
		( new Waf_Standalone_Bootstrap() )->generate();
	}

	/**
	 * Check if automatic rules file is available
	 *
	 * @return bool False if automatic rules file is not available or empty, true otherwise
	 */
	public static function automatic_rules_available() {

		$automatic_rules_existed = get_option( Waf_Rules_Manager::AUTOMATIC_RULES_LAST_UPDATED_OPTION_NAME );

		if ( ! $automatic_rules_existed ) {
			return false;
		}

		global $wp_filesystem;

		self::initialize_filesystem();

		$automatic_rules_file_contents = $wp_filesystem->get_contents( self::get_waf_file_path( Waf_Rules_Manager::AUTOMATIC_RULES_FILE ) );

		if ( "<?php\n" === $automatic_rules_file_contents ) {
			return false;
		}

		return true;

	}

}
