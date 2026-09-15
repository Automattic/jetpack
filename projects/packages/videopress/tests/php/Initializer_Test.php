<?php
/**
 * Tests for the oEmbed fallback and self-healing in Initializer::render_videopress_video_block.
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack;

use Automattic\Jetpack\VideoPress\Admin_UI as VideoPress_Admin_UI;
use Automattic\Jetpack\VideoPress\Initializer as VideoPress_Initializer;
use Automattic\Jetpack\VideoPress\Utils;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;
use WorDBless\BaseTestCase;

/**
 * Test suite for oEmbed fallback and self-healing behavior.
 */
class Initializer_Test extends BaseTestCase {

	/**
	 * Default block attributes with a valid GUID.
	 *
	 * @var array
	 */
	private static $default_attributes = array(
		'guid'     => 'testGUID1',
		'controls' => true,
	);

	/**
	 * Tear down after each test.
	 */
	public function tear_down() {
		parent::tear_down();
		unset( $GLOBALS['post'] );
		delete_option( 'videopress_player_preload_disabled' );
		delete_option( 'videopress_inline_player_enabled' );
	}

	/**
	 * Render the VideoPress block with the given attributes.
	 *
	 * Uses pre_oembed_result to force oEmbed failure so the fallback path
	 * is always exercised, regardless of external service availability.
	 *
	 * @param array $attributes Block attributes.
	 * @return string Rendered block markup.
	 */
	private function render( $attributes = array() ) {
		$attributes = array_merge( self::$default_attributes, $attributes );
		$block      = new \WP_Block( array( 'blockName' => 'videopress/video' ) );

		add_filter( 'pre_oembed_result', '__return_false' );

		$html = VideoPress_Initializer::render_videopress_video_block( $attributes, '', $block );

		remove_filter( 'pre_oembed_result', '__return_false' );

		return $html;
	}

	/**
	 * Create a post and set it as the global post.
	 *
	 * @return int Post ID.
	 */
	private function create_global_post() {
		$post_id = wp_insert_post(
			array(
				'post_title'  => 'Test',
				'post_status' => 'publish',
			)
		);
		$this->assertIsInt( $post_id );
		$this->assertGreaterThan( 0, $post_id );

		$GLOBALS['post'] = get_post( $post_id );

		return $post_id;
	}

	/**
	 * Compute the oEmbed cache key suffix for the default test attributes.
	 *
	 * Mirrors WP_Embed::shortcode() which uses md5( $url . serialize( $parsed_attr ) )
	 * where $parsed_attr includes defaults from wp_embed_defaults().
	 *
	 * @return string Cache key suffix (md5 hash).
	 */
	private function get_oembed_key_suffix() {
		$url        = wp_kses_post( Utils::get_video_press_url( 'testGUID1', self::$default_attributes ) );
		$embed_attr = wp_embed_defaults( $url );
		return md5( $url . serialize( $embed_attr ) );
	}

	/** Tests that the fallback iframe is rendered when oEmbed fails. */
	public function test_fallback_iframe_rendered_on_oembed_failure() {
		$html = $this->render();

		$this->assertStringContainsString( '<iframe', $html );
		$this->assertStringContainsString( 'videopress.com/embed/testGUID1', $html );
		$this->assertStringNotContainsString( '<a href=', $html );
	}

	/** Tests that the fallback iframe has the expected attributes. */
	public function test_fallback_iframe_attributes() {
		$html = $this->render();

		$this->assertStringContainsString( 'allowfullscreen', $html );
		$this->assertStringContainsString( 'data-resize-to-parent="true"', $html );
		$this->assertStringContainsString( 'allow="clipboard-write; presentation"', $html );
		$this->assertStringContainsString( 'width="640"', $html );
		$this->assertStringContainsString( 'height="360"', $html );
	}

	/** Tests that the site-wide preload opt-out reaches the block's embed URL. */
	public function test_block_embed_honors_site_preload_opt_out() {
		$this->assertStringContainsString( 'preloadContent=metadata', $this->render() );

		update_option( 'videopress_player_preload_disabled', true );

		$html = $this->render( array( 'preload' => 'metadata' ) );
		$this->assertStringContainsString( 'preloadContent=none', $html );
		$this->assertStringNotContainsString( 'preloadContent=metadata', $html );
	}

