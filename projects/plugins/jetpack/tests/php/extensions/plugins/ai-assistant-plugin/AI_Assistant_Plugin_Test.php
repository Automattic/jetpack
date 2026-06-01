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
		remove_all_filters( 'jetpack_gutenberg' );
		remove_all_filters( 'jetpack_offline_mode' );
		remove_all_filters( 'jetpack_ai_enabled' );
		delete_option( 'jetpack_offline_mode' );
		\Automattic\Jetpack\Status\Cache::clear();
		\Jetpack_Options::delete_option( 'master_user' );
		\Jetpack_Options::delete_option( 'user_tokens' );
		( new \Automattic\Jetpack\Connection\Manager( 'jetpack' ) )->reset_connection_status();

		parent::tear_down();
	}

	/**
	 * Simulate a connected Jetpack owner so register_plugin's gate passes.
	 */
	private function simulate_connected_owner(): void {
		$user_id = self::factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user_id );
		\Jetpack_Options::update_option( 'master_user', $user_id );
		\Jetpack_Options::update_option( 'user_tokens', array( $user_id => 'token.secret.' . $user_id ) );
		( new \Automattic\Jetpack\Connection\Manager( 'jetpack' ) )->reset_connection_status();
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
	 * The ai-assistant-plugin extension is NOT registered as available when Big Sky is active.
	 *
	 * Big Sky owns the AI sidebar surface; the legacy AiAssistantPluginSidebar
	 * PluginSidebar must not also be exposed in the editor.
	 */
	public function test_extension_unavailable_when_big_sky_active() {
		if ( ! class_exists( 'Big_Sky' ) ) {
			// phpcs:ignore Squiz.PHP.Eval.Discouraged,MediaWiki.Usage.ForbiddenFunctions.eval -- minimal stub for unit test isolation.
			eval( 'class Big_Sky {}' );
		}

		// Simulate a posture where register_plugin would otherwise mark the
		// extension available — connected owner, blocks enabled.
		$this->simulate_connected_owner();
		add_filter( 'jetpack_gutenberg', '__return_true' );
		\Automattic\Jetpack\Status\Cache::clear();

		\Jetpack_Gutenberg::reset();
		AiAssistantPlugin\register_plugin();

		$this->assertFalse(
			\Jetpack_Gutenberg::is_available( AiAssistantPlugin\FEATURE_NAME ),
			'Legacy AI Assistant Plugin must not be available when Big Sky is active.'
		);
	}

	/**
	 * The ai-assistant-plugin extension is registered as available when Big Sky is NOT active.
	 *
	 * Guards against accidentally suppressing the legacy plugin when Big Sky is absent.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[\PHPUnit\Framework\Attributes\RunInSeparateProcess]
	#[\PHPUnit\Framework\Attributes\PreserveGlobalState( false )]
	public function test_extension_available_when_big_sky_inactive() {
		// Required because @runInSeparateProcess spawns a fresh PHP without the
		// bootstrap that includes this file in the parent process.
		require_once JETPACK__PLUGIN_DIR . '/extensions/plugins/ai-assistant-plugin/ai-assistant-plugin.php';

		$this->simulate_connected_owner();
		add_filter( 'jetpack_gutenberg', '__return_true' );
		\Automattic\Jetpack\Status\Cache::clear();

		\Jetpack_Gutenberg::reset();
		AiAssistantPlugin\register_plugin();

		$this->assertTrue(
			\Jetpack_Gutenberg::is_available( AiAssistantPlugin\FEATURE_NAME ),
			'Legacy AI Assistant Plugin must remain available when Big Sky is absent.'
		);
	}
}
