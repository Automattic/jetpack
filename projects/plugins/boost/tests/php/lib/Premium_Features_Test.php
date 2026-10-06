<?php

namespace Automattic\Jetpack_Boost\Tests\Lib;

use Automattic\Jetpack\Admin_UI\Admin_Menu;
use Automattic\Jetpack\Boost_Core\Lib\Boost_API;
use Automattic\Jetpack\Boost_Core\Lib\Transient;
use Automattic\Jetpack\Connection\Manager;
use Automattic\Jetpack_Boost\Admin\Admin;
use Automattic\Jetpack_Boost\Data_Sync\Modules_State_Entry;
use Automattic\Jetpack_Boost\Data_Sync\Performance_History_Entry;
use Automattic\Jetpack_Boost\Lib\Analytics;
use Automattic\Jetpack_Boost\Lib\Connection;
use Automattic\Jetpack_Boost\Lib\Critical_CSS\Regenerate;
use Automattic\Jetpack_Boost\Lib\Premium_Features;
use Automattic\Jetpack_Boost\Lib\Status;
use Automattic\Jetpack_Boost\Modules\Module;
use Automattic\Jetpack_Boost\Modules\Modules_Setup;
use Automattic\Jetpack_Boost\Modules\Optimizations\Cloud_CSS\Cloud_CSS;
use Automattic\Jetpack_Boost\Modules\Optimizations\Minify\Minify_JS;
use Automattic\Jetpack_Boost\Tests\Base_TestCase;
use Brain\Monkey\Actions;
use Brain\Monkey\Functions;
use Mockery;

class Premium_Features_Test extends Base_TestCase {
	private $options      = array();
	private $api_response = array();
	private $api_calls;
	private $original_get;

	protected function set_up() {
		parent::set_up();
		$this->options      = array();
		$this->api_calls    = 0;
		$this->original_get = $_GET;
		$this->api_response = array();
		if ( ! defined( 'DAY_IN_SECONDS' ) ) {
			define( 'DAY_IN_SECONDS', 86400 );
		}
		\Patchwork\redefine(
			Boost_API::class . '::get',
			function () {
				++$this->api_calls;
				return $this->api_response;
			}
		);
		Functions\when( 'sanitize_title' )->returnArg();
		Functions\when( 'post_type_exists' )->justReturn( true );
		Functions\when( 'get_option' )->alias(
			function ( $name, $fallback = false ) {
				return $this->options[ $name ] ?? $fallback;
			}
		);
		Functions\when( 'update_option' )->alias(
			function ( $name, $value ) {
				if ( $value === ( $this->options[ $name ] ?? false ) ) {
					return false;
				}
				$changed                = ! isset( $this->options[ $name ] ) || $this->options[ $name ] !== $value;
				$this->options[ $name ] = $value;
				return $changed;
			}
		);
		Functions\when( 'add_option' )->alias(
			function ( $name, $value ) {
				if ( isset( $this->options[ $name ] ) ) {
					return false;
				}
				$this->options[ $name ] = $value;
				return true;
			}
		);
		Functions\when( 'delete_option' )->alias(
			function ( $name ) {
				unset( $this->options[ $name ] );
			}
		);
		Functions\when( 'jetpack_boost_ds_set' )->alias(
			function ( $key, $value ) {
				return update_option( 'jetpack_boost_ds_' . $key, $value );
			}
		);
		Transient::set( Premium_Features::TRANSIENT_KEY, array(), 3600 );
	}

	protected function tear_down() {
		$_GET = $this->original_get;
		parent::tear_down();
	}

	private function observe_plan( $features ) {
		$this->api_response = $features;
		Premium_Features::clear_cache();
		Premium_Features::enable_cloud_css_after_upgrade();
	}

	private function connect_with_plan( $features ) {
		$connected          = false;
		$baseline           = null;
		$this->api_response = false;
		$this->observe_plan( false );
		$this->assertFalse( get_option( Premium_Features::CLOUD_CSS_BASELINE_OPTION ) );
		\Patchwork\redefine(
			Connection::class . '::is_connected',
			function () use ( &$connected ) {
				return $connected;
			}
		);
		\Patchwork\redefine( Connection::class . '::initialize_deactivate_disconnect', \Patchwork\always( null ) );
		\Patchwork\redefine( Analytics::class . '::record_user_event', \Patchwork\always( null ) );
		\Patchwork\redefine( Performance_History_Entry::class . '::clear_cache', \Patchwork\always( null ) );
		Functions\when( 'is_wp_error' )->justReturn( false );
		Actions\expectAdded( 'jetpack_site_registered' )->once()->with(
			Mockery::on(
				function ( $callback ) use ( &$baseline ) {
					$baseline = $callback;
					return is_callable( $callback ); }
			),
			20,
			0
		);
		$connection = new Connection();
		$connection->init();
		$this->assertFalse( $connection->is_connected() );
		\Patchwork\redefine(
			Manager::class . '::register',
			function () use ( &$connected, &$baseline ) {
				if ( ! is_callable( $baseline ) ) {
					throw new \LogicException( 'The connection baseline hook was not registered.' );
				}
				$connected = true;
				$baseline();
				return true;
			}
		);
		$this->api_response = $features;
		$connection->register();
		$this->assertTrue( $connection->is_connected() );
		$this->assertFalse( ( new Status( 'cloud_css' ) )->get() );
	}

