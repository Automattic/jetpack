<?php
/**
 * AI Assistant block tests.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Blocks;
use Automattic\Jetpack\Extensions\AIAssistant;

require_once JETPACK__PLUGIN_DIR . '/extensions/blocks/ai-assistant/ai-assistant.php';

/**
 * Tests the AI Assistant block and extension settings gates.
 */
class AI_Assistant_Block_Test extends WP_UnitTestCase {
	use Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	const BLOCK_NAME = 'jetpack/ai-assistant';

	/**
	 * The block registration present before the test.
	 *
	 * @var WP_Block_Type|null
	 */
	private $registered_block;

	/**
	 * Set up before each test.
	 */
	public function set_up() {
		parent::set_up();

		Jetpack_Gutenberg::reset();
		add_filter( 'jetpack_offline_mode', '__return_false' );
		// Keep the unrelated SEO plan check out of these extension assertions.
		add_filter( 'ai_seo_enhancer_enabled', '__return_false' );
		delete_option( 'jetpack_ai_enabled' );
		delete_option( 'jetpack_ai_writing_assistant_enabled' );
		delete_option( 'jetpack_ai_image_editor_enabled' );
		update_option( 'jetpack_ai_enabled', 1 );

		$this->registered_block = WP_Block_Type_Registry::get_instance()->get_registered( self::BLOCK_NAME );
		if ( $this->registered_block ) {
			unregister_block_type( self::BLOCK_NAME );
		}
	}

	/**
	 * Clean up after each test.
	 */
	public function tear_down() {
		if ( Blocks::is_registered( self::BLOCK_NAME ) ) {
			unregister_block_type( self::BLOCK_NAME );
		}
		if ( $this->registered_block ) {
			WP_Block_Type_Registry::get_instance()->register( $this->registered_block );
		}

		delete_option( 'jetpack_ai_enabled' );
		delete_option( 'jetpack_ai_writing_assistant_enabled' );
		delete_option( 'jetpack_ai_image_editor_enabled' );
		remove_filter( 'jetpack_offline_mode', '__return_false' );
		remove_filter( 'ai_seo_enhancer_enabled', '__return_false' );
		Jetpack_Gutenberg::reset();

		parent::tear_down();
	}

	/**
	 * The block registers when the master and writing toggles are enabled.
	 */
	public function test_block_registered_when_writing_enabled() {
		update_option( 'jetpack_ai_writing_assistant_enabled', 1 );

		// Re-run registration manually because the init hook fired during bootstrap.
		AIAssistant\register_block();

		$this->assertTrue( Blocks::is_registered( self::BLOCK_NAME ) );
	}

	/**
	 * The writing toggle prevents the block from registering.
	 */
	public function test_block_not_registered_when_writing_disabled() {
		update_option( 'jetpack_ai_writing_assistant_enabled', 0 );

		// Re-run registration manually because the init hook fired during bootstrap.
		AIAssistant\register_block();

		$this->assertFalse( Blocks::is_registered( self::BLOCK_NAME ) );
	}

	/**
	 * The master toggle prevents both the block and its extensions from registering.
	 */
	public function test_block_and_extensions_not_registered_when_master_disabled() {
		update_option( 'jetpack_ai_enabled', 0 );

		AIAssistant\register_block();
		do_action( 'jetpack_register_gutenberg_extensions' );

		$this->assertFalse( Blocks::is_registered( self::BLOCK_NAME ) );
		$this->assertFalse( Jetpack_Gutenberg::is_available( 'ai-assistant-support' ) );
		$this->assertFalse( Jetpack_Gutenberg::is_available( 'ai-content-lens' ) );
	}

	/**
	 * The writing extensions are available by default.
	 */
	public function test_extensions_registered_with_default_settings() {
		// The writing option intentionally defaults to enabled when absent.
		do_action( 'jetpack_register_gutenberg_extensions' );

		$this->assertTrue( Jetpack_Gutenberg::is_available( 'ai-assistant-support' ) );
		$this->assertTrue( Jetpack_Gutenberg::is_available( 'ai-content-lens' ) );
	}

	/**
	 * Disabling writing disables the writing and excerpt extensions.
	 */
	public function test_writing_toggle_disables_writing_and_excerpt_extensions() {
		update_option( 'jetpack_ai_writing_assistant_enabled', 0 );

		do_action( 'jetpack_register_gutenberg_extensions' );

		$this->assertFalse( Jetpack_Gutenberg::is_available( 'ai-assistant-support' ) );
		$this->assertFalse( Jetpack_Gutenberg::is_available( 'ai-content-lens' ) );
		$this->assertTrue( Jetpack_Gutenberg::is_available( 'ai-featured-image-generator' ) );
	}

	/**
	 * Disabling image editing prevents every legacy image extension from loading.
	 */
	public function test_image_toggle_disables_legacy_image_extensions() {
		update_option( 'jetpack_ai_image_editor_enabled', 0 );

		do_action( 'jetpack_register_gutenberg_extensions' );

		$this->assertTrue( Jetpack_Gutenberg::is_available( 'ai-assistant-support' ) );
		$this->assertFalse( Jetpack_Gutenberg::is_available( 'ai-featured-image-generator' ) );
		$this->assertFalse( Jetpack_Gutenberg::is_available( 'ai-assistant-experimental-image-generation-support' ) );
		$this->assertFalse( Jetpack_Gutenberg::is_available( 'ai-general-purpose-image-generator' ) );
		$this->assertFalse( Jetpack_Gutenberg::is_available( 'ai-assistant-site-logo-support' ) );
		$this->assertFalse( Jetpack_Gutenberg::is_available( 'ai-assistant-image-extension' ) );
	}
}
