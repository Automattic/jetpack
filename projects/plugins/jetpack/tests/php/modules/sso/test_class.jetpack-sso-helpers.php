<?php
require_once __DIR__ . '/../../../../modules/sso/class.jetpack-sso-helpers.php';

/**
 * Testing functions in Jetpack_SSO_Helpers class.
 *
 * @since 4.1.0
 */
class WP_Test_Jetpack_SSO_Helpers extends WP_UnitTestCase {

	protected $user_data;

	/**
	 * Set up.
	 */
	public function set_up() {
		parent::set_up();
		$this->user_data = (object) array(
			'ID'           => 123456789,
			'email'        => 'ssouser@testautomattic.com',
			'login'        => 'ssouser',
			'display_name' => 'ssouser',
			'first_name'   => 'sso',
			'last_name'    => 'user',
			'url'          => 'https://automattic.com',
			'description'  => 'A user to test SSO',
		);
	}

	/**
	 * Return 1.
	 *
	 * @return int
	 */
	public function return_one() {
		return 1;
	}

	/**
	 * Test "sso_helpers_is_two_step_required_filter_true".
	 */
	public function test_sso_helpers_is_two_step_required_filter_true() {
		add_filter( 'jetpack_sso_require_two_step', '__return_true' );
		$this->assertTrue( Jetpack_SSO_Helpers::is_two_step_required() );
		remove_filter( 'jetpack_sso_require_two_step', '__return_true' );
	}

	/**
	 * Test "sso_helpers_is_two_step_required_filter_false".
	 */
	public function test_sso_helpers_is_two_step_required_filter_false() {
		add_filter( 'jetpack_sso_require_two_step', '__return_false' );
		$this->assertFalse( Jetpack_SSO_Helpers::is_two_step_required() );
		remove_filter( 'jetpack_sso_require_two_step', '__return_false' );
	}

	/**
	 * Test "sso_helpers_is_two_step_required_option_true".
	 */
	public function test_sso_helpers_is_two_step_required_option_true() {
		update_option( 'jetpack_sso_require_two_step', true );
		$this->assertTrue( Jetpack_SSO_Helpers::is_two_step_required() );
		delete_option( 'jetpack_sso_require_two_step' );
	}

	/**
	 * Test "sso_helpers_is_two_step_required_option_false".
	 */
	public function test_sso_helpers_is_two_step_required_option_false() {
		update_option( 'jetpack_sso_require_two_step', false );
		$this->assertFalse( Jetpack_SSO_Helpers::is_two_step_required() );
		delete_option( 'jetpack_sso_require_two_step' );
	}

	/**
	 * Test "sso_helpers_should_hide_login_form_filter_true".
	 */
	public function test_sso_helpers_should_hide_login_form_filter_true() {
		add_filter( 'jetpack_remove_login_form', '__return_true' );
		$this->assertTrue( Jetpack_SSO_Helpers::should_hide_login_form() );
		remove_filter( 'jetpack_remove_login_form', '__return_true' );
	}

	/**
	 * Test "sso_helpers_should_hide_login_form_filter_false".
	 */
	public function test_sso_helpers_should_hide_login_form_filter_false() {
		add_filter( 'jetpack_remove_login_form', '__return_false' );
		$this->assertFalse( Jetpack_SSO_Helpers::should_hide_login_form() );
		remove_filter( 'jetpack_remove_login_form', '__return_false' );
	}

	/**
	 * Test "sso_helpers_match_by_email_filter_true".
	 */
	public function test_sso_helpers_match_by_email_filter_true() {
		add_filter( 'jetpack_sso_match_by_email', '__return_true' );
		$this->assertTrue( Jetpack_SSO_Helpers::match_by_email() );
		remove_filter( 'jetpack_sso_match_by_email', '__return_true' );
	}

	/**
	 * Test "sso_helpers_match_by_email_filter_false".
	 */
	public function test_sso_helpers_match_by_email_filter_false() {
		add_filter( 'jetpack_sso_match_by_email', '__return_false' );
		$this->assertFalse( Jetpack_SSO_Helpers::match_by_email() );
		remove_filter( 'jetpack_sso_match_by_email', '__return_false' );
	}

