<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

require_once JETPACK__PLUGIN_DIR . 'sal/class.json-api-date.php';

/**
 * Class to handle different actions related to media.
 */
class Jetpack_Media {
	/**
	 * Original media meta data. Metadata key as stored by WP.
	 *
	 * @var string
	 */
	const WP_ORIGINAL_MEDIA = '_wp_original_post_media';
	/**
	 * Revision history. Metadata key as stored by WP.
	 *
	 * @var string
	 */
	const WP_REVISION_HISTORY = '_wp_revision_history';
	/**
	 * Maximum amount of revisions.
	 *
	 * @var int
	 */
	const REVISION_HISTORY_MAXIMUM_AMOUNT = 0;
	/**
	 * Image Alt. Metadata key as stored by WP.
	 *
	 * @var string
	 */
	const WP_ATTACHMENT_IMAGE_ALT = '_wp_attachment_image_alt';

	/**
	 * Generate a filename in function of the original filename of the media.
	 * The returned name has the `{basename}-{hash}-{random-number}.{ext}` shape.
	 * The hash is built according to the filename trying to avoid name collisions
	 * with other media files.
	 *
	 * @param  int    $media_id - media post ID.
	 * @param  string $new_filename - the new filename.
	 * @return string A random filename.
	 */
	public static function generate_new_filename( $media_id, $new_filename ) {
		// Get the right filename extension.
		$new_filename_paths = pathinfo( $new_filename );
		$new_file_ext       = $new_filename_paths['extension'];

		// Get the file parts from the current attachment.
		$current_file         = get_attached_file( $media_id );
		$current_file_parts   = pathinfo( $current_file );
		$current_file_ext     = $current_file_parts['extension'];
		$current_file_dirname = $current_file_parts['dirname'];

		// Take out filename from the original file or from the current attachment.
		$original_media = (array) self::get_original_media( $media_id );

		if ( ! empty( $original_media ) ) {
			$original_file_parts = pathinfo( $original_media['file'] );
			$filename_base       = $original_file_parts['filename'];
		} else {
			$filename_base = $current_file_parts['filename'];
		}

		// Add unique seed based on the filename.
		$filename_base .= '-' . crc32( $filename_base ) . '-';

		$number_suffix = time() . wp_rand( 100, 999 );

		do {
			$filename  = $filename_base;
			$filename .= "e{$number_suffix}";
			$file_ext  = $new_file_ext ? $new_file_ext : $current_file_ext;

			$new_filename = "{$filename}.{$file_ext}";
			$new_path     = "{$current_file_dirname}/$new_filename";
			++$number_suffix;
		} while ( file_exists( $new_path ) );

		return $new_filename;
	}

	/**
	 * File urls use the post (image item) date to generate a folder path.
	 * Post dates can change, so we use the original date used in the `guid`
	 * url so edits can remain in the same folder. In the following function
	 * we capture a string in the format of `YYYY/MM` from the guid.
	 *
	 * For example with a guid of
	 * "http://test.files.wordpress.com/2016/10/test.png" the resulting string
	 * would be: "2016/10"
	 *
	 * @param int $media_id Attachment ID.
	 * @return string
	 */
	private static function get_time_string_from_guid( $media_id ) {
		$time = gmdate( 'Y/m', strtotime( current_time( 'mysql' ) ) );

		$media = get_post( $media_id );
		if ( $media ) {
			$pattern = '/\/(\d{4}\/\d{2})\//';
			preg_match( $pattern, $media->guid, $matches );
			if ( count( $matches ) > 1 ) {
				$time = $matches[1];
			}
		}
		return $time;
	}

