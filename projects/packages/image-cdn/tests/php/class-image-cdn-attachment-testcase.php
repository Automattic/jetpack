<?php

use WorDBless\BaseTestCase;

/**
 * Class with methods common to tests involving attachments.
 */
abstract class Image_CDN_Attachment_TestCase extends BaseTestCase {

	/**
	 * Generated metadata for the whole process, keyed by source file contents and registered sizes.
	 *
	 * @var array
	 */
	private static $metadata_cache = array();

	/**
	 * Hooks that can change what wp_generate_attachment_metadata() returns for an image.
	 *
	 * @var string[]
	 */
	private static $metadata_hooks = array(
		'intermediate_image_sizes_advanced',
		'fallback_intermediate_image_sizes',
		'wp_get_missing_image_subsizes',
		'big_image_size_threshold',
		'wp_generate_attachment_metadata',
		'wp_image_editors',
		'image_editor_output_format',
		'image_resize_dimensions',
		'wp_image_resize_identical_dimensions',
		'image_make_intermediate_size',
		'wp_image_maybe_exif_rotate',
		'wp_read_image_metadata',
		'wp_editor_set_quality',
		'jpeg_quality',
		'image_strip_meta',
		'image_save_progressive',
		'image_max_bit_depth',
		'image_editor_default_mime_type',
		'file_is_displayable_image',
		'wp_read_image_metadata_types',
		'pre_wp_filesize',
		'wp_filesize',
	);

	public function set_up() {
		parent::set_up();

		if ( ! defined( 'DIR_TESTDATA' ) ) {
			define( 'DIR_TESTDATA', __DIR__ . '/sample-content' );
		}

		// Ensure upload directory exists with proper permissions
		$upload_dir = wp_upload_dir();
		wp_mkdir_p( $upload_dir['basedir'] );
		wp_mkdir_p( $upload_dir['path'] );

		// Ensure test data directory exists
		if ( ! file_exists( DIR_TESTDATA ) ) {
			wp_mkdir_p( DIR_TESTDATA );
		}

		// Set permissions recursively
		$this->recursive_chmod( $upload_dir['basedir'] );

		// Force an absolute URL for attachment URLs during testing
		add_filter(
			'wp_get_attachment_url',
			function ( $url ) {
				$site_url = 'http://example.org';
				if ( ! empty( $url ) && ! preg_match( '/^http(s)?:\/\//i', $url ) ) {
					return $site_url . $url;
				}
				return $url;
			}
		);

		// Update option values for image sizes
		update_option( 'large_size_w', 1024 );
		update_option( 'large_size_h', 768 );
		update_option( 'medium_large_size_w', 768 );
		update_option( 'medium_large_size_h', 576 );

		add_filter(
			'upload_dir',
			function ( $upload_dir ) {
				$site_url = 'http://example.org';

				if ( ! preg_match( '/^http(s)?:\/\//i', $upload_dir['url'] ) ) {
					$upload_dir['url'] = $site_url . $upload_dir['url'];
				}

				if ( ! preg_match( '/^http(s)?:\/\//i', $upload_dir['baseurl'] ) ) {
					$upload_dir['baseurl'] = $site_url . $upload_dir['baseurl'];
				}

				return $upload_dir;
			}
		);
	}

	private function recursive_chmod( $path ) {
		chmod( $path, 0777 );
		if ( is_dir( $path ) ) {
			$objects = scandir( $path );
			foreach ( $objects as $object ) {
				if ( $object !== '.' && $object !== '..' ) {
					$this->recursive_chmod( $path . '/' . $object );
				}
			}
		}
	}

