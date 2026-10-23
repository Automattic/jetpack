<?php
/**
 * Tests for the Jetpack SEO Ai_Crawlers robots.txt controls.
 *
 * @package automattic/jetpack-seo
 */

namespace Automattic\Jetpack\SEO;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

/**
 * @covers \Automattic\Jetpack\SEO\Ai_Crawlers
 */
#[CoversClass( Ai_Crawlers::class )]
class AiCrawlersTest extends TestCase {

	/**
	 * Original search visibility option.
	 *
	 * @var mixed
	 */
	private $blog_public;

	/**
	 * Clear the override option before each test.
	 *
	 * @return void
	 */
	protected function setUp(): void {
		parent::setUp();
		$this->blog_public = get_option( 'blog_public', null );
		delete_option( Ai_Crawlers::OPTION );
		delete_option( 'wpcom_data_sharing_opt_out' );
		remove_filter( 'robots_txt', array( Ai_Crawlers::class, 'append_directives' ), Ai_Crawlers::ROBOTS_TXT_PRIORITY );
		remove_filter(
			'robots_txt',
			'Automattic\\Jetpack\\Jetpack_Mu_Wpcom\\Blog_Privacy\\robots_txt',
			12
		);
	}

	/**
	 * Clean up shared options and filters after each test.
	 *
	 * @return void
	 */
	protected function tearDown(): void {
		delete_option( Ai_Crawlers::OPTION );
		delete_option( 'wpcom_data_sharing_opt_out' );
		remove_filter( 'robots_txt', array( Ai_Crawlers::class, 'append_directives' ), Ai_Crawlers::ROBOTS_TXT_PRIORITY );
		remove_filter(
			'robots_txt',
			'Automattic\\Jetpack\\Jetpack_Mu_Wpcom\\Blog_Privacy\\robots_txt',
			12
		);
		if ( null === $this->blog_public ) {
			delete_option( 'blog_public' );
		} else {
			update_option( 'blog_public', $this->blog_public );
		}
		parent::tearDown();
	}

	/**
	 * With nothing blocked by the owner, no crawler is blocked and robots.txt is left untouched.
	 *
	 * @return void
	 */
	public function test_every_crawler_is_allowed_by_default() {
		$this->assertSame( array(), Ai_Crawlers::get_blocked_slugs() );

		$input = "User-agent: *\nDisallow:";
		$this->assertSame( $input, Ai_Crawlers::append_directives( $input, true ) );
	}

	/**
	 * Google-Extended also grounds Gemini answers, but is filed with the training crawlers.
	 *
	 * @return void
	 */
	public function test_google_extended_is_filed_under_training() {
		$this->assertSame( 'training', Ai_Crawlers::get_catalog()['google-extended']['type'] );
	}

	/**
	 * One crawler of each type.
	 *
	 * @return array<string, array{string}>
	 */
	public static function provide_crawlers_to_block() {
		return array(
			'training' => array( 'gptbot' ),
			'answer'   => array( 'perplexitybot' ),
		);
	}

	/**
	 * An override blocks a crawler of either type.
	 *
	 * @dataProvider provide_crawlers_to_block
	 * @param string $slug Crawler to block.
	 * @return void
	 */
	#[DataProvider( 'provide_crawlers_to_block' )]
	public function test_override_blocks_a_crawler( $slug ) {
		update_option( Ai_Crawlers::OPTION, array( $slug => true ) );
		$this->assertTrue( Ai_Crawlers::is_blocked( $slug ) );
		$this->assertSame( array( $slug ), Ai_Crawlers::get_blocked_slugs() );
	}

