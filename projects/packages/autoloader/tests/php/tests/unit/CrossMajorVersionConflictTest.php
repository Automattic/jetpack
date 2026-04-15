<?php
/**
 * Tests for cross-major-version conflict resolution.
 *
 * Reproduces the exact psr/simple-cache v1 vs v3 conflict that causes fatal errors
 * when wp-stateless (ships v3) and WP Ultimo (implements v1 interface) are both active.
 *
 * @package automattic/jetpack-autoloader
 */

namespace Automattic\Jetpack\Autoloader\jpCurrent;

use PHPUnit\Framework\TestCase;

/**
 * Test suite for cross-major-version conflict resolution in the Manifest_Reader.
 */
class CrossMajorVersionConflictTest extends TestCase {

	/**
	 * Temporary directory for test manifests.
	 *
	 * @var string
	 */
	private $test_dir;

	/**
	 * Setup creates temporary plugin directories with manifest files.
	 */
	public function setUp(): void {
		parent::setUp();
		cleanup_test_wordpress_data();

		$this->test_dir = TEST_TEMP_DIR . '/cross-major-test-' . uniqid();
		mkdir( $this->test_dir, 0777, true );
	}

	/**
	 * Teardown removes temporary directories.
	 */
	public function tearDown(): void {
		parent::tearDown();
		$this->remove_dir( $this->test_dir );
	}

	/**
	 * Creates a fake plugin directory with a PSR-4 manifest.
	 *
	 * @param string $name        The plugin directory name.
	 * @param array  $psr4_entries Array of namespace => data entries for the manifest.
	 * @return string The absolute path to the plugin directory.
	 */
	private function create_plugin_with_manifest( $name, $psr4_entries ) {
		$plugin_dir  = $this->test_dir . '/' . $name;
		$vendor_dir  = $plugin_dir . '/vendor/composer';
		mkdir( $vendor_dir, 0777, true );

		$content = "<?php\n\n";
		$content .= "\$vendorDir = dirname(__DIR__);\n";
		$content .= "\$baseDir   = dirname(\$vendorDir);\n\n";
		$content .= "return array(\n";

		foreach ( $psr4_entries as $namespace => $data ) {
			$ns_escaped  = var_export( $namespace, true );
			$ver_escaped = var_export( $data['version'], true );
			$path_code   = "array( \$vendorDir . '/" . $data['path'] . "' )";

			$content .= "\t$ns_escaped => array(\n";
			$content .= "\t\t'version'     => $ver_escaped,\n";
			$content .= "\t\t'path'        => $path_code,\n";

			if ( isset( $data['package'] ) ) {
				$content .= "\t\t'package'     => " . var_export( $data['package'], true ) . ",\n";
			}

			if ( isset( $data['constraints'] ) ) {
				$constraints_code = 'array( ' . implode( ', ', array_map( function ( $c ) {
					return var_export( $c, true );
				}, $data['constraints'] ) ) . ' )';
				$content .= "\t\t'constraints' => " . $constraints_code . "\n";
			}

			$content .= "\t),\n";
		}

		$content .= ");\n";

		file_put_contents( $vendor_dir . '/jetpack_autoload_psr4.php', $content );

		return $plugin_dir;
	}

	/**
	 * Creates a fake installed.json for a plugin (used for old-autoloader fallback testing).
	 *
	 * @param string $plugin_dir The plugin directory path.
	 * @param array  $packages   Array of package data with 'name' and 'require' keys.
	 */
	private function create_installed_json( $plugin_dir, $packages ) {
		$vendor_dir = $plugin_dir . '/vendor/composer';
		if ( ! is_dir( $vendor_dir ) ) {
			mkdir( $vendor_dir, 0777, true );
		}

		$data = array( 'packages' => $packages );
		file_put_contents(
			$vendor_dir . '/installed.json',
			json_encode( $data, JSON_PRETTY_PRINT )
		);
	}

	/**
	 * THE KEY TEST: Reproduces the psr/simple-cache v1 vs v3 conflict.
	 *
	 * Plugin A (wp-stateless): ships psr/simple-cache v3.0.0
	 *   - constraints: "^1.0 || ^2.0 || ^3.0" (from json-mapper)
	 *
	 * Plugin B (wp-ultimo): ships psr/simple-cache v1.0.1
	 *   - constraints: "^1.0" (from jasny/sso)
	 *
	 * Without constraint-aware selection: autoloader picks v3 → Plugin B fatals.
	 * With constraint-aware selection: autoloader picks v1 (satisfies both).
	 */
	public function test_picks_v1_when_v3_conflicts_with_other_plugins_constraints() {
		// Plugin A: wp-stateless — ships v3, but its deps accept ^1 || ^2 || ^3.
		$plugin_a = $this->create_plugin_with_manifest( 'wp-stateless', array(
			'Psr\\SimpleCache\\' => array(
				'version'     => '3.0.0.0',
				'path'        => 'psr/simple-cache/src',
				'package'     => 'psr/simple-cache',
				'constraints' => array( '^1.0 || ^2.0 || ^3.0' ),
			),
		) );

		// Plugin B: wp-ultimo — ships v1, its deps require exactly ^1.0.
		$plugin_b = $this->create_plugin_with_manifest( 'wp-ultimo', array(
			'Psr\\SimpleCache\\' => array(
				'version'     => '1.0.1.0',
				'path'        => 'psr/simple-cache/src',
				'package'     => 'psr/simple-cache',
				'constraints' => array( '^1.0' ),
			),
		) );

		$reader    = new Manifest_Reader( new Version_Selector(), new Constraint_Checker() );
		$path_map  = array();

		$reader->read_manifests(
			array( $plugin_a, $plugin_b ),
			'vendor/composer/jetpack_autoload_psr4.php',
			$path_map
		);

		// The autoloader should pick v1.0.1 — the only version satisfying ALL constraints.
		$this->assertArrayHasKey( 'Psr\\SimpleCache\\', $path_map );
		$this->assertEquals( '1.0.1.0', $path_map['Psr\\SimpleCache\\']['version'] );
	}

