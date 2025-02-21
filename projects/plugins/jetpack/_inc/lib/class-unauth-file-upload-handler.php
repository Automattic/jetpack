<?php
/**
 * Unauthenticated File Upload Handler for Jetpack.
 *
 * Handles temporary file uploads from unauthenticated users with security measures
 * including nonce verification and automatic cleanup.
 *
 * Note: While this class shares some similar functionality with Jetpack_Media,
 * it is intentionally separate to maintain strict security boundaries for
 * unauthenticated uploads. It uses similar patterns but with additional
 * restrictions and temporary storage handling.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack;

use WP_Error;

/**
 * Class Unauth_File_Upload_Handler
 *
 * Handles unauthenticated file upload operations including:
 * - Temporary storage with secure random paths
 * - File type validation
 * - Automatic cleanup of old files
 * - Token-based file retrieval
 *
 * @since $$next-version$$
 */
class Unauth_File_Upload_Handler {

	/**
	 * Option name for storing unauth uploads data.
	 *
	 * @var string
	 */
	const UNAUTH_UPLOADS_OPTION = 'jetpack_unauth_uploads';

	/**
	 * Maximum allowed file size (20MB).
	 *
	 * @var int
	 */
	const MAX_FILE_SIZE = 20971520;

	/**
	 * Maximum total storage size (200MB).
	 *
	 * @var int
	 */
	const MAX_TOTAL_SIZE = 209715200;

	/**
	 * Maximum number of files allowed.
	 *
	 * @var int
	 */
	const MAX_FILES = 50;

	/*
	 * ================================================
	 * FILE UPLOAD AND PROCESSING METHODS
	 * ================================================
	 */

	/**
	 * Handles local file upload processing for unauthenticated requests.
	 *
	 * @param array  $file    The uploaded file data.
	 * @param string $context The context of the upload.
	 * @return array|WP_Error Array with token on success, WP_Error object on failure.
	 */
	public function handle_local_file_upload( $file, $context ) {
		// First check for basic upload errors.
		if ( UPLOAD_ERR_OK !== $file['error'] ) {
			return $this->get_upload_error_message( $file['error'] );
		}

		// Validate file type.
		$file['name'] = \sanitize_file_name( \wp_unslash( $file['name'] ) );
		$type_check   = $this->check_file_type( $file['name'] );
		if ( is_wp_error( $type_check ) ) {
			return $type_check;
		}

		// Check file size limit.
		if ( $file['size'] > self::MAX_FILE_SIZE ) {
			return new WP_Error(
				'file_size_limit',
				sprintf(
					/* translators: %s is the maximum file size in human readable format. */
					\__( 'File size exceeds the maximum limit of %s.', 'jetpack' ),
					size_format( self::MAX_FILE_SIZE )
				)
			);
		}

		$this->cleanup_old_uploads();

		$uploads = \get_option( self::UNAUTH_UPLOADS_OPTION, array() );

		// Check number of files limit.
		if ( count( $uploads ) >= self::MAX_FILES ) {
			// Try to remove old files.
			$uploads = \get_option( self::UNAUTH_UPLOADS_OPTION, array() );
			if ( count( $uploads ) >= self::MAX_FILES ) {
				return new WP_Error(
					'max_files_limit',
					\__( 'Maximum number of temporary files reached.', 'jetpack' )
				);
			}
		}

		// Check total size and try to free up space if needed.
		$total_size = $this->get_total_size();
		if ( ( $total_size + $file['size'] ) > self::MAX_TOTAL_SIZE ) {
			if ( ! $this->free_up_space( $file['size'] ) ) {
				return new WP_Error(
					'total_size_limit',
					\__( 'Total storage limit reached. Please try again later.', 'jetpack' )
				);
			}
		}

		// All validation passed, now handle the actual file upload.
		$result = $this->store_uploaded_file( $file, $context );
		if ( is_wp_error( $result ) ) {
			return $result;
		}

		return array(
			'token' => $result,
		);
	}

