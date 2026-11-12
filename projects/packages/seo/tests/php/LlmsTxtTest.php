<?php
/**
 * Tests for the Jetpack SEO Llms_Txt generator.
 *
 * @package automattic/jetpack-seo
 */

namespace Automattic\Jetpack\SEO;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use ReflectionMethod;
use WP_Post;
use WP_REST_Request;

/**
 * @covers \Automattic\Jetpack\SEO\Llms_Txt
 */
#[CoversClass( Llms_Txt::class )]
class LlmsTxtTest extends SeoTestCase {

	/**
	 * Posts created by this test.
	 *
	 * @var int[]
	 */
	private $post_ids = array();

	/**
	 * Site title before the test.
	 *
	 * @var string
	 */
	private $blogname = '';

	/**
	 * Reset the enable option before each test.
	 *
	 * @return void
	 */
	protected function setUp(): void {
		parent::setUp();
		delete_option( Llms_Txt::OPTION );
		Llms_Txt::clear_cache();
		$this->blogname = get_option( 'blogname' );
	}

	/**
	 * Remove test content and post types.
	 *
	 * @return void
	 */
	protected function tearDown(): void {
		foreach ( $this->post_ids as $post_id ) {
			wp_delete_post( $post_id, true );
		}
		$this->post_ids = array();

		\Jetpack_SEO_Posts::$custom_description = '';

		if ( post_type_exists( 'seo_book' ) ) {
			unregister_post_type( 'seo_book' );
		}

		foreach ( wp_get_nav_menus() as $menu ) {
			wp_delete_nav_menu( $menu->term_id );
		}
		$category = get_term_by( 'name', 'Listed Category', 'category' );
		if ( $category ) {
			wp_delete_term( $category->term_id, 'category' );
		}
		update_option( 'blogname', $this->blogname );
		Llms_Txt::clear_cache();

		parent::tearDown();
	}

	/**
	 * `is_enabled()` reflects the stored option.
	 *
	 * @return void
	 */
	public function test_is_enabled_reflects_option() {
		$this->assertFalse( Llms_Txt::is_enabled() );
		update_option( Llms_Txt::OPTION, true );
		$this->assertTrue( Llms_Txt::is_enabled() );
	}

	/**
	 * The document starts with the site title as an H1.
	 *
	 * @return void
	 */
	public function test_generate_starts_with_site_title_heading() {
		update_option( 'blogname', 'Angela Test Site' );
		$this->assertStringStartsWith( '# Angela Test Site', Llms_Txt::generate() );
	}

	/**
	 * The tagline is rendered as a Markdown blockquote when set.
	 *
	 * @return void
	 */
	public function test_generate_includes_tagline_as_blockquote() {
		update_option( 'blogname', 'Site' );
		update_option( 'blogdescription', 'Just another test site' );
		$this->assertStringContainsString( '> Just another test site', Llms_Txt::generate() );
	}

	/**
	 * WordPress stores the site name and tagline escaped; plain text needs the characters.
	 *
	 * @return void
	 */
	public function test_generate_decodes_site_identity() {
		update_option( 'blogname', "Tom's & Jerry's" );
		update_option( 'blogdescription', 'Cats & dogs' );

		$this->assertStringStartsWith( "# Tom's & Jerry's\n\n> Cats & dogs\n", Llms_Txt::generate() );
	}

	/**
	 * A theme or plugin can add to the served text; a callback that returns nothing leaves it as is.
	 *
	 * @dataProvider provide_text_filters
	 *
	 * @param callable $filter Callback for `jetpack_seo_llms_txt`.
	 * @param string   $added  What the served text gains.
	 * @return void
	 */
	#[DataProvider( 'provide_text_filters' )]
	public function test_text_filter( $filter, $added ) {
		$unfiltered = Llms_Txt::generate();
		add_filter( 'jetpack_seo_llms_txt', $filter );
		try {
			$this->assertSame( $unfiltered . $added, Llms_Txt::get_stored() );
		} finally {
			remove_filter( 'jetpack_seo_llms_txt', $filter );
		}
	}

