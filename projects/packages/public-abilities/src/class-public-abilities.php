<?php
/**
 * Public Abilities API.
 *
 * Exposes WordPress abilities marked as public without authentication.
 *
 * @package automattic/jetpack-public-abilities
 */

namespace Automattic\Jetpack\PublicAbilities;

use WP_Error;
use WP_REST_Request;
use WP_REST_Response;

/**
 * Provides public discovery and execution of WordPress abilities.
 */
class Public_Abilities {

	/**
	 * Initialize the public abilities feature.
	 */
	public static function init() {
		// Open permissions for abilities marked as public - must run before abilities are registered.
		add_filter( 'wp_register_ability_args', array( self::class, 'maybe_open_permissions' ), 10, 2 );

		add_action( 'rest_api_init', array( self::class, 'register_routes' ) );
		add_action( 'init', array( self::class, 'register_well_known_route' ) );

		// Add discovery hints for automated clients.
		add_action( 'send_headers', array( self::class, 'add_abilities_header' ) );
		add_action( 'wp_footer', array( self::class, 'add_abilities_footer_hint' ) );
	}

	/**
	 * Open permissions for abilities marked as public.
	 *
	 * @param array  $args The ability arguments.
	 * @param string $name The ability name.
	 * @return array Modified arguments.
	 */
	public static function maybe_open_permissions( $args, $name ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		if ( self::has_public_flag( $args['meta'] ?? array() ) ) {
			$args['permission_callback'] = '__return_true';
		}

		return $args;
	}

	/**
	 * Add HTTP header advertising abilities endpoint.
	 */
	public static function add_abilities_header() {
		if ( ! self::is_enabled() ) {
			return;
		}

		// Only add if there are public abilities.
		if ( empty( self::get_public_abilities() ) ) {
			return;
		}

		header( 'X-Abilities-Endpoint: ' . rest_url( 'jetpack/v1/abilities' ) );
	}

	/**
	 * Add footer hint for automated clients.
	 */
	public static function add_abilities_footer_hint() {
		if ( ! self::is_enabled() ) {
			return;
		}

		// Only show to automated clients.
		if ( ! self::is_automated_request() ) {
			return;
		}

		// Only add if there are public abilities.
		$abilities = self::get_public_abilities();
		if ( empty( $abilities ) ) {
			return;
		}

		$endpoint = rest_url( 'jetpack/v1/abilities' );
		$count    = count( $abilities );

		printf(
			'<p class="jetpack-abilities-hint">This site exposes %d public %s. GET %s for available actions and their endpoints.</p>',
			(int) $count,
			$count === 1 ? 'ability' : 'abilities',
			esc_url( $endpoint )
		);
	}

