<?php

/**
 * $error is a WP_Error (always) and contains a "signature_details" data property with this structure:
 * The error_code has one of the following values:
 * - malformed_token
 * - malformed_user_id
 * - unknown_token
 * - could_not_sign
 * - invalid_nonce
 * - signature_mismatch
 */
function jetpack_token_send_signature_error_header( $error ) {
	if ( ! isset( $_SERVER['UNSAFELY_REPORT_JETPACK_TOKEN_STATUS'] ) || ! $_SERVER['UNSAFELY_REPORT_JETPACK_TOKEN_STATUS'] ) {
		return;
	}

	$error_data = $error->get_error_data();
	if ( ! isset( $error_data['signature_details'] ) ) {
		return;
	}
	header( sprintf(
		'X-Jetpack-Signature-Error: %s',
		$error->get_error_code()
	) );
	header( sprintf(
		'X-Jetpack-Signature-Error-Message: %s',
		$error->get_error_message()
	) );
	header( sprintf(
		'X-Jetpack-Signature-Error-Details: %s',
		base64_encode( json_encode( $error_data['signature_details'] ) )
	) );
}

add_action( 'jetpack_verify_signature_error', 'jetpack_token_send_signature_error_header' );
