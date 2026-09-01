<?php
/**
 * Jetpack AI settings hotfix test file.
 *
 * @package automattic/jetpack-mu-wpcom-plugin
 */

use PHPUnit\Framework\TestCase;

require_once __DIR__ . '/../../mu-wpcom-plugin.php';

/**
 * Test the temporary Jetpack AI settings hotfix.
 */
class JetpackAISettingsHotfixTest extends TestCase {
	/**
	 * Test that Jetpack AI settings are excluded from General Settings saves.
	 */
	public function test_jetpack_ai_settings_are_excluded_from_general_options() {
		$allowed_options = array(
			'general'    => array(
				'blogname',
				'jetpack_ai_enabled',
				'jetpack_ai_writing_assistant_enabled',
				'jetpack_ai_image_editor_enabled',
				'jetpack_ai_feature_clip_enabled',
				'jetpack_ai_seo_enabled',
			),
			'discussion' => array( 'default_ping_status' ),
		);

		$this->assertSame(
			array(
				'general'    => array( 'blogname' ),
				'discussion' => array( 'default_ping_status' ),
			),
			jetpack_mu_wpcom_exclude_jetpack_ai_settings_from_general_options( $allowed_options )
		);
	}
}
