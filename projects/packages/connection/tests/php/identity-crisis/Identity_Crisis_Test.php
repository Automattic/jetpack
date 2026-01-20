<?php
/**
 * Tests the Identity_Crisis package.
 *
 * @package automattic/jetpack-identity-crisis
 */

namespace Automattic\Jetpack;

use Automattic\Jetpack\IdentityCrisis\URL_Secret;
use Automattic\Jetpack\Status\Cache as StatusCache;
use Jetpack_Options;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;

/**
 * Test Identity_Crisis class
 */
class Identity_Crisis_Test extends BaseTestCase {

	const TEST_URL = 'https://www.example.org/test';

	/**
	 * Set up tests.
	 */
	public function set_up() {
		Constants::set_constant( 'JETPACK_DISABLE_RAW_OPTIONS', true );
		StatusCache::clear();
		$this->reset_connection_status();
		// Clear IDC validation lock to ensure test isolation.
		delete_transient( 'jetpack_idc_validation_lock' );
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

		// @todo Remove this call once we no longer need to support PHP <8.1.
		if ( PHP_VERSION_ID < 80100 ) {
			$instance->setAccessible( true );
		}
		$instance->setValue( null, null );
		$this->reset_connection_status();
	}

	/**
	 * Reset the connection status.
	 * Needed because the connection status is memoized and not reset between tests.
	 * WorDBless does not fire the options update hooks that would reset the connection status.
	 */
	public function reset_connection_status() {
		static $manager = null;
		if ( ! $manager ) {
			$manager = new \Automattic\Jetpack\Connection\Manager();
		}
		$manager->reset_connection_status();
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

		$before = time();
		$result = Identity_Crisis::get_sync_error_idc_option();
		$after  = time();

		// Cleanup.
		update_option( 'home', $original_home );
		update_option( 'siteurl', $original_siteurl );

		$this->assertSame( 'coolsite.com/', $result['home'] );
		$this->assertSame( 'coolsite.com/wp/', $result['siteurl'] );
		$this->assertGreaterThanOrEqual( $before, $result['last_checked'] );
		$this->assertLessThanOrEqual( $after, $result['last_checked'] );
		$this->assertSame( Identity_Crisis::IDC_VALIDATION_INITIAL_DELAY, $result['next_check_delay'] );
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

		$before = time();
		$result = Identity_Crisis::get_sync_error_idc_option();
		$after  = time();

		// Cleanup.
		update_option( 'home', $original_home );
		update_option( 'siteurl', $original_siteurl );

		$this->assertSame( '72.182.131.109/~wordpress/', $result['home'] );
		$this->assertSame( '72.182.131.109/~wordpress/wp/', $result['siteurl'] );
		$this->assertGreaterThanOrEqual( $before, $result['last_checked'] );
		$this->assertLessThanOrEqual( $after, $result['last_checked'] );
		$this->assertSame( Identity_Crisis::IDC_VALIDATION_INITIAL_DELAY, $result['next_check_delay'] );
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
	#[DataProvider( 'data_provider_test_check_response_for_idc_no_error_code' )]
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
	public static function data_provider_test_check_response_for_idc_no_error_code() {
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
	#[DataProvider( 'data_provider_test_check_response_for_idc_with_error_code' )]
	public function test_check_response_for_idc_with_error_code( $input, $option_updated ) {
		// Delete option before each test.
		Jetpack_Options::delete_option( 'sync_error_idc' );

		$before = time();
		$result = Identity_Crisis::init()->check_response_for_idc( $input );
		$after  = time();
		$option = Jetpack_Options::get_option( 'sync_error_idc' );

		$this->assertTrue( $result );

		if ( $option_updated ) {
			$this->assertIsArray( $option );
			// WorDBless sets the siteurl and home options to example.org.
			$this->assertSame( 'example.org/', $option['home'] );
			$this->assertSame( 'example.org/', $option['siteurl'] );
			$this->assertSame( $input['error_code'], $option['error_code'] );
			$this->assertTrue( $option['reversed_url'] );
			// last_checked is set to current time, so check it's within range.
			$this->assertGreaterThanOrEqual( $before, $option['last_checked'] );
			$this->assertLessThanOrEqual( $after, $option['last_checked'] );
			$this->assertSame( Identity_Crisis::IDC_VALIDATION_INITIAL_DELAY, $option['next_check_delay'] );
		} else {
			$this->assertFalse( $option );
		}
	}

	/**
	 * Data provider for test_check_response_for_idc_with_error_code
	 *
	 * @return array[] The test data with the structure:
	 *    'input'           => The input for the check_response_for_idc method.
	 *     'option_updated' => Whether the check_response_for_idc method should update
	 *                         the sync_error_idc option.
	 */
	public static function data_provider_test_check_response_for_idc_with_error_code() {
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
	 * Test that check_response_for_idc preserves next_check_delay when same wpcom URLs are detected.
	 */
	public function test_check_response_for_idc_preserves_delay_on_same_wpcom_urls() {
		// Set up initial IDC with custom timing values.
		$initial_last_checked     = time() - 7200; // 2 hours ago.
		$initial_next_check_delay = 7200; // 2 hours (doubled from initial 3600).
		$existing_idc             = array(
			'home'             => 'example.org/',
			'siteurl'          => 'example.org/',
			'error_code'       => 'jetpack_url_mismatch',
			'wpcom_siteurl'    => '/moc.elpmaxe', // example.com reversed.
			'wpcom_home'       => '/moc.elpmaxe', // example.com reversed.
			'reversed_url'     => true,
			'last_checked'     => $initial_last_checked,
			'next_check_delay' => $initial_next_check_delay,
		);
		Jetpack_Options::update_option( 'sync_error_idc', $existing_idc );

		// Simulate a new response with the same wpcom URLs.
		$response = array(
			'error_code'    => 'jetpack_url_mismatch',
			'wpcom_siteurl' => 'example.com/',
			'wpcom_home'    => 'example.com/',
		);

		$before = time();
		Identity_Crisis::init()->check_response_for_idc( $response );
		$after = time();

		$updated_idc = Jetpack_Options::get_option( 'sync_error_idc' );

		// last_checked should be updated to current time.
		$this->assertGreaterThanOrEqual( $before, $updated_idc['last_checked'] );
		$this->assertLessThanOrEqual( $after, $updated_idc['last_checked'] );

		// next_check_delay should be preserved from existing IDC.
		$this->assertSame( $initial_next_check_delay, $updated_idc['next_check_delay'] );
	}

	/**
	 * Test that check_response_for_idc resets timing when different wpcom URLs are detected.
	 */
	public function test_check_response_for_idc_resets_timing_on_different_wpcom_urls() {
		// Set up initial IDC with custom timing values.
		$initial_last_checked     = time() - 7200; // 2 hours ago.
		$initial_next_check_delay = 7200; // 2 hours (doubled from initial 3600).
		$existing_idc             = array(
			'home'             => 'example.org/',
			'siteurl'          => 'example.org/',
			'error_code'       => 'jetpack_url_mismatch',
			'wpcom_siteurl'    => '/moc.elpmaxe', // example.com reversed.
			'wpcom_home'       => '/moc.elpmaxe', // example.com reversed.
			'reversed_url'     => true,
			'last_checked'     => $initial_last_checked,
			'next_check_delay' => $initial_next_check_delay,
		);
		Jetpack_Options::update_option( 'sync_error_idc', $existing_idc );

		// Simulate a new response with different wpcom URLs.
		$response = array(
			'error_code'    => 'jetpack_url_mismatch',
			'wpcom_siteurl' => 'different.com/',
			'wpcom_home'    => 'different.com/',
		);

		$before = time();
		Identity_Crisis::init()->check_response_for_idc( $response );
		$after = time();

		$updated_idc = Jetpack_Options::get_option( 'sync_error_idc' );

		// Both timing parameters should be reset to initial values.
		$this->assertGreaterThanOrEqual( $before, $updated_idc['last_checked'] );
		$this->assertLessThanOrEqual( $after, $updated_idc['last_checked'] );
		$this->assertSame( Identity_Crisis::IDC_VALIDATION_INITIAL_DELAY, $updated_idc['next_check_delay'] );
	}

	/**
	 * Test that check_response_for_idc sets initial timing on first IDC detection.
	 */
	public function test_check_response_for_idc_sets_initial_timing_on_first_detection() {
		// Ensure no existing IDC.
		Jetpack_Options::delete_option( 'sync_error_idc' );

		// Simulate first IDC detection.
		$response = array(
			'error_code'    => 'jetpack_url_mismatch',
			'wpcom_siteurl' => 'example.com/',
			'wpcom_home'    => 'example.com/',
		);

		$before = time();
		Identity_Crisis::init()->check_response_for_idc( $response );
		$after = time();

		$updated_idc = Jetpack_Options::get_option( 'sync_error_idc' );

		// Timing parameters should be set to initial values.
		$this->assertGreaterThanOrEqual( $before, $updated_idc['last_checked'] );
		$this->assertLessThanOrEqual( $after, $updated_idc['last_checked'] );
		$this->assertSame( Identity_Crisis::IDC_VALIDATION_INITIAL_DELAY, $updated_idc['next_check_delay'] );
	}

	/**
	 * Test that check_response_for_idc resets timing when wpcom_siteurl differs but wpcom_home is same.
	 */
	public function test_check_response_for_idc_resets_when_only_wpcom_siteurl_differs() {
		// Set up initial IDC.
		$initial_next_check_delay = 7200;
		$existing_idc             = array(
			'home'             => 'example.org/',
			'siteurl'          => 'example.org/',
			'error_code'       => 'jetpack_url_mismatch',
			'wpcom_siteurl'    => '/moc.elpmaxe', // example.com reversed.
			'wpcom_home'       => '/moc.elpmaxe', // example.com reversed.
			'reversed_url'     => true,
			'last_checked'     => time() - 7200,
			'next_check_delay' => $initial_next_check_delay,
		);
		Jetpack_Options::update_option( 'sync_error_idc', $existing_idc );

		// Simulate response with different wpcom_siteurl but same wpcom_home.
		$response = array(
			'error_code'    => 'jetpack_url_mismatch',
			'wpcom_siteurl' => 'different.com/', // Different.
			'wpcom_home'    => 'example.com/', // Same.
		);

		Identity_Crisis::init()->check_response_for_idc( $response );
		$updated_idc = Jetpack_Options::get_option( 'sync_error_idc' );

		// Timing should be reset because wpcom URLs are different.
		$this->assertSame( Identity_Crisis::IDC_VALIDATION_INITIAL_DELAY, $updated_idc['next_check_delay'] );
	}

	/**
	 * Test that check_response_for_idc resets delay when corrupted (invalid values).
	 */
	public function test_check_response_for_idc_resets_corrupted_delay() {
		$test_cases = array(
			'too_small'   => 100,       // Below minimum.
			'too_large'   => 99999999,  // Above maximum.
			'not_numeric' => 'invalid', // String.
			'negative'    => -1000,     // Negative number.
		);

		foreach ( $test_cases as $case_name => $invalid_delay ) {
			// Set up IDC with corrupted delay value.
			$existing_idc = array(
				'home'             => 'example.org/',
				'siteurl'          => 'example.org/',
				'error_code'       => 'jetpack_url_mismatch',
				'wpcom_siteurl'    => '/moc.elpmaxe',
				'wpcom_home'       => '/moc.elpmaxe',
				'reversed_url'     => true,
				'last_checked'     => time() - 7200,
				'next_check_delay' => $invalid_delay,
			);
			Jetpack_Options::update_option( 'sync_error_idc', $existing_idc );

			// Simulate a new response with the same wpcom URLs.
			$response = array(
				'error_code'    => 'jetpack_url_mismatch',
				'wpcom_siteurl' => 'example.com/',
				'wpcom_home'    => 'example.com/',
			);

			Identity_Crisis::init()->check_response_for_idc( $response );
			$updated_idc = Jetpack_Options::get_option( 'sync_error_idc' );

			// Should reset to initial delay when corrupted value is detected.
			$this->assertSame(
				Identity_Crisis::IDC_VALIDATION_INITIAL_DELAY,
				$updated_idc['next_check_delay'],
				"Failed for case: {$case_name}"
			);
		}
	}

	/**
	 * Test the check_http_response_for_idc_detected method with invalid inputs. These inputs should
	 * cause the method to return false.
	 *
	 * @param mixed $input The input value.
	 *
	 * @dataProvider data_provider_test_check_http_response_for_idc_detected_invalid_input
	 */
	#[DataProvider( 'data_provider_test_check_http_response_for_idc_detected_invalid_input' )]
	public function test_check_http_response_for_idc_detected_invalid_input( $input ) {
		$this->assertFalse( Identity_Crisis::init()->check_http_response_for_idc_detected( $input ) );
	}

	/**
	 * Data provider for test_check_http_response_for_idc_detected_invalid_input
	 *
	 * @return array The test data.
	 */
	public static function data_provider_test_check_http_response_for_idc_detected_invalid_input() {
		$no_idc_detected_body = wp_json_encode(
			array(
				'test1' => 'test 1',
				'test2' => 'test 2',
			),
			JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE
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
	#[DataProvider( 'data_provider_test_check_http_response_for_idc_detected_idc_detected' )]
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
	public static function data_provider_test_check_http_response_for_idc_detected_idc_detected() {
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
			),
			JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE
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
			),
			JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE
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
				),
				JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE
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
	#[DataProvider( 'data_provider_test_has_identity_crisis' )]
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
	public static function data_provider_test_has_identity_crisis() {
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
	#[DataProvider( 'data_provider_test_get_mismatched_urls' )]
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
	public static function data_provider_test_get_mismatched_urls() {
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
	 * Test the `add_secret_to_url_validation_response()` method in Offline Mode.
	 *
	 * @return void
	 */
	public static function test_add_secret_to_url_validation_response_offline_mode() {
		$data = array(
			'key1' => 'value1',
			'key2' => 'value2',
		);

		update_option( 'jetpack_offline_mode', '1' );
		$data_updated = Identity_Crisis::add_secret_to_url_validation_response( $data );
		delete_option( 'jetpack_offline_mode' );

		$data['offline_mode'] = '1';

		static::assertEquals( $data, $data_updated );
		static::assertArrayNotHasKey( 'url_secret_error', $data_updated );
		static::assertArrayNotHasKey( 'url_secret', $data_updated );
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

	/**
	 * Test that get_sync_error_idc_option() adds timing fields for new IDC options.
	 */
	public function test_get_sync_error_idc_option_adds_timing_fields() {
		$before = time();
		$option = Identity_Crisis::get_sync_error_idc_option();
		$after  = time();

		$this->assertArrayHasKey( 'last_checked', $option );
		$this->assertArrayHasKey( 'next_check_delay', $option );
		// last_checked should be set to current time to prevent immediate validation.
		$this->assertGreaterThanOrEqual( $before, $option['last_checked'] );
		$this->assertLessThanOrEqual( $after, $option['last_checked'] );
		$this->assertEquals( Identity_Crisis::IDC_VALIDATION_INITIAL_DELAY, $option['next_check_delay'] );
	}

	/**
	 * Test backward compatibility: validate_sync_error_idc_option() adds timing fields to existing IDC options.
	 */
	public function test_validate_sync_error_idc_option_adds_timing_fields_for_backward_compatibility() {
		// Clean up any state from previous tests.
		delete_transient( 'jetpack_idc_validation_lock' );

		// Set blog_id so the "clear IDC on missing blog_id" path is avoided.
		// The API call will fail due to missing blog_token, but that's handled gracefully.
		Jetpack_Options::update_option( 'id', 12345 );

		add_filter( 'jetpack_should_handle_idc', '__return_true' );

		// Create an IDC option without timing fields (simulating an old option).
		$option = Identity_Crisis::get_sync_error_idc_option();
		unset( $option['last_checked'] );
		unset( $option['next_check_delay'] );
		Jetpack_Options::update_option( 'sync_error_idc', $option );

		// Validate it - this should add timing fields and trigger remote validation.
		// The API call will fail, but failures are handled gracefully (IDC persists).
		$result = Identity_Crisis::validate_sync_error_idc_option();

		// Clean up.
		Jetpack_Options::delete_option( 'sync_error_idc' );
		Jetpack_Options::delete_option( 'id' );
		delete_transient( 'jetpack_idc_validation_lock' );
		remove_filter( 'jetpack_should_handle_idc', '__return_true' );

		// Should still be valid (IDC persists because API failure doesn't clear it).
		$this->assertTrue( $result );
	}

	/**
	 * Test that constants are defined with expected values.
	 */
	public function test_idc_validation_constants() {
		$this->assertEquals( 3600, Identity_Crisis::IDC_VALIDATION_INITIAL_DELAY );
		$this->assertEquals( 2592000, Identity_Crisis::IDC_VALIDATION_MAX_DELAY );
	}

	/**
	 * Test should_remote_validate_idc() returns false when max delay reached.
	 */
	public function test_should_remote_validate_idc_returns_false_when_max_delay_reached() {
		$sync_error = array(
			'last_checked'     => time() - 3600,
			'next_check_delay' => Identity_Crisis::IDC_VALIDATION_MAX_DELAY,
		);

		$result = Identity_Crisis::should_remote_validate_idc( $sync_error );

		$this->assertFalse( $result );
	}

	/**
	 * Test should_remote_validate_idc() returns false when not enough time has passed.
	 */
	public function test_should_remote_validate_idc_returns_false_when_not_enough_time_passed() {
		$sync_error = array(
			'last_checked'     => time() - 1800, // 30 minutes ago.
			'next_check_delay' => 3600, // 1 hour delay.
		);

		$result = Identity_Crisis::should_remote_validate_idc( $sync_error );

		$this->assertFalse( $result );
	}

	/**
	 * Test should_remote_validate_idc() returns true when enough time has passed.
	 */
	public function test_should_remote_validate_idc_returns_true_when_enough_time_passed() {
		$sync_error = array(
			'last_checked'     => time() - 7200, // 2 hours ago.
			'next_check_delay' => 3600, // 1 hour delay.
		);

		$result = Identity_Crisis::should_remote_validate_idc( $sync_error );

		$this->assertTrue( $result );
	}

	/**
	 * Test should_remote_validate_idc() returns true when last_checked is 0 (never checked).
	 */
	public function test_should_remote_validate_idc_returns_true_when_never_checked() {
		$sync_error = array(
			'last_checked'     => 0,
			'next_check_delay' => 3600,
		);

		$result = Identity_Crisis::should_remote_validate_idc( $sync_error );

		$this->assertTrue( $result );
	}

	/**
	 * Test should_remote_validate_idc() returns false when safe mode is confirmed.
	 */
	public function test_should_remote_validate_idc_returns_false_when_safe_mode_confirmed() {
		// Set up safe mode as confirmed.
		Jetpack_Options::update_option( 'safe_mode_confirmed', true );

		$sync_error = array(
			'last_checked'     => time() - 7200, // 2 hours ago.
			'next_check_delay' => 3600, // 1 hour delay - validation would normally occur.
		);

		$result = Identity_Crisis::should_remote_validate_idc( $sync_error );

		// Clean up.
		Jetpack_Options::delete_option( 'safe_mode_confirmed' );

		// Should return false because safe mode is confirmed, even though enough time has passed.
		$this->assertFalse( $result );
	}

	/**
	 * Test remote_validate_idc() clears IDC when site is not registered.
	 */
	public function test_remote_validate_idc_clears_idc_when_not_registered() {
		// Clean up any state from previous tests.
		delete_transient( 'jetpack_idc_validation_lock' );

		Jetpack_Options::delete_option( 'id' );

		$initial_sync_error = Identity_Crisis::get_sync_error_idc_option();
		Jetpack_Options::update_option( 'sync_error_idc', $initial_sync_error );

		$result = Identity_Crisis::remote_validate_idc( $initial_sync_error );

		$stored_option = Jetpack_Options::get_option( 'sync_error_idc' );

		// Clean up.
		delete_transient( 'jetpack_idc_validation_lock' );

		// Should return true (IDC was cleared) because IDC is invalid without a blog_id.
		$this->assertTrue( $result );
		// Option should be deleted.
		$this->assertFalse( $stored_option );
	}

	/**
	 * Test remote_validate_idc() returns false and updates timing on network error.
	 */
	public function test_remote_validate_idc_handles_network_error_gracefully() {
		// Clean up any state from previous tests.
		delete_transient( 'jetpack_idc_validation_lock' );

		// Set up constants required for API call URL construction.
		$api_base_original = Constants::get_constant( 'JETPACK__WPCOM_JSON_API_BASE' );
		Constants::set_constant( 'JETPACK__WPCOM_JSON_API_BASE', 'https://public-api.wordpress.com' );

		// Set up connection options required for API call.
		Jetpack_Options::update_option( 'id', 12345 );
		Jetpack_Options::update_option( 'blog_token', 'test.token' );
		$initial_sync_error                 = Identity_Crisis::get_sync_error_idc_option();
		$initial_sync_error['last_checked'] = time() - 10; // Set to past so updated time is greater.
		Jetpack_Options::update_option( 'sync_error_idc', $initial_sync_error );

		// Mock a network error response.
		$mock_callback = function () {
			return new \WP_Error( 'http_request_failed', 'Network error' );
		};
		add_filter( 'pre_http_request', $mock_callback, 10, 3 );

		$result = Identity_Crisis::remote_validate_idc( $initial_sync_error );

		remove_filter( 'pre_http_request', $mock_callback );
		$stored_option = Jetpack_Options::get_option( 'sync_error_idc' );

		// Clean up.
		Jetpack_Options::delete_option( 'id' );
		Jetpack_Options::delete_option( 'blog_token' );
		Jetpack_Options::delete_option( 'sync_error_idc' );
		delete_transient( 'jetpack_idc_validation_lock' );
		Constants::$set_constants['JETPACK__WPCOM_JSON_API_BASE'] = $api_base_original;

		$this->assertFalse( $result );
		// last_checked should be updated to prevent hammering on errors.
		$this->assertGreaterThan( $initial_sync_error['last_checked'], $stored_option['last_checked'] );
		// Delay should remain unchanged on errors (no exponential backoff).
		$this->assertEquals( $initial_sync_error['next_check_delay'], $stored_option['next_check_delay'] );
	}

	/**
	 * Test remote_validate_idc() returns false and updates timing on non-200 response.
	 */
	public function test_remote_validate_idc_handles_non_200_response() {
		// Clean up any state from previous tests.
		delete_transient( 'jetpack_idc_validation_lock' );

		// Set up constants required for API call URL construction.
		$api_base_original = Constants::get_constant( 'JETPACK__WPCOM_JSON_API_BASE' );
		Constants::set_constant( 'JETPACK__WPCOM_JSON_API_BASE', 'https://public-api.wordpress.com' );

		// Set up connection options required for API call.
		Jetpack_Options::update_option( 'id', 12345 );
		Jetpack_Options::update_option( 'blog_token', 'test.token' );
		$initial_sync_error                 = Identity_Crisis::get_sync_error_idc_option();
		$initial_sync_error['last_checked'] = time() - 10; // Set to past so updated time is greater.
		Jetpack_Options::update_option( 'sync_error_idc', $initial_sync_error );

		// Mock a 500 error response.
		$mock_callback = function () {
			return array(
				'headers'  => array(),
				'body'     => 'Internal server error',
				'response' => array(
					'code'    => 500,
					'message' => 'Internal Server Error',
				),
				'cookies'  => array(),
				'filename' => null,
			);
		};
		add_filter( 'pre_http_request', $mock_callback, 10, 3 );

		$result = Identity_Crisis::remote_validate_idc( $initial_sync_error );

		remove_filter( 'pre_http_request', $mock_callback );
		$stored_option = Jetpack_Options::get_option( 'sync_error_idc' );

		// Clean up.
		Jetpack_Options::delete_option( 'id' );
		Jetpack_Options::delete_option( 'blog_token' );
		Jetpack_Options::delete_option( 'sync_error_idc' );
		delete_transient( 'jetpack_idc_validation_lock' );
		Constants::$set_constants['JETPACK__WPCOM_JSON_API_BASE'] = $api_base_original;

		$this->assertFalse( $result );
		// last_checked should be updated to prevent hammering on errors.
		$this->assertGreaterThan( $initial_sync_error['last_checked'], $stored_option['last_checked'] );
		// Delay should remain unchanged on errors (no exponential backoff).
		$this->assertEquals( $initial_sync_error['next_check_delay'], $stored_option['next_check_delay'] );
	}

	/**
	 * Test remote_validate_idc() uses transient lock to prevent concurrent validations.
	 */
	public function test_remote_validate_idc_uses_transient_lock() {
		Jetpack_Options::update_option( 'id', 12345 );
		$sync_error = Identity_Crisis::get_sync_error_idc_option();
		Jetpack_Options::update_option( 'sync_error_idc', $sync_error );

		// Set the lock transient to simulate another validation in progress.
		set_transient( 'jetpack_idc_validation_lock', true, 60 );

		$result = Identity_Crisis::remote_validate_idc( $sync_error );

		// Clean up.
		delete_transient( 'jetpack_idc_validation_lock' );
		Jetpack_Options::delete_option( 'id' );
		Jetpack_Options::delete_option( 'sync_error_idc' );

		// Should return false because lock is held.
		$this->assertFalse( $result );
	}

	/**
	 * Test remote_validate_idc() updates timing on invalid JSON response.
	 */
	public function test_remote_validate_idc_handles_invalid_json_gracefully() {
		// Clean up any state from previous tests.
		delete_transient( 'jetpack_idc_validation_lock' );

		// Set up constants required for API call URL construction.
		$api_base_original = Constants::get_constant( 'JETPACK__WPCOM_JSON_API_BASE' );
		Constants::set_constant( 'JETPACK__WPCOM_JSON_API_BASE', 'https://public-api.wordpress.com' );

		// Set up connection options required for API call.
		Jetpack_Options::update_option( 'id', 12345 );
		Jetpack_Options::update_option( 'blog_token', 'test.token' );
		$initial_sync_error                 = Identity_Crisis::get_sync_error_idc_option();
		$initial_sync_error['last_checked'] = time() - 10; // Set to past so updated time is greater.
		Jetpack_Options::update_option( 'sync_error_idc', $initial_sync_error );

		// Mock a 200 response with invalid JSON.
		$mock_callback = function () {
			return array(
				'headers'  => array(),
				'body'     => 'not valid json {{{',
				'response' => array(
					'code'    => 200,
					'message' => 'OK',
				),
				'cookies'  => array(),
				'filename' => null,
			);
		};
		add_filter( 'pre_http_request', $mock_callback, 10, 3 );

		$result = Identity_Crisis::remote_validate_idc( $initial_sync_error );

		remove_filter( 'pre_http_request', $mock_callback );
		$stored_option = Jetpack_Options::get_option( 'sync_error_idc' );

		// Clean up.
		Jetpack_Options::delete_option( 'id' );
		Jetpack_Options::delete_option( 'blog_token' );
		Jetpack_Options::delete_option( 'sync_error_idc' );
		delete_transient( 'jetpack_idc_validation_lock' );
		Constants::$set_constants['JETPACK__WPCOM_JSON_API_BASE'] = $api_base_original;

		$this->assertFalse( $result );
		// last_checked should be updated to prevent hammering on errors.
		$this->assertGreaterThan( $initial_sync_error['last_checked'], $stored_option['last_checked'] );
		// Delay should remain unchanged on errors (no exponential backoff).
		$this->assertEquals( $initial_sync_error['next_check_delay'], $stored_option['next_check_delay'] );
	}

	/**
	 * Test remote_validate_idc() clears IDC when WordPress.com returns no idc_detected.
	 */
	public function test_remote_validate_idc_clears_idc_when_resolved() {
		// Clean up any state from previous tests.
		delete_transient( 'jetpack_idc_validation_lock' );

		// Set up constants required for API call URL construction.
		$api_base_original = Constants::get_constant( 'JETPACK__WPCOM_JSON_API_BASE' );
		Constants::set_constant( 'JETPACK__WPCOM_JSON_API_BASE', 'https://public-api.wordpress.com' );

		// Set up connection options required for API call.
		Jetpack_Options::update_option( 'id', 12345 );
		Jetpack_Options::update_option( 'blog_token', 'test.token' );
		$initial_sync_error = Identity_Crisis::get_sync_error_idc_option();
		Jetpack_Options::update_option( 'sync_error_idc', $initial_sync_error );

		// Mock a successful response with NO idc_detected (IDC resolved).
		$mock_callback = function () {
			return array(
				'headers'  => array(),
				'body'     => wp_json_encode(
					array(
						'is_healthy' => true,
					),
					JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE
				),
				'response' => array(
					'code'    => 200,
					'message' => 'OK',
				),
				'cookies'  => array(),
				'filename' => null,
			);
		};
		add_filter( 'pre_http_request', $mock_callback, 10, 3 );

		$result = Identity_Crisis::remote_validate_idc( $initial_sync_error );

		remove_filter( 'pre_http_request', $mock_callback );
		$stored_option = Jetpack_Options::get_option( 'sync_error_idc' );

		// Clean up.
		Jetpack_Options::delete_option( 'id' );
		Jetpack_Options::delete_option( 'blog_token' );
		delete_transient( 'jetpack_idc_validation_lock' );
		Constants::$set_constants['JETPACK__WPCOM_JSON_API_BASE'] = $api_base_original;

		// Should return true (IDC was cleared).
		$this->assertTrue( $result );
		// Option should be deleted.
		$this->assertFalse( $stored_option );
	}

	/**
	 * Test remote_validate_idc() updates timing with backoff when IDC still exists.
	 */
	public function test_remote_validate_idc_updates_timing_when_idc_persists() {
		// Clean up any state from previous tests.
		delete_transient( 'jetpack_idc_validation_lock' );

		// Set up constants required for API call URL construction.
		$api_base_original = Constants::get_constant( 'JETPACK__WPCOM_JSON_API_BASE' );
		Constants::set_constant( 'JETPACK__WPCOM_JSON_API_BASE', 'https://public-api.wordpress.com' );

		// Set up connection options required for API call.
		Jetpack_Options::update_option( 'id', 12345 );
		Jetpack_Options::update_option( 'blog_token', 'test.token' );
		$initial_sync_error                     = Identity_Crisis::get_sync_error_idc_option();
		$initial_sync_error['next_check_delay'] = 3600; // 1 hour.
		$initial_sync_error['last_checked']     = time() - 7200; // 2 hours ago.
		Jetpack_Options::update_option( 'sync_error_idc', $initial_sync_error );

		// Mock a response with idc_detected (IDC still exists).
		$mock_callback = function () {
			return array(
				'headers'  => array(),
				'body'     => wp_json_encode(
					array(
						'ID'           => 12345,
						'idc_detected' => array(
							'error_code'    => 'jetpack_url_mismatch',
							'wpcom_home'    => 'https://example.com',
							'wpcom_siteurl' => 'https://example.com',
						),
					),
					JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE
				),
				'response' => array(
					'code'    => 200,
					'message' => 'OK',
				),
				'cookies'  => array(),
				'filename' => null,
			);
		};
		add_filter( 'pre_http_request', $mock_callback, 10, 3 );

		$result = Identity_Crisis::remote_validate_idc( $initial_sync_error );

		remove_filter( 'pre_http_request', $mock_callback );
		$stored_option = Jetpack_Options::get_option( 'sync_error_idc' );

		// Clean up.
		Jetpack_Options::delete_option( 'id' );
		Jetpack_Options::delete_option( 'blog_token' );
		Jetpack_Options::delete_option( 'sync_error_idc' );
		delete_transient( 'jetpack_idc_validation_lock' );
		Constants::$set_constants['JETPACK__WPCOM_JSON_API_BASE'] = $api_base_original;

		// Should return false (IDC still exists).
		$this->assertFalse( $result );
		// Option should still exist.
		$this->assertIsArray( $stored_option );
		// last_checked should be updated.
		$this->assertGreaterThan( $initial_sync_error['last_checked'], $stored_option['last_checked'] );
		// next_check_delay should be doubled (exponential backoff).
		$this->assertEquals( 7200, $stored_option['next_check_delay'] );
	}
}
