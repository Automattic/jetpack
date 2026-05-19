<?php
/**
 * @package automattic/jetpack-podcast
 */

namespace Automattic\Jetpack\Podcast\Tests;

use Automattic\Jetpack\Podcast\Episode_Query;
use Automattic\Jetpack\Podcast\Podcast_Status_Endpoint;
use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;
use WorDBless\Posts as WorDBless_Posts;
use WP_Term;

/**
 * @covers \Automattic\Jetpack\Podcast\Podcast_Status_Endpoint
 * @covers \Automattic\Jetpack\Podcast\Episode_Query
 */
#[CoversClass( Podcast_Status_Endpoint::class )]
#[CoversClass( Episode_Query::class )]
class Podcast_Status_Endpoint_Test extends BaseTestCase {

	protected function setUp(): void {
		parent::setUp();

		if ( ! taxonomy_exists( 'category' ) ) {
			register_taxonomy( 'category', 'post', array( 'hierarchical' => true ) );
		}
	}

	protected function tearDown(): void {
		delete_option( 'podcasting_category_id' );
		remove_all_filters( 'category_feed_link' );
		remove_all_filters( 'posts_pre_query' );
		wp_cache_flush();
		WorDBless_Posts::init()->clear_all_posts();
		parent::tearDown();
	}

	private function configure_podcast_category( int $id = 42 ): int {
		$term = new WP_Term(
			(object) array(
				'term_id'          => $id,
				'name'             => 'Podcast',
				'slug'             => 'podcast',
				'taxonomy'         => 'category',
				'term_taxonomy_id' => $id,
			)
		);
		wp_cache_set( $id, $term, 'terms' );
		update_option( 'podcasting_category_id', $id );
		return $id;
	}

	private function insert_post_in_category( int $category_id, string $content ): \WP_Post {
		$post_id = wp_insert_post(
			array(
				'post_title'   => 'Episode ' . wp_generate_uuid4(),
				'post_content' => $content,
				'post_status'  => 'publish',
				'post_type'    => 'post',
			)
		);
		wp_cache_set( (int) $post_id, array( $category_id ), 'category_relationships' );
		$post               = get_post( (int) $post_id );
		$post->post_content = $content;
		return $post;
	}

	public function test_read_status_uses_wordpress_category_feed_link() {
		$this->configure_podcast_category();
		add_filter(
			'category_feed_link',
			static function () {
				return 'https://example.org/?cat=42&feed=rss2';
			}
		);

		$response = ( new Podcast_Status_Endpoint() )->read_status();
		$data     = $response->get_data();

		$this->assertSame( 'https://example.org/?cat=42&feed=rss2', $data['feedUrl'] );
	}

	public function test_read_status_requires_actual_podcast_media_for_published_episode() {
		$cat_id  = $this->configure_podcast_category();
		$regular = $this->insert_post_in_category( $cat_id, 'A regular post without podcast media.' );

		add_filter(
			'posts_pre_query',
			static function ( $posts, $query ) use ( $regular ) {
				return 'post' === $query->get( 'post_type' ) ? array( $regular ) : $posts;
			},
			10,
			2
		);
		$response = ( new Podcast_Status_Endpoint() )->read_status();
		$data     = $response->get_data();

		$this->assertFalse( $data['hasPublishedEpisode'] );
		remove_all_filters( 'posts_pre_query' );

		$episode = $this->insert_post_in_category(
			$cat_id,
			'<!-- wp:jetpack/podcast-episode {"mediaUrl":"https://example.org/episode.mp3","mediaType":"audio"} /-->'
		);

		add_filter(
			'posts_pre_query',
			static function ( $posts, $query ) use ( $regular, $episode ) {
				return 'post' === $query->get( 'post_type' ) ? array( $regular, $episode ) : $posts;
			},
			10,
			2
		);
		$response = ( new Podcast_Status_Endpoint() )->read_status();
		$data     = $response->get_data();

		$this->assertTrue( $data['hasPublishedEpisode'] );
	}
}
