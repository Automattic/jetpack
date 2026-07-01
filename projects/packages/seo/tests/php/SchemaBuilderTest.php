<?php
/**
 * Tests for the Jetpack SEO Schema_Builder.
 *
 * These exercise the emitted `<script type="application/ld+json">` document end
 * to end — the real regression surface — rather than the internal node builders
 * (those are covered by PostSchemaNodeTest / OrganizationSchemaNodeTest).
 *
 * @package automattic/jetpack-seo
 */

namespace Automattic\Jetpack\SEO;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;
use WP_Post;

/**
 * @covers \Automattic\Jetpack\SEO\Schema_Builder
 */
#[CoversClass( Schema_Builder::class )]
class SchemaBuilderTest extends TestCase {

	/**
	 * Reset the host-plugin stubs (see tests/php/bootstrap.php) before each test.
	 *
	 * @return void
	 */
	protected function setUp(): void {
		parent::setUp();
		\Jetpack_SEO_Utils::$enabled     = true;
		\Jetpack_SEO_Posts::$schema_type = '';
		\Jetpack_SEO_Posts::$description = '';
	}

	/**
	 * Remove any site-identity filters a test added so they don't leak.
	 *
	 * @return void
	 */
	protected function tearDown(): void {
		remove_all_filters( 'pre_option_blogname' );
		remove_all_filters( 'home_url' );
		delete_option( Schema_Settings::OPTION_NAME );
		parent::tearDown();
	}

