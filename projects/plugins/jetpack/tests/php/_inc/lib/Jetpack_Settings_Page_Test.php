<?php
/**
 * Tests for the legacy Modules page.
 * To run: jetpack docker phpunit jetpack -- --filter=Jetpack_Settings_Page_Test
 *
 * @package automattic/jetpack
 */

use PHPUnit\Framework\Attributes\CoversMethod;

require_once JETPACK__PLUGIN_DIR . '_inc/lib/admin-pages/class.jetpack-settings-page.php';

/**
 * Covers when the Modules page hands off to My Jetpack's Features list.
 *
 * @covers Jetpack_Settings_Page::get_features_list_redirect
 */
#[CoversMethod( Jetpack_Settings_Page::class, 'get_features_list_redirect' )]
class Jetpack_Settings_Page_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	private $registered_pages;
	private $actions;
	private $user_id;

	public function set_up() {
		parent::set_up();

		global $_registered_pages, $wp_actions;
		$this->registered_pages = $_registered_pages;
		$this->actions          = $wp_actions;
		$this->user_id          = get_current_user_id();
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'administrator' ) ) );
		do_action( 'my_jetpack_init' );
		$_registered_pages[ get_plugin_page_hookname( 'my-jetpack', 'jetpack' ) ] = true;
	}

	public function tear_down() {
		remove_all_filters( 'rest_enabled' );
		global $_registered_pages, $wp_actions;
		$_registered_pages = $this->registered_pages;
		$wp_actions        = $this->actions;
		wp_set_current_user( $this->user_id );
		parent::tear_down();
	}

	public function test_sends_admins_to_the_features_list() {
		$this->assertSame(
			admin_url( 'admin.php?page=my-jetpack#/features?view=list' ),
			( new Jetpack_Settings_Page() )->get_features_list_redirect()
		);
	}

	public function test_keeps_the_page_where_my_jetpack_is_unavailable() {
		global $_registered_pages;
		unset( $_registered_pages[ get_plugin_page_hookname( 'my-jetpack', 'jetpack' ) ] );

		$this->assertNull( ( new Jetpack_Settings_Page() )->get_features_list_redirect() );
	}

	public function test_keeps_the_page_when_the_rest_api_is_disabled() {
		add_filter( 'rest_enabled', '__return_false' );

		$this->assertNull( ( new Jetpack_Settings_Page() )->get_features_list_redirect() );
	}

	public function test_keeps_the_page_for_users_who_cannot_see_the_features_tab() {
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'editor' ) ) );

		$this->assertNull( ( new Jetpack_Settings_Page() )->get_features_list_redirect() );
	}
}
