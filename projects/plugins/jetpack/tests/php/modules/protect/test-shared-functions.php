<?php
/**
 * Tests for modules/protect/shared_functions.php
 *
 * @package automattic/jetpack
 */

// Require the functions.
require_once JETPACK__PLUGIN_DIR . '/modules/protect/shared-functions.php';

/**
 * Tests for modules/protect/shared_functions.php
 */
class WP_Test_Jetpack_Protect_Shared_Functions extends WP_UnitTestCase {

	/**
	 * Test `jetpack_protect_get_ip` and `jetpack_clean_ip`.
	 *
	 * @covers ::jetpack_protect_get_ip
	 * @covers ::jetpack_clean_ip
	 * @dataProvider provide_jetpack_protect_get_ip
	 * @param string|false $expect Expected output.
	 * @param array        $server Data for `$_SERVER`.
	 * @param object|null  $trusted_header_data Trusted header data.
	 */
	public function test_jetpack_protect_get_ip( $expect, $server, $trusted_header_data ) {
		add_filter(
			'pre_site_option_trusted_ip_header',
			function () use ( $trusted_header_data ) {
				return $trusted_header_data;
			}
		);

		$old_server = $_SERVER;
		$_SERVER    = $server;
		try {
			$this->assertSame( $expect, jetpack_protect_get_ip() );
		} finally {
			$_SERVER = $old_server;
		}
	}

