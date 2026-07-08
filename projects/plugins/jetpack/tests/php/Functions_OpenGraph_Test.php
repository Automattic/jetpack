<?php

use Automattic\Jetpack\Status\Cache as StatusCache;
use PHPUnit\Framework\Attributes\CoversFunction;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Group;

/**
 * Class with PHPUnit tests for Open Graph functions.
 *
 * @since 3.9.2
 * @covers ::jetpack_og_get_image
 * @covers ::jetpack_og_get_description
 * @covers ::jetpack_og_remove_query_blocks
 * @covers ::jetpack_og_get_site_fallback_blank_image
 * @covers ::jetpack_og_get_site_image
 * @covers ::jetpack_og_generate_fallback_social_image
 * @covers ::jetpack_og_get_fallback_social_image
 * @group jetpack-opengraph
 */
#[CoversFunction( 'jetpack_og_get_image' )]
#[CoversFunction( 'jetpack_og_get_description' )]
#[CoversFunction( 'jetpack_og_remove_query_blocks' )]
#[CoversFunction( 'jetpack_og_get_site_fallback_blank_image' )]
#[CoversFunction( 'jetpack_og_get_site_image' )]
#[CoversFunction( 'jetpack_og_generate_fallback_social_image' )]
#[CoversFunction( 'jetpack_og_get_fallback_social_image' )]
#[Group( 'jetpack-opengraph' )]
class Functions_OpenGraph_Test extends Jetpack_Attachment_TestCase {

	private $icon_id;

	/**
	 * Include Open Graph functions before each test.
	 *
	 * @since 3.9.2
	 */
	public function set_up() {
		parent::set_up();

		$this->icon_id = self::create_upload_object( __DIR__ . '/jetpack-icon.jpg', 0, true ); // 500 x 500
		require_once JETPACK__PLUGIN_DIR . 'functions.opengraph.php';
	}

	/**
	 * Include Open Graph functions after each test.
	 */
	public function tear_down() {
		parent::tear_down();

		// Restoring global variables.
		global $wp_the_query;
		$wp_the_query = new WP_Query();

		wp_delete_attachment( $this->icon_id );
	}

	/**
	 * @author automattic
	 * @since  3.9.2
	 */
	public function test_jetpack_og_get_image_default() {
		$image_url = jetpack_og_get_image();
		$this->assertIsArray( $image_url );
	}

	/**
	 * @author automattic
	 * @since  3.9.2
	 */
	public function test_jetpack_og_get_site_icon_and_logo_url() {
		$default_url = jetpack_og_get_image();

		// Test Jetpack's Site Logo
		update_option( 'site_logo', $this->icon_id );
		require_once JETPACK__PLUGIN_DIR . 'modules/theme-tools/site-logo/inc/functions.php';
		require_once JETPACK__PLUGIN_DIR . 'modules/theme-tools/site-logo/inc/class-site-logo.php';

		// Test Smaller/Invalid Jetpack's Site Logo
		$image_url = jetpack_og_get_image( 512, 512 );
		$this->assertNotEquals( jetpack_get_site_logo( 'url' ), $image_url['src'] );
		$this->assertEquals( $default_url['src'], $image_url['src'] );

		// Test Valid-sized Jetpack's Site Logo
		$image_url = jetpack_og_get_image( 200, 200 );
		$image_id  = jetpack_get_site_logo( 'id' );
		$logo      = wp_get_attachment_image_src( $image_id, 'full' );
		$this->assertEquals( $logo[0], $image_url['src'] );

		delete_option( 'site_logo' );
		update_option( 'site_icon', $this->icon_id );

		// Test Valid-sized core's Site Icon
		$image_url = jetpack_og_get_image( 200, 200 );
		$image_id  = get_option( 'site_icon' );
		$icon      = wp_get_attachment_image_src( $image_id, 'full' );
		$this->assertEquals( $icon[0], $image_url['src'] );

		delete_option( 'site_icon' );
	}

