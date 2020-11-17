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
		$suffix = jetpack_get_site_suffix( 'https://example.org' );
		$this->assertSame( 'example.org', $suffix );

		// Subdomain.
		$suffix = jetpack_get_site_suffix( 'https://borussia.dortmund.example.org' );
		$this->assertSame( 'borussia.dortmund.example.org', $suffix );

		// Subfolder.
		$suffix = jetpack_get_site_suffix( 'https://example.org/borussia-dortmund' );
		$this->assertSame( 'example.org::borussia-dortmund', $suffix );
	}
}
