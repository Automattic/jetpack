<?php
/**
 * Podcast settings: option schema, REST exposure, and sync opt-in.
 *
 * @package automattic/jetpack-podcast
 */

namespace Automattic\Jetpack\Podcast;

/**
 * Registers the `podcasting_*` options for `/wp/v2/settings` exposure on
 * Atomic. Simple stays on WPCOM's `site_settings_endpoint_get` filter in the
 * wpcom mu-plugin.
 *
 * Array-shaped options merge against stored values on sanitize, not replace —
 * the SPA can PATCH partial entries without losing the rest.
 */
class Settings {

	/** Matches WPCOM's `register_setting('media', ...)` so the legacy Media Settings form keeps accepting these. */
	const MEDIA_GROUP = 'media';

	/** WPCOM doesn't register these with the Settings API; they're plain options exposed REST-only. */
	const OPTIONS_GROUP = 'options';

	/**
	 * Per-podcatcher hostname allowlist for `podcasting_show_urls`. `www.` is
	 * stripped before comparison.
	 *
	 * @var array<string, string[]>
	 */
	const SHOW_URL_HOSTS = array(
		'pocketcasts'  => array( 'pca.st', 'pocketcasts.com' ),
		'apple'        => array( 'podcasts.apple.com' ),
		'spotify'      => array( 'open.spotify.com' ),
		'youtube'      => array( 'youtube.com', 'm.youtube.com', 'youtu.be', 'music.youtube.com' ),
		'amazon'       => array(
			'music.amazon.com',
			'music.amazon.co.uk',
			'music.amazon.de',
			'music.amazon.co.jp',
			'music.amazon.com.au',
			'music.amazon.fr',
			'music.amazon.ca',
			'music.amazon.es',
		),
		'podcastindex' => array( 'podcastindex.org' ),
	);

	const SHOW_URL_MAX_LENGTH = 2048;

	/** Allowed `podcasting_show_states` values. Empty string clears. */
	const SHOW_STATES = array( 'pending', 'active' );

	/**
	 * Drives `register_settings()` and the sync whitelist.
	 *
	 * @var string[]
	 */
	const OPTION_NAMES = array(
		'podcasting_category_id',
		'podcasting_title',
		'podcasting_talent_name',
		'podcasting_summary',
		'podcasting_copyright',
		'podcasting_explicit',
		'podcasting_image',
		'podcasting_image_id',
		'podcasting_category_1',
		'podcasting_category_2',
		'podcasting_category_3',
		'podcasting_email',
		'podcasting_show_urls',
		'podcasting_show_states',
	);

	/**
	 * Whether `register()` has wired its hooks.
	 *
	 * @var bool
	 */
	private static $registered = false;

	/**
	 * Wire option registrations + Jetpack Sync opt-in. Idempotent.
	 */
	public static function register() {
		if ( self::$registered ) {
			return;
		}
		self::$registered = true;

		add_action( 'admin_init', array( __CLASS__, 'register_settings' ) );
		add_action( 'rest_api_init', array( __CLASS__, 'register_settings' ) );

		add_filter(
			'jetpack_sync_options_whitelist',
			static function ( $options ) {
				return array_merge( $options, self::OPTION_NAMES );
			}
		);
	}

	/**
	 * `register_setting()` calls. Hooked on `admin_init` and `rest_api_init`.
	 */
	public static function register_settings() {
		$media_settings = array(
			array( 'podcasting_category_id', 'integer', 0, 'absint' ),
			array( 'podcasting_title', 'string', '', 'sanitize_text_field' ),
			array( 'podcasting_talent_name', 'string', '', 'sanitize_text_field' ),
			array( 'podcasting_summary', 'string', '', 'sanitize_textarea_field' ),
			array( 'podcasting_copyright', 'string', '', 'sanitize_text_field' ),
			array( 'podcasting_category_1', 'string', '', 'sanitize_text_field' ),
			array( 'podcasting_category_2', 'string', '', 'sanitize_text_field' ),
			array( 'podcasting_category_3', 'string', '', 'sanitize_text_field' ),
		);

		foreach ( $media_settings as list( $name, $type, $default, $sanitize ) ) {
			register_setting(
				self::MEDIA_GROUP,
				$name,
				array(
					'type'              => $type,
					'default'           => $default,
					'sanitize_callback' => $sanitize,
					'show_in_rest'      => true,
				)
			);
		}

		register_setting(
			self::MEDIA_GROUP,
			'podcasting_image',
			array(
				'type'              => 'string',
				'default'           => '',
				'sanitize_callback' => 'esc_url_raw',
				'show_in_rest'      => array(
					'schema' => array(
						'type'    => 'string',
						'default' => '',
						'format'  => 'uri',
					),
				),
			)
		);

		register_setting(
			self::MEDIA_GROUP,
			'podcasting_explicit',
			array(
				'type'              => 'boolean',
				'default'           => false,
				'sanitize_callback' => array( __CLASS__, 'sanitize_explicit' ),
				'show_in_rest'      => true,
			)
		);

		register_setting(
			self::OPTIONS_GROUP,
			'podcasting_email',
			array(
				'type'              => 'string',
				'default'           => '',
				'sanitize_callback' => 'sanitize_email',
				'show_in_rest'      => true,
			)
		);

		register_setting(
			self::OPTIONS_GROUP,
			'podcasting_image_id',
			array(
				'type'              => 'integer',
				'default'           => 0,
				'sanitize_callback' => 'absint',
				'show_in_rest'      => true,
			)
		);

		$podcatcher_keys = array_keys( self::SHOW_URL_HOSTS );
		$empty_map       = array_fill_keys( $podcatcher_keys, '' );

		register_setting(
			self::OPTIONS_GROUP,
			'podcasting_show_urls',
			array(
				'type'              => 'object',
				'default'           => array(),
				'sanitize_callback' => array( __CLASS__, 'sanitize_show_urls' ),
				'show_in_rest'      => array(
					'schema' => array(
						'type'       => 'object',
						'default'    => $empty_map,
						'properties' => array_fill_keys(
							$podcatcher_keys,
							array(
								'type'      => 'string',
								'format'    => 'uri',
								'maxLength' => self::SHOW_URL_MAX_LENGTH,
							)
						),
					),
				),
			)
		);

		register_setting(
			self::OPTIONS_GROUP,
			'podcasting_show_states',
			array(
				'type'              => 'object',
				'default'           => array(),
				'sanitize_callback' => array( __CLASS__, 'sanitize_show_states' ),
				'show_in_rest'      => array(
					'schema' => array(
						'type'       => 'object',
						'default'    => $empty_map,
						'properties' => array_fill_keys(
							$podcatcher_keys,
							array(
								'type' => 'string',
								'enum' => array( '', 'pending', 'active' ),
							)
						),
					),
				),
			)
		);
	}

