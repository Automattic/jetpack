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
	 * Asset file written for a test.
	 *
	 * @var string
	 */
	private $asset_file = '';

	/**
	 * Drop the module and the asset file.
	 */
	public function tear_down() {
		wp_deregister_script_module( Announcements::SCRIPT_MODULE_ID );

		if ( '' !== $this->asset_file ) {
			unlink( $this->asset_file );
			$this->asset_file = '';
		}
	}

	public function test_registers_the_built_module_under_the_name_hosts_import() {
		$this->asset_file = tempnam( sys_get_temp_dir(), 'whats-new' );
		file_put_contents(
			$this->asset_file,
			"<?php return array( 'module_dependencies' => array( '@wordpress/a11y' ), 'version' => '1a2b3c' );"
		);

		Announcements::register_script_module( $this->asset_file );

		$module = wp_script_modules()->get_registered( '@automattic/jetpack-announcements' );
		$this->assertSame( plugins_url( 'index.min.js', $this->asset_file ), $module['src'] );
		$this->assertSame( '1a2b3c', $module['version'] );
		$this->assertSame( array( '@wordpress/a11y' ), array_column( $module['dependencies'], 'id' ) );
	}

	public function test_registers_nothing_while_the_module_is_not_built() {
		Announcements::register_script_module( __DIR__ . '/no-build/index.min.asset.php' );

		$this->assertNull( wp_script_modules()->get_registered( Announcements::SCRIPT_MODULE_ID ) );
	}
}
