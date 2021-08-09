<?php
/**
 * Implements the Critical CSS functionality.
 *
 * @link       https://automattic.com
 * @since      1.0.0
 * @package    automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Modules\Critical_CSS;

use Automattic\Jetpack_Boost\Lib\Nonce;
use Automattic\Jetpack_Boost\Modules\Critical_CSS\Providers\Archive_Provider;
use Automattic\Jetpack_Boost\Modules\Critical_CSS\Providers\Post_ID_Provider;
use Automattic\Jetpack_Boost\Modules\Critical_CSS\Providers\Provider;
use Automattic\Jetpack_Boost\Modules\Critical_CSS\Providers\Singular_Post_Provider;
use Automattic\Jetpack_Boost\Modules\Critical_CSS\Providers\Taxonomy_Provider;
use Automattic\Jetpack_Boost\Modules\Critical_CSS\Providers\WP_Core_Provider;
use Automattic\Jetpack_Boost\Modules\Module;

/**
 * Class Critical_CSS.
 */
class Critical_CSS extends Module {

	const MODULE_SLUG                           = 'critical-css';
	const GENERATE_QUERY_ACTION                 = 'jb-generate-critical-css';
	const CSS_CALLBACK_ACTION                   = 'jb-critical-css-callback';
	const RESET_REASON_STORAGE_KEY              = 'jb-generate-critical-css-reset-reason';
	const DISMISSED_RECOMMENDATIONS_STORAGE_KEY = 'jb-critical-css-dismissed-recommendations';
	const AJAX_NONCE                            = 'ajax_nonce';

	/**
	 * Viewport sizes for this module.
	 */
	const VIEWPORT_SIZES = array(
		0 => array(
			'type'   => 'phone',
			'width'  => 414,
			'height' => 896,
		),
		1 => array(
			'type'   => 'tablet',
			'width'  => 1200,
			'height' => 800,
		),
		2 => array(
			'type'   => 'desktop',
			'width'  => 1920,
			'height' => 1080,
		),
	);

	/**
	 * Provider keys which are present in "core" WordPress. If any of these fail to generate,
	 * the whole process should be considered broken.
	 */
	const CORE_PROVIDER_KEYS = array(
		'core_front_page',
		'core_posts_page',
		'singular_page',
		'singular_post',
		'singular_product',
	);

	/**
	 * True if this pageload is generating Critical CSS.
	 *
	 * @var bool
	 */
	public $generating_critical_css;

	/**
	 * List of all the Critical CSS Types.
	 *
	 * The order is important because searching for critical CSS will stop as soon as a value is found.
	 * So finding Critical CSS by post ID is attempted before searching for a common Singular Post critical CSS.
	 *
	 * @var Provider[]
	 */
	protected $providers = array(
		Post_ID_Provider::class,
		WP_Core_Provider::class,
		Singular_Post_Provider::class,
		Archive_Provider::class,
		Taxonomy_Provider::class,
	);
	/**
	 * Stores the Critical CSS key used for rendering the current page if any.
	 *
	 * @var null|string
	 */
	protected $current_critical_css_key;

	/**
	 * Variable used to cache the CSS string during the page request.
	 * This is here because `get_critical_css` is called multiple
	 * times in `style_loader_tag` hook (on each CSS file).
	 *
	 * @var null|false|string
	 */
	protected $request_cached_css;

	/**
	 * Used to track real admin user id when generating Critical CSS,
	 * to ensure all nonces belong to the correct user.
	 *
	 * @var int
	 */
	protected $nonce_admin_user_id;

	/**
	 * Critical CSS storage class instance.
	 *
	 * @var Critical_CSS_Storage
	 */
	protected $storage;

	/**
	 * Critical CSS state class instance.
	 *
	 * @var Critical_CSS_State
	 */
	protected $state;

