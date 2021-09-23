<?php

require_once __DIR__ . '/trait.http-request-cache.php';

class WP_Test_Jetpack_Shortcodes_Gist extends WP_UnitTestCase {
	use Automattic\Jetpack\Tests\HttpRequestCacheTrait;
	use \Yoast\PHPUnitPolyfills\Polyfills\AssertStringContains;

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
	 * Verify that calling the shortcode without an argument returns the error string.
	 *
	 * @covers ::github_gist_shortcode
	 *
	 * @since 6.6.0
	 */
	public function test_shortcodes_empty_gist() {
		$content = '[gist]';

		// Test HTML version.
		$shortcode_content = do_shortcode( $content );
		$this->assertEquals( '<!-- Missing Gist ID -->', $shortcode_content );

		// Test AMP version.
		add_filter( 'jetpack_is_amp_request', '__return_true' );
		$shortcode_content = do_shortcode( $content );
		$this->assertEquals( '<!-- Missing Gist ID -->', $shortcode_content );
	}

	/**
	 * Verify that calling the shortcode with an invalid character returns the error string.
	 *
	 * @covers ::github_gist_shortcode
	 *
	 * @since 7.3.0
	 */
	public function test_shortcodes_gist_invalid_id() {
		$content = '[gist !^#*@$]';

		// Test HTML version.
		$shortcode_content = do_shortcode( $content );
		$this->assertEquals( '<!-- Invalid Gist ID -->', $shortcode_content );

		// Test AMP version.
		add_filter( 'jetpack_is_amp_request', '__return_true' );
		$shortcode_content = do_shortcode( $content );
		$this->assertEquals( '<!-- Invalid Gist ID -->', $shortcode_content );
	}

	/**
	 * Verify that a shortcode with only an ID returns the expected embed code.
	 *
	 * @covers ::github_gist_shortcode
	 *
	 * @since 6.6.0
	 */
	public function test_shortcodes_gist_public_id_in_content() {
		$gist_id = '57cc50246aab776e110060926a2face2';
		$content = '[gist]' . $gist_id . '[/gist]';

		// Test HTML version.
		$shortcode_content = do_shortcode( $content );
		$this->assertStringContainsString( '<div style="tab-size: 8" id="gist', $shortcode_content );

		// Test AMP version.
		add_filter( 'jetpack_is_amp_request', '__return_true' );
		$shortcode_content = do_shortcode( $content );
		$this->assertEquals(
			sprintf( '<amp-gist layout="fixed-height" data-gistid="%s" height="240"></amp-gist>', basename( $gist_id ) ),
			$shortcode_content
		);
	}

	/**
	 * Verify that a shortcode with only an ID returns the expected embed code.
	 *
	 * @covers ::github_gist_shortcode
	 *
	 * @since 7.3.0
	 */
	public function test_shortcodes_gist_public_id() {
		$gist_id = '57cc50246aab776e110060926a2face2';
		$content = '[gist ' . $gist_id . ']';

		// Test HTML version.
		$shortcode_content = do_shortcode( $content );
		$this->assertStringContainsString( '<div style="tab-size: 8" id="gist', $shortcode_content );

		// Test AMP version.
		add_filter( 'jetpack_is_amp_request', '__return_true' );
		$shortcode_content = do_shortcode( $content );
		$this->assertEquals(
			sprintf( '<amp-gist layout="fixed-height" data-gistid="%s" height="240"></amp-gist>', basename( $gist_id ) ),
			$shortcode_content
		);
	}

	/**
	 * Verify that a shortcode with only a private ID in the content returns the expected embed code.
	 *
	 * @covers ::github_gist_shortcode
	 *
	 * @since 7.3.0
	 */
	public function test_shortcodes_gist_private_id_in_content() {
		$gist_id = 'fc5891af153e2cf365c9';
		$content = '[gist]' . $gist_id . '[/gist]';

		// Test HTML version.
		$shortcode_content = do_shortcode( $content );
		$this->assertStringContainsString( '<div style="tab-size: 8" id="gist', $shortcode_content );

		// Test AMP version.
		add_filter( 'jetpack_is_amp_request', '__return_true' );
		$shortcode_content = do_shortcode( $content );
		$this->assertEquals(
			sprintf( '<amp-gist layout="fixed-height" data-gistid="%s" height="240"></amp-gist>', basename( $gist_id ) ),
			$shortcode_content
		);
	}

