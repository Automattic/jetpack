<?php
/**
 * Entrypoint for actually executing the WAF.
 *
 * @package automattic/jetpack-waf
 */

namespace Automattic\Jetpack\Waf;

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Modules;
use Jetpack_Options;

/**
 * Executes the WAF.
 */
class Waf_Runner {

	const WAF_RULES_VERSION             = '1.0.0';
	const MODE_OPTION_NAME              = 'jetpack_waf_mode';
	const IP_LISTS_ENABLED_OPTION_NAME  = 'jetpack_waf_ip_list';
	const IP_ALLOW_LIST_OPTION_NAME     = 'jetpack_waf_ip_allow_list';
	const IP_BLOCK_LIST_OPTION_NAME     = 'jetpack_waf_ip_block_list';
	const RULES_FILE                    = __DIR__ . '/../rules/rules.php';
	const ALLOW_IP_FILE                 = __DIR__ . '/../rules/allow-ip.php';
	const BLOCK_IP_FILE                 = __DIR__ . '/../rules/block-ip.php';
	const VERSION_OPTION_NAME           = 'jetpack_waf_rules_version';
	const RULE_LAST_UPDATED_OPTION_NAME = 'jetpack_waf_last_updated_timestamp';

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
	 * Determines if the WAF module is enabled on the site.
	 *
	 * @return bool
	 */
	public static function is_enabled() {
		// if ABSPATH is defined, then WordPress has already been instantiated,
		// so we can check to see if the waf module is activated.
		if ( defined( 'ABSPATH' ) ) {
			return ( new Modules() )->is_active( 'waf' );
		}

		return true;
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
			// phpcs:ignore
			include self::RULES_FILE;
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
		$version = get_option( self::VERSION_OPTION_NAME );
		if ( ! $version ) {
			add_option( self::VERSION_OPTION_NAME, self::WAF_RULES_VERSION );
		}

		self::initialize_filesystem();
		self::create_waf_directory();
		self::generate_ip_rules();
		self::create_blocklog_table();
		self::generate_rules();
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
		delete_option( self::VERSION_OPTION_NAME );

		global $wp_filesystem;

		self::initialize_filesystem();

		if ( ! $wp_filesystem->put_contents( self::RULES_FILE, "<?php\n" ) ) {
			throw new \Exception( 'Failed to empty rules.php file.' );
		}
	}

	/**
	 * Tries periodically to update the rules using our API.
	 *
	 * @return void
	 */
	public static function update_rules_cron() {
		self::define_mode();
		if ( ! self::is_allowed_mode( JETPACK_WAF_MODE ) ) {
			return;
		}

		self::generate_rules();
		update_option( self::RULE_LAST_UPDATED_OPTION_NAME, time() );
	}

	/**
	 * Updates the rule set if rules version has changed
	 *
	 * @return void
	 */
	public static function update_rules_if_changed() {
		self::define_mode();
		if ( ! self::is_allowed_mode( JETPACK_WAF_MODE ) ) {
			return;
		}
		$version = get_option( self::VERSION_OPTION_NAME );
		if ( self::WAF_RULES_VERSION !== $version ) {
			update_option( self::VERSION_OPTION_NAME, self::WAF_RULES_VERSION );
			self::generate_rules();
		}
	}

	/**
	 * Retrieve rules from the API
	 *
	 * @throws \Exception If site is not registered.
	 * @throws \Exception If API did not respond 200.
	 * @throws \Exception If data is missing from response.
	 * @return array
	 */
	public static function get_rules_from_api() {
		$blog_id = Jetpack_Options::get_option( 'id' );
		if ( ! $blog_id ) {
			throw new \Exception( 'Site is not registered' );
		}

		$response = Client::wpcom_json_api_request_as_blog(
			sprintf( '/sites/%s/waf-rules', $blog_id ),
			'2',
			array(),
			null,
			'wpcom'
		);

		if ( 200 !== wp_remote_retrieve_response_code( $response ) ) {
			throw new \Exception( 'API connection failed.' );
		}

		$rules_json = wp_remote_retrieve_body( $response );
		$rules      = json_decode( $rules_json, true );

		if ( empty( $rules['data'] ) ) {
			throw new \Exception( 'Data missing from response.' );
		}

		return $rules['data'];
	}