	/**
	 * This is only run if Critical CSS module has been activated.
	 *
	 * @return bool
	 */
	protected function on_initialize() {
		// Touch to set-up the post type. This is a temporary hack.
		// This should instantiate a new Post_Type_Storage class,
		// so that Critical_CSS class is responsible
		// for setting up the storage.
		$this->storage = new Critical_CSS_Storage();
		$this->state   = new Critical_CSS_State();
		if ( $this->state->is_empty() && ! wp_doing_ajax() && ! wp_doing_cron() ) {
			$this->state->create_request( $this->providers );
		}

		// Update ready flag used to indicate Boost optimizations are warmed up in metatag.
		add_filter( 'jetpack_boost_url_ready', array( $this, 'is_ready_filter' ), 10, 1 );

		// Check for the appropriate GET parameters to act as a CSS proxy and handle them.
		$this->handle_css_proxy();

		if ( $this->should_display_critical_css() ) {
			Admin_Bar_Css_Compat::init();
			add_action( 'wp_head', array( $this, 'display_critical_css' ), 0 );
			add_filter( 'style_loader_tag', array( $this, 'asynchronize_stylesheets' ), 10, 4 );
			add_action( 'wp_footer', array( $this, 'onload_flip_stylesheets' ) );
		}

		// Check for the GET parameter indicating this is rendering for CSS generation.
		$this->generating_critical_css = $this->check_generate_query();

		if ( $this->generating_critical_css ) {
			add_filter( 'style_loader_src', array( $this, 'force_proxied_css' ), 10, 4 );
			add_action( 'wp_head', array( $this, 'display_generate_meta' ), 0 );

			$this->force_logged_out_render();
		}

		add_action( 'jetpack_boost_clear_cache', array( $this, 'clear_critical_css' ) );
		add_filter( 'jetpack_boost_js_constants', array( $this, 'add_critical_css_constants' ) );

		if ( is_admin() ) {
			add_action( 'wp_ajax_dismiss_recommendations', array( $this, 'dismiss_recommendations' ) );
			add_action( 'wp_ajax_reset_dismissed_recommendations', array( $this, 'reset_dismissed_recommendations' ) );
		}

		return true;
	}

	/**
	 * Register the Critical CSS related REST routes.
	 *
	 * @return bool
	 */
	public function register_rest_routes() {
		/**
		 * Store and retrieve critical css status.
		 */
		register_rest_route(
			JETPACK_BOOST_REST_NAMESPACE,
			JETPACK_BOOST_REST_PREFIX . '/critical-css/status',
			array(
				array(
					'methods'             => \WP_REST_Server::READABLE,
					'callback'            => array( $this, 'api_get_critical_css_status' ),
					'permission_callback' => array( $this, 'current_user_can_modify_critical_css' ),
				),
			)
		);

		// Register Critical CSS generate route.
		register_rest_route(
			JETPACK_BOOST_REST_NAMESPACE,
			JETPACK_BOOST_REST_PREFIX . '/critical-css/request-generate',
			array(
				'methods'             => \WP_REST_Server::EDITABLE,
				'callback'            => array( $this, 'critical_css_request_generate_handler' ),
				'permission_callback' => array( $this, 'current_user_can_modify_critical_css' ),
			)
		);

		// Register Critical CSS success callback route.
		register_rest_route(
			JETPACK_BOOST_REST_NAMESPACE,
			JETPACK_BOOST_REST_PREFIX . '/critical-css/(?P<cacheKey>.+)/success',
			array(
				'methods'             => \WP_REST_Server::EDITABLE,
				'callback'            => array( $this, 'generate_success_handler' ),
				'permission_callback' => '__return_true',
			)
		);

		// Register Critical CSS error callback route.
		register_rest_route(
			JETPACK_BOOST_REST_NAMESPACE,
			JETPACK_BOOST_REST_PREFIX . '/critical-css/(?P<cacheKey>.+)/error',
			array(
				'methods'             => \WP_REST_Server::EDITABLE,
				'callback'            => array( $this, 'generate_error_handler' ),
				'permission_callback' => '__return_true',
			)
		);

		return true;
	}

