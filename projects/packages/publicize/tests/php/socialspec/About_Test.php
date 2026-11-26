<?php
/**
 * SocialSpec About document tests.
 *
 * @package automattic/jetpack-publicize
 */

namespace Automattic\Jetpack\Publicize\Socialspec;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;
use WorDBless\BaseTestCase;

/**
 * @covers \Automattic\Jetpack\Publicize\Socialspec\About
 */
#[CoversClass( About::class )]
class About_Test extends BaseTestCase {

	/**
	 * WorDBless stores posts still slashed by the kses filters, which breaks quotes in the content.
	 */
	public function set_up() {
		parent::set_up();
		kses_remove_filters();
	}

	/**
	 * Creates a page and sets it as the About page.
	 *
	 * @param array $args Post arguments.
	 * @return int The page ID.
	 */
	private static function create_about_page( $args ) {
		$page_id = wp_insert_post(
			array_merge(
				array(
					'post_type'   => 'page',
					'post_status' => 'publish',
					'post_title'  => 'About',
				),
				$args
			)
		);

		update_option( 'jetpack_social_about_page', $page_id );

		return $page_id;
	}

	/**
	 * Without a page set there is nothing to publish.
	 */
	public function test_without_page() {
		wp_insert_post(
			array(
				'post_type'   => 'page',
				'post_status' => 'publish',
				'post_name'   => 'about',
				'post_title'  => 'About',
			)
		);

		$this->assertNull( ( new About() )->get_content() );
	}

	/**
	 * The page is published as Markdown, with its title and all of its content.
	 */
	public function test_page() {
		self::create_about_page(
			array(
				'post_title'   => 'About "Jordan"',
				'post_content' => "<!-- wp:paragraph -->\n<p>I am an <strong>outdoor</strong> enthusiast.</p>\n<!-- /wp:paragraph -->\n\n<!--more-->\n\n<!-- wp:list -->\n<ul class=\"wp-block-list\"><!-- wp:list-item -->\n<li><a href=\"https://example.com/\">Example</a></li>\n<!-- /wp:list-item --></ul>\n<!-- /wp:list -->",
			)
		);

		$this->assertSame(
			"# About \u{201C}Jordan\u{201D}\n\nI am an **outdoor** enthusiast.\n\n- [Example](https://example.com/)\n",
			( new About() )->get_content()
		);
	}

	/**
	 * Unpublished and protected pages are not published.
	 */
	public function test_private_pages() {
		$page_id = self::create_about_page( array( 'post_status' => 'draft' ) );
		$this->assertNull( ( new About() )->get_content() );

		wp_update_post(
			array(
				'ID'            => $page_id,
				'post_status'   => 'publish',
				'post_password' => 'secret',
			)
		);
		$this->assertNull( ( new About() )->get_content() );
	}

	/**
	 * The page can be changed with a filter.
	 */
	public function test_page_filter() {
		self::create_about_page( array( 'post_content' => 'Set' ) );
		$other = wp_insert_post(
			array(
				'post_type'    => 'page',
				'post_status'  => 'publish',
				'post_title'   => 'Me',
				'post_content' => 'Hello',
			)
		);

		$filter = static function () use ( $other ) {
			return $other;
		};
		add_filter( 'jetpack_social_about_page', $filter );

		$this->assertSame( "# Me\n\nHello\n", ( new About() )->get_content() );
	}

	/**
	 * What Sharing and Likes add below the content is not part of the document.
	 */
	public function test_without_additions() {
		self::create_about_page( array( 'post_content' => 'Text' ) );

		foreach ( About::ADDITIONS as $hook ) {
			add_filter(
				'the_content',
				static function ( $content ) use ( $hook ) {
					return apply_filters( $hook, true ) ? $content . "<p>Added by $hook</p>" : $content;
				}
			);
		}

		$this->assertSame( "# About\n\nText\n", ( new About() )->get_content() );

		// Only for the document: the hooks are restored afterwards.
		foreach ( About::ADDITIONS as $hook ) {
			$this->assertTrue( apply_filters( $hook, true ), $hook );
		}
	}

	/**
	 * A site that has wp_html_to_markdown() keeps its own.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_keeps_the_function_of_the_site() {
		require_once __DIR__ . '/fixtures/wp-html-to-markdown.php';

		self::create_about_page( array( 'post_content' => 'Text' ) );

		$this->assertStringContainsString( 'from the site: <p>Text</p>', ( new About() )->get_content() );
	}

	/**
	 * Rendering restores the global post.
	 */
	public function test_restores_global_post() {
		$post_id = wp_insert_post(
			array(
				'post_status' => 'publish',
				'post_title'  => 'Post',
			)
		);
		self::create_about_page( array() );

		$GLOBALS['post'] = get_post( $post_id ); // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
		( new About() )->get_content();

		$this->assertSame( $post_id, $GLOBALS['post']->ID );
	}

	/**
	 * A line break in the title is a space.
	 */
	public function test_title_with_line_break() {
		self::create_about_page( array( 'post_content' => 'Text' ) );

		add_filter(
			'the_title',
			static function () {
				return 'One<br>Two';
			}
		);

		$this->assertStringStartsWith( "# One Two\n\n", ( new About() )->get_content() );
	}
}
