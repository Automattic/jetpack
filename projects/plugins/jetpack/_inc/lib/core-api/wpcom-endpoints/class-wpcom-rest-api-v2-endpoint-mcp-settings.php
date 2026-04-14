<?php
/**
 * REST API endpoint for Jetpack AI MCP settings.
 *
 * GET  — proxies to WPCOM wpcom/v2/sites/{blog_id}/mcp-abilities (wpcom#205108) using
 *         user token auth so that WPCOM can resolve the requesting user's account-level
 *         MCP state. Reshapes the response into the { account, site, sites,
 *         site_level_enabled_default } structure the client utilities expect.
 * POST — proxies to WPCOM POST /sites/{blog_id}/mcp-abilities (user token auth) which
 *         persists { site_level_enabled, abilities } to user settings via SettingsHelper,
 *         keeping Jetpack and Calypso in sync.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Connection\Client;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Class WPCOM_REST_API_V2_Endpoint_MCP_Settings
 */
class WPCOM_REST_API_V2_Endpoint_MCP_Settings extends WP_REST_Controller {
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
	public $rest_base = 'jetpack-ai/mcp-settings';

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
					'callback'            => array( $this, 'get_mcp_settings' ),
					'permission_callback' => array( $this, 'permissions_check' ),
				),
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => array( $this, 'update_mcp_settings' ),
					'permission_callback' => array( $this, 'permissions_check' ),
					'args'                => array(
						'mcp_abilities' => array(
							'type'     => 'object',
							'required' => true,
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
				__( 'You do not have permission to manage MCP settings.', 'jetpack' ),
				array( 'status' => rest_authorization_required_code() )
			);
		}

		return true;
	}

	/**
	 * Fetch MCP abilities from the WPCOM wpcom/v2/sites/{blog_id}/mcp-abilities endpoint.
	 *
	 * The WPCOM endpoint accepts user token auth and returns an array of abilities.
	 * The response is shaped to match the format the client utilities expect:
	 * { account: { tool-id: {...} }, site: { tool-id: {...} },
	 *   sites: [{ blog_id, site_level_enabled, abilities }],
	 *   site_level_enabled_default: bool }
	 *
	 * All state is owned by WPCOM and persisted via POST /sites/{blog_id}/mcp-abilities.
	 *
	 * @return WP_REST_Response|WP_Error
	 */
	public function get_mcp_settings() {
		$blog_id = defined( 'IS_WPCOM' ) && IS_WPCOM
			? get_current_blog_id()
			: \Jetpack_Options::get_option( 'id' );

		if ( ! $blog_id ) {
			return rest_ensure_response( array( 'mcp_abilities' => new stdClass() ) );
		}

		$response = Client::wpcom_json_api_request_as_user(
			sprintf( '/sites/%d/mcp-abilities', (int) $blog_id ),
			'2',
			array( 'method' => 'GET' ),
			null,
			'wpcom'
		);

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$body = json_decode( wp_remote_retrieve_body( $response ), true );

		// Transform [ {name, title, readonly, site_context, enabled, …}, … ] → { name: {…}, … }.
		// readonly and site_context are now provided by the WPCOM endpoint (wpcom#205108).
		// Fall back to name-suffix heuristic for readonly only if the field is absent, so
		// this endpoint remains functional against older WPCOM builds.
		$account_abilities = new stdClass();
		$site_abilities    = array();
		if ( ! empty( $body['abilities'] ) && is_array( $body['abilities'] ) ) {
			$account_abilities = array();
			foreach ( $body['abilities'] as $ability ) {
				if ( empty( $ability['name'] ) ) {
					continue;
				}
				if ( ! array_key_exists( 'readonly', $ability ) ) {
					$ability['readonly'] = ! (bool) preg_match( '/-(create|update|delete)$/i', $ability['name'] );
				}
				$account_abilities[ (string) $ability['name'] ] = $ability;

				// `site` subset: tools marked site_context=true by WPCOM are the only ones
				// relevant to the site-level settings UI. getSiteContextToolIds() in JS uses
				// this to filter out account/notifications/billing/domains tools.
				if ( ! empty( $ability['site_context'] ) ) {
					$site_abilities[ $ability['name'] ] = $ability;
				}
			}
		}

		// site_level_enabled comes directly from WPCOM — it is the authoritative effective
		// state for this site (account default applied, site exceptions factored in).
		// Fall back to the enabled-abilities heuristic only if the field is absent.
		$site_level_enabled = isset( $body['site_level_enabled'] )
			? (bool) $body['site_level_enabled']
			: ! empty(
				array_filter(
					(array) $account_abilities,
					function ( $a ) {
						return ! empty( $a['enabled'] );
					}
				)
			);

		// site_level_enabled_default mirrors Calypso: same value as site_level_enabled
		// when derived from WPCOM (no per-site override concept at this layer).
		$site_level_enabled_default = $site_level_enabled;

		// Build per-site abilities from the effective enabled state of each site-context
		// tool returned by WPCOM. The WPCOM endpoint merges account defaults with any
		// per-site user overrides saved via POST, so these values reflect what was last
		// saved and drive the per-tool toggle states in the Read/Write views.
		$site_tool_abilities = array();
		foreach ( $site_abilities as $name => $ability ) {
			$site_tool_abilities[ $name ] = ! empty( $ability['enabled'] );
		}

		return rest_ensure_response(
			array(
				'mcp_abilities' => array(
					'account'                    => $account_abilities,
					'site'                       => $site_abilities,
					'sites'                      => array(
						array(
							'blog_id'            => (int) $blog_id,
							'site_level_enabled' => $site_level_enabled,
							'abilities'          => (object) $site_tool_abilities,
						),
					),
					'site_level_enabled_default' => $site_level_enabled_default,
				),
			)
		);
	}

	/**
	 * Proxy mcp_abilities update to WPCOM POST /sites/{blog_id}/mcp-abilities.
	 *
	 * Accepts the sites[] format used by the client:
	 *   { sites: [{ blog_id, site_level_enabled?, abilities?: { tool_id: bool } }] }
	 *
	 * Extracts site_level_enabled and abilities from sites[0] and forwards them
	 * to the WPCOM endpoint which persists them to user settings via SettingsHelper.
	 * This keeps Jetpack and Calypso in sync — both read/write the same store.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function update_mcp_settings( $request ) {
		$blog_id  = \Jetpack_Options::get_option( 'id' );
		$incoming = $request->get_param( 'mcp_abilities' );

		if ( is_object( $incoming ) ) {
			$incoming = get_object_vars( $incoming );
		} elseif ( ! is_array( $incoming ) ) {
			$incoming = array();
		}

		// Unpack sites[0] into the flat format WPCOM POST /sites/{id}/mcp-abilities expects.
		$wpcom_body = array();

		if ( ! empty( $incoming['sites'] ) && is_array( $incoming['sites'] ) ) {
			$site_update = $incoming['sites'][0];
			if ( is_object( $site_update ) ) {
				$site_update = get_object_vars( $site_update );
			}

			if ( isset( $site_update['site_level_enabled'] ) ) {
				$wpcom_body['site_level_enabled'] = (bool) $site_update['site_level_enabled'];
			}

			if ( isset( $site_update['abilities'] ) ) {
				$abilities  = is_object( $site_update['abilities'] )
					? get_object_vars( $site_update['abilities'] )
					: (array) $site_update['abilities'];
				$normalised = array();
				foreach ( $abilities as $name => $value ) {
					$normalised[ $name ] = (bool) $value;
				}
				$wpcom_body['abilities'] = $normalised;
			}
		}

		if ( ! empty( $wpcom_body ) ) {
			$response = Client::wpcom_json_api_request_as_user(
				sprintf( '/sites/%d/mcp-abilities', (int) $blog_id ),
				'2',
				array( 'method' => 'POST' ),
				$wpcom_body,
				'wpcom'
			);

			if ( is_wp_error( $response ) ) {
				return $response;
			}

			$status = wp_remote_retrieve_response_code( $response );
			if ( $status < 200 || $status >= 300 ) {
				return new WP_Error(
					'wpcom_update_failed',
					__( 'Failed to save MCP settings on WordPress.com.', 'jetpack' ),
					array( 'status' => 502 )
				);
			}
		}

		return $this->get_mcp_settings();
	}
}

wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Endpoint_MCP_Settings' );