	/**
	 * Test Core's custom logo fallback in jetpack_og_get_image.
	 *
	 * @since 14.9
	 */
	public function test_jetpack_og_get_image_core_custom_logo() {
		$default_url = jetpack_og_get_image();

		// Set up Core's custom logo
		set_theme_mod( 'custom_logo', $this->icon_id );

		// Test valid-sized Core's custom logo
		$image_url      = jetpack_og_get_image( 200, 200 );
		$custom_logo_id = get_theme_mod( 'custom_logo' );
		$logo_details   = wp_get_attachment_image_src( $custom_logo_id, 'full' );
		$this->assertEquals( $logo_details[0], $image_url['src'] );
		$this->assertEquals( $logo_details[1], $image_url['width'] );
		$this->assertEquals( $logo_details[2], $image_url['height'] );

		// Test that alt text is included
		$this->assertArrayHasKey( 'alt_text', $image_url );

		// Test smaller/invalid Core's custom logo (should fall back to default)
		$image_url = jetpack_og_get_image( 512, 512 );
		$this->assertNotEquals( $logo_details[0], $image_url['src'] );
		$this->assertEquals( $default_url['src'], $image_url['src'] );

		// Clean up
		remove_theme_mod( 'custom_logo' );
	}

	/**
	 * Test potential descriptions given to OG description.
	 *
	 * @dataProvider jetpack_og_get_description_data_provider
	 *
	 * @param string $description Post description.
	 * @param string $cleaned_description Description cleaned up and ready to be used.
	 */
	#[DataProvider( 'jetpack_og_get_description_data_provider' )]
	public function test_jetpack_og_get_description_default( $description, $cleaned_description ) {
		// A test shortcode that should be removed from descriptions.
		add_shortcode(
			'foo',
			function () {
				return 'bar';
			}
		);

		$processed_description = jetpack_og_get_description( $description );

		$this->assertEquals(
			$cleaned_description,
			$processed_description
		);
	}

	/**
	 * Potential descriptions given to OG description.
	 */
	public static function jetpack_og_get_description_data_provider() {
		return array(
			'empty'                  => array(
				'',
				'Visit the post for more.',
			),
			'no_entities'            => array(
				"OpenGraph's test",
				'OpenGraph&#8217;s test',
			),
			'too_many_words'         => array(
				'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam consectetur quam eget finibus consectetur. Donec sollicitudin finibus massa, ut cursus elit. Mauris dictum quam eu ullamcorper feugiat. Proin id ante purus. Aliquam lorem libero, tempus id dictum non, feugiat vel eros. Sed sed viverra libero. Praesent eu lacinia felis, et tempus turpis. Proin bibendum, ligula. These last sentence should be removed.',
				'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam consectetur quam eget finibus consectetur. Donec sollicitudin finibus massa, ut cursus elit. Mauris dictum quam eu ullamcorper feugiat. Proin id ante purus. Aliquam lorem libero, tempus id dictum non, feugiat vel eros. Sed sed viverra libero. Praesent eu lacinia felis, et tempus turpis. Proin bibendum, ligula.&hellip;',
			),
			'no_tags'                => array(
				'A post description<script>alert("hello");</script>',
				'A post description',
			),
			'no_shortcodes'          => array(
				'[foo test="true"]A post description',
				'A post description',
			),
			'no_links'               => array(
				'A post description https://jetpack.com',
				'A post description',
			),
			'no_html'                => array(
				'<strong>A post description</strong>',
				'A post description',
			),
			'image_then_text'        => array(
				'<img src="https://example.org/jetpack-icon.jpg" />A post description',
				'A post description',
			),
			'linked_image_then_text' => array(
				'<a href="https://jetpack.com"><img src="https://example.org/jetpack-icon.jpg" /></a>A post description',
				'A post description',
			),
		);
	}

