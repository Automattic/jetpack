<?php
/**
 * @package automattic/jetpack-podcast
 */

namespace Automattic\Jetpack\Podcast\Tests;

use Automattic\Jetpack\Podcast\Podcast;
use WorDBless\BaseTestCase;
use WP_Query;
use WP_REST_Request;
use WP_Term;

/**
 * The episode dashboard reads core's posts endpoint. That query must match the
 * feed: posts in the podcast category that have an audio or episode block.
 */
class Episode_Query_Test extends BaseTestCase {

	const CATEGORY_ID = 7;

	protected function setUp(): void {
		parent::setUp();
		$term = new WP_Term(
			(object) array(
				'term_id'          => self::CATEGORY_ID,
				'name'             => 'Podcast',
				'slug'             => 'podcast',
				'taxonomy'         => 'category',
				'term_taxonomy_id' => self::CATEGORY_ID,
			)
		);
		wp_cache_set( self::CATEGORY_ID, $term, 'terms' );
		update_option( 'podcasting_category_id', self::CATEGORY_ID );
		add_filter( 'rest_post_query', array( Podcast::class, 'limit_episode_query' ), 10, 2 );
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

	public function test_podcast_category_query_is_flagged_and_keeps_its_status() {
		$args = $this->query_for( self::CATEGORY_ID );

		$this->assertTrue( $args['jetpack_podcast_episodes'] );
		$this->assertSame( 'any', $args['post_status'] );
	}

	public function test_other_category_query_is_untouched() {
		$this->assertArrayNotHasKey( 'jetpack_podcast_episodes', $this->query_for( 99 ) );
	}

	public function test_flagged_query_requires_an_audio_or_episode_block() {
		$query = new WP_Query();
		$query->set( 'jetpack_podcast_episodes', true );

		$where = Podcast::limit_episode_where( '', $query );

		$this->assertStringContainsString( '<!-- wp:audio ', $where );
		$this->assertStringContainsString( '<!-- wp:jetpack/podcast-episode ', $where );
		$this->assertSame( ' AND 1=1', Podcast::limit_episode_where( ' AND 1=1', new WP_Query() ) );
	}
}
