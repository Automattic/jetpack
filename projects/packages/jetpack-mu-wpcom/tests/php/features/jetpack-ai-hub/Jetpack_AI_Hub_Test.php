<?php
/**
 * Tests for the WordPress.com Simple Jetpack AI Hub integration.
 *
 * @package automattic/jetpack-mu-wpcom
 */

namespace Automattic\Jetpack\Jetpack_Mu_Wpcom\Jetpack_AI_Hub;

use WorDBless\BaseTestCase;

require_once __DIR__ . '/../../../../src/features/jetpack-ai-hub/jetpack-ai-hub.php';

/**
 * Tests the Simple-specific Hub settings.
 */
class Jetpack_AI_Hub_Test extends BaseTestCase {
	/**
	 * Scheduled tasks are enabled with the Hub on WordPress.com Simple.
	 */
	public function test_enables_scheduled_tasks() {
		// phpcs:ignore WordPress.NamingConventions.ValidHookName.UseUnderscores -- the hook suffix is the registered feature flag name.
		$this->assertTrue( apply_filters( 'jetpack_feature_flag_enabled_ai-hub-scheduled-tasks', false ) );
	}

	/**
	 * The integration uses the native site-scoped WordPress.com MCP endpoint.
	 */
	public function test_configures_native_wpcom_mcp_api() {
		$config = configure(
			array(
				'showGatedViews'  => true,
				'isUserConnected' => false,
				'mcpSettingsApi'  => array(),
			)
		);

		$this->assertFalse( $config['showGatedViews'] );
		$this->assertTrue( $config['isUserConnected'] );
		$this->assertSame(
			array(
				'path'   => '/wpcom/v2/sites/' . get_current_blog_id() . '/mcp-abilities',
				'format' => 'wpcom',
			),
			$config['mcpSettingsApi']
		);
	}
}
