<?php //phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

/**
 * Tests the Identity_Crisis package.
 *
 * @package automattic/jetpack-identity-crisis
 */

namespace Automattic\Jetpack;

use Jetpack_Options;
use WorDBless\BaseTestCase;

/**
 * Test Identity_Crisis class
 */
class Test_Identity_Crisis extends BaseTestCase {
	/**
	 * Set up tests.
	 *
	 * @before
	 */
	public function set_up() {
		Constants::set_constant( 'JETPACK_DISABLE_RAW_OPTIONS', true );
	}

	/**
	 * Tear down tests.
	 *
	 * @after
	 */
	public function tear_down() {
		Constants::clear_constants();

		// Reset IDC singleton.
		$idc        = Identity_Crisis::init();
		$reflection = new \ReflectionClass( $idc );
		$instance   = $reflection->getProperty( 'instance' );

		$instance->setAccessible( true );
		$instance->setValue( null, null );
		$instance->setAccessible( false );
	}

	/**
	 * Test that clear_all_idc_options resets Options.
	 */
	public function test_clear_all_idc_options_clears_expected() {
		$options = array(
			'sync_error_idc',
			'safe_mode_confirmed',
			'migrate_for_idc',
		);

		foreach ( $options as $option ) {
			Jetpack_Options::update_option( $option, true );
		}

		Identity_Crisis::clear_all_idc_options();

		foreach ( $options as $option ) {
			$this->assertFalse( Jetpack_Options::get_option( $option ) );
		}
	}

	/**
	 * Test jetpack_connection_disconnect_site_wpcom_filter.
	 */
	public function test_jetpack_connection_disconnect_site_wpcom_filter() {
		Identity_Crisis::init();

		// No IDC.
		$this->assertTrue(
			apply_filters( 'jetpack_connection_disconnect_site_wpcom', false ),
			'IDC should not block the site from disconnecting on WPCOM.'
		);

		// Mock IDC.
		add_filter( 'jetpack_sync_error_idc_validation', '__return_true' );

		$this->assertFalse(
			apply_filters( 'jetpack_connection_disconnect_site_wpcom', true ),
			'IDC should block the site from disconnecting on WPCOM.'
		);

		// Clean up.
		remove_filter( 'jetpack_sync_error_idc_validation', '__return_true' );
	}

	/**
	 * Test the should_handle_idc default value.
	 */
	public function test_should_handle_idc_default() {
		if ( is_multisite() ) {
			$this->assertFalse( Identity_Crisis::should_handle_idc() );
		} else {
			$this->assertTrue( Identity_Crisis::should_handle_idc() );
		}
	}

	/**
	 * Test that the jetpack_should_handle_idc filter casts values to a bool.
	 */
	public function test_jetpack_should_handle_idc_casts_to_bool() {
		add_filter( 'jetpack_should_handle_idc', array( $this, 'return_string_1' ) );
		$result = Identity_Crisis::should_handle_idc();
		remove_filter( 'jetpack_should_handle_idc', array( $this, 'return_string_1' ) );

		$this->assertTrue( $result );
	}

	/**
	 * Test that should_handle_idc returns true when the JETPACK_SHOULD_HANDLE_IDC constant is true.
	 */
	public function test_should_handle_idc_true_when_constant_true() {
		Constants::set_constant( 'JETPACK_SHOULD_HANDLE_IDC', true );
		$this->assertTrue( Identity_Crisis::should_handle_idc() );
	}

	/**
	 * Test that should_handle_idc returns false when the JETPACK_SHOULD_HANDLE_IDC constant is false.
	 */
	public function test_should_handle_idc_false_when_constant_false() {
		Constants::set_constant( 'JETPACK_SHOULD_HANDLE_IDC', false );
		$this->assertFalse( Identity_Crisis::should_handle_idc() );
	}

