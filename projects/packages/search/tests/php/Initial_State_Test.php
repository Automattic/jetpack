<?php
/**
 * Tests for the dashboard Initial_State class.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

use Automattic\Jetpack\Search\TestCase as Search_TestCase;
use PHPUnit\Framework\Attributes\CoversClass;

/**
 * @covers \Automattic\Jetpack\Search\Initial_State
 */
#[CoversClass( Initial_State::class )]
class Initial_State_Test extends Search_TestCase {

	/**
	 * Setting up the test.
	 */
	public function setUp(): void {
		parent::setUp();
		$this->unregister_guidelines_page();
	}

	/**
	 * Returning the environment into its initial state.
	 */
	public function tearDown(): void {
		remove_all_filters( 'jetpack_search_blocks_enabled' );
		$this->unregister_guidelines_page();
		parent::tearDown();
	}

	/**
	 * The flag must default to false when no filter is registered.
	 */
	public function test_search_blocks_enabled_defaults_false() {
		$state = ( new Initial_State() )->get_initial_state();
		$this->assertArrayHasKey( 'searchBlocksEnabled', $state['siteData'] );
		$this->assertFalse( $state['siteData']['searchBlocksEnabled'] );
	}

	/**
	 * The flag must be true when the filter returns true.
	 */
	public function test_search_blocks_enabled_reflects_filter() {
		add_filter( 'jetpack_search_blocks_enabled', '__return_true' );
		$state = ( new Initial_State() )->get_initial_state();
		$this->assertTrue( $state['siteData']['searchBlocksEnabled'] );
	}

	/**
	 * Test that the Reader Chat guidelines URL is empty when the page is unavailable.
	 */
	public function test_reader_chat_guidelines_url_is_empty_when_page_is_unavailable() {
		$state = ( new Initial_State() )->get_initial_state();

		$this->assertSame( '', $state['siteData']['readerChatGuidelinesUrl'] );
	}

	/**
	 * Test that the Reader Chat guidelines URL is included when the page is available.
	 */
	public function test_reader_chat_guidelines_url_is_included_when_page_is_available() {
		wp_set_current_user( $this->admin_id );
		add_options_page(
			'Guidelines',
			'Guidelines',
			'manage_options',
			'guidelines-wp-admin',
			'__return_null'
		);

		$state = ( new Initial_State() )->get_initial_state();

		$this->assertSame(
			admin_url( 'options-general.php?page=guidelines-wp-admin' ),
			$state['siteData']['readerChatGuidelinesUrl']
		);
	}

	/**
	 * Unregister the Guidelines admin page from the menu globals.
	 */
	private function unregister_guidelines_page() {
		global $_parent_pages, $_registered_pages, $submenu;

		if ( isset( $_parent_pages['guidelines-wp-admin'] ) ) {
			unset( $_parent_pages['guidelines-wp-admin'] );
		}

		$hookname = get_plugin_page_hookname( 'guidelines-wp-admin', 'options-general.php' );
		if ( isset( $_registered_pages[ $hookname ] ) ) {
			unset( $_registered_pages[ $hookname ] );
		}

		if ( ! isset( $submenu['options-general.php'] ) || ! is_array( $submenu['options-general.php'] ) ) {
			return;
		}

		foreach ( $submenu['options-general.php'] as $index => $submenu_item ) {
			if ( isset( $submenu_item[2] ) && 'guidelines-wp-admin' === $submenu_item[2] ) {
				unset( $submenu['options-general.php'][ $index ] );
			}
		}
	}
}
