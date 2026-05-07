<?php
/**
 * Activity Log custom event support.
 *
 * @package automattic/jetpack-sync
 */

namespace Automattic\Jetpack\Sync;

/**
 * Handles Activity Log custom event creation and validation.
 */
class Activity_Log_Event {

	/**
	 * Post type name for Activity Log custom entries.
	 */
	const POST_TYPE = 'jp_act_log_event';

	/**
	 * Default event severity.
	 */
	const DEFAULT_SEVERITY = 'info';

	/**
	 * Allowed event severities.
	 */
	const ALLOWED_SEVERITIES = array(
		'info'    => true,
		'success' => true,
		'warning' => true,
		'error'   => true,
	);

	/**
	 * Maximum title length.
	 */
	const MAX_TITLE_LENGTH = 200;

	/**
	 * Maximum content length.
	 */
	const MAX_CONTENT_LENGTH = 5000;

	/**
	 * Maximum source length.
	 */
	const MAX_SOURCE_LENGTH = 100;

	/**
	 * Initialize Activity Log custom event hooks.
	 */
	public static function init() {
		add_action( 'init', array( __CLASS__, 'register_post_type' ) );
		add_filter( 'publicize_should_publicize_published_post', array( __CLASS__, 'prevent_publicize' ), 10, 2 );
		add_filter( 'jetpack_sitemap_post_types', array( __CLASS__, 'filter_sitemap_post_types' ) );
	}

	/**
	 * Registers the Activity Log CPT with hardened defaults that prevent leakage
	 * to front-end queries, RSS, REST, search, sitemaps, and exports.
	 */
	public static function register_post_type() {
		register_post_type(
			self::POST_TYPE,
			array(
				'labels'              => array(
					'name'          => __( 'Activity Log Events', 'jetpack-sync' ),
					'singular_name' => __( 'Activity Log Event', 'jetpack-sync' ),
				),
				'public'              => false,
				'publicly_queryable'  => false,
				'show_ui'             => false,
				'show_in_menu'        => false,
				'show_in_nav_menus'   => false,
				'show_in_rest'        => false,
				'show_in_admin_bar'   => false,
				'exclude_from_search' => true,
				'has_archive'         => false,
				'rewrite'             => false,
				'query_var'           => false,
				'can_export'          => false,
				'supports'            => array( 'title', 'editor' ),
			)
		);
	}

	/**
	 * Logs a custom event to the Jetpack Activity Log.
	 *
	 * @param array $args {
	 *     Activity log event arguments.
	 *
	 *     @type string $title       Required. Plain-text title, truncated to 200 chars.
	 *     @type string $content     Required. Plain-text body, truncated to 5000 chars.
	 *     @type string $source      Optional. Identifier for the source of the event, e.g. 'mc'.
	 *     @type string $severity    Optional. 'info', 'success', 'warning', or 'error'. Defaults to 'info'.
	 * }
	 * @return int|false Post ID on success, false if validation fails.
	 */
	public static function create( array $args ) {
		$payload = self::build_payload( $args );
		if ( false === $payload ) {
			return false;
		}

		$post_id = wp_insert_post(
			wp_slash(
				array(
					'post_type'    => self::POST_TYPE,
					'post_title'   => $payload['title'],
					'post_content' => wp_json_encode( $payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE ),
					'post_status'  => 'publish',
				)
			),
			true
		);

		return is_wp_error( $post_id ) ? false : $post_id;
	}

	/**
	 * Checks that an Activity Log custom event has the minimum payload shape before enqueueing it for sync,
	 * in case data bypasses the Activity_Log_Event::create() helper.
	 *
	 * @param \WP_Post $post Activity Log post.
	 * @return bool
	 */
	public static function is_valid_post( $post ) {
		if ( ! $post instanceof \WP_Post || self::POST_TYPE !== $post->post_type ) {
			return false;
		}

		$data = json_decode( $post->post_content, true );
		if ( ! is_array( $data ) ) {
			$data = json_decode( wp_unslash( $post->post_content ), true );
		}

		if ( ! is_array( $data ) ) {
			return false;
		}

		foreach ( array( 'title', 'content' ) as $field ) {
			if (
				! isset( $data[ $field ] )
				|| is_array( $data[ $field ] )
				|| is_object( $data[ $field ] )
				|| '' === trim( (string) $data[ $field ] )
			) {
				return false;
			}
		}

		return true;
	}

	/**
	 * Never auto-share Activity Log entries via Jetpack Social,
	 * even if a third party adds 'publicize' post-type support to this CPT.
	 *
	 * @param bool     $should_publicize Publicize status prior to this filter running.
	 * @param \WP_Post $post             The post to test for Publicizability.
	 * @return bool
	 */
	public static function prevent_publicize( $should_publicize, $post ) {
		return ( $post && self::POST_TYPE === $post->post_type ) ? false : $should_publicize;
	}

	/**
	 * Never include Activity Log entries in Jetpack sitemaps,
	 * even if a third party adds this CPT to the sitemap post-type list.
	 *
	 * @param string[] $types Sitemap post types.
	 * @return string[]
	 */
	public static function filter_sitemap_post_types( $types ) {
		return array_diff( (array) $types, array( self::POST_TYPE ) );
	}

	/**
	 * Builds an Activity Log event payload from raw input.
	 *
	 * @param array $args Raw event arguments.
	 * @return array|false Sanitized payload, or false if validation fails.
	 */
	private static function build_payload( array $args ) {
		$title   = self::sanitize_string( $args['title'] ?? '', self::MAX_TITLE_LENGTH );
		$content = self::sanitize_string( $args['content'] ?? '', self::MAX_CONTENT_LENGTH );

		if ( '' === $title || '' === $content ) {
			return false;
		}

		$severity = self::sanitize_severity( $args['severity'] ?? self::DEFAULT_SEVERITY );
		if ( false === $severity ) {
			return false;
		}

		$payload = array(
			'title'    => $title,
			'content'  => $content,
			'severity' => $severity,
		);

		$source = self::sanitize_string( $args['source'] ?? '', self::MAX_SOURCE_LENGTH );
		if ( '' !== $source ) {
			$payload['source'] = $source;
		}

		return $payload;
	}

	/**
	 * Strips HTML/PHP from a value and truncates it to a maximum character length, multibyte-safe.
	 *
	 * @param mixed $value Raw value.
	 * @param int   $max   Maximum length in characters.
	 * @return string
	 */
	private static function sanitize_string( $value, $max ) {
		if ( is_array( $value ) || is_object( $value ) ) {
			return '';
		}

		$value = wp_strip_all_tags( (string) $value, true );
		$value = trim( preg_replace( '/[^\P{C}\t\r\n]/u', '', $value ) );

		if ( function_exists( 'mb_substr' ) ) {
			return mb_substr( $value, 0, $max );
		}

		return substr( $value, 0, $max );
	}

	/**
	 * Sanitizes an Activity Log severity value.
	 *
	 * @param mixed $severity Raw severity.
	 * @return string|false Sanitized severity, or false if invalid.
	 */
	private static function sanitize_severity( $severity ) {
		if ( is_array( $severity ) || is_object( $severity ) ) {
			return false;
		}

		$severity = strtolower( trim( (string) $severity ) );
		if ( '' === $severity ) {
			return self::DEFAULT_SEVERITY;
		}

		return isset( self::ALLOWED_SEVERITIES[ $severity ] ) ? $severity : false;
	}
}
