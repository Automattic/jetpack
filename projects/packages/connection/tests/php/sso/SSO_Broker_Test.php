<?php
/**
 * Tests for SSO broker URL functionality.
 *
 * @package automattic/jetpack-connection
 */

namespace Automattic\Jetpack\Connection;

use Automattic\Jetpack\Connection\SSO\Helpers;
use Automattic\Jetpack\Constants;
use WorDBless\BaseTestCase;

/**
 * Tests for SSO broker URL support (CIAB stores).
 */
class SSO_Broker_Test extends BaseTestCase {

	/**
	 * Clean up after each test.
	 */
	public function tear_down() {
		delete_transient( SSO::BROKER_URL_TRANSIENT );
		delete_transient( SSO::BROKER_AUTH_URL_TRANSIENT );
		Constants::clear_constants();
		parent::tear_down();
	}

	/**
	 * Test get_broker_url returns false when no transient is set.
	 */
	public function test_get_broker_url_returns_false_when_no_transient() {
		$this->assertFalse( SSO::get_broker_url() );
	}

	/**
	 * Test get_broker_url returns the URL when a valid HTTPS transient is set.
	 */
	public function test_get_broker_url_returns_url_when_valid_https_transient() {
		set_transient( SSO::BROKER_URL_TRANSIENT, 'https://my.woo.ai/sso', 600 );
		$this->assertSame( 'https://my.woo.ai/sso', SSO::get_broker_url() );
	}

	/**
	 * Test get_broker_url rejects and deletes a non-HTTPS transient.
	 */
	public function test_get_broker_url_rejects_http_url() {
		set_transient( SSO::BROKER_URL_TRANSIENT, 'http://my.woo.ai/sso', 600 );
		$this->assertFalse( SSO::get_broker_url() );
		$this->assertFalse( get_transient( SSO::BROKER_URL_TRANSIENT ) );
	}

	/**
	 * Test get_broker_url rejects and deletes a malformed URL.
	 */
	public function test_get_broker_url_rejects_malformed_url() {
		set_transient( SSO::BROKER_URL_TRANSIENT, 'not-a-url', 600 );
		$this->assertFalse( SSO::get_broker_url() );
		$this->assertFalse( get_transient( SSO::BROKER_URL_TRANSIENT ) );
	}

	/**
	 * Test get_broker_url rejects a non-string transient value.
	 */
	public function test_get_broker_url_rejects_non_string_transient() {
		set_transient( SSO::BROKER_URL_TRANSIENT, array( 'not' => 'a string' ), 600 );
		$this->assertFalse( SSO::get_broker_url() );
	}

	/**
	 * Test get_broker_url rejects a URL with no host.
	 */
	public function test_get_broker_url_rejects_url_without_host() {
		set_transient( SSO::BROKER_URL_TRANSIENT, 'https:///path-only', 600 );
		$this->assertFalse( SSO::get_broker_url() );
		$this->assertFalse( get_transient( SSO::BROKER_URL_TRANSIENT ) );
	}

	/**
	 * Test get_broker_auth_url returns false when no transient is set.
	 */
	public function test_get_broker_auth_url_returns_false_when_no_transient() {
		$this->assertFalse( SSO::get_broker_auth_url() );
	}

	/**
	 * Test get_broker_auth_url returns the URL when a valid HTTPS transient is set.
	 */
	public function test_get_broker_auth_url_returns_url_when_valid_https_transient() {
		set_transient( SSO::BROKER_AUTH_URL_TRANSIENT, 'https://my.woo.ai/authorize', 600 );
		$this->assertSame( 'https://my.woo.ai/authorize', SSO::get_broker_auth_url() );
	}

	/**
	 * Test get_broker_auth_url rejects and deletes a non-HTTPS transient.
	 */
	public function test_get_broker_auth_url_rejects_http_url() {
		set_transient( SSO::BROKER_AUTH_URL_TRANSIENT, 'http://my.woo.ai/authorize', 600 );
		$this->assertFalse( SSO::get_broker_auth_url() );
		$this->assertFalse( get_transient( SSO::BROKER_AUTH_URL_TRANSIENT ) );
	}

	/**
	 * Test get_broker_auth_url rejects a non-string transient value.
	 */
	public function test_get_broker_auth_url_rejects_non_string_transient() {
		set_transient( SSO::BROKER_AUTH_URL_TRANSIENT, array( 'not' => 'a string' ), 600 );
		$this->assertFalse( SSO::get_broker_auth_url() );
	}

	/**
	 * Test broker_url and broker_auth_url are independent.
	 */
	public function test_broker_urls_are_independent() {
		set_transient( SSO::BROKER_URL_TRANSIENT, 'https://my.woo.ai/sso', 600 );
		$this->assertSame( 'https://my.woo.ai/sso', SSO::get_broker_url() );
		$this->assertFalse( SSO::get_broker_auth_url() );

		set_transient( SSO::BROKER_AUTH_URL_TRANSIENT, 'https://my.woo.ai/authorize', 600 );
		$this->assertSame( 'https://my.woo.ai/sso', SSO::get_broker_url() );
		$this->assertSame( 'https://my.woo.ai/authorize', SSO::get_broker_auth_url() );
	}

	/**
	 * Test get_sso_base_url returns wordpress.com when no broker is set.
	 */
	public function test_get_sso_base_url_defaults_to_wpcom() {
		$this->assertSame( 'https://wordpress.com/wp-login.php', SSO::get_sso_base_url() );
	}

