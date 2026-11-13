<?php
/**
 * WordPress.com Reader link feature plugin tests.
 *
 * @package wpcomsh
 */

use PHPUnit\Framework\Attributes\CoversFunction;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;

/**
 * @covers ::wpcomsh_activate_reader_module
 * @covers ::wpcomsh_report_forced_reader_module
 */
#[CoversFunction( 'wpcomsh_activate_reader_module' )]
#[CoversFunction( 'wpcomsh_report_forced_reader_module' )]
class ReaderLinkTest extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Runs in its own process, since the stand-in Jetpack class cannot be unloaded.
	 *
	 * @param bool $can_activate Whether Jetpack accepts the activation.
	 * @param bool $forced       Whether Reader ends up saved and reported as forced on.
	 *
	 * @dataProvider provide_activation_outcomes
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[DataProvider( 'provide_activation_outcomes' )]
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_forced_reader_is_saved_and_reported_as_forced_on( $can_activate, $forced ) {
		if ( ! Jetpack_Stand_In::load() ) {
			$this->markTestSkipped( 'The Jetpack plugin is already loaded.' );
		}
		Jetpack_Stand_In::$can_activate = $can_activate;

		wpcomsh_activate_reader_module();

		$this->assertSame( $forced, in_array( 'wpcom-reader', Jetpack_Stand_In::$saved, true ), 'Saved as active' );
		$this->assertSame( $forced, in_array( 'wpcom-reader', apply_filters( 'jetpack_active_modules', array() ), true ), 'Reported as forced on' );
	}

	/**
	 * Activation outcomes.
	 *
	 * @return array
	 */
	public static function provide_activation_outcomes(): array {
		return array(
			'activation succeeds' => array( true, true ),
			'activation refused'  => array( false, false ),
		);
	}
}
