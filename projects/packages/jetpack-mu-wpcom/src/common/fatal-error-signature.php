<?php
/**
 * Shared helper that builds a transportable signature describing the
 * combination of (extension, extension version, WordPress core version,
 * PHP version) involved in a fatal error or breakage event.
 *
 * The signature is `base64url( wp_json_encode( $parts ) )` — a single
 * URL-safe string that travels over the wire as one field and decodes
 * back to its parts so consumers can group on (kind, slug, version, wp,
 * php). It is intentionally reversible (no encryption): the data is
 * non-PII and is already visible to admins on the fatal-error screen,
 * so obscurity buys nothing here.
 *
 * Format precedent: this mirrors the encoding shape used by
 * Automattic\Jetpack\Connection\Error_Handler::encrypt_data_to_wpcom()
 * (base64 of a JSON-encoded payload), minus the libsodium seal that
 * class adds for sensitive transport.
 *
 * @package automattic/jetpack-mu-wpcom
 */

if ( ! function_exists( 'wpcom_build_fatal_error_signature' ) ) {
	/**
	 * Build a transportable fatal-error signature from extension metadata.
	 *
	 * Augments the caller-supplied extension info with the running
	 * WordPress core version and PHP version, normalizes both, and
	 * returns a base64url-encoded JSON token. The slug is lowercased and
	 * PHP_VERSION is reduced to MAJOR.MINOR.PATCH so distro suffixes
	 * (e.g. "8.2.10-1+ubuntu") don't fragment the grouping.
	 *
	 * Returns null when the input doesn't have enough to identify an
	 * extension. We deliberately don't emit a "naked" wp/php-only
	 * signature because that bucket would absorb every unidentified
	 * fatal and drown out the meaningful groupings.
	 *
	 * Accepts both canonical labels ("plugin", "muplugin", "theme") and
	 * the WP-internal directory names ("plugins", "mu-plugins", "themes")
	 * for `kind`, so callers can pass through whatever they already have.
	 *
	 * @param array $extension {
	 *     Required. Extension metadata.
	 *
	 *     @type string $kind    Extension kind: plugin|muplugin|theme (or
	 *                           plugins|mu-plugins|themes).
	 *     @type string $slug    Extension slug (directory name for plugins,
	 *                           stylesheet slug for themes).
	 *     @type string $version Extension version string. Empty allowed but
	 *                           collapses fatals across versions.
	 * }
	 * @return string|null Base64url-encoded JSON token, or null on bad input.
	 */
	function wpcom_build_fatal_error_signature( $extension ) {
		if ( ! is_array( $extension ) ) {
			return null;
		}

		$kind_aliases = array(
			'plugins'    => 'plugin',
			'mu-plugins' => 'muplugin',
			'themes'     => 'theme',
			'plugin'     => 'plugin',
			'muplugin'   => 'muplugin',
			'theme'      => 'theme',
		);
		$raw_kind     = isset( $extension['kind'] ) ? (string) $extension['kind'] : '';
		if ( ! isset( $kind_aliases[ $raw_kind ] ) ) {
			return null;
		}

		$slug = isset( $extension['slug'] ) ? strtolower( trim( (string) $extension['slug'] ) ) : '';
		if ( '' === $slug ) {
			return null;
		}

		global $wp_version;

		$parts = array(
			'kind'    => $kind_aliases[ $raw_kind ],
			'slug'    => $slug,
			'version' => isset( $extension['version'] ) ? trim( (string) $extension['version'] ) : '',
			'wp'      => isset( $wp_version ) ? trim( (string) $wp_version ) : '',
			// Normalize PHP_VERSION to MAJOR.MINOR.PATCH so distro
			// suffixes don't fragment the grouping.
			'php'     => sprintf( '%d.%d.%d', PHP_MAJOR_VERSION, PHP_MINOR_VERSION, PHP_RELEASE_VERSION ),
		);

		$json = wp_json_encode( $parts, JSON_UNESCAPED_SLASHES );
		if ( false === $json ) {
			return null;
		}

		// base64url per RFC 4648 §5: URL-safe alphabet, padding stripped.
		// phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_encode -- transport encoding, not obfuscation.
		return rtrim( strtr( base64_encode( $json ), '+/', '-_' ), '=' );
	}
}

if ( ! function_exists( 'wpcom_decode_fatal_error_signature' ) ) {
	/**
	 * Decode a fatal-error signature back to its parts array.
	 *
	 * Reverses wpcom_build_fatal_error_signature(). Callers ingesting
	 * fatal-error events get the full {kind, slug, version, wp, php}
	 * tuple to group on.
	 *
	 * @param string $token Base64url-encoded JSON token.
	 * @return array{kind:string,slug:string,version:string,wp:string,php:string}|null
	 *     Decoded parts, or null when the token is empty / malformed / wrong shape.
	 */
	function wpcom_decode_fatal_error_signature( $token ) {
		if ( ! is_string( $token ) || '' === $token ) {
			return null;
		}

		// Reverse base64url: restore standard alphabet and re-pad to a
		// multiple of 4 so base64_decode in strict mode accepts it.
		$std = strtr( $token, '-_', '+/' );
		$pad = strlen( $std ) % 4;
		if ( $pad > 0 ) {
			$std .= str_repeat( '=', 4 - $pad );
		}

		// phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_decode -- transport encoding, not obfuscation.
		$json = base64_decode( $std, true );
		if ( false === $json ) {
			return null;
		}

		$parts = json_decode( $json, true );
		if ( ! is_array( $parts ) ) {
			return null;
		}

		// Reject anything that doesn't look like a signature payload, so
		// callers can distinguish "decoded fine" from "got something else".
		foreach ( array( 'kind', 'slug', 'version', 'wp', 'php' ) as $key ) {
			if ( ! array_key_exists( $key, $parts ) || ! is_string( $parts[ $key ] ) ) {
				return null;
			}
		}

		return array(
			'kind'    => $parts['kind'],
			'slug'    => $parts['slug'],
			'version' => $parts['version'],
			'wp'      => $parts['wp'],
			'php'     => $parts['php'],
		);
	}
}
