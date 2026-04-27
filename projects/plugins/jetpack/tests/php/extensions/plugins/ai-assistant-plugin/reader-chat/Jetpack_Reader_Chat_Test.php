<?php
/**
 * Jetpack Reader Chat tests.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Extensions\AiAssistantPlugin;
use Automattic\Jetpack\Extensions\AiAssistantPlugin\Jetpack_Reader_Chat;

require_once JETPACK__PLUGIN_DIR . '/extensions/plugins/ai-assistant-plugin/reader-chat/class-jetpack-reader-chat.php';

/**
 * Tests for the Jetpack_Reader_Chat class.
 */
class Jetpack_Reader_Chat_Test extends WP_UnitTestCase {
	use Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Saved wp_scripts global.
	 *
	 * @var mixed
	 */
	private $saved_wp_scripts;

	/**
	 * Saved wp_styles global.
	 *
	 * @var mixed
	 */
	private $saved_wp_styles;

	/**
	 * Set up before each test.
	 */
	public function set_up() {
		parent::set_up();
		\Automattic\Jetpack\Status\Cache::clear();
		delete_transient( AiAssistantPlugin\READER_CHAT_ASSET_TRANSIENT );
		$this->saved_wp_scripts = $GLOBALS['wp_scripts'] ?? null;
		$this->saved_wp_styles  = $GLOBALS['wp_styles'] ?? null;
		$GLOBALS['wp_scripts']  = new WP_Scripts();
		$GLOBALS['wp_styles']   = new WP_Styles();
		// Prevent DOING_AJAX constant (once defined as true) from leaking into
		// tests that don't intend to simulate an AJAX request.
		add_filter( 'wp_doing_ajax', '__return_false' );
		$this->simulate_connected_owner();
	}

	/**
	 * Tear down after each test.
	 */
	public function tear_down() {
		delete_transient( AiAssistantPlugin\READER_CHAT_ASSET_TRANSIENT );
		remove_all_filters( 'jetpack_reader_chat_enabled' );
		remove_all_filters( 'jetpack_reader_chat_has_ai_features' );
		remove_all_filters( 'jetpack_ai_enabled' );
		remove_all_filters( 'pre_http_request' );
		remove_all_filters( 'wp_doing_ajax' );
		// Remove any wp_enqueue_scripts / wp_footer hooks the class may have added.
		remove_all_actions( 'wp_enqueue_scripts' );
		remove_all_actions( 'wp_footer' );
		( new \Automattic\Jetpack\Connection\Manager( 'jetpack' ) )->reset_connection_status();
		$GLOBALS['wp_scripts'] = $this->saved_wp_scripts;
		$GLOBALS['wp_styles']  = $this->saved_wp_styles;
		\Automattic\Jetpack\Status\Cache::clear();
		parent::tear_down();
	}

	// ──────────────────────────────────────────────────
	// Helpers
	// ──────────────────────────────────────────────────

	/**
	 * Simulate a connected Jetpack owner (mirrors ai-sidebar pattern).
	 */
	private function simulate_connected_owner() {
		$user_id = self::factory()->user->create( array( 'role' => 'administrator' ) );
		\Jetpack_Options::update_option( 'master_user', $user_id );
		\Jetpack_Options::update_option( 'user_tokens', array( $user_id => 'token.secret.' . $user_id ) );
		( new \Automattic\Jetpack\Connection\Manager( 'jetpack' ) )->reset_connection_status();
	}

	/**
	 * Enable the reader-chat feature via the primary enable filter.
	 *
	 * Also force-passes the rollout enqueue gate (which is otherwise
	 * Automattician-only) so the test environment doesn't need a
	 * proxied or staff-identified user.
	 */
	private function enable_reader_chat() {
		add_filter( 'jetpack_reader_chat_enabled', '__return_true' );
		add_filter( 'jetpack_reader_chat_enqueue_enabled', '__return_true' );
	}

	/**
	 * Override the AI-features gate so enqueue_scripts doesn't need a real connection.
	 *
	 * @param bool $value true to force-enable, false to force-disable.
	 */
	private function override_ai_features( bool $value ) {
		add_filter(
			'jetpack_reader_chat_has_ai_features',
			function () use ( $value ) {
				return $value;
			}
		);
	}

