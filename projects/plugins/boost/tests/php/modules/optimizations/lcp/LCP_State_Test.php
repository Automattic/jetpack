<?php

namespace Automattic\Jetpack_Boost\Tests\Modules\Optimizations\Lcp;

use Automattic\Jetpack_Boost\Modules\Optimizations\Lcp\LCP_State;
use Brain\Monkey\Functions;
use Mockery;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunTestsInSeparateProcesses;
use PHPUnit\Framework\TestCase;

/**
 * @runTestsInSeparateProcesses
 * @preserveGlobalState disabled
 */
#[RunTestsInSeparateProcesses]
#[PreserveGlobalState( false )]
class LCP_State_Test extends TestCase {

	/**
	 * The value handed to jetpack_boost_ds_set() by save(), captured for assertions.
	 *
	 * @var array|null
	 */
	private $stored;

	public function setUp(): void {
		parent::setUp();
		\Brain\Monkey\setUp();

		$this->stored = null;

		// LCP_State::__construct() reads the current option; start from an empty state.
		Functions\when( 'jetpack_boost_ds_get' )->justReturn( array() );
		// Capture what save() persists.
		Functions\when( 'jetpack_boost_ds_set' )->alias(
			function ( $_key, $value ) {
				$this->stored = $value;
			}
		);
	}

	public function tearDown(): void {
		Mockery::close();
		\Brain\Monkey\tearDown();
		parent::tearDown();
	}

	/**
	 * BOOST-604: two provider-data entries that share a key (the homepage-in-custom-list collision)
	 * used to reach save() with the duplicate lacking a `status`, because set_pending_pages() only
	 * marks the first key match. The statusless page failed the lcp_state schema, and WP_JS_Data_Sync
	 * silently stored the `{ pages: [], status: 'not_analyzed' }` fallback. set_pages() must now give
	 * every entry a default status so the persisted state keeps the pending pages.
	 */
	public function test_write_path_persists_pending_pages_even_with_duplicate_keys() {
		// prepare_provider_data() output carries only key + url (no status). Two entries share a key.
		$pages = array(
			array(
				'key' => 'cornerstone_d41d8cd9',
				'url' => 'https://example.com',
			),
			array(
				'key' => 'cornerstone_d41d8cd9',
				'url' => 'https://example.com/',
			),
			array(
				'key' => 'cornerstone_2b1c4d5e',
				'url' => 'https://example.com/about',
			),
		);

		$state = new LCP_State();
		$state
			->prepare_request()
			->set_pages( $pages )
			->set_pending_pages( $pages )
			->save();

		$stored = $this->stored;
		$this->assertIsArray( $stored, 'save() must persist a state array.' );
		if ( ! is_array( $stored ) ) {
			return; // Unreachable after assertIsArray; narrows the type for static analysis.
		}

		// The state is NOT the not_analyzed fallback: pending pages are preserved.
		$this->assertSame( 'pending', $stored['status'] );
		$this->assertCount( 3, $stored['pages'] );

		// Every page carries a status, including the duplicate that set_pending_pages() skips.
		foreach ( $stored['pages'] as $page ) {
			$this->assertArrayHasKey( 'status', $page, 'Every page must have a status or the schema rejects the write.' );
			$this->assertSame( 'pending', $page['status'] );
		}
	}

	/**
	 * A status that already exists (e.g. a page carried over from a previous run via
	 * start_partial_analysis()) must not be clobbered by set_pages().
	 */
	public function test_set_pages_preserves_existing_status() {
		$pages = array(
			array(
				'key'    => 'cornerstone_abc',
				'url'    => 'https://example.com/one',
				'status' => 'success',
			),
			array(
				'key' => 'cornerstone_def',
				'url' => 'https://example.com/two',
			),
		);

		$state = new LCP_State();
		$state->prepare_request()->set_pages( $pages );

		$result = $state->get_pages();

		$this->assertSame( 'success', $result[0]['status'], 'An existing status must be preserved.' );
		$this->assertSame( 'pending', $result[1]['status'], 'A missing status defaults to pending.' );
	}
}
