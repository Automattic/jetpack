<?php
/**
 * Module Name: Protect
 * Module Description: Adds brute force protection to your login page. Formerly BruteProtect.
 * Sort Order: 1
 * First Introduced: 3.4
 * Requires Connection: Yes
 * Auto Activate: Yes
 */

/*
	TODO Add in more reliable math captcha fallback
	TODO Clean up Doc Blocks
	TODO Add in successful login processing on the server side
*/

include_once JETPACK__PLUGIN_DIR . 'modules/protect/shared-functions.php';

class Jetpack_Protect_Module {

	private static $__instance = null;
	public  $api_key;
	public  $api_key_error;
	public  $whitelist;
	public  $whitelist_error;
	public  $whitelist_saved;
	private $user_ip;
	private $local_host;
	private $api_endpoint;
	public  $last_request;
	public  $last_response_raw;
	public  $last_response;

	/**
	 * Singleton implementation
	 *
	 * @return object
	 */
	public static function instance() {
		if ( ! is_a( self::$__instance, 'Jetpack_Protect_Module' ) )
			self::$__instance = new Jetpack_Protect_Module();

		return self::$__instance;
	}

	/**
	 * Registers actions
	 */
	private function __construct() {
		add_action( 'jetpack_activate_module_protect', array( $this, 'on_activation' ) );
		add_action( 'jetpack_modules_loaded', array( $this, 'modules_loaded' ) );
		add_action( 'admin_init', array( $this, 'register_assets' ) );
		add_action( 'login_head', array( $this, 'check_use_math' ) );
		add_filter( 'authenticate', array( $this, 'check_preauth' ), 10, 3 );
		add_action( 'wp_login', array( $this, 'log_successful_login' ), 10, 2 );
		add_action( 'wp_login_failed', array( $this, 'log_failed_attempt' ) );
		
        add_action( 'wp_dashboard_setup', array( $this, 'protect_dashboard_widget_load' ) );
		
		// This is a backup in case $pagenow fails for some reason
		add_action( 'login_head', array( $this, 'check_login_ability' ) );
		
		// Runs a script every day to clean up expired transients so they don't
		// clog up our users' databases
		require_once( JETPACK__PLUGIN_DIR . '/modules/protect/transient-cleanup.php' );
	}

	/**
	 * On module activation, try to get an api key
	 */
	public function on_activation() {
		$this->get_protect_key();
	}

	/**
	 * Request an api key from wordpress.com
	 *
	 * @return bool | string
	 */
	public function get_protect_key() {

		$protect_blog_id = Jetpack_Protect_Module::get_main_blog_jetpack_id();

		// If we can't find the the blog id, that means we are on multisite, and the main site never connected
		// the protect api key is linked to the main blog id - instruct the user to connect their main blog
		if ( ! $protect_blog_id ) {
			$this->api_key_error = __( 'Your main blog is not connected to WordPress.com. Please connect to get an API key.', 'jetpack' );
			return false;
		}

		$request = array(
			'jetpack_blog_id'      => $protect_blog_id,
			'bruteprotect_api_key' => get_site_option( 'bruteprotect_api_key' ),
			'multisite'            => '0',
		);

		// Send the number of blogs on the network if we are on multisite
		if ( is_multisite() ) {
			$request['multisite'] = get_blog_count();
			if( ! $request['multisite'] ) {
				global $wpdb;
				$request['multisite'] = $wpdb->get_var( "SELECT COUNT(blog_id) as c FROM $wpdb->blogs WHERE spam = '0' AND deleted = '0' and archived = '0'" );
			}
		}

		// Request the key
		Jetpack::load_xml_rpc_client();
		$xml = new Jetpack_IXR_Client( array(
			'user_id' => get_current_user_id()
		) );
		$xml->query( 'jetpack.protect.requestKey', $request );

		// Hmm, can't talk to wordpress.com
		if ( $xml->isError() ) {
			$code = $xml->getErrorCode();
			$message = $xml->getErrorMessage();
			$this->api_key_error = __( 'Error connecting to WordPress.com. Code: ' . $code . ', '. $message, 'jetpack');
			return false;
		}

		$response = $xml->getResponse();

		// Hmm. Can't talk to the protect servers ( api.bruteprotect.com )
		if ( ! isset( $response['data'] ) ) {
			$this->api_key_error = __( 'No reply from Protect servers', 'jetpack' );
			return false;
		}

		// There was an issue generating the key
		if ( empty( $response['success'] ) ) {
			$this->api_key_error = $response['data'];
			return false;
		}

		// Key generation successful!
		$active_plugins = Jetpack::get_active_plugins();

		// We only want to deactivate BruteProtect if we successfully get a key
		if ( in_array( 'bruteprotect/bruteprotect.php', $active_plugins ) ) {
			Jetpack_Client_Server::deactivate_plugin( 'bruteprotect/bruteprotect.php', 'BruteProtect' );
		}

		$key = $response['data'];
		update_site_option( 'jetpack_protect_key', $key );
		return $key;
	}