	/**
	 * `'yes'` (any case) or boolean true → true; everything else → false. The
	 * feed only emits true/false; the legacy `'clean'` value collapses to false
	 * because the WPCOM feed builder already treats it that way.
	 *
	 * @param mixed $value Raw input.
	 * @return bool
	 */
	public static function sanitize_explicit( $value ) {
		if ( is_string( $value ) ) {
			return in_array( strtolower( $value ), array( 'yes', 'true', '1' ), true );
		}
		return true === $value || 1 === $value;
	}

	/**
	 * Merge a partial show-URLs patch into the stored value. Empty string for a
	 * known key removes that entry; URLs failing the per-podcatcher hostname
	 * allowlist are silently dropped (the SPA validates the same allowlist).
	 *
	 * @param mixed $input Incoming patch.
	 * @return array<string, string>
	 */
	public static function sanitize_show_urls( $input ) {
		$current = array_filter(
			array_intersect_key( (array) get_option( 'podcasting_show_urls', array() ), self::SHOW_URL_HOSTS ),
			static function ( $value ) {
				return is_string( $value ) && '' !== $value;
			}
		);

		if ( ! is_array( $input ) ) {
			return $current;
		}

		foreach ( array_intersect_key( $input, self::SHOW_URL_HOSTS ) as $key => $value ) {
			$value = is_string( $value ) ? trim( $value ) : '';

			if ( '' === $value ) {
				unset( $current[ $key ] );
				continue;
			}

			$cleaned = self::sanitize_show_url( $key, $value );
			if ( null !== $cleaned ) {
				$current[ $key ] = $cleaned;
			}
		}

		return $current;
	}

	/**
	 * Merge a partial show-states patch into the stored value. Values outside
	 * SHOW_STATES are dropped; empty string clears.
	 *
	 * @param mixed $input Incoming patch.
	 * @return array<string, string>
	 */
	public static function sanitize_show_states( $input ) {
		$current = array_filter(
			array_intersect_key( (array) get_option( 'podcasting_show_states', array() ), self::SHOW_URL_HOSTS ),
			static function ( $value ) {
				return is_string( $value ) && '' !== $value;
			}
		);

		if ( ! is_array( $input ) ) {
			return $current;
		}

		foreach ( array_intersect_key( $input, self::SHOW_URL_HOSTS ) as $key => $value ) {
			$value = is_string( $value ) ? trim( $value ) : '';

			if ( '' === $value ) {
				unset( $current[ $key ] );
			} elseif ( in_array( $value, self::SHOW_STATES, true ) ) {
				$current[ $key ] = $value;
			}
		}

		return $current;
	}

	/**
	 * Validate a URL against the per-podcatcher hostname allowlist.
	 *
	 * @param string $key Podcatcher key.
	 * @param string $url Candidate URL.
	 * @return string|null Cleaned URL, or null if the host isn't in the allowlist.
	 */
	private static function sanitize_show_url( $key, $url ) {
		if ( ! isset( self::SHOW_URL_HOSTS[ $key ] ) ) {
			return null;
		}

		if ( ! is_string( $url ) || strlen( $url ) > self::SHOW_URL_MAX_LENGTH ) {
			return null;
		}

		$cleaned = esc_url_raw( $url, array( 'https' ) );
		if ( '' === $cleaned ) {
			return null;
		}

		if ( ! wp_http_validate_url( $cleaned ) ) {
			return null;
		}

		$host = wp_parse_url( $cleaned, PHP_URL_HOST );
		if ( ! is_string( $host ) || '' === $host ) {
			return null;
		}

		$host = strtolower( $host );
		if ( 0 === strpos( $host, 'www.' ) ) {
			$host = substr( $host, 4 );
		}

		return in_array( $host, self::SHOW_URL_HOSTS[ $key ], true ) ? $cleaned : null;
	}
}
