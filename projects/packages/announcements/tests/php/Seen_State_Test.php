<?php
/**
 * Tests for the seen state.
 *
 * @package automattic/jetpack-announcements
 */

namespace Automattic\Jetpack\Announcements;

use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;
use WorDBless\Users as WorDBless_Users;

/**
 * @covers \Automattic\Jetpack\Announcements\Seen_State
 */
#[CoversClass( Seen_State::class )]
class Seen_State_Test extends BaseTestCase {

	/**
	 * A user to keep state for.
	 *
	 * @var int
	 */
	private $user_id;

	/**
	 * Create the user.
	 */
	public function set_up() {
		$this->user_id = wp_insert_user(
			array(
				'user_login' => 'reader',
				'user_pass'  => 'password',
				'role'       => 'subscriber',
			)
		);
	}

	/**
	 * Drop the user and its meta.
	 */
	public function tear_down() {
		WorDBless_Users::init()->clear_all_users();
	}

	public function test_marks_and_unmarks_an_announcement() {
		Seen_State::set( $this->user_id, 'a/first', true );
		Seen_State::set( $this->user_id, 'a/second', true );
		Seen_State::set( $this->user_id, 'a/first', false );

		$this->assertSame( array( 'a/second' ), Seen_State::get_ids( $this->user_id ) );
	}

	public function test_past_the_cap_drops_the_ids_seen_longest_ago() {
		for ( $i = 0; $i <= Seen_State::MAX_IDS; $i++ ) {
			Seen_State::set( $this->user_id, 'a/' . $i, true );
		}
		// Seen again, so it is the most recent one when the next id arrives.
		Seen_State::set( $this->user_id, 'a/1', true );
		Seen_State::set( $this->user_id, 'a/last', true );

		$ids = Seen_State::get_ids( $this->user_id );

		$this->assertCount( Seen_State::MAX_IDS, $ids );
		$this->assertNotContains( 'a/0', $ids );
		$this->assertNotContains( 'a/2', $ids );
		$this->assertSame( array( 'a/1', 'a/last' ), array_slice( $ids, -2 ) );
	}
}
