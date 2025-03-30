<?php
/**
 * File that sets up Jetpack integration with the Forms package.
 *
 * @package automattic/jetpack
 */

/**
 * Registers filters for integration with Forms package.
 */
function jetpack_forms_integration_init() {
	// Only add the hook if we have the forms package
	if ( ! class_exists( 'Automattic\Jetpack\Forms\ContactForm\Contact_Form_Field' ) ) {
		return;
	}

	// Add filter to provide the upload token
	add_filter( 'jetpack_forms_file_upload_token', 'jetpack_forms_provide_upload_token' );

	// Add filter to get file data from token
	add_filter( 'jetpack_forms_get_file_data_from_token', 'jetpack_forms_get_file_data_from_token', 10, 2 );
}
add_action( 'init', 'jetpack_forms_integration_init' );

/**
 * Provides an upload token using the Unauth_File_Upload_Handler.
 *
 * @return string The generated upload token.
 */
function jetpack_forms_provide_upload_token() {
	l( 'PROVIDE UPLOAD TOKEN' );
	require_once JETPACK__PLUGIN_DIR . '/_inc/lib/class-unauth-file-upload-handler.php';
	$handler = new Automattic\Jetpack\Unauth_File_Upload_Handler();
	return $handler->generate_upload_token();
}

/**
 * Gets file data from a token using the Unauth_File_Upload_Handler.
 * Also includes the full path to the temporary file.
 *
 * @param array  $default_data Default empty array.
 * @param string $token        The file token.
 * @return array The file data.
 */
function jetpack_forms_get_file_data_from_token( $default_data, $token ) {
	require_once JETPACK__PLUGIN_DIR . '/_inc/lib/class-unauth-file-upload-handler.php';
	$handler   = new Automattic\Jetpack\Unauth_File_Upload_Handler();
	$file_data = $handler->get_file_data( $token );

	if ( ! $file_data ) {
		return $default_data;
	}

	return $file_data;
}