	/**
	 * Generates the rules.php script
	 *
	 * @throws \Exception If file writing fails.
	 * @return void
	 */
	public static function generate_rules() {
		/**
		 * WordPress filesystem abstraction.
		 *
		 * @var \WP_Filesystem_Base $wp_filesystem
		 */
		global $wp_filesystem;

		self::initialize_filesystem();

		$api_exception = null;
		try {
			$rules = self::get_rules_from_api();
		} catch ( \Exception $e ) {
			if ( $wp_filesystem->exists( self::RULES_FILE ) ) {
				throw $e;
			}

			$rules         = "<?php\n";
			$api_exception = $e;
		}

		// Ensure that the folder exists.
		if ( ! $wp_filesystem->is_dir( dirname( self::RULES_FILE ) ) ) {
			$wp_filesystem->mkdir( dirname( self::RULES_FILE ) );
		}

		$ip_allow_rules = self::ALLOW_IP_FILE;
		$ip_block_rules = self::BLOCK_IP_FILE;

		$ip_list_code = "if ( require('$ip_allow_rules') ) { return; }\n" .
			"if ( require('$ip_block_rules') ) { return \$waf->block('block', -1, 'ip block list'); }\n";

		$rules_divided_by_line = explode( "\n", $rules );
		array_splice( $rules_divided_by_line, 1, 0, $ip_list_code );

		$rules = implode( "\n", $rules_divided_by_line );

		if ( ! $wp_filesystem->put_contents( self::RULES_FILE, $rules ) ) {
			throw new \Exception( 'Failed writing rules file to: ' . self::RULES_FILE );
		}

		if ( null !== $api_exception ) {
			throw $api_exception;
		}
	}

	/**
	 * We allow for both, one IP per line or comma-; semicolon; or whitespace-separated lists. This also validates the IP addresses
	 * and only returns the ones that look valid.
	 *
	 * @param string $ips List of ips - example: "8.8.8.8\n4.4.4.4,2.2.2.2;1.1.1.1 9.9.9.9,5555.5555.5555.5555".
	 * @return array List of valid IP addresses. - example based on input example: array('8.8.8.8', '4.4.4.4', '2.2.2.2', '1.1.1.1', '9.9.9.9')
	 */
	private static function ip_option_to_array( $ips ) {
		$ips = (string) $ips;
		$ips = preg_split( '/[\s,;]/', $ips );

		$result = array();

		foreach ( $ips as $ip ) {
			if ( filter_var( $ip, FILTER_VALIDATE_IP ) !== false ) {
				$result[] = $ip;
			}
		}

		return $result;
	}

	/**
	 * Generates the rules.php script
	 *
	 * @throws \Exception If filesystem is not available.
	 * @throws \Exception If file writing fails.
	 * @return void
	 */
	public static function generate_ip_rules() {
		/**
		 * WordPress filesystem abstraction.
		 *
		 * @var \WP_Filesystem_Base $wp_filesystem
		 */
		global $wp_filesystem;

		self::initialize_filesystem();

		// Ensure that the folder exists.
		if ( ! $wp_filesystem->is_dir( dirname( self::RULES_FILE ) ) ) {
			$wp_filesystem->mkdir( dirname( self::RULES_FILE ) );
		}

		$allow_list = self::ip_option_to_array( get_option( self::IP_ALLOW_LIST_OPTION_NAME ) );
		$block_list = self::ip_option_to_array( get_option( self::IP_BLOCK_LIST_OPTION_NAME ) );

		$lists_enabled = (bool) get_option( self::IP_LISTS_ENABLED_OPTION_NAME );
		if ( false === $lists_enabled ) {
			// Making the lists empty effectively disabled the feature while still keeping the other WAF rules evaluation active.
			$allow_list = array();
			$block_list = array();
		}

		$allow_rules_content = '';
		// phpcs:disable WordPress.PHP.DevelopmentFunctions
		$allow_rules_content .= '$waf_allow_list = ' . var_export( $allow_list, true ) . ";\n";
		// phpcs:enable
		$allow_rules_content .= 'return $waf->is_ip_in_array( $waf_allow_list );' . "\n";

		if ( ! $wp_filesystem->put_contents( self::ALLOW_IP_FILE, "<?php\n$allow_rules_content" ) ) {
			throw new \Exception( 'Failed writing allow list file to: ' . self::ALLOW_IP_FILE );
		}

		$block_rules_content = '';
		// phpcs:disable WordPress.PHP.DevelopmentFunctions
		$block_rules_content .= '$waf_block_list = ' . var_export( $block_list, true ) . ";\n";
		// phpcs:enable
		$block_rules_content .= 'return $waf->is_ip_in_array( $waf_block_list );' . "\n";

		if ( ! $wp_filesystem->put_contents( self::BLOCK_IP_FILE, "<?php\n$block_rules_content" ) ) {
			throw new \Exception( 'Failed writing block list file to: ' . self::BLOCK_IP_FILE );
		}
	}
}
