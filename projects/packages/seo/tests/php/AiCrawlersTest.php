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
		delete_option( Ai_Crawlers::MIGRATED_OPTION );
		delete_option( 'wpcom_data_sharing_opt_out' );
		remove_filter( 'robots_txt', array( Ai_Crawlers::class, 'append_directives' ), 10 );
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
		delete_option( Ai_Crawlers::MIGRATED_OPTION );
		delete_option( 'wpcom_data_sharing_opt_out' );
		remove_filter( 'robots_txt', array( Ai_Crawlers::class, 'append_directives' ), 10 );
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
	 * An owner who allowed a training crawler under the old defaults keeps the rest of that group blocked.
	 *
	 * @return void
	 */
	public function test_migration_blocks_the_unsaved_training_crawlers() {
		update_option(
			Ai_Crawlers::OPTION,
			array(
				'gptbot'        => false,
				'perplexitybot' => true,
			)
		);
		Ai_Crawlers::maybe_migrate_legacy_overrides();

		$expected = array( 'perplexitybot' );
		foreach ( Ai_Crawlers::get_catalog() as $slug => $info ) {
			if ( 'training' === $info['type'] && 'gptbot' !== $slug ) {
				$expected[] = $slug;
			}
		}
		$blocked = Ai_Crawlers::get_blocked_slugs();
		sort( $expected );
		sort( $blocked );
		$this->assertSame( $expected, $blocked );
	}

	/**
	 * The migration runs once, so a later `false` (e.g. from the old `/jetpack/v4/settings` route) isn't migrated.
	 *
	 * @return void
	 */
	public function test_migration_runs_once() {
		Ai_Crawlers::maybe_migrate_legacy_overrides();
		update_option( Ai_Crawlers::OPTION, array( 'gptbot' => false ) );
		Ai_Crawlers::maybe_migrate_legacy_overrides();
		$this->assertSame( array( 'gptbot' => false ), get_option( Ai_Crawlers::OPTION ) );
	}

	/**
	 * Maps the migration must leave alone.
	 *
	 * @return array<string, array{mixed}>
	 */
	public static function provide_maps_the_migration_keeps() {
		return array(
			'nothing saved'                => array( false ),
			'answer engines only'          => array( array( 'perplexitybot' => true ) ),
			'allowed answer engine'        => array( array( 'perplexitybot' => false ) ),
			'saved after allow-by-default' => array( array( 'gptbot' => true ) ),
		);
	}

	/**
	 * The migration changes nothing unless the old map holds a training crawler.
	 *
	 * @dataProvider provide_maps_the_migration_keeps
	 * @param mixed $stored The stored option, or false when absent.
	 * @return void
	 */
	#[DataProvider( 'provide_maps_the_migration_keeps' )]
	public function test_migration_keeps_other_maps( $stored ) {
		if ( false !== $stored ) {
			update_option( Ai_Crawlers::OPTION, $stored );
		}
		Ai_Crawlers::maybe_migrate_legacy_overrides();
		$this->assertSame( $stored, get_option( Ai_Crawlers::OPTION ) );
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
	 * WordPress.com's data-sharing opt-out replaces the owner's choices.
	 *
	 * @return void
	 */
	public function test_data_sharing_opt_out_replaces_owner_choices() {
		update_option( 'wpcom_data_sharing_opt_out', true );
		update_option( Ai_Crawlers::OPTION, array( 'oai-searchbot' => true ) );

		$this->assertTrue( Ai_Crawlers::is_blocked( 'gptbot' ) );
		$this->assertTrue( Ai_Crawlers::is_blocked( 'perplexitybot' ) );
		$this->assertFalse( Ai_Crawlers::is_blocked( 'oai-searchbot' ) );

		$bootstrap = Ai_Crawlers::get_bootstrap_data();
		$this->assertTrue( $bootstrap['dataSharingOptOut'] );
		$this->assertSame( Ai_Crawlers::get_data_sharing_blocked_slugs(), $bootstrap['dataSharingBlocked'] );
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
		update_option( Ai_Crawlers::OPTION, array( 'oai-searchbot' => true ) );

		$output = apply_filters( 'robots_txt', 'TEST', true );

		$this->assertSame( 10, has_filter( 'robots_txt', array( Ai_Crawlers::class, 'append_directives' ) ) );
		$this->assertSame(
			12,
			has_filter(
				'robots_txt',
				'Automattic\\Jetpack\\Jetpack_Mu_Wpcom\\Blog_Privacy\\robots_txt'
			)
		);
		// The GEO tab shows get_data_sharing_blocked_slugs(), so it must match what WordPress.com writes.
		$forced = Ai_Crawlers::get_data_sharing_blocked_slugs();
		foreach ( Ai_Crawlers::get_catalog() as $slug => $info ) {
			$expected = in_array( $slug, $forced, true ) ? 1 : 0;
			$this->assertSame( $expected, substr_count( $output, 'User-agent: ' . $info['user_agent'] . "\n" ), $slug );
		}
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
