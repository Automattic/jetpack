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
	 * Every catalog entry exposes a label, a user-agent token, and a known type.
	 *
	 * @return void
	 */
	public function test_catalog_entries_have_label_user_agent_and_type() {
		$catalog = Ai_Crawlers::get_catalog();
		$this->assertNotEmpty( $catalog );
		foreach ( $catalog as $slug => $info ) {
			$this->assertIsString( $slug );
			$this->assertArrayHasKey( 'label', $info );
			$this->assertArrayHasKey( 'user_agent', $info );
			$this->assertNotEmpty( $info['user_agent'] );
			$this->assertContains( $info['type'], array( 'answer', 'training' ) );
		}
	}

	/**
	 * With the list explicitly empty (everything allowed), robots.txt is untouched.
	 *
	 * @return void
	 */
	public function test_append_directives_leaves_output_unchanged_when_explicitly_none_blocked() {
		update_option( Ai_Crawlers::OPTION, array() );
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
	 * The default-blocked set is exactly the training crawlers — no answer engine
	 * is blocked by default, so the site stays citable in AI answers.
	 *
	 * @return void
	 */
	public function test_default_blocked_slugs_are_all_training_crawlers() {
		$defaults = Ai_Crawlers::default_blocked_slugs();
		$catalog  = Ai_Crawlers::get_catalog();

		$this->assertNotEmpty( $defaults );
		foreach ( $defaults as $slug ) {
			$this->assertSame( 'training', $catalog[ $slug ]['type'] );
		}
		foreach ( $catalog as $slug => $info ) {
			if ( 'answer' === $info['type'] ) {
				$this->assertNotContains( $slug, $defaults );
			}
		}
	}

	/**
	 * Before the owner configures anything (option unset), the blocked list falls
	 * back to the training-crawler default.
	 *
	 * @return void
	 */
	public function test_get_blocked_slugs_defaults_to_training_when_unconfigured() {
		$this->assertSame( Ai_Crawlers::default_blocked_slugs(), Ai_Crawlers::get_blocked_slugs() );
	}

	/**
	 * An explicit empty array (user allowed everything) is respected — it is not
	 * treated as "unconfigured".
	 *
	 * @return void
	 */
	public function test_get_blocked_slugs_respects_explicit_empty_array() {
		update_option( Ai_Crawlers::OPTION, array() );
		$this->assertSame( array(), Ai_Crawlers::get_blocked_slugs() );
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
	 * A non-array option value (other than the unset sentinel) degrades to empty.
	 *
	 * @return void
	 */
	public function test_get_blocked_slugs_handles_non_array_option() {
		update_option( Ai_Crawlers::OPTION, 'oops' );
		$this->assertSame( array(), Ai_Crawlers::get_blocked_slugs() );
	}

	/**
	 * `search_engines_allowed()` reflects the `blog_public` option.
	 *
	 * @return void
	 */
	public function test_search_engines_allowed_reflects_blog_public() {
		update_option( 'blog_public', 1 );
		$this->assertTrue( Ai_Crawlers::search_engines_allowed() );
		update_option( 'blog_public', 0 );
		$this->assertFalse( Ai_Crawlers::search_engines_allowed() );
		update_option( 'blog_public', 1 );
	}

	/**
	 * A `*.wpcomstaging.com` home URL is detected as crawl-restricted; an ordinary
	 * domain is not.
	 *
	 * @return void
	 */
	public function test_is_crawl_restricted_subdomain_detects_wpcomstaging() {
		$this->assertFalse( Ai_Crawlers::is_crawl_restricted_subdomain() );

		$staging = static function () {
			return 'https://example.wpcomstaging.com';
		};
		add_filter( 'home_url', $staging );
		try {
			$this->assertTrue( Ai_Crawlers::is_crawl_restricted_subdomain() );
		} finally {
			remove_filter( 'home_url', $staging );
		}
	}
}
