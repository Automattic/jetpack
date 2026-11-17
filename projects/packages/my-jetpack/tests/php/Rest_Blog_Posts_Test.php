<?php

namespace Automattic\Jetpack\My_Jetpack;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;
use WorDBless\Options as WorDBless_Options;

/**
 * Tests for REST_Blog_Posts.
 *
 * @package automattic/my-jetpack
 * @covers \Automattic\Jetpack\My_Jetpack\REST_Blog_Posts
 */
#[CoversClass( REST_Blog_Posts::class )]
class Rest_Blog_Posts_Test extends TestCase {

	/**
	 * Feed requests that reached the HTTP layer.
	 *
	 * @var int
	 */
	private $requests = 0;

	/**
	 * Give the feed sanitizer the charset every real site has.
	 */
	public function setUp(): void {
		parent::setUp();
		update_option( 'blog_charset', 'UTF-8' );
	}

	/**
	 * Clear cached feeds and request counts.
	 */
	public function tearDown(): void {
		remove_all_filters( 'pre_http_request' );
		WorDBless_Options::init()->clear_options();
		$this->requests = 0;

		parent::tearDown();
	}

	/**
	 * Answer feed requests with the given response.
	 *
	 * @param array|\WP_Error $response The HTTP response.
	 */
	private function serve_feed( $response ) {
		add_filter(
			'pre_http_request',
			function () use ( $response ) {
				++$this->requests;
				return $response;
			}
		);
	}

	public function test_returns_posts_with_resized_thumbnails_and_null_when_missing_or_unsafe() {
		$this->serve_feed(
			array(
				'headers'  => array( 'content-type' => 'application/rss+xml' ),
				'body'     => file_get_contents( __DIR__ . '/fixtures/blog-feed.xml' ),
				'response' => array(
					'code'    => 200,
					'message' => 'OK',
				),
				'cookies'  => array(),
			)
		);

		$posts = REST_Blog_Posts::get_blog_posts()->get_data();

		$this->assertSame(
			array(
				array(
					'title'     => 'Jetpack’s new release',
					'link'      => 'https://jetpack.com/resources/new-release/',
					'date'      => '2026-10-15T21:24:22+00:00',
					'excerpt'   => 'What’s new this month.',
					'thumbnail' => 'https://jetpack.com/wp-content/uploads/2026/10/new-release.png?resize=112,112',
				),
				array(
					'title'     => 'A post without an image',
					'link'      => 'https://jetpack.com/resources/no-image/',
					'date'      => '2026-10-07T19:48:41+00:00',
					'excerpt'   => 'No thumbnail here.',
					'thumbnail' => null,
				),
				array(
					'title'     => 'A post with an unsafe image',
					'link'      => 'https://jetpack.com/resources/unsafe-image/',
					'date'      => '2026-10-02T17:59:46+00:00',
					'excerpt'   => 'Unsafe thumbnail.',
					'thumbnail' => null,
				),
			),
			$posts
		);
	}

	public function test_failed_feed_returns_nothing_and_is_not_refetched() {
		$this->serve_feed( new \WP_Error( 'http_request_failed', 'Down.' ) );

		$first  = REST_Blog_Posts::get_blog_posts()->get_data();
		$second = REST_Blog_Posts::get_blog_posts()->get_data();

		$this->assertSame( array( array(), array(), 1 ), array( $first, $second, $this->requests ) );
	}
}
