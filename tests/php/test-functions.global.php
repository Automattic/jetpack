<?php
/**
 * Class WP_Test_Jetpack_Global_Functions file.
 *
 * @package Jetpack
 */

/**
 * Class WP_Test_Jetpack_Global_Functions
 */
class WP_Test_Jetpack_Global_Functions extends WP_UnitTestCase {
	/**
	 * Tests for jetpack_get_site_suffix().
	 *
	 * @covers jetpack_get_site_suffix
	 */
	public function test_jetpack_get_site_suffix() {
		$suffix = jetpack_get_site_suffix();
		$this->assertSame( 'example.org', $suffix );

		// TLD.
		$suffix = jetpack_get_site_suffix( 'https://dortmund.com' );
		$this->assertSame( 'dortmund.com', $suffix );

		// Subdomain.
		$suffix = jetpack_get_site_suffix( 'https://borussia.dortmund.com' );
		$this->assertSame( 'borussia.dortmund.com', $suffix );

		// Subfolder.
		$suffix = jetpack_get_site_suffix( 'https://dortmund.com/borussia' );
		$this->assertSame( 'dortmund.com::borussia', $suffix );
	}
}
