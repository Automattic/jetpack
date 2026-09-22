<?php
/**
 * Tests for Server_Assignment.
 *
 * @package automattic/jetpack-explat
 */

require_once __DIR__ . '/class-scripted-server-assignment.php';

/**
 * Class Server_Assignment_Test
 */
class Server_Assignment_Test extends \WorDBless\BaseTestCase {

	const EXPERIMENT = 'jetpack_explat_server_assignment_test';

	/**
	 * @var int
	 */
	private $user_id;

	public function set_up() {
		parent::set_up();

		$this->user_id = wp_insert_user(
			array(
				'user_login' => 'explat_user',
				'user_pass'  => 'password',
				'user_email' => 'explat_user@example.com',
				'role'       => 'administrator',
			)
		);
		wp_set_current_user( $this->user_id );

		Scripted_Server_Assignment::$answers = array();
		Scripted_Server_Assignment::$calls   = 0;
	}

	public function tear_down() {
		delete_transient( 'jetpack-explat-wpcom-' . $this->user_id . '-' . md5( self::EXPERIMENT ) );
		delete_transient( 'jetpack-explat-calypso-' . $this->user_id . '-' . md5( self::EXPERIMENT ) );
		wp_set_current_user( 0 );
		parent::tear_down();
	}

	public function test_a_resolved_variation_is_returned_and_cached() {
		Scripted_Server_Assignment::$answers = array( 'treatment' );

		$first  = Scripted_Server_Assignment::get_variation( self::EXPERIMENT );
		$second = Scripted_Server_Assignment::get_variation( self::EXPERIMENT );

		$this->assertSame( 'treatment', $first );
		$this->assertSame( 'treatment', $second );
		$this->assertSame( 1, Scripted_Server_Assignment::$calls );
	}

	public function test_the_control_is_cached_too() {
		Scripted_Server_Assignment::$answers = array( 'control' );

		$first  = Scripted_Server_Assignment::get_variation( self::EXPERIMENT );
		$second = Scripted_Server_Assignment::get_variation( self::EXPERIMENT );

		$this->assertSame( 'control', $first );
		$this->assertSame( 'control', $second );
		$this->assertSame( 1, Scripted_Server_Assignment::$calls );
	}

	public function test_an_unanswered_lookup_is_not_cached() {
		Scripted_Server_Assignment::$answers = array( null, 'treatment' );

		$this->assertNull( Scripted_Server_Assignment::get_variation( self::EXPERIMENT ) );
		$this->assertSame( 'treatment', Scripted_Server_Assignment::get_variation( self::EXPERIMENT ) );
		$this->assertSame( 2, Scripted_Server_Assignment::$calls );
	}

	public function test_logged_out_visitors_are_never_assigned() {
		wp_set_current_user( 0 );
		Scripted_Server_Assignment::$answers = array( 'treatment' );

		$this->assertNull( Scripted_Server_Assignment::get_variation( self::EXPERIMENT ) );
		$this->assertSame( 0, Scripted_Server_Assignment::$calls );
	}

	public function test_each_platform_is_cached_separately() {
		Scripted_Server_Assignment::$answers = array( 'treatment', 'control' );

		$wpcom   = Scripted_Server_Assignment::get_variation( self::EXPERIMENT );
		$calypso = Scripted_Server_Assignment::get_variation( self::EXPERIMENT, array( 'platform' => 'calypso' ) );

		$this->assertSame( 'treatment', $wpcom );
		$this->assertSame( 'control', $calypso );
	}
}
