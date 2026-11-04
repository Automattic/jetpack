<?php
/**
 * Tests for the dashboard's playlist management routes.
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack\VideoPress;

use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;
use WP_REST_Request;
use WP_REST_Server;

/**
 * Tests for Playlist_Manager.
 */
class Playlist_Manager_Test extends BaseTestCase {

	/**
	 * Administrator running the requests.
	 *
	 * @var int
	 */
	private $admin_id;

	/**
	 * Every post the test inserted, for the stubbed unpublished-posts query.
	 *
	 * @var int[]
	 */
	private $post_ids = array();

	/**
	 * Register the routes, index posts as they are saved, and switch off the
	 * test environment's kses pass, which slashes block attribute JSON.
	 */
	public function set_up() {
		parent::set_up();

		global $wp_rest_server;
		$wp_rest_server = new WP_REST_Server();

		kses_remove_filters();
		add_filter( 'wp_insert_post_data', array( $this, 'unslash_post_data' ), 9 );
		delete_option( Playlist_Index::OPTION_NAME );
		add_action( 'wp_after_insert_post', array( Playlist_Index::class, 'index_post' ), 10, 2 );
		add_action( 'wp_insert_post', array( $this, 'track_post' ) );
		add_filter( 'posts_pre_query', array( $this, 'stub_unpublished_query' ), 10, 2 );

		$this->admin_id = wp_insert_user(
			array(
				'user_login' => 'playlist_admin',
				'user_pass'  => 'password',
				'user_email' => 'playlist-admin@example.com',
				'role'       => 'administrator',
			)
		);
		wp_set_current_user( $this->admin_id );

		Rest_Controller::init();
		do_action( 'rest_api_init' );
	}

	/**
	 * Undo set_up().
	 */
	public function tear_down() {
		global $wp_rest_server;
		$wp_rest_server = null;

		remove_filter( 'wp_insert_post_data', array( $this, 'unslash_post_data' ), 9 );
		remove_action( 'wp_after_insert_post', array( Playlist_Index::class, 'index_post' ), 10 );
		remove_action( 'wp_insert_post', array( $this, 'track_post' ) );
		remove_filter( 'posts_pre_query', array( $this, 'stub_unpublished_query' ), 10 );
		delete_option( Playlist_Index::OPTION_NAME );
		kses_init_filters();
		wp_set_current_user( 0 );

		parent::tear_down();
	}

	/**
	 * Unslash post data the way core does before its database write, which
	 * WorDBless replaces with this filter.
	 *
	 * @param array $data Slashed post data.
	 * @return array
	 */
	public function unslash_post_data( $data ) {
		return wp_unslash( $data );
	}

	/**
	 * Remember an inserted post.
	 *
	 * @param int $post_id Post id.
	 */
	public function track_post( $post_id ) {
		$this->post_ids[] = (int) $post_id;
	}

	/**
	 * Answer Playlist_Manager's unpublished-posts query from the tracked posts,
	 * since WorDBless has no posts table to run it against.
	 *
	 * @param array|null $posts Posts, or null to run the query.
	 * @param \WP_Query  $query The query.
	 * @return array|null
	 */
	public function stub_unpublished_query( $posts, $query ) {
		if ( Playlist_Manager::UNPUBLISHED_LIMIT !== (int) $query->get( 'posts_per_page' ) ) {
			return $posts;
		}
		$statuses = (array) $query->get( 'post_status' );

		return array_values(
			array_filter(
				array_map( 'get_post', array_unique( $this->post_ids ) ),
				function ( $post ) use ( $statuses ) {
					return $post && in_array( $post->post_status, $statuses, true ) && has_block( 'videopress/playlist', $post );
				}
			)
		);
	}

	/**
	 * Serialize a Video Playlist block.
	 *
	 * @param array  $attrs Block attributes.
	 * @param string $inner Inner block markup.
	 * @return string
	 */
	private function playlist_block( array $attrs, $inner = '' ) {
		$json = wp_json_encode( $attrs, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE );

		return '' === $inner
			? '<!-- wp:videopress/playlist ' . $json . ' /-->'
			: '<!-- wp:videopress/playlist ' . $json . " -->\n" . $inner . "\n<!-- /wp:videopress/playlist -->";
	}

