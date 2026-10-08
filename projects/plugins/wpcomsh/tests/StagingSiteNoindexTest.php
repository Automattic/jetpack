<?php
/**
 * Staging Site Noindex Test file.
 *
 * @package wpcomsh
 */

/**
 * Class StagingSiteNoindexTest.
 */
class StagingSiteNoindexTest extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Staging sites are noindexed even when blog_public is 1.
	 */
	public function test_staging_site_is_noindexed_when_public() {
		add_filter( 'wpcomsh_is_staging_environment', '__return_true' );
		update_option( 'blog_public', '1' );

		$headers = apply_filters( 'wp_headers', array() );
		$this->assertSame( 'noindex, nofollow', $headers['X-Robots-Tag'] );

		$robots = apply_filters(
			'wp_robots',
			array(
				'index'             => true,
				'follow'            => true,
				'max-image-preview' => 'large',
			)
		);
		$this->assertArrayNotHasKey( 'index', $robots );
		$this->assertArrayNotHasKey( 'follow', $robots );
		$this->assertTrue( $robots['noindex'] );
		$this->assertTrue( $robots['nofollow'] );
		$this->assertSame( 'large', $robots['max-image-preview'] );
	}

	/**
	 * Production sites are left alone.
	 */
	public function test_production_site_is_untouched() {
		add_filter( 'wpcomsh_is_staging_environment', '__return_false' );

		$this->assertSame( array(), wpcomsh_add_staging_site_robots_header( array() ) );

		$robots = array(
			'index'  => true,
			'follow' => true,
		);
		$this->assertSame( $robots, wpcomsh_add_staging_site_robots_directives( $robots ) );
	}
}
