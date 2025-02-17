<?php
/**
 * Contact Form File Handler class.
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\ContactForm;

use WP_Error;
use WP_REST_Request;
use WP_REST_Response;

/**
 * Class Contact_Form_File_Handler
 *
 * Handles file uploads for contact forms
 */
class Contact_Form_File_Handler {

	/**
	 * Initialize the handler
	 */
	public static function init() {
		add_filter( 'jetpack_unauth_file_upload_handler', array( __CLASS__, 'maybe_handle_contact_form_upload' ), 10, 3 );
	}

	/**
	 * Checks if this is a contact form upload and handles it if so
	 *
	 * @param callable $default_handler The default upload handler.
	 * @param string   $context The upload context.
	 * @return callable The handler to use for this upload.
	 */
	public static function maybe_handle_contact_form_upload( $default_handler, $context ) {
		if ( $context === 'contact-form' ) {
			return array( __CLASS__, 'handle_upload' );
		}
		return $default_handler;
	}

	/**
	 * Handles the file upload for contact forms
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @param array           $file The uploaded file data.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public static function handle_upload( $request, $file ) {
		if ( ! self::validate_upload( $file ) ) {
			return new WP_Error(
				'invalid_upload',
				__( 'Invalid file upload.', 'jetpack-forms' ),
				array( 'status' => 400 )
			);
		}

		// Store file in a temporary location
		$upload_dir = wp_upload_dir();
		$temp_dir   = $upload_dir['basedir'] . '/jetpack-forms-temp';

		// Create temp directory if it doesn't exist
		if ( ! file_exists( $temp_dir ) ) {
			wp_mkdir_p( $temp_dir );
		}

		// Generate a unique filename
		$filename = wp_unique_filename( $temp_dir, $file['name'] );
		$filepath = $temp_dir . '/' . $filename;

		// Move the file
		if ( ! move_uploaded_file( $file['tmp_name'], $filepath ) ) {
			return new WP_Error(
				'upload_error',
				__( 'Failed to save uploaded file.', 'jetpack-forms' ),
				array( 'status' => 500 )
			);
		}

		// Return success response with file info
		return new WP_REST_Response(
			array(
				'success' => true,
				'data'    => array(
					'filename' => $filename,
					'filepath' => $filepath,
					'url'      => $upload_dir['baseurl'] . '/jetpack-forms-temp/' . $filename,
					'type'     => $file['type'],
					'size'     => $file['size'],
				),
			)
		);
	}

	/**
	 * Validates the uploaded file
	 *
	 * @param array $file The uploaded file data.
	 * @return bool Whether the file is valid.
	 */
	private static function validate_upload( $file ) {
		// Check for upload errors
		if ( $file['error'] !== UPLOAD_ERR_OK ) {
			return false;
		}

		// Check file size (max 5MB)
		if ( $file['size'] > 5 * 1024 * 1024 ) {
			return false;
		}

		// Check file type
		$allowed_types = array(
			'image/jpeg',
			'image/png',
			'image/gif',
			'application/pdf',
			'application/msword',
			'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
		);

		if ( ! in_array( $file['type'], $allowed_types, true ) ) {
			return false;
		}

		return true;
	}
}
