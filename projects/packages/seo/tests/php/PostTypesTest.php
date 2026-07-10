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
		foreach ( array( 'seo_book', 'seo_hidden', 'seo_no_rest' ) as $post_type ) {
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

		$post_types = Post_Types::get_supported_content_types();

		$this->assertContains( 'post', $post_types );
		$this->assertContains( 'page', $post_types );
		$this->assertContains( 'seo_book', $post_types );
		$this->assertNotContains( 'attachment', $post_types );
		$this->assertNotContains( 'seo_hidden', $post_types );
		$this->assertNotContains( 'seo_no_rest', $post_types );
	}

	/**
	 * Supported object discovery keeps labels for UI surfaces such as the
	 * Content tab filter and llms.txt headings.
	 *
	 * @return void
	 */
	public function test_supported_content_type_objects_preserve_labels() {
		register_post_type(
			'seo_book',
			array(
				'label'        => 'Books',
				'public'       => true,
				'show_ui'      => true,
				'show_in_rest' => true,
			)
		);

		$post_types = Post_Types::get_supported_content_type_objects();

		$this->assertArrayHasKey( 'seo_book', $post_types );
		$this->assertSame( 'Books', $post_types['seo_book']->label );
	}

	/**
	 * Supported content type options expose the stable data shape consumed by
	 * the Content tab, so client-side discovery cannot use a divergent rule.
	 *
	 * @return void
	 */
	public function test_supported_content_type_options_expose_slugs_and_labels() {
		register_post_type(
			'seo_book',
			array(
				'label'        => 'Books',
				'public'       => true,
				'show_ui'      => true,
				'show_in_rest' => true,
			)
		);

		$options = Post_Types::get_supported_content_type_options();

		$this->assertContains(
			array(
				'slug'  => 'seo_book',
				'label' => 'Books',
			),
			$options
		);
	}
}
