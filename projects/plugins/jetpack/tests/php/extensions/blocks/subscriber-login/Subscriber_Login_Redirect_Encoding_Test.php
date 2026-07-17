<?php
/**
 * Subscriber Login block redirect-URL encoding tests.
 *
 * @package automattic/jetpack
 */

require_once JETPACK__PLUGIN_DIR . 'extensions/blocks/subscriber-login/subscriber-login.php';

use PHPUnit\Framework\Attributes\CoversFunction;

/**
 * Verifies get_subscriber_login_url() preserves non-ASCII (percent-encoded) post
 * URLs through the nested redirect it builds for the self-hosted JWT login flow.
 *
 * This is the block rendered by the paywall behind the "Already a paid subscriber?"
 * link. Regression test for NL-273: an emoji or other non-ASCII character in the
 * post permalink was being over-decoded to raw bytes by the time it reached the
 * subscribers/auth endpoint, stripping it and 404ing the subscriber.
 *
 * @covers ::Automattic\Jetpack\Extensions\Subscriber_Login\get_subscriber_login_url
 */
#[CoversFunction( 'Automattic\Jetpack\Extensions\Subscriber_Login\get_subscriber_login_url' )]
class Subscriber_Login_Redirect_Encoding_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Peel the two nested `redirect_url` query parameters that
	 * get_subscriber_login_url() wraps around the original destination,
	 * mimicking the single urldecode each hop applies when parsing $_GET.
	 *
	 * @param string $login_url The URL returned by get_subscriber_login_url().
	 *
	 * @return string The recovered innermost redirect URL.
	 */
	private function recover_redirect_url( string $login_url ) {
		// Layer 1: the subscribe.wordpress.com/memberships/jwt URL wraps the auth endpoint URL.
		wp_parse_str( (string) wp_parse_url( $login_url, PHP_URL_QUERY ), $outer_args );
		$auth_url = $outer_args['redirect_url'];

		// Layer 2: the subscribers/auth URL wraps the real post URL.
		wp_parse_str( (string) wp_parse_url( $auth_url, PHP_URL_QUERY ), $inner_args );
		return $inner_args['redirect_url'];
	}

	/**
	 * A percent-encoded emoji slug must survive the round trip unchanged.
	 *
	 * @return void
	 */
	public function test_emoji_url_is_preserved_through_nested_redirect() {
		$post_url = 'https://example.org/2025/08/22/%F0%9F%8C%91-the-black-moon-rises/';

		$login_url = \Automattic\Jetpack\Extensions\Subscriber_Login\get_subscriber_login_url( $post_url );

		$this->assertSame(
			$post_url,
			$this->recover_redirect_url( $login_url ),
			'Emoji percent-encoding must be preserved so the auth endpoint redirects to the real post.'
		);
	}

	/**
	 * Percent-encoded multibyte (e.g. Chinese) slugs must survive too.
	 *
	 * @return void
	 */
	public function test_non_ascii_url_is_preserved_through_nested_redirect() {
		$post_url = 'https://example.org/2025/08/22/%E4%B8%AD%E6%96%87-post/';

		$login_url = \Automattic\Jetpack\Extensions\Subscriber_Login\get_subscriber_login_url( $post_url );

		$this->assertSame( $post_url, $this->recover_redirect_url( $login_url ) );
	}

	/**
	 * Plain ASCII URLs (the previously-working case) must be unaffected.
	 *
	 * @return void
	 */
	public function test_ascii_url_is_preserved_through_nested_redirect() {
		$post_url = 'https://example.org/2025/08/22/hello-world/';

		$login_url = \Automattic\Jetpack\Extensions\Subscriber_Login\get_subscriber_login_url( $post_url );

		$this->assertSame( $post_url, $this->recover_redirect_url( $login_url ) );
	}
}
