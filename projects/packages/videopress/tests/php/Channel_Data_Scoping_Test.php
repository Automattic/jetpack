<?php
/**
 * Tests that the channel's video data stays on its own site and pages in SQL.
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack;

use Automattic\Jetpack\VideoPress\Channel;
use Automattic\Jetpack\VideoPress\Channel_Data;
use WorDBless\BaseTestCase;
use WP_Query;

/**
 * Test suite for Channel_Data's per-site caches, SQL paging and Channel's GUID lookup.
 */
class Channel_Data_Scoping_Test extends BaseTestCase {

	/**
	 * Attachments, newest first, that the faked SQL query pages through.
	 *
	 * @var \WP_Post[]
	 */
	private $posts = array();

	/**
	 * Query vars of every attachment query the faked SQL answered.
	 *
	 * @var array[]
	 */
	private $queries = array();

	/**
	 * The blog ID before a test switched it.
	 *
	 * @var int
	 */
	private $blog_id;

	/**
	 * Start from empty caches.
	 */
	protected function set_up() {
		$this->blog_id = get_current_blog_id();
		Channel_Data::reset();
		wp_cache_flush();
	}

	/**
	 * Undo the filters and the blog switch.
	 */
	protected function tear_down() {
		$GLOBALS['blog_id'] = $this->blog_id;
		remove_all_filters( 'posts_pre_query' );
		remove_all_filters( 'videopress_channel_videos' );
		remove_all_filters( 'videopress_channel_video_views' );
		Channel_Data::reset();
		wp_cache_flush();
	}

	/**
	 * A VideoPress attachment.
	 *
	 * @param string $guid VideoPress GUID.
	 * @return int Attachment ID.
	 */
	private function video( $guid ) {
		$id = wp_insert_post(
			array(
				'post_type'      => 'attachment',
				'post_status'    => 'inherit',
				'post_mime_type' => Channel::MIME_TYPE,
				'post_title'     => $guid,
			)
		);
		update_post_meta( $id, 'videopress_guid', $guid );
		return $id;
	}

	/**
	 * Answer attachment queries from $this->posts, like SQL would: ordered, paged and counted.
	 */
	private function fake_sql() {
		for ( $i = 1; $i <= 5; $i++ ) {
			$this->posts[] = get_post( $this->video( 'video00' . $i ) );
		}
		add_filter(
			'posts_pre_query',
			function ( $posts, WP_Query $query ) {
				if ( 'attachment' !== $query->get( 'post_type' ) ) {
					return $posts;
				}
				$this->queries[] = $query->query_vars;

				$order    = $query->get( 'orderby' );
				$all      = is_array( $order ) && 'ASC' === ( $order['date'] ?? '' ) ? array_reverse( $this->posts ) : $this->posts;
				$per_page = (int) $query->get( 'posts_per_page' );
				$page     = max( 1, (int) $query->get( 'paged' ) );

				$query->found_posts = count( $all );
				return array_slice( $all, ( $page - 1 ) * $per_page, $per_page );
			},
			10,
			2
		);
	}

	/**
	 * Switching blogs mid-request must not return the previous blog's video list or play counts.
	 */
	public function test_lists_and_views_are_kept_per_blog() {
		add_filter(
			'videopress_channel_videos',
			function () {
				return array(
					array(
						'id'          => get_current_blog_id() * 10,
						'guid'        => 'blog000' . get_current_blog_id(),
						'durationMs'  => 0,
						'height'      => 0,
						'publishedAt' => 0,
					),
				);
			}
		);
		add_filter(
			'videopress_channel_video_views',
			function () {
				return array( get_current_blog_id() * 10 => get_current_blog_id() );
			}
		);

		$this->assertSame( 'blog0001', Channel_Data::videos()[0]['guid'] );
		$this->assertSame( array( 10 => 1 ), Channel_Data::video_views() );

		$GLOBALS['blog_id'] = 2;
		$this->assertSame( 'blog0002', Channel_Data::videos()[0]['guid'] );
		$this->assertSame( array( 20 => 2 ), Channel_Data::video_views() );
	}

