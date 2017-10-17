<?php

/*
 * Helper functions that are called from API even when module is inactive should be added here.
 * This file will be included in module-extras.php.
 */

function jetpack_verification_validate( &$verification_services_codes ) {
	foreach ( $verification_services_codes as $key => $code ) {
		// Parse html meta tags if present
		if ( stripos( $code, 'meta' ) )
			$code = jetpack_verification_get_code( $code );

		$code = esc_attr( trim( $code ) );

		// limit length to 100 chars.
		$code = substr( $code, 0, 100 );

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

function jetpack_verification_get_code( $code ){
	$pattern = '/content=["\']?([^"\' ]*)["\' ]/is';
	preg_match( $pattern, $code, $match );
	if ( $match ){
		return urldecode( $match[1] );
	} else {
		return false;
	}
}
