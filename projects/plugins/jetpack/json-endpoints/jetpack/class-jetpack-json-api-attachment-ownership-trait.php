<?php
/**
 * Shared attachment-ownership and zip-mime validation for JSON API endpoints
 * that consume an uploaded zip (plugin/theme install and replace).
 *
 * @package automattic/jetpack
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Shared ownership check for endpoints that consume an uploaded attachment
 * (plugin/theme zip uploads). Guards against an authorized caller referencing
 * an attachment that wasn't part of this upload.
 */
trait Jetpack_JSON_API_Attachment_Ownership_Trait {

	/**
	 * Confirm the attachment exists, is the attachment post type, and is owned
	 * by the current user when a user is identifiable. Site-auth requests
	 * (no current user) skip the author check.
	 *
	 * @param int $attachment_id Attachment post ID.
	 * @return true|WP_Error
	 */
	protected function validate_attachment_ownership( $attachment_id ) {
		$post = get_post( $attachment_id );
		if ( ! $post || 'attachment' !== $post->post_type ) {
			return new WP_Error( 'invalid_attachment', __( 'The referenced upload is not a valid attachment.', 'jetpack' ), 400 );
		}

		$current_user_id = get_current_user_id();
		if ( $current_user_id && (int) $post->post_author !== $current_user_id ) {
			return new WP_Error( 'attachment_not_owned', __( 'The referenced upload does not belong to the current user.', 'jetpack' ), 403 );
		}

		return true;
	}

	/**
	 * Confirm the attachment is a zip package. Reject non-zip mime types and
	 * non-.zip extensions to prevent unrelated uploads (images, PDFs, etc.)
	 * from being fed to Plugin_Upgrader / Theme_Upgrader.
	 *
	 * @param int $attachment_id Attachment post ID.
	 * @return true|WP_Error
	 */
	protected function validate_attachment_is_zip( $attachment_id ) {
		$mime = get_post_mime_type( $attachment_id );
		if ( 'application/zip' !== $mime ) {
			return new WP_Error( 'invalid_attachment_mime', __( 'Uploaded attachment is not a zip package.', 'jetpack' ), 400 );
		}

		$file = get_attached_file( $attachment_id );
		if ( $file ) {
			$extension = strtolower( (string) pathinfo( $file, PATHINFO_EXTENSION ) );
			if ( 'zip' !== $extension ) {
				return new WP_Error( 'invalid_attachment_extension', __( 'Uploaded attachment is not a .zip file.', 'jetpack' ), 400 );
			}
		}

		return true;
	}
}