	public function test_new_site_connects_free_then_upgrades_before_another_boost_page_load() {
		Actions\expectDone( 'jetpack_boost_module_status_updated' )->once()->with( 'cloud_css', true );
		$this->connect_with_plan( array() );
		$this->assertSame( 'free', get_option( Premium_Features::CLOUD_CSS_BASELINE_OPTION ) );
		$this->observe_plan( array( Premium_Features::CLOUD_CSS ) );
		$this->assertTrue( ( new Status( 'cloud_css' ) )->get() );
		$this->assertTrue( get_option( Premium_Features::CLOUD_CSS_NOTICE_OPTION ) );
	}

	public function test_site_already_premium_when_it_connects_keeps_its_setting() {
		Actions\expectDone( 'jetpack_boost_module_status_updated' )->never();
		$this->connect_with_plan( array( Premium_Features::CLOUD_CSS ) );
		$this->assertSame( 'premium', get_option( Premium_Features::CLOUD_CSS_BASELINE_OPTION ) );
		$this->observe_plan( array( Premium_Features::CLOUD_CSS ) );
		$this->assertFalse( ( new Status( 'cloud_css' ) )->get() );
	}

	public function test_enables_cloud_css_when_feature_first_appears() {
		Actions\expectDone( 'jetpack_boost_module_status_updated' )->once()->with( 'cloud_css', true );
		$this->observe_plan( array() );
		$this->observe_plan( array( Premium_Features::CLOUD_CSS ) );
		$this->assertTrue( ( new Status( 'cloud_css' ) )->get() );
		$this->assertTrue( get_option( Premium_Features::CLOUD_CSS_NOTICE_OPTION ) );
	}

	public function test_manual_disable_survives_refresh_and_plan_lapse_and_return() {
		Actions\expectDone( 'jetpack_boost_module_status_updated' )->once()->with( 'cloud_css', true );
		$this->observe_plan( array() );
		$this->observe_plan( array( Premium_Features::CLOUD_CSS ) );
		( new Status( 'cloud_css' ) )->set( false );
		update_option( Premium_Features::CLOUD_CSS_NOTICE_OPTION, false );
		$this->observe_plan( array( Premium_Features::CLOUD_CSS ) );
		$this->observe_plan( array() );
		$this->observe_plan( array( Premium_Features::CLOUD_CSS ) );
		$this->assertFalse( ( new Status( 'cloud_css' ) )->get() );
		$this->assertFalse( get_option( Premium_Features::CLOUD_CSS_NOTICE_OPTION ) );
	}

	public function test_free_site_keeps_cloud_css_off_without_confirmation() {
		Actions\expectDone( 'jetpack_boost_module_status_updated' )->never();
		$this->observe_plan( array() );
		$this->assertFalse( ( new Status( 'cloud_css' ) )->get() );
		$this->assertFalse( get_option( Premium_Features::CLOUD_CSS_NOTICE_OPTION ) );
	}

	public function test_failed_fetch_is_cached_without_recording_a_baseline() {
		$this->api_response = false;
		Premium_Features::clear_cache();
		Premium_Features::enable_cloud_css_after_upgrade();
		for ( $request = 0; $request < 3; ++$request ) {
			Premium_Features::get_features();
			Premium_Features::enable_cloud_css_after_upgrade();
		}
		$this->assertSame( 1, $this->api_calls );
		$this->assertFalse( get_option( Premium_Features::CLOUD_CSS_BASELINE_OPTION ) );
		$this->api_response = array( Premium_Features::CLOUD_CSS );
		Premium_Features::clear_cache();
		Premium_Features::enable_cloud_css_after_upgrade();
		$this->assertFalse( ( new Status( 'cloud_css' ) )->get() );
	}

