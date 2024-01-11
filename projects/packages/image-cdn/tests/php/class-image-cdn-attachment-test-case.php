<?php

use WorDBless\BaseTestCase;

/**
 * Class with methods common to tests involving attachments.
 */
class Image_CDN_Attachment_Test_Case extends BaseTestCase {

	public function set_up() {
		parent::set_up();

		if ( ! defined( 'DIR_TESTDATA' ) ) {
			define( 'DIR_TESTDATA', __DIR__ . '/sample-content' );
		}

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
		$meta = $generate_meta ? wp_generate_attachment_metadata( $id, $upload['file'] ) : false;
		wp_update_attachment_metadata( $id, $meta );

		return $id;
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
		$metadata = wp_generate_attachment_metadata( $id, $upload['file'] );

		// Update the attachment metadata
		wp_update_attachment_metadata( $id, $metadata );

		return $id;
	}
}
