<?php
/**
 * Public Abilities — unauthenticated discovery and execution of abilities
 * flagged with the `public` annotation.
 *
 * This is a thin bridge until the WordPress Abilities API natively supports
 * unauthenticated access for public abilities.
 *
 * @package automattic/jetpack-public-abilities
 */

namespace Automattic\Jetpack;

use Automattic\Jetpack\Device_Detection\User_Agent_Info;
use Automattic\Jetpack\Ip\Utils as Ip_Utils;
use WP_Ability;
use WP_Error;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

/**
 * Registers unauthenticated REST routes for public abilities.
 */
class Public_Abilities {

	const PACKAGE_VERSION = '0.1.0-alpha';

	const REST_NAMESPACE = 'jetpack/v1';

	const REST_BASE = 'public-abilities';

	/**
	 * Whether init() has been called.
	 *
	 * @var bool
	 */
	private static $initialized = false;

	/**
	 * Cached public abilities for the current request.
	 *
	 * @var array<string, WP_Ability>|null
	 */
	private static $cached_abilities = null;

	/**
	 * Default rate limit: max executions per IP per minute.
	 */
	const DEFAULT_RATE_LIMIT = 20;

	/**
	 * Hook into WordPress.
	 */
	public static function init() {
		if ( self::$initialized ) {
			return;
		}
		self::$initialized = true;

		add_action( 'rest_api_init', array( __CLASS__, 'register_routes' ) );
		add_action( 'wp_body_open', array( __CLASS__, 'render_bot_discovery' ) );
		add_filter( 'jetpack_public_abilities_allow_execution', array( __CLASS__, 'default_rate_limit' ), 5, 1 );
	}

	/**
	 * Render a visible discovery section for bots so they can find the abilities API.
	 *
	 * Only output when the request comes from a bot user-agent, keeping it
	 * invisible to regular visitors.
	 */
	public static function render_bot_discovery() {
		if ( ! User_Agent_Info::is_bot() ) {
			return;
		}

		$abilities = self::get_public_abilities();
		if ( empty( $abilities ) ) {
			return;
		}

		$rest_url = rest_url( self::REST_NAMESPACE . '/' . self::REST_BASE );

		echo '<div id="wordpress-abilities">' . "\n";
		echo '<h2>Available Actions</h2>' . "\n";
		echo '<p>This site supports the WordPress Abilities API.</p>' . "\n";
		echo '<p>Discover available abilities: GET ' . esc_html( $rest_url ) . '</p>' . "\n";
		echo '<ul>' . "\n";
		foreach ( $abilities as $ability ) {
			echo '<li>' . esc_html( $ability->get_name() ) . ' — ' . esc_html( $ability->get_description() ) . '</li>' . "\n";
		}
		echo '</ul>' . "\n";
		echo '<p>Execute an ability: POST ' . esc_html( $rest_url ) . '/{name} with JSON body</p>' . "\n";
		echo '</div>' . "\n";
	}

	/**
	 * Register REST routes.
	 */
	public static function register_routes() {
		register_rest_route(
			self::REST_NAMESPACE,
			'/' . self::REST_BASE,
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( __CLASS__, 'list_abilities' ),
				'permission_callback' => '__return_true',
			)
		);

