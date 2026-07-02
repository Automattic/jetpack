<?php
namespace Automattic\Jetpack\Stats_Admin;

use Automattic\Jetpack\Stats_Admin\TestCase as Stats_TestCase;
use ReflectionProperty;

/**
 * Unit tests for the React_Handle_Guard class.
 *
 * @package automattic/jetpack-stats-admin
 */
class React_Handle_Guard_Test extends Stats_TestCase {

	const CORE_SRC = '/wp-includes/js/dist/vendor/react-dom.min.js';

	/**
	 * Start every test with clean static guard state, independent of order.
	 */
	public function setUp(): void {
		parent::setUp();
		$this->reset_guard_state();
	}

	/**
	 * Register a core-like react/react-dom pair and snapshot it.
	 */
	private function register_and_snapshot() {
		$scripts = wp_scripts();
		wp_register_script( 'react', '/wp-includes/js/dist/vendor/react.min.js', array(), '18.3.1.1', true );
		wp_register_script( 'react-dom', self::CORE_SRC, array( 'react' ), '18.3.1.1', true );
		React_Handle_Guard::snapshot_core_handles( $scripts );
	}

	/**
	 * A handle repointed away from core is restored to the snapshot.
	 */
	public function test_restore_reverts_hijacked_handle() {
		$this->register_and_snapshot();

		wp_deregister_script( 'react-dom' );
		wp_register_script( 'react-dom', 'https://example.com/hijacked-react-dom.js', array( 'react' ), '18', true );

		React_Handle_Guard::restore_if_hijacked();

		$this->assertSame( self::CORE_SRC, wp_scripts()->registered['react-dom']->src );
		$this->assertSame( '18.3.1.1', wp_scripts()->registered['react-dom']->ver );
	}

	/**
	 * When nothing changed, the handle is left untouched.
	 */
	public function test_restore_is_noop_when_unchanged() {
		$this->register_and_snapshot();
		$before = wp_scripts()->registered['react-dom'];

		React_Handle_Guard::restore_if_hijacked();

		$this->assertSame( $before, wp_scripts()->registered['react-dom'], 'The dependency object should not be re-created when there is no conflict.' );
	}

	/**
	 * A version-only change (same src) still counts as a conflict and is restored.
	 */
	public function test_restore_reverts_version_only_change() {
		$this->register_and_snapshot();

		wp_deregister_script( 'react-dom' );
		wp_register_script( 'react-dom', self::CORE_SRC, array( 'react' ), '17', true );

		React_Handle_Guard::restore_if_hijacked();

		$this->assertSame( '18.3.1.1', wp_scripts()->registered['react-dom']->ver );
	}

	/**
	 * Restoring preserves the footer grouping and inline data core attached to the handle.
	 */
	public function test_restore_preserves_footer_and_inline_data() {
		$scripts = wp_scripts();
		wp_register_script( 'react', '/wp-includes/js/dist/vendor/react.min.js', array(), '18.3.1.1', true );
		wp_register_script( 'react-dom', self::CORE_SRC, array( 'react' ), '18.3.1.1', true );
		wp_add_inline_script( 'react-dom', 'window.__reactDomReady = true;', 'after' );
		$scripts->registered['react-dom']->textdomain = 'jetpack-stats-admin';
		React_Handle_Guard::snapshot_core_handles( $scripts );

		wp_deregister_script( 'react-dom' );
		wp_register_script( 'react-dom', 'https://example.com/hijacked-react-dom.js', array( 'react' ), '18', false );

		React_Handle_Guard::restore_if_hijacked();

		$restored = wp_scripts()->registered['react-dom'];
		$this->assertSame( 1, $restored->extra['group'] ?? null, 'Footer grouping should be preserved.' );
		$this->assertContains( 'window.__reactDomReady = true;', $restored->extra['after'] ?? array() );
		$this->assertSame( 'jetpack-stats-admin', $restored->textdomain, 'Text domain should be preserved.' );
	}

	/**
	 * Captures the current state via register_snapshot() when wp_default_scripts has already fired.
	 */
	public function test_register_snapshot_captures_when_already_fired() {
		set_current_screen( 'dashboard' );

		wp_register_script( 'react', '/wp-includes/js/dist/vendor/react.min.js', array(), '18.3.1.1', true );
		wp_register_script( 'react-dom', self::CORE_SRC, array( 'react' ), '18.3.1.1', true );

		React_Handle_Guard::register_snapshot();

		wp_deregister_script( 'react-dom' );
		wp_register_script( 'react-dom', 'https://example.com/hijacked-react-dom.js', array( 'react' ), '18', true );

		React_Handle_Guard::restore_if_hijacked();

		$this->assertSame( self::CORE_SRC, wp_scripts()->registered['react-dom']->src );
	}

	/**
	 * Reset the guard's static state so register_snapshot() can be re-exercised.
	 */
	private function reset_guard_state() {
		foreach ( array(
			'snapshot'        => array(),
			'snapshot_hooked' => false,
		) as $prop => $value ) {
			$rp = new ReflectionProperty( React_Handle_Guard::class, $prop );
			// @todo Remove this call once we no longer need to support PHP <8.1.
			if ( PHP_VERSION_ID < 80100 ) {
				$rp->setAccessible( true );
			}
			$rp->setValue( null, $value );
		}
	}
}
