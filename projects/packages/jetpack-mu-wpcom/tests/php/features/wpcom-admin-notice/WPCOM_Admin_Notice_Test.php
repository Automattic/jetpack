<?php
/**
 * @package automattic/jetpack-mu-wpcom
 */

declare( strict_types = 1 );

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Connection\Tokens;
use Automattic\Jetpack\Connection\Utils as Connection_Utils;
use Automattic\Jetpack\Jetpack_Mu_Wpcom;
use PHPUnit\Framework\Attributes\CoversFunction;
use PHPUnit\Framework\Attributes\DataProvider;

//phpcs:ignore WordPressVIPMinimum.Files.IncludingFile.NotAbsolutePath
require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/wpcom-admin-notice/wpcom-admin-notice.php';

/**
 * @covers ::wpcom_add_admin_notice
 * @covers ::wpcom_get_admin_notice
 */
#[CoversFunction( 'wpcom_add_admin_notice' )]
#[CoversFunction( 'wpcom_get_admin_notice' )]
class WPCOM_Admin_Notice_Test extends \WorDBless\BaseTestCase {

	public function set_up() {
		parent::set_up();

		wp_set_current_user(
			wp_insert_user(
				array(
					'user_login' => 'admin_notice_user',
					'user_pass'  => 'password',
					'user_email' => 'admin_notice_user@example.com',
					'role'       => 'administrator',
				)
			)
		);
		\Jetpack_Options::update_option( 'id', 12345 );
		( new Tokens() )->update_blog_token( 'blog.token' );
		( new Connection_Manager() )->reset_connection_status();
		// Without this the client has no API host to sign a URL for.
		Connection_Utils::init_default_constants();
		set_current_screen( 'edit-post' );

		add_filter( 'pre_http_request', array( $this, 'answer' ), 10, 3 );
		add_filter( 'jetpack_jitm_received_envelopes', array( $this, 'serve' ), 10, 2 );
	}

	public function tear_down() {
		remove_filter( 'pre_http_request', array( $this, 'answer' ), 10 );
		remove_filter( 'jetpack_jitm_received_envelopes', array( $this, 'serve' ), 10 );
		remove_filter( 'jetpack_jitm_received_envelopes', '__return_empty_array', 20 );
		remove_filter( 'jetpack_just_in_time_msgs', '__return_false' );
		set_current_screen( 'post' );
		get_current_screen()->is_block_editor( false );
		wp_set_current_user( 0 );
		\Jetpack_Options::delete_option( array( 'id', 'blog_token', 'hide_jitm' ) );
		( new Connection_Manager() )->reset_connection_status();

		parent::tear_down();
	}

	/**
	 * Stands in for WordPress.com, which serves no messages of its own.
	 *
	 * @return array
	 */
	public function answer() {
		return array(
			'response' => array( 'code' => 200 ),
			'body'     => '[]',
		);
	}

	/**
	 * Serves the WordPress beta message for the admin notice path.
	 *
	 * @param array  $envelopes    Messages WordPress.com served.
	 * @param string $message_path Message path.
	 * @return array
	 */
	public function serve( $envelopes, $message_path ) {
		if ( WPCOM_ADMIN_NOTICE_MESSAGE_PATH !== $message_path ) {
			return $envelopes;
		}

		return array(
			(object) array(
				'id'             => 'wp_prerelease',
				'feature_class'  => 'wp_prerelease',
				'expires'        => YEAR_IN_SECONDS,
				'max_dismissal'  => 1,
				'is_dismissible' => true,
				'content'        => (object) array(
					'message' => 'Your site is running WordPress 7.2 Beta as part of early access.',
					'icon'    => '',
				),
				'CTA'            => (object) array(
					'message' => 'Learn more',
					'link'    => '/sites/example.com/settings/wordpress',
					'hook'    => '',
				),
			),
		);
	}

	private function render(): string {
		ob_start();
		wpcom_add_admin_notice();
		return (string) ob_get_clean();
	}

	public function test_renders_the_served_message() {
		$html = $this->render();

		$this->assertStringContainsString( '<div id="wpcom-admin-notice" class="notice notice-info is-dismissible">', $html );
		$this->assertStringContainsString( '<p>Your site is running WordPress 7.2 Beta as part of early access.</p>', $html );
		$this->assertStringContainsString( '<a href="https://wordpress.com/sites/example.com/settings/wordpress" class="button">Learn more</a>', $html );
		$this->assertTrue( wp_script_is( 'jp-tracks' ), 'Atomic wp-admin needs the Tracks script for the notice events.' );
	}

	/**
	 * @dataProvider provide_hidden_cases
	 * @param callable $arrange Puts the site in the state under test.
	 */
	#[DataProvider( 'provide_hidden_cases' )]
	public function test_renders_nothing( callable $arrange ) {
		$arrange();

		$this->assertSame( '', $this->render() );
	}

	public static function provide_hidden_cases() {
		return array(
			'nothing served'      => array(
				static function () {
					add_filter( 'jetpack_jitm_received_envelopes', '__return_empty_array', 20 );
				},
			),
			'JITMs turned off'    => array(
				static function () {
					add_filter( 'jetpack_just_in_time_msgs', '__return_false' );
				},
			),
			'block editor screen' => array(
				static function () {
					set_current_screen( 'post' );
					get_current_screen()->is_block_editor( true );
				},
			),
		);
	}

	public function test_dismissal_is_handled_outside_the_classic_interface() {
		//phpcs:ignore WordPressVIPMinimum.Files.IncludingFile.NotAbsolutePath
		require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/wpcom-sidebar-notice/wpcom-sidebar-notice.php';
		// The file re-adds this filter, whose callback the tests don't load.
		remove_filter( 'pre_option_wpcom_admin_interface', 'wpcom_admin_interface_pre_get_option' );

		$this->assertNotFalse( has_action( 'wp_ajax_wpcom_dismiss_sidebar_notice', 'wpcom_dismiss_sidebar_notice' ) );
	}
}
