<?php
/**
 * Agents manager
 *
 * @package automattic/jetpack-mu-wpcom
 */

namespace A8C\FSE;

use Automattic\Jetpack\Connection\Manager as Connection_Manager;

/**
 * Class Agents_Manager
 */
class Agents_Manager {
	/**
	 * Class instance.
	 *
	 * @var Agents_Manager
	 */
	private static $instance = null;

	/**
	 * Agents_Manager constructor.
	 */
	public function __construct() {
		add_action( 'rest_api_init', array( $this, 'register_rest_api' ) );
		add_filter( 'calypso_preferences_update', array( $this, 'calypso_preferences_update' ) );
		add_action( 'admin_enqueue_scripts', array( $this, 'add_inline_script' ), 101 );
		add_action( 'wp_enqueue_scripts', array( $this, 'add_inline_script' ), 101 );
		add_action( 'next_admin_init', array( $this, 'add_inline_script' ), 1001 );
		add_filter( 'agents_manager_use_unified_experience', array( $this, 'should_use_unified_experience' ) );
	}

	/**
	 * Add inline script data for the Agents Manager.
	 */
	public function add_inline_script() {
		/**
		 * Filter to register agent provider modules for the Agents Manager.
		 *
		 * Plugins can hook into this filter to register script module IDs that export
		 * toolProvider and/or contextProvider. The Agents Manager JS will dynamically
		 * import these modules and merge their providers.
		 *
		 * @param array $providers Array of provider script module IDs.
		 */
		$agent_providers = apply_filters( 'agents_manager_agent_providers', array() );

		/**
		 * Filter to determine if user should see the unified chat experience.
		 *
		 * When true, Help Center will render UnifiedAIAgent instead of traditional UI.
		 * The filter is hooked by should_use_unified_experience() in this class.
		 *
		 * @param bool $use_unified_experience Whether to use unified experience. Default false.
		 */
		$use_unified_experience = apply_filters( 'agents_manager_use_unified_experience', false );

		// For now, we want this added wherever the help-center script is enqueued.
		// This allows us to be quite blunt here because the logic for whether to inject this is currently
		// in the help-center script.
		wp_add_inline_script(
			'help-center',
			'const agentsManagerData = ' . wp_json_encode(
				array(
					'agentProviders'       => $agent_providers,
					'useUnifiedExperience' => $use_unified_experience,
				),
				JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP
			) . ';',
			'before'
		);
	}

	/**
	 * Update the calypso preferences.
	 *
	 * @param \stdClass $preferences The preferences.
	 *
	 * @return \stdClass The preferences.
	 */
	public function calypso_preferences_update( $preferences ) {
		// Check if agents_manager_router_history exists and is a valid array structure
		if ( ! isset( $preferences->agents_manager_router_history ) ||
			! is_array( $preferences->agents_manager_router_history ) ) {
			return $preferences;
		}

		$router_history = $preferences->agents_manager_router_history;

		// Check if entries exist and is an array
		if ( ! isset( $router_history['entries'] ) ||
			! is_array( $router_history['entries'] ) ) {
			return $preferences;
		}

		$entries = $router_history['entries'];

		// Limit entries to 50 to prevent spamming entries in the router history.
		if ( count( $entries ) > 50 ) {
			// Keep only the last 49 entries and add the root entry at the beginning.
			$entries = array_slice( $entries, -49 );
			// Keep the start at root so the back button always works.
			array_unshift(
				$entries,
				array(
					'pathname' => '/',
					'search'   => '',
					'hash'     => '',
					'key'      => 'default',
					'state'    => null,
				)
			);

			// Update the preferences object directly
			$preferences->agents_manager_router_history['entries'] = $entries;
			$preferences->agents_manager_router_history['index']   = 49;
		}

		return $preferences;
	}

	/**
	 * Creates instance.
	 *
	 * @return void
	 */
	public static function init() {
		if ( self::$instance === null ) {
			self::$instance = new self();
		}
	}

	/**
	 * Returns whether the current request is coming from the A8C proxy.
	 *
	 * @return bool
	 */
	private static function is_proxied() {
		// On Simple sites, use the wpcom function if available.
		if ( function_exists( 'wpcom_is_proxied_request' ) ) {
			return wpcom_is_proxied_request();
		}

		// On WoA/Garden sites, check server variable or constant.
		return isset( $_SERVER['A8C_PROXIED_REQUEST'] )
			? sanitize_text_field( wp_unslash( $_SERVER['A8C_PROXIED_REQUEST'] ) )
			: defined( 'A8C_PROXIED_REQUEST' ) && A8C_PROXIED_REQUEST;
	}

