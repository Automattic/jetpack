<?php
/**
 * Tests for the package's own reports pages.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\CoversFunction;
use WorDBless\BaseTestCase;

require_once __DIR__ . '/../../src/default-reports-pages.php';
require_once __DIR__ . '/traits/trait-analytics-capabilities.php';

/**
 * The package's own reports pages register through the API like any plugin's.
 *
 * @covers \Automattic\Jetpack\PremiumAnalytics\Reports_Page
 * @covers \Automattic\Jetpack\PremiumAnalytics\Reports_Page_Registry
 * @covers ::Automattic\Jetpack\PremiumAnalytics\get_available_reports_page_records
 * @covers ::Automattic\Jetpack\PremiumAnalytics\register_default_reports_pages
 * @covers ::Automattic\Jetpack\PremiumAnalytics\register_reports_page
 */
#[CoversClass( Reports_Page::class )]
#[CoversClass( Reports_Page_Registry::class )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\get_available_reports_page_records' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\register_default_reports_pages' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\register_reports_page' )]
class Default_Reports_Pages_Test extends BaseTestCase {
	use Analytics_Capabilities_Trait;

	/**
	 * Set up.
	 */
	public function set_up() {
		parent::set_up();
		Capabilities::register();

		// Another test may unhook the package's own registrant; the file-scope hook is not re-run.
		if ( false === has_action( Reports_Page_Registry::REGISTER_ACTION, __NAMESPACE__ . '\\register_default_reports_pages' ) ) {
			add_action( Reports_Page_Registry::REGISTER_ACTION, __NAMESPACE__ . '\\register_default_reports_pages' );
		}
	}

	/**
	 * Tear down.
	 */
	public function tear_down() {
		$instance = new \ReflectionProperty( Reports_Page_Registry::class, 'instance' );
		if ( PHP_VERSION_ID < 80100 ) {
			$instance->setAccessible( true );
		}
		$instance->setValue( null, null );

		remove_all_filters( 'doing_it_wrong_trigger_error' );
		remove_all_actions( 'doing_it_wrong_run' );
		wp_set_current_user( 0 );
		$this->reset_analytics_capabilities();

		parent::tear_down();
	}

	public function test_serves_the_posts_page_as_two_sections_of_one_table_widget_each() {
		$this->login_as( 'administrator' );

		$records = get_available_reports_page_records();
		$record  = $records[0];

		$this->assertCount( 1, $records );
		$this->assertSame( 'analytics/posts', $record['id'] );
		$this->assertSame( 'posts', $record['path'] );
		$this->assertSame( 'traffic', $record['dashboard_section'] );
		$this->assertSame( 'top-posts', $record['feature'] );
		$this->assertSame( 'jetpack-premium-analytics/posts-report', $record['preferences_scope'] );
		$this->assertSame( array( 'posts-pages', 'archives' ), array_column( $record['sections'], 'slug' ) );
		$this->assertSame( array( 'jpa/posts-table' ), array_column( $record['sections'][0]['default_layout'], 'type' ) );
		$this->assertSame( array( 'jpa/archives-table' ), array_column( $record['sections'][1]['default_layout'], 'type' ) );
	}

	public function test_a_reports_page_record_carries_no_entity_scope() {
		$this->login_as( 'administrator' );

		$record = get_available_reports_page_records()[0];

		$this->assertArrayNotHasKey( 'scope_param', $record );
		$this->assertArrayNotHasKey( 'id_pattern', $record );
		$this->assertArrayNotHasKey( 'reports_page', $record );
	}

	public function test_serves_no_page_to_a_reader_without_stats_access() {
		$this->login_as( 'subscriber' );

		$this->assertSame( array(), get_available_reports_page_records() );
	}

	public function test_refuses_a_second_page_on_a_path_already_taken() {
		$this->login_as( 'administrator' );

		$refused = array();
		add_filter( 'doing_it_wrong_trigger_error', '__return_false' );
		add_action(
			'doing_it_wrong_run',
			static function ( $function_name ) use ( &$refused ) {
				$refused[] = $function_name;
			}
		);

		// Read first, so the package's own page holds the path.
		get_available_reports_page_records();

		$this->assertFalse( register_reports_page( DASHBOARD_NAME, 'my-plugin/posts', array( 'path' => 'posts' ) ) );
		$this->assertSame( array( Reports_Page_Registry::class . '::register' ), $refused );
	}
}
