<?php
/**
 * Tests for the Newsletter subscriber stats controller.
 *
 * @package automattic/jetpack-newsletter
 */

namespace Automattic\Jetpack\Newsletter\Tests;

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Newsletter\Subscriber_Stats_Controller;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;
use WP_Error;
use WP_REST_Request;
use WP_REST_Server;

/**
 * Test class for Subscriber_Stats_Controller.
 *
 * @covers \Automattic\Jetpack\Newsletter\Subscriber_Stats_Controller
 */
#[CoversClass( Subscriber_Stats_Controller::class )]
class Subscriber_Stats_Controller_Test extends BaseTestCase {

	/**
	 * Controller under test.
	 *
	 * @var Subscriber_Stats_Controller
	 */
	private $controller;

	/**
	 * Query variables captured by the post-query fixture.
	 *
	 * @var array
	 */
	private $query_vars = array();

	/**
	 * Set up the controller and host override.
	 */
	public function set_up() {
		parent::set_up();
		remove_all_filters( 'jetpack_newsletter_stats_pre_request' );

		global $wp_rest_server;
		$wp_rest_server   = new WP_REST_Server();
		$this->controller = new Subscriber_Stats_Controller();
		add_action( 'rest_api_init', array( $this->controller, 'register_routes' ) );
		do_action( 'rest_api_init' );
	}

	/**
	 * Remove hooks added by a test.
	 */
	public function tear_down() {
		remove_all_actions( 'rest_api_init' );
		remove_all_filters( 'jetpack_newsletter_stats_pre_request' );
		remove_all_filters( 'posts_pre_query' );
		remove_all_filters( 'pre_http_request' );
		$this->delete_stats_transients();
		\Jetpack_Options::delete_option( 'blog_token' );
		\Jetpack_Options::delete_option( 'id' );
		( new Connection_Manager() )->reset_connection_status();
		Constants::clear_constants();
		wp_set_current_user( 0 );
		parent::tear_down();
	}

	/**
	 * Host responses bypass the connection proxy without changing the request.
	 *
	 * @param string $method   Controller method.
	 * @param string $endpoint Expected endpoint.
	 * @dataProvider provide_stats_callbacks
	 */
	#[DataProvider( 'provide_stats_callbacks' )]
	public function test_host_can_short_circuit_stats_requests( $method, $endpoint ) {
		$request = new WP_REST_Request( 'GET' );
		$request->set_query_params(
			array(
				'quantity'   => 30,
				'rest_route' => '/jetpack/v4/newsletter/stats/' . $endpoint,
				'period'     => 'alltime',
				'evil'       => '1',
			)
		);

		add_filter(
			'jetpack_newsletter_stats_pre_request',
			function ( $response, $filtered_endpoint, $query_args ) {
				$this->assertNull( $response );

				return array(
					'endpoint'   => $filtered_endpoint,
					'query_args' => $query_args,
				);
			},
			10,
			3
		);

		$response = $this->controller->$method( $request );

		$this->assertSame( $endpoint, $response['endpoint'] );
		$this->assertSame( array( 'quantity' => 30 ), $response['query_args'] );
	}

	/**
	 * Without a host override, an unconnected site fails as `site_not_connected`
	 * (HTTP 400), not as an unauthorized REST error from a connection gate.
	 *
	 * @param string $method   Controller method.
	 * @param string $endpoint Unused; required by the shared data provider's shape.
	 * @dataProvider provide_stats_callbacks
	 */
	#[DataProvider( 'provide_stats_callbacks' )]
	public function test_unconnected_site_fails_on_missing_token_not_on_a_connection_gate( $method, $endpoint ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- $endpoint needed to match the shared data provider's shape.
		$request = new WP_REST_Request( 'GET' );
		$request->set_query_params( array( 'quantity' => 30 ) );

		$response = $this->controller->$method( $request );

		$this->assertInstanceOf( WP_Error::class, $response );
		$this->assertSame( 'site_not_connected', $response->get_error_code() );
		$this->assertSame( 400, $response->get_error_data()['status'] );
	}

	public function test_registers_recent_posts_route() {
		$this->assertArrayHasKey(
			'/jetpack/v4/newsletter/stats/recent-posts',
			rest_get_server()->get_routes()
		);
	}

	public function test_recent_posts_route_requires_manage_options() {
		$response = rest_get_server()->dispatch(
			new WP_REST_Request( 'GET', '/jetpack/v4/newsletter/stats/recent-posts' )
		);

		$this->assertSame( 401, $response->get_status() );
	}

