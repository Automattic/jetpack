<?php
/**
 * Tests for the Studio feature-flag plumbing in Admin_UI.
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack;

use Automattic\Jetpack\VideoPress\Admin_UI;
use WorDBless\BaseTestCase;

/**
 * Test suite for Admin_UI::is_studio_enabled() and the Studio route stripping.
 */
class Admin_UI_Studio_Test extends BaseTestCase {

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
		remove_all_filters( Admin_UI::STUDIO_FILTER );
		unset( $GLOBALS[ self::ROUTES_GLOBAL ] );
	}

	/**
	 * Build a fixture registry mirroring build/routes/registry.php, with the
	 * Studio routes appended.
	 *
	 * @return array
	 */
	private function get_fixture_routes() {
		$paths = array_merge(
			array( '/library', '/', '/settings', '/video/$id' ),
			Admin_UI::STUDIO_ROUTE_PATHS
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

	/** Tests that the Studio filter defaults to off. */
	public function test_is_studio_enabled_defaults_to_false() {
		$this->assertFalse( Admin_UI::is_studio_enabled() );
	}

	/** Tests that the Studio filter enables the feature when it returns true. */
	public function test_is_studio_enabled_true_when_filter_enabled() {
		add_filter( Admin_UI::STUDIO_FILTER, '__return_true' );

		$this->assertTrue( Admin_UI::is_studio_enabled() );
	}

	/** Tests that strip_studio_routes() removes exactly the Studio paths. */
	public function test_strip_studio_routes_removes_exactly_studio_paths() {
		$fixture  = $this->get_fixture_routes();
		$stripped = Admin_UI::strip_studio_routes( $fixture );

		$this->assertCount( count( $fixture ) - count( Admin_UI::STUDIO_ROUTE_PATHS ), $stripped );
		$this->assertSame( array( '/library', '/', '/settings', '/video/$id' ), $this->get_paths( $stripped ) );
	}

	/** Tests that strip_studio_routes() keeps entries without a path key. */
	public function test_strip_studio_routes_keeps_entries_without_path() {
		$stripped = Admin_UI::strip_studio_routes( array( array( 'name' => 'pathless' ) ) );

		$this->assertSame( array( array( 'name' => 'pathless' ) ), $stripped );
	}

	/** Tests that the registry global loses the Studio routes when the filter is off. */
	public function test_maybe_strip_studio_routes_strips_global_when_off() {
		$GLOBALS[ self::ROUTES_GLOBAL ] = $this->get_fixture_routes();

		Admin_UI::maybe_strip_studio_routes();

		$this->assertSame( array( '/library', '/', '/settings', '/video/$id' ), $this->get_paths( $GLOBALS[ self::ROUTES_GLOBAL ] ) );
	}

	/** Tests that the registry global is left untouched when the filter is on. */
	public function test_maybe_strip_studio_routes_leaves_global_untouched_when_on() {
		add_filter( Admin_UI::STUDIO_FILTER, '__return_true' );

		$fixture                        = $this->get_fixture_routes();
		$GLOBALS[ self::ROUTES_GLOBAL ] = $fixture;

		Admin_UI::maybe_strip_studio_routes();

		$this->assertSame( $fixture, $GLOBALS[ self::ROUTES_GLOBAL ] );
	}

	/** Tests that a missing registry global does not error. */
	public function test_maybe_strip_studio_routes_missing_global_does_not_error() {
		unset( $GLOBALS[ self::ROUTES_GLOBAL ] );

		Admin_UI::maybe_strip_studio_routes();

		$this->assertArrayNotHasKey( self::ROUTES_GLOBAL, $GLOBALS );
	}

	/** Tests that an empty registry global does not error and stays empty. */
	public function test_maybe_strip_studio_routes_empty_global_does_not_error() {
		$GLOBALS[ self::ROUTES_GLOBAL ] = array();

		Admin_UI::maybe_strip_studio_routes();

		$this->assertSame( array(), $GLOBALS[ self::ROUTES_GLOBAL ] );
	}

	/** Tests that a non-array registry global is left untouched (graceful degradation). */
	public function test_maybe_strip_studio_routes_non_array_global_does_not_error() {
		$GLOBALS[ self::ROUTES_GLOBAL ] = 'not-an-array';

		Admin_UI::maybe_strip_studio_routes();

		$this->assertSame( 'not-an-array', $GLOBALS[ self::ROUTES_GLOBAL ] );
	}
}
