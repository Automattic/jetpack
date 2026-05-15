<?php
/**
 * AI Assistant plugin tests.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Extensions\AiAssistantPlugin;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;

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
		unset( $_SERVER['A8C_PROXIED_REQUEST'] );
		Constants::clear_single_constant( 'A8C_PROXIED_REQUEST' );
		Constants::clear_single_constant( 'AT_PROXIED_REQUEST' );
		Constants::clear_single_constant( 'ATOMIC_CLIENT_ID' );
		Constants::clear_single_constant( 'IS_WPCOM' );
		unset( $GLOBALS['jetpack_test_is_automattician'], $GLOBALS['jetpack_test_wpcom_is_proxied_request'] );

		parent::tear_down();
	}

	/**
	 * Test that the AI Agent Access setting is not exposed outside proxied rollout contexts.
	 */
	public function test_register_ai_agents_setting_does_not_register_outside_proxied_requests() {
		global $wp_registered_settings;

		AiAssistantPlugin\register_ai_agents_setting();

		$this->assertArrayNotHasKey( 'jetpack_ai_agents_enabled', $wp_registered_settings );
	}

	/**
	 * Test that the AI Agent Access setting is exposed as a REST-writable boolean on proxied non-WPCOM Simple requests.
	 */
	public function test_register_ai_agents_setting_registers_rest_boolean_option_on_proxied_requests() {
		global $wp_registered_settings;

		$_SERVER['A8C_PROXIED_REQUEST'] = '1';

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

		$_SERVER['A8C_PROXIED_REQUEST'] = '1';
		Constants::set_constant( 'IS_WPCOM', true );

		AiAssistantPlugin\register_ai_agents_setting();

		$this->assertArrayHasKey( 'jetpack_ai_agents_enabled', $wp_registered_settings );
		$this->assertFalse( $wp_registered_settings['jetpack_ai_agents_enabled']['show_in_rest'] );
	}

	/**
	 * Test that the AI Agent Access proxy check accepts the A8C proxy constant.
	 */
	public function test_is_proxied_request_accepts_a8c_proxy_constant() {
		Constants::set_constant( 'A8C_PROXIED_REQUEST', true );

		$this->assertTrue( AiAssistantPlugin\is_proxied_request() );
	}

	/**
	 * Test that the AI Agent Access proxy check rejects non-proxied Automattician requests.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_is_proxied_request_rejects_non_proxied_automattician() {
		require_once __DIR__ . '/proxy-test-functions.php';

		if ( empty( $GLOBALS['jetpack_test_controls_is_automattician'] ) ) {
			$this->markTestSkipped( 'The is_automattician() helper is already defined.' );
		}

		$GLOBALS['jetpack_test_is_automattician'] = true;

		$this->assertFalse( AiAssistantPlugin\is_proxied_request() );
	}

	/**
	 * Test that the AI Agent Access proxy check accepts the WPCOM proxied request helper.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_is_proxied_request_accepts_wpcom_proxy_helper() {
		require_once __DIR__ . '/proxy-test-functions.php';

		if ( empty( $GLOBALS['jetpack_test_controls_wpcom_is_proxied_request'] ) ) {
			$this->markTestSkipped( 'The wpcom_is_proxied_request() helper is already defined.' );
		}

		$GLOBALS['jetpack_test_wpcom_is_proxied_request'] = true;

		$this->assertTrue( AiAssistantPlugin\is_proxied_request() );
	}

	/**
	 * Test that the AI Agent Access proxy check accepts allowed Atomic proxy clients.
	 */
	public function test_is_proxied_request_accepts_allowed_atomic_proxy_client() {
		Constants::set_constant( 'AT_PROXIED_REQUEST', true );
		Constants::set_constant( 'ATOMIC_CLIENT_ID', 1 );

		$this->assertTrue( AiAssistantPlugin\is_proxied_request() );
	}

	/**
	 * Test that the AI Agent Access proxy check rejects unknown Atomic proxy clients.
	 */
	public function test_is_proxied_request_rejects_unknown_atomic_proxy_client() {
		Constants::set_constant( 'AT_PROXIED_REQUEST', true );
		Constants::set_constant( 'ATOMIC_CLIENT_ID', 999 );

		$this->assertFalse( AiAssistantPlugin\is_proxied_request() );
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
