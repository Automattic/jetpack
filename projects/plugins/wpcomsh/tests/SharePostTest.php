<?php
/**
 * Share Post test file.
 *
 * @package wpcomsh
 */

declare( strict_types = 1 );

use PHPUnit\Framework\Attributes\CoversFunction;
use PHPUnit\Framework\Attributes\DataProvider;

require_once ABSPATH . 'wp-admin/includes/post.php';

/**
 * Class SharePostTest.
 *
 * @covers ::wpcomsh_insert_shared_post_data
 * @covers ::wpcomsh_get_shared_post_arg
 * @covers ::wpcomsh_get_embed_content
 */
#[CoversFunction( 'wpcomsh_insert_shared_post_data' )]
#[CoversFunction( 'wpcomsh_get_shared_post_arg' )]
#[CoversFunction( 'wpcomsh_get_embed_content' )]
class SharePostTest extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * PHP errors share-post.php raised while creating the draft.
	 *
	 * @var string[]
	 */
	private $php_errors = array();

	/**
	 * Set up before each test.
	 */
	public function setUp(): void {
		parent::setUp();
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'administrator' ) ) );
	}

	/**
	 * Clean up after each test.
	 */
	public function tearDown(): void {
		$_GET = array();
		remove_filter( 'default_title', 'wpcomsh_filter_title', 10 );
		remove_filter( 'default_content', 'wpcomsh_filter_content', 10 );
		parent::tearDown();
	}

	/**
	 * Open post-new.php with the given share link arguments, recording PHP errors.
	 *
	 * @param array $args Unslashed query arguments; slashed here as WordPress slashes `$_GET`.
	 * @return WP_Post The new draft.
	 */
	private function create_shared_draft( array $args ) {
		$_GET = wp_slash( array_merge( array( 'is_post_share' => 'true' ), $args ) );

		$this->php_errors = array();
		set_error_handler(
			function ( $errno, $errstr, $errfile, $errline ) {
				// Other plugins on WP Cloud test sites may raise unrelated notices.
				if ( ! str_ends_with( $errfile, 'share-post/share-post.php' ) ) {
					return false;
				}
				$this->php_errors[] = "$errstr in $errfile:$errline";
				return true;
			}
		);
		try {
			return get_default_post_to_edit( 'post', true );
		} finally {
			restore_error_handler();
		}
	}

	/**
	 * Share links that leave out some or all of the optional arguments.
	 *
	 * @return array
	 */
	public static function provide_partial_share_links() {
		return array(
			'url, title and text' => array(
				array(
					'url'   => 'https://example.com/a-post/',
					'title' => "It's a post",
					'text'  => 'Quoted text.',
				),
				"It's a post",
				'<p>Quoted text.</p><cite><a href="https://example.com/a-post/">It\'s a post</a></cite>',
			),
			'text only'           => array(
				array( 'text' => 'Quoted text.' ),
				'',
				'<p>Quoted text.</p>',
			),
		);
	}

	/**
	 * A share link without the optional arguments builds the draft without PHP errors.
	 *
	 * @dataProvider provide_partial_share_links
	 *
	 * @param array  $args             Share link arguments.
	 * @param string $expected_title   Expected draft title.
	 * @param string $expected_content Expected fragment of the draft content.
	 */
	#[DataProvider( 'provide_partial_share_links' )]
	public function test_partial_share_link_creates_draft_without_errors( array $args, string $expected_title, string $expected_content ) {
		$post = $this->create_shared_draft( $args );

		$this->assertSame( array(), $this->php_errors );
		$this->assertSame( $expected_title, $post->post_title );
		$this->assertStringContainsString( $expected_content, $post->post_content );
	}

	/**
	 * Embed URLs, the URL the embed block should keep, and the wrapper text save() would write.
	 *
	 * @return array
	 */
	public static function provide_embed_urls() {
		return array(
			'plain URL'             => array( 'https://www.youtube.com/watch/abc', 'https://www.youtube.com/watch/abc', 'https://www.youtube.com/watch/abc' ),
			'query string stripped' => array( 'https://www.youtube.com/embed/abc?feature=oembed', 'https://www.youtube.com/embed/abc', 'https://www.youtube.com/embed/abc' ),
			'double hyphen in path' => array( 'https://example.com/clip--one', 'https://example.com/clip--one', 'https://example.com/clip--one' ),
			'ampersand in path'     => array( 'https://example.com/a&b', 'https://example.com/a&b', 'https://example.com/a&amp;b' ),
			'entity in path'        => array( 'https://example.com/a&amp;b', 'https://example.com/a&amp;b', 'https://example.com/a&amp;amp;b' ),
		);
	}

	/**
	 * A share link with an embed builds a core/embed block matching the editor's own markup.
	 *
	 * @dataProvider provide_embed_urls
	 *
	 * @param string $embed         Embed argument.
	 * @param string $expected_url  URL the block should keep.
	 * @param string $expected_text Escaped URL inside the wrapper.
	 */
	#[DataProvider( 'provide_embed_urls' )]
	public function test_share_link_with_embed_creates_embed_block( string $embed, string $expected_url, string $expected_text ) {
		$post = $this->create_shared_draft(
			array(
				'url'   => 'https://example.com/a-post/',
				'title' => 'A post',
				'embed' => $embed,
			)
		);

		$this->assertSame( array(), $this->php_errors );
		$blocks = parse_blocks( $post->post_content );
		$this->assertSame( 'core/embed', $blocks[0]['blockName'] );
		$this->assertSame( array( 'url' => $expected_url ), $blocks[0]['attrs'] );
		$this->assertSame(
			'<figure class="wp-block-embed"><div class="wp-block-embed__wrapper">' . "\n" . $expected_text . "\n" . '</div></figure>',
			$blocks[0]['innerHTML']
		);
	}

	/**
	 * Embed arguments that cannot become a valid embed block.
	 *
	 * @return array
	 */
	public static function provide_unusable_embeds() {
		return array(
			'unsafe scheme' => array( 'javascript:alert(1)' ),
			'invalid UTF-8' => array( "https://example.com/\xE9" ),
		);
	}

	/**
	 * A share link with an unusable embed still builds the draft, without an embed block.
	 *
	 * @dataProvider provide_unusable_embeds
	 *
	 * @param string $embed Embed argument.
	 */
	#[DataProvider( 'provide_unusable_embeds' )]
	public function test_share_link_with_unusable_embed_skips_embed_block( string $embed ) {
		$post = $this->create_shared_draft(
			array(
				'text'  => 'Quoted text.',
				'embed' => $embed,
			)
		);

		$this->assertSame( array(), $this->php_errors );
		$this->assertStringNotContainsString( 'wp:embed', $post->post_content );
		$this->assertStringContainsString( '<p>Quoted text.</p>', $post->post_content );
	}
}
