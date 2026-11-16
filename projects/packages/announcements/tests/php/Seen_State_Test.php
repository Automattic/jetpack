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

		$this->assertSame( array( 'a/second' ), array_keys( Seen_State::get_dates( $this->user_id ) ) );
	}

	public function test_stores_when_an_announcement_was_seen() {
		$before = time();
		Seen_State::set( $this->user_id, 'a/first', true );

		$date = Seen_State::get_dates( $this->user_id )['a/first'];

		$this->assertGreaterThanOrEqual( $before, $date );
		$this->assertLessThanOrEqual( time(), $date );
	}

	public function test_marking_again_keeps_the_date_it_was_first_seen() {
		update_user_meta( $this->user_id, Seen_State::META_KEY, array( 'a/first' => 1000 ) );

		Seen_State::set( $this->user_id, 'a/first', true );

		$this->assertSame( array( 'a/first' => 1000 ), Seen_State::get_dates( $this->user_id ) );
	}

	public function test_ignores_stored_entries_that_are_no_date_by_id() {
		update_user_meta(
			$this->user_id,
			Seen_State::META_KEY,
			array(
				0           => 'a/no-key',
				'a/no-date' => 'yesterday',
				'a/first'   => 1000,
			)
		);

		$this->assertSame( array( 'a/first' => 1000 ), Seen_State::get_dates( $this->user_id ) );
	}

	public function test_past_the_cap_drops_the_ids_seen_longest_ago() {
		for ( $i = 0; $i <= Seen_State::MAX_IDS; $i++ ) {
			Seen_State::set( $this->user_id, 'a/' . $i, true );
		}

		$ids = array_keys( Seen_State::get_dates( $this->user_id ) );

		$this->assertCount( Seen_State::MAX_IDS, $ids );
		$this->assertNotContains( 'a/0', $ids );
		$this->assertSame( 'a/' . Seen_State::MAX_IDS, end( $ids ) );
	}
}
