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

require_once JETPACK__PLUGIN_DIR . '_inc/lib/class-filesystem-utils.php';

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
	 * Option name for storing the secret directory name.
	 *
	 * @var string
	 */
	const UNAUTH_UPLOADS_DIR_OPTION = 'jetpack_unauth_upload_dir';

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
		$type_check   = Filesystem_Utils::check_file_type( $file['name'] );
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

		$temp_path = $this->get_secret_temp_path();
		if ( is_wp_error( $temp_path ) ) {
			return $temp_path;
		}

		$new_secret_filename = Filesystem_Utils::generate_secure_filename( $file['name'] );

		// Move uploaded file.
		$move_result = move_uploaded_file( $file['tmp_name'], $temp_path . '/' . $new_secret_filename );
		if ( ! $move_result ) {
			return new WP_Error( 'file_move', \__( 'Unable to process file upload.', 'jetpack' ) );
		}

		// Generate a secure token for file retrieval.
		$token = \wp_hash( $new_secret_filename . \wp_rand() . microtime() );

		// Store file details.
		$file_data = array(
			'filename'      => $new_secret_filename,
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
		$secret_dir = \get_option( self::UNAUTH_UPLOADS_DIR_OPTION, false );
		if ( ! $secret_dir ) {
			$secret_dir = \wp_generate_password( 64, false );
			\update_option( self::UNAUTH_UPLOADS_DIR_OPTION, $secret_dir, false );
		}
		return $secret_dir;
	}

	/**
	 * Gets the temporary path for storing uploaded files.
	 * This path is unique to each site and is used to store temporary files that are uploaded by unauthenticated users.
	 *
	 * @return string|WP_Error The path to the temporary directory, or WP_Error object on failure.
	 */
	private function get_secret_temp_path() {
		$upload_dir = \wp_upload_dir();

		if ( ! empty( $upload_dir['error'] ) ) {
			return new WP_Error( 'dir_error', \__( 'Unable to process file upload.', 'jetpack' ) );
		}

		$temp_dir = path_join( $upload_dir['basedir'], 'jetpack-upload/' . $this->get_secret_directory() . '/temp' );

		if ( ! Filesystem_Utils::create_protected_directory( $temp_dir ) ) {
			return new WP_Error( 'dir_create', \__( 'Unable to process file upload.', 'jetpack' ) );
		}

		return $temp_dir;
	}

	/**
	 * Gets the current total size of all temporary files.
	 *
	 * @return int Total size in bytes.
	 */
	private function get_total_size() {
		$uploads    = \get_option( self::UNAUTH_UPLOADS_OPTION, array() );
		$temp_path  = $this->get_secret_temp_path();
		$total_size = 0;

		if ( is_wp_error( $temp_path ) ) {
			return $total_size;
		}

		foreach ( $uploads as $file_data ) {
			$file_path = \trailingslashit( $temp_path ) . $file_data['filename'];
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
		$uploads   = \get_option( self::UNAUTH_UPLOADS_OPTION, array() );
		$temp_path = $this->get_secret_temp_path();

		if ( is_wp_error( $temp_path ) ) {
			return false;
		}

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
			$file_path = \trailingslashit( $temp_path ) . $file_data['filename'];
			if ( file_exists( $file_path ) ) {
				$file_size = filesize( $file_path );
				wp_delete_file_from_directory( $file_path, $temp_path );
				$freed_space += $file_size;
				$this->unset_token( $token );
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
	 * @param string $destination The destination path for the file.
	 *
	 * @return array|WP_Error Array with file data on success, WP_Error object on failure.
	 */
	public function checkout_file( $token, $destination ) {
		global $wp_filesystem;

		$uploads = \get_option( self::UNAUTH_UPLOADS_OPTION, array() );

		if ( ! isset( $uploads[ $token ] ) ) {
			return new WP_Error(
				'invalid_token',
				\__( 'Invalid file token.', 'jetpack' )
			);
		}

		$temp_path = $this->get_secret_temp_path();
		if ( is_wp_error( $temp_path ) ) {
			return $temp_path;
		}

		$file_data = $uploads[ $token ];

		$file_path = \trailingslashit( $temp_path ) . $file_data['filename'];

		if ( ! file_exists( $file_path ) ) {
			// Remove the entry if file doesn't exist.
			$this->unset_token( $token );

			return new WP_Error(
				'file_not_found',
				\__( 'The uploaded file no longer exists.', 'jetpack' )
			);
		}

		require_once ABSPATH . 'wp-admin/includes/file.php';

		$initialized = \WP_Filesystem();

		if ( ! $initialized ) {
			return new WP_Error(
				'filesystem_error',
				\__( 'Could not initialize filesystem.', 'jetpack' )
			);
		}

		if ( ! $wp_filesystem || ! is_object( $wp_filesystem ) ) {
			return new WP_Error(
				'filesystem_error',
				\__( 'Filesystem object not available.', 'jetpack' )
			);
		}

		$move_result = $wp_filesystem->move( $file_path, $destination );

		if ( is_wp_error( $move_result ) ) {
			return $move_result;
		}

		$this->unset_token( $token );

		return array(
			'original_name' => $file_data['original_name'],
			'created'       => $file_data['created'],
			'context'       => $file_data['context'],
		);
	}
	/**
	 * Removes the file from the server that was temprary added.
	 *
	 * @param string $token The token for the file.
	 * @return bool True if the token was removed, false otherwise.
	 */
	public function remove_file( $token ) {
		$uploads = \get_option( self::UNAUTH_UPLOADS_OPTION, array() );

		if ( ! isset( $uploads[ $token ] ) ) {
			return true;
		}

		$secret_temp_path = $this->get_secret_temp_path();
		$file_data        = $uploads[ $token ];
		$file_path        = \trailingslashit( $secret_temp_path ) . $file_data['filename'];

		wp_delete_file_from_directory( $file_path, $secret_temp_path );

		return $this->unset_token( $token );
	}

	/**
	 * Removes the token from the list of unauthenticated uploads.
	 *
	 * @param string $token The token to remove.
	 *
	 * @return bool True if the token was removed, false otherwise.
	 */
	private function unset_token( $token ) {
		$uploads = \get_option( self::UNAUTH_UPLOADS_OPTION, array() );
		unset( $uploads[ $token ] );
		if ( empty( $uploads ) ) {
			return \delete_option( self::UNAUTH_UPLOADS_OPTION );
		}
		return \update_option( self::UNAUTH_UPLOADS_OPTION, $uploads, false );
	}

	/**
	 * Cleanup old uploads that are no longer needed.
	 * This runs daily via wp-cron.
	 */
	public function cleanup_old_uploads() {
		$uploads      = \get_option( self::UNAUTH_UPLOADS_OPTION, array() );
		$current_time = time();
		$max_age      = DAY_IN_SECONDS;
		$temp_path    = $this->get_secret_temp_path();

		// Only proceed if we have a valid temp path
		if ( is_wp_error( $temp_path ) ) {
			return;
		}

		foreach ( $uploads as $token => $file_data ) {
			if ( ( $current_time - $file_data['created'] ) > $max_age ) {
				$file_path = \trailingslashit( $temp_path ) . $file_data['filename'];
				if ( file_exists( $file_path ) ) {
					wp_delete_file_from_directory( $file_path, $temp_path );
				}
				unset( $uploads[ $token ] );
			}
		}

		\update_option( self::UNAUTH_UPLOADS_OPTION, $uploads, false );
	}

	/**
	 * Gets file information for a given token.
	 *
	 * @param string $token The token for the file.
	 * @return array|false Array of file information if found, false if not found.
	 */
	public function get_file_info_by_token( $token ) {
		$uploads = \get_option( self::UNAUTH_UPLOADS_OPTION, array() );
		return isset( $uploads[ $token ] ) ? $uploads[ $token ] : false;
	}
}
