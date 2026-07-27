<?php
/**
 * Tests for the widget type availability layer.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

use Automattic\Jetpack\Constants;
use PHPUnit\Framework\Attributes\CoversFunction;
use WorDBless\BaseTestCase;

require_once __DIR__ . '/../../src/widget-types.php';
require_once __DIR__ . '/../../src/dashboard-sections.php';
require_once __DIR__ . '/../../src/widget-availability.php';

/**
 * @covers ::Automattic\Jetpack\PremiumAnalytics\get_available_widget_types
 * @covers ::Automattic\Jetpack\PremiumAnalytics\get_widget_support_context
 * @covers ::Automattic\Jetpack\PremiumAnalytics\get_unsupported_widget_types
 * @covers ::Automattic\Jetpack\PremiumAnalytics\remove_unsupported_widget_items
 * @covers ::Automattic\Jetpack\PremiumAnalytics\filter_registrable_widget_types_by_availability
 * @covers ::Automattic\Jetpack\PremiumAnalytics\filter_registrable_widget_types_by_environment
 * @covers ::Automattic\Jetpack\PremiumAnalytics\remove_dev_only_widget_types
 * @covers ::Automattic\Jetpack\PremiumAnalytics\filter_registrable_widget_types_by_plugin
 * @covers ::Automattic\Jetpack\PremiumAnalytics\remove_plugin_gated_widget_types
 */
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\get_available_widget_types' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\get_widget_support_context' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\get_unsupported_widget_types' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\remove_unsupported_widget_items' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\filter_registrable_widget_types_by_availability' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\filter_registrable_widget_types_by_environment' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\remove_dev_only_widget_types' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\filter_registrable_widget_types_by_plugin' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\remove_plugin_gated_widget_types' )]
class Widget_Availability_Test extends BaseTestCase {

	/**
	 * Reset constants and availability filters between tests.
	 */
	public function tear_down() {
		Constants::clear_constants();
		remove_all_filters( WOOCOMMERCE_DASHBOARD_SECTION_AVAILABLE_FILTER );

		parent::tear_down();
	}

	/**
	 * Candidate set shaped like the build manifest entries.
	 *
	 * @return array[] List of widget candidates.
	 */
	private function widget_candidates() {
		return array(
			array(
				'name'     => 'jpa/react-query-dev-tool',
				'category' => 'developer',
			),
			array(
				'name'     => 'jpa/file-downloads',
				'category' => 'traffic',
			),
			array(
				'name'     => 'jpa/hello-world',
				'category' => 'demo',
			),
		);
	}

	/**
	 * Candidate set spanning the commerce categories and an ungated one.
	 *
	 * @return array[] List of widget candidates.
	 */
	private function commerce_widget_candidates() {
		return array(
			array(
				'name'     => 'jpa/traffic-chart',
				'category' => 'traffic',
			),
			array(
				'name'     => 'jpa/store-performance',
				'category' => 'store',
			),
			array(
				'name'     => 'jpa/orders-over-time',
				'category' => 'orders',
			),
			array(
				'name'     => 'jpa/sales-by-coupon-usage',
				'category' => 'coupons',
			),
			array(
				'name'     => 'jpa/bookings-over-time',
				'category' => 'bookings',
			),
		);
	}

	/**
	 * Filters the standard candidates with explicit host context.
	 *
	 * @param bool $is_wpcom_simple Whether the site is WPCOM Simple.
	 * @return string[] Remaining type names.
	 */
	private function available_names( $is_wpcom_simple ) {
		return array_column(
			remove_unsupported_widget_items(
				$this->widget_candidates(),
				'name',
				array( 'is_wpcom_simple' => $is_wpcom_simple )
			),
			'name'
		);
	}

	/**
	 * File downloads is unavailable outside WPCOM Simple.
	 */
	public function test_type_policy_removes_file_downloads_on_non_simple() {
		$names = $this->available_names( false );

		$this->assertNotContains( 'jpa/file-downloads', $names );
		$this->assertContains( 'jpa/hello-world', $names );
	}