	/**
	 * A helper to create an upload object. This method was copied verbatim from WP Core's
	 * WP_UnitTest_Factory_For_Attachment class. When Jetpack is no longer tested on Core
	 * versions older than 4.4, it can be removed and replaced with the following call:
	 *
	 *  $factory->attachment->create_upload_object( $filename );
	 *
	 * The $factory here is an instance of WP_UnitTest_Factory and is passed as an argument
	 * to wpSetUpBeforeClass method.
	 *
	 * @param String  $file file path.
	 * @param Integer $parent the ID of the parent object.
	 * @return Integer $id
	 */
	protected static function create_upload_object( $file, $parent = 0, $generate_meta = false ) {
		$contents = file_get_contents( $file );
		$upload   = wp_upload_bits( basename( $file ), null, $contents );

		$type = '';
		if ( ! empty( $upload['type'] ) ) {
			$type = $upload['type'];
		} else {
			$mime = wp_check_filetype( $upload['file'] );
			if ( $mime ) {
				$type = $mime['type'];
			}
		}

		$attachment = array(
			'post_title'     => basename( $upload['file'] ),
			'post_content'   => '',
			'post_type'      => 'attachment',
			'post_parent'    => $parent,
			'post_mime_type' => $type,
			'guid'           => $upload['url'],
		);

		// Save the data
		$id   = wp_insert_attachment( $attachment, $upload['file'], $parent );
		$meta = $generate_meta ? self::generate_metadata_cached( $id, $upload['file'] ) : false;
		wp_update_attachment_metadata( $id, $meta );

		return $id;
	}

	/**
	 * Generate real metadata once per fixture and size set, then rebase it onto later uploads of it.
	 *
	 * Resizing the 1600x1200 fixture into every registered size takes most of this suite's runtime.
	 * Gotcha: on a cache hit the resized files are not written, so only the original is on disk.
	 *
	 * @param int    $id   Attachment ID.
	 * @param string $file Absolute path of the uploaded file.
	 * @return array|false
	 */
	private static function generate_metadata_cached( $id, $file ) {
		foreach ( self::$metadata_hooks as $hook ) {
			if ( has_filter( $hook ) ) {
				return wp_generate_attachment_metadata( $id, $file );
			}
		}

		// phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.serialize_serialize -- Cache key only.
		$key = md5_file( $file ) . md5( serialize( array( pathinfo( $file, PATHINFO_EXTENSION ), get_post_mime_type( $id ), wp_get_registered_image_subsizes() ) ) );
		if ( ! isset( self::$metadata_cache[ $key ] ) ) {
			$meta = wp_generate_attachment_metadata( $id, $file );
			if ( is_array( $meta ) && ! empty( $meta['file'] ) && isset( $meta['sizes'] ) && is_array( $meta['sizes'] ) && ! isset( $meta['original_image'] ) ) {
				self::$metadata_cache[ $key ] = array( $meta, pathinfo( $meta['file'], PATHINFO_FILENAME ) );
			}
			return $meta;
		}

		list( $meta, $old_name ) = self::$metadata_cache[ $key ];
		$new_file                = _wp_relative_upload_path( $file );
		$new_name                = pathinfo( $new_file, PATHINFO_FILENAME );
		$meta['file']            = $new_file;
		foreach ( $meta['sizes'] as &$size ) {
			$size['file'] = $new_name . substr( $size['file'], strlen( $old_name ) );
		}
		unset( $size );
		return $meta;
	}

	protected function make_attachment( $upload, $parent_post_id = 0 ) {
		$type = '';
		if ( ! empty( $upload['type'] ) ) {
			$type = $upload['type'];
		} else {
			$mime = wp_check_filetype( $upload['file'] );
			if ( $mime ) {
				$type = $mime['type'];
			}
		}

		$attachment = array(
			'post_title'     => basename( $upload['file'] ),
			'post_content'   => '',
			'post_type'      => 'attachment',
			'post_parent'    => $parent_post_id,
			'post_mime_type' => $type,
			'guid'           => $upload['url'],
		);

		// Save the attachment
		$id = wp_insert_attachment( $attachment, $upload['file'], $parent_post_id );

		// Generate attachment metadata
		$metadata = self::generate_metadata_cached( $id, $upload['file'] );

		// Update the attachment metadata
		wp_update_attachment_metadata( $id, $metadata );

		return $id;
	}
}
