<?php
/**
 * Subscription site placement option tests.
 *
 * @package automattic/jetpack
 */

require_once JETPACK__PLUGIN_DIR . 'extensions/blocks/subscriptions/class-jetpack-subscription-site.php';

use Automattic\Jetpack\Extensions\Subscriptions\Jetpack_Subscription_Site;
use PHPUnit\Framework\Attributes\CoversClass;

/**
 * Subscription site placement option tests.
 *
 * @covers \Automattic\Jetpack\Extensions\Subscriptions\Jetpack_Subscription_Site
 */
#[CoversClass( Jetpack_Subscription_Site::class )]
class Jetpack_Subscription_Site_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	const OPTION = 'jetpack_subscriptions_subscribe_post_end_enabled';

	/**
	 * Whether an external object cache was in use before the test.
	 *
	 * @var bool
	 */
	private $was_using_ext_object_cache;

	/**
	 * Start every test with the option unset, in a back-end request.
	 */
	public function set_up() {
		parent::set_up();

		$this->was_using_ext_object_cache = wp_using_ext_object_cache();
		wp_using_ext_object_cache( false );
		add_filter( 'wp_doing_cron', '__return_true' );
		delete_option( self::OPTION );
	}

	/**
	 * Restore the request context.
	 */
	public function tear_down() {
		remove_filter( 'wp_doing_cron', '__return_true' );
		wp_using_ext_object_cache( $this->was_using_ext_object_cache );

		parent::tear_down();
	}

	/**
	 * Reads the stored row, bypassing the options cache.
	 *
	 * @return object|null
	 */
	private function get_row() {
		global $wpdb;

		return $wpdb->get_row( $wpdb->prepare( "SELECT option_value, autoload FROM $wpdb->options WHERE option_name = %s", self::OPTION ) );
	}

	public function test_seeds_a_missing_option_as_disabled_and_autoloaded() {
		Jetpack_Subscription_Site::seed_missing_options( array( self::OPTION ) );

		$row = $this->get_row();
		$this->assertSame( '0', $row->option_value );
		$this->assertContains( $row->autoload, wp_autoload_values_to_autoload() );
		$this->assertSame( '0', get_option( self::OPTION, 'missing' ) );
		$this->assertArrayHasKey( self::OPTION, wp_load_alloptions() );
	}

	public function test_keeps_an_existing_value() {
		update_option( self::OPTION, 1 );

		Jetpack_Subscription_Site::seed_missing_options( array( self::OPTION ) );

		$this->assertSame( '1', $this->get_row()->option_value );
		$this->assertSame( 1, get_option( self::OPTION ) );
	}

	public function test_keeps_a_value_saved_by_a_concurrent_request() {
		global $wpdb;

		$this->assertSame( 'missing', get_option( self::OPTION, 'missing' ) );
		$wpdb->insert(
			$wpdb->options,
			array(
				'option_name'  => self::OPTION,
				'option_value' => '1',
				'autoload'     => 'yes',
			)
		);

		Jetpack_Subscription_Site::seed_missing_options( array( self::OPTION ) );

		$this->assertSame( '1', $this->get_row()->option_value );
		$this->assertSame( '1', get_option( self::OPTION ) );
	}

	public function test_does_not_write_on_a_front_end_request() {
		remove_filter( 'wp_doing_cron', '__return_true' );
		$this->assertFalse( is_admin() );

		Jetpack_Subscription_Site::seed_missing_options( array( self::OPTION ) );

		$this->assertNull( $this->get_row() );
	}

	public function test_does_not_write_with_a_persistent_object_cache() {
		wp_using_ext_object_cache( true );

		Jetpack_Subscription_Site::seed_missing_options( array( self::OPTION ) );

		$this->assertNull( $this->get_row() );
	}
}
