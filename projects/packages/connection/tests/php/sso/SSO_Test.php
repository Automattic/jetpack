<?php
/**
 * Testing functions in Automattic\Jetpack\Connection\SSO class.
 *
 * @package automattic/jetpack-connection
 */

namespace Automattic\Jetpack\Connection\SSO;

use Automattic\Jetpack\Connection\SSO;
use WorDBless\BaseTestCase;

class SSO_Test extends BaseTestCase {

	/**
	 * Reset the static property after each test.
	 */
	public function tear_down() {
		$ref = new \ReflectionProperty( SSO::class, 'sso_user_for_2fa' );
		$ref->setValue( null, null );

		parent::tear_down();
	}

	/**
	 * Helper to create a WP user and return the WP_User object.
	 *
	 * @return \WP_User
	 */
	private function create_test_user() {
		$user_id = wp_insert_user(
			array(
				'user_login' => 'sso_test_' . wp_generate_password( 6, false ),
				'user_pass'  => wp_generate_password(),
				'user_email' => 'sso_test_' . wp_generate_password( 6, false ) . '@example.com',
			)
		);
		return get_userdata( $user_id );
	}

	/**
	 * Helper to set the private static $sso_user_for_2fa property.
	 *
	 * @param \WP_User|null $user User to set.
	 */
	private function set_sso_user_for_2fa( $user ) {
		$ref = new \ReflectionProperty( SSO::class, 'sso_user_for_2fa' );
		$ref->setValue( null, $user );
	}

	/**
	 * Helper to get the private static $sso_user_for_2fa property.
	 *
	 * @return \WP_User|null
	 */
	private function get_sso_user_for_2fa() {
		$ref = new \ReflectionProperty( SSO::class, 'sso_user_for_2fa' );
		return $ref->getValue();
	}

	/**
	 * Test that session is tagged with two-factor-login when user ID matches.
	 */
	public function test_add_two_factor_session_meta_tags_session_for_matching_user() {
		$user    = $this->create_test_user();
		$session = array( 'expiration' => time() + 3600 );

		$this->set_sso_user_for_2fa( $user );
		$result = SSO::add_two_factor_session_meta( $session, $user->ID );

		$this->assertArrayHasKey( 'two-factor-login', $result );
		$this->assertIsInt( $result['two-factor-login'] );
	}

	/**
	 * Test that the stored user is cleared after tagging (one-shot).
	 */
	public function test_add_two_factor_session_meta_clears_stored_user() {
		$user    = $this->create_test_user();
		$session = array();

		$this->set_sso_user_for_2fa( $user );
		SSO::add_two_factor_session_meta( $session, $user->ID );

		$this->assertNull( $this->get_sso_user_for_2fa() );
	}

	/**
	 * Test that session is unchanged when user ID does not match.
	 */
	public function test_add_two_factor_session_meta_skips_non_matching_user() {
		$user    = $this->create_test_user();
		$session = array( 'expiration' => time() + 3600 );

		$this->set_sso_user_for_2fa( $user );
		$result = SSO::add_two_factor_session_meta( $session, $user->ID + 999 );

		$this->assertArrayNotHasKey( 'two-factor-login', $result );
		$this->assertNotNull( $this->get_sso_user_for_2fa() );
	}

	/**
	 * Test that session is unchanged when no SSO user is stored.
	 */
	public function test_add_two_factor_session_meta_noop_when_no_user_stored() {
		$session = array( 'expiration' => time() + 3600 );
		$result  = SSO::add_two_factor_session_meta( $session, 1 );

		$this->assertArrayNotHasKey( 'two-factor-login', $result );
		$this->assertEquals( $session, $result );
	}
}