	/**
	 * Called via WP action wp_login_failed to log failed attempt with the api
	 *
	 * Fires custom, plugable action brute_log_failed_attempt with the IP
	 *
	 * @return void
	 */
	function log_failed_attempt() {
		do_action( 'jpp_log_failed_attempt', $this->brute_get_ip() );
		$this->protect_call( 'failed_attempt' );
	}

	/**
	 * Set up the Protect configuration page
	 */
	public function modules_loaded() {
		Jetpack::enable_module_configurable( __FILE__ );
		Jetpack::module_configuration_load( __FILE__, array( $this, 'configuration_load' ) );
		Jetpack::module_configuration_head( __FILE__, array( $this, 'configuration_head' ) );
		Jetpack::module_configuration_screen( __FILE__, array( $this, 'configuration_screen' ) );
	}

	public function register_assets() {
		wp_enqueue_style( 'protect-dashboard-widget', plugins_url( 'protect/protect-dashboard-widget.css', __FILE__ ) );
		wp_style_add_data( 'protect-dashboard-widget', 'jetpack-inline', true );
	}
	
	/**
	 * Logs a successful login back to our servers, this allows us to make sure we're not blocking
	 * a busy IP that has a lot of good logins along with some forgotten passwords
	 */
	public function log_successful_login( $user_login, $user ) {
		$this->protect_call( 'successful_login', array( 'roles' => $user->roles ) );
	}
	

	/**
	 * Checks for loginability BEFORE authentication so that bots don't get to go around the log in form.
	 *
	 * If we are using our math fallback, authenticate via math-fallback.php
	 *
	 * @param string $user
	 * @param string $username
	 * @param string $password
	 *
	 * @return string $user
	 */
	function check_preauth( $user = 'Not Used By Protect', $username = 'Not Used By Protect', $password = 'Not Used By Protect' ) {

		$this->check_login_ability( true );
		$use_math = $this->get_transient( 'brute_use_math' );

		if ( 1 == $use_math && isset( $_POST['log'] ) ) {
			Jetpack_Protect_Math_Authenticate::math_authenticate();
		}

		return $user;
	}

	/**
	 * Get the IP address of the current user
	 */
	function get_ip() {
		if ( isset( $this->user_ip ) ) {
			return $this->user_ip;
		}

		$server_headers = array(
			'HTTP_CLIENT_IP',
			'HTTP_CF_CONNECTING_IP',
			'HTTP_X_FORWARDED_FOR',
			'HTTP_X_FORWARDED',
			'HTTP_X_CLUSTER_CLIENT_IP',
			'HTTP_FORWARDED_FOR',
			'HTTP_FORWARDED',
			'REMOTE_ADDR'
		);

		foreach( $server_headers as $key ) {

			if ( ! array_key_exists( $key, $_SERVER ) ) {
				continue;
			}

			foreach( explode( ',', $_SERVER[ $key ] ) as $ip ) {
				$ip = trim( $ip ); // just to be safe

				// Check for IPv4 IP cast as IPv6
				if ( preg_match('/^::ffff:(\d+\.\d+\.\d+\.\d+)$/', $ip, $matches ) ) {
					$ip = $matches[1];
				}

				// If the IP is in a private or reserved range, return REMOTE_ADDR to help prevent spoofing
				if ( $ip == '127.0.0.1' || $ip == '::1' || $this->ip_is_private( $ip ) ) {
					$this->user_ip = $_SERVER[ 'REMOTE_ADDR' ];
					return $_SERVER[ 'REMOTE_ADDR' ];
				}

				$this->user_ip = $ip;
				return $this->user_ip;
			}
		}

	}