	/**
	 * Tests that the inline player replaces the iframe when the site turns it on.
	 *
	 * Runs in a separate process: rendering the inline player loads Jwt_Token_Bridge,
	 * which Uploader_Test replaces with an alias mock that needs the class unloaded.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_block_renders_inline_player_when_enabled() {
		update_option( 'videopress_inline_player_enabled', true );

		$html = $this->render(
			array(
				'muted'      => true,
				'videoRatio' => 75,
			)
		);

		$this->assertStringNotContainsString( '<iframe', $html );
		$this->assertStringContainsString( 'jetpack-videopress-player__wrapper', $html );
		$this->assertStringContainsString( 'data-videopress-guid="testGUID1"', $html );
		$this->assertStringContainsString( '&quot;muted&quot;:true', $html );
		$this->assertStringContainsString( 'aspect-ratio:100 / 75', $html );
		$this->assertTrue( wp_script_is( 'videopress-inline-player', 'enqueued' ) );
	}

	/** Tests that preview on hover keeps the iframe, since it drives the player through the iframe API. */
	public function test_block_keeps_iframe_for_preview_on_hover() {
		update_option( 'videopress_inline_player_enabled', true );

		$html = $this->render(
			array(
				'posterData' => array(
					'previewOnHover'      => true,
					'previewAtTime'       => 0,
					'previewLoopDuration' => 3,
				),
			)
		);

		$this->assertStringContainsString( '<iframe', $html );
		$this->assertStringNotContainsString( 'data-videopress-guid', $html );
	}

	/**
	 * Tests that VideoPress oEmbeds become inline players and skip the remote fetch when enabled.
	 *
	 * Runs in a separate process for the same Jwt_Token_Bridge reason as the block test above.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_oembed_filters_render_inline_player_when_enabled() {
		$url    = 'https://videopress.com/v/abcDEF12?preloadContent=none&amp;muted=1';
		$iframe = '<iframe src="https://videopress.com/embed/abcDEF12"></iframe>';

		$this->assertNull( VideoPress_Initializer::maybe_pre_oembed_inline_player( null, $url ) );
		$this->assertSame( $iframe, VideoPress_Initializer::maybe_render_oembed_inline_player( $iframe, $url, array(), 0 ) );

		update_option( 'videopress_inline_player_enabled', true );

		$pre = VideoPress_Initializer::maybe_pre_oembed_inline_player( null, $url );
		$this->assertStringContainsString( 'data-videopress-guid="abcDEF12"', $pre );
		$this->assertStringContainsString( '&quot;preloadContent&quot;:&quot;none&quot;', $pre );
		$this->assertStringContainsString( '&quot;muted&quot;:true', $pre );

		$this->assertStringContainsString( 'data-videopress-guid="abcDEF12"', VideoPress_Initializer::maybe_render_oembed_inline_player( $iframe, $url, array(), 0 ) );

		// Anything that is not a VideoPress video, or not an iframe, is left alone.
		$this->assertNull( VideoPress_Initializer::maybe_pre_oembed_inline_player( null, 'https://www.youtube.com/watch?v=abc' ) );
		$this->assertFalse( VideoPress_Initializer::maybe_render_oembed_inline_player( false, $url, array(), 0 ) );
	}

	/** Tests that the fallback filter is cleaned up after rendering. */
	public function test_fallback_filter_removed_after_render() {
		$before = has_filter( 'embed_maybe_make_link' );

		$this->render();

		$this->assertSame( $before, has_filter( 'embed_maybe_make_link' ) );
	}

	/** Tests that recent {{unknown}} cache entries are cleared. */
	public function test_self_heal_clears_recent_unknown_cache() {
		$post_id    = $this->create_global_post();
		$key_suffix = $this->get_oembed_key_suffix();

		update_post_meta( $post_id, '_oembed_' . $key_suffix, '{{unknown}}' );
		update_post_meta( $post_id, '_oembed_time_' . $key_suffix, time() );

		$this->render();

		$this->assertEmpty( get_post_meta( $post_id, '_oembed_' . $key_suffix, true ) );
		$this->assertEmpty( get_post_meta( $post_id, '_oembed_time_' . $key_suffix, true ) );
	}

