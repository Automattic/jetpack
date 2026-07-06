<?php
/**
 * Tests for the Jetpack SEO Post_Schema_Node builder.
 *
 * @package automattic/jetpack-seo
 */

namespace Automattic\Jetpack\SEO;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;
use ReflectionMethod;
use WP_Post;

/**
 * @covers \Automattic\Jetpack\SEO\Post_Schema_Node
 */
#[CoversClass( Post_Schema_Node::class )]
class PostSchemaNodeTest extends TestCase {

	/**
	 * Reset the host-plugin stubs (see tests/php/bootstrap.php) before each test.
	 *
	 * @return void
	 */
	protected function setUp(): void {
		parent::setUp();
		\Jetpack_SEO_Posts::$schema_type = '';
		\Jetpack_SEO_Posts::$description = '';
	}

	/**
	 * Build a WP_Post from a field overrides array, with sensible publish defaults.
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
					'post_date'     => '2026-01-01 00:00:00',
					'post_date_gmt' => '2026-01-01 00:00:00',
					'post_author'   => 0,
				),
				$fields
			)
		);
	}

	/**
	 * Invoke a private static Post_Schema_Node method by reflection.
	 *
	 * @param string $name Method name.
	 * @param mixed  ...$args Arguments.
	 * @return mixed
	 */
	private function invoke( string $name, ...$args ) {
		$method = new ReflectionMethod( Post_Schema_Node::class, $name );
		// setAccessible() is required to invoke a private method on PHP < 8.1, and a
		// deprecated no-op from 8.1 on — call it only where it's actually needed.
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}
		return $method->invoke( null, ...$args );
	}

	/**
	 * The default schema type is Article only for standard posts; pages,
	 * attachments, and custom post types get no default (require an override).
	 */
	public function test_default_schema_is_article_only_for_standard_posts() {
		$this->assertSame( 'article', $this->invoke( 'default_schema_for_post', $this->make_post( array( 'post_type' => 'post' ) ) ) );
		$this->assertSame( '', $this->invoke( 'default_schema_for_post', $this->make_post( array( 'post_type' => 'page' ) ) ) );
		$this->assertSame( '', $this->invoke( 'default_schema_for_post', $this->make_post( array( 'post_type' => 'attachment' ) ) ) );
		$this->assertSame( '', $this->invoke( 'default_schema_for_post', $this->make_post( array( 'post_type' => 'product' ) ) ) );
	}

	/**
	 * No node is built for unpublished content (previews, drafts, private, etc.),
	 * even when a logged-in user can view it.
	 */
	public function test_no_node_for_unpublished_posts() {
		foreach ( array( 'draft', 'private', 'pending', 'future', 'auto-draft' ) as $status ) {
			$this->assertNull(
				Post_Schema_Node::build( $this->make_post( array( 'post_status' => $status ) ) ),
				"Expected no node for status: {$status}"
			);
		}
	}

	/**
	 * A non-WP_Post (e.g. a non-singular queried object) yields no node.
	 */
	public function test_no_node_for_non_post() {
		$this->assertNull( Post_Schema_Node::build( null ) );
	}

	/**
	 * A published standard post with no override produces an Article node.
	 */
	public function test_published_post_builds_article_by_default() {
		$node = Post_Schema_Node::build(
			$this->make_post(
				array(
					'post_type'  => 'post',
					'post_title' => 'Hello world',
				)
			)
		);

		$this->assertIsArray( $node );
		$this->assertSame( 'Article', $node['@type'] );
		$this->assertArrayHasKey( 'headline', $node );
		$this->assertArrayHasKey( 'datePublished', $node );
		$this->assertArrayHasKey( 'mainEntityOfPage', $node );
	}

	/**
	 * A page with no override produces no node (pages have no default schema).
	 */
	public function test_published_page_has_no_default_schema() {
		$this->assertNull(
			Post_Schema_Node::build( $this->make_post( array( 'post_type' => 'page' ) ) )
		);
	}

	/**
	 * FAQPage answers are built from a `core/details` block's inner blocks only,
	 * so the question (the `<summary>`) is not duplicated into the answer text.
	 */
	public function test_faq_answer_excludes_the_question() {
		\Jetpack_SEO_Posts::$schema_type = 'faq';

		$content  = '<!-- wp:details {"summary":"What is SEO?"} -->';
		$content .= '<details class="wp-block-details"><summary>What is SEO?</summary>';
		$content .= '<!-- wp:paragraph --><p>Search engine optimization.</p><!-- /wp:paragraph -->';
		$content .= '</details><!-- /wp:details -->';

		$node = Post_Schema_Node::build( $this->make_post( array( 'post_content' => $content ) ) );

		$this->assertIsArray( $node );
		$this->assertSame( 'FAQPage', $node['@type'] );
		$this->assertCount( 1, $node['mainEntity'] );

		$item = $node['mainEntity'][0];
		$this->assertSame( 'Question', $item['@type'] );
		$this->assertSame( 'What is SEO?', $item['name'] );
		$this->assertSame( 'Search engine optimization.', $item['acceptedAnswer']['text'] );
		$this->assertStringNotContainsString( 'What is SEO?', $item['acceptedAnswer']['text'] );
	}

	/**
	 * A "faq" override with no `core/details` blocks yields no node, rather than
	 * an empty/invalid FAQPage.
	 */
	public function test_faq_without_details_blocks_is_null() {
		\Jetpack_SEO_Posts::$schema_type = 'faq';
		$node                            = Post_Schema_Node::build(
			$this->make_post( array( 'post_content' => '<!-- wp:paragraph --><p>No FAQ here.</p><!-- /wp:paragraph -->' ) )
		);
		$this->assertNull( $node );
	}
}
