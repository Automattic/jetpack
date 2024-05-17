<?php
/**
 * Staging Sites Test file.
 *
 * @package wpcomsh
 */

/**
 * Class StagingSitesTest.
 */
class StagingSitesTest extends WP_UnitTestCase {

	/**
	 * Ensure that the filter returns default value
	 *
	 * @return void
	 */
	public function test_wpcomsh_disable_jetpack_staging_mode_default() {
		$this->assertFalse( apply_filters( 'jetpack_is_staging_site', false ) );
		$this->assertTrue( apply_filters( 'jetpack_is_staging_site', true ) );
	}

	/**
	 * Ensure that the filter always returns false when the site is a staging site.
	 *
	 * @return void
	 */
	public function test_wpcomsh_disable_jetpack_staging_mode_always_false_staging_site() {
		add_option( WPCOM_IS_STAGING_SITE_OPTION_NAME, 1 );
		$this->assertFalse( apply_filters( 'jetpack_is_staging_site', false ) );
		$this->assertFalse( apply_filters( 'jetpack_is_staging_site', true ) );
	}
}
