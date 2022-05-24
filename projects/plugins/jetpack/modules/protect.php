<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Module Name: Brute force protection
 * Module Description: Enabling brute force protection will prevent bots and hackers from attempting to log in to your website with common username and password combinations.
 * Sort Order: 1
 * Recommendation Order: 4
 * First Introduced: 3.4
 * Requires Connection: Yes
 * Requires User Connection: Yes
 * Auto Activate: Yes
 * Module Tags: Recommended
 * Feature: Security
 * Additional Search Queries: security, jetpack protect, secure, protection, botnet, brute force, protect, login, bot, password, passwords, strong passwords, strong password, wp-login.php,  protect admin
 */

use Automattic\Jetpack\Constants;

require_once JETPACK__PLUGIN_DIR . 'modules/protect/shared-functions.php';

/**
 * Jetpack project module class.
 */
class Jetpack_Protect_Module {

	/**
	 * Instance of the class.
	 *
	 * @var Jetpack_Protect_Module()
	 */
	private static $instance = null;

	/**
	 * API Key.
	 *
	 * @var string
	 */
	public $api_key;

	/**
	 * API Key error.
	 *
	 * @var string
	 */
	public $api_key_error;

	/**
	 * Whitelisted ips
	 *
	 * @var array
	 */
	public $whitelist;

	/**
	 * Whitelist error.
	 *
	 * @var string
	 */
	public $whitelist_error;

	/**
	 * Whitelist saved
	 *
	 * @todo find out if this is even used.
	 *
	 * @var array
	 */
	public $whitelist_saved;

	/**
	 * The URI.
	 *
	 * @var string
	 */
	private $local_host;

	/**
	 * Last request.
	 *
	 * @todo find out if this is even used.
	 *
	 * @var string
	 */
	public $last_request;

	/**
	 * Response fetched from wp_remote_post()
	 *
	 * @var array
	 */
	public $last_response_raw;

	/**
	 * Last response.
	 *
	 * @todo find out if this is used.
	 * @var array
	 */
	public $last_response;

	/**
	 * Block login with math, default is 1.
	 *
	 * @var int
	 */
	private $block_login_with_math;

	/**
	 * Singleton implementation
	 *
	 * @return object
	 */
	public static function instance() {
		if ( ! is_a( self::$instance, 'Jetpack_Protect_Module' ) ) {
			self::$instance = new Jetpack_Protect_Module();
		}

		return self::$instance;
	}

