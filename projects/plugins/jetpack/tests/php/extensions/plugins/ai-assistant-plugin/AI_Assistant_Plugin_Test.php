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
	use \Activates_Ai_Module;

	/**
	 * Set up before each test.
	 */
	public function set_up() {
		parent::set_up();
		// The AI controls only take effect on internal testing environments while
		// they are unlaunched. These tests are about what the toggles do, so put
		// the suite where they apply; the scoping itself is pinned in
		// Jetpack_AI_Settings_Test.
		$this->force_master_enforcement_for_test();
		// Off-Simple the `ai` module is the AI master switch; activate it so the
		// legacy panel's jetpack_ai_enabled gate reads on.
		$this->activate_ai_module_for_test();
	}

	/**
	 * Tear down after each test.
	 */
	public function tear_down() {
		unset( $_SERVER['A8C_PROXIED_REQUEST'] );
		$this->deactivate_ai_module_for_test();
		unset( $_SERVER['A8C_PROXIED_REQUEST'] );
		Constants::clear_single_constant( 'IS_WPCOM' );

		remove_filter( 'jetpack_ai_enabled', '__return_false' );
		delete_option( 'jetpack_ai_writing_assistant_enabled' );
		delete_option( 'jetpack_ai_enabled' );
		( new \Automattic\Jetpack\Connection\Manager( 'jetpack' ) )->reset_connection_status();
		\Jetpack_Options::delete_option( array( 'id', 'blog_token' ) );

		parent::tear_down();
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
		// Off-Simple the master is the `ai` module; turn it off there.
		$this->force_master_enforcement_for_test();
		$this->deactivate_ai_module_for_test();

		AiAssistantPlugin\register_plugin();

		$this->assertFalse( \Jetpack_Gutenberg::is_available( AiAssistantPlugin\FEATURE_NAME ) );
	}

	/**
	 * The writing toggle hides the writing sections inside the panel, not the
	 * panel itself: it still carries the image generator, the usage meter and
	 * the upgrade prompt.
	 */
	public function test_registered_when_writing_toggle_off() {
		$this->reset_availability();
		$this->simulate_connected_owner();
		update_option( 'jetpack_ai_writing_assistant_enabled', 0 );

		AiAssistantPlugin\register_plugin();

		$this->assertTrue( \Jetpack_Gutenberg::is_available( AiAssistantPlugin\FEATURE_NAME ) );
	}
}