	/**
	 * Give the site a Site Title so the Organization node is emitted deterministically,
	 * regardless of the test environment's default `blogname`.
	 *
	 * @param string $name Site Title.
	 * @return void
	 */
	private function set_site_name( $name ) {
		add_filter(
			'pre_option_blogname',
			static function () use ( $name ) {
				return $name;
			}
		);
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
	 * Drive Schema_Builder::emit() against a queried singular post and return the
	 * decoded JSON-LD document, or null when nothing is emitted. This is the
	 * regression surface that matters: the actual emitted
	 * `<script type="application/ld+json">` content, not the internal builders.
	 *
	 * @param WP_Post|null $post Queried singular post, or null for a non-singular request.
	 * @return array|null Decoded JSON-LD document, or null when emit() outputs nothing.
	 */
	private function emit_document( $post ) {
		global $wp_query;
		$wp_query = new \WP_Query();
		if ( $post instanceof WP_Post ) {
			$wp_query->is_singular       = true;
			$wp_query->queried_object    = $post;
			$wp_query->queried_object_id = $post->ID;
		}

		ob_start();
		Schema_Builder::emit();
		$html = (string) ob_get_clean();

		if ( '' === $html ) {
			return null;
		}

		$this->assertSame(
			1,
			preg_match( '#<script type="application/ld\+json">(.*)</script>#s', $html, $matches ),
			'emit() output is not a single application/ld+json script block.'
		);
		return json_decode( $matches[1], true );
	}

	/**
	 * Find the first node of a given `@type` in a `@graph` document, or null.
	 *
	 * Looking nodes up by type (rather than position) keeps these assertions
	 * stable as more site-level nodes join the graph.
	 *
	 * @param array  $document Decoded `@graph` document.
	 * @param string $type     The `@type` to find.
	 * @return array|null
	 */
	private function node_of_type( array $document, string $type ) {
		foreach ( $document['@graph'] as $node ) {
			if ( is_array( $node ) && ( $node['@type'] ?? '' ) === $type ) {
				return $node;
			}
		}
		return null;
	}

	/**
	 * Nothing is emitted when the SEO feature is disabled.
	 */
	public function test_emits_nothing_when_feature_disabled() {
		\Jetpack_SEO_Utils::$enabled = false;
		$this->assertNull( $this->emit_document( $this->make_post() ) );
	}

	/**
	 * Nothing is emitted on non-singular requests (home, archives, 404). Site-level
	 * nodes ride along on the singular request's graph; they are not emitted on
	 * their own yet.
	 */
	public function test_emits_nothing_on_non_singular() {
		$this->assertNull( $this->emit_document( null ) );
	}

	/**
	 * Nothing is emitted for unpublished content, even on a singular request.
	 */
	public function test_emits_nothing_for_unpublished() {
		$this->assertNull( $this->emit_document( $this->make_post( array( 'post_status' => 'draft' ) ) ) );
	}

	/**
	 * A page with no schema override yields no page node, so the request emits
	 * nothing at all (no standalone site-level graph).
	 */
	public function test_emits_nothing_for_page_without_override() {
		$this->assertNull( $this->emit_document( $this->make_post( array( 'post_type' => 'page' ) ) ) );
	}

	/**
	 * A published standard post emits a `@graph` document containing an Article
	 * node. Title/permalink values resolve through DB lookups the dbless test
	 * environment can't satisfy, so this asserts document shape, not those values.
	 */
	public function test_emits_graph_with_article_for_published_post() {
		$doc = $this->emit_document( $this->make_post( array( 'post_title' => 'Hello world' ) ) );

		$this->assertIsArray( $doc );
		$this->assertSame( 'https://schema.org', $doc['@context'] );
		$this->assertIsArray( $doc['@graph'] );
		$this->assertArrayNotHasKey( '@type', $doc, 'The document is a @graph, not a single top-level node.' );

		$article = $this->node_of_type( $doc, 'Article' );
		$this->assertIsArray( $article, 'Expected an Article node in the graph.' );
		$this->assertArrayHasKey( 'headline', $article );
		$this->assertArrayHasKey( 'datePublished', $article );
		$this->assertArrayHasKey( 'mainEntityOfPage', $article );
	}

	/**
	 * A "faq" override emits a `@graph` document containing a FAQPage node.
	 */
	public function test_emits_graph_with_faqpage_for_faq_override() {
		\Jetpack_SEO_Posts::$schema_type = 'faq';

		$content  = '<!-- wp:details {"summary":"What is SEO?"} -->';
		$content .= '<details class="wp-block-details"><summary>What is SEO?</summary>';
		$content .= '<!-- wp:paragraph --><p>Search engine optimization.</p><!-- /wp:paragraph -->';
		$content .= '</details><!-- /wp:details -->';

		$doc = $this->emit_document( $this->make_post( array( 'post_content' => $content ) ) );

		$this->assertIsArray( $doc );
		$faq = $this->node_of_type( $doc, 'FAQPage' );
		$this->assertIsArray( $faq, 'Expected a FAQPage node in the graph.' );
		$this->assertSame( 'What is SEO?', $faq['mainEntity'][0]['name'] );
	}

	/**
	 * The graph leads with the site-level Organization node, and the Article
	 * references it as `publisher` by `@id`.
	 */
	public function test_graph_leads_with_organization_referenced_as_article_publisher() {
		$this->set_site_name( 'Acme Co' );

		$doc = $this->emit_document( $this->make_post() );

		$this->assertSame( 'Organization', $doc['@graph'][0]['@type'], 'Site-level nodes come first.' );

		$organization = $this->node_of_type( $doc, 'Organization' );
		$this->assertIsArray( $organization, 'Expected an Organization node in the graph.' );
		$this->assertSame( 'Acme Co', $organization['name'] );

		$article = $this->node_of_type( $doc, 'Article' );
		$this->assertSame( $organization['@id'], $article['publisher']['@id'] );
	}

	/**
	 * Saved schema settings reach the emitted JSON-LD: a configured `sameAs` (and a
	 * `name` override) flows through Schema_Settings → the `$settings` seam on
	 * Organization_Schema_Node → the emitted Organization node. This is the end-to-end
	 * proof that the settings store is wired into the front-end output.
	 */
	public function test_emitted_organization_reflects_saved_schema_settings() {
		$this->set_site_name( 'Acme Co' );
		Schema_Settings::update(
			array(
				'organization' => array(
					'name'   => 'Acme Corporation',
					'sameAs' => array( 'https://twitter.com/acme', 'https://facebook.com/acme' ),
					'email'  => 'hello@acme.test',
				),
			)
		);

		$doc = $this->emit_document( $this->make_post() );

		$organization = $this->node_of_type( $doc, 'Organization' );
		$this->assertIsArray( $organization, 'Expected an Organization node in the graph.' );
		// The stored name override wins over the Site Title.
		$this->assertSame( 'Acme Corporation', $organization['name'] );
		$this->assertSame(
			array( 'https://twitter.com/acme', 'https://facebook.com/acme' ),
			$organization['sameAs']
		);
		$this->assertSame( 'hello@acme.test', $organization['email'] );
	}

	/**
	 * With no saved settings, the emitted Organization node still comes purely from
	 * site identity and omits `sameAs` (PR A behavior is preserved by the wiring).
	 */
	public function test_emitted_organization_unconfigured_preserves_site_identity_only() {
		$this->set_site_name( 'Acme Co' );

		$doc = $this->emit_document( $this->make_post() );

		$organization = $this->node_of_type( $doc, 'Organization' );
		$this->assertSame( 'Acme Co', $organization['name'] );
		$this->assertArrayNotHasKey( 'sameAs', $organization );
		$this->assertArrayNotHasKey( 'email', $organization );
	}

	/**
	 * A FAQPage joins the graph alongside the Organization, but carries no
	 * `publisher` (only Article references a publisher).
	 */
	public function test_faqpage_has_no_publisher_but_graph_has_organization() {
		$this->set_site_name( 'Acme Co' );
		\Jetpack_SEO_Posts::$schema_type = 'faq';

		$content  = '<!-- wp:details {"summary":"What is SEO?"} -->';
		$content .= '<details class="wp-block-details"><summary>What is SEO?</summary>';
		$content .= '<!-- wp:paragraph --><p>Search engine optimization.</p><!-- /wp:paragraph -->';
		$content .= '</details><!-- /wp:details -->';

		$doc = $this->emit_document( $this->make_post( array( 'post_content' => $content ) ) );

		$this->assertIsArray( $this->node_of_type( $doc, 'Organization' ) );

		$faq = $this->node_of_type( $doc, 'FAQPage' );
		$this->assertArrayNotHasKey( 'publisher', $faq );
	}
}
