<?php
/**
 * Tests for the Freshly_Pressed class.
 *
 * @package automattic/jetpack-newsletter
 */

declare( strict_types = 1 );

namespace Automattic\Jetpack\Newsletter\Tests;

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Newsletter\Freshly_Pressed;
use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;

require_once __DIR__ . '/lib/class-freshlypressed.php';
require_once __DIR__ . '/lib/get-blog-post.php';

/**
 * Test class for Freshly_Pressed.
 *
 * @covers \Automattic\Jetpack\Newsletter\Freshly_Pressed
 */
#[CoversClass( Freshly_Pressed::class )]
class Freshly_Pressed_Test extends BaseTestCase {
	/**
	 * The URLs requested through the HTTP API during a test.
	 *
	 * @var string[]
	 */
	private $requested_urls = array();

	/**
	 * Set up before each test.
	 */
	public function set_up() {
		parent::set_up();

		$this->requested_urls = array();
		delete_transient( Freshly_Pressed::TRANSIENT_KEY );

		$GLOBALS['jetpack_newsletter_wpcom_doubles'] = array(
			'freshly_pressed' => null,
			'blog_posts'      => array(),
			'last_args'       => array(),
		);
	}

	/**
	 * Tear down after each test.
	 */
	public function tear_down() {
		remove_all_filters( 'pre_http_request' );
		delete_transient( Freshly_Pressed::TRANSIENT_KEY );
		unset( $GLOBALS['jetpack_newsletter_wpcom_doubles'] );
		Constants::clear_constants();

		parent::tear_down();
	}

	/**
	 * Short-circuit the HTTP API with a canned response, recording every URL requested.
	 *
	 * @param mixed $response The response to return: a WP_Error, or an array of posts to encode as the API body.
	 * @return void
	 */
	private function stub_http_response( $response ) {
		add_filter(
			'pre_http_request',
			function ( $preempt, $args, $url ) use ( $response ) {
				$this->requested_urls[] = $url;

				if ( is_wp_error( $response ) ) {
					return $response;
				}

				return array(
					'response' => array( 'code' => 200 ),
					'body'     => wp_json_encode( array( 'posts' => $response ), JSON_UNESCAPED_SLASHES ),
				);
			},
			10,
			3
		);
	}

	/**
	 * Test that the API response is mapped to Reader permalinks.
	 */
	public function test_get_posts_maps_api_response_to_reader_links() {
		$this->stub_http_response(
			array(
				array(
					'ID'      => 3886,
					'site_ID' => 135737082,
					'title'   => 'A post title',
				),
			)
		);

		$posts = Freshly_Pressed::get_posts();

		$this->assertSame(
			array(
				array(
					'title'     => 'A post title',
					'permalink' => 'https://wordpress.com/reader/blogs/135737082/posts/3886?algo=freshly-pressed&ref=dashboard_widget',
					'blog_id'   => 135737082,
					'post_id'   => 3886,
				),
			),
			$posts
		);
	}

	/**
	 * Test that only the fields the widget renders are requested, so the API
	 * doesn't ship the full post content of ten posts on every cache miss.
	 */
	public function test_get_posts_requests_only_the_fields_it_renders() {
		$this->stub_http_response( array() );

		Freshly_Pressed::get_posts();

		$this->assertCount( 1, $this->requested_urls );

		parse_str( (string) wp_parse_url( $this->requested_urls[0], PHP_URL_QUERY ), $query );
		$this->assertSame( '10', $query['number'] );
		$this->assertSame( 'ID,site_ID,title', $query['fields'] );
	}

	/**
	 * Test that posts missing the IDs needed to build a Reader link are skipped.
	 */
	public function test_get_posts_skips_posts_without_ids() {
		$this->stub_http_response(
			array(
				array( 'title' => 'No IDs here' ),
				array(
					'ID'      => 12,
					'site_ID' => 34,
					'title'   => 'Complete',
				),
			)
		);

		$posts = Freshly_Pressed::get_posts();

		$this->assertCount( 1, $posts );
		$this->assertSame( 'Complete', $posts[0]['title'] );
	}

	/**
	 * Test that an untitled post is skipped rather than rendered as a link with
	 * nothing to click.
	 */
	public function test_get_posts_skips_untitled_posts() {
		$this->stub_http_response(
			array(
				array(
					'ID'      => 12,
					'site_ID' => 34,
					'title'   => '   ',
				),
				array(
					'ID'      => 56,
					'site_ID' => 78,
					'title'   => 'Has a title',
				),
			)
		);

		$posts = Freshly_Pressed::get_posts();

		$this->assertCount( 1, $posts );
		$this->assertSame( 'Has a title', $posts[0]['title'] );
	}

	/**
	 * Test that a title of "0" survives, since it is a real title rather than an
	 * absent one.
	 */
	public function test_get_posts_keeps_a_title_of_zero() {
		$this->stub_http_response(
			array(
				array(
					'ID'      => 12,
					'site_ID' => 34,
					'title'   => '0',
				),
			)
		);

		$posts = Freshly_Pressed::get_posts();

		$this->assertCount( 1, $posts );
		$this->assertSame( '0', $posts[0]['title'] );
	}

