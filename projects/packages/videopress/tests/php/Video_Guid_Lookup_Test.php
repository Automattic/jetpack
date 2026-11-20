<?php
/**
 * Tests for language-independent VideoPress attachment lookups.
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack\VideoPress;

use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;

class Video_Guid_Lookup_Test extends BaseTestCase {

	const GUID = 'GuId1234';

	/**
	 * The attachment returned by the database fixture.
	 *
	 * @var int
	 */
	private $attachment_id;

	/**
	 * Number of successful uncached attachment queries.
	 *
	 * @var int
	 */
	private $resolved_queries = 0;

	/**
	 * Set up an attachment and simulate WPML's attachment query filtering.
	 */
	protected function set_up() {
		require_once __DIR__ . '/../../src/utility-functions.php';
		$this->attachment_id = wp_insert_post(
			array(
				'post_title'     => 'Test video',
				'post_type'      => 'attachment',
				'post_status'    => 'inherit',
				'post_mime_type' => 'video/videopress',
			)
		);
		update_post_meta( $this->attachment_id, 'videopress_guid', self::GUID );
		add_action( 'pre_get_posts', array( $this, 'enable_attachment_language_filter' ) );
		add_filter( 'posts_where', array( $this, 'exclude_attachments_in_current_language' ), 10, 2 );
		add_filter( 'posts_pre_query', array( $this, 'resolve_attachment_query' ), 10, 2 );
		$this->clear_lookup_caches();
	}

	/**
	 * Clear lookup caches and the current user between tests.
	 */
	protected function tear_down() {
		wp_set_current_user( 0 );
		$this->clear_lookup_caches();
	}

	/**
	 * Reset caches that can outlive the WorDBless post fixtures.
	 */
	private function clear_lookup_caches() {
		delete_transient( 'videopress_get_post_id_by_guid_' . self::GUID );
		wp_cache_delete( 'get_post_by_guid_' . self::GUID, 'videopress' );
		wp_cache_flush_group( 'post-queries' );
	}

	/**
	 * Model WPML Media's override unless the query explicitly opts out.
	 *
	 * @param \WP_Query $query The query being prepared.
	 */
	public function enable_attachment_language_filter( $query ) {
		if ( 'attachment' === $query->get( 'post_type' ) && ! $query->get( 'force_suppress_filters' ) ) {
			$query->set( 'suppress_filters', false );
		}
	}

	/**
	 * Model a language in which the requested attachment is excluded.
	 *
	 * @param string    $where The SQL WHERE clause.
	 * @param \WP_Query $query The query being filtered.
	 * @return string
	 */
	public function exclude_attachments_in_current_language( $where, $query ) {
		return 'attachment' === $query->get( 'post_type' ) ? $where . ' AND 1 = 0 /* test_language_filter */' : $where;
	}

	/**
	 * Supply the database result after WordPress has applied its SQL filters.
	 *
	 * @param array|null $posts The short-circuit result, if any.
	 * @param \WP_Query  $query The query being executed.
	 * @return array|null
	 */
	public function resolve_attachment_query( $posts, $query ) {
		if ( 'attachment' !== $query->get( 'post_type' ) || 'video/videopress' !== $query->get( 'post_mime_type' ) ) {
			return $posts;
		}

		// WorDBless cannot execute meta queries; retain WordPress's real SQL-filter behavior.
		$meta_query = $query->get( 'meta_query' );
		if ( false !== strpos( (string) $query->request, 'test_language_filter' ) || self::GUID !== ( $meta_query[0]['value'] ?? null ) ) {
			return array();
		}
		++$this->resolved_queries;
		return array( $this->attachment_id );
	}

	/**
	 * Resolve a GUID across languages without changing ordinary attachment queries.
	 */
	public function test_guid_lookup_ignores_language_filters_only_for_its_query() {
		$args = array(
			'post_type'      => 'attachment',
			'post_mime_type' => 'video/videopress',
			'post_status'    => 'inherit',
			'fields'         => 'ids',
			'meta_query'     => array(
				array(
					'key'   => 'videopress_guid',
					'value' => self::GUID,
				),
			),
		);
		$this->assertSame( array(), ( new \WP_Query( $args ) )->posts );
		$post = videopress_get_post_by_guid( self::GUID );
		$this->assertInstanceOf( \WP_Post::class, $post );
		$this->assertSame( $this->attachment_id, $post->ID );
		$this->assertSame( array(), ( new \WP_Query( $args ) )->posts );
		$this->assertSame( 1, $this->resolved_queries );
	}

	/**
	 * A missing GUID must not resolve to an unrelated attachment.
	 */
	public function test_unknown_guid_returns_false() {
		$this->assertFalse( videopress_get_post_by_guid( 'NoVideo1' ) );
		$this->assertSame( 0, $this->resolved_queries );
	}

	/**
	 * A successful cross-language lookup must still enforce playback permissions.
	 *
	 * @dataProvider provide_playback_permissions
	 * @param bool   $site_default Whether the video inherits the site's private setting.
	 * @param string $scenario     The access scenario.
	 * @param bool   $expected     Whether playback should be allowed.
	 */
	#[DataProvider( 'provide_playback_permissions' )]
	public function test_playback_permissions_after_language_independent_lookup( $site_default, $scenario, $expected ) {
		wp_update_attachment_metadata(
			$this->attachment_id,
			array( 'videopress' => array( 'privacy_setting' => $site_default ? \VIDEOPRESS_PRIVACY::SITE_DEFAULT : \VIDEOPRESS_PRIVACY::IS_PRIVATE ) )
		);
		update_option( 'videopress_private_enabled_for_site', true );
		$user_id = wp_insert_user(
			array(
				'user_login' => 'video_viewer',
				'user_pass'  => 'password',
				'role'       => 'subscriber',
			)
		);
		wp_set_current_user( 'anonymous' === $scenario ? 0 : $user_id );
		$lesson_id = wp_insert_post(
			array(
				'post_title'   => 'Lesson',
				'post_status'  => 'unreadable' === $scenario ? 'private' : 'publish',
				'post_author'  => 0,
				'post_content' => 'unrelated' === $scenario ? 'No video here.' : '[videopress ' . self::GUID . ']',
			)
		);
		if ( 'restricted' === $scenario ) {
			add_filter( 'videopress_is_current_user_authed_for_video', '__return_false' );
		}

		$this->assertSame(
			$expected,
			Access_Control::instance()->is_current_user_authed_for_video( self::GUID, 'missing' === $scenario ? 0 : $lesson_id )
		);
		$this->assertSame( 1, $this->resolved_queries, 'Authorization must exercise the uncached attachment lookup.' );
	}

	/**
	 * Playback permission cases for private and Site Default videos.
	 *
	 * @return array
	 */
	public static function provide_playback_permissions() {
		$cases = array();
		foreach ( array(
			'private'      => false,
			'site_default' => true,
		) as $privacy => $site_default ) {
			foreach ( array( 'allowed', 'missing', 'unrelated', 'unreadable', 'anonymous', 'restricted' ) as $scenario ) {
				$cases[ $privacy . '_' . $scenario ] = array( $site_default, $scenario, 'allowed' === $scenario );
			}
		}
		return $cases;
	}
}
