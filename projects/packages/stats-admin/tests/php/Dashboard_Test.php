<?php
namespace Automattic\Jetpack\Stats_Admin;

use Automattic\Jetpack\Current_Plan;
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
	 * How many site records WordPress.com was asked for.
	 *
	 * @var int
	 */
	private $site_record_requests = 0;

	/**
	 * The plan fetch this test owns, so it can be removed again.
	 *
	 * @var \Closure|null
	 */
	private $site_record_filter;

	/**
	 * The timeout the site record request carried.
	 *
	 * @var int|null
	 */
	private $site_record_timeout;

	/**
	 * Returning the environment into its initial state.
	 */
	public function tearDown(): void {
		if ( $this->site_record_filter ) {
			remove_filter( 'pre_http_request', $this->site_record_filter, 9 );
			$this->site_record_filter = null;
		}
		delete_transient( Dashboard::PLAN_REFRESH_TRANSIENT );
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

	/**
	 * Answer the site record fetch with a Personal plan, counting the requests it takes.
	 */
	private function serve_a_personal_plan() {
		$this->site_record_filter = function ( $response, $parsed_args, $url ) {
			if ( strpos( $url, '/sites/999?' ) === false ) {
				return $response;
			}

			++$this->site_record_requests;
			$this->site_record_timeout = isset( $parsed_args['timeout'] ) ? (int) $parsed_args['timeout'] : null;

			return array(
				'response' => array(
					'code'    => 200,
					'message' => 'ok',
				),
				'body'     => '{"plan":{"product_slug":"personal-bundle","features":{"active":["stats-paid"]}}}',
			);
		};

		add_filter( 'pre_http_request', $this->site_record_filter, 9, 3 );
	}

	/**
	 * A site that never stored a plan would print the paywalls of a free site, and the app cannot
	 * correct that for itself, so opening the page fetches the plan first. See STATS-475.
	 */
	public function test_opening_the_page_fills_an_empty_plan_cache() {
		$this->serve_a_personal_plan();

		( new Dashboard() )->admin_init();

		$this->assertSame( 1, $this->site_record_requests );
		$this->assertSame( array( 'stats-paid' ), Current_Plan::get()['features']['active'] );

		// The client always sends a timeout of its own, so `http_request_timeout` cannot cap this
		// and the request has to carry the cap itself.
		$this->assertSame( 5, $this->site_record_timeout );
	}

	/**
	 * WordPress.com can keep answering without a plan, so the fetch is throttled rather than
	 * repeated on every load of the page.
	 */
	public function test_the_plan_is_not_fetched_again_within_the_throttle() {
		$this->site_record_filter = function ( $response, $parsed_args, $url ) {
			if ( strpos( $url, '/sites/999?' ) === false ) {
				return $response;
			}

			++$this->site_record_requests;

			return array(
				'response' => array(
					'code'    => 200,
					'message' => 'ok',
				),
				'body'     => '{}',
			);
		};
		add_filter( 'pre_http_request', $this->site_record_filter, 9, 3 );

		( new Dashboard() )->admin_init();
		$this->reset_plan_caches();
		( new Dashboard() )->admin_init();

		$this->assertSame( 1, $this->site_record_requests );
	}

	/**
	 * A stored plan already carries the features the app needs.
	 */
	public function test_a_populated_plan_cache_is_left_alone() {
		$this->serve_a_personal_plan();
		update_option(
			Current_Plan::PLAN_OPTION,
			array(
				'product_slug' => 'personal-bundle',
				'features'     => array( 'active' => array( 'stats-paid' ) ),
			),
			true
		);
		$this->reset_plan_caches();

		( new Dashboard() )->admin_init();

		$this->assertSame( 0, $this->site_record_requests );
	}

	/**
	 * A site that answers feature checks from its own registry has nothing to gain from the fetch.
	 */
	public function test_a_site_with_a_feature_registry_does_not_fetch_the_plan() {
		$this->serve_a_personal_plan();
		$this->make_site_atomic();

		( new Dashboard() )->admin_init();

		$this->assertSame( 0, $this->site_record_requests );
	}

	/**
	 * A registry holding nothing is a site whose data has not synced as readily as one that bought
	 * nothing, so it is WordPress.com that has to settle it.
	 */
	public function test_a_site_whose_registry_has_no_purchases_fetches_the_plan() {
		$this->serve_a_personal_plan();
		$this->make_site_atomic();
		$GLOBALS['wpcom_test_site_purchases'] = array();

		( new Dashboard() )->admin_init();

		$this->assertSame( 1, $this->site_record_requests );
	}

	/**
	 * An unconnected site cannot sign the request, and the page it gets offers a plan anyway.
	 */
	public function test_an_unconnected_site_does_not_fetch_the_plan() {
		$this->serve_a_personal_plan();
		$this->disconnect_site();

		( new Dashboard() )->admin_init();

		$this->assertSame( 0, $this->site_record_requests );
	}
}
