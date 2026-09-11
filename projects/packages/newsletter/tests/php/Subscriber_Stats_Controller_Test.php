<?php
/**
 * Tests for the Newsletter subscriber stats controller.
 *
 * @package automattic/jetpack-newsletter
 */

namespace Automattic\Jetpack\Newsletter\Tests;

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
		$request->set_query_params( array( 'quantity' => 30 ) );

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
	 * Without a host override, an unconnected site should fail on the missing blog token,
	 * not on a `Manager::is_connected()` gate -- WordPress.com Simple sites have no such
	 * connection and must still be able to reach WordPress.com's Stats REST API directly.
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
		$this->assertNotSame( 'rest_unauthorized', $response->get_error_code() );
		$this->assertSame( 'no_possible_tokens', $response->get_error_code() );
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
