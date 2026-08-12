<?php
/**
 * Verbum block editor.
 *
 * @package automattic/jetpack-verbum
 */

declare( strict_types = 1 );

namespace Automattic\Jetpack\Verbum\Blocks;

/**
 * Editor is responsible for loading the block editor for comments.
 *
 * This loads the isolated editor, and sets up the editor to be used for the comment form.
 *
 * @see https://github.com/Automattic/isolated-block-editor
 *
 * @phan-constructor-used-for-side-effects
 */
class Editor {
	/**
	 * Comment forms can appear anywhere (page, post, query loop, etc), there is no reliable way to determine if there are comments on the page,
	 * So we hook into `comment_form_before` and set this flag to true when a comment form is found.
	 *
	 * @var bool
	 */
	public $should_enqueue_assets = false;

	/**
	 * Class constructor
	 */
	public function __construct() {
		define( 'VERBUM_USING_GUTENBERG', true );

		// Override the placeholder text
		add_filter(
			'write_your_story',
			function () {
				return __( 'Write a comment...', 'jetpack-verbum' );
			},
			9999
		);

		add_action(
			'comment_form_before',
			function () {
				$this->should_enqueue_assets = true;
			}
		);

		add_filter( 'init', array( $this, 'remove_strict_kses_filters' ) );
		add_filter( 'wp_enqueue_scripts', array( $this, 'enqueue_assets' ) );
		add_filter( 'comment_text', array( Utils::class, 'render_verbum_blocks' ) );
		add_filter( 'pre_comment_content', array( Utils::class, 'remove_blocks' ) );
	}

	/**
	 * Default KSES filters on wpcom only allow HTML for admins and people who can post "posts" to the blog they're commenting on.
	 * See: wp-includes/kses.php (this one adds the restrictions).
	 * See: wp-content/mu-plugins/misc.php (this one removes it, but only has_cap('publish_posts')).
	 */
	public function remove_strict_kses_filters() {
		// Allow HTML when blocks are enabled.
		remove_filter( 'pre_comment_content', 'wp_filter_kses' );
		add_filter( 'pre_comment_content', 'wp_filter_post_kses' );
	}

	/**
	 * Enqueue the assets for the block editor
	 *
	 * In case the page is singular and has comment closed or front page with comments closed we avoid the enqueueing
	 */
	public function enqueue_assets() {
		if ( ! Utils::should_show_verbum_comments() && ! $this->should_enqueue_assets ) {
			return;
		}

		Editor_Assets::load_editor_supporting_assets(); // Editor itself is loaded dynamically
	}
}
