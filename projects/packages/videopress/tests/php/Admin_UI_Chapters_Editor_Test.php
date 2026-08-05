<?php
/**
 * Tests for the chapters editor feature-flag plumbing in Admin_UI.
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack\VideoPress;

use WorDBless\BaseTestCase;

/**
 * Test suite for Admin_UI::is_chapters_editor_enabled() and the chapters editor
 * route stripping.
 */
class Admin_UI_Chapters_Editor_Test extends BaseTestCase {

	/**
	 * Name of the route-registry global populated by build/routes.php.
	 *
	 * @var string
	 */
	const ROUTES_GLOBAL = 'jetpack_videopress_jetpack_videopress_dashboard_routes_data';

	/**
	 * Tear down after each test.
	 */
	public function tear_down() {
		parent::tear_down();
		remove_all_filters( Admin_UI::CHAPTERS_EDITOR_FILTER );
		unset( $GLOBALS[ self::ROUTES_GLOBAL ] );
	}

	/**
	 * The non-chapters-editor route paths, as generated into
	 * build/routes/registry.php. Only used to shape the fixture — the real
	 * registry is asserted against separately, in
	 * test_generated_registry_contains_exactly_the_gated_editor_route().
	 *
	 * @var string[]
	 */
	const OTHER_ROUTE_PATHS = array( '/', '/stats', '/settings', '/video/$id' );

	/**
	 * Build a fixture registry mirroring build/routes/registry.php, with the
	 * chapters editor routes appended.
	 *
	 * @return array
	 */
	private function get_fixture_routes() {
		$paths = array_merge(
			self::OTHER_ROUTE_PATHS,
			Admin_UI::CHAPTERS_EDITOR_ROUTE_PATHS
		);

		$routes = array();
		foreach ( $paths as $index => $path ) {
			$routes[] = array(
				'name'        => 'fixture-route-' . $index,
				'path'        => $path,
				'page'        => 'jetpack-videopress-dashboard',
				'has_route'   => true,
				'has_content' => true,
			);
		}

		return $routes;
	}

	/**
	 * Extract the path column from a route-registry array.
	 *
	 * @param array $routes Route entries.
	 * @return array Paths.
	 */
	private function get_paths( $routes ) {
		return array_column( $routes, 'path' );
	}

	/** Tests that the chapters editor filter defaults to off. */
	public function test_is_chapters_editor_enabled_defaults_to_false() {
		$this->assertFalse( Admin_UI::is_chapters_editor_enabled() );
	}

	/** Tests that the chapters editor filter enables the feature when it returns true. */
	public function test_is_chapters_editor_enabled_true_when_filter_enabled() {
		add_filter( Admin_UI::CHAPTERS_EDITOR_FILTER, '__return_true' );

		$this->assertTrue( Admin_UI::is_chapters_editor_enabled() );
	}

	/** Tests that the editor route is the only path the constant covers. */
	public function test_chapters_editor_route_paths_covers_only_the_editor_route() {
		$this->assertSame( array( '/video/$id/editor' ), Admin_UI::CHAPTERS_EDITOR_ROUTE_PATHS );
	}

	/** Tests that strip_chapters_editor_routes() removes exactly the editor path. */
	public function test_strip_chapters_editor_routes_removes_exactly_the_editor_path() {
		$fixture  = $this->get_fixture_routes();
		$stripped = Admin_UI::strip_chapters_editor_routes( $fixture );

		$this->assertCount( count( $fixture ) - count( Admin_UI::CHAPTERS_EDITOR_ROUTE_PATHS ), $stripped );
		$this->assertSame( self::OTHER_ROUTE_PATHS, $this->get_paths( $stripped ) );
	}

	/** Tests that strip_chapters_editor_routes() keeps entries without a path key. */
	public function test_strip_chapters_editor_routes_keeps_entries_without_path() {
		$stripped = Admin_UI::strip_chapters_editor_routes( array( array( 'name' => 'pathless' ) ) );

		$this->assertSame( array( array( 'name' => 'pathless' ) ), $stripped );
	}

