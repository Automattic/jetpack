<?php
/**
 * Post List Page class.
 *
 * @package automattic/jetpack-publicize
 */

namespace Automattic\Jetpack\Publicize;

use Automattic\Jetpack\Assets;
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
		add_action( 'admin_footer', array( $this, 'render_share_post_root' ) );
		add_filter( 'post_row_actions', array( $this, 'append_share_post_action' ), 10, 2 );
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_admin_scripts' ) );
	}

	/**
	 * Whether to add share button to a post.
	 *
	 * @return boolean True if the criteria are met.
	 */
	public function should_render_on_page() {

		$screen = get_current_screen();

		// $screen->id can be 'edit-post' or 'edit-jetpack-social-note' etc.
		$is_post_list_page = 'edit-' . $screen->post_type === $screen->id;

		if ( ! $is_post_list_page || ! post_type_supports( $screen->post_type, 'publicize' ) ) {
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
	public function should_render_for_post( WP_Post $post ) {
		return $this->should_render_on_page() && 'publish' === $post->post_status;
	}

	/**
	 * Add "Share" action to posts.
	 *
	 * @param array   $actions Array of actions.
	 * @param WP_Post $post Post object.
	 * @return array
	 */
	public function append_share_post_action( array $actions, WP_Post $post ) {

		if ( $this->should_render_for_post( $post ) ) {

			$actions['jetpack-social-share-post'] = sprintf(
				'<a href="#" data-postid="%1$s" class="%2$s">%3$s</a>',
				$post->ID,
				'jetpack-social-share-post-action',
				esc_html__( 'Share', 'jetpack-publicize-pkg' )
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
		if ( ! $this->should_render_on_page() ) {
			return;
		}
		?>
			<div id="jetpack-social-share-post-root"></div>
		<?php
	}

	/**
	 * Enqueue admin scripts and styles.
	 */
	public function enqueue_admin_scripts() {
		if ( ! $this->should_render_on_page() ) {
			return;
		}

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
