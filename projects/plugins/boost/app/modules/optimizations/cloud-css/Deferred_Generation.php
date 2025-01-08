<?php

namespace Automattic\Jetpack_Boost\Modules\Optimizations\Cloud_CSS;

class Deferred_Generation {

	const SCHEDULER_HOOK = 'jetpack_boost_cloud_css_deferred_generation';

	public static function init() {
		add_action( self::SCHEDULER_HOOK, array( self::class, 'run' ) );
	}

	public static function run() {
		$cloud_css = new Cloud_CSS();
		$cloud_css->regenerate_cloud_css( Cloud_CSS::REGENERATE_REASON_SAVE_POST, $cloud_css->get_all_providers() );
	}

	public static function schedule() {
		$scheduled = wp_next_scheduled( self::SCHEDULER_HOOK );
		if ( $scheduled ) {
			return;
		}

		wp_schedule_single_event(
			time() + ( 12 * HOUR_IN_SECONDS ),
			self::SCHEDULER_HOOK
		);
	}

	public static function clear() {
		wp_clear_scheduled_hook( self::SCHEDULER_HOOK );
	}
}
