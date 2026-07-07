<?php
/**
 * Tests for VideoPress playback authorization through playlist-block embeds.
 *
 * Follows the scenarios of the main suite's Video_Authorization_Test, but
 * lives in the sqlite suite (tests/php-sqlite) because the playlist binding is
 * term membership — has_term() needs real term relationship tables, which the
 * main suite's 'dbless' engine does not provide. Deliberately does NOT extend
 * WorDBless\BaseTestCase: its teardown instantiates the dbless module
 * singletons, whose hooks (e.g. the `wp_insert_post_data` ID override) would
 * corrupt real sqlite inserts in subsequent tests.
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack\VideoPress;

use Yoast\PHPUnitPolyfills\TestCases\TestCase;

/**
 * Authorization test suite for the playlist branch of
 * Access_Control::is_current_user_authed_for_video().
 */
class Playlist_Authorization_Test extends TestCase {

	/**
	 * Attachment IDs created during the current test.
	 *
	 * @var int[]
	 */
	private $attachment_ids = array();

	/**
	 * Post IDs created during the current test.
	 *
	 * @var int[]
	 */
	private $post_ids = array();

	/**
	 * Term IDs created during the current test.
	 *
	 * @var int[]
	 */
	private $term_ids = array();

	/**
	 * User IDs created during the current test.
	 *
	 * @var int[]
	 */
	private $user_ids = array();

	/**
	 * Guids created during the current test (for cache/transient cleanup).
	 *
	 * @var string[]
	 */
	private $guids = array();

	/**
	 * Set up before each test.
	 */
	protected function set_up() {
		parent::set_up();

		if ( ! defined( 'DB_ENGINE' ) || 'sqlite' !== constant( 'DB_ENGINE' ) ) {
			$this->markTestSkipped( 'Playlist authorization tests need real taxonomy tables; run them via the sqlite test suite (composer phpunit).' );
		}
	}

	/**
	 * Clean up after each test.
	 *
	 * The sqlite database persists across tests and runs, so every entity a
	 * test creates is tracked and deleted here — including the guid lookup
	 * transients videopress_get_post_id_by_guid() writes — and the global
	 * registration state is reset.
	 */
	protected function tear_down() {
		wp_set_current_user( 0 );

		foreach ( $this->attachment_ids as $attachment_id ) {
			wp_delete_attachment( $attachment_id, true );
		}
		$this->attachment_ids = array();

		foreach ( $this->post_ids as $post_id ) {
			wp_delete_post( $post_id, true );
		}
		$this->post_ids = array();

		// A flag-off test may have unregistered the taxonomy mid-test; deleting
		// the persisted term rows requires it registered.
		if ( array() !== $this->term_ids && ! taxonomy_exists( Playlists::TAXONOMY ) ) {
			register_taxonomy( Playlists::TAXONOMY, 'attachment' );
		}
		foreach ( $this->term_ids as $term_id ) {
			wp_delete_term( $term_id, Playlists::TAXONOMY );
		}
		$this->term_ids = array();

		foreach ( $this->user_ids as $user_id ) {
			wp_delete_user( $user_id );
		}
		$this->user_ids = array();

		foreach ( $this->guids as $guid ) {
			delete_transient( 'videopress_get_post_id_by_guid_' . $guid );
		}
		$this->guids = array();

		remove_all_filters( Admin_UI::STUDIO_FILTER );

		foreach ( array( Playlists::META_ARTWORK_ID, Playlists::META_ORDER ) as $meta_key ) {
			unregister_meta_key( 'term', $meta_key, Playlists::TAXONOMY );
		}
		if ( taxonomy_exists( Playlists::TAXONOMY ) ) {
			unregister_taxonomy( Playlists::TAXONOMY );
		}

		wp_cache_flush();

		parent::tear_down();
	}

	/**
	 * Turn the Studio flag on and register the taxonomy and term meta.
	 */
	private function enable_studio_and_register() {
		add_filter( Admin_UI::STUDIO_FILTER, '__return_true' );
		Playlists::register();
	}