	/**
	 * Handler for PUT '/critical-css/(?P<cacheKey>.+)/success'.
	 *
	 * @param \WP_REST_Request $request The request object.
	 *
	 * @return \WP_REST_Response|\WP_Error The response.
	 * @todo: Figure out what to do in the JavaScript when responding with the error status.
	 */
	public function generate_success_handler( $request ) {
		$this->ensure_module_initialized();

		$cache_key = $request['cacheKey'];

		if ( ! $cache_key ) {
			// Set status to error, because the data is invalid.
			return rest_ensure_response(
				array(
					'status' => 'error',
					'code'   => 'missing_cache_key',
				)
			);
		}

		$params = $request->get_params();

		if ( empty( $params['passthrough'] ) || empty( $params['passthrough']['_nonce'] ) ) {
			return rest_ensure_response(
				array(
					'status' => 'error',
					'code'   => 'missing_nonce',
				)
			);
		}

		$cache_key_nonce = $params['passthrough']['_nonce'];

		if ( ! Nonce::verify( $cache_key_nonce, self::CSS_CALLBACK_ACTION ) ) {
			return rest_ensure_response(
				array(
					'status' => 'error',
					'code'   => 'invalid_nonce',
				)
			);
		}

		if ( ! isset( $params['data'] ) ) {
			// Set status to error, because the data is invalid.
			return rest_ensure_response(
				array(
					'status' => 'error',
					'code'   => 'invalid_data',
				)
			);
		}

		$this->storage->store_css( $cache_key, $params['data'] );
		$this->state->set_source_success( $cache_key );
		self::clear_reset_reason();
		self::clear_dismissed_recommendations();

		// Set status to success to indicate the critical CSS data has been stored on the server.
		return rest_ensure_response(
			array(
				'status'        => 'success',
				'code'          => 'processed',
				'status_update' => $this->get_critical_css_status(),
			)
		);
	}

	/**
	 * Handler for PUT '/critical-css/(?P<cacheKey>.+)/error'.
	 *
	 * @param \WP_REST_Request $request The request object.
	 *
	 * @return \WP_REST_Response|\WP_Error The response.
	 * @todo: Figure out what to do in the JavaScript when responding with the error status.
	 */
	public function generate_error_handler( $request ) {
		$this->ensure_module_initialized();

		$cache_key = $request['cacheKey'];
		$params    = $request->get_params();

		if ( empty( $params['passthrough'] ) || empty( $params['passthrough']['_nonce'] ) ) {
			return rest_ensure_response(
				array(
					'status' => 'error',
					'code'   => 'missing_nonce',
				)
			);
		}

		$cache_key_nonce = $params['passthrough']['_nonce'];

		if ( ! Nonce::verify( $cache_key_nonce, self::CSS_CALLBACK_ACTION ) ) {
			return rest_ensure_response(
				array(
					'status' => 'error',
					'code'   => 'invalid_nonce',
				)
			);
		}

		if ( ! isset( $params['data'] ) ) {
			// Set status to error, because the data is missing.
			return rest_ensure_response(
				array(
					'status' => 'error',
					'code'   => 'missing_data',
				)
			);
		}

		$data = $params['data'];

		if ( ! isset( $data['show_stopper'] ) ) {
			// Set status to error, because the data is invalid.
			return rest_ensure_response(
				array(
					'status' => 'error',
					'code'   => 'invalid_data',
				)
			);
		}

		// TODO: Log errors to a remote service.

		if ( true === $data['show_stopper'] ) {
			// TODO: Review it seems a bit cumbersome the validation of the data structure here.
			if ( ! isset( $data['error'] ) ) {
				// Set status to error, because the data is invalid.
				return rest_ensure_response(
					array(
						'status' => 'error',
						'code'   => 'invalid_data',
					)
				);
			}

			$this->state->set_as_failed( $data['error'] );
			$this->storage->clear();
		} else {
			// TODO: Review it seems a bit cumbersome the validation of the data structure here.
			if ( ! isset( $data['urls'] ) ) {
				// Set status to error, because the data is invalid.
				return rest_ensure_response(
					array(
						'status' => 'error',
						'code'   => 'invalid_data',
					)
				);
			}

			// otherwise, store the error at the provider level, allowing the UI to display them with all details.
			$this->state->set_source_error( $cache_key, $data['urls'] );
		}

		// Set status to success to indicate the critical CSS error has been stored on the server.
		return rest_ensure_response(
			array(
				'status'        => 'success',
				'code'          => 'processed',
				'status_update' => $this->get_critical_css_status(),
			)
		);
	}

