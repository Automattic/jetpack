<?php
/**
 * Plain-PHP tripwire for `Akismet_Experimental_Activity::query()`.
 *
 * Runs from CLI without WP_UnitTestCase. Stubs the WP functions the union
 * query touches so the class can be exercised directly.
 *
 *   php tests/phpunit/test-activity-union.php
 *
 * Exits 0 on pass, 1 on fail.
 *
 * @package Akismet_Experimental
 */

if ( ! defined( 'ABSPATH' ) ) {
	define( 'ABSPATH', __DIR__ );
}

// Stub the small set of WP functions the union query reaches for. We
// don't need WP loaded — `query_comments()` returns empty when there is
// no comment query result, and the mock branches don't need core.
if ( ! function_exists( 'add_action' ) ) {
	function add_action() {} // phpcs:ignore
}
if ( ! function_exists( '__' ) ) {
	function __( $s ) { return $s; } // phpcs:ignore
}
if ( ! function_exists( 'admin_url' ) ) {
	function admin_url( $path ) { return 'http://localhost/wp-admin/' . $path; } // phpcs:ignore
}
if ( ! function_exists( 'get_comment_meta' ) ) {
	function get_comment_meta() { return ''; } // phpcs:ignore
}
if ( ! function_exists( 'get_post' ) ) {
	function get_post() { return null; } // phpcs:ignore
}
if ( ! function_exists( 'get_the_title' ) ) {
	function get_the_title() { return ''; } // phpcs:ignore
}
if ( ! function_exists( 'mysql_to_rfc3339' ) ) {
	function mysql_to_rfc3339( $s ) { return gmdate( 'c', strtotime( $s ?: 'now' ) ); } // phpcs:ignore
}
if ( ! class_exists( 'WP_Comment_Query' ) ) {
	class WP_Comment_Query { // phpcs:ignore
		public function query() {
			return array(); }
	}
}

require_once dirname( __DIR__, 2 ) . '/class.akismet-experimental-activity.php';

$failures = array();

// 1. With no real comments + no WC, mocked categories still ship rows.
$response = Akismet_Experimental_Activity::query( array() );
if ( $response['total'] <= 0 ) {
	$failures[] = 'FAIL: expected mock rows when no real data present, got total=' . $response['total'];
}
if ( $response['per_page'] !== 25 ) {
	$failures[] = 'FAIL: default per_page should be 25, got ' . $response['per_page'];
}

// 2. Category filter narrows to a single category.
$logins = Akismet_Experimental_Activity::query( array( 'category' => 'logins' ) );
foreach ( $logins['items'] as $row ) {
	if ( $row['category'] !== 'logins' ) {
		$failures[] = "FAIL: category=logins filter leaked '{$row['category']}'";
		break;
	}
}
if ( $logins['total'] !== 24 ) {
	$failures[] = 'FAIL: expected 24 mocked login rows, got ' . $logins['total'];
}

// 3. Outcome filter narrows across sources.
$blocks = Akismet_Experimental_Activity::query( array( 'outcome' => 'block' ) );
foreach ( $blocks['items'] as $row ) {
	if ( $row['outcome'] !== 'block' ) {
		$failures[] = "FAIL: outcome=block filter leaked '{$row['outcome']}'";
		break;
	}
}

// 4. Source filter narrows to one source.
$edge = Akismet_Experimental_Activity::query( array( 'source' => 'blackbox-edge' ) );
foreach ( $edge['items'] as $row ) {
	if ( $row['source'] !== 'blackbox-edge' ) {
		$failures[] = "FAIL: source=blackbox-edge filter leaked '{$row['source']}'";
		break;
	}
}

// 5. Pagination metadata is consistent.
$small = Akismet_Experimental_Activity::query( array( 'per_page' => 5 ) );
if ( $small['per_page'] !== 5 ) {
	$failures[] = 'FAIL: per_page override ignored, got ' . $small['per_page'];
}
if ( count( $small['items'] ) > 5 ) {
	$failures[] = 'FAIL: per_page should cap items at 5, got ' . count( $small['items'] );
}
$expected_pages = $small['total'] > 0 ? (int) ceil( $small['total'] / 5 ) : 0;
if ( $small['total_pages'] !== $expected_pages ) {
	$failures[] = "FAIL: total_pages should be {$expected_pages}, got {$small['total_pages']}";
}

// 6. Search filter matches the subject label.
$search = Akismet_Experimental_Activity::query(
	array(
		'category' => 'forms',
		'search'   => 'submission',
	)
);
if ( $search['total'] === 0 ) {
	$failures[] = 'FAIL: search for "submission" should match every mock form row';
}

// 7. Every mocked row must carry preview=true.
$all = Akismet_Experimental_Activity::query( array( 'per_page' => 100 ) );
foreach ( $all['items'] as $row ) {
	if ( $row['category'] !== 'comments' && true !== $row['preview'] ) {
		$failures[] = "FAIL: mocked row in category '{$row['category']}' must carry preview=true";
		break;
	}
}

if ( empty( $failures ) ) {
	echo "PASS: union returns mock rows when no real data ({$response['total']} rows)\n";
	echo "PASS: category / outcome / source filters narrow consistently\n";
	echo "PASS: pagination metadata matches per_page + total\n";
	echo "PASS: search matches subject label\n";
	echo "PASS: every mocked row carries preview=true\n";
	exit( 0 );
}

foreach ( $failures as $f ) {
	echo $f . "\n";
}
exit( 1 );
