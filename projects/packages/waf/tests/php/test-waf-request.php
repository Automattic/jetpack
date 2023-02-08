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
	use \Yoast\PHPUnitPolyfills\Polyfills\AssertIsType;

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

	/**
	 * Test Waf_Request::normalize_header_name()
	 *
	 * @testWith [ "CONTENTTYPE",    "contenttype" ]
	 *           [ "T E  S T",       "t-e--s-t" ]
	 *           [ "T_E__S___T",     "t-e--s---t" ]
	 *           [ "My_Header Name", "my-header-name" ]
	 * @param string $input     The un-normalized header name.
	 * @param string $expected  The expected normalized header name.
	 */
	public function testNormalizeHeaderName( $input, $expected ) {
		$request = new Waf_Request();
		$this->assertSame( $expected, $request->normalize_header_name( $input ) );
	}

	/**
	 * Test Waf_Request::get_headers()
	 */
	public function testGetHeaders() {
		// ensure entries from $_SERVER are interpreted correctly
		$_SERVER['notaheader']      = 'wrong';
		$_SERVER['http_headername'] = 'test';
		$_SERVER['CONTENT_TYPE']    = 'mocked/content-type';
		$_SERVER['CONTENT_LENGTH']  = '1234567890';
		$request                    = new Waf_Request();
		$headers                    = $request->get_headers();
		$this->assertNotContains( array( 'notaheader', 'wrong' ), $headers );
		$this->assertContains( array( 'headername', 'test' ), $headers );
		$this->assertContains( array( 'content-type', 'mocked/content-type' ), $headers );
		$this->assertContains( array( 'content-length', '1234567890' ), $headers );
		// ensure defaults for Content-Type and Content-Length are used if not found
		unset( $_SERVER['CONTENT_TYPE'] );
		unset( $_SERVER['CONTENT_LENGTH'] );
		$request = new Waf_Request();
		$headers = $request->get_headers();
		$this->assertContains( array( 'content-type', 'application/octet-stream' ), $headers );
		$this->assertContains( array( 'content-length', '0' ), $headers );
	}

	/**
	 * Test Waf_Request::get_method()
	 */
	public function testGetMethod() {
		$_SERVER['REQUEST_METHOD'] = 'OPTIONS';
		$request                   = new Waf_Request();
		$this->assertSame( 'OPTIONS', $request->get_method() );
	}

	/**
	 * Test Waf_Request::get_protocol()
	 */
	public function testGetProtocol() {
		// test default
		$_SERVER['SERVER_PROTOCOL'] = 'TEST';
		$request                    = new Waf_Request();
		$this->assertSame( 'TEST', $request->get_protocol() );
	}

	/**
	 * Test Waf_Request::get_uri()
	 */
	public function testGetUri() {
		// test with a "full" URI in REQUEST_URI
		$_SERVER['REQUEST_URI'] = 'https://wordpress.com/index.php';
		$request                = new Waf_Request();
		$this->assertSame( 'https://wordpress.com/index.php', $request->get_uri( true ) );
		// test with a "relative" URI in REQUEST_URI
		$_SERVER['REQUEST_URI'] = '/index.php';
		$_SERVER['HTTPS']       = 'on';
		$_SERVER['HTTP_HOST']   = 'wordpress.com';
		$request                = new Waf_Request();
		$this->assertSame( 'https://wordpress.com/index.php', $request->get_uri( true ) );
		// test with a query string
		$_SERVER['QUERY_STRING'] = 'red=1&orange=2';
		$_SERVER['REQUEST_URI']  = 'https://wordpress.com/index.php?incorrect=bad';
		$request                 = new Waf_Request();
		$this->assertSame( '/index.php?red=1&orange=2', $request->get_uri( false ) );
	}

	/**
	 * Test Waf_Request::get_filename()
	 */
	public function testGetFilename() {
		$_SERVER['REQUEST_URI'] = 'https://wordpress.com/some/file?test';
		$request                = new Waf_Request();
		$this->assertSame( '/some/file', $request->get_filename() );
		// test with a root path request
		$_SERVER['REQUEST_URI'] = 'https://wordpress.com/';
		$request                = new Waf_Request();
		$this->assertSame( '/', $request->get_filename() );
		// test with a relative root path request
		$_SERVER['REQUEST_URI'] = '/';
		$request                = new Waf_Request();
		$this->assertSame( '/', $request->get_filename() );
	}

	/**
	 * Test Waf_Request::get_query_string()
	 */
	public function testGetQueryString() {
		$_SERVER['QUERY_STRING'] = 'this=is&a=test';
		$_SERVER['REQUEST_URI']  = 'https://wordpress.com/';
		$request                 = new Waf_Request();
		$this->assertSame( '?this=is&a=test', $request->get_query_string() );
	}

	/**
	 * Test that the Waf_Request class returns $_COOKIE data correctly via Waf_Request::get_cookies().
	 */
	public function testGetCookies() {
		$_COOKIE['test_cookie'] = 'test_value';
		$request                = new Waf_Request();
		$value                  = $request->get_cookies();
		$this->assertIsArray( $value );
		$this->assertContains( array( 'test_cookie', 'test_value' ), $value );
	}

	/**
	 * Test that the Waf_Request class returns $_GET data correctly via Waf_Request::get_get_vars().
	 */
	public function testGetVarsGet() {
		$_GET['get_var'] = 'test_value';
		$_GET['get_num'] = array( 'value1' );
		$_GET['get_2']   = array( 'child' => 'value' );
		$request         = new Waf_Request();
		$value           = $request->get_get_vars();
		$this->assertIsArray( $value );
		$this->assertContains( array( 'get_var', 'test_value' ), $value );
		$this->assertContains( array( 'get_2[child]', 'value' ), $value );
		$this->assertContains( array( 'get_num[0]', 'value1' ), $value );
	}

	/**
	 * Test that the Waf_Request class returns $_POST data correctly via Waf_Request::get_post_vars().
	 */
	public function testGetVarsPost() {
		$_POST['test_var'] = 'test_value';
		$_POST['test_num'] = array( 'value1' );
		$_POST['test_2']   = array( 'child' => 'value' );
		$request           = new Waf_Request();
		$value             = $request->get_post_vars();
		$this->assertIsArray( $value );
		$this->assertContains( array( 'test_var', 'test_value' ), $value );
		$this->assertContains( array( 'test_2[child]', 'value' ), $value );
		$this->assertContains( array( 'test_num[0]', 'value1' ), $value );
	}

	/**
	 * Test that the Waf_Request class transforms and returns $_FILES data correctly via Waf_Request::get_files().
	 */
	public function testGetFiles() {
		// <input type="file" name="single"/>
		$_FILES['single'] = array( 'name' => 'single_file.pdf' );
		// <input type="file" name="double[]"/>
		// <input type="file" name="double[]"/>
		$_FILES['double'] = array( 'name' => array( 'double_1.pdf', 'double_2.pdf' ) );
		// <input type="file" name="nested[a][b]"/>
		// <input type="file" name="nested[a][c]"/>
		$_FILES['nested'] = array(
			'name' => array(
				'a' => array(
					'b' => 'nested_ab.pdf',
					'c' => 'nested_ac.pdf',
				),
			),
		);
		$request          = new Waf_Request();
		$values           = $request->get_files();
		$this->assertIsArray( $values );
		$this->assertCount( 5, $values );
		// $_FILES['single'] should turn into a single output value:
		$this->assertContains(
			array(
				'name'     => 'single',
				'filename' => 'single_file.pdf',
			),
			$values
		);
		// $_FILES['double'] should turn into two output values:
		$this->assertContains(
			array(
				'name'     => 'double[0]',
				'filename' => 'double_1.pdf',
			),
			$values
		);
		$this->assertContains(
			array(
				'name'     => 'double[1]',
				'filename' => 'double_2.pdf',
			),
			$values
		);
		// $_FILES['nested'] should turn into two output values:
		$this->assertContains(
			array(
				'name'     => 'nested[a][b]',
				'filename' => 'nested_ab.pdf',
			),
			$values
		);
		$this->assertContains(
			array(
				'name'     => 'nested[a][c]',
				'filename' => 'nested_ac.pdf',
			),
			$values
		);
	}
}
