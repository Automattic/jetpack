<?php
namespace Automattic\Jetpack\Stats_Admin;

use Automattic\Jetpack\Stats_Admin\TestCase as Stats_TestCase;
use ReflectionProperty;

/**
 * Unit tests for the Dashbaord class.
 *
 * @package automattic/jetpack-stats-admin
 */
class Dashboard_Test extends Stats_TestCase {
	/**
	 * Returning the environment into its initial state.
	 */
	public function tearDown(): void {
		wp_dequeue_script( 'jp-stats-dashboard' );
		wp_deregister_script( 'jp-stats-dashboard' );
		parent::tearDown();
	}

	/**
	 * Test that init sets $initialized.
	 */
	public function test_init_sets_initialized() {
		Dashboard::init();

		$rp = new ReflectionProperty( Dashboard::class, 'initialized' );
		// @todo Remove this call once we no longer need to support PHP <8.1.
		if ( PHP_VERSION_ID < 80100 ) {
			$rp->setAccessible( true );
		}
		$this->assertTrue( $rp->getValue() );
	}

	/**
	 * Test has root dom.
	 */
	public function test_render() {
		$this->expectOutputRegex( '/<div id="wpcom" class="jp-stats-dashboard".*>/i' );
		( new Dashboard() )->render();
	}

	/**
	 * The app is served from our CDN and cannot bundle the connection package, so it registers the
	 * site through the connection REST API using the state printed alongside it.
	 */
	public function test_load_admin_scripts_prints_the_connection_state() {
		( new Dashboard() )->load_admin_scripts();

		$inline_scripts = implode( '', (array) wp_scripts()->get_data( 'jp-stats-dashboard', 'before' ) );

		$this->assertStringContainsString( 'JP_CONNECTION_INITIAL_STATE', $inline_scripts );
	}

	/**
	 * Once connected the dashboard is a reporting page, open to anyone allowed to see stats.
	 */
	public function test_capability_when_connected() {
		$this->assertSame( 'view_stats', $this->get_capability() );
	}

	/**
	 * Before that it offers a plan and connects the site, which only an administrator can act on.
	 */
	public function test_capability_when_not_connected() {
		$this->disconnect_site();

		$this->assertSame( 'manage_options', $this->get_capability() );
	}

	/**
	 * Read the capability the dashboard menu is registered with.
	 *
	 * @return string
	 */
	private function get_capability() {
		$dashboard = new Dashboard();
		$method    = new \ReflectionMethod( $dashboard, 'get_capability' );
		// @todo Remove this call once we no longer need to support PHP <8.1.
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}

		return $method->invoke( $dashboard );
	}
}
