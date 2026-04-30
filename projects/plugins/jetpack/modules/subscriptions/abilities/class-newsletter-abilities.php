<?php
/**
 * Jetpack Newsletter Abilities Registration
 *
 * Registers Jetpack Newsletter (subscriptions) abilities with the WordPress
 * Abilities API.
 *
 * @package automattic/jetpack
 */

// @phan-file-suppress PhanUndeclaredFunction, PhanUndeclaredClassMethod @phan-suppress-current-line UnusedSuppression -- Abilities API added in WP 6.9.

namespace Automattic\Jetpack\Plugin\Abilities;

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Modules\Subscriptions\Settings as Subscriptions_Settings;
use Automattic\Jetpack\WP_Abilities\Registrar;
use Jetpack;
use Jetpack_Options;

// The Subscriptions module doesn't load its Settings helpers eagerly. Pull it
// in here so `Subscriptions_Settings::$default_reply_to` and
// `is_valid_reply_to()` are resolvable when the abilities run.
require_once __DIR__ . '/../class-settings.php';

/**
 * Registers Jetpack Newsletter abilities with the WordPress Abilities API.
 *
 * Exposes a consolidated read of the site's newsletter (subscriptions) settings
 * and a partial-update writer so AI agents can configure the Newsletter module
 * through the standard `wp-abilities/v1` REST surface.
 */
class Newsletter_Abilities extends Registrar {

	// Field type tags used in `settings_map()`. Constants (not strings) so a
	// typo in a `case` label fails fast instead of silently falling through.
	private const TYPE_BOOL   = 'bool';
	private const TYPE_ON_OFF = 'on_off';
	private const TYPE_ENUM   = 'enum';
	private const TYPE_STRING = 'string';

	/**
	 * Allowed values for the `reply_to` setting. Mirror of
	 * `Subscriptions_Settings::is_valid_reply_to()` — kept here so it can be
	 * referenced from the JSON Schema enum without loading the Settings class
	 * at file-parse time.
	 */
	private const REPLY_TO_VALUES = array( 'comment', 'author', 'no-reply' );

	/**
	 * Returns the abilities category, definition, or registered abilities.
	 *
	 * @inheritDoc
	 */
	public static function get_category_slug(): string {
		return 'jetpack-newsletter';
	}

	/**
	 * Returns the abilities category, definition, or registered abilities.
	 *
	 * @inheritDoc
	 */
	public static function get_category_definition(): array {
		return array(
			// "Jetpack" and "Newsletter" are product names and should not be translated.
			'label'       => 'Jetpack Newsletter',
			'description' => __( 'Abilities for reading and updating Jetpack Newsletter settings.', 'jetpack' ),
		);
	}