	/**
	 * Cache asset data so get_asset_version() returns without a remote fetch.
	 *
	 * @param array|null $data Asset data to cache.
	 */
	private function cache_asset_data( $data = null ) {
		if ( null === $data ) {
			$data = array(
				'version'      => '1.0.0-test',
				'dependencies' => array(),
			);
		}
		set_transient( AiAssistantPlugin\READER_CHAT_ASSET_TRANSIENT, $data, HOUR_IN_SECONDS );
	}

	/**
	 * Block all outbound HTTP so tests never hit the network.
	 */
	private function block_http_requests() {
		add_filter(
			'pre_http_request',
			function () {
				return new WP_Error( 'blocked', 'No HTTP in tests.' );
			}
		);
	}

	/**
	 * Call a private static method via reflection.
	 *
	 * @param string $method_name The method name.
	 * @param array  $args        Arguments to pass.
	 * @return mixed The method return value.
	 */
	private function call_private_static( string $method_name, array $args = array() ) {
		$method = new ReflectionMethod( Jetpack_Reader_Chat::class, $method_name );
		// setAccessible() is required on PHP < 8.1, a no-op on 8.1-8.4,
		// and deprecated on 8.5+. Only call it where it's actually needed.
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}
		return $method->invoke( null, ...$args );
	}

	// ──────────────────────────────────────────────────
	// init() — filter-branch tests
	// ──────────────────────────────────────────────────

	/**
	 * Test that init() does NOT register wp_enqueue_scripts when the enable
	 * filter is false (the default — opt-in model).
	 */
	public function test_init_does_not_hook_when_filter_is_false() {
		// Default: filter not set, apply_filters returns false.
		Jetpack_Reader_Chat::init();

		$this->assertFalse(
			has_action( 'wp_enqueue_scripts', array( Jetpack_Reader_Chat::class, 'enqueue_scripts' ) ),
			'enqueue_scripts should not be hooked when jetpack_reader_chat_enabled is false.'
		);
		$this->assertFalse(
			has_action( 'wp_footer', array( Jetpack_Reader_Chat::class, 'render_mount_div' ) ),
			'render_mount_div should not be hooked when feature is disabled.'
		);
	}

	/**
	 * Test that init() registers wp_enqueue_scripts when the enable filter is
	 * explicitly set to true (force-on override).
	 */
	public function test_init_registers_hooks_when_filter_is_true() {
		$this->enable_reader_chat();
		Jetpack_Reader_Chat::init();

		$this->assertNotFalse(
			has_action( 'wp_enqueue_scripts', array( Jetpack_Reader_Chat::class, 'enqueue_scripts' ) ),
			'enqueue_scripts should be hooked when jetpack_reader_chat_enabled is true.'
		);
		$this->assertNotFalse(
			has_action( 'wp_footer', array( Jetpack_Reader_Chat::class, 'render_mount_div' ) ),
			'render_mount_div should be hooked when feature is enabled.'
		);
	}

	/**
	 * Test that init() does NOT register hooks when the filter explicitly
	 * returns false (force-off override).
	 */
	public function test_init_does_not_hook_when_filter_is_explicitly_false() {
		add_filter( 'jetpack_reader_chat_enabled', '__return_false' );
		Jetpack_Reader_Chat::init();

		$this->assertFalse(
			has_action( 'wp_enqueue_scripts', array( Jetpack_Reader_Chat::class, 'enqueue_scripts' ) ),
			'enqueue_scripts should not be hooked when jetpack_reader_chat_enabled is explicitly false.'
		);
	}

	// ──────────────────────────────────────────────────
	// enqueue_scripts() — context-gate tests
	// ──────────────────────────────────────────────────

	/**
	 * Test that enqueue_scripts() skips enqueueing on the admin dashboard.
	 */
	public function test_enqueue_scripts_skips_on_admin() {
		$this->override_ai_features( true );
		$this->cache_asset_data();

		// Simulate an admin request.
		set_current_screen( 'dashboard' );

		Jetpack_Reader_Chat::enqueue_scripts();

		$this->assertFalse(
			wp_script_is( 'jetpack-reader-chat', 'enqueued' ),
			'Script should not be enqueued on the admin screen.'
		);
		$this->assertFalse(
			wp_style_is( 'jetpack-reader-chat', 'enqueued' ),
			'Style should not be enqueued on the admin screen.'
		);

		// Restore screen.
		$GLOBALS['current_screen'] = null;
	}

	/**
	 * Test that enqueue_scripts() skips enqueueing on feed requests.
	 *
	 * We test this via the is_feed() conditional by going through a query that
	 * sets up a feed context using WP_Query directly so we don't need a full
	 * request cycle.
	 */
	public function test_enqueue_scripts_skips_on_feed() {
		$this->override_ai_features( true );
		$this->cache_asset_data();

		// WP_Query::is_feed() reads the property directly without applying the
		// 'is_feed' filter, so we set the property on the global query object.
		global $wp_query;
		$saved_is_feed     = $wp_query->is_feed;
		$wp_query->is_feed = true;

		Jetpack_Reader_Chat::enqueue_scripts();

		$wp_query->is_feed = $saved_is_feed;

		$this->assertFalse(
			wp_script_is( 'jetpack-reader-chat', 'enqueued' ),
			'Script should not be enqueued on feed requests.'
		);
	}

	/**
	 * Test that enqueue_scripts() skips enqueueing during AJAX requests.
	 */
	public function test_enqueue_scripts_skips_on_ajax() {
		$this->override_ai_features( true );
		$this->cache_asset_data();

		// Use the filterable wp_doing_ajax() instead of the DOING_AJAX constant
		// so that defining the constant in one test doesn't poison later tests.
		// Priority 20 overrides the setUp()'s '__return_false' at priority 10.
		add_filter( 'wp_doing_ajax', '__return_true', 20 );

		Jetpack_Reader_Chat::enqueue_scripts();

		$this->assertFalse(
			wp_script_is( 'jetpack-reader-chat', 'enqueued' ),
			'Script should not be enqueued during AJAX requests.'
		);
	}

	/**
	 * Test that enqueue_scripts() DOES enqueue on a public non-singular page
	 * (e.g. the blog index / archive). Per commit 09fda4fb4b, reader-chat
	 * loads on every public frontend page, not only singular posts.
	 */
	public function test_enqueue_scripts_loads_on_non_singular_frontend_page() {
		$this->override_ai_features( true );
		$this->cache_asset_data();

		// No admin screen set, not a feed, not AJAX — simulates a standard
		// homepage / archive query without going singular.
		Jetpack_Reader_Chat::enqueue_scripts();

		$this->assertTrue(
			wp_script_is( 'jetpack-reader-chat', 'enqueued' ),
			'Script should be enqueued on a non-singular public frontend page.'
		);
		$this->assertTrue(
			wp_style_is( 'jetpack-reader-chat', 'enqueued' ),
			'Style should be enqueued on a non-singular public frontend page.'
		);
	}

	/**
	 * Test that enqueue_scripts() skips when the AI-features filter is false
	 * (has_ai_features override = false).
	 */
	public function test_enqueue_scripts_skips_when_ai_features_false() {
		$this->override_ai_features( false );
		$this->cache_asset_data();

		Jetpack_Reader_Chat::enqueue_scripts();

		$this->assertFalse(
			wp_script_is( 'jetpack-reader-chat', 'enqueued' ),
			'Script should not be enqueued when AI features are unavailable.'
		);
	}

	/**
	 * Test that the inline config script is injected with enqueue_scripts().
	 */
	public function test_enqueue_scripts_adds_inline_config() {
		$this->override_ai_features( true );
		$this->cache_asset_data();

		Jetpack_Reader_Chat::enqueue_scripts();

		$registered = $GLOBALS['wp_scripts']->registered['jetpack-reader-chat'] ?? null;
		$this->assertNotNull( $registered, 'jetpack-reader-chat script should be registered.' );

		$inline_data = $GLOBALS['wp_scripts']->get_data( 'jetpack-reader-chat', 'before' );
		$inline      = is_array( $inline_data ) ? implode( "\n", $inline_data ) : (string) $inline_data;
		$this->assertStringContainsString(
			'window.JetpackReaderChatConfig',
			$inline,
			'Inline config should set window.JetpackReaderChatConfig.'
		);
	}

	// ──────────────────────────────────────────────────
	// get_reader_chat_config() / get_current_post_context()
	// ──────────────────────────────────────────────────

	/**
	 * Helper: run enqueue_scripts() and decode the inline config.
	 *
	 * @return array The decoded config array.
	 */
	private function get_enqueued_config(): array {
		$this->override_ai_features( true );
		$this->cache_asset_data();
		Jetpack_Reader_Chat::enqueue_scripts();

		// The inline data is stored as raw JS; extract the JSON portion.
		$inline_data = $GLOBALS['wp_scripts']->get_data( 'jetpack-reader-chat', 'before' );
		$inline      = is_array( $inline_data ) ? implode( "\n", $inline_data ) : (string) $inline_data;
		// The value is: `window.JetpackReaderChatConfig = {...};`
		preg_match( '/window\.JetpackReaderChatConfig\s*=\s*(.+);$/', $inline, $matches );
		$this->assertNotEmpty( $matches[1], 'Could not extract JSON from inline script.' );

		$decoded = json_decode( $matches[1], true );
		$this->assertIsArray( $decoded, 'Inline config should be valid JSON.' );
		return $decoded;
	}

	/**
	 * Test that the base config always includes required site-level keys.
	 */
	public function test_config_contains_required_site_keys() {
		$config = $this->get_enqueued_config();

		$this->assertArrayHasKey( 'siteId', $config, 'Config should include siteId.' );
		$this->assertArrayHasKey( 'siteName', $config, 'Config should include siteName.' );
		$this->assertArrayHasKey( 'siteUrl', $config, 'Config should include siteUrl.' );
		$this->assertArrayHasKey( 'agentId', $config, 'Config should include agentId.' );
		$this->assertSame( 'reader-chat', $config['agentId'], 'agentId should be "reader-chat".' );
	}

	/**
	 * Test that currentPost is NOT present on a non-singular view.
	 */
	public function test_config_has_no_current_post_on_non_singular() {
		// Default WP_UnitTestCase environment is non-singular.
		$config = $this->get_enqueued_config();

		$this->assertArrayNotHasKey(
			'currentPost',
			$config,
			'currentPost should not appear in the config on a non-singular page.'
		);
	}

	/**
	 * Test that currentPost is present and fully populated on a singular post.
	 */
	public function test_config_has_current_post_on_singular() {
		// Create a category and tag.
		$cat_id = self::factory()->category->create( array( 'name' => 'Tech' ) );
		$tag_id = self::factory()->tag->create( array( 'name' => 'AI' ) );

		// Create an author user.
		$author_id = self::factory()->user->create(
			array(
				'display_name' => 'Test Author',
				'role'         => 'author',
			)
		);

		// Create a post with content, category, and tag.
		$post_id = self::factory()->post->create(
			array(
				'post_title'   => 'Hello World Post',
				'post_content' => 'This is some post content to summarize.',
				'post_author'  => $author_id,
				'post_status'  => 'publish',
			)
		);
		wp_set_post_categories( $post_id, array( $cat_id ) );
		wp_set_post_tags( $post_id, array( $tag_id ) );

		// Navigate to the singular post.
		$this->go_to( get_permalink( $post_id ) );

		$this->assertTrue( is_singular(), 'Should be on a singular view after go_to().' );

		$config = $this->get_enqueued_config();

		$this->assertArrayHasKey( 'currentPost', $config, 'currentPost should be in config on singular view.' );

		$post_ctx = $config['currentPost'];
		$this->assertSame( $post_id, $post_ctx['id'], 'currentPost.id should match the post ID.' );
		$this->assertSame( 'Hello World Post', $post_ctx['title'], 'currentPost.title should match the post title.' );
		$this->assertNotEmpty( $post_ctx['url'], 'currentPost.url should be set.' );
		$this->assertArrayHasKey( 'excerpt', $post_ctx, 'currentPost should include excerpt.' );
		$this->assertArrayHasKey( 'author', $post_ctx, 'currentPost should include author.' );
		$this->assertSame( 'Test Author', $post_ctx['author'], 'currentPost.author should match display_name.' );
		$this->assertArrayHasKey( 'date', $post_ctx, 'currentPost should include date.' );
		$this->assertArrayHasKey( 'categories', $post_ctx, 'currentPost should include categories when present.' );
		$this->assertContains( 'Tech', $post_ctx['categories'], 'categories should contain "Tech".' );
		$this->assertArrayHasKey( 'tags', $post_ctx, 'currentPost should include tags when present.' );
		$this->assertContains( 'AI', $post_ctx['tags'], 'tags should contain "AI".' );
	}

	/**
	 * Test that the excerpt is trimmed to approximately 120 words by wp_trim_words.
	 */
	public function test_config_current_post_excerpt_is_trimmed() {
		$long_content = implode( ' ', array_fill( 0, 200, 'word' ) );

		$post_id = self::factory()->post->create(
			array(
				'post_title'   => 'Long Post',
				'post_content' => $long_content,
				'post_status'  => 'publish',
			)
		);

		$this->go_to( get_permalink( $post_id ) );
		$this->assertTrue( is_singular(), 'Should be on a singular view.' );

		$config     = $this->get_enqueued_config();
		$excerpt    = $config['currentPost']['excerpt'] ?? '';
		$word_count = str_word_count( strip_tags( $excerpt ) );

		// wp_trim_words appends '...' by default when trimmed; word count should
		// be at most 120 content words plus any ellipsis characters.
		$this->assertLessThanOrEqual(
			125,
			$word_count,
			'Excerpt should be trimmed to approximately 120 words.'
		);
	}

	/**
	 * Test that non-public singular contexts do not expose currentPost.
	 *
	 * Draft/private/future/trash posts are normally reached via privileged
	 * previews rather than public permalinks. Force the query into a singular
	 * shape so this validates the privacy guard directly.
	 */
	public function test_config_no_current_post_for_non_public_posts() {
		global $post, $wp_query;

		$statuses = array( 'draft', 'private', 'future', 'trash' );

		foreach ( $statuses as $status ) {
			$post_id = self::factory()->post->create(
				array(
					'post_title'   => 'Non-public post',
					'post_content' => 'Private draft content should not be exposed.',
					'post_status'  => $status,
				)
			);

			$saved_post     = $post;
			$saved_wp_query = clone $wp_query;

			$post                        = get_post( $post_id ); // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
			$wp_query->post              = $post;
			$wp_query->posts             = array( $post );
			$wp_query->queried_object    = $post;
			$wp_query->queried_object_id = $post_id;
			$wp_query->post_count        = 1;
			$wp_query->is_single         = true;
			$wp_query->is_preview        = true;

			$context = $this->call_private_static( 'get_current_post_context' );

			$post     = $saved_post; // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
			$wp_query = $saved_wp_query; // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited

			$this->assertNull(
				$context,
				sprintf( 'currentPost should not be exposed for %s posts.', $status )
			);
		}
	}

	/**
	 * Test that currentPost is absent on a singular view when the queried post
	 * cannot be retrieved (simulate by not having a valid post in the loop).
	 *
	 * We achieve this by querying a non-existent post ID.
	 */
	public function test_config_no_current_post_when_post_not_found() {
		// go_to a URL that results in is_singular true but no post exists.
		$this->go_to( '/?p=999999' );

		// is_singular() may still be true for a 404 — get_post() returns null.
		// The class guards with `if ( ! $post ) return null;`.
		// In the 404 case the WP environment has no current post in $post global.
		global $post;
		$saved = $post;
		$post  = null; // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited

		$config = $this->get_enqueued_config();

		// Restore.
		$post = $saved; // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited

		$this->assertArrayNotHasKey(
			'currentPost',
			$config,
			'currentPost should not be present when no post is available.'
		);
	}

	/**
	 * Test that a singular post without categories/tags omits those keys.
	 */
	public function test_config_current_post_no_categories_or_tags_when_absent() {
		$post_id = self::factory()->post->create(
			array(
				'post_title'   => 'Uncategorized Post',
				'post_content' => 'Some content.',
				'post_status'  => 'publish',
			)
		);
		// Remove the default "Uncategorized" category.
		wp_set_post_categories( $post_id, array() );

		$this->go_to( get_permalink( $post_id ) );
		$this->assertTrue( is_singular() );

		$config = $this->get_enqueued_config();

		// Categories may default to "Uncategorized" in WP, so only assert tags
		// are absent (tags are definitely empty if none are set).
		$this->assertArrayNotHasKey(
			'tags',
			$config['currentPost'] ?? array(),
			'tags key should not be present when the post has no tags.'
		);
	}

	// ──────────────────────────────────────────────────
	// decode_asset_json() — private static method
	// ──────────────────────────────────────────────────

	/**
	 * Test that decode_asset_json() returns a decoded array for valid JSON.
	 */
	public function test_decode_asset_json_returns_array_for_valid_json() {
		$result = $this->call_private_static(
			'decode_asset_json',
			array( '{"version":"1.2.3","dependencies":["wp-element"]}' )
		);

		$this->assertIsArray( $result );
		$this->assertSame( '1.2.3', $result['version'] );
		$this->assertSame( array( 'wp-element' ), $result['dependencies'] );
	}

	/**
	 * Test that decode_asset_json() returns false for invalid (malformed) JSON.
	 */
	public function test_decode_asset_json_returns_false_for_invalid_json() {
		$result = $this->call_private_static( 'decode_asset_json', array( '{ invalid json }' ) );

		$this->assertFalse( $result, 'Should return false for malformed JSON.' );
	}

	/**
	 * Test that decode_asset_json() returns false for a JSON string (not array).
	 */
	public function test_decode_asset_json_returns_false_for_json_string() {
		$result = $this->call_private_static( 'decode_asset_json', array( '"just-a-string"' ) );

		$this->assertFalse( $result, 'Should return false when JSON decodes to a non-array scalar.' );
	}

	/**
	 * Test that decode_asset_json() returns false for a JSON number.
	 */
	public function test_decode_asset_json_returns_false_for_json_number() {
		$result = $this->call_private_static( 'decode_asset_json', array( '42' ) );

		$this->assertFalse( $result, 'Should return false when JSON decodes to a number.' );
	}

	/**
	 * Test that decode_asset_json() returns false for an empty string.
	 */
	public function test_decode_asset_json_returns_false_for_empty_string() {
		$result = $this->call_private_static( 'decode_asset_json', array( '' ) );

		$this->assertFalse( $result, 'Should return false for an empty string input.' );
	}

	/**
	 * Test that decode_asset_json() returns false for null JSON (`null` literal).
	 */
	public function test_decode_asset_json_returns_false_for_null_literal() {
		$result = $this->call_private_static( 'decode_asset_json', array( 'null' ) );

		$this->assertFalse( $result, 'Should return false when JSON decodes to null.' );
	}

	// ──────────────────────────────────────────────────
	// fetch_remote_asset_json() — uses pre_http_request mock
	// ──────────────────────────────────────────────────

	/**
	 * Test that fetch_remote_asset_json() returns decoded data on a successful HTTP response.
	 */
	public function test_fetch_remote_asset_json_returns_data_on_success() {
		$asset_json = '{"version":"2.0.0","dependencies":[]}';

		add_filter(
			'pre_http_request',
			function ( $preempt, $parsed_args, $url ) use ( $asset_json ) {
				if ( false !== strpos( $url, 'reader-chat.asset.json' ) ) {
					return array(
						'response' => array(
							'code'    => 200,
							'message' => 'OK',
						),
						'body'     => $asset_json,
						'headers'  => array(),
						'cookies'  => array(),
					);
				}
				return $preempt;
			},
			10,
			3
		);

		$result = $this->call_private_static(
			'fetch_remote_asset_json',
			array( 'https://widgets.wp.com/agents-manager/reader-chat.asset.json' )
		);

		$this->assertIsArray( $result );
		$this->assertSame( '2.0.0', $result['version'] );
	}

	/**
	 * Test that fetch_remote_asset_json() returns false on a WP_Error (network failure).
	 */
	public function test_fetch_remote_asset_json_returns_false_on_network_error() {
		$this->block_http_requests();

		$result = $this->call_private_static(
			'fetch_remote_asset_json',
			array( 'https://widgets.wp.com/agents-manager/reader-chat.asset.json' )
		);

		$this->assertFalse( $result, 'Should return false when HTTP request fails.' );
	}

	/**
	 * Test that fetch_remote_asset_json() returns false on a non-200 HTTP response.
	 */
	public function test_fetch_remote_asset_json_returns_false_on_non_200() {
		add_filter(
			'pre_http_request',
			function () {
				return array(
					'response' => array(
						'code'    => 404,
						'message' => 'Not Found',
					),
					'body'     => '',
					'headers'  => array(),
					'cookies'  => array(),
				);
			}
		);

		$result = $this->call_private_static(
			'fetch_remote_asset_json',
			array( 'https://widgets.wp.com/agents-manager/reader-chat.asset.json' )
		);

		$this->assertFalse( $result, 'Should return false on a 404 response.' );
	}

	/**
	 * Test that fetch_remote_asset_json() returns false when the response body
	 * is not a valid JSON array.
	 */
	public function test_fetch_remote_asset_json_returns_false_on_invalid_json_body() {
		add_filter(
			'pre_http_request',
			function () {
				return array(
					'response' => array(
						'code'    => 200,
						'message' => 'OK',
					),
					'body'     => '<html>Not JSON</html>',
					'headers'  => array(),
					'cookies'  => array(),
				);
			}
		);

		$result = $this->call_private_static(
			'fetch_remote_asset_json',
			array( 'https://widgets.wp.com/agents-manager/reader-chat.asset.json' )
		);

		$this->assertFalse( $result, 'Should return false when response body is not valid JSON array.' );
	}

	// ──────────────────────────────────────────────────
	// read_local_asset_json() — filesystem helper
	// ──────────────────────────────────────────────────

	/**
	 * Test that read_local_asset_json() returns false for a non-existent file.
	 */
	public function test_read_local_asset_json_returns_false_for_missing_file() {
		$result = $this->call_private_static(
			'read_local_asset_json',
			array( '/tmp/this-file-does-not-exist-' . uniqid() . '.json' )
		);

		$this->assertFalse( $result, 'Should return false for a non-existent file path.' );
	}

	/**
	 * Test that read_local_asset_json() returns a decoded array for a valid local JSON file.
	 */
	public function test_read_local_asset_json_returns_data_for_valid_file() {
		$tmp_file = tempnam( sys_get_temp_dir(), 'jrc_test_' );
		file_put_contents( $tmp_file, '{"version":"3.0.0","dependencies":["wp-data"]}' );

		$result = $this->call_private_static( 'read_local_asset_json', array( $tmp_file ) );

		unlink( $tmp_file );

		$this->assertIsArray( $result );
		$this->assertSame( '3.0.0', $result['version'] );
	}

	/**
	 * Test that read_local_asset_json() returns false when the file contains
	 * invalid JSON (delegates to decode_asset_json).
	 */
	public function test_read_local_asset_json_returns_false_for_invalid_json_file() {
		$tmp_file = tempnam( sys_get_temp_dir(), 'jrc_test_' );
		file_put_contents( $tmp_file, '{ this is not valid json }' );

		$result = $this->call_private_static( 'read_local_asset_json', array( $tmp_file ) );

		unlink( $tmp_file );

		$this->assertFalse( $result, 'Should return false for a file with invalid JSON.' );
	}

	// ──────────────────────────────────────────────────
	// Asset version / dev-mode fallback
	// ──────────────────────────────────────────────────

	/**
	 * Test that when both local and remote asset fetches fail in non-dev mode,
	 * the script is enqueued with a null version (no query param).
	 *
	 * We can observe this indirectly: enqueue_scripts() still calls
	 * wp_enqueue_script, so the script should be enqueued but registered
	 * with ver = null.
	 */
	public function test_enqueue_scripts_version_is_null_when_asset_fetch_fails_in_production() {
		$this->override_ai_features( true );
		$this->block_http_requests();
		// Clear cached data so it must hit the network (which is blocked).
		delete_transient( AiAssistantPlugin\READER_CHAT_ASSET_TRANSIENT );

		// The current test domain won't be localhost/jurassic.tube/etc. so
		// is_dev_mode() should return false — version falls back to null.
		Jetpack_Reader_Chat::enqueue_scripts();

		$registered = $GLOBALS['wp_scripts']->registered['jetpack-reader-chat'] ?? null;
		$this->assertNotNull( $registered, 'Script should still be registered even when asset version is unavailable.' );
		$this->assertNull( $registered->ver, 'Version should be null when asset fetch fails in production mode.' );
	}

	/**
	 * Test that failed asset manifest lookups are cached briefly so production
	 * page loads do not retry the remote manifest on every request.
	 */
	public function test_enqueue_scripts_caches_asset_fetch_failure() {
		$this->override_ai_features( true );
		delete_transient( AiAssistantPlugin\READER_CHAT_ASSET_TRANSIENT );

		$request_count = 0;
		add_filter(
			'pre_http_request',
			function () use ( &$request_count ) {
				$request_count++;
				return new WP_Error( 'blocked', 'No HTTP in tests.' );
			}
		);

		for ( $i = 0; $i < 2; $i++ ) {
			Jetpack_Reader_Chat::enqueue_scripts();
		}

		$cached = get_transient( AiAssistantPlugin\READER_CHAT_ASSET_TRANSIENT );
		$this->assertSame( 1, $request_count, 'Remote asset manifest should only be requested once.' );
		$this->assertIsArray( $cached, 'Failed lookup should be cached as asset data.' );
		$this->assertArrayHasKey( 'version', $cached, 'Failure cache should preserve the expected asset shape.' );
		$this->assertNull( $cached['version'], 'Failure cache should resolve to a null asset version.' );
	}

	/**
	 * Test that the cached transient version is used when available, and the
	 * version string matches what was cached.
	 */
	public function test_enqueue_scripts_uses_cached_asset_version() {
		$this->override_ai_features( true );
		$this->cache_asset_data( array( 'version' => 'cached-1.2.3' ) );

		Jetpack_Reader_Chat::enqueue_scripts();

		$registered = $GLOBALS['wp_scripts']->registered['jetpack-reader-chat'] ?? null;
		$this->assertNotNull( $registered );
		$this->assertSame( 'cached-1.2.3', $registered->ver, 'Cached asset version should be used.' );
	}

	// ──────────────────────────────────────────────────
	// has_ai_features() — mirrors ai-sidebar tests
	// ──────────────────────────────────────────────────

	/**
	 * Test that has_ai_features() returns true when a Jetpack owner is connected
	 * and offline mode is off (uses the public filter path via enqueue_scripts).
	 *
	 * We test this indirectly: with a connected owner and no feature override,
	 * enqueue_scripts() should enqueue (default filter returns null, so the
	 * internal has_ai_features() decides).
	 */
	public function test_has_ai_features_true_when_connected() {
		$this->cache_asset_data();
		// Connected owner is set up in set_up() via simulate_connected_owner().
		// No override filter — class calls has_ai_features() directly.

		Jetpack_Reader_Chat::enqueue_scripts();

		$this->assertTrue(
			wp_script_is( 'jetpack-reader-chat', 'enqueued' ),
			'Script should enqueue when Jetpack is connected (has_ai_features = true).'
		);
	}

	/**
	 * Test that has_ai_features() returns false (and enqueue is skipped) when
	 * Jetpack is disconnected (no connected owner).
	 */
	public function test_has_ai_features_false_when_disconnected() {
		$this->cache_asset_data();
		// Reset connection so there is no connected owner.
		\Jetpack_Options::delete_option( 'master_user' );
		\Jetpack_Options::delete_option( 'user_tokens' );
		( new \Automattic\Jetpack\Connection\Manager( 'jetpack' ) )->reset_connection_status();

		// No override filter, so class calls has_ai_features() which checks connection.
		Jetpack_Reader_Chat::enqueue_scripts();

		$this->assertFalse(
			wp_script_is( 'jetpack-reader-chat', 'enqueued' ),
			'Script should not enqueue when Jetpack is disconnected.'
		);
	}

	/**
	 * Test that has_ai_features() respects the jetpack_ai_enabled filter
	 * when set to false — the reader-chat script should not load.
	 */
	public function test_has_ai_features_respects_jetpack_ai_enabled_filter_false() {
		$this->cache_asset_data();
		add_filter( 'jetpack_ai_enabled', '__return_false' );

		// Connected owner is set up in set_up(), but jetpack_ai_enabled = false
		// should override and make has_ai_features() return false.
		Jetpack_Reader_Chat::enqueue_scripts();

		$this->assertFalse(
			wp_script_is( 'jetpack-reader-chat', 'enqueued' ),
			'Script should not enqueue when jetpack_ai_enabled filter is false.'
		);
	}

	/**
	 * Test that the jetpack_reader_chat_has_ai_features filter with null value
	 * falls through to the default has_ai_features() check (connected owner
	 * means true).
	 */
	public function test_has_ai_features_null_filter_uses_default_check_connected() {
		$this->cache_asset_data();
		// Filter explicitly returns null → class falls back to has_ai_features().
		add_filter(
			'jetpack_reader_chat_has_ai_features',
			function () {
				return null;
			}
		);

		Jetpack_Reader_Chat::enqueue_scripts();

		// Connected owner set up in set_up() — default check should return true.
		$this->assertTrue(
			wp_script_is( 'jetpack-reader-chat', 'enqueued' ),
			'Script should enqueue when filter returns null and owner is connected.'
		);
	}

	/**
	 * Test that has_ai_features() returns false in offline mode even with a
	 * connected owner (no override filter).
	 */
	public function test_has_ai_features_false_in_offline_mode() {
		$this->cache_asset_data();

		// Simulate offline mode by setting the xmlrpc_errors option (Status checks this).
		add_filter( 'jetpack_offline_mode', '__return_true' );

		Jetpack_Reader_Chat::enqueue_scripts();

		remove_filter( 'jetpack_offline_mode', '__return_true' );

		$this->assertFalse(
			wp_script_is( 'jetpack-reader-chat', 'enqueued' ),
			'Script should not enqueue when Jetpack is in offline mode.'
		);
	}
}
