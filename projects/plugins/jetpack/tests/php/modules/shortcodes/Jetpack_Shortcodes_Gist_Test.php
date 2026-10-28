<?php
/**
 * Tests for the gist shortcode.
 *
 * @package automattic/jetpack
 */

use PHPUnit\Framework\Attributes\CoversFunction;
use PHPUnit\Framework\Attributes\DataProvider;

// cache HTTP requests.
require_once __DIR__ . '/trait.http-request-cache.php';

/**
 * Gist shortcode tests.
 *
 * @covers ::github_gist_embed_handler
 * @covers ::github_gist_shortcode
 */
#[CoversFunction( 'github_gist_embed_handler' )]
#[CoversFunction( 'github_gist_shortcode' )]
class Jetpack_Shortcodes_Gist_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;
	use Automattic\Jetpack\Tests\HttpRequestCacheTrait;

	/**
	 * After a test method runs, reset any state in WordPress the test method might have changed.
	 */
	public function tear_down() {
		wp_reset_postdata();
		parent::tear_down();
	}

	/**
	 * Verify that the shortcode exists.
	 *
	 * @since 6.6.0
	 */
	public function test_shortcodes_gist_exists() {
		$this->assertTrue( shortcode_exists( 'gist' ) );
	}

	/**
	 * Verify that calling apply_shortcodes with the shortcode doesn't return the same content.
	 *
	 * @since 6.6.0
	 */
	public function test_shortcodes_gist() {
		$content = '[gist]';

		$shortcode_content = apply_shortcodes( $content );

		$this->assertNotEquals( $content, $shortcode_content );
	}

	/**
	 * Feeds get a plain link to the gist, whether it was embedded by URL or by shortcode.
	 */
	public function test_gist_in_feed_is_a_link() {
		global $post;

		$url  = 'https://gist.github.com/jeherve/57cc50246aab776e110060926a2face2#file-wp-config-php';
		$link = '<a href="https://gist.github.com/57cc50246aab776e110060926a2face2#file-wp-config-php">https://gist.github.com/57cc50246aab776e110060926a2face2#file-wp-config-php</a>';

		$requests      = 0;
		$http_response = function ( $preempt ) use ( &$requests ) {
			++$requests;
			return $preempt;
		};
		add_filter( 'pre_http_request', $http_response );

		$this->go_to( get_feed_link() );
		$this->assertTrue( is_feed() );

		$outputs = array( apply_shortcodes( sprintf( '[gist %s]', $url ) ) );
		foreach ( array( $url, sprintf( '[gist %s]', $url ) ) as $embed ) {
			$post = self::factory()->post->create_and_get( array( 'post_content' => "Before.\n\n$embed\n\nAfter." ) );
			setup_postdata( $post );
			$outputs[] = apply_filters( 'the_content', $post->post_content );
		}
		remove_filter( 'pre_http_request', $http_response );

		$this->assertSame( $link, $outputs[0] );
		$this->assertSame( $link, apply_shortcodes( '[gist 57cc50246aab776e110060926a2face2 file="WP_Config.php"]' ) );
		$this->assertStringContainsString( "\n$link\n", $outputs[1] );
		$this->assertSame( trim( $outputs[2] ), trim( $outputs[1] ) );
		$this->assertSame( 0, $requests );
	}

	/**
	 * Preserve multiline gist markup when embedding a URL through content filters.
	 */
	public function test_gist_url_preserves_shortcode_markup_through_content_filters() {
		global $post, $wp_embed;

		$url      = 'https://gist.github.com/6cad326836d38bd3a7ae';
		$template = <<<'HTML'
<template class="gist-warning-template">
  <div class="gist-warning">Warning: hidden characters.</div>
</template>
HTML;
		$footer   = <<<'HTML'
<div class="gist-meta">
  <a href="https://gist.github.com/octocat/6cad326836d38bd3a7ae/raw/example.php">view raw</a>
  example.php
  hosted with GitHub
</div>
HTML;
		$code     = '    echo &quot;Hello, gist!&quot;;';
		$html     = <<<HTML
<div id="gist123" class="gist">
  <div class="gist-file">
    <div class="gist-data">
$template
      <table><tbody>
        <tr><td class="blob-code">&lt;?php</td></tr>
        <tr><td class="blob-code">$code</td></tr>
      </tbody></table>
    </div>
$footer
  </div>
</div>
HTML;

		$http_response = function ( $preempt, $args, $request_url ) use ( $url, $html ) {
			if ( $url . '.json' !== $request_url ) {
				return $preempt;
			}

			return array(
				'response' => array( 'code' => 200 ),
				'body'     => wp_json_encode(
					array(
						'div'        => $html,
						'stylesheet' => 'https://github.githubassets.com/assets/gist-embed.css',
					),
					JSON_UNESCAPED_SLASHES
				),
			);
		};
		add_filter( 'pre_http_request', $http_response, 10, 3 );
		add_shortcode(
			'jetpack_gist_test_autoembed',
			function ( $atts, $content ) use ( $wp_embed ) {
				return $wp_embed->autoembed( $content );
			}
		);

		$embeds  = array(
			$url,
			sprintf( '[gist %s]', $url ),
			sprintf( '[jetpack_gist_test_autoembed]%s[/jetpack_gist_test_autoembed]', $url ),
		);
		$outputs = array();
		try {
			foreach ( $embeds as $embed ) {
				$content = "Before.\n\n$embed\n\nAfter.";
				$post    = self::factory()->post->create_and_get( array( 'post_content' => $content ) );
				setup_postdata( $post );
				$outputs[] = apply_filters( 'the_content', $post->post_content );
			}
		} finally {
			remove_filter( 'pre_http_request', $http_response, 10 );
			remove_shortcode( 'jetpack_gist_test_autoembed' );
		}

		foreach ( $outputs as $output ) {
			$this->assertStringContainsString( $code, $output );
		}
		$this->assertSame( trim( $outputs[1] ), trim( $outputs[0] ) );
		$this->assertSame( trim( $outputs[1] ), trim( $outputs[2] ) );
		foreach ( $outputs as $output ) {
			$this->assertStringContainsString( $template, $output );
			$this->assertStringContainsString( $footer, $output );
			$this->assertStringContainsString( '<p>Before.</p>', $output );
			$this->assertStringContainsString( '<p>After.</p>', $output );
		}
	}

	/**
	 * Test gist embeds (links in content transformed into embeds).
	 *
	 * @dataProvider gist_embed_data
	 *
	 * @since 10.4.0
	 *
	 * @param string $content      Content added to post editor.
	 * @param string $expected     Expected returned output.
	 * @param string $expected_amp Expected returned output for AMP.
	 */
	#[DataProvider( 'gist_embed_data' )]
	public function test_gist_embeds( $content, $expected, $expected_amp ) {
		global $post;

		$post = self::factory()->post->create_and_get( array( 'post_content' => $content ) );
		setup_postdata( $post );

		// Test HTML version.
		ob_start();
		the_content();
		$actual = ob_get_clean();
		$this->assertStringContainsString( $expected, $actual );

		// Test AMP version.
		add_filter( 'jetpack_is_amp_request', '__return_true' );
		ob_start();
		the_content();
		$actual = ob_get_clean();
		$this->assertEquals(
			trim( $expected_amp ),
			trim( $actual )
		);
	}

	/**
	 * Test data for the gist embeds
	 *
	 * @since 10.4.0
	 */
	public static function gist_embed_data() {
		$public_id                  = '57cc50246aab776e110060926a2face2';
		$expected_html_markup       = '<div style="tab-size: 8" id="gist';
		$expected_public_amp_markup = sprintf(
			'<amp-gist layout="fixed-height" data-gistid="%s" height="240"></amp-gist>',
			basename( $public_id )
		);

		return array(
			'oembed'          => array(
				sprintf( 'https://gist.github.com/%s/', $public_id ),
				$expected_html_markup,
				$expected_public_amp_markup,
			),
			'file to embed'   => array(
				sprintf( 'https://gist.github.com/jeherve/%s#file-wp-config-php', $public_id ),
				$expected_html_markup,
				sprintf(
					'<amp-gist layout="fixed-height" data-gistid="%1$s" height="240" data-file="wp-config.php"></amp-gist>',
					basename( $public_id )
				),
			),
			'custom tab size' => array(
				sprintf( 'https://gist.github.com/%s/?ts=4', $public_id ),
				'<div style="tab-size: 4" id="gist',
				$expected_public_amp_markup,
			),
		);
	}

	/**
	 * Test the different potential ways to embed a gist.
	 *
	 * @dataProvider gist_shortcode_data
	 *
	 * @since 10.4.0
	 *
	 * @param string $content      Content added to post editor.
	 * @param string $expected     Expected returned output.
	 * @param string $expected_amp Expected returned output for AMP.
	 */
	#[DataProvider( 'gist_shortcode_data' )]
	public function test_gist_shortcode( $content, $expected, $expected_amp = null ) {
		/*
		 * If we did not specify an expected AMP output,
		 * that means we expect it to be similar to the expected HTML output.
		 */
		if ( $expected_amp === null ) {
			$expected_amp = $expected;
		}

		// Test HTML version.
		$shortcode_content = apply_shortcodes( $content );
		$this->assertStringContainsString( $expected, $shortcode_content );

		// Test AMP version.
		add_filter( 'jetpack_is_amp_request', '__return_true' );
		$shortcode_content = apply_shortcodes( $content );
		$this->assertEquals( $expected_amp, $shortcode_content );
	}

	/**
	 * Test data for shortcode tests.
	 *
	 * @since 10.4.0
	 */
	public static function gist_shortcode_data() {
		$public_id                   = '57cc50246aab776e110060926a2face2';
		$private_id                  = 'fc5891af153e2cf365c9';
		$public_w_username           = 'jeherve/' . $public_id;
		$private_w_username          = 'xknown/' . $private_id;
		$file_name_slug              = '#file-wp-config-php';
		$file_name                   = 'wp-config.php';
		$expected_html_markup        = '<div style="tab-size: 8" id="gist';
		$expected_public_amp_markup  = sprintf(
			'<amp-gist layout="fixed-height" data-gistid="%s" height="240"></amp-gist>',
			basename( $public_id )
		);
		$expected_private_amp_markup = sprintf(
			'<amp-gist layout="fixed-height" data-gistid="%s" height="240"></amp-gist>',
			basename( $private_id )
		);

		return array(
			'empty gist'                                   => array(
				'[gist]',
				'<!-- Missing Gist ID -->',
			),
			'invalid id'                                   => array(
				'[gist !^#*@$]',
				'<!-- Invalid Gist ID -->',
			),
			'public id'                                    => array(
				sprintf( '[gist]%s[/gist]', $public_id ),
				$expected_html_markup,
				$expected_public_amp_markup,
			),
			'public id as attribute'                       => array(
				sprintf( '[gist %s]', $public_id ),
				$expected_html_markup,
				$expected_public_amp_markup,
			),
			'private id'                                   => array(
				sprintf( '[gist]%s[/gist]', $private_id ),
				$expected_html_markup,
				$expected_private_amp_markup,
			),
			'private id as attribute'                      => array(
				sprintf( '[gist %s]', $private_id ),
				$expected_html_markup,
				$expected_private_amp_markup,
			),
			'public id with username'                      => array(
				sprintf( '[gist %s]', $public_w_username ),
				$expected_html_markup,
				$expected_public_amp_markup,
			),
			'private id with username'                     => array(
				sprintf( '[gist %s]', $private_w_username ),
				$expected_html_markup,
				$expected_private_amp_markup,
			),
			'no username, direct file'                     => array(
				sprintf( '[gist https://gist.github.com/%1$s%2$s]', $public_id, $file_name_slug ),
				$expected_html_markup,
				sprintf(
					'<amp-gist layout="fixed-height" data-gistid="%1$s" height="240" data-file="%2$s"></amp-gist>',
					$public_id,
					$file_name
				),
			),
			'username, direct file'                        => array(
				sprintf( '[gist https://gist.github.com/%1$s%2$s]', $public_w_username, $file_name_slug ),
				$expected_html_markup,
				sprintf(
					'<amp-gist layout="fixed-height" data-gistid="%1$s" height="240" data-file="%2$s"></amp-gist>',
					basename( $public_id ),
					$file_name
				),
			),
			'invalid raw'                                  => array(
				sprintf( '[gist %s/raw?]', $private_w_username ),
				'<!-- Invalid Gist ID -->',
			),
			'non-gist URL'                                 => array(
				'[gist http://wordpress.com/]',
				'<!-- Invalid Gist ID -->',
			),
			'public id in full URL as attribute'           => array(
				sprintf( '[gist https://gist.github.com/%s/]', $public_id ),
				$expected_html_markup,
				$expected_public_amp_markup,
			),
			'public id in full URL in shortcode content'   => array(
				sprintf( '[gist]https://gist.github.com/%s/[/gist]', $public_id ),
				$expected_html_markup,
				$expected_public_amp_markup,
			),
			'private id in full URL as attribute'          => array(
				sprintf( '[gist https://gist.github.com/%s/]', $private_w_username ),
				$expected_html_markup,
				$expected_private_amp_markup,
			),
			'private id in full URL in shortcode content'  => array(
				sprintf( '[gist]https://gist.github.com/%s/[/gist]', $private_w_username ),
				$expected_html_markup,
				$expected_private_amp_markup,
			),
			'custom tab size in full URL as attribute'     => array(
				sprintf( '[gist https://gist.github.com/%s/?ts=4]', $public_id ),
				'<div style="tab-size: 4" id="gist',
				$expected_public_amp_markup,
			),
			'custom tab size in full URL in shortcode content' => array(
				sprintf( '[gist]https://gist.github.com/%s/?ts=4[/gist]', $public_id ),
				'<div style="tab-size: 4" id="gist',
				$expected_public_amp_markup,
			),
			'tab attribute override on full url attribute' => array(
				sprintf( '[gist https://gist.github.com/%s/?ts=2 ts=4]', $public_id ),
				'<div style="tab-size: 4" id="gist',
				$expected_public_amp_markup,
			),
			'tab attribute and id attribute'               => array(
				sprintf( '[gist %s ts=4]', $public_id ),
				'<div style="tab-size: 4" id="gist',
				$expected_public_amp_markup,
			),
			'invalid path structure'                       => array(
				'[gist https://gist.github.com/invalid/path/structure]',
				'<!-- Invalid Gist ID -->',
			),
			'invalid gist id format'                       => array(
				'[gist https://gist.github.com/username/not-a-valid-gist-id]',
				'<!-- Invalid Gist ID -->',
			),
			'invalid username format'                      => array(
				'[gist https://gist.github.com/invalid-username!/gistid]',
				'<!-- Invalid Gist ID -->',
			),
			'invalid path with extra segments'             => array(
				'[gist https://gist.github.com/username/gistid/extra/segments]',
				'<!-- Invalid Gist ID -->',
			),
			'invalid path with special chars'              => array(
				'[gist https://gist.github.com/user@name/gistid]',
				'<!-- Invalid Gist ID -->',
			),
		);
	}
}