	/**
	 * Check if current request is from an automated client.
	 *
	 * @return bool
	 */
	private static function is_automated_request() {
		if ( class_exists( '\Automattic\Jetpack\Device_Detection\User_Agent_Info' ) ) {
			return \Automattic\Jetpack\Device_Detection\User_Agent_Info::is_automated_client();
		}

		// Fallback if device-detection package not available.
		if ( empty( $_SERVER['HTTP_USER_AGENT'] ) ) {
			return false;
		}

		$user_agent = strtolower( sanitize_text_field( wp_unslash( $_SERVER['HTTP_USER_AGENT'] ) ) );
		$patterns   = array( 'curl', 'wget', 'python', 'axios', 'node-fetch', 'chatgpt', 'claude', 'gptbot' );

		foreach ( $patterns as $pattern ) {
			if ( str_contains( $user_agent, $pattern ) ) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Check if the public abilities feature is enabled.
	 *
	 * @return bool
	 */
	public static function is_enabled() {
		/**
		 * Filter to enable/disable the public abilities feature.
		 *
		 * @param bool $enabled Whether the feature is enabled. Default false.
		 */
		return apply_filters( 'jetpack_public_abilities_enabled', false );
	}

	/**
	 * Register REST API routes.
	 */
	public static function register_routes() {
		if ( ! self::is_enabled() ) {
			return;
		}

		// List public abilities.
		register_rest_route(
			'jetpack/v1',
			'/abilities',
			array(
				'methods'             => 'GET',
				'callback'            => array( self::class, 'list_abilities' ),
				'permission_callback' => '__return_true',
			)
		);

		// Execute a public ability.
		register_rest_route(
			'jetpack/v1',
			'/abilities/(?P<name>[a-zA-Z0-9_\-\/]+)/run',
			array(
				'methods'             => 'POST',
				'callback'            => array( self::class, 'run_ability' ),
				'permission_callback' => '__return_true',
				'args'                => array(
					'name'  => array(
						'required'          => true,
						'type'              => 'string',
						'description'       => __( 'The ability name/slug', 'jetpack-public-abilities' ),
						'sanitize_callback' => 'sanitize_text_field',
					),
					'input' => array(
						'required'    => false,
						'description' => __( 'Input data for the ability', 'jetpack-public-abilities' ),
					),
				),
			)
		);
	}

	/**
	 * Register .well-known/abilities.json rewrite.
	 */
	public static function register_well_known_route() {
		if ( ! self::is_enabled() ) {
			return;
		}

		add_rewrite_rule(
			'^\.well-known/abilities\.json$',
			'index.php?jetpack_abilities_discovery=1',
			'top'
		);

		add_filter( 'query_vars', array( self::class, 'add_query_vars' ) );
		add_action( 'template_redirect', array( self::class, 'handle_well_known' ) );
	}

	/**
	 * Add query vars for .well-known route.
	 *
	 * @param array $vars Query vars.
	 * @return array
	 */
	public static function add_query_vars( $vars ) {
		$vars[] = 'jetpack_abilities_discovery';
		return $vars;
	}

	/**
	 * Handle .well-known/abilities.json request.
	 */
	public static function handle_well_known() {
		if ( ! get_query_var( 'jetpack_abilities_discovery' ) ) {
			return;
		}

		// Allow cross-origin requests for discovery.
		header( 'Access-Control-Allow-Origin: *' );

		$response = array(
			'schema_version' => '1.0',
			'name'           => get_bloginfo( 'name' ),
			'description'    => get_bloginfo( 'description' ),
			'url'            => home_url(),
			'api_base'       => rest_url( 'jetpack/v1/abilities' ),
			'abilities'      => array_map( array( self::class, 'format_ability_data' ), self::get_public_abilities() ),
		);

		wp_send_json( $response, null, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES );
	}

	/**
	 * List public abilities.
	 *
	 * @param WP_REST_Request $request The request.
	 * @return WP_REST_Response
	 */
	public static function list_abilities( WP_REST_Request $request ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$data = array(
			'site'      => array(
				'name'        => get_bloginfo( 'name' ),
				'description' => get_bloginfo( 'description' ),
				'url'         => home_url(),
			),
			'abilities' => array_map( array( self::class, 'format_ability_data' ), self::get_public_abilities() ),
		);

		return new WP_REST_Response( $data, 200 );
	}

	/**
	 * Run a public ability.
	 *
	 * @param WP_REST_Request $request The request.
	 * @return WP_REST_Response|WP_Error
	 */
	public static function run_ability( WP_REST_Request $request ) {
		$name  = $request->get_param( 'name' );
		$input = $request->get_param( 'input' );

		// Check if ability exists.
		if ( ! function_exists( 'wp_has_ability' ) || ! wp_has_ability( $name ) ) {
			return new WP_Error(
				'ability_not_found',
				__( 'Ability not found', 'jetpack-public-abilities' ),
				array( 'status' => 404 )
			);
		}

		$ability = wp_get_ability( $name );

		// Check if ability is public.
		if ( ! self::is_ability_public( $ability ) ) {
			return new WP_Error(
				'ability_not_public',
				__( 'This ability is not available for public access', 'jetpack-public-abilities' ),
				array( 'status' => 403 )
			);
		}

		// Execute the ability.
		$result = $ability->execute( $input );

		if ( is_wp_error( $result ) ) {
			return new WP_Error(
				'ability_execution_failed',
				$result->get_error_message(),
				array( 'status' => 500 )
			);
		}

		return new WP_REST_Response(
			array(
				'success' => true,
				'ability' => $name,
				'result'  => $result,
			),
			200
		);
	}

	/**
	 * Get all public abilities.
	 *
	 * @return array Array of WP_Ability objects marked as public.
	 */
	private static function get_public_abilities() {
		if ( ! function_exists( 'wp_get_abilities' ) ) {
			return array();
		}

		$all_abilities = wp_get_abilities();
		$public        = array();

		foreach ( $all_abilities as $ability ) {
			if ( self::is_ability_public( $ability ) ) {
				$public[] = $ability;
			}
		}

		return $public;
	}

	/**
	 * Check if an ability is marked as public.
	 *
	 * @param object $ability The ability object.
	 * @return bool
	 */
	private static function is_ability_public( $ability ) {
		if ( self::has_public_flag( $ability->get_meta() ) ) {
			return true;
		}

		/**
		 * Filter to determine if a specific ability should be public.
		 *
		 * @param bool   $is_public Whether the ability is public.
		 * @param object $ability   The ability object.
		 */
		return apply_filters( 'jetpack_is_ability_public', false, $ability );
	}

	/**
	 * Check if meta array has a public flag set.
	 *
	 * @param array $meta The meta array to check.
	 * @return bool
	 */
	private static function has_public_flag( $meta ) {
		return ! empty( $meta['mcp']['public'] ) || ! empty( $meta['public'] );
	}

	/**
	 * Format ability object into array for API response.
	 *
	 * @param object $ability The ability object.
	 * @return array Formatted ability data.
	 */
	private static function format_ability_data( $ability ) {
		return array(
			'name'        => $ability->get_name(),
			'label'       => $ability->get_label(),
			'description' => $ability->get_description(),
			'category'    => $ability->get_category(),
			'endpoint'    => rest_url( 'jetpack/v1/abilities/' . $ability->get_name() . '/run' ),
			'input'       => $ability->get_input_schema(),
			'annotations' => $ability->get_meta()['annotations'] ?? array(),
		);
	}
}