	/**
	 * Dispatches through the real REST pipeline (unlike the direct-method-call
	 * tests above) so permission_callback is actually exercised, not bypassed.
	 */
	public function test_subscribers_route_requires_manage_options() {
		$request = new WP_REST_Request( 'GET', '/jetpack/v4/newsletter/stats/subscribers' );
		$request->set_query_params( array( 'date' => gmdate( 'Y-m-d' ) ) );

		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 401, $response->get_status() );
	}

	/**
	 * Dispatches through the real REST pipeline so permission_callback is
	 * actually exercised, not bypassed.
	 */
	public function test_emails_summary_route_requires_manage_options() {
		$response = rest_get_server()->dispatch(
			new WP_REST_Request( 'GET', '/jetpack/v4/newsletter/stats/emails/summary' )
		);

		$this->assertSame( 401, $response->get_status() );
	}

	public function test_subscribers_route_forbids_editors() {
		$user_id = wp_insert_user(
			array(
				'user_login' => 'newsletter_stats_editor_' . wp_rand(),
				'user_pass'  => 'password',
				'user_email' => 'newsletter-stats-editor-' . wp_rand() . '@example.com',
				'role'       => 'editor',
			)
		);
		if ( is_wp_error( $user_id ) ) {
			$this->fail( $user_id->get_error_message() );
		}
		wp_set_current_user( $user_id );

		$request = new WP_REST_Request( 'GET', '/jetpack/v4/newsletter/stats/subscribers' );
		$request->set_query_params( array( 'date' => gmdate( 'Y-m-d' ) ) );

		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 403, $response->get_status() );
	}

	public function test_subscribers_route_rejects_invalid_date() {
		$this->login_as_admin();
		$request = new WP_REST_Request( 'GET', '/jetpack/v4/newsletter/stats/subscribers' );
		$request->set_query_params( array( 'date' => 'not-a-date' ) );

		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 400, $response->get_status() );
		$this->assertSame( 'rest_invalid_param', $response->get_data()['code'] );
	}

	public function test_subscribers_route_rejects_impossible_calendar_date() {
		$this->login_as_admin();
		$request = new WP_REST_Request( 'GET', '/jetpack/v4/newsletter/stats/subscribers' );
		$request->set_query_params( array( 'date' => '2026-02-31' ) );

		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 400, $response->get_status() );
		$this->assertSame( 'rest_invalid_param', $response->get_data()['code'] );
		$this->assertArrayHasKey( 'date', $response->get_data()['data']['params'] );
		$this->assertStringContainsString( 'calendar', $response->get_data()['data']['params']['date'] );
	}

	public function test_successful_wpcom_stats_are_reused_without_a_second_http_call() {
		$this->connect_site();
		$payload = array( 'posts' => array( array( 'id' => 7 ) ) );
		$calls   = 0;
		add_filter(
			'pre_http_request',
			function () use ( &$calls, $payload ) {
				++$calls;

				return array(
					'response' => array( 'code' => 200 ),
					'body'     => wp_json_encode( $payload, JSON_UNESCAPED_SLASHES ),
				);
			}
		);

		$request = new WP_REST_Request( 'GET' );
		$request->set_query_params( array( 'quantity' => 30 ) );

		$this->assertSame( $payload, $this->controller->get_email_summary( $request ) );
		$this->assertSame( $payload, $this->controller->get_email_summary( $request ) );
		$this->assertSame( 1, $calls );
	}

	public function test_wpcom_stats_errors_are_not_cached() {
		$this->connect_site();
		$payload = array( 'posts' => array( array( 'id' => 9 ) ) );
		$calls   = 0;
		add_filter(
			'pre_http_request',
			function () use ( &$calls, $payload ) {
				++$calls;
				if ( 1 === $calls ) {
					return array(
						'response' => array( 'code' => 500 ),
						'body'     => wp_json_encode( array( 'message' => 'upstream failed' ), JSON_UNESCAPED_SLASHES ),
					);
				}

				return array(
					'response' => array( 'code' => 200 ),
					'body'     => wp_json_encode( $payload, JSON_UNESCAPED_SLASHES ),
				);
			}
		);

		$request = new WP_REST_Request( 'GET' );
		$request->set_query_params( array( 'quantity' => 30 ) );

		$first = $this->controller->get_email_summary( $request );
		$this->assertInstanceOf( WP_Error::class, $first );
		$this->assertSame( $payload, $this->controller->get_email_summary( $request ) );
		$this->assertSame( 2, $calls );
	}

	public function test_subscribers_route_rejects_year_unit() {
		$this->login_as_admin();
		$request = new WP_REST_Request( 'GET', '/jetpack/v4/newsletter/stats/subscribers' );
		$request->set_query_params(
			array(
				'date' => gmdate( 'Y-m-d' ),
				'unit' => 'year',
			)
		);

		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 400, $response->get_status() );
		$this->assertSame( 'rest_invalid_param', $response->get_data()['code'] );
	}

	public function test_emails_summary_forwards_declared_defaults() {
		$this->login_as_admin();
		$captured = null;
		add_filter(
			'jetpack_newsletter_stats_pre_request',
			function ( $response, $endpoint, $query_args ) use ( &$captured ) {
				$this->assertNull( $response );
				$this->assertSame( 'emails/summary', $endpoint );
				$captured = $query_args;

				return array( 'posts' => array() );
			},
			10,
			3
		);

		$response = rest_get_server()->dispatch(
			new WP_REST_Request( 'GET', '/jetpack/v4/newsletter/stats/emails/summary' )
		);

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame(
			array(
				'quantity'   => 30,
				'sort_field' => 'post_date',
				'sort_order' => 'desc',
			),
			$captured
		);
	}

	public function test_returns_ten_newest_published_posts_and_drafts() {
		$ids = array();
		for ( $day = 1; $day <= 12; $day++ ) {
			$ids[] = $this->insert_post(
				'Post ' . $day,
				0 === $day % 2 ? 'publish' : 'draft',
				gmdate( 'Y-m-d H:i:s', time() - ( ( 13 - $day ) * DAY_IN_SECONDS ) )
			);
		}
		$expected_ids = array_reverse( array_slice( $ids, 2 ) );
		$this->set_query_posts( $expected_ids );
		$this->set_email_summary_response( array( 'posts' => array() ) );

		$response = $this->controller->get_recent_posts();

		$this->assertCount( 10, $response['posts'] );
		$this->assertSame( $expected_ids, array_column( $response['posts'], 'id' ) );
		$this->assertSame( 'post', $this->query_vars['post_type'] );
		$this->assertEqualsCanonicalizing(
			array( 'publish', 'draft' ),
			$this->query_vars['post_status']
		);
		$this->assertSame( 10, $this->query_vars['posts_per_page'] );
		$this->assertSame( 'date', $this->query_vars['orderby'] );
		$this->assertSame( 'DESC', $this->query_vars['order'] );
		$this->assertSame( admin_url( 'edit.php' ), $response['viewAllUrl'] );
		$this->assertSame( admin_url( 'post-new.php' ), $response['createPostUrl'] );
	}

	public function test_enriches_only_posts_present_in_email_summary() {
		$matched_id   = $this->insert_post( 'Sent post', 'publish', gmdate( 'Y-m-d H:i:s', time() - DAY_IN_SECONDS ) );
		$unmatched_id = $this->insert_post( '', 'draft', gmdate( 'Y-m-d H:i:s', time() - ( 2 * DAY_IN_SECONDS ) ) );
		$this->set_query_posts( array( $matched_id, $unmatched_id ) );
		$this->set_email_summary_response(
			array(
				'posts' => array(
					array(
						'id'            => $matched_id,
						'total_sends'   => 122,
						'opens_rate'    => 58,
						'clicks_rate'   => 21,
						'unique_opens'  => 71,
						'unique_clicks' => 26,
					),
				),
			)
		);

		$response = $this->controller->get_recent_posts();
		$by_id    = array_column( $response['posts'], null, 'id' );

		$this->assertSame( 122, $by_id[ $matched_id ]['recipients'] );
		$this->assertSame( 58.0, $by_id[ $matched_id ]['openRatePercent'] );
		$this->assertSame( 21.0, $by_id[ $matched_id ]['clickRatePercent'] );
		$this->assertNull( $by_id[ $unmatched_id ]['recipients'] );
		$this->assertNull( $by_id[ $unmatched_id ]['openRatePercent'] );
		$this->assertNull( $by_id[ $unmatched_id ]['clickRatePercent'] );
		$this->assertSame( get_permalink( $matched_id ), $by_id[ $matched_id ]['url'] );
		$this->assertSame( get_preview_post_link( $unmatched_id ), $by_id[ $unmatched_id ]['url'] );
		$this->assertSame( '(no title)', $by_id[ $unmatched_id ]['title'] );
		$this->assertNull( $by_id[ $unmatched_id ]['image'] );
		$this->assertSame(
			array(
				'sends'        => 122,
				'uniqueOpens'  => 71,
				'uniqueClicks' => 26,
			),
			$response['emailTotals']
		);
	}

	public function test_returns_local_posts_when_email_summary_fails() {
		$post_id = $this->insert_post( 'Local post', 'publish', gmdate( 'Y-m-d H:i:s', time() - DAY_IN_SECONDS ) );
		$this->set_query_posts( array( $post_id ) );
		$this->set_email_summary_response( new WP_Error( 'summary_failed' ) );

		$response = $this->controller->get_recent_posts();

		$this->assertSame( $post_id, $response['posts'][0]['id'] );
		$this->assertNull( $response['posts'][0]['recipients'] );
		$this->assertNull( $response['emailTotals'] );
	}

	/**
	 * Give the site a blog token so the Stats proxy reaches HTTP.
	 */
	private function connect_site() {
		\Jetpack_Options::update_option( 'id', 1234 );
		\Jetpack_Options::update_option( 'blog_token', 'blog_token.secret' );
		( new Connection_Manager() )->reset_connection_status();
		Constants::set_constant( 'JETPACK__WPCOM_JSON_API_BASE', 'https://public-api.wordpress.com' );
	}

	/**
	 * Drop cached Stats proxy responses so tests cannot share a hit.
	 */
	private function delete_stats_transients() {
		global $wpdb;

		$prefix = Subscriber_Stats_Controller::CACHE_TRANSIENT_PREFIX;
		$wpdb->query( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.InterpolatedNotPrepared
			$wpdb->prepare(
				"DELETE FROM {$wpdb->options} WHERE option_name LIKE %s OR option_name LIKE %s",
				$wpdb->esc_like( '_transient_' . $prefix ) . '%',
				$wpdb->esc_like( '_transient_timeout_' . $prefix ) . '%'
			)
		);
	}

	/**
	 * Create an administrator and set them as the current user.
	 */
	private function login_as_admin() {
		$user_id = wp_insert_user(
			array(
				'user_login' => 'newsletter_stats_admin_' . wp_rand(),
				'user_pass'  => 'password',
				'user_email' => 'newsletter-stats-admin-' . wp_rand() . '@example.com',
				'role'       => 'administrator',
			)
		);
		if ( is_wp_error( $user_id ) ) {
			$this->fail( $user_id->get_error_message() );
		}
		wp_set_current_user( $user_id );
	}

	/**
	 * Insert a post fixture.
	 *
	 * @param string $title  Post title.
	 * @param string $status Post status.
	 * @param string $date   Post date.
	 * @return int
	 */
	private function insert_post( $title, $status, $date ) {
		return (int) wp_insert_post(
			array(
				'post_title'   => $title,
				'post_content' => 'Fixture content',
				'post_status'  => $status,
				'post_type'    => 'post',
				'post_date'    => $date,
			)
		);
	}

	/**
	 * Supply posts through WordPress's query short-circuit.
	 *
	 * @param int[] $post_ids Post IDs in query order.
	 */
	private function set_query_posts( $post_ids ) {
		add_filter(
			'posts_pre_query',
			function ( $posts, $query ) use ( $post_ids ) {
				$this->query_vars = $query->query_vars;

				return array_map( 'get_post', $post_ids );
			},
			10,
			2
		);
	}

	/**
	 * Supply an email-summary response through the host seam.
	 *
	 * @param array|WP_Error $summary Summary response.
	 */
	private function set_email_summary_response( $summary ) {
		add_filter(
			'jetpack_newsletter_stats_pre_request',
			function ( $response, $endpoint ) use ( $summary ) {
				return 'emails/summary' === $endpoint ? $summary : $response;
			},
			10,
			2
		);
	}

	/**
	 * Stats methods and their relative upstream paths.
	 *
	 * @return array<string, array<string>>
	 */
	public static function provide_stats_callbacks() {
		return array(
			'subscribers'   => array( 'get_subscribers', 'subscribers' ),
			'email summary' => array( 'get_email_summary', 'emails/summary' ),
		);
	}
}
