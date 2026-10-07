<?php
/**
 * Featured image duplicate editor extension tests.
 *
 * @package automattic/jetpack
 */

declare( strict_types = 1 );

use Automattic\Jetpack\Extensions\Featured_Image_Duplicate;
use PHPUnit\Framework\Attributes\DataProvider;

require_once JETPACK__PLUGIN_DIR . '/extensions/plugins/featured-image-duplicate/featured-image-duplicate.php';

/**
 * Featured image duplicate editor extension tests.
 */
class Featured_Image_Duplicate_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Theme directories before the test registered the core fixtures.
	 *
	 * @var string[]
	 */
	private $theme_directories;

	/**
	 * Set up before each test.
	 */
	public function set_up() {
		parent::set_up();
		$this->theme_directories = $GLOBALS['wp_theme_directories'];
		register_theme_directory( DIR_TESTDATA . '/themedir1' );
		Featured_Image_Duplicate\register_meta_keys();
	}

	/**
	 * Tear down after each test.
	 */
	public function tear_down() {
		$GLOBALS['wp_theme_directories'] = $this->theme_directories;
		remove_theme_support( 'jetpack-content-options' );
		remove_filter( 'get_post_metadata', 'Automattic\Jetpack\Extensions\Featured_Image_Duplicate\filter_thumbnail_id', PHP_INT_MAX );
		parent::tear_down();
	}

	/**
	 * Store a Site Editor template or template part for the active theme.
	 *
	 * @param string $slug    Template slug.
	 * @param string $content Block markup.
	 * @param string $type    `wp_template` or `wp_template_part`.
	 */
	private function create_template( $slug, $content, $type = 'wp_template' ) {
		$id = self::factory()->post->create(
			array(
				'post_type'    => $type,
				'post_name'    => $slug,
				'post_title'   => $slug,
				'post_content' => $content,
				'post_status'  => 'publish',
			)
		);
		wp_set_post_terms( $id, get_stylesheet(), 'wp_theme' );
	}

	/**
	 * Create a post with a featured image.
	 *
	 * @param bool $hide Whether "Hide featured image" is ticked.
	 * @return int[] Post ID and attachment ID.
	 */
	private function create_post_with_thumbnail( $hide ) {
		$post_id       = self::factory()->post->create();
		$attachment_id = self::factory()->attachment->create_upload_object( DIR_TESTDATA . '/images/canola.jpg', $post_id );
		set_post_thumbnail( $post_id, $attachment_id );
		if ( $hide ) {
			update_post_meta( $post_id, Featured_Image_Duplicate\HIDE_META_KEY, true );
		}
		return array( $post_id, $attachment_id );
	}

	/**
	 * Visit a post's own page, as WordPress would before rendering it.
	 *
	 * @param int $post_id Post ID.
	 */
	private function visit( $post_id ) {
		$this->go_to( get_permalink( $post_id ) );
		Featured_Image_Duplicate\maybe_filter_thumbnail_id();
	}

	/**
	 * Only users who can edit the post can change its hide and dismiss meta.
	 */
	public function test_meta_requires_edit_post() {
		$post_id = self::factory()->post->create();

		wp_set_current_user( self::factory()->user->create( array( 'role' => 'subscriber' ) ) );
		$this->assertFalse( current_user_can( 'edit_post_meta', $post_id, Featured_Image_Duplicate\HIDE_META_KEY ) );
		$this->assertFalse( current_user_can( 'edit_post_meta', $post_id, Featured_Image_Duplicate\DISMISSED_META_KEY ) );

		wp_set_current_user( self::factory()->user->create( array( 'role' => 'editor' ) ) );
		$this->assertTrue( current_user_can( 'edit_post_meta', $post_id, Featured_Image_Duplicate\HIDE_META_KEY ) );
	}

	/**
	 * Classic themes are supported per post type through Content Options.
	 */
	public function test_classic_theme_support_follows_content_options() {
		switch_theme( 'default' );
		$post = self::factory()->post->create_and_get();
		$page = self::factory()->post->create_and_get( array( 'post_type' => 'page' ) );

		$this->assertFalse( Featured_Image_Duplicate\is_hide_supported( $post ) );

		add_theme_support( 'jetpack-content-options', array( 'featured-images' => array( 'post' => true ) ) );
		$this->assertTrue( Featured_Image_Duplicate\is_hide_supported( $post ) );
		$this->assertFalse( Featured_Image_Duplicate\is_hide_supported( $page ) );
	}

	/**
	 * Cases for block theme templates.
	 *
	 * @return array
	 */
	public static function data_block_templates() {
		return array(
			'Featured Image block'     => array( '<!-- wp:group --><div class="wp-block-group"><!-- wp:post-featured-image /--></div><!-- /wp:group -->', true ),
			'no Featured Image block'  => array( '<!-- wp:post-title /--><!-- wp:post-content /-->', false ),
			'only inside a Query Loop' => array( '<!-- wp:post-content /--><!-- wp:query --><div class="wp-block-query"><!-- wp:post-template --><!-- wp:post-featured-image /--><!-- /wp:post-template --></div><!-- /wp:query -->', false ),
			'inside a template part'   => array( '<!-- wp:template-part {"slug":"post-hero"} /--><!-- wp:post-content /-->', true ),
		);
	}

	/**
	 * Block themes are supported when the post's template renders its featured image.
	 *
	 * @dataProvider data_block_templates
	 *
	 * @param string $template Template markup.
	 * @param bool   $expected Expected support.
	 */
	#[DataProvider( 'data_block_templates' )]
	public function test_block_theme_template( $template, $expected ) {
		switch_theme( 'block-theme' );
		$this->create_template( 'post-hero', '<!-- wp:post-featured-image /-->', 'wp_template_part' );
		$this->create_template( 'single', $template );

		$this->assertSame( $expected, Featured_Image_Duplicate\is_hide_supported( self::factory()->post->create_and_get() ) );
	}

	/**
	 * Only the template WordPress would render counts: a chosen template, then the hierarchy.
	 */
	public function test_block_theme_uses_the_rendered_template() {
		switch_theme( 'block-theme' );
		$this->create_template( 'index', '<!-- wp:post-featured-image /-->' );
		$this->create_template( 'single', '<!-- wp:post-content /-->' );
		$post_id = self::factory()->post->create();

		$this->assertFalse( Featured_Image_Duplicate\is_hide_supported( $post_id ) );

		$this->create_template( 'single-with-image', '<!-- wp:post-featured-image /-->' );
		update_post_meta( $post_id, '_wp_page_template', 'single-with-image' );
		$this->assertTrue( Featured_Image_Duplicate\is_hide_supported( $post_id ) );
	}

	/**
	 * Classic themes: hidden in the loop on the post's own page only.
	 */
	public function test_classic_hides_only_in_the_loop_on_the_post_page() {
		list( $post_id, $attachment_id ) = $this->create_post_with_thumbnail( true );
		$this->visit( $post_id );

		// Outside the loop, e.g. Open Graph tags.
		$this->assertSame( $attachment_id, get_post_thumbnail_id( $post_id ) );
		while ( have_posts() ) {
			the_post();
			$this->assertFalse( has_post_thumbnail() );
		}

		// The blog home keeps it as the thumbnail.
		$this->go_to( home_url( '/' ) );
		Featured_Image_Duplicate\maybe_filter_thumbnail_id();
		while ( have_posts() ) {
			the_post();
			$this->assertTrue( has_post_thumbnail() );
		}
	}

	/**
	 * Classic themes: nothing changes without the meta.
	 */
	public function test_classic_keeps_it_without_meta() {
		list( $post_id ) = $this->create_post_with_thumbnail( false );
		$this->visit( $post_id );
		while ( have_posts() ) {
			the_post();
			$this->assertTrue( has_post_thumbnail() );
		}
	}

	/**
	 * Cases for the block theme Featured Image block.
	 *
	 * @return array
	 */
	public static function data_featured_image_block() {
		return array(
			'this post'         => array( true, array(), '' ),
			'not hidden'        => array( false, array(), '<figure>img</figure>' ),
			'inside Query Loop' => array( true, array( 'queryId' => 0 ), '<figure>img</figure>' ),
		);
	}

	/**
	 * Block themes: the template's Featured Image block renders nothing for this post only.
	 *
	 * @dataProvider data_featured_image_block
	 *
	 * @param bool   $hide     Whether "Hide featured image" is ticked.
	 * @param array  $context  Extra block context.
	 * @param string $expected Rendered output.
	 */
	#[DataProvider( 'data_featured_image_block' )]
	public function test_block_theme_featured_image_block( $hide, $context, $expected ) {
		list( $post_id ) = $this->create_post_with_thumbnail( $hide );
		$this->visit( $post_id );
		$block = new WP_Block(
			array(
				'blockName'    => 'core/post-featured-image',
				'attrs'        => array(),
				'innerBlocks'  => array(),
				'innerHTML'    => '',
				'innerContent' => array(),
			),
			array_merge( array( 'postId' => $post_id ), $context )
		);

		$this->assertSame( $expected, Featured_Image_Duplicate\hide_featured_image_block( '<figure>img</figure>', $block->parsed_block, $block ) );
	}
}
