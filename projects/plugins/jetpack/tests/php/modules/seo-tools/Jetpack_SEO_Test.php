<?php
/**
 * Class Jetpack_SEO_Test.
 *
 * @package automattic/jetpack
 */

require_once JETPACK__PLUGIN_DIR . 'modules/seo-tools/class-jetpack-seo-posts.php';
require_once JETPACK__PLUGIN_DIR . 'modules/seo-tools/class-jetpack-seo-titles.php';
require_once JETPACK__PLUGIN_DIR . 'modules/seo-tools/class-jetpack-seo-utils.php';
require_once JETPACK__PLUGIN_DIR . 'modules/seo-tools/class-jetpack-seo.php';

/**
 * Tests for Jetpack_SEO::set_custom_og_tags() — specifically that per-post custom
 * SEO descriptions are only applied on singular views.
 */
class Jetpack_SEO_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Instance under test.
	 *
	 * @var Jetpack_SEO
	 */
	private $seo;

	/**
	 * Set up the test instance.
	 */
	public function set_up() {
		parent::set_up();
		$this->seo = new Jetpack_SEO();
	}

	/**
	 * Tear down options set during tests.
	 */
	public function tear_down() {
		update_option( 'show_on_front', 'posts' );
		delete_option( 'page_on_front' );
		delete_option( Jetpack_SEO_Utils::FRONT_PAGE_META_OPTION );
		parent::tear_down();
	}

	/**
	 * On a latest-posts homepage with the front-page meta description blank, the newest
	 * post's custom SEO description must NOT leak into og:description.
	 */
	public function test_latest_posts_homepage_does_not_use_post_custom_description() {
		update_option( 'show_on_front', 'posts' );
		delete_option( Jetpack_SEO_Utils::FRONT_PAGE_META_OPTION );

		$post_id = self::factory()->post->create();
		update_post_meta( $post_id, Jetpack_SEO_Posts::DESCRIPTION_META_KEY, 'This is the post custom SEO description.' );

		$this->go_to( home_url( '/' ) );

		$tags = $this->seo->set_custom_og_tags( array() );

		$this->assertArrayNotHasKey( 'og:description', $tags, 'og:description should not be set on a latest-posts homepage when front-page meta is blank.' );
	}

	/**
	 * On a category archive, the first post's custom SEO description must NOT be used
	 * as the page's og:description.
	 */
	public function test_category_archive_does_not_use_post_custom_description() {
		$cat_id  = self::factory()->category->create();
		$post_id = self::factory()->post->create( array( 'post_category' => array( $cat_id ) ) );
		update_post_meta( $post_id, Jetpack_SEO_Posts::DESCRIPTION_META_KEY, 'Post description on an archive.' );

		$this->go_to( get_category_link( $cat_id ) );

		$tags = $this->seo->set_custom_og_tags( array() );

		$this->assertArrayNotHasKey( 'og:description', $tags, 'og:description should not be set from a post on a category archive.' );
	}

	/**
	 * On a single post view, the post's custom SEO description IS used as og:description.
	 */
	public function test_single_post_uses_custom_description() {
		$post_id = self::factory()->post->create();
		update_post_meta( $post_id, Jetpack_SEO_Posts::DESCRIPTION_META_KEY, 'The single post description.' );

		$this->go_to( get_permalink( $post_id ) );

		$tags = $this->seo->set_custom_og_tags( array() );

		$this->assertSame( 'The single post description.', $tags['og:description'] ?? '', 'og:description should be the custom post description on a singular view.' );
	}

	/**
	 * On a static front page with a custom SEO description and no site-wide front-page
	 * meta, the page's per-post custom description is still used.
	 */
	public function test_static_front_page_uses_custom_description_when_front_page_meta_blank() {
		$page_id = self::factory()->post->create( array( 'post_type' => 'page' ) );
		update_post_meta( $page_id, Jetpack_SEO_Posts::DESCRIPTION_META_KEY, 'Static front page description.' );

		update_option( 'show_on_front', 'page' );
		update_option( 'page_on_front', $page_id );
		delete_option( Jetpack_SEO_Utils::FRONT_PAGE_META_OPTION );

		$this->go_to( home_url( '/' ) );

		$tags = $this->seo->set_custom_og_tags( array() );

		$this->assertSame( 'Static front page description.', $tags['og:description'] ?? '', 'og:description should use the static front page\'s custom description when front-page meta is blank.' );
	}
}
