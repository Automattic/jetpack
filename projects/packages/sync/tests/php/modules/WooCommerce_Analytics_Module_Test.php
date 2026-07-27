<?php
/**
 * Test file for Automattic\Jetpack\Sync\Modules\WooCommerce_Analytics
 *
 * @package automattic/jetpack-sync
 */

namespace Automattic\Jetpack\Sync;

use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;

/**
 * Class WooCommerce_Analytics_Module_Test
 *
 * Covers the public module contract that does not require a WooCommerce runtime.
 *
 * @covers Automattic\Jetpack\Sync\Modules\WooCommerce_Analytics
 */
#[CoversClass( Modules\WooCommerce_Analytics::class )]
class WooCommerce_Analytics_Module_Test extends BaseTestCase {

	/**
	 * The module instance.
	 *
	 * @var Modules\WooCommerce_Analytics
	 */
	private $module;

	/**
	 * Runs once before the tests. Loads the OrderAttributionMeta stub so the module
	 * class (which composes that WooCommerce trait) can be autoloaded without
	 * WooCommerce present.
	 */
	public static function setUpBeforeClass(): void {
		parent::setUpBeforeClass();
		require_once __DIR__ . '/../stubs/trait-order-attribution-meta.php';
	}

	/**
	 * Runs before every test in this class.
	 */
	protected function setUp(): void {
		parent::setUp();
		$this->module = new Modules\WooCommerce_Analytics();
	}

	/**
	 * The module name is a cross-repo contract (WPCOM dispatcher, Premium Analytics
	 * tracker and JS, Woo AI). It must never change.
	 */
	public function test_name_is_the_public_contract() {
		$this->assertSame( 'woocommerce_analytics', $this->module->name() );
	}

	/**
	 * Full sync action name is likewise consumed by the WPCOM receiving side.
	 */
	public function test_full_sync_actions() {
		$this->assertSame( array( 'jetpack_full_sync_woocommerce_analytics' ), $this->module->get_full_sync_actions() );
	}

	/**
	 * The module reads from the order stats table keyed by order_id.
	 */
	public function test_table_and_id_field() {
		global $wpdb;
		$this->assertSame( $wpdb->prefix . 'wc_order_stats', $this->module->table() );
		$this->assertSame( 'order_id', $this->module->id_field() );
	}

	/**
	 * Unsupported object types are rejected.
	 */
	public function test_get_objects_by_id_rejects_unsupported_types() {
		$this->assertSame( array(), $this->module->get_objects_by_id( 'coupon', array( 1, 2 ) ) );
		$this->assertSame( array(), $this->module->get_objects_by_id( 'order', array() ) );
		$this->assertFalse( $this->module->get_object_by_id( 'not_a_type', 1 ) );
	}

	/**
	 * The expand_data handler unwraps the first hook argument and rejects malformed input.
	 */
	public function test_expand_data() {
		$this->assertFalse( $this->module->expand_data( 'not-an-array' ) );
		$this->assertFalse( $this->module->expand_data( array() ) );
		$this->assertSame( array( 'id' => 5 ), $this->module->expand_data( array( array( 'id' => 5 ) ) ) );
	}

	/**
	 * The size filter always lets the first object through, then stops at the cap.
	 */
	public function test_filter_analytics_objects_by_size_always_allows_first_object() {
		$oversized = array( 10 => str_repeat( 'x', Modules\Module::MAX_SIZE_FULL_SYNC + 1 ) );

		list( $ids, $objects ) = $this->module->filter_analytics_objects_by_size( $oversized );

		$this->assertSame( array( 10 ), $ids );
		$this->assertSame( $oversized, $objects );
	}

	/**
	 * Objects past the size cap are dropped, preserving order.
	 */
	public function test_filter_analytics_objects_by_size_enforces_cap() {
		$half    = str_repeat( 'x', (int) ( Modules\Module::MAX_SIZE_FULL_SYNC * 0.6 ) );
		$objects = array(
			1 => $half,
			2 => $half,
			3 => 'small',
		);

		list( $ids, $filtered ) = $this->module->filter_analytics_objects_by_size( $objects );

		$this->assertSame( array( 1 ), $ids );
		$this->assertSame( array( 1 => $half ), $filtered );
	}
}
