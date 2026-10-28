<?php
/**
 * Tests for the launch-flow URL helpers.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use function Automattic\Jetpack\Jetpack_Mu_Wpcom\Common\wpcom_get_launch_site_back_to;

/**
 * Launch_Site_Url_Test class.
 */
class Launch_Site_Url_Test extends \WorDBless\BaseTestCase {

	/**
	 * Original $_SERVER value, restored after each test.
	 *
	 * @var array
	 */
	private $original_server;

	/**
	 * Set up test fixtures.
	 */
	public function set_up() {
		parent::set_up();

		$this->original_server = $_SERVER;
	}

	/**
	 * Restore globals touched by the tests.
	 */
	public function tear_down() {
		$_SERVER = $this->original_server;

		parent::tear_down();
	}

	/**
	 * Calypso only follows a `back_to` on the site's own host, whatever host the request came in on.
	 */
	public function test_back_to_uses_the_home_host_over_https() {
		$_SERVER['HTTP_HOST']   = 'example.wpcomstaging.com:8080';
		$_SERVER['REQUEST_URI'] = '/wp-admin/post.php?post=1&action=edit';

		$this->assertSame(
			'https://' . wp_parse_url( home_url(), PHP_URL_HOST ) . '/wp-admin/post.php?post=1&action=edit',
			wpcom_get_launch_site_back_to()
		);
	}
}
