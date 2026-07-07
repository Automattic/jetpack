<?php
/**
 * REST API endpoint for the Jetpack AI feature settings page.
 *
 * GET  — returns the AI gate state (host support, connection, plan) together
 *        with the master switch and per-feature toggle values, in one round
 *        trip, so the settings page can render every state without extra
 *        requests.
 * POST — accepts a partial update ({ master_enabled, features }) and writes
 *        the site-local options backing the toggles. Returns the fresh GET
 *        shape.
 *
 * Unlike the MCP settings endpoint, nothing here proxies to WPCOM: the
 * settings are site-local wp_options, so the endpoint works the same on
 * Simple, Atomic, and self-hosted sites.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Connection\Manager;
use Automattic\Jetpack\Current_Plan;
use Automattic\Jetpack\Search\Plan as Search_Plan;
use Automattic\Jetpack\Status\Host;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Class WPCOM_REST_API_V2_Endpoint_AI_Feature_Settings
 */
class WPCOM_REST_API_V2_Endpoint_AI_Feature_Settings extends WP_REST_Controller {
	/**
	 * Namespace prefix.
	 *
	 * @var string
	 */
	public $namespace = 'wpcom/v2';

	/**
	 * Endpoint base route.
	 *
	 * @var string
	 */
	public $rest_base = 'jetpack-ai/feature-settings';

	/**
	 * Feature keys whose toggles the endpoint reads and writes.
	 *
	 * @var string[]
	 */
	const FEATURE_KEYS = array( 'writing_assistant', 'image_editor', 'image_label', 'excerpt', 'seo_enhancer', 'ai_search' );

	/**
	 * Constructor.
	 */
	public function __construct() {
		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Register routes.
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_settings' ),
					'permission_callback' => array( $this, 'permissions_check' ),
				),
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => array( $this, 'update_settings' ),
					'permission_callback' => array( $this, 'permissions_check' ),
					'args'                => array(
						'master_enabled' => array(
							'type'     => 'boolean',
							'required' => false,
						),
						'features'       => array(
							'type'     => 'object',
							'required' => false,
						),
					),
				),
			)
		);
	}

	/**
	 * Check permissions.
	 *
	 * @return bool|WP_Error
	 */
	public function permissions_check() {
		if ( ! current_user_can( 'manage_options' ) ) {
			return new WP_Error(
				'rest_forbidden',
				__( 'You do not have permission to manage Jetpack AI settings.', 'jetpack' ),
				array( 'status' => rest_authorization_required_code() )
			);
		}

		return true;
	}

	/**
	 * GET handler.
	 *
	 * @return WP_REST_Response
	 */
	public function get_settings() {
		return rest_ensure_response( $this->build_settings_response() );
	}

	/**
	 * POST handler. Accepts a partial payload and writes only the keys present.
	 *
	 * @param WP_REST_Request $request The request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function update_settings( $request ) {
		// The host gate is a server-owner decision: while it is off there is
		// nothing to configure, so refuse writes outright.
		if ( ! Jetpack_AI_Settings::host_allows_ai() ) {
			return new WP_Error(
				'ai_disabled_by_host',
				__( 'AI has been turned off for this site.', 'jetpack' ),
				array( 'status' => 403 )
			);
		}

		if ( $request->has_param( 'master_enabled' ) ) {
			update_option( Jetpack_AI_Settings::MASTER_OPTION, (bool) $request->get_param( 'master_enabled' ) );
		}

		$features = $request->get_param( 'features' );
		if ( is_array( $features ) ) {
			foreach ( self::FEATURE_KEYS as $key ) {
				if ( ! array_key_exists( $key, $features ) ) {
					continue;
				}

				// A feature value may be a bare boolean or an object carrying an enabled key.
				$value = $features[ $key ];
				if ( is_array( $value ) ) {
					if ( ! array_key_exists( 'enabled', $value ) ) {
						continue;
					}
					$value = $value['enabled'];
				}

				update_option( Jetpack_AI_Settings::FEATURE_OPTIONS[ $key ], rest_sanitize_boolean( $value ) );
			}
		}

		return rest_ensure_response( $this->build_settings_response() );
	}

	/**
	 * Assemble the full settings + gate-state payload.
	 *
	 * @return array
	 */
	private function build_settings_response() {
		$supports_search = class_exists( Search_Plan::class ) && ( new Search_Plan() )->supports_search();

		$stored = array();
		foreach ( self::FEATURE_KEYS as $key ) {
			$stored[ $key ] = (bool) get_option(
				Jetpack_AI_Settings::FEATURE_OPTIONS[ $key ],
				Jetpack_AI_Settings::FEATURE_DEFAULTS[ $key ]
			);
		}

		return array(
			'host_allows_ai' => Jetpack_AI_Settings::host_allows_ai(),
			'is_connected'   => $this->is_connected(),
			'plan'           => array(
				'supports_ai'     => class_exists( Current_Plan::class ) && Current_Plan::supports( 'ai-assistant' ),
				'supports_search' => $supports_search,
			),
			'master_enabled' => Jetpack_AI_Settings::is_master_enabled(),
			'features'       => array(
				'writing_assistant' => array( 'enabled' => $stored['writing_assistant'] ),
				'image_editor'      => array(
					'enabled' => $stored['image_editor'],
					'sub'     => array(
						'image_label' => array(
							'enabled'   => $stored['image_label'],
							// The label is a sub-setting of the image editor:
							// without the parent there is nothing to mark.
							'available' => $stored['image_editor'],
						),
					),
				),
				'seo_enhancer'      => array( 'enabled' => $stored['seo_enhancer'] ),
				'excerpt'           => array( 'enabled' => $stored['excerpt'] ),
				'ai_search'         => array(
					'enabled'          => $stored['ai_search'],
					'requires_upgrade' => ! $supports_search,
				),
			),
		);
	}

	/**
	 * Whether the site can know its plan: Simple sites always can; elsewhere a
	 * connected owner is required. Mirrors the connection predicate the AI
	 * feature load points use.
	 *
	 * @return bool
	 */
	private function is_connected() {
		return ( new Host() )->is_wpcom_simple()
			|| ( new Manager( 'jetpack' ) )->has_connected_owner();
	}
}

wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Endpoint_AI_Feature_Settings' );
