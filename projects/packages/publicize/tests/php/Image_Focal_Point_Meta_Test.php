<?php

namespace Automattic\Jetpack\Publicize;

use PHPUnit\Framework\Attributes\AllowMockObjectsWithoutExpectations;
use PHPUnit\Framework\TestCase;
use WorDBless\Options as WorDBless_Options;
use WorDBless\Posts as WorDBless_Posts;
use WorDBless\Users as WorDBless_Users;
use WP_REST_Request;
use WP_REST_Server;

/**
 * Unit tests for the image focal point attachment meta.
 *
 * @package automattic/jetpack-publicize
 */
#[AllowMockObjectsWithoutExpectations /* getStubBuilder() (for partial stubs) doesn't exist until PHPUnit 12.5. */ ]
class Image_Focal_Point_Meta_Test extends TestCase {

	/**
	 * Attachment ID.
	 *
	 * @var int
	 */
	private $attachment_id;

	/**
	 * Admin user ID.
	 *
	 * @var int
	 */
	private $admin_id;

	/**
	 * Publicize instance.
	 *
	 * @var Publicize
	 */
	private $publicize;

	/**
	 * WP_REST_Server instance.
	 *
	 * @var WP_REST_Server
	 */
	private $server;

	/**
	 * Setting up the test.
	 */
	public function setUp(): void {
		parent::setUp();

		global $publicize;
		$this->publicize = $this->getMockBuilder( Publicize::class )->onlyMethods( array( 'refresh_connections' ) )->getMock();
		$this->publicize->method( 'refresh_connections' )->withAnyParameters()->willReturn( null );
		$publicize = $this->publicize;

		$this->admin_id = wp_insert_user(
			array(
				'user_login' => 'dummy_admin',
				'user_pass'  => 'dummy_pass',
				'role'       => 'administrator',
			)
		);
		wp_set_current_user( $this->admin_id );
		$user = wp_get_current_user();
		$user->add_cap( 'manage_options' );
		$user->set_role( 'administrator' );

		global $wp_rest_server;
		$wp_rest_server = new WP_REST_Server();
		$this->server   = $wp_rest_server;

		$this->publicize->register_post_meta();
		do_action( 'rest_api_init' );

		$this->attachment_id = wp_insert_attachment(
			array(
				'post_mime_type' => 'image/jpeg',
				'post_title'     => 'Test image',
				'post_status'    => 'inherit',
				'post_author'    => $this->admin_id,
			)
		);
	}

	/**
	 * Returning the environment into its initial state.
	 */
	public function tearDown(): void {
		parent::tearDown();

		unregister_meta_key( 'post', Publicize_Base::ATTACHMENT_IMAGE_FOCAL_POINT, 'attachment' );

		WorDBless_Options::init()->clear_options();
		WorDBless_Posts::init()->clear_all_posts();
		WorDBless_Users::init()->clear_all_users();
	}

	/**
	 * Dispatch a REST request saving the focal point on the attachment.
	 *
	 * @param mixed $focal_point The focal point value to save.
	 * @return \WP_REST_Response The REST response.
	 */
	private function update_focal_point( $focal_point ) {
		$request = new WP_REST_Request( 'POST', sprintf( '/wp/v2/media/%d', $this->attachment_id ) );
		$request->set_body_params(
			array(
				'meta' => array(
					Publicize_Base::ATTACHMENT_IMAGE_FOCAL_POINT => $focal_point,
				),
			)
		);

		return $this->server->dispatch( $request );
	}

	/**
	 * Test that the focal point round-trips through the media REST API.
	 */
	public function test_focal_point_round_trips_through_rest() {
		$focal_point = array(
			'x' => 0.25,
			'y' => 0.75,
		);

		$response = $this->update_focal_point( $focal_point );
		$this->assertSame( 200, $response->get_status() );

		$request  = new WP_REST_Request( 'GET', sprintf( '/wp/v2/media/%d', $this->attachment_id ) );
		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		$this->assertEquals( $focal_point, $data['meta'][ Publicize_Base::ATTACHMENT_IMAGE_FOCAL_POINT ] );
	}

	/**
	 * Test that an attachment without saved focal point meta returns the centered default.
	 */
	public function test_focal_point_defaults_to_center() {
		$request  = new WP_REST_Request( 'GET', sprintf( '/wp/v2/media/%d', $this->attachment_id ) );
		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		$this->assertEquals(
			array(
				'x' => 0.5,
				'y' => 0.5,
			),
			$data['meta'][ Publicize_Base::ATTACHMENT_IMAGE_FOCAL_POINT ]
		);
	}

	/**
	 * Test that both focal point coordinates are required.
	 */
	public function test_focal_point_requires_both_coordinates() {
		$response = $this->update_focal_point(
			array(
				'x' => 0.5,
			)
		);

		$this->assertSame( 400, $response->get_status() );
		$this->assertSame( 'rest_property_required', $response->get_data()['code'] );
	}

	/**
	 * Test that out-of-range coordinates are rejected.
	 */
	public function test_focal_point_rejects_out_of_range_coordinates() {
		$response = $this->update_focal_point(
			array(
				'x' => 1.5,
				'y' => 0.5,
			)
		);

		$this->assertSame( 400, $response->get_status() );
		$this->assertSame( 'rest_out_of_bounds', $response->get_data()['code'] );
	}

	/**
	 * Test that unknown focal point properties are rejected.
	 */
	public function test_focal_point_rejects_unknown_properties() {
		$response = $this->update_focal_point(
			array(
				'x'    => 0.5,
				'y'    => 0.5,
				'zoom' => 2,
			)
		);

		$this->assertSame( 400, $response->get_status() );
		$this->assertSame( 'rest_additional_properties_forbidden', $response->get_data()['code'] );
	}

	/**
	 * Test that the auth callback requires edit rights on the attachment.
	 */
	public function test_auth_callback_requires_edit_rights() {
		$this->assertTrue(
			$this->publicize->image_focal_point_auth_callback( false, Publicize_Base::ATTACHMENT_IMAGE_FOCAL_POINT, $this->attachment_id )
		);

		$subscriber_id = wp_insert_user(
			array(
				'user_login' => 'dummy_subscriber',
				'user_pass'  => 'dummy_pass',
				'role'       => 'subscriber',
			)
		);
		wp_set_current_user( $subscriber_id );

		$this->assertFalse(
			$this->publicize->image_focal_point_auth_callback( false, Publicize_Base::ATTACHMENT_IMAGE_FOCAL_POINT, $this->attachment_id )
		);
	}
}
