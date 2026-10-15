<?php

namespace Automattic\Jetpack\My_Jetpack;

use Automattic\Jetpack\My_Jetpack\Products\Protect;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

/**
 * Unit tests for the Protect product.
 *
 * @package automattic/my-jetpack
 * @see \Automattic\Jetpack\My_Jetpack\Products\Protect
 */
class Protect_Product_Test extends TestCase {

	/**
	 * Returning the environment into its initial state.
	 */
	public function tearDown(): void {
		parent::tearDown();

		unset( $GLOBALS['wp_actions']['jetpack_protect_dashboard_initialized'] );
	}

	/**
	 * Whether the Protect package's dashboard has loaded.
	 *
	 * @return array[]
	 */
	public static function provide_dashboard_states() {
		return array(
			'dashboard loaded'     => array( true ),
			'dashboard not loaded' => array( false ),
		);
	}

	/**
	 * Tests Protect Manage URL with the Protect package's dashboard and no standalone plugin.
	 *
	 * @dataProvider provide_dashboard_states
	 *
	 * @param bool $loaded Whether the dashboard has loaded.
	 */
	#[DataProvider( 'provide_dashboard_states' )]
	public function test_protect_manage_url_with_the_dashboard( $loaded ) {
		if ( $loaded ) {
			do_action( 'jetpack_protect_dashboard_initialized' );
		}

		$this->assertFalse( Protect::is_standalone_plugin_active() );
		$this->assertSame( $loaded, admin_url( 'admin.php?page=jetpack-protect' ) === Protect::get_manage_url() );
	}
}
