<?php // phpcs:ignore WordPress.Files.FileName
/**
 * Class with methods common to tests involving attachments.
 *
 * @since 3.9.2
 */
class Jetpack_Attachment_Test_Case extends WP_UnitTestCase {

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

}
