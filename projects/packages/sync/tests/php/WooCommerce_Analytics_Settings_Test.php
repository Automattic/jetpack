<?php
/**
 * Test file for Automattic\Jetpack\Sync\WooCommerce_Analytics_Settings
 *
 * @package automattic/jetpack-sync
 */

namespace Automattic\Jetpack\Sync;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;

/**
 * Class WooCommerce_Analytics_Settings_Test
 *
 * WooCommerce is not loaded in this suite, so tests cover the opt-in plumbing:
 * the WooCommerce-active guard, module-list handling, and the data settings
 * consumers pass to Config::ensure().
 *
 * @covers Automattic\Jetpack\Sync\WooCommerce_Analytics_Settings
 */
#[CoversClass( WooCommerce_Analytics_Settings::class )]
class WooCommerce_Analytics_Settings_Test extends BaseTestCase {

	/**
	 * The settings instance.
	 *
	 * @var WooCommerce_Analytics_Settings
	 */
	private $settings;

	/**
	 * Runs before every test in this class.
	 */
	protected function setUp(): void {
		parent::setUp();
		$this->settings = new WooCommerce_Analytics_Settings();
	}

	/**
	 * Without WooCommerce loaded, configure() must not hook anything.
	 */
	public function test_configure_is_a_noop_without_woocommerce() {
		$this->assertFalse( WooCommerce_Analytics_Settings::is_woocommerce_active() );

		$this->settings->configure();

		$this->assertFalse( has_filter( 'jetpack_sync_modules', array( $this->settings, 'add_woocommerce_analytics_module' ) ) );
		$this->assertFalse( has_filter( 'jetpack_full_sync_config', array( $this->settings, 'expand_full_sync_config' ) ) );
	}

	/**
	 * The module is appended to the list, once.
	 */
	public function test_add_woocommerce_analytics_module_appends_once() {
		$modules = $this->settings->add_woocommerce_analytics_module( array( Modules\Posts::class ) );

		$this->assertContains( Modules\WooCommerce_Analytics::class, $modules );

		$again = $this->settings->add_woocommerce_analytics_module( $modules );
		$this->assertSame( 1, array_count_values( $again )[ Modules\WooCommerce_Analytics::class ] );
	}

	/**
	 * Legacy implementations take precedence during migration, including when
	 * Config data settings already added the shared module to the list.
	 *
	 * @param string $legacy_module Legacy module FQCN.
	 *
	 * @dataProvider legacy_analytics_module_provider
	 */
	#[DataProvider( 'legacy_analytics_module_provider' )]
	public function test_add_woocommerce_analytics_module_stands_down_for_legacy_implementation( $legacy_module ) {
		$modules = $this->settings->add_woocommerce_analytics_module(
			array( $legacy_module, Modules\WooCommerce_Analytics::class )
		);

		$this->assertNotContains( Modules\WooCommerce_Analytics::class, $modules );
		$this->assertContains( $legacy_module, $modules );
	}

	/**
	 * Legacy Analytics sync module FQCNs.
	 *
	 * @return array<string,array<string>>
	 */
	public static function legacy_analytics_module_provider() {
		return array(
			'standalone Woo Analytics' => array( WooCommerce_Analytics_Settings::ANALYTICS_PLUGIN_MODULE_FQCN ),
			'Woo AI'                   => array( WooCommerce_Analytics_Settings::WOO_AI_MODULE_FQCN ),
			'Premium Analytics'        => array( WooCommerce_Analytics_Settings::PREMIUM_ANALYTICS_MODULE_FQCN ),
		);
	}

	/**
	 * Non-array filter input passes through untouched.
	 */
	public function test_add_woocommerce_analytics_module_ignores_non_arrays() {
		$this->assertNull( $this->settings->add_woocommerce_analytics_module( null ) );
	}

	/**
	 * Without WooCommerce (so can_site_sync_orders() is false) the full sync config
	 * and checksum tables are returned unchanged.
	 */
	public function test_filters_are_noops_when_orders_cannot_sync() {
		$config = array( 'posts' => 1 );
		$this->assertSame( $config, $this->settings->expand_full_sync_config( $config ) );

		$tables = array( 'posts' => array( 'table' => 'wp_posts' ) );
		$this->assertSame( $tables, $this->settings->add_order_stats_to_checksum( $tables ) );
	}

	/**
	 * Product meta needed by analytics reports is prepended to the whitelist.
	 */
	public function test_post_meta_whitelist_additions() {
		$whitelist = $this->settings->add_meta_to_sync_post_meta_whitelist( array( '_thumbnail_id' ) );

		foreach ( array( '_stock', '_stock_quantity', '_cogs_total_value', '_global_unique_id', '_thumbnail_id' ) as $meta_key ) {
			$this->assertContains( $meta_key, $whitelist );
		}
	}

	/**
	 * The options whitelist filter appends the analytics options without duplicating
	 * existing entries.
	 */
	public function test_options_whitelist_additions() {
		$whitelist = $this->settings->add_options_to_sync_options_whitelist( array( 'blogname', 'woocommerce_date_type' ) );

		$this->assertContains( 'woocommerce_custom_orders_table_enabled', $whitelist );
		$this->assertContains( 'blogname', $whitelist );
		$this->assertSame( 1, array_count_values( $whitelist )['woocommerce_date_type'] );
	}

	/**
	 * Data settings include the module, its supporting modules, and everything from
	 * MUST_SYNC_DATA_SETTINGS.
	 */
	public function test_get_data_settings_shape() {
		$settings = WooCommerce_Analytics_Settings::get_data_settings();

		$this->assertContains( Modules\WooCommerce_Analytics::class, $settings['jetpack_sync_modules'] );
		foreach ( array( Modules\Meta::class, Modules\Posts::class, Modules\Terms::class, Modules\Term_Relationships::class ) as $module ) {
			$this->assertContains( $module, $settings['jetpack_sync_modules'] );
		}

		$this->assertContains( 'woocommerce_custom_orders_table_enabled', $settings['jetpack_sync_options_whitelist'] );

		foreach ( Data_Settings::MUST_SYNC_DATA_SETTINGS['jetpack_sync_modules'] as $must_sync_module ) {
			$this->assertContains( $must_sync_module, $settings['jetpack_sync_modules'] );
		}
	}
}
