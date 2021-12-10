<?php

namespace Automattic\Jetpack_Boost\Modules\Critical_CSS;

use Automattic\Jetpack_Boost\Lib\Nonce;
use Automattic\Jetpack_Boost\Modules\Critical_CSS\Generate\Generator;

class REST_API {

	protected $storage;
	protected $recommendations;
	protected $generator;
	protected $is_initialized = false;

	const CSS_CALLBACK_ACTION      = 'jb-critical-css-callback';
	const RESET_REASON_STORAGE_KEY = 'jb-generate-critical-css-reset-reason';

	public function __construct() {
		$this->storage         = new Critical_CSS_Storage();
		$this->recommendations = new Recommendations();
		$this->generator       = new Generator();
	}

	public function on_initialize() {
		add_action( 'rest_api_init', array( $this, 'register_rest_routes' ) );
		$this->recommendations->on_prepare();
		$this->is_initialized = true;
	}


	public function register_rest_routes() {

		// Store and retrieve critical css status.
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


	public function current_user_can_modify_critical_css() {
		// @TODO: We shouldn't need to do these kinds of checks:
		// $this->rest_is_module_available()
		return $this->is_initialized && current_user_can( 'manage_options' );
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
			$this->generator->make_generation_request();
			$this->recommendations->delete_all();
			Critical_CSS::clear_reset_reason();
		}

		return rest_ensure_response(
			array(
				'status'        => 'success',
				'status_update' => $this->get_local_critical_css_generation_info(),
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

			$this->generator->state->set_as_failed( $data['error'] );
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
			$this->generator->state->set_source_error( $cache_key, $data['urls'] );
		}

		// Set status to success to indicate the critical CSS error has been stored on the server.
		return rest_ensure_response(
			array(
				'status'        => 'success',
				'code'          => 'processed',
				'status_update' => $this->generator->get_critical_css_status(),
			)
		);
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
		$this->generator->state->set_source_success( $cache_key );
		$this->recommendations->delete_all();
		Critical_CSS::clear_reset_reason();

		// Set status to success to indicate the critical CSS data has been stored on the server.
		return rest_ensure_response(
			array(
				'status'        => 'success',
				'code'          => 'processed',
				'status_update' => $this->generator->get_critical_css_status(),
			)
		);
	}

	/**
	 * API helper for ensuring this module is enabled before allowing an API
	 * endpoint to continue. Will die if this module is not initialized, with
	 * a status message indicating so.
	 */
	public function ensure_module_initialized() {
		if ( true !== $this->is_initialized ) {
			wp_send_json( array( 'status' => 'module-unavailable' ) );
		}
	}


	/**
	 * Get a Critical CSS status block, adding in local generation nonces (if applicable).
	 * i.e.: Call this method to supply enough Critical CSS status to kick off local generation,
	 * such as in response to a request-generate API call or during page initialization.
	 */
	private function get_local_critical_css_generation_info() {
		$status = $this->generator->get_critical_css_status();

		// Add viewport sizes.
		$status['viewports'] = array(
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
		);;

		// Add a userless nonce to use when requesting pages for Critical CSS generation (i.e.: To turn off admin features).
		$status['generation_nonce'] = Nonce::create( Generator::GENERATE_QUERY_ACTION );

		// Add a user-bound nonce to use when proxying CSS for Critical CSS generation.
		$status['proxy_nonce'] = wp_create_nonce( Generator::GENERATE_PROXY_NONCE );

		// Add a passthrough block to include in all response callbacks.
		$status['callback_passthrough'] = array(
			'_nonce' => Nonce::create( self::CSS_CALLBACK_ACTION ),
		);

		return $status;
	}

	/**
	 * Add Critical CSS related constants to be passed to JavaScript only if the module is enabled.
	 *
	 * @param array $constants Constants to be passed to JavaScript.
	 *
	 * @return array
	 */
	public function add_critical_css_constants( $constants ) {
		// Information about the current status of Critical CSS / generation.
		$constants['criticalCssStatus'] = $this->get_local_critical_css_generation_info();

		return $constants;
	}

	/**
	 * REST API endpoint to get local critical css status.
	 *
	 * @return \WP_Error|\WP_HTTP_Response|\WP_REST_Response
	 */
	public function api_get_critical_css_status() {
		return rest_ensure_response( $this->generator->get_critical_css_status() );
	}

}
