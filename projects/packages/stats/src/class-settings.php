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
		// At least one of the whitelisted keys must be present.
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

		// Validate role slugs against registered roles — but only load the role list
		// if the caller is actually writing a role field. Boolean-only writes skip
		// the wp_roles() resolution entirely. Role fields are detected from the
		// option's default value type (array → role list).
		$defaults    = Options::get_defaults();
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
			// `roles` gates `view_stats` — an empty array would lock every user out, including
			// the caller. Schema validation enforces minItems=1 on REST input, but direct PHP
			// callers bypass that path; reject explicitly here.
			if ( 'roles' === $role_field && empty( $provided[ $role_field ] ) ) {
				return new WP_Error(
					self::ERROR_PREFIX . 'invalid_roles',
					__( 'Field `roles` must be a non-empty array of role slugs — an empty list would revoke Stats access for every user.', 'jetpack-stats-pkg' )
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
				if ( ! in_array( $role, $known_roles, true ) ) {
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
			$provided[ $role_field ] = array_values( array_unique( $sanitized ) );
		}

		$before  = self::get( $keys );
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

		// `changed` is derived from the POST-WRITE snapshot, not from `$changes` alone —
		// if update_option fails or refuses to persist for any reason (DB error,
		// serialization mismatch), we must not claim a change that didn't happen.
		if ( ! empty( $changes ) ) {
			// One merged write instead of N get+update cycles via set_option.
			Options::set_options( $changes );
		}

		$after = self::get( $keys );

		return array(
			'changed'  => $after !== $before,
			'settings' => $after,
		);
	}
}
