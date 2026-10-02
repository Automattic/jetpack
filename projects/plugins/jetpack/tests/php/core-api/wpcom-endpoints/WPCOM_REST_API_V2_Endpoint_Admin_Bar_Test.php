<?php
/**
 * Tests for /wpcom/v2/admin-bar endpoint.
 */

use PHPUnit\Framework\Attributes\CoversClass;
use WpOrg\Requests\Requests;

require_once dirname( __DIR__, 2 ) . '/lib/Jetpack_REST_TestCase.php';

/**
 * Class WPCOM_REST_API_V2_Endpoint_Admin_Bar_Test
 *
 * @covers \WPCOM_REST_API_V2_Endpoint_Admin_Bar
 */
#[CoversClass( WPCOM_REST_API_V2_Endpoint_Admin_Bar::class )]
class WPCOM_REST_API_V2_Endpoint_Admin_Bar_Test extends Jetpack_REST_TestCase {

	/**
	 * Administrator user ID.
	 *
	 * @var int
	 */
	private static $user_id = 0;

	/**
	 * Create shared database fixtures.
	 *
	 * @param WP_UnitTest_Factory $factory Fixture factory.
	 */
	public static function wpSetUpBeforeClass( $factory ) {
		static::$user_id = $factory->user->create( array( 'role' => 'administrator' ) );
	}

	/**
	 * Setup the environment for a test.
	 */
	public function set_up() {
		parent::set_up();

		wp_set_current_user( static::$user_id );
		add_action( 'admin_bar_menu', array( $this, 'add_stats_node' ), 100 );
	}

	/**
	 * Reset the environment after a test.
	 */
	public function tear_down() {
		remove_action( 'admin_bar_menu', array( $this, 'add_stats_node' ), 100 );
		parent::tear_down();
	}

	/**
	 * Adds a Stats sparkline node, as the Stats admin bar does.
	 *
	 * @param WP_Admin_Bar $wp_admin_bar The admin bar.
	 */
	public function add_stats_node( $wp_admin_bar ) {
		$wp_admin_bar->add_menu(
			array(
				'id'   => 'stats',
				'href' => admin_url( 'admin.php?page=stats' ),
			)
		);
	}

	/**
	 * The omnibar reads the Stats sparkline node, with its link, from this endpoint.
	 */
	public function test_returns_the_stats_node() {
		$response = $this->server->dispatch( new WP_REST_Request( Requests::GET, '/wpcom/v2/admin-bar' ) );

		$this->assertSame( 200, $response->get_status() );
		$this->assertContains( 'stats', wp_list_pluck( $response->get_data()['nodes'], 'id' ) );
	}
}
