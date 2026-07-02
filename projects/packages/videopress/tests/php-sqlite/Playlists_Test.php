<?php
/**
 * Tests for the VideoPress Playlists taxonomy, term meta, and the core REST
 * media endpoint integration.
 *
 * Lives in the sqlite suite (tests/php-sqlite) because taxonomy term storage
 * needs real database tables, which the main suite's 'dbless' engine does not
 * provide. Deliberately does NOT extend WorDBless\BaseTestCase: its teardown
 * instantiates the dbless module singletons, whose hooks (e.g. the
 * `wp_insert_post_data` ID override) would corrupt real sqlite inserts in
 * subsequent tests.
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack\VideoPress;

use WP_REST_Request;
use WP_REST_Server;
use Yoast\PHPUnitPolyfills\TestCases\TestCase;

/**
 * Test suite for the Playlists class.
 */
class Playlists_Test extends TestCase {

	/**
	 * Attachment IDs created during the current test.
	 *
	 * @var int[]
	 */
	private $attachment_ids = array();

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
	 * Set up before each test.
	 */
	protected function set_up() {
		parent::set_up();

		if ( ! defined( 'DB_ENGINE' ) || 'sqlite' !== constant( 'DB_ENGINE' ) ) {
			$this->markTestSkipped( 'Playlist tests need real taxonomy tables; run them via the sqlite test suite (composer phpunit).' );
		}
	}

