<?php
/**
 * Settings REST integration for Jetpack Podcast.
 *
 * Exposes the `podcasting_*` options through:
 *   - Atomic / standard WP: `register_setting()` so they appear in `/wp/v2/settings`.
 *   - Simple (wpcom): `site_settings_endpoint_get` / `rest_api_update_site_settings`
 *     filters consumed by the wpcom site-settings REST endpoint.
 *
 * @package automattic/jetpack-podcast
 */

namespace Automattic\Jetpack\Podcast\REST;

use Automattic\Jetpack\Podcast\Podcast;

/**
 * Registers the podcast settings on the site-settings endpoints used by both
 * Simple and Atomic sites.
 */
class Settings_REST {

	/**
	 * Schema for each podcasting setting.
	 *
	 *   - type:    'string' or 'integer'.
	 *   - default: scalar default value.
	 *   - enum:    optional whitelist used for `podcasting_explicit`.
	 *
	 * @var array<string, array{type: string, default: mixed, enum?: array<int, string>}>
	 */
	private const SETTINGS = array(
		'podcasting_category_id' => array(
			'type'    => 'integer',
			'default' => 0,
		),
		'podcasting_title'       => array(
			'type'    => 'string',
			'default' => '',
		),
		'podcasting_talent_name' => array(
			'type'    => 'string',
			'default' => '',
		),
		'podcasting_summary'     => array(
			'type'    => 'string',
			'default' => '',
		),
		'podcasting_copyright'   => array(
			'type'    => 'string',
			'default' => '',
		),
		'podcasting_explicit'    => array(
			'type'    => 'string',
			'default' => 'no',
			'enum'    => array( 'no', 'yes', 'clean' ),
		),
		'podcasting_image'       => array(
			'type'    => 'string',
			'default' => '',
		),
		'podcasting_image_id'    => array(
			'type'    => 'integer',
			'default' => 0,
		),
		'podcasting_category_1'  => array(
			'type'    => 'string',
			'default' => '',
		),
		'podcasting_category_2'  => array(
			'type'    => 'string',
			'default' => '',
		),
		'podcasting_category_3'  => array(
			'type'    => 'string',
			'default' => '',
		),
		'podcasting_email'       => array(
			'type'    => 'string',
			'default' => '',
		),
	);

	/**
	 * Per-podcatcher host allowlist for `podcasting_show_urls`.
	 *
	 * Mirrors the wpcom mu-plugin's allowlist
	 * (`Automattic_Podcasting_Settings_REST_API::SHOW_URL_HOSTS`) so the same
	 * URL passes validation on both hosts. Hostnames are lowercased and
	 * `www.` is stripped before comparison. Keep this in sync with the
	 * directory IDs in `src/dashboard/tabs/distribution.tsx`.
	 *
	 * @var array<string, array<int, string>>
	 */
	private const SHOW_URL_HOSTS = array(
		'pocketcasts'  => array( 'pca.st', 'pocketcasts.com' ),
		'apple'        => array( 'podcasts.apple.com' ),
		'spotify'      => array( 'open.spotify.com' ),
		'youtube'      => array( 'youtube.com', 'm.youtube.com', 'youtu.be', 'music.youtube.com' ),
		'amazon'       => array( 'music.amazon.com', 'music.amazon.co.uk', 'music.amazon.de', 'music.amazon.co.jp' ),
		'podcastindex' => array( 'podcastindex.org' ),
	);

	private const SHOW_URL_MAX_LENGTH = 2048;

	/**
	 * Whether hooks have been registered.
	 *
	 * @var bool
	 */
	private static $initialized = false;