	/**
	 * Publish a post holding the given content.
	 *
	 * @param string $content Post content.
	 * @param string $title   Post title.
	 * @return int Post id.
	 */
	private function publish( $content, $title = 'Playlists' ) {
		return wp_insert_post(
			wp_slash(
				array(
					'post_title'   => $title,
					'post_content' => $content,
					'post_status'  => 'publish',
					'post_type'    => 'post',
					'post_author'  => $this->admin_id,
				)
			)
		);
	}

	/**
	 * Dispatch a request to the playlist routes.
	 *
	 * @param string $method HTTP method.
	 * @param string $path   Path below the playlists route.
	 * @param array  $params Request params.
	 * @return \WP_REST_Response
	 */
	private function request( $method, $path = '', array $params = array() ) {
		$request = new WP_REST_Request( $method, '/' . Rest_Controller::REST_NAMESPACE . Playlist_Manager::ROUTE . $path );
		foreach ( $params as $name => $value ) {
			$request->set_param( $name, $value );
		}

		return rest_get_server()->dispatch( $request );
	}

	/**
	 * The list paginates, searches and sorts, and reports totals in headers.
	 */
	public function test_list_paginates_searches_and_sorts() {
		foreach ( array( 'Cooking', 'Travel', 'Behind the scenes' ) as $title ) {
			$this->publish( $this->playlist_block( array( 'playlistTitle' => $title ) ) );
		}

		$response = $this->request(
			'GET',
			'',
			array(
				'per_page' => 2,
				'orderby'  => 'title',
				'order'    => 'asc',
			)
		);
		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( array( 'Behind the scenes', 'Cooking' ), array_column( $response->get_data(), 'title' ) );
		$this->assertSame( '3', $response->get_headers()['X-WP-Total'] );
		$this->assertSame( '2', $response->get_headers()['X-WP-TotalPages'] );

		$response = $this->request( 'GET', '', array( 'search' => 'trav' ) );
		$this->assertSame( array( 'Travel' ), array_column( $response->get_data(), 'title' ) );
	}

	/**
	 * Saving rewrites only the playlist block and the index follows.
	 */
	public function test_update_rewrites_the_block_in_its_post() {
		$post_id = $this->publish(
			"<!-- wp:paragraph -->\n<p>Intro</p>\n<!-- /wp:paragraph -->\n\n" . $this->playlist_block(
				array(
					'playlistId'    => 'trip',
					'playlistTitle' => 'Trip',
					'layout'        => 'grid',
					'videos'        => array( array( 'guid' => 'aaaaaaa1' ) ),
				)
			)
		);

		$response = $this->request(
			'POST',
			'/trip',
			array(
				'title'       => 'Road trip',
				'description' => 'Two weeks on the road.',
				'videos'      => array(
					array(
						'guid'       => 'bbbbbbb2',
						'durationMs' => 61000,
						'height'     => 1080,
					),
					array( 'guid' => 'aaaaaaa1' ),
				),
			)
		);

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( 'Road trip', $response->get_data()['title'] );
		$this->assertSame( 61000, $response->get_data()['durationMs'] );

		$blocks = parse_blocks( get_post( $post_id )->post_content );
		$this->assertSame( 'core/paragraph', $blocks[0]['blockName'] );
		$this->assertSame(
			array(
				'playlistId'          => 'trip',
				'playlistTitle'       => 'Road trip',
				'layout'              => 'grid',
				'videos'              => array(
					array(
						'guid'       => 'bbbbbbb2',
						'durationMs' => 61000,
						'height'     => 1080,
					),
					array( 'guid' => 'aaaaaaa1' ),
				),
				'playlistDescription' => 'Two weeks on the road.',
			),
			$blocks[2]['attrs']
		);
		$this->assertSame( 'Two weeks on the road.', Playlist_Index::get_playlists()['trip']['description'] );
	}

	/**
	 * A new title is mirrored into the heading inner block.
	 */
	public function test_update_title_rewrites_the_heading() {
		$heading = "<!-- wp:heading -->\n<h2 class=\"wp-block-heading\">Old</h2>\n<!-- /wp:heading -->";
		$post_id = $this->publish(
			$this->playlist_block(
				array(
					'playlistId'    => 'news',
					'playlistTitle' => 'Old',
				),
				$heading
			)
		);

		$this->request( 'POST', '/news', array( 'title' => 'News & notes' ) );

		$playlist = parse_blocks( get_post( $post_id )->post_content )[0];
		$this->assertSame( '<h2 class="wp-block-heading">News &amp; notes</h2>', trim( $playlist['innerBlocks'][0]['innerHTML'] ) );
	}