	/**
	 * Check that user can modify Critical CSS.
	 *
	 * @return bool
	 */
	public function current_user_can_modify_critical_css() {
		return $this->rest_is_module_available() && current_user_can( 'manage_options' );
	}

	/**
	 * Get all critical CSS storage keys that are available for the current request.
	 * Caches the result.
	 *
	 * @return array
	 */
	public function get_current_request_css_keys() {
		static $keys = null;
		if ( null !== $keys ) {
			return $keys;
		}

		$keys = array();

		foreach ( $this->providers as $provider ) {
			$provider_keys = $provider::get_current_storage_keys();
			if ( empty( $provider_keys ) ) {
				continue;
			}
			$keys = array_merge( $keys, $provider_keys );
		}

		return $keys;
	}

	/**
	 * Renders a <meta> tag used to verify this is a valid page to generate Critical CSS with.
	 */
	public function display_generate_meta() {
		?>
		<meta name="jb-generate-critical-css" content="true" />
		<?php
	}

	/**
	 * Check for GET parameters or Headers indicating the current request is
	 * generating Critical CSS.
	 * phpcs:disable WordPress.Security.NonceVerification.Recommended
	 */
	public function check_generate_query() {
		$generate_nonce = null;
		if ( ! empty( $_GET[ self::GENERATE_QUERY_ACTION ] ) ) {
			$generate_nonce = sanitize_key(
				$_GET[ self::GENERATE_QUERY_ACTION ]
			);
		} elseif ( ! empty( $_SERVER['HTTP_X_GENERATE_CRITICAL_CSS'] ) ) {
			$generate_nonce = sanitize_key(
				$_SERVER['HTTP_X_GENERATE_CRITICAL_CSS']
			);
		}

		if ( empty( $generate_nonce ) ) {
			return false;
		}

		if ( ! Nonce::verify( $generate_nonce, self::GENERATE_QUERY_ACTION ) ) {
			die();
		}

		return true;
	}
	// phpcs:enable WordPress.Security.NonceVerification.Recommended

	/**
	 * Add Critical CSS related constants to be passed to JavaScript.
	 *
	 * @param array $constants Constants to be passed to JavaScript.
	 *
	 * @return array
	 */
	public function add_critical_css_constants( $constants ) {
		// Information about the current status of Critical CSS / generation.
		$constants['criticalCssStatus']                   = $this->get_local_critical_css_generation_info();
		$constants['criticalCssAjaxNonce']                = wp_create_nonce( self::AJAX_NONCE );
		$constants['criticalCssDismissedRecommendations'] = \get_option( self::DISMISSED_RECOMMENDATIONS_STORAGE_KEY, array() );

		return $constants;
	}

