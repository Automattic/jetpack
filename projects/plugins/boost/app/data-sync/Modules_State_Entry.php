<?php

namespace Automattic\Jetpack_Boost\Data_Sync;

use Automattic\Jetpack\WP_JS_Data_Sync\Contracts\Entry_Can_Get;
use Automattic\Jetpack\WP_JS_Data_Sync\Contracts\Entry_Can_Merge;
use Automattic\Jetpack_Boost\Modules\Module;
use Automattic\Jetpack_Boost\Modules\Modules_Index;

class Modules_State_Entry implements Entry_Can_Get, Entry_Can_Merge {
	public function get( $_fallback = false ) {
		$state             = array();
		$modules_instances = $this->get_modules_instances();

		/*
		 * Module states are stored in their individual wp_options records.
		 * We're combining the states of all modules into a single record and attaching the availability of the module.
		 */
		foreach ( $modules_instances as $module ) {
			$slug      = $module->feature::get_slug();
			$always_on = is_subclass_of( $module, 'Automattic\Jetpack_Boost\Contracts\Is_Always_On' );
			if ( $always_on ) {
				$is_on = true;
			} else {
				$is_on = $module->is_enabled();
			}

			$is_available = $module->is_available();
			$is_active    = $is_available && $is_on;

			$state[ $slug ] = array(
				'active'    => $is_active,
				'available' => $is_available,
			);
		}

		return $state;
	}

	public function set( $value ) {
		$modules_instances = $this->get_modules_instances();

		foreach ( $value as $module_slug => $module_state ) {
			if ( ! isset( $modules_instances[ $module_slug ] ) ) {
				continue;
			}

			$updated = $modules_instances[ $module_slug ]->update( $module_state['active'] );
			if ( $updated ) {
				/**
				 * Fires when a module is enabled or disabled.
				 *
				 * @param string $module The module slug.
				 * @param bool   $status The new status.
				 * @since 1.5.2
				 */
				do_action( 'jetpack_boost_module_status_updated', $module_slug, $module_state['active'] );
			}
		}
	}

	public function merge( $value, $partial_value ) {
		return array_merge( $value, $partial_value );
	}

	private function get_modules_instances() {
		$modules = array();
		foreach ( Modules_Index::FEATURES as $module_name ) {
			$module_instance                                  = new Module( new $module_name() );
			$modules[ $module_instance->feature::get_slug() ] = $module_instance;
		}

		return $modules;
	}
}