	/**
	 * Verify that a shortcode with only a private ID returns the expected embed code.
	 *
	 * @covers ::github_gist_shortcode
	 *
	 * @since 7.3.0
	 */
	public function test_shortcodes_gist_private_id() {
		$gist_id = 'fc5891af153e2cf365c9';
		$content = '[gist ' . $gist_id . ']';

		// Test HTML version.
		$shortcode_content = do_shortcode( $content );
		$this->assertStringContainsString( '<div style="tab-size: 8" id="gist', $shortcode_content );

		// Test AMP version.
		add_filter( 'jetpack_is_amp_request', '__return_true' );
		$shortcode_content = do_shortcode( $content );
		$this->assertEquals(
			sprintf( '<amp-gist layout="fixed-height" data-gistid="%s" height="240"></amp-gist>', basename( $gist_id ) ),
			$shortcode_content
		);
	}

	/**
	 * Verify that a shortcode with a username and a public embed ID returns the expected embed code.
	 *
	 * @covers ::github_gist_shortcode
	 *
	 * @since 7.3.0
	 */
	public function test_shortcodes_gist_public_id_with_username() {
		$gist_id = 'mjangda/2978185';
		$content = '[gist ' . $gist_id . ']';

		// Test HTML version.
		$shortcode_content = do_shortcode( $content );
		$this->assertStringContainsString( '<div style="tab-size: 8" id="gist', $shortcode_content );

		// Test AMP version.
		add_filter( 'jetpack_is_amp_request', '__return_true' );
		$shortcode_content = do_shortcode( $content );
		$this->assertEquals(
			sprintf( '<amp-gist layout="fixed-height" data-gistid="%s" height="240"></amp-gist>', basename( $gist_id ) ),
			$shortcode_content
		);
	}

	/**
	 * Verify that a shortcode with a username and a private embed ID returns the expected embed code.
	 *
	 * @covers ::github_gist_shortcode
	 *
	 * @since 7.3.0
	 */
	public function test_shortcodes_gist_private_id_with_username() {
		$gist_id = 'xknown/fc5891af153e2cf365c9';
		$content = '[gist ' . $gist_id . ']';

		// Test HTML version.
		$shortcode_content = do_shortcode( $content );
		$this->assertStringContainsString( '<div style="tab-size: 8" id="gist', $shortcode_content );

		// Test AMP version.
		add_filter( 'jetpack_is_amp_request', '__return_true' );
		$shortcode_content = do_shortcode( $content );
		$this->assertEquals(
			sprintf( '<amp-gist layout="fixed-height" data-gistid="%s" height="240"></amp-gist>', basename( $gist_id ) ),
			$shortcode_content
		);
	}

	/**
	 * Verify that a shortcode linking to a specific file, with no username returns the expected embed code.
	 *
	 * @covers ::github_gist_shortcode
	 *
	 * @since 7.3.0
	 */
	public function test_shortcodes_gist_no_username_direct_file() {
		$gist_id        = '57cc50246aab776e110060926a2face2';
		$file_name_slug = '#file-wp-config-php';
		$file_name      = 'wp-config.php';

		$content = '[gist https://gist.github.com/' . $gist_id . $file_name_slug . ']';

		$expected_gist_id = sprintf(
			'%1$s.json?file=%2$s',
			$gist_id,
			$file_name
		);
		// Test HTML version.
		$shortcode_content = do_shortcode( $content );
		$this->assertStringContainsString( '<div style="tab-size: 8" id="gist', $shortcode_content );

		// Test AMP version.
		add_filter( 'jetpack_is_amp_request', '__return_true' );
		$shortcode_content = do_shortcode( $content );
		$this->assertEquals(
			sprintf(
				'<amp-gist layout="fixed-height" data-gistid="%1$s" height="240" data-file="%2$s"></amp-gist>',
				$gist_id,
				$file_name
			),
			$shortcode_content
		);
	}

	/**
	 * Verify that a shortcode linking to a specific file, with a username returns the expected embed code.
	 *
	 * @covers ::github_gist_shortcode
	 *
	 * @since 7.3.0
	 */
	public function test_shortcodes_gist_username_direct_file() {
		$gist_id        = 'jeherve/57cc50246aab776e110060926a2face2';
		$file_name_slug = '#file-wp-config-php';
		$file_name      = 'wp-config.php';

		$expected_gist_id = sprintf(
			'%1$s.json?file=%2$s',
			basename( $gist_id ),
			$file_name
		);

		$content = '[gist https://gist.github.com/' . $gist_id . $file_name_slug . ']';

		// Test HTML version.
		$shortcode_content = do_shortcode( $content );
		$this->assertStringContainsString( '<div style="tab-size: 8" id="gist', $shortcode_content );

		// Test AMP version.
		add_filter( 'jetpack_is_amp_request', '__return_true' );
		$shortcode_content = do_shortcode( $content );
		$this->assertEquals(
			sprintf(
				'<amp-gist layout="fixed-height" data-gistid="%1$s" height="240" data-file="%2$s"></amp-gist>',
				basename( $gist_id ),
				$file_name
			),
			$shortcode_content
		);
	}