	/**
	 * `get_overrides()` keeps only blocked catalog crawlers.
	 *
	 * @return void
	 */
	public function test_get_overrides_keeps_only_blocked_catalog_crawlers() {
		update_option(
			Ai_Crawlers::OPTION,
			array(
				'gptbot'         => true,  // blocked → kept.
				'perplexitybot'  => false, // allowed → dropped.
				'ccbot'          => false, // allowed → dropped.
				'gptbot-allowed' => false, // unknown slug → dropped.
				'not-a-real-bot' => true,  // unknown slug → dropped.
				'oai-searchbot'  => true,  // blocked → kept.
			)
		);

		$overrides = Ai_Crawlers::get_overrides();
		$this->assertSame(
			array(
				'gptbot'        => true,
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
	 * WordPress.com's existing data-sharing opt-out wins over per-bot allows.
	 *
	 * @return void
	 */
	public function test_data_sharing_opt_out_forces_legacy_blocks() {
		update_option( 'wpcom_data_sharing_opt_out', true );
		update_option(
			Ai_Crawlers::OPTION,
			array(
				'gptbot'          => false,
				'google-extended' => false,
				'perplexitybot'   => false,
			)
		);

		$this->assertTrue( Ai_Crawlers::is_blocked( 'gptbot' ) );
		$this->assertTrue( Ai_Crawlers::is_blocked( 'google-extended' ) );
		$this->assertTrue( Ai_Crawlers::is_blocked( 'perplexitybot' ) );
		$this->assertFalse( Ai_Crawlers::is_blocked( 'oai-searchbot' ) );
		$this->assertTrue( Ai_Crawlers::get_bootstrap_data()['dataSharingOptOut'] );
	}

	/**
	 * `append_directives` emits a `User-agent` + `Disallow: /` block for each blocked bot only.
	 *
	 * @return void
	 */
	public function test_append_directives_emits_blocks_for_blocked_bots() {
		update_option( Ai_Crawlers::OPTION, array( 'gptbot' => true ) );
		$output  = Ai_Crawlers::append_directives( "User-agent: *\nDisallow:", true );
		$catalog = Ai_Crawlers::get_catalog();

		$this->assertStringContainsString( '# AI crawlers blocked via Jetpack SEO.', $output );
		$this->assertStringContainsString( 'User-agent: ' . $catalog['gptbot']['user_agent'] . "\nDisallow: /", $output );
		$this->assertStringNotContainsString( 'User-agent: ' . $catalog['claudebot']['user_agent'], $output );
	}

	/**
	 * Bare `Disallow` lines another filter appends first stay in the `User-agent: *` group
	 * rather than the last AI crawler group.
	 *
	 * @return void
	 */
	public function test_bare_lines_appended_before_ours_stay_in_the_wildcard_group() {
		$append_bare_line = static function ( $output ) {
			return $output . "Disallow: /wp-login.php\n";
		};
		Ai_Crawlers::init();
		add_filter( 'robots_txt', $append_bare_line, 11 );
		update_option( 'blog_public', 1 );

		try {
			$output = apply_filters( 'robots_txt', "User-agent: *\nDisallow: /wp-admin/\n", true );
		} finally {
			remove_filter( 'robots_txt', $append_bare_line, 11 );
		}

		$before_ai_groups = strstr( $output, '# AI crawlers blocked via Jetpack SEO.', true );
		$this->assertIsString( $before_ai_groups );
		$this->assertStringContainsString( 'Disallow: /wp-login.php', $before_ai_groups );
	}

	/**
	 * The SEO and WordPress.com privacy filters agree when both run.
	 *
	 * @return void
	 */
	public function test_combined_robots_filters_respect_data_sharing_opt_out() {
		require_once dirname( __DIR__, 3 ) . '/jetpack-mu-wpcom/src/features/blog-privacy/blog-privacy.php';

		Ai_Crawlers::init();
		add_filter(
			'robots_txt',
			'Automattic\\Jetpack\\Jetpack_Mu_Wpcom\\Blog_Privacy\\robots_txt',
			12,
			2
		);
		update_option( 'blog_public', 1 );
		update_option( 'wpcom_data_sharing_opt_out', true );
		update_option(
			Ai_Crawlers::OPTION,
			array(
				'gptbot'          => false,
				'google-extended' => false,
				'perplexitybot'   => false,
			)
		);

		$output = apply_filters( 'robots_txt', 'TEST', true );

		$this->assertSame( Ai_Crawlers::ROBOTS_TXT_PRIORITY, has_filter( 'robots_txt', array( Ai_Crawlers::class, 'append_directives' ) ) );
		$this->assertSame(
			12,
			has_filter(
				'robots_txt',
				'Automattic\\Jetpack\\Jetpack_Mu_Wpcom\\Blog_Privacy\\robots_txt'
			)
		);
		$this->assertStringContainsString( "User-agent: GPTBot\nDisallow: /", $output );
		$this->assertStringContainsString( "User-agent: Google-Extended\nDisallow: /", $output );
		$this->assertStringContainsString( "User-agent: PerplexityBot\nDisallow: /", $output );
		$this->assertStringNotContainsString( 'User-agent: OAI-SearchBot', $output );
		$this->assertSame( 1, substr_count( $output, 'User-agent: GPTBot' ) );
		$this->assertSame( 1, substr_count( $output, 'User-agent: Google-Extended' ) );
		$this->assertSame( 1, substr_count( $output, 'User-agent: PerplexityBot' ) );
	}

	/**
	 * The environment helpers return booleans.
	 *
	 * @return void
	 */
	public function test_environment_helpers_return_bools() {
		$this->assertIsBool( Ai_Crawlers::search_engines_allowed() );
		$this->assertIsBool( Ai_Crawlers::is_crawl_restricted_subdomain() );
		$this->assertIsBool( Ai_Crawlers::has_static_robots_txt() );
		$this->assertIsBool( Ai_Crawlers::has_data_sharing_opt_out() );
		$this->assertIsBool( Ai_Crawlers::is_path_based_multisite() );
	}
}