	/**
	 * Create a private VideoPress attachment carrying a guid.
	 *
	 * @param string $guid The VideoPress guid to associate.
	 * @return int The attachment post id.
	 */
	private function create_private_videopress_attachment( $guid ) {
		$this->guids[] = $guid;

		$attachment_id = wp_insert_post(
			array(
				'post_title'     => $guid,
				'post_status'    => 'inherit',
				'post_type'      => 'attachment',
				'post_mime_type' => 'video/videopress',
			)
		);
		$this->assertIsInt( $attachment_id );
		$this->attachment_ids[] = $attachment_id;

		update_post_meta( $attachment_id, 'videopress_guid', $guid );
		wp_update_attachment_metadata(
			$attachment_id,
			array(
				'videopress' => array(
					'privacy_setting' => \VIDEOPRESS_PRIVACY::IS_PRIVATE,
				),
			)
		);

		return $attachment_id;
	}

	/**
	 * Create a playlist term and assign the given attachments to it.
	 *
	 * @param int[] $member_ids Attachment IDs to assign.
	 * @return int Term ID.
	 */
	private function create_playlist_with_members( $member_ids = array() ) {
		$term = wp_insert_term( 'Playlist ' . uniqid(), Playlists::TAXONOMY );
		$this->assertIsArray( $term );
		$term_id          = (int) $term['term_id'];
		$this->term_ids[] = $term_id;

		foreach ( $member_ids as $member_id ) {
			wp_set_object_terms( $member_id, array( $term_id ), Playlists::TAXONOMY, true );
		}

		return $term_id;
	}

	/**
	 * Create a published post with the given content.
	 *
	 * @param string $content Post content.
	 * @return int Post ID.
	 */
	private function create_published_post( $content ) {
		$post_id = wp_insert_post(
			array(
				'post_title'   => 'Embedding post ' . uniqid(),
				'post_content' => $content,
				'post_status'  => 'publish',
			)
		);
		$this->assertIsInt( $post_id );
		$this->post_ids[] = $post_id;

		return $post_id;
	}

	/**
	 * Create a subscriber and set it as the current user.
	 */
	private function act_as_subscriber() {
		$login   = 'vps_playlist_auth_subscriber_' . uniqid();
		$user_id = wp_insert_user(
			array(
				'user_login' => $login,
				'user_pass'  => 'password',
				'user_email' => $login . '@example.com',
				'role'       => 'subscriber',
			)
		);
		$this->assertIsInt( $user_id );
		$this->user_ids[] = $user_id;

		wp_set_current_user( $user_id );
	}

	/**
	 * A post embedding a playlist block is a legitimate context for the
	 * playlist's own members — even though the guid appears nowhere in the
	 * post content, which is what defeats the video-block/shortcode/URL scans.
	 */
	public function test_subscriber_with_playlist_block_post_is_authorized_for_member_video() {
		$this->enable_studio_and_register();

		$guid          = 'pLmEmBr1' . uniqid();
		$attachment_id = $this->create_private_videopress_attachment( $guid );
		$playlist_id   = $this->create_playlist_with_members( array( $attachment_id ) );
		$embedding     = $this->create_published_post(
			'<!-- wp:videopress/playlist {"playlistId":' . $playlist_id . '} /-->'
		);
		$this->act_as_subscriber();

		$this->assertTrue( Access_Control::instance()->is_current_user_authed_for_video( $guid, $embedding ) );
	}

	/**
	 * A playlist block nested inside another block (e.g. a group) still binds
	 * its members — the block scan must recurse into innerBlocks.
	 */
	public function test_subscriber_is_authorized_when_playlist_block_is_nested() {
		$this->enable_studio_and_register();

		$guid          = 'pLnEsTd1' . uniqid();
		$attachment_id = $this->create_private_videopress_attachment( $guid );
		$playlist_id   = $this->create_playlist_with_members( array( $attachment_id ) );
		$embedding     = $this->create_published_post(
			'<!-- wp:group --><div class="wp-block-group"><!-- wp:videopress/playlist {"playlistId":' . $playlist_id . '} /--></div><!-- /wp:group -->'
		);
		$this->act_as_subscriber();

		$this->assertTrue( Access_Control::instance()->is_current_user_authed_for_video( $guid, $embedding ) );
	}

