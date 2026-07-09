<?php
/**
 * Tests for Stats export bootstrap wiring.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics\Reports\Export;

use Automattic\Jetpack\Connection\Manager;
use PHPUnit\Framework\Attributes\After;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;
use ReflectionProperty;

/**
 * @covers \Automattic\Jetpack\PremiumAnalytics\Reports\Export\Stats_Export
 */
#[CoversClass( Stats_Export::class )]
class StatsExport_Test extends TestCase {

	/**
	 * @after
	 */
	#[After]
	public function clean_up_stats_export_state() {
		$this->set_initialized( false );
		$this->remove_hook_objects( 'rest_api_init', array( Stats_Csv_Export_Controller::class ) );
		$this->remove_hook_objects( Wp_Cron_Export_Scheduler::EXPORT_ACTION_HOOK, array( Wp_Cron_Export_Scheduler::class ) );
		$this->remove_hook_objects( Wp_Cron_Export_Scheduler::CLEANUP_HOOK, array( Wp_Cron_Export_Scheduler::class ) );
		$this->remove_hook_objects( 'init', array( Wp_Cron_Export_Scheduler::class ) );

		\Jetpack_Options::delete_option( array( 'id', 'blog_token' ) );
		( new Manager( Stats_Export::SLUG ) )->reset_connection_status();
	}

	public function test_configure_returns_without_connection() {
		\Jetpack_Options::delete_option( array( 'id', 'blog_token' ) );
		( new Manager( Stats_Export::SLUG ) )->reset_connection_status();

		Stats_Export::configure();

		$this->assertFalse( $this->has_hook_object( 'rest_api_init', Stats_Csv_Export_Controller::class, 'register_routes' ) );
	}

	public function test_configure_registers_stats_export_services_once_when_connected() {
		\Jetpack_Options::update_option( 'id', 1234 );
		\Jetpack_Options::update_option( 'blog_token', 'test.secret' );
		( new Manager( Stats_Export::SLUG ) )->reset_connection_status();

		Stats_Export::configure();

		$this->assertTrue( $this->has_hook_object( 'rest_api_init', Stats_Csv_Export_Controller::class, 'register_routes' ) );
		$this->assertTrue( $this->has_hook_object( Wp_Cron_Export_Scheduler::EXPORT_ACTION_HOOK, Wp_Cron_Export_Scheduler::class, 'process_export_job' ) );
		$this->assertTrue( $this->has_hook_object( Wp_Cron_Export_Scheduler::CLEANUP_HOOK, Wp_Cron_Export_Scheduler::class, 'cleanup_old_exports' ) );
		$this->assertTrue( $this->has_hook_object( 'init', Wp_Cron_Export_Scheduler::class, 'schedule_cleanup' ) );

		$rest_callback_count = $this->count_hook_objects( 'rest_api_init', Stats_Csv_Export_Controller::class, 'register_routes' );

		Stats_Export::configure();

		$this->assertSame( $rest_callback_count, $this->count_hook_objects( 'rest_api_init', Stats_Csv_Export_Controller::class, 'register_routes' ) );
	}

	/**
	 * Set the private initialized guard.
	 *
	 * @param bool $initialized Whether initialized.
	 * @return void
	 */
	private function set_initialized( bool $initialized ): void {
		$property = new ReflectionProperty( Stats_Export::class, 'initialized' );
		if ( PHP_VERSION_ID < 80100 ) {
			$property->setAccessible( true );
		}
		$property->setValue( null, $initialized );
	}

	/**
	 * Determine whether a hook contains an object method callback.
	 *
	 * @param string $hook   Hook name.
	 * @param string $class  Object class.
	 * @param string $method Method name.
	 * @return bool
	 */
	private function has_hook_object( string $hook, string $class, string $method ): bool {
		return $this->count_hook_objects( $hook, $class, $method ) > 0;
	}

	/**
	 * Count object method callbacks on a hook.
	 *
	 * @param string $hook   Hook name.
	 * @param string $class  Object class.
	 * @param string $method Method name.
	 * @return int
	 */
	private function count_hook_objects( string $hook, string $class, string $method ): int {
		global $wp_filter;

		if ( empty( $wp_filter[ $hook ] ) ) {
			return 0;
		}

		$count = 0;
		foreach ( $wp_filter[ $hook ]->callbacks as $callbacks ) {
			foreach ( $callbacks as $callback ) {
				$function = $callback['function'];
				if ( is_array( $function ) && is_object( $function[0] ) && is_a( $function[0], $class ) && $method === $function[1] ) {
					++$count;
				}
			}
		}

		return $count;
	}

	/**
	 * Remove object callbacks for the given classes.
	 *
	 * @param string $hook    Hook name.
	 * @param array  $classes Classes to remove.
	 * @return void
	 */
	private function remove_hook_objects( string $hook, array $classes ): void {
		global $wp_filter;

		if ( empty( $wp_filter[ $hook ] ) ) {
			return;
		}

		foreach ( $wp_filter[ $hook ]->callbacks as $priority => $callbacks ) {
			foreach ( $callbacks as $callback ) {
				$function = $callback['function'];
				if ( is_array( $function ) && is_object( $function[0] ) ) {
					foreach ( $classes as $class ) {
						if ( is_a( $function[0], $class ) ) {
							remove_action( $hook, $function, $priority );
						}
					}
				}
			}
		}
	}
}
