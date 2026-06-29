<?php
/**
 * Tests for the Twitter_Cards class.
 *
 * @package automattic/jetpack-post-media
 */

use Automattic\Jetpack\Post_Media\Twitter_Cards;
use PHPUnit\Framework\Attributes\CoversMethod;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;
use WorDBless\Options as WorDBless_Options;
use WorDBless\Posts as WorDBless_Posts;

/**
 * @covers \Automattic\Jetpack\Post_Media\Twitter_Cards::sanitize_twitter_user
 * @covers \Automattic\Jetpack\Post_Media\Twitter_Cards::is_default_site_tag
 * @covers \Automattic\Jetpack\Post_Media\Twitter_Cards::twitter_cards_output
 * @covers \Automattic\Jetpack\Post_Media\Twitter_Cards::prioritize_creator_over_default_site
 * @covers \Automattic\Jetpack\Post_Media\Twitter_Cards::twitter_cards_define_type_based_on_image_count
 * @covers \Automattic\Jetpack\Post_Media\Twitter_Cards::site_tag
 * @covers \Automattic\Jetpack\Post_Media\Twitter_Cards::twitter_cards_tags
 * @covers \Automattic\Jetpack\Post_Media\Twitter_Cards::init
 */
#[CoversMethod( Twitter_Cards::class, 'sanitize_twitter_user' )]
#[CoversMethod( Twitter_Cards::class, 'is_default_site_tag' )]
#[CoversMethod( Twitter_Cards::class, 'twitter_cards_output' )]
#[CoversMethod( Twitter_Cards::class, 'prioritize_creator_over_default_site' )]
#[CoversMethod( Twitter_Cards::class, 'twitter_cards_define_type_based_on_image_count' )]
#[CoversMethod( Twitter_Cards::class, 'site_tag' )]
#[CoversMethod( Twitter_Cards::class, 'twitter_cards_tags' )]
#[CoversMethod( Twitter_Cards::class, 'init' )]
class Twitter_Cards_Test extends BaseTestCase {

	/**
	 * Tear down after each test.
	 */
	public function tear_down() {
		WorDBless_Options::init()->clear_options();
		WorDBless_Posts::init()->clear_all_posts();
		remove_all_filters( 'jetpack_disable_twitter_cards' );
		remove_all_filters( 'jetpack_sharing_twitter_via' );
		remove_all_filters( 'jetpack_twitter_cards_site_tag' );
		remove_all_filters( 'jetpack_twitter_cards_image_default' );
		remove_all_filters( 'jetpack_open_graph_tags' );
		remove_all_filters( 'jetpack_open_graph_output' );

		// Reset globals.
		unset( $GLOBALS['post'] );

		parent::tear_down();
	}

	/**
	 * Data provider for sanitize_twitter_user tests.
	 *
	 * @return array
	 */
	public static function sanitize_twitter_user_data_provider() {
		return array(
			'adds @ to plain username'      => array( 'jetpack', '@jetpack' ),
			'keeps existing @ prefix'       => array( '@jetpack', '@jetpack' ),
			'handles empty string'          => array( '', '@' ),
			'handles username with numbers' => array( 'user123', '@user123' ),
			'handles username with _'       => array( 'my_user', '@my_user' ),
		);
	}

	/**
	 * Test sanitize_twitter_user normalizes @ prefix.
	 *
	 * @param string $input    Input Twitter user.
	 * @param string $expected Expected output.
	 * @dataProvider sanitize_twitter_user_data_provider
	 */
	#[DataProvider( 'sanitize_twitter_user_data_provider' )]
	public function test_sanitize_twitter_user( $input, $expected ) {
		$this->assertSame( $expected, Twitter_Cards::sanitize_twitter_user( $input ) );
	}

	/**
	 * Data provider for is_default_site_tag tests.
	 *
	 * @return array
	 */
	public static function is_default_site_tag_data_provider() {
		return array(
			'@wordpressdotcom is default'          => array( '@wordpressdotcom', true ),
			'@jetpack is default'                  => array( '@jetpack', true ),
			'wordpressdotcom without @ is default' => array( 'wordpressdotcom', true ),
			'jetpack without @ is default'         => array( 'jetpack', true ),
			'custom tag is not default'            => array( '@mysite', false ),
			'empty string is not default'          => array( '', false ),
			'random string is not default'         => array( 'random', false ),
		);
	}

	/**
	 * Test is_default_site_tag correctly identifies default tags.
	 *
	 * @param string $site_tag Site tag to check.
	 * @param bool   $expected Expected result.
	 * @dataProvider is_default_site_tag_data_provider
	 */
	#[DataProvider( 'is_default_site_tag_data_provider' )]
	public function test_is_default_site_tag( $site_tag, $expected ) {
		$this->assertSame( $expected, Twitter_Cards::is_default_site_tag( $site_tag ) );
	}

