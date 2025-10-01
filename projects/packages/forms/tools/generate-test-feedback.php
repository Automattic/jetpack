<?php
/**
 * WP-CLI Script to generate test feedback entries for performance testing.
 *
 * Usage:
 *   wp eval-file generate-test-feedback.php -- --count=30000 --status=spam
 *
 * @package automattic/jetpack-forms
 *
 * phpcs:disable WordPress.WP.GlobalVariablesOverride, WordPress.WP.AlternativeFunctions.rand_rand
 */

if ( ! defined( 'WP_CLI' ) || ! WP_CLI ) {
	die( 'This script can only be run via WP-CLI' );
}

// Get command line arguments.
$args = array(
	'count'  => 30000,
	'status' => 'spam',
	'batch'  => 100,
);

foreach ( $argv as $arg ) {
	if ( strpos( $arg, '--count=' ) === 0 ) {
		$args['count'] = (int) str_replace( '--count=', '', $arg );
	}
	if ( strpos( $arg, '--status=' ) === 0 ) {
		$args['status'] = str_replace( '--status=', '', $arg );
	}
	if ( strpos( $arg, '--batch=' ) === 0 ) {
		$args['batch'] = (int) str_replace( '--batch=', '', $arg );
	}
}

WP_CLI::log( sprintf( 'Generating %d feedback entries with status "%s"...', $args['count'], $args['status'] ) );

// Create 10 test pages to be parents.
$test_page_ids = array();
$page_titles   = array(
	'Contact Us Form',
	'Get a Quote',
	'Support Request',
	'Newsletter Signup',
	'Product Inquiry',
	'General Feedback',
	'Partnership Opportunities',
	'Event Registration',
	'Demo Request',
	'Sales Contact',
);

WP_CLI::log( 'Creating 10 test parent pages...' );

foreach ( $page_titles as $index => $title ) {
	$page_id = wp_insert_post(
		array(
			'post_title'   => $title,
			'post_content' => '<!-- wp:jetpack/contact-form --><!-- /wp:jetpack/contact-form -->',
			'post_status'  => 'publish',
			'post_type'    => 'page',
		)
	);

	if ( is_wp_error( $page_id ) ) {
		WP_CLI::error( 'Failed to create test page: ' . $page_id->get_error_message() );
		return;
	}

	$test_page_ids[] = $page_id;
	WP_CLI::log( sprintf( '  Created page %d/%d: "%s" (ID: %d)', $index + 1, count( $page_titles ), $title, $page_id ) );
}

WP_CLI::log( sprintf( 'Created %d test pages', count( $test_page_ids ) ) );

// Sample data for variation.
$first_names = array( 'John', 'Jane', 'Bob', 'Alice', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Henry' );
$last_names  = array( 'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez' );
$domains     = array( 'example.com', 'test.com', 'demo.com', 'sample.org', 'mail.net' );
$messages    = array(
	'I am interested in your services.',
	'Please contact me about this opportunity.',
	'Can you provide more information?',
	'This is a test message.',
	'Looking forward to hearing from you.',
);

$progress = \WP_CLI\Utils\make_progress_bar( 'Generating feedback', $args['count'] );
$created  = 0;

for ( $i = 0; $i < $args['count']; $i++ ) {
	$first_name = $first_names[ array_rand( $first_names ) ];
	$last_name  = $last_names[ array_rand( $last_names ) ];
	$name       = $first_name . ' ' . $last_name;
	$email      = strtolower( $first_name . '.' . $last_name . $i ) . '@' . $domains[ array_rand( $domains ) ];
	$message    = $messages[ array_rand( $messages ) ];

	// Randomly select a parent page.
	$parent_id    = $test_page_ids[ array_rand( $test_page_ids ) ];
	$parent_title = get_the_title( $parent_id );

	// Create feedback entry.
	$feedback_data = array(
		'1_Name'    => $name,
		'2_Email'   => $email,
		'3_Message' => $message,
	);

	$post_id = wp_insert_post(
		array(
			'post_type'    => 'feedback',
			'post_status'  => $args['status'],
			'post_title'   => sprintf( 'Contact Form: %s', $name ),
			'post_content' => wp_json_encode( $feedback_data ),
			'post_parent'  => $parent_id,
			'post_date'    => gmdate( 'Y-m-d H:i:s', strtotime( '-' . rand( 1, 365 ) . ' days' ) ),
		),
		true
	);

	if ( ! is_wp_error( $post_id ) ) {
		// Add post meta for form response.
		update_post_meta( $post_id, '_feedback_author', $name );
		update_post_meta( $post_id, '_feedback_author_email', $email );
		update_post_meta( $post_id, '_feedback_subject', 'Contact Form Submission' );
		update_post_meta( $post_id, '_feedback_ip', '192.168.' . rand( 1, 255 ) . '.' . rand( 1, 255 ) );
		update_post_meta( $post_id, '_feedback_entry_title', $parent_title );
		update_post_meta( $post_id, '_feedback_entry_permalink', get_permalink( $parent_id ) );

		++$created;
	}

	$progress->tick();

	// Free up memory periodically.
	if ( $i % $args['batch'] === 0 ) {
		wp_cache_flush();
	}
}

$progress->finish();

WP_CLI::success( sprintf( 'Successfully created %d feedback entries with status "%s"', $created, $args['status'] ) );
WP_CLI::log( sprintf( 'Test page IDs: %s', implode( ', ', $test_page_ids ) ) );
WP_CLI::log( '' );
WP_CLI::log( 'To clean up test data, run:' );
WP_CLI::log( '  wp eval-file cleanup-test-feedback.php' );
WP_CLI::log( '' );
WP_CLI::log( 'Or manually:' );
WP_CLI::log( '  wp post delete $(wp post list --post_type=feedback --format=ids) --force' );
WP_CLI::log( '  wp post delete ' . implode( ' ', $test_page_ids ) . ' --force' );