	/**
	 * Verify that a shortcode with an invalid ID raw gist returns the "invalid" message.
	 *
	 * @covers ::github_gist_shortcode
	 *
	 * @since 7.3.0
	 */
	public function test_shortcodes_gist_invalid_raw_gist() {
		$gist_id = 'xknown/fc5891af153e2cf365c9/raw?';
		$content = '[gist ' . $gist_id . ']';

		// Test HTML version.
		$shortcode_content = do_shortcode( $content );
		$this->assertEquals( '<!-- Invalid Gist ID -->', $shortcode_content );

		// Test AMP version.
		add_filter( 'jetpack_is_amp_request', '__return_true' );
		$shortcode_content = do_shortcode( $content );
		$this->assertEquals( '<!-- Invalid Gist ID -->', $shortcode_content );
	}

	/**
	 * Verify that a shortcode with a non-gist URL returns the "invalid" message.
	 *
	 * @covers ::github_gist_shortcode
	 *
	 * @since 7.3.0
	 */
	public function test_shortcodes_gist_invalid_url() {
		$content = '[gist http://wordpress.com/]';

		// Test HTML version.
		$shortcode_content = do_shortcode( $content );
		$this->assertEquals( '<!-- Invalid Gist ID -->', $shortcode_content );

		// Test AMP version.
		add_filter( 'jetpack_is_amp_request', '__return_true' );
		$shortcode_content = do_shortcode( $content );
		$this->assertEquals( '<!-- Invalid Gist ID -->', $shortcode_content );
	}

	/**
	 * Verify that a shortcode with a public URL returns the expected embed code.
	 *
	 * @covers ::github_gist_shortcode
	 *
	 * @since 6.6.0
	 */
	public function test_shortcodes_gist_public_full_url() {
		$gist_id = '57cc50246aab776e110060926a2face2';
		$content = '[gist https://gist.github.com/' . $gist_id . '/ ]';

		// Test HTML version.
		$shortcode_content = do_shortcode( $content );
		$this->assertStringContainsString( '<div style="tab-size: 8" id="gist', $shortcode_content );

		// Test AMP version.
		add_filter( 'jetpack_is_amp_request', '__return_true' );
		$shortcode_content = do_shortcode( $content );
		$this->assertEquals(
			sprintf( '<amp-gist layout="fixed-height" data-gistid="%s" height="240"></amp-gist>', basename( $gist_id ) ),
			$shortcode_content
		);
	}

	/**
	 * Verify that a shortcode with a public URL in content returns the expected embed code.
	 *
	 * @covers ::github_gist_shortcode
	 *
	 * @since 7.3.0
	 */
	public function test_shortcodes_gist_public_full_url_in_content() {
		$gist_id = '57cc50246aab776e110060926a2face2';
		$content = '[gist]https://gist.github.com/' . $gist_id . '[/gist]';

		// Test HTML version.
		$shortcode_content = do_shortcode( $content );
		$this->assertStringContainsString( '<div style="tab-size: 8" id="gist', $shortcode_content );

		// Test AMP version.
		add_filter( 'jetpack_is_amp_request', '__return_true' );
		$shortcode_content = do_shortcode( $content );
		$this->assertEquals(
			sprintf( '<amp-gist layout="fixed-height" data-gistid="%s" height="240"></amp-gist>', basename( $gist_id ) ),
			$shortcode_content
		);
	}

	/**
	 * Verify that a shortcode with a private URL returns the expected embed code.
	 *
	 * @covers ::github_gist_shortcode
	 *
	 * @since 7.3.0
	 */
	public function test_shortcodes_gist_private_full_url() {
		$gist_id = 'xknown/fc5891af153e2cf365c9';
		$content = '[gist https://gist.github.com/' . $gist_id . '/ ]';

		// Test HTML version.
		$shortcode_content = do_shortcode( $content );
		$this->assertStringContainsString( '<div style="tab-size: 8" id="gist', $shortcode_content );

		// Test AMP version.
		add_filter( 'jetpack_is_amp_request', '__return_true' );
		$shortcode_content = do_shortcode( $content );
		$this->assertEquals(
			sprintf( '<amp-gist layout="fixed-height" data-gistid="%s" height="240"></amp-gist>', basename( $gist_id ) ),
			$shortcode_content
		);
	}