	/**
	 * Test that twitter:card property attribute is replaced with name.
	 */
	public function test_twitter_cards_output_replaces_property_with_name_for_twitter_tags() {
		$input    = '<meta property="twitter:card" content="summary" />';
		$expected = '<meta name="twitter:card" content="summary" />';
		$this->assertSame( $expected, Twitter_Cards::twitter_cards_output( $input ) );
	}

	/**
	 * Test that non-twitter OG tags are not modified.
	 */
	public function test_twitter_cards_output_does_not_modify_non_twitter_tags() {
		$input = '<meta property="og:title" content="Hello" />';
		$this->assertSame( $input, Twitter_Cards::twitter_cards_output( $input ) );
	}

	/**
	 * Test that twitter:image property attribute is replaced with name.
	 */
	public function test_twitter_cards_output_handles_twitter_image_tag() {
		$input    = '<meta property="twitter:image" content="https://example.com/img.jpg" />';
		$expected = '<meta name="twitter:image" content="https://example.com/img.jpg" />';
		$this->assertSame( $expected, Twitter_Cards::twitter_cards_output( $input ) );
	}

	/**
	 * Test that empty string input returns empty string.
	 */
	public function test_twitter_cards_output_handles_empty_string() {
		$this->assertSame( '', Twitter_Cards::twitter_cards_output( '' ) );
	}

	/**
	 * Test that creator is returned when using a default site tag.
	 */
	public function test_prioritize_creator_returns_creator_when_default_site_tag() {
		$og_tags = array( 'twitter:creator' => '@customuser' );
		$result  = Twitter_Cards::prioritize_creator_over_default_site( '@wordpressdotcom', $og_tags );
		$this->assertSame( '@customuser', $result );
	}

	/**
	 * Test that site tag is returned when it is not a default.
	 */
	public function test_prioritize_creator_returns_site_tag_when_not_default() {
		$og_tags = array( 'twitter:creator' => '@customuser' );
		$result  = Twitter_Cards::prioritize_creator_over_default_site( '@mysite', $og_tags );
		$this->assertSame( '@mysite', $result );
	}

	/**
	 * Test that default site tag is returned when no creator exists.
	 */
	public function test_prioritize_creator_returns_site_tag_when_no_creator() {
		$result = Twitter_Cards::prioritize_creator_over_default_site( '@wordpressdotcom', array() );
		$this->assertSame( '@wordpressdotcom', $result );
	}

	/**
	 * Test that @jetpack default is replaced with creator when present.
	 */
	public function test_prioritize_creator_returns_creator_for_jetpack_default() {
		$og_tags = array( 'twitter:creator' => '@someone' );
		$result  = Twitter_Cards::prioritize_creator_over_default_site( '@jetpack', $og_tags );
		$this->assertSame( '@someone', $result );
	}

	/**
	 * Test that image type with images returns summary_large_image.
	 */
	public function test_define_type_returns_summary_large_image_for_image_type_with_images() {
		$og_tags = array();
		$extract = array(
			'type'   => 'image',
			'count'  => array( 'image' => 1 ),
			'image'  => 'https://example.com/img.jpg',
			'images' => array(
				array( 'url' => 'https://example.com/img.jpg' ),
			),
		);

		list( $result_tags, $card_type ) = Twitter_Cards::twitter_cards_define_type_based_on_image_count( $og_tags, $extract );

		$this->assertSame( 'summary_large_image', $card_type );
		$this->assertArrayHasKey( 'twitter:image', $result_tags );
		$this->assertStringContainsString( 'img.jpg', $result_tags['twitter:image'] );
		$this->assertStringContainsString( 'w=1400', $result_tags['twitter:image'] );
	}

	/**
	 * Test that gallery type with images returns summary_large_image.
	 */
	public function test_define_type_returns_summary_large_image_for_gallery_type_with_images() {
		$og_tags = array();
		$extract = array(
			'type'   => 'gallery',
			'count'  => array( 'image' => 3 ),
			'image'  => 'https://example.com/img1.jpg',
			'images' => array(
				array( 'url' => 'https://example.com/img1.jpg' ),
				array( 'url' => 'https://example.com/img2.jpg' ),
				array( 'url' => 'https://example.com/img3.jpg' ),
			),
		);

		list( $result_tags, $card_type ) = Twitter_Cards::twitter_cards_define_type_based_on_image_count( $og_tags, $extract );

		$this->assertSame( 'summary_large_image', $card_type );
		$this->assertArrayHasKey( 'twitter:image', $result_tags );
		$this->assertStringContainsString( 'img1.jpg', $result_tags['twitter:image'] );
	}

