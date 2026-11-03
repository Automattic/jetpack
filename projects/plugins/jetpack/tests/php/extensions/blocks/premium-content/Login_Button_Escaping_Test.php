<?php
/**
 * Premium Content legacy login-button label escaping tests.
 *
 * @package automattic/jetpack
 */

require_once JETPACK__PLUGIN_DIR . 'modules/subscriptions.php';
require_once JETPACK__PLUGIN_DIR . 'extensions/blocks/premium-content/_inc/subscription-service/include.php';
require_once JETPACK__PLUGIN_DIR . 'modules/memberships/class-jetpack-memberships.php';
require_once JETPACK__PLUGIN_DIR . 'extensions/blocks/premium-content/_inc/legacy-buttons.php';
require_once JETPACK__PLUGIN_DIR . 'extensions/blocks/premium-content/login-button/login-button.php';
require_once __DIR__ . '/class-test-jetpack-token-subscription-service.php';

use PHPUnit\Framework\Attributes\CoversFunction;
use Tests\Automattic\Jetpack\Extensions\Premium_Content\Test_Jetpack_Token_Subscription_Service;
use function Automattic\Jetpack\Extensions\Premium_Content\create_legacy_buttons_markup;
use function Automattic\Jetpack\Extensions\Premium_Content\render_login_button_block;
use const Automattic\Jetpack\Extensions\Premium_Content\PAYWALL_FILTER;

/**
 * The Premium Content login button emits its label from block content. On the legacy
 * path the label is the `loginButtonText` attribute, which lives in the block's
 * comment-delimited JSON and survives KSES on save even for authors without
 * `unfiltered_html`; on the modern path it is inner block content. Both must be
 * escaped on output.
 *
 * Regression test for CM-854: a crafted login button label produced a live
 * `<img onerror>` in the browser of unauthorized visitors (stored XSS).
 *
 * @covers ::Automattic\Jetpack\Extensions\Premium_Content\create_legacy_buttons_markup
 * @covers ::Automattic\Jetpack\Extensions\Premium_Content\render_login_button_block
 */
