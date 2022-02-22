<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Test class `Instant_Search`
 */

namespace Automattic\Jetpack\Search;

use PHPUnit\Framework\TestCase;
use ReflectionMethod;
use WP_Block_Patterns_Registry;

/**
 * Unit tests for the Instant Search - functionality to add search block.
 *
 * @package automattic/jetpack-search
 */
class Test_Instant_Search_Add_Search_Block extends TestCase {
	/**
	 * Test inject_search_widget_to_block single group
	 */
	public function test_inject_search_widget_to_block_single_group() {
		// 2022 theme.
		$footer_content                   = <<<EOT
<!-- wp:group {"align":"wide","style":{"spacing":{"padding":{"top":"4rem","bottom":"4rem"}}},"layout":{"type":"flex","justifyContent":"space-between"}} -->
<div class="wp-block-group alignwide" style="padding-top:4rem;padding-bottom:4rem">
<!-- wp:site-title {"level":0} /-->
<!-- wp:paragraph {"align":"right"} -->
<p class="has-text-align-right">Proudly powered by <a href="https://wordpress.org" rel="nofollow">WordPress</a></p>
<!-- /wp:paragraph --></div>
<!-- /wp:group -->
EOT;
		$footer_content_with_search_block = <<<EOT
<!-- wp:group {"align":"wide","style":{"spacing":{"padding":{"top":"4rem","bottom":"4rem"}}},"layout":{"type":"flex","justifyContent":"space-between"}} -->
<div class="wp-block-group alignwide" style="padding-top:4rem;padding-bottom:4rem">

<!-- wp:search {"label":"Jetpack Search","buttonText":"Search"} /-->
<!-- wp:site-title {"level":0} /-->
<!-- wp:paragraph {"align":"right"} -->
<p class="has-text-align-right">Proudly powered by <a href="https://wordpress.org" rel="nofollow">WordPress</a></p>
<!-- /wp:paragraph --></div>
<!-- /wp:group -->
EOT;
		$this->assertEquals( $footer_content_with_search_block, Instant_Search::inject_search_widget_to_block( $footer_content ) );
	}

	/**
	 * Test inject_search_widget_to_block nested group
	 */
	public function test_inject_search_widget_to_block_nested_group() {
		// 2022 footer.
		$footer_content                   = <<<EOT
<!-- wp:group {"align":"wide","style":{"spacing":{"padding":{"top":"4rem","bottom":"4rem"}}},"layout":{"type":"flex","justifyContent":"space-between"}} -->
<div class="wp-block-group alignwide" style="padding-top:4rem;padding-bottom:4rem">
<!-- wp:group -->
<div class="wp-block-group">
<!-- wp:site-title {"level":0} /-->
<!-- wp:paragraph {"align":"right"} -->
<p class="has-text-align-right">Proudly powered by <a href="https://wordpress.org" rel="nofollow">WordPress</a></p>
<!-- /wp:paragraph --></div></div>
<!-- /wp:group -->
EOT;
		$footer_content_with_search_block = <<<EOT
<!-- wp:group {"align":"wide","style":{"spacing":{"padding":{"top":"4rem","bottom":"4rem"}}},"layout":{"type":"flex","justifyContent":"space-between"}} -->
<div class="wp-block-group alignwide" style="padding-top:4rem;padding-bottom:4rem">
<!-- wp:group -->
<div class="wp-block-group">

<!-- wp:search {"label":"Jetpack Search","buttonText":"Search"} /-->
<!-- wp:site-title {"level":0} /-->
<!-- wp:paragraph {"align":"right"} -->
<p class="has-text-align-right">Proudly powered by <a href="https://wordpress.org" rel="nofollow">WordPress</a></p>
<!-- /wp:paragraph --></div></div>
<!-- /wp:group -->
EOT;
		$this->assertEquals( $footer_content_with_search_block, Instant_Search::inject_search_widget_to_block( $footer_content ) );
	}

