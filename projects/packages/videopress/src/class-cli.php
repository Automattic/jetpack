<?php
/**
 * VideoPress CLI commands.
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack\VideoPress;

use WP_CLI;
use WP_CLI_Command;
use function WP_CLI\Utils\get_flag_value;

/**
 * VideoPress command line utilities.
 */
class CLI extends WP_CLI_Command {

	/**
	 * Import a VideoPress video.
	 *
	 * Creates a local media library attachment for a VideoPress video by GUID.
	 *
	 * ## OPTIONS
	 *
	 * <guid>
	 * : The GUID of the video to import.
	 *
	 * [--force]
	 * : Delete any existing attachment for this GUID and create a new one.
	 *
	 * [--no-preserve-id]
	 * : Skip reusing the original WordPress.com attachment ID. By default the new attachment is
	 * inserted with the same ID it had on WordPress.com (when known) so the wpcom video table
	 * relationship stays intact. Pass this flag to fall back to a fresh auto-incremented ID.
	 *
	 * [--parent-id=<id>]
	 * : Attach the new attachment to a specific parent post. Useful for one-off operator
	 * reattaches where the target post is known. Bulk automation typically leaves this unset
	 * because a video may appear in multiple posts.
	 *
	 * [--dry-run]
	 * : Show what would happen — existing attachment, ID collision, new attachment ID — without
	 * mutating any state. The video metadata is still fetched from WordPress.com so the report
	 * reflects real data.
	 *
	 * ## EXAMPLES
	 *
	 *     wp videopress import kUJmAcSf
	 *     wp videopress import kUJmAcSf --force
	 *     wp videopress import kUJmAcSf --no-preserve-id
	 *     wp videopress import kUJmAcSf --parent-id=42
	 *     wp videopress import kUJmAcSf --dry-run
	 *
	 *     # Import multiple videos from a file
	 *     cat guids.txt | xargs -I {} wp videopress import {}
	 *
	 * @param array $args Positional arguments.
	 * @param array $assoc_args Associative arguments.
	 */
	public function import( $args, $assoc_args ) {
		if ( empty( $args[0] ) ) {
			WP_CLI::error( __( 'You must provide a VideoPress GUID.', 'jetpack-videopress-pkg' ) );
		}

		$guid        = $args[0];
		$force       = (bool) get_flag_value( $assoc_args, 'force', false );
		$preserve_id = (bool) get_flag_value( $assoc_args, 'preserve-id', true );
		$parent_id   = (int) get_flag_value( $assoc_args, 'parent-id', 0 );
		$dry_run     = (bool) get_flag_value( $assoc_args, 'dry-run', false );

		if ( $dry_run ) {
			$this->import_dry_run( $guid, $force, $preserve_id, $parent_id );
			return;
		}

		$existing_post_id = videopress_get_post_id_by_guid( $guid );

		if ( $existing_post_id ) {
			if ( ! $force ) {
				WP_CLI::warning(
					sprintf(
						/* translators: %d: attachment id */
						__( 'Video already exists as Attachment ID %d. Use --force to re-import.', 'jetpack-videopress-pkg' ),
						$existing_post_id
					)
				);
				return;
			}

			$deleted = wp_delete_attachment( $existing_post_id, true );
			if ( ! $deleted ) {
				WP_CLI::error(
					sprintf(
						/* translators: %d: attachment id */
						__( 'Failed to delete existing Attachment ID %d.', 'jetpack-videopress-pkg' ),
						$existing_post_id
					)
				);
			}

			videopress_clear_post_id_by_guid_cache( $guid );
			WP_CLI::log(
				sprintf(
					/* translators: %d: attachment id */
					__( 'Deleted existing Attachment ID %d.', 'jetpack-videopress-pkg' ),
					$existing_post_id
				)
			);
		}

		$attachment_id = create_local_media_library_for_videopress_guid( $guid, $parent_id, $preserve_id );

		if ( $attachment_id && ! is_wp_error( $attachment_id ) ) {
			WP_CLI::success(
				sprintf(
					/* translators: %d: attachment id */
					__( 'The video has been imported as Attachment ID %d.', 'jetpack-videopress-pkg' ),
					$attachment_id
				)
			);
		} else {
			$message = is_wp_error( $attachment_id )
				? $attachment_id->get_error_message()
				: __( 'An unknown error has been encountered.', 'jetpack-videopress-pkg' );
			WP_CLI::error( $message );
		}
	}

