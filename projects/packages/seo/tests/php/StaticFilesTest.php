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
