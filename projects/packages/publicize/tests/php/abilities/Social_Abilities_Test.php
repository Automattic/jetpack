<?php
/**
 * Tests for the Social_Abilities registrar.
 *
 * @package automattic/jetpack-publicize
 */

namespace Automattic\Jetpack\Publicize\Abilities;

use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;
use WP_Error;
use WP_REST_Request;

/**
 * @covers \Automattic\Jetpack\Publicize\Abilities\Social_Abilities
 */
#[CoversClass( Social_Abilities::class )]
class Social_Abilities_Test extends BaseTestCase {

	/** @var WP_REST_Request[] */
	private $requests = array();

	public function tearDown(): void {
		unset( $GLOBALS['publicize'] );
		wp_set_current_user( 0 );
		remove_all_filters( 'rest_pre_dispatch' );
		parent::tearDown();
	}

	/**
	 * Answer every REST call with $data (or a WP_Error) and record the request.
	 *
	 * @param mixed $data Response data or WP_Error.
	 */
	private function fake_rest( $data ): void {
		$this->requests = array();
		$data           = is_wp_error( $data ) ? $data : rest_ensure_response( $data );
		add_filter(
			'rest_pre_dispatch',
			function ( $result, $server, $request ) use ( $data ) {
				$this->requests[] = $request;
				return $data;
			},
			10,
			3
		);
	}

	private function login( string $role ): int {
		$id = wp_insert_user(
			array(
				'user_login' => 'social_' . $role . wp_generate_password( 6, false ),
				'user_pass'  => 'pw',
				'role'       => $role,
			)
		);
		wp_set_current_user( $id );
		return $id;
	}

	private function fake_publicize(): void {
		$GLOBALS['publicize'] = new class() {
			/**
			 * Mirror of the real check.
			 *
			 * @param int $post_id Post ID.
			 * @return bool
			 */
			public function current_user_can_access_publicize_data( $post_id = 0 ) {
				return $post_id ? current_user_can( 'publish_post', $post_id ) : current_user_can( 'publish_posts' );
			}
		};
	}

	public function test_annotations_mark_share_and_delete_destructive(): void {
		$abilities = Social_Abilities::get_abilities();

		$this->assertTrue( $abilities['jetpack-social/get-connections']['meta']['annotations']['readonly'] );
		foreach ( array( 'jetpack-social/share-post', 'jetpack-social/delete-connection' ) as $slug ) {
			$this->assertFalse( $abilities[ $slug ]['meta']['annotations']['readonly'], $slug );
			$this->assertTrue( $abilities[ $slug ]['meta']['annotations']['destructive'], $slug );
		}
		$this->assertFalse( $abilities['jetpack-social/share-post']['meta']['annotations']['idempotent'] );
	}

	public function test_descriptions_avoid_words_the_mcp_compliance_check_rejects(): void {
		foreach ( Social_Abilities::get_abilities() as $slug => $spec ) {
			$this->assertDoesNotMatchRegularExpression( '/\b(never|always|do not|wait for)\b/i', $spec['description'], $slug );
		}
	}

	public function test_permissions_follow_the_publicize_capability(): void {
		$this->assertFalse( Social_Abilities::can_view_connections(), 'No Publicize global.' );

		$this->fake_publicize();
		$this->login( 'subscriber' );
		$this->assertFalse( Social_Abilities::can_view_connections() );

		$this->login( 'author' );
		$this->assertTrue( Social_Abilities::can_view_connections() );
	}

	public function test_share_permission_needs_the_post_id_and_edit_rights_on_it(): void {
		$this->fake_publicize();
		$author_id = $this->login( 'author' );
		$own       = wp_insert_post(
			array(
				'post_title'  => 'Mine',
				'post_status' => 'publish',
				'post_author' => $author_id,
			)
		);
		$other     = wp_insert_post(
			array(
				'post_title'  => 'Theirs',
				'post_status' => 'publish',
				'post_author' => 1,
			)
		);

		$this->assertTrue( Social_Abilities::can_share_post( array( 'post_id' => $own ) ) );
		$this->assertFalse( Social_Abilities::can_share_post( array( 'post_id' => $other ) ) );
		$this->assertFalse( Social_Abilities::can_share_post( array() ) );
		$this->assertFalse( Social_Abilities::can_share_post( array( 'post_id' => '0' ) ) );
	}

