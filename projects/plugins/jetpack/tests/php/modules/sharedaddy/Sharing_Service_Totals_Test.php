<?php
/**
 * Tests for the site-wide share totals in Sharing_Service.
 *
 * @package automattic/jetpack
 */

declare( strict_types = 1 );

require_once JETPACK__PLUGIN_DIR . 'modules/sharedaddy/sharing-service.php';

/**
 * Sharing_Service::get_total() and get_services_total() for a whole site, read from a sharing_stats table like the one on WordPress.com.
 */
class Sharing_Service_Totals_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Create sharing_stats with shares on two posts of this site, and more shares on another site.
	 */
	public function set_up() {
		global $wpdb;

		parent::set_up();

		$blog_id = get_current_blog_id();
		// The test case turns CREATE TABLE into a temporary table for this test.
		// phpcs:disable WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,WordPress.DB.DirectDatabaseQuery.SchemaChange
		$wpdb->query( 'CREATE TABLE sharing_stats ( blog_id bigint(20) NOT NULL, post_id bigint(20) NOT NULL, share_service varchar(32) NOT NULL, count int(11) NOT NULL, PRIMARY KEY ( blog_id, post_id, share_service ) )' );
		$wpdb->query(
			$wpdb->prepare(
				'INSERT INTO sharing_stats ( blog_id, post_id, share_service, count ) VALUES ( %d, 1, "facebook", 3 ), ( %d, 2, "facebook", 4 ), ( %d, 2, "x", 5 ), ( %d, 1, "facebook", 100 )',
				$blog_id,
				$blog_id,
				$blog_id,
				$blog_id + 1
			)
		);
		// phpcs:enable
	}

	/**
	 * Drop the table set_up() created.
	 */
	public function tear_down() {
		global $wpdb;

		$wpdb->query( 'DROP TABLE IF EXISTS sharing_stats' ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,WordPress.DB.DirectDatabaseQuery.SchemaChange
		parent::tear_down();
	}

	/**
	 * Catches the grouped read losing a service, mixing in another site's shares, or not summing a service across posts.
	 */
	public function test_site_totals_add_up_each_service_across_posts() {
		$sharer = new Sharing_Service();

		$this->assertSame( 12, $sharer->get_total() );
		$this->assertSame( 7, $sharer->get_total( 'facebook' ) );
		$this->assertSame( 5, $sharer->get_total( 'x' ) );
		$this->assertSame( 0, $sharer->get_total( 'tumblr' ) );
	}

	/**
	 * Catches the site-wide totals going back to one sharing_stats query per service.
	 */
	public function test_site_totals_for_every_service_run_one_query() {
		$sharer  = new Sharing_Service();
		$queries = 0;
		$count   = function ( $sql ) use ( &$queries ) {
			if ( false !== strpos( $sql, 'sharing_stats' ) ) {
				++$queries;
			}
			return $sql;
		};

		add_filter( 'query', $count );
		$sharer->get_total();
		$services_totals = $sharer->get_services_total();
		remove_filter( 'query', $count );

		$this->assertGreaterThan( 1, count( $services_totals ) );
		$this->assertSame( 1, $queries );
	}
}