	/**
	 * Blocks without a playlistId are found by the `{post}-{ordinal}` key,
	 * counting neither dynamic playlists nor blocks showing another playlist.
	 */
	public function test_update_finds_legacy_keys_by_ordinal() {
		$post_id = $this->publish(
			'<!-- wp:videopress/latest-videos-playlist -->' . $this->playlist_block( array() ) . '<!-- /wp:videopress/latest-videos-playlist -->'
			. $this->playlist_block( array( 'source' => 'index' ) )
			. $this->playlist_block( array( 'playlistTitle' => 'First' ) )
			. $this->playlist_block( array( 'playlistTitle' => 'Second' ) )
		);

		$response = $this->request( 'POST', '/' . $post_id . '-2', array( 'title' => 'Second, renamed' ) );

		$this->assertSame( 200, $response->get_status() );
		$titles = array_column( array_column( parse_blocks( get_post( $post_id )->post_content ), 'attrs' ), 'playlistTitle' );
		$this->assertSame( array( 'First', 'Second, renamed' ), $titles );
	}

	/**
	 * Unknown keys 404, users who cannot edit the post are refused, and
	 * invalid GUIDs are rejected.
	 *
	 * @param string $role   Role of the requesting user.
	 * @param string $key    Playlist key.
	 * @param array  $params Request params.
	 * @param int    $status Expected status.
	 * @dataProvider provide_rejected_requests
	 */
	#[DataProvider( 'provide_rejected_requests' )]
	public function test_update_rejects( $role, $key, array $params, $status ) {
		$this->publish( $this->playlist_block( array( 'playlistId' => 'mine' ) ) );

		if ( 'administrator' !== $role ) {
			wp_set_current_user(
				wp_insert_user(
					array(
						'user_login' => 'playlist_' . $role,
						'user_pass'  => 'password',
						'user_email' => 'playlist-' . $role . '@example.com',
						'role'       => $role,
					)
				)
			);
		}

		$this->assertSame( $status, $this->request( 'POST', '/' . $key, $params )->get_status() );
	}

	/**
	 * Requests the update route refuses.
	 *
	 * @return array[]
	 */
	public static function provide_rejected_requests() {
		return array(
			'unknown key'  => array( 'administrator', 'missing', array( 'title' => 'x' ), 404 ),
			'editor'       => array( 'editor', 'mine', array( 'title' => 'x' ), 403 ),
			'invalid guid' => array( 'administrator', 'mine', array( 'videos' => array( array( 'guid' => 'nope' ) ) ), 400 ),
		);
	}

