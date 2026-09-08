<?php
/**
 * Helper functions that are called from API even when module is inactive should be added here.
 * This file will be included in module-extras.php.
 *
 * @package jetpack
 */

if ( ! function_exists( 'jetpack_verification_service_patterns' ) ) {
	/**
	 * Return the accepted character patterns for verification service codes.
	 *
	 * @return array<string, string> Verification service patterns.
	 */
	function jetpack_verification_service_patterns() {
		return array(
			'google'    => '/^[A-Za-z0-9_-]+$/',
			'bing'      => '/^[A-Fa-f0-9]+$/',
			'pinterest' => '/^[a-f0-9]+$/',
			'yandex'    => '/^[a-f0-9]+$/',
			'facebook'  => '/^[A-Za-z0-9_-]+$/',
		);
	}
}

if ( ! function_exists( 'jetpack_verification_validate' ) ) {
	/**
	 * Validate jetpack verification codes.
	 *
	 * @param array $verification_services_codes - array of verification codes.
	 */
	function jetpack_verification_validate( $verification_services_codes ) {
		$service_patterns = jetpack_verification_service_patterns();

		foreach ( $verification_services_codes as $key => $code ) {
			$code = is_scalar( $code ) ? (string) $code : '';

			// Parse html meta tag if it does not look like a valid code.
			if ( ! preg_match( '/^[a-z0-9_-]+$/i', $code ) ) {
				$code = jetpack_verification_get_code( $code );
			}

			$code = esc_attr( trim( (string) $code ) );

			// limit length to 100 chars.
			$code = substr( $code, 0, 100 );

			if ( '' !== $code && isset( $service_patterns[ $key ] ) && ! preg_match( $service_patterns[ $key ], $code ) ) {
				if ( function_exists( 'add_settings_error' ) ) {
					$services     = function_exists( 'jetpack_verification_services' ) ? jetpack_verification_services() : array();
					$service_name = isset( $services[ $key ]['name'] ) ? $services[ $key ]['name'] : ucfirst( $key );
					add_settings_error(
						'verification_services_codes',
						'invalid_' . $key . '_verification_code',
						sprintf(
							/* translators: %s: Name of the verification service. */
							__( 'Invalid verification code for %s. Enter only the content value from the meta tag.', 'jetpack' ),
							$service_name
						)
					);
				}

				$code = '';
			}

			/**
			 * Fire after each Verification code was validated.
			 *
			 * @module verification-tools
			 *
			 * @since 3.0.0
			 *
			 * @param string $key Verification service name.
			 * @param string $code Verification service code provided in field in the Tools menu.
			 */
			do_action( 'jetpack_site_verification_validate', $key, $code );

			$verification_services_codes[ $key ] = $code;
		}
		return $verification_services_codes;
	}
}

if ( ! function_exists( 'jetpack_verification_get_code' ) ) {
	/**
	 * Return the code we're trying to verify after decoding.
	 *
	 * @param string $code - the code we need to parse.
	 */
	function jetpack_verification_get_code( $code ) {
		$pattern = '/content=["\']?([^"\' ]*)["\' ]/is';
		preg_match( $pattern, $code, $match );
		if ( $match ) {
			return urldecode( $match[1] );
		} else {
			return false;
		}
	}
}
