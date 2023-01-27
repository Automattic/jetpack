<?php
/**
 * High-level class for managing the WAF
 *
 * @package automattic/jetpack-waf
 */

namespace Automattic\Jetpack\Waf;

use Automattic\Jetpack\Modules;

/**
 * Manages the WAF
 */
class Waf_Manager {

	const WAF_MODULE_NAME        = 'waf';
	const MODE_OPTION_NAME       = 'jetpack_waf_mode';
	const SHARE_DATA_OPTION_NAME = 'jetpack_waf_share_data';

	/**
	 * Set action hooks
	 *
	 * @return void
	 */
	public static function add_hooks() {
		// Register REST routes.
		add_action( 'rest_api_init', array( new REST_Controller(), 'register_rest_routes' ) );
		// Add hooks for the firewall rules.
		Waf_Rules_Manager::add_hooks();
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
	 * Activates the WAF by generating the rules script and setting the version
	 *
	 * @return void
	 */
	public static function activate() {
		Waf_Constants::define_mode();
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
	 * Get WAF File Path
	 *
	 * @param string $file The file path starting in the WAF directory.
	 * @return string The full file path to the provided file in the WAF directory.
	 */
	public static function get_waf_file_path( $file ) {
		Waf_Constants::define_waf_directory();

		// Ensure the file path starts with a slash.
		if ( '/' !== substr( $file, 0, 1 ) ) {
			$file = "/$file";
		}

		return JETPACK_WAF_DIR . $file;
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
	 * Created the waf directory on activation.
	 *
	 * @return void
	 * @throws \Exception In case there's a problem when creating the directory.
	 */
	public static function create_waf_directory() {
		WP_Filesystem();
		Waf_Constants::define_waf_directory();

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
			'automatic_rules_available'                  => Waf_Rules_Manager::automatic_rules_available(),
			'bootstrap_path'                             => self::get_bootstrap_file_path(),
		);
	}

}
