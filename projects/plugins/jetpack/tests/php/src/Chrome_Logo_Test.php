<?php
/**
 * Tests the Chrome_Logo class.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Plugin\Chrome_Logo;
use PHPUnit\Framework\Attributes\CoversClass;

/**
 * Tests the Chrome_Logo class.
 *
 * @covers \Automattic\Jetpack\Plugin\Chrome_Logo
 */
#[CoversClass( Chrome_Logo::class )]
class Chrome_Logo_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * A label makes the mark the element's accessible name.
	 */
	public function test_a_label_names_the_mark() {
		$svg = Chrome_Logo::render( 20, '', 'Jetpack logo' );

		$this->assertStringContainsString( 'role="img"', $svg );
		$this->assertStringContainsString( 'aria-label="Jetpack logo"', $svg );
		$this->assertStringNotContainsString( 'aria-hidden', $svg );
	}

	/**
	 * Without a label the mark is decorative, so it stays out of the accessibility tree.
	 */
	public function test_no_label_hides_the_mark() {
		$svg = Chrome_Logo::render( 16, 'jp-akismet-logo' );

		$this->assertStringContainsString( 'aria-hidden="true"', $svg );
		$this->assertStringNotContainsString( 'role="img"', $svg );
		$this->assertStringNotContainsString( 'aria-label', $svg );
	}

	/**
	 * The class attribute is omitted entirely rather than rendered empty.
	 */
	public function test_class_is_omitted_when_empty() {
		$this->assertStringContainsString( 'class="jp-akismet-logo"', Chrome_Logo::render( 16, 'jp-akismet-logo' ) );
		$this->assertStringNotContainsString( 'class=', Chrome_Logo::render( 20 ) );
	}

	/**
	 * Both callers render the mark at their own size.
	 */
	public function test_height_comes_from_the_caller() {
		$this->assertStringContainsString( 'height="20"', Chrome_Logo::render( 20 ) );
		$this->assertStringContainsString( 'height="16"', Chrome_Logo::render( 16 ) );
	}

	/**
	 * Attribute order is load-bearing: these are the exact strings the masthead and the
	 * Akismet footer rendered before the mark was shared.
	 */
	public function test_markup_matches_what_the_call_sites_rendered() {
		$this->assertSame(
			'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" height="20" role="img" aria-label="Jetpack logo"><path fill="#069e08" d="M16,0C7.2,0,0,7.2,0,16s7.2,16,16,16s16-7.2,16-16S24.8,0,16,0z M15,19H7l8-16V19z M17,29V13h8L17,29z"></path></svg>',
			Chrome_Logo::render( 20, '', 'Jetpack logo' )
		);
		$this->assertSame(
			'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" height="16" class="jp-akismet-logo" aria-hidden="true"><path fill="#069e08" d="M16,0C7.2,0,0,7.2,0,16s7.2,16,16,16s16-7.2,16-16S24.8,0,16,0z M15,19H7l8-16V19z M17,29V13h8L17,29z"></path></svg>',
			Chrome_Logo::render( 16, 'jp-akismet-logo' )
		);
	}
}
