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
				'user_login'      => 'an_admin',
				'user_pass'       => 'password',
				'role'            => 'administrator',
				'user_registered' => '2026-01-01 00:00:00',
			)
		);
		$this->subscriber_id = wp_insert_user(
			array(
				'user_login'      => 'a_subscriber',
				'user_pass'       => 'password',
				'role'            => 'subscriber',
				'user_registered' => '2026-01-01 00:00:00',
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
	 * Send a request to the announcements routes.
	 *
	 * @param string     $method HTTP method.
	 * @param string     $id     Announcement id, or an empty string for the collection.
	 * @param array|null $body   JSON body.
	 * @return WP_REST_Response
	 */
	private function request( $method, $id = '', $body = null ) {
		$request = new WP_REST_Request( $method, self::ROUTE . ( '' === $id ? '' : '/' . $id ) );
		if ( null !== $body ) {
			$request->set_header( 'content-type', 'application/json' );
			$request->set_body( (string) wp_json_encode( $body, JSON_UNESCAPED_SLASHES ) );
		}

		return rest_do_request( $request );
	}

	public function test_refuses_a_logged_out_request() {
		$this->assertSame( 401, $this->request( 'GET' )->get_status() );
		$this->assertSame( 401, $this->request( 'PUT', 'my-plugin/for-everyone', array( 'seen' => true ) )->get_status() );
	}

	public function test_lists_the_records_a_user_may_see_without_their_capability() {
		wp_set_current_user( $this->subscriber_id );
		$for_subscriber = $this->request( 'GET' )->get_data();

		wp_set_current_user( $this->admin_id );
		$for_admin = $this->request( 'GET' )->get_data();

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
					'seen'     => false,
					'seen_at'  => null,
				),
			),
			$for_subscriber
		);
		$this->assertSame( array( 'my-plugin/for-everyone', 'my-plugin/for-administrators' ), array_column( $for_admin, 'id' ) );
		$this->assertArrayNotHasKey( 'capability', $for_admin[1] );
	}

	public function test_a_write_marks_the_announcement_of_the_url_seen_for_that_user_only() {
		wp_set_current_user( $this->admin_id );

		// core-data sends the record id in the body too. The URL names the announcement.
		$response = $this->request(
			'PUT',
			'my-plugin/for-everyone',
			array(
				'id'   => 'my-plugin/for-administrators',
				'seen' => true,
			)
		);

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( 'my-plugin/for-everyone', $response->get_data()['id'] );
		$this->assertTrue( $response->get_data()['seen'] );
		$this->assertNotNull( $response->get_data()['seen_at'] );
		$this->assertSame( 'For everyone', $response->get_data()['title'] );
		$this->assertSame( array( true, false ), array_column( $this->request( 'GET' )->get_data(), 'seen' ) );

		wp_set_current_user( $this->subscriber_id );
		$this->assertFalse( $this->request( 'GET', 'my-plugin/for-everyone' )->get_data()['seen'] );
	}

	public function test_serves_the_date_an_announcement_was_seen_as_gmt() {
		update_user_meta( $this->admin_id, Seen_State::META_KEY, array( 'my-plugin/for-everyone' => 1700000000 ) );
		wp_set_current_user( $this->admin_id );

		$record = $this->request( 'GET', 'my-plugin/for-everyone' )->get_data();

		$this->assertTrue( $record['seen'] );
		$this->assertSame( '2023-11-14T22:13:20+00:00', $record['seen_at'] );
	}

	public function test_serves_an_announcement_older_than_the_user_as_seen() {
		wp_set_current_user(
			wp_insert_user(
				array(
					'user_login'      => 'a_newcomer',
					'user_pass'       => 'password',
					'role'            => 'administrator',
					'user_registered' => '2026-11-20 12:00:00',
				)
			)
		);

		$records = $this->request( 'GET' )->get_data();

		$this->assertSame( array( true, false ), array_column( $records, 'seen' ) );
		$this->assertNull( $records[0]['seen_at'] );
	}

	/**
	 * @dataProvider provide_refused_writes
	 *
	 * @param string $id     Announcement id.
	 * @param array  $body   JSON body.
	 * @param int    $status Expected status.
	 */
	#[DataProvider( 'provide_refused_writes' )]
	public function test_refuses_a_write_from_a_subscriber( $id, $body, $status ) {
		wp_set_current_user( $this->subscriber_id );

		$this->assertSame( $status, $this->request( 'PUT', $id, $body )->get_status() );
		$this->assertSame( array(), Seen_State::get_dates( $this->subscriber_id ) );
	}

	public static function provide_refused_writes() {
		return array(
			'no seen in the body'           => array( 'my-plugin/for-everyone', array(), 400 ),
			'seen that is no boolean'       => array( 'my-plugin/for-everyone', array( 'seen' => 'yes please' ), 400 ),
			'an unknown announcement'       => array( 'my-plugin/unknown', array( 'seen' => true ), 404 ),
			'one the user is not shown'     => array( 'my-plugin/for-administrators', array( 'seen' => true ), 404 ),
			'an id the route does not take' => array( 'my-plugin', array( 'seen' => true ), 404 ),
		);
	}
}
