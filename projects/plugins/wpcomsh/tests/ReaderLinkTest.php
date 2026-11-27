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
 * @covers ::wpcomsh_hide_reader_feature
 */
#[CoversFunction( 'wpcomsh_activate_reader_module' )]
#[CoversFunction( 'wpcomsh_report_forced_reader_module' )]
#[CoversFunction( 'wpcomsh_hide_reader_feature' )]
class ReaderLinkTest extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Runs in its own process, since the stand-in Jetpack class cannot be unloaded.
	 *
	 * @param bool $can_activate Whether Jetpack accepts the activation.
	 * @param bool $forced       Whether Reader ends up saved, reported as forced on, and hidden from Features.
	 *
	 * @dataProvider provide_activation_outcomes
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[DataProvider( 'provide_activation_outcomes' )]
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_forced_reader_is_saved_reported_as_forced_on_and_hidden_from_features( $can_activate, $forced ) {
		if ( ! Jetpack_Stand_In::load() ) {
			$this->markTestSkipped( 'The Jetpack plugin is already loaded.' );
		}
		Jetpack_Stand_In::$can_activate = $can_activate;

		wpcomsh_activate_reader_module();

		$this->assertSame( $forced, in_array( 'wpcom-reader', Jetpack_Stand_In::$saved, true ), 'Saved as active' );
		$this->assertSame( $forced, in_array( 'wpcom-reader', apply_filters( 'jetpack_active_modules', array() ), true ), 'Reported as forced on' );

		$states = apply_filters( 'jetpack_my_jetpack_feature_visibility', array( 'other-host-item' => 'hidden' ) );
		$this->assertSame( $forced ? 'hidden' : null, $states['wpcom-reader'] ?? null, 'Hidden from My Jetpack Features' );
		$this->assertSame( 'hidden', $states['other-host-item'] ?? null, 'Other hidden items kept' );
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
