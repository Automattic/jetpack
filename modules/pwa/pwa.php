<?php
/**
 * Plugin Name: PWA
 * Description: Add Progressive Web App support to your WordPress site.
 * Plugin URI: https://github.com/automattic/jetpack
 * Author: Automattic
 * Author URI: https://automattic.com
 * Version: 0.4.2
 * Text Domain: pwa
 * Domain Path: /languages/
 * License: GPLv2 or later
 */

 /**
  * Include the following PWA capabilities:
  * - cache the home page and posts/pages
  * - cache all CSS and JS
  * - show offline/online status using body class "jetpack__offline"
  * TODO:
  * - push updates, including UI to disable, and when/what to push (new posts? new products? posts in a taxonomy?)
  * - push content as well as notifications?
  * - how to cache within wp-admin? (disabled for now)
  * - hook WP's native cache functions (or sync?) to expire and push updates to sites
  */

class Jetpack_PWA {
	private static $__instance = null;
	/**
	 * Singleton implementation
	 *
	 * @return object
	 */
	public static function instance() {
		if ( ! is_a( self::$__instance, 'Jetpack_PWA' ) ) {
			self::$__instance = new Jetpack_PWA();
		}

		return self::$__instance;
	}

	private function __construct() {
		// enable PWA components
		Jetpack_PWA_Service_Worker::instance();
		Jetpack_PWA_Manifest::instance();
		Jetpack_PWA_Network_Status::instance();

		// TODO - just notify user instead
		add_action( 'template_redirect', array( $this, 'force_https' ), 1 );
	}

	public function force_https () {
		if ( !is_ssl() ) {
			wp_redirect('https://' . $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI'], 301 );
			exit();
		}
	}

	public function site_icon_url( $size ) {
		$url = get_site_icon_url( $size );

		if ( ! $url ) {
			if ( ! function_exists( 'jetpack_site_icon_url' ) ) {
				require_once( JETPACK__PLUGIN_DIR . 'modules/site-icon/site-icon-functions.php' );
			}
			$url = jetpack_site_icon_url( null, $size );
		}

		return $url;
	}
}

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

define( 'PWA_MANIFEST_QUERY_VAR', 'jetpack_app_manifest' );
class Jetpack_PWA_Manifest {
	private static $__instance = null;
	/**
	 * Singleton implementation
	 *
	 * @return object
	 */
	public static function instance() {
		if ( ! is_a( self::$__instance, 'Jetpack_PWA_Manifest' ) ) {
			self::$__instance = new Jetpack_PWA_Manifest();
		}

		return self::$__instance;
	}

	/**
	 * Registers actions
	 */
	private function __construct() {
		// register WP_Query hooks for manifest and service worker
		add_filter( 'query_vars', array( $this, 'register_query_vars' ) );
		add_action( 'wp_head', array( $this, 'render_manifest_link' ) );
		// add_action( 'admin_head', array( $this, 'render_manifest_link' ) ); // Don't load for wp-admin, for now
		add_action( 'amp_post_template_head', array( $this, 'render_manifest_link' ) ); // AMP
		add_action( 'template_redirect', array( $this, 'render_manifest_json' ), 2 );
	}

	public function register_query_vars( $vars ) {
		$vars[] = PWA_MANIFEST_QUERY_VAR;
		return $vars;
	}

	function render_manifest_link() {
		?>
			<link rel="manifest" href="<?php echo $this->get_manifest_url() ?>">
			<meta name="theme-color" content="<?php echo $this->get_theme_color(); ?>">
		<?php
	}

	private function get_manifest_url() {
		return add_query_arg( PWA_MANIFEST_QUERY_VAR, '1', trailingslashit( site_url() ) . 'index.php' );
	}

