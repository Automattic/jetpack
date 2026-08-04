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

		remove_filter( 'jetpack_ai_enabled', '__return_false' );
		delete_option( 'jetpack_ai_writing_assistant_enabled' );
		delete_option( 'jetpack_ai_enabled' );
		( new \Automattic\Jetpack\Connection\Manager( 'jetpack' ) )->reset_connection_status();
		\Jetpack_Options::delete_option( array( 'id', 'blog_token' ) );

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

	/**
	 * Reset Jetpack Gutenberg extension availability.
	 */
	private function reset_availability() {
		$reflection = new ReflectionClass( 'Jetpack_Gutenberg' );
		$property   = $reflection->getProperty( 'availability' );
		@$property->setAccessible( true ); // @codingStandardsIgnoreLine — needed for PHP < 8.1, suppressed for PHP 8.5+ deprecation.
		$property->setValue( null, array() );
	}

	/**
	 * Simulate a connected Jetpack owner so the connection gate passes.
	 */
	private function simulate_connected_owner() {
		$user_id = self::factory()->user->create( array( 'role' => 'administrator' ) );
		\Jetpack_Options::update_option( 'master_user', $user_id );
		\Jetpack_Options::update_option( 'user_tokens', array( $user_id => 'token.secret.' . $user_id ) );
		( new \Automattic\Jetpack\Connection\Manager( 'jetpack' ) )->reset_connection_status();
	}

	/**
	 * Registered on a connected site with default settings.
	 */
	public function test_registers_when_connected_and_enabled() {
		$this->reset_availability();
		$this->simulate_connected_owner();

		AiAssistantPlugin\register_plugin();

		$this->assertTrue( \Jetpack_Gutenberg::is_available( AiAssistantPlugin\FEATURE_NAME ) );
	}

	/**
	 * The jetpack_ai_enabled master filter turns the legacy panel off.
	 */
	public function test_not_registered_when_ai_disabled() {
		$this->reset_availability();
		$this->simulate_connected_owner();
		add_filter( 'jetpack_ai_enabled', '__return_false' );

		AiAssistantPlugin\register_plugin();

		$this->assertFalse( \Jetpack_Gutenberg::is_available( AiAssistantPlugin\FEATURE_NAME ) );
	}

	/**
	 * The AI master switch option turns the legacy panel off.
	 */
	public function test_not_registered_when_master_option_off() {
		$this->reset_availability();
		$this->simulate_connected_owner();
		update_option( 'jetpack_ai_enabled', 0 );

		AiAssistantPlugin\register_plugin();

		$this->assertFalse( \Jetpack_Gutenberg::is_available( AiAssistantPlugin\FEATURE_NAME ) );
	}

	/**
	 * The writing toggle from the AI settings page turns the legacy panel off.
	 */
	public function test_not_registered_when_writing_toggle_off() {
		$this->reset_availability();
		$this->simulate_connected_owner();
		update_option( 'jetpack_ai_writing_assistant_enabled', 0 );

		AiAssistantPlugin\register_plugin();

		$this->assertFalse( \Jetpack_Gutenberg::is_available( AiAssistantPlugin\FEATURE_NAME ) );
	}
}
