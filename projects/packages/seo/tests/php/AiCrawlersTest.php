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
		delete_option( Ai_Crawlers::LEGACY_OPTION );
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
		remove_filter( 'default_option_' . Ai_Crawlers::OPTION, array( Ai_Crawlers::class, 'migrate_legacy_overrides' ), Ai_Crawlers::MIGRATION_PRIORITY );
		delete_option( Ai_Crawlers::OPTION );
		delete_option( Ai_Crawlers::LEGACY_OPTION );
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
	 * @return array<string, array{string, string}>
	 */
	public static function provide_crawlers_to_block() {
		return array(
			'training' => array( 'training', 'gptbot' ),
			'answer'   => array( 'answer', 'perplexitybot' ),
		);
	}

	/**
	 * A listed crawler is blocked, in either group.
	 *
	 * @dataProvider provide_crawlers_to_block
	 * @param string $type Crawler group.
	 * @param string $slug Crawler to block.
	 * @return void
	 */
	#[DataProvider( 'provide_crawlers_to_block' )]
	public function test_a_listed_crawler_is_blocked( $type, $slug ) {
		update_option( Ai_Crawlers::OPTION, array( $type => array( $slug ) ) );
		$this->assertTrue( Ai_Crawlers::is_blocked( $slug ) );
		$this->assertSame( array( $slug ), Ai_Crawlers::get_blocked_slugs() );
	}

	/**
	 * `'all'` blocks every crawler in its group and none in the other.
	 *
	 * @return void
	 */
	public function test_all_blocks_the_whole_group() {
		update_option( Ai_Crawlers::OPTION, array( 'training' => 'all' ) );

		$training = array_keys( wp_list_filter( Ai_Crawlers::get_catalog(), array( 'type' => 'training' ) ) );
		$this->assertSame( $training, Ai_Crawlers::get_blocked_slugs() );
	}

	/**
	 * Values `sanitize_blocked()` normalizes.
	 *
	 * @return array<string, array{mixed, array}>
	 */
	public static function provide_blocked_values() {
		return array(
			'not an array'                   => array(
				'nonsense',
				array(
					'answer'   => array(),
					'training' => array(),
				),
			),
			'unknown, other-group and dupes' => array(
				array(
					'answer'   => array( 'oai-searchbot', 'gptbot', 'not-a-bot', 'oai-searchbot' ),
					'training' => 'some',
					'other'    => 'all',
				),
				array(
					'answer'   => array( 'oai-searchbot' ),
					'training' => array(),
				),
			),
		);
	}

	/**
	 * Unknown slugs, slugs from the other group, unknown groups and bad group values are dropped.
	 *
	 * @dataProvider provide_blocked_values
	 * @param mixed $value    Stored or submitted value.
	 * @param array $expected Normalized value.
	 * @return void
	 */
	#[DataProvider( 'provide_blocked_values' )]
	public function test_sanitize_blocked( $value, $expected ) {
		$this->assertSame( $expected, Ai_Crawlers::sanitize_blocked( $value ) );
	}

	/**
	 * Old maps with no allowed training crawler.
	 *
	 * @return array<string, array{array, array}>
	 */
	public static function provide_legacy_maps() {
		return array(
			'answer engines blocked' => array(
				array(
					'perplexitybot' => true,
					'oai-searchbot' => true,
					'not-a-bot'     => true,
				),
				array(
					'answer'   => array( 'oai-searchbot', 'perplexitybot' ),
					'training' => array(),
				),
			),
			'answer engine allowed'  => array(
				array( 'perplexitybot' => false ),
				array(
					'answer'   => array(),
					'training' => array(),
				),
			),
		);
	}

	/**
	 * Only answer-engine blocks carry over, and the old option is deleted.
	 *
	 * @dataProvider provide_legacy_maps
	 * @param array $legacy   The old option.
	 * @param array $expected The new option.
	 * @return void
	 */
	#[DataProvider( 'provide_legacy_maps' )]
	public function test_migration_carries_answer_blocks( $legacy, $expected ) {
		update_option( Ai_Crawlers::LEGACY_OPTION, $legacy );
		Ai_Crawlers::register_legacy_migration();

		$this->assertSame( $expected, get_option( Ai_Crawlers::OPTION ) );
		$this->assertSame( $expected, $this->stored( Ai_Crawlers::OPTION ) );
		$this->assertFalse( $this->stored( Ai_Crawlers::LEGACY_OPTION ) );
	}

	/**
	 * An option as the database holds it, bypassing the object cache.
	 *
	 * @param string $name Option name.
	 * @return mixed The stored value, or false when there is no row.
	 */
	private function stored( $name ) {
		wp_cache_delete( 'alloptions', 'options' );
		wp_cache_delete( 'notoptions', 'options' );
		wp_cache_delete( $name, 'options' );
		return get_option( $name, false );
	}

	/**
	 * Unsaved training crawlers stay blocked, including on the first read past register_setting()'s default.
	 *
	 * @return void
	 */
	public function test_migration_keeps_unsaved_training_crawlers_blocked() {
		update_option(
			Ai_Crawlers::LEGACY_OPTION,
			array(
				'gptbot'        => false,
				'perplexitybot' => true,
			)
		);
		register_setting( 'jetpack-seo-test', Ai_Crawlers::OPTION, array( 'default' => array() ) );
		Ai_Crawlers::register_legacy_migration();

		try {
			$blocked = get_option( Ai_Crawlers::OPTION );
		} finally {
			unregister_setting( 'jetpack-seo-test', Ai_Crawlers::OPTION );
		}

		$training = array_keys( wp_list_filter( Ai_Crawlers::get_catalog(), array( 'type' => 'training' ) ) );
		$this->assertSame(
			array(
				'answer'   => array( 'perplexitybot' ),
				'training' => array_values( array_diff( $training, array( 'gptbot' ) ) ),
			),
			$blocked
		);
	}

	/**
	 * With no old option, a read returns the default and writes nothing.
	 *
	 * @return void
	 */
	public function test_migration_writes_nothing_without_an_old_option() {
		Ai_Crawlers::register_legacy_migration();

		$this->assertSame( 'missing', get_option( Ai_Crawlers::OPTION, 'missing' ) );
		$this->assertFalse( $this->stored( Ai_Crawlers::OPTION ) );
	}

	/**
	 * An existing new option wins, and the old one is kept.
	 *
	 * @return void
	 */
	public function test_migration_skips_an_existing_new_option() {
		$current = array(
			'answer'   => 'all',
			'training' => array(),
		);
		update_option( Ai_Crawlers::OPTION, $current );
		update_option( Ai_Crawlers::LEGACY_OPTION, array( 'gptbot' => false ) );
		Ai_Crawlers::register_legacy_migration();

		$this->assertSame( $current, get_option( Ai_Crawlers::OPTION ) );
		$this->assertSame( array( 'gptbot' => false ), get_option( Ai_Crawlers::LEGACY_OPTION ) );
	}

	/**
	 * A first save through update_option() migrates on the way in, then the saved value wins.
	 *
	 * @return void
	 */
	public function test_migration_survives_a_first_save() {
		update_option( Ai_Crawlers::LEGACY_OPTION, array( 'perplexitybot' => true ) );
		Ai_Crawlers::register_legacy_migration();
		$saved = array(
			'answer'   => array( 'oai-searchbot' ),
			'training' => 'all',
		);

		$this->assertTrue( update_option( Ai_Crawlers::OPTION, $saved ) );
		$this->assertSame( $saved, $this->stored( Ai_Crawlers::OPTION ) );
		$this->assertFalse( $this->stored( Ai_Crawlers::LEGACY_OPTION ) );
	}

	/**
	 * A list naming every crawler in its group is saved as `'all'`, so crawlers added later are blocked too.
	 *
	 * @return void
	 */
	public function test_sanitize_blocked_turns_a_full_list_into_all() {
		$training = array_keys( wp_list_filter( Ai_Crawlers::get_catalog(), array( 'type' => 'training' ) ) );

		$this->assertSame(
			array(
				'answer'   => array(),
				'training' => 'all',
			),
			Ai_Crawlers::sanitize_blocked( array( 'training' => array_reverse( $training ) ) )
		);
	}

	/**
	 * WordPress.com's data-sharing opt-out replaces the owner's choices.
	 *
	 * @return void
	 */
	public function test_data_sharing_opt_out_replaces_owner_choices() {
		update_option( 'wpcom_data_sharing_opt_out', true );
		update_option( Ai_Crawlers::OPTION, array( 'answer' => array( 'oai-searchbot' ) ) );

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
		update_option( Ai_Crawlers::OPTION, array( 'training' => array( 'gptbot' ) ) );
		$output  = Ai_Crawlers::append_directives( "User-agent: *\nDisallow:", true );
		$catalog = Ai_Crawlers::get_catalog();

		$this->assertStringContainsString( '# AI crawlers blocked via Jetpack SEO.', $output );
		$this->assertStringContainsString( 'User-agent: ' . $catalog['gptbot']['user_agent'] . "\nDisallow: /", $output );
		$this->assertStringNotContainsString( 'User-agent: ' . $catalog['claudebot']['user_agent'], $output );
	}

	/**
	 * Saved blocks keep applying while Jetpack's SEO output is paused. The dashboard's
	 * paused banner relies on this: it leaves AI crawler rules out of what it lists.
	 *
	 * @dataProvider provide_pause_filters
	 * @param string   $filter   Filter that pauses Jetpack's SEO output.
	 * @param callable $callback Its callback.
	 * @return void
	 */
	#[DataProvider( 'provide_pause_filters' )]
	public function test_blocks_still_apply_while_seo_output_is_paused( $filter, $callback ) {
		update_option( Ai_Crawlers::OPTION, array( 'training' => array( 'gptbot' ) ) );
		add_filter( $filter, $callback );
		try {
			$this->assertTrue( Seo_Tools::is_disabled() );
			$output = Ai_Crawlers::append_directives( "User-agent: *\nDisallow:", true );
		} finally {
			remove_filter( $filter, $callback );
		}

		$catalog = Ai_Crawlers::get_catalog();
		$this->assertStringContainsString( 'User-agent: ' . $catalog['gptbot']['user_agent'] . "\nDisallow: /", $output );
	}

	/**
	 * The two ways Jetpack's SEO output is paused: a named plugin, or the general switch.
	 *
	 * @return array
	 */
	public static function provide_pause_filters() {
		return array(
			'plugin conflict' => array(
				'jetpack_seo_conflicting_plugin',
				static function () {
					return 'Yoast SEO';
				},
			),
			'general disable' => array( 'jetpack_disable_seo_tools', '__return_true' ),
		);
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
		update_option( Ai_Crawlers::OPTION, array( 'training' => array( 'gptbot' ) ) );

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
		update_option( Ai_Crawlers::OPTION, array( 'answer' => array( 'oai-searchbot' ) ) );

		$output = apply_filters( 'robots_txt', 'TEST', true );

		$this->assertSame( Ai_Crawlers::ROBOTS_TXT_PRIORITY, has_filter( 'robots_txt', array( Ai_Crawlers::class, 'append_directives' ) ) );
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