	/**
	 * Same test but with plugins loaded in the opposite order.
	 * The result should be the same regardless of load order.
	 */
	public function test_picks_v1_regardless_of_plugin_load_order() {
		$plugin_a = $this->create_plugin_with_manifest( 'wp-stateless', array(
			'Psr\\SimpleCache\\' => array(
				'version'     => '3.0.0.0',
				'path'        => 'psr/simple-cache/src',
				'package'     => 'psr/simple-cache',
				'constraints' => array( '^1.0 || ^2.0 || ^3.0' ),
			),
		) );

		$plugin_b = $this->create_plugin_with_manifest( 'wp-ultimo', array(
			'Psr\\SimpleCache\\' => array(
				'version'     => '1.0.1.0',
				'path'        => 'psr/simple-cache/src',
				'package'     => 'psr/simple-cache',
				'constraints' => array( '^1.0' ),
			),
		) );

		$reader    = new Manifest_Reader( new Version_Selector(), new Constraint_Checker() );
		$path_map  = array();

		// Load Plugin B first, then Plugin A.
		$reader->read_manifests(
			array( $plugin_b, $plugin_a ),
			'vendor/composer/jetpack_autoload_psr4.php',
			$path_map
		);

		$this->assertEquals( '1.0.1.0', $path_map['Psr\\SimpleCache\\']['version'] );
	}

	/**
	 * When both plugins are on the same major version, the highest should be picked
	 * (existing behavior preserved).
	 */
	public function test_picks_highest_within_same_major() {
		$plugin_a = $this->create_plugin_with_manifest( 'plugin-a', array(
			'Psr\\Log\\' => array(
				'version'     => '3.0.0.0',
				'path'        => 'psr/log/src',
				'package'     => 'psr/log',
				'constraints' => array( '^3.0' ),
			),
		) );

		$plugin_b = $this->create_plugin_with_manifest( 'plugin-b', array(
			'Psr\\Log\\' => array(
				'version'     => '3.0.2.0',
				'path'        => 'psr/log/src',
				'package'     => 'psr/log',
				'constraints' => array( '^3.0' ),
			),
		) );

		$reader   = new Manifest_Reader( new Version_Selector(), new Constraint_Checker() );
		$path_map = array();

		$reader->read_manifests(
			array( $plugin_a, $plugin_b ),
			'vendor/composer/jetpack_autoload_psr4.php',
			$path_map
		);

		// Should pick the highest within the same major.
		$this->assertEquals( '3.0.2.0', $path_map['Psr\\Log\\']['version'] );
	}

	/**
	 * When constraints allow multiple majors and both sides agree, pick the highest.
	 */
	public function test_picks_highest_when_all_constraints_allow_it() {
		$plugin_a = $this->create_plugin_with_manifest( 'plugin-a', array(
			'Psr\\Log\\' => array(
				'version'     => '2.0.0.0',
				'path'        => 'psr/log/src',
				'package'     => 'psr/log',
				'constraints' => array( '^2.0 || ^3.0' ),
			),
		) );

		$plugin_b = $this->create_plugin_with_manifest( 'plugin-b', array(
			'Psr\\Log\\' => array(
				'version'     => '3.0.2.0',
				'path'        => 'psr/log/src',
				'package'     => 'psr/log',
				'constraints' => array( '^2.0 || ^3.0' ),
			),
		) );

		$reader   = new Manifest_Reader( new Version_Selector(), new Constraint_Checker() );
		$path_map = array();

		$reader->read_manifests(
			array( $plugin_a, $plugin_b ),
			'vendor/composer/jetpack_autoload_psr4.php',
			$path_map
		);

		// Both plugins accept ^2 or ^3, so v3.0.2 should be picked (highest satisfying all).
		$this->assertEquals( '3.0.2.0', $path_map['Psr\\Log\\']['version'] );
	}

