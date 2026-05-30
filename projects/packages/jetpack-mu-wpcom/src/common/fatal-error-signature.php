<?php
/**
 * Shared helper that builds a transportable fatal-error signature: a
 * base64url-encoded JSON token over (kind, slug, version, wp, php) so
 * consumers can group on the decoded parts. Reversible by design — the
 * data is non-PII and already visible to admins on the fatal-error screen.
 *
 * @package automattic/jetpack-mu-wpcom
 */

if ( ! function_exists( 'wpcom_build_fatal_error_signature' ) ) {
	/**
	 * Build a transportable fatal-error signature from extension metadata.
	 *
	 * Slug is lowercased and PHP_VERSION is reduced to MAJOR.MINOR.PATCH
	 * so distro suffixes don't fragment grouping. Returns null without an
	 * identifiable extension — a naked wp/php-only signature would absorb
	 * every unidentified fatal. Accepts canonical labels (plugin/muplugin/
	 * theme) or directory names (plugins/mu-plugins/themes) for `kind`.
	 *
	 * @param array $extension {
	 *     Required. Extension metadata.
	 *
	 *     @type string $kind    plugin|muplugin|theme (or plugins|mu-plugins|themes).
	 *     @type string $slug    Extension slug.
	 *     @type string $version Extension version string.
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
			'php'     => sprintf( '%d.%d.%d', PHP_MAJOR_VERSION, PHP_MINOR_VERSION, PHP_RELEASE_VERSION ),
		);

		$json = wp_json_encode( $parts, JSON_UNESCAPED_SLASHES );
		if ( false === $json ) {
			return null;
		}

		// base64url: URL-safe alphabet, padding stripped.
		// phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_encode -- transport encoding, not obfuscation.
		return rtrim( strtr( base64_encode( $json ), '+/', '-_' ), '=' );
	}
}

if ( ! function_exists( 'wpcom_decode_fatal_error_signature' ) ) {
	/**
	 * Decode a fatal-error signature back to its parts array.
	 *
	 * @param string $token Base64url-encoded JSON token.
	 * @return array{kind:string,slug:string,version:string,wp:string,php:string}|null
	 *     Decoded parts, or null when the token is empty / malformed / wrong shape.
	 */
	function wpcom_decode_fatal_error_signature( $token ) {
		if ( ! is_string( $token ) || '' === $token ) {
			return null;
		}

		// Reverse base64url: restore alphabet and re-pad for strict decode.
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
