<?php
/**
 * Tests for the package's own single-report pages.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

use PHPUnit\Framework\Attributes\CoversFunction;
use WorDBless\BaseTestCase;
use WP_REST_Request;
use WP_REST_Server;

require_once __DIR__ . '/../../src/default-single-report-pages.php';
require_once __DIR__ . '/traits/trait-analytics-capabilities.php';

/**
 * The package's own pages register through the API like any plugin's: author, post and page, for readers with Stats access.
 *
 * @covers ::Automattic\Jetpack\PremiumAnalytics\get_author_single_report_page_default_layout
 * @covers ::Automattic\Jetpack\PremiumAnalytics\get_email_clicks_single_report_section_default_layout
 * @covers ::Automattic\Jetpack\PremiumAnalytics\get_email_opens_single_report_section_default_layout
 * @covers ::Automattic\Jetpack\PremiumAnalytics\get_page_traffic_single_report_section_default_layout
 * @covers ::Automattic\Jetpack\PremiumAnalytics\get_post_traffic_single_report_section_default_layout
 * @covers ::Automattic\Jetpack\PremiumAnalytics\register_default_single_report_pages
 */
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\register_default_single_report_pages' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\get_post_traffic_single_report_section_default_layout' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\get_page_traffic_single_report_section_default_layout' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\get_email_opens_single_report_section_default_layout' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\get_email_clicks_single_report_section_default_layout' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\get_author_single_report_page_default_layout' )]
class Default_Single_Report_Pages_Test extends BaseTestCase {
	use Analytics_Capabilities_Trait;

	/**
	 * Set up.
	 */
	public function set_up() {
		parent::set_up();
		Capabilities::register();

		// Another test may unhook the package's own registrant; the file-scope hook is not re-run.
		if ( false === has_action( Single_Report_Page_Registry::REGISTER_ACTION, __NAMESPACE__ . '\\register_default_single_report_pages' ) ) {
			add_action( Single_Report_Page_Registry::REGISTER_ACTION, __NAMESPACE__ . '\\register_default_single_report_pages' );
		}
	}

	/**
	 * Tear down.
	 */
	public function tear_down() {
		$instance = new \ReflectionProperty( Single_Report_Page_Registry::class, 'instance' );
		if ( PHP_VERSION_ID < 80100 ) {
			$instance->setAccessible( true );
		}
		$instance->setValue( null, null );

		global $wp_rest_server;
		$wp_rest_server = null;

		wp_set_current_user( 0 );
		$this->reset_analytics_capabilities();

		parent::tear_down();
	}

	public function test_registers_the_author_page_scoped_by_author_id() {
		$this->login_as( 'administrator' );

		$record = get_registered_single_report_page( DASHBOARD_NAME, 'analytics/author' )->to_array();

		$this->assertSame( 'author', $record['path'] );
		$this->assertSame( 'author_id', $record['scope_param'] );
		$this->assertSame( 'authors', $record['feature'] );
		$this->assertSame( 'authors', $record['reports_page'] );
		$this->assertSame( 'jetpack-premium-analytics/author-detail', $record['preferences_scope'] );
		$this->assertSame(
			array( 'jpa/author-performance', 'jpa/popular-post--author', 'jpa/latest-post--author', 'jpa/author-top-posts', 'jpa/views-over-years--author' ),
			array_column( $record['default_layout'], 'type' )
		);
	}

	public function test_registers_the_post_page_with_its_three_sections() {
		$this->login_as( 'administrator' );

		$record = get_registered_single_report_page( DASHBOARD_NAME, 'analytics/post' )->to_array();

		$this->assertSame(
			array(
				'kind' => 'postType',
				'name' => 'post',
			),
			$record['entity']
		);
		$this->assertSame( 'post', $record['path'] );
		$this->assertSame( get_post_type_object( 'post' )->labels->singular_name, $record['label'] );
		$this->assertSame( 'posts', $record['reports_page'] );
		$this->assertSame( 'jetpack-premium-analytics/post-detail', $record['preferences_scope'] );
		$this->assertSame( array(), $record['default_layout'] );
		$this->assertSame( array( 'post-traffic', 'email-opens', 'email-clicks' ), array_column( $record['sections'], 'slug' ) );
		$this->assertSame( array( null, array(), array() ), array_column( $record['sections'], 'controls' ) );
		$this->assertSame( 'jpa/post-detail-highlights', $record['sections'][0]['default_layout'][0]['type'] );
		$this->assertSame( 'jpa/email-time-series--total-opens', $record['sections'][1]['default_layout'][1]['type'] );
		$this->assertSame( 'jpa/email-breakdown--top-links', $record['sections'][2]['default_layout'][5]['type'] );
	}

