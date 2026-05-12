<?php
/**
 * Jetpack WAF Abilities Registration.
 *
 * Registers Jetpack WAF (Web Application Firewall) abilities with the
 * WordPress Abilities API so AI agents can read firewall mode and rule-set
 * status through the standard `wp-abilities/v1` REST surface.
 *
 * @package automattic/jetpack-waf
 */

// @phan-file-suppress PhanUndeclaredFunction, PhanUndeclaredClassMethod @phan-suppress-current-line UnusedSuppression -- Abilities API added in WP 6.9; suppressions needed for older-WP compatibility runs.

namespace Automattic\Jetpack\Waf\Abilities;

use Automattic\Jetpack\IP\Utils as IP_Utils;
use Automattic\Jetpack\Waf\Brute_Force_Protection\Brute_Force_Protection;
use Automattic\Jetpack\Waf\Waf_Rules_Manager;
use Automattic\Jetpack\Waf\Waf_Runner;
use Automattic\Jetpack\WP_Abilities\Registrar;

/**
 * Registers Jetpack WAF abilities with the WordPress Abilities API.
 *
 * Surface (read-only):
 *
 * - jetpack-waf/get-mode         — current firewall mode and rule-set status.
 * - jetpack-waf/get-rules-status — rule-set health: timestamps and file state.
 */
class Waf_Abilities extends Registrar {

	const CATEGORY_SLUG = 'jetpack-waf';

	/**
	 * Allowed values for the `mode` field returned by `get-mode`.
	 *
	 * `disabled` covers two states the WAF distinguishes internally — module
	 * inactive, or mode option missing — because from an agent's perspective
	 * "the firewall isn't filtering requests" is the same answer in both cases.
	 */
	const MODE_DISABLED = 'disabled';
	const MODE_SILENT   = 'silent';
	const MODE_NORMAL   = 'normal';

	/**
	 * {@inheritDoc}
	 */
	public static function get_category_slug(): string {
		return self::CATEGORY_SLUG;
	}

	/**
	 * {@inheritDoc}
	 */
	public static function get_category_definition(): array {
		return array(
			// "Jetpack WAF" is a product name and should not be translated.
			'label'       => 'Jetpack WAF',
			'description' => __( 'Abilities for reading Jetpack Web Application Firewall mode and rule-set status.', 'jetpack-waf' ),
		);
	}

