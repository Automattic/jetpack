<?php
/**
 * Tests for the Jetpack SEO Llms_Txt generator.
 *
 * @package automattic/jetpack-seo
 */

namespace Automattic\Jetpack\SEO;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;
use WorDBless\Posts as WorDBless_Posts;

/**
 * @covers \Automattic\Jetpack\SEO\Llms_Txt
 */
#[CoversClass( Llms_Txt::class )]
class LlmsTxtTest extends TestCase {

	/**
	 * Test-only WP_Query short-circuit for WorDBless.
	 *
	 * @var callable|null
	 */
	private $posts_query_filter = null;

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
	 * Reset test content and custom post types.
	 *
	 * @return void
	 */
	public function tearDown(): void {
		if ( null !== $this->posts_query_filter ) {
			remove_filter( 'posts_pre_query', $this->posts_query_filter, 10 );
			$this->posts_query_filter = null;
		}

		if ( post_type_exists( 'seo_book' ) ) {
			unregister_post_type( 'seo_book' );
		}

		WorDBless_Posts::init()->clear_all_posts();

		parent::tearDown();
	}

	/**
	 * WorDBless does not support the get_posts() query used by llms.txt, so
	 * short-circuit the test query for inserted posts of the requested type.
	 *
	 * @param int[] $post_ids Inserted post IDs.
	 * @return void
	 */
	private function hook_wordbless_posts_query( $post_ids ) {
		$this->posts_query_filter = static function ( $posts, $query ) use ( $post_ids ) {
			$post_type = $query->get( 'post_type' );
			$matches   = array();

			foreach ( $post_ids as $post_id ) {
				$post = get_post( $post_id );
				if ( $post && 'publish' === $post->post_status && $post_type === $post->post_type ) {
					$matches[] = $post;
				}
			}

			return $matches;
		};

		add_filter( 'posts_pre_query', $this->posts_query_filter, 10, 2 );
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
	 * Public REST custom post types are included as their own sections.
	 *
	 * @return void
	 */
	public function test_generate_includes_supported_custom_post_type_section() {
		update_option( 'blogname', 'CPT Site' );
		register_post_type(
			'seo_book',
			array(
				'label'        => 'Books',
				'public'       => true,
				'show_ui'      => true,
				'show_in_rest' => true,
			)
		);

		$book_id = wp_insert_post(
			array(
				'post_type'    => 'seo_book',
				'post_status'  => 'publish',
				'post_title'   => 'Practical Schema',
				'post_excerpt' => 'A concise guide to schema markup.',
			)
		);
		$this->hook_wordbless_posts_query( array( $book_id ) );

		$output = Llms_Txt::generate();

		$this->assertStringContainsString( "## Books\n\n", $output );
		$this->assertStringContainsString( 'Practical Schema', $output );
		$this->assertStringContainsString( 'A concise guide to schema markup.', $output );
	}
}