	/**
	 * Create a post containing a few images attached to another post.
	 *
	 * @since 9.2.0
	 *
	 * @param int $number_of_images The number of image blocks to add to the post.
	 *
	 * @return array $post_info {
	 * An array of information about our post.
	 *  @type int   $post_id  Post ID.
	 *  @type array $img_urls Image URLs we'll look to extract.
	 * }
	 */
	protected function create_post_with_image_blocks( $number_of_images = 1 ) {
		$img_dimensions = array(
			'width'  => 250,
			'height' => 250,
		);

		$post_id = self::factory()->post->create();

		$image_urls = array();
		for ( $i = 1; $i <= $number_of_images; $i++ ) {
			$attachment_id = self::factory()->attachment->create_object(
				'image' . $i . '.jpg',
				$post_id,
				array(
					'post_mime_type' => 'image/jpeg',
					'post_type'      => 'attachment',
				)
			);
			wp_update_attachment_metadata( $attachment_id, $img_dimensions );
			$image_urls[ $attachment_id ] = wp_get_attachment_url( $attachment_id );
		}

		// Create another post with those images.
		$post_html = '';
		foreach ( $image_urls as $attachment_id => $image_url ) {
			$post_html .= sprintf(
				'<!-- wp:image {"id":%2$d} --><div class="wp-block-image"><figure class="wp-block-image"><img src="%1$s" alt="" class="wp-image-%2$d"/></figure></div><!-- /wp:image -->',
				$image_url,
				$attachment_id
			);
		}

		$second_post_id = self::factory()->post->create(
			array( 'post_content' => $post_html )
		);

		return array(
			'post_id'  => $second_post_id,
			'img_urls' => array_values( $image_urls ),
		);
	}

	/**
	 * Test if jetpack_og_get_image returns the correct image for a post with image blocks.
	 *
	 * @author automattic
	 * @since  9.2.0
	 */
	public function test_jetpack_og_get_image_from_post_order() {
		// Create a post containing two image blocks.
		$post_info = $this->create_post_with_image_blocks( 2 );

		$this->go_to( get_permalink( $post_info['post_id'] ) );

		// Extract an image from the current post.
		$chosen_image = jetpack_og_get_image();

		$this->assertIsArray( $chosen_image );
		// We expect jetpack_og_get_image to return the first of the images in the post.
		$first_image_url = $post_info['img_urls'][0];
		$this->assertEquals( $first_image_url, $chosen_image['src'] );
	}

	/**
	 * Helper function to get default alt text.
	 *
	 * @return string
	 */
	public function get_default_alt_text() {
		return 'Default alt text';
	}

	/**
	 * Test if jetpack_og_get_image returns the correct default alt text.
	 *
	 * @author automattic
	 * @since 10.4
	 */
	public function test_jetpack_og_get_image_alt_text_default() {
		$this->go_to( get_permalink( $this->icon_id ) );

		$image = jetpack_og_get_image();

		$this->assertSame( '', $image['alt_text'] );
	}

	/**
	 * Test if jetpack_og_get_image returns the correct filtered alt text.
	 *
	 * @author automattic
	 * @since 10.4
	 */
	public function test_jetpack_og_get_image_alt_text_filter() {
		$this->go_to( get_permalink( $this->icon_id ) );

		add_filter( 'jetpack_open_graph_image_default_alt_text', array( $this, 'get_default_alt_text' ) );
		$image = jetpack_og_get_image();
		remove_filter( 'jetpack_open_graph_image_default_alt_text', array( $this, 'get_default_alt_text' ) );

		$this->assertEquals( $image['alt_text'], $this->get_default_alt_text() );
	}

	/**
	 * Test if jetpack_og_get_image returns the correct alt text when set.
	 *
	 * @author automattic
	 * @since 10.4
	 */
	public function test_jetpack_og_get_image_alt_text_when_set() {
		$this->go_to( get_permalink( $this->icon_id ) );

		$alt_text = 'Example Alt Text';

		update_post_meta( $this->icon_id, '_wp_attachment_image_alt', $alt_text );

		$image = jetpack_og_get_image();

		$this->assertEquals( $image['alt_text'], $alt_text );
	}