	public function test_get_connections_filters_by_service_and_trims_fields(): void {
		$this->fake_rest(
			array(
				array(
					'connection_id' => '11',
					'service_name'  => 'facebook',
					'display_name'  => 'Page',
					'shared'        => true,
					'status'        => 'ok',
					'wpcom_user_id' => 5,
					'id'            => '11',
				),
				array(
					'connection_id' => '12',
					'service_name'  => 'linkedin',
					'status'        => null,
				),
			)
		);

		$result = Social_Abilities::get_connections( array( 'service_name' => 'facebook' ) );

		$this->assertSame( 1, $result['total'] );
		$this->assertSame( '11', $result['connections'][0]['connection_id'] );
		$this->assertSame( 'ok', $result['connections'][0]['status'] );
		$this->assertArrayNotHasKey( 'wpcom_user_id', $result['connections'][0] );
		$this->assertSame( 'GET', $this->requests[0]->get_method() );
		$this->assertSame( '/wpcom/v2/publicize/connections', $this->requests[0]->get_route() );
	}

	public function test_get_connections_returns_empty_list_when_nothing_is_connected(): void {
		$this->fake_rest( array() );
		$this->assertSame(
			array(
				'total'       => 0,
				'connections' => array(),
			),
			Social_Abilities::get_connections()
		);
	}

	public function test_share_post_sends_message_and_skips_to_the_route(): void {
		$this->fake_rest(
			array(
				'results' => array( array( 'connection_id' => 11 ) ),
				'errors'  => array(),
			)
		);

		$result = Social_Abilities::share_post(
			array(
				'post_id'             => 42,
				'message'             => '  Hello  ',
				'skipped_connections' => array( 12, 13 ),
			)
		);

		$this->assertSame( 42, $result['post_id'] );
		$this->assertCount( 1, $result['results'] );
		$request = $this->requests[0];
		$this->assertSame( 'POST', $request->get_method() );
		$this->assertSame( '/wpcom/v2/publicize/share-post/42', $request->get_route() );
		$this->assertSame( 'Hello', $request->get_param( 'message' ) );
		$this->assertSame( array( 12, 13 ), $request->get_param( 'skipped_connections' ) );
	}

	public function test_share_post_rejects_blank_message_without_calling_the_route(): void {
		$this->fake_rest( array() );

		$result = Social_Abilities::share_post(
			array(
				'post_id' => 42,
				'message' => '   ',
			)
		);

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'jetpack_social_missing_message', $result->get_error_code() );
		$this->assertCount( 0, $this->requests );
	}

	public function test_route_errors_come_back_as_prefixed_wp_errors(): void {
		$this->fake_rest( new WP_Error( 'not_published', 'Only published posts can be shared.', array( 'status' => 400 ) ) );

		$result = Social_Abilities::share_post(
			array(
				'post_id' => 42,
				'message' => 'Hi',
			)
		);

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'jetpack_social_not_published', $result->get_error_code() );
		$this->assertSame( 'Only published posts can be shared.', $result->get_error_message() );
	}

	public function test_delete_connection_calls_delete_route(): void {
		$this->fake_rest( array( 'deleted' => true ) );

		$result = Social_Abilities::delete_connection( array( 'connection_id' => 11 ) );

		$this->assertSame(
			array(
				'deleted'       => true,
				'connection_id' => 11,
			),
			$result
		);
		$this->assertSame( 'DELETE', $this->requests[0]->get_method() );
		$this->assertSame( '/wpcom/v2/publicize/connections/11', $this->requests[0]->get_route() );
	}

	public function test_delete_connection_surfaces_route_denial(): void {
		$this->fake_rest( new WP_Error( 'rest_forbidden', 'Nope.', array( 'status' => 403 ) ) );

		$result = Social_Abilities::delete_connection( array( 'connection_id' => 11 ) );

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'jetpack_social_rest_forbidden', $result->get_error_code() );
	}
}
