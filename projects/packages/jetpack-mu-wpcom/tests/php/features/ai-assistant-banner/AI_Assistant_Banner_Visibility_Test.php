<?php
/**
 * Tests for what decides whether the AI Assistant banner shows: the WordPress Agent
 * check, and the endpoint its script reads to check MCP access.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Jetpack_Mu_Wpcom;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
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

	/**
	 * An option saved as 0 suppresses the banner only while the platform Agent is on.
	 *
	 * @dataProvider provide_opt_out_states
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 *
	 * @param bool        $is_simple   Whether the site is Simple.
	 * @param string|null $option      The saved big_sky_enable value, or null if never saved.
	 * @param bool        $platform_on Simple: big_sky_is_enabled(). Atomic: whether the Big Sky plugin is active.
	 * @param bool        $expected    Expected result.
	 */
	#[DataProvider( 'provide_opt_out_states' )]
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_option_off_only_suppresses_banner_when_platform_agent_is_on( $is_simple, $option, $platform_on, $expected ) {
		\Brain\Monkey\setUp();
		if ( $is_simple ) {
			\Brain\Monkey\Functions\when( 'big_sky_is_enabled' )->justReturn( $platform_on );
		} elseif ( $platform_on ) {
			class_alias( self::class, 'Big_Sky' );
		}
		if ( null !== $option ) {
			update_option( 'big_sky_enable', $option );
		}

		$this->assertSame( $expected, wpcom_is_wordpress_agent_option_disabled() && wpcom_is_wordpress_agent_platform_enabled() );
		\Brain\Monkey\tearDown();
	}

	/**
	 * Data provider for test_option_off_only_suppresses_banner_when_platform_agent_is_on.
	 *
	 * @return array
	 */
	public static function provide_opt_out_states() {
		return array(
			'Simple, unchecked'          => array( true, '0', true, true ),
			'Simple, never saved'        => array( true, null, true, false ),
			'Simple, Agent off'          => array( true, '0', false, false ),
			'Atomic, unchecked'          => array( false, '0', true, true ),
			'Atomic, Agent switched off' => array( false, '0', false, false ),
		);
	}
}