	/**
	 * Tests that old-format manifests (without constraints) fall back to installed.json.
	 */
	public function test_falls_back_to_installed_json_for_old_manifests() {
		// Plugin A: new autoloader format with constraints.
		$plugin_a = $this->create_plugin_with_manifest( 'plugin-new', array(
			'Psr\\SimpleCache\\' => array(
				'version'     => '3.0.0.0',
				'path'        => 'psr/simple-cache/src',
				'package'     => 'psr/simple-cache',
				'constraints' => array( '^1.0 || ^2.0 || ^3.0' ),
			),
		) );

		// Plugin B: OLD autoloader format — no constraints or package field.
		$plugin_b_dir  = $this->test_dir . '/plugin-old';
		$vendor_dir    = $plugin_b_dir . '/vendor/composer';
		mkdir( $vendor_dir, 0777, true );

		// Write old-style manifest (no constraints, no package).
		$old_manifest = <<<'PHP'
<?php

$vendorDir = dirname(__DIR__);
$baseDir   = dirname($vendorDir);

return array(
	'Psr\\SimpleCache\\' => array(
		'version' => '1.0.1.0',
		'path'    => array( $vendorDir . '/psr/simple-cache/src' )
	),
);
PHP;
		file_put_contents( $vendor_dir . '/jetpack_autoload_psr4.php', $old_manifest );

		// Provide installed.json so the fallback can find constraints.
		// Include both the package itself (with autoload for namespace resolution)
		// and the package that requires it (with the constraint).
		$this->create_installed_json( $plugin_b_dir, array(
			array(
				'name'     => 'psr/simple-cache',
				'version'  => '1.0.1',
				'autoload' => array(
					'psr-4' => array(
						'Psr\\SimpleCache\\' => 'src/',
					),
				),
			),
			array(
				'name'    => 'jasny/sso',
				'version' => '2.0.0',
				'require' => array(
					'psr/simple-cache' => '^1.0',
				),
			),
		) );

		$reader   = new Manifest_Reader( new Version_Selector(), new Constraint_Checker() );
		$path_map = array();

		$reader->read_manifests(
			array( $plugin_a, $plugin_b_dir ),
			'vendor/composer/jetpack_autoload_psr4.php',
			$path_map
		);

		// Should pick v1.0.1 — the installed.json fallback provided the ^1.0 constraint.
		$this->assertArrayHasKey( 'Psr\\SimpleCache\\', $path_map );
		$this->assertEquals( '1.0.1.0', $path_map['Psr\\SimpleCache\\']['version'] );
	}

	/**
	 * When no constraint data is available at all, falls back to existing behavior (highest wins).
	 */
	public function test_falls_back_to_highest_without_any_constraint_data() {
		// Both plugins use old-format manifests with no constraints, no installed.json.
		$plugin_a_dir  = $this->test_dir . '/plugin-old-a';
		$vendor_a      = $plugin_a_dir . '/vendor/composer';
		mkdir( $vendor_a, 0777, true );

		$manifest_a = <<<'PHP'
<?php
$vendorDir = dirname(__DIR__);
$baseDir   = dirname($vendorDir);
return array(
	'Psr\\SimpleCache\\' => array(
		'version' => '3.0.0.0',
		'path'    => array( $vendorDir . '/psr/simple-cache/src' )
	),
);
PHP;
		file_put_contents( $vendor_a . '/jetpack_autoload_psr4.php', $manifest_a );

		$plugin_b_dir  = $this->test_dir . '/plugin-old-b';
		$vendor_b      = $plugin_b_dir . '/vendor/composer';
		mkdir( $vendor_b, 0777, true );

		$manifest_b = <<<'PHP'
<?php
$vendorDir = dirname(__DIR__);
$baseDir   = dirname($vendorDir);
return array(
	'Psr\\SimpleCache\\' => array(
		'version' => '1.0.1.0',
		'path'    => array( $vendorDir . '/psr/simple-cache/src' )
	),
);
PHP;
		file_put_contents( $vendor_b . '/jetpack_autoload_psr4.php', $manifest_b );

		$reader   = new Manifest_Reader( new Version_Selector(), new Constraint_Checker() );
		$path_map = array();

		// Suppress the expected conflict warning.
		$this->expectOutputRegex( '//' );

		$reader->read_manifests(
			array( $plugin_a_dir, $plugin_b_dir ),
			'vendor/composer/jetpack_autoload_psr4.php',
			$path_map
		);

		// No constraints anywhere — falls back to highest (existing behavior).
		$this->assertEquals( '3.0.0.0', $path_map['Psr\\SimpleCache\\']['version'] );
	}

	/**
	 * Recursively removes a directory.
	 *
	 * @param string $dir The directory to remove.
	 */
	private function remove_dir( $dir ) {
		if ( ! is_dir( $dir ) ) {
			return;
		}
		$items = scandir( $dir );
		foreach ( $items as $item ) {
			if ( '.' === $item || '..' === $item ) {
				continue;
			}
			$path = $dir . '/' . $item;
			if ( is_dir( $path ) ) {
				$this->remove_dir( $path );
			} else {
				unlink( $path );
			}
		}
		rmdir( $dir );
	}
}