	/**
	 * Test that the jetpack_should_handle_idc filter overrides the JETPACK_SHOULD_HANDLE_IDC constant.
	 */
	public function test_jetpack_should_handle_idc_filter_overrides_constant() {
		Constants::set_constant( 'JETPACK_SHOULD_HANDLE_IDC', true );
		add_filter( 'jetpack_should_handle_idc', '__return_false' );
		$result = Identity_Crisis::should_handle_idc();
		remove_filter( 'jetpack_should_handle_idc', '__return_false' );

		$this->assertFalse( $result );
	}

	/**
	 * Test that should_handle_idc returns true when the legacy JETPACK_SYNC_IDC_OPTIN constant is true.
	 */
	public function test_should_handle_idc_true_when_legacy_constant_true() {
		Constants::set_constant( 'JETPACK_SYNC_IDC_OPTIN', true );
		$this->assertTrue( Identity_Crisis::should_handle_idc() );
	}

	/**
	 * Test that should_handle_idc returns false when the legacy JETPACK_SYNC_IDC_OPTIN constant is false.
	 */
	public function test_should_handle_idc_false_when_legacy_constant_false() {
		Constants::set_constant( 'JETPACK_SYNC_IDC_OPTIN', false );
		$this->assertFalse( Identity_Crisis::should_handle_idc() );
	}

	/**
	 * Test that the legacy jetpack_sync_idc_optin filter is used by should_handle_idc.
	 */
	public function test_should_handle_idc_uses_legacy_filter() {
		add_filter( 'jetpack_sync_idc_optin', '__return_false' );
		$result = Identity_Crisis::should_handle_idc();
		remove_filter( 'jetpack_sync_idc_optin', '__return_false' );

		$this->assertFalse( $result );
	}

	/**
	 * Test that current JETPACK_SHOULD_HANDLE_IDC constant overrides the legacy JETPACK_SYNC_IDC_OPTIN constant.
	 */
	public function test_should_handle_idc_current_constant_overrides_legacy_constant() {
		Constants::set_constant( 'JETPACK_SHOULD_HANDLE_IDC', true );
		Constants::set_constant( 'JETPACK_SYNC_IDC_OPTIN', false );
		$this->assertTrue( Identity_Crisis::should_handle_idc() );
	}

	/**
	 * Test that validate_sync_error_idc_option returns false if the sync_error_idc error doesn't exist.
	 */
	public function test_sync_error_idc_validation_returns_false_if_no_option() {
		Jetpack_Options::delete_option( 'sync_error_idc' );
		$this->assertFalse( Identity_Crisis::validate_sync_error_idc_option() );
	}

	/**
	 * Test that validate_sync_error_idc_option returns true when the value of sync_error_idc option
	 * matches the expected value.
	 */
	public function test_sync_error_idc_validation_returns_true_when_option_matches_expected() {
		add_filter( 'jetpack_should_handle_idc', '__return_true' );
		Jetpack_Options::update_option( 'sync_error_idc', Identity_Crisis::get_sync_error_idc_option() );

		$result = Identity_Crisis::validate_sync_error_idc_option();

		Jetpack_Options::delete_option( 'sync_error_idc' );
		remove_filter( 'jetpack_should_handle_idc', '__return_true' );

		$this->assertTrue( $result );
	}

	/**
	 * Verify that validate_sync_error returns false if wpcom_ is set and matches expected.
	 */
	public function test_sync_error_idc_validation_returns_false_when_wpcom_option_matches_expected() {
		add_filter( 'jetpack_should_handle_idc', '__return_true' );

		$option                  = Identity_Crisis::get_sync_error_idc_option();
		$option['wpcom_home']    = $option['home'];
		$option['wpcom_siteurl'] = $option['siteurl'];
		Jetpack_Options::update_option( 'sync_error_idc', $option );

		$validation_result = Identity_Crisis::validate_sync_error_idc_option();

		// Verify the migrate_for_idc is set.
		$option_result = Jetpack_Options::get_option( 'migrate_for_idc' );

		Jetpack_Options::delete_option( 'sync_error_idc' );
		Jetpack_Options::delete_option( 'migrate_for_idc' );
		remove_filter( 'jetpack_should_handle_idc', '__return_true' );

		$this->assertFalse( $validation_result );
		$this->assertTrue( $option_result );
	}

