<?php
namespace Automattic\Jetpack_Boost\Contracts;

use Automattic\Jetpack\WP_JS_Data_Sync\Data_Sync;

interface Has_Data_Sync {
	/**
	 * Registers data sync for a modules that is wrapping a Feature within Features_Index.
	 *
	 * @param Data_Sync $instance The data sync instance.
	 *
	 * @return void
	 */
	public function register_data_sync( Data_Sync $instance );
}
