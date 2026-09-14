<?php
/**
 * Helper functions that are called from API even when module is inactive should be added here.
 * This file will be included in module-extras.php.
 *
 * @package jetpack
 */

if ( ! function_exists( 'jetpack_verification_extract_code' ) ) {
	/**
	 * Extract a site verification code from a meta tag.
	 *
	 * @since $$next-version$$
	 *
	 * @param string $code Verification meta tag.
	 * @return string|false Extracted code, or false when none is found.
	 */
	function jetpack_verification_extract_code( $code ) {
		$pattern = '/content=["\']?([^"\' ]*)["\' ]/is';
		preg_match( $pattern, $code, $match );

		return $match ? rawurldecode( $match[1] ) : false;
	}
}

if ( ! function_exists( 'jetpack_verification_validate_code' ) ) {
	/**
	 * Validate and normalize a site verification code.
	 *
	 * @since $$next-version$$
	 *
	 * @param mixed $code Verification code or meta tag.
	 * @return string|false Normalized code, or false when invalid.
	 */
	function jetpack_verification_validate_code( $code ) {
		if ( ! is_scalar( $code ) ) {
			return false;
		}

		// Allow printable ASCII except characters that can delimit HTML attributes or tags.
		$code_pattern = '/^(?!.*[<>"\'])[!-~]+$/';
		$code         = trim( (string) $code );

		if ( '' === $code ) {
			return '';
		}

		// Parse html meta tag if it does not look like a valid code.
		if ( ! preg_match( $code_pattern, $code ) ) {
			$code = jetpack_verification_extract_code( $code );
		}

		$code = trim( (string) $code );
		if ( '' === $code || ! preg_match( $code_pattern, $code ) ) {
			return false;
		}

		return substr( $code, 0, 100 );
	}
}

if ( ! function_exists( 'jetpack_verification_validate_codes' ) ) {
	/**
	 * Validate jetpack verification codes.
	 *
	 * @since $$next-version$$
	 *
	 * @param array $verification_services_codes - array of verification codes.
	 * @return array Validated verification codes.
	 */
	function jetpack_verification_validate_codes( $verification_services_codes ) {
		foreach ( $verification_services_codes as $key => $code ) {
			$code = jetpack_verification_validate_code( $code );
			$code = false === $code ? '' : $code;

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

if ( ! function_exists( 'jetpack_verification_validate' ) ) {
	/**
	 * Validate jetpack verification codes.
	 *
	 * @param array $verification_services_codes - array of verification codes.
	 * @return array Validated verification codes.
	 */
	function jetpack_verification_validate( $verification_services_codes ) {
		return jetpack_verification_validate_codes( $verification_services_codes );
	}
}

if ( ! function_exists( 'jetpack_verification_get_code' ) ) {
	/**
	 * Return the code we're trying to verify after decoding.
	 *
	 * @param string $code - the code we need to parse.
	 * @return string|false Extracted code, or false when none is found.
	 */
	function jetpack_verification_get_code( $code ) {
		return jetpack_verification_extract_code( $code );
	}
}
