<?php
/**
 * Tests for the Connection_Assets class.
 *
 * @package automattic/jetpack-connection
 */

namespace Automattic\Jetpack\Connection;

use PHPUnit\Framework\TestCase;

/**
 * Unit tests for the Connection_Assets class.
 */
class Connection_Assets_Test extends TestCase {

	/**
	 * Restores the filter registry so the explicit configure() call below cannot leak.
	 */
	protected function tearDown(): void {
		parent::tearDown();

		remove_all_filters( 'jetpack_admin_js_script_data' );
		wp_deregister_script( 'jetpack-connection' );
	}

	/**
	 * The images resolve from the same package copy as the script that renders them.
	 */
	public function test_add_script_data_exposes_the_package_image_base_url() {
		Connection_Assets::register_assets();
		$package_url = dirname( wp_scripts()->registered['jetpack-connection']->src, 2 );

		$data = Connection_Assets::add_script_data( array( 'site' => array( 'title' => 'Example' ) ) );

		$this->assertSame( $package_url . '/assets/images/', $data['connection']['assetsUrl'] );
		$this->assertSame( array( 'title' => 'Example' ), $data['site'] );
	}

	/**
	 * The disconnect dialog's illustrations ship in the package.
	 */
	public function test_the_addressed_images_are_committed_to_the_package() {
		$images = dirname( __DIR__, 2 ) . '/assets/images/';

		$this->assertFileExists( $images . 'disconnect-confirm.jpg' );
		$this->assertFileExists( $images . 'disconnect-thanks.jpg' );
	}

	/**
	 * Covers the filter order against Initial_State::set_connection_script_data().
	 */
	public function test_the_image_base_url_survives_the_connection_state_filter() {
		remove_all_filters( 'jetpack_admin_js_script_data' );

		Connection_Assets::configure();

		$data = apply_filters( 'jetpack_admin_js_script_data', array() );

		$this->assertStringEndsWith( '/assets/images/', $data['connection']['assetsUrl'] );
		$this->assertArrayHasKey( 'apiRoot', $data['connection'] );
	}
}
