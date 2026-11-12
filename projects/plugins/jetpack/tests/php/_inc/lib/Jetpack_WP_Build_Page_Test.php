<?php
/**
 * Shared wp-build page loader tests.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\WP_Build_Polyfills\WP_Build_Polyfills;
use PHPUnit\Framework\Attributes\CoversClass;

require_once JETPACK__PLUGIN_DIR . '_inc/lib/admin-pages/class-jetpack-wp-build-page.php';

/**
 * @covers \Jetpack_WP_Build_Page
 */
#[CoversClass( Jetpack_WP_Build_Page::class )]
class Jetpack_WP_Build_Page_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Give the loader a page id without requiring a build.
	 */
	public function set_up() {
		parent::set_up();
		$this->set_page_id( 'jetpack-test-dashboard' );
	}

	/**
	 * Clear the loader's state so other tests see none.
	 */
	public function tear_down() {
		$this->set_page_id( null );
		parent::tear_down();
	}

	/**
	 * Set the private page id load() would record.
	 *
	 * @param string|null $page_id Page id.
	 */
	private function set_page_id( $page_id ) {
		$property = new ReflectionProperty( Jetpack_WP_Build_Page::class, 'page_id' );
		// @todo Remove once we drop PHP < 8.1 support. `setAccessible()` is
		// deprecated in 8.5 (a no-op since 8.1), so only call it where it's needed.
		if ( PHP_VERSION_ID < 80100 ) {
			$property->setAccessible( true );
		}
		$property->setValue( null, $page_id );
	}

	/**
	 * Skip unless `build/` exists.
	 */
	private function skip_without_the_build() {
		if ( ! file_exists( JETPACK__PLUGIN_DIR . 'build/build.php' ) ) {
			$this->markTestSkipped( 'Needs a built checkout; CI runs unbuilt.' );
		}
	}

	/**
	 * Every consumer that has registered a polyfill.
	 *
	 * @return string[]
	 */
	private function polyfill_consumers() {
		return array_merge( array(), ...array_values( WP_Build_Polyfills::get_consumers() ) );
	}

	public function test_load_returns_false_without_the_build() {
		if ( file_exists( JETPACK__PLUGIN_DIR . 'build/build.php' ) ) {
			$this->markTestSkipped( 'Needs an unbuilt checkout, as in CI.' );
		}

		$this->assertFalse( Jetpack_WP_Build_Page::load( 'jetpack-test-dashboard' ) );
		$this->assertFalse( has_action( 'admin_enqueue_scripts', array( Jetpack_WP_Build_Page::class, 'alias_screen_id' ) ) );
	}

	/**
	 * In-process on purpose: a separate process reinstalls the shared test database mid-suite.
	 */
	public function test_load_skips_a_page_the_build_cannot_render() {
		$this->skip_without_the_build();

		$this->assertFalse( Jetpack_WP_Build_Page::load( 'jetpack-no-such-page' ) );
		$this->assertFalse( has_action( 'admin_enqueue_scripts', array( Jetpack_WP_Build_Page::class, 'alias_screen_id' ) ) );
		$this->assertFalse( has_action( 'admin_enqueue_scripts', array( Jetpack_WP_Build_Page::class, 'restore_screen_id' ) ) );
		$this->assertNotContains( 'jetpack', $this->polyfill_consumers() );

		set_current_screen( 'dashboard' );
		Jetpack_WP_Build_Page::alias_screen_id();
		$this->assertSame( 'dashboard', get_current_screen()->id, 'The page id was not reset.' );
	}

	/**
	 * Asserts what load() checks for, since a real load() would register polyfills for the rest of the suite.
	 */
	public function test_the_build_renders_the_loaded_pages() {
		$this->skip_without_the_build();

		require_once JETPACK__PLUGIN_DIR . 'build/build.php';
		foreach ( array( 'jetpack-ai-hub', 'jetpack-settings-dashboard' ) as $page_id ) {
			$this->assertTrue( function_exists( 'jetpack_plugin_' . str_replace( '-', '_', $page_id ) . '_wp_admin_render_page' ), $page_id );
		}
	}

	public function test_screen_id_alias_round_trip() {
		set_current_screen( 'dashboard' );
		$original = get_current_screen()->id;

		Jetpack_WP_Build_Page::alias_screen_id();
		$this->assertSame(
			'jetpack-test-dashboard',
			get_current_screen()->id,
			'The generated enqueue check matches the screen ID against the route page id.'
		);

		Jetpack_WP_Build_Page::restore_screen_id();
		$this->assertSame( $original, get_current_screen()->id );
	}

	/**
	 * Restoring twice must not clobber a screen ID nobody aliased.
	 */
	public function test_screen_id_restore_is_idempotent() {
		set_current_screen( 'dashboard' );
		$original = get_current_screen()->id;

		Jetpack_WP_Build_Page::alias_screen_id();
		Jetpack_WP_Build_Page::restore_screen_id();
		// @phan-suppress-next-line PhanPluginDuplicateAdjacentStatement -- Restoring twice is the assertion.
		Jetpack_WP_Build_Page::restore_screen_id();

		$this->assertSame( $original, get_current_screen()->id );
	}
}
