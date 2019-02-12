<?php

class WP_Test_Jetpack_Shortcodes_Instagram extends WP_UnitTestCase {
	/**
	 * @covers ::jetpack_shortcode_instagram
	 */
	public function test_shortcode_instagram() {
		$instagram_url = 'https://www.instagram.com/p/BnMO9vRleEx/';
		$content       = '[instagram url="' . $instagram_url . '"]';

		$shortcode_content = do_shortcode( $content );

		$this->assertContains(
			'<blockquote class="instagram-media" data-instgrm-captioned data-instgrm-permalink="' . $instagram_url,
			$shortcode_content
		);
	}

	/**
	 * @covers ::jetpack_instagram_handler
	 */
	public function test_instagram_replace_image_url_with_embed() {
		global $post;

		$instagram_url = 'https://www.instagram.com/p/BnMO9vRleEx/';
		$post          = $this->factory->post->create_and_get( array( 'post_content' => $instagram_url ) );

		do_action( 'init' );
		setup_postdata( $post );
		ob_start();
		the_content();
		$actual = ob_get_clean();
		wp_reset_postdata();

		$this->assertContains(
			'<blockquote class="instagram-media" data-instgrm-captioned data-instgrm-permalink="' . $instagram_url,
			$actual
		);
	}

	/**
	 * @covers ::jetpack_instagram_handler
	 */
	public function test_instagram_replace_video_url_with_embed() {
		global $post;

		$instagram_url = 'https://www.instagram.com/tv/BkQjCfsBIzi/';
		$post          = $this->factory->post->create_and_get( array( 'post_content' => $instagram_url ) );

		do_action( 'init' );
		setup_postdata( $post );
		ob_start();
		the_content();
		$actual = ob_get_clean();
		wp_reset_postdata();

		$this->assertContains(
			'<blockquote class="instagram-media" data-instgrm-captioned data-instgrm-permalink="' . $instagram_url,
			$actual
		);
	}

	/**
	 * @covers ::jetpack_instagram_handler
	 */
	public function test_instagram_replace_profile_image_url_with_embed() {
		global $post;

		$instagram_url = 'https://www.instagram.com/jeherve/p/BnMO9vRleEx/';
		$post          = $this->factory->post->create_and_get( array( 'post_content' => $instagram_url ) );

		do_action( 'init' );
		setup_postdata( $post );
		ob_start();
		the_content();
		$actual = ob_get_clean();
		wp_reset_postdata();

		$this->assertContains(
			'<blockquote class="instagram-media" data-instgrm-captioned data-instgrm-permalink="' . $instagram_url,
			$actual
		);
	}

	/**
	 * @covers ::jetpack_instagram_handler
	 */
	public function test_instagram_replace_profile_video_url_with_embed() {
		global $post;

		$instagram_url = 'https://www.instagram.com/instagram/tv/BkQjCfsBIzi/';
		$post          = $this->factory->post->create_and_get( array( 'post_content' => $instagram_url ) );

		do_action( 'init' );
		setup_postdata( $post );
		ob_start();
		the_content();
		$actual = ob_get_clean();
		wp_reset_postdata();

		$this->assertContains(
			'<blockquote class="instagram-media" data-instgrm-captioned data-instgrm-permalink="' . $instagram_url,
			$actual
		);
	}
}
