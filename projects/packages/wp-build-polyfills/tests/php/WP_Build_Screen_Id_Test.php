<?php
namespace Automattic\Jetpack\WP_Build_Polyfills\Tests;

use Automattic\Jetpack\WP_Build_Polyfills\WP_Build_Screen_Id;
use WorDBless\BaseTestCase;

/**
 * Tests for the WP_Build_Screen_Id class.
 */
class WP_Build_Screen_Id_Test extends BaseTestCase {

	/**
	 * Screen ID wp-build's generated enqueue check would be looking for.
	 */
	const TARGET_SCREEN_ID = 'example-wp-build-dashboard';

	/**
	 * The dashboard's real, URL-facing screen ID.
	 */
	const REAL_SCREEN_ID = 'example_page_example-dashboard';

	/**
	 * Undo everything the tests hook or set.
	 */
	protected function tearDown(): void {
		remove_all_actions( 'admin_enqueue_scripts' );
		unset( $GLOBALS['current_screen'] );
		// WP_Screen::get() caches instances by hook name, so a test that mutates
		// ->id directly would otherwise leak that mutation into the next test's
		// set_current_screen() call.
		$registry = new \ReflectionProperty( \WP_Screen::class, '_registry' );
		if ( \PHP_VERSION_ID < 80100 ) {
			$registry->setAccessible( true );
		}
		$registry->setValue( null, array() );

		parent::tearDown();
	}

	public function test_load_with_alias_hooks_alias_and_restore_at_the_same_priority() {
		WP_Build_Screen_Id::load_with_alias(
			array( $this, 'alias_spy' ),
			array( $this, 'restore_spy' ),
			array( $this, 'noop' )
		);

		$alias_priority   = has_action( 'admin_enqueue_scripts', array( $this, 'alias_spy' ) );
		$restore_priority = has_action( 'admin_enqueue_scripts', array( $this, 'restore_spy' ) );

		$this->assertNotFalse( $alias_priority );
		$this->assertSame( $alias_priority, $restore_priority );
	}

	/**
	 * The contract that matters: wp-build's generated enqueue check — hooked
	 * between $alias and $restore by $load_wp_build, at the same priority — must
	 * see the aliased ID, and nothing hooked after $restore fires may see it. This
	 * fails if either hook is dropped or the order is wrong.
	 */
	public function test_generated_check_sees_only_the_aliased_id() {
		set_current_screen( self::REAL_SCREEN_ID );

		$seen_by_generated_check = null;
		$seen_after_restore      = null;
		$original_screen_id      = null;

		WP_Build_Screen_Id::load_with_alias(
			function () use ( &$original_screen_id ) {
				$original_screen_id      = get_current_screen()->id;
				get_current_screen()->id = self::TARGET_SCREEN_ID;
			},
			function () use ( &$original_screen_id ) {
				get_current_screen()->id = $original_screen_id;
			},
			function () use ( &$seen_by_generated_check ) {
				// Stands in for wp-build's generated enqueue callback, hooked by
				// requiring build.php between the alias and the restore.
				add_action(
					'admin_enqueue_scripts',
					function () use ( &$seen_by_generated_check ) {
						$seen_by_generated_check = get_current_screen()->id;
					}
				);
			}
		);

		add_action(
			'admin_enqueue_scripts',
			function () use ( &$seen_after_restore ) {
				$seen_after_restore = get_current_screen()->id;
			}
		);

		do_action( 'admin_enqueue_scripts' );

		$this->assertSame( self::TARGET_SCREEN_ID, $seen_by_generated_check );
		$this->assertSame( self::REAL_SCREEN_ID, $seen_after_restore );
	}

	/**
	 * No-op callback for the hook-registration test above.
	 *
	 * @return void
	 */
	public function noop() {}

	/**
	 * Stand-in alias callback, distinct from restore_spy() so has_action() can
	 * tell the two hooked callbacks apart.
	 *
	 * @return void
	 */
	public function alias_spy() {}

	/**
	 * Stand-in restore callback, distinct from alias_spy().
	 *
	 * @return void
	 */
	public function restore_spy() {}
}