	/**
	 * Get all IP headers so that we can process on our server...
	 *
	 * @return string
	 */
	function get_headers() {
		$ip_related_headers = array(
			'GD_PHP_HANDLER',
			'HTTP_AKAMAI_ORIGIN_HOP',
			'HTTP_CF_CONNECTING_IP',
			'HTTP_CLIENT_IP',
			'HTTP_FASTLY_CLIENT_IP',
			'HTTP_FORWARDED',
			'HTTP_FORWARDED_FOR',
			'HTTP_INCAP_CLIENT_IP',
			'HTTP_TRUE_CLIENT_IP',
			'HTTP_X_CLIENTIP',
			'HTTP_X_CLUSTER_CLIENT_IP',
			'HTTP_X_FORWARDED',
			'HTTP_X_FORWARDED_FOR',
			'HTTP_X_IP_TRAIL',
			'HTTP_X_REAL_IP',
			'HTTP_X_VARNISH',
			'REMOTE_ADDR'

		);

		foreach( $ip_related_headers as $header) {
			if ( isset( $_SERVER[ $header ] ) ) {
				$o[ $header ] = $_SERVER[ $header ];
			}
		}

		return $o;
	}

	/**
	 * Checks an IP to see if it is within a private range
	 *
	 * @param int $ip
	 *
	 * @return bool
	 */
	function ip_is_private( $ip ) {

		// we are dealing with ipv6, so we can simply rely on filter_var
		if ( false === strpos( $ip, '.' ) ) {
			return !filter_var( $ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE );
		}

		// we are dealing with ipv4
		$private_ip4_addresses = array(
			'10.0.0.0|10.255.255.255',     // single class A network
			'172.16.0.0|172.31.255.255',   // 16 contiguous class B network
			'192.168.0.0|192.168.255.255', // 256 contiguous class C network
			'169.254.0.0|169.254.255.255', // Link-local address also referred to as Automatic Private IP Addressing
			'127.0.0.0|127.255.255.255'    // localhost
		);
		$long_ip = ip2long( $ip );
		if ( -1 != $long_ip ) {
			foreach ( $private_ip4_addresses as $pri_addr ) {
				list ( $start, $end ) = explode( '|', $pri_addr );
				if ( $long_ip >= ip2long( $start ) && $long_ip <= ip2long( $end ) ) {
					return true;
				}
			}
		}
		return false;
	}

	/*
	 * Checks if the IP address has been whitelisted
	 *
	 * @param int $ip
	 *
	 * @return bool
	 */
	function ip_is_whitelisted( $ip ) {
		// If we found an exact match in wp-config
		if ( defined( 'JETPACK_IP_ADDRESS_OK' ) && 'JETPACK_IP_ADDRESS_OK' == $ip ) {
			return true;
		}

		$whitelist  = get_site_option( 'jetpack_protect_whitelist', array() );
		$ip_long    = inet_pton( $ip );

		if ( ! empty( $whitelist ) ) :
			foreach ( $whitelist as $item ) :
				// If the IPs are an exact match
				if ( ! $item->range && isset( $item->ip_address ) && $item->ip_address == $ip ) {
					return true;
				}

				if ( $item->range && isset( $item->range_low ) && isset( $item->range_high ) ) {
					$ip_low     = inet_pton( $item->range_low );
					$ip_high    = inet_pton( $item->range_high );
					// If the IP is within range
					if ( strcmp( $ip_long, $ip_low ) >= 0 && strcmp( $ip_long, $ip_high ) <= 0 ) {
						return true;
					}
				}
			endforeach;
		endif;

		return false;
	}