	/**
	 * Test that no images and no fallbacks returns summary type.
	 */
	public function test_define_type_returns_summary_when_no_images_and_no_fallbacks() {
		$og_tags = array();
		$extract = array(
			'type'  => 'standard',
			'count' => array( 'image' => 0 ),
		);

		list( $result_tags, $card_type ) = Twitter_Cards::twitter_cards_define_type_based_on_image_count( $og_tags, $extract );

		$this->assertSame( 'summary', $card_type );
		$this->assertArrayNotHasKey( 'twitter:image', $result_tags );
	}

	/**
	 * Test that site icon is used as fallback when no images exist.
	 */
	public function test_define_type_uses_site_icon_when_no_images() {
		// Create a site icon.
		$upload_dir = wp_upload_dir();
		$image_path = $upload_dir['path'] . '/test-icon.png';

		// Create a simple test PNG file.
		$img = imagecreatetruecolor( 240, 240 );
		imagepng( $img, $image_path );
		// imagedestroy() is deprecated in PHP 8.5, but GD resources are only auto-freed since PHP 8.0.
		// We still need to call it on PHP < 8.0 to avoid memory leaks.
		if ( PHP_VERSION_ID < 80000 ) {
			imagedestroy( $img ); // phpcs:ignore PHPCompatibility.FunctionUse.RemovedFunctions.imagedestroyDeprecated,MediaWiki.Usage.ForbiddenFunctions.imagedestroy
		}

		$attachment_id = wp_insert_attachment(
			array(
				'post_mime_type' => 'image/png',
				'post_title'     => 'Test Icon',
				'post_status'    => 'inherit',
			),
			$image_path
		);

		update_option( 'site_icon', $attachment_id );

		$og_tags = array();
		$extract = array(
			'type'  => 'standard',
			'count' => array( 'image' => 0 ),
		);

		list( $result_tags, $card_type ) = Twitter_Cards::twitter_cards_define_type_based_on_image_count( $og_tags, $extract );

		$this->assertSame( 'summary', $card_type );
		$this->assertArrayHasKey( 'twitter:image', $result_tags );
		$this->assertStringContainsString( 'test-icon.png', $result_tags['twitter:image'] );
	}

	/**
	 * Test that extract image is used when images array is empty.
	 */
	public function test_define_type_uses_extract_image_when_images_empty() {
		$og_tags = array();
		$extract = array(
			'type'   => 'image',
			'count'  => array( 'image' => 1 ),
			'image'  => 'https://example.com/single.jpg',
			'images' => array(),
		);

		list( $result_tags, $card_type ) = Twitter_Cards::twitter_cards_define_type_based_on_image_count( $og_tags, $extract );

		$this->assertSame( 'summary_large_image', $card_type );
		$this->assertArrayHasKey( 'twitter:image', $result_tags );
		$this->assertStringContainsString( 'single.jpg', $result_tags['twitter:image'] );
		$this->assertStringContainsString( 'w=1400', $result_tags['twitter:image'] );
	}

	/**
	 * Test that site_tag returns empty when no option is set.
	 */
	public function test_site_tag_returns_empty_when_no_option_set() {
		$result = Twitter_Cards::site_tag();
		$this->assertSame( '', $result );
	}

	/**
	 * Test that site_tag returns value from option.
	 */
	public function test_site_tag_returns_value_from_option() {
		update_option( 'jetpack-twitter-cards-site-tag', 'mysite' );
		$result = Twitter_Cards::site_tag();
		$this->assertSame( 'mysite', $result );
	}

	/**
	 * Test that password-protected posts return og_tags unmodified.
	 */
	public function test_twitter_cards_tags_returns_early_for_password_protected_post() {
		$post_id = wp_insert_post(
			array(
				'post_title'    => 'Protected Post',
				'post_content'  => 'Secret content',
				'post_status'   => 'publish',
				'post_password' => 'secret',
				'post_author'   => 1,
			)
		);

		global $post;
		$post = get_post( $post_id );
		$this->assertInstanceOf( 'WP_Post', $post );

		$og_tags = array( 'og:title' => 'Test' );
		$result  = Twitter_Cards::twitter_cards_tags( $og_tags );

		$this->assertSame( $og_tags, $result );
	}

	/**
	 * Test that the jetpack_disable_twitter_cards filter prevents card tags.
	 */
	public function test_twitter_cards_tags_returns_early_when_disabled_by_filter() {
		add_filter( 'jetpack_disable_twitter_cards', '__return_true' );

		$og_tags = array( 'og:title' => 'Test' );
		$result  = Twitter_Cards::twitter_cards_tags( $og_tags );

		$this->assertSame( $og_tags, $result );
	}