	/**
	 * Get a Critical CSS status block, adding in local generation nonces (if applicable).
	 * i.e.: Call this method to supply enough Critical CSS status to kick off local generation,
	 * such as in response to a request-generate API call or during page initialization.
	 */
	private function get_local_critical_css_generation_info() {
		$status = $this->get_critical_css_status();

		// Add viewport sizes.
		$status['viewports'] = self::VIEWPORT_SIZES;

		// Add a nonce to use when requesting pages for Critical CSS generation (i.e.: To turn off admin features).
		$status['generation_nonce'] = Nonce::create( self::GENERATE_QUERY_ACTION );

		// Add a passthrough block to include in all response callbacks.
		$status['callback_passthrough'] = array(
			'_nonce' => Nonce::create( self::CSS_CALLBACK_ACTION ),
		);

		return $status;
	}

	/**
	 * Get Critical CSS status.
	 */
	public function get_critical_css_status() {
		if ( $this->state->is_empty() ) {
			return array( 'status' => Critical_CSS_State::NOT_GENERATED );
		}

		if ( $this->state->is_pending() ) {
			return array(
				'status'                 => Critical_CSS_State::REQUESTING,
				'percent_complete'       => $this->state->get_percent_complete(),
				'success_count'          => $this->state->get_providers_success_count(),
				'pending_provider_keys'  => $this->state->get_provider_urls(),
				'provider_success_ratio' => $this->state->get_provider_success_ratios(),
			);
		}

		if ( $this->state->is_fatal_error() ) {
			return array(
				'status'       => Critical_CSS_State::FAIL,
				'status_error' => $this->state->get_state_error(),
			);
		}

		$providers_errors    = $this->state->get_providers_errors();
		$provider_key_labels = array_combine(
			array_keys( $providers_errors ),
			array_map( array( $this, 'describe_provider_key' ), array_keys( $providers_errors ) )
		);

		return array(
			'status'                => Critical_CSS_State::SUCCESS,
			'success_count'         => $this->state->get_providers_success_count(),
			'core_providers'        => self::CORE_PROVIDER_KEYS,
			'core_providers_status' => $this->state->get_core_providers_status( self::CORE_PROVIDER_KEYS ),
			'providers_errors'      => $providers_errors,
			'provider_key_labels'   => $provider_key_labels,
			'created'               => $this->state->get_created_time(),
		);
	}

	/**
	 * REST API endpoint to get local critical css status.
	 *
	 * @return \WP_Error|\WP_HTTP_Response|\WP_REST_Response
	 */
	public function api_get_critical_css_status() {
		return rest_ensure_response( $this->get_critical_css_status() );
	}

	/**
	 * Request generate Critical CSS.
	 *
	 * @param \WP_REST_Request $request The request object.
	 *
	 * @return \WP_Error|\WP_HTTP_Response|\WP_REST_Response
	 */
	public function critical_css_request_generate_handler( $request ) {
		$reset = ! empty( $request['reset'] );

		$this->ensure_module_initialized();

		$cleared_critical_css_reason = \get_option( self::RESET_REASON_STORAGE_KEY );
		if ( $reset || $cleared_critical_css_reason ) {
			// Create a new Critical CSS Request block to track creation request.
			$this->storage->clear();
			$this->state->create_request( $this->providers );
			self::clear_reset_reason();
			self::clear_dismissed_recommendations();
		}

		return rest_ensure_response(
			array(
				'status'        => 'success',
				'status_update' => $this->get_local_critical_css_generation_info(),
			)
		);
	}

	/**
	 * Clear Critical CSS.
	 */
	public function clear_critical_css() {
		// Mass invalidate all cached values.
		$this->storage->clear();
		$this->state->reset();
	}

	/**
	 * Get critical CSS for the current request.
	 *
	 * @return string|false
	 */
	public function get_critical_css() {
		if ( null !== $this->request_cached_css ) {
			return $this->request_cached_css;
		}

		$data = $this->storage->get_css( $this->get_current_request_css_keys() );
		if ( false === $data ) {
			return false;
		}

		$this->request_cached_css       = $data['css'];
		$this->current_critical_css_key = $data['key'];

		return $this->request_cached_css;
	}