	/**
	 * Registers actions
	 */
	private function __construct() {
		add_action( 'jetpack_activate_module_protect', array( $this, 'on_activation' ) );
		add_action( 'jetpack_deactivate_module_protect', array( $this, 'on_deactivation' ) );
		add_action( 'jetpack_modules_loaded', array( $this, 'modules_loaded' ) );
		add_action( 'login_form', array( $this, 'check_use_math' ), 0 );
		add_filter( 'authenticate', array( $this, 'check_preauth' ), 10, 3 );
		add_action( 'wp_login', array( $this, 'log_successful_login' ), 10, 2 );
		add_action( 'wp_login_failed', array( $this, 'log_failed_attempt' ) );
		add_action( 'admin_init', array( $this, 'maybe_update_headers' ) );
		add_action( 'admin_init', array( $this, 'maybe_display_security_warning' ) );

		// This is a backup in case $pagenow fails for some reason.
		add_action( 'login_form', array( $this, 'check_login_ability' ), 1 );

		// Load math fallback after math page form submission.
		if ( isset( $_POST['jetpack_protect_process_math_form'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Missing -- POST request just determines if we need to use Math for Authentication.
			include_once __DIR__ . '/protect/math-fallback.php';
			new Jetpack_Protect_Math_Authenticate();
		}

		// Runs a script every day to clean up expired transients so they don't
		// clog up our users' databases.
		require_once JETPACK__PLUGIN_DIR . '/modules/protect/transient-cleanup.php';
	}

	/**
	 * On module activation, try to get an api key
	 */
	public function on_activation() {
		if ( is_multisite() && is_main_site() && get_site_option( 'jetpack_protect_active', 0 ) == 0 ) { // phpcs:ignore Universal.Operators.StrictComparisons.LooseEqual
			update_site_option( 'jetpack_protect_active', 1 );
		}

		update_site_option( 'jetpack_protect_activating', 'activating' );

		// Get BruteProtect's counter number.
		self::protect_call( 'check_key' );
	}

	/**
	 * On module deactivation, unset protect_active
	 */
	public function on_deactivation() {
		if ( is_multisite() && is_main_site() ) {
			update_site_option( 'jetpack_protect_active', 0 );
		}
	}

	/**
	 * Get the protect key,
	 */
	public function maybe_get_protect_key() {
		if ( get_site_option( 'jetpack_protect_activating', false ) && ! get_site_option( 'jetpack_protect_key', false ) ) {
			$key = $this->get_protect_key();
			delete_site_option( 'jetpack_protect_activating' );
			return $key;
		}

		return get_site_option( 'jetpack_protect_key' );
	}

	/**
	 * Sends a "check_key" API call once a day.  This call allows us to track IP-related
	 * headers for this server via the Protect API, in order to better identify the source
	 * IP for login attempts
	 *
	 * @param bool $force - if we're forcing the request.
	 */
	public function maybe_update_headers( $force = false ) {
		$updated_recently = $this->get_transient( 'jpp_headers_updated_recently' );

		if ( ! $force ) {
			if ( isset( $_GET['protect_update_headers'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- this doesn't change anything, just forces the once-a-day check to run via force if set.
				$force = true;
			}
		}

		// check that current user is admin so we prevent a lower level user from adding
		// a trusted header, allowing them to brute force an admin account.
		if ( ( $updated_recently && ! $force ) || ! current_user_can( 'update_plugins' ) ) {
			return;
		}

		$response = self::protect_call( 'check_key' );
		$this->set_transient( 'jpp_headers_updated_recently', 1, DAY_IN_SECONDS );

		if ( isset( $response['msg'] ) && $response['msg'] ) {
			update_site_option( 'trusted_ip_header', json_decode( $response['msg'] ) );
		}

	}

	/**
	 * Handle discplaying a security warning.
	 */
	public function maybe_display_security_warning() {
		if ( is_multisite() && current_user_can( 'manage_network' ) ) {
			if ( ! function_exists( 'is_plugin_active_for_network' ) ) {
				require_once ABSPATH . '/wp-admin/includes/plugin.php';
			}

			if ( ! is_plugin_active_for_network( plugin_basename( JETPACK__PLUGIN_FILE ) ) ) {
				add_action( 'load-index.php', array( $this, 'prepare_jetpack_protect_multisite_notice' ) );
				add_action( 'wp_ajax_jetpack-protect-dismiss-multisite-banner', array( $this, 'ajax_dismiss_handler' ) );
			}
		}
	}

	/**
	 * Handles preparing the multisite notice.
	 */
	public function prepare_jetpack_protect_multisite_notice() {
		$dismissed = get_site_option( 'jetpack_dismissed_protect_multisite_banner' );
		if ( $dismissed ) {
			return;
		}

		add_action( 'admin_notices', array( $this, 'admin_jetpack_manage_notice' ) );
	}

	/**
	 * Handle dismissing the multisite banner.
	 */
	public function ajax_dismiss_handler() {
		check_ajax_referer( 'jetpack_protect_multisite_banner_opt_out' );

		if ( ! current_user_can( 'manage_network' ) ) {
			wp_send_json_error( new WP_Error( 'insufficient_permissions' ) );
		}

		update_site_option( 'jetpack_dismissed_protect_multisite_banner', true );

		wp_send_json_success();
	}

	/**
	 * Displays a warning about Jetpack Protect's network activation requirement.
	 * Attaches some custom JS to Core's `is-dismissible` UI to save the dismissed state.
	 */
	public function admin_jetpack_manage_notice() {
		?>
		<div class="jetpack-protect-warning notice notice-warning is-dismissible" data-dismiss-nonce="<?php echo esc_attr( wp_create_nonce( 'jetpack_protect_multisite_banner_opt_out' ) ); ?>">
			<h2><?php esc_html_e( 'Jetpack Brute Force Attack Prevention cannot keep your site secure', 'jetpack' ); ?></h2>

			<p><?php esc_html_e( "Thanks for activating Jetpack's brute force attack prevention feature! To start protecting your whole WordPress Multisite Network, please network activate the Jetpack plugin. Due to the way logins are handled on WordPress Multisite Networks, Jetpack must be network activated in order for the brute force attack prevention feature to work properly.", 'jetpack' ); ?></p>

			<p>
				<a class="button-primary" href="<?php echo esc_url( network_admin_url( 'plugins.php' ) ); ?>">
					<?php esc_html_e( 'View Network Admin', 'jetpack' ); ?>
				</a>
				<a class="button" href="<?php echo esc_url( __( 'https://jetpack.com/support/multisite-protect', 'jetpack' ) ); ?>" target="_blank">
					<?php esc_html_e( 'Learn More', 'jetpack' ); ?>
				</a>
			</p>
		</div>
		<script>
			jQuery( function( $ ) {
				$( '.jetpack-protect-warning' ).on( 'click', 'button.notice-dismiss', function( event ) {
					event.preventDefault();

					wp.ajax.post(
						'jetpack-protect-dismiss-multisite-banner',
						{
							_wpnonce: $( event.delegateTarget ).data( 'dismiss-nonce' ),
						}
					).fail( function( error ) {
					<?php
						// A failure here is really strange, and there's not really anything a site owner can do to fix one.
						// Just log the error for now to help debugging.
					?>

						if ( 'function' === typeof error.done && '-1' === error.responseText ) {
							console.error( 'Notice dismissal failed: check_ajax_referer' );
						} else {
							console.error( 'Notice dismissal failed: ' + JSON.stringify( error ) );
						}
					} )
				} );
			} );
		</script>
		<?php
	}

	/**
	 * Request an api key from wordpress.com
	 *
	 * @return bool | string
	 */
	public function get_protect_key() {

		$protect_blog_id = self::get_main_blog_jetpack_id();

		// If we can't find the the blog id, that means we are on multisite, and the main site never connected
		// the protect api key is linked to the main blog id - instruct the user to connect their main blog.
		if ( ! $protect_blog_id ) {
			$this->api_key_error = __( 'Your main blog is not connected to WordPress.com. Please connect to get an API key.', 'jetpack' );

			return false;
		}

		$request = array(
			'jetpack_blog_id'      => $protect_blog_id,
			'bruteprotect_api_key' => get_site_option( 'bruteprotect_api_key' ),
			'multisite'            => '0',
		);

		// Send the number of blogs on the network if we are on multisite.
		if ( is_multisite() ) {
			$request['multisite'] = get_blog_count();
			if ( ! $request['multisite'] ) {
				global $wpdb;
				$request['multisite'] = $wpdb->get_var( "SELECT COUNT(blog_id) as c FROM $wpdb->blogs WHERE spam = '0' AND deleted = '0' and archived = '0'" );
			}
		}

		// Request the key.
		$xml = new Jetpack_IXR_Client();
		$xml->query( 'jetpack.protect.requestKey', $request );

		// Hmm, can't talk to wordpress.com.
		if ( $xml->isError() ) {
			$code    = $xml->getErrorCode();
			$message = $xml->getErrorMessage();
			// Translators: The xml error code, and the xml error message.
			$this->api_key_error = sprintf( __( 'Error connecting to WordPress.com. Code: %1$s, %2$s', 'jetpack' ), $code, $message );

			return false;
		}

		$response = $xml->getResponse();

		// Hmm, can't talk to the protect servers ( api.bruteprotect.com ).
		if ( ! isset( $response['data'] ) ) {
			$this->api_key_error = __( 'No reply from Jetpack servers', 'jetpack' );

			return false;
		}

		// There was an issue generating the key.
		if ( empty( $response['success'] ) ) {
			$this->api_key_error = $response['data'];

			return false;
		}

		// Key generation successful!
		$active_plugins = Jetpack::get_active_plugins();

		// We only want to deactivate BruteProtect if we successfully get a key.
		if ( in_array( 'bruteprotect/bruteprotect.php', $active_plugins, true ) ) {
			Jetpack_Client_Server::deactivate_plugin( 'bruteprotect/bruteprotect.php', 'BruteProtect' );
		}

		$key = $response['data'];
		update_site_option( 'jetpack_protect_key', $key );

		return $key;
	}

	/**
	 * Called via WP action wp_login_failed to log failed attempt with the api
	 *
	 * Fires custom, plugable action jpp_log_failed_attempt with the IP
	 *
	 * @param string $login_user - the user attempting to log in.
	 * @return void
	 */
	public function log_failed_attempt( $login_user = null ) {

		/**
		 * Fires before every failed login attempt.
		 *
		 * @module protect
		 *
		 * @since 3.4.0
		 *
		 * @param array Information about failed login attempt
		 *   [
		 *     'login' => (string) Username or email used in failed login attempt
		 *   ]
		 */
		do_action( 'jpp_log_failed_attempt', array( 'login' => $login_user ) );

		if ( isset( $_COOKIE['jpp_math_pass'] ) ) {

			$transient = $this->get_transient( 'jpp_math_pass_' . sanitize_key( $_COOKIE['jpp_math_pass'] ) );
			$transient--;

			if ( ! $transient || $transient < 1 ) {
				$this->delete_transient( 'jpp_math_pass_' . sanitize_key( $_COOKIE['jpp_math_pass'] ) );
				setcookie( 'jpp_math_pass', 0, time() - DAY_IN_SECONDS, COOKIEPATH, COOKIE_DOMAIN, false, true );
			} else {
				$this->set_transient( 'jpp_math_pass_' . sanitize_key( $_COOKIE['jpp_math_pass'] ), $transient, DAY_IN_SECONDS );
			}
		}
		$this->protect_call( 'failed_attempt' );
	}

	/**
	 * Set up the Protect configuration page
	 */
	public function modules_loaded() {
		Jetpack::enable_module_configurable( __FILE__ );
	}

	/**
	 * Logs a successful login back to our servers, this allows us to make sure we're not blocking
	 * a busy IP that has a lot of good logins along with some forgotten passwords. Also saves current user's ip
	 * to the ip address whitelist
	 *
	 * @param string $user_login - the user loggign in.
	 * @param string $user - the user.
	 */
	public function log_successful_login( $user_login, $user = null ) {
		if ( ! $user ) { // For do_action( 'wp_login' ) calls that lacked passing the 2nd arg.
			$user = get_user_by( 'login', $user_login );
		}

		$this->protect_call( 'successful_login', array( 'roles' => $user->roles ) );
	}

	/**
	 * Checks for loginability BEFORE authentication so that bots don't get to go around the log in form.
	 *
	 * If we are using our math fallback, authenticate via math-fallback.php
	 *
	 * @param string $user     - the user.
	 * @param string $username - the username.
	 * @param string $password - the password.
	 *
	 * @return string $user
	 */
	public function check_preauth( $user = 'Not Used By Protect', $username = 'Not Used By Protect', $password = 'Not Used By Protect' ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$allow_login = $this->check_login_ability( true );
		$use_math    = $this->get_transient( 'brute_use_math' );

		if ( ! $allow_login ) {
			$this->block_with_math();
		}

		if ( ( 1 == $use_math || 1 == $this->block_login_with_math ) && isset( $_POST['log'] ) ) { // phpcs:ignore Universal.Operators.StrictComparisons.LooseEqual, WordPress.Security.NonceVerification.Missing -- POST request just determines if we use math authentication.
			include_once __DIR__ . '/protect/math-fallback.php';
			Jetpack_Protect_Math_Authenticate::math_authenticate();
		}

		return $user;
	}

	/**
	 * Get all IP headers so that we can process on our server...
	 *
	 * @return array
	 */
	public function get_headers() {
		$output             = array();
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
			'REMOTE_ADDR',
		);

		foreach ( $ip_related_headers as $header ) {
			if ( ! empty( $_SERVER[ $header ] ) ) {
				$output[ $header ] = wp_unslash( $_SERVER[ $header ] ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
			}
		}

		return $output;
	}

	/**
	 * Checks if the IP address has been whitelisted
	 *
	 * @param string $ip - the IP address.
	 *
	 * @return bool
	 */
	public function ip_is_whitelisted( $ip ) {
		// If we found an exact match in wp-config.
		if ( defined( 'JETPACK_IP_ADDRESS_OK' ) && JETPACK_IP_ADDRESS_OK === $ip ) {
			return true;
		}

		$whitelist = jetpack_protect_get_local_whitelist();

		if ( is_multisite() ) {
			$whitelist = array_merge( $whitelist, get_site_option( 'jetpack_protect_global_whitelist', array() ) );
		}

		if ( ! empty( $whitelist ) ) :
			foreach ( $whitelist as $item ) :
				// If the IPs are an exact match.
				if ( ! $item->range && isset( $item->ip_address ) && $item->ip_address === $ip ) {
					return true;
				}

				if ( $item->range && isset( $item->range_low ) && isset( $item->range_high ) ) {
					if ( jetpack_protect_ip_address_is_in_range( $ip, $item->range_low, $item->range_high ) ) {
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
	 * @param bool $preauth - Whether or not we are checking prior to authorization.
	 *
	 * @return bool Either returns true, fires $this->kill_login, or includes a math fallback and returns false
	 */
	public function check_login_ability( $preauth = false ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable

		/**
		 * JETPACK_ALWAYS_PROTECT_LOGIN will always disable the login page, and use a page provided by Jetpack.
		 */
		if ( Constants::is_true( 'JETPACK_ALWAYS_PROTECT_LOGIN' ) ) {
			$this->kill_login();
		}

		if ( $this->is_current_ip_whitelisted() ) {
			return true;
		}

		$status = $this->get_cached_status();

		if ( empty( $status ) ) {
			// If we've reached this point, this means that the IP isn't cached.
			// Now we check with the Protect API to see if we should allow login.
			$response = $this->protect_call( $action = 'check_ip' ); // phpcs:ignore Squiz.PHP.DisallowMultipleAssignments.Found

			if ( isset( $response['math'] ) && ! function_exists( 'brute_math_authenticate' ) ) {
				include_once __DIR__ . '/protect/math-fallback.php';
				new Jetpack_Protect_Math_Authenticate();

				return false;
			}

			$status = $response['status'];
		}

		if ( 'blocked' === $status ) {
			$this->block_with_math();
		}

		if ( 'blocked-hard' === $status ) {
			$this->kill_login();
		}

		return true;
	}

	/**
	 * Check if IP is whitelisted.
	 */
	public function is_current_ip_whitelisted() {
		$ip = jetpack_protect_get_ip();

		// Server is misconfigured and we can't get an IP.
		if ( ! $ip && class_exists( 'Jetpack' ) ) {
			Jetpack::deactivate_module( 'protect' );
			ob_start();
			Jetpack::state( 'message', 'protect_misconfigured_ip' );
			ob_end_clean();
			return true;
		}

		/**
		 * Short-circuit check_login_ability.
		 *
		 * If there is an alternate way to validate the current IP such as
		 * a hard-coded list of IP addresses, we can short-circuit the rest
		 * of the login ability checks and return true here.
		 *
		 * @module protect
		 *
		 * @since 4.4.0
		 *
		 * @param bool false Should we allow all logins for the current ip? Default: false
		 */
		if ( apply_filters( 'jpp_allow_login', false, $ip ) ) {
			return true;
		}

		if ( jetpack_protect_ip_is_private( $ip ) ) {
			return true;
		}

		if ( $this->ip_is_whitelisted( $ip ) ) {
			return true;
		}
	}

	/**
	 * Check if someone is able to login based on IP.
	 */
	public function has_login_ability() {
		if ( $this->is_current_ip_whitelisted() ) {
			return true;
		}
		$status = $this->get_cached_status();
		if ( empty( $status ) || 'ok' === $status ) {
			return true;
		}
		return false;
	}

	/**
	 * Check the status of the cached transient.
	 */
	public function get_cached_status() {
		$transient_name = $this->get_transient_name();
		$value          = $this->get_transient( $transient_name );
		if ( isset( $value['status'] ) ) {
			return $value['status'];
		}
		return '';
	}

	/**
	 * Check if we need to block with a math question to continue logging in.
	 */
	public function block_with_math() {
		/**
		 * By default, Protect will allow a user who has been blocked for too
		 * many failed logins to start answering math questions to continue logging in
		 *
		 * For added security, you can disable this.
		 *
		 * @module protect
		 *
		 * @since 3.6.0
		 *
		 * @param bool Whether to allow math for blocked users or not.
		 */

		$this->block_login_with_math = 1;
		/**
		 * Allow Math fallback for blocked IPs.
		 *
		 * @module protect
		 *
		 * @since 3.6.0
		 *
		 * @param bool true Should we fallback to the Math questions when an IP is blocked. Default to true.
		 */
		$allow_math_fallback_on_fail = apply_filters( 'jpp_use_captcha_when_blocked', true );
		if ( ! $allow_math_fallback_on_fail ) {
			$this->kill_login();
		}
		include_once __DIR__ . '/protect/math-fallback.php';
		new Jetpack_Protect_Math_Authenticate();

		return false;
	}

	/**
	 * Kill a login attempt
	 */
	public function kill_login() {
		if (
			isset( $_GET['action'], $_GET['_wpnonce'] ) &&
			'logout' === $_GET['action'] &&
			wp_verify_nonce( $_GET['_wpnonce'], 'log-out' ) && // phpcs:ignore WordPress.Security.ValidatedSanitizedInput
			wp_get_current_user()

		) {
			// Allow users to logout.
			return;
		}

		$ip = jetpack_protect_get_ip();
		/**
		 * Fires before every killed login.
		 *
		 * @module protect
		 *
		 * @since 3.4.0
		 *
		 * @param string $ip IP flagged by Protect.
		 */
		do_action( 'jpp_kill_login', $ip );

		if ( defined( 'XMLRPC_REQUEST' ) && XMLRPC_REQUEST ) {
			// translators: variable is the IP address that was flagged.
			$die_string = sprintf( __( 'Your IP (%1$s) has been flagged for potential security violations.', 'jetpack' ), str_replace( 'http://', '', esc_url( 'http://' . $ip ) ) );
			wp_die(
				$die_string, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- esc_url used when forming string.
				esc_html__( 'Login Blocked by Jetpack', 'jetpack' ),
				array( 'response' => 403 )
			);
		}

		require_once __DIR__ . '/protect/blocked-login-page.php';
		$blocked_login_page = Jetpack_Protect_Blocked_Login_Page::instance( $ip );

		if ( $blocked_login_page->is_blocked_user_valid() ) {
			return;
		}

		$blocked_login_page->render_and_die();
	}

	/**
	 * Checks if the protect API call has failed, and if so initiates the math captcha fallback.
	 */
	public function check_use_math() {
		$use_math = $this->get_transient( 'brute_use_math' );
		if ( $use_math ) {
			include_once __DIR__ . '/protect/math-fallback.php';
			new Jetpack_Protect_Math_Authenticate();
		}
	}

	/**
	 * If we're in a multisite network, return the blog ID of the primary blog
	 *
	 * @return int
	 */
	public function get_main_blog_id() {
		if ( ! is_multisite() ) {
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

	/**
	 * Checks the API key.
	 */
	public function check_api_key() {
		$response = $this->protect_call( 'check_key' );

		if ( isset( $response['ckval'] ) ) {
			return true;
		}

		if ( isset( $response['error'] ) ) {

			if ( 'Invalid API Key' === $response['error'] ) {
				$this->api_key_error = __( 'Your API key is invalid', 'jetpack' );
			}

			if ( 'API Key Required' === $response['error'] ) {
				$this->api_key_error = __( 'No API key', 'jetpack' );
			}
		}

		$this->api_key_error = __( 'There was an error contacting Jetpack servers.', 'jetpack' );

		return false;
	}

	/**
	 * Calls over to the api using wp_remote_post
	 *
	 * @param string $action - 'check_ip', 'check_key', or 'failed_attempt'.
	 * @param array  $request - Any custom data to post to the api.
	 *
	 * @return array
	 */
	public function protect_call( $action = 'check_ip', $request = array() ) {
		global $wp_version;

		$api_key = $this->maybe_get_protect_key();

		$user_agent = "WordPress/{$wp_version} | Jetpack/" . constant( 'JETPACK__VERSION' );

		$request['action']            = $action;
		$request['ip']                = jetpack_protect_get_ip();
		$request['host']              = $this->get_local_host();
		$request['headers']           = wp_json_encode( $this->get_headers() );
		$request['jetpack_version']   = constant( 'JETPACK__VERSION' );
		$request['wordpress_version'] = (string) $wp_version;
		$request['api_key']           = $api_key;
		$request['multisite']         = '0';

		if ( is_multisite() ) {
			$request['multisite'] = get_blog_count();
		}

		/**
		 * Filter controls maximum timeout in waiting for reponse from Protect servers.
		 *
		 * @module protect
		 *
		 * @since 4.0.4
		 *
		 * @param int $timeout Max time (in seconds) to wait for a response.
		 */
		$timeout = apply_filters( 'jetpack_protect_connect_timeout', 30 );

		$args = array(
			'body'        => $request,
			'user-agent'  => $user_agent,
			'httpversion' => '1.0',
			'timeout'     => absint( $timeout ),
		);

		$response_json           = wp_remote_post( JETPACK_PROTECT__API_HOST, $args );
		$this->last_response_raw = $response_json;

		$transient_name = $this->get_transient_name();
		$this->delete_transient( $transient_name );

		if ( is_array( $response_json ) ) {
			$response = json_decode( $response_json['body'], true );
		}

		if ( isset( $response['blocked_attempts'] ) && $response['blocked_attempts'] ) {
			update_site_option( 'jetpack_protect_blocked_attempts', $response['blocked_attempts'] );
		}

		if ( isset( $response['status'] ) && ! isset( $response['error'] ) ) {
			$response['expire'] = time() + $response['seconds_remaining'];
			$this->set_transient( $transient_name, $response, $response['seconds_remaining'] );
			$this->delete_transient( 'brute_use_math' );
		} else { // Fallback to Math Captcha if no response from API host.
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
	 * Gets the transient name.
	 */
	public function get_transient_name() {
		$headers     = $this->get_headers();
		$header_hash = md5( wp_json_encode( $headers ) );

		return 'jpp_li_' . $header_hash;
	}

	/**
	 * Wrapper for WordPress set_transient function, our version sets
	 * the transient on the main site in the network if this is a multisite network
	 *
	 * We do it this way (instead of set_site_transient) because of an issue where
	 * sitewide transients are always autoloaded
	 * https://core.trac.wordpress.org/ticket/22846
	 *
	 * @param string $transient Transient name. Expected to not be SQL-escaped. Must be
	 *                           45 characters or fewer in length.
	 * @param mixed  $value Transient value. Must be serializable if non-scalar.
	 *                            Expected to not be SQL-escaped.
	 * @param int    $expiration Optional. Time until expiration in seconds. Default 0.
	 *
	 * @return bool False if value was not set and true if value was set.
	 */
	public function set_transient( $transient, $value, $expiration ) {
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
	 *
	 * @return bool true if successful, false otherwise
	 */
	public function delete_transient( $transient ) {
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
	 *
	 * @return mixed Value of transient.
	 */
	public function get_transient( $transient ) {
		if ( is_multisite() && ! is_main_site() ) {
			switch_to_blog( $this->get_main_blog_id() );
			$return = get_transient( $transient );
			restore_current_blog();

			return $return;
		}

		return get_transient( $transient );
	}

	/**
	 * Returns the local host.
	 */
	public function get_local_host() {
		if ( isset( $this->local_host ) ) {
			return $this->local_host;
		}

		$uri = 'http://' . strtolower( isset( $_SERVER['HTTP_HOST'] ) ? filter_var( wp_unslash( $_SERVER['HTTP_HOST'] ) ) : '' );

		if ( is_multisite() ) {
			$uri = network_home_url();
		}

		$uridata = wp_parse_url( $uri );

		$domain = $uridata['host'];

		// If we still don't have the site_url, get it.
		if ( ! $domain ) {
			$uri     = get_site_url( 1 );
			$uridata = wp_parse_url( $uri );
			$domain  = $uridata['host'];
		}

		$this->local_host = $domain;

		return $this->local_host;
	}

}

$jetpack_protect = Jetpack_Protect_Module::instance();

global $pagenow;
if ( isset( $pagenow ) && 'wp-login.php' === $pagenow ) {
	$jetpack_protect->check_login_ability();
}