	/** Tests that the registry global loses the editor route when the filter is off. */
	public function test_maybe_strip_chapters_editor_routes_strips_global_when_off() {
		$GLOBALS[ self::ROUTES_GLOBAL ] = $this->get_fixture_routes();

		Admin_UI::maybe_strip_chapters_editor_routes();

		$this->assertSame( self::OTHER_ROUTE_PATHS, $this->get_paths( $GLOBALS[ self::ROUTES_GLOBAL ] ) );
	}

	/** Tests that the registry global is left untouched when the filter is on. */
	public function test_maybe_strip_chapters_editor_routes_leaves_global_untouched_when_on() {
		add_filter( Admin_UI::CHAPTERS_EDITOR_FILTER, '__return_true' );

		$fixture                        = $this->get_fixture_routes();
		$GLOBALS[ self::ROUTES_GLOBAL ] = $fixture;

		Admin_UI::maybe_strip_chapters_editor_routes();

		$this->assertSame( $fixture, $GLOBALS[ self::ROUTES_GLOBAL ] );
	}

	/** Tests that a missing registry global does not error. */
	public function test_maybe_strip_chapters_editor_routes_missing_global_does_not_error() {
		unset( $GLOBALS[ self::ROUTES_GLOBAL ] );

		Admin_UI::maybe_strip_chapters_editor_routes();

		$this->assertArrayNotHasKey( self::ROUTES_GLOBAL, $GLOBALS );
	}

	/** Tests that an empty registry global does not error and stays empty. */
	public function test_maybe_strip_chapters_editor_routes_empty_global_does_not_error() {
		$GLOBALS[ self::ROUTES_GLOBAL ] = array();

		Admin_UI::maybe_strip_chapters_editor_routes();

		$this->assertSame( array(), $GLOBALS[ self::ROUTES_GLOBAL ] );
	}

	/** Tests that a non-array registry global is left untouched (graceful degradation). */
	public function test_maybe_strip_chapters_editor_routes_non_array_global_does_not_error() {
		$GLOBALS[ self::ROUTES_GLOBAL ] = 'not-an-array';

		Admin_UI::maybe_strip_chapters_editor_routes();

		$this->assertSame( 'not-an-array', $GLOBALS[ self::ROUTES_GLOBAL ] );
	}

	/**
	 * Runs the *real* generated registry through the stripper, rather than a
	 * fixture, so a rename of the route directory or of its declared `path`
	 * can't silently orphan CHAPTERS_EDITOR_ROUTE_PATHS — the failure mode
	 * that would leave the editor route registered with the gate off, with no
	 * other test noticing.
	 *
	 * Skipped when the package hasn't been built: `composer test-php` doesn't
	 * run the JS build, so `build/` is absent in the PHP-only CI job.
	 */
	public function test_generated_registry_contains_exactly_the_gated_editor_route() {
		$registry_path = __DIR__ . '/../../build/routes/registry.php';

		if ( ! file_exists( $registry_path ) ) {
			$this->markTestSkipped( 'build/routes/registry.php is absent; run `pnpm run build:wp-build` to exercise this test.' );
		}

		$registry = require $registry_path;

		// The gated path must actually exist in what the build generates.
		$this->assertSame(
			Admin_UI::CHAPTERS_EDITOR_ROUTE_PATHS,
			array_values( array_intersect( $this->get_paths( $registry ), Admin_UI::CHAPTERS_EDITOR_ROUTE_PATHS ) ),
			'The chapters editor route path is missing from the generated registry — the route was renamed and the gate no longer matches it.'
		);

		// …and stripping it must leave every other generated route registered.
		$stripped = Admin_UI::strip_chapters_editor_routes( $registry );

		$this->assertCount( count( $registry ) - 1, $stripped );
		$this->assertNotContains( '/video/$id/editor', $this->get_paths( $stripped ) );
	}
}