	/**
	 * Checks the status for a given IP. API results are cached as transients
	 *
	 * @param bool $preauth Whether or not we are checking prior to authorization
	 *
	 * @return bool Either returns true, fires $this->kill_login, or includes a math fallback
	 */
	function check_login_ability( $preauth = false ) {

		$headers            = $this->get_headers();
		$header_hash        = md5( json_encode( $headers ) );
		$transient_name     = 'jpp_li_' . $header_hash;
		$transient_value    = $this->get_transient( $transient_name );
		$ip                 = $this->get_ip();

		if ( $this->ip_is_whitelisted( $ip ) ) {
			return true;
		}

		// Check out our transients
		if ( isset( $transient_value ) && 'ok' == $transient_value['status'] ) {
			return true;
		}

		if ( isset( $transient_value ) && 'blocked' == $transient_value['status'] ) {
			// There is a current block -- prevent login
			$this->kill_login();
		}

		// If we've reached this point, this means that the IP isn't cached.
		// Now we check with the Protect API to see if we should allow login
		$response = $this->protect_call( $action = 'check_ip' );

		if ( isset( $response['math'] ) && ! function_exists( 'brute_math_authenticate' ) ) {
			include_once dirname( __FILE__ ) . '/protect/math-fallback.php';
		}

		if ( 'blocked' == $response['status'] ) {
			$this->kill_login( $response['blocked_attempts'] );
		}

		return true;
	}

	/*
	 * Kill a login attempt
	 */
	function kill_login() {
		$ip = $this->get_ip();
		do_action( 'jpp_kill_login', $ip );
		/*
			TODO Get a URL for a help page with instructions on how to whitelist
		*/
		wp_die(
			__( 'Your IP (' . $ip . ') has been flagged for potential security violations.  <a href="#">Find out more...</a>', 'jetpack' ),
			__( 'Login Blocked by Jetpack Protect', 'jetpack' ),
			array( 'response' => 403 )
		);
	}

	public function check_use_math() {
		$use_math = $this->get_transient( 'brute_use_math' );
		if ( $use_math ) {
			include_once dirname( __FILE__ ) . '/protect/math-fallback.php';
			new Jetpack_Protect_Math_Authenticate;
		}
	}

	/**
	 * Get or delete API key
	 */
	public function configuration_load() {

		if ( isset( $_POST['action'] ) && $_POST['action'] == 'jetpack_protect_save_whitelist' && wp_verify_nonce( $_POST['_wpnonce'], 'jetpack-protect' ) ) {
			$this->whitelist_saved = jetpack_protect_save_whitelist( $_POST['whitelist'], $global = false );
			$this->whitelist_error = ! $this->whitelist_saved;
		}

		// TODO: REMOVE THIS, IT'S FOR BETA TESTING ONLY
		if ( isset( $_POST['action'] ) && $_POST['action'] == 'remove_protect_key' && wp_verify_nonce( $_POST['_wpnonce'], 'jetpack-protect' ) ) {
			delete_site_option( 'jetpack_protect_key' );
		}

		// TODO: REMOVE THIS, IT'S FOR BETA TESTING ONLY
		if ( isset( $_POST['action'] ) && $_POST['action'] == 'add_whitelist_placeholder_data' && wp_verify_nonce( $_POST['_wpnonce'], 'jetpack-protect' ) ) {
			$this->add_whitelist_placeholder_data();
		}

		if ( isset( $_POST['action'] ) && 'get_protect_key' == $_POST['action'] && wp_verify_nonce( $_POST['_wpnonce'], 'jetpack-protect' ) ) {
			$result = $this->get_protect_key();
			// Only redirect on success
			// If it fails we need access to $this->api_key_error
			if ( $result ) {
				wp_safe_redirect( Jetpack::module_configuration_url( 'protect' ) );
			}
		}

		$this->api_key   = get_site_option( 'jetpack_protect_key', false );
		$this->whitelist = get_site_option( 'jetpack_protect_whitelist', array() );
		$this->user_ip   = $this->get_ip();
	}

	public function configuration_head() {
		wp_enqueue_style( 'jetpack-protect' );
	}

	/**
	 * Prints the configuration screen
	 */
	public function configuration_screen() {
		require_once dirname( __FILE__ ) . '/protect/config-ui.php';
	}

	/**
	 * If we're in a multisite network, return the blog ID of the primary blog
	 *
	 * @return int
	 */
	public function get_main_blog_id() {
		if( ! is_multisite() ) {
			return false;
		}
		
		global $current_site;
		$primary_blog_id = $current_site->blog_id;
		
		return $primary_blog_id;
	}
	
	/**
	 * Get jetpack blog id, or the jetpack blog id of the main blog in the main network
	 *
	 * @return int
	 */
	public function get_main_blog_jetpack_id() {
		if ( ! is_main_site() ) {
			switch_to_blog( $this->get_main_blog_id() );
			$id = Jetpack::get_option( 'id', false );
			restore_current_blog();
		} else {
			$id = Jetpack::get_option( 'id' );
		}
		return $id;
	}

