<?php
/**
 * Hide Non-Breaking Space Markers Tests
 *
 * @package automattic/jetpack-mu-wpcom
 */

declare( strict_types = 1 );

use Automattic\Jetpack\Jetpack_Mu_Wpcom;

require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/hide-non-breaking-space-markers/hide-non-breaking-space-markers.php';

class Hide_Non_Breaking_Space_Markers_Test extends \WorDBless\BaseTestCase {
	const HANDLE = 'wpcom-hide-non-breaking-space-markers';

	public function tear_down() {
		wp_dequeue_style( self::HANDLE );
		wp_deregister_style( self::HANDLE );
		unset( $GLOBALS['wpcom_site_stickers_test_value'], $GLOBALS['current_screen'] );
		parent::tear_down();
	}

	public function test_style_is_added_only_with_the_sticker(): void {
		set_current_screen( 'post' );

		wpcom_hide_non_breaking_space_markers();
		$this->assertFalse( wp_style_is( self::HANDLE ) );

		$GLOBALS['wpcom_site_stickers_test_value'] = array( 'hide-non-breaking-space-markers' );
		wpcom_hide_non_breaking_space_markers();
		$this->assertTrue( wp_style_is( self::HANDLE ) );
	}
}
