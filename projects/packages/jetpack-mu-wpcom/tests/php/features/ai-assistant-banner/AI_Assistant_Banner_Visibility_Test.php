<?php
/**
 * Tests for what decides whether the AI Assistant banner shows: the WordPress Agent
 * check, and the endpoint its script reads to check MCP access.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Jetpack_Mu_Wpcom;

//phpcs:ignore WordPressVIPMinimum.Files.IncludingFile.NotAbsolutePath
require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/ai-launchpad/helpers.php';
//phpcs:ignore WordPressVIPMinimum.Files.IncludingFile.NotAbsolutePath
require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/expiry-notices/expiry-notices.php';
//phpcs:ignore WordPressVIPMinimum.Files.IncludingFile.NotAbsolutePath
require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/ai-assistant-banner/ai-assistant-banner.php';

/**
 * Test class for the AI Assistant banner visibility helpers.
 */
class AI_Assistant_Banner_Visibility_Test extends \WorDBless\BaseTestCase {

	/**
	 * Tear down.
	 */
	public function tear_down() {
		Constants::clear_constants();
		delete_option( 'big_sky_enable' );
		parent::tear_down();
	}

	/**
	 * Atomic sites keep the banner hidden until the MCP check when the Agent is on.
	 */
	public function test_atomic_banner_starts_hidden_when_agent_is_enabled() {
		update_option( 'big_sky_enable', '1' );

		ob_start();
		wpcom_render_ai_assistant_banner();
		$markup = ob_get_clean();

		$this->assertStringContainsString( 'id="wpcom-ai-assistant-banner"', $markup );
		$this->assertMatchesRegularExpression( '/id="wpcom-ai-assistant-banner"[^>]* hidden>/', $markup );
	}

	/**
	 * Simple sites read the native WordPress.com endpoint for the current site.
	 */
	public function test_simple_sites_use_the_native_endpoint() {
		Constants::set_constant( 'IS_WPCOM', true );

		$this->assertSame(
			array(
				'path'   => '/wpcom/v2/sites/' . get_current_blog_id() . '/mcp-abilities',
				'format' => 'wpcom',
			),
			wpcom_ai_assistant_banner_mcp_settings_api()
		);
	}

	/**
	 * Atomic sites read Jetpack's proxy of the same endpoint.
	 */
	public function test_atomic_sites_use_the_jetpack_proxy() {
		Constants::set_constant( 'IS_WPCOM', false );

		$this->assertSame(
			array(
				'path'   => '/wpcom/v2/jetpack-ai/mcp-settings',
				'format' => 'jetpack',
			),
			wpcom_ai_assistant_banner_mcp_settings_api()
		);
	}

	/**
	 * The script gets the Tracks props and the MCP endpoint together.
	 */
	public function test_script_data_carries_track_props_and_mcp_endpoint() {
		Constants::set_constant( 'IS_WPCOM', false );

		$data = wpcom_ai_assistant_banner_script_data( 'dashboard' );

		$this->assertSame( wpcom_ai_assistant_banner_tracks_props( 'dashboard' ), $data['trackProps'] );
		$this->assertSame( wpcom_ai_assistant_banner_mcp_settings_api(), $data['mcpSettingsApi'] );
	}
}
