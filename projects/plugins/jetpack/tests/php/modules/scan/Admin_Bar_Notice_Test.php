<?php
require_once __DIR__ . '/../../../../modules/scan/class-admin-bar-notice.php';

use Automattic\Jetpack\Protect\Threat_Count;
use Automattic\Jetpack\Protect_Status\Protect_Status;
use Automattic\Jetpack\Redirect;
use Automattic\Jetpack\Scan\Admin_Bar_Notice;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;

/**
 * @covers \Automattic\Jetpack\Scan\Admin_Bar_Notice
 */
#[CoversClass( Admin_Bar_Notice::class )]
class Admin_Bar_Notice_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Sign in an administrator.
	 */
	public function set_up() {
		parent::set_up();
		require_once ABSPATH . WPINC . '/class-wp-admin-bar.php';
		unset( $GLOBALS['wp_actions']['jetpack_protect_dashboard_initialized'] );
		// jetpack-mu-wpcom turns notifications off on Atomic, which the wpcomsh test run simulates.
		remove_all_filters( 'jetpack_protect_threat_notifications_enabled' );
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'administrator' ) ) );
	}

	/**
	 * Forget the threats, the dashboard and the script.
	 */
	public function tear_down() {
		delete_transient( 'jetpack_scan_state' );
		Protect_Status::delete_option();
		unset( $GLOBALS['wp_actions']['jetpack_protect_dashboard_initialized'] );
		wp_deregister_script( Admin_Bar_Notice::SCRIPT_NAME );
		parent::tear_down();
	}

	/**
	 * Store a Protect report listing WordPress core vulnerabilities.
	 *
	 * @param int $vulnerabilities How many vulnerabilities the report lists.
	 * @param int $expires_in      Seconds until the report expires; negative when it already has.
	 */
	private function store_protect_report( $vulnerabilities = 1, $expires_in = -1 ) {
		update_option(
			Protect_Status::OPTION_NAME,
			(object) array(
				'last_checked' => '2026-10-14 00:00:00',
				'core'         => (object) array(
					'version'         => $GLOBALS['wp_version'],
					'vulnerabilities' => array_fill(
						0,
						$vulnerabilities,
						(object) array(
							'id'    => 'core-1',
							'title' => 'A core vulnerability',
						)
					),
				),
			)
		);
		update_option( Protect_Status::OPTION_TIMESTAMP_NAME, time() + $expires_in );
	}

	/**
	 * Whether the Protect dashboard loaded.
	 *
	 * @return array[]
	 */
	public static function provide_dashboard_states() {
		return array(
			'Protect dashboard' => array( true ),
			'Jetpack Cloud'     => array( false ),
		);
	}

	/**
	 * @dataProvider provide_dashboard_states
	 *
	 * @param bool $has_dashboard Whether the Protect dashboard loaded.
	 */
	#[DataProvider( 'provide_dashboard_states' )]
	public function test_threats_link_opens_the_protect_dashboard_in_place_or_jetpack_cloud_in_a_new_tab( $has_dashboard ) {
		if ( $has_dashboard ) {
			do_action( 'jetpack_protect_dashboard_initialized' );
			// The Protect report's count wins over Scan's transient, so the admin bar matches the Protect menu item.
			$this->store_protect_report();
			set_transient( 'jetpack_scan_state', (object) array( 'threats' => array() ) );
		} else {
			set_transient( 'jetpack_scan_state', (object) array( 'threats' => array( (object) array( 'id' => 1 ) ) ) );
		}
		$admin_bar = new WP_Admin_Bar();

		( new Admin_Bar_Notice() )->add_threats_to_toolbar( $admin_bar );

		$node = $admin_bar->get_node( 'jetpack-scan-notice' );
		$url  = $has_dashboard ? admin_url( 'admin.php?page=jetpack-protect' ) : Redirect::get_url( 'calypso-scanner' );
		$this->assertSame( esc_url( $url ), $node->href );
		$this->assertStringContainsString( 'Threat found', $node->title );
		$this->assertSame( $has_dashboard ? null : '_blank', $node->meta['target'] ?? null );
		$this->assertSame( $has_dashboard ? null : 'noopener noreferrer', $node->meta['rel'] ?? null );
	}

	/**
	 * @dataProvider provide_dashboard_states
	 *
	 * @param bool $has_dashboard Whether the Protect dashboard loaded.
	 */
	#[DataProvider( 'provide_dashboard_states' )]
	public function test_unknown_count_waits_for_the_protect_count_or_fetches_scan_state( $has_dashboard ) {
		if ( $has_dashboard ) {
			do_action( 'jetpack_protect_dashboard_initialized' );
		}

		( new Admin_Bar_Notice() )->enqueue_toolbar_script();

		$this->assertTrue( wp_script_is( Admin_Bar_Notice::SCRIPT_NAME, 'enqueued' ) );
		$data = (string) wp_scripts()->get_data( Admin_Bar_Notice::SCRIPT_NAME, 'data' );
		$this->assertSame( $has_dashboard, str_contains( $data, '"count_event":"' . Threat_Count::EVENT . '"' ) );
	}

	public function test_no_notice_when_the_host_turns_threat_notifications_off() {
		set_transient( 'jetpack_scan_state', (object) array( 'threats' => array( (object) array( 'id' => 1 ) ) ) );
		add_filter( 'jetpack_protect_threat_notifications_enabled', '__return_false' );
		$admin_bar = new WP_Admin_Bar();

		( new Admin_Bar_Notice() )->add_threats_to_toolbar( $admin_bar );

		$this->assertNull( $admin_bar->get_node( 'jetpack-scan-notice' ) );
	}

	/**
	 * Seconds until a zero-threat report expires, and whether a hidden node waits for the refresh.
	 *
	 * @return array[]
	 */
	public static function provide_zero_counts() {
		return array(
			'expired, refresh pending' => array( -1, true ),
			'fresh'                    => array( 60, false ),
		);
	}

	/**
	 * @dataProvider provide_zero_counts
	 *
	 * @param int  $expires_in Seconds until the report expires.
	 * @param bool $expected   Whether the hidden node is added.
	 */
	#[DataProvider( 'provide_zero_counts' )]
	public function test_zero_count_keeps_a_hidden_node_only_while_a_refresh_is_pending( $expires_in, $expected ) {
		do_action( 'jetpack_protect_dashboard_initialized' );
		$this->store_protect_report( 0, $expires_in );
		$admin_bar = new WP_Admin_Bar();

		( new Admin_Bar_Notice() )->add_threats_to_toolbar( $admin_bar );

		$node = $admin_bar->get_node( 'jetpack-scan-notice' );
		$this->assertSame( $expected, null !== $node );
		if ( $expected ) {
			$this->assertSame( 'error is-hidden', $node->meta['class'] );
		}
	}
}
