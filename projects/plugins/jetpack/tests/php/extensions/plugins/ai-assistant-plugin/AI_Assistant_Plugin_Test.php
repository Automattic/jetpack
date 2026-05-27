<?php
/**
 * AI Assistant plugin tests.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Extensions\AiAssistantPlugin;

require_once JETPACK__PLUGIN_DIR . '/extensions/plugins/ai-assistant-plugin/ai-assistant-plugin.php';

/**
 * Tests for the AI Assistant plugin bootstrap functions.
 */
class AI_Assistant_Plugin_Test extends WP_UnitTestCase {
	use Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Tear down after each test.
	 */
	public function tear_down() {
		unregister_setting( 'general', 'jetpack_ai_agents_enabled' );
		Constants::clear_single_constant( 'IS_WPCOM' );

		parent::tear_down();
	}

	/**
	 * Test that the AI Agent Access setting is exposed as a REST-writable boolean.
	 */
	public function test_register_ai_agents_setting_registers_rest_boolean_option() {
		global $wp_registered_settings;

		AiAssistantPlugin\register_ai_agents_setting();

		$this->assertArrayHasKey( 'jetpack_ai_agents_enabled', $wp_registered_settings );

		$setting = $wp_registered_settings['jetpack_ai_agents_enabled'];

		$this->assertSame( 'boolean', $setting['type'] );
		$this->assertSame( 'Whether AI Agent Access is enabled on this site.', $setting['description'] );
		$this->assertSame( 'rest_sanitize_boolean', $setting['sanitize_callback'] );
		$this->assertTrue( $setting['show_in_rest'] );
		$this->assertFalse( $setting['default'] );
	}

	/**
	 * Test that WPCOM Simple uses the dedicated wpcom/v2 endpoint instead of core settings.
	 */
	public function test_register_ai_agents_setting_hides_rest_option_on_wpcom_simple() {
		global $wp_registered_settings;

		Constants::set_constant( 'IS_WPCOM', true );

		AiAssistantPlugin\register_ai_agents_setting();

		$this->assertArrayHasKey( 'jetpack_ai_agents_enabled', $wp_registered_settings );
		$this->assertFalse( $wp_registered_settings['jetpack_ai_agents_enabled']['show_in_rest'] );
	}

	/**
	 * Test that the AI Agent Access setting is registered on init.
	 */
	public function test_register_ai_agents_setting_is_hooked_to_init() {
		$this->assertSame(
			10,
			has_action( 'init', 'Automattic\Jetpack\Extensions\AiAssistantPlugin\register_ai_agents_setting' )
		);
	}

	/**
	 * Test that the AI Agent Access setting is added to the Sync options whitelist.
	 */
	public function test_add_ai_agents_sync_options_whitelist_adds_option() {
		$this->assertSame(
			array( 'existing_option', 'jetpack_ai_agents_enabled' ),
			AiAssistantPlugin\add_ai_agents_sync_options_whitelist( array( 'existing_option' ) )
		);
	}

	/**
	 * Test that the AI Agent Access Sync whitelist entry is not duplicated.
	 */
	public function test_add_ai_agents_sync_options_whitelist_deduplicates_option() {
		$this->assertSame(
			array( 'jetpack_ai_agents_enabled', 'existing_option' ),
			AiAssistantPlugin\add_ai_agents_sync_options_whitelist(
				array( 'jetpack_ai_agents_enabled', 'existing_option' )
			)
		);
	}
}
