<?php
/**
 * Package-owned store for the site-level Schema.org settings.
 *
 * Persists the admin-configurable schema values WordPress has no native source
 * for — social profiles (`sameAs`), a contact `email`, and optional `name` /
 * `description` overrides — in a single normalized, versioned option. The
 * Organization node ({@see Organization_Schema_Node}) reads the effective values
 * through {@see self::get_organization()} (wired in {@see Schema_Builder}), and
 * the Settings UI reads/writes them through the package's own REST route
 * ({@see Schema_Settings_Controller}).
 *
 * The option is shaped as a container keyed by schema type so later schema types
 * (LocalBusiness, Breadcrumb) slot in without breaking the contract; only the
 * `organization` slice is implemented today.
 *
 * Defaults follow JETPACK-1779's "Option 3": editable fields pre-populated from
 * site identity (Site Title, Tagline). Only what the admin submits is persisted;
 * any field left empty falls back to site identity at read time, so an
 * unconfigured site still emits a valid Organization node and a later Site Title
 * change is reflected automatically. A future refinement (logged on JETPACK-1779)
 * would store a derived-vs-override marker so an explicit override can also track
 * site identity until changed — out of scope here.
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
	 * The effective settings (stored overrides merged over site-identity defaults),
	 * in the option's container shape. This is what the Settings form hydrates from
	 * and the REST route returns.
	 *
	 * @return array{organization: array{name: string, description: string, sameAs: array<int, string>, email: string}}
	 */
	public static function get() {
		return array(
			'organization' => self::get_organization(),
		);
	}

	/**
	 * The editing payload for the Settings form / REST route: the raw stored
	 * overrides (empty where the admin hasn't set a value) plus the site-identity
	 * defaults the form shows as field placeholders.
	 *
	 * Keeping the stored values separate from the defaults is what lets the form
	 * treat an empty field as "use my Site Title" rather than freezing the current
	 * value — clearing a field and saving resets it to tracking site identity.
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
	 * Site-identity-seeded defaults, in the option's container shape. `name` and
	 * `description` are seeded from the Site Title and Tagline so the form is
	 * pre-populated and editable; `sameAs` / `email` have no WordPress source and
	 * default empty.
	 *
	 * @return array{organization: array{name: string, description: string, sameAs: array<int, string>, email: string}}
	 */
	public static function get_defaults() {
		return array(
			'organization' => array(
				'name'        => self::text( get_bloginfo( 'name' ) ),
				'description' => self::text( get_bloginfo( 'description' ) ),
				'sameAs'      => array(),
				'email'       => '',
			),
		);
	}

	/**
	 * The effective Organization settings the node/glue consumes: stored overrides
	 * where present, site-identity defaults otherwise. `sameAs` / `email` are
	 * stored-only (never auto-filled).
	 *
	 * Computed live on every read rather than snapshotted, so an unconfigured
	 * `name` / `description` tracks the Site Title / Tagline without drifting. (A
	 * future "derived vs. override" marker — JETPACK-1779 — would extend this to
	 * keep explicit overrides in sync too; out of scope here.)
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
	 * Normalize and sanitize raw input into the stored option shape. Mirrors
	 * {@see Organization_Schema_Node}'s field handling: trimmed plain text for
	 * `name` / `description`, validated + deduped URLs for `sameAs`, a sanitized
	 * `email`. Defensive against non-array / non-string input.
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
				'sameAs'      => self::url_list( $organization['sameAs'] ?? array() ),
				'email'       => self::email( $organization['email'] ?? '' ),
			),
		);
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

	/**
	 * Normalize a list of profile URLs (`sameAs`): keep only valid absolute http(s)
	 * URLs and drop duplicates. Mirrors {@see Organization_Schema_Node}'s handling so
	 * what the form stores is exactly what the node emits — a URL the store keeps but
	 * the node would drop (e.g. `mailto:`, relative) would otherwise silently vanish
	 * from the output.
	 *
	 * @param mixed $value Raw value (expected to be an array of URLs).
	 * @return array<int, string>
	 */
	private static function url_list( $value ) {
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
}
