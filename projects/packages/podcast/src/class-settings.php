<?php
/**
 * Podcast settings: option schema, REST exposure, and value coercion.
 *
 * @package automattic/jetpack-podcast
 */

namespace Automattic\Jetpack\Podcast;

/**
 * Single source of truth for the `podcasting_*` option set.
 *
 * Registers each option via `register_setting()` so they are read- and
 * write-accessible through `/wp/v2/settings`. The legacy WPCOM site-settings
 * filters (`site_settings_endpoint_get` / `rest_api_update_site_settings`) keep
 * working on Simple via the wpcom mu-plugin; this class is the non-Simple
 * equivalent.
 *
 * Array-shaped options (`podcasting_show_urls`, `podcasting_show_states`)
 * sanitize as a *merge* against the stored value rather than a replace, so the
 * SPA can submit a partial patch and have other entries preserved — matching
 * the behavior of the legacy WPCOM REST surface.
 */
class Settings {

	/**
	 * Settings group passed to `register_setting()`. Group is essentially
	 * decorative for REST exposure (which keys off `show_in_rest` regardless
	 * of group) but keeps these out of the core option groups.
	 *
	 * @var string
	 */
	const OPTION_GROUP = 'jetpack-podcast';

	/**
	 * Hostname allowlist per podcatcher for `podcasting_show_urls` entries.
	 * `www.` is stripped before comparison.
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

	/**
	 * Maximum length for any single show URL.
	 *
	 * @var int
	 */
	const SHOW_URL_MAX_LENGTH = 2048;

	/**
	 * Allowed `podcasting_show_states[*]` values. Empty string clears.
	 *
	 * - `pending` — feed has been submitted to the directory, awaiting first fetch.
	 * - `active`  — directory has fetched the feed at least once.
	 *
	 * @var string[]
	 */
	const SHOW_STATES = array( 'pending', 'active' );

	/**
	 * Whether `register()` has wired its hooks.
	 *
	 * @var bool
	 */
	private static $registered = false;

	/**
	 * Wire the option registrations. Idempotent; safe to call from
	 * `Podcast::init()` regardless of which hook is firing.
	 */
	public static function register() {
		if ( self::$registered ) {
			return;
		}
		self::$registered = true;

		add_action( 'init', array( __CLASS__, 'register_settings' ) );
		add_action( 'rest_api_init', array( __CLASS__, 'register_settings' ) );
	}

	/**
	 * `register_setting()` loop. Hooked on both `init` and `rest_api_init` so
	 * the schema is in place whether the request is an admin page load or a
	 * direct REST hit. `register_setting()` is idempotent — duplicate calls
	 * just overwrite the prior args with the same args.
	 */
	public static function register_settings() {
		foreach ( self::schema() as $option_name => $config ) {
			register_setting(
				self::OPTION_GROUP,
				$option_name,
				array(
					'type'              => $config['type'],
					'default'           => $config['default'],
					'sanitize_callback' => $config['sanitize_callback'],
					'show_in_rest'      => array(
						'schema' => $config['rest_schema'],
					),
				)
			);
		}
	}

	/**
	 * Canonical option definitions. Each entry drives both `register_setting()`
	 * and the REST schema exposed at `/wp/v2/settings`.
	 *
	 * @return array<string, array{type:string,default:mixed,sanitize_callback:callable|string,rest_schema:array<string,mixed>}>
	 */
	private static function schema() {
		$string_option = static function ( $sanitize = 'sanitize_text_field' ) {
			return array(
				'type'              => 'string',
				'default'           => '',
				'sanitize_callback' => $sanitize,
				'rest_schema'       => array(
					'type'    => 'string',
					'default' => '',
				),
			);
		};

		$int_option = array(
			'type'              => 'integer',
			'default'           => 0,
			'sanitize_callback' => 'absint',
			'rest_schema'       => array(
				'type'    => 'integer',
				'default' => 0,
			),
		);

		return array(
			'podcasting_category_id' => $int_option,
			'podcasting_image_id'    => $int_option,

			'podcasting_title'       => $string_option(),
			'podcasting_talent_name' => $string_option(),
			'podcasting_summary'     => $string_option( 'sanitize_textarea_field' ),
			'podcasting_copyright'   => $string_option(),
			'podcasting_category_1'  => $string_option(),
			'podcasting_category_2'  => $string_option(),
			'podcasting_category_3'  => $string_option(),
			'podcasting_email'       => $string_option( 'sanitize_email' ),

			'podcasting_image'       => array(
				'type'              => 'string',
				'default'           => '',
				'sanitize_callback' => 'esc_url_raw',
				'rest_schema'       => array(
					'type'    => 'string',
					'default' => '',
					'format'  => 'uri',
				),
			),

			'podcasting_explicit'    => array(
				'type'              => 'boolean',
				'default'           => false,
				'sanitize_callback' => array( __CLASS__, 'sanitize_explicit' ),
				'rest_schema'       => array(
					'type'    => 'boolean',
					'default' => false,
				),
			),

			'podcasting_show_urls'   => array(
				'type'              => 'object',
				'default'           => array(),
				'sanitize_callback' => array( __CLASS__, 'sanitize_show_urls' ),
				'rest_schema'       => array(
					'type'       => 'object',
					'default'    => self::empty_podcatcher_map(),
					'properties' => self::show_urls_properties_schema(),
				),
			),

			'podcasting_show_states' => array(
				'type'              => 'object',
				'default'           => array(),
				'sanitize_callback' => array( __CLASS__, 'sanitize_show_states' ),
				'rest_schema'       => array(
					'type'       => 'object',
					'default'    => self::empty_podcatcher_map(),
					'properties' => self::show_states_properties_schema(),
				),
			),
		);
	}

