<?php
/**
 * Tests for the WordPress.com Simple Jetpack AI settings repair.
 *
 * @package automattic/jetpack-mu-wpcom
 */

namespace Automattic\Jetpack\Jetpack_Mu_Wpcom\Jetpack_AI_Options_Repair;

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Jetpack_Mu_Wpcom;

require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/jetpack-ai-options-repair/jetpack-ai-options-repair.php';

/**
 * Tests for the WordPress.com Simple Jetpack AI settings repair.
 */
class Jetpack_AI_Options_Repair_Test extends \WorDBless\BaseTestCase {
	const UNRELATED_OPTIONS = array(
		'reader_chat',
		'jetpack_ai_agents_enabled',
		'big_sky_enable',
	);

	/**
	 * Reset the options and hosting constants used by each test.
	 */
	public function set_up() {
		parent::set_up();

		$this->reset_test_state();
	}

	/**
	 * Clean up options and hosting constants after each test.
	 */
	public function tear_down() {
		$this->reset_test_state();

		parent::tear_down();
	}

	/**
	 * Remove test options and hosting overrides.
	 */
	private function reset_test_state() {
		Constants::clear_constants();

		foreach ( array_merge( JETPACK_AI_OPTIONS, self::UNRELATED_OPTIONS, array( SIMPLE_REPAIR_MARKER ) ) as $option ) {
			delete_option( $option );
		}
	}

	/**
	 * The repair deletes only the five corrupted options on Simple sites.
	 */
	public function test_repairs_wpcom_simple_options_once() {
		Constants::set_constant( 'IS_WPCOM', true );

		foreach ( JETPACK_AI_OPTIONS as $option ) {
			add_option( $option, '0' );
		}
		add_option( 'reader_chat', '1' );
		add_option( 'jetpack_ai_agents_enabled', '1' );
		add_option( 'big_sky_enable', '0' );

		repair_wpcom_simple_options();

		foreach ( JETPACK_AI_OPTIONS as $option ) {
			$this->assertSame( 'missing', get_option( $option, 'missing' ) );
		}
		$this->assertTrue( (bool) get_option( SIMPLE_REPAIR_MARKER, false ) );
		$this->assertSame( '1', get_option( 'reader_chat' ) );
		$this->assertSame( '1', get_option( 'jetpack_ai_agents_enabled' ) );
		$this->assertSame( '0', get_option( 'big_sky_enable' ) );

		add_option( JETPACK_AI_OPTIONS[0], '0' );
		repair_wpcom_simple_options();

		$this->assertSame( '0', get_option( JETPACK_AI_OPTIONS[0] ) );
	}

	/**
	 * Atomic sites keep their stored values and never receive the repair marker.
	 */
	public function test_does_not_repair_atomic_options() {
		Constants::set_constant( 'IS_WPCOM', false );
		Constants::set_constant( 'IS_ATOMIC', true );

		foreach ( JETPACK_AI_OPTIONS as $option ) {
			add_option( $option, '0' );
		}

		repair_wpcom_simple_options();

		foreach ( JETPACK_AI_OPTIONS as $option ) {
			$this->assertSame( '0', get_option( $option ) );
		}
		$this->assertSame( 'missing', get_option( SIMPLE_REPAIR_MARKER, 'missing' ) );
	}
}