	/**
	 * WPCOM Simple keeps File downloads.
	 */
	public function test_type_policy_keeps_file_downloads_on_simple() {
		$this->assertContains( 'jpa/file-downloads', $this->available_names( true ) );
	}

	/**
	 * Non-array records pass through unchanged.
	 */
	public function test_type_policy_keeps_non_array_records() {
		$record = (object) array( 'name' => 'jpa/file-downloads' );

		$this->assertSame(
			array( $record ),
			remove_unsupported_widget_items(
				array(
					$record,
					array( 'name' => 'jpa/file-downloads' ),
				),
				'name',
				array( 'is_wpcom_simple' => false )
			)
		);
	}

	/**
	 * Records without the type key are not support-gated.
	 */
	public function test_type_policy_keeps_records_without_type_key() {
		$items = array( array( 'uuid' => 'no-type' ) );

		$this->assertSame(
			$items,
			remove_unsupported_widget_items( $items, 'type', array( 'is_wpcom_simple' => false ) )
		);
	}

	/**
	 * Filtered candidates are re-indexed so they stay a JSON list.
	 */
	public function test_type_policy_reindexes_filtered_records() {
		$filtered = remove_unsupported_widget_items(
			$this->widget_candidates(),
			'name',
			array( 'is_wpcom_simple' => false )
		);

		$this->assertSame( range( 0, count( $filtered ) - 1 ), array_keys( $filtered ), 'Filtered candidates must stay a JSON list.' );
	}

	/**
	 * In production, developer-only candidates are dropped; the rest pass through.
	 */
	public function test_dev_only_widget_removed_in_production() {
		$names = array_column( remove_dev_only_widget_types( $this->widget_candidates(), 'production' ), 'name' );

		$this->assertNotContains( 'jpa/react-query-dev-tool', $names, 'Developer-only widgets must be hidden in production.' );
		$this->assertContains( 'jpa/hello-world', $names, 'Regular widgets remain available.' );
	}

	/**
	 * Outside production, candidates pass through (covers the non-production branch).
	 */
	public function test_dev_only_widget_kept_outside_production() {
		foreach ( array( 'local', 'development', 'staging' ) as $environment ) {
			$names = array_column( remove_dev_only_widget_types( $this->widget_candidates(), $environment ), 'name' );

			$this->assertContains( 'jpa/react-query-dev-tool', $names, "Developer-only widgets must remain available in the {$environment} environment." );
			$this->assertContains( 'jpa/hello-world', $names, 'Regular widgets remain available.' );
		}
	}

	/**
	 * The registry-time callback reads the env (production by default) and drops
	 * the developer-only candidate.
	 */
	public function test_registry_filter_callback_drops_dev_widget_by_default() {
		$this->assertSame( 'production', wp_get_environment_type() );

		$names = array_column( filter_registrable_widget_types_by_environment( $this->widget_candidates() ), 'name' );

		$this->assertNotContains( 'jpa/react-query-dev-tool', $names, 'The registry-time callback must drop the developer widget in production.' );
		$this->assertContains( 'jpa/hello-world', $names, 'Regular widgets remain available.' );
	}

	/**
	 * Without WooCommerce (and thus without its Bookings extension), every
	 * commerce category is dropped; the rest pass through.
	 */
	public function test_commerce_widgets_removed_without_woocommerce() {
		$names = array_column( remove_plugin_gated_widget_types( $this->commerce_widget_candidates(), false, false ), 'name' );

		$this->assertSame( array( 'jpa/traffic-chart' ), $names, 'Without WooCommerce only ungated categories remain.' );
	}

