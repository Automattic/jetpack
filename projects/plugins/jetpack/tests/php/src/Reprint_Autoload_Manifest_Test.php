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
	 * The PDO polyfill must never reach the classmap.
	 *
	 * The package's src/class-pdo-polyfill.php declares global PDO, PDOStatement
	 * and PDOException — six constants and two empty classes — inside eval()
	 * heredocs, and Composer's class map generator strips strings before
	 * tokenising, so they do not land. Its exclude-from-classmap entry does not
	 * help here: Jetpack's AutoloadGenerator emits no such key.
	 *
	 * It matters because class_exists( 'PDO' ) is a capability probe, and the
	 * manifest is site-global. A faithful polyfill would answer it true and
	 * right; this one would answer true and wrong, and every plugin on the site
	 * would fatal on first use.
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
	 * Reads the same two git attributes the build's file list reads. The
	 * package lives under vendor/, which is gitignored, so a file ships only
	 * where production-include is set on it and production-exclude is not.
	 */
	public function test_classmap_paths_ship_in_the_production_build() {
		$plugin_dir = $this->plugin_dir();
		$paths      = array();

		foreach ( $this->reprint_classmap_entries() as $class => $path ) {
			$this->assertStringStartsWith( $plugin_dir, $path, "$class maps outside the plugin directory." );
			$paths[] = substr( $path, strlen( $plugin_dir ) );
		}
		$this->assertNotEmpty( $paths );

		$attributes = $this->check_attr( $plugin_dir, array( 'production-include', 'production-exclude' ), $paths );

		foreach ( $paths as $path ) {
			$this->assertSame(
				'set',
				$attributes[ $path ]['production-include'] ?? null,
				"$path is not production-included, so it will not ship."
			);
			$this->assertContains(
				$attributes[ $path ]['production-exclude'] ?? null,
				array( 'unspecified', 'unset' ),
				"$path is production-excluded, so it will not ship."
			);
		}
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

	/**
	 * Reads git attributes for a list of paths.
	 *
	 * @param string   $cwd        Directory to run git in.
	 * @param string[] $attributes Attribute names to read.
	 * @param string[] $paths      Paths, relative to $cwd.
	 * @return array<string, array<string, string>> Path => attribute => value.
	 */
	private function check_attr( $cwd, $attributes, $paths ) {
		$command = 'git -C ' . escapeshellarg( $cwd ) . ' -c core.quotepath=off check-attr '
			. implode( ' ', array_map( 'escapeshellarg', $attributes ) ) . ' -- '
			. implode( ' ', array_map( 'escapeshellarg', $paths ) ) . ' 2>/dev/null';

		$output    = array();
		$exit_code = 0;
		// phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.system_calls_exec -- The build reads these attributes the same way; there is no PHP equivalent.
		exec( $command, $output, $exit_code );

		if ( 0 !== $exit_code ) {
			$this->markTestSkipped( 'git could not read the attributes here, so the production file list is unchecked.' );
		}

		$result = array();
		foreach ( $output as $line ) {
			// Each line reads `<path>: <attribute>: <value>`.
			$parts = explode( ': ', $line );
			if ( 3 === count( $parts ) ) {
				$result[ $parts[0] ][ $parts[1] ] = $parts[2];
			}
		}

		return $result;
	}
}
