<?php
/**
 * Podcast settings: option schema, sanitizers, and Jetpack Sync opt-in.
 *
 * @package automattic/jetpack-podcast
 */

namespace Automattic\Jetpack\Podcast;

/**
 * Registers the `podcasting_*` options with their `sanitize_callback`s so writes
 * through any path stay validated. The dashboard reads and writes them through the
 * dedicated {@see Podcast_Settings_Endpoint} (`wpcom/v2/podcast/settings`); they
 * are intentionally not exposed through core `/wp/v2/settings`.
 *
 * Array-shaped options merge against stored values on sanitize, not replace —
 * the SPA can PATCH partial entries without losing the rest.
 */
class Settings {

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
	 * Wire option registrations + Jetpack Sync opt-in. Idempotent: every
	 * callback is named, so WordPress dedupes repeat calls.
	 */
	public static function register() {
		add_action( 'admin_init', array( __CLASS__, 'register_settings' ) );
		add_action( 'rest_api_init', array( __CLASS__, 'register_settings' ) );
		add_filter( 'jetpack_sync_options_whitelist', array( __CLASS__, 'add_to_sync_whitelist' ) );
	}

	/**
	 * Add the podcast options to the Jetpack Sync whitelist.
	 *
	 * @param string[] $options Whitelisted option names.
	 * @return string[]
	 */
	public static function add_to_sync_whitelist( $options ) {
		return array_merge( $options, self::OPTION_NAMES );
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

		// Registered under WP core's `media` group to match WPCOM's legacy Media
		// Settings form, so it keeps accepting these.
		foreach ( $media_settings as list( $name, $type, $default, $sanitize ) ) {
			register_setting(
				'media',
				$name,
				array(
					'type'              => $type,
					'default'           => $default,
					'sanitize_callback' => $sanitize,
				)
			);
		}

		register_setting(
			'media',
			'podcasting_image',
			array(
				'type'              => 'string',
				'default'           => '',
				'sanitize_callback' => 'esc_url_raw',
			)
		);

		register_setting(
			'media',
			'podcasting_explicit',
			array(
				'type'              => 'boolean',
				'default'           => false,
				'sanitize_callback' => array( __CLASS__, 'sanitize_explicit' ),
			)
		);

		// Registered under WP core's `options` group: settings WPCOM never wired
		// into a Settings API form.
		register_setting(
			'options',
			'podcasting_email',
			array(
				'type'              => 'string',
				'default'           => '',
				'sanitize_callback' => 'sanitize_email',
			)
		);

		register_setting(
			'options',
			'podcasting_image_id',
			array(
				'type'              => 'integer',
				'default'           => 0,
				'sanitize_callback' => 'absint',
			)
		);

		register_setting(
			'options',
			'podcasting_show_urls',
			array(
				'type'              => 'object',
				'default'           => array(),
				'sanitize_callback' => array( __CLASS__, 'sanitize_show_urls' ),
			)
		);

		register_setting(
			'options',
			'podcasting_show_states',
			array(
				'type'              => 'object',
				'default'           => array(),
				'sanitize_callback' => array( __CLASS__, 'sanitize_show_states' ),
			)
		);
	}

	/**
	 * Stable, fully-padded settings payload for the REST endpoint. Every
	 * `OPTION_NAMES` key is present; the two podcatcher maps are padded to all
	 * known directories with empty strings so the SPA always sees a fixed shape.
	 *
	 * @return array<string, mixed>
	 */
	public static function get_all(): array {
		$empty_map   = array_fill_keys( array_keys( self::SHOW_URL_HOSTS ), '' );
		$show_urls   = (array) get_option( 'podcasting_show_urls', array() );
		$show_states = (array) get_option( 'podcasting_show_states', array() );

		return array(
			'podcasting_category_id' => (int) get_option( 'podcasting_category_id', 0 ),
			'podcasting_title'       => (string) get_option( 'podcasting_title', '' ),
			'podcasting_talent_name' => (string) get_option( 'podcasting_talent_name', '' ),
			'podcasting_summary'     => (string) get_option( 'podcasting_summary', '' ),
			'podcasting_copyright'   => (string) get_option( 'podcasting_copyright', '' ),
			'podcasting_explicit'    => self::sanitize_explicit( get_option( 'podcasting_explicit', false ) ),
			'podcasting_image'       => self::raw_show_image_url(),
			'podcasting_image_id'    => (int) get_option( 'podcasting_image_id', 0 ),
			'podcasting_category_1'  => (string) get_option( 'podcasting_category_1', '' ),
			'podcasting_category_2'  => (string) get_option( 'podcasting_category_2', '' ),
			'podcasting_category_3'  => (string) get_option( 'podcasting_category_3', '' ),
			'podcasting_email'       => (string) get_option( 'podcasting_email', '' ),
			'podcasting_show_urls'   => array_merge( $empty_map, array_intersect_key( $show_urls, $empty_map ) ),
			'podcasting_show_states' => array_merge( $empty_map, array_intersect_key( $show_states, $empty_map ) ),
		);
	}

	/**
	 * Per-key type map for the endpoint's update args. Type coercion only — the
	 * registered `sanitize_callback`s do the real validation on write, so a single
	 * bad field can't 400 the whole partial patch.
	 *
	 * @return array<string, array<string, mixed>>
	 */
	public static function rest_schema_properties(): array {
		return array(
			'podcasting_category_id' => array( 'type' => 'integer' ),
			'podcasting_title'       => array( 'type' => 'string' ),
			'podcasting_talent_name' => array( 'type' => 'string' ),
			'podcasting_summary'     => array( 'type' => 'string' ),
			'podcasting_copyright'   => array( 'type' => 'string' ),
			'podcasting_explicit'    => array( 'type' => array( 'boolean', 'string' ) ),
			'podcasting_image'       => array( 'type' => 'string' ),
			'podcasting_image_id'    => array( 'type' => 'integer' ),
			'podcasting_category_1'  => array( 'type' => 'string' ),
			'podcasting_category_2'  => array( 'type' => 'string' ),
			'podcasting_category_3'  => array( 'type' => 'string' ),
			'podcasting_email'       => array( 'type' => 'string' ),
			'podcasting_show_urls'   => array( 'type' => 'object' ),
			'podcasting_show_states' => array( 'type' => 'object' ),
		);
	}

	/**
	 * Show cover image URL: `podcasting_image_id` resolved to its attachment
	 * URL when it points at an image, otherwise the raw `podcasting_image`
	 * option. Never Photon-routed — feed rendering applies its own resize.
	 *
	 * @return string Image URL, or '' when not configured.
	 */
	public static function raw_show_image_url(): string {
		$image_id = (int) get_option( 'podcasting_image_id', 0 );
		if ( $image_id > 0 && wp_attachment_is_image( $image_id ) ) {
			$url = wp_get_attachment_url( $image_id );
			if ( false !== $url ) {
				return $url;
			}
		}
		return (string) get_option( 'podcasting_image', '' );
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
	 * the allowed `'pending'`/`'active'` set are dropped; empty string clears a
	 * stored entry. `'active'` → `'pending'` is
	 * refused so a stale SPA cache can't downgrade a state that `Feed_Detection`
	 * promoted via real UA evidence (explicit `''` clears still work).
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
				continue;
			}

			if ( ! in_array( $value, array( 'pending', 'active' ), true ) ) {
				continue;
			}

			if ( 'pending' === $value && isset( $current[ $key ] ) && 'active' === $current[ $key ] ) {
				continue;
			}

			$current[ $key ] = $value;
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
