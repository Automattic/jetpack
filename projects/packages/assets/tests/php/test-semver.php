<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Tests for Automattic\Jetpack\Assets\Semver methods
 *
 * @package automattic/jetpack-assets
 */

namespace Automattic\Jetpack\Assets;

use InvalidArgumentException;
use PHPUnit\Framework\TestCase;

/**
 * Semver test suite.
 */
class SemverTest extends TestCase {
	use \Yoast\PHPUnitPolyfills\Polyfills\AssertIsType;
	use \Yoast\PHPUnitPolyfills\Polyfills\ExpectException;

	/**
	 * Test parse.
	 *
	 * @dataProvider provideParse
	 * @param string                          $version Version.
	 * @param string|InvalidArgumentException $expect Expected parse result.
	 */
	public function testParse( $version, $expect ) {
		if ( $expect instanceof InvalidArgumentException ) {
			$this->expectException( InvalidArgumentException::class );
			$this->expectExceptionMessage( $expect->getMessage() );
			Semver::parse( $version );
		} else {
			$this->assertSame( $expect, Semver::parse( $version ) );
		}
	}

	/**
	 * Data provider for testParse.
	 */
	public function provideParse() {
		return array(
			array(
				'1.2.3',
				array(
					'major'      => 1,
					'minor'      => 2,
					'patch'      => 3,
					'version'    => '1.2.3',
					'prerelease' => null,
					'buildinfo'  => null,
				),
			),
			array(
				'11.22.33',
				array(
					'major'      => 11,
					'minor'      => 22,
					'patch'      => 33,
					'version'    => '11.22.33',
					'prerelease' => null,
					'buildinfo'  => null,
				),
			),
			array(
				'0.0.0',
				array(
					'major'      => 0,
					'minor'      => 0,
					'patch'      => 0,
					'version'    => '0.0.0',
					'prerelease' => null,
					'buildinfo'  => null,
				),
			),
			array(
				'1.2.3-alpha',
				array(
					'major'      => 1,
					'minor'      => 2,
					'patch'      => 3,
					'version'    => '1.2.3',
					'prerelease' => 'alpha',
					'buildinfo'  => null,
				),
			),
			array(
				'1.2.3-alpha.1',
				array(
					'major'      => 1,
					'minor'      => 2,
					'patch'      => 3,
					'version'    => '1.2.3',
					'prerelease' => 'alpha.1',
					'buildinfo'  => null,
				),
			),
			array(
				'1.2.3+foobar',
				array(
					'major'      => 1,
					'minor'      => 2,
					'patch'      => 3,
					'version'    => '1.2.3',
					'prerelease' => null,
					'buildinfo'  => 'foobar',
				),
			),
			array(
				'1.2.3+foobar.2',
				array(
					'major'      => 1,
					'minor'      => 2,
					'patch'      => 3,
					'version'    => '1.2.3',
					'prerelease' => null,
					'buildinfo'  => 'foobar.2',
				),
			),
			array(
				'1.2.3-alpha+foobar',
				array(
					'major'      => 1,
					'minor'      => 2,
					'patch'      => 3,
					'version'    => '1.2.3',
					'prerelease' => 'alpha',
					'buildinfo'  => 'foobar',
				),
			),
			array(
				'1.2.3-alpha.1+foobar.2',
				array(
					'major'      => 1,
					'minor'      => 2,
					'patch'      => 3,
					'version'    => '1.2.3',
					'prerelease' => 'alpha.1',
					'buildinfo'  => 'foobar.2',
				),
			),
			array(
				'0001.0002.000-000alpha000.0001+000foobar000.0002',
				array(
					'major'      => 1,
					'minor'      => 2,
					'patch'      => 0,
					'version'    => '1.2.0',
					'prerelease' => '000alpha000.1',
					'buildinfo'  => '000foobar000.0002',
				),
			),

			array( '1.2', new InvalidArgumentException( 'Version number "1.2" is not in a recognized format.' ) ),
			array( '1.2.x', new InvalidArgumentException( 'Version number "1.2.x" is not in a recognized format.' ) ),
			array( '1.x.4', new InvalidArgumentException( 'Version number "1.x.4" is not in a recognized format.' ) ),
			array( '1..4', new InvalidArgumentException( 'Version number "1..4" is not in a recognized format.' ) ),
			array( '.2.3', new InvalidArgumentException( 'Version number ".2.3" is not in a recognized format.' ) ),
			array( '1.2.', new InvalidArgumentException( 'Version number "1.2." is not in a recognized format.' ) ),
			array( '1.2.-1', new InvalidArgumentException( 'Version number "1.2.-1" is not in a recognized format.' ) ),
			array( 'v1.2.3', new InvalidArgumentException( 'Version number "v1.2.3" is not in a recognized format.' ) ),
			array( '1.2.3.4', new InvalidArgumentException( 'Version number "1.2.3.4" is not in a recognized format.' ) ),
			array( '1.2-alpha', new InvalidArgumentException( 'Version number "1.2-alpha" is not in a recognized format.' ) ),
			array( '1.2.3-?', new InvalidArgumentException( 'Version number "1.2.3-?" is not in a recognized format.' ) ),
			array( '1.2.3+?', new InvalidArgumentException( 'Version number "1.2.3+?" is not in a recognized format.' ) ),
			array( '1.2.3-a..b', new InvalidArgumentException( 'Version number "1.2.3-a..b" is not in a recognized format.' ) ),
			array( '1.2.3+a..b', new InvalidArgumentException( 'Version number "1.2.3+a..b" is not in a recognized format.' ) ),
		);
	}