	/**
	 * Clean up after each test.
	 *
	 * The sqlite database persists across tests and runs, so every entity a
	 * test creates is tracked and deleted here, and the global registration
	 * state (taxonomy, meta keys, hooks) is reset.
	 */
	protected function tear_down() {
		wp_set_current_user( 0 );

		foreach ( $this->attachment_ids as $attachment_id ) {
			wp_delete_attachment( $attachment_id, true );
		}
		$this->attachment_ids = array();

		if ( taxonomy_exists( Playlists::TAXONOMY ) ) {
			foreach ( $this->term_ids as $term_id ) {
				wp_delete_term( $term_id, Playlists::TAXONOMY );
			}
		}
		$this->term_ids = array();

		foreach ( $this->user_ids as $user_id ) {
			wp_delete_user( $user_id );
		}
		$this->user_ids = array();

		remove_all_filters( Admin_UI::STUDIO_FILTER );
		remove_action( 'init', array( Playlists::class, 'register' ) );
		remove_action( 'delete_attachment', array( Playlists::class, 'prune_deleted_attachment_from_playlist_order' ) );

		foreach ( array( Playlists::META_ARTWORK_ID, Playlists::META_TYPE, Playlists::META_ORDER ) as $meta_key ) {
			unregister_meta_key( 'term', $meta_key, Playlists::TAXONOMY );
		}
		if ( taxonomy_exists( Playlists::TAXONOMY ) ) {
			unregister_taxonomy( Playlists::TAXONOMY );
		}

		global $wp_rest_server;
		$wp_rest_server = null;

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
	 * Create an unattached VideoPress attachment (parent 0, status inherit).
	 *
	 * @return int Attachment ID.
	 */
	private function create_video_attachment() {
		$attachment_id = wp_insert_post(
			array(
				'post_type'      => 'attachment',
				'post_status'    => 'inherit',
				'post_mime_type' => 'video/videopress',
				'post_title'     => 'Test video ' . uniqid(),
			)
		);
		$this->assertIsInt( $attachment_id );
		$this->assertGreaterThan( 0, $attachment_id );
		$this->attachment_ids[] = $attachment_id;

		return $attachment_id;
	}

	/**
	 * Create a playlist term.
	 *
	 * @return int Term ID.
	 */
	private function create_playlist() {
		$term = wp_insert_term( 'Playlist ' . uniqid(), Playlists::TAXONOMY );
		$this->assertIsArray( $term );
		$term_id          = (int) $term['term_id'];
		$this->term_ids[] = $term_id;

		return $term_id;
	}

	/**
	 * Create a user with the given role.
	 *
	 * Logins are unique per call because the sqlite database persists across
	 * tests and runs.
	 *
	 * @param string $role The user role.
	 * @return int The new user ID.
	 */
	private function create_user_with_role( $role ) {
		$login   = 'vps_playlists_' . $role . '_' . uniqid();
		$user_id = wp_insert_user(
			array(
				'user_login' => $login,
				'user_pass'  => 'password',
				'user_email' => $login . '@example.com',
				'role'       => $role,
			)
		);
		$this->assertIsInt( $user_id );
		$this->user_ids[] = $user_id;

		return $user_id;
	}

	/**
	 * Create a fresh REST server and fire rest_api_init so the core routes
	 * (including /wp/v2/media and the taxonomy's terms routes) register.
	 *
	 * @return WP_REST_Server
	 */
	private function initialize_rest_server() {
		global $wp_rest_server;
		$wp_rest_server = new WP_REST_Server();
		do_action( 'rest_api_init' );

		return $wp_rest_server;
	}

	/** Tests that the taxonomy is not registered while the Studio flag is off. */
	public function test_taxonomy_not_registered_when_flag_off() {
		Playlists::register();

		$this->assertFalse( taxonomy_exists( Playlists::TAXONOMY ) );
		$this->assertFalse( registered_meta_key_exists( 'term', Playlists::META_ORDER, Playlists::TAXONOMY ) );
	}

	/** Tests that the taxonomy registers with the expected shape when the flag is on. */
	public function test_taxonomy_registered_when_flag_on() {
		$this->enable_studio_and_register();

		$this->assertTrue( taxonomy_exists( Playlists::TAXONOMY ) );

		$taxonomy = get_taxonomy( Playlists::TAXONOMY );
		$this->assertFalse( $taxonomy->public );
		$this->assertFalse( $taxonomy->show_ui );
		$this->assertTrue( $taxonomy->show_in_rest );
		$this->assertFalse( $taxonomy->hierarchical );
		$this->assertSame( Playlists::REST_BASE, $taxonomy->rest_base );
		$this->assertSame( '_update_generic_term_count', $taxonomy->update_count_callback );
		$this->assertSame( array( 'attachment' ), $taxonomy->object_type );
		$this->assertSame( 'upload_files', $taxonomy->cap->manage_terms );
		$this->assertSame( 'upload_files', $taxonomy->cap->edit_terms );
		$this->assertSame( 'upload_files', $taxonomy->cap->delete_terms );
		$this->assertSame( 'upload_files', $taxonomy->cap->assign_terms );

		foreach ( array( Playlists::META_ARTWORK_ID, Playlists::META_TYPE, Playlists::META_ORDER ) as $meta_key ) {
			$this->assertTrue( registered_meta_key_exists( 'term', $meta_key, Playlists::TAXONOMY ), "Meta key '{$meta_key}' should be registered." );
		}
	}

	/**
	 * Tests that assigning an unattached attachment updates the term count.
	 *
	 * This proves the `_update_generic_term_count` callback works: the default
	 * `_update_post_term_count` only counts attachments whose parent post is
	 * published, so an unattached upload (parent 0, status inherit) would
	 * leave the count at 0 forever.
	 */
	public function test_term_count_updates_when_assigning_attachment() {
		$this->enable_studio_and_register();

		$attachment_id = $this->create_video_attachment();
		$term_id       = $this->create_playlist();

		// Lock in the scenario the generic callback exists for.
		$attachment = get_post( $attachment_id );
		$this->assertSame( 'inherit', $attachment->post_status );
		$this->assertSame( 0, $attachment->post_parent );

		wp_set_object_terms( $attachment_id, array( $term_id ), Playlists::TAXONOMY );
		$this->assertSame( 1, (int) get_term( $term_id, Playlists::TAXONOMY )->count );

		wp_set_object_terms( $attachment_id, array(), Playlists::TAXONOMY );
		$this->assertSame( 0, (int) get_term( $term_id, Playlists::TAXONOMY )->count );
	}

	/** Tests the order meta sanitizer directly: casts, drops non-positive, dedupes. */
	public function test_sanitize_playlist_order() {
		$this->assertSame( array( 3, 5, 2 ), Playlists::sanitize_playlist_order( array( '3', 3, -1, 0, 'nonsense', 5, 2, '5' ) ) );
		$this->assertSame( array(), Playlists::sanitize_playlist_order( 'not-an-array' ) );
		$this->assertSame( array(), Playlists::sanitize_playlist_order( array( 0, -7, 'x' ) ) );
	}

	/** Tests that the order sanitizer is wired to writes via update_term_meta(). */
	public function test_playlist_order_meta_is_sanitized_on_write() {
		$this->enable_studio_and_register();

		$term_id = $this->create_playlist();

		update_term_meta( $term_id, Playlists::META_ORDER, array( '7', 7, 0, -2, 4 ) );

		$this->assertSame( array( 7, 4 ), get_term_meta( $term_id, Playlists::META_ORDER, true ) );
	}

	/** Tests the type meta sanitizer: allowlisted values pass, anything else coerces to the default. */
	public function test_sanitize_playlist_type() {
		foreach ( Playlists::PLAYLIST_TYPES as $type ) {
			$this->assertSame( $type, Playlists::sanitize_playlist_type( $type ) );
		}
		$this->assertSame( Playlists::DEFAULT_PLAYLIST_TYPE, Playlists::sanitize_playlist_type( 'bogus' ) );
		$this->assertSame( Playlists::DEFAULT_PLAYLIST_TYPE, Playlists::sanitize_playlist_type( 123 ) );
		$this->assertSame( Playlists::DEFAULT_PLAYLIST_TYPE, Playlists::sanitize_playlist_type( null ) );
	}

	/** Tests that deleting an attachment prunes it from every playlist's order meta. */
	public function test_delete_attachment_prunes_order_across_playlists() {
		$this->enable_studio_and_register();
		Playlists::init(); // Wires the delete_attachment hook like production does.

		$video_a = $this->create_video_attachment();
		$video_b = $this->create_video_attachment();

		$playlist_one = $this->create_playlist();
		$playlist_two = $this->create_playlist();

		wp_set_object_terms( $video_a, array( $playlist_one, $playlist_two ), Playlists::TAXONOMY );
		wp_set_object_terms( $video_b, array( $playlist_one, $playlist_two ), Playlists::TAXONOMY );

		update_term_meta( $playlist_one, Playlists::META_ORDER, array( $video_a, $video_b ) );
		update_term_meta( $playlist_two, Playlists::META_ORDER, array( $video_b, $video_a ) );

		wp_delete_attachment( $video_a, true );

		$this->assertSame( array( $video_b ), get_term_meta( $playlist_one, Playlists::META_ORDER, true ) );
		$this->assertSame( array( $video_b ), get_term_meta( $playlist_two, Playlists::META_ORDER, true ) );

		// The surviving video's relationships are untouched.
		$this->assertSame(
			array( $playlist_one, $playlist_two ),
			wp_get_object_terms( $video_b, Playlists::TAXONOMY, array( 'fields' => 'ids' ) )
		);
	}

	/**
	 * Tests the term meta auth_callback through the capability the REST term
	 * meta fields check before writing (`edit_term_meta`).
	 */
	public function test_term_meta_auth_callback_requires_upload_files() {
		$this->enable_studio_and_register();

		$term_id = $this->create_playlist();

		wp_set_current_user( $this->create_user_with_role( 'subscriber' ) );
		$this->assertFalse( current_user_can( 'edit_term_meta', $term_id, Playlists::META_ARTWORK_ID ) );
		$this->assertFalse( current_user_can( 'edit_term_meta', $term_id, Playlists::META_ORDER ) );

		wp_set_current_user( $this->create_user_with_role( 'author' ) );
		$this->assertTrue( current_user_can( 'edit_term_meta', $term_id, Playlists::META_ARTWORK_ID ) );
		$this->assertTrue( current_user_can( 'edit_term_meta', $term_id, Playlists::META_ORDER ) );

		wp_set_current_user( $this->create_user_with_role( 'administrator' ) );
		$this->assertTrue( current_user_can( 'edit_term_meta', $term_id, Playlists::META_TYPE ) );
	}

	/**
	 * CRITICAL verification: the core REST media endpoint accepts the
	 * taxonomy's rest_base as the assignment property on updates, and as the
	 * collection filter on reads.
	 *
	 * Request shapes verified here:
	 * - POST /wp/v2/media/{id} with body { "videopress-playlists": [ term_id ] }
	 * - GET  /wp/v2/media?videopress-playlists={term_id}
	 */
	public function test_core_media_rest_endpoint_assigns_and_filters_playlists() {
		$this->enable_studio_and_register();

		wp_set_current_user( $this->create_user_with_role( 'administrator' ) );

		$attachment_id       = $this->create_video_attachment();
		$other_attachment_id = $this->create_video_attachment();
		$term_id             = $this->create_playlist();

		$server = $this->initialize_rest_server();

		// The taxonomy's own terms collection registers under its rest_base.
		$this->assertArrayHasKey( '/wp/v2/videopress-playlists', $server->get_routes() );

		// Assign the playlist through the core media endpoint.
		$request = new WP_REST_Request( 'POST', '/wp/v2/media/' . $attachment_id );
		$request->set_body_params( array( Playlists::REST_BASE => array( $term_id ) ) );
		$response = $server->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );
		$data = $response->get_data();
		$this->assertArrayHasKey( Playlists::REST_BASE, $data );
		$this->assertSame( array( $term_id ), $data[ Playlists::REST_BASE ] );

		// The term relationship is real, not just echoed back.
		$this->assertSame(
			array( $term_id ),
			wp_get_object_terms( $attachment_id, Playlists::TAXONOMY, array( 'fields' => 'ids' ) )
		);

		// Filter the media collection by playlist.
		$request = new WP_REST_Request( 'GET', '/wp/v2/media' );
		$request->set_param( Playlists::REST_BASE, array( $term_id ) );
		$response = $server->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );
		$ids = wp_list_pluck( $response->get_data(), 'id' );
		$this->assertContains( $attachment_id, $ids );
		$this->assertNotContains( $other_attachment_id, $ids );
	}
}
