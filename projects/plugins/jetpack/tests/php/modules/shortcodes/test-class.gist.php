<?php
/**
 * Tests for the gist shortcode.
 *
 * @package automattic/jetpack
 */

require_once __DIR__ . '/trait.http-request-cache.php';

/**
 * Gist shortcode tests.
 */
class WP_Test_Jetpack_Shortcodes_Gist extends WP_UnitTestCase {
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
	 * @covers ::github_gist_shortcode
	 *
	 * @since 6.6.0
	 */
	public function test_shortcodes_gist_exists() {
		$this->assertEquals( shortcode_exists( 'gist' ), true );
	}

	/**
	 * Verify that calling do_shortcode with the shortcode doesn't return the same content.
	 *
	 * @covers ::github_gist_shortcode
	 *
	 * @since 6.6.0
	 */
	public function test_shortcodes_gist() {
		$content = '[gist]';

		$shortcode_content = do_shortcode( $content );

		$this->assertNotEquals( $content, $shortcode_content );
	}

	/**
	 * Verify that content with a full Gist URL on its own line gets replaced by the embed.
	 *
	 * @covers ::github_gist_shortcode
	 *
	 * @since 6.6.0
	 */
	public function test_shortcodes_gist_oembed_to_embed() {
		global $post;

		$gist_id = '57cc50246aab776e110060926a2face2';
		$url     = 'https://gist.github.com/' . $gist_id;
		$post    = $this->factory()->post->create_and_get( array( 'post_content' => $url ) );

		do_action( 'init' );
		setup_postdata( $post );

		// Test HTML version.
		ob_start();
		the_content();
		$actual = ob_get_clean();
		$this->assertStringContainsString( '<div style="tab-size: 8" id="gist', $actual );

		// Test AMP version.
		add_filter( 'jetpack_is_amp_request', '__return_true' );
		ob_start();
		the_content();
		$actual = ob_get_clean();
		$this->assertEquals(
			wpautop( sprintf( '<amp-gist layout="fixed-height" data-gistid="%s" height="240"></amp-gist>', basename( $gist_id ) ) ),
			$actual
		);
	}

	/**
	 * Verify that content with a Gist URL pointing to a specific file gets replaced by the embed to that file.
	 *
	 * @covers ::github_gist_shortcode
	 *
	 * @since 6.6.0
	 */
	public function test_shortcodes_gist_file_to_embed() {
		global $post;

		$gist_id = 'jeherve/57cc50246aab776e110060926a2face2';
		$file    = 'wp-config-php';
		$url     = 'https://gist.github.com/' . $gist_id . '#file-' . $file;
		$post    = $this->factory()->post->create_and_get( array( 'post_content' => $url ) );

		do_action( 'init' );
		setup_postdata( $post );

		// Test HTML version.
		ob_start();
		the_content();
		$actual = ob_get_clean();
		$this->assertStringContainsString( '<div style="tab-size: 8" id="gist', $actual );

		// Test AMP version.
		add_filter( 'jetpack_is_amp_request', '__return_true' );
		ob_start();
		the_content();
		$actual = ob_get_clean();
		$this->assertEquals(
			wpautop( sprintf( '<amp-gist layout="fixed-height" data-gistid="%s" height="240" data-file="wp-config.php"></amp-gist>', basename( $gist_id ) ) ),
			$actual
		);
	}

	/**
	 * Verify that content with a full Gist URL on its own line preserves tab spacing.
	 *
	 * @covers ::github_gist_shortcode
	 *
	 * @since 7.9.0
	 */
	public function test_shortcodes_gist_oembed_with_tab_size() {
		global $post;

		$gist_id = '57cc50246aab776e110060926a2face2';
		$url     = 'https://gist.github.com/' . $gist_id . '/?ts=4';
		$post    = $this->factory()->post->create_and_get( array( 'post_content' => $url ) );

		do_action( 'init' );
		setup_postdata( $post );

		// Test HTML version.
		ob_start();
		the_content();
		$actual = ob_get_clean();
		$this->assertStringContainsString( '<div style="tab-size: 4" id="gist', $actual );

		// Test AMP version *lacks* tab size.
		add_filter( 'jetpack_is_amp_request', '__return_true' );
		ob_start();
		the_content();
		$actual = ob_get_clean();
		$this->assertEquals(
			wpautop( sprintf( '<amp-gist layout="fixed-height" data-gistid="%s" height="240"></amp-gist>', basename( $gist_id ) ) ),
			$actual
		);
	}

	/**
	 * Test the different potential ways to embed a gist.
	 *
	 * @covers ::github_gist_shortcode
	 *
	 * @since 10.4.0
	 *
	 * @dataProvider gist_shortcode_data
	 *
	 * @param string $content      Content added to post editor.
	 * @param string $expected     Expected returned output.
	 * @param string $expected_amp Expected returned output for AMP.
	 */
	public function test_gist_shortcode( $content, $expected, $expected_amp = null ) {
		/*
		 * If we did not specify an expected AMP output,
		 * that means we expect it to be similar to the expected HTML output.
		 */
		if ( is_null( $expected_amp ) ) {
			$expected_amp = $expected;
		}

		// Test HTML version.
		$shortcode_content = do_shortcode( $content );
		$this->assertStringContainsString( $expected, $shortcode_content );

		// Test AMP version.
		add_filter( 'jetpack_is_amp_request', '__return_true' );
		$shortcode_content = do_shortcode( $content );
		$this->assertEquals( $expected_amp, $shortcode_content );
	}

	/**
	 * Test data for shortcode tests.
	 *
	 * @since 10.4.0
	 *
	 * @covers ::github_gist_shortcode
	 */
	public function gist_shortcode_data() {
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
		);
	}
}
