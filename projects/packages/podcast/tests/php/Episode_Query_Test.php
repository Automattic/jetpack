<?php
/**
 * @package automattic/jetpack-podcast
 */

namespace Automattic\Jetpack\Podcast\Tests;

use WorDBless\BaseTestCase;
use WP_REST_Request;

/**
 * The episode dashboard reads core's posts endpoint. That query must match the
 * feed: published posts in the podcast category that have an enclosure.
 */
class Episode_Query_Test extends BaseTestCase {

	const CATEGORY_ID = 7;

	protected function setUp(): void {
		parent::setUp();
		update_option( 'podcasting_category_id', self::CATEGORY_ID );
		\Automattic\Jetpack\Podcast\Podcast::init();
	}

	protected function tearDown(): void {
		delete_option( 'podcasting_category_id' );
		parent::tearDown();
	}

	private function query_for( int $category_id, string $status = 'any' ): array {
		$request = new WP_REST_Request( 'GET', '/wp/v2/posts' );
		$request->set_param( 'categories', $category_id );
		$request->set_param( 'status', $status );
		return apply_filters( 'rest_post_query', array( 'post_status' => $status ), $request );
	}

	public function test_podcast_category_query_is_limited_to_published_posts_with_enclosure() {
		$args = $this->query_for( self::CATEGORY_ID );

		$this->assertSame( 'publish', $args['post_status'] );
		$this->assertContains(
			array(
				'key'     => 'enclosure',
				'compare' => 'EXISTS',
			),
			$args['meta_query'] ?? array()
		);
	}

	public function test_other_category_query_is_untouched() {
		$args = $this->query_for( 99 );

		$this->assertSame( 'any', $args['post_status'] );
		$this->assertArrayNotHasKey( 'meta_query', $args );
	}
}
