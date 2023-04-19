<?php
/**
 * Launchpad Checklist API endpoint
 *
 * @package automattic/jetpack-mu-wpcom
 * @since 1.1.0
 */

/**
 * Fetches Launchpad checklist data for the site
 *
 * @since 1.1.0
 */
class WPCOM_REST_API_V2_Endpoint_Launchpad_Checklist extends WP_REST_Controller {

	/**
	 * Class constructor
	 */
	public function __construct() {
		require_once __DIR__ . '/../launchpad/launchpad.php';

		$this->namespace = 'wpcom/v2';
		$this->rest_base = 'launchpad/checklist';

		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Register our routes.
	 *
	 * @return void
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			$this->rest_base,
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_data' ),
					'permission_callback' => array( $this, 'can_access' ),
					'args'                => array(
						'checklist_slug' => array(
							'description' => 'Checklist slug',
							'type'        => 'string',
							'enum'        => array(
								'build',
								'free',
								'link-in-bio',
								'link-in-bio-tld',
								'newsletter',
								'videopress',
								'write',
							),
						),
					),
				),
			)
		);
	}

	/**
	 * Permission callback for the REST route
	 *
	 * @return boolean
	 */
	public function can_access() {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Returns Launchpad-related options
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 *
	 * @return array Array of launchpad tasks for a given checklist
	 */
	public function get_data( $request ) {
		$checklist_slug = $request['checklist_slug'];
		return array(
			'checklist' => get_launchpad_checklist_by_checklist_slug( $checklist_slug ),
		);
	}

}

wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Endpoint_Launchpad_Checklist' );