	/**
	 * Filter callbacks and what each adds to the served text.
	 *
	 * @return array
	 */
	public static function provide_text_filters() {
		$section = "\n## AI agents\n\n- [MCP server](https://example.com/mcp)\n";

		return array(
			'adds a section'          => array(
				static function ( $text ) use ( $section ) {
					return $text . $section;
				},
				$section,
			),
			'returns nothing'         => array(
				static function () {},
				'',
			),
			'returns an empty string' => array(
				static function () {
					return '';
				},
				'',
			),
		);
	}

	/**
	 * With no published content, the Pages/Posts sections are omitted (only the
	 * site-identity heading remains). The populated-list path is exercised by the
	 * live front-end test — the package test environment can't query inserted
	 * posts, the same reason {@see SchemaBuilderTest} builds posts directly.
	 *
	 * @return void
	 */
	public function test_generate_omits_sections_when_no_content() {
		update_option( 'blogname', 'Empty Site' );

		$output = Llms_Txt::generate();

		$this->assertStringContainsString( '# Empty Site', $output );
		$this->assertStringNotContainsString( '## Pages', $output );
		$this->assertStringNotContainsString( '## Posts', $output );
	}

	/**
	 * With no static file shadowing the route and no host override, WordPress can
	 * serve /llms.txt.
	 *
	 * @return void
	 */
	public function test_can_serve_true_by_default() {
		$this->assertTrue( Llms_Txt::can_serve() );
	}

	public function test_competing_plugin_prevents_llms_txt_serving() {
		$original_uri           = $_SERVER['REQUEST_URI'] ?? null;
		$original_public        = get_option( 'blog_public' );
		$_SERVER['REQUEST_URI'] = '/llms.txt';
		update_option( Llms_Txt::OPTION, true );
		update_option( 'blog_public', 1 );
		add_filter( 'jetpack_disable_seo_tools', '__return_true' );
		try {
			$this->assertFalse( Llms_Txt::can_serve() );
			$this->expectOutputString( '' );
			Llms_Txt::maybe_serve();
		} finally {
			remove_filter( 'jetpack_disable_seo_tools', '__return_true' );
			update_option( 'blog_public', $original_public );
			if ( null === $original_uri ) {
				unset( $_SERVER['REQUEST_URI'] );
			} else {
				$_SERVER['REQUEST_URI'] = $original_uri;
			}
		}
	}

	/**
	 * A host (or the static-file auto-detection) can force the honest
	 * "can't take effect" state via the filter.
	 *
	 * @return void
	 */
	public function test_can_serve_respects_filter() {
		add_filter( 'jetpack_seo_llms_txt_can_serve', '__return_false' );
		$this->assertFalse( Llms_Txt::can_serve() );
		remove_filter( 'jetpack_seo_llms_txt_can_serve', '__return_false' );

		$this->assertTrue( Llms_Txt::can_serve() );
	}

	/**
	 * Build a WP_Post fixture with sensible published defaults. The package test
	 * environment can't query inserted posts, so the content paths are exercised by
	 * handing built posts straight to `link_list` (the same reason {@see
	 * SchemaBuilderTest} builds posts directly).
	 *
	 * @param array $fields Field overrides.
	 * @return WP_Post
	 */
	private function make_post( array $fields = array() ): WP_Post {
		return new WP_Post(
			(object) array_merge(
				array(
					'ID'            => 1,
					'post_type'     => 'post',
					'post_status'   => 'publish',
					'post_title'    => 'Test post',
					'post_content'  => '',
					'post_password' => '',
					'post_date'     => '2026-01-01 00:00:00',
					'post_date_gmt' => '2026-01-01 00:00:00',
					'post_author'   => 0,
				),
				$fields
			)
		);
	}

