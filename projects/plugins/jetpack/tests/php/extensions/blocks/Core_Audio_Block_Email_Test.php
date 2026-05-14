<?php
/**
 * Core Audio Block Email Rendering tests
 *
 * @package automattic/jetpack
 */

require_once JETPACK__PLUGIN_DIR . 'extensions/extended-blocks/core-audio/core-audio.php';

// Include mock classes for WooCommerce Email Editor helpers
require_once __DIR__ . '/mocks/class-mock-styles-helper.php';
require_once __DIR__ . '/mocks/class-mock-table-wrapper-helper.php';
require_once __DIR__ . '/mocks/class-mock-woocommerce-audio-renderer.php';

use PHPUnit\Framework\Attributes\CoversFunction;

/**
 * Core Audio Block Email Rendering tests.
 *
 * Verifies that the email render path swaps the raw audio src for the host
 * post permalink, mirroring the fix already in place for jetpack/podcast-player.
 *
 * @covers ::Automattic\Jetpack\Extensions\Core_Audio\render_email
 */
#[CoversFunction( 'Automattic\Jetpack\Extensions\Core_Audio\render_email' )]
class Core_Audio_Block_Email_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Helper to create a parsed block with a default audio src.
	 *
	 * @param array $attrs       Optional custom attrs to merge.
	 * @param array $email_attrs Optional email_attrs to attach.
	 * @return array Parsed block structure.
	 */
	private function create_parsed_block( $attrs = array(), $email_attrs = null ) {
		$default_attrs = array(
			'src' => 'https://example.com/audio.mp3',
			'id'  => 42,
		);

		$parsed_block = array(
			'attrs' => array_merge( $default_attrs, $attrs ),
		);

		if ( null !== $email_attrs ) {
			$parsed_block['email_attrs'] = $email_attrs;
		}

		return $parsed_block;
	}

	/**
	 * Helper to create a rendering context mock.
	 *
	 * @param string $width The width to return from get_layout_width_without_padding.
	 * @return object Mock rendering context.
	 */
	private function create_rendering_context_mock( $width = '600px' ) {
		return new class( $width ) {
			private $width;

			public function __construct( $width ) {
				$this->width = $width;
			}

			public function get_layout_width_without_padding() {
				return $this->width;
			}
		};
	}

	/**
	 * Helper to set up a global post for permalink resolution.
	 *
	 * @return int Post ID.
	 */
	private function set_up_global_post() {
		$post_id = wp_insert_post(
			array(
				'post_title'   => 'Test Post',
				'post_content' => 'Test content',
				'post_status'  => 'publish',
			)
		);
		global $post;
		$post = get_post( $post_id );
		return $post_id;
	}

	/**
	 * Test render_email links to the host post permalink, not the audio src.
	 */
	public function test_render_email_links_to_post_permalink_not_audio_src() {
		$post_id      = $this->set_up_global_post();
		$parsed_block = $this->create_parsed_block();
		$mock_context = $this->create_rendering_context_mock();

		$result = \Automattic\Jetpack\Extensions\Core_Audio\render_email( '', $parsed_block, $mock_context );

		$this->assertNotEmpty( $result );
		$this->assertStringContainsString( '<table', $result );
		$this->assertStringContainsString( 'href=', $result );
		$this->assertStringContainsString( 'Listen to the audio', $result );

		// Most important: link target is the post permalink, NOT the raw MP3.
		$this->assertStringContainsString( get_permalink( $post_id ), $result );
		$this->assertStringNotContainsString( 'https://example.com/audio.mp3', $result );

		wp_delete_post( $post_id, true );
	}

	/**
	 * Test render_email returns empty when no post permalink is available.
	 */
	public function test_render_email_returns_empty_when_no_post() {
		global $post;
		$original_post = $post;
		$post          = null;

		$parsed_block = $this->create_parsed_block();
		$mock_context = $this->create_rendering_context_mock();

		$result = \Automattic\Jetpack\Extensions\Core_Audio\render_email( '', $parsed_block, $mock_context );

		$this->assertSame( '', $result );

		$post = $original_post;
	}

	/**
	 * Test render_email preserves email_attrs (used for spacing) on the mock parsed_block.
	 */
	public function test_render_email_preserves_email_attrs() {
		$post_id      = $this->set_up_global_post();
		$parsed_block = $this->create_parsed_block(
			array(),
			array( 'margin' => '32px 0' )
		);
		$mock_context = $this->create_rendering_context_mock();

		$result = \Automattic\Jetpack\Extensions\Core_Audio\render_email( '', $parsed_block, $mock_context );

		$this->assertNotEmpty( $result );
		// The mock renderer compiles email_attrs.margin into the wrapper table style
		// when present; default margin (16px 0) appears only when email_attrs is empty.
		$this->assertStringNotContainsString( 'margin: 16px 0', $result );
		$this->assertStringContainsString( '32px', $result );

		wp_delete_post( $post_id, true );
	}

	/**
	 * Test render_email applies default spacing when no email_attrs are provided.
	 */
	public function test_render_email_applies_default_spacing_without_email_attrs() {
		$post_id      = $this->set_up_global_post();
		$parsed_block = $this->create_parsed_block();
		$mock_context = $this->create_rendering_context_mock();

		$result = \Automattic\Jetpack\Extensions\Core_Audio\render_email( '', $parsed_block, $mock_context );

		$this->assertStringContainsString( 'margin: 16px 0', $result );

		wp_delete_post( $post_id, true );
	}

	/**
	 * Test render_email contains pill button styling from the audio renderer.
	 */
	public function test_render_email_contains_button_styling() {
		$post_id      = $this->set_up_global_post();
		$parsed_block = $this->create_parsed_block();
		$mock_context = $this->create_rendering_context_mock();

		$result = \Automattic\Jetpack\Extensions\Core_Audio\render_email( '', $parsed_block, $mock_context );

		$this->assertNotEmpty( $result );
		$this->assertStringContainsString( 'background-color: #f6f7f7', $result );
		$this->assertStringContainsString( 'border: 1px solid #AAA', $result );
		$this->assertStringContainsString( 'border-radius: 9999px', $result );

		wp_delete_post( $post_id, true );
	}

	/**
	 * Test render_email contains the play icon image from the audio renderer.
	 */
	public function test_render_email_contains_play_icon() {
		$post_id      = $this->set_up_global_post();
		$parsed_block = $this->create_parsed_block();
		$mock_context = $this->create_rendering_context_mock();

		$result = \Automattic\Jetpack\Extensions\Core_Audio\render_email( '', $parsed_block, $mock_context );

		$this->assertNotEmpty( $result );
		$this->assertStringContainsString( 'audio-play.png', $result );
		$this->assertStringContainsString( '<img', $result );

		wp_delete_post( $post_id, true );
	}

	/**
	 * Test that the filter wires the email callback onto core/audio at registration time.
	 */
	public function test_filter_registers_render_email_callback_on_core_audio() {
		$args = apply_filters(
			'register_block_type_args',
			array(),
			'core/audio'
		);

		$this->assertArrayHasKey( 'render_email_callback', $args );
		$this->assertSame(
			'Automattic\\Jetpack\\Extensions\\Core_Audio\\render_email',
			$args['render_email_callback']
		);
	}

	/**
	 * Test that the filter does not touch other block types.
	 */
	public function test_filter_leaves_other_blocks_untouched() {
		$args = apply_filters(
			'register_block_type_args',
			array( 'icon' => 'star' ),
			'core/paragraph'
		);

		$this->assertArrayNotHasKey( 'render_email_callback', $args );
		$this->assertSame( 'star', $args['icon'] );
	}

	/**
	 * Test that the filter does not override an existing render_email_callback.
	 */
	public function test_filter_respects_existing_render_email_callback() {
		$args = apply_filters(
			'register_block_type_args',
			array( 'render_email_callback' => 'some_existing_callback' ),
			'core/audio'
		);

		$this->assertSame( 'some_existing_callback', $args['render_email_callback'] );
	}
}
