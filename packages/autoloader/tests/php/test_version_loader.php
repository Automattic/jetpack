<?php // phpcs:ignore WordPress.Files.FileName
/**
 * Class loader test suite.
 *
 * @package automattic/jetpack-autoloader
 */

use PHPUnit\Framework\TestCase;

/**
 * Test suite class for the Autoloader part that handles file loading.
 */
class WP_Test_Version_Loader extends TestCase {

	/**
	 * Tests that `find_class_file` returns null when the given class is not known.
	 */
	public function test_find_class_file_returns_null_for_unknown_class() {
		$version_loader = new Version_Loader( new Version_Selector(), null, null, null );

		$file_path = $version_loader->find_class_file( 'Test_Class' );

		$this->assertNull( $file_path );
	}

	/**
	 * Tests that `find_class_file` returns the path to the class when present in the classmap.
	 */
	public function test_find_class_file_returns_path_for_classmap() {
		$version_loader = new Version_Loader(
			new Version_Selector(),
			array(
				'Test_Class' => array(
					'version' => '1.0.0.0',
					'path'    => 'path_to_file.php',
				),
			),
			null,
			null
		);

		$file_path = $version_loader->find_class_file( 'Test_Class' );

		$this->assertEquals( 'path_to_file.php', $file_path );
	}

	/**
	 * Test that `find_class_file` returns the path to the class when present in the PSR-4 map.
	 */
	public function test_find_class_file_returns_path_for_psr4() {
		$version_loader = new Version_Loader(
			new Version_Selector(),
			null,
			array(
				'Jetpack\\TestCase_ABC\\' => array(
					'version' => '1.0.0.0',
					'path'    => array( __DIR__ . '/data' ),
				),
			),
			null
		);

		$file_path = $version_loader->find_class_file( 'Jetpack\\TestCase_ABC\\Psr4Folder\\Psr4_ClassName_ABC' );

		$this->assertEquals( __DIR__ . '/data/Psr4Folder/Psr4_ClassName_ABC.php', $file_path );
	}

	/**
	 * Tests that `find_class_file` returns the path to the class when presented
	 * with less-specific namespaces first in the PSR-4 map.
	 */
	public function test_find_class_file_checks_returns_path_for_psr4_with_less_specific_namespace() {
		$version_loader = new Version_Loader(
			new Version_Selector(),
			null,
			array(
				'Jetpack\\'               => array(
					'version' => '1.0.0.0',
					'path'    => array( __DIR__ . '/data' ),
				),
				'Jetpack\\TestCase_ABC\\' => array(
					'version' => '1.0.0.0',
					'path'    => array( __DIR__ . '/data' ),
				),
			),
			null
		);

		$file_path = $version_loader->find_class_file( 'Jetpack\\TestCase_ABC\\Psr4Folder\\Psr4_ClassName_ABC' );

		$this->assertEquals( __DIR__ . '/data/Psr4Folder/Psr4_ClassName_ABC.php', $file_path );
	}

	/**
	 * Test that `find_class_file` returns the classmap version when newer.
	 */
	public function test_find_class_file_returns_newer_classmap() {
		$version_loader = new Version_Loader(
			new Version_Selector(),
			array(
				'Jetpack\\TestCase_ABC\\Psr4Folder\\Psr4_ClassName_ABC' => array(
					'version' => '2.0.0.0',
					'path'    => 'path_to_file.php',
				),
			),
			array(
				'Jetpack\\TestCase_ABC\\' => array(
					'version' => '1.0.0.0',
					'path'    => array( __DIR__ . '/data' ),
				),
			),
			null
		);

		$file_path = $version_loader->find_class_file( 'Jetpack\\TestCase_ABC\\Psr4Folder\\Psr4_ClassName_ABC' );

		$this->assertEquals( 'path_to_file.php', $file_path );
	}

	/**
	 * Test that `find_class_file` returns the PSR-4 version when newer.
	 */
	public function test_find_class_file_returns_newer_psr4() {
		$version_loader = new Version_Loader(
			new Version_Selector(),
			array(
				'Jetpack\\TestCase_ABC\\Psr4Folder\\Psr4_ClassName_ABC' => array(
					'version' => '1.0.0.0',
					'path'    => 'path_to_file.php',
				),
			),
			array(
				'Jetpack\\TestCase_ABC\\' => array(
					'version' => '2.0.0.0',
					'path'    => array( __DIR__ . '/data' ),
				),
			),
			null
		);

		$file_path = $version_loader->find_class_file( 'Jetpack\\TestCase_ABC\\Psr4Folder\\Psr4_ClassName_ABC' );

		$this->assertEquals( __DIR__ . '/data/Psr4Folder/Psr4_ClassName_ABC.php', $file_path );
	}
}
