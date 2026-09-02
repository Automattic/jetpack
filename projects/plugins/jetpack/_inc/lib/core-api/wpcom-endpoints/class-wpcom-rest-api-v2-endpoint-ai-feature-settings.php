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
 * Atomic and self-hosted sites. On WordPress.com Simple the route does not
 * register at all — Simple keeps the existing wp.com settings contract, and
 * with core settings REST also refusing these options there, the new
 * per-feature options stay unwritten on Simple while the reused SEO/Search
 * options keep their existing owning surfaces.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Connection\Manager;
use Automattic\Jetpack\Current_Plan;
use Automattic\Jetpack\Search\Plan as Search_Plan;
use Automattic\Jetpack\SEO\Ai_Seo;
use Automattic\Jetpack\Status;
use Automattic\Jetpack\Status\Host;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

// On WordPress.com the endpoint files load from the synced jetpack-endpoints
// directory, outside the plugin tree, so pull the settings class in via the
// plugin dir constant (same pattern as the jetpack-ai endpoint's AI helper).
require_once JETPACK__PLUGIN_DIR . '_inc/lib/class-jetpack-ai-settings.php';

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
	 * Constructor.
	 */
	public function __construct() {
		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Register routes.
	 *
	 * Not on WordPress.com Simple: the per-feature toggles and their write
	 * endpoint apply to Atomic and self-hosted sites only, while Simple keeps
	 * the existing wp.com settings contract.
	 */
	public function register_routes() {
		if ( ( new Host() )->is_wpcom_simple() ) {
			return;
		}

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

		$features = $request->get_param( 'features' );

		// AI Answers requires a paid Search plan. Checked up front, before any
		// option changes, so a payload combining `ai_search` with other
		// features doesn't partially apply.
		if ( is_array( $features ) ) {
			$ai_search_value = self::extract_feature_value( $features, 'ai_search' );
			if ( $ai_search_value && $this->ai_search_requires_upgrade() ) {
				return new WP_Error(
					'ai_search_requires_upgrade',
					__( 'AI-generated search answers require a paid Jetpack Search plan.', 'jetpack' ),
					array( 'status' => 403 )
				);
			}
		}

		if ( $request->has_param( 'master_enabled' ) ) {
			// Routes through the setter so the write lands on whichever store backs
			// the master on this platform: the option on Simple, the `ai` module
			// off-Simple.
			Jetpack_AI_Settings::set_master_enabled( (bool) $request->get_param( 'master_enabled' ) );
		}

		if ( is_array( $features ) ) {
			foreach ( Jetpack_AI_Settings::FEATURE_OPTIONS as $key => $option ) {
				$value = self::extract_feature_value( $features, $key );
				if ( null === $value ) {
					continue;
				}

				update_option( $option, $value );
			}
		}

		return rest_ensure_response( $this->build_settings_response() );
	}

	/**
	 * Pull one feature's value out of the `features` request param, sanitized
	 * to a bool. A feature value may be a bare boolean or an object carrying
	 * an `enabled` key. Returns null only when the key (or `enabled` sub-key)
	 * is absent — a present-but-null value still sanitizes to false, it
	 * isn't treated as absent.
	 *
	 * @param array  $features The `features` request param.
	 * @param string $key      Feature key.
	 * @return bool|null Sanitized value, or null if absent.
	 */
	private static function extract_feature_value( array $features, string $key ) {
		if ( ! array_key_exists( $key, $features ) ) {
			return null;
		}

		$value = $features[ $key ];
		if ( is_array( $value ) ) {
			if ( ! array_key_exists( 'enabled', $value ) ) {
				return null;
			}
			$value = $value['enabled'];
		}

		return rest_sanitize_boolean( $value );
	}

	/**
	 * Whether enabling AI-generated search answers requires a plan upgrade.
	 * Computed fresh from `Search_Plan`, deliberately not via the shared,
	 * memoized `Search_Blocks::supports_paid_search()` — this endpoint's own
	 * tests change plan fixtures across dispatches within one PHPUnit
	 * process, and that memo doesn't reset, which breaks them.
	 *
	 * @param Search_Plan|null $search_plan Plan instance to reuse, or null to create one.
	 * @return bool
	 */
	private function ai_search_requires_upgrade( ?Search_Plan $search_plan = null ) {
		$search_plan ??= ( class_exists( Search_Plan::class ) ? new Search_Plan() : null );
		return ! ( $search_plan && $search_plan->supports_instant_search() && ! $search_plan->is_free_plan() );
	}

	/**
	 * Assemble the full settings + gate-state payload.
	 *
	 * @return array
	 */
	private function build_settings_response() {
		$search_plan = class_exists( Search_Plan::class ) ? new Search_Plan() : null;

		// Entitlement: the plan includes some Search product (Classic or Instant).
		$supports_search = $search_plan && $search_plan->supports_search();

		// AI Answers only runs with the paid Search product provisioned. Mirror
		// the gate the Search dashboard's AI Answers tab uses for its upsell:
		// gated when the plan is free or lacks Instant Search.
		$ai_search_requires_upgrade = $this->ai_search_requires_upgrade( $search_plan );

		$stored = array();
		foreach ( Jetpack_AI_Settings::FEATURE_OPTIONS as $key => $option ) {
			$stored[ $key ] = (bool) get_option(
				$option,
				Jetpack_AI_Settings::FEATURE_DEFAULTS[ $key ]
			);
		}

		return array(
			'host_allows_ai'    => Jetpack_AI_Settings::host_allows_ai(),
			'is_connected'      => $this->is_connected(),
			'is_user_connected' => $this->is_user_connected(),
			'plan'              => array(
				'supports_ai'         => class_exists( Current_Plan::class ) && Current_Plan::supports( 'ai-assistant' ),
				'supports_search'     => $supports_search,
				// The free Search tier reports supports_search too, but its
				// remedy for the gated AI Search row is still an upgrade — the
				// settings page needs this flag to pick the right badge copy.
				'is_free_search_plan' => $supports_search && $search_plan->is_free_plan(),
			),
			'master_enabled'    => Jetpack_AI_Settings::is_master_enabled(),
			'features'          => array(
				'writing_assistant' => array( 'enabled' => $stored['writing_assistant'] ),
				'image_editor'      => array( 'enabled' => $stored['image_editor'] ),
				'feature_clip'      => array(
					'enabled'   => $stored['feature_clip'],
					'available' => $this->is_feature_clip_available(),
				),
				'ai_seo'            => array(
					'enabled'   => $stored['ai_seo'],
					'available' => $this->is_ai_seo_available(),
				),
				'ai_search'         => array(
					'enabled'          => $stored['ai_search'],
					'requires_upgrade' => $ai_search_requires_upgrade,
				),
			),
		);
	}

	/**
	 * Whether the AI SEO row is available, so the settings page can hide it.
	 * The row governs user-initiated suggestions as well as automatic
	 * generation, so it follows the package's shared AI SEO gate.
	 *
	 * Guarded with class_exists: the autoloader can pick an older jetpack-seo
	 * copy from another plugin, predating this class. Without the gate's verdict
	 * the row is hidden rather than offered.
	 *
	 * @return bool
	 */
	private function is_ai_seo_available() {
		if ( ! class_exists( Ai_Seo::class ) ) {
			return false;
		}

		return Ai_Seo::is_available();
	}

	/**
	 * Whether Feature Clip can operate on this site, so the settings page can
	 * grey out its nested row where the feature can't run.
	 *
	 * Feature Clip is nested under the image editor: it reports available only
	 * when Image Studio is enabled — the shared environment (host and master
	 * gates plus platform checks) AND the `image_editor` toggle. With the image
	 * editor off the clip row greys out rather than hides, so the settings page
	 * keys that greyed state off this field.
	 *
	 * The extension file that defines the predicate isn't loaded in every
	 * context this endpoint is (on WordPress.com the endpoint loads from the
	 * synced jetpack-endpoints directory), so a partial load defaults to
	 * available rather than greying a row that works.
	 *
	 * @return bool
	 */
	private function is_feature_clip_available() {
		if ( ! function_exists( '\Automattic\Jetpack\Extensions\ImageStudio\is_image_studio_enabled' ) ) {
			return true;
		}

		return (bool) \Automattic\Jetpack\Extensions\ImageStudio\is_image_studio_enabled();
	}

	/**
	 * Whether the site can know its plan: Simple sites always can; elsewhere a
	 * connected owner outside offline mode is required. Mirrors the connection
	 * predicate the AI feature load points use — offline mode included, since a
	 * site can hold connection tokens while offline mode keeps every AI surface
	 * from loading.
	 *
	 * @return bool
	 */
	private function is_connected() {
		return ( new Host() )->is_wpcom_simple()
			|| ( ( new Manager( 'jetpack' ) )->has_connected_owner()
				&& ! ( new Status() )->is_offline_mode() );
	}

	/**
	 * Whether the current user's own account is connected. is_connected() above
	 * is the site-level gate the feature load points share, but the editor chat
	 * keys its variant off the requesting user: the agents-manager loader
	 * downgrades to its disconnected variant when the current user holds no
	 * token, so the settings page needs this bit to tell an admin whose account
	 * is not connected that the chat will not run for them. Simple
	 * short-circuits true, matching is_connected().
	 *
	 * @return bool
	 */
	private function is_user_connected() {
		return ( new Host() )->is_wpcom_simple()
			|| ( new Manager( 'jetpack' ) )->is_user_connected();
	}
}

wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Endpoint_AI_Feature_Settings' );
