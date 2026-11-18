<?php
/**
 * Tests for the registration of the What's new script module.
 *
 * @package automattic/jetpack-announcements
 */

namespace Automattic\Jetpack\Announcements;

use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;

/**
 * @covers \Automattic\Jetpack\Announcements\Announcements
 */
#[CoversClass( Announcements::class )]
class Announcements_Test extends BaseTestCase {

	/**
	 * Id of a module that imports the surface, as the module of a host does.
	 */
	const HOST_MODULE_ID = 'my-plugin/host';

	/**
	 * A catalog as a language pack carries it, with one string of the surface.
	 */
	const CATALOG = '{"locale_data":{"messages":{"":{"domain":"messages","lang":"es"},"Announcements":["Anuncios"]}}}';

	/**
	 * Asset file written for a test.
	 *
	 * @var string
	 */
	private $asset_file = '';

	/**
	 * Drop the modules, the catalog and the asset file.
	 */
	public function tear_down() {
		wp_deregister_script_module( self::HOST_MODULE_ID );
		wp_deregister_script_module( Announcements::SCRIPT_MODULE_ID );
		remove_filter( 'pre_load_script_translations', array( $this, 'serve_catalog' ) );

		if ( '' !== $this->asset_file ) {
			unlink( $this->asset_file );
			$this->asset_file = '';
		}
	}

	/**
	 * Registers the module from an asset file written for the test.
	 *
	 * @param string $asset The array the asset file returns, as PHP source.
	 */
	private function register_built_module( $asset ) {
		$this->asset_file = tempnam( sys_get_temp_dir(), 'whats-new' );
		file_put_contents( $this->asset_file, '<?php return ' . $asset . ';' );

		Announcements::register_script_module( $this->asset_file );
	}

	/**
	 * Serves the catalog for the text domain of the package, as a language pack would.
	 *
	 * @param string|false|null $translations What an earlier filter served, or null.
	 * @param string|false      $file         Unused.
	 * @param string            $handle       Unused.
	 * @param string            $domain       The text domain asked for.
	 * @return string|false|null The catalog, or what came in for another text domain.
	 */
	public function serve_catalog( $translations, $file, $handle, $domain ) {
		unset( $file, $handle );

		return 'jetpack-announcements' === $domain ? self::CATALOG : $translations;
	}

	public function test_registers_the_built_module_under_the_name_hosts_import() {
		$this->register_built_module( "array( 'module_dependencies' => array( '@wordpress/a11y' ), 'version' => '1a2b3c' )" );

		$module = wp_script_modules()->get_registered( '@automattic/jetpack-announcements' );
		$this->assertNotNull( $module );
		$this->assertSame( plugins_url( 'index.min.js', $this->asset_file ), $module['src'] );
		$this->assertSame( '1a2b3c', $module['version'] );
		$this->assertSame( array( '@wordpress/a11y' ), array_column( $module['dependencies'], 'id' ) );
	}

	public function test_prints_the_translations_of_the_module_on_a_page_that_imports_it() {
		$this->register_built_module( "array( 'version' => '1a2b3c' )" );

		// A host imports the surface on demand: a dynamic dependency of the module its page enqueues.
		wp_register_script_module(
			self::HOST_MODULE_ID,
			'https://example.org/host.js',
			array(
				array(
					'id'     => Announcements::SCRIPT_MODULE_ID,
					'import' => 'dynamic',
				),
			)
		);
		wp_enqueue_script_module( self::HOST_MODULE_ID );
		add_filter( 'pre_load_script_translations', array( $this, 'serve_catalog' ), 10, 4 );

		ob_start();
		wp_script_modules()->print_script_module_translations();
		$output = ob_get_clean();

		$this->assertStringContainsString( 'wp-script-module-translation-data-' . Announcements::SCRIPT_MODULE_ID, $output );
		$this->assertStringContainsString( '"jetpack-announcements"', $output );
		$this->assertStringContainsString( self::CATALOG, $output );
	}

	public function test_registers_nothing_while_the_module_is_not_built() {
		Announcements::register_script_module( __DIR__ . '/no-build/index.min.asset.php' );

		$this->assertNull( wp_script_modules()->get_registered( Announcements::SCRIPT_MODULE_ID ) );
	}
}
