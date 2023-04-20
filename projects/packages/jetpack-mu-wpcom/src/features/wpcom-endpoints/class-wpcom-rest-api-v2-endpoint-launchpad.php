<?php
/**
 * Launchpad API endpoint
 *
 * @package automattic/jetpack-mu-wpcom
 * @since 1.1.0
 */

/**
 * Fetches Launchpad-related data for the site.
 *
 * @since 1.1.0
 */
class WPCOM_REST_API_V2_Endpoint_Launchpad extends WP_REST_Controller {

	/**
	 * Class constructor
	 */
	public function __construct() {
		$this->namespace = 'wpcom/v2';
		$this->rest_base = 'launchpad';

		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Register our routes.
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
				),
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => array( $this, 'update_site_options' ),
					'permission_callback' => array( $this, 'can_access' ),
					'args'                => array(
						'checklist_statuses' => array(
							'description'          => 'Launchpad statuses',
							'type'                 => 'object',
							'properties'           => array(
								'domain_upsell_deferred' => array(
									'type' => 'boolean',
								),
								'links_edited'           => array(
									'type' => 'boolean',
								),
								'site_edited'            => array(
									'type' => 'boolean',
								),
								'site_launched'          => array(
									'type' => 'boolean',
								),
								'first_post_published'   => array(
									'type' => 'boolean',
								),
								'video_uploaded'         => array(
									'type' => 'boolean',
								),
								'publish_first_course'   => array(
									'type' => 'boolean',
								),
								'plan_completed'         => array(
									'type' => 'boolean',
								),
							),
							'additionalProperties' => false,
						),
						'launchpad_screen'   => array(
							'description' => 'Launchpad screen',
							'type'        => 'string',
							'enum'        => array( 'off', 'minimized', 'full' ),
						),
					),
				),
			)
		);
	}

	/**
	 * Permission callback for the REST route.
	 *
	 * @return boolean
	 */
	public function can_access() {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Returns Launchpad-related options.
	 *
	 * @return array Associative array with `site_intent`, `launchpad_screen`,
	 *               and `launchpad_checklist_tasks_statuses` as `checklist`.
	 */
	public function get_data() {
		return array(
			'site_intent'        => get_option( 'site_intent' ),
			'launchpad_screen'   => get_option( 'launchpad_screen' ),
			'checklist_statuses' => get_option( 'launchpad_checklist_tasks_statuses', array() ),
		);
	}

	/**
	 * Updates Launchpad-related options and returns the result
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return array Associative array with updated site options.
	 */
	public function update_site_options( $request ) {
		$updated = array();
		$input   = $request->get_json_params();

		foreach ( $input as $key => $value ) {
			switch ( $key ) {
				case 'checklist_statuses':
					$launchpad_checklist_tasks_statuses_option = (array) get_option( 'launchpad_checklist_tasks_statuses', array() );
					$launchpad_checklist_tasks_statuses_option = array_merge( $launchpad_checklist_tasks_statuses_option, $value );

					if ( update_option( 'launchpad_checklist_tasks_statuses', $launchpad_checklist_tasks_statuses_option ) ) {
						$updated[ $key ] = $value;
					}
					break;

				default:
					if ( update_option( $key, $value ) ) {
						$updated[ $key ] = $value;
					}
					break;
			}
		}

		return array(
			'updated' => $updated,
		);
	}
}

wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Endpoint_Launchpad' );