	/**
	 * Block presence alone must not satisfy the binding: a private video that
	 * is not a member of the embedded playlist stays locked, preserving the
	 * anti-enumeration property of the embedded-post check.
	 */
	public function test_subscriber_is_denied_for_non_member_video_despite_playlist_block() {
		$this->enable_studio_and_register();

		$member_guid = 'pLmEmBr2' . uniqid();
		$target_guid = 'pLoUtSd1' . uniqid();
		$member_id   = $this->create_private_videopress_attachment( $member_guid );
		$this->create_private_videopress_attachment( $target_guid );
		$playlist_id = $this->create_playlist_with_members( array( $member_id ) );
		$embedding   = $this->create_published_post(
			'<!-- wp:videopress/playlist {"playlistId":' . $playlist_id . '} /-->'
		);
		$this->act_as_subscriber();

		$this->assertFalse( Access_Control::instance()->is_current_user_authed_for_video( $target_guid, $embedding ) );
	}

	/**
	 * Membership must match the playlist the block actually references: being
	 * a member of some other playlist does not unlock the video.
	 */
	public function test_subscriber_is_denied_when_block_references_playlist_video_is_not_in() {
		$this->enable_studio_and_register();

		$guid          = 'pLwRoNg1' . uniqid();
		$attachment_id = $this->create_private_videopress_attachment( $guid );
		$this->create_playlist_with_members( array( $attachment_id ) );

		$other_member      = $this->create_private_videopress_attachment( 'pLoThEr1' . uniqid() );
		$other_playlist_id = $this->create_playlist_with_members( array( $other_member ) );

		$embedding = $this->create_published_post(
			'<!-- wp:videopress/playlist {"playlistId":' . $other_playlist_id . '} /-->'
		);
		$this->act_as_subscriber();

		$this->assertFalse( Access_Control::instance()->is_current_user_authed_for_video( $guid, $embedding ) );
	}

	/**
	 * Malformed playlist block attributes are skipped safely: no playlistId,
	 * non-numeric garbage, and non-scalar values must all deny without notices.
	 */
	public function test_subscriber_is_denied_for_malformed_playlist_block_attributes() {
		$this->enable_studio_and_register();

		$guid          = 'pLmAlFm1' . uniqid();
		$attachment_id = $this->create_private_videopress_attachment( $guid );
		$playlist_id   = $this->create_playlist_with_members( array( $attachment_id ) );

		$malformed_contents = array(
			'<!-- wp:videopress/playlist /-->',
			'<!-- wp:videopress/playlist {"playlistId":"garbage"} /-->',
			'<!-- wp:videopress/playlist {"playlistId":[' . $playlist_id . ']} /-->',
			'<!-- wp:videopress/playlist {"playlistId":-5} /-->',
		);

		$embeddings = array();
		foreach ( $malformed_contents as $content ) {
			$embeddings[ $content ] = $this->create_published_post( $content );
		}

		$this->act_as_subscriber();

		foreach ( $embeddings as $content => $embedding ) {
			$this->assertFalse(
				Access_Control::instance()->is_current_user_authed_for_video( $guid, $embedding ),
				"Content should not authorize: {$content}"
			);
		}
	}

	/**
	 * When the Studio flag is off at request time the taxonomy is not
	 * registered and the block renders nothing — the playlist binding must be
	 * refused too, even if term relationships persist in the database.
	 */
	public function test_subscriber_is_denied_when_taxonomy_is_unregistered() {
		$this->enable_studio_and_register();

		$guid          = 'pLfLaGf1' . uniqid();
		$attachment_id = $this->create_private_videopress_attachment( $guid );
		$playlist_id   = $this->create_playlist_with_members( array( $attachment_id ) );
		$embedding     = $this->create_published_post(
			'<!-- wp:videopress/playlist {"playlistId":' . $playlist_id . '} /-->'
		);

		// Simulate a later request with the flag off.
		unregister_taxonomy( Playlists::TAXONOMY );

		$this->act_as_subscriber();

		$this->assertFalse( Access_Control::instance()->is_current_user_authed_for_video( $guid, $embedding ) );
	}
}
