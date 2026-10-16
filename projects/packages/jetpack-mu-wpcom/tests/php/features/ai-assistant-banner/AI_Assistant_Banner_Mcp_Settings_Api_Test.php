<?php
/**
 * Tests for the endpoint the AI Assistant banner reads to check MCP access.
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
 * Test class for the AI Assistant banner MCP settings endpoint.
 */
class AI_Assistant_Banner_Mcp_Settings_Api_Test extends \WorDBless\BaseTestCase {

	/**
	 * Tear down.
	 */
	public function tear_down() {
		Constants::clear_constants();
		parent::tear_down();
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
}
