<?php
/**
 * Tests for Newsletter Mode admin request surfaces.
 *
 * @package automattic/jetpack-newsletter
 */

namespace Automattic\Jetpack\Newsletter\Tests;

use Automattic\Jetpack\Newsletter\Mode;
use Automattic\Jetpack\Newsletter\Settings;
use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;

/**
 * The mode only takes over explicitly marked wp-admin requests.
 *
 * @covers \Automattic\Jetpack\Newsletter\Mode
 */
#[CoversClass( Mode::class )]
class Mode_Request_Surface_Test extends BaseTestCase {

	/**
	 * Original GET params.
	 *
	 * @var array
	 */
	private $original_get;

	/**
	 * Original pagenow value.
	 *
	 * @var string|null
	 */
	private $original_pagenow;

	/**
	 * Original current screen.
	 *
	 * @var mixed
	 */
	private $original_current_screen;

	/**
	 * Original menu globals.
	 *
	 * @var array
	 */
	private $original_menu_globals;

	/**
	 * Set up before each test.
	 */
	public function set_up() {
		parent::set_up();

		$this->original_get            = $_GET;
		$this->original_pagenow        = $GLOBALS['pagenow'] ?? null;
		$this->original_current_screen = $GLOBALS['current_screen'] ?? null;
		$this->original_menu_globals   = array(
			'menu'              => $GLOBALS['menu'] ?? null,
			'submenu'           => $GLOBALS['submenu'] ?? null,
			'admin_page_hooks'  => $GLOBALS['admin_page_hooks'] ?? null,
			'_registered_pages' => $GLOBALS['_registered_pages'] ?? null,
			'_parent_pages'     => $GLOBALS['_parent_pages'] ?? null,
		);

		$user_id = wp_insert_user(
			array(
				'user_login' => 'mode_surface_admin',
				'user_pass'  => 'password',
				'user_email' => 'mode_surface_admin@example.com',
				'first_name' => 'Alex',
				'role'       => 'administrator',
			)
		);

		wp_set_current_user( $user_id );
		add_filter( 'jetpack_newsletter_mode_available', '__return_true' );
		update_option( Mode::OPTION_NAME, true );
		$this->set_admin_request();
	}

	/**
	 * Tear down after each test.
	 */
	public function tear_down() {
		$_GET = $this->original_get;

		if ( null === $this->original_pagenow ) {
			unset( $GLOBALS['pagenow'] );
		} else {
			$GLOBALS['pagenow'] = $this->original_pagenow;
		}

		if ( null === $this->original_current_screen ) {
			unset( $GLOBALS['current_screen'] );
		} else {
			$GLOBALS['current_screen'] = $this->original_current_screen;
		}

		remove_filter( 'jetpack_newsletter_mode_available', '__return_true' );
		remove_filter( 'jetpack_show_newsletter_menu_item', '__return_false' );
		delete_option( Mode::OPTION_NAME );
		wp_dequeue_style( 'jetpack-newsletter-mode' );
		wp_deregister_style( 'jetpack-newsletter-mode' );
		foreach ( $this->original_menu_globals as $global => $value ) {
			if ( null === $value ) {
				unset( $GLOBALS[ $global ] );
			} else {
				$GLOBALS[ $global ] = $value;
			}
		}

		parent::tear_down();
	}

	/**
	 * Put the test request in wp-admin.
	 *
	 * @param string $pagenow Current admin script.
	 */
	private function set_admin_request( $pagenow = 'admin.php' ) {
		set_current_screen( 'dashboard' );
		$GLOBALS['pagenow'] = $pagenow;
		$_GET               = array();
	}

	/**
	 * Put the test request on a specific admin page.
	 *
	 * @param string $page Page slug.
	 */
	private function visit_admin_page( $page ) {
		$this->set_admin_request();
		$_GET['page'] = $page;
	}

	/**
	 * The unified Newsletter page is active, but an unrelated admin page is not.
	 */
	public function test_active_for_request_matches_newsletter_settings_page() {
		$this->visit_admin_page( Settings::ADMIN_PAGE_SLUG );

		$this->assertTrue( Mode::is_active_for_request() );

		$this->visit_admin_page( 'jetpack' );

		$this->assertFalse( Mode::is_active_for_request() );

		set_current_screen( 'front' );
		$_GET['page'] = Settings::ADMIN_PAGE_SLUG;

		$this->assertFalse( Mode::is_active_for_request() );
	}