	/**
	 * Test that the twitter:site tag is added from the option.
	 */
	public function test_twitter_cards_tags_adds_site_tag_from_option() {
		update_option( 'jetpack-twitter-cards-site-tag', 'testsite' );

		// Use a filter to inject the site tag, simulating what init() registers.
		add_filter(
			'jetpack_twitter_cards_site_tag',
			function () {
				return Twitter_Cards::site_tag();
			},
			-99
		);

		$og_tags = array( 'twitter:card' => 'summary' );
		$result  = Twitter_Cards::twitter_cards_tags( $og_tags );

		$this->assertArrayHasKey( 'twitter:site', $result );
		$this->assertSame( '@testsite', $result['twitter:site'] );
	}

	/**
	 * Test that a default image is added on non-singular pages.
	 */
	public function test_twitter_cards_tags_adds_default_image_on_non_singular() {
		add_filter(
			'jetpack_twitter_cards_image_default',
			function () {
				return 'https://example.com/default.jpg';
			}
		);

		// Pass twitter:card so the non-singular branch is reached.
		$og_tags = array( 'twitter:card' => 'summary' );
		$result  = Twitter_Cards::twitter_cards_tags( $og_tags );

		$this->assertArrayHasKey( 'twitter:image', $result );
		$this->assertSame( 'https://example.com/default.jpg', $result['twitter:image'] );
	}

	/**
	 * Test that the card type is set on singular posts.
	 */
	public function test_twitter_cards_tags_sets_card_type_on_singular_post() {
		$post_id = wp_insert_post(
			array(
				'post_title'   => 'Test Post',
				'post_content' => 'Some content for testing.',
				'post_status'  => 'publish',
				'post_author'  => 1,
			)
		);

		global $post, $wp_query;
		$post = get_post( $post_id );
		$this->assertInstanceOf( 'WP_Post', $post );

		// Simulate a singular query.
		$wp_query              = new WP_Query();
		$wp_query->is_singular = true;
		$wp_query->is_single   = true;

		$og_tags = array( 'og:description' => 'A proper description' );
		$result  = Twitter_Cards::twitter_cards_tags( $og_tags );

		$this->assertArrayHasKey( 'twitter:card', $result );
		$this->assertContains( $result['twitter:card'], array( 'summary', 'summary_large_image' ) );
		$this->assertArrayHasKey( 'twitter:text:title', $result );
		$this->assertSame( 'Test Post', $result['twitter:text:title'] );
	}

	/**
	 * Test that a fallback description is added when og:description is empty.
	 */
	public function test_twitter_cards_tags_adds_fallback_description_when_og_description_empty() {
		$post_id = wp_insert_post(
			array(
				'post_title'   => 'Test Post',
				'post_content' => 'Content.',
				'post_status'  => 'publish',
				'post_author'  => 1,
			)
		);

		global $post, $wp_query;
		$post = get_post( $post_id );
		$this->assertInstanceOf( 'WP_Post', $post );

		// Simulate a singular query.
		$wp_query              = new WP_Query();
		$wp_query->is_singular = true;
		$wp_query->is_single   = true;

		$og_tags = array();
		$result  = Twitter_Cards::twitter_cards_tags( $og_tags );

		$this->assertArrayHasKey( 'twitter:card', $result );
		$this->assertArrayHasKey( 'twitter:description', $result );
		$this->assertSame( 'Visit the post for more.', $result['twitter:description'] );
	}

	/**
	 * Test that init() registers all expected filters and actions.
	 */
	public function test_init_registers_all_filters_and_actions() {
		// Remove any existing hooks.
		remove_all_filters( 'jetpack_open_graph_tags' );
		remove_all_filters( 'jetpack_open_graph_output' );
		remove_all_filters( 'jetpack_twitter_cards_site_tag' );
		remove_all_actions( 'admin_init' );
		remove_all_actions( 'sharing_global_options' );
		remove_all_actions( 'sharing_admin_update' );

		Twitter_Cards::init();

		$this->assertSame( 11, has_filter( 'jetpack_open_graph_tags', array( Twitter_Cards::class, 'twitter_cards_tags' ) ) );
		$this->assertSame( 10, has_filter( 'jetpack_open_graph_output', array( Twitter_Cards::class, 'twitter_cards_output' ) ) );
		$this->assertSame( -99, has_filter( 'jetpack_twitter_cards_site_tag', array( Twitter_Cards::class, 'site_tag' ) ) );
		$this->assertSame( 99, has_filter( 'jetpack_twitter_cards_site_tag', array( Twitter_Cards::class, 'prioritize_creator_over_default_site' ) ) );
		$this->assertSame( 10, has_action( 'admin_init', array( Twitter_Cards::class, 'settings_init' ) ) );
		$this->assertSame( 10, has_action( 'sharing_global_options', array( Twitter_Cards::class, 'sharing_global_options' ) ) );
		$this->assertSame( 10, has_action( 'sharing_admin_update', array( Twitter_Cards::class, 'settings_validate' ) ) );
	}
}
