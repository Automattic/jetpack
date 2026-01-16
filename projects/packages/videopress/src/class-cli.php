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
	 * ## EXAMPLES
	 *
	 *     wp videopress import kUJmAcSf
	 *     wp videopress import kUJmAcSf --force
	 *
	 *     # Import multiple videos from a file
	 *     cat guids.txt | xargs -I {} wp videopress import {}
	 *
	 * @param array $args Positional arguments.
	 * @param array $assoc_args Associative arguments.
	 */
	public function import( $args, $assoc_args ) {
		$guid             = $args[0];
		$force            = get_flag_value( $assoc_args, 'force', false );
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

			wp_delete_attachment( $existing_post_id, true );
			WP_CLI::log(
				sprintf(
					/* translators: %d: attachment id */
					__( 'Deleted existing Attachment ID %d.', 'jetpack-videopress-pkg' ),
					$existing_post_id
				)
			);
		}

		$attachment_id = create_local_media_library_for_videopress_guid( $guid );

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
}
