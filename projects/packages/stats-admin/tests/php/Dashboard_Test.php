<?php
namespace Automattic\Jetpack\Stats_Admin;

use Automattic\Jetpack\Stats\Options as Stats_Options;
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
		wp_dequeue_script( 'jp-stats-dashboard-bootstrap' );
		wp_deregister_script( 'jp-stats-dashboard-bootstrap' );
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
	 * The view count decides when to ask what the user makes of the dashboard, so a page that
	 * only offered them a plan must not count towards it.
	 */
	public function test_render_does_not_count_views_before_the_site_is_connected() {
		$this->disconnect_site();

		$this->expectOutputRegex( '/<div id="wpcom"/i' );
		( new Dashboard() )->render();

		$this->assertSame( 0, intval( Stats_Options::get_option( 'views' ) ) );
	}

	/**
	 * The app is served from our CDN and cannot bundle the connection package, so it registers the
	 * site through the connection REST API using the state printed alongside it.
	 */
	public function test_load_admin_scripts_prints_the_connection_state() {
		$this->disconnect_site();

		( new Dashboard() )->load_admin_scripts();

		$inline_scripts = implode( '', (array) wp_scripts()->get_data( 'jp-stats-dashboard', 'before' ) );

		$this->assertStringContainsString( 'JP_CONNECTION_INITIAL_STATE', $inline_scripts );
	}

	/**
	 * A connected site reads connection status over REST, so the blob is not printed there.
	 */
	public function test_load_admin_scripts_does_not_print_the_connection_state_when_connected() {
		( new Dashboard() )->load_admin_scripts();

		$inline_scripts = implode( '', (array) wp_scripts()->get_data( 'jp-stats-dashboard', 'before' ) );

		$this->assertStringNotContainsString( 'JP_CONNECTION_INITIAL_STATE', $inline_scripts );
	}

	/**
	 * The bootstrap that loads the icon sprite is no longer part of the page markup, so it has to
	 * reach the page through the script queue.
	 */
	public function test_load_admin_scripts_enqueues_the_bootstrap() {
		( new Dashboard() )->load_admin_scripts();

		$inline_scripts = implode( '', (array) wp_scripts()->get_data( 'jp-stats-dashboard-bootstrap', 'after' ) );

		$this->assertTrue( wp_script_is( 'jp-stats-dashboard-bootstrap', 'enqueued' ) );
		$this->assertStringContainsString( 'gridicons', $inline_scripts );
	}

	/**
	 * The bootstrap runs on jQuery, which the Odyssey bundle does not depend on, so it has to say
	 * so itself rather than rely on another admin feature having loaded it.
	 */
	public function test_bootstrap_declares_its_jquery_dependency() {
		( new Dashboard() )->load_admin_scripts();

		$this->assertContains( 'jquery', wp_scripts()->registered['jp-stats-dashboard-bootstrap']->deps );
	}

	/**
	 * The dashboard markup carries no script tag of its own.
	 */
	public function test_render_prints_no_script_tag() {
		ob_start();
		( new Dashboard() )->render();
		$output = ob_get_clean();

		$this->assertStringNotContainsString( '<script', $output );
	}

	/**
	 * Once connected the dashboard is a reporting page, open to anyone allowed to see stats.
	 */
	public function test_capability_when_connected() {
		$this->assertSame( 'view_stats', $this->get_capability() );
	}

	/**
	 * Before that it offers a plan and connects the site, which only a user who can manage the
	 * connection can act on.
	 */
	public function test_capability_when_not_connected() {
		$this->disconnect_site();

		$this->assertSame( 'jetpack_connect', $this->get_capability() );
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