	/**
	 * Test that a second call is served from the cache without another request.
	 */
	public function test_get_posts_serves_repeat_calls_from_the_cache() {
		$this->stub_http_response(
			array(
				array(
					'ID'      => 12,
					'site_ID' => 34,
					'title'   => 'Cached',
				),
			)
		);

		$first  = Freshly_Pressed::get_posts();
		$second = Freshly_Pressed::get_posts();

		$this->assertSame( $first, $second );
		$this->assertCount( 1, $this->requested_urls );
	}

	/**
	 * Test that a failed request yields an empty list rather than an error.
	 */
	public function test_get_posts_returns_an_empty_list_when_the_request_fails() {
		$this->stub_http_response( new \WP_Error( 'http_request_failed', 'Connection refused' ) );

		$this->assertSame( array(), Freshly_Pressed::get_posts() );
	}

	/**
	 * Test that a failure is cached briefly, so an API outage doesn't turn into
	 * an outgoing request on every dashboard load.
	 */
	public function test_get_posts_caches_failures_for_a_shorter_time() {
		$this->stub_http_response( new \WP_Error( 'http_request_failed', 'Connection refused' ) );

		Freshly_Pressed::get_posts();
		$this->assertSame(
			array(),
			Freshly_Pressed::get_posts(),
			'The second call should be served from the cached failure.'
		);

		$this->assertCount( 1, $this->requested_urls );
		$this->assertLessThanOrEqual(
			time() + Freshly_Pressed::FAILURE_CACHE_TTL,
			(int) get_option( '_transient_timeout_' . Freshly_Pressed::TRANSIENT_KEY )
		);
	}

	/**
	 * Put the site into Simple mode, where the Freshly Pressed data is available
	 * locally and there is nothing to fetch over HTTP.
	 *
	 * @return void
	 */
	private function make_simple_site() {
		Constants::set_constant( 'IS_WPCOM', true );
	}

	/**
	 * Set what the wpcom Freshly Pressed plugin returns, and which posts still exist.
	 *
	 * @param array|null $featured   What `FreshlyPressed::get_available_posts()` returns.
	 * @param array      $blog_posts Posts keyed as `<blog_id>:<post_id>`.
	 * @return void
	 */
	private function given_wpcom_data( $featured, array $blog_posts = array() ) {
		$GLOBALS['jetpack_newsletter_wpcom_doubles']['freshly_pressed'] = $featured;
		$GLOBALS['jetpack_newsletter_wpcom_doubles']['blog_posts']      = $blog_posts;
	}

	/**
	 * Test that Simple sites read the posts locally instead of calling the public API.
	 */
	public function test_get_posts_queries_wpcom_directly_on_simple_sites() {
		$this->make_simple_site();
		$this->stub_http_response( array() );
		$this->given_wpcom_data(
			array(
				'posts' => array(
					array(
						'blog_id' => 34,
						'post_id' => 12,
					),
				),
			),
			array( '34:12' => (object) array( 'post_title' => 'A wpcom post' ) )
		);

		$posts = Freshly_Pressed::get_posts();

		$this->assertSame(
			array(
				array(
					'title'     => 'A wpcom post',
					'permalink' => 'https://wordpress.com/reader/blogs/34/posts/12?algo=freshly-pressed&ref=dashboard_widget',
					'blog_id'   => 34,
					'post_id'   => 12,
				),
			),
			$posts
		);
		$this->assertSame( array(), $this->requested_urls, 'Simple sites should not call the public API.' );
		$this->assertSame(
			Freshly_Pressed::POST_COUNT,
			$GLOBALS['jetpack_newsletter_wpcom_doubles']['last_args']['number']
		);
	}

	/**
	 * Test that a featured post which has since been deleted is skipped rather
	 * than rendered as an empty link.
	 */
	public function test_get_posts_skips_deleted_posts_on_simple_sites() {
		$this->make_simple_site();
		$this->given_wpcom_data(
			array(
				'posts' => array(
					array(
						'blog_id' => 34,
						'post_id' => 12,
					),
					array(
						'blog_id' => 56,
						'post_id' => 78,
					),
				),
			),
			array( '56:78' => (object) array( 'post_title' => 'Still here' ) )
		);

		$posts = Freshly_Pressed::get_posts();

		$this->assertCount( 1, $posts );
		$this->assertSame( 'Still here', $posts[0]['title'] );
	}

	/**
	 * Test that an untitled post is skipped on Simple sites too.
	 */
	public function test_get_posts_skips_untitled_posts_on_simple_sites() {
		$this->make_simple_site();
		$this->given_wpcom_data(
			array(
				'posts' => array(
					array(
						'blog_id' => 34,
						'post_id' => 12,
					),
					array(
						'blog_id' => 56,
						'post_id' => 78,
					),
				),
			),
			array(
				'34:12' => (object) array( 'post_title' => '' ),
				'56:78' => (object) array( 'post_title' => 'Has a title' ),
			)
		);

		$posts = Freshly_Pressed::get_posts();

		$this->assertCount( 1, $posts );
		$this->assertSame( 'Has a title', $posts[0]['title'] );
	}

	/**
	 * Test that a Simple site with no local Freshly Pressed data degrades to an
	 * empty list rather than falling back to an HTTP request.
	 */
	public function test_get_posts_returns_an_empty_list_when_wpcom_has_no_data() {
		$this->make_simple_site();
		$this->stub_http_response( array() );
		$this->given_wpcom_data( null );

		$this->assertSame( array(), Freshly_Pressed::get_posts() );
		$this->assertSame( array(), $this->requested_urls, 'Simple sites should not call the public API.' );
	}
}
