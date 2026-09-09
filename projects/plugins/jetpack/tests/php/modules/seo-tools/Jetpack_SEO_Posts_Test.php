<?php
/**
 * Class Jetpack_SEO_Posts_Test.
 *
 * @package automattic/jetpack
 */

require_once JETPACK__PLUGIN_DIR . 'modules/seo-tools/class-jetpack-seo-posts.php';

/**
 * Tests for the per-post SEO meta helpers: schema-type sanitization/read and the
 * factual per-post coverage report.
 */
class Jetpack_SEO_Posts_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Unknown / non-allowed schema types sanitize to '' (no override); the two
	 * allowed types pass through, case-insensitively.
	 */
	public function test_sanitize_schema_type() {
		$this->assertSame( '', Jetpack_SEO_Posts::sanitize_schema_type( '' ) );
		$this->assertSame( 'article', Jetpack_SEO_Posts::sanitize_schema_type( 'article' ) );
		$this->assertSame( 'faq', Jetpack_SEO_Posts::sanitize_schema_type( 'faq' ) );
		// sanitize_key() lowercases, so a differently-cased allowed value is kept.
		$this->assertSame( 'article', Jetpack_SEO_Posts::sanitize_schema_type( 'Article' ) );
		// An unknown (non-allowed) value falls back to no override.
		$this->assertSame( '', Jetpack_SEO_Posts::sanitize_schema_type( 'organization' ) );
	}

	/**
	 * Reads back the stored schema override, returning '' when unset or for an
	 * invalid post.
	 */
	public function test_get_post_schema_type() {
		$post_id = self::factory()->post->create();

		$this->assertSame( '', Jetpack_SEO_Posts::get_post_schema_type( $post_id ) );

		update_post_meta( $post_id, Jetpack_SEO_Posts::SCHEMA_TYPE_META_KEY, 'faq' );
		$this->assertSame( 'faq', Jetpack_SEO_Posts::get_post_schema_type( $post_id ) );

		// An invalid post yields no override.
		$this->assertSame( '', Jetpack_SEO_Posts::get_post_schema_type( 0 ) );
	}

	/**
	 * Reports the presence/state of each SEO field that is set.
	 */
	public function test_get_post_seo_coverage_reports_set_fields() {
		$post_id = self::factory()->post->create();
		update_post_meta( $post_id, Jetpack_SEO_Posts::HTML_TITLE_META_KEY, 'A custom SEO title' );
		update_post_meta( $post_id, Jetpack_SEO_Posts::DESCRIPTION_META_KEY, 'A meta description.' );
		update_post_meta( $post_id, Jetpack_SEO_Posts::SCHEMA_TYPE_META_KEY, 'article' );
		update_post_meta( $post_id, Jetpack_SEO_Posts::NOINDEX_META_KEY, '1' );

		$coverage = Jetpack_SEO_Posts::get_post_seo_coverage( $post_id );

		$this->assertTrue( $coverage['has_custom_title'] );
		$this->assertTrue( $coverage['has_description'] );
		$this->assertTrue( $coverage['has_schema_type'] );
		$this->assertTrue( $coverage['noindex'] );
	}

	/**
	 * A post with no SEO meta reports every field as unset, and an invalid post
	 * yields the same all-false shape.
	 */
	public function test_get_post_seo_coverage_defaults_to_false() {
		$post_id  = self::factory()->post->create();
		$coverage = Jetpack_SEO_Posts::get_post_seo_coverage( $post_id );

		$this->assertFalse( $coverage['has_custom_title'] );
		$this->assertFalse( $coverage['has_description'] );
		$this->assertFalse( $coverage['has_schema_type'] );
		$this->assertFalse( $coverage['noindex'] );

		$invalid = Jetpack_SEO_Posts::get_post_seo_coverage( 0 );
		$this->assertSame(
			array(
				'has_custom_title' => false,
				'has_description'  => false,
				'has_schema_type'  => false,
				'noindex'          => false,
			),
			$invalid
		);
	}

	/**
	 * Create a published post gated by the post-level Newsletter access setting.
	 *
	 * @param array $fields Post field overrides.
	 * @return int Post ID.
	 */
	private function create_gated_post( $fields = array() ) {
		// The factory supplies a default excerpt, which would publish ahead of the gate.
		$post_id = self::factory()->post->create(
			array_merge(
				array(
					'post_content' => 'Subscriber-only body text.',
					'post_excerpt' => '',
				),
				$fields
			)
		);
		update_post_meta( $post_id, '_jetpack_newsletter_access', 'paid_subscribers' );

		return $post_id;
	}

	/**
	 * The raw-content fall-through never describes a gated post, since it reads
	 * post_content directly and so never passes the `the_content` paywall.
	 */
	public function test_get_post_description_omits_gated_body() {
		$post_id = $this->create_gated_post();
		$this->go_to( get_permalink( $post_id ) );

		$this->assertSame( '', Jetpack_SEO_Posts::get_post_description( get_post( $post_id ) ) );
	}

	/**
	 * An ungated post still describes itself (control for the test above).
	 */
	public function test_get_post_description_keeps_ungated_body() {
		$post_id = self::factory()->post->create(
			array(
				'post_content' => 'Public body text.',
				'post_excerpt' => '',
			)
		);
		$this->go_to( get_permalink( $post_id ) );

		$this->assertStringContainsString(
			'Public body text.',
			Jetpack_SEO_Posts::get_post_description( get_post( $post_id ) )
		);
	}

	/**
	 * A custom SEO description is a deliberate public summary, so the gate must
	 * not withhold it.
	 */
	public function test_get_post_description_keeps_custom_description_on_gated_post() {
		$post_id = $this->create_gated_post();
		update_post_meta( $post_id, Jetpack_SEO_Posts::DESCRIPTION_META_KEY, 'A custom SEO description.' );
		$this->go_to( get_permalink( $post_id ) );

		$this->assertSame(
			'A custom SEO description.',
			Jetpack_SEO_Posts::get_post_description( get_post( $post_id ) )
		);
	}

	/**
	 * An author-written excerpt likewise survives the gate.
	 */
	public function test_get_post_description_keeps_excerpt_on_gated_post() {
		$post_id = $this->create_gated_post( array( 'post_excerpt' => 'Public summary.' ) );
		$this->go_to( get_permalink( $post_id ) );

		$this->assertSame(
			'Public summary.',
			Jetpack_SEO_Posts::get_post_description( get_post( $post_id ) )
		);
	}

	/**
	 * A paywalled post is described by the teaser the front end already publishes.
	 */
	public function test_get_post_description_uses_the_paywall_teaser() {
		$post_id = self::factory()->post->create(
			array(
				'post_content' => 'Free intro text.<!-- wp:jetpack/paywall /-->Paid body text.',
				'post_excerpt' => '',
			)
		);
		$this->go_to( get_permalink( $post_id ) );

		$description = Jetpack_SEO_Posts::get_post_description( get_post( $post_id ) );

		$this->assertStringContainsString( 'Free intro text.', $description );
		$this->assertStringNotContainsString( 'Paid body text.', $description );
	}

	/**
	 * Registers the SEO post meta keys (including the schema-type enum) for the
	 * REST API.
	 */
	public function test_register_post_meta() {
		Jetpack_SEO_Posts::register_post_meta();

		$this->assertTrue( registered_meta_key_exists( 'post', Jetpack_SEO_Posts::SCHEMA_TYPE_META_KEY ) );
		$this->assertTrue( registered_meta_key_exists( 'post', Jetpack_SEO_Posts::DESCRIPTION_META_KEY ) );
		$this->assertTrue( registered_meta_key_exists( 'post', Jetpack_SEO_Posts::HTML_TITLE_META_KEY ) );
		$this->assertTrue( registered_meta_key_exists( 'post', Jetpack_SEO_Posts::NOINDEX_META_KEY ) );
	}
}