	public function test_registers_the_page_from_its_post_type_with_its_own_traffic_section() {
		$this->login_as( 'administrator' );

		$record = get_registered_single_report_page( DASHBOARD_NAME, 'analytics/page' )->to_array();
		$post   = get_registered_single_report_page( DASHBOARD_NAME, 'analytics/post' )->to_array();

		$this->assertSame(
			array(
				'kind' => 'postType',
				'name' => 'page',
			),
			$record['entity']
		);
		$this->assertSame( 'page', $record['path'] );
		$this->assertSame( get_post_type_object( 'page' )->labels->singular_name, $record['label'] );
		$this->assertSame( 'post_id', $record['scope_param'] );
		$this->assertSame( 'posts', $record['reports_page'] );
		$this->assertSame( 'jetpack-premium-analytics/page-detail', $record['preferences_scope'] );
		$this->assertSame( 'jpa/page', $record['icon'] );
		$this->assertSame( array( 'post-traffic' ), array_column( $record['sections'], 'slug' ) );
		$this->assertSame( 'Page traffic', $record['sections'][0]['label'] );

		$types = array_column( $post['sections'][0]['default_layout'], 'type' );
		$this->assertSame(
			array_merge( array( 'jpa/post-detail-highlights--page', 'jpa/post-views--page' ), array_slice( $types, 2 ) ),
			array_column( $record['sections'][0]['default_layout'], 'type' )
		);
	}

	public function test_every_detail_page_type_a_layout_places_is_declared() {
		$this->login_as( 'administrator' );

		$placed = array();
		foreach ( array( 'analytics/author', 'analytics/post', 'analytics/page' ) as $id ) {
			$record  = get_registered_single_report_page( DASHBOARD_NAME, $id )->to_array();
			$layouts = array_merge( array( $record['default_layout'] ), array_column( $record['sections'], 'default_layout' ) );
			foreach ( $layouts as $layout ) {
				$placed = array_merge( $placed, array_column( $layout, 'type' ) );
			}
		}

		$variants = array_filter(
			$placed,
			static function ( $type ) {
				return false !== strpos( $type, '--' );
			}
		);

		$this->assertNotEmpty( $variants );
		$this->assertSame( array(), array_values( array_diff( $variants, array_keys( get_detail_page_widget_types() ) ) ) );
	}

	public function test_a_site_with_its_post_types_outside_rest_keeps_the_post_page() {
		$this->login_as( 'administrator' );

		$types = array( get_post_type_object( 'post' ), get_post_type_object( 'page' ) );
		foreach ( $types as $type ) {
			$type->show_in_rest = false;
		}

		try {
			$this->assertSame( array( 'analytics/author', 'analytics/post' ), array_column( get_available_single_report_page_records(), 'id' ) );
		} finally {
			foreach ( $types as $type ) {
				$type->show_in_rest = true;
			}
		}
	}

	public function test_the_rest_route_lists_the_pages() {
		global $wp_rest_server;
		$wp_rest_server = new WP_REST_Server();
		Dashboard_Support_Routes::boot_routes();

		$this->login_as( 'administrator' );

		$response = rest_get_server()->dispatch(
			new WP_REST_Request( 'GET', '/wpcom/v2/dashboards/' . DASHBOARD_NAME . '/single-report-pages' )
		);

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( array( 'analytics/author', 'analytics/post', 'analytics/page' ), array_column( $response->get_data(), 'id' ) );
	}

	public function test_the_pages_are_available_to_stats_readers_only() {
		$this->login_as( 'administrator' );
		$this->assertSame( array( 'analytics/author', 'analytics/post', 'analytics/page' ), array_column( get_available_single_report_page_records(), 'id' ) );

		$this->login_as( 'subscriber' );
		$this->assertSame( array(), get_available_single_report_page_records() );
		$this->assertInstanceOf( Single_Report_Page::class, get_registered_single_report_page( DASHBOARD_NAME, 'analytics/post' ) );
	}
}