	/**
	 * The settings the routes accept are the block's, with its types, values and defaults.
	 */
	public function test_settings_match_the_block_attributes() {
		$block = json_decode( (string) file_get_contents( dirname( __DIR__, 2 ) . '/src/client/block-editor/blocks/playlist/block.json' ), true ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
		$this->assertIsArray( $block );
		$attributes = is_array( $block ) && isset( $block['attributes'] ) && is_array( $block['attributes'] ) ? $block['attributes'] : array();

		foreach ( Playlist_Manager::SETTINGS as $name => $schema ) {
			$this->assertArrayHasKey( $name, $attributes, $name );
			$this->assertSame( $attributes[ $name ]['type'], $schema['type'], $name );
			$this->assertSame( $attributes[ $name ]['default'], $schema['default'], $name );
			$this->assertSame( $attributes[ $name ]['enum'] ?? null, $schema['enum'] ?? null, $name );
		}
	}

	/**
	 * Settings are saved the way the block editor saves them: defaults left out,
	 * the heading removed with the title display, and read back with defaults filled in.
	 */
	public function test_update_saves_settings() {
		$post_id = $this->publish(
			$this->playlist_block(
				array(
					'playlistId'    => 'clips',
					'playlistTitle' => 'Clips',
					'layout'        => 'grid',
				),
				"<!-- wp:heading -->\n<h2 class=\"wp-block-heading\">Clips</h2>\n<!-- /wp:heading -->"
			)
		);

		$response = $this->request(
			'POST',
			'/clips',
			array(
				'settings' => array(
					'layout'               => 'side-rail',
					'loopPlaylist'         => true,
					'showPlaylistTitle'    => false,
					'entryClickAction'     => 'show-player',
					'entryTitleFontFamily' => 'heading-font',
				),
			)
		);

		$this->assertSame( 200, $response->get_status() );
		$playlist = parse_blocks( get_post( $post_id )->post_content )[0];
		$expected = array(
			'playlistId'           => 'clips',
			'playlistTitle'        => 'Clips',
			'loopPlaylist'         => true,
			'showPlaylistTitle'    => false,
			'entryClickAction'     => 'show-player',
			'entryTitleFontFamily' => 'heading-font',
		);
		$actual   = $playlist['attrs'];
		ksort( $expected );
		ksort( $actual );
		$this->assertSame( $expected, $actual );
		$this->assertSame( array(), $playlist['innerBlocks'] );

		$settings = $response->get_data()['settings'];
		$this->assertSame( 'side-rail', $settings['layout'] );
		$this->assertTrue( $settings['loopPlaylist'] );
		$this->assertFalse( $settings['showPlaylistTitle'] );
		$this->assertTrue( $settings['showThumbnail'] );

		// Turning the title back on brings the heading back.
		$this->request( 'POST', '/clips', array( 'settings' => array( 'showPlaylistTitle' => true ) ) );
		$playlist = parse_blocks( get_post( $post_id )->post_content )[0];
		$this->assertSame( 'core/heading', $playlist['innerBlocks'][0]['blockName'] );
		$this->assertSame( '<h2 class="wp-block-heading">Clips</h2>', trim( $playlist['innerBlocks'][0]['innerHTML'] ) );
	}

	/**
	 * Unknown settings and values outside the block's choices are refused.
	 *
	 * @param array $settings Settings sent.
	 * @dataProvider provide_invalid_settings
	 */
	#[DataProvider( 'provide_invalid_settings' )]
	public function test_update_rejects_invalid_settings( array $settings ) {
		$this->publish( $this->playlist_block( array( 'playlistId' => 'mine' ) ) );

		$this->assertSame( 400, $this->request( 'POST', '/mine', array( 'settings' => $settings ) )->get_status() );
	}

	/**
	 * Settings the routes refuse.
	 *
	 * @return array[]
	 */
	public static function provide_invalid_settings() {
		return array(
			'unknown setting' => array( array( 'autoplay' => true ) ),
			'unknown layout'  => array( array( 'layout' => 'carousel' ) ),
			'not a boolean'   => array( array( 'showPlayer' => 'sometimes' ) ),
		);
	}

	/**
	 * A new playlist is a draft page holding one playlist block, listed with the drafts only.
	 */
	public function test_create_makes_a_draft_page() {
		$response = $this->request(
			'POST',
			'',
			array(
				'title'    => 'Trips',
				'videos'   => array( array( 'guid' => 'aaaaaaa1' ) ),
				'settings' => array( 'layout' => 'grid' ),
			)
		);

		$this->assertSame( 201, $response->get_status() );
		$created = $response->get_data();
		$this->assertSame( 'draft', $created['status'] );
		$this->assertSame( 'page', $created['post']['type'] );
		$this->assertSame( 'grid', $created['settings']['layout'] );

		$post = get_post( $created['post']['id'] );
		$this->assertSame( 'Trips', $post->post_title );
		$blocks = parse_blocks( $post->post_content );
		$this->assertCount( 1, $blocks );
		$this->assertSame( 'videopress/playlist', $blocks[0]['blockName'] );
		$this->assertSame( sanitize_key( $blocks[0]['attrs']['playlistId'] ), $created['key'] );
		$this->assertSame( '<h2 class="wp-block-heading">Trips</h2>', trim( $blocks[0]['innerBlocks'][0]['innerHTML'] ) );
		$this->assertSame( array(), Playlist_Index::get_playlists() );

		$this->assertSame( array( 'Trips' ), array_column( $this->request( 'GET', '', array( 'status' => array( 'draft' ) ) )->get_data(), 'title' ) );
		$this->assertSame( array(), $this->request( 'GET', '', array( 'status' => array( 'publish' ) ) )->get_data() );
		$this->assertSame( 'Trips', $this->request( 'GET', '/' . $created['key'] )->get_data()['title'] );
	}

	/**
	 * Renaming a playlist renames the post named after it, but not a post with its own title.
	 */
	public function test_rename_follows_into_a_post_named_after_the_playlist() {
		$created = $this->request( 'POST', '', array( 'title' => 'Draft name' ) )->get_data();
		$this->request( 'POST', '/' . $created['key'], array( 'title' => 'Final name' ) );
		$this->assertSame( 'Final name', get_post( $created['post']['id'] )->post_title );

		$post_id = $this->publish(
			$this->playlist_block(
				array(
					'playlistId'    => 'own',
					'playlistTitle' => 'Clips',
				)
			),
			'My travel blog'
		);
		$this->request( 'POST', '/own', array( 'title' => 'Travel clips' ) );
		$this->assertSame( 'My travel blog', get_post( $post_id )->post_title );
	}

	/**
	 * Publishing indexes the playlist; switching back to draft takes it out.
	 */
	public function test_status_changes_publish_and_unpublish() {
		$key = $this->request( 'POST', '', array( 'title' => 'Launch' ) )->get_data()['key'];

		$published = $this->request(
			'POST',
			'/' . $key,
			array(
				'status' => 'publish',
				'title'  => 'Launch day',
			)
		);
		$this->assertSame( 200, $published->get_status() );
		$this->assertSame( 'publish', $published->get_data()['status'] );
		$this->assertSame( 'Launch day', Playlist_Index::get_playlists()[ $key ]['title'] );

		$drafted = $this->request( 'POST', '/' . $key, array( 'status' => 'draft' ) );
		$this->assertSame( 'draft', $drafted->get_data()['status'] );
		$this->assertArrayNotHasKey( $key, Playlist_Index::get_playlists() );
	}

	/**
	 * Deleting removes the block and keeps the rest of the post.
	 */
	public function test_delete_removes_the_block_from_its_post() {
		$paragraph = "<!-- wp:paragraph -->\n<p>Intro</p>\n<!-- /wp:paragraph -->";
		$post_id   = $this->publish( $paragraph . "\n\n" . $this->playlist_block( array( 'playlistId' => 'gone' ) ) );

		$response = $this->request( 'DELETE', '/gone' );

		$this->assertSame( 200, $response->get_status() );
		$this->assertTrue( $response->get_data()['deleted'] );
		$this->assertFalse( $response->get_data()['postTrashed'] );
		$this->assertSame( $paragraph, trim( get_post( $post_id )->post_content ) );
		$this->assertSame( 'publish', get_post_status( $post_id ) );
		$this->assertArrayNotHasKey( 'gone', Playlist_Index::get_playlists() );
		$this->assertSame( 404, $this->request( 'GET', '/gone' )->get_status() );
	}

	/**
	 * Deleting the only thing in a post sends the post to the trash.
	 */
	public function test_delete_trashes_a_post_left_empty() {
		$created = $this->request( 'POST', '', array( 'title' => 'Short-lived' ) )->get_data();

		$response = $this->request( 'DELETE', '/' . $created['key'] );

		$this->assertSame( 200, $response->get_status() );
		$this->assertTrue( $response->get_data()['postTrashed'] );
		$this->assertSame( 'trash', get_post_status( $created['post']['id'] ) );
	}

	/**
	 * Users without the dashboard capability can't create or delete playlists.
	 */
	public function test_create_and_delete_need_the_dashboard_capability() {
		$this->publish( $this->playlist_block( array( 'playlistId' => 'mine' ) ) );
		wp_set_current_user(
			wp_insert_user(
				array(
					'user_login' => 'playlist_editor',
					'user_pass'  => 'password',
					'user_email' => 'playlist-editor@example.com',
					'role'       => 'editor',
				)
			)
		);

		$this->assertSame( 403, $this->request( 'POST', '', array( 'title' => 'Nope' ) )->get_status() );
		$this->assertSame( 403, $this->request( 'DELETE', '/mine' )->get_status() );
	}
}