	/**
	 * Verify that a shortcode with a private URL in content returns the expected embed code.
	 *
	 * @covers ::github_gist_shortcode
	 *
	 * @since 7.3.0
	 */
	public function test_shortcodes_gist_private_full_url_in_content() {
		$gist_id = 'xknown/fc5891af153e2cf365c9';
		$content = '[gist]https://gist.github.com/' . $gist_id . '[/gist]';

		// Test HTML version.
		$shortcode_content = do_shortcode( $content );
		$this->assertStringContainsString( '<div style="tab-size: 8" id="gist', $shortcode_content );

		// Test AMP version.
		add_filter( 'jetpack_is_amp_request', '__return_true' );
		$shortcode_content = do_shortcode( $content );
		$this->assertEquals(
			sprintf( '<amp-gist layout="fixed-height" data-gistid="%s" height="240"></amp-gist>', basename( $gist_id ) ),
			$shortcode_content
		);
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
	 * Verify that gist URLs in shortcode preserves tab spacing.
	 *
	 * @covers ::github_gist_shortcode
	 *
	 * @since 7.9.0
	 */
	public function test_shortcodes_gist_with_tab_size() {
		$gist_id = '57cc50246aab776e110060926a2face2';
		$content = '[gist https://gist.github.com/' . $gist_id . '/?ts=4]';

		// Test HTML version.
		$shortcode_content = do_shortcode( $content );
		$this->assertStringContainsString( '<div style="tab-size: 4" id="gist', $shortcode_content );

		// Test AMP version *lacks* tab size.
		add_filter( 'jetpack_is_amp_request', '__return_true' );
		$shortcode_content = do_shortcode( $content );
		$this->assertEquals(
			sprintf( '<amp-gist layout="fixed-height" data-gistid="%s" height="240"></amp-gist>', basename( $gist_id ) ),
			$shortcode_content
		);
	}

	/**
	 * Verify that gist URLs in shortcode content preserves tab spacing.
	 *
	 * @covers ::github_gist_shortcode
	 *
	 * @since 7.9.0
	 */
	public function test_shortcodes_gist_full_url_with_tab_size_in_content() {
		$gist_id = '57cc50246aab776e110060926a2face2';
		$content = '[gist]https://gist.github.com/' . $gist_id . '/?ts=4[/gist]';

		// Test HTML version.
		$shortcode_content = do_shortcode( $content );
		$this->assertStringContainsString( '<div style="tab-size: 4" id="gist', $shortcode_content );

		// Test AMP version *lacks* tab size.
		add_filter( 'jetpack_is_amp_request', '__return_true' );
		$shortcode_content = do_shortcode( $content );
		$this->assertEquals(
			sprintf( '<amp-gist layout="fixed-height" data-gistid="%s" height="240"></amp-gist>', basename( $gist_id ) ),
			$shortcode_content
		);
	}

	/**
	 * Verify that gist URLs in shortcode allows tab size as an attribute.
	 *
	 * @covers ::github_gist_shortcode
	 *
	 * @since 7.9.0
	 */
	public function test_shortcodes_gist_with_tab_size_in_attributes() {
		$gist_id = '57cc50246aab776e110060926a2face2';
		$content = '[gist https://gist.github.com/' . $gist_id . '/?ts=2 ts=4]';

		// Test HTML version.
		$shortcode_content = do_shortcode( $content );
		$this->assertStringContainsString( '<div style="tab-size: 4" id="gist', $shortcode_content );

		// Test AMP version *lacks* tab size.
		add_filter( 'jetpack_is_amp_request', '__return_true' );
		$shortcode_content = do_shortcode( $content );
		$this->assertEquals(
			sprintf( '<amp-gist layout="fixed-height" data-gistid="%s" height="240"></amp-gist>', basename( $gist_id ) ),
			$shortcode_content
		);
	}

	/**
	 * Verify that gist URLs in shortcode has their tab size overridden by attributes.
	 *
	 * @covers ::github_gist_shortcode
	 *
	 * @since 7.9.0
	 */
	public function test_shortcodes_gist_with_tab_size_in_attributes_override() {
		$gist_id = '57cc50246aab776e110060926a2face2';
		$content = '[gist ' . $gist_id . ' ts=4]';

		// Test HTML version.
		$shortcode_content = do_shortcode( $content );
		$this->assertStringContainsString( '<div style="tab-size: 4" id="gist', $shortcode_content );

		// Test AMP version *lacks* tab size.
		add_filter( 'jetpack_is_amp_request', '__return_true' );
		$shortcode_content = do_shortcode( $content );
		$this->assertEquals(
			sprintf( '<amp-gist layout="fixed-height" data-gistid="%s" height="240"></amp-gist>', basename( $gist_id ) ),
			$shortcode_content
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
}