	/**
	 * Register hooks.
	 *
	 * `register_setting()` is always installed — it's the canonical entry point
	 * for `/wp/v2/settings` on Atomic and standard WP, and nothing else (legacy
	 * code included) puts the `podcasting_*` keys there. The wpcom site-settings
	 * filters, on the other hand, do overlap with the legacy mu-plugin / bridge
	 * when both are active, so we skip them in that case.
	 *
	 * @param bool $register_wpcom_filters Whether to register the
	 *                                     `site_settings_endpoint_get` /
	 *                                     `rest_api_update_site_settings`
	 *                                     filters. Pass `false` when legacy
	 *                                     code is active to avoid running
	 *                                     equivalent logic twice.
	 */
	public static function init( $register_wpcom_filters = true ) {
		if ( self::$initialized ) {
			return;
		}
		self::$initialized = true;

		// register_setting() is only consumed by the /wp/v2/settings REST controller
		// during REST requests, so registering anywhere else (e.g. on `init`) just
		// burns cycles on every frontend pageload.
		add_action( 'rest_api_init', array( __CLASS__, 'register_settings' ) );

		if ( $register_wpcom_filters ) {
			add_filter( 'site_settings_endpoint_get', array( __CLASS__, 'handle_wpcom_get' ) );
			add_filter(
				'rest_api_update_site_settings',
				array( __CLASS__, 'handle_wpcom_update' ),
				10,
				2
			);
		}
	}

	/**
	 * Register podcasting options with the WP settings registry so they appear
	 * in `/wp/v2/settings` on standard WP installs and Atomic.
	 */
	public static function register_settings() {
		foreach ( self::SETTINGS as $option => $schema ) {
			$args = array(
				'type'         => $schema['type'],
				'default'      => $schema['default'],
				'show_in_rest' => array(
					'name'   => $option,
					'schema' => array(
						'type' => $schema['type'],
					),
				),
			);

			if ( isset( $schema['enum'] ) ) {
				$args['show_in_rest']['schema']['enum'] = $schema['enum'];
			}

			register_setting( 'general', $option, $args );
		}

		// Object-typed setting: per-podcatcher show URLs. Schema enumerates the
		// known directory keys; sanitize_callback enforces the host allowlist
		// and merges with the existing stored value (so partial patches don't
		// blow away other directories' URLs on /wp/v2/settings, which doesn't
		// merge by default).
		$show_url_properties = array();
		foreach ( array_keys( self::SHOW_URL_HOSTS ) as $key ) {
			$show_url_properties[ $key ] = array( 'type' => 'string' );
		}

		register_setting(
			'general',
			'podcasting_show_urls',
			array(
				'type'              => 'object',
				'default'           => array(),
				'sanitize_callback' => array( __CLASS__, 'sanitize_show_urls' ),
				'show_in_rest'      => array(
					'name'   => 'podcasting_show_urls',
					'schema' => array(
						'type'                 => 'object',
						'properties'           => $show_url_properties,
						'additionalProperties' => false,
					),
				),
			)
		);
	}

	/**
	 * Inject podcasting settings into the wpcom site-settings GET response (Simple sites).
	 *
	 * @param array $settings Existing settings array.
	 * @return array
	 */
	public static function handle_wpcom_get( $settings ) {
		$settings['podcasting_category_id'] = (int) Podcast::get_category_id();
		$settings['podcasting_image']       = (string) Podcast::get_image_url();
		$settings['podcasting_image_id']    = (int) get_option( 'podcasting_image_id', 0 );

		foreach ( self::SETTINGS as $option => $schema ) {
			if ( isset( $settings[ $option ] ) ) {
				continue;
			}
			$value               = get_option( $option, $schema['default'] );
			$settings[ $option ] = 'integer' === $schema['type'] ? (int) $value : (string) $value;
		}

		if ( ! isset( $settings['podcasting_show_urls'] ) ) {
			$settings['podcasting_show_urls'] = self::get_show_urls();
		}

		return $settings;
	}

