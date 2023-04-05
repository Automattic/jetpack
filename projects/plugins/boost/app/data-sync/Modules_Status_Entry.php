<?php

namespace Automattic\Jetpack_Boost\Data_Sync;

use Automattic\Jetpack\WP_JS_Data_Sync\Contracts\Entry_Can_Get;
use Automattic\Jetpack\WP_JS_Data_Sync\Contracts\Entry_Can_Merge;
use Automattic\Jetpack_Boost\Modules\Modules_Index;

class Modules_Status_Entry implements Entry_Can_Get, Entry_Can_Merge {
	private $key;

	private $option_key;

	private $namespace;

	public function __construct( $namespace, $key ) {
		$this->namespace  = $namespace;
		$this->key        = $key;
		$this->option_key = $this->namespace . '_' . $this->key;
	}

	public function get() {
		$option_value = get_option( $this->option_key );

		/*
		 * Module statuses are stored as a boolean record of whether the module is active.
		 * Example: [ 'lazy_images' => true, 'critical_css' => false ]
		 *
		 * While reading the value we are also attaching the availability of the module.
		 * Example: [ 'lazy_images' => [ 'active' => true, 'available' => true ], 'critical_css' => [ 'active' => false, 'available' => false ] ]
		 *
		 * So, we are adding the availability property to the value.
		 */
		$available_modules = ( new Modules_Index() )->available_modules();
		foreach ( $option_value as $module_slug => $status ) {
			$option_value[ $module_slug ] = array(
				'active'    => $status,
				'available' => isset( $available_modules[ $module_slug ] ),
			);
		}

		return $option_value;
	}

	public function set( $value ) {
		/*
		 * Module statuses have two properties: active and available. But, we only want to store the active status.
		 * Example:
		 * The value received by svelte client: [ 'lazy_images' => [ 'active' => true, 'available' => true ], 'critical_css' => [ 'active' => false, 'available' => false ] ]
		 * The value stored in the database: [ 'lazy_images' => true, 'critical_css' => false ]
		 *
		 * So, we are stripping the availability property from the value before saving it.
		 */
		$value = wp_list_pluck( $value, 'active' );

		update_option( $this->option_key, $value );
	}

	public function merge( $value, $partial_value ) {
		return array_merge( $value, $partial_value );
	}
}
