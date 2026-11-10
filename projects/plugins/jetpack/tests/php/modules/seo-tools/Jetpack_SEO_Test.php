<?php
/**
 * Class Jetpack_SEO_Test.
 *
 * @package automattic/jetpack
 */

use PHPUnit\Framework\Attributes\DataProvider;

require_once JETPACK__PLUGIN_DIR . 'modules/seo-tools/class-jetpack-seo-posts.php';
require_once JETPACK__PLUGIN_DIR . 'modules/seo-tools/class-jetpack-seo-titles.php';
require_once JETPACK__PLUGIN_DIR . 'modules/seo-tools/class-jetpack-seo-utils.php';
require_once JETPACK__PLUGIN_DIR . 'modules/seo-tools/class-jetpack-seo.php';

/**
 * Tests that Jetpack_SEO applies per-post SEO settings only on singular views.
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
		delete_option( 'page_for_posts' );
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

	/**
	 * The posts page shows its own description, or the homepage's when it has none to show.
	 *
	 * @dataProvider provide_posts_page_descriptions
	 *
	 * @param array  $page_args            Post fields for the posts page.
	 * @param string $seo_description      SEO description saved on the posts page.
	 * @param string $expected_description The posts page's description in its tags, or empty for none.
	 * @param string $expected_title       The og:title set for the posts page, or empty for none.
	 */
	#[DataProvider( 'provide_posts_page_descriptions' )]
	public function test_posts_page_description( $page_args, $seo_description, $expected_description, $expected_title ) {
		$this->go_to_posts_page( $page_args, $seo_description );

		ob_start();
		$this->seo->meta_tags();
		$output = ob_get_clean();
		$tags   = $this->seo->set_custom_og_tags( array() );

		$this->assertStringContainsString( '<meta name="description" content="' . ( $expected_description ? $expected_description : 'Front page description.' ) . '" />', $output );
		$this->assertSame( $expected_description, $tags['og:description'] ?? '' );
		$this->assertSame( $expected_title, $tags['og:title'] ?? '' );
	}

	/**
	 * Data provider for test_posts_page_description.
	 *
	 * @return array
	 */
	public static function provide_posts_page_descriptions() {
		$excerpt = array( 'post_excerpt' => 'Blog excerpt.' );

		return array(
			'SEO description wins over excerpt' => array( $excerpt, 'Blog SEO description.', 'Blog SEO description.', 'Our Blog' ),
			'excerpt when no SEO description'   => array( $excerpt, '', 'Blog excerpt.', 'Our Blog' ),
			'neither set'                       => array( array( 'post_excerpt' => '' ), '', '', 'Our Blog' ),
			'password-protected'                => array( $excerpt + array( 'post_password' => 'secret' ), 'Blog SEO description.', '', 'Our Blog' ),
			'private page'                      => array( $excerpt + array( 'post_status' => 'private' ), 'Blog SEO description.', '', '' ),
		);
	}

	/**
	 * A site that hands SEO to another plugin keeps its Open Graph tags on the posts page.
	 */
	public function test_posts_page_og_tags_unchanged_when_seo_tools_disabled() {
		$this->go_to_posts_page( array( 'post_excerpt' => 'Blog excerpt.' ), '' );

		add_filter( 'jetpack_disable_seo_tools', '__return_true' );

		$this->assertSame( array(), $this->seo->set_custom_og_tags( array() ) );
	}

	/**
	 * Creates a posts page on a site with a static front page, and views it.
	 *
	 * @param array  $page_args       Post fields for the posts page.
	 * @param string $seo_description SEO description saved on the posts page.
	 */
	private function go_to_posts_page( $page_args, $seo_description ) {
		$front_page_id = self::factory()->post->create( array( 'post_type' => 'page' ) );
		$posts_page_id = self::factory()->post->create(
			$page_args + array(
				'post_type'  => 'page',
				'post_title' => 'Our Blog',
			)
		);
		update_post_meta( $posts_page_id, Jetpack_SEO_Posts::DESCRIPTION_META_KEY, $seo_description );

		update_option( 'show_on_front', 'page' );
		update_option( 'page_on_front', $front_page_id );
		update_option( 'page_for_posts', $posts_page_id );
		update_option( Jetpack_SEO_Utils::FRONT_PAGE_META_OPTION, 'Front page description.' );

		$this->go_to( get_permalink( $posts_page_id ) );
	}

	/**
	 * A post's noindex setting applies to that post's own page, not to archives listing it.
	 *
	 * @dataProvider provide_noindex_views
	 *
	 * @param string $view           Which page to load: 'single', 'home', 'category', or 'front'.
	 * @param bool   $expect_noindex Whether the page should get a robots noindex tag.
	 */
	#[DataProvider( 'provide_noindex_views' )]
	public function test_noindex_only_applies_to_the_post_being_viewed( $view, $expect_noindex ) {
		$cat_id  = self::factory()->category->create();
		$post_id = self::factory()->post->create( array( 'post_category' => array( $cat_id ) ) );
		update_post_meta( $post_id, Jetpack_SEO_Posts::NOINDEX_META_KEY, true );

		if ( 'front' === $view ) {
			$page_id = self::factory()->post->create( array( 'post_type' => 'page' ) );
			update_post_meta( $page_id, Jetpack_SEO_Posts::NOINDEX_META_KEY, true );
			update_option( 'show_on_front', 'page' );
			update_option( 'page_on_front', $page_id );
		}

		$urls = array(
			'single'   => get_permalink( $post_id ),
			'home'     => home_url( '/' ),
			'category' => get_category_link( $cat_id ),
			'front'    => home_url( '/' ),
		);
		$this->go_to( $urls[ $view ] );

		ob_start();
		$this->seo->meta_tags();
		$output = ob_get_clean();

		$this->assertSame( $expect_noindex, str_contains( $output, '<meta name="robots" content="noindex" />' ), $output );
	}

	/**
	 * Data provider for test_noindex_only_applies_to_the_post_being_viewed.
	 *
	 * @return array
	 */
	public static function provide_noindex_views() {
		return array(
			'single post'           => array( 'single', true ),
			'static front page'     => array( 'front', true ),
			'latest-posts homepage' => array( 'home', false ),
			'category archive'      => array( 'category', false ),
		);
	}
}
