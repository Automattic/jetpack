<?php
/**
 * The Stats settings a site owner can change.
 *
 * @package automattic/jetpack-stats
 */

namespace Automattic\Jetpack\Stats;

use WP_Error;

/**
 * Reads and validates changes to the owner-facing keys of `stats_options`.
 */
class Settings {
	const ERROR_PREFIX = 'jetpack_stats_';

	/**
	 * The `stats_options` keys a site owner can change. Each key's type comes from `Options::get_defaults()`.
	 *
	 * @var string[]
	 */
	const KEYS = array( 'admin_bar', 'roles', 'count_roles', 'do_not_track' );

	/**
	 * Get the current values of some `stats_options` keys.
	 *
	 * @param string[] $keys The keys to read.
	 * @return array
	 */
	public static function get( array $keys ): array {
		$options  = Options::get_options();
		$defaults = Options::get_defaults();
		$out      = array();
		foreach ( $keys as $key ) {
			$raw     = $options[ $key ] ?? null;
			$default = $defaults[ $key ] ?? null;
			if ( is_bool( $default ) ) {
				$out[ $key ] = (bool) $raw;
			} elseif ( is_array( $default ) ) {
				$out[ $key ] = is_array( $raw ) ? array_values( $raw ) : array();
			} else {
				$out[ $key ] = $raw;
			}
		}
		return $out;
	}

	/**
	 * Validate new values and save the ones that change.
	 *
	 * @param array    $values New values, keyed by `stats_options` key.
	 * @param string[] $keys   The keys the caller may change.
	 * @return array|WP_Error `changed` and the `settings` after the save, or why the values were refused.
	 */
	public static function update( array $values, array $keys ) {
		$unknown = array_diff( $keys, self::KEYS );
		if ( ! empty( $unknown ) ) {
			return new WP_Error(
				self::ERROR_PREFIX . 'unknown_setting',
				sprintf(
					/* translators: %s: comma-separated list of setting names. */
					__( 'Unknown Stats settings: %s.', 'jetpack-stats-pkg' ),
					implode( ', ', $unknown )
				)
			);
		}

		$provided = array_intersect_key( $values, array_flip( $keys ) );
		if ( empty( $provided ) ) {
			return new WP_Error(
				self::ERROR_PREFIX . 'missing_setting_field',
				sprintf(
					/* translators: %s: comma-separated list of writable field names. */
					__( 'Provide at least one of: %s.', 'jetpack-stats-pkg' ),
					implode( ', ', $keys )
				)
			);
		}

		$defaults    = Options::get_defaults();
		$before      = self::get( $keys );
		$known_roles = null;
		foreach ( $keys as $role_field ) {
			if ( ! array_key_exists( $role_field, $provided ) ) {
				continue;
			}
			if ( ! is_array( $defaults[ $role_field ] ?? null ) ) {
				continue;
			}
			if ( null === $known_roles ) {
				$known_roles = array_keys( wp_roles()->roles );
			}
			if ( ! is_array( $provided[ $role_field ] ) ) {
				return new WP_Error(
					self::ERROR_PREFIX . 'invalid_' . $role_field,
					sprintf(
						/* translators: %s: the offending field name. */
						__( 'Field `%s` must be an array of role slugs.', 'jetpack-stats-pkg' ),
						$role_field
					)
				);
			}
			// Direct PHP callers skip the REST schema's `minItems` check.
			if ( 'roles' === $role_field && empty( $provided[ $role_field ] ) ) {
				return new WP_Error(
					self::ERROR_PREFIX . 'invalid_roles',
					__( 'Field `roles` must be a non-empty array of role slugs.', 'jetpack-stats-pkg' )
				);
			}
			$sanitized = array();
			foreach ( $provided[ $role_field ] as $role ) {
				if ( ! is_string( $role ) || '' === $role ) {
					return new WP_Error(
						self::ERROR_PREFIX . 'invalid_role',
						sprintf(
							/* translators: 1: field name, 2: comma-separated list of valid role slugs. */
							__( 'Role slugs in `%1$s` must be non-empty strings. Known roles: %2$s.', 'jetpack-stats-pkg' ),
							$role_field,
							implode( ', ', $known_roles )
						)
					);
				}
				if ( ! in_array( $role, $known_roles, true ) && ! in_array( $role, $before[ $role_field ], true ) ) {
					return new WP_Error(
						self::ERROR_PREFIX . 'invalid_role',
						sprintf(
							/* translators: 1: unknown role slug, 2: field name, 3: comma-separated list of valid role slugs. */
							__( 'Unknown role `%1$s` in `%2$s`. Known roles: %3$s.', 'jetpack-stats-pkg' ),
							$role,
							$role_field,
							implode( ', ', $known_roles )
						)
					);
				}
				$sanitized[] = $role;
			}
			// Administrators keep `view_stats`, because the screen that changes this list needs it.
			if ( 'roles' === $role_field && ! in_array( 'administrator', $sanitized, true ) ) {
				array_unshift( $sanitized, 'administrator' );
			}
			$provided[ $role_field ] = array_values( array_unique( $sanitized ) );
		}

		$changes = array();
		foreach ( $provided as $key => $value ) {
			if ( is_bool( $defaults[ $key ] ?? null ) ) {
				$value = (bool) $value;
			}
			$current = $before[ $key ] ?? null;
			if ( $current === $value ) {
				continue;
			}
			$changes[ $key ] = $value;
		}

		if ( ! empty( $changes ) ) {
			Options::set_options( $changes );
		}

		$after = self::get( $keys );
		foreach ( $changes as $key => $value ) {
			if ( $after[ $key ] !== $value ) {
				return new WP_Error(
					self::ERROR_PREFIX . 'save_failed',
					__( 'The Stats settings could not be saved.', 'jetpack-stats-pkg' )
				);
			}
		}

		return array(
			'changed'  => $after !== $before,
			'settings' => $after,
		);
	}
}