	/**
	 * Test compare.
	 *
	 * @dataProvider provideCompare
	 * @param string $a Version A.
	 * @param string $expect Expected result converted to a string, '>', '==', or '<'.
	 * @param string $b Version B.
	 */
	public function testCompare( $a, $expect, $b ) {
		$ret = Semver::compare( $a, $b );
		$this->assertIsInt( $ret );
		$ret = $ret < 0 ? '<' : ( $ret > 0 ? '>' : '==' );
		$this->assertSame( $expect, $ret );
	}

	/**
	 * Data provider for testCompare.
	 */
	public function provideCompare() {
		return array(
			array( '1.0.0', '==', '1.0.0' ),
			array( '1.0.0', '<', '2.0.0' ),
			array( '2.0.0', '>', '1.0.0' ),
			array( '1.1.0', '>', '1.0.0' ),
			array( '1.0.0', '<', '1.1.0' ),
			array( '1.999.999', '<', '2.0.0' ),
			array( '1.1.0', '<', '1.1.1' ),
			array( '1.0.999', '<', '1.1.0' ),
			array( '1.1.2', '>', '1.1.1' ),
			array( '1.1.1-dev', '<', '1.1.1' ),
			array( '1.1.1', '>', '1.1.1-p1' ),
			array( '1.1.1-alpha', '<', '1.1.1-beta' ),
			array( '1.1.1-dev', '>', '1.1.1-beta' ), // No special treatment for "dev".
			array( '1.1.1-alpha.9', '<', '1.1.1-beta.1' ),
			array( '1.1.1-beta.9', '>', '1.1.1-beta.1' ),
			array( '1.1.1-beta.9', '==', '1.1.1-beta.9' ),
			array( '1.1.1-beta.9.1', '>', '1.1.1-beta.9' ),
			array( '1.1.1-beta.9', '<', '1.1.1-beta.a' ),
			array( '1.1.1-beta.1a', '>', '1.1.1-beta.9' ),
			array( '1.1.1-BETA', '<', '1.1.1-beta' ), // Case sensitive.
			array( '1.1.1-ZETA', '<', '1.1.1-beta' ), // Case sensitive.
			array( '1.1.1-alpha2', '>', '1.1.1-alpha10' ), // No natural sorting.
			array( '1.1.1+beta.9.1', '==', '1.1.1+beta.9' ),
		);
	}

}
