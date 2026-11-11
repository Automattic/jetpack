<?php
/**
 * Blaze feature plugin tests.
 *
 * @package wpcomsh
 */

use PHPUnit\Framework\Attributes\CoversFunction;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;

/**
 * @covers ::wpcomsh_force_activate_blaze_module
 * @covers ::wpcomsh_report_forced_blaze_module
 */
#[CoversFunction( 'wpcomsh_force_activate_blaze_module' )]
#[CoversFunction( 'wpcomsh_report_forced_blaze_module' )]
class BlazeTest extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Runs in its own process, since the stand-in Jetpack class cannot be unloaded.
	 *
	 * @param string   $admin_interface The wpcom_admin_interface option.
	 * @param bool     $can_activate    Whether Jetpack accepts the activation.
	 * @param string[] $saved           Modules already saved as active.
	 * @param bool     $expect_saved    Whether Blaze ends up saved as active.
	 * @param bool     $expect_reported Whether Blaze is reported as forced on.
	 *
	 * @dataProvider provide_sites
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[DataProvider( 'provide_sites' )]
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_forced_blaze_is_saved_and_reported_as_forced_on( $admin_interface, $can_activate, $saved, $expect_saved, $expect_reported ) {
		if ( ! Jetpack_Stand_In::load() ) {
			$this->markTestSkipped( 'The Jetpack plugin is already loaded.' );
		}
		Jetpack_Stand_In::$can_activate = $can_activate;
		Jetpack_Stand_In::$saved        = $saved;
		update_option( 'wpcom_admin_interface', $admin_interface );

		wpcomsh_force_activate_blaze_module();

		$this->assertSame( $expect_saved, in_array( 'blaze', Jetpack_Stand_In::$saved, true ), 'Saved as active' );
		// Jetpack_Modules_Overrides counts a module as forced on when the filter adds it to an empty list.
		$this->assertSame( $expect_reported, in_array( 'blaze', apply_filters( 'jetpack_active_modules', array() ), true ), 'Reported as forced on' );
	}

	/**
	 * Admin interface, activation outcome, and saved module combinations.
	 *
	 * @return array
	 */
	public static function provide_sites(): array {
		return array(
			'default interface'                       => array( 'calypso', true, array(), true, true ),
			'classic wp-admin interface, Blaze saved' => array( 'wp-admin', true, array( 'blaze' ), true, false ),
			'activation refused'                      => array( 'calypso', false, array(), false, false ),
		);
	}
}