	/*
	 * Removes an IP from whitelisting
	 */
	public function remove_ip() {
		$result = array(
			'error' => true,
		);

		if ( ! wp_verify_nonce( $_POST['nonce'], 'jetpack_protect_ajax' ) ) {
			$result['message'] = __( 'Unauthorized', 'jetpack' );
			echo json_encode( $result );
			exit;
		}

		$item = $_POST;
		global $current_user;
		$this->whitelist               = get_site_option( 'jetpack_protect_whitelist', array() );
		$current_user_local_whitelist  = wp_list_filter( $this->whitelist, array( 'user_id' => $current_user->ID, 'global'=> false) );
		$current_user_global_whitelist = wp_list_filter( $this->whitelist, array( 'user_id' => $current_user->ID, 'global'=> true) );
		$other_user_whtielist          = wp_list_filter( $this->whitelist, array( 'user_id' => $current_user->ID ), 'NOT' );


		if ( '1' == $item['range'] ) {
			$new_local_list = wp_list_filter( $current_user_local_whitelist, array( 'range_low' => $item['range_low'], 'range_high' => $item['range_high'] ), 'NOT' );
		} else {
			$new_local_list = wp_list_filter( $current_user_local_whitelist, array( 'ip_address' => $item['ip_address'] ), 'NOT' );
		}

		$new_whitelist = array_merge( $new_local_list, $current_user_global_whitelist, $other_user_whtielist );
		update_site_option( 'jetpack_protect_whitelist', $new_whitelist );
		$result['error'] = false;
		echo json_encode( $result );
		exit;
	}

	/*
	* Adds an IP to whitelisting
	*/
	public function add_ip() {
		$result = array(
			'error' => true,
		);

		if ( ! wp_verify_nonce( $_POST['nonce'], 'jetpack_protect_ajax' ) ) {
			$result['message'] = __( 'Unauthorized', 'jetpack' );
			echo json_encode( $result );
			exit;
		}

		$item = $_POST;

		// Validate the IP address
		if( ! inet_pton( $item['ipAddress'] ) ) {
			$result['message'] = __( 'An IP address you entered is invalid', 'jetpack' );
			echo json_encode( $result );
			exit;
		}
		// Validate the upper range if necessary
		if( ! empty( $item['rangeHigh'] ) && ! inet_pton( $item['rangeHigh'] ) ) {
			$result['message'] = __( 'An IP address you entered is invalid', 'jetpack' );
			echo json_encode( $result );
			exit;
		}
		// Make sure the address is not on our list ( or within any range on our list )
		if( $this->ip_is_whitelisted( $item['ipAddress']) ) {
			$result['message'] = __( 'An IP Address you entered is already on your whitelist', 'jetpack' );
			echo json_encode( $result );
			exit;
		}
		// If necessary, make sure the upper range is not on our list ( or within any range on our list )
		if( ! empty( $item['rangeHigh'] ) && $this->ip_is_whitelisted( $item['rangeHigh'] ) ) {
			$result['message'] = __( 'An IP Address you entered is already on your whitelist', 'jetpack' );
			echo json_encode( $result );
			exit;
		}

		global $current_user;
		$new_item = new stdClass();
		$new_item->user_id = $current_user->ID;
		$new_item->global = false;

		if ( empty( $item['rangeHigh'] ) ) {
			$new_item->ip_address = $item['ipAddress'];
			$new_item->range = false;
		} else {
			$new_item->range_low = $item['ipAddress'];
			$new_item->range_high = $item['rangeHigh'];
			$new_item->range = true;
		}
		$this->whitelist = get_site_option( 'jetpack_protect_whitelist', array() );
		$this->whitelist[] = $new_item;
		update_site_option( 'jetpack_protect_whitelist', $this->whitelist );
		$result['error'] = false;
		echo json_encode( $result );
		exit;
	}