	/**
	 * Invoke the private `link_list` with a set of posts.
	 *
	 * @param WP_Post[] $posts Posts to render.
	 * @return string
	 */
	private function link_list( array $posts ): string {
		$method = new ReflectionMethod( Llms_Txt::class, 'link_list' );
		// setAccessible() is required before PHP 8.1 but a no-op after, and is
		// deprecated in 8.5 — only call it where it's actually needed.
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}
		return (string) $method->invoke( null, $posts );
	}

	/**
	 * Invoke the private `summary` method.
	 *
	 * @param WP_Post $post Post to summarize.
	 * @return string
	 */
	private function summary( WP_Post $post ): string {
		$method = new ReflectionMethod( Llms_Txt::class, 'summary' );
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}
		return (string) $method->invoke( null, $post );
	}

	/**
	 * Insert and track a published post.
	 *
	 * @param array $fields Post fields.
	 * @return WP_Post
	 */
	private function insert_post( array $fields ): WP_Post {
		$post_id          = wp_insert_post(
			array_merge(
				array(
					'post_status' => 'publish',
					'post_title'  => 'Test post',
					'post_type'   => 'post',
				),
				$fields
			)
		);
		$this->post_ids[] = $post_id;

		return get_post( $post_id );
	}

	/**
	 * Password-protected posts are `publish` status but their content is
	 * intentionally gated, so they're excluded from the public llms.txt entirely.
	 *
	 * @return void
	 */
	public function test_link_list_excludes_password_protected_posts() {
		$password = $this->make_post(
			array(
				'ID'            => 2,
				'post_title'    => 'Secret Post',
				'post_password' => 'hunter2',
			)
		);

		// A password-protected post on its own produces no entries.
		$this->assertSame( '', $this->link_list( array( $password ) ) );

		// Mixed with a public post, only the public post is listed (one entry).
		// Asserted by entry count, not title text: the package harness can't
		// resolve get_the_title()/get_permalink() on built fixtures (each entry
		// renders as `- [(untitled)]()`), but presence/absence is what matters.
		$mixed = $this->link_list(
			array(
				$this->make_post(
					array(
						'ID'         => 1,
						'post_title' => 'Public Post',
					)
				),
				$password,
			)
		);
		$this->assertSame( 1, substr_count( $mixed, '](' ) );
	}

	/**
	 * Public REST custom post types are included as their own sections.
	 *
	 * @return void
	 */
	public function test_generate_includes_supported_custom_post_type_section() {
		register_post_type(
			'seo_book',
			array(
				'label'        => 'Books &amp; Zines',
				'public'       => true,
				'show_ui'      => true,
				'show_in_rest' => true,
			)
		);
		$this->insert_post(
			array(
				'post_type'    => 'seo_book',
				'post_title'   => 'Practical Schema',
				'post_excerpt' => 'A concise guide to schema markup.',
			)
		);

		$output = Llms_Txt::generate();

		$this->assertStringContainsString( "## Books & Zines\n\n", $output );
		$this->assertStringContainsString( 'Practical Schema', $output );
		$this->assertStringContainsString( 'A concise guide to schema markup.', $output );
	}

	/**
	 * Link lines hold characters rather than HTML entities, and still parse as one link.
	 *
	 * @dataProvider provide_entity_link_lines
	 *
	 * @param array  $fields   Post fields.
	 * @param string $expected Text the link line must contain.
	 * @return void
	 */
	#[DataProvider( 'provide_entity_link_lines' )]
	public function test_link_list_decodes_entities( array $fields, string $expected ) {
		$output = $this->link_list( array( $this->insert_post( $fields ) ) );

		$this->assertStringContainsString( $expected, $output );
		$this->assertStringNotContainsString( "\n", $output );
	}

	/**
	 * Post fields and the text each must render as.
	 *
	 * @return array
	 */
	public static function provide_entity_link_lines() {
		return array(
			'texturized apostrophe' => array( array( 'post_title' => "What's New" ), "- [What\u{2019}s New](" ),
			'ampersand in title'    => array( array( 'post_title' => 'Tips & Tricks' ), '- [Tips & Tricks](' ),
			'named apostrophe'      => array( array( 'post_excerpt' => 'It&apos;s here' ), ": It's here" ),
			'encoded brackets'      => array( array( 'post_title' => 'Notes &#91;draft&#93;' ), '- [Notes \[draft\]](' ),
			'encoded newline'       => array( array( 'post_title' => 'One&#10;Two' ), '- [One Two](' ),
			'encoded return'        => array( array( 'post_title' => 'One&#13;Two' ), '- [One Two](' ),
			'ampersand in summary'  => array( array( 'post_excerpt' => 'Salt &amp; pepper' ), ': Salt & pepper' ),
		);
	}

	/**
	 * Posts hidden from search engines are not advertised in llms.txt.
	 *
	 * @return void
	 */
	public function test_generate_excludes_noindexed_posts() {
		$this->insert_post( array( 'post_title' => 'Visible Post' ) );
		$hidden = $this->insert_post( array( 'post_title' => 'Hidden Post' ) );
		update_post_meta( $hidden->ID, Content_Coverage::META_NOINDEX, '1' );

		$output = Llms_Txt::generate();

		$this->assertStringContainsString( 'Visible Post', $output );
		$this->assertStringNotContainsString( 'Hidden Post', $output );
	}

	/**
	 * Raw paid or paywalled body content is never used as a public summary.
	 *
	 * @return void
	 */
	public function test_summary_omits_gated_body_content() {
		$gates = array(
			array( '_jetpack_memberships_contains_paid_content', '1', 'Paid meta secret' ),
			array( '_jetpack_memberships_contains_paywalled_content', '1', 'Paywall meta secret' ),
			array( '', '', '<!-- wp:premium-content/container -->Premium block secret<!-- /wp:premium-content/container -->' ),
			array( '', '', '<!-- wp:jetpack/paywall -->Paywall block secret<!-- /wp:jetpack/paywall -->' ),
		);

		foreach ( $gates as $gate ) {
			$post = $this->insert_post( array( 'post_content' => $gate[2] ) );
			if ( '' !== $gate[0] ) {
				update_post_meta( $post->ID, $gate[0], $gate[1] );
			}

			$this->assertSame( '', $this->summary( $post ) );
		}
	}

	/**
	 * A Newsletter-gated post never contributes its body to llms.txt.
	 *
	 * @return void
	 */
	public function test_summary_omits_newsletter_gated_body_content() {
		foreach ( array( 'subscribers', 'paid_subscribers', 'paid_subscribers_all_tiers' ) as $access_level ) {
			$post = $this->insert_post( array( 'post_content' => 'Subscriber-only body text.' ) );
			update_post_meta( $post->ID, '_jetpack_newsletter_access', $access_level );

			$this->assertSame( '', $this->summary( get_post( $post->ID ) ), $access_level );
		}
	}

	/**
	 * An ungated post still gets its summary (control for the test above).
	 *
	 * @return void
	 */
	public function test_summary_kept_for_ungated_post() {
		$post = $this->insert_post( array( 'post_content' => 'Public body text.' ) );
		update_post_meta( $post->ID, '_jetpack_newsletter_access', 'everybody' );

		$this->assertSame( 'Public body text.', $this->summary( get_post( $post->ID ) ) );
	}

	/**
	 * @return void
	 */
	public function test_summary_uses_filtered_excerpt_without_manual_excerpt() {
		$post   = $this->insert_post( array( 'post_content' => 'Withheld body text.' ) );
		$filter = static function ( $excerpt, $excerpt_post ) use ( $post ) {
			return $excerpt_post->ID === $post->ID ? 'Content unavailable.' : $excerpt;
		};
		add_filter( 'get_the_excerpt', $filter, 100, 2 );

		try {
			$output = $this->link_list( array( $post ) );

			$this->assertStringContainsString( 'Content unavailable.', $output );
			$this->assertStringNotContainsString( 'Withheld body text.', $output );
			$this->assertStringContainsString( '[Test post](', $output );
			$this->assertStringContainsString( get_permalink( $post ), $output );
		} finally {
			remove_filter( 'get_the_excerpt', $filter, 100 );
		}
	}

	/**
	 * A paywalled post summarizes the teaser the front end already publishes.
	 *
	 * @return void
	 */
	public function test_summary_uses_the_paywall_teaser() {
		$post = $this->insert_post( array( 'post_content' => 'Free intro text.<!-- wp:jetpack/paywall /-->Paid body text.' ) );

		$summary = $this->summary( get_post( $post->ID ) );

		$this->assertSame( 'Free intro text.', $summary );
		$this->assertStringNotContainsString( 'Paid body text.', $summary );
	}

	/**
	 * A manually authored public excerpt remains safe to publish on gated posts.
	 *
	 * @return void
	 */
	public function test_summary_keeps_manual_excerpt_for_gated_content() {
		$post = $this->insert_post(
			array(
				'post_content' => 'Subscriber-only body.',
				'post_excerpt' => 'Public summary.',
			)
		);
		update_post_meta( $post->ID, '_jetpack_memberships_contains_paid_content', '1' );

		$this->assertSame( 'Public summary.', $this->summary( $post ) );
	}

	/**
	 * A custom SEO description is the summary whenever one is set.
	 *
	 * @dataProvider provide_seo_description_summaries
	 *
	 * @param string $description Stored SEO description.
	 * @param array  $fields      Post fields.
	 * @param string $expected    Expected summary.
	 * @return void
	 */
	#[DataProvider( 'provide_seo_description_summaries' )]
	public function test_summary_prefers_seo_description( string $description, array $fields, string $expected ) {
		\Jetpack_SEO_Posts::$custom_description = $description;

		$this->assertSame( $expected, $this->summary( $this->insert_post( $fields ) ) );
	}

	/**
	 * @return array<string, array{string, array<string, string>, string}>
	 */
	public static function provide_seo_description_summaries(): array {
		return array(
			'ahead of a manual excerpt' => array(
				'SEO summary.',
				array(
					'post_content' => 'Body text.',
					'post_excerpt' => 'Manual excerpt.',
				),
				'SEO summary.',
			),
			'kept on a gated post'      => array(
				'SEO summary.',
				array( 'post_content' => '<!-- wp:jetpack/paywall -->Paid body text.<!-- /wp:jetpack/paywall -->' ),
				'SEO summary.',
			),
			'cleaned to a single line'  => array(
				"<b>First line</b>\n\n[gallery]second line.",
				array( 'post_content' => 'Body text.' ),
				'First line second line.',
			),
			'capped like the meta tag'  => array(
				str_repeat( 'word ', 60 ),
				array( 'post_content' => 'Body text.' ),
				trim( str_repeat( 'word ', 55 ) ),
			),
			'skipped when blank'        => array(
				'   ',
				array( 'post_excerpt' => 'Manual excerpt.' ),
				'Manual excerpt.',
			),
		);
	}

	/**
	 * Pages list the main menu first, then other displayed menus, then pages with an Order
	 * set ahead of untouched ones, up to the per-type limit.
	 *
	 * @return void
	 */
	public function test_pages_rank_main_menu_then_other_menus_then_title() {
		for ( $i = 1; $i <= 50; $i++ ) {
			$this->insert_page( sprintf( 'Page %02d', $i ), 51 - $i );
		}
		$this->insert_page( 'Aa Untouched' );
		$scan    = $this->insert_page( 'Zz Scan' );
		$privacy = $this->insert_page( 'Zy Privacy' );
		$this->add_nav_menu( array( $scan->ID ), 'primary' );
		$this->add_nav_menu( array( $privacy->ID ), 'footer' );

		$expected = array( 'Zz Scan', 'Zy Privacy' );
		for ( $i = 50; $i >= 3; $i-- ) {
			$expected[] = sprintf( 'Page %02d', $i );
		}
		$this->assertSame( $expected, $this->page_titles() );
	}

	/**
	 * Pages the owner always includes come first, once, ahead of the main menu; hiding a
	 * page from search engines still leaves it out.
	 *
	 * @return void
	 */
	public function test_included_pages_come_first_unless_hidden_from_search() {
		for ( $i = 1; $i <= 50; $i++ ) {
			$this->insert_page( sprintf( 'Page %02d', $i ) );
		}
		$scan            = $this->insert_page( 'Zz Scan' );
		$in_menu         = $this->insert_page( 'Zx Included' );
		$always_included = $this->insert_page( 'Zw Included' );
		$hidden          = $this->insert_page( 'Zv Hidden' );
		foreach ( array( $in_menu, $always_included, $hidden ) as $page ) {
			update_post_meta( $page->ID, Llms_Txt::META_ALWAYS_INCLUDE, '1' );
		}
		update_post_meta( $hidden->ID, Content_Coverage::META_NOINDEX, '1' );
		$this->add_nav_menu( array( $scan->ID, $in_menu->ID ), 'primary' );

		$expected = array( 'Zw Included', 'Zx Included', 'Zz Scan' );
		for ( $i = 1; $i <= 47; $i++ ) {
			$expected[] = sprintf( 'Page %02d', $i );
		}
		$this->assertSame( $expected, $this->page_titles() );
	}

	/**
	 * Hiding a page from search engines, from any editor, switches "Always include" off.
	 *
	 * @return void
	 */
	public function test_hiding_a_page_switches_always_include_off() {
		$page = $this->insert_page( 'Hidden Later' );
		update_post_meta( $page->ID, Llms_Txt::META_ALWAYS_INCLUDE, '1' );

		$this->with_write_hooks(
			static function () use ( $page ) {
				update_post_meta( $page->ID, Content_Coverage::META_NOINDEX, '1' );
			}
		);

		$this->assertFalse( metadata_exists( 'post', $page->ID, Llms_Txt::META_ALWAYS_INCLUDE ) );
	}

	/**
	 * Core REST always saves noindex first, whatever the order of the request's fields.
	 *
	 * @param array[] $saves    Meta for each REST save, in order.
	 * @param bool    $expected Whether "Always include" is on after the last save.
	 * @return void
	 * @dataProvider provide_rest_saves
	 */
	#[DataProvider( 'provide_rest_saves' )]
	public function test_rest_saves_only_turn_always_include_on_for_visible_pages( array $saves, bool $expected ) {
		$page    = $this->insert_page( 'Saved Through REST' );
		$user_id = wp_insert_user(
			array(
				'user_login' => 'llms_txt_admin',
				'user_pass'  => 'pass',
				'role'       => 'administrator',
			)
		);
		$this->assertIsInt( $user_id );
		wp_set_current_user( $user_id );
		register_meta(
			'post',
			Content_Coverage::META_NOINDEX,
			array(
				'type'         => 'boolean',
				'single'       => true,
				'show_in_rest' => true,
			)
		);

		$responses = array();
		try {
			$this->with_write_hooks(
				static function () use ( $page, $saves, &$responses ) {
					foreach ( $saves as $meta ) {
						$request = new WP_REST_Request( 'POST', '/wp/v2/pages/' . $page->ID );
						$request->set_body_params( array( 'meta' => $meta ) );
						$responses[] = rest_do_request( $request );
					}
				}
			);
		} finally {
			unregister_meta_key( 'post', Content_Coverage::META_NOINDEX );
			unregister_meta_key( 'post', Llms_Txt::META_ALWAYS_INCLUDE, 'page' );
			$GLOBALS['wp_rest_server'] = null;
			wp_set_current_user( 0 );
			wp_delete_user( $user_id );
		}

		foreach ( $responses as $response ) {
			$this->assertSame( 200, $response->get_status() );
		}
		$this->assertSame( $expected, end( $responses )->get_data()['meta'][ Llms_Txt::META_ALWAYS_INCLUDE ] );
	}

	/**
	 * REST saves, and whether "Always include" ends up on.
	 *
	 * @return array<string, array{array[], bool}>
	 */
	public static function provide_rest_saves(): array {
		return array(
			'hide and include together, then un-hide' => array(
				array(
					array(
						Llms_Txt::META_ALWAYS_INCLUDE  => true,
						Content_Coverage::META_NOINDEX => true,
					),
					array( Content_Coverage::META_NOINDEX => false ),
				),
				false,
			),
			'un-hide and include together'            => array(
				array(
					array( Content_Coverage::META_NOINDEX => true ),
					array(
						Content_Coverage::META_NOINDEX => false,
						Llms_Txt::META_ALWAYS_INCLUDE  => true,
					),
				),
				true,
			),
		);
	}

	/**
	 * Main-menu pages are listed past the per-type limit, up to their own.
	 *
	 * @return void
	 */
	public function test_main_menu_pages_pass_the_page_limit_up_to_their_own() {
		$this->insert_page( 'Aa Extra' );
		$ids      = array();
		$expected = array();
		for ( $i = 1; $i <= Llms_Txt::MAX_MAIN_MENU_PAGES + 1; $i++ ) {
			$expected[] = sprintf( 'Menu %03d', $i );
			$ids[]      = $this->insert_page( end( $expected ) )->ID;
		}
		$this->add_nav_menu( $ids, 'primary' );
		array_pop( $expected );

		$this->assertSame( $expected, $this->page_titles() );
	}

	/**
	 * Menu pages that aren't published, are password protected or are hidden from search
	 * engines stay out, like any other page.
	 *
	 * @return void
	 */
	public function test_hidden_menu_pages_stay_out() {
		$draft   = $this->insert_post(
			array(
				'post_type'   => 'page',
				'post_title'  => 'Draft',
				'post_status' => 'draft',
			)
		);
		$locked  = $this->insert_post(
			array(
				'post_type'     => 'page',
				'post_title'    => 'Locked',
				'post_password' => 'hunter2',
			)
		);
		$noindex = $this->insert_page( 'Noindex' );
		update_post_meta( $noindex->ID, Content_Coverage::META_NOINDEX, '1' );
		$shown = $this->insert_page( 'Shown' );
		$this->add_nav_menu( array( $draft->ID, $locked->ID, $noindex->ID, $shown->ID ), 'primary' );

		$this->assertSame( array( 'Shown' ), $this->page_titles() );
	}

	/**
	 * Run a callback with the write hooks attached, keeping them out of the rest of the suite.
	 *
	 * @param callable $callback Code to run.
	 * @return void
	 */
	private function with_write_hooks( callable $callback ) {
		$hooks = array_map(
			static function ( $hook ) {
				return clone $hook;
			},
			$GLOBALS['wp_filter']
		);
		try {
			Llms_Txt::register_always_include();
			Llms_Txt::register_invalidation();
			$callback();
		} finally {
			$GLOBALS['wp_filter'] = $hooks; // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
		}
	}

	/**
	 * Insert and track a published page.
	 *
	 * @param string $title      Page title.
	 * @param int    $menu_order Page order.
	 * @return WP_Post
	 */
	private function insert_page( $title, $menu_order = 0 ): WP_Post {
		return $this->insert_post(
			array(
				'post_type'  => 'page',
				'post_title' => $title,
				'menu_order' => $menu_order,
			)
		);
	}

	/**
	 * Titles listed in the generated Pages section, in order.
	 *
	 * @return string[]
	 */
	private function page_titles(): array {
		preg_match( '/^## Pages\n\n(.*?)(?:\n\n## |\n\z)/ms', Llms_Txt::generate(), $section );
		preg_match_all( '/^- \[(.+?)\]/m', $section[1] ?? '', $titles );
		return $titles[1];
	}

	/**
	 * A stored llms.txt is served as is; without one, the file is built and stored.
	 *
	 * @return void
	 */
	public function test_stored_copy_is_served_without_rebuilding() {
		set_transient( Llms_Txt::CACHE_KEY, 'stored body', HOUR_IN_SECONDS );
		$this->assertSame( 'stored body', Llms_Txt::get_stored() );

		Llms_Txt::clear_cache();
		update_option( 'blogname', 'Built Title' );
		$built = Llms_Txt::get_stored();
		$this->assertStringStartsWith( '# Built Title', $built );
		$this->assertSame( $built, get_transient( Llms_Txt::CACHE_KEY ) );
	}

	/**
	 * Changes to what llms.txt lists clear the stored copy; the editor's own bookkeeping doesn't.
	 *
	 * @dataProvider provide_changes
	 *
	 * @param callable $change Makes the change, given a published page's ID.
	 * @param bool     $clears Whether the stored copy should be cleared.
	 * @return void
	 */
	#[DataProvider( 'provide_changes' )]
	public function test_changes_clear_the_stored_copy( $change, $clears ) {
		update_option( Llms_Txt::OPTION, true );
		$page = $this->insert_post(
			array(
				'post_type'  => 'page',
				'post_title' => 'Existing Page',
			)
		);
		set_transient( Llms_Txt::CACHE_KEY, 'stored', HOUR_IN_SECONDS );

		$this->with_write_hooks(
			static function () use ( $change, $page ) {
				$change( $page->ID );
			}
		);

		$this->assertSame( $clears ? false : 'stored', get_transient( Llms_Txt::CACHE_KEY ) );
	}

	/**
	 * Changes and whether each clears the stored llms.txt.
	 *
	 * @return array
	 */
	public static function provide_changes() {
		return array(
			'page edited'              => array(
				static function ( $page_id ) {
					wp_update_post(
						array(
							'ID'         => $page_id,
							'post_title' => 'Renamed Page',
						)
					);
				},
				true,
			),
			'page deleted permanently' => array(
				static function ( $page_id ) {
					wp_delete_post( $page_id, true );
				},
				true,
			),
			'page hidden from search'  => array(
				static function ( $page_id ) {
					update_post_meta( $page_id, Content_Coverage::META_NOINDEX, '1' );
				},
				true,
			),
			'site title changed'       => array(
				static function () {
					update_option( 'blogname', 'Renamed Site' );
				},
				true,
			),
			'llms.txt turned off'      => array(
				static function () {
					update_option( Llms_Txt::OPTION, false );
				},
				true,
			),
			'classic menu saved'       => array(
				static function () {
					wp_create_nav_menu( 'Main' );
				},
				true,
			),
			'oEmbed cache saved'       => array(
				static function () {
					wp_insert_post(
						array(
							'post_type'   => 'oembed_cache',
							'post_status' => 'publish',
							'post_title'  => 'Embed',
						)
					);
				},
				false,
			),
			'category renamed'         => array(
				static function () {
					$term = wp_insert_term( 'Listed Category', 'category' );
					wp_update_term( $term['term_id'], 'category', array( 'slug' => 'renamed-category' ) );
				},
				true,
			),
			'editor lock refreshed'    => array(
				static function ( $page_id ) {
					update_post_meta( $page_id, '_edit_lock', time() . ':1' );
				},
				false,
			),
		);
	}

	/**
	 * Clearing asks WordPress.com to purge its edge copy only when a stored copy existed.
	 *
	 * @return void
	 */
	public function test_clearing_purges_the_edge_copy_only_when_one_was_stored() {
		\Wpcom_Test_Async_Jobs::$queued = array();
		Llms_Txt::clear_cache();
		$this->assertSame( array(), \Wpcom_Test_Async_Jobs::$queued );

		set_transient( Llms_Txt::CACHE_KEY, 'stored', HOUR_IN_SECONDS );
		Llms_Txt::clear_cache();
		$this->assertSame(
			array(
				array(
					'type' => 'wpcom_invalidate_output_cache_job',
					'data' => array( 'output_cache' => array( 'url' => array( home_url( '/llms.txt' ) ) ) ),
				),
			),
			\Wpcom_Test_Async_Jobs::$queued
		);
	}

	/**
	 * Theme changes clear the stored copy for the theme active when they're saved, not when the
	 * hooks were registered: WordPress.com API requests register them before switching sites.
	 *
	 * @return void
	 */
	public function test_theme_mods_clear_the_stored_copy_for_the_theme_active_when_saved() {
		set_transient( Llms_Txt::CACHE_KEY, 'stored', HOUR_IN_SECONDS );
		$api_host_theme = static function () {
			return 'api-host-theme';
		};
		add_filter( 'stylesheet', $api_host_theme );
		try {
			$this->with_write_hooks(
				static function () use ( $api_host_theme ) {
					remove_filter( 'stylesheet', $api_host_theme );
					set_theme_mod( 'llms_txt_test', 'changed' );
				}
			);
		} finally {
			remove_filter( 'stylesheet', $api_host_theme );
			remove_theme_mod( 'llms_txt_test' );
		}
		$this->assertFalse( get_transient( Llms_Txt::CACHE_KEY ) );
	}

	/**
	 * Turning llms.txt on purges the edge copy even when nothing is stored here.
	 *
	 * @return void
	 */
	public function test_turning_llms_txt_on_purges_the_edge_copy_with_nothing_stored() {
		\Wpcom_Test_Async_Jobs::$queued = array();
		$this->with_write_hooks(
			static function () {
				update_option( Llms_Txt::OPTION, true );
			}
		);
		$this->assertCount( 1, \Wpcom_Test_Async_Jobs::$queued );
	}
}