	/**
	 * Test jetpack_og_remove_query_blocks with various scenarios.
	 *
	 * @dataProvider jetpack_og_remove_query_blocks_data_provider
	 *
	 * @param string $description Input description with potential query blocks.
	 * @param string $expected_result Expected cleaned description.
	 */
	#[DataProvider( 'jetpack_og_remove_query_blocks_data_provider' )]
	public function test_jetpack_og_remove_query_blocks( $description, $expected_result ) {
		$result = jetpack_og_remove_query_blocks( $description );
		$this->assertEquals( $expected_result, $result );
	}

	/**
	 * Data provider for jetpack_og_remove_query_blocks tests.
	 */
	public static function jetpack_og_remove_query_blocks_data_provider() {
		return array(
			'basic_query_block_removal' => array(
				'Some text before. <!-- wp:query {"queryId":49} -->
<div class="wp-block-query"><!-- wp:post-template -->
<!-- wp:post-title /-->
<!-- /wp:post-template --></div>
<!-- /wp:query --> Some text after.',
				'Some text before.  Some text after.',
			),
			'nested_query_blocks'       => array(
				'Before. <!-- wp:query {"queryId":1} -->
<div class="wp-block-query">
<!-- wp:query {"queryId":2} -->
<div class="wp-block-query">Nested content</div>
<!-- /wp:query -->
</div>
<!-- /wp:query --> After.',
				'Before.  After.',
			),
			'preserves_other_blocks'    => array(
				'<!-- wp:paragraph -->
<p>This paragraph should be preserved.</p>
<!-- /wp:paragraph -->
<!-- wp:query {"queryId":1} -->
<div class="wp-block-query">This should be removed.</div>
<!-- /wp:query -->
<!-- wp:heading -->
<h2>This heading should be preserved.</h2>
<!-- /wp:heading -->',
				'<!-- wp:paragraph -->
<p>This paragraph should be preserved.</p>
<!-- /wp:paragraph -->
<!-- wp:heading -->
<h2>This heading should be preserved.</h2>
<!-- /wp:heading -->',
			),
			'void_query_blocks'         => array(
				'Before. <!-- wp:query {"queryId":1} /--> After.',
				'Before.  After.',
			),
			'no_query_blocks'           => array(
				'<!-- wp:paragraph -->
<p>This content has no query blocks.</p>
<!-- /wp:paragraph -->',
				'<!-- wp:paragraph -->
<p>This content has no query blocks.</p>
<!-- /wp:paragraph -->',
			),
			'empty_string'              => array(
				'',
				'',
			),
			'null_input'                => array(
				null,
				'',
			),
			'bool_input'                => array(
				true,
				'',
			),
			'array_input'               => array(
				array(),
				'',
			),
			'plain_text_no_blocks'      => array(
				'This is just plain text with no blocks at all.',
				'This is just plain text with no blocks at all.',
			),
		);
	}

	/**
	 * Test if jetpack_og_get_description handles query blocks correctly.
	 *
	 * @author automattic
	 * @since 14.9
	 */
	public function test_jetpack_og_get_description_with_query_blocks() {
		$description_with_query = 'Some text before. <!-- wp:query {"queryId":1} --><div>Query content</div><!-- /wp:query --> Some text after.';

		// The function should remove the query block and then process the remaining text.
		$result = jetpack_og_get_description( $description_with_query );

		// Should contain the text before and after, but not the query block content.
		$this->assertStringContainsString( 'Some text before', $result );
		$this->assertStringContainsString( 'Some text after', $result );
		$this->assertStringNotContainsString( 'Query content', $result );
	}

