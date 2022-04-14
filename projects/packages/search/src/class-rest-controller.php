<?php
/**
 * The Search Rest Controller class.
 * Registers the REST routes for Search.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Modules;
use Jetpack_Options;
use WP_Error;
use WP_REST_Request;
use WP_REST_Server;

/**
 * Registers the REST routes for Search.
 */
class REST_Controller {
	/**
	 * Whether it's run on WPCOM.
	 *
	 * @var bool
	 */
	protected $is_wpcom;

	/**
	 * Module Control object.
	 *
	 * @var Module_Control
	 */
	protected $search_module;

	/**
	 * Constructor
	 *
	 * @param bool                $is_wpcom - Whether it's run on WPCOM.
	 * @param Module_Control|null $module_control - Module_Control object if any.
	 * @param Plan|null           $plan - Plan object if any.
	 */
	public function __construct( $is_wpcom = false, $module_control = null, $plan = null ) {
		$this->is_wpcom      = $is_wpcom;
		$this->search_module = $module_control === null ? new Module_Control() : $module_control;
		$this->plan          = $plan === null ? new Plan() : $plan;
	}

	/**
	 * Registers the REST routes for Search.
	 *
	 * @access public
	 * @static
	 */
	public function register_rest_routes() {
		register_rest_route(
			'jetpack/v4',
			'/search/plan',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_search_plan' ),
				'permission_callback' => array( $this, 'require_admin_privilege_callback' ),
			)
		);
		register_rest_route(
			'jetpack/v4',
			'/search/settings',
			array(
				'methods'             => WP_REST_Server::EDITABLE,
				'callback'            => array( $this, 'update_settings' ),
				'permission_callback' => array( $this, 'require_admin_privilege_callback' ),
			)
		);
		register_rest_route(
			'jetpack/v4',
			'/search/settings',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_settings' ),
				'permission_callback' => array( $this, 'require_admin_privilege_callback' ),
			)
		);
		register_rest_route(
			'jetpack/v4',
			'/search/stats',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_stats' ),
				'permission_callback' => array( $this, 'require_admin_privilege_callback' ),
			)
		);
		register_rest_route(
			'jetpack/v4',
			'/search',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_search_results' ),
				'permission_callback' => 'is_user_logged_in',
			)
		);
		register_rest_route(
			'jetpack/v4',
			'/search/plan/activate',
			array(
				'methods'             => WP_REST_Server::EDITABLE,
				'callback'            => array( $this, 'activate_plan' ),
				'permission_callback' => array( $this, 'require_admin_privilege_callback' ),
			)
		);
		register_rest_route(
			'jetpack/v4',
			'/search/plan/deactivate',
			array(
				'methods'             => WP_REST_Server::EDITABLE,
				'callback'            => array( $this, 'deactivate_plan' ),
				'permission_callback' => array( $this, 'require_admin_privilege_callback' ),
			)
		);
		register_rest_route(
			'jetpack/v4',
			'/search/pricing',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'product_pricing' ),
				'permission_callback' => 'is_user_logged_in',
			)
		);
	}

	/**
	 * Only administrators can access the API.
	 *
	 * @return bool|WP_Error True if a blog token was used to sign the request, WP_Error otherwise.
	 */
	public function require_admin_privilege_callback() {
		if ( current_user_can( 'manage_options' ) ) {
			return true;
		}

		$error_msg = esc_html__(
			'You are not allowed to perform this action.',
			'jetpack-search-pkg'
		);

		return new WP_Error( 'rest_forbidden', $error_msg, array( 'status' => rest_authorization_required_code() ) );
	}

	/**
	 * Proxy the request to WPCOM and return the response.
	 *
	 * GET `jetpack/v4/search/plan`
	 */
	public function get_search_plan() {
		$response = ( new Plan() )->get_plan_info_from_wpcom();
		return $this->make_proper_response( $response );
	}

	/**
	 * POST `jetpack/v4/search/settings`
	 *
	 * @param WP_REST_Request $request - REST request.
	 */
	public function update_settings( $request ) {
		$request_body = $request->get_json_params();

		$module_active          = isset( $request_body['module_active'] ) ? (bool) $request_body['module_active'] : null;
		$instant_search_enabled = isset( $request_body['instant_search_enabled'] ) ? (bool) $request_body['instant_search_enabled'] : null;

		$error = $this->validate_search_settings( $module_active, $instant_search_enabled );

		if ( is_wp_error( $error ) ) {
			return $error;
		}

		// Enabling instant search should enable the module too.
		if ( true === $instant_search_enabled && true !== $module_active ) {
			$module_active = true;
		}

		$errors = array();
		if ( $module_active !== null ) {
			$module_active_updated = ( new Modules() )->update_status( Package::SLUG, $module_active, false, false );
			if ( is_wp_error( $module_active_updated ) ) {
				$errors['module_active'] = $module_active_updated;
			}
		}

		if ( $instant_search_enabled !== null ) {
			$instant_search_enabled_updated = $this->search_module->update_instant_search_status( $instant_search_enabled );
			if ( is_wp_error( $instant_search_enabled_updated ) ) {
				$errors['instant_search_enabled'] = $instant_search_enabled_updated;
			}
		}

		if ( ! empty( $errors ) ) {
			return new WP_Error(
				'some_updated',
				sprintf(
					/* translators: %s are the setting name that not updated. */
					__( 'Some settings ( %s ) not updated.', 'jetpack-search-pkg' ),
					implode(
						',',
						array_keys( $errors )
					)
				),
				array( 'status' => 400 )
			);
		}

		return rest_ensure_response( $this->get_settings() );
	}

	/**
	 * Validate $module_active and $instant_search_enabled. Returns an WP_Error instance if invalid.
	 *
	 * @param boolean $module_active - Module status.
	 * @param boolean $instant_search_enabled - Instant Search status.
	 */
	protected function validate_search_settings( $module_active, $instant_search_enabled ) {
		if ( ( true === $instant_search_enabled && false === $module_active ) || ( $module_active === null && $instant_search_enabled === null ) ) {
			return new WP_Error(
				'rest_invalid_arguments',
				esc_html__( 'The arguments passed in are invalid.', 'jetpack-search-pkg' ),
				array( 'status' => 400 )
			);
		}
		return true;
	}

	/**
	 * GET `jetpack/v4/search/settings`
	 */
	public function get_settings() {
		return rest_ensure_response(
			array(
				'module_active'          => $this->search_module->is_active(),
				'instant_search_enabled' => $this->search_module->is_instant_search_enabled(),
			)
		);
	}

	/**
	 * Proxy the request to WPCOM and return the response.
	 *
	 * GET `jetpack/v4/search/stats`
	 */
	public function get_stats() {
		$response = ( new Stats() )->get_stats_from_wpcom();
		return $this->make_proper_response( $response );
	}

	/**
	 * Search Endpoint for private sites.
	 *
	 * GET `jetpack/v4/search`
	 *
	 * @param WP_REST_Request $request - REST request.
	 */
	public function get_search_results( $request ) {
		$blog_id  = $this->get_blog_id();
		$path     = sprintf( '/sites/%d/search', absint( $blog_id ) );
		$path     = add_query_arg(
			$request->get_query_params(),
			sprintf( '/sites/%d/search', absint( $blog_id ) )
		);
		$response = Client::wpcom_json_api_request_as_user( $path, '1.3', array(), null, 'rest' );
		return rest_ensure_response( $this->make_proper_response( $response ) );
	}

	/**
	 * Activate plan: activate the search module, instant search and do initial configuration.
	 * Typically called from WPCOM.
	 *
	 * POST `jetpack/v4/search/plan/activate`
	 *
	 * @param WP_REST_Request $request - REST request.
	 */
	public function activate_plan( $request ) {
		$default_options = array(
			'search_plan_info'      => null,
			'enable_search'         => true,
			'enable_instant_search' => true,
			'auto_config_search'    => true,
		);
		$payload         = $request->get_json_params();
		$payload         = wp_parse_args( $payload, $default_options );

		// Update plan data, plan info is in the request body.
		// We do this to avoid another call to WPCOM and reduce latency.
		if ( $payload['search_plan_info'] === null || ! $this->plan->set_plan_options( $payload['search_plan_info'] ) ) {
			$this->plan->get_plan_info_from_wpcom();
		}

		// Enable search module by default, unless `enable_search` is explicitly set to boolean `false`.
		if ( false !== $payload['enable_search'] ) {
			// Eligibility is checked in `activate` function.
			$ret = $this->search_module->activate();
			if ( is_wp_error( $ret ) ) {
				return $ret;
			}
		}

		// Enable instant search by default, unless `enable_instant_search` is explicitly set to boolean `false`.
		if ( false !== $payload['enable_instant_search'] ) {
			// Eligibility is checked in `enable_instant_search` function.
			$ret = $this->search_module->enable_instant_search();
			if ( is_wp_error( $ret ) ) {
				return $ret;
			}
		}

		// Automatically configure necessary settings for instant search, unless `auto_config_search` is explicitly set to boolean `false`.
		if ( false !== $payload['auto_config_search'] ) {
			Instant_Search::instance( $this->get_blog_id() )->auto_config_search();
		}

		return rest_ensure_response(
			array(
				'code' => 'success',
			)
		);
	}

	/**
	 * Deactivate plan: turn off search module and instant search.
	 * If the plan is still valid then the function would simply deactivate the search module.
	 * Typically called from WPCOM.
	 *
	 * POST `jetpack/v4/search/plan/deactivate`
	 */
	public function deactivate_plan() {
		// Instant Search would be disabled along with search module.
		$this->search_module->deactivate();
		return rest_ensure_response(
			array(
				'code' => 'success',
			)
		);
	}

	/**
	 * Pricing for record count of the site
	 */
	public function product_pricing() {
		$record_count = intval( Stats::estimate_count() );
		$tier_pricing = Product::get_site_tier_pricing( $record_count );
		return rest_ensure_response( $tier_pricing );
	}

	/**
	 * Forward remote response to client with error handling.
	 *
	 * @param array|WP_Error $response - Response from WPCOM.
	 */
	protected function make_proper_response( $response ) {
		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$body        = json_decode( wp_remote_retrieve_body( $response ), true );
		$status_code = wp_remote_retrieve_response_code( $response );

		if ( 200 === $status_code ) {
			return $body;
		}

		return new WP_Error(
			isset( $body['error'] ) ? 'remote-error-' . $body['error'] : 'remote-error',
			isset( $body['message'] ) ? $body['message'] : 'unknown remote error',
			array( 'status' => $status_code )
		);
	}

	/**
	 * Get blog id
	 */
	protected function get_blog_id() {
		return $this->is_wpcom ? get_current_blog_id() : Jetpack_Options::get_option( 'id' );
	}

}