	/**
	 * Stores an uploaded file in the temporary directory.
	 *
	 * @param array  $file      The uploaded file data.
	 * @param string $context   The context of the upload.
	 * @return string|WP_Error Token on success, WP_Error on failure.
	 */
	private function store_uploaded_file( $file, $context ) {

		$upload_dir = \wp_upload_dir();
		if ( ! empty( $upload_dir['error'] ) ) {
			return new WP_Error( 'dir_error', \__( 'Unable to process file upload.', 'jetpack' ) );
		}

		$temp_dir = path_join( $upload_dir['basedir'], 'jetpack-upload/' . $this->get_secret_directory() . '/temp' );
		if ( ! file_exists( $temp_dir ) ) {
			$create_dir = \wp_mkdir_p( $temp_dir );
			if ( ! $create_dir ) {
				return new WP_Error( 'dir_create', \__( 'Unable to process file upload.', 'jetpack' ) );
			}
		}

		$secret_file_name    = $this->generate_secure_filename( $file['name'] );
		$new_secret_filename = \wp_unique_filename( $temp_dir, $secret_file_name );

		// Move uploaded file.
		$move_result = move_uploaded_file( $file['tmp_name'], $temp_dir . '/' . $new_secret_filename );
		if ( ! $move_result ) {
			return new WP_Error( 'file_move', \__( 'Unable to process file upload.', 'jetpack' ) );
		}

		// Generate a secure token for file retrieval.
		$token = \wp_hash( $new_secret_filename . \wp_rand() . microtime() );

		// Store file details.
		$file_data = array(
			'filename'      => $new_secret_filename,
			'path'          => $temp_dir,
			'original_name' => $file['name'],
			'created'       => time(),
			'context'       => $context,
		);

		$this->update_file_info( $token, $file_data );

		return $token;
	}

	/**
	 * Store the information about the temporary uploaded file.
	 * This information is used to retrieve the file later.
	 * As well as helps us figure out what needs to be deleted.
	 *
	 * @param string $token The token for the file.
	 * @param array  $file_data The data about the file.
	 *
	 * @return bool True if the file info was updated, false otherwise.
	 */
	private function update_file_info( $token, $file_data ) {
		$uploads           = \get_option( self::UNAUTH_UPLOADS_OPTION, array() );
		$uploads[ $token ] = $file_data;
		return update_option( self::UNAUTH_UPLOADS_OPTION, $uploads, false );
	}

	/*
	 * ================================================
	 * VALIDATION AND SECURITY METHODS
	 * ================================================
	 */

	/**
	 * Gets the list of allowed mime types for file uploads.
	 *
	 * Uses Jetpack's allowed mime types for media uploads through a filter,
	 * similar to how Jetpack_Media handles it.
	 *
	 * @param array $default_mime_types Array of mime types.
	 * @return array Array of allowed mime types.
	 */
	public static function get_allowed_mime_types( $default_mime_types = array() ) {
		if ( empty( $default_mime_types ) ) {
			$default_mime_types = array(
				// Image formats.
				'jpg|jpeg|jpe' => 'image/jpeg',
				'gif'          => 'image/gif',
				'png'          => 'image/png',
				'bmp'          => 'image/bmp',
				'tiff|tif'     => 'image/tiff',
				'webp'         => 'image/webp',
				'avif'         => 'image/avif',
				'ico'          => 'image/x-icon',

				// TODO: Needs improvement. All images with the following mime types seem to have .heic file extension.
				'heic'         => 'image/heic',
				'heif'         => 'image/heif',
				'heics'        => 'image/heic-sequence',
				'heifs'        => 'image/heif-sequence',
			);
		}

		/**
		 * Filter the allowed mime types for unauthenticated uploads.
		 *
		 * @since $$next-version$$
		 *
		 * @param array $default_mime_types Array of mime types.
		 */
		return apply_filters( 'jetpack_unauth_upload_mime_types', $default_mime_types );
	}

	/**
	 * Checks if the file type is allowed.
	 *
	 * @param string $file_name The name of the file to check.
	 * @return true|WP_Error True if the file type is allowed, WP_Error object otherwise.
	 */
	public function check_file_type( $file_name ) {
		$allowed_mime_types = self::get_allowed_mime_types();
		$file_type          = \wp_check_filetype( $file_name, $allowed_mime_types );

		if ( ! $file_type['type'] ) {
			return new WP_Error(
				'invalid_file_type',
				\__( 'Invalid file type. Please check the list of allowed file types.', 'jetpack' )
			);
		}

		if ( ! in_array( $file_type['type'], $allowed_mime_types, true ) ) {
			return new WP_Error(
				'invalid_file_type',
				\__( 'File type not allowed for security reasons.', 'jetpack' )
			);
		}

		return true;
	}

	/**
	 * Gets an error message for file upload errors.
	 *
	 * @param int $error_code The error code from the file upload.
	 * @return WP_Error Error object with the error message.
	 */
	public function get_upload_error_message( $error_code ) {
		$error_message = \__( 'Failed to upload file.', 'jetpack' );

		switch ( $error_code ) {
			case UPLOAD_ERR_INI_SIZE:
			case UPLOAD_ERR_FORM_SIZE:
				$error_message = \__( 'The uploaded file exceeds the maximum allowed size.', 'jetpack' );
				break;
			case UPLOAD_ERR_PARTIAL:
				$error_message = \__( 'The file was only partially uploaded.', 'jetpack' );
				break;
			case UPLOAD_ERR_NO_FILE:
				$error_message = \__( 'No file was uploaded.', 'jetpack' );
				break;
		}

		return new WP_Error(
			'upload_error',
			$error_message
		);
	}

	/*
	 * ================================================
	 * FILE MANAGEMENT AND UTILITY METHODS
	 * ================================================
	 */

