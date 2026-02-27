<?php
/**
 * Tests for the oEmbed fallback and self-healing in Initializer::render_videopress_video_block.
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack;

use Automattic\Jetpack\VideoPress\Initializer as VideoPress_Initializer;
use Automattic\Jetpack\VideoPress\Utils;
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
	 * @param array $attributes Block attributes.
	 * @return string Rendered block markup.
	 */
	private function render( $attributes = array() ) {
		$attributes = array_merge( self::$default_attributes, $attributes );
		$block      = array( 'context' => array() );
		return VideoPress_Initializer::render_videopress_video_block( $attributes, '', $block );
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
		return md5( $url . serialize( $embed_attr ) ); // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.serialize_serialize
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
		$this->assertStringContainsString( 'allow="clipboard-write"', $html );
		$this->assertStringContainsString( 'width="640"', $html );
		$this->assertStringContainsString( 'height="360"', $html );
	}

	/** Tests that the fallback filter is cleaned up after rendering. */
	public function test_fallback_filter_removed_after_render() {
		$this->render();

		$this->assertFalse( has_filter( 'embed_maybe_make_link' ) );
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
}
