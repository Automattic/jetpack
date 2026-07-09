<?php
/**
 * Package-owned store for the site-level Schema.org settings.
 *
 * Persists the admin-configurable values WordPress has no native source for —
 * social profiles (`sameAs`), a contact `email`, and optional `name` /
 * `description` overrides. The Organization node reads the effective values via
 * {@see self::get_organization()}; the Settings UI round-trips them through
 * {@see Schema_Settings_Controller}.
 *
 * The option is a container keyed by schema type so later types (LocalBusiness,
 * Breadcrumb) slot in without breaking the contract; only `organization` exists
 * today. Empty overrides fall back to site identity at read time, so an
 * unconfigured site still emits a valid node and later Site Title changes track.
 *
 * @package automattic/jetpack-seo-package
 */

namespace Automattic\Jetpack\SEO;

/**
 * Reads, sanitizes, and persists the site-level Schema settings.
 */
class Schema_Settings {

	/**
	 * Versioned option name. The `_v1` suffix lets a future shape change ship a
	 * new option rather than migrate in place.
	 *
	 * @var string
	 */
	const OPTION_NAME = 'jetpack_seo_schema_settings_v1';

	/**
	 * The editing payload for the Settings form / REST route: the raw stored
	 * overrides (empty where unset) plus the site-identity defaults the form shows
	 * as field placeholders. Keeping the two separate lets an empty field track the
	 * Site Title instead of freezing its value.
	 *
	 * @return array{organization: array{name: string, description: string, sameAs: array<int, string>, email: string}, defaults: array{organization: array{name: string, description: string}}}
	 */
	public static function get_editable() {
		$defaults = self::get_defaults();

		return array(
			'organization' => self::get_stored()['organization'],
			'defaults'     => array(
				'organization' => array(
					'name'        => $defaults['organization']['name'],
					'description' => $defaults['organization']['description'],
				),
			),
		);
	}

	/**
	 * Site-identity defaults for the fields WordPress has a source for: `name` /
	 * `description` from the Site Title and Tagline. Shown as placeholders and used
	 * as the fallback. `sameAs` / `email` have no source, so they aren't defaulted.
	 *
	 * @return array{organization: array{name: string, description: string}}
	 */
	public static function get_defaults() {
		return array(
			'organization' => array(
				'name'        => self::text( get_bloginfo( 'name' ) ),
				'description' => self::text( get_bloginfo( 'description' ) ),
			),
		);
	}

	/**
	 * The effective Organization settings the node consumes: stored overrides where
	 * present, site-identity defaults otherwise. `sameAs` / `email` are stored-only.
	 * Computed live so an unconfigured `name` / `description` tracks site identity.
	 *
	 * @return array{name: string, description: string, sameAs: array<int, string>, email: string}
	 */
	public static function get_organization() {
		$defaults = self::get_defaults();
		$stored   = self::get_stored();

		$organization = $stored['organization'];
		$fallbacks    = $defaults['organization'];

		return array(
			'name'        => '' !== $organization['name'] ? $organization['name'] : $fallbacks['name'],
			'description' => '' !== $organization['description'] ? $organization['description'] : $fallbacks['description'],
			'sameAs'      => $organization['sameAs'],
			'email'       => $organization['email'],
		);
	}

	/**
	 * Sanitize a raw submission and persist it, then return the new editing payload
	 * (so the caller can hand it straight back to the client).
	 *
	 * @param mixed $raw Raw input (expected to be the container array).
	 * @return array{organization: array{name: string, description: string, sameAs: array<int, string>, email: string}, defaults: array{organization: array{name: string, description: string}}}
	 */
	public static function update( $raw ) {
		update_option( self::OPTION_NAME, self::sanitize( $raw ) );
		return self::get_editable();
	}

	/**
	 * Normalize and sanitize raw input into the stored option shape: trimmed plain
	 * text for `name` / `description`, validated + deduped URLs for `sameAs`, a
	 * sanitized `email`. Defensive against non-array / non-string input.
	 *
	 * @param mixed $raw Raw input.
	 * @return array{organization: array{name: string, description: string, sameAs: array<int, string>, email: string}}
	 */
	public static function sanitize( $raw ) {
		$raw          = is_array( $raw ) ? $raw : array();
		$organization = isset( $raw['organization'] ) && is_array( $raw['organization'] )
			? $raw['organization']
			: array();

		return array(
			'organization' => array(
				'name'        => self::text( $organization['name'] ?? '' ),
				'description' => self::text( $organization['description'] ?? '' ),
				'sameAs'      => self::sanitize_url_list( $organization['sameAs'] ?? array() ),
				'email'       => self::email( $organization['email'] ?? '' ),
			),
		);
	}

	/**
	 * Normalize a list of profile URLs (`sameAs`): keep only valid absolute http(s)
	 * URLs and drop duplicates. Shared by the settings store and the Organization
	 * node so what the form stores is exactly what the schema graph emits.
	 *
	 * @param mixed $value Raw value (expected to be an array of URLs).
	 * @return array<int, string>
	 */
	public static function sanitize_url_list( $value ) {
		if ( ! is_array( $value ) ) {
			return array();
		}

		$urls = array();
		foreach ( $value as $url ) {
			if ( ! is_string( $url ) ) {
				continue;
			}

			$url = trim( $url );
			if ( '' === $url ) {
				continue;
			}

			$validated = wp_http_validate_url( $url );
			if ( false === $validated ) {
				continue;
			}

			$clean = esc_url_raw( $validated, array( 'http', 'https' ) );
			if ( '' !== $clean ) {
				$urls[] = $clean;
			}
		}

		return array_values( array_unique( $urls ) );
	}

	/**
	 * The stored settings, normalized to the full option shape (so callers can
	 * rely on every key being present even when the option is absent or partial).
	 *
	 * @return array{organization: array{name: string, description: string, sameAs: array<int, string>, email: string}}
	 */
	private static function get_stored() {
		return self::sanitize( get_option( self::OPTION_NAME, array() ) );
	}

	/**
	 * Normalize a scalar value to trimmed plain text.
	 *
	 * @param mixed $value Raw value.
	 * @return string
	 */
	private static function text( $value ) {
		if ( ! is_string( $value ) ) {
			return '';
		}
		return trim( wp_strip_all_tags( $value ) );
	}

	/**
	 * Normalize an email value.
	 *
	 * @param mixed $value Raw value.
	 * @return string
	 */
	private static function email( $value ) {
		if ( ! is_string( $value ) ) {
			return '';
		}
		return sanitize_email( $value );
	}
}
