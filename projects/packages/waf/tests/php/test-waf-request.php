<?php
/**
 * Request test suite.
 *
 * @package automattic/jetpack-waf
 */

use Automattic\Jetpack\Waf\Waf_Request;

/**
 * Request test suite.
 */
class WafRequestTest extends PHPUnit\Framework\TestCase {

	/**
	 * Test for null on CLI.
	 */
	public function testIpReturnsNullIfNoRemoteAddrAndNoProxySettingsGiven() {
		unset( $_SERVER['REMOTE_ADDR'] );

		$request = new Waf_Request();
		$this->assertNull( $request->get_real_user_ip_address(), 'Remote addr is not null on CLI.' );
	}

	/**
	 * Test for simple "normal" REMOTE_ADDR header.
	 */
	public function testIpReturnsRemoteAddrIfGivenAndNoProxySettings() {
		$fixture_addr = '137.137.137.137';

		$_SERVER['REMOTE_ADDR'] = $fixture_addr;

		$request = new Waf_Request();
		$this->assertSame( $fixture_addr, $request->get_real_user_ip_address(), 'Remote addr is not as expected.' );
	}

	/**
	 * Test for getting the IP address from a trusted header from a trusted proxy.
	 */
	public function testIpAcceptsIpHeadersFromTrustedProxies() {
		$_SERVER['REMOTE_ADDR']               = '10.0.0.23';
		$_SERVER['AWESOME_TRUSTED_IP_HEADER'] = '137.0.0.2,10.0.0.23';

		$request = new Waf_Request();
		$request->set_trusted_proxies( array( '10.0.0.23' ) );
		$request->set_trusted_headers( array( 'AWESOME_TRUSTED_IP_HEADER' ) );

		$this->assertSame( '137.0.0.2', $request->get_real_user_ip_address(), 'Did not get IP address from trusted proxy.' );
	}

	/**
	 * Test for getting the IP address from a trusted header from a chained trusted proxy.
	 */
	public function testIpAcceptsIpHeadersFromTwoChainedTrustedProxies() {
		$_SERVER['REMOTE_ADDR']               = '10.0.0.20';
		$_SERVER['AWESOME_TRUSTED_IP_HEADER'] = '137.0.0.3,10.0.0.23,10.0.0.24';

		$request = new Waf_Request();
		$request->set_trusted_proxies( array( '10.0.0.20' ) );
		$request->set_trusted_headers( array( 'AWESOME_TRUSTED_IP_HEADER' ) );

		$this->assertSame( '137.0.0.3', $request->get_real_user_ip_address(), 'Did not get IP address from trusted proxy.' );
	}

	/**
	 * Test for getting the IP address from different trusted headers from different trusted proxies.
	 */
	public function testIpAcceptsMultipleIpHeadersFromMultipleTrustedProxies() {

		$request = new Waf_Request();
		$request->set_trusted_proxies( array( '11.0.0.1', '11.0.0.2' ) );
		$request->set_trusted_headers( array( 'AWESOME_TRUSTED_IP_HEADER', 'DIFFERENT_TRUSTED_IP_HEADER' ) );

		$_SERVER['REMOTE_ADDR']               = '11.0.0.1';
		$_SERVER['AWESOME_TRUSTED_IP_HEADER'] = '42.0.0.1,11.0.0.2';

		$this->assertSame( '42.0.0.1', $request->get_real_user_ip_address(), 'Did not get IP address from multiple trusted proxies and headers.' );

		$_SERVER['REMOTE_ADDR'] = '11.0.0.2';
		unset( $_SERVER['AWESOME_TRUSTED_IP_HEADER'] );
		$_SERVER['DIFFERENT_TRUSTED_IP_HEADER'] = '42.0.0.2,11.0.0.2';

		$this->assertSame( '42.0.0.2', $request->get_real_user_ip_address(), 'Did not get IP address from multiple trusted proxies and headers.' );
	}

	/**
	 * Test for ignoring trusted headers from untrusted proxies (i.e. potential attackers / header spoofers).
	 */
	public function testIpIgnoresIpHeadersFromUntrustedProxies() {
		$_SERVER['REMOTE_ADDR']               = '192.168.2.1';
		$_SERVER['AWESOME_TRUSTED_IP_HEADER'] = '137.0.0.2,10.0.0.23';

		$request = new Waf_Request();
		$request->set_trusted_proxies( array( '10.0.0.23' ) );
		$request->set_trusted_headers( array( 'AWESOME_TRUSTED_IP_HEADER' ) );

		$this->assertSame( '192.168.2.1', $request->get_real_user_ip_address(), 'Trusted headers were not ignored from untrusted proxy.' );
	}

	/**
	 * Test for ignoring common forwarding headers from untrusted proxies by default.
	 */
	public function testIpIgnoresDefaultIpForwardingHeadersFromUntrustedProxies() {
		$_SERVER['REMOTE_ADDR']              = '192.168.2.2';
		$_SERVER['HTTP_CLIENT_IP']           = '137.0.0.2,10.0.0.23';
		$_SERVER['HTTP_X_FORWARDED_FOR']     = '137.0.0.2,10.0.0.23';
		$_SERVER['HTTP_X_FORWARDED']         = '137.0.0.2,10.0.0.23';
		$_SERVER['HTTP_X_CLUSTER_CLIENT_IP'] = '137.0.0.2,10.0.0.23';
		$_SERVER['HTTP_FORWARDED_FOR']       = '137.0.0.2,10.0.0.23';
		$_SERVER['HTTP_FORWARDED']           = '137.0.0.2,10.0.0.23';

		$request = new Waf_Request();
		$request->set_trusted_proxies( array( '10.0.0.23' ) );

		$this->assertSame( '192.168.2.2', $request->get_real_user_ip_address(), 'Trusted headers were not ignored from untrusted proxy.' );
	}
}
