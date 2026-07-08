<?php
/**
 * Tests for the videopress/playlist block render pipeline.
 *
 * Lives in the sqlite suite (tests/php-sqlite) because the render callback
 * reads real taxonomy term storage (term relationships, term meta), which the
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
 * Test suite for Playlist_Block::render().
 */
class Playlist_Block_Render_Test extends TestCase {

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
	 * Monotonic day counter so every attachment gets a distinct, descending date.
	 *
	 * @var int
	 */
	private $date_counter = 0;

	/**
	 * Set up before each test.
	 */
	protected function set_up() {
		parent::set_up();

		if ( ! defined( 'DB_ENGINE' ) || 'sqlite' !== constant( 'DB_ENGINE' ) ) {
			$this->markTestSkipped( 'Playlist block render tests need real taxonomy tables; run them via the sqlite test suite (composer phpunit).' );
		}

		$this->date_counter = 0;
	}

	/**
	 * Clean up after each test.
	 *
	 * The sqlite database persists across tests and runs, so every entity a
	 * test creates is tracked and deleted here, and the global registration
	 * state (taxonomy, meta keys, enqueued scripts) is reset.
	 */
	protected function tear_down() {
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

		remove_all_filters( Admin_UI::STUDIO_FILTER );

		foreach ( array( Playlists::META_ARTWORK_ID, Playlists::META_ORDER ) as $meta_key ) {
			unregister_meta_key( 'term', $meta_key, Playlists::TAXONOMY );
		}
		if ( taxonomy_exists( Playlists::TAXONOMY ) ) {
			unregister_taxonomy( Playlists::TAXONOMY );
		}

		// The render callback enqueues the token bridge and iframe API; reset
		// the scripts registry so enqueue assertions stay per-test.
		unset( $GLOBALS['wp_scripts'] );

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
	 * Create an unattached VideoPress attachment with descending dates.
	 *
	 * Dates are explicit and strictly decreasing per call so the member
	 * query's `orderby date DESC` is deterministic: the FIRST attachment
	 * created by a test is the NEWEST.
	 *
	 * @param array $args {
	 *     Optional overrides.
	 *
	 *     @type string      $title    Attachment title.
	 *     @type string|null $guid     VideoPress guid; null skips the meta (still-processing member).
	 *     @type string      $poster   VideoPress poster URL.
	 *     @type int         $duration VideoPress duration in milliseconds.
	 * }
	 * @return int Attachment ID.
	 */
	private function create_video_attachment( $args = array() ) {
		++$this->date_counter;

		$args = array_merge(
			array(
				'title'    => 'Test video ' . uniqid(),
				'guid'     => 'guid' . wp_rand( 1000, 9999 ) . uniqid(),
				'poster'   => '',
				'duration' => 0,
			),
			$args
		);

		$attachment_id = wp_insert_post(
			array(
				'post_type'      => 'attachment',
				'post_status'    => 'inherit',
				'post_mime_type' => 'video/videopress',
				'post_title'     => $args['title'],
				'post_date'      => gmdate( 'Y-m-d H:i:s', strtotime( '2026-01-30 12:00:00' ) - $this->date_counter * DAY_IN_SECONDS ),
			)
		);
		$this->assertIsInt( $attachment_id );
		$this->assertGreaterThan( 0, $attachment_id );
		$this->attachment_ids[] = $attachment_id;

		if ( null !== $args['guid'] ) {
			update_post_meta( $attachment_id, 'videopress_guid', $args['guid'] );
		}

		$videopress_meta = array();
		if ( '' !== $args['poster'] ) {
			$videopress_meta['poster'] = $args['poster'];
		}
		if ( $args['duration'] > 0 ) {
			$videopress_meta['duration'] = $args['duration'];
		}
		if ( array() !== $videopress_meta ) {
			wp_update_attachment_metadata( $attachment_id, array( 'videopress' => $videopress_meta ) );
		}

		return $attachment_id;
	}

	/**
	 * Create a playlist term and assign the given attachments to it.
	 *
	 * @param int[]       $member_ids Attachment IDs to assign.
	 * @param array       $term_args  Optional wp_insert_term() args (e.g. description).
	 * @param string|null $name Optional term name.
	 * @return int Term ID.
	 */
	private function create_playlist_with_members( $member_ids = array(), $term_args = array(), $name = null ) {
		$term = wp_insert_term( $name ?? 'Playlist ' . uniqid(), Playlists::TAXONOMY, $term_args );
		$this->assertIsArray( $term );
		$term_id          = (int) $term['term_id'];
		$this->term_ids[] = $term_id;

		foreach ( $member_ids as $member_id ) {
			wp_set_object_terms( $member_id, array( $term_id ), Playlists::TAXONOMY, true );
		}

		return $term_id;
	}

	/**
	 * Extract and decode the view-script config JSON from rendered markup.
	 *
	 * @param string $html Rendered block markup.
	 * @return array Decoded config.
	 */
	private function extract_config( $html ) {
		$matched = preg_match(
			'#<script type="application/json" class="wp-block-videopress-playlist__config">(.*?)</script>#s',
			$html,
			$matches
		);
		$this->assertSame( 1, $matched, 'Rendered markup should contain the view config script.' );

		$config = json_decode( $matches[1], true );
		$this->assertIsArray( $config );

		return $config;
	}

	/** Tests that render returns '' while the taxonomy is unregistered (Studio flag off). */
	public function test_render_returns_empty_when_taxonomy_unregistered() {
		$this->assertSame( '', Playlist_Block::render( array( 'playlistId' => 123 ) ) );
	}

	/** Tests that a missing, non-numeric, or non-positive playlistId renders ''. */
	public function test_render_returns_empty_for_malformed_playlist_id() {
		$this->enable_studio_and_register();

		$this->assertSame( '', Playlist_Block::render( array() ) );
		$this->assertSame( '', Playlist_Block::render( array( 'playlistId' => 0 ) ) );
		$this->assertSame( '', Playlist_Block::render( array( 'playlistId' => 'garbage' ) ) );
		$this->assertSame( '', Playlist_Block::render( array( 'playlistId' => array( 5 ) ) ) );
	}

	/** Tests that a deleted (or never-existing) term renders ''. */
	public function test_render_returns_empty_for_deleted_term() {
		$this->enable_studio_and_register();

		$term_id = $this->create_playlist_with_members( array( $this->create_video_attachment() ) );
		wp_delete_term( $term_id, Playlists::TAXONOMY );

		$this->assertSame( '', Playlist_Block::render( array( 'playlistId' => $term_id ) ) );
	}

	/** Tests that an empty playlist renders '' and enqueues nothing. */
	public function test_render_returns_empty_for_empty_playlist() {
		$this->enable_studio_and_register();

		$term_id = $this->create_playlist_with_members();

		$this->assertSame( '', Playlist_Block::render( array( 'playlistId' => $term_id ) ) );
		$this->assertFalse( wp_script_is( Jwt_Token_Bridge::SCRIPT_HANDLE, 'enqueued' ) );
		$this->assertFalse( wp_script_is( Initializer::JETPACK_VIDEOPRESS_IFRAME_API_HANDLER, 'enqueued' ) );
	}

	/** Tests that members without a guid are skipped, and '' when none is playable. */
	public function test_render_skips_members_without_guid() {
		$this->enable_studio_and_register();

		$processing = $this->create_video_attachment(
			array(
				'title' => 'Still processing upload',
				'guid'  => null,
			)
		);
		$ready      = $this->create_video_attachment( array( 'guid' => 'rEadY123' ) );

		$only_processing = $this->create_playlist_with_members( array( $processing ) );
		$this->assertSame( '', Playlist_Block::render( array( 'playlistId' => $only_processing ) ) );

		$mixed = $this->create_playlist_with_members( array( $processing, $ready ) );
		$html  = Playlist_Block::render( array( 'playlistId' => $mixed ) );

		$this->assertStringContainsString( 'data-vp-guid="rEadY123"', $html );
		$this->assertStringNotContainsString( 'Still processing upload', $html );

		$config = $this->extract_config( $html );
		$this->assertCount( 1, $config['videos'] );
		$this->assertSame( 'rEadY123', $config['videos'][0]['guid'] );
	}

	/**
	 * Tests the full order resolution: stored order first, stale (non-member)
	 * entries dropped, unlisted members appended newest-first, and the first
	 * resolved video active in the main player.
	 */
	public function test_render_orders_videos_and_marks_first_active() {
		$this->enable_studio_and_register();

		// Created newest → oldest (dates are strictly decreasing per call).
		$video_newest = $this->create_video_attachment( array( 'guid' => 'gNewest1' ) );
		$video_middle = $this->create_video_attachment( array( 'guid' => 'gMiddle1' ) );
		$video_oldest = $this->create_video_attachment( array( 'guid' => 'gOldest1' ) );
		$non_member   = $this->create_video_attachment( array( 'guid' => 'gStale01' ) );

		$term_id = $this->create_playlist_with_members( array( $video_newest, $video_middle, $video_oldest ) );

		// Stored order: middle first, a stale non-member id, then oldest. The
		// newest member is missing from the order and must be appended last.
		update_term_meta( $term_id, Playlists::META_ORDER, array( $video_middle, $non_member, $video_oldest ) );

		$html   = Playlist_Block::render( array( 'playlistId' => $term_id ) );
		$config = $this->extract_config( $html );

		$this->assertSame(
			array( 'gMiddle1', 'gOldest1', 'gNewest1' ),
			array_column( $config['videos'], 'guid' )
		);
		$this->assertStringNotContainsString( 'gStale01', $html );

		// The first resolved video drives the main player and carries aria-current.
		$this->assertStringContainsString( 'videopress.com/embed/gMiddle1', $html );
		$this->assertSame( 1, preg_match( '#<button[^>]*data-vp-guid="gMiddle1"[^>]*aria-current="true"#', $html ) );
		$this->assertSame( 1, substr_count( $html, 'aria-current="true"' ) );

		// Buttons appear in resolved order.
		preg_match_all( '#data-vp-guid="([^"]+)"#', $html, $button_guids );
		$this->assertSame( array( 'gMiddle1', 'gOldest1', 'gNewest1' ), $button_guids[1] );
	}

	/** Tests header rendering: name, count, description, and the showHeader toggle. */
	public function test_render_header_toggle_and_contents() {
		$this->enable_studio_and_register();

		$members = array(
			$this->create_video_attachment( array( 'guid' => 'hDr00001' ) ),
			$this->create_video_attachment( array( 'guid' => 'hDr00002' ) ),
		);
		$term_id = $this->create_playlist_with_members(
			$members,
			array( 'description' => 'Curated with <strong>care</strong>.' ),
			'Header Playlist'
		);

		$html = Playlist_Block::render( array( 'playlistId' => $term_id ) );
		$this->assertStringContainsString( 'wp-block-videopress-playlist__header', $html );
		$this->assertStringContainsString( 'Header Playlist', $html );
		$this->assertStringContainsString( '2 videos', $html );
		// wp_kses_post keeps safe description markup.
		$this->assertStringContainsString( '<strong>care</strong>', $html );

		$hidden = Playlist_Block::render(
			array(
				'playlistId' => $term_id,
				'showHeader' => false,
			)
		);
		$this->assertStringNotContainsString( 'wp-block-videopress-playlist__header', $hidden );
		$this->assertStringNotContainsString( 'Header Playlist', $hidden );
	}

	/** Tests that the header uses the artwork attachment, falling back to the first poster. */
	public function test_render_header_artwork_with_first_poster_fallback() {
		$this->enable_studio_and_register();

		$member  = $this->create_video_attachment(
			array(
				'guid'   => 'aRt00001',
				'poster' => 'https://videos.files.wordpress.com/aRt00001/poster.jpg',
			)
		);
		$term_id = $this->create_playlist_with_members( array( $member ) );

		// No artwork set → first video's poster.
		$html = Playlist_Block::render( array( 'playlistId' => $term_id ) );
		$this->assertSame(
			1,
			preg_match( '#<img class="wp-block-videopress-playlist__artwork" src="https://videos\.files\.wordpress\.com/aRt00001/poster\.jpg"#', $html )
		);

		// Artwork set → the artwork image wins.
		$artwork_id = wp_insert_post(
			array(
				'post_type'      => 'attachment',
				'post_status'    => 'inherit',
				'post_mime_type' => 'image/jpeg',
				'post_title'     => 'Playlist artwork',
			)
		);
		$this->assertIsInt( $artwork_id );
		$this->attachment_ids[] = $artwork_id;
		update_post_meta( $artwork_id, '_wp_attached_file', '2026/01/playlist-artwork.jpg' );
		update_term_meta( $term_id, Playlists::META_ARTWORK_ID, $artwork_id );

		$html = Playlist_Block::render( array( 'playlistId' => $term_id ) );
		$this->assertStringContainsString( 'playlist-artwork.jpg', $html );
		$this->assertStringNotContainsString( 'wp-block-videopress-playlist__artwork" src="https://videos.files.wordpress.com/aRt00001/poster.jpg', $html );
	}

	/** Tests the wrapper classes: layout modifier, className and align passthrough. */
	public function test_render_wrapper_classes_and_layout() {
		$this->enable_studio_and_register();

		$term_id = $this->create_playlist_with_members(
			array( $this->create_video_attachment( array( 'guid' => 'cLass001' ) ) )
		);

		$html = Playlist_Block::render( array( 'playlistId' => $term_id ) );
		$this->assertStringContainsString( 'wp-block-videopress-playlist--list', $html );

		$html = Playlist_Block::render(
			array(
				'playlistId' => $term_id,
				'layout'     => 'grid',
				'className'  => 'is-style-fancy',
				'align'      => 'wide',
				'anchor'     => 'my-playlist',
			)
		);
		$this->assertStringContainsString( 'wp-block-videopress-playlist--grid', $html );
		$this->assertStringContainsString( 'is-style-fancy', $html );
		$this->assertStringContainsString( 'alignwide', $html );
		$this->assertStringContainsString( 'id="my-playlist"', $html );

		// Unknown layout values fall back to the list layout.
		$html = Playlist_Block::render(
			array(
				'playlistId' => $term_id,
				'layout'     => 'carousel',
			)
		);
		$this->assertStringContainsString( 'wp-block-videopress-playlist--list', $html );
	}

	/**
	 * Tests that non-string className/align/anchor values are ignored.
	 *
	 * Block attributes come straight from the block comment, which anyone able
	 * to write posts can hand-craft; array values used to interpolate as the
	 * literal "Array" (plus PHP warnings) into the class and id attributes.
	 */
	public function test_render_ignores_non_string_presentation_attributes() {
		$this->enable_studio_and_register();

		$term_id = $this->create_playlist_with_members(
			array( $this->create_video_attachment( array( 'guid' => 'sCalar01' ) ) )
		);

		$html = Playlist_Block::render(
			array(
				'playlistId' => $term_id,
				'className'  => array( 'is-style-fancy' ),
				'align'      => array( 'wide' ),
				'anchor'     => array( 'my-playlist' ),
			)
		);

		$this->assertStringContainsString( 'wp-block-videopress-playlist--list', $html );
		$this->assertStringNotContainsString( 'Array', $html );
		// The only ` id="` the wrapper can emit is the anchor passthrough.
		$this->assertStringNotContainsString( ' id="', $html );
	}

	/** Tests the JSON config payload: ordered entries, embed URLs, autoplayNext flag. */
	public function test_render_config_payload_and_autoplay_next() {
		$this->enable_studio_and_register();

		$member  = $this->create_video_attachment(
			array(
				'guid'  => 'cFg00001',
				'title' => 'Config video',
			)
		);
		$term_id = $this->create_playlist_with_members( array( $member ) );

		$config = $this->extract_config( Playlist_Block::render( array( 'playlistId' => $term_id ) ) );
		$this->assertTrue( $config['autoplayNext'] );
		$this->assertSame( 'cFg00001', $config['videos'][0]['guid'] );
		$this->assertSame( 'Config video', $config['videos'][0]['title'] );
		$this->assertStringStartsWith( 'https://videopress.com/embed/cFg00001?', $config['videos'][0]['embedUrl'] );

		$config = $this->extract_config(
			Playlist_Block::render(
				array(
					'playlistId'   => $term_id,
					'autoplayNext' => false,
				)
			)
		);
		$this->assertFalse( $config['autoplayNext'] );
	}

	/** Tests duration formatting in the track list (m:ss below the hour, h:mm:ss above). */
	public function test_render_formats_durations() {
		$this->enable_studio_and_register();

		$short   = $this->create_video_attachment(
			array(
				'guid'     => 'dUr00001',
				'duration' => 125000,
			)
		);
		$long    = $this->create_video_attachment(
			array(
				'guid'     => 'dUr00002',
				'duration' => 3723000,
			)
		);
		$term_id = $this->create_playlist_with_members( array( $short, $long ) );

		$html = Playlist_Block::render( array( 'playlistId' => $term_id ) );

		$this->assertStringContainsString( '>2:05<', $html );
		$this->assertStringContainsString( '>1:02:03<', $html );
	}

	/**
	 * Tests escaping: video titles are HTML-escaped in the markup and
	 * hex-encoded in the JSON config, and the playlist name is HTML-escaped.
	 *
	 * The `<em>` marker survives WordPress's save-time kses on attachment
	 * titles, so it proves the render escapes rather than relying on storage
	 * sanitization.
	 */
	public function test_render_escapes_titles_and_playlist_name() {
		$this->enable_studio_and_register();

		$member  = $this->create_video_attachment(
			array(
				'guid'  => 'eSc00001',
				'title' => 'Video <em>one</em>',
			)
		);
		$term_id = $this->create_playlist_with_members( array( $member ), array(), 'Playlist &A' );

		$html = Playlist_Block::render( array( 'playlistId' => $term_id ) );

		$this->assertStringContainsString( '&lt;em&gt;', $html );
		$this->assertStringNotContainsString( '<em>', $html );
		$this->assertStringContainsString( 'Playlist &amp;A', $html );

		// JSON_HEX_TAG keeps angle brackets out of the inline config script.
		$matched = preg_match(
			'#<script type="application/json" class="wp-block-videopress-playlist__config">(.*?)</script>#s',
			$html,
			$matches
		);
		$this->assertSame( 1, $matched );
		$this->assertStringNotContainsString( '<', $matches[1] );
		$this->assertStringContainsString( '\u003Cem\u003E', $matches[1] );
	}

	/** Tests that rendering enqueues the token bridge and the iframe API script. */
	public function test_render_enqueues_player_scripts() {
		$this->enable_studio_and_register();

		$term_id = $this->create_playlist_with_members(
			array( $this->create_video_attachment( array( 'guid' => 'eNq00001' ) ) )
		);

		$this->assertFalse( wp_script_is( Jwt_Token_Bridge::SCRIPT_HANDLE, 'enqueued' ) );
		$this->assertFalse( wp_script_is( Initializer::JETPACK_VIDEOPRESS_IFRAME_API_HANDLER, 'enqueued' ) );

		Playlist_Block::render( array( 'playlistId' => $term_id ) );

		$this->assertTrue( wp_script_is( Jwt_Token_Bridge::SCRIPT_HANDLE, 'enqueued' ) );
		$this->assertTrue( wp_script_is( Initializer::JETPACK_VIDEOPRESS_IFRAME_API_HANDLER, 'enqueued' ) );
	}
}
