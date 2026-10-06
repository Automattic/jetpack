<?php
/**
 * REST API endpoint for the Newsletter task lists (e.g. onboarding).
 *
 * @package automattic/jetpack
 * @since $$next-version$$
 */

use Automattic\Jetpack\Connection\Traits\WPCOM_REST_API_Proxy_Request;
use Automattic\Jetpack\Status\Host;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Class WPCOM_REST_API_V2_Endpoint_Newsletter_Task_Lists
 *
 * Proxies `GET /sites/{blog_id}/newsletter/task-lists/{list_id}` and
 * `POST /sites/{blog_id}/newsletter/task-lists/{list_id}/tasks/{task_id}/complete` so the Newsletter
 * dashboard can show and complete its checklist. WP.com owns the implementation, including which
 * lists and tasks exist and how each task's completion is checked and stored, but flags it as a
 * site-specific, WP.com-only endpoint — meaning it only exists under `/wpcom/v2/sites/{blog_id}/…`
 * on public-api and is unreachable from a Jetpack site's own REST API without this proxy.
 */
class WPCOM_REST_API_V2_Endpoint_Newsletter_Task_Lists extends WP_REST_Controller {
	use WPCOM_REST_API_Proxy_Request;

	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->wpcom_is_wpcom_only_endpoint    = true;
		$this->wpcom_is_site_specific_endpoint = true;
		$this->base_api_path                   = 'wpcom';
		$this->version                         = 'v2';
		$this->namespace                       = $this->base_api_path . '/' . $this->version;
		$this->rest_base                       = '/newsletter/task-lists';

		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Register routes.
	 *
	 * Not registered on WP.com Simple: WP.com already registers its own implementation at these
	 * exact paths there, and a second registration would shadow it. Unknown list and task ids are
	 * left for WP.com to reject, so the routes only constrain their shape.
	 */
	public function register_routes() {
		if ( ( new Host() )->is_wpcom_simple() ) {
			return;
		}

		$list_route = $this->rest_base . '/(?P<list_id>[a-z_-]+)';

		register_rest_route(
			$this->namespace,
			$list_route,
			array(
				'show_in_index'       => true,
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_task_list' ),
				'permission_callback' => array( $this, 'permission_check' ),
			)
		);

		register_rest_route(
			$this->namespace,
			$list_route . '/tasks/(?P<task_id>[a-z_]+)/complete',
			array(
				'show_in_index'       => true,
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'complete_task' ),
				'permission_callback' => array( $this, 'permission_check' ),
			)
		);
	}

	/**
	 * Only site administrators can read or complete the Newsletter task lists.
	 *
	 * @return bool
	 */
	public function permission_check() {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Proxy the task list read to WP.com, forwarding the list id as a path segment.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return mixed|WP_Error Response from WP.com, or an error.
	 */
	public function get_task_list( $request ) {
		return $this->proxy_request_to_wpcom_as_user( $request, $request->get_param( 'list_id' ) );
	}

	/**
	 * Proxy a task completion to WP.com, forwarding the list and task ids as path segments.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return mixed|WP_Error Response from WP.com, or an error.
	 */
	public function complete_task( $request ) {
		return $this->proxy_request_to_wpcom_as_user(
			$request,
			$request->get_param( 'list_id' ) . '/tasks/' . $request->get_param( 'task_id' ) . '/complete'
		);
	}
}

wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Endpoint_Newsletter_Task_Lists' );