	/**
	 * Cast podcasting settings on incoming wpcom site-settings POST requests (Simple sites).
	 *
	 * @param array $original_input   Already-sanitized input array.
	 * @param array $unfiltered_input Raw client input.
	 * @return array
	 */
	public static function handle_wpcom_update( $original_input, $unfiltered_input ) {
		$output = (array) $original_input;

		foreach ( self::SETTINGS as $option => $schema ) {
			if ( ! isset( $unfiltered_input[ $option ] ) ) {
				continue;
			}

			if ( 'integer' === $schema['type'] ) {
				$output[ $option ] = (int) $unfiltered_input[ $option ];
				continue;
			}

			$value = (string) $unfiltered_input[ $option ];
			if ( isset( $schema['enum'] ) && ! in_array( $value, $schema['enum'], true ) ) {
				$value = (string) $schema['default'];
			}
			$output[ $option ] = $value;
		}

		if ( isset( $unfiltered_input['podcasting_show_urls'] ) ) {
			$merged = self::merge_show_urls( $unfiltered_input['podcasting_show_urls'] );
			if ( null !== $merged ) {
				$output['podcasting_show_urls'] = $merged;
			} else {
				// Nothing valid to apply — let the existing stored value stand.
				unset( $output['podcasting_show_urls'] );
			}
		}

		return $output;
	}

	/**
	 * Read the stored show URLs and pad with empty strings for every known
	 * podcatcher so the response always has a stable shape.
	 *
	 * @return array<string, string>
	 */
	public static function get_show_urls() {
		$stored = get_option( 'podcasting_show_urls', array() );
		if ( ! is_array( $stored ) ) {
			$stored = array();
		}

		$urls = array();
		foreach ( array_keys( self::SHOW_URL_HOSTS ) as $key ) {
			$urls[ $key ] = isset( $stored[ $key ] ) && is_string( $stored[ $key ] ) ? $stored[ $key ] : '';
		}

		return $urls;
	}

	/**
	 * `register_setting()` sanitize callback for `podcasting_show_urls`.
	 *
	 * `/wp/v2/settings` writes the value WP-side via `update_option`, which
	 * doesn't merge — it replaces. So we read the current option, merge the
	 * incoming patch into it, and return the merged array. That way a client
	 * sending `{ apple: 'url' }` doesn't wipe out `spotify`.
	 *
	 * @param mixed $input Incoming value from the REST request.
	 * @return array<string, string>
	 */
	public static function sanitize_show_urls( $input ) {
		$merged = self::merge_show_urls( $input );
		if ( null !== $merged ) {
			return $merged;
		}

		$stored = get_option( 'podcasting_show_urls', array() );
		return is_array( $stored ) ? $stored : array();
	}

	/**
	 * Merge a partial show_urls patch into the currently stored value.
	 *
	 * Empty string for a known key removes that entry. Unknown keys and URLs
	 * that don't match the per-podcatcher host allowlist are dropped silently.
	 * Returns the merged array, or null when the input is unusable / produces
	 * no effective change.
	 *
	 * @param mixed $input Incoming patch.
	 * @return array<string, string>|null
	 */
	private static function merge_show_urls( $input ) {
		if ( ! is_array( $input ) ) {
			return null;
		}

		// Strip the empty padding handle_get() adds so we only persist real entries.
		$current = array_filter(
			self::get_show_urls(),
			static function ( $value ) {
				return is_string( $value ) && '' !== $value;
			}
		);

		$changed = false;

		foreach ( $input as $key => $value ) {
			if ( ! isset( self::SHOW_URL_HOSTS[ $key ] ) ) {
				continue;
			}

			$value = is_string( $value ) ? trim( $value ) : '';

			if ( '' === $value ) {
				if ( isset( $current[ $key ] ) ) {
					unset( $current[ $key ] );
					$changed = true;
				}
				continue;
			}

			$cleaned = self::validate_show_url( $key, $value );
			if ( null === $cleaned ) {
				continue;
			}

			if ( ! isset( $current[ $key ] ) || $current[ $key ] !== $cleaned ) {
				$current[ $key ] = $cleaned;
				$changed         = true;
			}
		}

		return $changed ? $current : null;
	}

	/**
	 * Validate a URL against the host allowlist for a given podcatcher key.
	 *
	 * @param string $key Directory ID (e.g. 'apple').
	 * @param mixed  $url Candidate URL.
	 * @return string|null Cleaned URL on success, null on failure.
	 */
	private static function validate_show_url( $key, $url ) {
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