	/**
	 * Return an array of allowed mime_type items used to upload a media file.
	 *
	 * @param array $default_mime_types Array of mime types.
	 *
	 * @return array mime_type array
	 */
	public static function get_allowed_mime_types( $default_mime_types ) {
		return array_unique(
			array_merge(
				$default_mime_types,
				array(
					'application/msword',                                                         // .doc
					'application/vnd.ms-powerpoint',                                              // .ppt, .pps
					'application/vnd.ms-excel',                                                   // .xls
					'application/vnd.openxmlformats-officedocument.presentationml.presentation',  // .pptx
					'application/vnd.openxmlformats-officedocument.presentationml.slideshow',     // .ppsx
					'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',          // .xlsx
					'application/vnd.openxmlformats-officedocument.wordprocessingml.document',    // .docx
					'application/vnd.oasis.opendocument.text',                                    // .odt
					'application/pdf',                                                            // .pdf
				)
			)
		);
	}

	/**
	 * Checks that the mime type of the file
	 * is among those in a filterable list of mime types.
	 *
	 * @param  string $file Path to file to get its mime type.
	 * @return bool
	 */
	protected static function is_file_supported_for_sideloading( $file ) {
		return jetpack_is_file_supported_for_sideloading( $file );
	}

	/**
	 * Save the given uploaded temporary file considering file type,
	 * correct location according to the original file path, etc.
	 * The file type control is done through of `jetpack_supported_media_sideload_types` filter,
	 * which allows define to the users their own file types list.
	 *
	 * Note this does not support sideloads, only uploads.
	 *
	 * @param  array $file_array Data derived from `$_FILES` for an uploaded file.
	 * @param  int   $media_id   Attachment ID.
	 * @return array|WP_Error an array with information about the new file saved or a WP_Error is something went wrong.
	 */
	public static function save_temporary_file( $file_array, $media_id ) {
		$tmp_filename = $file_array['tmp_name'];

		if ( ! is_uploaded_file( $tmp_filename ) ) {
			return new WP_Error( 'invalid_input', 'No media provided in input.' );
		}

		// add additional mime_types through of the `jetpack_supported_media_sideload_types` filter.
		$mime_type_static_filter = array(
			'Jetpack_Media',
			'get_allowed_mime_types',
		);

		add_filter( 'jetpack_supported_media_sideload_types', $mime_type_static_filter );
		if (
			! self::is_file_supported_for_sideloading( $tmp_filename ) &&
			! file_is_displayable_image( $tmp_filename )
		) {
			return new WP_Error( 'invalid_input', 'Invalid file type.', 403 );
		}
		remove_filter( 'jetpack_supported_media_sideload_types', $mime_type_static_filter );

		// generate a new file name.
		$tmp_new_filename = self::generate_new_filename( $media_id, $file_array['name'] );

		// start to create the parameters to move the temporal file.
		$overrides = array( 'test_form' => false );

		// get time according to the original filaname.
		$time = self::get_time_string_from_guid( $media_id );

		$file_array['name'] = $tmp_new_filename;
		$file               = wp_handle_upload( $file_array, $overrides, $time );

		if ( isset( $file['error'] ) ) {
			return new WP_Error( 'upload_error', $file['error'] );
		}

		return $file;
	}

	/**
	 * Return an object with an snapshot of a revision item.
	 *
	 * @param  object $media_item - media post object.
	 * @return object a revision item
	 */
	public static function get_snapshot( $media_item ) {
		$current_file = get_attached_file( $media_item->ID );
		$file_paths   = pathinfo( $current_file );

		$snapshot = array(
			'date'      => (string) WPCOM_JSON_API_Date::format_date( $media_item->post_modified_gmt, $media_item->post_modified ),
			'URL'       => (string) wp_get_attachment_url( $media_item->ID ),
			'file'      => (string) $file_paths['basename'],
			'extension' => (string) $file_paths['extension'],
			'mime_type' => (string) $media_item->post_mime_type,
			'size'      => (int) filesize( $current_file ),
		);

		return (object) $snapshot;
	}

