<?php
/**
 * Tests for the Urls class.
 *
 * @package automattic/jetpack-newsletter
 */

namespace Automattic\Jetpack\Newsletter\Tests;

use Automattic\Jetpack\Newsletter\Urls;
use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;

/**
 * @covers \Automattic\Jetpack\Newsletter\Urls
 */
#[CoversClass( Urls::class )]
class Urls_Test extends BaseTestCase {

	public function test_subscribers_url_routes_the_newsletter_page_to_the_subscribers_tab() {
		$url = Urls::get_subscribers_url();
		wp_parse_str( (string) wp_parse_url( $url, PHP_URL_QUERY ), $query );

		$this->assertStringStartsWith( admin_url( 'admin.php?' ), $url );
		$this->assertSame(
			array(
				'page' => 'jetpack-newsletter',
				'p'    => '/?tab=subscribers',
			),
			$query
		);
	}
}
