<?php
/**
 * WPCOM Navigation Export Filter Tests
 *
 * @package automattic/jetpack-mu-wpcom
 */

declare( strict_types = 1 );

namespace Automattic\Jetpack\Jetpack_Mu_Wpcom\Wpcom_Navigation_Export_Filter;

use Automattic\Jetpack\Jetpack_Mu_Wpcom;

require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/wpcom-navigation-export-filter/class-export-filter.php';

/**
 * Tests for the WPCOM Navigation Export Filter feature.
 */
class Wpcom_Navigation_Export_Filter_Test extends \WorDBless\BaseTestCase {

	/**
	 * Export filter instance for testing.
	 *
	 * @var Export_Filter
	 */
	private $export_filter;

	/**
	 * Pre-test setup.
	 */
	public function setUp(): void {
		parent::setUp();

		// Initialize the feature the same way it's done in the main class
		\Automattic\Jetpack\Jetpack_Mu_Wpcom::load_features();

		$this->export_filter = new Export_Filter();
	}

	/**
	 * Test that export filter hooks are properly registered.
	 */
	public function test_export_filter_hooks_are_registered(): void {
		// Test that start_export_filtering is registered
		$this->assertNotFalse( \has_action( 'export_wp', array( $this->export_filter, 'start_export_filtering' ) ) );
	}

	/**
	 * Test that the filter is not active by default.
	 */
	public function test_filter_not_active_by_default(): void {
		$this->assertFalse( \has_filter( 'query', array( $this->export_filter, 'filter_export_queries' ) ) );
	}

	/**
	 * Test that the filter can be removed.
	 */
	public function test_filter_can_be_removed(): void {
		// Simulate export cycle
		$this->export_filter->start_export_filtering();
		$this->assertNotFalse( \has_filter( 'query', array( $this->export_filter, 'filter_export_queries' ) ) );

		$this->export_filter->stop_export_filtering();
		$this->assertFalse( \has_filter( 'query', array( $this->export_filter, 'filter_export_queries' ) ) );
	}

	/**
	 * Test that export queries are properly modified to filter navigation posts.
	 */
	public function test_export_queries_are_filtered(): void {
		global $wpdb;

		$this->export_filter->start_export_filtering();

		// Test that export queries are modified for filtering
		$export_query   = "SELECT ID FROM {$wpdb->posts} WHERE post_status != 'auto-draft'";
		$filtered_query = $this->export_filter->filter_export_queries( $export_query );

		// The query should be modified to include the filter
		$this->assertNotEquals( $export_query, $filtered_query, 'Export query should be modified when filtering is active' );

		// The filter should target wp_navigation posts specifically
		$this->assertStringContainsString( 'wp_navigation', $filtered_query, 'Filter should target wp_navigation posts' );

		// The filter should exclude posts with invalid authors (post_author > 0 AND NOT IN users table)
		$this->assertStringContainsString( 'post_author > 0', $filtered_query, 'Filter should check for non-system authors' );
		$this->assertStringContainsString( 'NOT IN (SELECT ID FROM', $filtered_query, 'Filter should check against users table' );

		// The exclusion should use AND NOT (...) logic
		$this->assertStringContainsString( 'AND NOT (', $filtered_query, 'Filter should use exclusion logic' );

		$this->export_filter->stop_export_filtering();
	}

	/**
	 * Test that the filter properly targets only wp_navigation posts.
	 */
	public function test_filter_targets_only_navigation_posts(): void {
		global $wpdb;

		$this->export_filter->start_export_filtering();

		// Test that export queries are modified to target wp_navigation specifically
		$export_query   = "SELECT ID FROM {$wpdb->posts} WHERE post_status != 'auto-draft'";
		$filtered_query = $this->export_filter->filter_export_queries( $export_query );

		// The filter should specifically target wp_navigation posts
		$this->assertStringContainsString( "post_type = 'wp_navigation'", $filtered_query, 'Filter should specifically target wp_navigation posts' );

		// The filter should not mention other post types like 'post'
		$this->assertStringNotContainsString( "post_type = 'post'", $filtered_query, 'Filter should not target regular posts' );

		// The condition should be within the exclusion logic (AND NOT (...))
		$this->assertMatchesRegularExpression(
			'/AND NOT \([^)]*post_type = \'wp_navigation\'[^)]*\)/',
			$filtered_query,
			'wp_navigation condition should be within the exclusion logic'
		);

		$this->export_filter->stop_export_filtering();
	}

	/**
	 * Test complete export workflow with hooks.
	 */
	public function test_complete_export_workflow_with_results(): void {
		// Test that export_wp action activates filtering and it stays active
		$this->assertFalse( \has_filter( 'query', array( $this->export_filter, 'filter_export_queries' ) ) );

		// Simulate export via action
		\do_action( 'export_wp' );

		// Filter should now be active (it will stay active until manually stopped)
		$this->assertNotFalse( \has_filter( 'query', array( $this->export_filter, 'filter_export_queries' ) ) );

		// Manually cleanup the filter.
		$this->export_filter->stop_export_filtering();
		$this->assertFalse( \has_filter( 'query', array( $this->export_filter, 'filter_export_queries' ) ) );
	}

	/**
	 * Test that the filter only affects export-type queries.
	 */
	public function test_filter_only_affects_export_queries(): void {
		global $wpdb;

		$this->export_filter->start_export_filtering();

		// Test that non-export queries are not modified
		$non_export_queries = array(
			"SELECT * FROM {$wpdb->posts} WHERE post_status = 'publish'",
			"UPDATE {$wpdb->posts} SET post_status = 'publish' WHERE ID = 1",
			"INSERT INTO {$wpdb->posts} (post_title) VALUES ('Test')",
		);

		foreach ( $non_export_queries as $query ) {
			$filtered_query = $this->export_filter->filter_export_queries( $query );
			$this->assertEquals( $query, $filtered_query, "Non-export query should not be modified: {$query}" );
		}

		$this->export_filter->stop_export_filtering();
	}
}
