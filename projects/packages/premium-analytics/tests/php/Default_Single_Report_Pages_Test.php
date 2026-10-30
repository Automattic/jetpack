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
 * The video page registers through the API like any plugin's page, gated on VideoPress and Stats access.
 *
 * @covers ::Automattic\Jetpack\PremiumAnalytics\get_email_clicks_single_report_section_default_layout
 * @covers ::Automattic\Jetpack\PremiumAnalytics\get_email_opens_single_report_section_default_layout
 * @covers ::Automattic\Jetpack\PremiumAnalytics\get_post_traffic_single_report_section_default_layout
 * @covers ::Automattic\Jetpack\PremiumAnalytics\get_video_single_report_page_default_layout
 * @covers ::Automattic\Jetpack\PremiumAnalytics\is_video_single_report_page_available
 * @covers ::Automattic\Jetpack\PremiumAnalytics\register_default_single_report_pages
 */
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\register_default_single_report_pages' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\is_video_single_report_page_available' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\get_video_single_report_page_default_layout' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\get_post_traffic_single_report_section_default_layout' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\get_email_opens_single_report_section_default_layout' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\get_email_clicks_single_report_section_default_layout' )]
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

		remove_all_filters( VIDEOPRESS_AVAILABLE_FILTER );
		wp_set_current_user( 0 );
		$this->reset_analytics_capabilities();

		parent::tear_down();
	}

	public function test_registers_the_video_page_through_the_api() {
		add_filter( VIDEOPRESS_AVAILABLE_FILTER, '__return_true' );
		$this->login_as( 'administrator' );

		$page = get_registered_single_report_page( DASHBOARD_NAME, 'analytics/video' );

		$this->assertInstanceOf( Single_Report_Page::class, $page );
		$record = $page->to_array();
		$this->assertSame( 'video', $record['path'] );
		$this->assertSame( 'traffic', $record['dashboard_section'] );
		$this->assertSame( 'videos', $record['feature'] );
		$this->assertSame( 'post_id', $record['scope_param'] );
		$this->assertSame( 'jpa/video', $record['icon'] );
		$this->assertNull( $record['controls'] );
		$this->assertSame( 'videos', $record['reports_page'] );
		$this->assertSame( 'jetpack-premium-analytics/video-detail', $record['preferences_scope'] );
		$this->assertSame(
			array( 'jpa/video-detail-views-performance', 'jpa/video-detail-embeds' ),
			array_column( $record['default_layout'], 'type' )
		);
		$this->assertSame( array( 'analytics/post', 'analytics/video' ), array_column( get_available_single_report_page_records(), 'id' ) );
	}

	public function test_registers_the_post_page_with_its_three_sections() {
		$this->login_as( 'administrator' );

		$record = get_registered_single_report_page( DASHBOARD_NAME, 'analytics/post' )->to_array();

		$this->assertSame( 'post', $record['path'] );
		$this->assertSame( 'posts', $record['reports_page'] );
		$this->assertSame( 'jetpack-premium-analytics/post-detail', $record['preferences_scope'] );
		$this->assertSame( array(), $record['default_layout'] );
		$this->assertSame( array( 'post-traffic', 'email-opens', 'email-clicks' ), array_column( $record['sections'], 'slug' ) );
		$this->assertSame( array( null, array(), array() ), array_column( $record['sections'], 'controls' ) );
		$this->assertSame( 'jpa/post-detail-highlights', $record['sections'][0]['default_layout'][0]['type'] );
		$this->assertSame( 'jpa/email-time-series--total-opens', $record['sections'][1]['default_layout'][1]['type'] );
		$this->assertSame( 'jpa/email-breakdown--top-links', $record['sections'][2]['default_layout'][5]['type'] );
	}

	public function test_the_rest_route_lists_the_video_page() {
		global $wp_rest_server;
		$wp_rest_server = new WP_REST_Server();
		Dashboard_Support_Routes::boot_routes();

		add_filter( VIDEOPRESS_AVAILABLE_FILTER, '__return_true' );
		$this->login_as( 'administrator' );

		$response = rest_get_server()->dispatch(
			new WP_REST_Request( 'GET', '/wpcom/v2/dashboards/' . DASHBOARD_NAME . '/single-report-pages' )
		);

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( array( 'analytics/video' ), array_column( $response->get_data(), 'id' ) );
	}

	public function test_the_video_page_needs_videopress_and_stats_access() {
		add_filter( VIDEOPRESS_AVAILABLE_FILTER, '__return_false' );
		$this->login_as( 'administrator' );
		$this->assertSame( array( 'analytics/post' ), array_column( get_available_single_report_page_records(), 'id' ) );

		remove_all_filters( VIDEOPRESS_AVAILABLE_FILTER );
		add_filter( VIDEOPRESS_AVAILABLE_FILTER, '__return_true' );
		$this->login_as( 'subscriber' );
		$this->assertSame( array(), get_available_single_report_page_records() );
		$this->assertInstanceOf( Single_Report_Page::class, get_registered_single_report_page( DASHBOARD_NAME, 'analytics/video' ) );
	}
}
