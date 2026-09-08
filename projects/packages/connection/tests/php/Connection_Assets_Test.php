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
	}

	/**
	 * The disconnect dialog appends file names to this base, so it has to address the package's
	 * own assets/images/ directory and keep its trailing slash.
	 */
	public function test_add_script_data_exposes_the_package_image_base_url() {
		$data = Connection_Assets::add_script_data( array( 'site' => array( 'title' => 'Example' ) ) );

		$this->assertSame(
			trailingslashit( plugins_url( 'assets/images/', dirname( __DIR__, 2 ) . '/src' ) ),
			$data['connection']['assets_url']
		);
		$this->assertStringEndsWith( '/assets/images/', $data['connection']['assets_url'] );
		$this->assertSame( array( 'title' => 'Example' ), $data['site'] );
	}

	/**
	 * The files the base URL addresses must exist in the package, since nothing bundles them
	 * any more and a missing one would only surface as a broken image in the browser.
	 */
	public function test_the_addressed_images_are_committed_to_the_package() {
		$images = dirname( __DIR__, 2 ) . '/assets/images/';

		$this->assertFileExists( $images . 'disconnect-confirm.jpg' );
		$this->assertFileExists( $images . 'disconnect-thanks.jpg' );
	}

	/**
	 * Initial_State::set_connection_script_data() replaces the whole `connection` key, so the
	 * base URL has to be added after it or it is silently dropped.
	 */
	public function test_the_image_base_url_survives_the_connection_state_filter() {
		remove_all_filters( 'jetpack_admin_js_script_data' );

		Connection_Assets::configure();

		$data = apply_filters( 'jetpack_admin_js_script_data', array() );

		$this->assertStringEndsWith( '/assets/images/', $data['connection']['assets_url'] );
		$this->assertArrayHasKey( 'apiRoot', $data['connection'] );
	}
}
