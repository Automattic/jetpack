<?php
/**
 * Tests that the legacy `jetpack_ai_enabled` option cannot change `ai` module state on upgrade.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Modules;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;

/**
 * Class Jetpack_AI_Legacy_Option_Upgrade_Test
 *
 * @covers \Jetpack
 */
#[CoversClass( Jetpack::class )]
class Jetpack_AI_Legacy_Option_Upgrade_Test extends \WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Reset the platform, the legacy option, and module state.
	 */
	public function tear_down() {
		delete_option( 'jetpack_ai_enabled' );
		Constants::set_constant( 'IS_WPCOM', false );
		\Jetpack_Options::update_option( 'active_modules', array() );

		parent::tear_down();
	}

	/**
	 * Run exactly the init callbacks plugin_upgrade() registers, in priority order.
	 *
	 * Diffing the hook rather than naming the callbacks is what makes this a
	 * regression guard: a migration added to that method later runs here too.
	 */
	private function run_upgrade_init_hooks() {
		global $wp_filter;

		$before = isset( $wp_filter['init'] ) ? $wp_filter['init']->callbacks : array();

		Jetpack::register_upgrade_init_hooks();

		$after = $wp_filter['init']->callbacks;
		ksort( $after );

		foreach ( $after as $priority => $callbacks ) {
			foreach ( $callbacks as $id => $callback ) {
				if ( ! isset( $before[ $priority ][ $id ] ) ) {
					call_user_func( $callback['function'] );
				}
			}
		}
	}

	/**
	 * Falsey values the legacy option can hold. `register_setting`'s
	 * rest_sanitize_boolean turns every falsey write into `''`, so a deliberate off
	 * and an accidental Settings > General wipe are indistinguishable once stored.
	 *
	 * @return array<string, array{0: mixed}>
	 */
	public static function falsey_option_values() {
		return array(
			'blank from a Settings > General save' => array( '' ),
			'integer zero'                         => array( 0 ),
			'string zero'                          => array( '0' ),
			'boolean false'                        => array( false ),
		);
	}

	/**
	 * THE property the incident needs guaranteed: a falsey `jetpack_ai_enabled` must
	 * not deactivate the `ai` module on upgrade, whatever falsey value it holds.
	 *
	 * @dataProvider falsey_option_values
	 * @param mixed $stored Value held in the legacy option.
	 */
	#[DataProvider( 'falsey_option_values' )]
	public function test_falsey_legacy_option_keeps_the_ai_module_active( $stored ) {
		update_option( 'jetpack_ai_enabled', $stored );
		( new Modules() )->update_active( array( 'ai' ) );

		$this->run_upgrade_init_hooks();

		$this->assertTrue(
			( new Modules() )->is_active( 'ai' ),
			'A falsey legacy option must not deactivate the module on upgrade.'
		);
	}

	/**
	 * A site that never held the option behaves identically to one that does.
	 */
	public function test_absent_legacy_option_keeps_the_ai_module_active() {
		delete_option( 'jetpack_ai_enabled' );
		( new Modules() )->update_active( array( 'ai' ) );

		$this->run_upgrade_init_hooks();

		$this->assertTrue( ( new Modules() )->is_active( 'ai' ) );
	}
}