#[CoversFunction( 'Automattic\\Jetpack\\Extensions\\Premium_Content\\create_legacy_buttons_markup' )]
#[CoversFunction( 'Automattic\\Jetpack\\Extensions\\Premium_Content\\render_login_button_block' )]
class Login_Button_Escaping_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	public function set_up() {
		parent::set_up();
		Jetpack_Subscriptions::init();
		Jetpack_Options::update_option( 'id', 12345 );
		// Let the modern login-button block pass `membership_checks()` so
		// `render_login_button_block()` renders for a logged-out visitor.
		update_option( Jetpack_Memberships::$has_connected_account_option_name, 1 );
		add_filter(
			PAYWALL_FILTER,
			static function () {
				return new Test_Jetpack_Token_Subscription_Service();
			}
		);
	}

	public function tear_down() {
		remove_all_filters( PAYWALL_FILTER );
		delete_option( Jetpack_Memberships::$has_connected_account_option_name );
		Jetpack_Options::delete_option( 'id' );
		parent::tear_down();
	}

	/**
	 * Render the buttons markup for a given `loginButtonText`. The block has no
	 * plan configured, so `render_button()` returns its error markup for the
	 * subscribe button; we only care about the login-button portion here.
	 *
	 * @param string $login_button_text The attacker-controlled attribute value.
	 * @return string
	 */
	private function render( $login_button_text ) {
		return create_legacy_buttons_markup(
			array( 'loginButtonText' => $login_button_text ),
			'',
			(object) array( 'context' => array() )
		);
	}

	/**
	 * `wp_kses_post()` strips event handlers from the label, so markup in the
	 * attribute cannot fire in the browser.
	 *
	 * @return void
	 */
	public function test_login_button_text_strips_event_handler_payload() {
		$markup = $this->render( '</a><img src=x onerror=alert(document.cookie)><a>' );

		$this->assertStringNotContainsString( 'onerror', $markup, 'The onerror handler must be stripped from the login button label.' );
	}

	/**
	 * A `<script>` tag in the label must not survive.
	 *
	 * @return void
	 */
	public function test_login_button_text_strips_script_tag() {
		$markup = $this->render( '<script>alert(document.cookie)</script>Log In' );

		$this->assertStringNotContainsString( '<script', $markup );
		$this->assertStringContainsString( 'Log In', $markup );
	}

	/**
	 * Safe inline markup is preserved, matching how the `jetpack/button` block
	 * treats its own label. This is why `wp_kses_post()` is the right escape here
	 * rather than `esc_html()`, which would render the markup as visible text.
	 *
	 * @return void
	 */
	public function test_login_button_text_preserves_safe_inline_markup() {
		$markup = $this->render( '<strong>Members</strong> Log In' );

		$this->assertStringContainsString( '<strong>Members</strong> Log In', $markup );
	}

	/**
	 * Plain-text labels must render unchanged so the fix does not regress the
	 * common case.
	 *
	 * @return void
	 */
	public function test_login_button_text_preserves_plain_text() {
		$markup = $this->render( 'Members Log In' );

		$this->assertStringContainsString( '>Members Log In</a>', $markup );
	}

	/**
	 * An empty label must fall back to the translated default so the escaping
	 * ternary does not regress the out-of-the-box button.
	 *
	 * @return void
	 */
	public function test_login_button_text_falls_back_to_default() {
		$markup = $this->render( '' );

		$this->assertStringContainsString( '>Log In</a>', $markup );
	}

	/**
	 * Render the modern `premium-content/login-button` block for a logged-out
	 * visitor, given the saved inner-block content.
	 *
	 * @param string $content The saved block content (the anchor and its label).
	 * @return string
	 */
	private function render_modern( $content ) {
		wp_set_current_user( 0 );
		unset( $_COOKIE['wp-jp-premium-content-session'] );

		return render_login_button_block( array(), $content );
	}

	/**
	 * Defense in depth: even if a payload reaches the saved content of the modern
	 * login-button block (e.g. authored by an `unfiltered_html` user), the render
	 * escapes it so it can never fire in a visitor's browser.
	 *
	 * @return void
	 */
	public function test_modern_login_button_strips_event_handler_payload() {
		$markup = $this->render_modern( '<div class="wp-block-button"><a class="wp-block-button__link"></a><img src=x onerror=alert(document.cookie)><a></a></div>' );

		$this->assertStringNotContainsString( 'onerror', $markup, 'The onerror handler must be stripped from the modern login button output.' );
	}

	/**
	 * The render must still inject the login href into the anchor and keep the
	 * visible label, so the escaping does not break the button.
	 *
	 * @return void
	 */
	public function test_modern_login_button_keeps_href_and_label() {
		$markup = $this->render_modern( '<div class="wp-block-button"><a class="wp-block-button__link">Log In</a></div>' );

		$this->assertStringContainsString( 'href=', $markup, 'The login URL must still be injected into the anchor.' );
		$this->assertStringContainsString( '>Log In</a>', $markup );
	}

	/**
	 * The injected login URL is `esc_url()`-encoded (so `&` becomes `&#038;`) and
	 * then the whole anchor is passed through `wp_kses_post()` a second time. A
	 * multi-parameter self-hosted URL must survive that double pass intact: the
	 * numeric entity must not be re-encoded to `&amp;#038;`, which would corrupt
	 * the query string and break the subscriber-auth redirect (see NL-273).
	 *
	 * @return void
	 */
	public function test_modern_login_button_href_survives_double_escape() {
		$original_host = $_SERVER['HTTP_HOST'] ?? null;
		$original_uri  = $_SERVER['REQUEST_URI'] ?? null;

		// Force a redirect that carries an `&` into the login URL's query string.
		$_SERVER['HTTP_HOST']   = 'example.com';
		$_SERVER['REQUEST_URI'] = '/gated/?utm_source=a&utm_medium=b';

		$markup = $this->render_modern( '<div class="wp-block-button"><a class="wp-block-button__link">Log In</a></div>' );

		if ( null === $original_host ) {
			unset( $_SERVER['HTTP_HOST'] );
		} else {
			$_SERVER['HTTP_HOST'] = $original_host;
		}
		if ( null === $original_uri ) {
			unset( $_SERVER['REQUEST_URI'] );
		} else {
			$_SERVER['REQUEST_URI'] = $original_uri;
		}

		$this->assertSame( 1, preg_match( '/href="([^"]+)"/', $markup, $matches ), 'The rendered anchor must expose an href.' );
		$raw     = $matches[1];
		$decoded = html_entity_decode( $raw, ENT_QUOTES );

		// Both query parameters must survive the round trip.
		$this->assertStringContainsString( 'site_id=', $decoded, 'The site_id parameter must survive escaping.' );
		$this->assertStringContainsString( 'redirect_url=', $decoded, 'The redirect_url parameter must survive escaping.' );

		// The separator must decode to a single, valid `&`. Double-encoding would
		// leave `&amp;#038;` in the raw attribute and `&#038;` after one decode.
		$this->assertStringNotContainsString( '&amp;#', $raw, 'The login href must not be double-entity-encoded.' );
		$this->assertStringContainsString( 'site_id=' . Jetpack_Options::get_option( 'id' ) . '&redirect_url=', $decoded, 'The query separator must decode to a single "&".' );
	}
}
