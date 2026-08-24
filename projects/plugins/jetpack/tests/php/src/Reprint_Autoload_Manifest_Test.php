<?php
/**
 * Guards what the Reprint package contributes to Jetpack's autoloader manifests.
 *
 * Jetpack's autoloader is not scoped to Jetpack: AutoloadGenerator walks every
 * installed Composer package and folds its classmap, psr-4 and files entries
 * into manifests that arbitrate class names across every plugin on the site.
 * Whatever wp-php-toolkit/reprint-server declares, Jetpack publishes site-wide,
 * so what lands in those manifests is part of the plugin's public surface.
 *
 * None of this is visible by inspection, and all of it fails silently, which is
 * why it is asserted rather than watched for.
 *
 * @package automattic/jetpack
 */

use PHPUnit\Framework\Attributes\CoversNothing;

/**
 * Asserts the Reprint entries in the generated autoloader manifests.
 *
 * @coversNothing
 */
#[CoversNothing]
class Reprint_Autoload_Manifest_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Path, relative to the plugin root, of the vendored package.
	 *
	 * @var string
	 */
	const PACKAGE_DIR = 'vendor/wp-php-toolkit/reprint-server/';

	/**
	 * Every class reprint-server is expected to publish.
	 *
	 * The Site_Export_* names stay global because they are the consumer-facing
	 * API — wpcomsh calls two of them by name. PDO, PDOStatement and
	 * PDOException are deliberately absent: see test_no_pdo_polyfill_classes().
	 *
	 * @var string[]
	 */
	const EXPECTED_CLASSES = array(
		'Site_Export_HMAC_Client',
		'Site_Export_HMAC_Server',
		'Site_Export_HTTP_Server',
		'Site_Export_Multipart_Processor',
		'Site_Export_Push_Configuration_Exception',
		'Site_Export_Push_Endpoints',
		'Site_Export_Push_Exception',
		'Site_Export_Push_Session',
		'WordPress\\Reprint\\Server\\DatabaseRowsReader',
		'WordPress\\Reprint\\Server\\FileIndexProcessor',
		'WordPress\\Reprint\\Server\\FileTreeProducer',
		'WordPress\\Reprint\\Server\\GzipOutputStream',
		'WordPress\\Reprint\\Server\\MySQLDumpProducer',
		'WordPress\\Reprint\\Server\\PdoConstants',
		'WordPress\\Reprint\\Server\\ResourceBudget',
		'WordPress\\Reprint\\Server\\SqliteDriverPDO',
		'WordPress\\Reprint\\Server\\SqliteDriverPDOStatement',
		'WordPress\\Reprint\\Server\\WpdbDriverPDO',
		'WordPress\\Reprint\\Server\\WpdbDriverPDOStatement',
	);

	/**
	 * The plugin root directory, with a trailing slash.
	 *
	 * @return string
	 */
	private function plugin_dir() {
		return dirname( __DIR__, 3 ) . '/';
	}

	/**
	 * Loads one of the generated manifests.
	 *
	 * @param string $name     Manifest file name.
	 * @param bool   $required Whether the manifest must exist. A manifest with
	 *                         no entries is not written at all, so the psr-4
	 *                         one is legitimately absent from some builds.
	 * @return array<string, array{version: string, path: string|string[]}>
	 */
	private function manifest( $name, $required = true ) {
		$file = $this->plugin_dir() . 'vendor/composer/' . $name;

		if ( ! $required && ! file_exists( $file ) ) {
			return array();
		}

		$this->assertFileExists( $file, "$name is missing. Run `jp build plugins/jetpack` first." );
		return require $file;
	}

	/**
	 * The classmap entries whose path points into the vendored package.
	 *
	 * Selects by path rather than by class name so a class the package starts
	 * declaring under some other name is caught too.
	 *
	 * @return array<string, string> Class name => absolute path.
	 */
	private function reprint_classmap_entries() {
		$entries = array();
		foreach ( $this->manifest( 'jetpack_autoload_classmap.php' ) as $class => $data ) {
			if ( false !== strpos( $data['path'], self::PACKAGE_DIR ) ) {
				$entries[ $class ] = $data['path'];
			}
		}
		return $entries;
	}

	/**
	 * The package publishes exactly the classes we expect.
	 *
	 * They are supposed to be in the classmap: that is what gives Jetpack's copy
	 * version arbitration against the copy wpcomsh ships during the changeover,
	 * so the newer of the two wins each shared class name.
	 */
	public function test_classmap_holds_the_expected_classes() {
		$found = array_keys( $this->reprint_classmap_entries() );
		sort( $found );

		$expected = self::EXPECTED_CLASSES;
		sort( $expected );

		$this->assertSame( $expected, $found );
	}

	/**
	 * Reprint must not publish fake PDO classes.
	 *
	 * Jetpack's autoloader is site-wide, and PDO is a capability probe for
	 * co-resident plugins.
	 */
	public function test_no_pdo_polyfill_classes() {
		$classmap = $this->manifest( 'jetpack_autoload_classmap.php' );

		foreach ( array( 'PDO', 'PDOStatement', 'PDOException' ) as $class ) {
			$this->assertArrayNotHasKey( $class, $classmap );
		}
	}

	/**
	 * Every reprint classmap entry resolves to a file that exists.
	 *
	 * The manifests are generated during `composer install`, before
	 * `.gitattributes` filtering copies files into the build, and nothing
	 * regenerates them afterwards. Php_Autoloader::load_class() ends in a bare
	 * `require $file;` with no file_exists() check, so an entry naming a file
	 * that did not ship is a fatal — on a manifest the whole site reads.
	 */
	public function test_classmap_paths_exist() {
		$entries = $this->reprint_classmap_entries();
		$this->assertNotEmpty( $entries );

		foreach ( $entries as $class => $path ) {
			$this->assertFileExists( $path, "$class maps to a file that does not exist." );
		}
	}

	/**
	 * Every reprint classmap entry names a file the production build ships.
	 *
	 * The package lives under vendor/, so the plugin's production attributes
	 * must include it explicitly. Read the tracked attribute file directly:
	 * Docker test containers cannot reliably read the worktree's Git metadata.
	 */
	public function test_classmap_paths_ship_in_the_production_build() {
		$attributes_file = $this->plugin_dir() . '.gitattributes';
		$attributes      = file_get_contents( $attributes_file );
		$this->assertNotFalse( $attributes, '.gitattributes must be readable.' );

		$this->assertMatchesRegularExpression(
			'#^/vendor/wp-php-toolkit/reprint-server/\*\*\s+production-include\s*$#m',
			$attributes,
			'Reprint server must be production-included so every classmap path ships.'
		);
	}

	/**
	 * The package declares no psr-4 namespace, so the psr-4 manifest gains
	 * nothing from it.
	 *
	 * The manifest is only written when something declares a psr-4 namespace.
	 * The production artifact has none and so has no file at all, which is the
	 * strongest form of this assertion rather than a reason to fail.
	 */
	public function test_psr4_manifest_gains_no_reprint_entry() {
		$found = array();

		foreach ( $this->manifest( 'jetpack_autoload_psr4.php', false ) as $namespace => $data ) {
			foreach ( (array) $data['path'] as $path ) {
				if ( false !== strpos( $path, self::PACKAGE_DIR ) ) {
					$found[] = $namespace;
				}
			}
		}

		$this->assertSame( array(), $found );
	}
}
