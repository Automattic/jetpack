<?php
/**
 * Publicize utility tests.
 *
 * @package automattic/jetpack-publicize
 */

namespace Automattic\Jetpack\Publicize;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;

/**
 * @covers \Automattic\Jetpack\Publicize\Publicize_Utils
 */
#[CoversClass( Publicize_Utils::class )]
class Publicize_Utils_Test extends BaseTestCase {

	/**
	 * Forget the screen between tests.
	 */
	public function tear_down() {
		unset( $GLOBALS['current_screen'] );
		parent::tear_down();
	}

	/**
	 * Tests which screens count as Jetpack Settings.
	 *
	 * @dataProvider provide_screens
	 *
	 * @param string $screen_id Screen ID.
	 * @param bool   $expected  Whether it is Jetpack Settings.
	 */
	#[DataProvider( 'provide_screens' )]
	public function test_is_jetpack_settings_page( $screen_id, $expected ) {
		set_current_screen( $screen_id );

		$this->assertSame( $expected, Publicize_Utils::is_jetpack_settings_page() );
	}

	/**
	 * Screens and whether they are Jetpack Settings.
	 *
	 * @return array
	 */
	public static function provide_screens() {
		return array(
			'own page'             => array( 'jetpack_page_jetpack-settings', true ),
			'older Jetpack'        => array( 'toplevel_page_jetpack', true ),
			'network settings'     => array( 'jetpack_page_jetpack-settings-network', false ),
			'social settings page' => array( 'jetpack_page_jetpack-social', false ),
		);
	}
}
