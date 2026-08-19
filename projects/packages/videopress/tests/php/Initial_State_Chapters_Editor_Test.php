<?php
/**
 * Tests that Initial_State mirrors the chapters editor gate to the dashboard client.
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack\VideoPress;

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use WorDBless\BaseTestCase;

/**
 * The dashboard client reads the gate at `JPVIDEOPRESS_INITIAL_STATE.features.chaptersEditor`
 * (see `src/dashboard/utils/chapters-editor.ts`). A typo on either side of that key path
 * fails silently — the UI just stays hidden forever — so it is pinned here.
 */
class Initial_State_Chapters_Editor_Test extends BaseTestCase {

	/**
	 * Set up before each test.
	 *
	 * `get_data()` reaches WPCOM for the site's feature list and, on a
	 * disconnected site, for pricing. Short-circuit all HTTP so this test is
	 * hermetic and fast; both call sites already treat a WP_Error as "no data".
	 */
	public function set_up() {
		parent::set_up();
		add_filter( 'pre_http_request', array( $this, 'block_http' ), 10, 3 );
	}

	/**
	 * Tear down after each test.
	 *
	 * `get_data()` evaluates `Connection_Manager::is_connected()`, which memoizes
	 * its answer in a static that outlives the WorDBless database reset. Left
	 * warmed to "disconnected" it makes later suites that mock a connection fail,
	 * so drop it here.
	 */
	public function tear_down() {
		remove_filter( 'pre_http_request', array( $this, 'block_http' ), 10 );
		remove_all_filters( Admin_UI::CHAPTERS_EDITOR_FILTER );
		( new Connection_Manager() )->reset_connection_status();

		parent::tear_down();
	}

	/**
	 * Short-circuit every outbound HTTP request.
	 *
	 * @return \WP_Error
	 */
	public function block_http() {
		return new \WP_Error( 'no_http_in_tests', 'HTTP is blocked in this test.' );
	}

	/**
	 * Decode the payload `Initial_State::render()` inlines.
	 *
	 * @return array
	 */
	private function get_rendered_state() {
		$script = ( new Initial_State() )->render();

		$json = substr( $script, strlen( 'var JPVIDEOPRESS_INITIAL_STATE=' ), -1 );

		return json_decode( $json, true );
	}

	/** Tests that the gate is mirrored at the exact key path the client reads, and is off by default. */
	public function test_features_chapters_editor_is_false_by_default() {
		$state = $this->get_rendered_state();

		$this->assertIsArray( $state, 'Initial_State::render() did not produce decodable JSON.' );
		$this->assertArrayHasKey( 'features', $state );
		$this->assertArrayHasKey( 'chaptersEditor', $state['features'] );
		$this->assertFalse( $state['features']['chaptersEditor'] );
	}

	/** Tests that the mirrored value follows the filter, as a real JSON boolean. */
	public function test_features_chapters_editor_is_true_when_filter_enabled() {
		add_filter( Admin_UI::CHAPTERS_EDITOR_FILTER, '__return_true' );

		$state = $this->get_rendered_state();

		$this->assertTrue( $state['features']['chaptersEditor'] );
	}
}
