<?php

namespace Automattic\Jetpack_Boost\Lib;

use Automattic\Jetpack\WP_JS_Data_Sync\Contracts\Entry_Can_Get;
use Automattic\Jetpack\WP_JS_Data_Sync\Contracts\Entry_Can_Set;
use Automattic\Jetpack_Boost\Contracts\Pluggable;
use Automattic\Jetpack_Boost\Modules\Modules_Setup;
use Automattic\Jetpack_Boost\Modules\Optimizations\Cloud_CSS\Cloud_CSS;
use Automattic\Jetpack_Boost\Modules\Optimizations\Critical_CSS\Critical_CSS;

class Status implements Entry_Can_Get, Entry_Can_Set {

	/**
	 * Slug of the optimization module which is currently being toggled
	 *
	 * @var string $slug
	 */
	protected $slug;

	/**
	 * A map of modules whose status are synced.
	 *
	 * @var array[] $status_sync_map
	 */
	protected $status_sync_map;

	/**
	 * @var Pluggable $feature
	 */
	protected $feature;

	/**
	 * @var string $option_name
	 */
	protected $option_name;

	public function __construct( $feature ) {
		$this->feature     = $feature;
		$this->slug        = $feature::get_slug();
		$module_slug       = str_replace( '_', '-', $this->slug );
		$this->option_name = 'jetpack_boost_status_' . $module_slug;

		$this->status_sync_map = array(
			Cloud_CSS::class => array(
				Critical_CSS::class,
			),
		);
	}

	public function get( $_fallback = false ) {
		$always_on = is_subclass_of( $this->feature, 'Automattic\Jetpack_Boost\Contracts\Is_Always_On' );
		if ( $always_on ) {
			return true;
		}

		return get_option( $this->option_name, false );
	}

	public function set( $value ) {
		return $this->update( $value );
	}

	public function update( $new_status ) {
		$this->on_update( $new_status );
		return update_option( $this->option_name, $new_status );
	}

	public function is_enabled() {
		return get_option( $this->option_name, false );
	}

	public function is_available() {
		return $this->feature::is_available();
	}

	/**
	 * Called when the module is toggled.
	 *
	 * Called by Modules and triggered by the `jetpack_ds_set` action.
	 */
	public function on_update( $new_status ) {
		$this->update_mapped_modules( $new_status );
		$this->track_module_status( (bool) $new_status );
	}

	/**
	 * Update modules which are to follow the status of the current module.
	 *
	 * For example: critical-css module status should be synced with cloud-css module.
	 *
	 * @param mixed $new_status
	 * @return void
	 */
	protected function update_mapped_modules( $new_status ) {
		if ( ! isset( $this->status_sync_map[ $this->slug ] ) ) {
			return;
		}

		$modules_instance = Setup::get_instance_of( Modules_Setup::class );

		// The moduleInstance will be there. But check just in case.
		if ( $modules_instance !== null ) {
			// Remove the action temporarily to avoid infinite loop.
			remove_action( 'jetpack_boost_module_status_updated', array( $modules_instance, 'on_module_status_update' ) );
		}

		foreach ( $this->status_sync_map[ $this->slug ] as $mapped_module ) {
			$mapped_status = new Status( $mapped_module );
			$mapped_status->update( $new_status );
		}

		// The moduleInstance will be there. But check just in case.
		if ( $modules_instance !== null ) {
			add_action( 'jetpack_boost_module_status_updated', array( $modules_instance, 'on_module_status_update' ), 10, 2 );
		}
	}

	protected function track_module_status( $status ) {
		Analytics::record_user_event(
			'set_module_status',
			array(
				'module' => $this->slug,
				'status' => $status,
			)
		);
	}
}
