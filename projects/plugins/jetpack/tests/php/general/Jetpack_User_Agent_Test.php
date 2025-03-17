<?php
/**
 * Tests for Jetpack's legacy User Agent class.
 *
 * @package automattic/jetpack
 */

/**
 * Class Jetpack_User_Agent_Test
 */
class Jetpack_User_Agent_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Confirm an old improper static use of Jetpack_User_Agent_Info still functions.
	 */
	public function test_jetpack_user_agent_is_tablet() {
		$this->setExpectedDeprecated( 'Jetpack_User_Agent_Info::is_tablet' );
		$this->assertFalse( Jetpack_User_Agent_Info::is_tablet() );
	}

	/**
	 * Confirm an old improper static use of Jetpack_User_Agent_Info still functions.
	 */
	public function test_jetpack_user_agent_is_iphoneOrIpod() {
		$this->setExpectedDeprecated( 'Jetpack_User_Agent_Info::is_iphoneOrIpod' );
		$this->assertFalse( Jetpack_User_Agent_Info::is_iphoneOrIpod() );
	}
}
