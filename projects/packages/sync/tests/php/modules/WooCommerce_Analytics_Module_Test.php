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
		require_once __DIR__ . '/../stubs/class-wc-datetime.php';
		require_once __DIR__ . '/../stubs/woocommerce-analytics-functions.php';
	}

	/**
	 * Runs before every test in this class.
	 */
	protected function setUp(): void {
		parent::setUp();
		$this->module = new Modules\WooCommerce_Analytics();
	}

	/**
	 * Runs after every test in this class.
	 */
	protected function tearDown(): void {
		remove_filter( 'jetpack_sync_options_whitelist', array( $this->module, 'add_woocommerce_analytics_options_whitelist' ), 10 );
		remove_filter( 'jetpack_sync_post_meta_whitelist', array( $this->module, 'add_woocommerce_analytics_post_meta_whitelist' ), 10 );
		parent::tearDown();
	}

	/**
	 * The module registers its minimum data requirements.
	 */
	public function test_registers_minimum_data_requirements() {
		$this->assertSame( 10, has_filter( 'jetpack_sync_options_whitelist', array( $this->module, 'add_woocommerce_analytics_options_whitelist' ) ) );
		$this->assertSame( 10, has_filter( 'jetpack_sync_post_meta_whitelist', array( $this->module, 'add_woocommerce_analytics_post_meta_whitelist' ) ) );
	}

	/**
	 * Consumers can add options without duplicating the module minimum.
	 */
	public function test_adds_options_whitelist_minimum() {
		$options = $this->module->add_woocommerce_analytics_options_whitelist( array( 'consumer_option' ) );

		$this->assertSame(
			array( 'consumer_option', 'woocommerce_excluded_report_order_statuses' ),
			$options
		);
		$this->assertSame( $options, $this->module->add_woocommerce_analytics_options_whitelist( $options ) );
	}

	/**
	 * Consumers can add post meta without duplicating the module minimum.
	 */
	public function test_adds_post_meta_whitelist_minimum() {
		$post_meta = $this->module->add_woocommerce_analytics_post_meta_whitelist( array( '_consumer_meta' ) );

		$this->assertSame(
			array( '_consumer_meta', '_stock', '_stock_quantity', '_cogs_total_value', '_global_unique_id' ),
			$post_meta
		);
		$this->assertSame( $post_meta, $this->module->add_woocommerce_analytics_post_meta_whitelist( $post_meta ) );
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
	 * The public HPOS helper prefixes only registered statuses.
	 */
	public function test_hpos_status_helper() {
		$this->assertSame( 'wc-pending', Modules\WooCommerce_HPOS_Orders::get_wc_order_status_with_prefix( 'pending' ) );
		$this->assertSame( 'wc-checkout-draft', Modules\WooCommerce_HPOS_Orders::get_wc_order_status_with_prefix( 'checkout-draft' ) );
		$this->assertSame( 'wc-custom', Modules\WooCommerce_HPOS_Orders::get_wc_order_status_with_prefix( 'custom' ) );
		$this->assertSame( 'not-registered', Modules\WooCommerce_HPOS_Orders::get_wc_order_status_with_prefix( 'not-registered' ) );
	}

	/**
	 * Analytics keeps its legacy normalization behavior while reusing the HPOS helper.
	 */
	public function test_analytics_status_normalization() {
		$this->assertSame( 'wc-pending', $this->invoke_static_helper( 'normalize_order_status', 'pending' ) );
		$this->assertSame( 'wc-pending', $this->invoke_static_helper( 'normalize_order_status', 'wc-pending' ) );
		$this->assertSame( 'not-registered', $this->invoke_static_helper( 'normalize_order_status', 'wc-not-registered' ) );
	}

	/**
	 * Analytics datetime conversion retains its fixed site-offset behavior.
	 */
	public function test_datetime_conversion() {
		$this->assertNull( $this->invoke_static_helper( 'datetime_to_object', null ) );

		$from_string = $this->invoke_static_helper( 'datetime_to_object', '2024-01-02 03:04:05' );
		$this->assertSame( '2024-01-02 03:04:05.000000', $from_string->date );
		$this->assertSame( '+05:30', $from_string->timezone );

		$from_utc  = new \WC_DateTime( '2024-01-01 21:34:05', new \DateTimeZone( 'UTC' ) );
		$converted = $this->invoke_static_helper( 'datetime_to_object', $from_utc );
		$this->assertSame( '2024-01-02 03:04:05.000000', $converted->date );
		$this->assertSame( '+05:30', $converted->timezone );
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

	/**
	 * Invoke a protected static helper on the Analytics module.
	 *
	 * @param string $method_name Helper method name.
	 * @param mixed  $argument    Helper argument.
	 * @return mixed
	 */
	private function invoke_static_helper( $method_name, $argument ) {
		$method = new \ReflectionMethod( Modules\WooCommerce_Analytics::class, $method_name );
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}

		return $method->invoke( null, $argument );
	}
}
