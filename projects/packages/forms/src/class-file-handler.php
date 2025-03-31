<?php
/**
 * File Handler for Jetpack Forms.
 *
 * @package automattic/jetpack-forms
 * @since $$next-version$$
 */

namespace Automattic\Jetpack\Forms;

use WP_Error;

/**
 * Handles file uploads for Jetpack Forms.
 */
class File_Handler {
	/**
	 * Meta key for storing file attachments.
	 *
	 * @var string
	 */
	const FILE_ATTACHMENTS_META_KEY = '_feedback_file_attachments';

	/**
	 * Saves a file from a temporary token to permanent storage.
	 *
	 * @param string $token    The token for the file.
	 * @param string $filename The original filename (optional, will retrieve from token if not provided).
	 * @return array|WP_Error File data on success, WP_Error on failure.
	 */
	public function save_file_from_token( $token, $filename = '' ) {
		error_log( "DEBUG: save_file_from_token called with token: $token" );

		if ( empty( $token ) ) {
			error_log( 'DEBUG: Error - Token is empty' );
			return new WP_Error( 'missing_data', __( 'Token is required.', 'jetpack-forms' ) );
		}

		// Get original filename and file data from the token
		$file_data = apply_filters( 'jetpack_forms_get_file_data_from_token', array(), $token );
		error_log( 'DEBUG: File data retrieved from token: ' . print_r( $file_data, true ) );

		if ( empty( $file_data ) ) {
			error_log( 'DEBUG: Error - File data is empty, invalid token' );
			return new WP_Error( 'invalid_token', __( 'Invalid or expired token.', 'jetpack-forms' ) );
		}

		// Use the original filename if provided by token data
		if ( empty( $filename ) && ! empty( $file_data['filename'] ) ) {
			$filename = $file_data['filename'];
			error_log( "DEBUG: Using filename from token data: $filename" );
		}

		global $wp_filesystem;
		if ( ! $wp_filesystem ) {
			require_once ABSPATH . 'wp-admin/includes/file.php';
			\WP_Filesystem();
		}

		l( 'wp_filesystem', $wp_filesystem );

		// // Get the path to the uploaded temporary file
		// if ( empty( $file_data['file_path'] ) || ! $wp_filesystem->exists( $file_data['file_path'] ) ) {
		// error_log( 'DEBUG: Error - Temporary file not found at path: ' . ( $file_data['file_path'] ?? 'not set' ) );
		// return new WP_Error( 'file_not_found', __( 'The temporary file could not be found.', 'jetpack-forms' ) );
		// }

		// error_log( 'DEBUG: Temporary file exists at: ' . $file_data['file_path'] );

		// Create file data array that wp_handle_upload expects
		$file = array(
			'name'     => sanitize_file_name( $filename ),
			'type'     => wp_check_filetype( $filename )['type'],
			'tmp_name' => $file_data['file_path'],
			'error'    => 0,
			'size'     => wp_filesize( $file_data['file_path'] ),
		);

		error_log( 'DEBUG: File array prepared for wp_handle_upload: ' . print_r( $file, true ) );

		// Add more debug information
		error_log( 'DEBUG: File type reported: ' . $file['type'] );
		error_log( 'DEBUG: Temp file size: ' . $file['size'] . ' bytes' );

		// Include required file for wp_handle_upload
		require_once ABSPATH . 'wp-admin/includes/file.php';

		// Handle the file upload properly - use very permissive settings
		$upload_overrides = array(
			'test_form'                => false,           // Skip the form check
			'test_size'                => false,           // Skip the size check as we've already verified
			'test_upload'              => false,         // Skip upload test
			'action'                   => 'jetpack_forms_upload', // Custom action to identify this upload
			'unique_filename_callback' => null, // Let WP handle unique filenames
			'mimes'                    => null,                // Don't restrict mime types (let all types through)
		);

		error_log( 'DEBUG: Calling wp_handle_upload with overrides: ' . print_r( $upload_overrides, true ) );

		// Setup filter to modify the upload directory
		add_filter( 'upload_dir', array( $this, 'modify_upload_dir' ) );

		// Do the upload
		$move_result = wp_handle_upload( $file, $upload_overrides );

		// Remove our filter
		remove_filter( 'upload_dir', array( $this, 'modify_upload_dir' ) );

		if ( isset( $move_result['error'] ) ) {
			error_log( 'DEBUG: wp_handle_upload failed with error: ' . $move_result['error'] );
			return new WP_Error( 'upload_error', $move_result['error'] );
		}

		error_log( 'DEBUG: wp_handle_upload successful: ' . print_r( $move_result, true ) );

		// Generate a file ID for reference
		$file_id = wp_hash( $move_result['file'] . microtime() );
		error_log( "DEBUG: Generated file ID: $file_id" );

		// Return the file data
		$result = array(
			'file_id'   => $file_id,
			'name'      => $filename,
			'path'      => $move_result['file'],
			'url'       => $move_result['url'],
			'size'      => $file['size'],
			'type'      => $file['type'],
			'timestamp' => time(),
		);

		error_log( 'DEBUG: Returning successful result: ' . print_r( $result, true ) );
		return $result;
	}

