<?php

require_once __DIR__ . '/trait.http-request-cache.php';

class WP_Test_Jetpack_Shortcodes_Sitemap extends WP_UnitTestCase {
	use Automattic\Jetpack\Tests\HttpRequestCacheTrait;

	/**
	 * Verify that [sitemap] exists.
	 *
	 * @since  4.5.0
	 */
	public function test_shortcodes_sitemap_exists() {
		$this->assertEquals( shortcode_exists( 'sitemap' ), true );
	}

	/**
	 * Verify that calling do_shortcode with the shortcode doesn't return the same content and that its output is '' because we have no pages.
	 *
	 * @since 4.5.0
	 */
	public function test_shortcodes_sitemap() {
		$content = '[sitemap]';

		$shortcode_content = do_shortcode( $content );

		$this->assertNotEquals( $content, $shortcode_content );
		$this->assertSame( '', $shortcode_content );
	}

	/**
	 * Verify that rendering the shortcode returns tree of pages since we now have pages.
	 *
	 * @since 4.5.0
	 */
	public function test_shortcodes_sitemap_image() {
		$content = '[sitemap]';

		$page_1_id = self::factory()->post->create(
			array(
				'post_type'    => 'page',
				'post_title'   => 'Jetpack Parent',
				'post_content' => 'This is a parent page',
			)
		);

		$page_1_1_id = self::factory()->post->create(
			array(
				'post_type'    => 'page',
				'post_title'   => 'Jetpack Child',
				'post_content' => 'This is another page, whose parent is ' . $page_1_id,
				'post_parent'  => $page_1_id,
			)
		);

		$shortcode_content = do_shortcode( $content );

		$this->assertStringContainsString( '<ul class="jetpack-sitemap-shortcode"><li class="pagenav">', $shortcode_content );
		$this->assertStringContainsString( '<ul><li class="page_item page-item-' . $page_1_id . ' page_item_has_children"><a href="http://example.org/?page_id=' . $page_1_id . '">Jetpack Parent</a>', $shortcode_content );
		$this->assertStringContainsString( "<ul class='children'>", $shortcode_content );
		$this->assertStringContainsString( '<li class="page_item page-item-' . $page_1_1_id . '"><a href="http://example.org/?page_id=' . $page_1_1_id . '">Jetpack Child</a></li>', $shortcode_content );
	}
}