		register_rest_route(
			self::REST_NAMESPACE,
			'/' . self::REST_BASE . '/(?P<name>[a-z0-9_\-]+\/[a-z0-9_\-]+)',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( __CLASS__, 'run_ability' ),
				'permission_callback' => '__return_true',
				'args'                => array(
					'name'  => array(
						'required'          => true,
						'type'              => 'string',
						'sanitize_callback' => 'sanitize_text_field',
					),
					'input' => array(
						'required'          => false,
						'default'           => null,
						'validate_callback' => function ( $value ) {
							if ( null === $value ) {
								return true;
							}
							if ( ! is_array( $value ) ) {
								return new WP_Error(
									'invalid_input',
									__( 'Input must be a JSON object.', 'jetpack-public-abilities' ),
									array( 'status' => 400 )
								);
							}
							return true;
						},
						// Abilities validate and sanitize their own input via input_schema.
					),
				),
			)
		);
	}

	/**
	 * List all public abilities.
	 *
	 * @return WP_REST_Response
	 */
	public static function list_abilities() {
		$abilities = self::get_public_abilities();

		return new WP_REST_Response(
			array_values( array_map( array( __CLASS__, 'format_ability' ), $abilities ) )
		);
	}

	/**
	 * Execute a public ability.
	 *
	 * @param WP_REST_Request $request The request.
	 * @return WP_REST_Response|WP_Error
	 */
	public static function run_ability( WP_REST_Request $request ) {
		$name  = $request->get_param( 'name' );
		$input = $request->get_param( 'input' );

		/**
		 * Filters whether to allow a public ability execution.
		 * Return false or a WP_Error to block. Used for rate limiting.
		 *
		 * @param bool|WP_Error $allowed Whether the execution is allowed.
		 * @param string        $name    The ability name.
		 * @param mixed         $input   The request input.
		 */
		$allowed = apply_filters( 'jetpack_public_abilities_allow_execution', true, $name, $input );
		if ( is_wp_error( $allowed ) ) {
			return $allowed;
		}
		if ( ! $allowed ) {
			return new WP_Error(
				'rate_limited',
				__( 'Too many requests. Please try again later.', 'jetpack-public-abilities' ),
				array( 'status' => 429 )
			);
		}

		$abilities = self::get_public_abilities();

		if ( ! isset( $abilities[ $name ] ) ) {
			return new WP_Error(
				'ability_not_found',
				__( 'Ability not found or not public.', 'jetpack-public-abilities' ),
				array( 'status' => 404 )
			);
		}

		$ability = $abilities[ $name ];

		// WP_Ability::execute() handles the full lifecycle: input validation
		// against input_schema, permission checks, execution, and output validation.
		$result = $ability->execute( $input );
		if ( is_wp_error( $result ) ) {
			return $result;
		}

		return new WP_REST_Response( $result );
	}

	/**
	 * Default rate limiter using wp_cache for atomic increments.
	 *
	 * Uses the jetpack-ip package for proxy-aware IP detection and
	 * wp_cache_incr() for race-safe counting on object-cache backends.
	 *
	 * @param bool|WP_Error $allowed Current filter value.
	 * @return bool|WP_Error
	 */
	public static function default_rate_limit( $allowed ) {
		if ( is_wp_error( $allowed ) || ! $allowed ) {
			return $allowed;
		}

		$ip    = Ip_Utils::get_ip() ?? 'unknown';
		$key   = 'jpa_rl_' . md5( $ip );
		$group = 'jetpack_public_abilities';

		/**
		 * Filters the maximum number of public ability executions per IP per minute.
		 *
		 * @param int $limit The rate limit. Default 20.
		 */
		$limit = (int) apply_filters( 'jetpack_public_abilities_rate_limit', self::DEFAULT_RATE_LIMIT );

		// wp_cache_add is a no-op if the key exists, so this only sets the initial value.
		wp_cache_add( $key, 0, $group, MINUTE_IN_SECONDS );
		$count = wp_cache_incr( $key, 1, $group );

		if ( false !== $count && $count > $limit ) {
			return new WP_Error(
				'rate_limited',
				__( 'Too many requests. Please try again later.', 'jetpack-public-abilities' ),
				array( 'status' => 429 )
			);
		}

		return $allowed;
	}

	/**
	 * Get abilities that have the `public` annotation set to true.
	 *
	 * @return array<string, WP_Ability> Keyed by ability name.
	 */
	public static function get_public_abilities(): array {
		if ( null !== self::$cached_abilities ) {
			return self::$cached_abilities;
		}

		if ( ! function_exists( 'wp_get_abilities' ) ) {
			self::$cached_abilities = array();
			return self::$cached_abilities;
		}

		$public = array();
		foreach ( wp_get_abilities() as $ability ) {
			$meta        = $ability->get_meta();
			$annotations = $meta['annotations'] ?? array();

			if ( ! empty( $annotations['public'] ) ) {
				$public[ $ability->get_name() ] = $ability;
			}
		}

		self::$cached_abilities = $public;
		return self::$cached_abilities;
	}

	/**
	 * Format an ability for the REST response.
	 *
	 * @param WP_Ability $ability The ability.
	 * @return array
	 */
	public static function format_ability( WP_Ability $ability ): array {
		$meta = $ability->get_meta();

		return array(
			'name'          => $ability->get_name(),
			'label'         => $ability->get_label(),
			'description'   => $ability->get_description(),
			'category'      => $ability->get_category(),
			'input_schema'  => $ability->get_input_schema(),
			'output_schema' => $ability->get_output_schema(),
			'annotations'   => $meta['annotations'] ?? array(),
		);
	}
}