	/**
	 * Test inject search block to bottom of first column
	 */
	public function test_inject_search_widget_to_bottom_of_first_column() {
		// alara theme.
		$footer_content                   = <<<EOT
<!-- wp:group {"align":"full","backgroundColor":"foreground","className":"site-footer","style":{"spacing":{"padding":{"left":"0px","right":"0px"}}},"layout":{"inherit":true}} -->
<div class="wp-block-group alignfull has-foreground-background-color has-background site-footer" style="padding-left:0px;padding-right:0px">

<!-- wp:group {"align":"","style":{"elements":{"link":{"color":{"text":"var:preset|color|primary"}}}},"textColor":"background","className":"site-footer-inner"} -->
<div class="wp-block-group site-footer-inner has-background-color has-text-color has-link-color">

<!-- wp:columns -->
<div class="wp-block-columns">

<!-- wp:column -->
<div class="wp-block-column">

<!-- wp:heading {"level":5,"textColor":"secondary"} -->
<h5 class="has-secondary-color has-text-color">About Us</h5>
<!-- /wp:heading -->

<!-- wp:paragraph {"fontSize":"small"} -->
<p class="has-small-font-size">We provide excellent services and products that help you provide the best for your customers.</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:column -->

<!-- wp:column -->
<div class="wp-block-column"></div>
<!-- /wp:column -->

<!-- wp:column -->
<div class="wp-block-column">

<!-- wp:heading {"level":5,"textColor":"secondary"} -->
<h5 class="has-secondary-color has-text-color">Navigation</h5>
<!-- /wp:heading -->

<!-- wp:navigation {"overlayMenu":"never","layout":{"setCascadingProperties":true,"orientation":"vertical"},"style":{"typography":{"lineHeight":"1"}},"fontSize":"smaller"} /-->

</div>
<!-- /wp:column -->

<!-- wp:column -->
<div class="wp-block-column">

<!-- wp:heading {"level":5,"textColor":"secondary"} -->
<h5 class="has-secondary-color has-text-color">Social Media</h5>
<!-- /wp:heading -->

<!-- wp:social-links {"iconBackgroundColor":"primary","iconBackgroundColorValue":"var(\u002d\u002dwp\u002d\u002dpreset\u002d\u002dcolor\u002d\u002dprimary)","style":{"spacing":{"blockGap":"0.5em"}}} -->
<ul class="wp-block-social-links has-icon-background-color">
<!-- wp:social-link {"url":"https://facebook.com","service":"facebook"} /-->
<!-- wp:social-link {"url":"https://twitter.com","service":"twitter"} /-->
<!-- wp:social-link {"url":"https://instagram.com","service":"instagram"} /-->
<!-- wp:social-link {"url":"https://youtube.com","service":"youtube"} /-->
</ul>
<!-- /wp:social-links -->

</div>
<!-- /wp:column -->

</div>
<!-- /wp:columns -->

<!-- wp:pattern {"slug":"alara/theme-info"} /-->

</div>
<!-- /wp:group -->

</div>
<!-- /wp:group -->
EOT;
		$footer_content_with_search_block = <<<EOT
<!-- wp:group {"align":"full","backgroundColor":"foreground","className":"site-footer","style":{"spacing":{"padding":{"left":"0px","right":"0px"}}},"layout":{"inherit":true}} -->
<div class="wp-block-group alignfull has-foreground-background-color has-background site-footer" style="padding-left:0px;padding-right:0px">

<!-- wp:group {"align":"","style":{"elements":{"link":{"color":{"text":"var:preset|color|primary"}}}},"textColor":"background","className":"site-footer-inner"} -->
<div class="wp-block-group site-footer-inner has-background-color has-text-color has-link-color">

<!-- wp:columns -->
<div class="wp-block-columns">

<!-- wp:column -->
<div class="wp-block-column">

<!-- wp:heading {"level":5,"textColor":"secondary"} -->
<h5 class="has-secondary-color has-text-color">About Us</h5>
<!-- /wp:heading -->

<!-- wp:paragraph {"fontSize":"small"} -->
<p class="has-small-font-size">We provide excellent services and products that help you provide the best for your customers.</p>
<!-- /wp:paragraph -->

<!-- wp:search {"label":"Jetpack Search","buttonText":"Search"} /-->
</div>
<!-- /wp:column -->

<!-- wp:column -->
<div class="wp-block-column"></div>
<!-- /wp:column -->

<!-- wp:column -->
<div class="wp-block-column">

<!-- wp:heading {"level":5,"textColor":"secondary"} -->
<h5 class="has-secondary-color has-text-color">Navigation</h5>
<!-- /wp:heading -->

<!-- wp:navigation {"overlayMenu":"never","layout":{"setCascadingProperties":true,"orientation":"vertical"},"style":{"typography":{"lineHeight":"1"}},"fontSize":"smaller"} /-->

</div>
<!-- /wp:column -->

<!-- wp:column -->
<div class="wp-block-column">

<!-- wp:heading {"level":5,"textColor":"secondary"} -->
<h5 class="has-secondary-color has-text-color">Social Media</h5>
<!-- /wp:heading -->

<!-- wp:social-links {"iconBackgroundColor":"primary","iconBackgroundColorValue":"var(\u002d\u002dwp\u002d\u002dpreset\u002d\u002dcolor\u002d\u002dprimary)","style":{"spacing":{"blockGap":"0.5em"}}} -->
<ul class="wp-block-social-links has-icon-background-color">
<!-- wp:social-link {"url":"https://facebook.com","service":"facebook"} /-->
<!-- wp:social-link {"url":"https://twitter.com","service":"twitter"} /-->
<!-- wp:social-link {"url":"https://instagram.com","service":"instagram"} /-->
<!-- wp:social-link {"url":"https://youtube.com","service":"youtube"} /-->
</ul>
<!-- /wp:social-links -->

</div>
<!-- /wp:column -->

</div>
<!-- /wp:columns -->

<!-- wp:pattern {"slug":"alara/theme-info"} /-->

</div>
<!-- /wp:group -->

</div>
<!-- /wp:group -->
EOT;
		$this->assertEquals( $footer_content_with_search_block, Instant_Search::inject_search_widget_to_block( $footer_content ) );
	}