	private function get_theme_color() {
		// if we have AMP enabled, use those colors?
	   if ( class_exists( 'AMP_Customizer_Settings' ) ) {
		   $amp_settings = apply_filters( 'amp_post_template_customizer_settings', AMP_Customizer_Settings::get_settings(), null );
		   $theme_color = $amp_settings['header_background_color'];
	   } elseif ( current_theme_supports( 'custom-background' ) ) {
		   $theme_color = get_theme_support( 'custom-background' )->{'default-color'};
	   } else {
		   $theme_color = '#FFF';
	   }

	   return apply_filters( 'jetpack_pwa_background_color', $theme_color );
   }

	function render_manifest_json() {
		global $wp_query;

		if ( $wp_query->get( PWA_MANIFEST_QUERY_VAR ) ) {
			$theme_color = $this->get_theme_color();

			$manifest = array(
				'start_url'  => get_bloginfo( 'url' ),
				'short_name' => get_bloginfo( 'name' ),
				'name'       => get_bloginfo( 'name' ),
				'display'    => 'standalone',
				'background_color' => $theme_color,
				'theme_color' => $theme_color,
				'gcm_sender_id' => '87234302238',
			);

			$pwa = Jetpack_PWA::instance();
			$icon_48 = $pwa->site_icon_url( 48 );

			if ( $icon_48 ) {
				$manifest[ 'icons' ] = array(
					array(
						'src' => $icon_48,
						'sizes' => '48x48'
					),
					array(
						'src' => $pwa->site_icon_url( 192 ),
						'sizes' => '192x192'
					),
					array(
						'src' => $pwa->site_icon_url( 512 ),
						'sizes' => '512x512'
					)
				);
			}

			wp_send_json( $manifest );
		}
	}
}

class Jetpack_PWA_Network_Status {
	private static $__instance = null;
	/**
	 * Singleton implementation
	 *
	 * @return object
	 */
	public static function instance() {
		if ( ! is_a( self::$__instance, 'Jetpack_PWA_Network_Status' ) ) {
			self::$__instance = new Jetpack_PWA_Network_Status();
		}

		return self::$__instance;
	}

	/**
	 * Registers actions
	 */
	private function __construct() {
		add_action( 'init', array( $this, 'register_assets' ) );
		add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_assets' ) );
	}

	public function register_assets() {
		wp_register_script( 'jetpack-show-network-status', plugins_url( 'assets/js/show-network-status.js', __FILE__ ), false, '1.5' );
		wp_register_style( 'jetpack-show-network-status', plugins_url( 'assets/css/show-network-status.css', __FILE__ ) );
	}

	public function enqueue_assets() {
		wp_enqueue_script( 'jetpack-show-network-status' );
		wp_enqueue_style( 'jetpack-show-network-status' );
	}
}

class Jetpack_PWA_Web_Push {
	private static $__instance = null;
	/**
	 * Singleton implementation
	 *
	 * @return object
	 */
	public static function instance() {
		if ( ! is_a( self::$__instance, 'Jetpack_PWA_Web_Push' ) ) {
			self::$__instance = new Jetpack_PWA_Web_Push();
		}

		return self::$__instance;
	}

	private function __construct() {
		// web push - flag post as web pushable
		add_filter( 'jetpack_published_post_flags', array( $this, 'jetpack_published_post_flags' ), 10, 2 );
	}

	public function jetpack_published_post_flags( $flags, $post ) {
		if ( ! $this->post_type_is_web_pushable( $post->post_type ) ) {
			return $flags;
		}

		/**
		 * Determines whether a post being published gets sent to web push subscribers.
		 *
		 * @module pwa
		 *
		 * @since 5.6.0
		 *
		 * @param bool $should_publicize Should the post be web_pushed? Default to true.
		 * @param WP_POST $post Current Post object.
		 */
		if ( ! apply_filters( 'pwa_should_web_push_published_post', true, $post ) ) {
			return $flags;
		}

		$flags['web_push'] = true;

		return $flags;
	}

	protected function post_type_is_web_pushable( $post_type ) {
		if ( 'post' == $post_type )
			return true;

		return post_type_supports( $post_type, 'web_push' );
	}
}