	/**
	 * Test "sso_helpers_new_user_override_filter_true_returns_default_role".
	 */
	public function test_sso_helpers_new_user_override_filter_true_returns_default_role() {
		add_role( 'foo', 'Foo' );
		update_option( 'default_role', 'foo' );
		add_filter( 'jetpack_sso_new_user_override', '__return_true' );
		$this->assertEquals( 'foo', Jetpack_SSO_Helpers::new_user_override() );
		remove_filter( 'jetpack_sso_new_user_override', '__return_true' );
	}

	/**
	 * Test "sso_helpers_new_user_override_filter_false".
	 */
	public function test_sso_helpers_new_user_override_filter_false() {
		add_filter( 'jetpack_sso_new_user_override', '__return_false' );
		$this->assertFalse( Jetpack_SSO_Helpers::new_user_override() );
		remove_filter( 'jetpack_sso_new_user_override', '__return_false' );
	}

	/**
	 * Test "sso_helpers_new_user_override_filter_rolename".
	 */
	public function test_sso_helpers_new_user_override_filter_rolename() {
		add_filter( 'jetpack_sso_new_user_override', array( $this, 'return_administrator' ) );
		$this->assertEquals( 'administrator', Jetpack_SSO_Helpers::new_user_override() );
		remove_filter( 'jetpack_sso_new_user_override', array( $this, 'return_administrator' ) );
	}

	/**
	 * Test "sso_helpers_new_user_override_filter_bad_rolename_returns_default".
	 */
	public function test_sso_helpers_new_user_override_filter_bad_rolename_returns_default() {
		add_role( 'foo', 'Foo' );
		update_option( 'default_role', 'foo' );
		add_filter( 'jetpack_sso_new_user_override', array( $this, 'return_foobarbaz' ) );
		$this->assertEquals( 'foo', Jetpack_SSO_Helpers::new_user_override() );
		remove_filter( 'jetpack_sso_new_user_override', array( $this, 'return_foobarbaz' ) );
	}

	/**
	 * Test "sso_helpers_sso_bypass_default_login_form_filter_true".
	 */
	public function test_sso_helpers_sso_bypass_default_login_form_filter_true() {
		add_filter( 'jetpack_sso_bypass_login_forward_wpcom', '__return_true' );
		$this->assertTrue( Jetpack_SSO_Helpers::bypass_login_forward_wpcom() );
		remove_filter( 'jetpack_sso_bypass_login_forward_wpcom', '__return_true' );
	}

	/**
	 * Test "sso_helpers_sso_bypass_default_login_form_filter_false".
	 */
	public function test_sso_helpers_sso_bypass_default_login_form_filter_false() {
		add_filter( 'jetpack_sso_bypass_login_forward_wpcom', '__return_false' );
		$this->assertFalse( Jetpack_SSO_Helpers::bypass_login_forward_wpcom() );
		remove_filter( 'jetpack_sso_bypass_login_forward_wpcom', '__return_false' );
	}

	/**
	 * Test "sso_helpers_require_two_step_disabled".
	 */
	public function test_sso_helpers_require_two_step_disabled() {
		add_filter( 'jetpack_sso_require_two_step', '__return_true' );
		$this->assertTrue( Jetpack_SSO_Helpers::is_require_two_step_checkbox_disabled() );
		remove_filter( 'jetpack_sso_require_two_step', '__return_true' );
	}

	/**
	 * Test "sso_helpers_require_two_step_enabled".
	 */
	public function test_sso_helpers_require_two_step_enabled() {
		$this->assertFalse( Jetpack_SSO_Helpers::is_require_two_step_checkbox_disabled() );
	}

	/**
	 * Test "sso_helpers_match_by_email_disabled".
	 */
	public function test_sso_helpers_match_by_email_disabled() {
		add_filter( 'jetpack_sso_match_by_email', '__return_true' );
		$this->assertTrue( Jetpack_SSO_Helpers::is_match_by_email_checkbox_disabled() );
		remove_filter( 'jetpack_sso_match_by_email', '__return_true' );
	}

	/**
	 * Test "sso_helpers_match_by_email_enabled".
	 */
	public function test_sso_helpers_match_by_email_enabled() {
		$this->assertFalse( Jetpack_SSO_Helpers::is_match_by_email_checkbox_disabled() );
	}

