<?php
/**
 * Tests for the AI Assistant banner's WordPress Agent and cached MCP checks.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Jetpack_Mu_Wpcom;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;

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
		delete_transient( 'wpcom_ai_banner_mcp_' . get_current_blog_id() . '_' . get_current_user_id() );
		Constants::clear_constants();
		delete_option( 'big_sky_enable' );
		parent::tear_down();
	}

	/**
	 * Atomic sites keep the banner hidden until the localized MCP check when the Agent is on.
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
	 * The cached MCP result preserves all three banner states without another API call.
	 *
	 * @runInSeparateProcess
	 */
	#[RunInSeparateProcess]
	public function test_cached_mcp_result() {
		define( 'IS_WPCOM', true );
		$cache_key = 'wpcom_ai_banner_mcp_' . get_current_blog_id() . '_' . get_current_user_id();

		set_transient( $cache_key, 'on', 5 * MINUTE_IN_SECONDS );
		$this->assertTrue( wpcom_ai_assistant_banner_mcp_enabled() );

		set_transient( $cache_key, 'off', 5 * MINUTE_IN_SECONDS );
		$this->assertFalse( wpcom_ai_assistant_banner_mcp_enabled() );

		set_transient( $cache_key, 'unavailable', 5 * MINUTE_IN_SECONDS );
		$this->assertNull( wpcom_ai_assistant_banner_mcp_enabled() );
	}

	/**
	 * The script gets MCP state only when the WordPress Agent is on.
	 *
	 * @runInSeparateProcess
	 */
	#[RunInSeparateProcess]
	public function test_script_data_carries_cached_mcp_state() {
		define( 'IS_ATOMIC', true );
		$cache_key = 'wpcom_ai_banner_mcp_' . get_current_blog_id() . '_' . get_current_user_id();
		set_transient( $cache_key, 'off', 5 * MINUTE_IN_SECONDS );
		update_option( 'big_sky_enable', '1' );

		$data = wpcom_ai_assistant_banner_script_data( 'dashboard' );
		$this->assertSame( wpcom_ai_assistant_banner_tracks_props( 'dashboard' ), $data['trackProps'] );
		$this->assertSame( 'off', $data['mcpState'] );

		update_option( 'big_sky_enable', '0' );
		$this->assertSame( 'unavailable', wpcom_ai_assistant_banner_script_data( 'dashboard' )['mcpState'] );
	}
}
