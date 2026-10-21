<?php
/**
 * Tests that the modernized dashboard keeps JITMs while dropping foreign notices.
 *
 * @package automattic/jetpack-backup
 */

namespace Automattic\Jetpack\Backup\V0005;

use Automattic\Jetpack\JITMS\JITM;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;
use function add_action;
use function add_filter;
use function has_action;
use function remove_all_actions;
use function remove_all_filters;
use function set_current_screen;

require_once __DIR__ . '/mock-wp-build-render-page.php';

/**
 * @covers \Automattic\Jetpack\Backup\V0005\Jetpack_Backup
 */
#[CoversClass( Jetpack_Backup::class )]
class Admin_Notices_Suppression_Test extends TestCase {

	private const SCREEN_ID = 'jetpack_page_jetpack-backup';

	/**
	 * A stand-in for another plugin's upsell notice.
	 *
	 * @var callable
	 */
	private $foreign_notice;

	public function setUp(): void {
		parent::setUp();

		$this->foreign_notice = static function () {
			echo 'third-party upsell';
		};

		set_current_screen( self::SCREEN_ID );
		$_GET['page'] = Jetpack_Backup::JETPACK_BACKUP_SLUG;

		add_filter( Jetpack_Backup::MODERNIZATION_FILTER, '__return_true' );
	}

	public function tearDown(): void {
		remove_all_filters( Jetpack_Backup::MODERNIZATION_FILTER );
		remove_all_actions( 'admin_notices' );
		remove_all_actions( 'all_admin_notices' );
		remove_all_actions( 'admin_enqueue_scripts' );

		unset( $_GET['page'] );
		set_current_screen( 'front' );

		parent::tearDown();
	}

	/**
	 * Registers one foreign callback and one belonging to a JITM instance.
	 *
	 * @return array{0: callable, 1: array} The foreign callback and the JITM one.
	 */
	private function register_both_notices() {
		// WordPress registers its own `admin_notices` callbacks; the cases below are
		// about which of OUR two survive, so start from an empty hook.
		remove_all_actions( 'admin_notices' );

		$jitm          = JITM::get_instance();
		$jitm_callback = array( $jitm, 'ajax_message' );

		add_action( 'admin_notices', $this->foreign_notice );
		add_action( 'admin_notices', $jitm_callback );

		return array( $this->foreign_notice, $jitm_callback );
	}

	/**
	 * @dataProvider provide_notice_hooks
	 *
	 * @param string $hook Hook the foreign notice is registered on.
	 */
	#[DataProvider( 'provide_notice_hooks' )]
	public function test_modern_dashboard_drops_a_third_party_notice( $hook ) {
		$this->register_both_notices();
		add_action( $hook, $this->foreign_notice );

		Jetpack_Backup::admin_init();

		$this->assertFalse(
			has_action( $hook, $this->foreign_notice ),
			"Another plugin's notice must not survive onto the modernized dashboard."
		);
	}

	/**
	 * @return array<string, array{0: string}>
	 */
	public static function provide_notice_hooks() {
		return array(
			'admin_notices'     => array( 'admin_notices' ),
			'all_admin_notices' => array( 'all_admin_notices' ),
		);
	}

	public function test_modern_dashboard_keeps_the_jitm_notice() {
		list( , $jitm_callback ) = $this->register_both_notices();

		Jetpack_Backup::admin_init();

		$this->assertNotFalse(
			has_action( 'admin_notices', $jitm_callback ),
			'JITMs are a first-party channel and must survive the suppression.'
		);
	}

	public function test_legacy_dashboard_suppresses_nothing() {
		remove_all_filters( Jetpack_Backup::MODERNIZATION_FILTER );
		add_filter( Jetpack_Backup::MODERNIZATION_FILTER, '__return_false' );

		list( $foreign, $jitm_callback ) = $this->register_both_notices();

		Jetpack_Backup::admin_init();

		$this->assertNotFalse( has_action( 'admin_notices', $foreign ) );
		$this->assertNotFalse( has_action( 'admin_notices', $jitm_callback ) );
	}

	public function test_a_screen_that_opted_out_of_jitms_gets_none_back() {
		remove_all_actions( 'admin_notices' );
		add_action( 'admin_notices', $this->foreign_notice );

		Jetpack_Backup::admin_init();

		$this->assertSame(
			array(),
			$this->registered_admin_notice_callbacks(),
			'With no JITM hooked, suppression must leave the hook empty rather than inventing one.'
		);
	}

	/**
	 * @return array<int, mixed> Callbacks currently on `admin_notices`.
	 */
	private function registered_admin_notice_callbacks() {
		global $wp_filter;

		if ( ! isset( $wp_filter['admin_notices'] ) ) {
			return array();
		}

		$found = array();
		foreach ( $wp_filter['admin_notices']->callbacks as $callbacks ) {
			foreach ( $callbacks as $callback ) {
				$found[] = $callback['function'];
			}
		}

		return $found;
	}
}
