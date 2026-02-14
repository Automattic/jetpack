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
use PHPUnit\Framework\TestCase;

/**
 * Test suite class for the Autoload generator.
 */
class AutoloadGeneratorTest extends TestCase {

	/**
	 * The AutoloadGenerator instance being tested.
	 *
	 * @var AutoloadGenerator
	 */
	private $generator;

	/**
	 * Temporary directory for test fixtures.
	 *
	 * @var string
	 */
	private $tempDir;

	/**
	 * Setup runs before each test.
	 */
	protected function setUp(): void {
		parent::setUp();
		$this->generator = new AutoloadGenerator( new NullIO() );

		// Create a temp directory so that realpath() can resolve paths.
		$this->tempDir = sys_get_temp_dir() . '/jpautoloadtest' . uniqid();
		mkdir( $this->tempDir, 0777, true );
	}

	/**
	 * Cleanup after each test.
	 */
	protected function tearDown(): void {
		if ( $this->tempDir && is_dir( $this->tempDir ) ) {
			rmdir( $this->tempDir );
		}
		parent::tearDown();
	}

	/**
	 * Data provider for parseAutoloads tests.
	 *
	 * Each case provides autoload/devAutoload config for the root package,
	 * optional dependency autoload configs, and expected regex suffixes that
	 * should appear in the exclude-from-classmap output (after the base path).
	 *
	 * @return array Test cases.
	 */
	public static function provide_parse_autoloads_cases(): array {
		return array(
			'no exclude-from-classmap'                                   => array(
				'autoload'         => array(
					'classmap' => array( 'src' ),
					'psr-4'    => array( 'Test\\' => 'src/' ),
				),
				'devAutoload'      => array(),
				'depAutoloads'     => array(),
				'expectedSuffixes' => array(),
			),
			'exclude-from-classmap in autoload only'                     => array(
				'autoload'         => array(
					'classmap'              => array( 'src' ),
					'exclude-from-classmap' => array( 'src/Excluded.php', 'src/tests/' ),
				),
				'devAutoload'      => array(),
				'depAutoloads'     => array(),
				'expectedSuffixes' => array( 'src/Excluded\.php', 'src/tests' ),
			),
			'exclude-from-classmap in autoload-dev only'                 => array(
				'autoload'         => array(
					'classmap' => array( 'src' ),
				),
				'devAutoload'      => array(
					'exclude-from-classmap' => array( 'tests/fixtures/' ),
				),
				'depAutoloads'     => array(),
				'expectedSuffixes' => array( 'tests/fixtures' ),
			),
			'exclude-from-classmap in both autoload and autoload-dev'    => array(
				'autoload'         => array(
					'classmap'              => array( 'src' ),
					'exclude-from-classmap' => array( 'src/Excluded.php', 'common/' ),
				),
				'devAutoload'      => array(
					'exclude-from-classmap' => array( 'common/', 'tests/' ),
				),
				'depAutoloads'     => array(),
				// array_merge_recursive does not deduplicate, so 'common/' appears twice.
				'expectedSuffixes' => array( 'src/Excluded\.php', 'common', 'common', 'tests' ),
			),
			'exclude-from-classmap in non-root package ignored'          => array(
				'autoload'         => array(
					'classmap' => array( 'src' ),
				),
				'devAutoload'      => array(),
				'depAutoloads'     => array(
					array(
						'name'        => 'vendor/dep',
						'autoload'    => array(
							'exclude-from-classmap' => array( 'vendor-excluded/' ),
						),
						'devAutoload' => array(
							'exclude-from-classmap' => array( 'vendor-dev-excluded/' ),
						),
					),
				),
				'expectedSuffixes' => array(),
			),
			'exclude-from-classmap with wildcards'                       => array(
				'autoload'         => array(
					'classmap'              => array( 'src' ),
					'exclude-from-classmap' => array( 'src/*/Test.php', 'tests/**' ),
				),
				'devAutoload'      => array(),
				'depAutoloads'     => array(),
				'expectedSuffixes' => array( 'src/[^/]+?/Test\.php', 'tests/.+?' ),
			),
		);
	}

	/**
	 * Tests parseAutoloads returns correct exclude-from-classmap results.
	 *
	 * @param array $autoload Root package autoload config.
	 * @param array $devAutoload Root package dev autoload config.
	 * @param array $depAutoloads Dependency autoload configs.
	 * @param array $expectedSuffixes Expected regex suffixes for exclude patterns.
	 */
	#[\PHPUnit\Framework\Attributes\DataProvider( 'provide_parse_autoloads_cases' )]
	public function test_parse_autoloads_exclude_from_classmap(
		array $autoload,
		array $devAutoload,
		array $depAutoloads,
		array $expectedSuffixes
	) {
		$package = new RootPackage( 'test/package', '1.0.0', '1.0.0' );
		$package->setAutoload( $autoload );
		$package->setDevAutoload( $devAutoload );

		// Build package map: root package first, then dependencies.
		$packageMap = array( array( $package, $this->tempDir ) );
		foreach ( $depAutoloads as $dep ) {
			$depPackage = new Package( $dep['name'], '1.0.0', '1.0.0' );
			$depPackage->setAutoload( $dep['autoload'] );
			if ( isset( $dep['devAutoload'] ) ) {
				$depPackage->setDevAutoload( $dep['devAutoload'] );
			}
			$packageMap[] = array( $depPackage, $this->tempDir . '/vendor/' . $dep['name'] );
		}

		$result = $this->generator->parseAutoloads( $packageMap, $package );

		// Verify the result has the expected keys.
		$this->assertArrayHasKey( 'psr-0', $result );
		$this->assertArrayHasKey( 'psr-4', $result );
		$this->assertArrayHasKey( 'classmap', $result );
		$this->assertArrayHasKey( 'files', $result );
		$this->assertArrayHasKey( 'exclude-from-classmap', $result );

		// Build expected exclude-from-classmap patterns from the suffixes.
		$basePath = preg_quote( strtr( realpath( $this->tempDir ), '\\', '/' ) );
		$expected = array();
		foreach ( $expectedSuffixes as $suffix ) {
			$expected[] = $basePath . '/' . $suffix . '($|/)';
		}

		$this->assertSame( $expected, $result['exclude-from-classmap'] );
	}
}
