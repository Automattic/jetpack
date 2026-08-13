<?php
/**
 * Unit tests for the modernization gating around the dashboard's REST bridges.
 *
 * Named for the bridges rather than the controller: a `Rest_Controller_Test`
 * here would differ only in case from this package's existing
 * `REST_Controller_Test` (the legacy `V0005\REST_Controller`), which breaks
 * checkouts on case-insensitive filesystems.
 *
 * @package automattic/jetpack-backup-plugin
 */

namespace Automattic\Jetpack\Backup\V0005\REST;

use Automattic\Jetpack\Backup\V0005\Jetpack_Backup;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;
use WP_REST_Server;
use function add_action;
use function add_filter;
use function do_action;
use function remove_action;
use function remove_filter;

/**
 * Tests that the modernization filter is the only thing standing between
 * the legacy plugin and the eight new bridge routes.
 *
 * The rest of the suite exercises each bridge with the filter forced on,
 * so nothing there would notice if the gate stopped working. These two
 * tests are the ones that would.
 *
 * @covers \Automattic\Jetpack\Backup\V0005\REST\Rest_Controller
 */
#[CoversClass( Rest_Controller::class )]
class Rest_Bridge_Gating_Test extends TestCase {

	/**
	 * Every route the modernized dashboard adds, in `get_routes()` key form.
	 *
	 * @var string[]
	 */
	private const MODERNIZED_ROUTES = array(
		'/jetpack/v4/site/capabilities',
		'/jetpack/v4/site/rewindable-activity',
		'/jetpack/v4/rewind/backup/ls',
		'/jetpack/v4/rewind/backup/file-content',
		'/jetpack/v4/backups/download/(?P<rewind_id>[A-Za-z0-9.\-]+)',
		'/jetpack/v4/backups/download/(?P<rewind_id>[A-Za-z0-9.\-]+)/status',
		'/jetpack/v4/rewind/to/(?P<rewind_id>[A-Za-z0-9.\-]+)',
		'/jetpack/v4/rewind/restore/(?P<restore_id>\d+)/status',
	);

	/**
	 * Run `rest_api_init` against a fresh server, with the modernization
	 * filter either on or off, and return the resulting route keys.
	 *
	 * @param bool $modernized Whether to enable the modernization filter.
	 * @return string[] Registered route keys.
	 */
	private function collect_routes( $modernized ) {
		global $wp_rest_server;
		$wp_rest_server = new WP_REST_Server();

		if ( $modernized ) {
			add_filter( Jetpack_Backup::MODERNIZATION_FILTER, '__return_true' );
		}

		add_action( 'rest_api_init', array( Rest_Controller::class, 'register_routes' ) );
		do_action( 'rest_api_init' );
		remove_action( 'rest_api_init', array( Rest_Controller::class, 'register_routes' ) );

		if ( $modernized ) {
			remove_filter( Jetpack_Backup::MODERNIZATION_FILTER, '__return_true' );
		}

		return array_keys( $wp_rest_server->get_routes() );
	}

	/**
	 * With the filter off — the default — none of the bridge routes exist.
	 */
	public function test_registers_no_routes_when_not_modernized() {
		$routes = $this->collect_routes( false );

		foreach ( self::MODERNIZED_ROUTES as $route ) {
			$this->assertNotContains(
				$route,
				$routes,
				"$route must not be registered while the modernization filter is off."
			);
		}
	}

	/**
	 * With the filter on, every bridge route registers — and nothing else
	 * does. Diffing the two route sets means a future route added outside
	 * `Rest_Controller::register_routes()`'s gate fails here rather than
	 * shipping silently to sites running with the flag off.
	 */
	public function test_registers_exactly_the_bridge_routes_when_modernized() {
		$added = array_values(
			array_diff( $this->collect_routes( true ), $this->collect_routes( false ) )
		);

		sort( $added );
		$expected = self::MODERNIZED_ROUTES;
		sort( $expected );

		$this->assertSame( $expected, $added );
	}
}
