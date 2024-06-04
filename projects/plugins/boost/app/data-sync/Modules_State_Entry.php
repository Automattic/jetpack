<?php

namespace Automattic\Jetpack_Boost\Data_Sync;

use Automattic\Jetpack\WP_JS_Data_Sync\Contracts\Entry_Can_Get;
use Automattic\Jetpack\WP_JS_Data_Sync\Contracts\Entry_Can_Merge;
use Automattic\Jetpack_Boost\Modules\Module;

class Modules_State_Entry implements Entry_Can_Get, Entry_Can_Merge {

	protected $modules = array();

	public function __construct( $features ) {
		foreach ( $features as $feature ) {
			$instance                               = new Module( new $feature() );
			$this->modules[ $instance->get_slug() ] = $instance;
		}
	}

	public function get( $_fallback = false ) {
		$state = array();

		/*
		 * Module states are stored in their individual wp_options records.
		 * We're combining the states of all modules into a single record and attaching the availability of the module.
		 */
		foreach ( $this->modules as $module ) {
			$state[ $module->get_slug() ] = array(
				'active'    => $module->is_available() && $module->is_enabled(),
				'available' => $module->is_available(),
			);
		}

		return $state;
	}

	public function set( $value ) {
		foreach ( $value as $module_slug => $module_state ) {
			if ( ! isset( $this->modules[ $module_slug ] ) ) {
				continue;
			}

			$updated = $this->modules[ $module_slug ]->update( $module_state['active'] );
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
}
