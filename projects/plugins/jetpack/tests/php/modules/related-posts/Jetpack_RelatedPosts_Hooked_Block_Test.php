<?php

require_once __DIR__ . '/../../../../modules/related-posts/jetpack-related-posts.php';
require_once __DIR__ . '/../../../../modules/related-posts/class-jetpack-related-posts-hooked-block.php';

/**
 * @covers Jetpack_RelatedPosts_Hooked_Block
 */
class Jetpack_RelatedPosts_Hooked_Block_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Theme directories before the test registered the core fixtures.
	 *
	 * @var string[]
	 */
	private $theme_directories;

	/**
	 * Set up.
	 */
	public function set_up() {
		parent::set_up();

		$this->theme_directories = $GLOBALS['wp_theme_directories'];
		register_theme_directory( DIR_TESTDATA . '/themedir1' );
		switch_theme( 'block-theme' );
		$this->reset_options();
	}

	/**
	 * Tear down.
	 */
	public function tear_down() {
		$GLOBALS['wp_theme_directories'] = $this->theme_directories;
		Jetpack_Options::delete_option( 'relatedposts' );
		$this->reset_options();

		parent::tear_down();
	}

	/**
	 * Clear the options the singleton caches.
	 */
	private function reset_options() {
		$options = new ReflectionProperty( Jetpack_RelatedPosts::class, 'options' );
		// @todo Remove this call once we no longer need to support PHP <8.1.
		if ( PHP_VERSION_ID < 80100 ) {
			$options->setAccessible( true );
		}
		$options->setValue( Jetpack_RelatedPosts::init(), null );
	}

	/**
	 * Build a template.
	 *
	 * @param string $slug    Template slug.
	 * @param string $content Template content.
	 * @param string $type    Template type.
	 */
	private function template( $slug, $content = '<!-- wp:post-content /-->', $type = 'wp_template' ) {
		$template          = new WP_Block_Template();
		$template->slug    = $slug;
		$template->type    = $type;
		$template->content = $content;

		return $template;
	}

	/**
	 * Run the hook for the post content, after it.
	 *
	 * @param mixed $context Template or pattern array.
	 */
	private function hooked( $context ) {
		return Jetpack_RelatedPosts_Hooked_Block::hook_block_types( array(), 'after', 'core/post-content', $context );
	}

	/**
	 * Which contexts get the block.
	 */
	public function provide_contexts() {
		return array(
			'single template'           => array( 'template', 'single', true ),
			'single-post template'      => array( 'template', 'single-post', true ),
			'one post template'         => array( 'template', 'single-post-hello', true ),
			'custom post type template' => array( 'template', 'single-book', false ),
			'page template'             => array( 'template', 'page', false ),
			'template part'             => array( 'part', 'single', false ),
			'pattern for single'        => array( 'pattern', 'single', true ),
			'pattern for pages'         => array( 'pattern', 'page', false ),
		);
	}

	/**
	 * @dataProvider provide_contexts
	 *
	 * @param string $kind     Context kind.
	 * @param string $slug     Slug or template type.
	 * @param bool   $expected Whether the block is hooked.
	 */
	public function test_hooks_by_context( $kind, $slug, $expected ) {
		if ( 'pattern' === $kind ) {
			$context = array(
				'content'       => '<!-- wp:post-content /-->',
				'templateTypes' => array( $slug ),
			);
		} else {
			$context = $this->template( $slug, '<!-- wp:post-content /-->', 'part' === $kind ? 'wp_template_part' : 'wp_template' );
		}

		$this->assertSame( $expected ? array( 'jetpack/related-posts' ) : array(), $this->hooked( $context ) );
	}

	/**
	 * Only the position after the post content, and only that anchor.
	 */
	public function test_ignores_other_positions_and_anchors() {
		$template = $this->template( 'single' );

		$this->assertSame( array(), Jetpack_RelatedPosts_Hooked_Block::hook_block_types( array(), 'before', 'core/post-content', $template ) );
		$this->assertSame( array(), Jetpack_RelatedPosts_Hooked_Block::hook_block_types( array(), 'after', 'core/paragraph', $template ) );
	}

	/**
	 * The "Show related content after posts" switch.
	 */
	public function test_not_hooked_when_setting_is_off() {
		Jetpack_Options::update_option( 'relatedposts', array( 'enabled' => false ) );

		$this->assertSame( array(), $this->hooked( $this->template( 'single' ) ) );
	}

	/**
	 * Classic themes keep the module's appended markup.
	 */
	public function test_not_hooked_on_classic_theme() {
		switch_theme( 'default' );

		$this->assertSame( array(), $this->hooked( $this->template( 'single' ) ) );
	}

	/**
	 * Block Hooks do not check for an existing block, so the class does.
	 */
	public function test_not_hooked_when_already_placed() {
		$content = '<!-- wp:post-content /--><!-- wp:jetpack/related-posts /-->';
		$path    = get_temp_dir() . 'jp-related-posts-pattern.php';
		file_put_contents( $path, $content ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_put_contents_file_put_contents

		$this->assertSame( array(), $this->hooked( $this->template( 'single', $content ) ) );
		$this->assertSame(
			array(),
			$this->hooked(
				array(
					'content'       => $content,
					'templateTypes' => array( 'single' ),
				)
			)
		);
		$this->assertSame(
			array(),
			$this->hooked(
				array(
					'filePath'      => $path,
					'templateTypes' => array( 'single' ),
				)
			)
		);

		unlink( $path );
	}

	/**
	 * Cases for the module options mapped to block attributes.
	 */
	public function provide_options() {
		return array(
			'defaults'    => array(
				array(),
				array(
					'postLayout'        => 'grid',
					'displayDate'       => true,
					'displayThumbnails' => false,
					'displayContext'    => true,
					'postsToShow'       => 3,
				),
				'Related',
			),
			'customized'  => array(
				array(
					'layout'          => 'list',
					'show_date'       => false,
					'show_thumbnails' => true,
					'show_context'    => false,
					'size'            => 5,
					'headline'        => 'More to read',
				),
				array(
					'postLayout'        => 'list',
					'displayDate'       => false,
					'displayThumbnails' => true,
					'displayContext'    => false,
					'postsToShow'       => 5,
				),
				'More to read',
			),
			'no headline' => array(
				array( 'show_headline' => false ),
				array(
					'postLayout'        => 'grid',
					'displayDate'       => true,
					'displayThumbnails' => false,
					'displayContext'    => true,
					'postsToShow'       => 3,
				),
				null,
			),
		);
	}

	/**
	 * @dataProvider provide_options
	 *
	 * @param array       $options  Stored options.
	 * @param array       $expected Expected block attributes.
	 * @param string|null $headline Expected headline, if any.
	 */
	public function test_builds_block_from_options( $options, $expected, $headline ) {
		Jetpack_Options::update_option( 'relatedposts', $options );

		$block = Jetpack_RelatedPosts_Hooked_Block::build_block(
			array(
				'blockName'    => 'jetpack/related-posts',
				'attrs'        => array(),
				'innerBlocks'  => array(),
				'innerHTML'    => '',
				'innerContent' => array(),
			),
			'jetpack/related-posts',
			'after',
			array( 'blockName' => 'core/post-content' )
		);

		$this->assertSame( $expected, $block['attrs'] );

		if ( null === $headline ) {
			$this->assertSame( array(), $block['innerBlocks'] );
		} else {
			$this->assertSame( 'core/heading', $block['innerBlocks'][0]['blockName'] );
			$this->assertStringContainsString( $headline, $block['innerBlocks'][0]['innerHTML'] );
		}
	}
}
