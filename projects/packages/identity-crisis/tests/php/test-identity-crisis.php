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
		Constants::clear_single_constant( 'JETPACK_DISABLE_RAW_OPTIONS' );
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
	 * Test the sync_idc_optin option default value.
	 */
	public function test_idc_optin_default() {
		if ( is_multisite() ) {
			$this->assertFalse( Identity_Crisis::sync_idc_optin() );
		} else {
			$this->assertTrue( Identity_Crisis::sync_idc_optin() );
		}
	}

	/**
	 * Test that the jetpack_sync_idc_optin filter overrides the jetpack_development_version filter.
	 */
	public function test_idc_optin_filter_overrides_development_version() {
		add_filter( 'jetpack_development_version', '__return_true' );
		add_filter( 'jetpack_sync_idc_optin', '__return_false' );
		$result = Identity_Crisis::sync_idc_optin();
		remove_filter( 'jetpack_development_version', '__return_true' );
		remove_filter( 'jetpack_sync_idc_optin', '__return_false' );

		$this->assertFalse( $result );
	}

	/**
	 * Test that the jetpack_sync_idc_optin filter casts values to a bool.
	 */
	public function test_idc_optin_casts_to_bool() {
		add_filter( 'jetpack_sync_idc_optin', array( $this, 'return_string_1' ) );
		$result = Identity_Crisis::sync_idc_optin();
		remove_filter( 'jetpack_sync_idc_optin', array( $this, 'return_string_1' ) );

		$this->assertTrue( $result );
	}

	/**
	 * Test that sync_idc_optin returns true when the JETPACK_SYNC_IDC_OPTIN constant is true.
	 */
	public function test_idc_optin_true_when_constant_true() {
		Constants::set_constant( 'JETPACK_SYNC_IDC_OPTIN', true );
		$this->assertTrue( Identity_Crisis::sync_idc_optin() );
	}

	/**
	 * Test that sync_idc_optin returns false when the JETPACK_SYNC_IDC_OPTIN constant is false.
	 */
	public function test_idc_optin_false_when_constant_false() {
		Constants::set_constant( 'JETPACK_SYNC_IDC_OPTIN', false );
		$this->assertFalse( Identity_Crisis::sync_idc_optin() );
	}

	/**
	 * Test that the jetpack_sync_idc_optin filter overrides the JETPACK_SYNC_IDC_OPTIN constant.
	 */
	public function test_idc_optin_filter_overrides_constant() {
		Constants::set_constant( 'JETPACK_SYNC_IDC_OPTIN', true );
		add_filter( 'jetpack_sync_idc_optin', '__return_false' );
		$result = Identity_Crisis::sync_idc_optin();
		remove_filter( 'jetpack_sync_idc_optin', '__return_false' );

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
		add_filter( 'jetpack_sync_idc_optin', '__return_true' );
		Jetpack_Options::update_option( 'sync_error_idc', Identity_Crisis::get_sync_error_idc_option() );

		$result = Identity_Crisis::validate_sync_error_idc_option();

		Jetpack_Options::delete_option( 'sync_error_idc' );
		remove_filter( 'jetpack_sync_idc_optin', '__return_true' );

		$this->assertTrue( $result );
	}

	/**
	 * Verify that validate_sync_error returns false if wpcom_ is set and matches expected.
	 */
	public function test_sync_error_idc_validation_returns_false_when_wpcom_option_matches_expected() {
		add_filter( 'jetpack_sync_idc_optin', '__return_true' );

		$option                  = Identity_Crisis::get_sync_error_idc_option();
		$option['wpcom_home']    = $option['home'];
		$option['wpcom_siteurl'] = $option['siteurl'];
		Jetpack_Options::update_option( 'sync_error_idc', $option );

		$validation_result = Identity_Crisis::validate_sync_error_idc_option();

		// Verify the migrate_for_idc is set.
		$option_result = Jetpack_Options::get_option( 'migrate_for_idc' );

		Jetpack_Options::delete_option( 'sync_error_idc' );
		Jetpack_Options::delete_option( 'migrate_for_idc' );
		remove_filter( 'jetpack_sync_idc_optin', '__return_true' );

		$this->assertFalse( $validation_result );
		$this->assertTrue( $option_result );
	}

	/**
	 * Verify that validate_sync_error returns true if wpcom_ is set and does not match.
	 */
	public function test_sync_error_idc_validation_returns_true_when_wpcom_option_does_not_match_expected() {
		add_filter( 'jetpack_sync_idc_optin', '__return_true' );

		$option                  = Identity_Crisis::get_sync_error_idc_option();
		$option['wpcom_home']    = $option['home'];
		$option['wpcom_siteurl'] = 'coolrunnings.test';
		Jetpack_Options::update_option( 'sync_error_idc', $option );

		$validation_result = Identity_Crisis::validate_sync_error_idc_option();

		// Verify the migrate_for_idc is not set.
		$option_result = Jetpack_Options::get_option( 'migrate_for_idc' );

		Jetpack_Options::delete_option( 'sync_error_idc' );
		Jetpack_Options::delete_option( 'migrate_for_idc' );
		remove_filter( 'jetpack_sync_idc_optin', '__return_true' );

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
	 * when the JETPACK_SYNC_IDC_OPTIN constant is false.
	 */
	public function test_sync_error_idc_validation_returns_false_and_cleans_up_when_opted_out() {
		Jetpack_Options::update_option( 'sync_error_idc', Identity_Crisis::get_sync_error_idc_option() );
		Constants::set_constant( 'JETPACK_SYNC_IDC_OPTIN', false );

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
	 * Return string '1'.
	 *
	 * @return string
	 */
	public function return_string_1() {
		return '1';
	}

	/**
	 * Return string 'example.org'.
	 */
	public function return_example_url() {
		return 'https://example.org';
	}

}
