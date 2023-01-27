<?php
/**
 * Class for generating and working with firewall rule files.
 *
 * @since 0.9.0
 *
 * @package automattic/jetpack-waf
 */

namespace Automattic\Jetpack\Waf;

use Automattic\Jetpack\Connection\Client;
use Jetpack_Options;

/**
 * Class for generating and working with firewall rule files.
 */
class Waf_Rules_Manager {

	const RULES_VERSION = '1.0.0';

	// WAF Options
	const VERSION_OPTION_NAME                      = 'jetpack_waf_rules_version';
	const AUTOMATIC_RULES_ENABLED_OPTION_NAME      = 'jetpack_waf_automatic_rules';
	const IP_LISTS_ENABLED_OPTION_NAME             = 'jetpack_waf_ip_list';
	const IP_ALLOW_LIST_OPTION_NAME                = 'jetpack_waf_ip_allow_list';
	const IP_BLOCK_LIST_OPTION_NAME                = 'jetpack_waf_ip_block_list';
	const RULE_LAST_UPDATED_OPTION_NAME            = 'jetpack_waf_last_updated_timestamp';
	const AUTOMATIC_RULES_LAST_UPDATED_OPTION_NAME = 'jetpack_waf_automatic_rules_last_updated_timestamp';

	// Rule Files
	const RULES_ENTRYPOINT_FILE = '/rules/rules.php';
	const AUTOMATIC_RULES_FILE  = '/rules/automatic-rules.php';
	const IP_ALLOW_RULES_FILE   = '/rules/allow-ip.php';
	const IP_BLOCK_RULES_FILE   = '/rules/block-ip.php';

	/**
	 * Register WordPress hooks for the WAF rules.
	 *
	 * @return void
	 */
	public static function add_hooks() {
		// Re-activate the WAF any time an option is added or updated.
		add_action( 'add_option_' . self::AUTOMATIC_RULES_ENABLED_OPTION_NAME, array( Waf_Runner::class, 'activate' ), 10, 0 );
		add_action( 'update_option_' . self::AUTOMATIC_RULES_ENABLED_OPTION_NAME, array( Waf_Runner::class, 'activate' ), 10, 0 );
		add_action( 'add_option_' . self::IP_LISTS_ENABLED_OPTION_NAME, array( Waf_Runner::class, 'activate' ), 10, 0 );
		add_action( 'update_option_' . self::IP_LISTS_ENABLED_OPTION_NAME, array( Waf_Runner::class, 'activate' ), 10, 0 );
		add_action( 'add_option_' . self::IP_ALLOW_LIST_OPTION_NAME, array( Waf_Runner::class, 'activate' ), 10, 0 );
		add_action( 'update_option_' . self::IP_ALLOW_LIST_OPTION_NAME, array( Waf_Runner::class, 'activate' ), 10, 0 );
		add_action( 'add_option_' . self::IP_BLOCK_LIST_OPTION_NAME, array( Waf_Runner::class, 'activate' ), 10, 0 );
		add_action( 'update_option_' . self::IP_BLOCK_LIST_OPTION_NAME, array( Waf_Runner::class, 'activate' ), 10, 0 );
		// Register the cron job.
		add_action( 'jetpack_waf_rules_update_cron', array( static::class, 'update_rules_cron' ) );
	}

	/**
	 * Schedule the cron job to update the WAF rules.
	 *
	 * @return void
	 */
	public static function schedule_rules_cron() {
		if ( ! wp_next_scheduled( 'jetpack_waf_rules_update_cron' ) ) {
			wp_schedule_event( time(), 'twicedaily', 'jetpack_waf_rules_update_cron' );
		}
	}

	/**
	 * Tries periodically to update the rules using our API.
	 *
	 * @return void
	 */
	public static function update_rules_cron() {
		Waf_Constants::define_mode();
		if ( ! Waf_Runner::is_allowed_mode( JETPACK_WAF_MODE ) ) {
			return;
		}

		self::generate_automatic_rules();
		self::generate_ip_rules();
		self::generate_rules();
		update_option( self::RULE_LAST_UPDATED_OPTION_NAME, time() );
	}

