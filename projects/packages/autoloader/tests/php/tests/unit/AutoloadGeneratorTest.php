<?php
/**
 * Autoload Generator test suite.
 *
 * @package automattic/jetpack-autoloader
 */

use Automattic\Jetpack\Autoloader\AutoloadGenerator;
use Composer\IO\NullIO;
use Composer\Package\Package;
use Composer\Package\RootPackage;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

/**
 * Test suite class for the Autoload generator.
 */
class AutoloadGeneratorTest extends TestCase {

	/**
	 * Data provider for parseAutoloads tests.
	 *
	 * @return array Test cases.
	 */
	public static function provide_parse_autoloads_cases() {
		return array(
			'without exclude-from-classmap'     => array(
				'rootExcludes'          => array(),
				'rootDevExcludes'       => array(),
				'dependencyExcludes'    => array(),
				'dependencyDevExcludes' => array(),
				'expectedExcludes'      => array(),
			),
			'with root and dependency excludes' => array(
				'rootExcludes'          => array( 'src/Excluded.php', 'common/' ),
				'rootDevExcludes'       => array( 'common/', 'tests/**' ),
				'dependencyExcludes'    => array( 'dependency-excluded/' ),
				'dependencyDevExcludes' => array( 'dependency-dev-excluded/' ),
				'expectedExcludes'      => array(
					array( 'dependency', 'dependency\-excluded' ),
					array( 'root', 'src/Excluded\.php' ),
					// Composer preserves duplicates when it merges root and dev autoloads.
					array( 'root', 'common' ),
					array( 'root', 'common' ),
					array( 'root', 'tests/.+?' ),
				),
			),
		);
	}

	/**
	 * Tests parseAutoloads returns all expected autoload entries.
	 *
	 * @param array $rootExcludes Root package exclusions.
	 * @param array $rootDevExcludes Root package development exclusions.
	 * @param array $dependencyExcludes Dependency package exclusions.
	 * @param array $dependencyDevExcludes Dependency package development exclusions.
	 * @param array $expectedExcludes Package and expected regex suffix pairs.
	 *
	 * @dataProvider provide_parse_autoloads_cases
	 */
	#[DataProvider( 'provide_parse_autoloads_cases' )]
	public function test_parse_autoloads_exclude_from_classmap(
		array $rootExcludes,
		array $rootDevExcludes,
		array $dependencyExcludes,
		array $dependencyDevExcludes,
		array $expectedExcludes
	) {
		$rootPath        = __DIR__;
		$dependencyPath  = dirname( __DIR__ );
		$rootAutoload    = array(
			'psr-4'    => array( 'Root\\' => 'src/' ),
			'classmap' => array( 'src' ),
			'files'    => array( 'root.php' ),
		);
		$rootDevAutoload = array();
		if ( $rootExcludes ) {
			$rootAutoload['exclude-from-classmap'] = $rootExcludes;
		}
		if ( $rootDevExcludes ) {
			$rootDevAutoload['exclude-from-classmap'] = $rootDevExcludes;
		}

		$dependencyAutoload    = array(
			'psr-0'    => array( 'Dependency_' => 'lib/' ),
			'classmap' => array( 'lib' ),
			'files'    => array( 'dependency.php' ),
		);
		$dependencyDevAutoload = array();
		if ( $dependencyExcludes ) {
			$dependencyAutoload['exclude-from-classmap'] = $dependencyExcludes;
		}
		if ( $dependencyDevExcludes ) {
			$dependencyDevAutoload['exclude-from-classmap'] = $dependencyDevExcludes;
		}

		$rootPackage = new RootPackage( 'test/root', '1.0.0', '1.0.0' );
		$rootPackage->setAutoload( $rootAutoload );
		$rootPackage->setDevAutoload( $rootDevAutoload );
		$dependencyPackage = new Package( 'vendor/dependency', '1.0.0', '1.0.0' );
		$dependencyPackage->setAutoload( $dependencyAutoload );
		$dependencyPackage->setDevAutoload( $dependencyDevAutoload );

		$excludeBasePaths = array(
			'root'       => $rootPath,
			'dependency' => $dependencyPath,
		);
		$excludePatterns  = array();
		foreach ( $expectedExcludes as $expectedExclude ) {
			$basePath          = preg_quote( strtr( realpath( $excludeBasePaths[ $expectedExclude[0] ] ), '\\', '/' ), '{' );
			$excludePatterns[] = $basePath . '/' . $expectedExclude[1] . '($|/)';
		}

		$expected   = array(
			'psr-0'                 => array(
				'Dependency_' => array(
					array(
						'path'    => $dependencyPath . '/lib/',
						'version' => '1.0.0',
					),
				),
			),
			'psr-4'                 => array(
				'Root\\' => array(
					array(
						'path'    => $rootPath . '/src/',
						'version' => '1.0.0',
					),
				),
			),
			'classmap'              => array(
				array(
					'path'    => $rootPath . '/src',
					'version' => '1.0.0',
				),
				array(
					'path'    => $dependencyPath . '/lib',
					'version' => '1.0.0',
				),
			),
			'files'                 => array(
				md5( 'vendor/dependency:dependency.php' ) => array(
					'path'    => $dependencyPath . '/dependency.php',
					'version' => '1.0.0',
				),
				md5( 'test/root:root.php' )               => array(
					'path'    => $rootPath . '/root.php',
					'version' => '1.0.0',
				),
			),
			'exclude-from-classmap' => $excludePatterns,
		);
		$packageMap = array(
			array( $rootPackage, $rootPath ),
			array( $dependencyPackage, $dependencyPath ),
		);

		$generator = new AutoloadGenerator( new NullIO() );
		$this->assertSame( $expected, $generator->parseAutoloads( $packageMap, $rootPackage ) );
	}
}
