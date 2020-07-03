<?php
/**
 * Module Name: Comment Likes
 * Module Description: Increase visitor engagement by adding a Like button to comments.
 * Sort Order: 39
 * Recommendation Order: 17
 * First Introduced: 5.1
 * Requires Connection: Yes
 * Auto Activate: No
 * Module Tags: Social
 * Additional Search Queries: like widget, like button, like, likes
 */

use Automattic\Jetpack\Assets;

Assets::add_resource_hint( '//widgets.wp.com', 'dns-prefetch' );

require_once dirname( __FILE__ ) . '/likes/jetpack-likes-master-iframe.php';
require_once dirname( __FILE__ ) . '/likes/jetpack-likes-settings.php';

class Jetpack_Comment_Likes {

	public static function init() {
		static $instance = NULL;

		if ( ! $instance ) {
			$instance = new Jetpack_Comment_Likes();
		}

		return $instance;
	}

	private function __construct() {
		$this->settings  = new Jetpack_Likes_Settings();
		$this->blog_id   = Jetpack_Options::get_option( 'id' );
		$this->url       = home_url();
		$this->url_parts = wp_parse_url( $this->url );
		$this->domain    = $this->url_parts['host'];

		add_action( 'template_redirect', array( $this, 'frontend_init' ) );
		add_action( 'admin_init', array( $this, 'admin_init' ) );

		if ( ! Jetpack::is_module_active( 'likes' ) ) {
			$active = Jetpack::get_active_modules();

			if ( ! in_array( 'sharedaddy', $active ) && ! in_array( 'publicize', $active ) ) {
				// we don't have a sharing page yet
				add_action( 'admin_menu', array( $this->settings, 'sharing_menu' ) );
			}

			if ( in_array( 'publicize', $active ) && ! in_array( 'sharedaddy', $active ) ) {
				// we have a sharing page but not the global options area
				add_action( 'pre_admin_screen_sharing', array( $this->settings, 'sharing_block' ), 20 );
				add_action( 'pre_admin_screen_sharing', array( $this->settings, 'updated_message' ), -10 );
			}

			if( ! in_array( 'sharedaddy', $active ) ) {
				add_action( 'admin_init', array( $this->settings, 'process_update_requests_if_sharedaddy_not_loaded' ) );
				add_action( 'sharing_global_options', array( $this->settings, 'admin_settings_showbuttonon_init' ), 19 );
				add_action( 'sharing_admin_update', array( $this->settings, 'admin_settings_showbuttonon_callback' ), 19 );
				add_action( 'admin_init', array( $this->settings, 'add_meta_box' ) );
			} else {
				add_filter( 'sharing_meta_box_title', array( $this->settings, 'add_likes_to_sharing_meta_box_title' ) );
				add_action( 'start_sharing_meta_box_content', array( $this->settings, 'meta_box_content' ) );
			}

			add_action( 'save_post', array( $this->settings, 'meta_box_save' ) );
			add_action( 'edit_attachment', array( $this->settings, 'meta_box_save' ) );
			add_action( 'sharing_global_options', array( $this->settings, 'admin_settings_init' ), 20 );
			add_action( 'sharing_admin_update',   array( $this->settings, 'admin_settings_callback' ), 20 );
		}
	}

	public function admin_init() {
		add_filter( 'manage_edit-comments_columns', array( $this, 'add_like_count_column' ) );
		add_action( 'manage_comments_custom_column', array( $this, 'comment_likes_edit_column' ), 10, 2 );
		add_action( 'admin_print_styles-edit-comments.php', array( $this, 'enqueue_admin_styles_scripts' ) );
	}

	public function comment_likes_edit_column( $column_name, $comment_id ) {
		if ( 'comment_likes' !== $column_name ) {
			return;
		}

		$permalink = get_permalink( get_the_ID() );
		?>
		<a
		   data-comment-id="<?php echo absint( $comment_id ); ?>"
		   data-blog-id="<?php echo absint( $this->blog_id ); ?>"
		   class="comment-like-count"
		   id="comment-like-count-<?php echo absint( $comment_id ); ?>"
		   href="<?php echo esc_url( $permalink ); ?>#comment-<?php echo absint( $comment_id ); ?>"
		>
			<span class="like-count">0</span>
		</a>
		<?php
	}

