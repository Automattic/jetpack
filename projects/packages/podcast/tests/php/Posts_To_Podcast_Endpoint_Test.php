<?php
/**
 * @package automattic/jetpack-podcast
 */

namespace Automattic\Jetpack\Podcast\Tests;

use Automattic\Jetpack\Podcast\Posts_To_Podcast_Endpoint;
use Automattic\Jetpack\Podcast\Posts_To_Podcast_Helper;
use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;
use WorDBless\Users as WorDBless_Users;
use WP_REST_Request;
use WP_REST_Response;

/**
 * The test environment has no database, so the query is short-circuited via
 * `posts_pre_query`: the generated SQL is asserted and cached posts are returned.
 *
 * @covers \Automattic\Jetpack\Podcast\Posts_To_Podcast_Endpoint
 * @covers \Automattic\Jetpack\Podcast\Posts_To_Podcast_Helper
 */
#[CoversClass( Posts_To_Podcast_Endpoint::class )]
#[CoversClass( Posts_To_Podcast_Helper::class )]
class Posts_To_Podcast_Endpoint_Test extends BaseTestCase {

	const ROUTE = '/wpcom/v2/posts-to-podcast/episodes';

	/**
	 * User ids by role.
	 *
	 * @var array<string, int>
	 */
	private $users = array();

	/**
	 * Endpoint instance whose routes are registered for the test.
	 *
	 * @var Posts_To_Podcast_Endpoint
	 */
	private $endpoint;

	/**
	 * Posts returned to the next query.
	 *
	 * @var \WP_Post[]
	 */
	private $query_posts = array();

	/**
	 * Row count reported to the next query as `found_posts`.
	 *
	 * @var int
	 */
	private $query_found = 0;

	/**
	 * SQL core generated for the last query.
	 *
	 * @var string
	 */
	private $last_request = '';

	/**
	 * Query vars of the last query.
	 *
	 * @var array
	 */
	private $last_query_vars = array();

	protected function setUp(): void {
		parent::setUp();

		global $wp_rest_server;
		$wp_rest_server = new \WP_REST_Server();
		$this->endpoint = new Posts_To_Podcast_Endpoint();
		add_action( 'rest_api_init', array( $this->endpoint, 'register_routes' ) );
		do_action( 'rest_api_init' );

		foreach ( array( 'administrator', 'editor', 'author', 'contributor', 'subscriber' ) as $role ) {
			$this->users[ $role ] = wp_insert_user(
				array(
					'user_login' => 'p2p_' . $role,
					'user_pass'  => 'password',
					'role'       => $role,
				)
			);
		}
		wp_set_current_user( $this->users['administrator'] );

		add_filter( 'posts_pre_query', array( $this, 'short_circuit_query' ), 10, 2 );
	}

	protected function tearDown(): void {
		remove_filter( 'posts_pre_query', array( $this, 'short_circuit_query' ), 10 );
		remove_action( 'rest_api_init', array( $this->endpoint, 'register_routes' ) );
		wp_set_current_user( 0 );

		global $wp_rest_server;
		$wp_rest_server = null;

		WorDBless_Users::init()->clear_all_users();
		parent::tearDown();
	}

	/**
	 * `posts_pre_query` callback: record the generated SQL and return the fixture
	 * posts. Core skips `set_found_posts()` on this path, so pagination data is
	 * filled in here the way the filter docs ask.
	 *
	 * @param \WP_Post[]|null $posts Unused.
	 * @param \WP_Query       $query Query object.
	 *
	 * @return \WP_Post[]
	 */
	public function short_circuit_query( $posts, $query ) { // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter, VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$this->last_request    = (string) $query->request;
		$this->last_query_vars = $query->query_vars;

		$query->found_posts   = $this->query_found;
		$query->max_num_pages = (int) ceil( $this->query_found / max( 1, (int) $query->get( 'posts_per_page' ) ) );

		return $this->query_posts;
	}

	/**
	 * Insert a post carrying the metadata the generation pipeline writes and
	 * queue it as a query result.
	 *
	 * @param int    $author_id Post author.
	 * @param string $status    Post status.
	 * @param array  $audio     Optional `audio` block of the metadata.
	 * @param string $title     Post title.
	 *
	 * @return int Post id.
	 */
	private function add_episode( int $author_id, string $status, array $audio = array(), string $title = 'Episode' ): int {
		$post_id = wp_insert_post(
			array(
				'post_type'    => 'post',
				'post_status'  => $status,
				'post_author'  => $author_id,
				'post_title'   => $title,
				'post_content' => 'Generated episode body.',
			)
		);
		update_post_meta(
			$post_id,
			Posts_To_Podcast_Helper::EPISODE_META_KEY,
			wp_json_encode( array( 'audio' => $audio ), JSON_UNESCAPED_SLASHES )
		);

		$this->query_posts[] = get_post( $post_id );
		++$this->query_found;

		return $post_id;
	}

	private function get_episodes( array $params = array() ): WP_REST_Response {
		$request = new WP_REST_Request( 'GET', self::ROUTE );
		foreach ( $params as $key => $value ) {
			$request->set_param( $key, $value );
		}
		return rest_do_request( $request );
	}

	public function test_route_requires_edit_posts() {
		wp_set_current_user( $this->users['subscriber'] );
		$response = $this->get_episodes();
		$this->assertSame( 403, $response->get_status() );
		$this->assertSame( 'rest_forbidden', $response->get_data()['code'] );
		$this->assertSame( '', $this->last_request, 'No query should run for a rejected request.' );

		wp_set_current_user( 0 );
		$this->assertSame( 401, $this->get_episodes()->get_status() );
	}

