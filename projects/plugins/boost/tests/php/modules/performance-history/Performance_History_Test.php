<?php

namespace Automattic\Jetpack_Boost\Tests\Modules\Performance_History;

use Automattic\Jetpack\WP_JS_Data_Sync\Data_Sync;
use Automattic\Jetpack_Boost\Modules\Performance_History\Performance_History;
use Automattic\Jetpack_Boost\Tests\Base_TestCase;

class Performance_History_Test extends Base_TestCase {
	public function test_history_schema_keeps_metric_decimals_and_integer_scores() {
		$data_sync = new Data_Sync( 'jetpack_boost_ds' );
		( new Performance_History() )->register_data_sync( $data_sync );

		$dimensions = array(
			'desktop_overall_score' => 87,
			'mobile_overall_score'  => 64,
			'desktop_cls'           => 0.042,
			'desktop_lcp'           => 2.35,
			'desktop_tbt'           => 0.27,
			'mobile_cls'            => 0.11,
			'mobile_lcp'            => 4.8,
			'mobile_tbt'            => 1.05,
		);
		$parsed     = $data_sync->get_registry()->get_entry( 'performance_history' )->get_parser()->parse(
			array(
				'periods'     => array(
					array(
						'timestamp'  => 1757980800000,
						'dimensions' => $dimensions,
					),
				),
				'annotations' => array(),
				'startDate'   => 1755388800000,
				'endDate'     => 1757980800000,
			)
		);

		$this->assertSame( $dimensions, $parsed['periods'][0]['dimensions'] );
	}
}
