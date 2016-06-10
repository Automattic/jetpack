<?php
require_once( dirname( __FILE__ ) . '/../../../../modules/sso/class.jetpack-sso-helpers.php' );

/**
 * Testing functions in Jetpack_SSO_Helpers class.
 *
 * @since 4.1.0
 */
class WP_Test_Jetpack_SSO_Helpers extends WP_UnitTestCase {
	function test_sso_helpers_is_two_step_required_filter_true() {
		add_filter( 'jetpack_sso_require_two_step', '__return_true' );
		$this->assertTrue( Jetpack_SSO_Helpers::is_two_step_required() );
		remove_filter( 'jetpack_sso_require_two_step', '__return_true' );
	}

	function test_sso_helpers_is_two_step_required_filter_false() {
		add_filter( 'jetpack_sso_require_two_step', '__return_false' );
		$this->assertFalse( Jetpack_SSO_Helpers::is_two_step_required() );
		remove_filter( 'jetpack_sso_require_two_step', '__return_false' );
	}

	function test_sso_helpers_is_two_step_required_option_true() {
		update_option( 'jetpack_sso_require_two_step', true );
		$this->assertTrue( Jetpack_SSO_Helpers::is_two_step_required() );
		delete_option( 'jetpack_sso_require_two_step' );
	}

	function test_sso_helpers_is_two_step_required_option_false() {
		update_option( 'jetpack_sso_require_two_step', false );
		$this->assertFalse( Jetpack_SSO_Helpers::is_two_step_required() );
		delete_option( 'jetpack_sso_require_two_step' );
	}

	function test_sso_helpers_should_hide_login_form_filter_true() {
		add_filter( 'jetpack_remove_login_form', '__return_true' );
		$this->assertTrue( Jetpack_SSO_Helpers::should_hide_login_form() );
		remove_filter( 'jetpack_remove_login_form', '__return_true' );
	}

	function test_sso_helpers_should_hide_login_form_filter_false() {
		add_filter( 'jetpack_remove_login_form', '__return_false' );
		$this->assertFalse( Jetpack_SSO_Helpers::should_hide_login_form() );
		remove_filter( 'jetpack_remove_login_form', '__return_false' );
	}

	function test_sso_helpers_match_by_email_filter_true() {
		add_filter( 'jetpack_sso_match_by_email', '__return_true' );
		$this->assertTrue( Jetpack_SSO_Helpers::match_by_email() );
		remove_filter( 'jetpack_sso_match_by_email', '__return_true' );
	}

	function test_sso_helpers_match_by_email_filter_false() {
		add_filter( 'jetpack_sso_match_by_email', '__return_false' );
		$this->assertFalse( Jetpack_SSO_Helpers::match_by_email() );
		remove_filter( 'jetpack_sso_match_by_email', '__return_false' );
	}

	function test_sso_helpers_new_user_override_filter_true() {
		add_filter( 'jetpack_sso_new_user_override', '__return_true' );
		$this->assertTrue( Jetpack_SSO_Helpers::new_user_override() );
		remove_filter( 'jetpack_sso_new_user_override', '__return_true' );
	}

	function test_sso_helpers_new_user_override_filter_false() {
		add_filter( 'jetpack_sso_new_user_override', '__return_false' );
		$this->assertFalse( Jetpack_SSO_Helpers::new_user_override() );
		remove_filter( 'jetpack_sso_new_user_override', '__return_false' );
	}

	function test_sso_helpers_sso_bypass_default_login_form_filter_true() {
		add_filter( 'jetpack_sso_bypass_login_forward_wpcom', '__return_true' );
		$this->assertTrue( Jetpack_SSO_Helpers::bypass_login_forward_wpcom() );
		remove_filter( 'jetpack_sso_bypass_login_forward_wpcom', '__return_true' );
	}

	function test_sso_helpers_sso_bypass_default_login_form_filter_false() {
		add_filter( 'jetpack_sso_bypass_login_forward_wpcom', '__return_false' );
		$this->assertFalse( Jetpack_SSO_Helpers::bypass_login_forward_wpcom() );
		remove_filter( 'jetpack_sso_bypass_login_forward_wpcom', '__return_false' );
	}
}
