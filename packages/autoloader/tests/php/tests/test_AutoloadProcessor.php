<?php // phpcs:ignore WordPress.Files.FileName
/**
 * Autoloader test suite.
 *
 * @package automattic/jetpack-autoloader
 */

use Automattic\Jetpack\Autoloader\AutoloadProcessor;
use PHPUnit\Framework\TestCase;

/**
 * Test suite class for the Autoload processor.
 */
class WP_Test_AutoloadProcessor extends TestCase {

	/**
	 * Tests that all of the process functions are safe when not given an autoload they're expecting.
	 */
	public function test_process_functions_return_null_when_empty() {
		$processor = new AutoloadProcessor( null, null );

		$this->assertNull( $processor->processClassmap( array(), false ) );
		$this->assertNull( $processor->processClassmap( array(), true ) );
		$this->assertNull( $processor->processPsr4Packages( array(), false ) );
		$this->assertNull( $processor->processPsr4Packages( array(), true ) );
		$this->assertNull( $processor->processFiles( array() ) );
	}

	/**
	 * Tests that `processClassmap` does not scan PSR-4 packages unless requested.
	 */
	public function test_process_classmap_does_not_scan_psr_packages() {
		$classmap_scanner      = function ( $path, $class_blacklist, $namespace ) {
			$this->assertEquals( 'src', $path );
			$this->assertNull( $class_blacklist );
			$this->assertNull( $namespace );

			return array(
				'TestClass'  => 'src/TestClass.php',
				'TestClass2' => 'src/TestClass2.php',
			);
		};
		$path_code_transformer = function ( $path ) {
			return 'converted-' . $path;
		};
		$processor             = new AutoloadProcessor( $classmap_scanner, $path_code_transformer );

		$autoloads = array(
			'classmap' => array(
				array(
					'path'    => 'src',
					'version' => 'dev-test',
				),
			),
		);

		$processed = $processor->processClassmap( $autoloads, false );

		$this->assertEquals(
			array(
				'TestClass'  => array(
					'version' => 'dev-test',
					'path'    => 'converted-src/TestClass.php',
				),
				'TestClass2' => array(
					'version' => 'dev-test',
					'path'    => 'converted-src/TestClass2.php',
				),
			),
			$processed
		);
	}

	/**
	 * Tests that `processClassmap` scans PSR-4 packages when requested.
	 */
	public function test_process_classmap_scans_psr_packages_when_requested() {
		$classmap_scanner      = function ( $path, $class_blacklist, $namespace ) {
			$this->assertEquals( 'src', $path );
			$this->assertNull( $class_blacklist );
			$this->assertEquals( 'Jetpack\\Autoloader\\', $namespace );

			return array(
				'TestClass'  => 'src/TestClass.php',
				'TestClass2' => 'src/TestClass2.php',
			);
		};
		$path_code_transformer = function ( $path ) {
			return 'converted2-' . $path;
		};
		$processor             = new AutoloadProcessor( $classmap_scanner, $path_code_transformer );

		$autoloads = array(
			'psr-4' => array(
				'Jetpack\\Autoloader\\' => array(
					array(
						'path'    => 'src',
						'version' => 'dev-test2',
					),
				),
			),
		);

		$processed = $processor->processClassmap( $autoloads, true );

		$this->assertEquals(
			array(
				'TestClass'  => array(
					'version' => 'dev-test2',
					'path'    => 'converted2-src/TestClass.php',
				),
				'TestClass2' => array(
					'version' => 'dev-test2',
					'path'    => 'converted2-src/TestClass2.php',
				),
			),
			$processed
		);
	}

	/**
	 * Tests that `processClassmap` passes the blacklist correctly when given one.
	 */
	public function test_process_classmap_uses_blacklist() {
		$classmap_scanner      = function ( $path, $class_blacklist, $namespace ) {
			$this->assertEquals( 'src', $path );
			$this->assertEquals( '{(TestClass)}', $class_blacklist );
			$this->assertNull( $namespace );

			return array(
				'TestClass'  => 'src/TestClass.php',
				'TestClass2' => 'src/TestClass2.php',
			);
		};
		$path_code_transformer = function ( $path ) {
			return 'converted-' . $path;
		};
		$processor             = new AutoloadProcessor( $classmap_scanner, $path_code_transformer );

		$autoloads = array(
			'classmap' => array(
				array(
					'path'    => 'src',
					'version' => 'dev-test',
				),
			),
		);

		$autoloads['exclude-from-classmap'] = array( 'TestClass' );

		$processed = $processor->processClassmap( $autoloads, false );

		$this->assertEquals(
			array(
				'TestClass'  => array(
					'version' => 'dev-test',
					'path'    => 'converted-src/TestClass.php',
				),
				'TestClass2' => array(
					'version' => 'dev-test',
					'path'    => 'converted-src/TestClass2.php',
				),
			),
			$processed
		);
	}

	/**
	 * Tests that `processPsr4Packages` returns the expected format.
	 */
	public function test_process_psr_packages() {
		$path_code_transformer = function ( $path ) {
			return 'converted-' . $path;
		};
		$processor             = new AutoloadProcessor( null, $path_code_transformer );

		$autoloads = array(
			'psr-4' => array(
				'Jetpack\\Autoloader\\' => array(
					array(
						'path'    => 'src',
						'version' => 'dev-test',
					),
				),
			),
		);

		$processed = $processor->processPsr4Packages( $autoloads, false );

		$this->assertEquals(
			array(
				'Jetpack\\Autoloader\\' => array(
					'path'    => array( 'converted-src' ),
					'version' => 'dev-test',
				),
			),
			$processed
		);
	}

	/**
	 * Tests that `processPsr4Packages` does not when we're indicating that we want to make them a classmap.
	 */
	public function test_process_psr_packages_does_nothing_when_converting_to_classmap() {
		$processor = new AutoloadProcessor( null, null );

		$autoloads = array(
			'psr-4' => array(
				'Jetpack\\Autoloader\\' => array(
					array(
						'path'    => 'src',
						'version' => 'dev-test',
					),
				),
			),
		);

		$processed = $processor->processPsr4Packages( $autoloads, true );

		$this->assertNull( $processed );
	}

	/**
	 * Tests that `processFiles` returns the expected format.
	 */
	public function test_process_files() {
		$path_code_transformer = function ( $path ) {
			return 'converted-' . $path;
		};
		$processor             = new AutoloadProcessor( null, $path_code_transformer );

		$autoloads = array(
			'files' => array(
				'abcdef' => array(
					'path'    => 'src/file.php',
					'version' => 'dev-test',
				),
			),
		);

		$processed = $processor->processFiles( $autoloads );

		$this->assertEquals(
			array(
				'abcdef' => array(
					'path'    => 'converted-src/file.php',
					'version' => 'dev-test',
				),
			),
			$processed
		);
	}
}
