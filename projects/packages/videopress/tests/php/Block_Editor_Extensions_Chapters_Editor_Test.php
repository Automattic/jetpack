<?php
/**
 * Tests that Block_Editor_Extensions mirrors the chapters editor gate to the block editor.
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack\VideoPress;

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use WorDBless\BaseTestCase;

/**
 * The block editor client reads the gate at `window.videoPressEditorState.chaptersEditorEnabled`
 * (see `src/client/lib/chapters-editor/index.ts`). Two things are silent if they drift:
 * the key name, and the fact that `wp_localize_script()` stringifies scalars — so the
 * client matches `'1'`, not `true`. Both are pinned here.
 */
class Block_Editor_Extensions_Chapters_Editor_Test extends BaseTestCase {

	/**
	 * Script handle the payload is localized onto.
	 *
	 * @var string
	 */
	const HANDLE = 'test-videopress-block-editor';

	/**
	 * The handle Block_Editor_Extensions was configured with before this test.
	 *
	 * @var string
	 */
	private $previous_handle = '';

	/**
	 * Register a stand-in script so wp_localize_script() has something to attach to.
	 */
	public function set_up() {
		parent::set_up();

		$this->previous_handle                  = Block_Editor_Extensions::$script_handle;
		Block_Editor_Extensions::$script_handle = self::HANDLE;

		wp_register_script( self::HANDLE, 'https://example.org/test.js', array(), '1.0', true );
	}

	/**
	 * Tear down after each test.
	 *
	 * `enqueue_extensions()` renders the connection initial state, which memoizes
	 * `Connection_Manager::is_connected()` in a static that outlives the WorDBless
	 * database reset. Left warmed to "disconnected" it makes later suites that
	 * mock a connection fail, so drop it here.
	 */
	public function tear_down() {
		wp_deregister_script( self::HANDLE );
		Block_Editor_Extensions::$script_handle = $this->previous_handle;
		remove_all_filters( Admin_UI::CHAPTERS_EDITOR_FILTER );
		( new Connection_Manager() )->reset_connection_status();

		parent::tear_down();
	}

	/**
	 * Run the localization and decode what `videoPressEditorState` ends up as.
	 *
	 * @return array
	 */
	private function get_localized_state() {
		Block_Editor_Extensions::enqueue_extensions();

		$data = wp_scripts()->get_data( self::HANDLE, 'data' );

		// wp_localize_script() emits `var videoPressEditorState = {...};`.
		preg_match( '/var videoPressEditorState = (.*);/', (string) $data, $matches );

		return json_decode( $matches[1], true );
	}

	/** Tests that the gate is mirrored at the exact key the client reads, empty-string-false by default. */
	public function test_chapters_editor_enabled_is_empty_string_by_default() {
		$state = $this->get_localized_state();

		$this->assertIsArray( $state, 'videoPressEditorState was not localized as decodable JSON.' );
		$this->assertArrayHasKey( 'chaptersEditorEnabled', $state );

		// Not `false`: wp_localize_script() casts scalars to strings. The client
		// matches `'1'` exactly, so anything falsy-but-not-'1' reads as disabled.
		$this->assertSame( '', $state['chaptersEditorEnabled'] );
	}

	/** Tests that the filter flips the mirrored value to the '1' the client matches on. */
	public function test_chapters_editor_enabled_is_one_when_filter_enabled() {
		add_filter( Admin_UI::CHAPTERS_EDITOR_FILTER, '__return_true' );

		$state = $this->get_localized_state();

		$this->assertSame( '1', $state['chaptersEditorEnabled'] );
	}
}
