<?php

namespace Automattic\Jetpack_Boost\Tests\Lib;

use Automattic\Jetpack\Boost_Core\Contracts\Boost_API_Client;
use Automattic\Jetpack\Boost_Core\Lib\Boost_API;
use Automattic\Jetpack\Boost_Core\Lib\Transient;
use Automattic\Jetpack_Boost\Lib\Premium_Features;
use Automattic\Jetpack_Boost\Lib\Status;
use Automattic\Jetpack_Boost\Tests\Base_TestCase;
use Brain\Monkey\Actions;
use Brain\Monkey\Filters;
use Brain\Monkey\Functions;
use Mockery;

class Premium_Features_Test extends Base_TestCase {
	private $options      = array();
	private $premium      = false;
	private $api_response = array();
	private $previous_client;
	private $client_property;

	protected function set_up() {
		parent::set_up();
		$this->options      = array();
		$this->premium      = false;
		$this->api_response = array();
		if ( ! defined( 'DAY_IN_SECONDS' ) ) {
			define( 'DAY_IN_SECONDS', 86400 );
		}
		Functions\when( 'wp_parse_args' )->alias(
			function ( $args, $defaults ) {
				return array_merge( $defaults, (array) $args );
			}
		);
		$client = Mockery::mock( Boost_API_Client::class );
		$client->shouldReceive( 'get' )->andReturnUsing(
			function () {
				return $this->api_response;
			}
		);
		$this->client_property = new \ReflectionProperty( Boost_API::class, 'api_client' );
		if ( PHP_VERSION_ID < 80100 ) {
			$this->client_property->setAccessible( true );
		}
		$this->previous_client = $this->client_property->getValue();
		$this->client_property->setValue( null, $client );
		Functions\when( 'sanitize_title' )->returnArg();
		Functions\when( 'post_type_exists' )->justReturn( true );
		Functions\when( 'get_option' )->alias(
			function ( $name, $fallback = false ) {
				return $this->options[ $name ] ?? $fallback;
			}
		);
		Functions\when( 'update_option' )->alias(
			function ( $name, $value ) {
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
		Transient::set( Premium_Features::TRANSIENT_KEY, array(), 3600 );
		Filters\expectApplied( 'jetpack_boost_has_feature_cloud-critical-css' )->andReturnUsing(
			function () {
				return $this->premium;
			}
		);
	}

	protected function tear_down() {
		$this->client_property->setValue( null, $this->previous_client );
		parent::tear_down();
	}

	public function test_enables_cloud_css_when_feature_first_appears() {
		Actions\expectDone( 'jetpack_boost_module_status_updated' )->once()->with( 'cloud_css', true );
		Premium_Features::enable_cloud_css_after_upgrade();
		$this->premium = true;
		Premium_Features::enable_cloud_css_after_upgrade();

		$this->assertTrue( ( new Status( 'cloud_css' ) )->get() );
		$this->assertTrue( get_option( Premium_Features::CLOUD_CSS_NOTICE_OPTION ) );
	}

	public function test_manual_disable_survives_refresh_and_plan_lapse_and_return() {
		Actions\expectDone( 'jetpack_boost_module_status_updated' )->once()->with( 'cloud_css', true );
		Premium_Features::enable_cloud_css_after_upgrade();
		$this->premium = true;
		Premium_Features::enable_cloud_css_after_upgrade();
		( new Status( 'cloud_css' ) )->set( false );
		update_option( Premium_Features::CLOUD_CSS_NOTICE_OPTION, false );
		Premium_Features::clear_cache();
		Transient::set( Premium_Features::TRANSIENT_KEY, array(), 3600 );
		Premium_Features::enable_cloud_css_after_upgrade();
		$this->premium = false;
		Premium_Features::enable_cloud_css_after_upgrade();
		$this->premium = true;
		Premium_Features::enable_cloud_css_after_upgrade();

		$this->assertFalse( ( new Status( 'cloud_css' ) )->get() );
		$this->assertFalse( get_option( Premium_Features::CLOUD_CSS_NOTICE_OPTION ) );
	}

	public function test_free_site_keeps_cloud_css_off_without_confirmation() {
		Actions\expectDone( 'jetpack_boost_module_status_updated' )->never();
		Premium_Features::enable_cloud_css_after_upgrade();

		$this->assertFalse( ( new Status( 'cloud_css' ) )->get() );
		$this->assertFalse( get_option( Premium_Features::CLOUD_CSS_NOTICE_OPTION ) );
	}

	public function test_existing_premium_site_keeps_cloud_css_off_even_after_plan_returns() {
		Actions\expectDone( 'jetpack_boost_module_status_updated' )->never();
		$this->api_response = false;
		Premium_Features::enable_cloud_css_after_upgrade();
		$this->assertFalse( get_option( Premium_Features::CLOUD_CSS_BASELINE_OPTION ) );
		$this->api_response = array( Premium_Features::CLOUD_CSS );
		$this->premium      = true;
		Premium_Features::enable_cloud_css_after_upgrade();
		$this->premium = false;
		Premium_Features::enable_cloud_css_after_upgrade();
		$this->premium = true;
		Premium_Features::enable_cloud_css_after_upgrade();

		$this->assertFalse( ( new Status( 'cloud_css' ) )->get() );
		$this->assertFalse( get_option( Premium_Features::CLOUD_CSS_NOTICE_OPTION ) );
	}
}
