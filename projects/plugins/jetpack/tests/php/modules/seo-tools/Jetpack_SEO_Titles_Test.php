<?php
/**
 * Class Jetpack_SEO_Titles_Test.
 *
 * @package automattic/jetpack
 */

require_once JETPACK__PLUGIN_DIR . 'modules/seo-tools/class-jetpack-seo-titles.php';
require_once JETPACK__PLUGIN_DIR . 'modules/seo-tools/class-jetpack-seo-posts.php';
require_once JETPACK__PLUGIN_DIR . 'modules/seo-tools/class-jetpack-seo-utils.php';

/**
 * Class Jetpack_SEO_Titles_Test
 */
class Jetpack_SEO_Titles_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * When a static page is set as the site's front page and the per-page SEO title
	 * meta is populated, get_custom_title() should return that custom title even when
	 * the site-wide Front Page title format (advanced_seo_title_formats[front_page])
	 * is empty.
	 *
	 * Regression test for: page set as homepage with blank Front Page title format
	 * causes the per-page SEO title to be silently ignored.
	 */
	public function test_front_page_custom_title_used_when_format_is_empty() {
		// Create a page and store a custom SEO title in its meta.
		$page_id = self::factory()->post->create( array( 'post_type' => 'page' ) );
		update_post_meta( $page_id, Jetpack_SEO_Posts::HTML_TITLE_META_KEY, 'My Custom Front Page SEO Title' );

		// Configure WordPress to use this page as the static front page.
		update_option( 'show_on_front', 'page' );
		update_option( 'page_on_front', $page_id );

		// Ensure the site-wide Front Page title format is empty (the bug scenario).
		update_option(
			Jetpack_SEO_Titles::TITLE_FORMATS_OPTION,
			array(
				'front_page' => array(),
				'posts'      => array(),
				'pages'      => array(),
				'groups'     => array(),
				'archives'   => array(),
			)
		);

		// Navigate to the front page so WordPress conditional tags work correctly.
		$this->go_to( home_url( '/' ) );

		$title = Jetpack_SEO_Titles::get_custom_title( 'Default Title' );

		$this->assertSame( 'My Custom Front Page SEO Title', $title );

		// Clean up.
		update_option( 'show_on_front', 'posts' );
		delete_option( 'page_on_front' );
		delete_option( Jetpack_SEO_Titles::TITLE_FORMATS_OPTION );
	}

	/**
	 * When the front page lists the latest posts, there is no page carrying a per-page
	 * SEO title. get_custom_title() must not fall back to the meta of the first post in
	 * the loop, which would let the newest post's SEO title hijack the homepage title.
	 *
	 * Regression test for: newest post's custom SEO title overriding the homepage title
	 * on latest-posts sites.
	 */
	public function test_front_page_ignores_post_meta_when_showing_latest_posts() {
		// Create a post with a custom SEO title. It will be the first post in the loop.
		$post_id = self::factory()->post->create();
		update_post_meta( $post_id, Jetpack_SEO_Posts::HTML_TITLE_META_KEY, 'Newest Post SEO Title' );

		// The site lists the latest posts on the front page.
		update_option( 'show_on_front', 'posts' );

		// The site-wide Front Page title format is empty, so the default title should win.
		update_option(
			Jetpack_SEO_Titles::TITLE_FORMATS_OPTION,
			array(
				'front_page' => array(),
				'posts'      => array(),
				'pages'      => array(),
				'groups'     => array(),
				'archives'   => array(),
			)
		);

		// Navigate to the front page so WordPress conditional tags work correctly.
		$this->go_to( home_url( '/' ) );

		$title = Jetpack_SEO_Titles::get_custom_title( 'Default Title' );

		$this->assertSame( 'Default Title', $title );

		// Clean up.
		delete_option( Jetpack_SEO_Titles::TITLE_FORMATS_OPTION );
	}

	/**
	 * On a latest-posts homepage the site-wide Front Page title format should still be
	 * applied. This proves the front page falls through to the format lookup rather than
	 * returning early, which asserting on the default title alone cannot show.
	 */
	public function test_front_page_uses_configured_format_when_showing_latest_posts() {
		// Create a post with a custom SEO title. It will be the first post in the loop.
		$post_id = self::factory()->post->create();
		update_post_meta( $post_id, Jetpack_SEO_Posts::HTML_TITLE_META_KEY, 'Newest Post SEO Title' );

		// The site lists the latest posts on the front page.
		update_option( 'show_on_front', 'posts' );

		// A site-wide Front Page title format is configured.
		update_option(
			Jetpack_SEO_Titles::TITLE_FORMATS_OPTION,
			array(
				'front_page' => array(
					array(
						'type'  => 'string',
						'value' => 'Site Home Page',
					),
				),
			)
		);

		// Navigate to the front page so WordPress conditional tags work correctly.
		$this->go_to( home_url( '/' ) );

		$title = Jetpack_SEO_Titles::get_custom_title( 'Default Title' );

		$this->assertSame( 'Site Home Page', $title );

		// Clean up.
		delete_option( Jetpack_SEO_Titles::TITLE_FORMATS_OPTION );
	}

	/**
	 * Test for expected output after sanitizing the custom SEO page title structures.
	 */
	public function test_sanitize_title_formats() {
		$mock_inputs = array(
			'page_type' => array(
				array(
					'type'                     => 'string',
					'value'                    => 'test <script>alert(123)</script> test',
					'expected_sanitized_value' => 'test test',
					'test_message'             => 'Script tags should be stripped including inner contents.',
				),
				array(
					'type'                     => 'string',
					'value'                    => 'test <h1>title</h1> test',
					'expected_sanitized_value' => 'test title test',
					'test_message'             => 'Non-script tags should be stripped, with inner contents preseved.',
				),
				array(
					'type'                     => 'string',
					'value'                    => 'Welcome to [site_name] | [tagline]',
					'expected_sanitized_value' => 'Welcome to [site_name] | [tagline]',
					'test_message'             => 'Spacing between arbitrary strings and known tokens should be preserved.',
				),
				array(
					'type'                     => 'string',
					'value'                    => '     test     test     ',
					'expected_sanitized_value' => ' test test ',
					'test_message'             => 'Extraneous spacing should be removed.',
				),
				array(
					'type'                     => 'string',
					'value'                    => '< hello, world > & Welcome 🙂',
					'expected_sanitized_value' => '< hello, world > & Welcome 🙂',
					'test_message'             => 'Reserved characters should be preserved as-is.',
				),
			),
		);

		$sanitized_title_formats = Jetpack_SEO_Titles::sanitize_title_formats( $mock_inputs );

		foreach ( $sanitized_title_formats as $format_array ) {
			foreach ( $format_array as $item ) {
				$this->assertSame( $item['value'], $item['expected_sanitized_value'], $item['test_message'] );
			}
		}
	}
}
