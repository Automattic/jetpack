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
	 * By default the new attachment reuses the post ID it had on WordPress.com so the
	 * `videos.post_id` relationship recorded there stays intact. If that ID is already
	 * occupied locally by an unrelated post, the import is refused — pass `--force` to
	 * fall back to a fresh auto-incremented ID instead.
	 *
	 * ## OPTIONS
	 *
	 * <guid>
	 * : The GUID of the video to import.
	 *
	 * [--force]
	 * : Resolve conflicts instead of refusing. If a same-GUID attachment already exists,
	 * it is deleted and re-imported. If the original WordPress.com post ID is occupied
	 * by an unrelated post, that post is left alone and the new attachment is given a
	 * fresh auto-incremented ID.
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
			WP_CLI::error( 'You must provide a VideoPress GUID.' );
		}

		$result = $this->process_import(
			$args[0],
			(bool) get_flag_value( $assoc_args, 'force', false ),
			(int) get_flag_value( $assoc_args, 'parent-id', 0 ),
			(bool) get_flag_value( $assoc_args, 'dry-run', false )
		);

		switch ( $result['status'] ) {
			case 'imported':
				WP_CLI::success( $result['message'] );
				break;
			case 'skipped':
				WP_CLI::warning( $result['message'] );
				break;
			case 'failed':
			default:
				WP_CLI::error( $result['message'] );
				break;
		}
	}

	/**
	 * Import multiple VideoPress videos by GUID in one CLI run.
	 *
	 * Reads GUIDs (one per line) from a file or stdin and runs the same per-video import
	 * pipeline as `wp videopress import`. Lines that are blank or start with `#` are ignored.
	 * On completion, prints a summary of imported / skipped / failed counts.
	 *
	 * Compared to `xargs -I {} wp videopress import {}`, this runs in a single PHP process
	 * (no per-GUID WordPress bootstrap), keeps a unified summary, and lets dry-run preview
	 * the whole batch without applying anything.
	 *
	 * ## OPTIONS
	 *
	 * [<file>]
	 * : Path to a file containing GUIDs (one per line). Pass `-` or omit to read from stdin.
	 *
	 * [--force]
	 * : Resolve conflicts instead of refusing. See `wp videopress import --help`.
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
			WP_CLI::error( 'No GUIDs provided.' );
		}

		$dry_run = (bool) get_flag_value( $assoc_args, 'dry-run', false );
		$force   = (bool) get_flag_value( $assoc_args, 'force', false );

		$imported = array();
		$skipped  = array();
		$failed   = array();

		foreach ( $guids as $guid ) {
			$result = $this->process_import( $guid, $force, 0, $dry_run );

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
				'Batch import complete: %1$d total, %2$d imported, %3$d skipped, %4$d failed.',
				count( $guids ),
				count( $imported ),
				count( $skipped ),
				count( $failed )
			)
		);

		if ( ! empty( $failed ) ) {
			WP_CLI::error( 'One or more videos failed to import. See output above.' );
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
			WP_CLI::error( sprintf( 'Cannot read GUID list from %s.', $source ) );
			return array();
		}

		// Distinguish a real read failure from an empty input. Casting false → '' would
		// make a permission/IO error look like "no GUIDs provided", which is misleading.
		if ( false === $raw ) {
			WP_CLI::error( sprintf( 'Failed to read GUID list from %s.', '-' === $source ? 'stdin' : $source ) );
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

		// Dedup so a GUID listed twice doesn't double-count or trip the "already
		// imported" path on its own second pass.
		return array_values( array_unique( $guids ) );
	}

	/**
	 * Run a single-GUID import and return a structured result.
	 *
	 * Single source of truth for both `wp videopress import` and `wp videopress batch-import`:
	 * returns instead of calling WP_CLI::error/success so the caller can present the result
	 * how it wants (success/warning/error in single mode; one log line per GUID in batch mode).
	 *
	 * The `message` is self-contained for every status so callers can log it verbatim.
	 *   - 'imported': real ID for a real run; the would-be ID for a dry run (0 for fresh ID).
	 *   - 'skipped' / 'failed': always 0 — the relevant ID is interpolated into `message`.
	 *
	 * @param string $guid Video GUID.
	 * @param bool   $force Resolve conflicts (delete same-GUID attachment, fall back to fresh ID on collision) instead of refusing.
	 * @param int    $parent_id Parent post ID, 0 for unattached.
	 * @param bool   $dry_run If true, no state is mutated.
	 * @return array{status:'imported'|'skipped'|'failed',attachment_id:int,message:string}
	 */
	private function process_import( $guid, $force, $parent_id, $dry_run ) {
		if ( ! videopress_is_valid_guid( $guid ) ) {
			return $this->fail( sprintf( 'Invalid GUID: %s', $guid ) );
		}

		$existing_post_id = videopress_get_post_id_by_guid( $guid );

		if ( $existing_post_id && ! $force ) {
			$message = sprintf( 'Already imported as Attachment ID %d. Use --force to re-import.', $existing_post_id );
			if ( $dry_run ) {
				$message = '[dry-run] Would skip — ' . $message;
			}
			return array(
				'status'        => 'skipped',
				'attachment_id' => 0,
				'message'       => $message,
			);
		}

		if ( $dry_run ) {
			return $this->dry_run_preview( $guid, $force, $existing_post_id );
		}

		if ( $existing_post_id && $force ) {
			$deleted = wp_delete_attachment( $existing_post_id, true );
			if ( ! $deleted ) {
				return $this->fail( sprintf( 'Failed to delete existing Attachment ID %d.', $existing_post_id ) );
			}
			delete_transient( videopress_get_post_id_by_guid_cache_key( $guid ) );
		}

		$attachment_id = create_local_media_library_for_videopress_guid( $guid, $parent_id, $force );

		if ( is_wp_error( $attachment_id ) ) {
			$message = $attachment_id->get_error_message();
			if ( 'id_collision' === $attachment_id->get_error_code() ) {
				$message .= ' Pass --force to import with a fresh ID, or delete the conflicting post first.';
			}
			return $this->fail( $message );
		}
		if ( ! $attachment_id ) {
			return $this->fail( 'Unknown error during import.' );
		}

		$attachment_id = (int) $attachment_id;
		return array(
			'status'        => 'imported',
			'attachment_id' => $attachment_id,
			'message'       => sprintf( 'Imported as Attachment ID %d.', $attachment_id ),
		);
	}

	/**
	 * Build a dry-run "imported" result by mirroring the helper's pre-flight checks
	 * without writing anything.
	 *
	 * @param string $guid Video GUID.
	 * @param bool   $force Whether --force was passed (drives same-GUID delete preview and collision fallback).
	 * @param int    $existing_post_id Existing same-GUID attachment ID (or 0).
	 * @return array{status:'imported'|'failed',attachment_id:int,message:string}
	 */
	private function dry_run_preview( $guid, $force, $existing_post_id ) {
		$vp_data = videopress_get_video_details( $guid );
		if ( is_wp_error( $vp_data ) ) {
			return $this->fail( $vp_data->get_error_message() );
		}

		$current_blog_id = (int) \Jetpack_Options::get_option( 'id' );
		if ( ! $current_blog_id ) {
			return $this->fail( 'Site is not connected to WordPress.com.' );
		}
		$video_blog_id = (int) ( $vp_data->blog_id ?? 0 );
		if ( $current_blog_id !== $video_blog_id ) {
			return $this->fail( sprintf( 'Video belongs to a different site (blog %1$d, this site is %2$d).', $video_blog_id, $current_blog_id ) );
		}

		$original_post_id = isset( $vp_data->post_id ) ? (int) $vp_data->post_id : 0;
		$collision        = videopress_get_id_collision( $original_post_id, $guid );

		if ( $collision && ! $force ) {
			return $this->fail(
				sprintf(
					'Original Attachment ID %1$d is occupied by post type "%2$s". Pass --force to import with a fresh ID, or delete the conflicting post first.',
					$original_post_id,
					$collision->post_type
				)
			);
		}

		if ( $collision ) {
			$message = sprintf(
				'[dry-run] Would import with a fresh auto-incremented ID (original ID %1$d is occupied by post type "%2$s").',
				$original_post_id,
				$collision->post_type
			);
		} elseif ( $original_post_id > 0 ) {
			$message = sprintf( '[dry-run] Would import as attachment %d (preserved from WordPress.com).', $original_post_id );
		} else {
			$message = '[dry-run] Would import with a fresh auto-incremented ID.';
		}
		// Surface the destructive same-GUID delete --force would perform on a real run.
		if ( $existing_post_id && $force ) {
			$message = sprintf( '[dry-run] Would delete existing Attachment ID %d and re-import. ', $existing_post_id ) . $message;
		}

		return array(
			'status'        => 'imported',
			'attachment_id' => $collision ? 0 : $original_post_id,
			'message'       => $message,
		);
	}

	/**
	 * Build a 'failed' result with the given message.
	 *
	 * @param string $message Failure message.
	 * @return array{status:'failed',attachment_id:int,message:string}
	 */
	private function fail( $message ) {
		return array(
			'status'        => 'failed',
			'attachment_id' => 0,
			'message'       => $message,
		);
	}
}
