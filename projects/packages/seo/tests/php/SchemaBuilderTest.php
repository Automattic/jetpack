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
	 * Users created during the test.
	 *
	 * @var int[]
	 */
	private $user_ids = array();

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
		remove_all_filters( 'pre_option_show_on_front' );
		remove_all_filters( 'home_url' );
		delete_option( Schema_Settings::OPTION_NAME );
		wp_set_current_user( 0 );
		foreach ( $this->user_ids as $user_id ) {
			if ( function_exists( 'wp_delete_user' ) ) {
				wp_delete_user( $user_id );
			}
		}
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
	 * Create a WP user.
	 *
	 * @param array $overrides User field overrides.
	 * @return \WP_User
	 */
	private function make_user( array $overrides = array() ) {
		$suffix  = (string) wp_rand();
		$user_id = wp_insert_user(
			array_merge(
				array(
					'user_login'   => 'schema_author_' . $suffix,
					'user_pass'    => 'password',
					'user_email'   => 'schema_author_' . $suffix . '@example.test',
					'display_name' => 'Jane Doe',
				),
				$overrides
			)
		);

		$this->assertIsInt( $user_id );
		$this->user_ids[] = $user_id;
		return get_userdata( $user_id );
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

		return $this->capture_emitted_document();
	}

	/**
	 * Drive Schema_Builder::emit() against the blog-index home page (is_home,
	 * non-singular) and return the decoded JSON-LD document, or null.
	 *
	 * `is_front_page()` is a computed WP_Query method: it's true when the query is
	 * the home and `show_on_front` is `posts`. The dbless env doesn't seed that
	 * option, so pin it to `posts` (its real default) alongside `is_home`.
	 *
	 * @return array|null Decoded JSON-LD document, or null when emit() outputs nothing.
	 */
	private function emit_front_page_document() {
		add_filter(
			'pre_option_show_on_front',
			static function () {
				return 'posts';
			}
		);

		global $wp_query;
		$wp_query          = new \WP_Query();
		$wp_query->is_home = true;

		return $this->capture_emitted_document();
	}

	/**
	 * Run emit() with the current `$wp_query`, capture its output, and decode the
	 * single JSON-LD script block (or null when nothing is emitted).
	 *
	 * @return array|null
	 */
	private function capture_emitted_document() {
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
	 * Drive Schema_Builder::emit() against an author archive.
	 *
	 * @param \WP_User $user Queried author.
	 * @return array|null Decoded JSON-LD document, or null when emit() outputs nothing.
	 */
	private function emit_author_document( $user ) {
		global $wp_query;
		$wp_query                    = new \WP_Query();
		$wp_query->is_author         = true;
		$wp_query->queried_object    = $user;
		$wp_query->queried_object_id = $user->ID;

		return $this->capture_emitted_document();
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
	 * Nothing is emitted on a non-singular request that is not the front page
	 * (archives, 404, search): no page node and no Organization, so the graph is
	 * empty. The front page is the one non-singular request that does emit — see
	 * test_emits_organization_on_front_page().
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
		$this->assertArrayNotHasKey( 'author', $article, 'An unresolvable post author adds no author property.' );

		// The full Organization node lives on the home page only; a post references
		// it by @id (see test_post_references_publisher_by_id_without_organization_node).
		$this->assertNull( $this->node_of_type( $doc, 'Organization' ), 'A post must not carry the Organization node.' );
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
	 * The home page emits the site-level Organization node (Google's guidance: one
	 * canonical entity, on the home page) and, being non-singular, no page node.
	 */
	public function test_emits_organization_on_front_page() {
		$this->set_site_name( 'Acme Co' );

		$doc = $this->emit_front_page_document();

		$organization = $this->node_of_type( $doc, 'Organization' );
		$this->assertIsArray( $organization, 'Expected an Organization node on the home page.' );
		$this->assertSame( 'Acme Co', $organization['name'] );

		$this->assertNull( $this->node_of_type( $doc, 'Article' ), 'The home page has no Article node.' );
	}

	/**
	 * A single post references the home-page Organization as its `publisher` by the
	 * stable `@id`, without duplicating the full Organization node onto the post.
	 */
	public function test_post_references_publisher_by_id_without_organization_node() {
		$this->set_site_name( 'Acme Co' );

		$doc = $this->emit_document( $this->make_post() );

		$article = $this->node_of_type( $doc, 'Article' );
		$this->assertIsArray( $article, 'Expected an Article node in the graph.' );
		$this->assertSame( Schema_Node_Ids::organization(), $article['publisher']['@id'] );

		// Site-level nodes live on the home page only, never duplicated onto a post.
		$this->assertNull( $this->node_of_type( $doc, 'Organization' ), 'A post must not carry the Organization node.' );
		$this->assertNull( $this->node_of_type( $doc, 'WebSite' ), 'A post must not carry the WebSite node.' );
	}

	/**
	 * The home page includes the site-level WebSite node, referenced to the
	 * Organization by `publisher`. Like Organization, it lives on the home page
	 * only — never on posts.
	 */
	public function test_graph_includes_website_referenced_to_organization() {
		$this->set_site_name( 'Acme Co' );

		$doc = $this->emit_front_page_document();

		$organization = $this->node_of_type( $doc, 'Organization' );
		$website      = $this->node_of_type( $doc, 'WebSite' );
		$this->assertIsArray( $organization, 'Expected an Organization node in the graph.' );
		$this->assertIsArray( $website, 'Expected a WebSite node in the graph.' );
		$this->assertSame( Schema_Node_Ids::website(), $website['@id'] );
		$this->assertSame( 'Acme Co', $website['name'] );
		$this->assertSame( $organization['@id'], $website['publisher']['@id'] );
		$this->assertSame( 'SearchAction', $website['potentialAction']['@type'] );
	}

	/**
	 * Without a Site Title, neither site-level node is emitted on the home page, so
	 * the home page graph is empty.
	 */
	public function test_graph_omits_site_level_nodes_without_site_name() {
		$this->set_site_name( '' );

		$doc = $this->emit_front_page_document();

		$this->assertNull( $doc, 'An unnamed site emits no site-level nodes.' );
	}

	/**
	 * An Article references its author by `@id` only, resolving to the full Person
	 * node in the same graph — never a duplicated inline author object.
	 */
	public function test_article_author_resolves_to_person_node_by_id() {
		$this->set_site_name( 'Acme Co' );
		$user = $this->make_user();
		update_user_meta( $user->ID, Author_Schema_Node::META_JOB_TITLE, 'Creator' );

		$doc = $this->emit_document( $this->make_post( array( 'post_author' => $user->ID ) ) );

		$article = $this->node_of_type( $doc, 'Article' );
		$this->assertIsArray( $article, 'Expected an Article node in the graph.' );
		$this->assertSame(
			array( '@id' => Schema_Node_Ids::person( $user->ID, $user->user_nicename ) ),
			$article['author'],
			'Article.author must be an @id-only reference.'
		);

		$person = $this->node_of_type( $doc, 'Person' );
		$this->assertIsArray( $person, 'Expected the full Person node in the graph.' );
		$this->assertSame( Schema_Node_Ids::person( $user->ID, $user->user_nicename ), $person['@id'] );
		$this->assertSame( 'Jane Doe', $person['name'] );
		$this->assertSame( 'Creator', $person['jobTitle'] );
		$this->assertSame( array( '@id' => Schema_Node_Ids::organization() ), $person['worksFor'] );

		// Site-level nodes still live on the home page only.
		$this->assertNull( $this->node_of_type( $doc, 'Organization' ), 'A post must not carry the Organization node.' );
	}

	/**
	 * Without an Organization, author archives emit ProfilePage and Person nodes
	 * linked by `mainEntity`, with no `worksFor`.
	 */
	public function test_author_archive_emits_profile_page_wrapping_person() {
		$this->set_site_name( '' );
		$user = $this->make_user();

		$doc = $this->emit_author_document( $user );

		$person       = $this->node_of_type( $doc, 'Person' );
		$profile_page = $this->node_of_type( $doc, 'ProfilePage' );
		$this->assertIsArray( $person, 'Expected a Person node in the graph.' );
		$this->assertIsArray( $profile_page, 'Expected a ProfilePage node in the graph.' );
		$this->assertSame( $person['@id'], $profile_page['mainEntity']['@id'] );
		$this->assertArrayNotHasKey( 'worksFor', $person );
	}

	/**
	 * With the Organization configured, the author-archive Person references it as
	 * `worksFor` by `@id` — without duplicating the Organization node itself.
	 */
	public function test_author_archive_person_works_for_organization() {
		$this->set_site_name( 'Acme Co' );
		$user = $this->make_user();

		$doc = $this->emit_author_document( $user );

		$person = $this->node_of_type( $doc, 'Person' );
		$this->assertIsArray( $person, 'Expected a Person node in the graph.' );
		$this->assertSame( array( '@id' => Schema_Node_Ids::organization() ), $person['worksFor'] );
		$this->assertNull( $this->node_of_type( $doc, 'Organization' ), 'An author archive must not carry the Organization node.' );
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

		$doc = $this->emit_front_page_document();

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
	 * site identity and omits `sameAs` / `email`.
	 */
	public function test_emitted_organization_unconfigured_preserves_site_identity_only() {
		$this->set_site_name( 'Acme Co' );

		$doc = $this->emit_front_page_document();

		$organization = $this->node_of_type( $doc, 'Organization' );
		$this->assertSame( 'Acme Co', $organization['name'] );
		$this->assertArrayNotHasKey( 'sameAs', $organization );
		$this->assertArrayNotHasKey( 'email', $organization );
	}

	/**
	 * A FAQPage on a single post carries no `publisher` (only Article references
	 * one) and, like any post, does not carry the site-level Organization node.
	 */
	public function test_faqpage_has_no_publisher() {
		$this->set_site_name( 'Acme Co' );
		\Jetpack_SEO_Posts::$schema_type = 'faq';

		$content  = '<!-- wp:details {"summary":"What is SEO?"} -->';
		$content .= '<details class="wp-block-details"><summary>What is SEO?</summary>';
		$content .= '<!-- wp:paragraph --><p>Search engine optimization.</p><!-- /wp:paragraph -->';
		$content .= '</details><!-- /wp:details -->';

		$doc = $this->emit_document( $this->make_post( array( 'post_content' => $content ) ) );

		$faq = $this->node_of_type( $doc, 'FAQPage' );
		$this->assertIsArray( $faq, 'Expected a FAQPage node in the graph.' );
		$this->assertArrayNotHasKey( 'publisher', $faq );

		$this->assertNull( $this->node_of_type( $doc, 'Organization' ), 'A post must not carry the Organization node.' );
	}
}
