<?php
/**
 * Tests for static-file detection across public and managed core roots.
 *
 * @package automattic/jetpack-seo
 */

namespace Automattic\Jetpack\SEO;

use Automattic\Jetpack\Constants;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

/**
 * @covers \Automattic\Jetpack\SEO\Static_Files
 */
#[CoversClass( Static_Files::class )]
class StaticFilesTest extends TestCase {

	/**
	 * Static files must be detected at the public root rather than inside managed core.
	 *
	 * @dataProvider provide_root_layouts
	 * @param bool   $atomic Whether the site uses Atomic's managed core layout.
	 * @param string $filename Static filename to check.
	 */
	#[DataProvider( 'provide_root_layouts' )]
	public function test_static_file_at_public_root( $atomic, $filename ) {
		$root = sys_get_temp_dir() . '/jetpack-seo-static-' . uniqid();
		mkdir( $root );
		mkdir( $root . '/__wp__' );
		Constants::set_constant( 'ABSPATH', $root . '/__wp__/' );
		Constants::set_constant( 'ATOMIC_SITE_ID', $atomic ? 123 : false );
		Constants::set_constant( 'ATOMIC_CLIENT_ID', $atomic ? 1 : false );
		$file = ( $atomic ? $root : $root . '/__wp__' ) . '/' . $filename;

		try {
			$this->assertFalse( Static_Files::exists( $filename ) );
			file_put_contents( $file, 'Static test content' );
			$this->assertTrue( Static_Files::exists( $filename ) );
		} finally {
			if ( is_file( $file ) ) {
				unlink( $file );
			}
			rmdir( $root . '/__wp__' );
			rmdir( $root );
			Constants::clear_single_constant( 'ABSPATH' );
			Constants::clear_single_constant( 'ATOMIC_SITE_ID' );
			Constants::clear_single_constant( 'ATOMIC_CLIENT_ID' );
		}
	}

	/**
	 * @dataProvider provide_subdirectory_layouts
	 * @param string $home Site's public URL.
	 * @param string $site WordPress installation URL.
	 * @param string $install Installation directory below the temporary root.
	 * @param string $public Public directory below the temporary root.
	 */
	#[DataProvider( 'provide_subdirectory_layouts' )]
	public function test_static_file_with_separate_wordpress_directory( $home, $site, $install, $public ) {
		$root         = sys_get_temp_dir() . '/seo-subdirectory-' . uniqid();
		$installation = $root . $install;
		mkdir( $installation, 0777, true );
		Constants::set_constant( 'ABSPATH', $installation . '/' );
		$home_filter = static function () use ( $home ) {
			return $home;
		};
		$site_filter = static function () use ( $site ) {
			return $site;
		};
		add_filter( 'home_url', $home_filter );
		add_filter( 'site_url', $site_filter );
		$public_file = $root . $public . '/robots.txt';
		$core_file   = $installation . '/robots.txt';
		try {
			$this->assertFalse( Static_Files::exists( 'robots.txt' ) );
			if ( $public_file !== $root . '/robots.txt' ) {
				file_put_contents( $root . '/robots.txt', 'Outside the public root' );
				$this->assertFalse( Static_Files::exists( 'robots.txt' ) );
				unlink( $root . '/robots.txt' );
			}
			if ( $core_file !== $public_file ) {
				file_put_contents( $core_file, 'Inside WordPress core' );
				$this->assertFalse( Static_Files::exists( 'robots.txt' ) );
				unlink( $core_file );
			}
			file_put_contents( $public_file, 'Static rules' );
			$this->assertTrue( Static_Files::exists( 'robots.txt' ) );
		} finally {
			remove_filter( 'home_url', $home_filter );
			remove_filter( 'site_url', $site_filter );
			foreach ( array_unique( array( $public_file, $core_file, $root . '/robots.txt' ) ) as $file ) {
				if ( is_file( $file ) ) {
					unlink( $file );
				}
			}
			while ( $installation !== $root ) {
				rmdir( $installation );
				$installation = dirname( $installation );
			}
			rmdir( $root );
			Constants::clear_single_constant( 'ABSPATH' );
		}
	}

	/** @return array Test cases. */
	public static function provide_subdirectory_layouts() {
		return array(
			'root home'                   => array( 'https://example.com/', 'https://example.com/wordpress/', '/wordpress', '' ),
			'nested home'                 => array( 'https://example.com/blog/', 'https://example.com/blog/core/', '/blog/core', '/blog' ),
			'encoded directory'           => array( 'https://example.com/', 'https://example.com/word%20press/', '/word press', '' ),
			'public subdirectory'         => array( 'https://example.com/wordpress/', 'https://example.com/wordpress/', '/wordpress', '/wordpress' ),
			'different directory mapping' => array( 'https://example.com/', 'https://example.com/wordpress/', '/core', '/core' ),
			'different hosts'             => array( 'https://public.example/', 'https://backend.example/wordpress/', '/wordpress', '/wordpress' ),
			'different ports'             => array( 'https://example.com:8443/', 'https://example.com/wordpress/', '/wordpress', '/wordpress' ),
			'host case'                   => array( 'https://EXAMPLE.com/', 'https://example.com/wordpress/', '/wordpress', '' ),
		);
	}

	/**
	 * Provide both generated files on standard and managed-core installations.
	 *
	 * @return array Test cases.
	 */
	public static function provide_root_layouts() {
		return array(
			'normal robots' => array( false, 'robots.txt' ),
			'atomic robots' => array( true, 'robots.txt' ),
			'normal llms'   => array( false, 'llms.txt' ),
			'atomic llms'   => array( true, 'llms.txt' ),
		);
	}
}
