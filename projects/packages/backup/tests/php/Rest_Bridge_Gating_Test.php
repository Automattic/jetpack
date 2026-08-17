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
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;
use WP_Error;
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

	/**
	 * `named_types()` is the PHP half of the shared `types` contract, used
	 * by both the download and restore bridges.
	 *
	 * It exists because WordPress validates `'type' => 'object'` with
	 * `rest_is_object()`, which is `is_array()` — so a JSON list reaches
	 * the callback intact and WPCOM reads its numeric keys as category
	 * names. Rebuilding from named keys is what makes the object form a
	 * guarantee rather than a convention.
	 *
	 * @param string $label    Case description.
	 * @param mixed  $input    Raw `types` parameter.
	 * @param array  $expected Expected named map.
	 * @dataProvider provide_types
	 */
	#[DataProvider( 'provide_types' )]
	public function test_named_types( $label, $input, $expected ) {
		$this->assertSame( $expected, Rest_Controller::named_types( $input ), $label );
	}

	/**
	 * @return array<string, array{0: string, 1: mixed, 2: array}>
	 */
	public static function provide_types() {
		return array(
			'keeps selected, drops unselected' => array(
				'keeps selected, drops unselected',
				array(
					'themes'  => true,
					'plugins' => false,
					'sqls'    => true,
				),
				array(
					'themes' => true,
					'sqls'   => true,
				),
			),
			'normalises truthy values to true' => array(
				'normalises truthy values to true',
				array( 'themes' => '1' ),
				array( 'themes' => true ),
			),
			'reads "false" and "0" as skip'    => array(
				'reads "false" and "0" as skip',
				array(
					'themes'  => 'false',
					'plugins' => '0',
				),
				array(),
			),
			'drops a list of names'            => array(
				'drops a list of names',
				array( 'themes', 'plugins' ),
				array(),
			),
			'drops a list of booleans'         => array(
				'drops a list of booleans',
				array( true, false ),
				array(),
			),
			'empty array'                      => array( 'empty array', array(), array() ),
			'null'                             => array( 'null', null, array() ),
			'scalar'                           => array( 'scalar', 'themes', array() ),
			'object'                           => array(
				'object',
				(object) array( 'themes' => true ),
				array( 'themes' => true ),
			),
		);
	}

	/**
	 * `types_name_nothing()` separates "asked for everything" from
	 * "asked for nothing", which are one byte apart on the wire and
	 * opposite in effect.
	 *
	 * An absent `types` is upstream's spelling of every category, so it
	 * must stay allowed. A supplied `types` that survives into nothing is
	 * a caller who tried to name categories and named none — forwarding
	 * that as an omission turns "restore nothing" into "restore
	 * everything" against a live site.
	 *
	 * @param string $label    Case description.
	 * @param mixed  $input    Raw `types` parameter.
	 * @param bool   $expected Whether the parameter names nothing.
	 * @dataProvider provide_empty_type_selections
	 */
	#[DataProvider( 'provide_empty_type_selections' )]
	public function test_types_name_nothing( $label, $input, $expected ) {
		$this->assertSame( $expected, Rest_Controller::types_name_nothing( $input ), $label );
	}

	/**
	 * @return array<string, array{0: string, 1: mixed, 2: bool}>
	 */
	public static function provide_empty_type_selections() {
		return array(
			// The one case that must NOT be refused.
			'absent'             => array( 'absent', null, false ),
			'names one category' => array( 'names one', array( 'themes' => true ), false ),
			'empty object'       => array( 'empty object', array(), true ),
			'every value false'  => array( 'every value false', array( 'themes' => false ), true ),
			'form-encoded false' => array( 'form-encoded false', array( 'themes' => '0' ), true ),
			// The shape the route schema cannot reject, because it
			// constrains values rather than shape.
			'list of booleans'   => array( 'list of booleans', array( true, false ), true ),
			'list of names'      => array( 'list of names', array( 'themes' ), true ),
			'scalar'             => array( 'scalar', 'themes', true ),
		);
	}

	/**
	 * A transport failure is reported as a bridge error, not forwarded.
	 *
	 * The HTTP client answers with a `WP_Error` when the request never
	 * reached WPCOM. Returning that unchanged put cURL's own text on
	 * screen — the dashboard renders `error.message` verbatim — and left
	 * it without a `status`, so core called a reachability problem a 500.
	 */
	public function test_transport_error_replaces_the_raw_message() {
		$raw = new WP_Error(
			'http_request_failed',
			'cURL error 28: Operation timed out after 10001 milliseconds with 0 bytes received'
		);

		$wrapped = Rest_Controller::transport_error( $raw, 'capabilities_fetch_failed' );

		$this->assertSame( 'capabilities_fetch_failed', $wrapped->get_error_code() );
		$this->assertStringNotContainsString( 'cURL', $wrapped->get_error_message() );
		$this->assertSame( 502, $wrapped->get_error_data()['status'] );
	}

	/**
	 * The raw text survives for support, one level down.
	 *
	 * It is the only part of a transport failure anyone can act on, so it
	 * is moved rather than dropped — the same reason the non-200 branches
	 * forward WPCOM's status instead of flattening it.
	 */
	public function test_transport_error_keeps_the_original_for_support() {
		$raw = new WP_Error( 'http_request_failed', 'cURL error 6: Could not resolve host' );

		$data = Rest_Controller::transport_error( $raw, 'activity_log_fetch_failed' )->get_error_data();

		$this->assertSame( 'http_request_failed', $data['transport']['code'] );
		$this->assertSame( 'cURL error 6: Could not resolve host', $data['transport']['message'] );
	}
}
