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
	 * Setup runs before each test.
	 */
	protected function setUp(): void {
		parent::setUp();
		$this->generator = new AutoloadGenerator( new NullIO() );
	}

	/**
	 * Data provider for parseAutoloads tests.
	 *
	 * @return array Test cases.
	 */
	public static function provide_parse_autoloads_cases(): array {
		return array(
			'no exclude-from-classmap'                        => array(
				'autoload'     => array(
					'classmap' => array( 'src' ),
					'psr-4'    => array( 'Test\\' => 'src/' ),
				),
				'devAutoload'  => array(),
				'depAutoloads' => array(),
				'expectEmpty'  => true,
			),
			'exclude-from-classmap in autoload only'          => array(
				'autoload'     => array(
					'classmap'              => array( 'src' ),
					'exclude-from-classmap' => array( 'src/Excluded.php', 'src/tests/' ),
				),
				'devAutoload'  => array(),
				'depAutoloads' => array(),
				'expectEmpty'  => false,
				'expectCount'  => 2,
			),
			'exclude-from-classmap in autoload-dev only'      => array(
				'autoload'     => array(
					'classmap' => array( 'src' ),
				),
				'devAutoload'  => array(
					'exclude-from-classmap' => array( 'tests/fixtures/' ),
				),
				'depAutoloads' => array(),
				'expectEmpty'  => false,
				'expectCount'  => 1,
			),
			'exclude-from-classmap in both autoload and autoload-dev' => array(
				'autoload'     => array(
					'classmap'              => array( 'src' ),
					'exclude-from-classmap' => array( 'src/Excluded.php', 'common/' ),
				),
				'devAutoload'  => array(
					'exclude-from-classmap' => array( 'common/', 'tests/' ),
				),
				'depAutoloads' => array(),
				'expectEmpty'  => false,
				// Note: Composer does not deduplicate, so 'common/' appears twice (once from
				// autoload and once from autoload-dev). This matches Composer's behavior.
				'expectCount'  => 4,
			),
			'exclude-from-classmap in non-root package ignored' => array(
				'autoload'     => array(
					'classmap' => array( 'src' ),
				),
				'devAutoload'  => array(),
				'depAutoloads' => array(
					array(
						'name'      => 'vendor/dep',
						'autoload'  => array(
							'exclude-from-classmap' => array( 'vendor-excluded/' ),
						),
					),
				),
				'expectEmpty'  => true, // Non-root package exclusions are ignored.
			),
		);
	}

	/**
	 * Tests parseAutoloads returns correct exclude-from-classmap results.
	 *
	 * @param array $autoload Root package autoload config.
	 * @param array $devAutoload Root package dev autoload config.
	 * @param array $depAutoloads Dependency autoload configs.
	 * @param bool  $expectEmpty Whether to expect empty exclude-from-classmap.
	 * @param int   $expectCount Expected count of exclusion patterns (if not empty).
	 */
	#[\PHPUnit\Framework\Attributes\DataProvider( 'provide_parse_autoloads_cases' )]
	public function test_parse_autoloads_exclude_from_classmap(
		array $autoload,
		array $devAutoload,
		array $depAutoloads,
		bool $expectEmpty,
		int $expectCount = 0
	) {
		$package = new RootPackage( 'test/package', '1.0.0', '1.0.0' );
		$package->setAutoload( $autoload );
		$package->setDevAutoload( $devAutoload );

		// Build package map: root package first, then dependencies.
		$packageMap = array( array( $package, getcwd() ) );
		foreach ( $depAutoloads as $dep ) {
			$depPackage = new Package( $dep['name'], '1.0.0', '1.0.0' );
			$depPackage->setAutoload( $dep['autoload'] );
			$packageMap[] = array( $depPackage, getcwd() . '/vendor/' . $dep['name'] );
		}

		$result = $this->generator->parseAutoloads( $packageMap, $package );

		// Verify the result has the expected keys.
		$this->assertArrayHasKey( 'psr-0', $result );
		$this->assertArrayHasKey( 'psr-4', $result );
		$this->assertArrayHasKey( 'classmap', $result );
		$this->assertArrayHasKey( 'files', $result );
		$this->assertArrayHasKey( 'exclude-from-classmap', $result );

		if ( $expectEmpty ) {
			$this->assertEmpty( $result['exclude-from-classmap'] );
		} else {
			$this->assertNotEmpty( $result['exclude-from-classmap'] );
			$this->assertCount( $expectCount, $result['exclude-from-classmap'] );

			// Verify patterns are regex format (contain escaped paths and end with ($|/)).
			foreach ( $result['exclude-from-classmap'] as $pattern ) {
				$this->assertMatchesRegularExpression( '/\(\$\|\\/\)$/', $pattern, 'Pattern should end with ($|/)' );
			}
		}
	}

	/**
	 * Tests that exclude-from-classmap patterns are properly converted to regexes.
	 */
	public function test_exclude_from_classmap_patterns_are_regexes() {
		$package = new RootPackage( 'test/package', '1.0.0', '1.0.0' );
		$package->setAutoload(
			array(
				'classmap'              => array( 'src' ),
				'exclude-from-classmap' => array( 'src/Test.php' ),
			)
		);

		$packageMap = array( array( $package, getcwd() ) );
		$result     = $this->generator->parseAutoloads( $packageMap, $package );

		$this->assertCount( 1, $result['exclude-from-classmap'] );

		$pattern = $result['exclude-from-classmap'][0];

		// Pattern should be a valid regex.
		$this->assertNotFalse( @preg_match( '{' . $pattern . '}', '' ), 'Pattern should be a valid regex' );

		// Pattern should match the expected file.
		$expectedPath = strtr( getcwd(), '\\', '/' ) . '/src/Test.php';
		$this->assertMatchesRegularExpression( '{' . $pattern . '}', $expectedPath );
	}

	/**
	 * Tests wildcard support in exclude-from-classmap patterns.
	 */
	public function test_exclude_from_classmap_wildcards() {
		$package = new RootPackage( 'test/package', '1.0.0', '1.0.0' );
		$package->setAutoload(
			array(
				'classmap'              => array( 'src' ),
				'exclude-from-classmap' => array( 'src/*/Test.php', 'tests/**' ),
			)
		);

		$packageMap = array( array( $package, getcwd() ) );
		$result     = $this->generator->parseAutoloads( $packageMap, $package );

		// Patterns with wildcards should be converted properly.
		// * becomes [^/]+? and ** becomes .+?
		$this->assertCount( 2, $result['exclude-from-classmap'] );

		foreach ( $result['exclude-from-classmap'] as $pattern ) {
			// Verify it's a valid regex.
			$this->assertNotFalse( @preg_match( '{' . $pattern . '}', '' ), 'Pattern should be a valid regex' );
		}
	}
}
