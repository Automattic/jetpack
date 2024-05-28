<?php

namespace Automattic\Jetpack_Boost\Data_Sync;

use Automattic\Jetpack\WP_JS_Data_Sync\Contracts\Entry_Can_Get;
use Automattic\Jetpack\WP_JS_Data_Sync\Contracts\Entry_Can_Merge;
use Automattic\Jetpack_Boost\Modules\Modules_Index;

class Modules_State_Entry implements Entry_Can_Get, Entry_Can_Merge {
	public function get( $_fallback = false ) {
		$features = Modules_Index::MODULES;

		$modules_state     = array();
		$available_modules = ( new Modules_Index() )->available_modules();

		/*
		 * Module states are stored in their individual wp_options records.
		 * We combining the states of all modules into a single record and attaching the availability of the module.
		 */
		foreach ( $features as $feature ) {
			$slug      = $feature::get_slug();
			$always_on = is_subclass_of( $feature, 'Automattic\Jetpack_Boost\Contracts\Is_Always_On' );

			if ( $always_on ) {
				$is_on = true;
			} else {
				$option_name = $this->get_module_option_name( $slug );
				$is_on       = (bool) get_option( $option_name, false );
			}

			$is_available = isset( $available_modules[ $slug ] );
			$is_active    = $is_available && $is_on;

			// if is submodule, check parent state first

			$modules_state[ $slug ] = array(
				'active'    => $is_active,
				'available' => $is_available,
			);

			// $module = new Module( new $feature() );
			// if ( $module->feature instanceof Has_Submodules ) {
			// $modules_state = array_merge( $modules_state, $this->get_submodules_state( $module->feature->get_submodules() ) );
			// }
		}
		var_dump( $modules_state );
		exit;

		return $modules_state;
	}

	private function get_submodules_state( $features ) {
		$state = array();

		foreach ( $features as $feature ) {
			$slug      = $feature::get_slug();
			$always_on = is_subclass_of( $feature, 'Automattic\Jetpack_Boost\Contracts\Is_Always_On' );

			$module = new $feature();
			if ( $always_on ) {
				$is_on = true;
			} else {
				$is_on = (bool) $module->get_state();
			}

			$state[ $slug ] = array(
				'active'    => $is_on,
				'available' => true,
			);
		}

		return $state;
	}

	public function set( $value ) {
		foreach ( $value as $module_slug => $module_state ) {
			$option_name = $this->get_module_option_name( $module_slug );
			$updated     = update_option( $option_name, $module_state['active'] );

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

	private function get_module_option_name( $module_slug ) {
		return 'jetpack_boost_status_' . str_replace( '_', '-', $module_slug );
	}
}
