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
	}

	public function modules_loaded() {
		Jetpack::enable_module_configurable( __FILE__ );
		Jetpack::module_configuration_load( __FILE__, array( $this, 'configuration_load' ) );
		Jetpack::module_configuration_screen( __FILE__, array( $this, 'configuration_screen' ) );
	}

	public function configuration_load() {
		$this->api_key = get_site_option( 'jetpack_protect_key', false );
	}

	public function configuration_screen() {
		?>
		<div class="narrow">
			<?php if ( ! $this->api_key ) : ?>
				<p>There was an error getting setting up Protect.</p>
			<?php else : ?>
				<p>Protect is set-up and running!</p>
				<p>Key: <?php echo $this->api_key; ?></p>
			<?php endif; ?>
		</div>
		<?php
	}

	/**
	 * On module activation, try to get an api key
	 */
	public function on_activation() {
		$key = $this->get_protect_key();
	}

	/**
	 * Request an api key from wordpress.com
	 *
	 * @return bool | string
	 */
	public function get_protect_key() {

		$protect_blog_id = Jetpack_Protect_Module::get_main_blog_jetpack_id();

		if ( ! $protect_blog_id ) {
			$log['error'] = 'Main blog not connected';
			error_log( print_r( $log, true ), 1, 'rocco@a8c.com' );
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

		Jetpack::load_xml_rpc_client();
		$xml = new Jetpack_IXR_Client( array(
			'user_id' => get_current_user_id()
		) );
		$xml->query( 'jetpack.protect.requestKey', $request );
		if ( $xml->isError() ) {
			$log['xml_error'] = $xml;
			error_log( print_r( $log, true ), 1, 'rocco@a8c.com' );
			return false;
		}

		$response = $xml->getResponse();
		$log['remote_response'] = $response;
		error_log( print_r( $log, true ), 1, 'rocco@a8c.com' );

		if ( ! isset( $response['success'] ) || empty( $response['success'] ) ) {
			// handle error
			return false;
		}

		if( ! isset( $response['data'] ) || empty( $response['data'] ) ) {
			return false;
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

}

Jetpack_Protect_Module::instance();