	/**
	 * Add a new item into revision_history array.
	 *
	 * @param  object         $media_item - media post object.
	 * @param  array|WP_Error $file - File data, or WP_Error on error.
	 * @param  bool           $has_original_media - condition is the original media has been already added.
	 * @return bool `true` if the item has been added. Otherwise `false`.
	 */
	public static function register_revision( $media_item, $file, $has_original_media ) {
		if ( is_wp_error( $file ) || ! $has_original_media ) {
			return false;
		}

		add_post_meta( $media_item->ID, self::WP_REVISION_HISTORY, self::get_snapshot( $media_item ) );
	}
	/**
	 * Return the `revision_history` of the given media.
	 *
	 * @param  int $media_id - media post ID.
	 * @return array `revision_history` array
	 */
	public static function get_revision_history( $media_id ) {
		return array_reverse( get_post_meta( $media_id, self::WP_REVISION_HISTORY, false ) );
	}

	/**
	 * Return the original media data.
	 *
	 * @param int $media_id Attachment ID.
	 */
	public static function get_original_media( $media_id ) {
		$original = get_post_meta( $media_id, self::WP_ORIGINAL_MEDIA, true );
		$original = $original ? $original : array();
		return $original;
	}

	/**
	 * Delete a file.
	 *
	 * @param string $pathname Path name.
	 */
	public static function delete_file( $pathname ) {
		if ( ! file_exists( $pathname ) || ! is_file( $pathname ) ) {
			$dir = dirname( $pathname );
			if ( is_dir( $dir ) ) {
				// let's touch a fake file to try to `really` remove the media file.
				touch( $pathname ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_touch
			}
		}

		return wp_delete_file( $pathname );
	}

	/**
	 * Try to delete a file according to the dirname of
	 * the media attached file and the filename.
	 *
	 * @param  int    $media_id - media post ID.
	 * @param  string $filename - basename of the file ( name-of-file.ext ).
	 *
	 * @return void
	 */
	private static function delete_media_history_file( $media_id, $filename ) {
		$attached_path  = get_attached_file( $media_id );
		$attached_parts = pathinfo( $attached_path );
		$dirname        = $attached_parts['dirname'];

		$pathname = $dirname . '/' . $filename;

		// remove thumbnails.
		$metadata = wp_generate_attachment_metadata( $media_id, $pathname );

		if ( isset( $metadata ) && isset( $metadata['sizes'] ) ) {
			foreach ( $metadata['sizes'] as $properties ) {
				self::delete_file( $dirname . '/' . $properties['file'] );
			}
		}

		// remove primary file.
		self::delete_file( $pathname );
	}

	/**
	 * Remove specific items from the `revision history` array
	 * depending on the given criteria: array(
	 *   'from' => (int) <from>,
	 *   'to' =>   (int) <to>,
	 * )
	 *
	 * Also, it removes the file defined in each item.
	 *
	 * @param int   $media_id - media post ID.
	 * @param array $criteria - criteria to remove the items.
	 * @param array $revision_history - revision history array.
	 *
	 * @return array `revision_history` array updated.
	 */
	public static function remove_items_from_revision_history( $media_id, $criteria, $revision_history ) {
		if ( ! isset( $revision_history ) ) {
			$revision_history = self::get_revision_history( $media_id );
		}

		$from = $criteria['from'];
		$to   = $criteria['to'] ? $criteria['to'] : ( $from + 1 );

		for ( $i = $from; $i < $to; $i++ ) {
			$removed_item = array_slice( $revision_history, $from, 1 );
			if ( ! $removed_item ) {
				break;
			}

			array_splice( $revision_history, $from, 1 );
			self::delete_media_history_file( $media_id, $removed_item[0]->file );
		}

		// override all history items.
		delete_post_meta( $media_id, self::WP_REVISION_HISTORY );
		$revision_history = array_reverse( $revision_history );
		foreach ( $revision_history as &$item ) {
			add_post_meta( $media_id, self::WP_REVISION_HISTORY, $item );
		}

		return $revision_history;
	}

	/**
	 * Limit the number of items of the `revision_history` array.
	 * When the stack is overflowing the oldest item is remove from there (FIFO).
	 *
	 * @param int      $media_id - media post ID.
	 * @param null|int $limit - maximum amount of items. 20 as default.
	 *
	 * @return array items removed from `revision_history`
	 */
	public static function limit_revision_history( $media_id, $limit = null ) {
		if ( $limit === null ) {
			$limit = self::REVISION_HISTORY_MAXIMUM_AMOUNT;
		}

		$revision_history = self::get_revision_history( $media_id );

		$total = count( $revision_history );

		if ( $total < $limit ) {
			return array();
		}

		self::remove_items_from_revision_history(
			$media_id,
			array(
				'from' => $limit,
				'to'   => $total,
			),
			$revision_history
		);

		return self::get_revision_history( $media_id );
	}

	/**
	 * Remove the original file and clean the post metadata.
	 *
	 * @param int $media_id - media post ID.
	 */
	public static function clean_original_media( $media_id ) {
		$original_file = self::get_original_media( $media_id );

		if ( ! $original_file ) {
			return null;
		}

		self::delete_media_history_file( $media_id, $original_file->file );
		return delete_post_meta( $media_id, self::WP_ORIGINAL_MEDIA );
	}

	/**
	 * Clean `revision_history` of the given $media_id. it means:
	 *   - remove all media files tied to the `revision_history` items.
	 *   - clean `revision_history` meta data.
	 *   - remove and clean the `original_media`
	 *
	 * @param int $media_id - media post ID.
	 *
	 * @return array results of removing these files
	 */
	public static function clean_revision_history( $media_id ) {
		self::clean_original_media( $media_id );

		$revision_history = self::get_revision_history( $media_id );
		$total            = count( $revision_history );
		$updated_history  = array();

		if ( $total < 1 ) {
			return $updated_history;
		}

		$updated_history = self::remove_items_from_revision_history(
			$media_id,
			array(
				'from' => 0,
				'to'   => $total,
			),
			$revision_history
		);

		return $updated_history;
	}

	/**
	 * Edit media item process:
	 *
	 * - update attachment file
	 * - preserve original media file
	 * - trace revision history
	 *
	 * Note this does not support sideloads, only uploads.
	 *
	 * @param  int   $media_id - media post ID.
	 * @param  array $file_array - Data derived from `$_FILES` for an uploaded file.
	 * @return WP_Post|WP_Error Updated media item or a WP_Error is something went wrong.
	 */
	public static function edit_media_file( $media_id, $file_array ) {
		$media_item         = get_post( $media_id );
		$has_original_media = self::get_original_media( $media_id );

		if ( ! $has_original_media ) {

			// The first time that the media is updated
			// the original media is stored into the revision_history.
			$snapshot = self::get_snapshot( $media_item );
			add_post_meta( $media_id, self::WP_ORIGINAL_MEDIA, $snapshot, true );
		}

		// Save temporary file in the correct location.
		$uploaded_file = self::save_temporary_file( $file_array, $media_id );

		if ( is_wp_error( $uploaded_file ) ) {
			return $uploaded_file;
		}

		// Revision_history control.
		self::register_revision( $media_item, $uploaded_file, $has_original_media );

		$uploaded_path     = $uploaded_file['file'];
		$udpated_mime_type = $uploaded_file['type'];
		$was_updated       = update_attached_file( $media_id, $uploaded_path );

		if ( ! $was_updated ) {
			return new WP_Error( 'update_error', 'Media update error' );
		}

		// Check maximum amount of revision_history before updating the attachment metadata.
		self::limit_revision_history( $media_id );

		$new_metadata = wp_generate_attachment_metadata( $media_id, $uploaded_path );
		wp_update_attachment_metadata( $media_id, $new_metadata );

		$edited_action = wp_update_post(
			(object) array(
				'ID'             => $media_id,
				'post_mime_type' => $udpated_mime_type,
			),
			true
		);

		if ( is_wp_error( $edited_action ) ) {
			return $edited_action;
		}

		return $media_item;
	}
}

// phpcs:disable Universal.Files.SeparateFunctionsFromOO.Mixed -- TODO: Move these functions to some other file.

/**
 * Clean revision history when the media item is deleted.
 *
 * @param int $media_id Attachment ID.
 */
function jetpack_clean_revision_history( $media_id ) {
	Jetpack_Media::clean_revision_history( $media_id );
}
add_action( 'delete_attachment', 'jetpack_clean_revision_history' );
