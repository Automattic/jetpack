<?php

namespace Automattic\Jetpack_Boost\Lib;

use Automattic\Jetpack_Boost\Features\Optimizations\Cloud_CSS\Cloud_CSS;
use Automattic\Jetpack_Boost\Features\Optimizations\Critical_CSS\Critical_CSS;

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

	public function is_enabled() {
		return '1' === get_option( $this->get_option_name( $this->slug ) );
	}

	public function update( $new_status ) {
		/**
		 * Fires before attempting to update the status of a module.
		 *
		 * @param string $slug Slug of the module.
		 * @param bool $new_status New status of the module.
		 */
		do_action( 'jetpack_boost_before_module_status_update', $this->slug, (bool) $new_status );

		if ( update_option( $this->get_option_name( $this->slug ), (bool) $new_status ) ) {
			$this->update_mapped_modules( $new_status );

			// Only record analytics event if the config update succeeds.
			$this->track_module_status( (bool) $new_status );

			/**
			 * Fires when a module is enabled or disabled.
			 *
			 * @param string $module The module slug.
			 * @param bool   $status The new status.
			 * @since 1.5.2
			 */
			do_action( 'jetpack_boost_module_status_updated', $this->slug, (bool) $new_status );

			return true;
		}
		return false;
	}

	protected function get_option_name( $module_slug ) {
		return 'jetpack_boost_status_' . $module_slug;
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

		foreach ( $this->status_sync_map[ $this->slug ] as $mapped_module ) {
			update_option( $this->get_option_name( $mapped_module ), (bool) $new_status );
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
