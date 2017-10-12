<?php

define( 'PWA_SW_QUERY_VAR', 'jetpack_service_worker' );
class Jetpack_PWA_Service_Worker {
	private static $__instance = null;
	/**
	 * Singleton implementation
	 *
	 * @return object
	 */
	public static function instance() {
		if ( ! is_a( self::$__instance, 'Jetpack_PWA_Service_Worker' ) ) {
			self::$__instance = new Jetpack_PWA_Service_Worker();
		}

		return self::$__instance;
	}

	/**
	 * Registers actions
	 */
	private function __construct() {
		add_action( 'jetpack_activate_module_pwa', array( $this, 'module_activate' ) );
		add_action( 'jetpack_deactivate_module_pwa', array( $this, 'module_deactivate' ) );

		// register WP_Query hooks for manifest and service worker
		add_filter( 'query_vars', array( $this, 'register_query_vars' ) );
		add_action( 'template_redirect', array( $this, 'render_service_worker_js' ), 2 );
		add_action( 'init', array( $this, 'register_assets' ) );
		add_action( 'init', array( $this, 'register_rewrite_rule' ) );
		add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_assets' ) );

		// AMP support
		add_action( 'amp_post_template_head', array( $this, 'render_amp_serviceworker_script' ) );
		add_action( 'amp_post_template_footer', array( $this, 'render_amp_serviceworker_element' ) );
	}

	public function register_rewrite_rule() {
		add_rewrite_rule('service-worker.js$', 'index.php?' . PWA_SW_QUERY_VAR . '=1', 'top');
	}

	public function module_activate() {
		$this->register_rewrite_rule();
		flush_rewrite_rules();
	}

	public function module_deactivate() {
		flush_rewrite_rules();
	}

	public function register_query_vars( $vars ) {
		$vars[] = PWA_SW_QUERY_VAR;
		return $vars;
	}

	public function render_service_worker_js() {
		global $wp_query;

		if ( $wp_query->get( PWA_SW_QUERY_VAR ) ) {
			header( 'Content-Type: application/javascript; charset=utf-8' );
			// fake localize - service worker is not loaded in page context, so regular localize doesn't work
			$pwa = Jetpack_PWA::instance();
			$pwa_vars = array(
				'admin_url' => admin_url(),
				'site_url' => site_url(),
				'site_icon' => $pwa->site_icon_url( 48 ),
				'images_url' => plugins_url( 'assets/images/', __FILE__ )
			);
			echo preg_replace( '/pwa_vars_json/', json_encode( $pwa_vars ), file_get_contents( plugin_dir_path( __FILE__ ) . 'assets/js/service-worker.js' ) );
			exit;
		}
	}

	public function register_assets() {
		wp_register_script( 'jetpack-register-service-worker', plugins_url( 'assets/js/register-service-worker.js', __FILE__ ), false, '1.5' );
	}

	public function enqueue_assets() {
		$pwa = Jetpack_PWA::instance();
		wp_localize_script(
			'jetpack-register-service-worker',
			'pwa_vars',
			array(
				'service_worker_url' => $this->get_service_worker_url(),
				'admin_url' => admin_url(),
				'site_url' => site_url(),
				'site_icon' => $pwa->site_icon_url( 48 ),
				'images_url' => plugins_url( 'assets/images/', __FILE__ ),
				'create_subscription_api_url' => get_rest_url( get_current_blog_id(), 'jetpack/v4/push-subscribe' )
			)
		);

		wp_enqueue_script( 'jetpack-register-service-worker' );
	}

	public function render_amp_serviceworker_script() {
		?>
			<script async custom-element="amp-install-serviceworker" src="https://cdn.ampproject.org/v0/amp-install-serviceworker-0.1.js"></script>
		<?php
	}

	public function render_amp_serviceworker_element() {
		?>
			<amp-install-serviceworker src="<?php echo $this->get_service_worker_url() ?>" layout="nodisplay"></amp-install-serviceworker>
		<?php
	}

	private function get_service_worker_url() {
		return add_query_arg( PWA_SW_QUERY_VAR, '1', trailingslashit( site_url() ) . 'index.php' );
	}
}