	/**
	 * Test jetpack_og_get_site_fallback_blank_image with different scenarios.
	 *
	 * @dataProvider jetpack_og_get_site_fallback_blank_image_data_provider
	 *
	 * @since 14.9
	 *
	 * @param string        $expected_url Expected image URL.
	 * @param callable|null $filter_callback Optional filter callback to add.
	 */
	#[DataProvider( 'jetpack_og_get_site_fallback_blank_image_data_provider' )]
	public function test_jetpack_og_get_site_fallback_blank_image( $expected_url, $filter_callback = null ) {
		// Add filter if provided.
		if ( $filter_callback ) {
			add_filter( 'jetpack_open_graph_image_default', $filter_callback );
		}

		$image_url = jetpack_og_get_site_fallback_blank_image();

		$this->assertIsString( $image_url );
		$this->assertEquals( $expected_url, $image_url );

		// Clean up the filter if it was added.
		if ( $filter_callback ) {
			remove_filter( 'jetpack_open_graph_image_default', $filter_callback );
		}
	}

	/**
	 * Data provider for jetpack_og_get_site_fallback_blank_image tests.
	 */
	public static function jetpack_og_get_site_fallback_blank_image_data_provider() {
		return array(
			'default_image' => array(
				'https://s0.wp.com/i/blank.jpg',
				null,
			),
			'custom_image'  => array(
				'https://example.com/custom-image.jpg',
				function () {
					return 'https://example.com/custom-image.jpg';
				},
			),
		);
	}

	/**
	 * Test jetpack_og_get_site_image with different scenarios.
	 *
	 * @since 14.9
	 */
	public function test_jetpack_og_get_site_image() {
		// Test blank fallback when no site images are set.
		$result = jetpack_og_get_site_image( 200, 200 );
		$this->assertIsArray( $result );
		$this->assertArrayHasKey( 'src', $result );
		$this->assertArrayHasKey( 'width', $result );
		$this->assertArrayHasKey( 'height', $result );
		$this->assertArrayHasKey( 'type', $result );
		$this->assertEquals( 'blank', $result['type'] );
		$this->assertEquals( 200, $result['width'] );
		$this->assertEquals( 200, $result['height'] );
		$this->assertEmpty( $result['src'] );

		// Test site icon with valid size.
		update_option( 'site_icon', $this->icon_id );
		$result = jetpack_og_get_site_image( 200, 200 );
		$this->assertEquals( 'site_icon', $result['type'] );
		$this->assertNotEmpty( $result['src'] );

		// Test site icon with invalid size (too small).
		$result = jetpack_og_get_site_image( 1000, 1000 );
		$this->assertEquals( 'blank', $result['type'] );
		$this->assertEmpty( $result['src'] );

		// Clean up.
		delete_option( 'site_icon' );
		delete_option( 'site_logo' );
	}

	/**
	 * Test jetpack_og_generate_fallback_social_image with different scenarios.
	 *
	 * @dataProvider jetpack_og_generate_fallback_social_image_data_provider
	 *
	 * @since 14.9
	 *
	 * @param array         $representative_image The representative image array.
	 * @param array         $expected_result Expected result array.
	 * @param callable|null $filter_callback Optional filter callback to mock token generation.
	 */
	#[DataProvider( 'jetpack_og_generate_fallback_social_image_data_provider' )]
	public function test_jetpack_og_generate_fallback_social_image( $representative_image, $expected_result, $filter_callback = null ) {
		// Add filter if provided.
		if ( $filter_callback ) {
			add_filter( 'jetpack_og_get_social_image_token', $filter_callback );
		}

		$result = jetpack_og_generate_fallback_social_image( $representative_image, 'edge' );

		$this->assertIsArray( $result );
		$this->assertArrayHasKey( 'src', $result );
		$this->assertArrayHasKey( 'width', $result );
		$this->assertArrayHasKey( 'height', $result );
		$this->assertEquals( $expected_result['src'], $result['src'] );
		$this->assertEquals( $expected_result['width'], $result['width'] );
		$this->assertEquals( $expected_result['height'], $result['height'] );

		// Clean up the filter if it was added.
		if ( $filter_callback ) {
			remove_filter( 'jetpack_og_get_social_image_token', $filter_callback );
		}
	}

