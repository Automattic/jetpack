<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

namespace Automattic\Jetpack\Sync;

use WorDBless\BaseTestCase;

/**
 * Unit tests for the Data_Settings class.
 *
 * @package automattic/jetpack-sync
 */
class Test_Data_Settings extends BaseTestCase {

	/**
	 * Test the set_sync_data_filters method.
	 */
	public function test_set_sync_data_filters() {
		$expected_filters = array(
			'jetpack_sync_modules',
			'jetpack_sync_options_whitelist',
			'jetpack_sync_options_contentless',
			'jetpack_sync_constants_whitelist',
			'jetpack_sync_callable_whitelist',
			'jetpack_sync_multisite_callable_whitelist',
			'jetpack_sync_post_meta_whitelist',
			'jetpack_sync_comment_meta_whitelist',
			'jetpack_sync_capabilities_whitelist',
			'jetpack_sync_known_importers',
		);
		$filter_priority  = 10;

		$data_settings = new Data_Settings();
		$data_settings->add_settings_list( array() );
		$data_settings->set_sync_data_filters();

		foreach ( $expected_filters as $filter ) {
			$this->assertSame( $filter_priority, has_filter( $filter, array( $data_settings, 'add_sync_data_settings' ) ) );
		}
	}

	/**
	 * Test the empty_data_settings method.
	 */
	public function test_empty_data_settings() {
		$data_settings = new Data_Settings();
		// Setting the default values.
		$data_settings->add_settings_list( array() );
		$this->assertNotEmpty( $data_settings->get_data_settings() );

		$data_settings->empty_data_settings();
		$this->assertEmpty( $data_settings->get_data_settings() );
	}
}
