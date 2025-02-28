<?php
/**
 * File Handler class.
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms;

use Automattic\Jetpack\Filesystem_Utils;
use Automattic\Jetpack\Unauth_File_Upload_Handler;

/**
 * Class for handling file attachments in Jetpack Forms.
 *
 * This class is responsible for processing permanently uploaded files and
 * storing them in a secure location. It provides a clean interface
 * for moving files from temporary storage to permanent storage through tokens.
 *
 * @since $$next-version$$
 */
class File_Handler {
	/**
	 * Option name for storing the secret directory for uploads.
	 *
	 * @var string
	 */
	const SECRET_DIR_OPTION = 'jetpack_forms_upload_secret_dir';

	/**
	 * Default base directory path for uploads relative to the uploads directory.
	 *
	 * @var string
	 */
	const DEFAULT_BASE_DIR = 'jetpack-forms-uploads';

	/**
	 * Base directory for storing form uploaded files.
	 *
	 * @var string
	 */
	private $base_dir;

	/**
	 * Secret directory name for additional security.
	 *
	 * @var string
	 */
	private $secret_dir;

	/**
	 * The Unauth_File_Upload_Handler instance.
	 *
	 * @var Unauth_File_Upload_Handler
	 */
	private $unauth_handler;

	/**
	 * Constructor.
	 */
	public function __construct() {
		$uploads = wp_upload_dir();
		// Get or create the secret directory component for security
		$this->secret_dir = get_option( self::SECRET_DIR_OPTION );
		if ( empty( $this->secret_dir ) ) {
			$this->secret_dir = wp_hash( get_current_blog_id() . wp_rand() . microtime() );
			update_option( self::SECRET_DIR_OPTION, $this->secret_dir, false );
		}

		// Construct the parent directory path
		$parent_dir = $uploads['basedir'] . '/' . self::DEFAULT_BASE_DIR;

		// Create the parent directory if it doesn't exist and add protection files
		if ( ! file_exists( $parent_dir ) ) {
			wp_mkdir_p( $parent_dir );
			Filesystem_Utils::create_protection_files( $parent_dir );
		}

		// Construct the full base directory path using the default base dir
		$this->base_dir = $parent_dir . '/' . $this->secret_dir;

		// Create the base directory if it doesn't exist and add protection files
		if ( ! file_exists( $this->base_dir ) ) {
			wp_mkdir_p( $this->base_dir );
			Filesystem_Utils::create_protection_files( $this->base_dir );
		}

		// Initialize the unauth file handler
		if ( ! class_exists( 'Automattic\Jetpack\Unauth_File_Upload_Handler' ) ) {
			require_once JETPACK__PLUGIN_DIR . '_inc/lib/class-unauth-file-upload-handler.php';
		}
		$this->unauth_handler = new Unauth_File_Upload_Handler();
	}

	/**
	 * Process a single file upload using a token.
	 *
	 * @param string $unauth_file_token The unauthenticated file upload token.
	 * @return array|WP_Error File data array on success, WP_Error on failure.
	 */
	public function process_file_upload( $unauth_file_token ) {
		// Get temporary file information from the unauth handler
		$file_data = $this->unauth_handler->get_file_info_by_token( $unauth_file_token );

		if ( ! $file_data ) {
			return new \WP_Error( 'file_upload_failed', __( 'Failed to upload file.', 'jetpack-forms' ) );
		}

		$original_file_name = $file_data['original_name'];

		// Prepare the permanent storage location using year/month
		$year     = gmdate( 'Y' );
		$month    = gmdate( 'm' );
		$year_dir = $this->base_dir . '/' . $year;

		// Create and protect year directory
		if ( ! file_exists( $year_dir ) ) {
			if ( ! wp_mkdir_p( $year_dir ) ) {
				return new \WP_Error( 'directory_creation_failed', __( 'Failed to upload file.', 'jetpack-forms' ) );
			}
			Filesystem_Utils::create_protection_files( $year_dir );
		}

		// Create and protect month directory
		$permanent_dir = $year_dir . '/' . $month . '/';
		if ( ! file_exists( $permanent_dir ) ) {
			if ( ! wp_mkdir_p( $permanent_dir ) ) {
				return new \WP_Error( 'directory_creation_failed', __( 'Failed to upload file.', 'jetpack-forms' ) );
			}
			Filesystem_Utils::create_protection_files( $permanent_dir );
		}

		// Generate a unique filename for permanent storage
		$new_hash        = wp_hash( wp_rand( 100000, 999999 ) . microtime() );
		$new_secret_name = wp_hash( $new_hash ) . '-' . $original_file_name;
		$permanent_path  = $permanent_dir . $new_secret_name;

		// Use the unauth handler's checkout_file method to move the file from temp to permanent storage
		$checkout_result = $this->unauth_handler->checkout_file( $unauth_file_token, $permanent_path );

		if ( is_wp_error( $checkout_result ) ) {
			return $checkout_result;
		}

		// Create a file identifier that doesn't depend on the full server path
		$relative_path = $year . '/' . $month . '/' . $new_secret_name;

		// Return the file data for the permanent storage - remove url and hash fields
		$result = array(
			'name'    => $original_file_name,
			'file_id' => $relative_path, // Store relative path as file_id instead of full path
			'size'    => wp_filesize( $permanent_path ),
		);

		return $result;
	}

	/**
	 * Get the full file path from a file identifier.
	 *
	 * @since $$next-version$$
	 *
	 * @param string $file_id The file identifier (relative path).
	 * @return string The full file path.
	 */
	public function get_file_path( $file_id ) {
		if ( empty( $file_id ) ) {
			return '';
		}

		// Reconstruct the full path using the base directory and file identifier
		return $this->base_dir . '/' . $file_id;
	}

	/**
	 * Get the file URL from a file_id
	 *
	 * @param string $file_id The file_id for the file.
	 * @return string The URL to access the file via the REST API.
	 */
	public function get_file_url( $file_id ) {
		if ( empty( $file_id ) ) {
			return '';
		}

		// Get the standard REST API URL without the file_id in the path
		$base_url = get_rest_url( null, 'wpcom/v2/forms/files' );

		// Create a nonce based directly on the file_id
		$file_nonce = wp_create_nonce( 'jetpack_forms_view_file_' . $file_id );

		return add_query_arg(
			array(
				'file_id'    => $file_id,
				'_wpnonce'   => wp_create_nonce( 'wp_rest' ),
				'file_nonce' => $file_nonce,
			),
			$base_url
		);
	}

	/**
	 * Delete a file using its identifier.
	 *
	 * @since $$next-version$$
	 *
	 * @param string $file_id The file identifier to delete.
	 * @return bool True on success, false on failure.
	 */
	public function delete_file( $file_id ) {
		if ( empty( $file_id ) ) {
			return false;
		}

		$file_path = $this->get_file_path( $file_id );

		if ( empty( $file_path ) || ! file_exists( $file_path ) ) {
			return false;
		}

		return wp_delete_file( $file_path );
	}
}
