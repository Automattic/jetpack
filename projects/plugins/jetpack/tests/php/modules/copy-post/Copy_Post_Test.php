<?php
/**
 * Class Copy_Post_Test for unit testing the Copy Post module.
 *
 * @package automattic/jetpack
 */

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Group;

require_once JETPACK__PLUGIN_DIR . 'modules/copy-post.php';

/**
 * @group copy-post
 * @covers Jetpack_Copy_Post
 */
#[Group( 'copy-post' )]
#[CoversClass( Jetpack_Copy_Post::class )]
class Copy_Post_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Test user ID.
	 *
	 * @var int
	 */
	private $user_id;

	/**
	 * Set up.
	 */
	public function set_up() {
		parent::set_up();

		// Create an admin user for testing.
		$this->user_id = $this->factory->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $this->user_id );
	}

	/**
	 * Data provider for testing content with backslashes.
	 *
	 * @return array
	 */
	public static function data_content_with_backslashes() {
		return array(
			'tab escape sequence'         => array(
				'<!-- wp:code --><pre class="wp-block-code"><code>\t is a tab</code></pre><!-- /wp:code -->',
			),
			'newline escape sequence'     => array(
				'<!-- wp:code --><pre class="wp-block-code"><code>\n is a newline</code></pre><!-- /wp:code -->',
			),
			'form feed escape sequence'   => array(
				'<!-- wp:code --><pre class="wp-block-code"><code>\f is a form feed</code></pre><!-- /wp:code -->',
			),
			'double backslash'            => array(
				'<!-- wp:code --><pre class="wp-block-code"><code>\\\\ becomes \\</code></pre><!-- /wp:code -->',
			),
			'backslash with number'       => array(
				'<!-- wp:code --><pre class="wp-block-code"><code>\\9 is backslash 9</code></pre><!-- /wp:code -->',
			),
			'backslash with space'        => array(
				'<!-- wp:code --><pre class="wp-block-code"><code>\\ followed by space</code></pre><!-- /wp:code -->',
			),
			'multiple backslashes'        => array(
				'<!-- wp:paragraph --><p>Text with \\t and \\n and \\f sequences</p><!-- /wp:paragraph -->',
			),
			'paragraph with backslash'    => array(
				'<!-- wp:paragraph --><p>Simple \\t text</p><!-- /wp:paragraph -->',
			),
			'mixed content with backslashes' => array(
				"<!-- wp:paragraph --><p>Path: C:\\\\Users\\\\test</p><!-- /wp:paragraph -->\n<!-- wp:code --><pre class=\"wp-block-code\"><code>echo \"\\n\";</code></pre><!-- /wp:code -->",
			),
		);
	}

	/**
	 * Test that backslash characters are preserved when copying post content.
	 *
	 * @dataProvider data_content_with_backslashes
	 *
	 * @param string $content Post content to test.
	 */
	#[DataProvider( 'data_content_with_backslashes' )]
	public function test_backslashes_preserved_in_content( $content ) {
		// Create a source post with the content containing backslashes.
		$source_post_id = $this->factory->post->create(
			array(
				'post_content' => $content,
				'post_title'   => 'Test Post with Backslashes',
				'post_status'  => 'draft',
			)
		);

		$source_post = get_post( $source_post_id );

		// Create a target post.
		$target_post_id = $this->factory->post->create(
			array(
				'post_content' => '',
				'post_title'   => '',
				'post_status'  => 'auto-draft',
			)
		);

		// Create an instance of Jetpack_Copy_Post and use reflection to call the protected update_content method.
		$copy_post = new Jetpack_Copy_Post();

		$reflection = new ReflectionClass( $copy_post );
		$method     = $reflection->getMethod( 'update_content' );
		$method->setAccessible( true );

		// Call update_content.
		$result = $method->invoke( $copy_post, $source_post, $target_post_id );

		// Verify the result is successful.
		$this->assertGreaterThan( 0, $result, 'wp_update_post should return a post ID on success' );

		// Get the updated target post.
		$updated_post = get_post( $target_post_id );

		// Assert that the backslashes are preserved in the copied content.
		$this->assertEquals(
			$content,
			$updated_post->post_content,
			'Backslash characters should be preserved in copied content'
		);
	}

	/**
	 * Test that backslash characters are preserved in post titles.
	 */
	public function test_backslashes_preserved_in_title() {
		$title = 'Title with \\t and \\n characters';

		// Create a source post with a title containing backslashes.
		$source_post_id = $this->factory->post->create(
			array(
				'post_content' => 'Some content',
				'post_title'   => $title,
				'post_status'  => 'draft',
			)
		);

		$source_post = get_post( $source_post_id );

		// Create a target post.
		$target_post_id = $this->factory->post->create(
			array(
				'post_content' => '',
				'post_title'   => '',
				'post_status'  => 'auto-draft',
			)
		);

		$copy_post = new Jetpack_Copy_Post();

		$reflection = new ReflectionClass( $copy_post );
		$method     = $reflection->getMethod( 'update_content' );
		$method->setAccessible( true );

		$method->invoke( $copy_post, $source_post, $target_post_id );

		$updated_post = get_post( $target_post_id );

		$this->assertEquals(
			$title,
			$updated_post->post_title,
			'Backslash characters should be preserved in copied title'
		);
	}

	/**
	 * Test that backslash characters are preserved in post excerpts.
	 */
	public function test_backslashes_preserved_in_excerpt() {
		$excerpt = 'Excerpt with \\t tab and \\n newline';

		// Create a source post with an excerpt containing backslashes.
		$source_post_id = $this->factory->post->create(
			array(
				'post_content' => 'Some content',
				'post_title'   => 'Test Title',
				'post_excerpt' => $excerpt,
				'post_status'  => 'draft',
			)
		);

		$source_post = get_post( $source_post_id );

		// Create a target post.
		$target_post_id = $this->factory->post->create(
			array(
				'post_content' => '',
				'post_title'   => '',
				'post_excerpt' => '',
				'post_status'  => 'auto-draft',
			)
		);

		$copy_post = new Jetpack_Copy_Post();

		$reflection = new ReflectionClass( $copy_post );
		$method     = $reflection->getMethod( 'update_content' );
		$method->setAccessible( true );

		$method->invoke( $copy_post, $source_post, $target_post_id );

		$updated_post = get_post( $target_post_id );

		$this->assertEquals(
			$excerpt,
			$updated_post->post_excerpt,
			'Backslash characters should be preserved in copied excerpt'
		);
	}
}
