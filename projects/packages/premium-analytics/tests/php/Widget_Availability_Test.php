<?php
/**
 * Tests for the widget type availability layer.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Status\Cache;
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
 * @covers ::Automattic\Jetpack\PremiumAnalytics\filter_registrable_widget_types_by_capability
 * @covers ::Automattic\Jetpack\PremiumAnalytics\remove_capability_gated_widget_types
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
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\filter_registrable_widget_types_by_capability' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\remove_capability_gated_widget_types' )]
class Widget_Availability_Test extends BaseTestCase {

	/**
	 * Reset constants and availability filters between tests.
	 *
	 * The support context now reaches Host::is_wpcom_platform(), which memoizes
	 * `is_woa_site` into the process-global status cache; clearing constants alone
	 * would leave a stale host verdict for the next test that sets Atomic ones.
	 */
	public function tear_down() {
		Constants::clear_constants();
		Cache::clear();
		$GLOBALS['jpa_test_wpcom_features'] = array();
		delete_option( 'jetpack_active_modules' );
		remove_all_filters( WOOCOMMERCE_DASHBOARD_SECTION_AVAILABLE_FILTER );
		remove_all_filters( VIDEOPRESS_AVAILABLE_FILTER );

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
				'name'     => 'jpa/videopress',
				'category' => 'stats',
			),
			array(
				'name'     => 'jpa/video-detail-views-performance',
				'category' => 'stats',
			),
			array(
				'name'     => 'jpa/shares',
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
	 * Candidate set spanning every store-report category, plus one served from
	 * elsewhere.
	 *
	 * @return array[] List of widget candidates.
	 */
	private function store_report_widget_candidates() {
		return array_merge(
			$this->commerce_widget_candidates(),
			array(
				array(
					'name'     => 'jpa/visitors-over-time',
					'category' => 'visitors',
				),
			)
		);
	}

	/**
	 * Filters the standard candidates with an explicit support context.
	 *
	 * @param bool $is_wpcom_simple Whether the site is WPCOM Simple.
	 * @param bool $has_videopress  Whether the site runs VideoPress.
	 * @return string[] Remaining type names.
	 */
	private function available_names( $is_wpcom_simple, $has_videopress = true ) {
		return array_column(
			remove_unsupported_widget_items(
				$this->widget_candidates(),
				'name',
				array(
					'is_wpcom_simple' => $is_wpcom_simple,
					'has_videopress'  => $has_videopress,
				)
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
	 * Without VideoPress, every gated video widget is unavailable.
	 */
	public function test_type_policy_removes_video_widgets_without_videopress() {
		$candidates = array_map(
			static function ( $name ) {
				return array(
					'name'     => $name,
					'category' => 'stats',
				);
			},
			VIDEOPRESS_WIDGET_TYPES
		);

		$this->assertSame(
			array(),
			remove_unsupported_widget_items(
				$candidates,
				'name',
				array(
					'is_wpcom_simple' => true,
					'has_videopress'  => false,
				)
			),
			'Every type in VIDEOPRESS_WIDGET_TYPES must be dropped, not just the ones listed as candidates.'
		);

		$this->assertContains( 'jpa/hello-world', $this->available_names( true, false ) );
	}

	/**
	 * With VideoPress, the video widgets stay available.
	 */
	public function test_type_policy_keeps_video_widgets_with_videopress() {
		$names = $this->available_names( false, true );

		$this->assertContains( 'jpa/videopress', $names );
		$this->assertContains( 'jpa/video-detail-views-performance', $names );
	}

	/**
	 * The gate and the manifests agree in both directions: a renamed widget can't
	 * drop out of the gate, and a new video widget can't be added without joining
	 * it.
	 *
	 * The second half rests on a naming heuristic, which bounds what it can catch:
	 * a VideoPress-backed widget named without `video` would not be demanded here,
	 * and an unrelated `video-*` widget would be demanded wrongly. Widget manifests
	 * carry no "requires" field to key on instead; if one is ever added, this
	 * should read that rather than the name.
	 */
	public function test_videopress_widget_types_match_the_manifest() {
		$manifests = glob( __DIR__ . '/../../widgets/*/widget.json' );
		$this->assertNotEmpty( $manifests, 'No widget manifests found — the glob path is wrong.' );

		$video_names = array();
		foreach ( $manifests as $manifest ) {
			// Assert rather than skip: a manifest silently dropped here is absent from
			// both sides of the comparison below, so the guard would pass while the
			// gate is missing a type — the one failure this test exists to catch.
			$raw = file_get_contents( $manifest ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
			$this->assertNotFalse( $raw, "Could not read $manifest" );

			$widget = json_decode( $raw, true );
			$this->assertIsArray( $widget, "Malformed manifest: $manifest" );
			$this->assertArrayHasKey( 'name', $widget, "Manifest declares no name: $manifest" );

			if ( str_contains( $widget['name'], 'video' ) ) {
				$video_names[] = $widget['name'];
			}
		}

		$gated = VIDEOPRESS_WIDGET_TYPES;
		sort( $gated );
		sort( $video_names );

		$this->assertSame( $gated, $video_names, 'Every video widget must be listed in VIDEOPRESS_WIDGET_TYPES.' );
	}

	/**
	 * The registry callback drops the video widgets when VideoPress is absent.
	 */
	public function test_registry_callback_removes_video_widgets_without_videopress() {
		$names = array_column(
			filter_registrable_widget_types_by_availability( $this->widget_candidates() ),
			'name'
		);

		$this->assertNotContains( 'jpa/videopress', $names );
	}

	/**
	 * Atomic reads the plan feature at the widget layer too — an active module is
	 * not enough there, and the feature alone is.
	 */
	public function test_registry_callback_follows_the_plan_feature_on_atomic() {
		Constants::set_constant( 'ATOMIC_SITE_ID', 123 );
		Constants::set_constant( 'ATOMIC_CLIENT_ID', 456 );
		Constants::set_constant( 'WPCOMSH__PLUGIN_FILE', '/plugins/wpcomsh/wpcomsh.php' );
		update_option( 'jetpack_active_modules', array( 'videopress' ) );

		$names = array_column(
			filter_registrable_widget_types_by_availability( $this->widget_candidates() ),
			'name'
		);

		$this->assertNotContains( 'jpa/videopress', $names, 'An active module does not stand in for the plan feature on Atomic.' );

		$GLOBALS['jpa_test_wpcom_features'] = array( 'videopress' );

		$names = array_column(
			filter_registrable_widget_types_by_availability( $this->widget_candidates() ),
			'name'
		);

		$this->assertContains( 'jpa/videopress', $names, 'The plan feature brings the video widgets back on Atomic.' );
	}

	/**
	 * Forcing availability on puts them back, proving the context reads the helper.
	 */
	public function test_registry_callback_keeps_video_widgets_with_videopress() {
		add_filter( VIDEOPRESS_AVAILABLE_FILTER, '__return_true' );

		$names = array_column(
			filter_registrable_widget_types_by_availability( $this->widget_candidates() ),
			'name'
		);

		$this->assertContains( 'jpa/videopress', $names );
	}

	/**
	 * Shares is unavailable outside WPCOM Simple, where nothing records a share.
	 */
	public function test_type_policy_removes_shares_on_non_simple() {
		$names = $this->available_names( false );

		$this->assertNotContains( 'jpa/shares', $names );
		$this->assertContains( 'jpa/hello-world', $names );
	}

	/**
	 * WPCOM Simple keeps Shares.
	 */
	public function test_type_policy_keeps_shares_on_simple() {
		$this->assertContains( 'jpa/shares', $this->available_names( true ) );
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
				array(
					'is_wpcom_simple' => false,
					'has_videopress'  => false,
				)
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
			remove_unsupported_widget_items(
				$items,
				'type',
				array(
					'is_wpcom_simple' => false,
					'has_videopress'  => false,
				)
			)
		);
	}

	/**
	 * Filtered candidates are re-indexed so they stay a JSON list.
	 */
	public function test_type_policy_reindexes_filtered_records() {
		$filtered = remove_unsupported_widget_items(
			$this->widget_candidates(),
			'name',
			array(
				'is_wpcom_simple' => false,
				'has_videopress'  => false,
			)
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
	 * Every store-report category — the commerce ones and `visitors` — is dropped
	 * for a reader without that access, since all they could collect from those
	 * widgets is 403s.
	 */
	public function test_store_report_widgets_removed_from_a_reader_without_access() {
		$this->assertSame(
			array( 'jpa/traffic-chart' ),
			array_column(
				remove_capability_gated_widget_types( $this->store_report_widget_candidates(), false ),
				'name'
			),
			'Only the category served by another prefix survives.'
		);
	}

	/**
	 * Administrators keep every category.
	 */
	public function test_store_report_widgets_kept_for_a_user_with_access() {
		$this->assertSame(
			$this->store_report_widget_candidates(),
			remove_capability_gated_widget_types( $this->store_report_widget_candidates(), true ),
			'With prefix access no candidate is dropped.'
		);
	}

	/**
	 * The registry-time callback reads the current user, so the same manifest
	 * yields different types depending on who is asking.
	 */
	public function test_registry_callback_follows_the_current_user() {
		$reader = wp_insert_user(
			array(
				'user_login' => 'jpa_widget_reader',
				'user_pass'  => 'password',
				'role'       => 'editor',
			)
		);
		wp_set_current_user( $reader );

		$this->assertSame(
			array( 'jpa/traffic-chart' ),
			array_column(
				filter_registrable_widget_types_by_capability( $this->store_report_widget_candidates() ),
				'name'
			),
			'An editor cannot read the store reports, so their categories are dropped.'
		);

		$admin = wp_insert_user(
			array(
				'user_login' => 'jpa_widget_admin',
				'user_pass'  => 'password',
				'role'       => 'administrator',
			)
		);
		wp_set_current_user( $admin );

		$this->assertSame(
			$this->store_report_widget_candidates(),
			filter_registrable_widget_types_by_capability( $this->store_report_widget_candidates() ),
			'An administrator keeps every category.'
		);

		wp_set_current_user( 0 );
	}

	/**
	 * Candidates without a category are never capability-gated.
	 */
	public function test_uncategorized_widgets_are_not_capability_gated() {
		$candidates = array( array( 'name' => 'jpa/no-category' ) );

		$this->assertSame(
			$candidates,
			remove_capability_gated_widget_types( $candidates, false ),
			'A candidate without a category must not be capability-gated.'
		);
	}

	/**
	 * The host callback removes the Simple-only types on Atomic.
	 */
	public function test_registry_callback_removes_simple_only_types_on_atomic() {
		Constants::set_constant( 'ATOMIC_SITE_ID', 123 );
		Constants::set_constant( 'ATOMIC_CLIENT_ID', 456 );

		$names = array_column(
			filter_registrable_widget_types_by_availability( $this->widget_candidates() ),
			'name'
		);

		$this->assertNotContains( 'jpa/file-downloads', $names );
		$this->assertNotContains( 'jpa/shares', $names );
	}

	/**
	 * The host callback keeps the Simple-only types on WPCOM Simple.
	 */
	public function test_registry_callback_keeps_simple_only_types_on_wpcom_simple() {
		Constants::set_constant( 'IS_WPCOM', true );

		$names = array_column(
			filter_registrable_widget_types_by_availability( $this->widget_candidates() ),
			'name'
		);

		$this->assertContains( 'jpa/file-downloads', $names );
		$this->assertContains( 'jpa/shares', $names );
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
