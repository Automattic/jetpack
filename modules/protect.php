<?php
/**
 * Module Name: Protect
 * Module Description: Adds brute force protection to your login page. Formerly BruteProtect
 * Sort Order: 1
 * First Introduced: 3.4
 * Requires Connection: Yes
 * Auto Activate: Yes
 */

class Jetpack_Protect_Module {

	private static $__instance = null;
	public $api_key;
	public $api_key_error;
	public $whitelist;
	public $whitelist_error;

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
	}

	public function register_assets() {
		wp_register_script( 'jetpack-protect', plugins_url( 'modules/protect/protect.js', JETPACK__PLUGIN_FILE ), array( 'jquery', 'underscore') );
		wp_register_style( 'jetpack-protect',  plugins_url( 'modules/protect/protect.css', JETPACK__PLUGIN_FILE ) );
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

	/**
	 * Get key or delete key
	 */
	public function configuration_load() {

		if ( isset( $_POST['action'] ) && $_POST['action'] == 'save_protect_whitelist' && wp_verify_nonce( $_POST['_wpnonce'], 'jetpack-protect' ) ) {
			$this->save_whitelist();
		}

		// TODO: REMOVE THIS, IT'S FOR BETA TESTING ONLY
		if ( isset( $_POST['action'] ) && $_POST['action'] == 'remove_protect_key' && wp_verify_nonce( $_POST['_wpnonce'], 'jetpack-protect' ) ) {
			delete_site_option( 'jetpack_protect_key' );
		}

		// TODO: REMOVE THIS, IT'S FOR BETA TESTING ONLY
		if ( isset( $_POST['action'] ) && $_POST['action'] == 'add_whitelist_placeholder_data' && wp_verify_nonce( $_POST['_wpnonce'], 'jetpack-protect' ) ) {
			$this->add_whitelist_placeholder_data();
		}

		if ( isset( $_POST['action'] ) && $_POST['action'] == 'get_protect_key' && wp_verify_nonce( $_POST['_wpnonce'], 'jetpack-protect' ) ) {
			$result = $this->get_protect_key();
			// only redirect on success
			// if it fails we need access to $this->api_key_error
			if( $result ) {
				wp_safe_redirect( Jetpack::module_configuration_url( 'protect' ) );
			}
		}

		$this->api_key     = get_site_option( 'jetpack_protect_key', false );
		$this->whitelist   = get_site_option( 'jetpack_protect_whitelist', array() );
	}

	public function configuration_head() {
		wp_enqueue_script( 'jetpack-protect' );
		wp_enqueue_style( 'jetpack-protect' );
	}

	/**
	 * Prints the configuration screen
	 */
	public function configuration_screen() {
		require_once dirname( __FILE__ ) . '/protect/config-ui.php';
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

		// if we can't find the the blog id, that means we are on multisite, and the main site never connected
		// the protect api key is linked to the main blog id - instruct the user to connect their main blog
		if ( ! $protect_blog_id ) {
			$this->api_key_error = __( 'Your main blog is not connected to WordPress.com. Please connect to get an API key.', 'jetpack' );
			return false;
		}

		$request = array(
			'jetpack_blog_id'           => $protect_blog_id,
			'bruteprotect_api_key'      => get_site_option( 'bruteprotect_api_key' ),
			'multisite'                 => '0',
		);

		// send the number of blogs on the network if we are on multisite
		if ( is_multisite() ) {
			global $wpdb;
			$request['multisite'] = $wpdb->get_var( "SELECT COUNT(blog_id) as c FROM $wpdb->blogs WHERE spam = '0' AND deleted = '0' and archived = '0'" );
		}

		// request the key
		Jetpack::load_xml_rpc_client();
		$xml = new Jetpack_IXR_Client( array(
			'user_id' => get_current_user_id()
		) );
		$xml->query( 'jetpack.protect.requestKey', $request );

		// hmm, can't talk to wordpress.com
		if ( $xml->isError() ) {
			$code = $xml->getErrorCode();
			$message = $xml->getErrorMessage();
			$this->api_key_error = __( 'Error connecting to WordPress.com. Code: ' . $code . ', '. $message, 'jetpack');
			return false;
		}

		$response = $xml->getResponse();

		// hmm. can't talk to the protect servers ( api.bruteprotect.com )
		if( ! isset( $response['data'] ) ) {
			$this->api_key_error = __( 'No reply from Protect servers', 'jetpack' );
			return false;
		}

		// there was an issue generating the key
		if (  empty( $response['success'] ) ) {
			$this->api_key_error = $response['data'];
			return false;
		}

		// hey, we did it!
		$active_plugins = Jetpack::get_active_plugins();

		// we only want to deactivate bruteprotect if we successfully get a key
		if ( in_array( 'bruteprotect/bruteprotect.php', $active_plugins ) ) {
			Jetpack_Client_Server::deactivate_plugin( 'bruteprotect/bruteprotect.php', 'BruteProtect' );
		}

		$key = $response['data'];
		update_site_option( 'jetpack_protect_key', $key );
		return $key;
	}

	/**
	 * Get jetpack blog id, or the jetpack blog id of the main blog in the network
	 *
	 * @return int
	 */
	public function get_main_blog_jetpack_id() {
		$id = Jetpack::get_option( 'id' );
		if ( is_multisite() && get_current_blog_id() != 1 ) {
			switch_to_blog( 1 );
			$id = Jetpack::get_option( 'id', false );
			restore_current_blog();
		}
		return $id;
	}

	public function save_whitelist() {

		global $current_user;
		$whitelist = is_array( $_POST['whitelist'] ) ? $_POST['whitelist'] : array();
		$new_items = array();

		// validate each item
		foreach( $whitelist as $item ) {

			if ( ! isset( $item['range'] ) ) {
				$this->whitelist_error = true;
				break;
			}

			if ( ! in_array( $item['range'], array( '1', '0' ) ) ) {
				$this->whitelist_error = true;
				break;
			}

			$range              = $item['range'];
			$new_item           = new stdClass();
			$new_item->range    = (bool) $range;
			$new_item->global   = false;
			$new_item->user_id  = $current_user->ID;

			if ( $range ) {

				if ( ! isset( $item['range_low'] ) || ! isset( $item['range_high'] ) ) {
					$this->whitelist_error = true;
					break;
				}

				if ( ! inet_pton( $item['range_low'] ) || ! inet_pton( $item['range_high'] ) ) {
					$this->whitelist_error = true;
					break;
				}

				$new_item->range_low    = $item['range_low'];
				$new_item->range_high   = $item['range_high'];

			} else {

				if ( ! isset( $item['ip_address'] ) ) {
					$this->whitelist_error = true;
					break;
				}

				if ( ! inet_pton( $item['ip_address'] ) ) {
					$this->whitelist_error = true;
					break;
				}

				$new_item->ip_address = $item['ip_address'];
			}

			$new_items[] = $new_item;

		} // end item loop

		if ( ! empty( $this->whitelist_error ) ) {
			return false;
		}

		// merge new items with un-editable items
		$this->whitelist                = get_site_option( 'jetpack_protect_whitelist', array() );
		$current_user_global_whitelist  = wp_list_filter( $this->whitelist, array( 'user_id' => $current_user->ID, 'global'=> true) );
		$other_user_whtielist           = wp_list_filter( $this->whitelist, array( 'user_id' => $current_user->ID ), 'NOT' );
		$new_whitelist                  = array_merge( $new_items, $current_user_global_whitelist, $other_user_whtielist );
		
		update_site_option( 'jetpack_protect_whitelist', $new_whitelist );
		return true;
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