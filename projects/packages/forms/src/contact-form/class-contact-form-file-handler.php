<?php
/**
 * Contact Form File Handler class.
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\ContactForm;

use Automattic\Jetpack\Unauth_File_Upload_Handler;

/**
 * Class for handling file attachments in Jetpack Contact Forms.
 *
 * This class is responsible for processing temporarily uploaded files and
 * storing them permanently in a secure location. It provides a clean interface
 * for moving files from temporary storage to permanent storage through tokens.
 *
 * @since $$next-version$$
 */
class Contact_Form_File_Handler {
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

		// Construct the full base directory path using the default base dir
		$this->base_dir = $uploads['basedir'] . '/' . self::DEFAULT_BASE_DIR . '/' . $this->secret_dir;

		// Initialize the unauth file handler
		if ( ! class_exists( 'Automattic\Jetpack\Unauth_File_Upload_Handler' ) ) {
			require_once JETPACK__PLUGIN_DIR . '_inc/lib/class-unauth-file-upload-handler.php';
		}
		$this->unauth_handler = new Unauth_File_Upload_Handler();
	}

	/**
	 * Process a single file upload using a token.
	 *
	 * @param string $token The file upload token.
	 * @return array|WP_Error File data array on success, WP_Error on failure.
	 */
	public function process_file_upload( $token ) {
		// Get temporary file information from the unauth handler
		$file_data = $this->unauth_handler->get_file_info_by_token( $token );

		if ( ! $file_data ) {
			return new \WP_Error( 'file_upload_failed', __( 'Failed to upload file.', 'jetpack-forms' ) );
		}

		$original_file_name = $file_data['original_name'];

		// Prepare the permanent storage location using year/month
		$year          = gmdate( 'Y' );
		$month         = gmdate( 'm' );
		$permanent_dir = $this->base_dir . '/' . $year . '/' . $month . '/';

		if ( ! wp_mkdir_p( $permanent_dir ) ) {
			return new \WP_Error( 'directory_creation_failed', __( 'Failed to upload file.', 'jetpack-forms' ) );
		}

		// Generate a unique filename for permanent storage
		$new_hash        = wp_hash( wp_rand( 100000, 999999 ) . microtime() );
		$new_secret_name = wp_hash( $new_hash ) . '-' . $original_file_name;
		$permanent_path  = $permanent_dir . $new_secret_name;

		// Use the unauth handler's checkout_file method to move the file from temp to permanent storage
		$checkout_result = $this->unauth_handler->checkout_file( $token, $permanent_path );

		if ( is_wp_error( $checkout_result ) ) {
			return $checkout_result;
		}

		// Get upload directory information to build proper URL
		$uploads = wp_upload_dir();

		// Convert the server path to a URL by replacing the server path with the URL path
		$file_url = str_replace(
			$uploads['basedir'],
			$uploads['baseurl'],
			$permanent_path
		);

		// Return the file data for the permanent storage
		$result = array(
			'name' => $original_file_name,
			'path' => $permanent_path,
			'url'  => $file_url,
			'hash' => $new_hash,
			'size' => wp_filesize( $permanent_path ),
		);

		return $result;
	}

	/**
	 * Delete a file from the filesystem.
	 *
	 * @since $$next-version$$
	 *
	 * @param string $file_path The path to the file to delete.
	 * @return bool True on success, false on failure.
	 */
	public function delete_file( $file_path ) {
		if ( empty( $file_path ) || ! file_exists( $file_path ) ) {
			return false;
		}

		return wp_delete_file( $file_path );
	}
}