	/**
	 * Test replace_block_patterns
	 */
	public function test_wp_pattern_block_replace() {
		$method = new ReflectionMethod( 'Automattic\Jetpack\Search\Instant_Search', 'replace_block_patterns' );
		$method->setAccessible( true );
		Instant_Search::initialize( 1 );
		WP_Block_Patterns_Registry::get_instance()->register(
			'jetpack-search/footer',
			array(
				'title'   => 'footer',
				'content' => '<!-- wp:group --><div class="wp-block-group"></div><!-- /wp:group -->',
			)
		);

		$footer_content          = '<!-- wp:group --><div><!-- wp:pattern {"slug":"jetpack-search/footer"} /--></div><!-- /wp:group -->';
		$footer_content_replaced = '<!-- wp:group --><div><!-- wp:group --><div class="wp-block-group"></div><!-- /wp:group --></div><!-- /wp:group -->';
		$this->assertEquals( $footer_content_replaced, $method->invoke( Instant_Search::instance(), $footer_content ) );
	}

	/**
	 * Test has_search_block
	 */
	public function test_has_search_block() {
		$block_content_with_search    = '<!-- wp:group --><div class="wp-block-group"><!-- wp:search --></div><!-- /wp:group -->';
		$block_content_without_search = '';
		$this->assertTrue( Instant_Search::content_has_search_block( $block_content_with_search ) );
		$this->assertNotTrue( Instant_Search::content_has_search_block( $block_content_without_search ) );
	}
}
