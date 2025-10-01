<?php
/**
 * WP-CLI Script to clean up test feedback entries.
 *
 * Usage:
 *   wp eval-file cleanup-test-feedback.php
 *   wp eval-file cleanup-test-feedback.php -- --status=spam
 *   wp eval-file cleanup-test-feedback.php -- --all
 *
 * @package automattic/jetpack-forms
 */

if ( ! defined( 'WP_CLI' ) || ! WP_CLI ) {
	die( 'This script can only be run via WP-CLI' );
}

// Get command line arguments.
$args = array(
	'status' => null,
	'all'    => false,
);

foreach ( $argv as $arg ) {
	if ( strpos( $arg, '--status=' ) === 0 ) {
		$args['status'] = str_replace( '--status=', '', $arg );
	}
	if ( $arg === '--all' ) {
		$args['all'] = true;
	}
}

// Build query args.
$query_args = array(
	'post_type'      => 'feedback',
	'posts_per_page' => -1,
	'fields'         => 'ids',
);

if ( $args['all'] ) {
	$query_args['post_status'] = array( 'publish', 'draft', 'spam', 'trash', 'pending', 'future' );
	WP_CLI::log( 'Deleting ALL feedback entries...' );
} elseif ( $args['status'] ) {
	$query_args['post_status'] = $args['status'];
	WP_CLI::log( sprintf( 'Deleting feedback entries with status "%s"...', $args['status'] ) );
} else {
	// Default: delete spam only.
	$query_args['post_status'] = 'spam';
	WP_CLI::log( 'Deleting spam feedback entries...' );
}

// Get all feedback IDs.
$feedback_ids = get_posts( $query_args );

if ( empty( $feedback_ids ) ) {
	WP_CLI::success( 'No feedback entries found to delete.' );
	return;
}

$total = count( $feedback_ids );
WP_CLI::log( sprintf( 'Found %d feedback entries to delete.', $total ) );

// Confirm deletion.
WP_CLI::confirm( sprintf( 'Are you sure you want to delete %d feedback entries?', $total ) );

$progress = \WP_CLI\Utils\make_progress_bar( 'Deleting feedback', $total );
$deleted  = 0;

foreach ( $feedback_ids as $feedback_id ) {
	$result = wp_delete_post( $feedback_id, true );
	if ( $result ) {
		++$deleted;
	}
	$progress->tick();

	// Free up memory periodically.
	if ( $deleted % 100 === 0 ) {
		wp_cache_flush();
	}
}

$progress->finish();

WP_CLI::success( sprintf( 'Successfully deleted %d feedback entries.', $deleted ) );

// Also clean up any orphaned test pages.
$test_pages = get_posts(
	array(
		'post_type'      => 'page',
		'title'          => 'Test Contact Form Page',
		'posts_per_page' => -1,
		'fields'         => 'ids',
	)
);

if ( ! empty( $test_pages ) ) {
	WP_CLI::log( sprintf( 'Found %d test pages. Deleting...', count( $test_pages ) ) );
	foreach ( $test_pages as $page_id ) {
		wp_delete_post( $page_id, true );
	}
	WP_CLI::success( sprintf( 'Deleted %d test pages.', count( $test_pages ) ) );
}
