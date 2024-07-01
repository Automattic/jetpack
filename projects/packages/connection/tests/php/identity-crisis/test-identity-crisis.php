<?php //phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

/**
 * Tests the Identity_Crisis package.
 *
 * @package automattic/jetpack-identity-crisis
 */

namespace Automattic\Jetpack;

use Automattic\Jetpack\IdentityCrisis\URL_Secret;
use Automattic\Jetpack\Status\Cache as StatusCache;
use Jetpack_Options;
use WorDBless\BaseTestCase;

/**
 * Test Identity_Crisis class
 */
class Test_Identity_Crisis extends BaseTestCase {

	const TEST_URL = 'https://www.example.org/test';

	/**
	 * Set up tests.
	 */
	public function set_up() {
		Constants::set_constant( 'JETPACK_DISABLE_RAW_OPTIONS', true );
		StatusCache::clear();
	}

	/**
	 * Tear down tests.
	 */
	public function tear_down() {
		Constants::clear_constants();
		StatusCache::clear();

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
		$result = ( new Status() )->in_safe_mode();
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
	 * Test the add_idc_query_args_to_url with null input.
	 */
	public function test_add_idc_query_args_to_url_input_null() {
		$this->set_up_for_test_add_idc_query_args_to_url();

		$result = Identity_Crisis::init()->add_idc_query_args_to_url( null );

		$this->tear_down_for_test_add_idc_query_args_to_url();

		$this->assertNull( $result );
	}

	/**
	 * Test the add_idc_query_args_to_url with a non-string input.
	 */
	public function test_add_idc_query_args_to_url_input_not_string() {
		$this->set_up_for_test_add_idc_query_args_to_url();

		$input  = 123;
		$result = Identity_Crisis::init()->add_idc_query_args_to_url( $input );

		$this->tear_down_for_test_add_idc_query_args_to_url();

		$this->assertSame( $input, $result );
	}

	/**
	 * Test the test_add_idc_query_args_to_url method with a valid url input.
	 */
	public function test_add_idc_query_args_to_url() {
		$this->set_up_for_test_add_idc_query_args_to_url();
		$input_url = 'https://www.example.com';

		$result     = Identity_Crisis::init()->add_idc_query_args_to_url( $input_url );
		$url_parts  = wp_parse_url( $result );
		$query_args = wp_parse_args( $url_parts['query'] );

		$this->tear_down_for_test_add_idc_query_args_to_url();

		$this->assertSame( self::TEST_URL, $query_args['siteurl'] );
		$this->assertSame( self::TEST_URL, $query_args['home'] );
		$this->assertSame( $input_url, $url_parts['scheme'] . '://' . $url_parts['host'] );

		$this->assertSame( '1', $query_args['idc'] );
		$this->assertFalse( isset( $query_args['migrate_for_idc'] ) );
	}

	/**
	 * Test the add_idc_query_args_to_url with idc disabled with the `jetpack_should_handle_idc`
	 * filter.
	 */
	public function test_add_idc_query_args_to_url_no_idc() {
		$this->set_up_for_test_add_idc_query_args_to_url();
		add_filter( 'jetpack_should_handle_idc', '__return_false' );

		$input_url = 'https://www.example.com';

		$result     = Identity_Crisis::init()->add_idc_query_args_to_url( $input_url );
		$url_parts  = wp_parse_url( $result );
		$query_args = wp_parse_args( $url_parts['query'] );

		$this->tear_down_for_test_add_idc_query_args_to_url();
		remove_filter( 'jetpack_should_handle_idc', '__return_false' );

		$this->assertSame( self::TEST_URL, $query_args['siteurl'] );
		$this->assertSame( self::TEST_URL, $query_args['home'] );
		$this->assertSame( $input_url, $url_parts['scheme'] . '://' . $url_parts['host'] );

		$this->assertFalse( isset( $query_args['idc'] ) );
		$this->assertFalse( isset( $query_args['migrate_for_idc'] ) );
	}

	/**
	 * Test the add_idc_query_args_to_url with a migrade_for_idc option value of 1.
	 */
	public function test_add_idc_query_args_to_url_migrate_for_idc() {
		$this->set_up_for_test_add_idc_query_args_to_url();
		\Jetpack_Options::update_option( 'migrate_for_idc', true );

		$input_url = 'https://www.example.com';

		$result     = Identity_Crisis::init()->add_idc_query_args_to_url( $input_url );
		$url_parts  = wp_parse_url( $result );
		$query_args = wp_parse_args( $url_parts['query'] );

		$this->tear_down_for_test_add_idc_query_args_to_url();
		\Jetpack_Options::delete_option( 'migrate_for_idc' );

		$this->assertSame( self::TEST_URL, $query_args['siteurl'] );
		$this->assertSame( self::TEST_URL, $query_args['home'] );
		$this->assertSame( $input_url, $url_parts['scheme'] . '://' . $url_parts['host'] );

		$this->assertSame( '1', $query_args['idc'] );
		$this->assertSame( '1', $query_args['migrate_for_idc'] );
	}

	/**
	 * Test the add_idc_query_args_to_url method with offline mode.
	 */
	public function test_add_idc_query_args_to_url_offline_mode() {
		$this->set_up_for_test_add_idc_query_args_to_url();
		add_filter( 'jetpack_offline_mode', '__return_true' );
		\Jetpack_Options::update_option( 'migrate_for_idc', true );

		$input_url = 'https://www.example.com';

		$result     = Identity_Crisis::init()->add_idc_query_args_to_url( $input_url );
		$url_parts  = wp_parse_url( $result );
		$query_args = array();
		if ( array_key_exists( 'query', $url_parts ) ) {
			$query_args = wp_parse_args( $url_parts['query'] );
		}

		$this->tear_down_for_test_add_idc_query_args_to_url();
		remove_filter( 'jetpack_offline_mode', '__return_true' );
		\Jetpack_Options::delete_option( 'migrate_for_idc' );

		$this->assertSame( $input_url, $url_parts['scheme'] . '://' . $url_parts['host'] );
		$this->assertArrayNotHasKey( 'idc', $query_args );
		$this->assertArrayNotHasKey( 'migrate_for_idc', $query_args );
		$this->assertArrayNotHasKey( 'siteurl', $query_args );
		$this->assertArrayNotHasKey( 'home', $query_args );
	}

	/**
	 * Test the add_idc_query_args_to_url method with staging mode.
	 */
	public function test_add_idc_query_args_to_url_staging_mode() {
		$this->set_up_for_test_add_idc_query_args_to_url();
		add_filter( 'jetpack_is_staging_site', '__return_true' );
		\Jetpack_Options::update_option( 'migrate_for_idc', true );

		$input_url = 'https://www.example.com';

		$result     = Identity_Crisis::init()->add_idc_query_args_to_url( $input_url );
		$url_parts  = wp_parse_url( $result );
		$query_args = array();
		if ( array_key_exists( 'query', $url_parts ) ) {
			$query_args = wp_parse_args( $url_parts['query'] );
		}

		$this->tear_down_for_test_add_idc_query_args_to_url();
		remove_filter( 'jetpack_is_staging_site', '__return_true' );
		\Jetpack_Options::delete_option( 'migrate_for_idc' );

		$this->assertSame( $input_url, $url_parts['scheme'] . '://' . $url_parts['host'] );
		$this->assertSame( '1', $query_args['idc'] );
		$this->assertSame( '1', $query_args['migrate_for_idc'] );
		$this->assertSame( self::TEST_URL, $query_args['siteurl'] );
		$this->assertSame( self::TEST_URL, $query_args['home'] );
	}

	/**
	 * Set up test_add_idc_query_args_to_url test environment.
	 */
	public function set_up_for_test_add_idc_query_args_to_url() {
		add_filter( 'jetpack_sync_site_url', array( $this, 'return_test_url' ) );
		add_filter( 'jetpack_sync_home_url', array( $this, 'return_test_url' ) );
	}

	/**
	 * Tear down test_add_idc_query_args_to_url test environment.
	 */
	public function tear_down_for_test_add_idc_query_args_to_url() {
		remove_filter( 'jetpack_sync_site_url', array( $this, 'return_test_url' ) );
		remove_filter( 'jetpack_sync_home_url', array( $this, 'return_test_url' ) );
	}

	/**
	 * Returns the test url.
	 */
	public function return_test_url() {
		return self::TEST_URL;
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
			// Add reversed_url key
			$expected_option['reversed_url'] = true;
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
	 * @return array[] The test data with the structure:
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
	 * Data provider for test_check_http_response_for_idc_detected_idc_detected.
	 *
	 * @return array[] The test data with the structure:
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
	 * Test the check_response_for_idc method when the response does contain an error code.
	 */
	public function test_check_http_response_for_idc_detected_migrated_for_idc() {
		Jetpack_Options::update_option( 'migrate_for_idc', 1 );

		$input = array(
			'body' => wp_json_encode(
				array(
					'migrated_for_idc' => true,
				)
			),
		);

		$result = Identity_Crisis::init()->check_http_response_for_idc_detected( $input );

		$this->assertFalse( $result );
		$this->assertNull( Jetpack_Options::get_option( 'migrate_for_idc', null ) );
	}

	/**
	 * Test the has_identity_crisis method.
	 *
	 * @param bool $check_identity_crisis The value that Identity_Crisis::check_identity_crisis should return.
	 * @param bool $safe_mode_confirmed   The value of the Identity_Crisis::$safe_mode_confirmed property.
	 * @param bool $expected_result       The value expected to be returned by the call to the has_identity_crisis method.
	 *
	 * @dataProvider data_provider_test_has_identity_crisis
	 */
	public function test_has_identity_crisis( $check_identity_crisis, $safe_mode_confirmed, $expected_result ) {
		if ( $check_identity_crisis ) {
			$this->check_identity_crisis_return_error( array( 'test' ) );
		}

		Identity_Crisis::$is_safe_mode_confirmed = $safe_mode_confirmed;

		$result = Identity_Crisis::has_identity_crisis();

		$this->clean_up_check_identity_crisis_return_error();
		Identity_Crisis::$is_safe_mode_confirmed = false;

		$this->assertSame( $expected_result, $result );
	}

	/**
	 * Data provider for the test_has_identity_crisis method.
	 *
	 * @return array The test data with the format:
	 *   [
	 *     'check_identity_crisis' => (bool) The value that Identity_Crisis::check_identity_crisis should return.
	 *     'safe_mode_confirmed'   => (bool) The value of the Identity_Crisis::$safe_mode_confirmed property.
	 *     'expected_result'       => (bool) The value expected to be returned by the call to the has_identity_crisis method.
	 *   ]
	 */
	public function data_provider_test_has_identity_crisis() {
		return array(
			'check idc is true and safe mode is true'   => array(
				'check_identity_crisis' => true,
				'safe_mode_confirmed'   => true,
				'expected_result'       => false,
			),
			'check idc is true and safe mode is false'  => array(
				'check_identity_crisis' => true,
				'safe_mode_confirmed'   => false,
				'expected_result'       => true,
			),
			'check idc is false and safe mode is true'  => array(
				'check_identity_crisis' => false,
				'safe_mode_confirmed'   => true,
				'expected_result'       => false,
			),
			'check idc is false and safe mode is false' => array(
				'check_identity_crisis' => false,
				'safe_mode_confirmed'   => false,
				'expected_result'       => false,
			),
		);
	}

	/**
	 * Test the get_mismatched_urls method.
	 *
	 * @param mixed $idc_error       The value of the jetpack_sync_idc_error option.
	 * @param mixed $expected_result The value that the get_mismatched_value method should return.
	 *
	 * @dataProvider data_provider_test_get_mismatched_urls
	 */
	public function test_get_mismatched_urls( $idc_error, $expected_result ) {
		$this->check_identity_crisis_return_error( $idc_error );
		$result = Identity_Crisis::get_mismatched_urls();
		$this->clean_up_check_identity_crisis_return_error();

		$this->assertSame( $expected_result, $result );
	}

	/**
	 * Data providerd for the test_get_mismatched_urls method.
	 *
	 * @return array The test data with the format:
	 *   [
	 *     'idc_error'       => (mixed) The value of the jetpack_sync_idc_error option.
	 *     'expected_result' => (mixed) The value that the get_mismatched_value method should return.
	 *   ]
	 */
	public function data_provider_test_get_mismatched_urls() {
		return array(
			'false'                   => array(
				'idc_error'       => false,
				'expected_result' => false,
			),
			'empty array'             => array(
				'idc_error'       => array(),
				'expected_result' => false,
			),
			'no error_code key'       => array(
				'idc_error'       => array(
					'no_error_code' => 'test',
					'wpcom_siteurl' => 'example.com/wpcom_siteurl',
					'wpcom_home'    => 'example.com/wpcom_home',
					'siteurl'       => 'example.com/remote_siteurl',
					'home'          => 'example.com/remote_home',
				),
				'expected_result' => false,
			),
			'no wpcom_siteurl key'    => array(
				'idc_error'       => array(
					'error_code' => 'jetpack_url_mismatch',
					'wpcom_home' => 'example.com/wpcom_home',
					'siteurl'    => 'example.com/remote_siteurl',
					'home'       => 'example.com/remote_home',
				),
				'expected_result' => false,
			),
			'no wpcom_home key'       => array(
				'idc_error'       => array(
					'error_code'    => 'jetpack_url_mismatch',
					'wpcom_siteurl' => 'example.com/wpcom_siteurl',
					'siteurl'       => 'example.com/remote_siteurl',
					'home'          => 'example.com/remote_home',
				),
				'expected_result' => false,
			),
			'no siteurl key'          => array(
				'idc_error'       => array(
					'error_code'    => 'jetpack_url_mismatch',
					'wpcom_siteurl' => 'example.com/wpcom_siteurl',
					'wpcom_home'    => 'example.com/wpcom_home',
					'home'          => 'example.com/remote_home',
				),
				'expected_result' => false,
			),
			'no home key'             => array(
				'idc_error'       => array(
					'error_code'    => 'jetpack_url_mismatch',
					'wpcom_siteurl' => 'example.com/wpcom_siteurl',
					'wpcom_home'    => 'example.com/wpcom_home',
					'siteurl'       => 'example.com/remote_siteurl',
				),
				'expected_result' => false,
			),
			'site_url_mismatch_error' => array(
				'idc_error'       => array(
					'error_code'    => 'jetpack_site_url_mismatch',
					'wpcom_siteurl' => 'example.com/wpcom_siteurl',
					'wpcom_home'    => 'example.com/wpcom_home',
					'siteurl'       => 'example.com/remote_siteurl',
					'home'          => 'example.com/remote_home',
				),
				'expected_result' => array(
					'wpcom_url'   => 'example.com/wpcom_siteurl',
					'current_url' => 'example.com/remote_siteurl',
				),
			),
			'home_url_mismatch_error' => array(
				'idc_error'       => array(
					'error_code'    => 'jetpack_home_url_mismatch',
					'wpcom_siteurl' => 'example.com/wpcom_siteurl',
					'wpcom_home'    => 'example.com/wpcom_home',
					'siteurl'       => 'example.com/remote_siteurl',
					'home'          => 'example.com/remote_home',
				),
				'expected_result' => array(
					'wpcom_url'   => 'example.com/wpcom_home',
					'current_url' => 'example.com/remote_home',
				),
			),
			'url_mismatch_error'      => array(
				'idc_error'       => array(
					'error_code'    => 'jetpack_url_mismatch',
					'wpcom_siteurl' => 'example.com/wpcom_siteurl',
					'wpcom_home'    => 'example.com/wpcom_home',
					'siteurl'       => 'example.com/remote_siteurl',
					'home'          => 'example.com/remote_home',
				),
				'expected_result' => array(
					'wpcom_url'   => 'example.com/wpcom_home',
					'current_url' => 'example.com/remote_home',
				),
			),
		);
	}

	/**
	 * Forces the Identity_Crisis::check_identity_crisis method to return the input idc error array.
	 *
	 * @param array $idc_error The idc error array to be returned.
	 */
	private function check_identity_crisis_return_error( $idc_error ) {
		\Jetpack_Options::update_option( 'id', 'test' );
		\Jetpack_Options::update_option( 'blog_token', 'test' );
		add_filter( 'jetpack_sync_error_idc_validation', '__return_true' );
		update_option( 'jetpack_sync_error_idc', $idc_error );
	}

	/**
	 * Clean up the settings from the check_identity_crisis_return_error method.
	 */
	private function clean_up_check_identity_crisis_return_error() {
		\Jetpack_Options::delete_option( 'id' );
		\Jetpack_Options::update_option( 'blog_token', 'test' );
		remove_filter( 'jetpack_sync_error_idc_validation', '__return_true' );
		delete_option( 'jetpack_sync_error_idc' );
	}

	/**
	 * Return string '1'.
	 *
	 * @return string
	 */
	public function return_string_1() {
		return '1';
	}

	/**
	 * Test the `add_secret_to_url_validation_response()` method.
	 *
	 * @return void
	 */
	public static function test_add_secret_to_url_validation_response() {
		$data = array(
			'key1' => 'value1',
			'key2' => 'value2',
		);

		$data_updated = Identity_Crisis::add_secret_to_url_validation_response( $data );

		$secret_db          = Jetpack_Options::get_option( URL_Secret::OPTION_KEY );
		$data['url_secret'] = $secret_db['secret'];

		static::assertEquals( $data, $data_updated );
		static::assertArrayNotHasKey( 'url_secret_error', $data_updated );
	}

	/**
	 * Test the `reverse_wpcom_urls_for_idc()` method.
	 *
	 * @return void
	 */
	public function testReverseWpcomUrlsForIdc() {
		// Create a sample input array for testing
		$sync_error = array(
			'reversed_url'  => true,
			'wpcom_siteurl' => 'example.com',
			'wpcom_home'    => 'example.org',
		);

		// Call the method to be tested
		$result = Identity_Crisis::reverse_wpcom_urls_for_idc( $sync_error );

		// Assert that the 'wpcom_siteurl' and 'wpcom_home' keys have been reversed
		$this->assertEquals( 'moc.elpmaxe', $result['wpcom_siteurl'] );
		$this->assertEquals( 'gro.elpmaxe', $result['wpcom_home'] );

		// Test with an array that doesn't contain 'reversed_url'
		$sync_error2 = array(
			'wpcom_siteurl' => 'example.com',
			'wpcom_home'    => 'example.org',
		);

		$result2 = Identity_Crisis::reverse_wpcom_urls_for_idc( $sync_error2 );

		// Assert that 'wpcom_siteurl' and 'wpcom_home' keys have been reversed
		$this->assertEquals( 'example.com', $result2['wpcom_siteurl'] );
		$this->assertEquals( 'example.org', $result2['wpcom_home'] );

		// Assert that 'reversed_url' key is not present, and other keys are not changed
		$this->assertArrayNotHasKey( 'reversed_url', $result2 );
	}

	/**
	 * Test the 'register_request_body' filter.
	 *
	 * @return void
	 */
	public function test_register_request_body_ip() {
		Identity_Crisis::init();

		$body = array(
			'key1' => 'val1',
			'key2' => 'val2',
		);
		update_option( 'jetpack_persistent_blog_id', '12345' );

		$new_body = apply_filters( 'jetpack_register_request_body', $body );

		$secret = ( new URL_Secret() )->get_secret();

		delete_option( 'jetpack_persistent_blog_id' );
		delete_option( 'jetpack_identity_crisis_url_secret' );

		$this->assertTrue( (bool) $secret );
		$this->assertEquals(
			array_merge(
				$body,
				array(
					'persistent_blog_id' => '12345',
					'url_secret'         => $secret,
				)
			),
			$new_body
		);
	}

	/**
	 * Register saving the persistent blog ID on 'site_registered' action.
	 *
	 * @return void
	 */
	public function test_site_registered() {
		Identity_Crisis::init();
		$blog_id = 54321;

		$option_before = get_option( 'jetpack_persistent_blog_id' );
		do_action( 'jetpack_site_registered', $blog_id );
		$option_after = get_option( 'jetpack_persistent_blog_id' );

		$this->assertFalse( $option_before );
		$this->assertSame( $blog_id, $option_after );
	}

	/**
	 * Test the `set_ip_requester_for_idc()` method.
	 *
	 * @return void
	 */
	public function testAddIPRequesterForIdc() {
		Identity_Crisis::init();

		update_option( 'siteurl', 'http://72.182.131.109/' );
		$hostname      = wp_parse_url( get_site_url(), PHP_URL_HOST );
		$transient_key = ip2long( $hostname );

		// Call the method to be tested
		Identity_Crisis::set_ip_requester_for_idc( $hostname, $transient_key );
		$result = Jetpack_Options::get_option( 'identity_crisis_ip_requester' );

		// Assert that the the ip was added to the option
		$this->assertIsArray( $result );

		// Assert that the ip and expiry date are added
		$expected_ip = '72.182.131.109';
		foreach ( $result as $ip ) {
			$this->assertEquals( $expected_ip, $ip['ip'] );
			$this->assertTrue( is_int( $ip['expires_at'] ) );
		}

		// Test with another IP address
		update_option( 'siteurl', 'http://33.182.100.200/' );
		$hostname      = wp_parse_url( get_site_url(), PHP_URL_HOST );
		$transient_key = ip2long( $hostname );
		Identity_Crisis::set_ip_requester_for_idc( $hostname, $transient_key );
		$result2 = Jetpack_Options::get_option( 'identity_crisis_ip_requester' );

		$expected_ip2      = '33.182.100.200';
		$expected_ip_array = array( $expected_ip, $expected_ip2 );

		foreach ( $result2 as $ip ) {
			$this->assertContains( $ip['ip'], $expected_ip_array );
		}

		// Test deleting expired IPs
		$expired_ip = array(
			'ip'         => '99.182.100.777',
			'expires_at' => 1111,
		);
		$result2[]  = $expired_ip;

		$expected_ip3 = '99.182.100.777';

		Identity_Crisis::set_ip_requester_for_idc( $hostname, $transient_key );
		$result3 = Jetpack_Options::get_option( 'identity_crisis_ip_requester' );

		foreach ( $result3 as $ip ) {
			$this->assertNotContains( $expected_ip3, $ip );
		}
	}
}
