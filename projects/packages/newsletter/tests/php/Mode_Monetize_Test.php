<?php
/**
 * Tests for the Newsletter Mode "Monetize" destination.
 *
 * @package automattic/jetpack-newsletter
 */

namespace Automattic\Jetpack\Newsletter\Tests;

use Automattic\Jetpack\Newsletter\Mode;
use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;

/**
 * Monetize leaves wp-admin for this site's Earn screen on WordPress.com, built
 * from the same Calypso site slug the rest of the monorepo uses.
 *
 * @covers \Automattic\Jetpack\Newsletter\Mode
 */
#[CoversClass( Mode::class )]
class Mode_Monetize_Test extends BaseTestCase {

	/**
	 * The URL points at the site's Earn screen, slug and all.
	 */
	public function test_monetize_url_targets_the_calypso_earn_screen() {
		$url = Mode::get_monetize_url();

		$suffix = ( new \Automattic\Jetpack\Status() )->get_site_suffix();

		$this->assertSame( 'https://wordpress.com/earn/' . $suffix, $url );
		$this->assertNotSame( 'https://wordpress.com/earn/', $url, 'The site slug must not be empty.' );
	}

	/**
	 * The curated nav uses that URL for its Monetize item, so the two can't drift.
	 */
	public function test_nav_uses_the_monetize_url() {
		$reflection = new \ReflectionMethod( Mode::class, 'get_nav_slugs' );
		if ( PHP_VERSION_ID < 80100 ) {
			$reflection->setAccessible( true );
		}
		$nav = $reflection->invoke( null );

		$this->assertSame( Mode::get_monetize_url(), $nav['monetize'] );
		$this->assertArrayNotHasKey( 'paid', $nav );
	}
}