	/**
	 * Verify that validate_sync_error returns true if wpcom_ is set and does not match.
	 */
	public function test_sync_error_idc_validation_returns_true_when_wpcom_option_does_not_match_expected() {
		add_filter( 'jetpack_should_handle_idc', '__return_true' );

		$option                  = Identity_Crisis::get_sync_error_idc_option();
		$option['wpcom_home']    = $option['home'];
		$option['wpcom_siteurl'] = 'coolrunnings.test';
		Jetpack_Options::update_option( 'sync_error_idc', $option );

		$validation_result = Identity_Crisis::validate_sync_error_idc_option();

		// Verify the migrate_for_idc is not set.
		$option_result = Jetpack_Options::get_option( 'migrate_for_idc' );

		Jetpack_Options::delete_option( 'sync_error_idc' );
		Jetpack_Options::delete_option( 'migrate_for_idc' );
		remove_filter( 'jetpack_should_handle_idc', '__return_true' );

		$this->assertTrue( $validation_result );
		$this->assertNotTrue( $option_result );
	}

	/**
	 * Test that the sync_error_idc option is cleaned up when validation fails.
	 */
	public function test_sync_error_idc_validation_cleans_up_when_validation_fails() {
		Jetpack_Options::update_option(
			'sync_error_idc',
			array(
				'home'    => 'coolsite.com/',
				'siteurl' => 'coolsite.com/wp/',
			)
		);

		$this->assertFalse( Identity_Crisis::validate_sync_error_idc_option() );
		$this->assertFalse( Jetpack_Options::get_option( 'sync_error_idc' ) );
	}

	/**
	 * Test that the sync_error_idc option is cleaned up when part of the validation fails.
	 */
	public function test_sync_error_idc_validation_cleans_up_when_part_of_validation_fails() {
		$test            = Identity_Crisis::get_sync_error_idc_option();
		$test['siteurl'] = 'coolsite.com/wp/';
		Jetpack_Options::update_option( 'sync_error_idc', $test );

		$this->assertFalse( Identity_Crisis::validate_sync_error_idc_option() );
		$this->assertFalse( Jetpack_Options::get_option( 'sync_error_idc' ) );
	}

	/**
	 * Test the validate_sync_error_idc_option returns false and the sync_error_idc option is cleaned up
	 * when the JETPACK_SHOULD_HANDLE_IDC constant is false.
	 */
	public function test_sync_error_idc_validation_returns_false_and_cleans_up_when_opted_out() {
		Jetpack_Options::update_option( 'sync_error_idc', Identity_Crisis::get_sync_error_idc_option() );
		Constants::set_constant( 'JETPACK_SHOULD_HANDLE_IDC', false );

		$this->assertFalse( Identity_Crisis::validate_sync_error_idc_option() );
		$this->assertFalse( Jetpack_Options::get_option( 'sync_error_idc' ) );
	}

	/**
	 * Test that Status::is_staging_site returns true when sync_error_idc is valid.
	 */
	public function test_is_staging_site_true_when_sync_error_idc_is_valid() {
		add_filter( 'jetpack_sync_error_idc_validation', '__return_true' );
		$result = ( new Status() )->is_staging_site();
		remove_filter( 'jetpack_sync_error_idc_validation', '__return_false' );

		$this->assertTrue( $result );
	}

	/**
	 * Test that get_sync_error_idc_option sanitizes out www and the protocol.
	 */
	public function test_get_sync_idc_option_sanitizes_out_www_and_protocol() {
		$original_home    = get_option( 'home' );
		$original_siteurl = get_option( 'siteurl' );

		update_option( 'home', 'http://www.coolsite.com' );
		update_option( 'siteurl', 'http://www.coolsite.com/wp' );

		$expected = array(
			'home'    => 'coolsite.com/',
			'siteurl' => 'coolsite.com/wp/',
		);

		$result = Identity_Crisis::get_sync_error_idc_option();

		// Cleanup.
		update_option( 'home', $original_home );
		update_option( 'siteurl', $original_siteurl );

		$this->assertSame( $expected, $result );
	}