	/**
	 * Calls over to the api using wp_remote_post
	 *
	 * @param string $action 'check_ip', 'check_key', or 'failed_attempt'
	 * @param array  $request Any custom data to post to the api
	 *
	 * @return array
	 */
	function protect_call( $action = 'check_ip', $request = array() )
	{
		global $wp_version, $wpdb, $current_user;

		$api_key = get_site_option( 'jetpack_protect_key' );

		$user_agent = "WordPress/{$wp_version} | Jetpack/" . constant( 'JETPACK__VERSION' );

		$request['action']            = $action;
		$request['ip']                = $this->get_ip();
		$request['host']              = $this->get_local_host();
		$request['headers']           = json_encode( $this->get_headers() );
		$request['jetpack_version']   = constant( 'JETPACK__VERSION' );
		$request['wordpress_version'] = strval( $wp_version );
		$request['api_key']           = $api_key;
		$request['multisite']         = "0";

		if ( is_multisite() ) {
			$request['multisite'] = get_blog_count();
		}

		$args = array(
			'body'        => $request,
			'user-agent'  => $user_agent,
			'httpversion' => '1.0',
			'timeout'     => 15
		);

		$response_json           = wp_remote_post( $this->get_api_host(), $args );
		$this->last_response_raw = $response_json;
		$headers                 = $this->get_headers();
		$header_hash             = md5( json_encode( $headers ) );
		$transient_name          = 'jpp_li_' . $header_hash;
		$this->delete_transient( $transient_name );

		if ( is_array( $response_json ) ) {
			$response = json_decode( $response_json['body'], true );
		}

		if ( isset( $response['status'] ) && ! isset( $response['error'] ) ) {
			$response['expire'] = time() + $response['seconds_remaining'];
			$this->set_transient( $transient_name, $response, $response['seconds_remaining'] );
			$this->delete_transient( 'brute_use_math' );
		} else { // Fallback to Math Captcha if no response from API host
			$this->set_transient( 'brute_use_math', 1, 600 );
			$response['status'] = 'ok';
			$response['math']   = true;
		}

		if ( isset( $response['error'] ) ) {
			update_site_option( 'jetpack_protect_error', $response['error'] );
		} else {
			delete_site_option( 'jetpack_protect_error' );
		}

		return $response;
	}
	
	
	
	/**
	 * Wrapper for WordPress set_transient function, our version sets
	 * the transient on the main site in the network if this is a multisite network
	 *
	 * We do it this way (instead of set_site_transient) because of an issue where
	 * sitewide transients are always autoloaded
	 * https://core.trac.wordpress.org/ticket/22846
	 *
	 * @param string $transient  Transient name. Expected to not be SQL-escaped. Must be
	 *                           45 characters or fewer in length.
	 * @param mixed  $value      Transient value. Must be serializable if non-scalar.
	 *                           Expected to not be SQL-escaped.
	 * @param int    $expiration Optional. Time until expiration in seconds. Default 0.
	 *
  	 * @return bool False if value was not set and true if value was set.
	 */
	function set_transient( $transient, $value, $expiration ) {
		if ( is_multisite() && ! is_main_site() ) {
			switch_to_blog( $this->get_main_blog_id() );
			$return = set_transient( $transient, $value, $expiration );
			restore_current_blog();
			return $return;
		}
		return set_transient( $transient, $value, $expiration );
	}
	
	/**
	 * Wrapper for WordPress delete_transient function, our version deletes
	 * the transient on the main site in the network if this is a multisite network
	 *
 	 * @param string $transient Transient name. Expected to not be SQL-escaped.
  	 * @return bool true if successful, false otherwise
	 */
	function delete_transient( $transient ) {
		if ( is_multisite() && ! is_main_site() ) {
			switch_to_blog( $this->get_main_blog_id() );
			$return = delete_transient( $transient );
			restore_current_blog();
			return $return;
		}
		return delete_transient( $transient );
	}
	
	/**
	 * Wrapper for WordPress get_transient function, our version gets
	 * the transient on the main site in the network if this is a multisite network
	 *
	 * @param string $transient Transient name. Expected to not be SQL-escaped.
 	 * @return mixed Value of transient.
	 */
	function get_transient( $transient ) {
		if ( is_multisite() && ! is_main_site() ) {
			switch_to_blog( $this->get_main_blog_id() );
			$return = get_transient( $transient );
			restore_current_blog();
			return $return;
		}
		return get_transient( $transient );
	}

	/*
	 * Time to add the dashboard widget!
	 */
	function protect_dashboard_widget_load() {
        global $wp_meta_boxes;
        wp_add_dashboard_widget( 'protect_dashboard_widget', 'Jetpack Protect', array(
            $this,
            'protect_dashboard_widget'
        ) );
	}
	