	public function test_force_disabled_module_keeps_the_upgrade_unclaimed() {
		$this->observe_plan( array() );
		$_GET[ Module::DISABLE_MODULE_QUERY_VAR ] = 'all';
		$this->observe_plan( array( Premium_Features::CLOUD_CSS ) );
		$this->assertFalse( get_option( Premium_Features::CLOUD_CSS_ACTIVATED_OPTION ) );
	}

	public function test_registered_boost_page_refreshes_stale_plan_before_module_state_and_requests_generation() {
		$modules   = new class() extends Modules_Setup {
			public function get_available_modules() {
				$cloud = new Module( new Cloud_CSS() );
				return $cloud->is_available() ? array( 'cloud_css' => $cloud ) : array();
			}
			public function get_available_submodules() {
				return array();
			}
			public function can_module_run( $module ) {
				return $module->is_available();
			}
		};
		$requested = 0;
		\Patchwork\redefine(
			Regenerate::class . '::start',
			function () use ( &$requested ) {
				++$requested;
			}
		);
		\Patchwork\redefine( Analytics::class . '::record_user_event', \Patchwork\always( null ) );
		Actions\expectDone( 'jetpack_boost_module_status_updated' )->once()->with( 'cloud_css', true )->whenHappen(
			function ( $slug, $active ) use ( $modules ) {
				$modules->on_module_status_update( $slug, $active );
			}
		);
		\Patchwork\redefine( Admin_Menu::class . '::add_menu', \Patchwork\always( 'boost-test-page' ) );
		Functions\when( '__' )->returnArg();
		Functions\when( 'is_admin' )->justReturn( false );
		Functions\when( 'current_user_can' )->justReturn( true );
		if ( ! defined( 'JETPACK_BOOST_SLUG' ) ) {
			define( 'JETPACK_BOOST_SLUG', 'jetpack-boost' );
		}
		$callback = null;
		Actions\expectAdded( 'load-boost-test-page' )->once()->with(
			Mockery::on(
				function ( $handler ) use ( &$callback ) {
					$callback = $handler;
					return is_callable( $handler );
				}
			)
		);
		( new Admin() )->handle_admin_menu();
		$this->assertIsCallable( $callback );
		$callback();
		$entry = new Modules_State_Entry( array( Cloud_CSS::class ) );
		$entry->get();
		$this->api_response = array( Premium_Features::CLOUD_CSS );
		$callback();
		$this->assertSame(
			array(
				'active'    => true,
				'available' => true,
			),
			$entry->get()['cloud_css']
		);
		$this->assertTrue( get_option( Premium_Features::CLOUD_CSS_NOTICE_OPTION ) );
		$this->assertSame( 1, $requested );
	}

	public function test_existing_premium_site_keeps_cloud_css_off_even_after_plan_returns() {
		Actions\expectDone( 'jetpack_boost_module_status_updated' )->never();
		$this->observe_plan( array( Premium_Features::CLOUD_CSS ) );
		$this->observe_plan( array() );
		$this->observe_plan( array( Premium_Features::CLOUD_CSS ) );
		$this->assertFalse( ( new Status( 'cloud_css' ) )->get() );
		$this->assertFalse( get_option( Premium_Features::CLOUD_CSS_NOTICE_OPTION ) );
	}

	public function test_stored_manual_disable_before_free_baseline_survives_plan_return() {
		Actions\expectDone( 'jetpack_boost_module_status_updated' )->never();
		$status = new Status( Cloud_CSS::get_slug() );
		$status->set( true );
		$status->set( false );
		$this->observe_plan( array() );
		$this->observe_plan( array( Premium_Features::CLOUD_CSS ) );
		$this->assertFalse( $status->get() );
		$this->assertFalse( get_option( Premium_Features::CLOUD_CSS_NOTICE_OPTION ) );
	}

	public function test_free_site_saves_another_module_before_baseline_then_upgrades() {
		$entry                         = new Modules_State_Entry( array( Cloud_CSS::class, Minify_JS::class ) );
		$states                        = $entry->get();
		$states['minify_js']['active'] = true;
		Actions\expectDone( 'jetpack_boost_module_status_updated' )->once()->with( 'minify_js', true );
		Actions\expectDone( 'jetpack_boost_module_status_updated' )->once()->with( 'cloud_css', true );
		$entry->set( $states );
		$this->assertNull( get_option( Status::get_option_name( Cloud_CSS::get_slug() ), null ) );
		$this->observe_plan( array() );
		$this->observe_plan( array( Premium_Features::CLOUD_CSS ) );
		$this->assertTrue( ( new Status( Cloud_CSS::get_slug() ) )->get() );
		$this->assertTrue( get_option( Premium_Features::CLOUD_CSS_NOTICE_OPTION ) );
	}
}