	/**
	 * Returns the abilities category, definition, or registered abilities.
	 *
	 * @inheritDoc
	 */
	public static function get_abilities(): array {
		$settings_object_schema = array(
			'type'                 => 'object',
			'additionalProperties' => false,
			'properties'           => array(
				'subscribe_post_end_enabled' => array(
					'type'        => 'boolean',
					'description' => __( 'Show a "subscribe to blog" checkbox at the end of every post. Default true.', 'jetpack' ),
				),
				'subscribe_comments_enabled' => array(
					'type'        => 'boolean',
					'description' => __( 'Show a "notify me of new comments" checkbox in the comment form. Default true.', 'jetpack' ),
				),
				'notify_admin_on_subscribe'  => array(
					'type'        => 'boolean',
					'description' => __( 'Email the site admin whenever a new subscriber signs up. Default true.', 'jetpack' ),
				),
				'reply_to'                   => array(
					'type'        => 'string',
					'enum'        => self::REPLY_TO_VALUES,
					'description' => __( 'Reply-to address for newsletter emails. "comment" routes to the post comment author, "author" to the post author, "no-reply" disables replies. Default "comment".', 'jetpack' ),
				),
				'from_name'                  => array(
					'type'        => 'string',
					'description' => __( 'Sender name shown on newsletter emails. Empty string falls back to the site name.', 'jetpack' ),
					'maxLength'   => 200,
				),
			),
		);

		return array(
			'jetpack-newsletter/get-settings'         => array(
				'label'               => __( 'Get Newsletter settings', 'jetpack' ),
				'description'         => __(
					'Return the current Jetpack Newsletter settings as a flat object. Always returns the same five fields: subscribe_post_end_enabled (bool), subscribe_comments_enabled (bool), notify_admin_on_subscribe (bool), reply_to ("comment"|"author"|"no-reply"), and from_name (string). Read-only and idempotent. To change any value, call jetpack-newsletter/update-settings.',
					'jetpack'
				),
				'input_schema'        => array(
					'type'                 => 'object',
					'default'              => array(),
					'properties'           => array(),
					'additionalProperties' => false,
				),
				'output_schema'       => $settings_object_schema,
				'execute_callback'    => array( __CLASS__, 'get_settings' ),
				'permission_callback' => array( __CLASS__, 'can_view_settings' ),
				'meta'                => array(
					'annotations'  => array(
						'readonly'    => true,
						'destructive' => false,
						'idempotent'  => true,
					),
					'show_in_rest' => true,
				),
			),

			'jetpack-newsletter/update-settings'      => array(
				'label'               => __( 'Update Newsletter settings', 'jetpack' ),
				'description'         => __(
					'Update one or more Jetpack Newsletter settings. Any subset of the five fields may be supplied; omitted fields are left untouched. Idempotent — fields whose desired value already matches the current value are not rewritten. Returns { settings: <full current state after the update>, changed: <array of field names that actually transitioned> }. An empty input or input matching the current state returns changed = [].',
					'jetpack'
				),
				'input_schema'        => $settings_object_schema,
				'output_schema'       => array(
					'type'       => 'object',
					'properties' => array(
						'settings' => $settings_object_schema,
						'changed'  => array(
							'type'        => 'array',
							'items'       => array( 'type' => 'string' ),
							'description' => __( 'Names of the fields that actually changed during this call. Empty when the call was a no-op.', 'jetpack' ),
						),
					),
				),
				'execute_callback'    => array( __CLASS__, 'update_settings' ),
				'permission_callback' => array( __CLASS__, 'can_manage_settings' ),
				'meta'                => array(
					'annotations'  => array(
						'readonly'    => false,
						'destructive' => false,
						'idempotent'  => true,
					),
					'show_in_rest' => true,
				),
			),

			'jetpack-newsletter/get-subscriber-stats' => array(
				'label'               => __( 'Get Newsletter subscriber stats', 'jetpack' ),
				'description'         => __(
					'Return aggregate subscriber counts for the site. Always returns { all: int, email: int, paid: int }: all is the total subscriber count (email + WordPress.com followers); email is the subset that receives email; paid is the subset on a paid newsletter plan. Numbers are fetched from WordPress.com and cached locally for one hour, so transient network errors yield a stale-but-non-zero response when one is available. Requires an active Jetpack connection — sites without one return jetpack_newsletter_not_connected.',
					'jetpack'
				),
				'input_schema'        => array(
					'type'                 => 'object',
					'default'              => array(),
					'properties'           => array(),
					'additionalProperties' => false,
				),
				'output_schema'       => array(
					'type'       => 'object',
					'properties' => array(
						'all'   => array( 'type' => 'integer' ),
						'email' => array( 'type' => 'integer' ),
						'paid'  => array( 'type' => 'integer' ),
					),
				),
				'execute_callback'    => array( __CLASS__, 'get_subscriber_stats' ),
				'permission_callback' => array( __CLASS__, 'can_view_settings' ),
				'meta'                => array(
					'annotations'  => array(
						'readonly'    => true,
						'destructive' => false,
						'idempotent'  => true,
					),
					'show_in_rest' => true,
				),
			),
		);
	}

