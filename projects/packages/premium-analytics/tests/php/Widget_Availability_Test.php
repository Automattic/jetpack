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
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;

require_once __DIR__ . '/../../src/widget-types.php';
require_once __DIR__ . '/../../src/default-dashboard-sections.php';
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
	 * The support context reaches Host::is_wpcom_platform(), which memoizes `is_woa_site` into
	 * the process-global status cache — clearing constants alone would leave a stale host verdict.
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
				'name'     => 'jpa/video-detail-embeds',
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
				'name'     => 'jpa/plan-usage',
				'category' => 'stats',
			),
			array(
				'name'     => 'jpa/total-views',
				'category' => 'stats',
			),
			array(
				'name'     => 'jpa/total-visitors',
				'category' => 'stats',
			),
			array(
				'name'     => 'jpa/popular-days',
				'category' => 'stats',
			),
			array(
				'name'     => 'jpa/popular-hours',
				'category' => 'stats',
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
	 * Candidate set spanning every store-report and Stats category, plus an ungated one.
	 *
	 * @return array[] List of widget candidates.
	 */
	private function capability_widget_candidates() {
		return array_merge(
			$this->store_report_widget_candidates(),
			array(
				array(
					'name'     => 'jpa/top-posts',
					'category' => 'stats',
				),
				array(
					'name'     => 'jpa/subscribers-chart',
					'category' => 'subscribers',
				),
				array(
					'name'     => 'jpa/hello-world',
					'category' => 'demo',
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
	 * Plan usage is held back regardless of host or features.
	 */
	public function test_type_policy_removes_plan_usage_everywhere() {
		$this->assertNotContains( 'jpa/plan-usage', $this->available_names( false, false ) );
		$this->assertNotContains( 'jpa/plan-usage', $this->available_names( true, true ) );
	}

	/**
	 * The period widgets are held back regardless of host or features (WOOA7S-2020).
	 */
	public function test_type_policy_removes_period_widgets_everywhere() {
		$period = array( 'jpa/total-views', 'jpa/total-visitors', 'jpa/popular-days', 'jpa/popular-hours' );

		foreach ( $period as $name ) {
			$this->assertNotContains( $name, $this->available_names( false, false ), $name );
			$this->assertNotContains( $name, $this->available_names( true, true ), $name );
		}
		$this->assertContains( 'jpa/hello-world', $this->available_names( false, false ) );
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

		$this->assertContains( 'jpa/video-detail-embeds', $names );
		$this->assertContains( 'jpa/video-detail-views-performance', $names );
	}

	/**
	 * Every widget type name declared by a `widgets/*` manifest.
	 *
	 * Asserts rather than skips a malformed manifest, so a dropped one can't quietly narrow
	 * what the callers compare against.
	 *
	 * @return string[] Declared widget type names.
	 */
	private function manifest_widget_names() {
		$manifests = glob( __DIR__ . '/../../widgets/*/widget.json' );
		$this->assertNotEmpty( $manifests, 'No widget manifests found — the glob path is wrong.' );

		$names = array();
		foreach ( $manifests as $manifest ) {
			$raw = file_get_contents( $manifest ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
			$this->assertNotFalse( $raw, "Could not read $manifest" );

			$widget = json_decode( $raw, true );
			$this->assertIsArray( $widget, "Malformed manifest: $manifest" );
			$this->assertArrayHasKey( 'name', $widget, "Manifest declares no name: $manifest" );

			$names[] = $widget['name'];
		}

		return $names;
	}

	/**
	 * The gate and the manifests agree in both directions: a renamed widget can't drop out of the
	 * gate, and a new video widget can't be added without joining it.
	 *
	 * The second half rests on a naming heuristic: a VideoPress widget not named with `video` would
	 * be missed, and an unrelated `video-*` widget wrongly demanded. Widget manifests have no
	 * "requires" field to key on instead — read that here if one is ever added.
	 */
	public function test_videopress_widget_types_match_the_manifest() {
		$video_names = array_filter(
			$this->manifest_widget_names(),
			static function ( $name ) {
				return str_contains( $name, 'video' );
			}
		);

		$gated = VIDEOPRESS_WIDGET_TYPES;
		sort( $gated );
		sort( $video_names );

		$this->assertSame( $gated, $video_names, 'Every video widget must be listed in VIDEOPRESS_WIDGET_TYPES.' );
	}

	/**
	 * Every held plan-usage type names a real manifest, so a renamed or moved widget
	 * cannot lift the hold while the absence assertions above stay green.
	 */
	public function test_plan_usage_widget_types_match_the_manifest() {
		$names = $this->manifest_widget_names();

		foreach ( PLAN_USAGE_WIDGET_TYPES as $held ) {
			$this->assertContains( $held, $names, "$held is held back but no manifest declares it." );
		}
	}

	/**
	 * Same guard for the held period widgets: each names a real manifest.
	 */
	public function test_period_widget_types_match_the_manifest() {
		$names = $this->manifest_widget_names();

		foreach ( PERIOD_WIDGET_TYPES as $held ) {
			$this->assertContains( $held, $names, "$held is held back but no manifest declares it." );
		}
	}

	/**
	 * The registry callback drops the video widgets when VideoPress is absent.
	 */
	public function test_registry_callback_removes_video_widgets_without_videopress() {
		$names = array_column(
			filter_registrable_widget_types_by_availability( $this->widget_candidates() ),
			'name'
		);

		$this->assertNotContains( 'jpa/video-detail-views-performance', $names );
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

		$this->assertNotContains( 'jpa/video-detail-views-performance', $names, 'An active module does not stand in for the plan feature on Atomic.' );

		$GLOBALS['jpa_test_wpcom_features'] = array( 'videopress' );

		$names = array_column(
			filter_registrable_widget_types_by_availability( $this->widget_candidates() ),
			'name'
		);

		$this->assertContains( 'jpa/video-detail-views-performance', $names, 'The plan feature brings the video widgets back on Atomic.' );
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

		$this->assertContains( 'jpa/video-detail-views-performance', $names );
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
	 * Each reader keeps the categories whose reports they can fetch, and nothing else.
	 *
	 * @dataProvider provide_capability_gated_readers
	 *
	 * @param bool     $can_view_store_reports Whether the reader may see the store reports.
	 * @param bool     $can_view_stats         Whether the reader may see the Stats reports.
	 * @param string[] $expected               Names that survive.
	 */
	#[DataProvider( 'provide_capability_gated_readers' )]
	public function test_capability_gated_widgets_follow_the_reader( $can_view_store_reports, $can_view_stats, $expected ) {
		$this->assertSame(
			$expected,
			array_column(
				remove_capability_gated_widget_types( $this->capability_widget_candidates(), $can_view_store_reports, $can_view_stats ),
				'name'
			)
		);
	}

	/**
	 * Readers by the reports they may see.
	 *
	 * @return array<string, array{bool, bool, string[]}>
	 */
	public static function provide_capability_gated_readers() {
		$stats = array( 'jpa/traffic-chart', 'jpa/top-posts', 'jpa/subscribers-chart' );
		$store = array( 'jpa/store-performance', 'jpa/orders-over-time', 'jpa/sales-by-coupon-usage', 'jpa/bookings-over-time', 'jpa/visitors-over-time' );

		return array(
			'administrator'  => array( true, true, array( 'jpa/traffic-chart', 'jpa/store-performance', 'jpa/orders-over-time', 'jpa/sales-by-coupon-usage', 'jpa/bookings-over-time', 'jpa/visitors-over-time', 'jpa/top-posts', 'jpa/subscribers-chart', 'jpa/hello-world' ) ),
			'stats reader'   => array( false, true, array_merge( $stats, array( 'jpa/hello-world' ) ) ),
			'shop manager'   => array( true, false, array_merge( $store, array( 'jpa/hello-world' ) ) ),
			'neither report' => array( false, false, array( 'jpa/hello-world' ) ),
		);
	}

	/**
	 * The registry-time callback reads the current user, so the same manifest
	 * yields different types depending on who is asking.
	 */
	public function test_registry_callback_follows_the_current_user() {
		$shop_manager = wp_insert_user(
			array(
				'user_login' => 'jpa_widget_shop_manager',
				'user_pass'  => 'password',
				'role'       => 'subscriber',
			)
		);
		// WorDBless has no shop_manager role, so grant the capability the role would carry.
		( new \WP_User( $shop_manager ) )->add_cap( 'view_woocommerce_reports' );
		wp_set_current_user( $shop_manager );

		$this->assertSame(
			array( 'jpa/store-performance', 'jpa/orders-over-time', 'jpa/sales-by-coupon-usage', 'jpa/bookings-over-time', 'jpa/visitors-over-time', 'jpa/hello-world' ),
			array_column(
				filter_registrable_widget_types_by_capability( $this->capability_widget_candidates() ),
				'name'
			),
			'A shop manager cannot read Stats, so its categories are dropped.'
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
			$this->capability_widget_candidates(),
			filter_registrable_widget_types_by_capability( $this->capability_widget_candidates() ),
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
		$this->assertNotContains( 'jpa/plan-usage', $names, 'The plan-usage hold applies on Simple too.' );
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