	/**
	 * Filter function to modify the upload directory for forms file uploads.
	 *
	 * @param array $upload_dir Original upload directory data.
	 * @return array Modified upload directory data.
	 */
	public function modify_upload_dir( $upload_dir ) {
		error_log( 'DEBUG: modify_upload_dir called with: ' . print_r( $upload_dir, true ) );

		$forms_base_dir = '/jetpack-forms';

		if ( empty( $upload_dir['subdir'] ) ) {
			$upload_dir['path']   = path_join( $upload_dir['basedir'], ltrim( $forms_base_dir, '/' ) );
			$upload_dir['url']    = trailingslashit( $upload_dir['baseurl'] ) . ltrim( $forms_base_dir, '/' );
			$upload_dir['subdir'] = $forms_base_dir;
		} else {
			$new_subdir = $forms_base_dir . $upload_dir['subdir'];

			$upload_dir['path']   = str_replace( $upload_dir['subdir'], $new_subdir, $upload_dir['path'] );
			$upload_dir['url']    = str_replace( $upload_dir['subdir'], $new_subdir, $upload_dir['url'] );
			$upload_dir['subdir'] = str_replace( $upload_dir['subdir'], $new_subdir, $upload_dir['subdir'] );
		}

		$upload_dir['basedir'] = $upload_dir['path'];
		$upload_dir['baseurl'] = $upload_dir['url'];
		$upload_dir['error']   = false;

		error_log( 'DEBUG: Returning modified upload_dir: ' . print_r( $upload_dir, true ) );
		return $upload_dir;
	}

	/**
	 * Process file attachments when a form is submitted.
	 *
	 * @param int   $post_id   The feedback post ID.
	 * @param array $all_values All form values.
	 * @return array The processed file attachments.
	 */
	public function process_file_attachments( $post_id, $all_values ) {
		if ( empty( $all_values ) || ! is_array( $all_values ) ) {
			return array();
		}

		$file_attachments = array();

		foreach ( $all_values as $key => $value ) {
			// Check if this is a file field
			if ( is_array( $value ) && isset( $value['file_token'] ) ) {
				$file_data = $this->save_file_from_token( $value['file_token'], $value['name'] );
				if ( ! is_wp_error( $file_data ) ) {
					// Store the complete file data directly in the form JSON
					$file_attachments[ $key ] = $file_data;
				}
			}
		}

		return $file_attachments;
	}

	/**
	 * Get the URL for a file based on its ID.
	 *
	 * @param string $file_id  The file ID.
	 * @param int    $post_id  The feedback post ID.
	 * @return string|false The file URL or false if not found.
	 */
	public function get_file_url( $field_id, $file_id, $post_id ) {
		// Use the WordPress REST API to access the file
		$rest_url = rest_url( 'wp/v2/feedback/files' );
		$url      = add_query_arg(
			array(
				'field_id' => $field_id,
				'file_id'  => $file_id,
				'post_id'  => $post_id,
			),
			$rest_url
		);

		// Add the WordPress REST API nonce
		$url = add_query_arg( '_wpnonce', wp_create_nonce( 'wp_rest' ), $url );

		error_log( "DEBUG: Generated file URL: $url" );
		return $url;
	}

	/**
	 * Delete files associated with a feedback post when it's deleted.
	 *
	 * @param int   $post_id The post ID.
	 * @param array $field_values Optional array of field values containing file_ids to delete.
	 * @return void
	 */
	public function delete_attached_files( $post_id, $field_values = array() ) {
		$file_ids = array();

		// Extract file IDs from field values if provided
		if ( ! empty( $field_values ) && is_array( $field_values ) ) {
			foreach ( $field_values as $field_value ) {
				if ( is_array( $field_value ) && isset( $field_value['file_id'] ) ) {
					$file_ids[] = $field_value['file_id'];

					// Delete the actual file
					if ( isset( $field_value['path'] ) && file_exists( $field_value['path'] ) ) {
						@unlink( $field_value['path'] );
					}
				}
			}
		} else {
			// If field values not provided, get post content
			$post = get_post( $post_id );
			if ( $post && 'feedback' === $post->post_type ) {
				// Try to parse the content
				$content = $post->post_content;
				if ( 0 === strpos( $content, '{' ) ) {
					$data = json_decode( $content, true );
					if ( ! empty( $data ) && is_array( $data ) ) {
						foreach ( $data as $field_key => $field_value ) {
							if ( is_array( $field_value ) && isset( $field_value['file_id'] ) ) {
								$file_ids[] = $field_value['file_id'];

								// Delete the actual file
								if ( isset( $field_value['path'] ) && file_exists( $field_value['path'] ) ) {
									@unlink( $field_value['path'] );
								}
							}
						}
					}
				}
			}
		}

		// For backward compatibility, also check post meta and options
		// Get files from post meta
		$post_attachments = get_post_meta( $post_id, self::FILE_ATTACHMENTS_META_KEY, true );
		if ( ! empty( $post_attachments ) && is_array( $post_attachments ) ) {
			foreach ( $post_attachments as $file_id => $file_data ) {
				if ( ! in_array( $file_id, $file_ids ) ) {
					$file_ids[] = $file_id;

					// Delete the actual file
					if ( isset( $file_data['path'] ) && file_exists( $file_data['path'] ) ) {
						@unlink( $file_data['path'] );
					}
				}
			}
			// Remove the old meta data
			delete_post_meta( $post_id, self::FILE_ATTACHMENTS_META_KEY );
		}

		// Clean up any remaining entries in the options table (backward compatibility)
		$all_files = get_option( 'jetpack_forms_file_data', array() );
		$updated   = false;

		foreach ( $file_ids as $file_id ) {
			if ( isset( $all_files[ $file_id ] ) ) {
				unset( $all_files[ $file_id ] );
				$updated = true;
			}
		}

		if ( $updated ) {
			update_option( 'jetpack_forms_file_data', $all_files, false );
		}
	}