	/**
	 * Report what `wp videopress import` would do for the given GUID without mutating state.
	 *
	 * @param string $guid Video GUID.
	 * @param bool   $force Whether --force was passed.
	 * @param bool   $preserve_id Whether the original post ID would be preserved.
	 * @param int    $parent_id Parent post ID, 0 for unattached.
	 */
	private function import_dry_run( $guid, $force, $preserve_id, $parent_id ) {
		WP_CLI::log( '[dry-run] No changes will be written.' );

		$vp_data = videopress_get_video_details( $guid );
		if ( is_wp_error( $vp_data ) ) {
			WP_CLI::error( $vp_data->get_error_message() );
		}

		$existing_post_id = videopress_get_post_id_by_guid( $guid );
		if ( $existing_post_id ) {
			$action = $force
				? sprintf( /* translators: %d: existing attachment id */ __( '[dry-run] Would delete existing Attachment ID %d and re-import.', 'jetpack-videopress-pkg' ), $existing_post_id )
				: sprintf( /* translators: %d: existing attachment id */ __( '[dry-run] Would skip with warning — Attachment ID %d already exists. Use --force to re-import.', 'jetpack-videopress-pkg' ), $existing_post_id );
			WP_CLI::log( $action );
			if ( ! $force ) {
				return;
			}
		}

		$current_blog_id = (int) \Jetpack_Options::get_option( 'id' );
		$video_blog_id   = (int) ( $vp_data->blog_id ?? 0 );
		if ( ! $current_blog_id ) {
			WP_CLI::error( __( '[dry-run] Site is not connected to WordPress.com.', 'jetpack-videopress-pkg' ) );
		}
		if ( $current_blog_id !== $video_blog_id ) {
			WP_CLI::error(
				sprintf(
					/* translators: %1$d current blog id, %2$d video blog id */
					__( '[dry-run] Video belongs to a different site (blog %2$d, this site is %1$d). Import would be refused.', 'jetpack-videopress-pkg' ),
					$current_blog_id,
					$video_blog_id
				)
			);
		}

		$original_post_id = $preserve_id && isset( $vp_data->post_id ) ? (int) $vp_data->post_id : 0;
		if ( $original_post_id > 0 ) {
			$existing = get_post( $original_post_id );
			if ( $existing && get_post_meta( $original_post_id, 'videopress_guid', true ) !== $guid ) {
				WP_CLI::error(
					sprintf(
						/* translators: %1$d: target post ID, %2$s: existing post type */
						__( '[dry-run] Would refuse — original Attachment ID %1$d is occupied by post type "%2$s". Pass --no-preserve-id to import with a fresh ID, or --force to delete and replace.', 'jetpack-videopress-pkg' ),
						$original_post_id,
						$existing->post_type
					)
				);
			}
			WP_CLI::log(
				sprintf(
					/* translators: %d: attachment id that would be used */
					__( '[dry-run] Would create attachment with ID %d (preserved from WordPress.com).', 'jetpack-videopress-pkg' ),
					$original_post_id
				)
			);
		} else {
			WP_CLI::log( __( '[dry-run] Would create attachment with a fresh auto-incremented ID.', 'jetpack-videopress-pkg' ) );
		}

		if ( $parent_id > 0 ) {
			WP_CLI::log(
				sprintf(
					/* translators: %d: parent post id */
					__( '[dry-run] Would attach to parent post %d.', 'jetpack-videopress-pkg' ),
					$parent_id
				)
			);
		}

		WP_CLI::success( __( '[dry-run] No errors detected. Re-run without --dry-run to apply.', 'jetpack-videopress-pkg' ) );
	}
}
