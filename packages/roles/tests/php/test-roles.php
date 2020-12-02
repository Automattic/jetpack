<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Tests the Roles package/
 *
 * @package automattic/jetpack-roles
 */

namespace Automattic\Jetpack;

use Brain\Monkey;
use Brain\Monkey\Functions;
use Mockery\Adapter\Phpunit\MockeryPHPUnitIntegration;
use PHPUnit\Framework\TestCase;

/**
 * Class Test_Roles
 *
 * @package Automattic\Jetpack
 */
class Test_Roles extends TestCase {
	use MockeryPHPUnitIntegration;

	/**
	 * Test setup.
	 *
	 * @before
	 */
	public function set_up() {
		Monkey\setUp();
		$this->roles = new Roles();
	}

	/**
	 * Test teardown.
	 *
	 * @after
	 */
	public function tear_down() {
		Monkey\tearDown();
	}

	/**
	 * Tests the current user by role.
	 *
	 * @covers Automattic\Jetpack\Roles::translate_current_user_to_role
	 */
	public function test_current_user_to_role_with_role() {
		Functions\when( 'current_user_can' )->alias(
			function ( $cap ) {
				return 'administrator' === $cap;
			}
		);

		$this->assertEquals( 'administrator', $this->roles->translate_current_user_to_role() );
	}

	/**
	 * Tests the current user by capability.
	 *
	 * @covers Automattic\Jetpack\Roles::translate_current_user_to_role
	 */
	public function test_current_user_to_role_with_capability() {
		Functions\when( 'current_user_can' )->alias(
			function ( $cap ) {
				return 'edit_others_posts' === $cap;
			}
		);

		$this->assertTrue( current_user_can( 'edit_others_posts' ) );
		$this->assertFalse( current_user_can( 'foobar' ) );
		$this->assertFalse( current_user_can( 'administrator' ) );

		$this->assertEquals( 'editor', $this->roles->translate_current_user_to_role() );
	}

	/**
	 * Test current user with no match.
	 *
	 * @covers Automattic\Jetpack\Roles::translate_current_user_to_role
	 */
	public function test_current_user_to_role_with_no_match() {
		Functions\when( 'current_user_can' )->justReturn( false );

		$this->assertFalse( $this->roles->translate_current_user_to_role() );
	}

	/**
	 * Test translating an user to a role by role.
	 *
	 * @covers Automattic\Jetpack\Roles::translate_user_to_role
	 */
	public function test_user_to_role_with_role() {
		$user_mock = $this->getMockBuilder( 'WP_User' )->getMock();
		Functions\when( 'user_can' )->alias(
			function ( $user, $cap ) use ( $user_mock ) {
				return $user_mock === $user && 'administrator' === $cap;
			}
		);

		$this->assertEquals( 'administrator', $this->roles->translate_user_to_role( $user_mock ) );
	}

	/**
	 * Test translating an user to a role by capablity.
	 *
	 * @covers Automattic\Jetpack\Roles::translate_user_to_role
	 */
	public function test_user_to_role_with_capability() {
		$user_mock = $this->getMockBuilder( 'WP_User' )->getMock();
		Functions\when( 'user_can' )->alias(
			function ( $user, $cap ) use ( $user_mock ) {
				return $user_mock === $user && 'edit_others_posts' === $cap;
			}
		);

		$this->assertEquals( 'editor', $this->roles->translate_user_to_role( $user_mock ) );
	}

	/**
	 * Test translating an user to a role with no match.
	 *
	 * @covers Automattic\Jetpack\Roles::translate_user_to_role
	 */
	public function test_user_to_role_with_no_match() {
		$user_mock = $this->getMockBuilder( 'WP_User' )->getMock();
		Functions\when( 'user_can' )->justReturn( false );

		$this->assertFalse( $this->roles->translate_user_to_role( $user_mock ) );
	}

	/**
	 * Test translating a role to a cap with an existing role.
	 *
	 * @covers Automattic\Jetpack\Roles::translate_role_to_cap
	 */
	public function test_role_to_cap_existing_role() {
		$this->assertEquals( 'edit_others_posts', $this->roles->translate_role_to_cap( 'editor' ) );
	}

	/**
	 * Test translating a role to a cap with a non-existing role.
	 *
	 * @covers Automattic\Jetpack\Roles::translate_role_to_cap
	 */
	public function test_role_to_cap_non_existing_role() {
		$this->assertFalse( $this->roles->translate_role_to_cap( 'follower' ) );
	}

}
