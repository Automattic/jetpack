<?php // phpcs:ignore WordPress.Files.FileName
/**
 * Class Jetpack_Sync_Test_Helper
 *
 * Provides utilities and hooks needed for testing
 */
class Jetpack_Sync_Test_Helper {
	public $array_override;

	public function filter_override_array() {
		return $this->array_override;
	}
}
