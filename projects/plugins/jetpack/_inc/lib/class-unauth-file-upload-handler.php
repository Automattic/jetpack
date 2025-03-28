<?php
/**
 * Unauthenticated File Upload Handler for Jetpack Forms.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack;

use Automattic\Jetpack\Connection\Tokens;
use Automattic\Jetpack\Extensions\Premium_Content\JWT;
use Automattic\Jetpack\Status\Host;

/**
 * Handles temporary file uploads from unauthenticated users.
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
	 * Directory name for unauthenticated uploads.
	 *
	 * @var string
	 */
	const UNAUTH_UPLOADS_DIR = 'jetpack-unauth-uploads';

	/**
	 * Temporary storage for the current destination path during upload.
	 *
	 * @var string|null
	 */
	private $current_destination;

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

	/**
	 * Handles local file upload processing for unauthenticated requests.
	 *
	 * @param array  $file    The uploaded file data.
	 * @param string $context The context of the upload.
	 * @return array|WP_Error Array with token on success, WP_Error object on failure.
	 */
	public function handle_file_upload( $file, $context ) {
		// First check for basic upload errors.
		if ( UPLOAD_ERR_OK !== $file['error'] ) {
			return new \WP_Error(
				'upload_error',
				\__( 'File upload failed.', 'jetpack' )
			);
		}

		// Validate file type.
		$file['name'] = \sanitize_file_name( \wp_unslash( $file['name'] ) );
		$type         = \wp_check_filetype( $file['name'] );
		if ( empty( $type['type'] ) ) {
			return new \WP_Error(
				'invalid_file_type',
				\__( 'Invalid file type.', 'jetpack' )
			);
		}

		// Check file size limit.
		if ( $file['size'] > self::MAX_FILE_SIZE ) {
			return new \WP_Error(
				'file_size_limit',
				sprintf(
					/* translators: %s is the maximum file size in human readable format. */
					\__( 'File size exceeds the maximum limit of %s.', 'jetpack' ),
					size_format( self::MAX_FILE_SIZE )
				)
			);
		}

		$this->cleanup_old_uploads();

		$uploads = $this->get_unauth_uploads();

		// Check number of files limit.
		if ( count( $uploads ) >= self::MAX_FILES ) {
			return new \WP_Error(
				'max_files_limit',
				\__( 'Maximum number of temporary files reached.', 'jetpack' )
			);
		}

		// Check total size and try to free up space if needed.
		$total_size = $this->get_total_size();
		if ( ( $total_size + $file['size'] ) > self::MAX_TOTAL_SIZE ) {
			if ( ! $this->free_up_space( $file['size'] ) ) {
				return new \WP_Error(
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
		// This array contains options for wp_handle_upload function
		// 'test_form' => false tells WordPress to skip the form submission check
		// which is necessary for programmatic file uploads that don't come from a form
		$upload_overrides = array(
			'test_form' => false,
		);
		\add_filter( 'upload_dir', array( $this, 'upload_overwrites_temp' ) );
		require_once ABSPATH . 'wp-admin/includes/file.php';
		$move_result = \wp_handle_upload( $file, $upload_overrides );
		\remove_filter( 'upload_dir', array( $this, 'upload_overwrites_temp' ) );
		// Move uploaded file.
		if ( ! $move_result ) {
			return new \WP_Error( 'file_move', \__( 'Unable to process file upload.', 'jetpack' ) );
		}

		// Generate a secure token for file retrieval.
		$token = \wp_hash( $file['name'] . \wp_rand() . microtime() );

		// Store file details.
		$file_data = array(
			'filename' => $file['name'],
			'created'  => time(),
			'context'  => $context,
		);

		$this->add_unauth_upload( $token, $file_data );

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
	private function add_unauth_upload( $token, $file_data ) {
		$uploads           = $this->get_unauth_uploads();
		$uploads[ $token ] = $file_data;
		l( 'add_unauth_upload', $uploads );
		l( $token );
		return update_option( self::UNAUTH_UPLOADS_OPTION, $uploads );
	}

	/**
	 * Filters the upload directory to store files in the temporary directory.
	 *
	 * @param array $upload_dir The upload directory data.
	 * @return array The modified upload directory data.
	 */
	public function upload_overwrites_temp( $upload_dir ) {
		$secret_dir = '/' . self::UNAUTH_UPLOADS_DIR . '/' . $this->get_secret_directory();
		$upload_dir = array(
			'path'    => untrailingslashit( $upload_dir['basedir'] ) . $secret_dir,
			'url'     => untrailingslashit( $upload_dir['baseurl'] ) . $secret_dir,
			'subdir'  => '',
			'basedir' => untrailingslashit( $upload_dir['basedir'] ) . $secret_dir,
			'baseurl' => untrailingslashit( $upload_dir['baseurl'] ) . $secret_dir,
			'error'   => false,
		);
		return $upload_dir;
	}

	/**
	 * Removes oldest files until total size is under limit.
	 *
	 * @param int $required_space Space needed for new upload in bytes.
	 * @return bool True if space was freed, false if unable to free enough space.
	 */
	private function free_up_space( $required_space ) {
		$uploads   = $this->get_unauth_uploads();
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
				\wp_delete_file_from_directory( $file_path, $temp_path );
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
	 * Removes the token from the list of unauthenticated uploads.
	 *
	 * @param string $token The token to remove.
	 *
	 * @return bool True if the token was removed, false otherwise.
	 */
	private function unset_token( $token ) {
		$uploads = $this->get_unauth_uploads();
		unset( $uploads[ $token ] );
		if ( empty( $uploads ) ) {
			delete_option( self::UNAUTH_UPLOADS_OPTION );
		}
		return update_option( self::UNAUTH_UPLOADS_OPTION, $uploads );
	}

	/**
	 * Cleanup old uploads that are no longer needed.
	 * This runs daily via wp-cron.
	 */
	public function cleanup_old_uploads() {
		$uploads      = $this->get_unauth_uploads();
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
					\wp_delete_file_from_directory( $file_path, $temp_path );
				}
				$this->unset_token( $token );
			}
		}
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
			return new \WP_Error( 'dir_error', \__( 'Unable to process file upload.', 'jetpack' ) );
		}

		$temp_dir = path_join( $upload_dir['basedir'], path_join( self::UNAUTH_UPLOADS_DIR, $this->get_secret_directory() ) );

		return $temp_dir;
	}

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
	 * Gets the current total size of all temporary files.
	 *
	 * @return int Total size in bytes.
	 */
	private function get_total_size() {
		$uploads    = $this->get_unauth_uploads();
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
	 * Gets the unauthenticated uploads data.
	 *
	 * @return array The unauthenticated uploads data.
	 */
	private function get_unauth_uploads() {
		global $wpdb;
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.DirectDatabaseQuery.DirectQuery  -- To make sure that we always get the non cached values.
		$value = $wpdb->get_row( $wpdb->prepare( "SELECT option_value FROM $wpdb->options WHERE option_name = %s LIMIT 1", self::UNAUTH_UPLOADS_OPTION ), ARRAY_A );
		return empty( $value['option_value'] ) ? array() : maybe_unserialize( $value['option_value'] );
	}

	/**
	 * Removes the file from the server that was temprary added.
	 *
	 * @param string $token The token for the file.
	 * @return bool True if the token was removed, false otherwise.
	 */
	public function remove_file( $token ) {
		$uploads = $this->get_unauth_uploads();

		if ( ! isset( $uploads[ $token ] ) ) {
			return true;
		}
		$file_data = $uploads[ $token ];

		$temp_path = $this->get_secret_temp_path();
		if ( ! is_wp_error( $temp_path ) ) {
			$file_path = \trailingslashit( $temp_path ) . $file_data['filename'];
			$deleted   = \wp_delete_file_from_directory( $file_path, $temp_path );
		}

		return $deleted && $this->unset_token( $token );
	}

	/**
	 * Generate a JWT token for file upload authorization.
	 *
	 * @param array $claims The claims to include in the token.
	 * @return string The generated JWT token.
	 */
	public function generate_upload_token( $claims = array() ) {
		$default_claims = array(
			'exp' => time() + 3600, // 1 hour expiration
			'ip'  => isset( $_SERVER['REMOTE_ADDR'] ) ? sanitize_text_field( wp_unslash( $_SERVER['REMOTE_ADDR'] ) ) : '',
			'iat' => time(),
		);

		$claims = wp_parse_args( $claims, $default_claims );

		// Get the secret key for signing
		$secret = $this->get_upload_token_secret();

		// Generate and return the token
		return JWT::encode( $claims, $secret, 'HS256' );
	}

	/**
	 * Get the secret key for signing upload tokens.
	 *
	 * @return string|false The secret key or false if not available.
	 */
	private function get_upload_token_secret() {
		if ( ( new Host() )->is_wpcom_simple() ) {
			// phpcs:ignore ImportDetection.Imports.RequireImports.Symbol
			// TODO: This is a temporary solution to get the secret key for the upload token.
			return defined( 'EARN_JWT_SIGNING_KEY' ) ? EARN_JWT_SIGNING_KEY : false;
		}
		$token = ( new Tokens() )->get_access_token();
		if ( ! isset( $token->secret ) ) {
			return false;
		}
		return $token->secret;
	}

	/**
	 * Verify a JWT upload token.
	 *
	 * @param string $token The JWT token to verify.
	 * @return object|false The token claims if valid, false if invalid.
	 */
	public function verify_upload_token( $token ) {
		try {
			$secret = $this->get_upload_token_secret();
			return JWT::decode( $token, $secret, array( 'HS256' ) );
		} catch ( \Exception $e ) {
			return false;
		}
	}
}