	/**
	 * Mode surfaces are the two package pages plus marked Posts and Comments.
	 */
	public function test_mode_surface_matches_own_pages_and_marked_core_screens() {
		$this->visit_admin_page( Settings::ADMIN_PAGE_SLUG );
		$this->assertTrue( Mode::is_mode_surface() );

		$this->visit_admin_page( Mode::PAGE_DASHBOARD );
		$this->assertTrue( Mode::is_mode_surface() );

		$this->set_admin_request( 'edit.php' );
		$this->assertFalse( Mode::is_mode_surface() );

		$_GET[ Mode::NAV_QUERY_ARG ] = 1;
		$this->assertTrue( Mode::is_mode_surface() );

		$this->set_admin_request( 'edit-comments.php' );
		$_GET[ Mode::NAV_QUERY_ARG ] = 1;
		$this->assertTrue( Mode::is_mode_surface() );
	}

	/**
	 * The body class helper restores the classes the page styles are scoped to.
	 */
	public function test_body_class_marks_active_surfaces_for_layout_css() {
		$this->visit_admin_page( Settings::ADMIN_PAGE_SLUG );

		$this->assertStringContainsString(
			'jetpack_page_jetpack-newsletter',
			Mode::maybe_add_body_class( 'existing' )
		);

		$this->visit_admin_page( Mode::PAGE_DASHBOARD );

		$this->assertStringContainsString(
			'admin_page_' . Mode::PAGE_DASHBOARD,
			Mode::maybe_add_body_class( 'existing' )
		);
	}

	/**
	 * Hidden mode pages get a useful browser-tab title.
	 */
	public function test_admin_title_names_hidden_mode_pages() {
		$this->visit_admin_page( Mode::PAGE_DASHBOARD );

		$this->assertSame(
			'Dashboard - Site',
			Mode::maybe_filter_admin_title( ' - Site', '' )
		);
		$this->assertSame(
			'Existing - Site',
			Mode::maybe_filter_admin_title( 'Existing - Site', 'Existing' )
		);

		$this->visit_admin_page( Settings::ADMIN_PAGE_SLUG );

		$this->assertSame(
			'Newsletter - Site',
			Mode::maybe_filter_admin_title( ' - Site', '' )
		);
	}

	/**
	 * Posts and Comments point parent_file at the query-marked nav slugs.
	 */
	public function test_core_screen_parent_file_switches_to_marked_nav_slug() {
		$this->set_admin_request( 'edit.php' );
		$_GET[ Mode::NAV_QUERY_ARG ] = 1;

		$this->assertSame(
			'edit.php?' . Mode::NAV_QUERY_ARG . '=1',
			Mode::maybe_mark_core_screen_current( 'edit.php' )
		);

		$this->set_admin_request( 'edit-comments.php' );
		$_GET[ Mode::NAV_QUERY_ARG ] = 1;

		$this->assertSame(
			'edit-comments.php?' . Mode::NAV_QUERY_ARG . '=1',
			Mode::maybe_mark_core_screen_current( 'edit-comments.php' )
		);

		$this->set_admin_request( 'index.php' );

		$this->assertSame( 'index.php', Mode::maybe_mark_core_screen_current( 'index.php' ) );
	}

	/**
	 * The Dashboard screen is aliased back to its wp-build page id.
	 */
	public function test_alias_screen_id_rewrites_dashboard_screen() {
		$screen = (object) array( 'id' => 'admin_page_' . Mode::PAGE_DASHBOARD );

		$this->visit_admin_page( Mode::PAGE_DASHBOARD );
		Mode::alias_screen_id( $screen );

		$this->assertSame( Mode::PAGE_DASHBOARD, $screen->id );

		$screen->id = 'unchanged';
		$this->visit_admin_page( Settings::ADMIN_PAGE_SLUG );
		Mode::alias_screen_id( $screen );

		$this->assertSame( 'unchanged', $screen->id );
	}

	/**
	 * The Dashboard gets the mode-only script data; other pages do not.
	 */
	public function test_script_data_is_added_only_on_dashboard_page() {
		$this->visit_admin_page( Settings::ADMIN_PAGE_SLUG );

		$this->assertSame( array( 'existing' => true ), Mode::maybe_add_script_data( array( 'existing' => true ) ) );

		$this->visit_admin_page( Mode::PAGE_DASHBOARD );
		$data = Mode::maybe_add_script_data( array( 'existing' => true ) );

		$this->assertTrue( $data['existing'] );
		$this->assertArrayHasKey( 'newsletter_mode', $data );
		$this->assertSame( 'Alex', $data['newsletter_mode']['greetingName'] );
		$this->assertSame( admin_url( 'post-new.php' ), $data['newsletter_mode']['writeUrl'] );
		$this->assertSame( home_url(), $data['newsletter_mode']['siteUrl'] );
		$this->assertStringContainsString( 'focus%3Dnewsletter-title', $data['newsletter_mode']['settingsUrl'] );
		$this->assertStringContainsString( 'edit.php?' . Mode::NAV_QUERY_ARG . '=1', $data['newsletter_mode']['postsUrl'] );
		$this->assertFalse( $data['newsletter_mode']['checklistDismissed'] );
		$this->assertFalse( $data['newsletter_mode']['introSeen'] );
		$this->assertStringContainsString( 'images/newsletter-intro.png', $data['newsletter_mode']['introArtUrl'] );
		$this->assertSame( array(), $data['newsletter_mode']['checklistCompleted'] );
		$this->assertStringContainsString( 'https://wordpress.com/earn/', $data['newsletter_mode']['monetizeUrl'] );
	}