	/**
	 * Test "allow_redirect_hosts_adds_default_hosts".
	 */
	public function test_allow_redirect_hosts_adds_default_hosts() {
		$hosts = Jetpack_SSO_Helpers::allowed_redirect_hosts( array( 'test.com' ) );
		$this->assertIsArray( $hosts );
		$this->assertContains( 'test.com', $hosts );
		$this->assertContains( 'wordpress.com', $hosts );
		$this->assertContains( 'jetpack.wordpress.com', $hosts );
	}

	/**
	 * Test "allowed_redirect_hosts_api_base_added".
	 */
	public function test_allowed_redirect_hosts_api_base_added() {
		$hosts = Jetpack_SSO_Helpers::allowed_redirect_hosts(
			array( 'test.com' ),
			'http://fakesite.com/jetpack.'
		);
		$this->assertIsArray( $hosts );
		$this->assertCount( 6, $hosts );
		$this->assertContains( 'fakesite.com', $hosts );
	}

	/**
	 * Test "allowed_redirect_hosts_api_base_added_on_dev_version".
	 */
	public function test_allowed_redirect_hosts_api_base_added_on_dev_version() {
		add_filter( 'jetpack_development_version', '__return_true' );
		$hosts = Jetpack_SSO_Helpers::allowed_redirect_hosts(
			array( 'test.com' ),
			'http://fakesite.com/jetpack.'
		);
		$this->assertIsArray( $hosts );
		$this->assertCount( 6, $hosts );
		$this->assertContains( 'fakesite.com', $hosts );
		remove_filter( 'jetpack_development_version', '__return_true' );
	}

	/**
	 * Test "generate_user_returns_user_when_username_not_exists".
	 */
	public function test_generate_user_returns_user_when_username_not_exists() {
		$user = Jetpack_SSO_Helpers::generate_user( $this->user_data );
		$this->assertIsObject( $user );
		$this->assertInstanceOf( 'WP_User', $user );

		wp_delete_user( $user->ID );
	}

	/**
	 * Test "generate_user_returns_user_if_username_exists_and_has_tries".
	 */
	public function test_generate_user_returns_user_if_username_exists_and_has_tries() {
		add_filter( 'jetpack_sso_allowed_username_generate_retries', array( $this, 'return_one' ) );
		self::factory()->user->create( array( 'user_login' => $this->user_data->login ) );

		$user = Jetpack_SSO_Helpers::generate_user( $this->user_data );

		$this->assertIsObject( $user );
		$this->assertInstanceOf( 'WP_User', $user );

		// If the username contains the user's ID, we know the username was generated with our random algo.
		$this->assertStringContainsString( (string) $this->user_data->ID, $user->user_login );

		wp_delete_user( $user->ID );
	}

	/**
	 * Test "generate_user_returns_false_when_no_more_tries_and_username_exists".
	 */
	public function test_generate_user_returns_false_when_no_more_tries_and_username_exists() {
		add_filter( 'jetpack_sso_allowed_username_generate_retries', '__return_zero' );
		self::factory()->user->create( array( 'user_login' => $this->user_data->login ) );
		$this->assertFalse( Jetpack_SSO_Helpers::generate_user( $this->user_data ) );
	}

	/**
	 * Test "generate_user_sets_user_role_when_provided".
	 */
	public function test_generate_user_sets_user_role_when_provided() {
		$this->user_data->role = 'administrator';
		$user                  = Jetpack_SSO_Helpers::generate_user( $this->user_data );
		$this->assertContains( 'administrator', get_userdata( $user->ID )->roles );
	}

	/**
	 * Test "extend_auth_cookie_casts_to_int".
	 */
	public function test_extend_auth_cookie_casts_to_int() {
		add_filter( 'jetpack_sso_auth_cookie_expiration', array( $this, 'return_string_value' ) );
		$this->assertSame( (int) $this->return_string_value(), Jetpack_SSO_Helpers::extend_auth_cookie_expiration_for_sso() );
		remove_filter( 'jetpack_sso_auth_cookie_expiration', array( $this, 'return_string_value' ) );
	}

