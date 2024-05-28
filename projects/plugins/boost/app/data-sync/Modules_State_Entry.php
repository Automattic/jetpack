<?php

namespace Automattic\Jetpack_Boost\Data_Sync;

use Automattic\Jetpack\WP_JS_Data_Sync\Contracts\Entry_Can_Get;
use Automattic\Jetpack\WP_JS_Data_Sync\Contracts\Entry_Can_Merge;
use Automattic\Jetpack_Boost\Modules\Module;
use Automattic\Jetpack_Boost\Modules\Modules_Index;

class Modules_State_Entry implements Entry_Can_Get {
	public function get( $_fallback = false ) {
		$modules_state     = array();
		$modules = array();
		foreach (Modules_Index::MODULES as $module_name) {
		    $modules[] = new Module(new $module_name());
		}


		/*
		 * Module states are stored in their individual wp_options records.
		 * We're combining the states of all modules into a single record and attaching the availability of the module.
		 */
		foreach ( $modules as $module ) {
			$slug      = $module->feature::get_slug();
			$always_on = is_subclass_of( $module, 'Automattic\Jetpack_Boost\Contracts\Is_Always_On' );
			if ( $always_on ) {
				$is_on = true;
			} else {
				$is_on = $module->is_enabled();
			}

			$is_available = $module->is_available();
			$is_active    = $is_available && $is_on;

			$modules_state[ $slug ] = array(
				'active'    => $is_active,
				'available' => $is_available,
			);
		}

		return $modules_state;
	}

	public function set( $value ) {
//		foreach ( $value as $module_slug => $module_state ) {
//			$option_name = $this->get_module_option_name( $module_slug );
//			$updated     = update_option( $option_name, $module_state['active'] );
//
//			if ( $updated ) {
//				/**
//				 * Fires when a module is enabled or disabled.
//				 *
//				 * @param string $module The module slug.
//				 * @param bool   $status The new status.
//				 * @since 1.5.2
//				 */
//				do_action( 'jetpack_boost_module_status_updated', $module_slug, $module_state['active'] );
//			}
//		}
	}

}
