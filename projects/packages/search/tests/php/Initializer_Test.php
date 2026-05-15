<?php
/**
 * Tests for the Initializer class.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

use Automattic\Jetpack\Search\TestCase as Search_TestCase;
use ReflectionMethod;

/**
 * Unit tests for the Initializer class.
 */
class Initializer_Test extends Search_TestCase {

	/**
	 * Returning the environment into its initial state.
	 */
	public function tearDown(): void {
		remove_all_filters( 'jetpack_search_blocks_enabled' );
		remove_all_filters( 'jetpack_search_woocommerce_blocks_enabled' );
		$this->remove_search_blocks_hooks();
		parent::tearDown();
	}

	public function test_init_fires_abort_action_when_package_filter_returns_false() {
		$abort_reasons = array();
		add_action(
			'jetpack_search_abort',
			function ( $reason ) use ( &$abort_reasons ) {
				$abort_reasons[] = $reason;
			}
		);
		add_filter( 'jetpack_search_init_search_package', '__return_false' );

		Initializer::init();

		remove_filter( 'jetpack_search_init_search_package', '__return_false' );

		$this->assertContains( 'jetpack_search_init_search_package_filter', $abort_reasons );
	}

	public function test_init_does_not_proceed_past_abort_when_filter_returns_false() {
		// Verify that init() bails early and never reaches is_connected() / is_search_supported(),
		// which would require a live connection.  We confirm by checking that no
		// additional abort actions fire (those come from later guard clauses).
		$reasons = array();
		add_action(
			'jetpack_search_abort',
			function ( $reason ) use ( &$reasons ) {
				$reasons[] = $reason;
			}
		);
		add_filter( 'jetpack_search_init_search_package', '__return_false' );

		Initializer::init();

		remove_filter( 'jetpack_search_init_search_package', '__return_false' );

		// Only the filter-abort reason should have fired.
		$this->assertSame( array( 'jetpack_search_init_search_package_filter' ), $reasons );
	}

	public function test_init_search_blocks_registers_when_feature_flag_on() {
		add_filter( 'jetpack_search_blocks_enabled', '__return_true' );

		$this->invoke_init_search_blocks();

		$this->assertNotFalse(
			has_action( 'init', array( Search_Blocks::class, 'register_blocks' ) ),
			'Search blocks should register when the Phase 1 feature flag is on. The connection + Search-plan gate is upstream in Initializer::init() and verified by the abort tests.'
		);
	}

	public function test_init_search_blocks_does_not_register_when_feature_flag_off() {
		// Feature flag defaults to false — no filter registered.
		$this->invoke_init_search_blocks();

		$this->assertFalse(
			has_action( 'init', array( Search_Blocks::class, 'register_blocks' ) ),
			'Search blocks should not register when the feature flag is off.'
		);
	}

	public function test_init_search_blocks_sets_woocommerce_blocks_gate_off_by_default_when_enabled() {
		// Verifies the Phase 1 default — opt-in sites get the non-WC subset
		// unless they re-enable WC blocks at a later priority.
		add_filter( 'jetpack_search_blocks_enabled', '__return_true' );

		$this->invoke_init_search_blocks();

		$this->assertFalse(
			(bool) apply_filters( 'jetpack_search_woocommerce_blocks_enabled', true ),
			'WC-only Search blocks should be disabled by default in Phase 1.'
		);
	}

	/**
	 * Invoke the protected `init_search_blocks()` directly so the gate can
	 * be exercised without running the rest of `init()` (rest_api_init,
	 * Dashboard, AI_Answers hooks that would leak across the test suite
	 * via the global `$wp_filter`).
	 */
	private function invoke_init_search_blocks(): void {
		$method = new ReflectionMethod( Initializer::class, 'init_search_blocks' );
		// setAccessible() became a no-op in 8.1 and was deprecated in 8.5,
		// but the package supports PHP 7.2+ where the call is still required
		// for ReflectionMethod::invoke() to reach a protected method.
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}
		$method->invoke( null );
	}

	/**
	 * Remove the hooks `Search_Blocks::init()` adds so they don't leak across
	 * tests via the global `$wp_filter`. Mirrors every `add_action` /
	 * `add_filter` in that method, including the four hooks cascaded by
	 * `Custom_Taxonomy_Slot_Mapping::init()`.
	 */
	private function remove_search_blocks_hooks(): void {
		remove_action( 'init', array( Search_Blocks::class, 'register_blocks' ) );
		remove_filter( 'block_categories_all', array( Search_Blocks::class, 'register_block_category' ) );
		remove_action( 'enqueue_block_editor_assets', array( Search_Blocks::class, 'enqueue_editor_assets' ) );
		remove_action( 'template_redirect', array( Search_Blocks::class, 'seed_interactivity_state' ) );
		remove_action( 'wp_enqueue_scripts', array( Search_Blocks::class, 'seed_interactivity_state' ) );
		remove_action( 'init', array( Custom_Taxonomy_Slot_Mapping::class, 'register_slot_taxonomies' ), 20 );
		remove_action( 'set_object_terms', array( Custom_Taxonomy_Slot_Mapping::class, 'mirror_assignment' ) );
		remove_action( 'deleted_term_relationships', array( Custom_Taxonomy_Slot_Mapping::class, 'mirror_removal' ) );
		remove_action( 'delete_term', array( Custom_Taxonomy_Slot_Mapping::class, 'mirror_deletion' ) );
	}
}
