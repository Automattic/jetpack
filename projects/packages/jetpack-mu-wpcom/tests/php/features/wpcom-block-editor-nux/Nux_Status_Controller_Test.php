<?php
/**
 * @package automattic/jetpack-mu-wpcom
 */

declare( strict_types = 1 );

//phpcs:ignore WordPressVIPMinimum.Files.IncludingFile.NotAbsolutePath
require_once \Automattic\Jetpack\Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/editor-welcome-guides/editor-welcome-guides.php';
//phpcs:ignore WordPressVIPMinimum.Files.IncludingFile.NotAbsolutePath
require_once \Automattic\Jetpack\Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/wpcom-block-editor-nux/class-wp-rest-wpcom-block-editor-nux-status-controller.php';

use Automattic\Jetpack\Jetpack_Mu_Wpcom\NUX\WP_REST_WPCOM_Block_Editor_NUX_Status_Controller;
use Brain\Monkey\Functions;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunTestsInSeparateProcesses;

/**
 * Each test runs in its own process: Brain Monkey defines WPForTeams\is_wpforteams_site(),
 * and other features change behaviour once it exists.
 *
 * @covers \Automattic\Jetpack\Jetpack_Mu_Wpcom\NUX\WP_REST_WPCOM_Block_Editor_NUX_Status_Controller
 * @runTestsInSeparateProcesses
 * @preserveGlobalState disabled
 */
#[CoversClass( WP_REST_WPCOM_Block_Editor_NUX_Status_Controller::class )]
#[RunTestsInSeparateProcesses]
#[PreserveGlobalState( false )]
class Nux_Status_Controller_Test extends \WorDBless\BaseTestCase {

	/**
	 * @var int
	 */
	private $user_id;

	/**
	 * What the `wpcom_editor_welcome_guides_dismissed` filter returns.
	 *
	 * @var array
	 */
	private $dismissed = array( 'wpcom/block-editor-nux' => array( 'welcomeTour' ) );

	/**
	 * Arguments of every `wpcom_editor_welcome_guides_dismiss` call.
	 *
	 * @var array
	 */
	private $recorded = array();

	public function set_up() {
		parent::set_up();
		\Brain\Monkey\setUp();
		Functions\when( 'WPForTeams\is_wpforteams_site' )->justReturn( false );

		$GLOBALS['wpcom_site_stickers_test_value'] = array( 'editor-welcome-guides-per-user' );

		$this->user_id = wp_insert_user(
			array(
				'user_login' => 'nux_user',
				'user_pass'  => 'password',
				'user_email' => 'nux_user@example.com',
			)
		);
		wp_set_current_user( $this->user_id );

		add_filter( 'wpcom_editor_welcome_guides_dismissed', fn() => $this->dismissed );
		add_action(
			'wpcom_editor_welcome_guides_dismiss',
			function ( $user_id, $dismissed ) {
				$this->recorded[] = array( $user_id, $dismissed );
			},
			10,
			2
		);
	}

	public function tear_down() {
		unset( $GLOBALS['wpcom_site_stickers_test_value'] );
		\Brain\Monkey\tearDown();

		parent::tear_down();
	}

	private function get_show_welcome_guide() {
		return ( new WP_REST_WPCOM_Block_Editor_NUX_Status_Controller() )->get_nux_status()->get_data()['show_welcome_guide'];
	}

	private function post_show_welcome_guide( bool $show ) {
		$request = new WP_REST_Request( 'POST', '/wpcom/v2/block-editor/nux' );
		$request->set_header( 'content-type', 'application/json' );
		$request->set_body( wp_json_encode( array( 'show_welcome_guide' => $show ), JSON_UNESCAPED_SLASHES ) );

		( new WP_REST_WPCOM_Block_Editor_NUX_Status_Controller() )->update_nux_status( $request );
	}

	public static function provide_local_states() {
		return array(
			'no local status'        => array( null, true, true, false ),
			'enabled locally'        => array( 'enabled', true, true, false ),
			'dismissed locally only' => array( 'dismissed', true, false, false ),
			'sticker off'            => array( null, false, true, true ),
			'dismissed nowhere'      => array( 'enabled', true, false, true ),
		);
	}

	/**
	 * @dataProvider provide_local_states
	 */
	#[DataProvider( 'provide_local_states' )]
	public function test_read_hides_the_tour_dismissed_on_another_site( ?string $local, bool $sticker, bool $dismissed_elsewhere, bool $expected ) {
		if ( null !== $local ) {
			update_user_meta( $this->user_id, 'wpcom_block_editor_nux_status', $local );
		}
		if ( ! $sticker ) {
			unset( $GLOBALS['wpcom_site_stickers_test_value'] );
		}
		if ( ! $dismissed_elsewhere ) {
			$this->dismissed = array( 'core/edit-post' => array( 'welcomeGuide' ) );
		}

		$this->assertSame( $expected, $this->get_show_welcome_guide() );
	}

	public function test_write_reports_only_a_dismissal() {
		$this->post_show_welcome_guide( true );
		$this->assertSame( array(), $this->recorded );

		$this->post_show_welcome_guide( false );
		$this->assertSame( array( array( $this->user_id, array( 'wpcom/block-editor-nux' => array( 'welcomeTour' ) ) ) ), $this->recorded );
		$this->assertSame( 'dismissed', get_user_meta( $this->user_id, 'wpcom_block_editor_nux_status', true ) );
	}

	public function test_simple_sites_keep_their_global_attribute() {
		add_filter( 'wpcom_block_editor_nux_get_status', fn() => 'enabled' );
		add_action( 'wpcom_block_editor_nux_update_status', '__return_null' );

		$this->assertTrue( $this->get_show_welcome_guide() );

		$this->post_show_welcome_guide( false );
		$this->assertSame( array(), $this->recorded );
	}
}
