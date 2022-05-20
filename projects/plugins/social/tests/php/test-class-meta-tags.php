<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Meta tags testing.
 *
 * @package automattic/jetpack-social-plugin
 */

use Brain\Monkey;
use WorDBless\BaseTestCase;

/**
 * Meta tags testing.
 */
class Meta_Tags_Test extends BaseTestCase {
	/**
	 * Post ID of the testing post.
	 *
	 * @var int $post
	 */
	protected static $post;

	/**
	 * ID of the test attachment (1200 pixels wide).
	 *
	 * @var int $attachment_id
	 */
	protected static $attachment_id;

	/**
	 * ID of the test attachment (100 pixels wide).
	 *
	 * @var int $attachment_id_small
	 */
	protected static $attachment_id_small;

	/**
	 * Initialize tests
	 *
	 * @before
	 */
	public function set_up() {
		$this->meta_tags           = new Automattic\Jetpack\Social\Meta_Tags();
		self::$post                = wp_insert_post(
			array(
				'post_title'   => 'hello',
				'post_content' => 'world',
				'post_status'  => 'publish',
			)
		);
		self::$attachment_id       = $this->create_upload_object( __DIR__ . '/images/jetpack-logo-1200w.png' );
		self::$attachment_id_small = $this->create_upload_object( __DIR__ . '/images/jetpack-logo-100w.png' );
	}

	/**
	 * Reverting the testing environment to its original state.
	 *
	 * @after
	 */
	public function tear_down() {
		Monkey\tearDown();
	}

	/**
	 * Create a upload
	 *
	 * @param string  $file File path.
	 * @param integer $parent Parent post ID.
	 * @return integer
	 */
	public function create_upload_object( $file, $parent = 0 ) {
		$contents = file_get_contents( $file ); //phpcs:ignore
		$upload   = wp_upload_bits( basename( $file ), null, $contents );

		$type = '';
		if ( ! empty( $upload['type'] ) ) {
			$type = $upload['type'];
		} else {
			$mime = wp_check_filetype( $upload['file'], null );
			if ( $mime ) {
				$type = $mime['type'];
			}
		}

		$attachment = array(
			'post_title'     => basename( $upload['file'] ),
			'post_content'   => '',
			'post_type'      => 'attachment',
			'post_parent'    => $parent,
			'post_mime_type' => $type,
			'guid'           => $upload['url'],
		);

		// Save the data.
		$id = wp_insert_attachment( $attachment, $upload['file'], $parent );

		wp_update_attachment_metadata( $id, wp_generate_attachment_metadata( $id, $upload['file'] ) );

		return $id;
	}

	/**
	 * Test that getting active plugins works.
	 */
	public function test_get_active_plugins() {
		update_option( 'active_plugins', array( 'hello-world.php' ) );
		$active_plugins = $this->meta_tags->get_active_plugins();
		$this->assertEquals( array( 'hello-world.php' ), $active_plugins );
	}

	/**
	 * Test that meta tags don't get rendered when a conflicting plugin is active.
	 */
	public function test_meta_tags_dont_get_rendered_when_conflicting_plugin_is_active() {
		Monkey\Functions\when( 'is_singular' )->justReturn( true );
		$this->assertTrue( $this->meta_tags->should_render_meta_tags() );
		update_option( 'active_plugins', array( 'og-tags/og-tags.php' ) );
		$this->assertFalse( $this->meta_tags->should_render_meta_tags() );
	}

	/**
	 * Test that Twitter Cards tags don't get rendered when a conflicting plugin is active.
	 */
	public function test_twitter_cards_tags_dont_get_rendered_when_conflicting_plugin_is_active() {
		$this->assertTrue( $this->meta_tags->should_render_twitter_cards_tags() );
		update_option( 'active_plugins', array( 'wp-twitter-cards/twitter_cards.php' ) );
		$this->assertFalse( $this->meta_tags->should_render_twitter_cards_tags() );
	}

	/**
	 * Test that meta tags don't get rendered on a non-singular page.
	 */
	public function test_meta_tags_dont_get_rendered_on_non_singular_pages() {
		Monkey\Functions\when( 'is_singular' )->justReturn( true );
		$this->assertTrue( $this->meta_tags->should_render_meta_tags() );
		Monkey\Functions\when( 'is_singular' )->justReturn( false );
		$this->assertFalse( $this->meta_tags->should_render_meta_tags() );
	}

	/**
	 * Test that meta tags don't get rendered when they're disabled by a filter.
	 */
	public function test_meta_tags_dont_get_rendered_when_disabled_by_filter() {
		Monkey\Functions\when( 'is_singular' )->justReturn( true );
		$this->assertTrue( $this->meta_tags->should_render_meta_tags() );
		add_filter( 'jetpack_enable_open_graph', '__return_false' );
		$this->assertFalse( $this->meta_tags->should_render_meta_tags() );
	}

	/**
	 * Test that the featured image gets returned correctly.
	 */
	public function test_featured_image_gets_returned_correctly() {
		$this->assertEmpty( $this->meta_tags->get_featured_image( self::$post ) );
		set_post_thumbnail( self::$post, self::$attachment_id );
		$this->assertNotEmpty( $this->meta_tags->get_featured_image( self::$post ) );
	}

	/**
	 * Test that the featured image gets skipped when the image is too small.
	 */
	public function test_featured_image_too_small_gets_skipped() {
		set_post_thumbnail( self::$post, self::$attachment_id_small );
		$this->assertEmpty( $this->meta_tags->get_featured_image( self::$post ) );
	}

	/**
	 * Test that the featured image gets skipped when the post is password protected.
	 */
	public function test_featured_image_does_not_get_returned_for_password_protected_posts() {
		set_post_thumbnail( self::$post, self::$attachment_id );
		$this->assertNotEmpty( $this->meta_tags->get_featured_image( self::$post ) );
		wp_update_post(
			array(
				'ID'            => self::$post,
				'post_password' => 'foo',
			)
		);
		$this->assertEmpty( $this->meta_tags->get_featured_image( self::$post ) );
	}
}
