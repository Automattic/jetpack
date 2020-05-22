<?php

namespace Automattic\Jetpack;

use Automattic\Jetpack\Roles;
use PHPUnit\Framework\TestCase;
use phpmock\Mock;
use phpmock\MockBuilder;

class Test_Roles extends TestCase {
	/**
	 * Test setup.
	 */
	public function setUp() {
		$this->roles = new Roles();
	}

	/**
	 * Test teardown.
	 */
	public function tearDown() {
		Mock::disableAll();
	}

	/**
	 * @covers Automattic\Jetpack\Roles::translate_current_user_to_role
	 */
	public function test_current_user_to_role_with_role() {
		$this->mock_function( 'current_user_can', true, 'administrator' );
		
		$this->assertEquals( 'administrator', $this->roles->translate_current_user_to_role() );
	}

	/**
	 * @covers Automattic\Jetpack\Roles::translate_current_user_to_role
	 */
	public function test_current_user_to_role_with_capability() {
		$this->mock_function( 'current_user_can', true, 'edit_others_posts' );
		
		$this->assertEquals( 'editor', $this->roles->translate_current_user_to_role() );
	}

	/**
	 * @covers Automattic\Jetpack\Roles::translate_current_user_to_role
	 */
	public function test_current_user_to_role_with_no_match() {
		$this->mock_function( 'current_user_can', false );
		
		$this->assertEquals( false, $this->roles->translate_current_user_to_role() );
	}

	/**
	 * @covers Automattic\Jetpack\Roles::translate_user_to_role
	 */
	public function test_user_to_role_with_role() {
		$user_mock = $this->getMockBuilder( 'WP_User' )->getMock();
		$this->mock_function( 'user_can', true, $user_mock, 'administrator' );
		
		$this->assertEquals( 'administrator', $this->roles->translate_user_to_role( $user_mock ) );
	}

	/**
	 * @covers Automattic\Jetpack\Roles::translate_user_to_role
	 */
	public function test_user_to_role_with_capability() {
		$user_mock = $this->getMockBuilder( 'WP_User' )->getMock();
		$this->mock_function( 'user_can', true, $user_mock, 'edit_others_posts' );
		
		$this->assertEquals( 'editor', $this->roles->translate_user_to_role( $user_mock ) );
	}

	/**
	 * @covers Automattic\Jetpack\Roles::translate_user_to_role
	 */
	public function test_user_to_role_with_no_match() {
		$user_mock = $this->getMockBuilder( 'WP_User' )->getMock();
		$this->mock_function( 'user_can', false );
		
		$this->assertEquals( false, $this->roles->translate_user_to_role( $user_mock ) );
	}

	/**
	 * @covers Automattic\Jetpack\Roles::translate_role_to_cap
	 */
	public function test_role_to_cap_existing_role() {
		$this->assertEquals( 'edit_others_posts', $this->roles->translate_role_to_cap( 'editor' ) );
	}

	/**
	 * @covers Automattic\Jetpack\Roles::translate_role_to_cap
	 */
	public function test_role_to_cap_non_existing_role() {
		$this->assertEquals( false, $this->roles->translate_role_to_cap( 'follower' ) );
	}

	/**
	 * Mock a global function and make it return a certain value.
	 * Optionally can limit the mock to invocations with certain arguments.
	 *
	 * @param string $function_name Name of the function.
	 * @param mixed  $return_value  Return value of the function.
	 * @param mixed  $arg_1_value   Value of the first argument value we expect.
	 * @param mixed  $arg_2_value   Value of the second argument value we expect.
	 * @return phpmock\Mock The mock object.
	 */
	protected function mock_function( $function_name, $return_value = null, $arg_1_value = null, $arg_2_value = null ) {
		$builder = new MockBuilder();
		$builder->setNamespace( __NAMESPACE__ )
			->setName( $function_name )
			->setFunction( function( $arg_1, $arg_2 = null ) use ( &$return_value, &$arg_1_value, &$arg_2_value ) {
				// Return the value if we don't care about arguments.
				if ( is_null( $arg_1 ) && is_null( $arg_2 ) ) {
					return $return_value;
				}

				// Return the value if we don't care about the second argument, but the first one matches.
				if ( is_null( $arg_2 ) && $arg_1_value === $arg_1 ) {
					return $return_value;
				}

				// Return the value if both arguments match.
				if ( $arg_1_value === $arg_1 && $arg_2_value === $arg_2 ) {
					return $return_value;
				}
			} );
		return $builder->build()->enable();
	}
}
