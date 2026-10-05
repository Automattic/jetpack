<?php
/**
 * Staging Site Noindex Test file.
 *
 * @package wpcomsh
 */

use PHPUnit\Framework\Attributes\DataProvider;

/**
 * Class StagingSiteNoindexTest.
 */
class StagingSiteNoindexTest extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Data provider for test_is_staging_site_url().
	 *
	 * @return \Iterator
	 */
	public static function provide_is_staging_site_url(): \Iterator {
		yield 'staging site' => array( 'https://staging-c603-mysite.wpcomstaging.com', true );
		yield 'staging site, uppercase' => array( 'https://STAGING-c603-mysite.wpcomstaging.com', true );
		yield 'production site on wpcomstaging' => array( 'https://mysite.wpcomstaging.com', false );
		yield 'custom domain with staging- prefix' => array( 'https://staging-tools.com', false );
		yield 'custom domain' => array( 'https://example.com', false );
		yield 'staging subdomain of a custom domain' => array( 'https://staging-c603-mysite.wpcomstaging.com.example.com', false );
	}

	/**
	 * Tests wpcomsh_is_staging_site_url().
	 *
	 * @dataProvider provide_is_staging_site_url
	 * @param string $home     The home URL.
	 * @param bool   $expected Whether the URL is a staging address.
	 */
	#[DataProvider( 'provide_is_staging_site_url' )]
	public function test_is_staging_site_url( string $home, bool $expected ) {
		update_option( 'home', $home );

		$this->assertSame( $expected, wpcomsh_is_staging_site_url() );
	}

	/**
	 * Staging sites get the noindex header and meta, even when blog_public allows indexing.
	 */
	public function test_staging_site_is_noindexed_when_public() {
		update_option( 'home', 'https://staging-c603-mysite.wpcomstaging.com' );
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
	 * Non-staging sites keep their headers and robots directives.
	 */
	public function test_production_site_is_untouched() {
		update_option( 'home', 'https://mysite.wpcomstaging.com' );

		$this->assertSame( array(), wpcomsh_add_staging_site_robots_header( array() ) );

		$robots = array(
			'index'  => true,
			'follow' => true,
		);
		$this->assertSame( $robots, wpcomsh_add_staging_site_robots_directives( $robots ) );
	}
}