	/**
	 * Updates the rule set if rules version has changed
	 *
	 * @return void
	 */
	public static function update_rules_if_changed() {
		Waf_Constants::define_mode();
		if ( ! Waf_Runner::is_allowed_mode( JETPACK_WAF_MODE ) ) {
			return;
		}
		$version = get_option( self::VERSION_OPTION_NAME );
		if ( self::RULES_VERSION !== $version ) {
			update_option( self::VERSION_OPTION_NAME, self::RULES_VERSION );
			self::generate_automatic_rules();
			self::generate_ip_rules();
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

		$response_code = wp_remote_retrieve_response_code( $response );

		if ( 200 !== $response_code ) {
			throw new \Exception( 'API connection failed.', $response_code );
		}

		$rules_json = wp_remote_retrieve_body( $response );
		$rules      = json_decode( $rules_json, true );

		if ( empty( $rules['data'] ) ) {
			throw new \Exception( 'Data missing from response.' );
		}

		return $rules['data'];
	}

	/**
	 * Wraps a require statement in a file_exists check.
	 *
	 * @param string $required_file The file to check if exists and require.
	 * @param string $return_code   The PHP code to execute if the file require returns true. Defaults to 'return;'.
	 * @return string The wrapped require statement.
	 */
	private static function wrap_require( $required_file, $return_code = 'return;' ) {
		return "if ( file_exists( '$required_file' ) ) { if ( require( '$required_file' ) ) { $return_code } }";
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

		Waf_Runner::initialize_filesystem();

		$rules                = "<?php\n";
		$entrypoint_file_path = Waf_Runner::get_waf_file_path( self::RULES_ENTRYPOINT_FILE );

		// Ensure that the folder exists
		if ( ! $wp_filesystem->is_dir( dirname( $entrypoint_file_path ) ) ) {
			$wp_filesystem->mkdir( dirname( $entrypoint_file_path ) );
		}

		// Ensure all potentially required rule files exist
		$rule_files = array( self::RULES_ENTRYPOINT_FILE, self::AUTOMATIC_RULES_FILE, self::IP_ALLOW_RULES_FILE, self::IP_BLOCK_RULES_FILE );
		foreach ( $rule_files as $rule_file ) {
			$rule_file = Waf_Runner::get_waf_file_path( $rule_file );
			if ( ! $wp_filesystem->is_file( $rule_file ) ) {
				if ( ! $wp_filesystem->put_contents( $rule_file, "<?php\n" ) ) {
					throw new \Exception( 'Failed writing rules file to: ' . $rule_file );
				}
			}
		}

		// Add manual rules
		if ( get_option( self::IP_LISTS_ENABLED_OPTION_NAME ) ) {
			$rules .= self::wrap_require( Waf_Runner::get_waf_file_path( self::IP_ALLOW_RULES_FILE ) ) . "\n";
			$rules .= self::wrap_require( Waf_Runner::get_waf_file_path( self::IP_BLOCK_RULES_FILE ), "return \$waf->block( 'block', -1, 'ip block list' );" ) . "\n";
		}

		// Add automatic rules
		if ( get_option( self::AUTOMATIC_RULES_ENABLED_OPTION_NAME ) ) {
			$rules .= self::wrap_require( Waf_Runner::get_waf_file_path( self::AUTOMATIC_RULES_FILE ) ) . "\n";
		}

		// Update the rules file
		if ( ! $wp_filesystem->put_contents( $entrypoint_file_path, $rules ) ) {
			throw new \Exception( 'Failed writing rules file to: ' . $entrypoint_file_path );
		}
	}

	/**
	 * Generates the automatic-rules.php script
	 *
	 * @throws \Exception If rules cannot be generated and saved.
	 * @return void
	 */
	public static function generate_automatic_rules() {
		/**
		 * WordPress filesystem abstraction.
		 *
		 * @var \WP_Filesystem_Base $wp_filesystem
		 */
		global $wp_filesystem;

		Waf_Runner::initialize_filesystem();

		$automatic_rules_file_path = Waf_Runner::get_waf_file_path( self::AUTOMATIC_RULES_FILE );

		// Ensure that the folder exists.
		if ( ! $wp_filesystem->is_dir( dirname( $automatic_rules_file_path ) ) ) {
			$wp_filesystem->mkdir( dirname( $automatic_rules_file_path ) );
		}

		try {
			$rules = self::get_rules_from_api();
		} catch ( \Exception $exception ) {
			// Do not throw API exceptions for users who do not have access
			if ( 401 !== $exception->getCode() ) {
				throw $exception;
			}
		}

		// If there are no rules available, don't overwrite the existing file.
		if ( empty( $rules ) ) {
			return;
		}

		if ( ! $wp_filesystem->put_contents( $automatic_rules_file_path, $rules ) ) {
			throw new \Exception( 'Failed writing automatic rules file to: ' . $automatic_rules_file_path );
		}

		update_option( self::AUTOMATIC_RULES_LAST_UPDATED_OPTION_NAME, time() );
	}

	/**
	 * We allow for both, one IP per line or comma-; semicolon; or whitespace-separated lists. This also validates the IP addresses
	 * and only returns the ones that look valid.
	 *
	 * @param string $ips List of ips - example: "8.8.8.8\n4.4.4.4,2.2.2.2;1.1.1.1 9.9.9.9,5555.5555.5555.5555".
	 * @return array List of valid IP addresses. - example based on input example: array('8.8.8.8', '4.4.4.4', '2.2.2.2', '1.1.1.1', '9.9.9.9')
	 */
	public static function ip_option_to_array( $ips ) {
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

		Waf_Runner::initialize_filesystem();

		$allow_ip_file_path = Waf_Runner::get_waf_file_path( self::IP_ALLOW_RULES_FILE );
		$block_ip_file_path = Waf_Runner::get_waf_file_path( self::IP_BLOCK_RULES_FILE );

		// Ensure that the folders exists.
		if ( ! $wp_filesystem->is_dir( dirname( $allow_ip_file_path ) ) ) {
			$wp_filesystem->mkdir( dirname( $allow_ip_file_path ) );
		}
		if ( ! $wp_filesystem->is_dir( dirname( $block_ip_file_path ) ) ) {
			$wp_filesystem->mkdir( dirname( $block_ip_file_path ) );
		}

		$allow_list = self::ip_option_to_array( get_option( self::IP_ALLOW_LIST_OPTION_NAME ) );
		$block_list = self::ip_option_to_array( get_option( self::IP_BLOCK_LIST_OPTION_NAME ) );

		$allow_rules_content = '';
		// phpcs:disable WordPress.PHP.DevelopmentFunctions
		$allow_rules_content .= '$waf_allow_list = ' . var_export( $allow_list, true ) . ";\n";
		// phpcs:enable
		$allow_rules_content .= 'return $waf->is_ip_in_array( $waf_allow_list );' . "\n";

		if ( ! $wp_filesystem->put_contents( $allow_ip_file_path, "<?php\n$allow_rules_content" ) ) {
			throw new \Exception( 'Failed writing allow list file to: ' . $allow_ip_file_path );
		}

		$block_rules_content = '';
		// phpcs:disable WordPress.PHP.DevelopmentFunctions
		$block_rules_content .= '$waf_block_list = ' . var_export( $block_list, true ) . ";\n";
		// phpcs:enable
		$block_rules_content .= 'return $waf->is_ip_in_array( $waf_block_list );' . "\n";

		if ( ! $wp_filesystem->put_contents( $block_ip_file_path, "<?php\n$block_rules_content" ) ) {
			throw new \Exception( 'Failed writing block list file to: ' . $block_ip_file_path );
		}
	}
}
