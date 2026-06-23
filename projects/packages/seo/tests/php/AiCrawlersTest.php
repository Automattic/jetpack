<?php
/**
 * Tests for the Jetpack SEO Ai_Crawlers robots.txt directives.
 *
 * @package automattic/jetpack-seo
 */

namespace Automattic\Jetpack\SEO;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;

/**
 * @covers \Automattic\Jetpack\SEO\Ai_Crawlers
 */
#[CoversClass( Ai_Crawlers::class )]
class AiCrawlersTest extends TestCase {

	/**
	 * Clear the blocked-crawlers option before each test.
	 *
	 * @return void
	 */
	protected function setUp(): void {
		parent::setUp();
		delete_option( Ai_Crawlers::OPTION );
	}

	/**
	 * Every catalog entry exposes a label and a user-agent token.
	 *
	 * @return void
	 */
	public function test_catalog_entries_have_label_and_user_agent() {
		$catalog = Ai_Crawlers::get_catalog();
		$this->assertNotEmpty( $catalog );
		foreach ( $catalog as $slug => $info ) {
			$this->assertIsString( $slug );
			$this->assertArrayHasKey( 'label', $info );
			$this->assertArrayHasKey( 'user_agent', $info );
			$this->assertNotEmpty( $info['user_agent'] );
		}
	}

	/**
	 * With nothing blocked, the robots.txt output is returned untouched.
	 *
	 * @return void
	 */
	public function test_append_directives_leaves_output_unchanged_when_none_blocked() {
		$input = "User-agent: *\nDisallow: /wp-admin/\n";
		$this->assertSame( $input, Ai_Crawlers::append_directives( $input, true ) );
	}

	/**
	 * Each blocked slug emits a per-user-agent `Disallow` block, using the
	 * catalog's user-agent token (not the slug), appended after the input.
	 *
	 * @return void
	 */
	public function test_append_directives_emits_disallow_per_blocked_crawler() {
		update_option( Ai_Crawlers::OPTION, array( 'bytespider', 'ccbot' ) );

		$output = Ai_Crawlers::append_directives( "User-agent: *\n", true );

		$this->assertStringStartsWith( "User-agent: *\n", $output );
		$this->assertStringContainsString( "User-agent: Bytespider\nDisallow: /", $output );
		$this->assertStringContainsString( "User-agent: CCBot\nDisallow: /", $output );
	}

	/**
	 * Unknown slugs stored in the option are ignored — only catalog crawlers count.
	 *
	 * @return void
	 */
	public function test_get_blocked_slugs_ignores_unknown_slugs() {
		update_option( Ai_Crawlers::OPTION, array( 'gptbot', 'not-a-real-bot' ) );

		$blocked = Ai_Crawlers::get_blocked_slugs();

		$this->assertContains( 'gptbot', $blocked );
		$this->assertNotContains( 'not-a-real-bot', $blocked );
	}

	/**
	 * A non-array option value degrades to an empty blocked list.
	 *
	 * @return void
	 */
	public function test_get_blocked_slugs_handles_non_array_option() {
		update_option( Ai_Crawlers::OPTION, 'oops' );
		$this->assertSame( array(), Ai_Crawlers::get_blocked_slugs() );
	}
}
