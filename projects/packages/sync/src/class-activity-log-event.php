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
	 * REST base for the Activity Log event post type.
	 */
	const REST_BASE = 'activity-log-events';

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
	 * Whether Activity Log custom event hooks have been initialized.
	 *
	 * @var bool
	 */
	private static $initialized = false;

	/**
	 * Initialize Activity Log custom event hooks.
	 */
	public static function init() {
		if ( self::$initialized ) {
			return;
		}

		self::$initialized = true;

		add_action( 'init', array( __CLASS__, 'register_post_type' ) );
		add_filter( 'rest_request_before_callbacks', array( __CLASS__, 'authorize_rest_request' ), 10, 3 );
		add_filter( 'rest_pre_insert_' . self::POST_TYPE, array( __CLASS__, 'normalize_rest_post' ), 10, 2 );
		add_filter( 'wp_insert_post_empty_content', array( __CLASS__, 'prevent_invalid_post_insert' ), 10, 2 );
		add_filter( 'wp_insert_post_data', array( __CLASS__, 'normalize_post_data' ), 10, 2 );
		add_filter( 'publicize_should_publicize_published_post', array( __CLASS__, 'prevent_publicize' ), 10, 2 );
		add_filter( 'jetpack_sitemap_post_types', array( __CLASS__, 'filter_sitemap_post_types' ) );
	}

	/**
	 * Registers the Activity Log CPT with hardened defaults that prevent leakage
	 * to front-end queries, RSS, search, sitemaps, and exports.
	 */
	public static function register_post_type() {
		if ( post_type_exists( self::POST_TYPE ) ) {
			return;
		}

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
				'show_in_rest'        => true,
				'rest_base'           => self::REST_BASE,
				'show_in_admin_bar'   => false,
				'exclude_from_search' => true,
				'has_archive'         => false,
				'rewrite'             => false,
				'query_var'           => false,
				'can_export'          => false,
				'capability_type'     => array( 'activity_log_event', 'activity_log_events' ),
				'map_meta_cap'        => true,
				'capabilities'        => array(
					'read'                   => 'manage_options',
					'read_private_posts'     => 'manage_options',
					'create_posts'           => 'manage_options',
					'publish_posts'          => 'manage_options',

					'edit_posts'             => 'do_not_allow',
					'edit_others_posts'      => 'do_not_allow',
					'edit_private_posts'     => 'do_not_allow',
					'edit_published_posts'   => 'do_not_allow',

					'delete_posts'           => 'do_not_allow',
					'delete_others_posts'    => 'do_not_allow',
					'delete_private_posts'   => 'do_not_allow',
					'delete_published_posts' => 'do_not_allow',
				),
				'supports'            => array( 'title', 'editor' ),
			)
		);
	}

	/**
	 * Logs a custom event to the Jetpack Activity Log.
	 *
	 * Call create() on or after the WordPress `init` action so Sync listeners are registered.
	 * The Activity Log post type is registered defensively if needed before insert.
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

		if ( ! post_type_exists( self::POST_TYPE ) ) {
			self::register_post_type();
		}

		$post_content = wp_json_encode( $payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE );
		if ( false === $post_content ) {
			return false;
		}

		$post_id = wp_insert_post(
			wp_slash(
				array(
					'post_type'    => self::POST_TYPE,
					'post_title'   => $payload['title'],
					'post_content' => $post_content,
					'post_status'  => 'publish',
				)
			),
			true
		);

		return is_wp_error( $post_id ) ? false : $post_id;
	}

	/**
	 * Checks that an Activity Log custom event has a valid payload before enqueueing it for sync,
	 * in case data bypasses the Activity_Log_Event::create() helper.
	 *
	 * @param \WP_Post $post Activity Log post.
	 * @return bool
	 */
	public static function is_valid_post( $post ) {
		if ( ! $post instanceof \WP_Post || self::POST_TYPE !== $post->post_type ) {
			return false;
		}

		// Build a sanitized candidate to validate the payload contract without mutating the stored post.
		return false !== self::build_payload_from_post_content( $post->post_content );
	}

	/**
	 * Prevents invalid Activity Log event posts from being inserted via wp_insert_post().
	 *
	 * @param bool  $maybe_empty Whether the post should be considered empty.
	 * @param array $postarr     Post data passed to wp_insert_post().
	 * @return bool
	 */
	public static function prevent_invalid_post_insert( $maybe_empty, $postarr ) {
		if ( ! is_array( $postarr ) || self::POST_TYPE !== ( $postarr['post_type'] ?? '' ) ) {
			return $maybe_empty;
		}

		return false === self::build_payload_from_post_content( $postarr['post_content'] ?? '' );
	}

	/**
	 * Restricts the core REST CPT route to trusted Activity Log event writers/readers.
	 *
	 * Core REST post collection reads are public by default, even for this non-public CPT,
	 * so explicitly gate this route when it is exposed via show_in_rest.
	 *
	 * @param mixed            $response Current REST response.
	 * @param array            $handler  Route handler.
	 * @param \WP_REST_Request $request  REST request.
	 * @return mixed|\WP_Error
	 */
	public static function authorize_rest_request( $response, $handler, $request ) {
		if ( null !== $response || ! $request instanceof \WP_REST_Request ) {
			return $response;
		}

		if ( ! self::is_activity_log_event_rest_route( $request->get_route() ) ) {
			return $response;
		}

		if ( current_user_can( 'manage_options' ) ) {
			return $response;
		}

		return new \WP_Error(
			'invalid_user_permission_activity_log_event',
			esc_html__( 'You do not have the correct user permissions to access Activity Log events.', 'jetpack-sync' ),
			array( 'status' => rest_authorization_required_code() )
		);
	}

	/**
	 * Checks whether a REST route targets Activity Log event posts.
	 *
	 * Supports both normal site-local routes and WordPress.com public API site routes.
	 *
	 * @param string $route REST route.
	 * @return bool
	 */
	private static function is_activity_log_event_rest_route( $route ) {
		if ( ! is_string( $route ) ) {
			return false;
		}

		$rest_base = self::REST_BASE;

		if ( false === strpos( $route, $rest_base ) ) {
			return false;
		}

		if ( '/wp/v2/' . $rest_base === $route || 0 === strpos( $route, '/wp/v2/' . $rest_base . '/' ) ) {
			return true;
		}

		$parts = explode( '/', trim( $route, '/' ) );
		if ( count( $parts ) < 5 ) {
			return false;
		}

		return (
			'wp' === $parts[0]
			&& 'v2' === $parts[1]
			&& 'sites' === $parts[2]
			&& $rest_base === $parts[4]
		);
	}

	/**
	 * Normalizes Activity Log event REST requests before they are inserted.
	 *
	 * @param object           $prepared_post Prepared post object.
	 * @param \WP_REST_Request $request       REST request.
	 * @return object|\WP_Error
	 */
	public static function normalize_rest_post( $prepared_post, $request ) {
		if ( ! is_object( $prepared_post ) || ! $request instanceof \WP_REST_Request ) {
			return $prepared_post;
		}

		$payload = self::build_payload(
			array(
				'title'    => self::get_rest_request_value( $request, 'title', $prepared_post->post_title ?? '' ),
				'content'  => self::get_rest_request_value( $request, 'content', $prepared_post->post_content ?? '' ),
				'source'   => $request->get_param( 'source' ),
				'severity' => $request->get_param( 'severity' ),
			)
		);

		if ( false === $payload ) {
			return new \WP_Error(
				'invalid_activity_log_event',
				esc_html__( 'Invalid Activity Log event payload.', 'jetpack-sync' ),
				array( 'status' => 400 )
			);
		}

		$post_content = wp_json_encode( $payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE );
		if ( false === $post_content ) {
			return new \WP_Error(
				'invalid_activity_log_event',
				esc_html__( 'Invalid Activity Log event payload.', 'jetpack-sync' ),
				array( 'status' => 400 )
			);
		}

		$prepared_post->post_title   = $payload['title'];
		$prepared_post->post_content = $post_content;
		$prepared_post->post_status  = 'publish';

		return $prepared_post;
	}

	/**
	 * Normalizes Activity Log event posts before they are inserted via wp_insert_post().
	 *
	 * @param array $data    Slashed, sanitized post data.
	 * @param array $postarr Post data passed to wp_insert_post().
	 * @return array
	 */
	public static function normalize_post_data( $data, $postarr ) {
		if ( ! is_array( $data ) || ! is_array( $postarr ) || self::POST_TYPE !== ( $postarr['post_type'] ?? '' ) ) {
			return $data;
		}

		$payload = self::build_payload_from_post_content( $data['post_content'] ?? '' );
		if ( false === $payload ) {
			return $data;
		}

		$post_content = wp_json_encode( $payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE );
		if ( false === $post_content ) {
			return $data;
		}

		$data['post_title']   = wp_slash( $payload['title'] );
		$data['post_content'] = wp_slash( $post_content );

		return $data;
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
		if ( ! $post instanceof \WP_Post ) {
			return $should_publicize;
		}

		return self::POST_TYPE === $post->post_type ? false : $should_publicize;
	}

	/**
	 * Never include Activity Log entries in Jetpack sitemaps,
	 * even if a third party adds this CPT to the sitemap post-type list.
	 *
	 * @param string[] $types Sitemap post types.
	 * @return string[]
	 */
	public static function filter_sitemap_post_types( $types ) {
		$types = (array) $types;

		if ( ! in_array( self::POST_TYPE, $types, true ) ) {
			return $types;
		}

		return array_values( array_diff( $types, array( self::POST_TYPE ) ) );
	}

	/**
	 * Builds an Activity Log event payload from raw input.
	 *
	 * @param array $args Raw event arguments.
	 * @return array|false Sanitized payload, or false if validation fails.
	 */
	private static function build_payload( array $args ) {
		$severity = self::sanitize_severity( $args['severity'] ?? self::DEFAULT_SEVERITY );
		if ( false === $severity ) {
			return false;
		}

		$title   = self::sanitize_string( $args['title'] ?? '', self::MAX_TITLE_LENGTH );
		$content = self::sanitize_string( $args['content'] ?? '', self::MAX_CONTENT_LENGTH );

		if ( '' === $title || '' === $content ) {
			return false;
		}

		$payload = array(
			'title'    => $title,
			'content'  => $content,
			'severity' => $severity,
		);

		if ( isset( $args['source'] ) ) {
			$source = self::sanitize_string( $args['source'], self::MAX_SOURCE_LENGTH );
			if ( '' !== $source ) {
				$payload['source'] = $source;
			}
		}

		return $payload;
	}

	/**
	 * Builds an Activity Log event payload from post content.
	 *
	 * @param mixed $post_content Raw post content.
	 * @return array|false Sanitized payload, or false if validation fails.
	 */
	private static function build_payload_from_post_content( $post_content ) {
		$data = self::decode_payload( $post_content );
		if ( ! is_array( $data ) ) {
			return false;
		}

		return self::build_payload( $data );
	}

	/**
	 * Decodes an Activity Log event payload from post content.
	 *
	 * @param mixed $post_content Raw post content.
	 * @return array|false
	 */
	private static function decode_payload( $post_content ) {
		$data = json_decode( (string) $post_content, true );
		if ( ! is_array( $data ) ) {
			$data = json_decode( wp_unslash( (string) $post_content ), true );
		}

		return is_array( $data ) ? $data : false;
	}

	/**
	 * Gets a string-like value from a REST request field.
	 *
	 * @param \WP_REST_Request $request REST request.
	 * @param string           $field   Request field name.
	 * @param mixed            $default Default value.
	 * @return mixed
	 */
	private static function get_rest_request_value( $request, $field, $default = '' ) {
		$value = $request->get_param( $field );
		if ( null === $value ) {
			return $default;
		}

		if ( is_array( $value ) && isset( $value['raw'] ) ) {
			return $value['raw'];
		}

		if ( is_array( $value ) && isset( $value['rendered'] ) ) {
			return $value['rendered'];
		}

		return $value;
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
		$value = preg_replace( '/\s+/', ' ', $value );
		if ( null === $value ) {
			return '';
		}

		$value = trim( $value );

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
