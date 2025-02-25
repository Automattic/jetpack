<?php

namespace Automattic\Jetpack_Boost\Modules\Performance_History;

use Automattic\Jetpack\Schema\Schema;
use Automattic\Jetpack\WP_JS_Data_Sync\Data_Sync;
use Automattic\Jetpack_Boost\Contracts\Has_Data_Sync;
use Automattic\Jetpack_Boost\Contracts\Is_Always_On;
use Automattic\Jetpack_Boost\Contracts\Pluggable;
use Automattic\Jetpack_Boost\Data_Sync\Performance_History_Entry;
use Automattic\Jetpack_Boost\Lib\Premium_Features;

class Performance_History implements Pluggable, Is_Always_On, Has_Data_Sync {

	public function setup() {
		// noop
	}

	public function register_data_sync( Data_Sync $instance ) {
		$performance_history_schema = Schema::as_assoc_array(
			array(
				'periods'     => Schema::as_array(
					Schema::as_assoc_array(
						array(
							'timestamp'  => Schema::as_number(),
							'dimensions' => Schema::as_assoc_array(
								array(
									'desktop_overall_score' => Schema::as_number(),
									'mobile_overall_score' => Schema::as_number(),
									'desktop_cls'          => Schema::as_number(),
									'desktop_lcp'          => Schema::as_number(),
									'desktop_tbt'          => Schema::as_number(),
									'mobile_cls'           => Schema::as_number(),
									'mobile_lcp'           => Schema::as_number(),
									'mobile_tbt'           => Schema::as_number(),
								)
							),
						)
					)
				),
				'annotations' => Schema::as_array(
					Schema::as_assoc_array(
						array(
							'timestamp' => Schema::as_number(),
							'text'      => Schema::as_string(),
						)
					)
				),
				'startDate'   => Schema::as_number(),
				'endDate'     => Schema::as_number(),
			)
		);

		$instance->register( 'performance_history_toggle', Schema::as_boolean()->fallback( false ) );

		$instance->register( 'performance_history', $performance_history_schema, new Performance_History_Entry() );
	}

	public static function is_available() {
		return Premium_Features::has_feature( Premium_Features::PERFORMANCE_HISTORY );
	}

	public static function get_slug() {
		return 'performance_history';
	}
}
