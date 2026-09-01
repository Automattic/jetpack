<?php
/**
 * Tests for Jetpack AI settings protection.
 *
 * @package automattic/jetpack-mu-wpcom
 */

namespace Automattic\Jetpack\Jetpack_Mu_Wpcom\Jetpack_AI_Settings;

use Automattic\Jetpack\Jetpack_Mu_Wpcom;

require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/jetpack-ai-settings/jetpack-ai-settings.php';

/**
 * Tests for Jetpack AI settings protection.
 */
class Jetpack_AI_Settings_Test extends \WorDBless\BaseTestCase {
	/**
	 * The filter removes only Jetpack AI options from General Settings.
	 */
	public function test_excludes_jetpack_ai_options_from_general_settings() {
		$this->assertSame( 20, \has_filter( 'allowed_options', __NAMESPACE__ . '\\exclude_from_general_options' ) );

		$allowed_options = array(
			'general'    => array(
				'blogname',
				'jetpack_ai_enabled',
				'jetpack_ai_writing_assistant_enabled',
				'jetpack_ai_image_editor_enabled',
				'jetpack_ai_feature_clip_enabled',
				'jetpack_ai_seo_enabled',
				'jetpack_ai_future_option',
			),
			'discussion' => array( 'default_ping_status' ),
		);

		$this->assertSame(
			array(
				'general'    => array( 'blogname', 'jetpack_ai_future_option' ),
				'discussion' => array( 'default_ping_status' ),
			),
			exclude_from_general_options( $allowed_options )
		);
	}
}