	/**
	 * The hidden Dashboard page falls back cleanly before the wp-build bundle is present.
	 */
	public function test_dashboard_render_falls_back_to_stub_without_build() {
		ob_start();
		Mode::render_dashboard_page();
		$html = ob_get_clean();

		$this->assertStringContainsString( '<h1>Dashboard</h1>', $html );
		$this->assertStringContainsString( 'Coming soon.', $html );
	}

	/**
	 * The mode route marker is preserved through core list-table forms.
	 */
	public function test_nav_marker_field_renders_on_mode_surfaces() {
		$this->set_admin_request( 'edit.php' );
		$_GET[ Mode::NAV_QUERY_ARG ] = 1;

		ob_start();
		Mode::maybe_render_nav_marker_field();
		$html = ob_get_clean();

		$this->assertSame(
			'<input type="hidden" name="' . Mode::NAV_QUERY_ARG . '" value="1" />',
			$html
		);

		$this->set_admin_request( 'edit.php' );

		ob_start();
		Mode::maybe_render_nav_marker_field();
		$html = ob_get_clean();

		$this->assertSame( '', $html );
	}

	/**
	 * The decluttered mode chrome styles are registered only on mode surfaces.
	 */
	public function test_mode_assets_enqueue_only_on_mode_surfaces() {
		$this->visit_admin_page( 'jetpack' );

		Mode::maybe_enqueue_mode_assets();

		$this->assertFalse( wp_style_is( 'jetpack-newsletter-mode', 'enqueued' ) );

		$this->visit_admin_page( Settings::ADMIN_PAGE_SLUG );

		Mode::maybe_enqueue_mode_assets();

		$this->assertTrue( wp_style_is( 'jetpack-newsletter-mode', 'enqueued' ) );

		$style = wp_styles()->registered['jetpack-newsletter-mode'];
		$css   = implode( "\n", $style->extra['after'] );

		$this->assertStringContainsString( '.jetpack-newsletter-mode-header', $css );
		$this->assertStringContainsString( 'https://wordpress.com/earn/', $css );
		$this->assertStringContainsString( 'jetpack-newsletter-home', $css );
	}

	/**
	 * The mode header script injects the header, Write button, exit link, and
	 * external-link attributes for Monetize.
	 */
	public function test_mode_header_script_renders_on_mode_surfaces() {
		$this->visit_admin_page( Settings::ADMIN_PAGE_SLUG );

		ob_start();
		Mode::maybe_render_mode_header();
		$html = ob_get_clean();

		$this->assertStringContainsString( 'jetpack-newsletter-mode-header', $html );
		$this->assertStringContainsString( 'jetpack-newsletter-mode-write', $html );
		$this->assertStringContainsString( 'jetpack-newsletter-mode-back', $html );
		$this->assertStringContainsString( 'noopener noreferrer', $html );
	}

	/**
	 * The Newsletter-page nav highlighter is only needed on the shared Settings page.
	 */
	public function test_newsletter_nav_highlighter_renders_only_on_newsletter_page() {
		$this->visit_admin_page( Mode::PAGE_DASHBOARD );

		ob_start();
		Mode::maybe_highlight_newsletter_nav_item();
		$html = ob_get_clean();

		$this->assertSame( '', $html );

		$this->visit_admin_page( Settings::ADMIN_PAGE_SLUG );

		ob_start();
		Mode::maybe_highlight_newsletter_nav_item();
		$html = ob_get_clean();

		$this->assertStringContainsString( 'pushState', $html );
		$this->assertStringContainsString( 'tab=settings', $html );
	}

	/**
	 * The Write editor fallback back-url override runs only for newsletter-sourced writes.
	 */
	public function test_write_back_url_override_targets_newsletter_source() {
		$this->visit_admin_page( 'write' );

		ob_start();
		Mode::maybe_override_write_back_url();
		$html = ob_get_clean();

		$this->assertSame( '', $html );

		$_GET['source'] = 'newsletter';

		ob_start();
		Mode::maybe_override_write_back_url();
		$html = ob_get_clean();

		$this->assertStringContainsString( 'a.bw-back', $html );
		$this->assertStringContainsString( 'admin.php?page=' . Mode::PAGE_DASHBOARD, $html );
	}

	/**
	 * Registering the mode menu hides the legacy Jetpack submenu.
	 */
	public function test_register_admin_menu_hides_the_legacy_newsletter_submenu() {
		Mode::maybe_register_admin_menu();

		$this->assertFalse( apply_filters( 'jetpack_show_newsletter_menu_item', true ) );
	}
}