	/**
	 * Register the Agents Manager endpoints.
	 */
	public function register_rest_api() {
		require_once __DIR__ . '/class-wp-rest-agents-manager-persisted-open-state.php';
		$controller = new WP_REST_Agents_Manager_Persisted_Open_State();
		$controller->register_rest_route();
	}

	/**
	 * Determine if user should see unified experience.
	 *
	 * @return bool
	 */
	public function should_use_unified_experience() {
		// Early return for non-proxied requests.
		// This feature is currently only available to Automattic employees testing via proxy.
		if ( ! self::is_proxied() ) {
			return false;
		}

		$user_id = get_current_user_id();

		if ( ! $user_id ) {
			return false;
		}

		$is_simple_site = ( new \Automattic\Jetpack\Status\Host() )->is_wpcom_simple();
		if ( $is_simple_site ) {
			// On Simple sites, evaluate locally.
			// Check Automattician and opt-in setting.
			$is_automattician = function_exists( '\is_automattician' ) && \is_automattician( $user_id );
			if ( $is_automattician && $this->has_unified_chat_opt_in_enabled( $user_id ) ) {
				return true;
			}
		}

		// On WoA and Garden sites, delegate to wpcom via the /me/preferences endpoint.
		// This avoids duplicating rollout logic and handles cases where
		// wpcom-specific functions (like get_user_attribute) aren't available.
		if ( $this->fetch_unified_experience_preference() ) {
			return true;
		}

		// False, for now.
		// In the future: users with a big sky site (similar to https://github.a8c.com/Automattic/wpcom/pull/196449/files), a big-sky free trial or a paid plan.
		return false;
	}

	/**
	 * Check if user has enabled unified chat opt-in in their Automattician options.
	 *
	 * This checks the unified_ai_chat calypso preference set via the wpcom profile settings.
	 * Only used on Simple sites where get_user_attribute is available.
	 *
	 * @param int $user_id User ID.
	 *
	 * @return bool
	 */
	private function has_unified_chat_opt_in_enabled( $user_id ) {
		if ( ! function_exists( '\get_user_attribute' ) ) {
			return false;
		}

		$calypso_prefs = \get_user_attribute( $user_id, 'calypso_preferences' );
		return ! empty( $calypso_prefs['unified_ai_chat'] );
	}

	/**
	 * Fetch unified experience preference from wpcom via Jetpack Connection.
	 *
	 * Used on Atomic sites to delegate the decision to wpcom, which has
	 * access to user attributes and can evaluate the rollout logic.
	 *
	 * Calls /me/preferences endpoint which is accessible via Jetpack user tokens.
	 *
	 * @return bool Whether user should see unified experience.
	 */
	private function fetch_unified_experience_preference() {
		$user_id = get_current_user_id();
		if ( ! $user_id ) {
			return false;
		}

		// Check transient cache first (per-user cache).
		$cache_key     = 'unified-experience-' . $user_id;
		$cached_result = get_transient( $cache_key );
		if ( false !== $cached_result ) {
			return (bool) $cached_result;
		}

		// Check if user is connected before making API call.
		if ( ! ( new Connection_Manager() )->is_user_connected( $user_id ) ) {
			return false;
		}

		// Call /me/preferences via wpcom/v2 namespace (works with Jetpack user tokens).
		$wpcom_request = \Automattic\Jetpack\Connection\Client::wpcom_json_api_request_as_user(
			'/me/preferences?preference_key=unified_ai_chat',
			'2',
			array( 'method' => 'GET' )
		);

		if ( is_wp_error( $wpcom_request ) ) {
			// Cache failures too to avoid hammering the API.
			set_transient( $cache_key, 0, MINUTE_IN_SECONDS );
			return false;
		}

		$response_code = wp_remote_retrieve_response_code( $wpcom_request );
		if ( 200 !== $response_code ) {
			set_transient( $cache_key, 0, MINUTE_IN_SECONDS );
			return false;
		}

		$body         = wp_remote_retrieve_body( $wpcom_request );
		$decoded_body = json_decode( $body, true );

		// The response is the value of the preference directly when using preference_key.
		$result = ! empty( $decoded_body );

		// Cache for 1 minute.
		set_transient( $cache_key, $result ? 1 : 0, MINUTE_IN_SECONDS );

		return $result;
	}
}

add_action( 'init', array( __NAMESPACE__ . '\Agents_Manager', 'init' ) );