	/**
	 * Gets a secure upload directory for temporary files.
	 *
	 * @return string The secret directory name.
	 */
	private function get_secret_directory() {
		$secret_dir = \get_option( 'jetpack_upload_dir', false );
		if ( ! $secret_dir ) {
			$secret_dir = \wp_generate_password( 64, false );
			\update_option( 'jetpack_upload_dir', $secret_dir, false );
		}
		return $secret_dir;
	}

	/**
	 * Generates a secure filename for temporary uploads.
	 *
	 * @param string $original_filename The original filename.
	 * @return string A secure random filename.
	 */
	private function generate_secure_filename( $original_filename ) {
		$file_parts = pathinfo( $original_filename );
		$extension  = isset( $file_parts['extension'] ) ? strtolower( $file_parts['extension'] ) : '';
		$base       = crc32( $file_parts['filename'] );
		$unique     = sprintf( '%s-%s-%s', $base, time(), wp_generate_password( 8, false, false ) );

		return $extension ? "{$unique}.{$extension}" : $unique;
	}

	/**
	 * Gets the current total size of all temporary files.
	 *
	 * @return int Total size in bytes.
	 */
	private function get_total_size() {
		$uploads    = \get_option( self::UNAUTH_UPLOADS_OPTION, array() );
		$total_size = 0;

		foreach ( $uploads as $file_data ) {
			$file_path = \trailingslashit( $file_data['path'] ) . $file_data['filename'];
			if ( file_exists( $file_path ) ) {
				$total_size += filesize( $file_path );
			}
		}

		return $total_size;
	}

	/**
	 * Removes oldest files until total size is under limit.
	 *
	 * @param int $required_space Space needed for new upload in bytes.
	 * @return bool True if space was freed, false if unable to free enough space.
	 */
	private function free_up_space( $required_space ) {
		$uploads = \get_option( self::UNAUTH_UPLOADS_OPTION, array() );

		// Sort by creation time, oldest first.
		uasort(
			$uploads,
			function ( $a, $b ) {
				return $a['created'] - $b['created'];
			}
		);

		$freed_space  = 0;
		$total_needed = $this->get_total_size() + $required_space - self::MAX_TOTAL_SIZE;

		foreach ( $uploads as $token => $file_data ) {
			$file_path = \trailingslashit( $file_data['path'] ) . $file_data['filename'];
			if ( file_exists( $file_path ) ) {
				$file_size = filesize( $file_path );
				\wp_delete_file( $file_path );
				$freed_space += $file_size;
				unset( $uploads[ $token ] );
				\update_option( self::UNAUTH_UPLOADS_OPTION, $uploads, false );

				if ( $freed_space >= $total_needed ) {
					return true;
				}
			}
		}

		return false;
	}

	/**
	 * Retrieves file details using a token.
	 *
	 * @param string $token The file token.
	 * @return array|WP_Error Array with file data on success, WP_Error object on failure.
	 */
	public function get_file_by_token( $token ) {
		$uploads = \get_option( self::UNAUTH_UPLOADS_OPTION, array() );

		if ( ! isset( $uploads[ $token ] ) ) {
			return new WP_Error(
				'invalid_token',
				\__( 'Invalid file token.', 'jetpack' )
			);
		}

		$file_data = $uploads[ $token ];
		$file_path = \trailingslashit( $file_data['path'] ) . $file_data['filename'];

		if ( ! file_exists( $file_path ) ) {
			// Remove the entry if file doesn't exist.
			unset( $uploads[ $token ] );
			\update_option( self::UNAUTH_UPLOADS_OPTION, $uploads, false );

			return new WP_Error(
				'file_not_found',
				\__( 'The uploaded file no longer exists.', 'jetpack' )
			);
		}

		\wp_delete_file( $file_path );
		unset( $uploads[ $token ] );
		\update_option( self::UNAUTH_UPLOADS_OPTION, $uploads, false );

		return array(
			'original_name' => $file_data['original_name'],
			'created'       => $file_data['created'],
			'context'       => $file_data['context'],
		);
	}

	/**
	 * Cleanup old uploads that are no longer needed.
	 * This runs daily via wp-cron.
	 */
	public function cleanup_old_uploads() {
		$uploads      = \get_option( self::UNAUTH_UPLOADS_OPTION, array() );
		$current_time = time();
		$max_age      = DAY_IN_SECONDS;

		foreach ( $uploads as $token => $file_data ) {
			if ( ( $current_time - $file_data['created'] ) > $max_age ) {
				$file_path = \trailingslashit( $file_data['path'] ) . $file_data['filename'];
				if ( file_exists( $file_path ) ) {
					\wp_delete_file( $file_path );
				}
				unset( $uploads[ $token ] );
			}
		}

		\update_option( self::UNAUTH_UPLOADS_OPTION, $uploads, false );
	}
}
