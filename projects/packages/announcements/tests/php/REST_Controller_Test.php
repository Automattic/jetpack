<?php
/**
 * Tests for the announcements REST routes.
 *
 * @package automattic/jetpack-announcements
 */

namespace Automattic\Jetpack\Announcements;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;
use WorDBless\Users as WorDBless_Users;
use WP_REST_Request;
use WP_REST_Response;

/**
 * @covers \Automattic\Jetpack\Announcements\REST_Controller
 */
#[CoversClass( REST_Controller::class )]
class REST_Controller_Test extends BaseTestCase {

	const ROUTE = '/wpcom/v2/jetpack-announcements';

	/**
	 * Administrator id.
	 *
	 * @var int
	 */
	private $admin_id;

	/**
	 * Subscriber id.
	 *
	 * @var int
	 */
	private $subscriber_id;

	/**
	 * Serve the routes over two announcements, one of them for administrators only.
	 */
	public function set_up() {
		global $wp_rest_server;
		$wp_rest_server = new \WP_REST_Server();
		add_action( 'rest_api_init', array( REST_Controller::class, 'register_rest_routes' ) );
		do_action( 'rest_api_init', $wp_rest_server );

		add_action(
			Announcement_Registry::REGISTER_ACTION,
			static function () {
				register_announcement(
					'my-plugin/for-everyone',
					array(
						'date'     => '2026-11-20',
						'title'    => 'For everyone',
						'excerpt'  => 'A summary.',
						'content'  => '<p>A body.</p>',
						'channels' => array( 'my-plugin' ),
					)
				);
				register_announcement(
					'my-plugin/for-administrators',
					array(
						'date'       => '2026-11-21',
						'title'      => 'For administrators',
						'channels'   => array( 'my-plugin' ),
						'capability' => 'manage_options',
					)
				);
			}
		);

		$this->admin_id      = wp_insert_user(
			array(
				'user_login' => 'an_admin',
				'user_pass'  => 'password',
				'role'       => 'administrator',
			)
		);
		$this->subscriber_id = wp_insert_user(
			array(
				'user_login' => 'a_subscriber',
				'user_pass'  => 'password',
				'role'       => 'subscriber',
			)
		);
	}

	/**
	 * Drop the server, the registrant, the main instance and the users.
	 */
	public function tear_down() {
		global $wp_rest_server;
		$wp_rest_server = null;
		remove_all_actions( 'rest_api_init' );
		remove_all_actions( Announcement_Registry::REGISTER_ACTION );

		$instance = new \ReflectionProperty( Announcement_Registry::class, 'instance' );
		if ( PHP_VERSION_ID < 80100 ) {
			$instance->setAccessible( true );
		}
		$instance->setValue( null, null );

		wp_set_current_user( 0 );
		WorDBless_Users::init()->clear_all_users();
	}

	/**
	 * Read from the announcements routes.
	 *
	 * @param string $id Announcement id, or an empty string for the collection.
	 * @return WP_REST_Response
	 */
	private function request( $id = '' ) {
		return rest_do_request( new WP_REST_Request( 'GET', self::ROUTE . ( '' === $id ? '' : '/' . $id ) ) );
	}

	public function test_refuses_a_logged_out_request() {
		$this->assertSame( 401, $this->request()->get_status() );
		$this->assertSame( 401, $this->request( 'my-plugin/for-everyone' )->get_status() );
	}

	public function test_lists_the_records_a_user_may_see_without_their_capability() {
		wp_set_current_user( $this->subscriber_id );
		$for_subscriber = $this->request()->get_data();

		wp_set_current_user( $this->admin_id );
		$for_admin = $this->request()->get_data();

		$this->assertSame(
			array(
				array(
					'id'       => 'my-plugin/for-everyone',
					'date'     => '2026-11-20T00:00:00+00:00',
					'title'    => 'For everyone',
					'excerpt'  => 'A summary.',
					'content'  => '<p>A body.</p>',
					'media'    => null,
					'link'     => '',
					'channels' => array( 'my-plugin' ),
				),
			),
			$for_subscriber
		);
		$this->assertSame( array( 'my-plugin/for-everyone', 'my-plugin/for-administrators' ), array_column( $for_admin, 'id' ) );
		$this->assertArrayNotHasKey( 'capability', $for_admin[1] );
	}

	/**
	 * @dataProvider provide_item_reads
	 *
	 * @param string $id     Announcement id.
	 * @param int    $status Expected status.
	 */
	#[DataProvider( 'provide_item_reads' )]
	public function test_serves_one_announcement_to_a_subscriber_who_may_see_it( $id, $status ) {
		wp_set_current_user( $this->subscriber_id );

		$this->assertSame( $status, $this->request( $id )->get_status() );
	}

	public static function provide_item_reads() {
		return array(
			'one for everyone'              => array( 'my-plugin/for-everyone', 200 ),
			'an unknown announcement'       => array( 'my-plugin/unknown', 404 ),
			'one the user is not shown'     => array( 'my-plugin/for-administrators', 404 ),
			'an id the route does not take' => array( 'my-plugin', 404 ),
		);
	}
}
