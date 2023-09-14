<?php

namespace Automattic\Jetpack_Boost\Lib;

use Automattic\Jetpack_Boost\Modules\Modules_Setup;
use Automattic\Jetpack_Boost\Modules\Optimizations\Cloud_CSS\Cloud_CSS;
use Automattic\Jetpack_Boost\Modules\Optimizations\Critical_CSS\Critical_CSS;

class Status {

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

	public function __construct( $slug ) {
		$this->slug = $slug;

		$this->status_sync_map = array(
			Cloud_CSS::get_slug() => array(
				Critical_CSS::get_slug(),
			),
		);
	}

	public function update( $new_status ) {
		$entry                          = jetpack_boost_ds_get( 'modules_state' );
		$entry[ $this->slug ]['active'] = $new_status;
		jetpack_boost_ds_set( 'modules_state', $entry );
	}

	public function is_enabled() {
		$modules_state = jetpack_boost_ds_get( 'modules_state' );
		return $modules_state[ $this->slug ]['active'];
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
	 * @param $new_status
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
