<?php
/**
 * Tests for Premium Analytics Jetpack Connection configuration.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

use Automattic\Jetpack\Connection\Plugin;
use Automattic\Jetpack\Connection\Plugin_Storage;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;

/**
 * @covers \Automattic\Jetpack\PremiumAnalytics\Connection_Configuration
 */
#[CoversClass( Connection_Configuration::class )]
class Connection_Configuration_Test extends BaseTestCase {

	/**
	 * Drop the stored plugin list, the refresh flag and the faked request method.
	 */
	public function tear_down() {
		delete_option( Plugin_Storage::ACTIVE_PLUGINS_OPTION_NAME );
		delete_transient( Plugin_Storage::ACTIVE_PLUGINS_REFRESH_FLAG );
		unset( $_SERVER['REQUEST_METHOD'] );

		parent::tear_down();
	}

	/**
	 * Premium Analytics owns the connection even when WooCommerce is not active.
	 */
	public function test_registers_connection_consumer_without_woocommerce() {
		$this->assertFalse( class_exists( 'WooCommerce' ) );
		$this->assertFalse( function_exists( 'WC' ) );

		Connection_Configuration::configure();
		( new Plugin( 'jetpack' ) )->add( 'Jetpack' );
		Plugin_Storage::configure();

		$plugins = (array) Plugin_Storage::get_all();
		$this->assertArrayHasKey( 'jetpack-premium-analytics', $plugins );
		$this->assertFalse( ( new Plugin( 'jetpack' ) )->is_only() );
	}

	/**
	 * @dataProvider provide_stale_stored_plugins
	 * @param array|null $stored Stored connected plugins; null when never stored.
	 */
	#[DataProvider( 'provide_stale_stored_plugins' )]
	public function test_a_stored_list_without_the_slug_is_refreshed_on_the_next_post( $stored ) {
		if ( null !== $stored ) {
			update_option( Plugin_Storage::ACTIVE_PLUGINS_OPTION_NAME, $stored );
		}

		Connection_Configuration::configure();
		$this->assertNotFalse( get_transient( Plugin_Storage::ACTIVE_PLUGINS_REFRESH_FLAG ) );

		Plugin_Storage::configure();
		$_SERVER['REQUEST_METHOD'] = 'POST';
		Plugin_Storage::maybe_update_active_connected_plugins();

		$this->assertArrayHasKey( 'jetpack-premium-analytics', get_option( Plugin_Storage::ACTIVE_PLUGINS_OPTION_NAME ) );

		Connection_Configuration::configure();
		$this->assertFalse( get_transient( Plugin_Storage::ACTIVE_PLUGINS_REFRESH_FLAG ) );
	}

	/**
	 * Stored lists that predate Premium Analytics being enabled.
	 *
	 * @return array
	 */
	public static function provide_stale_stored_plugins() {
		return array(
			'never stored' => array( null ),
			'jetpack only' => array( array( 'jetpack' => array( 'name' => 'Jetpack' ) ) ),
			'not an array' => array( '' ),
		);
	}

	public function test_a_stored_list_with_the_slug_is_left_alone() {
		update_option(
			Plugin_Storage::ACTIVE_PLUGINS_OPTION_NAME,
			array( 'jetpack-premium-analytics' => array( 'name' => 'Premium Analytics' ) )
		);

		Connection_Configuration::configure();

		$this->assertFalse( get_transient( Plugin_Storage::ACTIVE_PLUGINS_REFRESH_FLAG ) );
	}
}