	/**
	 * Converts existing screen CSS to be asynchronously loaded.
	 *
	 * @param string $html   The link tag for the enqueued style.
	 * @param string $handle The style's registered handle.
	 * @param string $href   The stylesheet's source URL.
	 * @param string $media  The stylesheet's media attribute.
	 *
	 * @return string|string[]|null
	 * @see style_loader_tag
	 */
	public function asynchronize_stylesheets( $html, $handle, $href, $media ) {
		if ( function_exists( 'is_amp_endpoint' ) && is_amp_endpoint() ) {
			return $html;
		}

		if ( false === $this->get_critical_css() ) {
			return $html;
		}

		if ( ! apply_filters( 'jetpack_boost_async_style', true, $handle ) ) {
			return $html;
		}
		$async_media = apply_filters( 'jetpack_boost_async_media', array( 'all', 'screen' ) );

		// Convert stylesheets intended for screens.
		if ( in_array( $media, $async_media, true ) ) {
			$media_replacement = 'media="not all" onload="this.media=\'all\'"';
			$html              = preg_replace( '~media=[\'"]?[^\'"\s]+[\'"]?~', $media_replacement, $html );
		}

		return $html;
	}

	/**
	 * Returns true if the current page render should try to display Critical CSS.
	 */
	public function should_display_critical_css() {
		// Don't display Critical CSS when generating Critical CSS.
		if ( $this->generating_critical_css ) {
			return false;
		}

		// Don't show Critical CSS in customizer previews.
		if ( is_customize_preview() ) {
			return false;
		}

		return true;
	}

	/**
	 * Prints the critical CSS to the page.
	 */
	public function display_critical_css() {
		if ( function_exists( 'is_amp_endpoint' ) && is_amp_endpoint() ) {
			return false;
		}

		$critical_css = $this->get_critical_css();

		if ( false === $critical_css ) {
			return false;
		}

		echo '<style id="jetpack-boost-critical-css">';

		// Ensure no </style> tag (or any HTML tags) in output.
		// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		echo wp_strip_all_tags( $critical_css );

		echo '</style>';
	}

	/**
	 * Check if the current URL is warmed up. For this module, "warmed up" means that
	 * either Critical CSS has been generated for this page, or this page is not
	 * eligible to have Critical CSS generated for it.
	 *
	 * @param bool $ready Injected filter value.
	 *
	 * @return bool
	 */
	public function is_ready_filter( $ready ) {
		if ( ! $ready ) {
			return $ready;
		}

		// If this page has no provider keys, it is ineligible for Critical CSS.
		$keys = $this->get_current_request_css_keys();
		if ( count( $keys ) === 0 ) {
			return true;
		}

		// Return "ready" if Critical CSS has been generated.
		return ! empty( $this->get_critical_css() );
	}

	/**
	 * Force the current page to render as viewed by a logged out user. Useful when generating
	 * Critical CSS.
	 */
	private function force_logged_out_render() {
		$current_user_id = get_current_user_id();

		if ( 0 !== $current_user_id ) {
			// Add a filter to force all nonces generated to belong to the current user (if any).
			$this->nonce_admin_user_id = $current_user_id;
			add_filter( 'nonce_user_logged_out', array( $this, 'force_nonce_admin_user' ), 10, 2 );

			// Force current user to 0 to ensure page is rendered as a non-logged-in user.
			wp_set_current_user( 0 );
		}
	}

	/**
	 * Filter to force nonces created during Critical CSS render to belong to the correct admin user.
	 * Only affects 'jb-proxy-*' nonces used for proxying external CSS resources.
	 *
	 * @param int    $uid    ID of the nonce-owning user.
	 * @param string $action The nonce action.
	 *
	 * @return int
	 */
	public function force_nonce_admin_user( $uid, $action ) {
		if ( strncmp( $action, 'jb-proxy-', 9 ) === 0 ) {
			return $this->nonce_admin_user_id;
		}

		return $uid;
	}