	/**
	 * The object-cache key changes with the blog and whenever a post changes.
	 */
	public function test_cache_key_follows_blog_and_post_changes() {
		$key = Channel_Data::cache_key( 'videos' );

		$GLOBALS['blog_id'] = 2;
		$this->assertNotSame( $key, Channel_Data::cache_key( 'videos' ) );

		$GLOBALS['blog_id'] = $this->blog_id;
		$this->assertSame( $key, Channel_Data::cache_key( 'videos' ) );
		wp_cache_set_last_changed( 'posts' );
		$this->assertNotSame( $key, Channel_Data::cache_key( 'videos' ) );
	}

	/**
	 * The full list is read from SQL once, reused from the object cache, and re-read after an upload.
	 */
	public function test_full_list_is_cached_until_posts_change() {
		$this->fake_sql();

		$this->assertCount( 5, Channel_Data::videos() );
		Channel_Data::reset();
		$this->assertCount( 5, Channel_Data::videos() );
		$this->assertCount( 1, $this->queries, 'A new request reads the cached list.' );

		wp_cache_set_last_changed( 'posts' );
		Channel_Data::reset();
		Channel_Data::videos();
		$this->assertCount( 2, $this->queries, 'A post change invalidates the list.' );
	}

	/**
	 * Newest and oldest pages query only the page, with the SQL total.
	 */
	public function test_browse_pages_in_sql() {
		$this->fake_sql();

		$state  = array(
			'search' => '',
			'sort'   => 'oldest',
			'length' => 'any',
			'page'   => 2,
		);
		$result = Channel_Data::browse( $state, 2 );

		$this->assertSame( array( 'video003', 'video002' ), array_column( $result['entries'], 'guid' ) );
		$this->assertSame( 5, $result['total'] );
		$this->assertSame( 3, $result['pages'] );
		$this->assertCount( 1, $this->queries );
		$this->assertSame( 2, (int) $this->queries[0]['posts_per_page'] );
		$this->assertSame( 2, (int) $this->queries[0]['paged'] );
		$this->assertSame( 5, Channel_Data::video_count() );
		$this->assertSame( 'video001', Channel::guid( Channel_Data::latest_video() ) );
		$this->assertCount( 3, $this->queries, 'Count and latest video read one row each, not the full list.' );
	}

	/**
	 * Up next: the first page without the current video still pages in SQL, with an exact total.
	 */
	public function test_browse_excludes_on_the_first_page_in_sql() {
		$this->fake_sql();

		$state  = array(
			'search' => '',
			'sort'   => 'newest',
			'length' => 'any',
			'page'   => 1,
		);
		$result = Channel_Data::browse( $state, 2, array( 'video001' ) );

		$this->assertSame( array( 'video002', 'video003' ), array_column( $result['entries'], 'guid' ) );
		$this->assertSame( 4, $result['total'] );
		$this->assertSame( 3, (int) $this->queries[0]['posts_per_page'] );
	}

	/**
	 * Popular and length filters need every video, so they read the full list.
	 */
	public function test_popular_reads_the_full_list() {
		$this->fake_sql();

		Channel_Data::browse(
			array(
				'search' => '',
				'sort'   => 'popular',
				'length' => 'any',
				'page'   => 1,
			),
			2
		);
		$this->assertSame( Channel_Data::MAX_VIDEOS, (int) $this->queries[0]['posts_per_page'] );
	}

	/**
	 * WordPress.com's GUID lookup returns another blog's post ID; a local post with
	 * that ID but another GUID, or one that is not an attachment, is never used.
	 */
	public function test_attachment_id_only_returns_this_blogs_attachment_for_the_guid() {
		$local = $this->video( 'localGU1' );
		$page  = wp_insert_post(
			array(
				'post_type'   => 'page',
				'post_status' => 'publish',
				'post_title'  => 'Not a video',
			)
		);

		set_transient( 'videopress_get_post_id_by_guid_localGU1', $local, HOUR_IN_SECONDS );
		set_transient( 'videopress_get_post_id_by_guid_remoteG1', $local, HOUR_IN_SECONDS );
		set_transient( 'videopress_get_post_id_by_guid_remoteG2', $page, HOUR_IN_SECONDS );

		$this->assertSame( $local, Channel::attachment_id( 'localGU1' ) );
		$this->assertSame( 0, Channel::attachment_id( 'remoteG1' ) );
		$this->assertSame( 0, Channel::attachment_id( 'remoteG2' ) );
	}
}
