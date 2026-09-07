<?php
/**
 * Tests for Jetpack SEO supported post type discovery.
 *
 * @package automattic/jetpack-seo
 */

namespace Automattic\Jetpack\SEO;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;

/**
 * @covers \Automattic\Jetpack\SEO\Post_Types
 */
#[CoversClass( Post_Types::class )]
class PostTypesTest extends TestCase {

	/**
	 * Clean up registered custom post types.
	 *
	 * @return void
	 */
	public function tearDown(): void {
		foreach ( array( 'seo_book', 'seo_hidden', 'seo_no_rest', 'seo_internal' ) as $post_type ) {
			if ( post_type_exists( $post_type ) ) {
				unregister_post_type( $post_type );
			}
		}

		parent::tearDown();
	}

	/**
	 * Supported content types are the public, UI-visible, REST-enabled post
	 * types Jetpack SEO can list and edit through core-data.
	 *
	 * @return void
	 */
	public function test_supported_content_types_include_public_rest_cpts_and_exclude_attachments() {
		register_post_type(
			'seo_book',
			array(
				'label'        => 'Books',
				'public'       => true,
				'show_ui'      => true,
				'show_in_rest' => true,
			)
		);
		register_post_type(
			'seo_hidden',
			array(
				'label'        => 'Hidden',
				'public'       => true,
				'show_ui'      => false,
				'show_in_rest' => true,
			)
		);
		register_post_type(
			'seo_no_rest',
			array(
				'label'        => 'No REST',
				'public'       => true,
				'show_ui'      => true,
				'show_in_rest' => false,
			)
		);
		register_post_type(
			'seo_internal',
			array(
				'label'              => 'Internal',
				'public'             => true,
				'publicly_queryable' => false,
				'show_ui'            => true,
				'show_in_rest'       => true,
			)
		);

		$post_types = Post_Types::get_supported_content_types();

		$this->assertContains( 'post', $post_types );
		$this->assertContains( 'page', $post_types );
		$this->assertContains( 'seo_book', $post_types );
		$this->assertNotContains( 'attachment', $post_types );
		$this->assertNotContains( 'seo_hidden', $post_types );
		$this->assertNotContains( 'seo_no_rest', $post_types );
		$this->assertNotContains( 'seo_internal', $post_types );
	}

	/**
	 * Supported content type options expose slugs and sanitized labels.
	 *
	 * @return void
	 */
	public function test_supported_content_type_options_expose_slugs_and_labels() {
		register_post_type(
			'seo_book',
			array(
				'label'        => '<b>Books</b>',
				'public'       => true,
				'show_ui'      => true,
				'show_in_rest' => true,
			)
		);

		$this->assertContains(
			array(
				'slug'  => 'seo_book',
				'label' => 'Books',
			),
			Post_Types::get_supported_content_type_options()
		);
	}
}