	public function test_query_targets_generated_draft_and_published_posts_newest_first() {
		$response = $this->get_episodes(
			array(
				'page'     => 2,
				'per_page' => 5,
			)
		);
		$this->assertSame( 200, $response->get_status() );

		$this->assertSame( 'post', $this->last_query_vars['post_type'] );
		$this->assertEqualsCanonicalizing( array( 'draft', 'publish' ), $this->last_query_vars['post_status'] );
		$this->assertSame( 'editable', $this->last_query_vars['perm'] );

		$this->assertStringContainsString( "meta_key = '" . Posts_To_Podcast_Helper::EPISODE_META_KEY . "'", $this->last_request );
		$this->assertStringContainsString( "post_status = 'publish'", $this->last_request );
		$this->assertStringContainsString( "post_status = 'draft'", $this->last_request );
		$this->assertStringNotContainsString( "post_status = 'trash'", $this->last_request );
		$this->assertStringContainsString( 'ORDER BY wp_posts.post_date DESC', $this->last_request );
		$this->assertStringContainsString( 'LIMIT 5, 5', $this->last_request );
	}

	public function test_query_covers_every_author_for_users_who_can_edit_others_posts() {
		foreach ( array( 'administrator', 'editor' ) as $role ) {
			wp_set_current_user( $this->users[ $role ] );
			$this->assertSame( 200, $this->get_episodes()->get_status(), $role );
			$this->assertStringNotContainsString( 'post_author', $this->last_request, $role );
		}
	}

	public function test_query_is_limited_to_own_posts_for_users_who_cannot_edit_others_posts() {
		foreach ( array( 'author', 'contributor' ) as $role ) {
			$user_id = $this->users[ $role ];
			wp_set_current_user( $user_id );
			$this->assertSame( 200, $this->get_episodes()->get_status(), $role );
			$this->assertStringContainsString( "wp_posts.post_author = {$user_id} AND", $this->last_request, $role );
		}
	}

	public function test_items_are_built_from_the_post_and_its_audio_metadata() {
		$admin_id = $this->users['administrator'];
		$with     = $this->add_episode(
			$admin_id,
			'publish',
			array(
				'url'             => 'https://example.com/episode.mp3',
				'mimeType'        => 'audio/mpeg',
				'durationSeconds' => 61.4,
			),
			'Episode &amp; <em>friends</em>'
		);
		$without  = $this->add_episode( $admin_id, 'draft', array(), '' );

		$data = $this->get_episodes()->get_data();
		$this->assertCount( 2, $data['items'] );
		$this->assertSame( 2, $data['total'] );
		$this->assertSame( 1, $data['totalPages'] );

		$by_id = array_column( $data['items'], null, 'id' );

		$this->assertSame( 'Episode & friends', $by_id[ $with ]['title'] );
		$this->assertSame( 'publish', $by_id[ $with ]['status'] );
		$this->assertSame( 'https://example.com/episode.mp3', $by_id[ $with ]['mediaUrl'] );
		$this->assertSame( 'audio', $by_id[ $with ]['mediaType'] );
		$this->assertSame( 'audio/mpeg', $by_id[ $with ]['mediaMime'] );
		$this->assertSame( 61, $by_id[ $with ]['duration'] );
		$this->assertNotEmpty( $by_id[ $with ]['date'] );
		$this->assertStringContainsString( 'post.php?post=' . $with, (string) $by_id[ $with ]['editUrl'] );

		$this->assertSame( '(no title)', $by_id[ $without ]['title'] );
		$this->assertSame( 'draft', $by_id[ $without ]['status'] );
		$this->assertSame( '', $by_id[ $without ]['mediaUrl'] );
		$this->assertSame( '', $by_id[ $without ]['mediaMime'] );
		$this->assertSame( 0, $by_id[ $without ]['duration'] );
	}

	public function test_edit_url_follows_the_callers_capabilities() {
		$contributor_id = $this->users['contributor'];
		$own_draft      = $this->add_episode( $contributor_id, 'draft' );
		$own_published  = $this->add_episode( $contributor_id, 'publish' );

		wp_set_current_user( $contributor_id );
		$by_id = array_column( $this->get_episodes()->get_data()['items'], null, 'id' );

		$this->assertStringContainsString( 'post.php?post=' . $own_draft, (string) $by_id[ $own_draft ]['editUrl'] );
		$this->assertNull( $by_id[ $own_published ]['editUrl'], 'Contributors cannot edit their published posts.' );
	}

	public function test_pagination_envelope_reflects_the_reported_row_count() {
		$admin_id = $this->users['administrator'];
		$this->add_episode( $admin_id, 'draft' );
		$this->add_episode( $admin_id, 'publish' );
		$this->query_found = 7;

		$data = $this->get_episodes(
			array(
				'page'     => 3,
				'per_page' => 2,
			)
		)->get_data();

		$this->assertCount( 2, $data['items'] );
		$this->assertSame( 7, $data['total'] );
		$this->assertSame( 3, $data['page'] );
		$this->assertSame( 2, $data['perPage'] );
		$this->assertSame( 4, $data['totalPages'] );
	}

	public function test_empty_result_yields_an_empty_envelope() {
		$data = $this->get_episodes()->get_data();

		$this->assertSame( array(), $data['items'] );
		$this->assertSame( 0, $data['total'] );
		$this->assertSame( 1, $data['page'] );
		$this->assertSame( 5, $data['perPage'] );
		$this->assertSame( 0, $data['totalPages'] );
	}

	public function test_helper_clamps_page_and_per_page() {
		$data = Posts_To_Podcast_Helper::get_episodes( 0, 500 );

		$this->assertSame( 1, $data['page'] );
		$this->assertSame( 50, $data['perPage'] );
		$this->assertStringContainsString( 'LIMIT 0, 50', $this->last_request );
	}
}
