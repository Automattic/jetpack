<?php

define( 'PWA_SW_QUERY_VAR', 'jetpack_service_worker' );
define( 'PWA_SW_CONFIG_QUERY_VAR', 'jetpack_service_worker_config' );

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
		$vars[] = PWA_SW_CONFIG_QUERY_VAR;
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
				'sw_config_url' => $this->get_service_worker_config_url(),
				'images_url' => plugins_url( 'assets/images/', __FILE__ )
			);
			echo preg_replace( '/pwa_vars_json/', json_encode( $pwa_vars ), file_get_contents( plugin_dir_path( __FILE__ ) . 'assets/js/service-worker.js' ) );
			exit;
		}

		if ( $wp_query->get( PWA_SW_CONFIG_QUERY_VAR ) ) {
			wp_send_json( $this->get_service_worker_config() );
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

	private function get_service_worker_config_url() {
		return add_query_arg( PWA_SW_CONFIG_QUERY_VAR, '1', trailingslashit( site_url() ) . 'index.php' );
	}

	public function get_service_worker_config() {

		// disable inlining
		if ( class_exists( 'Jetpack_Perf_Optimize_Assets' ) ) {
			$asset_optimizer = Jetpack_Perf_Optimize_Assets::instance();
			$asset_optimizer->disable_for_request();
		}

		return array(
			'config' => array(
				'cache_assets'              => get_option( 'pwa_cache_assets' ),
				'web_push'                  => get_option( 'pwa_web_push' ),
				'show_network_status'       => get_option( 'pwa_show_network_status' ),
				'inline_scripts_and_styles' => Jetpack_Perf::get_setting( 'inline_scripts_and_styles' ),
				'inline_on_every_request'   => Jetpack_Perf::get_setting( 'inline_on_every_request' ),
				'remove_remote_fonts'       => Jetpack_Perf::get_setting( 'remove_remote_fonts' ),
			),
			'preload' => $this->get_preload_urls()
		);
	}

	private function get_preload_urls() {
		return apply_filters( 'jetpack_pwa_preload_urls',
			array_merge(
				$this->get_page_preload_urls(),
				$this->get_theme_preload_urls()
			)
		);
	}

	/**
	 * TODO: what pages should be preloaded? What about for performance vs offline?
	 */
	private function get_page_preload_urls() {
		// list of pages to preload
		return array();
	}

	/**
	 * Sheer hackery to figure out which common assets to preload for a theme
	 */
	private function get_theme_preload_urls() {
		// list of theme assets to preload
		// we need to trigger actions for which plugins usually enqueue assets
		do_action( 'wp_enqueue_scripts' );
		Jetpack::init()->implode_frontend_css();

		// hackery!
		ob_start(); // in case of strange notices and other output

		$version = 'ver=' . get_bloginfo( 'version' );
		$asset_urls = array(
			apply_filters( 'script_loader_src', includes_url( "js/wp-emoji-release.min.js?$version" ), 'concatemoji' )
		);

		// enqueue additional scripts that are typically found on pages
		wp_enqueue_script( 'wp-embed' );

		// resolve asset dependencies and capture URLs
		global $wp_scripts;
		$wp_scripts->all_deps( $wp_scripts->queue, true );
		foreach( $wp_scripts->to_do as $handle ) {
			$registration = $wp_scripts->registered[$handle];
			$url = apply_filters( 'script_loader_src', $registration->src, $handle );
			if ( $registration->ver ) {
				$url = add_query_arg( 'ver', $registration->ver, $url );
			}
			$asset_urls[] = $url;
		}

		global $wp_styles;
		$wp_styles->all_deps( $wp_styles->queue, true );
		foreach( $wp_styles->to_do as $handle ) {
			$registration = $wp_styles->registered[$handle];
			if ( ! $registration->args || in_array( $registration->args, array( 'all', 'screen' ) ) ) {
				$url = apply_filters( 'style_loader_src', $registration->src, $handle );
				if ( $registration->ver ) {
					$url = add_query_arg( 'ver', $registration->ver, $url );
				}
				$asset_urls[] = $url;
			}
		}
		ob_end_clean();

		// remove falsy values
		return array_values( array_filter( $asset_urls ) );
	}
}