	/**
	 * Filter used during local critical CSS generation to replace external CSS references with
	 * proxied URLs.
	 *
	 * @param string $src - URL of external CSS resource.
	 *
	 * @return string - Proxied URL for external resources, or unaltered $src for local.
	 */
	public function force_proxied_css( $src ) {
		global $wp;

		$parsed = wp_parse_url( $src );

		// If no domain specified, or domain matches current, no need to proxy.
		// phpcs:disable WordPress.Security.ValidatedSanitizedInput.InputNotValidated
		if ( empty( $parsed['host'] ) || $_SERVER['HTTP_HOST'] === $parsed['host'] ) {
			return $src;
		}

		// Copy the scheme in from the current URL if missing.
		if ( empty( $parsed['scheme'] ) ) {
			$scheme = empty( $_SERVER['HTTPS'] ) ? 'http://' : 'https://';
			$src    = $scheme . ltrim( $src, ':/' );
		}

		// Prepare a proxied URL to allow the JavaScript to access this.
		$nonce       = wp_create_nonce( 'jb-proxy-' . sanitize_key( $src ) );
		$proxied_url = add_query_arg(
			array(
				'jb-critical-css-render-proxy' => rawurlencode( $src ),
				'nonce'                        => $nonce,
			),
			home_url( $wp->request )
		);

		return $proxied_url;
	}

	/**
	 * Proxy external CSS script - used when jb-critical-css-render-proxy and an appropriate
	 * nonce are supplied. Useful while generating critical CSS locally.
	 *
	 * @param string $src_url - External CSS URL to proxy.
	 */
	private function proxy_css( $src_url ) {
		if ( ! wp_http_validate_url( $src_url ) ) {
			die( 'Invalid URL' );
		}

		$response = wp_remote_get( $src_url );
		if ( is_wp_error( $response ) ) {
			// TODO: Nicer error handling.
			die( 'error' );
		}

		header( 'Content-type: text/css' );

		// Outputting proxied CSS contents unescaped.
		// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		echo wp_strip_all_tags( $response['body'] );

		die();
	}

	/**
	 * Check for a special GET parameter used to proxy CSS requests while generating new Critical CSS.
	 * Requires admin permission to use, and is verified by nonce.
	 *
	 * phpcs:disable WordPress.Security.NonceVerification.Recommended
	 */
	private function handle_css_proxy() {
		// Exit as early as possible if not trying to proxy.
		if ( empty( $_GET['jb-critical-css-render-proxy'] ) ) {
			return;
		}

		$proxy_url = filter_var( wp_unslash( $_GET['jb-critical-css-render-proxy'] ), FILTER_VALIDATE_URL );

		// Verify valid nonce.
		if ( empty( $_GET['nonce'] ) || ! wp_verify_nonce( sanitize_key( $_GET['nonce'] ), 'jb-proxy-' . sanitize_key( $proxy_url ) ) ) {
			wp_die( '', 400 );
		}

		// Make sure currently logged in as admin.
		if ( ! $this->current_user_can_modify_critical_css() ) {
			wp_die( '', 400 );
		}

		$this->proxy_css( $proxy_url );
	}

	// phpcs:enable WordPress.Security.NonceVerification.Recommended

	/**
	 * API helper for ensuring this module is enabled before allowing an API
	 * endpoint to continue. Will die if this module is not initialized, with
	 * a status message indicating so.
	 */
	public function ensure_module_initialized() {
		if ( ! $this->is_initialized() ) {
			wp_send_json( array( 'status' => 'module-unavailable' ) );
		}
	}