	/**
	 * Permission check for read abilities. Newsletter settings live on the WP
	 * Newsletter settings screen, which is itself gated on `manage_options`.
	 */
	public static function can_view_settings(): bool {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Permission check for write abilities. Mirrors the gating on the
	 * Newsletter settings screen.
	 */
	public static function can_manage_settings(): bool {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Execute: return the current newsletter settings.
	 *
	 * @param array|null $input Unused — input schema accepts no parameters.
	 * @return array
	 */
	public static function get_settings( $input = null ): array {
		unset( $input );
		return self::current_settings();
	}

	/**
	 * Transient key for the wpcom subscriber-stats response.
	 */
	private const SUBSCRIBER_STATS_CACHE_KEY = 'jetpack_newsletter_subscriber_stats';

	/**
	 * Transient TTL for subscriber-stats responses, in seconds.
	 *
	 * Matches the existing legacy widget pattern of an hour-long cache so
	 * agents calling this ability repeatedly don't fan out to wpcom.
	 */
	private const SUBSCRIBER_STATS_CACHE_TTL = HOUR_IN_SECONDS;

	/**
	 * Execute: fetch (and cache) aggregate subscriber counts from WordPress.com.
	 *
	 * @param array|null $input Unused — input schema accepts no parameters.
	 * @return array|\WP_Error
	 */
	public static function get_subscriber_stats( $input = null ) {
		unset( $input );

		$cached = get_transient( self::SUBSCRIBER_STATS_CACHE_KEY );
		if ( is_array( $cached ) ) {
			return $cached;
		}

		if ( ! class_exists( 'Jetpack' ) || ! Jetpack::is_connection_ready() ) {
			return new \WP_Error(
				'jetpack_newsletter_not_connected',
				__( 'Subscriber stats are only available on Jetpack-connected sites. Connect Jetpack and retry.', 'jetpack' )
			);
		}

		$site_id = (int) Jetpack_Options::get_option( 'id' );
		if ( $site_id <= 0 ) {
			return new \WP_Error(
				'jetpack_newsletter_not_connected',
				__( 'No Jetpack site ID is registered. Connect Jetpack and retry.', 'jetpack' )
			);
		}

		$response = Client::wpcom_json_api_request_as_blog(
			sprintf( '/sites/%d/subscribers/stats', $site_id ),
			'2',
			array(),
			null,
			'wpcom'
		);

		if ( is_wp_error( $response ) ) {
			return new \WP_Error(
				'jetpack_newsletter_subscriber_stats_unavailable',
				$response->get_error_message()
			);
		}

		if ( 200 !== (int) wp_remote_retrieve_response_code( $response ) ) {
			return new \WP_Error(
				'jetpack_newsletter_subscriber_stats_unavailable',
				__( 'WordPress.com did not return subscriber stats. Retry shortly.', 'jetpack' )
			);
		}

		$body   = json_decode( wp_remote_retrieve_body( $response ), true );
		$counts = is_array( $body ) && isset( $body['counts'] ) && is_array( $body['counts'] )
			? $body['counts']
			: array();

		$stats = array(
			'all'   => isset( $counts['all_subscribers'] ) ? (int) $counts['all_subscribers'] : 0,
			'email' => isset( $counts['email_subscribers'] ) ? (int) $counts['email_subscribers'] : 0,
			'paid'  => isset( $counts['paid_subscribers'] ) ? (int) $counts['paid_subscribers'] : 0,
		);

		set_transient( self::SUBSCRIBER_STATS_CACHE_KEY, $stats, self::SUBSCRIBER_STATS_CACHE_TTL );

		return $stats;
	}

	/**
	 * Execute: idempotent partial update of newsletter settings.
	 *
	 * Validates every supplied field before writing anything, so a malformed
	 * field cannot leave the option set in a partially-updated state.
	 *
	 * @param array|null $input Input matching the ability's input_schema.
	 * @return array|\WP_Error
	 */
	public static function update_settings( $input = null ) {
		$input = is_array( $input ) ? $input : array();
		$map   = self::settings_map();

		// Validate + normalize every supplied field up-front. Any failure
		// short-circuits the call with no writes, so a bad field can't leave
		// earlier fields in a partially-updated state.
		$normalized = array();
		foreach ( $map as $field => $config ) {
			if ( ! array_key_exists( $field, $input ) ) {
				continue;
			}

			$result = self::normalize_input_value( $field, $config, $input[ $field ] );
			if ( $result instanceof \WP_Error ) {
				return $result;
			}
			$normalized[ $field ] = $result;
		}

		// Read every field's current value once. This pass also feeds the
		// post-update response, avoiding a second `get_option` sweep.
		$current_storage = array();
		foreach ( $map as $field => $config ) {
			$current_storage[ $field ] = self::read_option( $config );
		}

		$changed = array();
		foreach ( $normalized as $field => $desired ) {
			// String-cast on both sides because every field's storage form is
			// scalar (`0`/`1` for BOOL, `'on'`/`'off'` for ON_OFF, plain strings
			// for ENUM/STRING). New field types added later must keep that
			// invariant or this comparison will misfire.
			if ( (string) $desired === (string) $current_storage[ $field ] ) {
				continue;
			}
			update_option( $map[ $field ]['option'], $desired );
			$current_storage[ $field ] = $desired;
			$changed[]                 = $field;
		}

		$settings = array();
		foreach ( $map as $field => $config ) {
			$settings[ $field ] = self::cast_to_response( $config, $current_storage[ $field ] );
		}

		return array(
			'settings' => $settings,
			'changed'  => $changed,
		);
	}

	/**
	 * Map of public ability field name → backing option config.
	 *
	 * Storage shape (option key, type tag, default, enum). The agent-facing
	 * descriptions and JSON Schema live in `get_abilities()`; this map drives
	 * the storage-side validation, normalization, and casting.
	 *
	 * Kept as a method (not a class constant) so the description strings
	 * referenced from `cast_to_response()` and `normalize_input_value()` can
	 * resolve through `__()` at call time rather than file load time.
	 */
	private static function settings_map(): array {
		return array(
			'subscribe_post_end_enabled' => array(
				'option'  => 'stb_enabled',
				'type'    => self::TYPE_BOOL,
				'default' => 1,
			),
			'subscribe_comments_enabled' => array(
				'option'  => 'stc_enabled',
				'type'    => self::TYPE_BOOL,
				'default' => 1,
			),
			'notify_admin_on_subscribe'  => array(
				'option'  => 'social_notifications_subscribe',
				'type'    => self::TYPE_ON_OFF,
				'default' => 'on',
			),
			'reply_to'                   => array(
				'option'  => 'jetpack_subscriptions_reply_to',
				'type'    => self::TYPE_ENUM,
				'default' => Subscriptions_Settings::$default_reply_to,
				'enum'    => self::REPLY_TO_VALUES,
			),
			'from_name'                  => array(
				'option'     => 'jetpack_subscriptions_from_name',
				'type'       => self::TYPE_STRING,
				'default'    => '',
				'max_length' => 200,
			),
		);
	}

	/**
	 * Read all settings as the public response shape.
	 */
	private static function current_settings(): array {
		$out = array();
		foreach ( self::settings_map() as $field => $config ) {
			$out[ $field ] = self::cast_to_response( $config, self::read_option( $config ) );
		}
		return $out;
	}

	/**
	 * Read the raw option for a field config, falling back to its default.
	 *
	 * @param array $config Field config from `settings_map()`.
	 * @return mixed
	 */
	private static function read_option( array $config ) {
		return get_option( $config['option'], $config['default'] );
	}

	/**
	 * Validate + normalize a single input value to the storage form.
	 *
	 * @param string $field  Public field name (used in error messages).
	 * @param array  $config Field config from `settings_map()`.
	 * @param mixed  $value  Raw input value.
	 * @return mixed|\WP_Error Storage-form value, or WP_Error when invalid.
	 */
	private static function normalize_input_value( string $field, array $config, $value ) {
		switch ( $config['type'] ) {
			case self::TYPE_BOOL:
				if ( ! is_bool( $value ) ) {
					return self::invalid_field( $field, __( 'expected a boolean (true or false).', 'jetpack' ) );
				}
				return $value ? 1 : 0;

			case self::TYPE_ON_OFF:
				if ( ! is_bool( $value ) ) {
					return self::invalid_field( $field, __( 'expected a boolean (true or false).', 'jetpack' ) );
				}
				return $value ? 'on' : 'off';

			case self::TYPE_ENUM:
				// reply_to is the only enum today and shares its allowed-values
				// list with `Subscriptions_Settings::is_valid_reply_to()`. Defer
				// to that validator so the two surfaces can't drift.
				$valid = 'reply_to' === $field
					? Subscriptions_Settings::is_valid_reply_to( $value )
					: ( is_string( $value ) && in_array( $value, $config['enum'], true ) );
				if ( ! $valid ) {
					return self::invalid_field(
						$field,
						sprintf(
							/* translators: %s: comma-separated list of allowed values. */
							__( 'allowed values are %s.', 'jetpack' ),
							implode( ', ', $config['enum'] )
						)
					);
				}
				return $value;

			case self::TYPE_STRING:
				if ( ! is_string( $value ) ) {
					return self::invalid_field( $field, __( 'expected a string.', 'jetpack' ) );
				}
				$sanitized = sanitize_text_field( $value );
				if ( isset( $config['max_length'] ) && mb_strlen( $sanitized ) > (int) $config['max_length'] ) {
					return self::invalid_field(
						$field,
						sprintf(
							/* translators: %d: maximum number of characters. */
							__( 'must be %d characters or fewer.', 'jetpack' ),
							(int) $config['max_length']
						)
					);
				}
				return $sanitized;
		}

		return self::invalid_field( $field, __( 'unsupported field type.', 'jetpack' ) );
	}

	/**
	 * Cast a stored option value to the public response shape.
	 *
	 * @param array $config Field config from `settings_map()`.
	 * @param mixed $value  Raw stored value.
	 * @return mixed
	 */
	private static function cast_to_response( array $config, $value ) {
		switch ( $config['type'] ) {
			case self::TYPE_BOOL:
				return 1 === (int) $value;
			case self::TYPE_ON_OFF:
				return 'on' === (string) $value;
			case self::TYPE_ENUM:
				$value = (string) $value;
				return in_array( $value, $config['enum'], true ) ? $value : (string) $config['default'];
			case self::TYPE_STRING:
				return (string) $value;
		}
		return $value;
	}

	/**
	 * Build a `jetpack_newsletter_invalid_<field>` WP_Error with a message
	 * that names the field and tells the agent how to fix the input.
	 *
	 * @param string $field  Public field name; appears in the error code and message.
	 * @param string $reason Translated explanation of the expected value.
	 * @return \WP_Error
	 */
	private static function invalid_field( string $field, string $reason ): \WP_Error {
		return new \WP_Error(
			'jetpack_newsletter_invalid_' . $field,
			sprintf(
				/* translators: 1: field name, 2: explanation of the expected value. */
				__( 'Invalid value for "%1$s": %2$s', 'jetpack' ),
				$field,
				$reason
			)
		);
	}
}
