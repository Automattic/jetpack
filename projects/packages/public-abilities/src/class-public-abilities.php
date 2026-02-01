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
	 * Hook into WordPress.
	 */
	public static function init() {
		add_action( 'rest_api_init', array( __CLASS__, 'register_routes' ) );
		add_action( 'wp_footer', array( __CLASS__, 'render_bot_discovery' ) );
	}

	/**
	 * Render a visible discovery section for bots so they can find the abilities API.
	 *
	 * Only output when the request comes from a bot user-agent, keeping it
	 * invisible to regular visitors.
	 */
	public static function render_bot_discovery() {
		if ( ! self::is_bot_request() ) {
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
	 * Check if the current request is from a bot.
	 *
	 * Uses WordPress core is_bot() when available, otherwise falls back
	 * to a simple user-agent check.
	 *
	 * @return bool
	 */
	private static function is_bot_request(): bool {
		// phpcs:ignore WordPress.WP.CapitalPDangit.Misspelled -- function name check
		if ( function_exists( 'is_bot' ) ) {
			return is_bot();
		}

		$ua = isset( $_SERVER['HTTP_USER_AGENT'] ) ? sanitize_text_field( wp_unslash( $_SERVER['HTTP_USER_AGENT'] ) ) : '';
		if ( empty( $ua ) ) {
			return false;
		}

		$bot_patterns = array( 'googlebot', 'bingbot', 'claudebot', 'gptbot', 'chatgpt-user', 'anthropic', 'crawl', 'spider', 'slurp', 'facebookexternalhit', 'applebot' );
		$ua_lower     = strtolower( $ua );
		foreach ( $bot_patterns as $pattern ) {
			if ( strpos( $ua_lower, $pattern ) !== false ) {
				return true;
			}
		}

		return false;
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
							if ( ! is_array( $value ) && ! is_object( $value ) ) {
								return new WP_Error(
									'invalid_input',
									__( 'Input must be a JSON object.', 'jetpack-public-abilities' ),
									array( 'status' => 400 )
								);
							}
							return true;
						},
						'sanitize_callback' => function ( $value ) {
							return is_array( $value ) ? map_deep( $value, 'sanitize_text_field' ) : $value;
						},
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
			array_map( array( __CLASS__, 'format_ability' ), $abilities )
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
		 * Plugins can use this to implement rate limiting or other restrictions.
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

		$permission = $ability->check_permissions( $input );
		if ( is_wp_error( $permission ) ) {
			return $permission;
		}
		if ( ! $permission ) {
			return new WP_Error(
				'ability_forbidden',
				__( 'Permission denied.', 'jetpack-public-abilities' ),
				array( 'status' => 403 )
			);
		}

		$result = $ability->execute( $input );
		if ( is_wp_error( $result ) ) {
			return $result;
		}

		return new WP_REST_Response( $result );
	}

	/**
	 * Get abilities that have the `public` annotation set to true.
	 *
	 * @return array<string, WP_Ability> Keyed by ability name.
	 */
	public static function get_public_abilities(): array {
		if ( ! function_exists( 'wp_get_abilities' ) ) {
			return array();
		}

		$public = array();
		foreach ( wp_get_abilities() as $ability ) {
			$meta        = $ability->get_meta();
			$annotations = $meta['annotations'] ?? array();

			if ( ! empty( $annotations['public'] ) ) {
				$public[ $ability->get_name() ] = $ability;
			}
		}

		return $public;
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
