<?php
/**
 * Tests for the ai module's header file and its generated registry entries.
 *
 * Deliberately carries no covers metadata: the module file has no class or
 * function to point an attribute at, and the generated module-headings
 * registries cache their arrays behind statics — a covers-restricted test
 * that triggers the first call would execute those lines without crediting
 * them, hiding them from coverage for the whole run.
 *
 * @package automattic/jetpack
 */

/**
 * Class Jetpack_AI_Module_Header_Test
 */
class Jetpack_AI_Module_Header_Test extends \WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * The ai module is a toggle-only header file: loading it produces no output
	 * and defines nothing, and the generated module registries carry its header.
	 */
	public function test_ai_module_is_a_toggle_only_header() {
		ob_start();
		require JETPACK__PLUGIN_DIR . 'modules/ai.php';
		$this->assertSame( '', ob_get_clean() );

		$i18n = jetpack_get_module_i18n( 'ai' );
		$this->assertIsArray( $i18n );
		$this->assertSame( 'AI', $i18n['name'] );

		$info = jetpack_get_module_info( 'ai' );
		$this->assertIsArray( $info );
		$this->assertSame( 'Yes', $info['auto_activate'] );
		$this->assertSame( 'Yes', $info['requires_connection'] );
		$this->assertSame( 'Yes', $info['requires_user_connection'] );
	}
}
