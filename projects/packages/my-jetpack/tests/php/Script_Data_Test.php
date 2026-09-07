<?php
/**
 * Tests for My Jetpack script data.
 *
 * @package automattic/my-jetpack
 */

namespace Automattic\Jetpack\My_Jetpack;

use PHPUnit\Framework\TestCase;

/**
 * Tests the My Jetpack addition to the unified script data object.
 */
class Script_Data_Test extends TestCase {

	/**
	 * Site Editor data is added without replacing existing script data.
	 */
	public function test_adds_site_editor_data() {
		$data = Initializer::add_script_data( array( 'existing' => 'value' ) );

		$this->assertSame( 'value', $data['existing'] );
		$this->assertIsBool( $data['myJetpack']['siteEditor']['isBlockTheme'] );
		$this->assertIsBool( $data['myJetpack']['siteEditor']['isSharingBlockAvailable'] );
		$this->assertSame( get_stylesheet(), $data['myJetpack']['siteEditor']['activeThemeStylesheet'] );
	}
}
