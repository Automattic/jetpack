<?php
/**
 * Update tests.
 *
 * @package automattic/jetpack-waf
 */

use Automattic\Jetpack\Waf\Waf_Initializer;

if ( ! class_exists( 'WP_Upgrader' ) ) {
	require_once ABSPATH . 'wp-admin/includes/class-wp-upgrader.php';
}

/**
 * Integration tests for the firewall update process.
 */
final class WafUpdateTest extends WorDBless\BaseTestCase {

	/**
	 * This test ensures that when the update function is called with empty fields,
	 * it does not emit warnings or update the option indicating an update is needed.
	 */
	public function test_update_waf_after_plugin_upgrade_does_not_emit_warnings_or_update_option_when_fields_are_empty() {
		// WorDBless apparently has an issue with me storing false, so I'll just use a string instead to make sure this works and the option is not updated.
		$broken_value = 'something-broken';
		update_option( Waf_Initializer::NEEDS_UPDATE_OPTION_NAME, $broken_value );

		Waf_Initializer::update_waf_after_plugin_upgrade( $this->createStub( 'WP_Upgrader' ), array() );
		$this->assertSame( $broken_value, get_option( Waf_Initializer::NEEDS_UPDATE_OPTION_NAME, null ), 'The update need option should still be the broken value.' );
	}
}