	/**
	 * Data provider for jetpack_og_generate_fallback_social_image tests.
	 */
	public static function jetpack_og_generate_fallback_social_image_data_provider() {
		return array(
			'fallback_when_social_image_generator_unavailable' => array(
				array(
					'src'    => 'https://example.com/image.jpg',
					'width'  => 500,
					'height' => 500,
				),
				array(
					'src'    => 'https://example.com/image.jpg',
					'width'  => 500,
					'height' => 500,
				),
				null, // No filter, so it will fall back to representative image
			),
			'successful_generation_with_valid_token' => array(
				array(
					'src'    => 'https://example.com/image.jpg',
					'width'  => 500,
					'height' => 500,
				),
				array(
					'src'    => 'https://s0.wp.com/_si/?t=test_token_12345',
					'width'  => 1200,
					'height' => 630,
				),
				function () {
					return 'test_token_12345';
				},
			),
			'wp_error_returns_fallback_image'        => array(
				array(
					'src'    => 'https://example.com/image.jpg',
					'width'  => 500,
					'height' => 500,
				),
				array(
					'src'    => 'https://example.com/image.jpg',
					'width'  => 500,
					'height' => 500,
				),
				function () {
					return new WP_Error( 'test_error', 'Test error message' );
				},
			),
		);
	}

	/**
	 * Test that jetpack_og_get_fallback_social_image returns early in offline mode.
	 */
	public function test_jetpack_og_get_fallback_social_image_returns_early_in_offline_mode() {
		// Simulate offline mode.
		add_filter( 'jetpack_offline_mode', '__return_true' );
		StatusCache::clear();

		$result = jetpack_og_get_fallback_social_image( 200, 200 );

		$this->assertIsArray( $result );
		$this->assertArrayHasKey( 'src', $result );
		// In offline mode the function should return the site image directly,
		// not a Social Image Generator URL.
		$this->assertStringNotContainsString( 'https://s0.wp.com/_si/', $result['src'] );

		// Clean up.
		remove_filter( 'jetpack_offline_mode', '__return_true' );
		StatusCache::clear();
	}

	/**
	 * Test that jetpack_og_get_fallback_social_image skips dynamic image generation in offline mode
	 * even when a social image token would be available.
	 */
	public function test_jetpack_og_get_fallback_social_image_skips_generation_in_offline_mode() {
		// Simulate offline mode.
		add_filter( 'jetpack_offline_mode', '__return_true' );
		StatusCache::clear();

		// Provide a token that would trigger SIG image generation if the function didn't bail early.
		$token_filter = function () {
			return 'test_token_should_not_be_used';
		};
		add_filter( 'jetpack_og_get_social_image_token', $token_filter );

		// Set a site icon so we get a deterministic site image with a real src.
		update_option( 'site_icon', $this->icon_id );

		$result = jetpack_og_get_fallback_social_image( 200, 200 );

		$this->assertIsArray( $result );
		$this->assertArrayHasKey( 'src', $result );
		// The token should never be used — the function should return before reaching generation.
		$this->assertStringNotContainsString( 'test_token_should_not_be_used', $result['src'] );
		$this->assertStringNotContainsString( 'https://s0.wp.com/_si/', $result['src'] );
		// It should return the site icon image.
		$this->assertEquals( 'site_icon', $result['type'] );

		// Clean up.
		remove_filter( 'jetpack_offline_mode', '__return_true' );
		remove_filter( 'jetpack_og_get_social_image_token', $token_filter );
		delete_option( 'site_icon' );
		StatusCache::clear();
	}
}
