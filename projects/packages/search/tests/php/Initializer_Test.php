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
		remove_all_filters( 'jetpack_search_overlay_block_template_enabled' );
		remove_all_filters( 'jetpack_search_init_instant_search' );
		remove_all_filters( 'jetpack_search_classic_search_enabled' );
		delete_option( Module_Control::SEARCH_MODULE_EXPERIENCE_OPTION_KEY );
		$this->reset_block_search_active();
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
		// The flag defaults to true, so opt out explicitly to exercise the
		// kill-switch path.
		add_filter( 'jetpack_search_blocks_enabled', '__return_false' );

		$this->invoke_init_search_blocks();

		$this->assertFalse(
			has_action( 'init', array( Search_Blocks::class, 'register_blocks' ) ),
			'Search blocks should not register when the feature flag is off.'
		);
	}

	public function test_init_search_blocks_does_not_activate_overlay_when_blocks_gate_off() {
		// The overlay carve-out in `init()` must read the actually-wired-up
		// flag, not just the overlay filter — otherwise flipping the
		// overlay filter on a site without the blocks gate would bypass
		// the abort path. Confirms `$block_search_active` stays
		// false when the blocks gate is off, regardless of the overlay
		// filter.
		add_filter( 'jetpack_search_overlay_block_template_enabled', '__return_true' );
		// The flag defaults to true, so opt out explicitly to keep the
		// blocks gate off for this carve-out check.
		add_filter( 'jetpack_search_blocks_enabled', '__return_false' );

		$this->invoke_init_search_blocks();

		$property = new \ReflectionProperty( Initializer::class, 'block_search_active' );
		if ( PHP_VERSION_ID < 80100 ) {
			$property->setAccessible( true );
		}
		$this->assertFalse(
			$property->getValue(),
			'Overlay must not register as active when the blocks gate is off, even if the overlay filter is on.'
		);
		$this->assertFalse(
			has_filter( 'jetpack_search_init_instant_search', '__return_false' ),
			'The legacy-suppress filter must not be added when the overlay gate is bypassed by the blocks gate.'
		);
	}

	public function test_init_search_blocks_activates_overlay_when_both_gates_on_and_experience_matches() {
		add_filter( 'jetpack_search_blocks_enabled', '__return_true' );
		add_filter( 'jetpack_search_overlay_block_template_enabled', '__return_true' );
		// The runtime swap also requires the site owner to have selected the
		// new overlay experience in the dashboard. Without it, the operator-
		// level filter is a no-op so the legacy and new overlays can coexist.
		update_option( Module_Control::SEARCH_MODULE_EXPERIENCE_OPTION_KEY, Module_Control::EXPERIENCE_OVERLAY_BLOCKS );
		// `get_experience()` short-circuits to `off` if the module is not
		// active, so flip the module on for the duration of this test.
		( new \Automattic\Jetpack\Modules() )->activate( Module_Control::JETPACK_SEARCH_MODULE_SLUG, false, false );

		$this->invoke_init_search_blocks();

		$property = new \ReflectionProperty( Initializer::class, 'block_search_active' );
		if ( PHP_VERSION_ID < 80100 ) {
			$property->setAccessible( true );
		}
		$this->assertTrue(
			$property->getValue(),
			'Overlay must register as active when both gates are on AND the user has selected the new overlay experience.'
		);
		$this->assertSame(
			10,
			has_filter( 'jetpack_search_init_instant_search', '__return_false' ),
			'The legacy-suppress filter must be added when both gates are on and the experience matches.'
		);

		( new \Automattic\Jetpack\Modules() )->deactivate( Module_Control::JETPACK_SEARCH_MODULE_SLUG );
	}

	public function test_init_search_blocks_does_not_activate_overlay_when_experience_does_not_match() {
		// Operator opted in via the filter, but the site owner left the
		// experience selector on the legacy Overlay. The runtime must stay
		// on the legacy path so the two cards remain switchable without
		// touching any server-side filter.
		add_filter( 'jetpack_search_blocks_enabled', '__return_true' );
		add_filter( 'jetpack_search_overlay_block_template_enabled', '__return_true' );
		update_option( Module_Control::SEARCH_MODULE_EXPERIENCE_OPTION_KEY, Module_Control::EXPERIENCE_OVERLAY );
		( new \Automattic\Jetpack\Modules() )->activate( Module_Control::JETPACK_SEARCH_MODULE_SLUG, false, false );

		$this->invoke_init_search_blocks();

		$property = new \ReflectionProperty( Initializer::class, 'block_search_active' );
		if ( PHP_VERSION_ID < 80100 ) {
			$property->setAccessible( true );
		}
		$this->assertFalse(
			$property->getValue(),
			'Overlay must stay off when the user has chosen the legacy Overlay experience, even with both filters on.'
		);
		$this->assertFalse(
			has_filter( 'jetpack_search_init_instant_search', '__return_false' ),
			'The legacy-suppress filter must not be added when the user has chosen the legacy Overlay.'
		);

		( new \Automattic\Jetpack\Modules() )->deactivate( Module_Control::JETPACK_SEARCH_MODULE_SLUG );
	}

	public function test_init_search_blocks_does_not_activate_overlay_when_overlay_gate_off() {
		add_filter( 'jetpack_search_blocks_enabled', '__return_true' );
		// `jetpack_search_overlay_block_template_enabled` defaults true since
		// the Beta release; pin it back to false here so this test exercises
		// the operator-opt-out path that is the point of this test.
		add_filter( 'jetpack_search_overlay_block_template_enabled', '__return_false' );

		$this->invoke_init_search_blocks();

		$property = new \ReflectionProperty( Initializer::class, 'block_search_active' );
		if ( PHP_VERSION_ID < 80100 ) {
			$property->setAccessible( true );
		}
		$this->assertFalse(
			$property->getValue(),
			'Overlay must not register as active when only the blocks gate is on.'
		);
		$this->assertFalse(
			has_filter( 'jetpack_search_init_instant_search', '__return_false' ),
			'The legacy-suppress filter must not be added when the overlay gate is off.'
		);
	}

	public function test_init_search_blocks_does_not_override_woocommerce_blocks_gate() {
		// The WC blocks follow WooCommerce's active state — the initializer no
		// longer forces the `jetpack_search_woocommerce_blocks_enabled` gate
		// either way, leaving it a pass-through over the
		// `class_exists( 'WooCommerce', false )` probe.
		add_filter( 'jetpack_search_blocks_enabled', '__return_true' );

		$this->invoke_init_search_blocks();

		$this->assertFalse(
			has_filter( 'jetpack_search_woocommerce_blocks_enabled' ),
			'init_search_blocks() must not register a WC-gate override; the gate follows the WooCommerce probe.'
		);
	}

	public function test_init_search_blocks_suppresses_classic_search_when_embedded() {
		add_filter( 'jetpack_search_blocks_enabled', '__return_true' );
		update_option( Module_Control::SEARCH_MODULE_EXPERIENCE_OPTION_KEY, Module_Control::EXPERIENCE_EMBEDDED );
		( new \Automattic\Jetpack\Modules() )->activate( Module_Control::JETPACK_SEARCH_MODULE_SLUG, false, false );

		$this->invoke_init_search_blocks();

		$this->assertSame(
			10,
			has_filter( 'jetpack_search_classic_search_enabled', '__return_false' ),
			'Classic Search must be suppressed on the Embedded experience so it does not run a server-side ES query.'
		);
		$property = new \ReflectionProperty( Initializer::class, 'block_search_active' );
		if ( PHP_VERSION_ID < 80100 ) {
			$property->setAccessible( true );
		}
		$this->assertTrue( $property->getValue(), 'block_search_active must be set so init() does not abort on Embedded.' );
		$this->assertFalse(
			has_filter( 'jetpack_search_init_instant_search', '__return_false' ),
			'Embedded never enables Instant Search, so the legacy-suppress filter must not be added.'
		);

		( new \Automattic\Jetpack\Modules() )->deactivate( Module_Control::JETPACK_SEARCH_MODULE_SLUG );
	}

	public function test_init_search_blocks_suppresses_classic_search_when_overlay_blocks() {
		add_filter( 'jetpack_search_blocks_enabled', '__return_true' );
		add_filter( 'jetpack_search_overlay_block_template_enabled', '__return_true' );
		update_option( Module_Control::SEARCH_MODULE_EXPERIENCE_OPTION_KEY, Module_Control::EXPERIENCE_OVERLAY_BLOCKS );
		( new \Automattic\Jetpack\Modules() )->activate( Module_Control::JETPACK_SEARCH_MODULE_SLUG, false, false );

		$this->invoke_init_search_blocks();

		$this->assertSame(
			10,
			has_filter( 'jetpack_search_classic_search_enabled', '__return_false' ),
			'Classic Search must be suppressed on the blocks Overlay experience.'
		);

		( new \Automattic\Jetpack\Modules() )->deactivate( Module_Control::JETPACK_SEARCH_MODULE_SLUG );
	}

	public function test_init_search_blocks_keeps_classic_search_for_theme_search() {
		// Blocks enabled but no embedded/overlay experience: Theme search must
		// keep Classic Search running so the server still renders results.
		add_filter( 'jetpack_search_blocks_enabled', '__return_true' );
		delete_option( Module_Control::SEARCH_MODULE_EXPERIENCE_OPTION_KEY );
		( new \Automattic\Jetpack\Modules() )->activate( Module_Control::JETPACK_SEARCH_MODULE_SLUG, false, false );

		$this->invoke_init_search_blocks();

		$this->assertFalse(
			has_filter( 'jetpack_search_classic_search_enabled', '__return_false' ),
			'Classic Search must keep running on Theme search (no blocks-driven experience selected).'
		);
		$property = new \ReflectionProperty( Initializer::class, 'block_search_active' );
		if ( PHP_VERSION_ID < 80100 ) {
			$property->setAccessible( true );
		}
		$this->assertFalse( $property->getValue(), 'block_search_active must stay false for Theme search.' );

		( new \Automattic\Jetpack\Modules() )->deactivate( Module_Control::JETPACK_SEARCH_MODULE_SLUG );
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
	 * Reset the private `$block_search_active` flag between
	 * tests so the overlay carve-out can be exercised cleanly across
	 * cases. Uses reflection because the property is package-private —
	 * intentionally not part of the public surface, but tests own it.
	 */
	private function reset_block_search_active(): void {
		$property = new \ReflectionProperty( Initializer::class, 'block_search_active' );
		if ( PHP_VERSION_ID < 80100 ) {
			$property->setAccessible( true );
		}
		$property->setValue( null, false );
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
