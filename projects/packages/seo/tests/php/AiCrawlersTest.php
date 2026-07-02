<?php
/**
 * Tests for the Jetpack SEO Ai_Crawlers store-intent model.
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
	 * Clear the override option before each test.
	 *
	 * @return void
	 */
	protected function setUp(): void {
		parent::setUp();
		delete_option( Ai_Crawlers::OPTION );
	}

	/**
	 * The catalog slugs whose default policy is "blocked" (the training bots).
	 *
	 * @return string[]
	 */
	private function training_slugs() {
		$slugs = array();
		foreach ( Ai_Crawlers::get_catalog() as $slug => $info ) {
			if ( 'training' === $info['type'] ) {
				$slugs[] = $slug;
			}
		}
		return $slugs;
	}

	/**
	 * With no overrides, every training bot is blocked and no answer bot is.
	 *
	 * @return void
	 */
	public function test_defaults_block_all_training_crawlers() {
		$blocked  = Ai_Crawlers::get_blocked_slugs();
		$training = $this->training_slugs();

		sort( $blocked );
		sort( $training );
		$this->assertSame( $training, $blocked );

		foreach ( Ai_Crawlers::get_catalog() as $slug => $info ) {
			if ( 'answer' === $info['type'] ) {
				$this->assertFalse( Ai_Crawlers::is_blocked( $slug ), "$slug (answer) should be allowed by default" );
			}
		}
	}

	/**
	 * A training bot absent from the override map is still blocked (new-bot
	 * auto-coverage — the whole point of the store-intent model).
	 *
	 * @return void
	 */
	public function test_training_crawler_without_override_is_blocked() {
		update_option( Ai_Crawlers::OPTION, array( 'gptbot' => false ) );
		$this->assertTrue( Ai_Crawlers::is_blocked( 'claudebot' ) );
	}

	/**
	 * An override of `{ gptbot: false }` allows GPTBot (a training bot).
	 *
	 * @return void
	 */
	public function test_override_allows_a_training_crawler() {
		update_option( Ai_Crawlers::OPTION, array( 'gptbot' => false ) );
		$this->assertFalse( Ai_Crawlers::is_blocked( 'gptbot' ) );
		$this->assertNotContains( 'gptbot', Ai_Crawlers::get_blocked_slugs() );
	}

	/**
	 * An override of `{ perplexitybot: true }` blocks PerplexityBot (an answer bot).
	 *
	 * @return void
	 */
	public function test_override_blocks_an_answer_crawler() {
		update_option( Ai_Crawlers::OPTION, array( 'perplexitybot' => true ) );
		$this->assertTrue( Ai_Crawlers::is_blocked( 'perplexitybot' ) );
		$this->assertContains( 'perplexitybot', Ai_Crawlers::get_blocked_slugs() );
	}

	/**
	 * `get_overrides()` prunes entries equal to the default and drops unknown slugs.
	 *
	 * @return void
	 */
	public function test_get_overrides_prunes_defaults_and_unknown_slugs() {
		update_option(
			Ai_Crawlers::OPTION,
			array(
				'gptbot'         => true,  // training default is blocked → pruned.
				'perplexitybot'  => false, // answer default is allowed → pruned.
				'gptbot-allowed' => false, // unknown slug → dropped.
				'not-a-real-bot' => true,  // unknown slug → dropped.
				'ccbot'          => false, // real deviation → kept.
				'oai-searchbot'  => true,  // real deviation → kept.
			)
		);

		$overrides = Ai_Crawlers::get_overrides();
		$this->assertSame(
			array(
				'ccbot'         => false,
				'oai-searchbot' => true,
			),
			$overrides
		);
	}

	/**
	 * Non-array stored values resolve to an empty override map.
	 *
	 * @return void
	 */
	public function test_get_overrides_ignores_non_array_option() {
		update_option( Ai_Crawlers::OPTION, 'nonsense' );
		$this->assertSame( array(), Ai_Crawlers::get_overrides() );
	}

	/**
	 * `append_directives` emits a `User-agent` + `Disallow: /` block for each
	 * blocked bot and leaves the output unchanged when nothing is blocked.
	 *
	 * @return void
	 */
	public function test_append_directives_emits_blocks_for_blocked_bots() {
		// Default: training bots blocked, answer bots allowed.
		$output  = Ai_Crawlers::append_directives( "User-agent: *\nDisallow:", true );
		$catalog = Ai_Crawlers::get_catalog();

		$this->assertStringContainsString( '# AI crawlers blocked via Jetpack SEO.', $output );
		$this->assertStringContainsString( 'User-agent: ' . $catalog['gptbot']['user_agent'], $output );
		$this->assertStringContainsString( 'Disallow: /', $output );
		// An allowed answer bot must not appear.
		$this->assertStringNotContainsString( 'User-agent: ' . $catalog['perplexitybot']['user_agent'], $output );
	}

	/**
	 * When nothing is blocked, the robots.txt output is returned untouched.
	 *
	 * @return void
	 */
	public function test_append_directives_unchanged_when_nothing_blocked() {
		// Allow every training bot so no bot is blocked.
		$overrides = array();
		foreach ( $this->training_slugs() as $slug ) {
			$overrides[ $slug ] = false;
		}
		update_option( Ai_Crawlers::OPTION, $overrides );

		$this->assertSame( array(), Ai_Crawlers::get_blocked_slugs() );

		$input = "User-agent: *\nDisallow:";
		$this->assertSame( $input, Ai_Crawlers::append_directives( $input, true ) );
	}

	/**
	 * Bots without official documentation get an empty redirect slug, so the AI
	 * tab omits their "Learn what it does" link; bots with docs get a real slug.
	 *
	 * @return void
	 */
	public function test_bots_without_docs_have_empty_redirect_slug() {
		$catalog = Ai_Crawlers::get_catalog();
		$this->assertSame( '', $catalog['bytespider']['redirect_slug'], 'Bytespider has no official docs' );
		$this->assertSame( 'jetpack-seo-crawler-gptbot', $catalog['gptbot']['redirect_slug'] );
	}

	/**
	 * The three environment helpers return booleans.
	 *
	 * @return void
	 */
	public function test_environment_helpers_return_bools() {
		$this->assertIsBool( Ai_Crawlers::search_engines_allowed() );
		$this->assertIsBool( Ai_Crawlers::is_crawl_restricted_subdomain() );
		$this->assertIsBool( Ai_Crawlers::has_static_robots_txt() );
	}
}