	/**
	 * Test "extend_auth_cookie_default_value_greater_than_default".
	 */
	public function test_extend_auth_cookie_default_value_greater_than_default() {
		$this->assertGreaterThan( 2 * DAY_IN_SECONDS, Jetpack_SSO_Helpers::extend_auth_cookie_expiration_for_sso() );
	}

	/**
	 * Test "display_sso_form_for_action".
	 */
	public function test_display_sso_form_for_action() {
		// Let's test the default cases.
		$this->assertTrue( Jetpack_SSO_Helpers::display_sso_form_for_action( 'login' ) );
		$this->assertTrue( Jetpack_SSO_Helpers::display_sso_form_for_action( 'jetpack_json_api_authorization' ) );
		$this->assertFalse( Jetpack_SSO_Helpers::display_sso_form_for_action( 'hello_world' ) );

		add_filter( 'jetpack_sso_allowed_actions', array( $this, 'allow_hello_world_login_action_for_sso' ) );
		$this->assertTrue( Jetpack_SSO_Helpers::display_sso_form_for_action( 'hello_world' ) );
		remove_filter( 'jetpack_sso_allowed_actions', array( $this, 'allow_hello_world_login_action_for_sso' ) );
	}

	/**
	 * Test "get_json_api_auth_environment".
	 */
	public function test_get_json_api_auth_environment() {
		// With no cookie returns false.
		$_COOKIE['jetpack_sso_original_request'] = '';
		$this->assertFalse( Jetpack_SSO_Helpers::get_json_api_auth_environment() );

		// With empty query, returns false.
		$_COOKIE['jetpack_sso_original_request'] = 'http://website.com';
		$this->assertFalse( Jetpack_SSO_Helpers::get_json_api_auth_environment() );

		// With empty no action query argument, returns false.
		$_COOKIE['jetpack_sso_original_request'] = 'http://website.com?hello=world';
		$this->assertFalse( Jetpack_SSO_Helpers::get_json_api_auth_environment() );

		// When action is not for JSON API auth, return false.
		$_COOKIE['jetpack_sso_original_request'] = 'http://website.com?action=loggedout';
		$this->assertFalse( Jetpack_SSO_Helpers::get_json_api_auth_environment() );

		// If we pass the other tests, then let's make sure we get the right information back.
		$original_request                        = 'http://website.com/wp-login.php?action=jetpack_json_api_authorization&token=my-token';
		$_COOKIE['jetpack_sso_original_request'] = $original_request;
		$environment                             = Jetpack_SSO_Helpers::get_json_api_auth_environment();
		$this->assertIsArray( $environment );
		$this->assertSame(
			$environment,
			array(
				'action'                          => 'jetpack_json_api_authorization',
				'token'                           => 'my-token',
				'jetpack_json_api_original_query' => $original_request,
			)
		);
	}

	/**
	 * Test the `get_custom_login_url()` helper.
	 */
	public function test_get_custom_login_url() {
		$login_url_default = Jetpack_SSO_Helpers::get_custom_login_url();

		$custom_url_expected = 'test-login-url/';

		$custom_url_filter = function ( $login_url ) use ( $custom_url_expected ) {
			return str_replace( 'wp-login.php', $custom_url_expected, $login_url );
		};
		add_filter( 'login_url', $custom_url_filter );
		$login_url_custom = Jetpack_SSO_Helpers::get_custom_login_url();

		static::assertNull( $login_url_default );
		static::assertEquals( $custom_url_expected, $login_url_custom );
	}

	/**
	 * Return string '1'.
	 *
	 * @return string
	 */
	public function return_string_value() {
		return '1';
	}

	/**
	 * Return "administrator".
	 *
	 * @return string
	 */
	public function return_administrator() {
		return 'administrator';
	}

	/**
	 * Return "foobarbaz".
	 *
	 * @return string
	 */
	public function return_foobarbaz() {
		return 'foobarbaz';
	}

	/**
	 * Add "hello_world" action.
	 *
	 * @param array $actions Actions.
	 * @return array
	 */
	public function allow_hello_world_login_action_for_sso( $actions ) {
		$actions[] = 'hello_world';
		return $actions;
	}
}
