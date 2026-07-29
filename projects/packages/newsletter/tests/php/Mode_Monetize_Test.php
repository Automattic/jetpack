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

	/**
	 * The nav's Settings item is unchanged, while the Dashboard's "Make it yours"
	 * row asks the identity section to focus the title. Both go to the same tab,
	 * so the hint has to be on one and not the other.
	 */
	public function test_settings_slug_carries_a_focus_hint_only_when_asked() {
		$method = new \ReflectionMethod( Mode::class, 'get_settings_slug' );
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}

		$plain   = $method->invoke( null );
		$focused = $method->invoke( null, 'newsletter-title' );

		$this->assertStringNotContainsString( 'focus', $plain );
		// The SPA router reads one encoded `p` param, so the nested query has to
		// arrive encoded rather than as separate args.
		$this->assertStringContainsString( rawurlencode( '/?tab=settings' ), $plain );
		$this->assertStringContainsString(
			rawurlencode( '/?tab=settings&focus=newsletter-title' ),
			$focused
		);
	}
}