	/**
	 * Data provider for `test_jetpack_protect_get_ip`.
	 */
	public function provide_jetpack_protect_get_ip() {
		return array(
			'Basic IPv4 address'                    => array(
				'192.0.2.1',
				array( 'REMOTE_ADDR' => '192.0.2.1' ),
				null,
			),
			'Invalid IPv4 address'                  => array(
				false,
				array( 'REMOTE_ADDR' => '192.0.2.256' ),
				null,
			),
			'IPv4-as-IPv6 address'                  => array(
				'192.0.2.3',
				array( 'REMOTE_ADDR' => '::FfFf:192.0.2.3' ),
				null,
			),

			'Basic IPv6 address'                    => array(
				'2001:db8::1',
				array( 'REMOTE_ADDR' => '2001:DB8::1' ),
				null,
			),
			'Invalid IPv6 address'                  => array(
				false,
				array( 'REMOTE_ADDR' => '2001:DB8::12345' ),
				null,
			),

			'Missing trusted header'                => array(
				'192.0.2.1',
				array( 'REMOTE_ADDR' => '192.0.2.1' ),
				(object) array(
					'trusted_header' => 'HTTP_X_FORWARDED_FOR',
					'segments'       => 1,
					'reverse'        => true,
				),
			),
			'Use trusted header'                    => array(
				'192.0.2.1',
				array(
					'REMOTE_ADDR'          => '192.0.2.55',
					'HTTP_X_FORWARDED_FOR' => '192.0.2.1, 192.0.2.2, 2001:DB8::3, 192.0.2.4',
				),
				(object) array(
					'trusted_header' => 'HTTP_X_FORWARDED_FOR',
					'segments'       => 1,
					'reverse'        => true,
				),
			),
			'Use trusted header, segments = 2'      => array(
				'192.0.2.2',
				array(
					'REMOTE_ADDR'          => '192.0.2.55',
					'HTTP_X_FORWARDED_FOR' => '192.0.2.1, 192.0.2.2, 2001:DB8::3, 192.0.2.4',
				),
				(object) array(
					'trusted_header' => 'HTTP_X_FORWARDED_FOR',
					'segments'       => 2,
					'reverse'        => true,
				),
			),
			'Use trusted header, segments = 3'      => array(
				'2001:db8::3',
				array(
					'REMOTE_ADDR'          => '192.0.2.55',
					'HTTP_X_FORWARDED_FOR' => '192.0.2.1, 192.0.2.2, 2001:DB8::3, 192.0.2.4',
				),
				(object) array(
					'trusted_header' => 'HTTP_X_FORWARDED_FOR',
					'segments'       => 3,
					'reverse'        => true,
				),
			),
			'Use trusted header, too many segments' => array(
				'192.0.2.55',
				array(
					'REMOTE_ADDR'          => '192.0.2.55',
					'HTTP_X_FORWARDED_FOR' => '192.0.2.1, 192.0.2.2, 2001:DB8::3, 192.0.2.4',
				),
				(object) array(
					'trusted_header' => 'HTTP_X_FORWARDED_FOR',
					'segments'       => 10,
					'reverse'        => true,
				),
			),
			'Use trusted header, segments ignored if header has just one' => array(
				'192.0.2.1',
				array(
					'REMOTE_ADDR'          => '192.0.2.55',
					'HTTP_X_FORWARDED_FOR' => '192.0.2.1',
				),
				(object) array(
					'trusted_header' => 'HTTP_X_FORWARDED_FOR',
					'segments'       => 10,
					'reverse'        => true,
				),
			),
			'Use trusted header, unreversed'        => array(
				'2001:db8::3',
				array(
					'REMOTE_ADDR'          => '192.0.2.55',
					'HTTP_X_FORWARDED_FOR' => '192.0.2.1, 192.0.2.2, 2001:DB8::3, 192.0.2.4',
				),
				(object) array(
					'trusted_header' => 'HTTP_X_FORWARDED_FOR',
					'segments'       => 2,
					'reverse'        => false,
				),
			),
			'Trusted header has invalid IP'         => array(
				false,
				array(
					'REMOTE_ADDR'          => '192.0.2.55',
					'HTTP_X_FORWARDED_FOR' => '192.0.2.1, 192.0.2.2, 2001:DB8::12345, 192.0.2.4',
				),
				(object) array(
					'trusted_header' => 'HTTP_X_FORWARDED_FOR',
					'segments'       => 3,
					'reverse'        => true,
				),
			),
			'Trusted header has "unless"'           => array(
				'192.0.2.2',
				array(
					'REMOTE_ADDR'          => '192.0.2.55',
					'HTTP_X_FORWARDED_FOR' => '192.0.2.1, 192.0.2.2 unless 2001:DB8::12345, 192.0.2.4',
				),
				(object) array(
					'trusted_header' => 'HTTP_X_FORWARDED_FOR',
					'segments'       => 2,
					'reverse'        => true,
				),
			),

			'Trusted header includes port'          => array(
				'192.0.2.1',
				array(
					'REMOTE_ADDR'          => '192.0.2.55',
					'HTTP_X_FORWARDED_FOR' => '192.0.2.1:80, 192.0.2.2:80, 192.0.2.3:443',
				),
				(object) array(
					'trusted_header' => 'HTTP_X_FORWARDED_FOR',
					'segments'       => 1,
					'reverse'        => true,
				),
			),
			'Trusted header includes IPv6 brackets' => array(
				'2001:db8::3',
				array(
					'REMOTE_ADDR'          => '192.0.2.55',
					'HTTP_X_FORWARDED_FOR' => '192.0.2.1:80, 192.0.2.2:80, [2001:DB8::3], 192.0.2.3:443',
				),
				(object) array(
					'trusted_header' => 'HTTP_X_FORWARDED_FOR',
					'segments'       => 3,
					'reverse'        => true,
				),
			),
			'Trusted header includes IPv6 brackets and port' => array(
				'2001:db8::3',
				array(
					'REMOTE_ADDR'          => '192.0.2.55',
					'HTTP_X_FORWARDED_FOR' => '192.0.2.1:80, 192.0.2.2:80, [2001:DB8::3]:80, 192.0.2.3:443',
				),
				(object) array(
					'trusted_header' => 'HTTP_X_FORWARDED_FOR',
					'segments'       => 3,
					'reverse'        => true,
				),
			),
			'Trusted header includes IPv4-as-IPv6 brackets and port' => array(
				'192.0.2.3',
				array(
					'REMOTE_ADDR'          => '192.0.2.55',
					'HTTP_X_FORWARDED_FOR' => '192.0.2.1:80, 192.0.2.2:80, [::ffff:192.0.2.3]:80, 192.0.2.3:443',
				),
				(object) array(
					'trusted_header' => 'HTTP_X_FORWARDED_FOR',
					'segments'       => 3,
					'reverse'        => true,
				),
			),
		);
	}

}