	/**
	 * REST schema for each podcatcher key inside `podcasting_show_urls`.
	 *
	 * @return array<string, array<string, mixed>>
	 */
	private static function show_urls_properties_schema() {
		$props = array();
		foreach ( array_keys( self::SHOW_URL_HOSTS ) as $key ) {
			$props[ $key ] = array(
				'type'      => 'string',
				'format'    => 'uri',
				'maxLength' => self::SHOW_URL_MAX_LENGTH,
			);
		}
		return $props;
	}

	/**
	 * REST schema for each podcatcher key inside `podcasting_show_states`.
	 *
	 * @return array<string, array<string, mixed>>
	 */
	private static function show_states_properties_schema() {
		$props = array();
		foreach ( array_keys( self::SHOW_URL_HOSTS ) as $key ) {
			$props[ $key ] = array(
				'type' => 'string',
				'enum' => array_merge( array( '' ), self::SHOW_STATES ),
			);
		}
		return $props;
	}

	/**
	 * `{ podcatcher_id => '' }` shape used as the REST default for the array
	 * options, so callers always see every known key.
	 *
	 * @return array<string, string>
	 */
	private static function empty_podcatcher_map() {
		$out = array();
		foreach ( array_keys( self::SHOW_URL_HOSTS ) as $key ) {
			$out[ $key ] = '';
		}
		return $out;
	}

	/**
	 * Sanitize `podcasting_explicit` to a boolean.
	 *
	 * The feed only emits `<itunes:explicit>` as `true`/`false`. The legacy
	 * `'yes'`/`'no'`/`'clean'` storage is normalized: `'yes'` becomes true,
	 * everything else (including `'clean'`, which the WPCOM feed builder
	 * already treats as not-explicit) becomes false. Conservative on garbage
	 * input — unrecognized values resolve to false rather than `(bool) $value`.
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
	 * Sanitize a partial `podcasting_show_urls` patch into the merged stored
	 * value.
	 *
	 * Empty string for a known key removes that entry. Unknown keys and URLs
	 * that don't pass the per-podcatcher hostname allowlist are dropped
	 * silently — the SPA validates the same allowlist client-side, so an
	 * unrecognized URL reaching the server means a non-modal client.
	 *
	 * @param mixed $input Incoming value (expected: array<string,string>).
	 * @return array<string, string>
	 */
	public static function sanitize_show_urls( $input ) {
		$current = self::stored_podcatcher_map( 'podcasting_show_urls' );

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
	 * Sanitize a partial `podcasting_show_states` patch into the merged
	 * stored value. Same merge semantics as `sanitize_show_urls()`.
	 *
	 * @param mixed $input Incoming value.
	 * @return array<string, string>
	 */
	public static function sanitize_show_states( $input ) {
		$current = self::stored_podcatcher_map( 'podcasting_show_states' );

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
	 * Read a podcatcher-keyed option, dropping any entries that aren't
	 * non-empty strings or whose key isn't a known podcatcher.
	 *
	 * @param string $option_name `podcasting_show_urls` or `podcasting_show_states`.
	 * @return array<string, string>
	 */
	private static function stored_podcatcher_map( $option_name ) {
		$stored = get_option( $option_name, array() );
		if ( ! is_array( $stored ) ) {
			return array();
		}

		$out = array();
		foreach ( array_keys( self::SHOW_URL_HOSTS ) as $key ) {
			if ( isset( $stored[ $key ] ) && is_string( $stored[ $key ] ) && '' !== $stored[ $key ] ) {
				$out[ $key ] = $stored[ $key ];
			}
		}
		return $out;
	}

	/**
	 * Validate a candidate URL against the per-podcatcher hostname allowlist.
	 *
	 * @param string $key Podcatcher key (must be in SHOW_URL_HOSTS).
	 * @param string $url Candidate URL.
	 * @return string|null Cleaned URL on success, null on failure.
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
