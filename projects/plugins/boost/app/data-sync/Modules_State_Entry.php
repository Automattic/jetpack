<?php

namespace Automattic\Jetpack_Boost\Data_Sync;

use Automattic\Jetpack\WP_JS_Data_Sync\Contracts\Entry_Can_Get;
use Automattic\Jetpack\WP_JS_Data_Sync\Contracts\Entry_Can_Merge;
use Automattic\Jetpack_Boost\Modules\Modules_Index;

class Modules_State_Entry implements Entry_Can_Get, Entry_Can_Merge {
	public function get() {
		$modules = Modules_Index::MODULES;

		$modules_state     = array();
		$available_modules = ( new Modules_Index() )->available_modules();

		/*
		 * Module states are stored in their individual wp_options records.
		 * We combining the states of all modules into a single record and attaching the availability of the module.
		 */
		foreach ( $modules as $module ) {
			$slug        = $module::get_slug();
			$option_name = $this->get_module_option_name( $slug );

			$modules_state[ $slug ] = array(
				'active'    => isset( $available_modules[ $slug ] ) && get_option( $option_name, false ),
				'available' => isset( $available_modules[ $slug ] ),
			);
		}

		return $modules_state;
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