	/**
	 * Test that get_sync_error_idc_option santizes out the protocol when there is an ip address
	 * in the option.
	 */
	public function test_get_sync_idc_option_with_ip_address_in_option() {
		$original_home    = get_option( 'home' );
		$original_siteurl = get_option( 'siteurl' );

		update_option( 'home', 'http://72.182.131.109/~wordpress' );
		update_option( 'siteurl', 'http://72.182.131.109/~wordpress/wp' );

		$expected = array(
			'home'    => '72.182.131.109/~wordpress/',
			'siteurl' => '72.182.131.109/~wordpress/wp/',
		);

		$result = Identity_Crisis::get_sync_error_idc_option();

		// Cleanup.
		update_option( 'home', $original_home );
		update_option( 'siteurl', $original_siteurl );

		$this->assertSame( $expected, $result );
	}

	/**
	 * Test the check_response_for_idc method when the response does not contain an error code.
	 *
	 * @param mixed $input  The input to the check_response_for_idc method.
	 *
	 * @dataProvider data_provider_test_check_response_for_idc_no_error_code
	 */
	public function test_check_response_for_idc_no_error_code( $input ) {
		// Delete option before each test.
		Jetpack_Options::delete_option( 'sync_error_idc' );

		$result = Identity_Crisis::init()->check_response_for_idc( $input );
		$option = Jetpack_Options::get_option( 'sync_error_idc' );
		$this->assertFalse( $result );
		$this->assertFalse( $option );
	}

	/**
	 * Data provider for test_check_response_for_idc_no_error_code.
	 *
	 * @return array The test data.
	 */
	public function data_provider_test_check_response_for_idc_no_error_code() {
		return array(
			'input is null'               => array( null ),
			'input is empty array'        => array( array() ),
			'input is a string'           => array( 'test' ),
			'input is with no error code' => array(
				array(
					'request_siteurl' => 'example.org/test',
					'request_home'    => 'example.org/test',
					'wpcom_siteurl'   => 'example.com',
					'wpcom_home'      => 'example.com',
				),
			),
		);
	}

	/**
	 * Test the check_response_for_idc method when the response does contain an error code.
	 *
	 * @param mixed $input         The input to the check_response_for_idc method.
	 * @param bool  $option_updated Whether the check_response_for_idc method should update the
	 *                              sync_error_idc option.
	 *
	 * @dataProvider data_provider_test_check_response_for_idc_with_error_code
	 */
	public function test_check_response_for_idc_with_error_code( $input, $option_updated ) {
		// Delete option before each test.
		Jetpack_Options::delete_option( 'sync_error_idc' );

		if ( $option_updated ) {
			$expected_option = array_merge(
				// WorDBless sets the siteurl and home options to example.org.
				array(
					'home'    => 'example.org/',
					'siteurl' => 'example.org/',
				),
				$input
			);
		} else {
			$expected_option = false;
		}

		$result = Identity_Crisis::init()->check_response_for_idc( $input );
		$option = Jetpack_Options::get_option( 'sync_error_idc' );

		$this->assertTrue( $result );
		$this->assertSame( $expected_option, $option );
	}

