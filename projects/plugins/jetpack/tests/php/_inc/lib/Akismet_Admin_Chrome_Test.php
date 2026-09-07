<?php
/**
 * Akismet admin chrome unit tests.
 * To run: jetpack docker phpunit jetpack -- --filter=Akismet_Admin_Chrome_Test
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Redirect;
use Automattic\Jetpack\Status\Cache as Status_Cache;
use PHPUnit\Framework\Attributes\CoversClass;

require_once JETPACK__PLUGIN_DIR . '_inc/lib/admin-pages/class-akismet-admin-chrome.php';

/**
 * Class for testing the unified Jetpack chrome rendered on Akismet's admin pages.
 *
 * @covers Akismet_Admin_Chrome
 */
#[CoversClass( Akismet_Admin_Chrome::class )]
class Akismet_Admin_Chrome_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Reset the status cache, which memoizes both the offline-mode and the
	 * WordPress.com platform lookups the footer branches on.
	 */
	public function set_up() {
		parent::set_up();
		Status_Cache::clear();
	}

	/**
	 * Undo the constant and cached status the individual tests set.
	 */
	public function tear_down() {
		Constants::clear_single_constant( 'IS_WPCOM' );
		Status_Cache::clear();
		parent::tear_down();
	}

	/**
	 * Capture the output of one of the render callbacks.
	 *
	 * @param callable $callback Callback that echoes markup.
	 * @return string The captured markup.
	 */
	private function render( $callback ) {
		ob_start();
		$callback();
		return (string) ob_get_clean();
	}

	/**
	 * `init_hooks()` wires the header and footer callbacks, and its static guard keeps a
	 * second call from wiring them again. Both `Jetpack_Admin` (Atomic/self-hosted) and
	 * `Akismet_Admin_WPCOM` (Simple) call it, so a missing guard renders the chrome twice.
	 *
	 * Like the stylesheet guard below, the static lives for the whole process, so this has
	 * to be the only `init_hooks()` call in the test run.
	 */
	public function test_init_hooks_registers_the_chrome_callbacks_only_once() {
		$chrome = new Akismet_Admin_Chrome();
		$chrome->init_hooks();

		$this->assertNotFalse( has_action( 'akismet_header', array( $chrome, 'render_header' ) ) );
		$this->assertNotFalse( has_action( 'akismet_footer', array( $chrome, 'render_footer' ) ) );

		$second = new Akismet_Admin_Chrome();
		$second->init_hooks();

		$this->assertFalse( has_action( 'akismet_header', array( $second, 'render_header' ) ) );
		$this->assertFalse( has_action( 'akismet_footer', array( $second, 'render_footer' ) ) );
	}

	/**
	 * The header replaces Akismet's masthead with a logo and title linking back to the
	 * Akismet settings page, and brings its stylesheet with it — but only on the first
	 * render, so a page that fires `akismet_header` more than once gets one copy of the CSS.
	 *
	 * Both are asserted together because `print_styles()` guards itself with a static that
	 * lives for the whole process: only the first `render_header()` call can observe it.
	 */
	public function test_render_header_prints_the_branded_header_and_its_stylesheet_once() {
		$chrome = new Akismet_Admin_Chrome();

		$first = $this->render( array( $chrome, 'render_header' ) );

		$this->assertStringContainsString( '<style id="jp-akismet-chrome-css">', $first );
		$this->assertStringContainsString( 'href="' . esc_url( admin_url( 'admin.php?page=akismet-key-config' ) ) . '"', $first );

		$second = $this->render( array( $chrome, 'render_header' ) );

		// The header itself still renders; only the stylesheet is withheld.
		$this->assertStringContainsString( 'class="jp-akismet-header"', $second );
		$this->assertStringNotContainsString( '<style id="jp-akismet-chrome-css">', $second );
	}

	/**
	 * A site that could still be connected sends the byline out to jetpack.com, matching
	 * what `Jetpack_Admin_Page::wrap_ui()` does on the rest of the Jetpack admin.
	 */
	public function test_render_footer_links_the_byline_to_jetpack_com_when_the_site_can_connect() {
		add_filter( 'jetpack_is_connection_ready', '__return_false', PHP_INT_MAX );
		add_filter( 'jetpack_offline_mode', '__return_false', PHP_INT_MAX );
		Status_Cache::clear();

		$footer = $this->render( array( new Akismet_Admin_Chrome(), 'render_footer' ) );

		$this->assertStringContainsString( 'href="' . esc_url( Redirect::get_url( 'jetpack' ) ) . '"', $footer );
		$this->assertStringNotContainsString( 'page=jetpack_about', $footer );
	}

	/**
	 * In offline mode there is nothing to connect to, so the byline points at the local
	 * About page instead.
	 */
	public function test_render_footer_links_the_byline_to_the_about_page_when_the_site_is_offline() {
		add_filter( 'jetpack_offline_mode', '__return_true', PHP_INT_MAX );
		Status_Cache::clear();

		$footer = $this->render( array( new Akismet_Admin_Chrome(), 'render_footer' ) );

		$this->assertStringContainsString( 'href="' . esc_url( admin_url( 'admin.php?page=jetpack_about' ) ) . '"', $footer );
	}

	/**
	 * My Jetpack does not exist on WordPress.com, so the Products and Help links have to be
	 * dropped there rather than pointing at a page the site has no menu entry for.
	 */
	public function test_render_footer_hides_the_products_and_help_links_on_wpcom() {
		$chrome = new Akismet_Admin_Chrome();

		$self_hosted = $this->render( array( $chrome, 'render_footer' ) );

		$this->assertStringContainsString( 'class="jp-akismet-footer__menu"', $self_hosted );
		$this->assertStringContainsString( 'page=my-jetpack#/products', $self_hosted );

		Constants::set_constant( 'IS_WPCOM', true );
		Status_Cache::clear();

		$wpcom = $this->render( array( $chrome, 'render_footer' ) );

		$this->assertStringNotContainsString( 'class="jp-akismet-footer__menu"', $wpcom );
		$this->assertStringNotContainsString( 'page=my-jetpack', $wpcom );
		// The byline itself still renders on WordPress.com.
		$this->assertStringContainsString( 'class="jp-akismet-footer__a8c"', $wpcom );
	}
}
