<?php
/**
 * Tests for Simple's archive canonical tag.
 *
 * @package automattic/jetpack-seo
 */

namespace Automattic\Jetpack\SEO;

use Automattic\Jetpack\Constants;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

/**
 * @covers \Automattic\Jetpack\SEO\Canonical_Urls
 */
#[CoversClass( Canonical_Urls::class )]
class CanonicalUrlsTest extends TestCase {

	/**
	 * Start every test with the switch off and the printer unhooked.
	 */
	protected function setUp(): void {
		parent::setUp();
		delete_option( Canonical_Urls::OPTION );
		remove_action( 'wp_head', array( Canonical_Urls::class, 'print_tag' ) );
	}

	/**
	 * Undo the host, query and resolver state a test set.
	 */
	protected function tearDown(): void {
		delete_option( Canonical_Urls::OPTION );
		remove_action( 'wp_head', array( Canonical_Urls::class, 'print_tag' ) );
		Constants::clear_single_constant( 'IS_WPCOM' );
		\Jetpack_Canonical_Urls_Resolver::$url = '';
		$GLOBALS['wp_query']                   = new \WP_Query();
		parent::tearDown();
	}

	/**
	 * Only Simple gets the package's printer; other hosts keep the module's.
	 *
	 * @dataProvider provide_hosts
	 * @param bool $simple Whether the site is WordPress.com Simple.
	 */
	#[DataProvider( 'provide_hosts' )]
	public function test_init_hooks_the_printer_only_on_simple( $simple ) {
		if ( $simple ) {
			Constants::set_constant( 'IS_WPCOM', true );
		}

		Canonical_Urls::init();

		$this->assertSame( $simple, false !== has_action( 'wp_head', array( Canonical_Urls::class, 'print_tag' ) ) );
	}

	/**
	 * @return array<string, array{bool}>
	 */
	public static function provide_hosts() {
		return array(
			'Simple'                => array( true ),
			'Atomic or self-hosted' => array( false ),
		);
	}

	/**
	 * The printer emits one tag on an archive with the switch on, and nothing otherwise.
	 *
	 * @dataProvider provide_print_cases
	 * @param int|null $enabled  Stored option value, or null when never saved.
	 * @param bool     $singular Whether the request is a single post or page.
	 * @param string   $url      URL the resolver returns.
	 * @param string   $expected Expected output.
	 */
	#[DataProvider( 'provide_print_cases' )]
	public function test_print_tag( $enabled, $singular, $url, $expected ) {
		if ( null !== $enabled ) {
			update_option( Canonical_Urls::OPTION, $enabled );
		}
		$GLOBALS['wp_query']                   = new \WP_Query();
		$GLOBALS['wp_query']->is_singular      = $singular;
		\Jetpack_Canonical_Urls_Resolver::$url = $url;

		ob_start();
		Canonical_Urls::print_tag();

		$this->assertSame( $expected, ob_get_clean() );
	}

	/**
	 * @return array<string, array{int|null, bool, string, string}>
	 */
	public static function provide_print_cases() {
		$url = 'https://example.org/category/news/page/2/';

		return array(
			'archive, switched on'   => array( 1, false, $url, '<link rel="canonical" href="' . $url . '" />' . "\n" ),
			'archive, switched off'  => array( 0, false, $url, '' ),
			'archive, never saved'   => array( null, false, $url, '' ),
			'singular, switched on'  => array( 1, true, $url, '' ),
			'no URL for the request' => array( 1, false, '', '' ),
		);
	}
}
