<?php
/**
 * Tests for the Jetpack SEO Llms_Txt generator.
 *
 * @package automattic/jetpack-seo
 */

namespace Automattic\Jetpack\SEO;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;
use ReflectionMethod;
use WP_Post;

/**
 * @covers \Automattic\Jetpack\SEO\Llms_Txt
 */
#[CoversClass( Llms_Txt::class )]
class LlmsTxtTest extends TestCase {

	/**
	 * Posts created by this test.
	 *
	 * @var int[]
	 */
	private $post_ids = array();

	/**
	 * Reset the enable option before each test.
	 *
	 * @return void
	 */
	protected function setUp(): void {
		parent::setUp();
		delete_option( Llms_Txt::OPTION );
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

		if ( post_type_exists( 'seo_book' ) ) {
			unregister_post_type( 'seo_book' );
		}

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
				'label'        => 'Books',
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

		$this->assertStringContainsString( "## Books\n\n", $output );
		$this->assertStringContainsString( 'Practical Schema', $output );
		$this->assertStringContainsString( 'A concise guide to schema markup.', $output );
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
}
