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
	 * Settings group for the options that have UI fields on the legacy
	 * Media Settings page — matches `register_setting('media', ...)` in
	 * WPCOM's `Automattic_Podcasting` so that legacy form keeps accepting
	 * these during the untangle transition.
	 *
	 * @var string
	 */
	const MEDIA_GROUP = 'media';

	/**
	 * Settings group for the options that are *not* on the Media Settings
	 * page — `email`, `image_id`, `show_urls`, `show_states`. WPCOM exposes
	 * these via its `site_settings_endpoint_get` filter (REST-only, no WP
	 * Settings API registration), so we use the generic `'options'` group
	 * here to avoid falsely claiming they belong to Media.
	 *
	 * @var string
	 */
	const OPTIONS_GROUP = 'options';

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
	 * Canonical list of every option this class manages. Drives the Jetpack
	 * Sync opt-in (`add_to_sync_whitelist()`) and serves as a drift-detection
	 * anchor against `register_settings()`.
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
	 * Wire the option registrations and the Jetpack Sync opt-in. Idempotent;
	 * safe to call from `Podcast::init()` regardless of which hook is firing.
	 */
	public static function register() {
		if ( self::$registered ) {
			return;
		}
		self::$registered = true;

		add_action( 'admin_init', array( __CLASS__, 'register_settings' ) );
		add_action( 'rest_api_init', array( __CLASS__, 'register_settings' ) );

		// Opt the `podcasting_*` options into Jetpack Sync so values flow from
		// Atomic to WPCOM (where stats / distribution / future cross-site
		// features can read them). No-op on Simple — sync sender doesn't run
		// there. Gated implicitly: this hook only fires when `register()` is
		// called, which only happens after `Podcast::init()`'s untangle filter
		// passes.
		add_filter( 'jetpack_sync_options_whitelist', array( __CLASS__, 'add_to_sync_whitelist' ) );
	}

	/**
	 * `register_setting()` calls. Hooked on `admin_init` and `rest_api_init`
	 * so the schema is in place for whichever request type is firing — and
	 * skipped on front-end pageviews where the registration isn't needed.
	 * `register_setting()` is idempotent.
	 */
	public static function register_settings() {
		// Settings that have UI fields on the legacy Media Settings page.
		// Group is `MEDIA_GROUP` to match WPCOM's `register_setting('media', ...)`.
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

		// Plain options that WPCOM doesn't put on the Media Settings page —
		// only exposed REST-side via WPCOM's site-settings filter on Simple,
		// or here via `OPTIONS_GROUP` + `show_in_rest` on Atomic.
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

		// Both `podcasting_show_urls` and `podcasting_show_states` fan a
		// single per-key schema across every podcatcher, defaulting to an
		// empty-string map so consumers always see every known key.
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
								'enum' => array_merge( array( '' ), self::SHOW_STATES ),
							)
						),
					),
				),
			)
		);
	}

	/**
	 * Merge the `podcasting_*` options into the Jetpack Sync options whitelist.
	 *
	 * @param array $options Existing whitelist from `jetpack_sync_options_whitelist`.
	 * @return array
	 */
	public static function add_to_sync_whitelist( $options ) {
		return array_merge( (array) $options, self::OPTION_NAMES );
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
	 * Sanitize a partial `podcasting_show_states` patch into the merged
	 * stored value. Same merge semantics as `sanitize_show_urls()`.
	 *
	 * @param mixed $input Incoming value.
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
