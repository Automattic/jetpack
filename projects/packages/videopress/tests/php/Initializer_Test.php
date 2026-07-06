<?php
/**
 * Tests for the oEmbed fallback and self-healing in Initializer::render_videopress_video_block.
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack;

use Automattic\Jetpack\VideoPress\Initializer as VideoPress_Initializer;
use Automattic\Jetpack\VideoPress\Utils;
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
}