	/** Tests that {{unknown}} cache entries without a timestamp are cleared. */
	public function test_self_heal_clears_unknown_cache_without_timestamp() {
		$post_id    = $this->create_global_post();
		$key_suffix = $this->get_oembed_key_suffix();

		update_post_meta( $post_id, '_oembed_' . $key_suffix, '{{unknown}}' );

		$this->render();

		$this->assertEmpty( get_post_meta( $post_id, '_oembed_' . $key_suffix, true ) );
	}

	/** Tests that old {{unknown}} cache entries are NOT cleared (backoff preserved). */
	public function test_self_heal_preserves_old_unknown_cache() {
		$post_id    = $this->create_global_post();
		$key_suffix = $this->get_oembed_key_suffix();

		update_post_meta( $post_id, '_oembed_' . $key_suffix, '{{unknown}}' );
		update_post_meta( $post_id, '_oembed_time_' . $key_suffix, time() - 2 * MINUTE_IN_SECONDS );

		$this->render();

		$this->assertSame( '{{unknown}}', get_post_meta( $post_id, '_oembed_' . $key_suffix, true ) );
		$this->assertNotEmpty( get_post_meta( $post_id, '_oembed_time_' . $key_suffix, true ) );
	}

	/** Tests that valid oEmbed cache entries are not touched. */
	public function test_self_heal_does_not_touch_valid_cache() {
		$post_id     = $this->create_global_post();
		$key_suffix  = $this->get_oembed_key_suffix();
		$valid_embed = '<iframe src="https://videopress.com/embed/testGUID1"></iframe>';

		update_post_meta( $post_id, '_oembed_' . $key_suffix, $valid_embed );
		update_post_meta( $post_id, '_oembed_time_' . $key_suffix, time() );

		$this->render();

		$this->assertSame( $valid_embed, get_post_meta( $post_id, '_oembed_' . $key_suffix, true ) );
	}

	/** Tests that the block renders without errors when there is no global post. */
	public function test_self_heal_no_post_id() {
		unset( $GLOBALS['post'] );

		$html = $this->render();

		$this->assertStringContainsString( '<iframe', $html );
	}

	/**
	 * When the VideoPress module is not active but the admin UI is enabled (as the
	 * Jetpack plugin does via Config), init() must still register the dynamic menu
	 * callback so "Jetpack > VideoPress" renders, linking to the My Jetpack
	 * interstitial where the module can be activated.
	 *
	 * Runs in a separate process: init() is guarded by the videopress_init action
	 * and the admin_ui init option is static state, so neither may leak into (or
	 * from) the rest of the suite.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_init_registers_inactive_menu_when_module_inactive() {
		VideoPress_Initializer::update_init_options( array( 'admin_ui' => true ) );

		VideoPress_Initializer::init();

		$this->assertSame(
			1,
			has_action( 'admin_menu', array( VideoPress_Admin_UI::class, 'enable_menu' ) )
		);
	}

	/**
	 * The REST API endpoint classes are no longer constructed at init time; their construction is
	 * deferred to priority-0 `rest_api_init` callbacks. Initializer::init() has two such blocks:
	 * the always-run WPCOM v2 endpoints in unconditional_initialization(), and the active-module
	 * endpoints in active_initialization(). Guard both: firing the hook must still register the
	 * routes — each priority-0 callback constructs/inits the endpoints, which add their own
	 * default-priority callbacks that register the routes within the same firing. A regression to
	 * that re-entrancy (e.g. bumping a deferred priority off 0) would silently drop the routes.
	 *
	 * Runs in a separate process: driving the real Initializer autoloads VideoPress classes
	 * (e.g. Jwt_Token_Bridge) that other tests in this suite replace with alias mocks, which
	 * require the class to be unloaded. The isolated process also lets us force the module-active
	 * path via a standalone-plugin class stub without leaking it into the rest of the suite.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_rest_endpoints_register_lazily_on_rest_api_init() {
		/*
		 * Force Status::is_active() true so active_initialization() runs and its deferral block is
		 * exercised too. is_standalone_plugin_active() only checks for the standalone plugin class;
		 * the stub fixture defines it. Safe because this test runs in an isolated process.
		 */
		require_once __DIR__ . '/mocks/class-jetpack-videopress-plugin.php';