	function enqueue_admin_styles_scripts() {
		wp_enqueue_style( 'comment-like-count', plugins_url( 'comment-likes/admin-style.css', __FILE__ ), array(), JETPACK__VERSION );
		wp_enqueue_script(
			'comment-like-count',
			Assets::get_file_url_for_environment(
				'_inc/build/comment-likes/comment-like-count.min.js',
				'modules/comment-likes/comment-like-count.js'
			),
			array( 'jquery' ),
			JETPACK__VERSION
		);
	}

	public function add_like_count_column( $columns ) {
		$columns['comment_likes'] = '<span class="vers"></span>';

		return $columns;
	}

	public function frontend_init() {
		if ( Jetpack_AMP_Support::is_amp_request() ) {
			return;
		}

		add_action( 'wp_enqueue_scripts', array( $this, 'load_styles_register_scripts' ) );
		add_filter( 'comment_text', array( $this, 'comment_likes' ), 10, 2 );
	}

	public function load_styles_register_scripts() {
		if ( ! $this->settings->is_likes_visible() ) {
			return;
		}

		if ( ! wp_style_is( 'open-sans', 'registered' ) ) {
			wp_register_style( 'open-sans', 'https://fonts.googleapis.com/css?family=Open+Sans', array(), JETPACK__VERSION );
		}
		wp_enqueue_style( 'jetpack_likes', plugins_url( 'likes/style.css', __FILE__ ), array( 'open-sans' ), JETPACK__VERSION );
		wp_enqueue_script(
			'postmessage',
			Assets::get_file_url_for_environment( '_inc/build/postmessage.min.js', '_inc/postmessage.js' ),
			array( 'jquery' ),
			JETPACK__VERSION,
			true
		);
		wp_enqueue_script(
			'jetpack_resize',
			Assets::get_file_url_for_environment(
				'_inc/build/jquery.jetpack-resize.min.js',
				'_inc/jquery.jetpack-resize.js'
			),
			array( 'jquery' ),
			JETPACK__VERSION,
			true
		);
		wp_enqueue_script( 'jetpack_likes_queuehandler', plugins_url( 'likes/queuehandler.js' , __FILE__ ), array( 'jquery', 'postmessage', 'jetpack_resize' ), JETPACK__VERSION, true );
	}

	public function comment_likes( $content, $comment = null ) {
		if ( empty( $comment ) ) {
			return $content;
		}

		if ( ! $this->settings->is_likes_visible() ) {
			return $content;
		}

		$comment_id = get_comment_ID();
		if ( empty( $comment_id ) && ! empty( $comment->comment_ID ) ) {
			$comment_id = $comment->comment_ID;
		}

		if ( empty( $content ) || empty( $comment_id ) ) {
			return $content;
		}

		// In case master iframe hasn't been loaded. This could be the case when Post Likes module is disabled,
		// or on pages on which we have comments but post likes are disabled.
		if ( false === has_action( 'wp_footer', 'jetpack_likes_master_iframe' ) ) {
			add_action( 'wp_footer', 'jetpack_likes_master_iframe', 21 );
		}

		$uniqid = uniqid();

		$src     = sprintf( 'https://widgets.wp.com/likes/#blog_id=%1$d&amp;comment_id=%2$d&amp;origin=%3$s&amp;obj_id=%1$d-%2$d-%4$s', $this->blog_id, $comment_id, $this->domain, $uniqid );
		$name    = sprintf( 'like-comment-frame-%1$d-%2$d-%3$s', $this->blog_id, $comment_id, $uniqid );
		$wrapper = sprintf( 'like-comment-wrapper-%1$d-%2$d-%3$s', $this->blog_id, $comment_id, $uniqid );

		$html = '';
		$html .= "<div class='jetpack-comment-likes-widget-wrapper jetpack-likes-widget-unloaded' id='$wrapper' data-src='$src' data-name='$name'>";
		$html .= "<div class='likes-widget-placeholder comment-likes-widget-placeholder comment-likes'><span class='loading'>" . esc_html__( 'Loading...', 'jetpack' ) . "</span></div>";
		$html .= "<div class='comment-likes-widget jetpack-likes-widget comment-likes'><span class='comment-like-feedback'></span>";
		$html .= "<span class='sd-text-color'></span><a class='sd-link-color'></a>";
		$html .= '</div></div>';

		/**
		 * Filters the Comment Likes button content.
		 *
		 * @module comment-likes
		 *
		 * @since 5.1.0
		 *
		 * @param string $html Comment Likes button content.
		 */
		$like_button = apply_filters( 'comment_like_button', $html );

		return $content . $like_button;
	}
}

Jetpack_Comment_Likes::init();
