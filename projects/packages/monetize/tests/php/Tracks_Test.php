<?php
/**
 * Tests for the dashboard's Tracks setup.
 *
 * @package automattic/jetpack-monetize
 */

namespace Automattic\Jetpack\Monetize;

use Jetpack_Options;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;

/**
 * @covers \Automattic\Jetpack\Monetize\Tracks
 */
#[CoversClass( Tracks::class )]
class Tracks_Test extends BaseTestCase {

	/**
	 * Leave no query arg, option or script behind.
	 */
	public function tear_down() {
		unset( $_GET['page'] );
		Jetpack_Options::delete_option( 'tos_agreed' );
		wp_dequeue_script( 'jp-tracks' );
		parent::tear_down();
	}

	public function test_loads_on_the_dashboard_only_with_consent() {
		$_GET['page'] = Dashboard::MENU_SLUG;

		Tracks::enqueue_transport();
		$this->assertFalse( wp_script_is( 'jp-tracks', 'enqueued' ) );
		$this->assertFalse( Tracks::is_allowed() );

		Jetpack_Options::update_option( 'tos_agreed', true );
		Tracks::enqueue_transport();
		$this->assertTrue( wp_script_is( 'jp-tracks', 'enqueued' ) );
		$this->assertTrue( Tracks::is_allowed() );
	}

	/**
	 * Whether the user is connected, the WordPress.com user already in the script data, and what it should become.
	 *
	 * @return array[]
	 */
	public static function provide_identities() {
		$set_by_another_package = array(
			'ID'    => 5,
			'login' => 'other',
		);
		return array(
			'already set by another package' => array( true, $set_by_another_package, $set_by_another_package ),
			'no connected user'              => array( false, array( 'avatar' => 'a.png' ), array( 'avatar' => 'a.png' ) ),
			'connected user'                 => array(
				true,
				array( 'avatar' => 'a.png' ),
				array(
					'avatar' => 'a.png',
					'ID'     => 7,
					'login'  => 'wpcomuser',
				),
			),
		);
	}

	/**
	 * @dataProvider provide_identities
	 *
	 * @param bool  $connected Whether the current user is connected to WordPress.com.
	 * @param array $wpcom     The WordPress.com user already in the script data.
	 * @param array $expected  The WordPress.com user in the returned script data.
	 */
	#[DataProvider( 'provide_identities' )]
	public function test_add_identity_fills_in_only_a_missing_user( $connected, $wpcom, $expected ) {
		$user_id = wp_insert_user(
			array(
				'user_login' => 'admin',
				'user_pass'  => 'pass',
				'role'       => 'administrator',
			)
		);
		wp_set_current_user( $user_id );
		if ( $connected ) {
			Jetpack_Options::update_option( 'blog_token', 'blog.secret' );
			Jetpack_Options::update_option( 'user_tokens', array( $user_id => 'token.secret.' . $user_id ) );
			set_transient(
				"jetpack_connected_user_data_$user_id",
				array(
					'ID'    => 7,
					'login' => 'wpcomuser',
				)
			);
		}

		$data = Tracks::add_identity( array( 'user' => array( 'current_user' => array( 'wpcom' => $wpcom ) ) ) );

		$this->assertSame( $expected, $data['user']['current_user']['wpcom'] );
	}
}
