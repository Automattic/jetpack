<?php
/**
 * Post List Page class.
 *
 * @package automattic/jetpack-publicize
 */

namespace Automattic\Jetpack\Publicize;

use Automattic\Jetpack\Assets;
use Automattic\Jetpack\Current_Plan;
use WP_Post;

/**
 * The class to handle the Post List Page.
 */
class Post_List_Page {

	/**
	 * The instance of the class.
	 *
	 * @var Post_List_Page
	 */
	private static $instance;

	/**
	 * Initialize the class.
	 *
	 * @return Post_List_Page
	 */
	public static function init(): Post_List_Page {
		if ( ! isset( self::$instance ) ) {
			self::$instance = new self();
		}

		return self::$instance;
	}

	/**
	 * The constructor.
	 */
	private function __construct() {
		if ( ! Publicize_Script_Data::has_feature_flag( 'post-list-ui' ) ) {
			return;
		}
		add_action( 'current_screen', array( $this, 'setup' ) );
	}

	/**
	 * Setup the actions and filters.
	 */
	public function setup() {

		if ( ! self::should_render_on_page() ) {
			return;
		}

		add_action( 'admin_footer', array( $this, 'render_share_post_root' ) );
		add_filter( 'post_row_actions', array( $this, 'append_share_post_action' ), 10, 2 );
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_admin_scripts' ) );
	}

	/**
	 * Whether to add share button to a post.
	 *
	 * @return boolean True if the criteria are met.
	 */
	public static function should_render_on_page() {

		$screen = get_current_screen();

		// $screen->id can be 'edit-post' or 'edit-jetpack-social-note' etc.
		$is_post_list_page = 'edit-' . $screen->post_type === $screen->id;

		if ( ! $is_post_list_page || ! post_type_supports( $screen->post_type, 'publicize' ) ) {
			return false;
		}

		if ( ! Current_Plan::supports( 'republicize' ) ) {
			return false;
		}

		/** This filter is documented in projects/packages/publicize/src/class-publicize-base.php */
		$capability = apply_filters( 'jetpack_publicize_capability', 'publish_posts' );

		return current_user_can( $capability );
	}

	/**
	 * Whether to add share button to a post.
	 *
	 * @param WP_Post $post Post object.
	 *
	 * @return boolean True if the criteria are met.
	 */
	public static function should_render_for_post( WP_Post $post ) {
		return 'publish' === $post->post_status;
	}

	/**
	 * Add "Share" action to posts.
	 *
	 * @param array   $actions Array of actions.
	 * @param WP_Post $post Post object.
	 * @return array
	 */
	public function append_share_post_action( array $actions, WP_Post $post ) {

		if ( self::should_render_for_post( $post ) ) {

			$url   = add_query_arg( 'jetpack-editor-action', 'share_post', get_edit_post_link( $post->ID, 'raw' ) );
			$text  = _x( 'Share', 'Share the post on social networks', 'jetpack-publicize-pkg' );
			$title = _draft_or_post_title( $post );
			/* translators: post title */
			$aria_label = sprintf( _x( 'Share "%s" via Jetpack Social.', 'Share the post with the given title.', 'jetpack-publicize-pkg' ), $title );

			$actions['jetpack-social-share-post'] = sprintf(
				'<a href="%1$s" data-post-id="%2$s" class="%3$s" aria-label="%4$s">%5$s</a>',
				esc_url( $url ),
				$post->ID,
				'jetpack-social-share-post-action',
				esc_html( $aria_label ),
				esc_html( $text )
			);
		}

		return $actions;
	}

	/**
	 * Render share post root element.
	 *
	 * @return void
	 */
	public function render_share_post_root() {
		?>
			<div id="jetpack-social-share-post-root"></div>
		<?php
	}

	/**
	 * Enqueue admin scripts and styles.
	 */
	public function enqueue_admin_scripts() {
		Assets::register_script(
			'jetpack-social-post-list-page',
			'../build/post-list-page.js',
			__FILE__,
			array(
				'in_footer'  => true,
				'textdomain' => 'jetpack-publicize-pkg',
				'enqueue'    => true,
			)
		);
	}
}