	/**
	 * {@inheritDoc}
	 */
	public static function get_abilities(): array {
		return array(
			'jetpack-waf/get-mode'         => array(
				'label'               => __( 'Get WAF mode and status', 'jetpack-waf' ),
				'description'         => __( 'Return the firewall\'s current operating mode and high-level rule-set status as { mode, automatic_rules_active, automatic_rules_last_update, brute_force_protection_active, ip_allow_list_count, ip_block_list_count }. `mode` is "disabled" (module off or unconfigured), "silent" (logging without blocking), or "normal" (logging + blocking). `automatic_rules_last_update` is a unix timestamp or null when the rule set has never been fetched. Counts are the number of distinct IPs / ranges in each list. Read-only, idempotent, zero-arg. For the rule-set timestamps + filesystem health, call jetpack-waf/get-rules-status.', 'jetpack-waf' ),
				'input_schema'        => array(
					'type'                 => 'object',
					'properties'           => new \stdClass(),
					'additionalProperties' => false,
				),
				'output_schema'       => array(
					'type'       => 'object',
					'properties' => array(
						'mode'                          => array(
							'type' => 'string',
							'enum' => array( self::MODE_DISABLED, self::MODE_SILENT, self::MODE_NORMAL ),
						),
						'automatic_rules_active'        => array( 'type' => 'boolean' ),
						'automatic_rules_last_update'   => array( 'type' => array( 'integer', 'null' ) ),
						'brute_force_protection_active' => array( 'type' => 'boolean' ),
						'ip_allow_list_count'           => array( 'type' => 'integer' ),
						'ip_block_list_count'           => array( 'type' => 'integer' ),
					),
				),
				'execute_callback'    => array( __CLASS__, 'get_mode' ),
				'permission_callback' => array( __CLASS__, 'can_view_waf' ),
				'meta'                => array(
					'annotations'  => array(
						'readonly'    => true,
						'destructive' => false,
						'idempotent'  => true,
					),
					'show_in_rest' => true,
				),
			),

			'jetpack-waf/get-rules-status' => array(
				'label'               => __( 'Get WAF rule-set status', 'jetpack-waf' ),
				'description'         => __( 'Return rule-set health: { jetpack_waf_automatic_rules_last_updated_timestamp, jetpack_waf_last_updated_timestamp, standalone_mode, rules_file_present, rules_file_size }. Timestamps are unix integers or null when never recorded. `standalone_mode` is true when the WAF is running as a PHP prepend file (faster, before WordPress loads). `rules_file_present` and `rules_file_size` reflect the on-disk entrypoint rules file — `rules_file_size` is null when the file is absent or unreadable. Read-only, idempotent, zero-arg. For the active mode and per-list counts, call jetpack-waf/get-mode.', 'jetpack-waf' ),
				'input_schema'        => array(
					'type'                 => 'object',
					'properties'           => new \stdClass(),
					'additionalProperties' => false,
				),
				'output_schema'       => array(
					'type'       => 'object',
					'properties' => array(
						'jetpack_waf_automatic_rules_last_updated_timestamp' => array( 'type' => array( 'integer', 'null' ) ),
						'jetpack_waf_last_updated_timestamp' => array( 'type' => array( 'integer', 'null' ) ),
						'standalone_mode'    => array( 'type' => 'boolean' ),
						'rules_file_present' => array( 'type' => 'boolean' ),
						'rules_file_size'    => array( 'type' => array( 'integer', 'null' ) ),
					),
				),
				'execute_callback'    => array( __CLASS__, 'get_rules_status' ),
				'permission_callback' => array( __CLASS__, 'can_view_waf' ),
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
	 * Permission check for the read abilities.
	 *
	 * Mirrors the gating on `REST_Controller::waf_permissions_callback()` —
	 * the WAF admin UI is `manage_options`, and these reads expose the same
	 * surface, so the cap is consistent across the REST and Abilities paths.
	 */
	public static function can_view_waf(): bool {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Execute: jetpack-waf/get-mode.
	 *
	 * @param array|null $input Ignored — zero-arg ability.
	 * @return array
	 */
	public static function get_mode( $input = null ): array {
		unset( $input );

		return array(
			'mode'                          => self::resolve_mode(),
			'automatic_rules_active'        => Waf_Rules_Manager::automatic_rules_enabled(),
			'automatic_rules_last_update'   => self::nullable_timestamp(
				get_option( Waf_Rules_Manager::AUTOMATIC_RULES_LAST_UPDATED_OPTION_NAME )
			),
			'brute_force_protection_active' => (bool) Brute_Force_Protection::is_enabled(),
			'ip_allow_list_count'           => self::count_ip_list( Waf_Rules_Manager::IP_ALLOW_LIST_OPTION_NAME ),
			'ip_block_list_count'           => self::count_ip_list( Waf_Rules_Manager::IP_BLOCK_LIST_OPTION_NAME ),
		);
	}

	/**
	 * Execute: jetpack-waf/get-rules-status.
	 *
	 * @param array|null $input Ignored — zero-arg ability.
	 * @return array
	 */
	public static function get_rules_status( $input = null ): array {
		unset( $input );

		$rules_file_present = false;
		$rules_file_size    = null;

		// Only probe the on-disk rules file when the WAF runtime can resolve
		// its entrypoint. Resolving the path requires the JETPACK_WAF_ENTRYPOINT
		// constant; when it's unset (module never activated), report "absent".
		if ( defined( 'JETPACK_WAF_ENTRYPOINT' ) ) {
			$path = Waf_Runner::get_waf_file_path( JETPACK_WAF_ENTRYPOINT );
			if ( file_exists( $path ) ) {
				$rules_file_present = true;
				$size               = @filesize( $path ); // phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged -- filesize() warns on stat failures; treating those as "unknown" is the correct response shape.
				$rules_file_size    = false === $size ? null : (int) $size;
			}
		}

		return array(
			'jetpack_waf_automatic_rules_last_updated_timestamp' => self::nullable_timestamp(
				get_option( Waf_Rules_Manager::AUTOMATIC_RULES_LAST_UPDATED_OPTION_NAME )
			),
			'jetpack_waf_last_updated_timestamp' => self::nullable_timestamp(
				get_option( Waf_Rules_Manager::RULE_LAST_UPDATED_OPTION_NAME )
			),
			'standalone_mode'                    => (bool) Waf_Runner::get_standalone_mode_status(),
			'rules_file_present'                 => $rules_file_present,
			'rules_file_size'                    => $rules_file_size,
		);
	}

	/**
	 * Resolve the WAF's effective `mode` for the agent-facing response.
	 *
	 * Returns `disabled` when the module is off or the mode option is unset
	 * or set to a value the runner would reject — a single bucket for "not
	 * filtering". Otherwise returns the literal mode option value.
	 */
	private static function resolve_mode(): string {
		if ( ! Waf_Runner::is_enabled() ) {
			return self::MODE_DISABLED;
		}

		$mode = get_option( Waf_Runner::MODE_OPTION_NAME );
		if ( ! is_string( $mode ) || ! Waf_Runner::is_allowed_mode( $mode ) ) {
			return self::MODE_DISABLED;
		}

		return $mode;
	}

	/**
	 * Cast a stored timestamp option to integer or null.
	 *
	 * The WAF stores timestamps as strings or integers depending on entry
	 * point; falsy values (false, '', 0) all mean "never updated" — collapse
	 * them to null so the agent doesn't have to special-case them.
	 *
	 * @param mixed $value Raw option value.
	 * @return int|null
	 */
	private static function nullable_timestamp( $value ) {
		if ( empty( $value ) ) {
			return null;
		}
		if ( ! is_numeric( $value ) ) {
			return null;
		}
		$as_int = (int) $value;
		return $as_int > 0 ? $as_int : null;
	}

	/**
	 * Count the IP addresses / ranges stored in one of the WAF IP-list options.
	 *
	 * Uses the same parser the WAF runtime uses to enforce the list, so the
	 * count agents see matches what the firewall actually applies.
	 *
	 * @param string $option_name Option key (allow or block list).
	 * @return int
	 */
	private static function count_ip_list( string $option_name ): int {
		$raw = get_option( $option_name );
		if ( ! is_string( $raw ) || '' === $raw ) {
			return 0;
		}
		$parsed = IP_Utils::get_ip_addresses_from_string( $raw );
		return is_array( $parsed ) ? count( $parsed ) : 0;
	}
}
