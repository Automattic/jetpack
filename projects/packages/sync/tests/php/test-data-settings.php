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
	 * An instance of the Data_Settings class.
	 *
	 * @var Data_Settings
	 */
	private $data_settings;

	/**
	 * Set up before each test.
	 *
	 * @before
	 */
	public function set_up() {
		$this->data_settings = new Data_Settings();
	}

	/**
	 * Tear down after each test.
	 *
	 * @after
	 */
	public function tear_down() {
		( new Data_Settings() )->empty_data_settings_and_hooks();
	}

	/**
	 * Test the add_settings_list method with various values for the 'jetpack_sync_modules' key.
	 *
	 * All of the provided test inputs have the same expectations:
	 *     - This should set up the default settings.
	 *     - Since the default values are used, required sync data settings should not be added.
	 *     - Since the default values are used, the data filter hooks should not be set up.
	 *
	 * @param array $settings The test data settings.
	 *
	 * @dataProvider data_provider_test_add_settings_list_default_inputs
	 */
	public function test_add_settings_list_modules_inputs( $settings ) {
		$this->data_settings->add_settings_list( $settings );

		$result = $this->data_settings->get_data_settings();
		$this->sort_settings_array( $result );

		$expected = $this->get_all_defaults();
		$this->sort_settings_array( $expected );

		$this->assertSame( $expected, $result );
		if ( ! is_array( $settings ) ) {
			$this->assertSame( 0, did_action( 'jetpack_sync_add_required_data_settings' ) );
		}

		foreach ( array_keys( $this->get_all_defaults() ) as $key ) {
			$this->assertFalse( has_action( $key ) );
		}
	}

	/**
	 * Data provider for test_add_settings_default_inputs.
	 *
	 * @return array The test data.
	 */
	public function data_provider_test_add_settings_list_default_inputs() {
		return array(
			'null'            => array( null ),
			'string'          => array( 'test' ),
			'integer'         => array( 1 ),
			'modules null'    => array(
				array( 'jetpack_sync_modules' => null ),
			),
			'modules string'  => array(
				array( 'jetpack_sync_modules' => 'test' ),
			),
			'modules integer' => array(
				array( 'jetpack_sync_modules' => 1 ),
			),
		);
	}

	/**
	 * Test the add_settings_list method with various one-input scenarios.
	 *     - Since custom inputs are provided, the required sync data settings should be added
	 *       and the jetpack_sync_required_data_settings action should be triggered.
	 *
	 * @param array $test_data The test data.
	 *
	 * @dataProvider data_provider_test_add_settings_list_with_one_input
	 */
	public function test_add_settings_list_with_one_input( $test_data ) {
		$this->data_settings->add_settings_list( $test_data['input'] );

		$result = $this->data_settings->get_data_settings();
		$this->sort_settings_array( $result );

		$this->sort_settings_array( $test_data['output'] );

		$this->assertSame( $test_data['output'], $result );
		$this->assertSame( 1, did_action( 'jetpack_sync_add_required_data_settings' ) );

		// Check that the correct filters were set (and not set).
		foreach ( array_keys( $this->get_all_defaults() ) as $key ) {
			if ( ! in_array( $key, $test_data['set_filters'], true ) ) {
				$this->assertFalse( has_action( $key ), 'The ' . $key . ' filter should not be set.' );
			} else {
				$this->assertTrue( has_filter( $key ), 'The ' . $key . ' filter should be set.' );
			}
		}
	}

	/**
	 * Data provider for test_add_settings_list_with_one_input
	 *
	 * @return array The test data.
	 */
	public function data_provider_test_add_settings_list_with_one_input() {
		return array(
			'some modules, no filters set'                 => array(
				Data_Test_Data_Settings::data_test_1(),
			),
			'some modules, no filters set 2'               => array(
				Data_Test_Data_Settings::data_test_1_2(),
			),
			'some modules, some filters set'               => array(
				Data_Test_Data_Settings::data_test_2(),
			),
			'some modules, set filter for disabled module' => array(
				Data_Test_Data_Settings::data_test_3(),
			),
			'some modules, add extra item to filter'       => array(
				Data_Test_Data_Settings::data_test_4(),
			),
			'some modules, invalid item for indexed filter' => array(
				Data_Test_Data_Settings::data_test_5(),
			),
			'some modules, invalid item for associative filter' => array(
				Data_Test_Data_Settings::data_test_6(),
			),
			'some modules, empty array for a filter'       => array(
				Data_Test_Data_Settings::data_test_7(),
			),
			'no modules, empty array for a filter'         => array(
				Data_Test_Data_Settings::data_test_7_1(),
			),
			'empty modules, empty array for a filter'      => array(
				Data_Test_Data_Settings::data_test_7_2(),
			),
		);
	}

	/**
	 * Test the add_settings_list method with various two-input scenarios.
	 *     - Since custom inputs are provided, the required sync data settings should be added
	 *       and the jetpack_sync_required_data_settings action should be triggered.
	 *
	 * @param array $test_data The test data.
	 *
	 * @dataProvider data_provider_test_add_settings_list_with_two_inputs
	 */
	public function test_add_settings_list_with_two_inputs( $test_data ) {
		$this->data_settings->add_settings_list( $test_data['input_1'] );
		$this->data_settings->add_settings_list( $test_data['input_2'] );

		$this->sort_settings_array( $test_data['output'] );

		$result = $this->data_settings->get_data_settings();
		$this->sort_settings_array( $result );

		$this->assertSame( $test_data['output'], $result );
		$this->assertSame( 1, did_action( 'jetpack_sync_add_required_data_settings' ) );

		// Check that the correct filters were set (and not set).
		foreach ( array_keys( $this->get_all_defaults() ) as $key ) {
			if ( ! in_array( $key, $test_data['set_filters'], true ) ) {
				$this->assertFalse( has_action( $key ), 'The ' . $key . ' filter should not be set.' );
			} else {
				$this->assertTrue( has_filter( $key ), 'The ' . $key . ' filter should be set.' );
			}
		}
	}

	/**
	 * Data provider for test_add_settings_list_with_two_inputs
	 *
	 * @return array The test data.
	 */
	public function data_provider_test_add_settings_list_with_two_inputs() {
		return array(
			'first input uses custom filters, second uses defaults' => array(
				Data_Test_Data_Settings::data_test_8(),
			),
			'first input uses defaults, second uses custom filters' => array(
				Data_Test_Data_Settings::data_test_9(),
			),
			'first input uses custom filters for must-sync module, second uses defaults' => array(
				Data_Test_Data_Settings::data_test_9_2(),
			),
			'both inputs use custom filters' => array(
				Data_Test_Data_Settings::data_test_10(),
			),
		);
	}

	/**
	 * Test the empty_data_settings method.
	 */
	public function test_empty_data_settings() {
		// Setting the default values.
		$this->data_settings->add_settings_list( array() );
		$this->assertNotEmpty( $this->data_settings->get_data_settings() );

		$this->data_settings->empty_data_settings_and_hooks();
		$this->assertEmpty( $this->data_settings->get_data_settings() );
	}

	/**
	 * Sorts the provided setting array which contains the modules and filter settings.
	 *
	 * @param array $settings The settings array which will be sorted.
	 */
	public function sort_settings_array( &$settings ) {
		ksort( $settings );

		foreach ( $settings as $filter => $data ) {
			$this->sort_filter_array( $data );
			$settings[ $filter ] = $data;
		}
	}

	/**
	 * Sorts the provided filter array.
	 *
	 * @param array $data The filter array that will be sorted.
	 */
	private function sort_filter_array( &$data ) {
		if ( isset( $data[0] ) ) {
			sort( $data );
		} else {
			ksort( $data );
		}
	}

	/**
	 * Returns an array containing the default settings for all of the filters.
	 *
	 * @return array An array containing the default settings for all of the filters.
	 */
	public function get_all_defaults() {
		return array(
			'jetpack_sync_modules'                      => \Automattic\Jetpack\Sync\Modules::DEFAULT_SYNC_MODULES,
			'jetpack_sync_options_whitelist'            => \Automattic\Jetpack\Sync\Defaults::$default_options_whitelist,
			'jetpack_sync_options_contentless'          => \Automattic\Jetpack\Sync\Defaults::$default_options_contentless,
			'jetpack_sync_constants_whitelist'          => \Automattic\Jetpack\Sync\Defaults::$default_constants_whitelist,
			'jetpack_sync_callable_whitelist'           => \Automattic\Jetpack\Sync\Defaults::$default_callable_whitelist,
			'jetpack_sync_multisite_callable_whitelist' => \Automattic\Jetpack\Sync\Defaults::$default_multisite_callable_whitelist,
			'jetpack_sync_post_meta_whitelist'          => \Automattic\Jetpack\Sync\Defaults::$post_meta_whitelist,
			'jetpack_sync_comment_meta_whitelist'       => \Automattic\Jetpack\Sync\Defaults::$comment_meta_whitelist,
			'jetpack_sync_capabilities_whitelist'       => \Automattic\Jetpack\Sync\Defaults::$default_capabilities_whitelist,
			'jetpack_sync_known_importers'              => \Automattic\Jetpack\Sync\Defaults::$default_known_importers,
		);
	}
}