	/**
	 * With WooCommerce but no Bookings extension, only `bookings` is dropped.
	 */
	public function test_bookings_widgets_removed_without_bookings_plugin() {
		$names = array_column( remove_plugin_gated_widget_types( $this->commerce_widget_candidates(), true, false ), 'name' );

		$this->assertNotContains( 'jpa/bookings-over-time', $names, 'Bookings widgets must be hidden without the Bookings extension.' );
		$this->assertContains( 'jpa/store-performance', $names, 'Store widgets only need WooCommerce.' );
		$this->assertContains( 'jpa/orders-over-time', $names, 'Orders widgets only need WooCommerce.' );
		$this->assertContains( 'jpa/sales-by-coupon-usage', $names, 'Coupons widgets only need WooCommerce.' );
	}

	/**
	 * With both plugins available, everything passes through.
	 */
	public function test_commerce_widgets_kept_with_both_plugins() {
		$this->assertSame(
			$this->commerce_widget_candidates(),
			remove_plugin_gated_widget_types( $this->commerce_widget_candidates(), true, true ),
			'With WooCommerce and Bookings available no candidate is dropped.'
		);
	}

	/**
	 * Candidates without a category are never plugin-gated.
	 */
	public function test_uncategorized_widgets_pass_through() {
		$candidates = array( array( 'name' => 'jpa/no-category' ) );

		$this->assertSame(
			$candidates,
			remove_plugin_gated_widget_types( $candidates, false, false ),
			'A candidate without a category must not be plugin-gated.'
		);
	}

	/**
	 * The host callback removes File downloads on Atomic.
	 */
	public function test_registry_callback_removes_file_downloads_on_atomic() {
		Constants::set_constant( 'ATOMIC_SITE_ID', 123 );
		Constants::set_constant( 'ATOMIC_CLIENT_ID', 456 );

		$names = array_column(
			filter_registrable_widget_types_by_availability( $this->widget_candidates() ),
			'name'
		);

		$this->assertNotContains( 'jpa/file-downloads', $names );
	}

	/**
	 * The host callback keeps File downloads on WPCOM Simple.
	 */
	public function test_registry_callback_keeps_file_downloads_on_wpcom_simple() {
		Constants::set_constant( 'IS_WPCOM', true );

		$names = array_column(
			filter_registrable_widget_types_by_availability( $this->widget_candidates() ),
			'name'
		);

		$this->assertContains( 'jpa/file-downloads', $names );
	}

	/**
	 * The registry-time callback follows the store section's availability
	 * signal, so forcing the section visible also surfaces its widgets.
	 */
	public function test_registry_filter_callback_follows_section_availability() {
		$this->assertFalse( is_woocommerce_dashboard_section_available(), 'The test environment must not have WooCommerce loaded.' );

		$names = array_column( filter_registrable_widget_types_by_plugin( $this->commerce_widget_candidates() ), 'name' );
		$this->assertSame( array( 'jpa/traffic-chart' ), $names, 'Without WooCommerce the callback drops every commerce category.' );

		add_filter( WOOCOMMERCE_DASHBOARD_SECTION_AVAILABLE_FILTER, '__return_true' );

		$names = array_column( filter_registrable_widget_types_by_plugin( $this->commerce_widget_candidates() ), 'name' );
		$this->assertContains( 'jpa/store-performance', $names, 'Forcing the section available must surface the store widgets.' );
		$this->assertNotContains( 'jpa/bookings-over-time', $names, 'Bookings widgets still require the Bookings extension.' );
	}

	/**
	 * Reading the available set runs the registry through WIDGET_TYPES_FILTER.
	 */
	public function test_get_available_widget_types_applies_filter() {
		$registry = Widget_Type_Registry::get_instance();
		$registry->register( 'test/sentinel' );

		$callback = static function ( $widget_types ) {
			unset( $widget_types['test/sentinel'] );
			return $widget_types;
		};
		add_filter( WIDGET_TYPES_FILTER, $callback );

		$available = get_available_widget_types();

		remove_filter( WIDGET_TYPES_FILTER, $callback );
		$registry->unregister( 'test/sentinel' );

		$this->assertArrayNotHasKey( 'test/sentinel', $available, 'A filter callback can remove a widget type from the available set.' );
	}
}
