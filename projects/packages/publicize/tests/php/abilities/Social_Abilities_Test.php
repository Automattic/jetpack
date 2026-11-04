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
		wp_set_current_user( 0 );
		remove_all_filters( 'rest_pre_dispatch' );
		remove_all_actions( 'rest_api_init' );
		parent::tearDown();
	}

	/**
	 * Answer every REST call with $data (or a WP_Error) and record the request.
	 *
	 * @param mixed $data Response data, a WP_Error, or a Closure taking the request and returning either.
	 */
	private function fake_rest( $data ): void {
		$this->requests = array();
		add_filter(
			'rest_pre_dispatch',
			function ( $result, $server, $request ) use ( $data ) {
				$this->requests[] = $request;
				$answer           = $data instanceof \Closure ? $data( $request ) : $data;
				return is_wp_error( $answer ) ? $answer : rest_ensure_response( $answer );
			},
			10,
			3
		);
	}

	/**
	 * Answer the connection list with one working account and the share POST with $share.
	 *
	 * @param mixed $share Response data or WP_Error for the share request.
	 */
	private function fake_share_rest( $share ): void {
		$this->fake_rest(
			function ( $request ) use ( $share ) {
				return 'GET' === $request->get_method()
					? array(
						array(
							'connection_id' => '11',
							'status'        => 'ok',
						),
					)
					: $share;
			}
		);
	}

	private function make_post( string $status = 'publish' ): int {
		return (int) wp_insert_post(
			array(
				'post_title'  => 'A post',
				'post_status' => $status,
			)
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

	public function test_register_abilities_registers_the_three_slugs_in_the_social_category(): void {
		if ( ! function_exists( 'wp_register_ability' ) ) {
			$this->markTestSkipped( 'Abilities API not available.' );
		}
		add_filter( 'jetpack_social_abilities_should_load', '__return_true' );
		global $wp_current_filter;
		$wp_current_filter[] = 'wp_abilities_api_init';
		$wp_current_filter[] = 'wp_abilities_api_categories_init';
		wp_register_ability_category( Social_Abilities::get_category_slug(), Social_Abilities::get_category_definition() );
		array_pop( $wp_current_filter );
		Social_Abilities::register_abilities();
		array_pop( $wp_current_filter );

		foreach ( array_keys( Social_Abilities::get_abilities() ) as $slug ) {
			$ability = wp_get_ability( $slug );
			$this->assertNotNull( $ability, $slug );
			$this->assertSame( 'jetpack-social', $ability->get_category(), $slug );
			wp_unregister_ability( $slug );
		}
		wp_unregister_ability_category( 'jetpack-social' );
		remove_all_filters( 'jetpack_social_abilities_should_load' );
	}

	public function test_annotations_mark_share_and_delete_destructive(): void {
		$abilities = Social_Abilities::get_abilities();

		$this->assertTrue( $abilities['jetpack-social/get-connections']['meta']['annotations']['readonly'] );
		foreach ( array( 'jetpack-social/share-post', 'jetpack-social/delete-connection' ) as $slug ) {
			$this->assertFalse( $abilities[ $slug ]['meta']['annotations']['readonly'], $slug );
			$this->assertTrue( $abilities[ $slug ]['meta']['annotations']['destructive'], $slug );
		}
		$this->assertFalse( $abilities['jetpack-social/share-post']['meta']['annotations']['idempotent'] );
		$this->assertTrue( $abilities['jetpack-social/share-post']['meta']['annotations']['openWorldHint'] );
	}

	public function test_descriptions_avoid_words_the_mcp_compliance_check_rejects(): void {
		foreach ( Social_Abilities::get_abilities() as $slug => $spec ) {
			$this->assertDoesNotMatchRegularExpression( '/\b(never|always|do not|wait for)\b/i', $spec['description'], $slug );
		}
	}

	public function test_permissions_follow_the_publicize_capability(): void {
		$this->assertFalse( Social_Abilities::can_view_connections(), 'Logged out.' );

		$this->login( 'subscriber' );
		$this->assertFalse( Social_Abilities::can_view_connections() );

		$this->login( 'author' );
		$this->assertTrue( Social_Abilities::can_view_connections() );
	}

	public function test_share_permission_needs_the_post_id_and_edit_rights_on_it(): void {
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
		$this->assertTrue( Social_Abilities::can_share_post( array( 'post_id' => (string) $own ) ), 'Numeric strings pass schema validation.' );
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
		$this->assertSame( 11, $result['connections'][0]['connection_id'] );
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
		$post_id = $this->make_post();
		$this->fake_share_rest(
			array(
				'results' => array( array( 'connection_id' => 11 ) ),
				'errors'  => array(),
			)
		);

		$result = Social_Abilities::share_post(
			array(
				'post_id'             => $post_id,
				'message'             => '  Hello  ',
				'skipped_connections' => array( 12, 13 ),
			)
		);

		$this->assertSame(
			array(
				'post_id'     => $post_id,
				'queued'      => true,
				'connections' => 1,
			),
			$result
		);
		$request = $this->requests[1];
		$this->assertSame( 'POST', $request->get_method() );
		$this->assertSame( '/wpcom/v2/publicize/share-post/' . $post_id, $request->get_route() );
		$this->assertSame( 'application/json', $request->get_header( 'content_type' ) );
		$this->assertSame(
			array(
				'message'             => 'Hello',
				'async'               => true,
				'skipped_connections' => array( 12, 13 ),
			),
			json_decode( $request->get_body(), true ),
			'The Jetpack-site proxy forwards only the raw body.'
		);
		$this->assertSame(
			array(
				'message'             => 'Hello',
				'async'               => true,
				'skipped_connections' => array( 12, 13 ),
			),
			$request->get_json_params()
		);
	}

	public function test_share_post_fails_when_the_route_reports_only_errors(): void {
		$post_id = $this->make_post();
		$this->fake_share_rest(
			array(
				'results' => array(),
				'errors'  => array( array( 'connection_id' => 11 ) ),
			)
		);

		$result = Social_Abilities::share_post(
			array(
				'post_id' => $post_id,
				'message' => 'Hi',
			)
		);

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'jetpack_social_share_failed', $result->get_error_code() );
	}

	public function test_share_post_rejects_blank_message_without_calling_the_route(): void {
		$post_id = $this->make_post();
		$this->fake_rest( array() );

		$result = Social_Abilities::share_post(
			array(
				'post_id' => $post_id,
				'message' => '   ',
			)
		);

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'jetpack_social_missing_message', $result->get_error_code() );
		$this->assertCount( 0, $this->requests );
	}

	public function test_route_errors_come_back_as_prefixed_wp_errors(): void {
		$post_id = $this->make_post();
		$this->fake_share_rest( new WP_Error( 'not_published', 'Only published posts can be shared.', array( 'status' => 400 ) ) );

		$result = Social_Abilities::share_post(
			array(
				'post_id' => $post_id,
				'message' => 'Hi',
			)
		);

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'jetpack_social_not_published', $result->get_error_code() );
		$this->assertSame( 'Only published posts can be shared.', $result->get_error_message() );
		$this->assertSame( array( 'status' => 400 ), $result->get_error_data() );
	}

	public function test_share_post_with_no_reachable_connection_is_an_error_not_a_queued_share(): void {
		$post_id     = $this->make_post();
		$connections = array(
			array(
				'connection_id' => '11',
				'status'        => 'ok',
			),
			array(
				'connection_id' => '12',
				'status'        => 'broken',
			),
		);
		$this->fake_rest(
			function ( $request ) use ( $connections ) {
				return 'GET' === $request->get_method() ? $connections : array( 'results' => array() );
			}
		);

		foreach ( array( array(), array( 11 ) ) as $skipped ) {
			$result = Social_Abilities::share_post(
				array(
					'post_id'             => $post_id,
					'message'             => 'Hi',
					'skipped_connections' => $skipped,
				)
			);

			if ( array() === $skipped ) {
				$this->assertSame( 1, $result['connections'], 'One working connection, one broken.' );
			} else {
				$this->assertInstanceOf( WP_Error::class, $result );
				$this->assertSame( 'jetpack_social_no_connections', $result->get_error_code() );
				$this->assertSame( array( 'status' => 400 ), $result->get_error_data() );
			}
		}

		$posts = array_filter(
			$this->requests,
			function ( $request ) {
				return 'POST' === $request->get_method();
			}
		);
		$this->assertCount( 1, $posts, 'Nothing is posted when no connection can receive the share.' );
	}

	public function test_share_post_on_a_draft_says_not_published_before_looking_at_connections(): void {
		$post_id = $this->make_post( 'draft' );
		$this->fake_share_rest( array() );

		$result = Social_Abilities::share_post(
			array(
				'post_id' => $post_id,
				'message' => 'Hi',
			)
		);

		$this->assertSame( 'jetpack_social_not_published', $result->get_error_code() );
		$this->assertSame( array( 'status' => 400 ), $result->get_error_data() );
		$this->assertCount( 0, $this->requests );
	}

	public function test_delete_unknown_connection_is_a_404_not_a_generic_failure(): void {
		$this->fake_rest(
			function ( $request ) {
				return 'DELETE' === $request->get_method()
					? new WP_Error( 'jp_connection_deletion_failed', 'Something went wrong while deleting the connection.' )
					: array( array( 'connection_id' => '12' ) );
			}
		);

		$result = Social_Abilities::delete_connection( array( 'connection_id' => 11 ) );

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'jetpack_social_connection_not_found', $result->get_error_code() );
		$this->assertSame( array( 'status' => 404 ), $result->get_error_data() );
	}

	public function test_delete_failure_for_a_listed_connection_keeps_the_route_error(): void {
		$this->fake_rest(
			function ( $request ) {
				return 'DELETE' === $request->get_method()
					? new WP_Error( 'jp_connection_deletion_failed', 'Something went wrong while deleting the connection.' )
					: array( array( 'connection_id' => '11' ) );
			}
		);

		$result = Social_Abilities::delete_connection( array( 'connection_id' => 11 ) );

		$this->assertSame( 'jetpack_social_jp_connection_deletion_failed', $result->get_error_code() );
	}

	public function test_abilities_are_not_registered_while_the_publicize_module_is_off(): void {
		if ( ! function_exists( 'wp_register_ability' ) ) {
			$this->markTestSkipped( 'Abilities API not available.' );
		}
		add_filter( 'jetpack_social_abilities_should_load', '__return_false' );
		global $wp_current_filter;
		$wp_current_filter[] = 'wp_abilities_api_init';
		$wp_current_filter[] = 'wp_abilities_api_categories_init';
		wp_register_ability_category( Social_Abilities::get_category_slug(), Social_Abilities::get_category_definition() );
		array_pop( $wp_current_filter );
		Social_Abilities::register_abilities();
		array_pop( $wp_current_filter );

		$registered = array_filter(
			array_keys( Social_Abilities::get_abilities() ),
			'wp_has_ability'
		);
		wp_unregister_ability_category( 'jetpack-social' );
		remove_all_filters( 'jetpack_social_abilities_should_load' );

		$this->assertSame( array(), array_values( $registered ) );
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