		global $wp_rest_server;
		$wp_rest_server = new \WP_REST_Server();

		VideoPress_Initializer::init();

		$routes_before = $wp_rest_server->get_routes();
		$this->assertArrayNotHasKey(
			'/wpcom/v2/videopress/meta',
			$routes_before,
			'WPCOM v2 VideoPress route should not register before rest_api_init fires.'
		);
		$this->assertArrayNotHasKey(
			'/videopress/v1/features',
			$routes_before,
			'Active-module VideoPress route should not register before rest_api_init fires.'
		);

		do_action( 'rest_api_init' );

		$routes_after = $wp_rest_server->get_routes();
		$this->assertArrayHasKey(
			'/wpcom/v2/videopress/meta',
			$routes_after,
			'WPCOM v2 VideoPress route should register on rest_api_init via the unconditional deferral block.'
		);
		$this->assertArrayHasKey(
			'/videopress/v1/features',
			$routes_after,
			'Active-module VideoPress route should register on rest_api_init via the active_initialization deferral block.'
		);
	}

	/**
	 * The videopress_guid mapping is what the VideoPress meta and poster
	 * endpoints authorize against, so init() has to keep it out of reach of the
	 * user-facing meta write APIs. Otherwise an author can point an attachment
	 * they own at somebody else's video and satisfy the endpoints' edit_post
	 * check while the handler acts on the other video.
	 *
	 * This drives the real init() so the production wiring is what is under
	 * test; a test that registered the filters itself would keep passing if the
	 * hook were dropped. The assertions go through the capabilities
	 * map_meta_cap() resolves, which is what every user-facing write path
	 * (Custom Fields, XML-RPC set_custom_fields, the WordPress.com JSON API
	 * metadata op, REST) consults.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_init_makes_videopress_guid_meta_unwritable_by_users() {
		$user_id = wp_insert_user(
			array(
				'user_login' => 'guid_meta_author',
				'user_pass'  => 'password',
				'role'       => 'author',
			)
		);
		wp_set_current_user( $user_id );
		$attachment_id = wp_insert_post(
			array(
				'post_type'      => 'attachment',
				'post_status'    => 'inherit',
				'post_mime_type' => 'video/videopress',
				'post_author'    => $user_id,
				'post_title'     => 'Owned video',
			)
		);

		VideoPress_Initializer::init();

		$this->assertFalse(
			current_user_can( 'add_post_meta', $attachment_id, 'videopress_guid' ),
			'An author must not be able to point an attachment they own at another video.'
		);
		$this->assertFalse(
			current_user_can( 'edit_post_meta', $attachment_id, 'videopress_guid' ),
			'An author must not be able to rewrite an existing guid mapping.'
		);
		$this->assertTrue(
			current_user_can( 'add_post_meta', $attachment_id, 'unrelated_meta_key' ),
			'Unrelated meta keys must keep their normal capability handling.'
		);
		$this->assertFalse(
			is_protected_meta( 'videopress_guid', 'post' ),
			'The key must stay unprotected so generic metadata reads are unaffected.'
		);

		// VideoPress writes the mapping itself with update_post_meta(), which
		// does not consult capabilities, so uploads and transcoding still work.
		update_post_meta( $attachment_id, 'videopress_guid', 'wRiTe123' );
		$this->assertSame( 'wRiTe123', get_post_meta( $attachment_id, 'videopress_guid', true ) );
	}

	/**
	 * The preview-on-hover poster URL remains contained in a quoted CSS url().
	 *
	 * @dataProvider data_preview_on_hover_poster_urls
	 *
	 * @param string $value        Poster URL to render.
	 * @param string $expected_url Sanitized URL expected in the output.
	 */
	#[DataProvider( 'data_preview_on_hover_poster_urls' )]
	public function test_preview_on_hover_poster_url_is_quoted_in_css( $value, $expected_url ) {
		$html = $this->render(
			array(
				'posterData' => array(
					'url'                 => $value,
					'previewOnHover'      => true,
					'previewAtTime'       => 0,
					'previewLoopDuration' => 5000,
				),
			)
		);

		$this->assertStringContainsString( 'url(&quot;' . $expected_url . '&quot;)', $html );
		$this->assertStringNotContainsString( 'background-image: url(https', $html );

		$this->assertSame( 1, preg_match( '/<div class="jetpack-videopress-player__overlay" style="([^"]*)"/', $html, $matches ) );
		$style = html_entity_decode( $matches[1], ENT_QUOTES | ENT_HTML5, 'UTF-8' );
		$this->assertSame( 2, substr_count( $style, '"' ) );
	}

	/**
	 * Poster URL values that require normalization before output.
	 *
	 * @return array[] Test cases.
	 */
	public static function data_preview_on_hover_poster_urls() {
		$expected_url = 'https://example.test/a);b:c;x:url(';

		return array(
			'literal quotes'         => array( 'https://example.test/a");b:c;x:url("', $expected_url ),
			'named entities'         => array( 'https://example.test/a&quot;);b:c;x:url(&quot;', $expected_url ),
			'decimal entities'       => array( 'https://example.test/a&#34;);b:c;x:url(&#34;', $expected_url ),
			'hexadecimal entities'   => array( 'https://example.test/a&#x22;);b:c;x:url(&#x22;', $expected_url ),
			'multiply encoded value' => array(
				'https://example.test/a&amp;quot;);b:c;x:url(&amp;quot;',
				'https://example.test/a&amp;quot;);b:c;x:url(&amp;quot;',
			),
			'encoded line breaks'    => array( 'https://example.test/a&#10;);b:c;x:url(&#10;', $expected_url ),
			'encoded slashes'        => array( 'https://example.test/a&#92;&#92;&#34;);b:c;x:url(&#34;', $expected_url ),
		);
	}

	/** Tests that ordinary encoded query parameters retain their URL semantics. */
	public function test_preview_on_hover_poster_url_preserves_encoded_query_parameters() {
		$value = 'https://example.test/x.jpg?ssl=1&amp;resize=640%2C360';

		$html = $this->render(
			array(
				'posterData' => array(
					'url'                 => $value,
					'previewOnHover'      => true,
					'previewAtTime'       => 0,
					'previewLoopDuration' => 5000,
				),
			)
		);

		$this->assertStringContainsString( 'url(&quot;https://example.test/x.jpg?ssl=1&amp;resize=640%2C360&quot;)', $html );
	}

	/**
	 * Invalid poster URL values do not produce an inline style.
	 *
	 * @dataProvider data_invalid_preview_on_hover_poster_urls
	 *
	 * @param mixed $value Poster URL value.
	 */
	#[DataProvider( 'data_invalid_preview_on_hover_poster_urls' )]
	public function test_invalid_preview_on_hover_poster_url_is_dropped( $value ) {
		$html = $this->render(
			array(
				'posterData' => array(
					'url'                 => $value,
					'previewOnHover'      => true,
					'previewAtTime'       => 0,
					'previewLoopDuration' => 5000,
				),
			)
		);

		$this->assertStringContainsString( 'jetpack-videopress-player__overlay', $html );
		$this->assertStringNotContainsString( 'background-image:', $html );
	}

	/**
	 * Invalid poster URL values.
	 *
	 * @return array[] Test cases.
	 */
	public static function data_invalid_preview_on_hover_poster_urls() {
		return array(
			'disallowed protocol' => array( 'javascript:alert(1)' ),
			'non-string value'    => array( array( 'https://example.test/x.jpg' ) ),
		);
	}

	/**
	 * The maxWidth block attribute is rendered into an inline style, so only a
	 * plain CSS length or percentage is applied; any other value is dropped.
	 */
	public function test_max_width_only_accepts_css_lengths() {
		// A value that is not a plain length/percentage is dropped, not rendered.
		$other = $this->render( array( 'maxWidth' => '10px;color:red' ) );
		$this->assertStringNotContainsString( 'color:red', $other );
		$this->assertStringNotContainsString( 'max-width: 10px;color', $other );

		// A well-formed length still applies.
		$valid = $this->render( array( 'maxWidth' => '400px' ) );
		$this->assertStringContainsString( 'max-width: 400px;', $valid );
	}
}