	/**
	 * Test get_sso_base_url returns broker URL when set.
	 */
	public function test_get_sso_base_url_returns_broker_when_set() {
		set_transient( SSO::BROKER_URL_TRANSIENT, 'https://my.woo.ai/sso', 600 );
		$this->assertSame( 'https://my.woo.ai/sso', SSO::get_sso_base_url() );
	}

	/**
	 * Test get_sso_base_url falls back to wordpress.com when broker URL is invalid.
	 */
	public function test_get_sso_base_url_falls_back_for_invalid_broker() {
		set_transient( SSO::BROKER_URL_TRANSIENT, 'http://insecure.example.com', 600 );
		$this->assertSame( 'https://wordpress.com/wp-login.php', SSO::get_sso_base_url() );
	}

	/**
	 * Test allowed_redirect_hosts includes broker host when broker URL is set.
	 */
	public function test_allowed_redirect_hosts_includes_broker_host() {
		set_transient( SSO::BROKER_URL_TRANSIENT, 'https://my.woo.ai/sso', 600 );
		Constants::set_constant( 'JETPACK__API_BASE', 'https://jetpack.wordpress.com/jetpack.' );

		$hosts = Helpers::allowed_redirect_hosts( array() );
		$this->assertContains( 'my.woo.ai', $hosts );
	}

	/**
	 * Test allowed_redirect_hosts includes broker auth host when set.
	 */
	public function test_allowed_redirect_hosts_includes_broker_auth_host() {
		set_transient( SSO::BROKER_AUTH_URL_TRANSIENT, 'https://auth.woo.ai/authorize', 600 );
		Constants::set_constant( 'JETPACK__API_BASE', 'https://jetpack.wordpress.com/jetpack.' );

		$hosts = Helpers::allowed_redirect_hosts( array() );
		$this->assertContains( 'auth.woo.ai', $hosts );
	}

	/**
	 * Test allowed_redirect_hosts includes both broker hosts when they differ.
	 */
	public function test_allowed_redirect_hosts_includes_both_broker_hosts() {
		set_transient( SSO::BROKER_URL_TRANSIENT, 'https://my.woo.ai/sso', 600 );
		set_transient( SSO::BROKER_AUTH_URL_TRANSIENT, 'https://auth.woo.ai/authorize', 600 );
		Constants::set_constant( 'JETPACK__API_BASE', 'https://jetpack.wordpress.com/jetpack.' );

		$hosts = Helpers::allowed_redirect_hosts( array() );
		$this->assertContains( 'my.woo.ai', $hosts );
		$this->assertContains( 'auth.woo.ai', $hosts );
	}

	/**
	 * Test allowed_redirect_hosts does not add broker host when no broker is set.
	 */
	public function test_allowed_redirect_hosts_excludes_broker_when_not_set() {
		Constants::set_constant( 'JETPACK__API_BASE', 'https://jetpack.wordpress.com/jetpack.' );

		$hosts = Helpers::allowed_redirect_hosts( array() );
		$this->assertNotContains( 'my.woo.ai', $hosts );
	}

	/**
	 * Test allowed_redirect_hosts does not add broker host when URL is not HTTPS.
	 */
	public function test_allowed_redirect_hosts_excludes_insecure_broker() {
		set_transient( SSO::BROKER_URL_TRANSIENT, 'http://insecure.example.com', 600 );
		Constants::set_constant( 'JETPACK__API_BASE', 'https://jetpack.wordpress.com/jetpack.' );

		$hosts = Helpers::allowed_redirect_hosts( array() );
		$this->assertNotContains( 'insecure.example.com', $hosts );
	}

	/**
	 * Test allowed_redirect_hosts still includes default hosts when broker is set.
	 */
	public function test_allowed_redirect_hosts_preserves_defaults_with_broker() {
		set_transient( SSO::BROKER_URL_TRANSIENT, 'https://my.woo.ai/sso', 600 );
		Constants::set_constant( 'JETPACK__API_BASE', 'https://jetpack.wordpress.com/jetpack.' );

		$hosts = Helpers::allowed_redirect_hosts( array( 'test.com' ) );
		$this->assertContains( 'test.com', $hosts );
		$this->assertContains( 'wordpress.com', $hosts );
		$this->assertContains( 'jetpack.wordpress.com', $hosts );
		$this->assertContains( 'my.woo.ai', $hosts );
	}

	/**
	 * Test disconnect clears both broker transients.
	 */
	public function test_disconnect_clears_broker_transients() {
		set_transient( SSO::BROKER_URL_TRANSIENT, 'https://my.woo.ai/sso', 600 );
		set_transient( SSO::BROKER_AUTH_URL_TRANSIENT, 'https://my.woo.ai/authorize', 600 );
		$this->assertNotFalse( get_transient( SSO::BROKER_URL_TRANSIENT ) );
		$this->assertNotFalse( get_transient( SSO::BROKER_AUTH_URL_TRANSIENT ) );

		SSO::disconnect();
		$this->assertFalse( get_transient( SSO::BROKER_URL_TRANSIENT ) );
		$this->assertFalse( get_transient( SSO::BROKER_AUTH_URL_TRANSIENT ) );
	}

	/**
	 * Test the broker transient constant values are stable.
	 */
	public function test_broker_transient_constant_values() {
		$this->assertSame( 'jetpack_sso_broker_url', SSO::BROKER_URL_TRANSIENT );
		$this->assertSame( 'jetpack_sso_broker_auth_url', SSO::BROKER_AUTH_URL_TRANSIENT );
	}
}