	/**
	 * Add a small piece of JavaScript to the footer, which on load flips all
	 * linked stylesheets from media="not all" to "all", and switches the
	 * Critical CSS <style> block to media="not all" to deactivate it.
	 */
	public function onload_flip_stylesheets() {
		/*
			Unminified version of footer script.

		?>
			<script>
				window.addEventListener( 'load', function() {

					// Flip all media="not all" links to media="all".
					document.querySelectorAll( 'link' ).forEach(
						function( link ) {
							if ( link.media === 'not all' ) {
								link.media = 'all';
							}
						}
					);

					// Turn off Critical CSS style block with media="not all".
					var element = document.getElementById( 'jetpack-boost-critical-css' );
					if ( element ) {
						element.media = 'not all';
					}

				} );
			</script>
		<?php
		*/

		// Minified version of footer script. See above comment for unminified version.
		?>
		<script>window.addEventListener('load', function() {
				document.querySelectorAll('link').forEach(function(e) {'not all' === e.media && (e.media = 'all');});
				var e = document.getElementById('jetpack-boost-critical-css');
				e && (e.media = 'not all');
			});</script>
		<?php
	}

	/**
	 * Override; returns an admin notice to show if there was a reset reason.
	 *
	 * @return null|\Automattic\Jetpack_Boost\Admin\Admin_Notice[]
	 */
	public function get_admin_notices() {
		$reason = \get_option( self::RESET_REASON_STORAGE_KEY );

		if ( ! $reason ) {
			return null;
		}

		return array( new Regenerate_Admin_Notice( $reason ) );
	}

	/**
	 * Clear Critical CSS reset reason option.
	 */
	public static function clear_reset_reason() {
		\delete_option( self::RESET_REASON_STORAGE_KEY );
	}

	/**
	 * Clear Critical CSS dismissed recommendations option.
	 */
	public static function clear_dismissed_recommendations() {
		\delete_option( self::DISMISSED_RECOMMENDATIONS_STORAGE_KEY );
	}

	/**
	 * Given a provider key, find the provider which owns the key. Returns false
	 * if no Provider is found.
	 *
	 * @param string $provider_key Provider key.
	 *
	 * @return Provider|false|string
	 */
	public function find_provider_for( $provider_key ) {
		foreach ( $this->providers as $provider ) {
			if ( $provider::owns_key( $provider_key ) ) {
				return $provider;
			}
		}

		return false;
	}

	/**
	 * Returns a descriptive label for a provider key, or the raw provider key
	 * if none found.
	 *
	 * @param string $provider_key Provider key.
	 *
	 * @return mixed
	 */
	public function describe_provider_key( $provider_key ) {
		$provider = $this->find_provider_for( $provider_key );
		if ( ! $provider ) {
			return $provider_key;
		}

		/**
		 * Provider key.
		 *
		 * @param string $provider_key
		 */
		return $provider::describe_key( $provider_key );
	}

	/**
	 * Dismiss Critical CSS recommendations.
	 */
	public function dismiss_recommendations() {
		check_ajax_referer( self::AJAX_NONCE, 'nonce' );
		$response = array(
			'status' => 'ok',
		);

		$provider_key = $_POST['providerKey'] ? filter_var( $_POST['providerKey'], FILTER_SANITIZE_STRING ) : '';
		if ( empty( $provider_key ) ) {
			$response['status'] = 'error';
			echo wp_json_encode( $response );
			wp_die();
		}
		$dismissed_recommendations = \get_option( self::DISMISSED_RECOMMENDATIONS_STORAGE_KEY, array() );

		if ( ! in_array( $provider_key, $dismissed_recommendations, true ) ) {
			$dismissed_recommendations[] = $provider_key;
			\update_option( self::DISMISSED_RECOMMENDATIONS_STORAGE_KEY, $dismissed_recommendations );
		}

		echo wp_json_encode( $response );
		wp_die();
	}

	/**
	 * Reset dismissed Critical CSS recommendations.
	 */
	public function reset_dismissed_recommendations() {
		check_ajax_referer( self::AJAX_NONCE, 'nonce' );
		$response = array(
			'status' => 'ok',
		);

		self::clear_dismissed_recommendations();

		echo wp_json_encode( $response );
		wp_die();
	}
}