	/**
	 * AJAX handler for file downloads.
	 */
	public function handle_file_download() {
		// Check if the user has permission
		if ( ! current_user_can( 'edit_pages' ) ) {
			wp_die( esc_html__( 'You do not have permission to access this file.', 'jetpack-forms' ), 403 );
		}

		// Check for required parameters
		if ( empty( $_GET['file_id'] ) ) {
			wp_die( esc_html__( 'Missing file ID.', 'jetpack-forms' ), 400 );
		}

		$file_id = sanitize_text_field( wp_unslash( $_GET['file_id'] ) );
		$post_id = isset( $_GET['post_id'] ) ? intval( $_GET['post_id'] ) : 0;

		// Find the file data
		$file_data = $this->get_file_data( $file_id, $post_id );

		if ( ! $file_data || empty( $file_data['path'] ) || ! file_exists( $file_data['path'] ) ) {
			wp_die( esc_html__( 'File not found.', 'jetpack-forms' ), 404 );
		}

		$file_path = $file_data['path'];
		$file_name = $file_data['name'] ?? basename( $file_path );
		$mime_type = $file_data['type'] ?? 'application/octet-stream';

		// Send headers for download
		nocache_headers();
		header( 'Content-Type: ' . $mime_type );
		header( 'Content-Disposition: attachment; filename="' . $file_name . '"' );
		header( 'Content-Length: ' . filesize( $file_path ) );
		header( 'X-Robots-Tag: noindex' );
		readfile( $file_path );
		exit;
	}

	/**
	 * Cleanup old files.
	 * This should be scheduled to run periodically.
	 *
	 * @return void
	 */
	public function cleanup_old_files() {
		// Only keep this for backward compatibility
		$all_files       = get_option( 'jetpack_forms_file_data', array() );
		$current_time    = time();
		$max_age         = DAY_IN_SECONDS * 90; // 90 days
		$files_to_remove = array();

		foreach ( $all_files as $file_id => $file_data ) {
			// Check if file is too old
			if ( isset( $file_data['timestamp'] ) && ( $current_time - $file_data['timestamp'] ) > $max_age ) {
				// Delete the actual file
				if ( isset( $file_data['path'] ) && file_exists( $file_data['path'] ) ) {
					@unlink( $file_data['path'] );
				}
				$files_to_remove[] = $file_id;
			}
		}

		// Remove deleted files from the data store
		foreach ( $files_to_remove as $file_id ) {
			unset( $all_files[ $file_id ] );
		}

		if ( ! empty( $files_to_remove ) ) {
			update_option( 'jetpack_forms_file_data', $all_files, false );
		}
	}

	/**
	 * Generate a unique filename for uploaded files.
	 *
	 * @param string $dir  The directory where the file will be stored.
	 * @param string $name The original filename.
	 * @param string $ext  The file extension.
	 * @return string The unique filename.
	 */
	public function generate_unique_filename( $dir, $name, $ext ) {
		error_log( "DEBUG: generate_unique_filename called with dir: $dir, name: $name, ext: $ext" );

		// Sanitize the filename
		$name = sanitize_file_name( $name );

		// Add a timestamp and random string to ensure uniqueness
		$unique_filename = sprintf(
			'%s-%s%s',
			pathinfo( $name, PATHINFO_FILENAME ),
			substr( md5( uniqid( microtime( true ), true ) ), 0, 8 ),
			$ext
		);

		error_log( "DEBUG: Generated unique filename: $unique_filename" );

		return $unique_filename;
	}

	function find_field_by_id( $feedback_fields, $target_field_id ) {
		foreach ( $feedback_fields as $key => $field ) {
			if ( is_array( $field ) ) {
				if ( isset( $field['field_id'] ) && $field['field_id'] === $target_field_id ) {
					return $field;
				}

				// Also check nested arrays (one level deep)
				foreach ( $field as $inner_key => $inner_field ) {
					if ( is_array( $inner_field ) &&
						isset( $inner_field['field_id'] ) &&
						$inner_field['field_id'] === $target_field_id ) {
						return $inner_field;
					}
				}
			}
		}
		return false;
	}
}
