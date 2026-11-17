<?php
/**
 * Tests for Post_Seo.
 *
 * @package automattic/jetpack-seo
 */

namespace Automattic\Jetpack\SEO;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;

/**
 * @covers \Automattic\Jetpack\SEO\Post_Seo
 */
#[CoversClass( Post_Seo::class )]
class PostSeoTest extends SeoTestCase {

	protected function tearDown(): void {
		global $wp_query;
		$wp_query = new \WP_Query();
		remove_all_filters( 'jetpack_disable_seo_tools' );
		parent::tearDown();
	}

	/**
	 * Create a published post and make it the singular view.
	 *
	 * @param array $fields Post fields.
	 * @return int Post ID.
	 */
	private function view_post( array $fields ) {
		$post_id = wp_insert_post(
			array_merge(
				array(
					'post_status' => 'publish',
					'post_title'  => 'Test post',
				),
				$fields
			)
		);

		global $wp_query;
		$wp_query              = new \WP_Query();
		$wp_query->is_singular = true;

		return $post_id;
	}

	/**
	 * @dataProvider provide_descriptions
	 *
	 * @param array  $fields   Post fields.
	 * @param string $custom   Custom SEO description.
	 * @param bool   $disabled Whether another plugin owns SEO output.
	 * @param string $expected Expected description.
	 */
	#[DataProvider( 'provide_descriptions' )]
	public function test_get_description( array $fields, $custom, $disabled, $expected ) {
		$post_id = $this->view_post( $fields );
		update_post_meta( $post_id, Content_Coverage::META_DESCRIPTION, $custom );
		if ( $disabled ) {
			add_filter( 'jetpack_disable_seo_tools', '__return_true' );
		}

		$this->assertSame( $expected, Post_Seo::get_description( $post_id ) );
	}

	/**
	 * @return array
	 */
	public static function provide_descriptions() {
		$fields = array(
			'post_content' => 'Body.',
			'post_excerpt' => 'Excerpt.',
		);

		return array(
			'custom description first'           => array( $fields, 'Custom.', false, 'Custom.' ),
			'excerpt without a custom one'       => array( $fields, '', false, 'Excerpt.' ),
			'content last'                       => array( array( 'post_content' => 'Body.' ), '', false, 'Body.' ),
			'content without Query Loop blocks'  => array( array( 'post_content' => 'Body.<!-- wp:query --><p>No posts found.</p><!-- /wp:query -->' ), '', false, 'Body.' ),
			'custom ignored while SEO is off'    => array( $fields, 'Custom.', true, 'Excerpt.' ),
			'nothing for a password-protected'   => array( $fields + array( 'post_password' => 'secret' ), 'Custom.', false, '' ),
			'gated body without a teaser hidden' => array( array( 'post_content' => '<!-- wp:jetpack/paywall /-->Paid body.' ), '', false, '' ),
		);
	}

	/**
	 * Archives list many posts, so none of them describes the page.
	 */
	public function test_get_description_is_empty_off_a_singular_view() {
		$post_id = $this->view_post( array( 'post_excerpt' => 'Excerpt.' ) );

		global $wp_query;
		$wp_query->is_singular = false;

		$this->assertSame( '', Post_Seo::get_description( $post_id ) );
	}

	/**
	 * A stored schema type outside the allowed list reads as no override.
	 */
	public function test_get_schema_type_drops_unknown_values() {
		$post_id = $this->view_post( array() );

		update_post_meta( $post_id, Content_Coverage::META_SCHEMA_TYPE, 'faq' );
		$this->assertSame( 'faq', Post_Seo::get_schema_type( $post_id ) );

		update_post_meta( $post_id, Content_Coverage::META_SCHEMA_TYPE, 'recipe' );
		$this->assertSame( '', Post_Seo::get_schema_type( $post_id ) );
	}
}