	function protect_dashboard_widget() {
		include_once dirname( __FILE__ ) . '/protect/dashboard-widget.php';
	}
	

	function get_api_host() {
		if ( isset( $this->api_endpoint ) ) {
			return $this->api_endpoint;
		}

		//Check to see if we can use SSL
		$this->api_endpoint = Jetpack::fix_url_for_bad_hosts( JETPACK_PROTECT__API_HOST );

		return $this->api_endpoint;
	}

	function get_local_host() {
		if ( isset( $this->local_host ) ) {
			return $this->local_host;
		}

		$uri = 'http://' . strtolower( $_SERVER['HTTP_HOST'] );

		if ( is_multisite() ) {
			$uri = network_home_url();
		}

		$uridata = parse_url( $uri );

		$domain = $uridata['host'];

		// If we still don't have the site_url, get it
		if ( ! $domain ) {
			$uri = get_site_url( 1 );
			$uridata = parse_url( $uri );
			$domain = $uridata['host'];
		}

		$this->local_host = $domain;

		return $this->local_host;
	}

	// TODO: REMOVE THIS, BETA TESTING ONLY
	public function add_whitelist_placeholder_data() {
		$ip1_1 = new stdClass();
		$ip1_1->user_id = 1;
		$ip1_1->global = false;
		$ip1_1->range = false;
		$ip1_1->ip_address = '22.22.22.22';
		$ip1_2 = new stdClass();
		$ip1_2->user_id = 1;
		$ip1_2->global = false;
		$ip1_2->range = false;
		$ip1_2->ip_address = 'FE80:0000:0000:0000:0202:B3FF:FE1E:8329';
		$ip1_3 = new stdClass();
		$ip1_3->user_id = 1;
		$ip1_3->global = true;
		$ip1_3->range = false;
		$ip1_3->ip_address = 'FE80::0202:B3FF:FE1E:8329';
		$ip1_4 = new stdClass();
		$ip1_4->user_id = 1;
		$ip1_4->global = false;
		$ip1_4->range = true;
		$ip1_4->range_low = '44.44.10.44';
		$ip1_4->range_high = '44.44.100.44';
		$ip1_5 = new stdClass();
		$ip1_5->user_id = 1;
		$ip1_5->global = false;
		$ip1_5->range = true;
		$ip1_5->range_low = '2001:db8::';
		$ip1_5->range_high = '2001:db8:0000:0000:0000:0000:0000:0003';
		$ip1_6 = new stdClass();
		$ip1_6->user_id = 1;
		$ip1_6->global = true;
		$ip1_6->range = true;
		$ip1_6->range_low = '200.145.20.12';
		$ip1_6->range_high = '200.145.50.12';
		$ip2_1 = new stdClass();
		$ip2_1->user_id = 2;
		$ip2_1->global = true;
		$ip2_1->range = true;
		$ip2_1->range_low = '62.33.1.14';
		$ip2_1->range_high = '62.33.50.14';
		$ip2_2 = new stdClass();
		$ip2_2->user_id = 2;
		$ip2_2->global = true;
		$ip2_2->range = true;
		$ip2_2->range_low = '2001:db8::';
		$ip2_2->range_high = '2001:db8:0000:0000:0000:0000:0000:0007';
		$ip3_1 = new stdClass();
		$ip3_1->user_id = 3;
		$ip3_1->global = false;
		$ip3_1->range = false;
		$ip3_1->ip_address = '202.1.19.4';
		$ip3_2 = new stdClass();
		$ip3_2->user_id = 3;
		$ip3_2->global = false;
		$ip3_2->range = false;
		$ip3_2->ip_address = '2001:db8:0000:0000:0000:0000:0000:3fff';
		$whitelist = array( $ip1_1, $ip1_2, $ip1_3, $ip1_4, $ip1_5, $ip1_6, $ip2_1, $ip2_2, $ip3_1, $ip3_2 );
		update_site_option( 'jetpack_protect_whitelist', $whitelist );
	}

}

Jetpack_Protect_Module::instance();

if ( isset( $pagenow ) && 'wp-login.php' == $pagenow ) {
    Jetpack_Protect_Module::check_login_ability();
}