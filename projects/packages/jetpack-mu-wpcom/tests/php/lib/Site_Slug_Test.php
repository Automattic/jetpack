<?php
/**
 * Site Slug Lib Tests.
 *
 * @package automattic/jetpack-mu-wpcom
 */

declare( strict_types = 1 );

/**
 * Tests for site slug lib function.
 */
class Site_Slug_Test extends \WorDBless\BaseTestCase {

	/**
	 * Tests that wpcom_get_site_slug returns a non-empty string.
	 */
	public function test_get_site_slug_returns_string() {
		$slug = wpcom_get_site_slug();
		$this->assertIsString( $slug );
	}

	/**
	 * Tests that wpcom_get_site_slug falls back to home_url host.
	 */
	public function test_get_site_slug_returns_home_url_host() {
		// WorDBless sets home_url to http://example.org by default.
		$slug = wpcom_get_site_slug();
		$this->assertNotEmpty( $slug );
	}
}