	/**
	 * Data provider for test_check_response_for_idc_with_error_code
	 *
	 * @return The test data with the structure:
	 *    'input'           => The input for the check_response_for_idc method.
	 *     'option_updated' => Whether the check_response_for_idc method should update
	 *                         the sync_error_idc option.
	 */
	public function data_provider_test_check_response_for_idc_with_error_code() {
		return array(
			'input has non-matching error code'     => array(
				'input'          => array(
					'error_code'      => 'not an idc error code',
					'request_siteurl' => 'example.org/',
					'request_home'    => 'example.org/',
					'wpcom_siteurl'   => 'example.com/',
					'wpcom_home'      => 'example.com/',
				),
				'option_updated' => false,
			),
			'input has url mismatch error code'     => array(
				'input'          => array(
					'error_code'      => 'jetpack_url_mismatch',
					'request_siteurl' => 'example.org/',
					'request_home'    => 'example.org/',
					'wpcom_siteurl'   => 'example.com/',
					'wpcom_home'      => 'example.com/',
				),
				'option_updated' => true,
			),
			'input has home mismatch error code'    => array(
				'input'          => array(
					'error_code'      => 'jetpack_home_url_mismatch',
					'request_siteurl' => 'example.org/',
					'request_home'    => 'example.org/',
					'wpcom_siteurl'   => 'example.org/',
					'wpcom_home'      => 'example.com/',
				),
				'option_updated' => true,
			),
			'input has siteurl mismatch error code' => array(
				'input'          => array(
					'error_code'      => 'jetpack_site_url_mismatch',
					'request_siteurl' => 'example.org/',
					'request_home'    => 'example.org/',
					'wpcom_siteurl'   => 'example.com/',
					'wpcom_home'      => 'example.org/',
				),
				'option_updated' => true,
			),
		);
	}

	/**
	 * Test the check_http_response_for_idc_detected method with invalid inputs. These inputs should
	 * cause the method to return false.
	 *
	 * @param mixed $input The input value.
	 *
	 * @dataProvider data_provider_test_check_http_response_for_idc_detected_invalid_input
	 */
	public function test_check_http_response_for_idc_detected_invalid_input( $input ) {
		$this->assertFalse( Identity_Crisis::init()->check_http_response_for_idc_detected( $input ) );
	}

	/**
	 * Data provider for test_check_http_response_for_idc_detected_invalid_input
	 *
	 * @return array The test data.
	 */
	public function data_provider_test_check_http_response_for_idc_detected_invalid_input() {
		$no_idc_detected_body = wp_json_encode(
			array(
				'test1' => 'test 1',
				'test2' => 'test 2',
			)
		);

		return array(
			'input is null'                       => array(
				null,
			),
			'input is string'                     => array(
				'test',
			),
			'input is array, no idc_detected key' => array(
				array(
					'body' => $no_idc_detected_body,
				),
			),
		);
	}

	/**
	 * Test the check_http_response_for_idc_detected method with an inputs that contains the idc_detected key.
	 *
	 * @param mixed $input         The input to the check_response_for_idc method.
	 *
	 * @dataProvider data_provider_test_check_http_response_for_idc_detected_idc_detected
	 */
	public function test_check_http_response_for_idc_detected_idc_detected( $input ) {
		$this->assertTrue( Identity_Crisis::init()->check_http_response_for_idc_detected( $input ) );
	}

	/**
	 * Data provider for test_check_http_response_for_idc_detected_idc_detected
	 *
	 * @return The test data with the structure:
	 *    'input'           => The input for the check_response_for_idc method.
	 *     'option_updated' => Whether the check_response_for_idc method should update
	 *                         the sync_error_idc option.
	 */
	public function data_provider_test_check_http_response_for_idc_detected_idc_detected() {
		$nonmatching_error_code_body = wp_json_encode(
			array(
				'idc_detected' => array(
					'error_code'      => 'not an idc error code',
					'request_siteurl' => 'example.org/',
					'request_home'    => 'example.org/',
					'wpcom_siteurl'   => 'example.com/',
					'wpcom_home'      => 'example.com/',
				),
				'test'         => 'test value',
			)
		);

		$matching_error_code_body = wp_json_encode(
			array(
				'idc_detected' => array(
					'error_code'      => 'jetpack_url_mismatch',
					'request_siteurl' => 'example.org/',
					'request_home'    => 'example.org/',
					'wpcom_siteurl'   => 'example.com/',
					'wpcom_home'      => 'example.com/',
				),
				'test'         => 'test value',
			)
		);

		return array(
			'input has non-matching error code' => array(
				array(
					'body' => $nonmatching_error_code_body,
				),
			),
			'input has url mismatch error code' => array(
				array(
					'body' => $matching_error_code_body,
				),
			),
		);
	}

	/**
	 * Return string '1'.
	 *
	 * @return string
	 */
	public function return_string_1() {
		return '1';
	}
}
