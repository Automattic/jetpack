<?php
/**
 * Tests for the Stats Top Posts export controller.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics\Reports\Export\Exports;

use Automattic\Jetpack\PremiumAnalytics\Reports\Export\Report_Registry;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;

/**
 * @covers \Automattic\Jetpack\PremiumAnalytics\Reports\Export\Exports\Top_Posts_Export_Controller
 */
#[CoversClass( Top_Posts_Export_Controller::class )]
class TopPostsExportController_Test extends TestCase {

	private function controller(): Top_Posts_Export_Controller {
		return new Top_Posts_Export_Controller( new Report_Registry() );
	}

	public function test_metadata_and_stats_endpoint_mapping() {
		$controller = $this->controller();

		$this->assertSame( 'stats-top-posts', $controller->get_report_key() );
		$this->assertSame( 'Top Posts & Pages', $controller->get_report_label() );
		$this->assertSame( 'top-posts', $controller->get_data_endpoint() );
		$this->assertSame(
			array(
				'summarize' => 1,
				'max'       => 500,
			),
			$controller->get_additional_params()
		);
	}

	public function test_prepare_request_params_maps_from_to_to_stats_period_shape() {
		$params = $this->controller()->prepare_request_params(
			array(
				'from'         => '2026-01-01T00:00:00',
				'to'           => '2026-01-03T00:00:00',
				'interval'     => 'day',
				'compare_from' => '2025-01-01T00:00:00',
				'compare_to'   => '2025-01-03T00:00:00',
				'summarize'    => 1,
			)
		);

		$this->assertSame( 'day', $params['period'] );
		$this->assertSame( '2026-01-03', $params['date'] );
		$this->assertSame( 3, $params['num'] );
		$this->assertSame( 1, $params['summarize'] );
		$this->assertArrayNotHasKey( 'from', $params );
		$this->assertArrayNotHasKey( 'compare_from', $params );
	}

	public function test_prepare_request_params_uses_calendar_dates_without_timezone_shift() {
		$params = $this->controller()->prepare_request_params(
			array(
				'from'     => '2026-01-01T23:00:00-05:00',
				'to'       => '2026-01-03T01:00:00+09:00',
				'interval' => 'day',
			)
		);

		$this->assertSame( '2026-01-03', $params['date'] );
		$this->assertSame( 3, $params['num'] );
	}

	public function test_format_row_for_csv_maps_stats_postviews_fields() {
		$row = $this->controller()->format_row_for_csv(
			array(
				'title' => 'Hello World',
				'views' => '42',
				'type'  => 'post',
				'href'  => 'https://example.com/hello-world/',
			)
		);

		$this->assertSame(
			array(
				'post_title' => 'Hello World',
				'views'      => 42,
				'type'       => 'post',
				'url'        => 'https://example.com/hello-world/',
			),
			$row
		);
	}
}
