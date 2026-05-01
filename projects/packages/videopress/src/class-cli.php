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

			delete_transient( videopress_get_post_id_by_guid_cache_key( $guid ) );
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
	 * Import multiple VideoPress videos by GUID in one CLI run.
	 *
	 * Reads GUIDs (one per line) from a file or stdin and calls the same per-video import
	 * pipeline as `wp videopress import`. Lines that are blank or start with `#` are ignored.
	 * On completion, prints a summary of imported / skipped / failed counts.
	 *
	 * Compared to `xargs -I {} wp videopress import {}`, this runs in a single PHP process
	 * (no per-GUID bootstrap), keeps a unified summary, and lets dry-run preview the whole
	 * batch without applying anything.
	 *
	 * ## OPTIONS
	 *
	 * [<file>]
	 * : Path to a file containing GUIDs (one per line). Pass `-` or omit to read from stdin.
	 *
	 * [--force]
	 * : Re-import videos that already exist locally (deletes the existing attachment first).
	 *
	 * [--no-preserve-id]
	 * : Skip reusing the original WordPress.com attachment ID.
	 *
	 * [--dry-run]
	 * : Report what would happen for each GUID without mutating state.
	 *
	 * Each line of output is a per-GUID outcome; the final line is a summary. Pipe stdout to a
	 * file (`> import.log`) to keep an audit trail of customer-site reattach runs.
	 *
	 * ## EXAMPLES
	 *
	 *     wp videopress batch-import guids.txt
	 *     wp videopress batch-import guids.txt --dry-run
	 *     cat guids.txt | wp videopress batch-import
	 *     wp videopress batch-import guids.txt --force
	 *
	 * @subcommand batch-import
	 *
	 * @param array $args Positional arguments.
	 * @param array $assoc_args Associative arguments.
	 */
	public function batch_import( $args, $assoc_args ) {
		$source = $args[0] ?? '-';
		$guids  = $this->read_guid_list( $source );

		if ( empty( $guids ) ) {
			WP_CLI::error( __( 'No GUIDs provided.', 'jetpack-videopress-pkg' ) );
		}

		$dry_run     = (bool) get_flag_value( $assoc_args, 'dry-run', false );
		$force       = (bool) get_flag_value( $assoc_args, 'force', false );
		$preserve_id = (bool) get_flag_value( $assoc_args, 'preserve-id', true );

		$imported = array();
		$skipped  = array();
		$failed   = array();

		foreach ( $guids as $guid ) {
			if ( ! videopress_is_valid_guid( $guid ) ) {
				$failed[ $guid ] = __( 'Invalid GUID.', 'jetpack-videopress-pkg' );
				WP_CLI::log( sprintf( '[%s] FAIL: %s', $guid, $failed[ $guid ] ) );
				continue;
			}

			$result = $this->import_one_for_batch( $guid, $force, $preserve_id, $dry_run );

			switch ( $result['status'] ) {
				case 'imported':
					$imported[ $guid ] = $result['attachment_id'];
					WP_CLI::log( sprintf( '[%s] %s', $guid, $result['message'] ) );
					break;
				case 'skipped':
					$skipped[ $guid ] = $result['message'];
					WP_CLI::log( sprintf( '[%s] %s', $guid, $result['message'] ) );
					break;
				case 'failed':
				default:
					$failed[ $guid ] = $result['message'];
					WP_CLI::log( sprintf( '[%s] FAIL: %s', $guid, $result['message'] ) );
					break;
			}
		}

		WP_CLI::log( '' );
		WP_CLI::log(
			sprintf(
				/* translators: %1$d total, %2$d imported, %3$d skipped, %4$d failed */
				__( 'Batch import complete: %1$d total, %2$d imported, %3$d skipped, %4$d failed.', 'jetpack-videopress-pkg' ),
				count( $guids ),
				count( $imported ),
				count( $skipped ),
				count( $failed )
			)
		);

		if ( ! empty( $failed ) ) {
			WP_CLI::error( __( 'One or more videos failed to import. See output above.', 'jetpack-videopress-pkg' ) );
		}
	}

	/**
	 * Read a newline-separated GUID list from a file path, stdin, or the special source `-`.
	 *
	 * @param string $source File path, or '-' for stdin.
	 * @return string[]
	 */
	private function read_guid_list( $source ) {
		if ( '-' === $source ) {
			$raw = stream_get_contents( STDIN );
		} elseif ( is_readable( $source ) ) {
			$raw = file_get_contents( $source ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
		} else {
			WP_CLI::error(
				sprintf(
					/* translators: %s file path */
					__( 'Cannot read GUID list from %s.', 'jetpack-videopress-pkg' ),
					$source
				)
			);
			return array();
		}

		// Distinguish a real read failure from an empty input. Casting false → '' would
		// make a permission/IO error look like "no GUIDs provided", which is misleading.
		if ( false === $raw ) {
			WP_CLI::error(
				sprintf(
					/* translators: %s file path or "stdin" */
					__( 'Failed to read GUID list from %s.', 'jetpack-videopress-pkg' ),
					'-' === $source ? 'stdin' : $source
				)
			);
			return array();
		}

		$guids = array();
		foreach ( preg_split( '/\R/', $raw ) as $line ) {
			$line = trim( $line );
			if ( '' === $line || '#' === substr( $line, 0, 1 ) ) {
				continue;
			}
			$guids[] = $line;
		}
		return $guids;
	}

	/**
	 * Run a single-GUID import for batch mode and return a structured result.
	 *
	 * Mirrors the import() command's logic but returns instead of calling WP_CLI::error/success,
	 * so failures don't abort the whole batch. The caller logs `message` verbatim for every
	 * status, so each status's message must be self-contained:
	 *   - 'imported': real ID for a real run; the would-be ID for a dry run (0 if not preserved).
	 *   - 'skipped' / 'failed': always 0 — the relevant ID is interpolated into `message`.
	 *
	 * @param string $guid Video GUID.
	 * @param bool   $force Whether to delete existing attachments before importing.
	 * @param bool   $preserve_id Whether to preserve the original wpcom post ID.
	 * @param bool   $dry_run If true, no state is mutated.
	 * @return array{status:'imported'|'skipped'|'failed',attachment_id:int,message:string}
	 */
	private function import_one_for_batch( $guid, $force, $preserve_id, $dry_run ) {
		$existing_post_id = videopress_get_post_id_by_guid( $guid );

		if ( $existing_post_id && ! $force ) {
			return array(
				'status'        => 'skipped',
				'attachment_id' => 0,
				'message'       => sprintf(
					/* translators: %d existing attachment id */
					__( 'Already imported as Attachment ID %d. Use --force to re-import.', 'jetpack-videopress-pkg' ),
					$existing_post_id
				),
			);
		}

		if ( $dry_run ) {
			$vp_data = videopress_get_video_details( $guid );
			if ( is_wp_error( $vp_data ) ) {
				return array(
					'status'        => 'failed',
					'attachment_id' => 0,
					'message'       => $vp_data->get_error_message(),
				);
			}
			$target  = $preserve_id && isset( $vp_data->post_id ) ? (int) $vp_data->post_id : 0;
			$message = $target > 0
				? sprintf(
					/* translators: %d: attachment id that would be used */
					__( '[dry-run] Would import as attachment %d (preserved from WordPress.com).', 'jetpack-videopress-pkg' ),
					$target
				)
				: __( '[dry-run] Would import with a fresh auto-incremented ID.', 'jetpack-videopress-pkg' );
			return array(
				'status'        => 'imported',
				'attachment_id' => $target,
				'message'       => $message,
			);
		}

		if ( $existing_post_id && $force ) {
			$deleted = wp_delete_attachment( $existing_post_id, true );
			if ( ! $deleted ) {
				return array(
					'status'        => 'failed',
					'attachment_id' => 0,
					'message'       => sprintf(
						/* translators: %d existing attachment id */
						__( 'Failed to delete existing Attachment ID %d.', 'jetpack-videopress-pkg' ),
						$existing_post_id
					),
				);
			}
			delete_transient( videopress_get_post_id_by_guid_cache_key( $guid ) );
		}

		$attachment_id = create_local_media_library_for_videopress_guid( $guid, 0, $preserve_id );

		if ( is_wp_error( $attachment_id ) ) {
			return array(
				'status'        => 'failed',
				'attachment_id' => 0,
				'message'       => $attachment_id->get_error_message(),
			);
		}

		if ( ! $attachment_id ) {
			return array(
				'status'        => 'failed',
				'attachment_id' => 0,
				'message'       => __( 'Unknown error during import.', 'jetpack-videopress-pkg' ),
			);
		}

		return array(
			'status'        => 'imported',
			'attachment_id' => (int) $attachment_id,
			'message'       => sprintf( '-> attachment %d', (int) $attachment_id ),
		);
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
						__( '[dry-run] Would refuse — original Attachment ID %1$d is occupied by post type "%2$s". Pass --no-preserve-id to import with a fresh ID, or delete the conflicting post first.', 'jetpack-videopress-pkg' ),
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
