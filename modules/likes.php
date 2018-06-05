<?php
/**
 * Module Name: Likes
 * Module Description: Give visitors an easy way to show they appreciate your content.
 * First Introduced: 2.2
 * Sort Order: 23
 * Requires Connection: Yes
 * Auto Activate: No
 * Module Tags: Social
 * Feature: Engagement
 * Additional Search Queries: like, likes, wordpress.com
 */

Jetpack::dns_prefetch( array(
	'//widgets.wp.com',
	'//s0.wp.com',
	'//0.gravatar.com',
	'//1.gravatar.com',
	'//2.gravatar.com',
) );

include_once dirname( __FILE__ ) . '/likes/jetpack-likes-master-iframe.php';
include_once dirname( __FILE__ ) . '/likes/jetpack-likes-settings.php';

class Jetpack_Likes {
	public static function init() {
		static $instance = NULL;

		if ( ! $instance ) {
			$instance = new Jetpack_Likes;
		}

		return $instance;
	}

	function __construct() {
		$this->in_jetpack = ( defined( 'IS_WPCOM' ) && IS_WPCOM ) ? false : true;
		$this->settings = new Jetpack_Likes_Settings();

		add_action( 'init', array( &$this, 'action_init' ) );
		add_action( 'admin_init', array( $this, 'admin_init' ) );

		if ( $this->in_jetpack ) {
			add_action( 'jetpack_activate_module_likes',   array( $this, 'set_social_notifications_like' ) );
			add_action( 'jetpack_deactivate_module_likes', array( $this, 'delete_social_notifications_like' ) );

			Jetpack::enable_module_configurable( __FILE__ );
			Jetpack::module_configuration_load( __FILE__, array( $this, 'configuration_redirect' ) );

			add_action( 'admin_print_scripts-settings_page_sharing', array( &$this, 'load_jp_css' ) );
			add_filter( 'sharing_show_buttons_on_row_start', array( $this, 'configuration_target_area' ) );

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
		} else { // wpcom
			add_action( 'wpmu_new_blog', array( $this, 'enable_comment_likes' ), 10, 1 );
			add_action( 'admin_init', array( $this->settings, 'add_meta_box' ) );
			add_action( 'end_likes_meta_box_content', array( $this->settings, 'sharing_meta_box_content' ) );
			add_filter( 'likes_meta_box_title', array( $this->settings, 'add_likes_to_sharing_meta_box_title' ) );
		}

		add_action( 'admin_init', array( $this, 'admin_discussion_likes_settings_init' ) ); // Likes notifications

		add_action( 'admin_bar_menu', array( $this, 'admin_bar_likes' ), 60 );

		add_action( 'wp_enqueue_scripts', array( $this, 'load_styles_register_scripts' ) );

		add_action( 'save_post', array( $this->settings, 'meta_box_save' ) );
		add_action( 'edit_attachment', array( $this->settings, 'meta_box_save' ) );
		add_action( 'sharing_global_options', array( $this->settings, 'admin_settings_init' ), 20 );
		add_action( 'sharing_admin_update',   array( $this->settings, 'admin_settings_callback' ), 20 );
	}

	/**
	 * Set the social_notifications_like option to `on` when the Likes module is activated.
	 *
	 * @since 3.7.0
	 *
	 * @return null
	 */
	function set_social_notifications_like() {
		update_option( 'social_notifications_like', 'on' );
	}

	/**
	 * Delete the social_notifications_like option that was set to `on` on module activation.
	 *
	 * @since 3.7.0
	 *
	 * @return null
	 */
	function delete_social_notifications_like() {
		delete_option( 'social_notifications_like' );
	}

	/**
	 * Redirects to the likes section of the sharing page.
	 */
	function configuration_redirect() {
		wp_safe_redirect( admin_url( 'options-general.php?page=sharing#likes' ) );
		die();
	}

	/**
	 * Loads Jetpack's CSS on the sharing page so we can use .jetpack-targetable
	 */
	function load_jp_css() {
		// Do we really need `admin_styles`? With the new admin UI, it's breaking some bits.
		// Jetpack::init()->admin_styles();
	}

	/**
	 * Load scripts and styles for front end.
	 * @return null
	 */
	function load_styles_register_scripts() {
		if ( $this->in_jetpack ) {
			wp_enqueue_style( 'jetpack_likes', plugins_url( 'likes/style.css', __FILE__ ), array(), JETPACK__VERSION );
			$this->register_scripts();
		}
	}


	/**
     * Stub for is_post_likeable, since some wpcom functions call this directly on the class
	 * Are likes enabled for this post?
     *
     * @param int $post_id
     * @return bool
	 */
	static function is_post_likeable( $post_id = 0 ) {
		_deprecated_function( __METHOD__, 'jetpack-5.4', 'Jetpack_Likes_Settings()->is_post_likeable' );
		$settings = new Jetpack_Likes_Settings();
		return $settings->is_post_likeable();
	}

	/**
	 * Stub for is_likes_visible, since some themes were calling it directly from this class
	 *
	 * @deprecated 5.4
	 * @return bool
	 */
	function is_likes_visible() {
		_deprecated_function( __METHOD__, 'jetpack-5.4', 'Jetpack_Likes_Settings()->is_likes_visible' );

		$settings = new Jetpack_Likes_Settings();
		return $settings->is_likes_visible();
	}

	/**
	 * Adds in the jetpack-targetable class so when we visit sharing#likes our like settings get highlighted by a yellow box
	 * @param  string $html row heading for the sharedaddy "which page" setting
	 * @return string       html with the jetpack-targetable class and likes id. tbody gets closed after the like settings
	 */
	function configuration_target_area( $html = '' ) {
		$html = "<tbody id='likes' class='jetpack-targetable'>" . $html;
		return $html;
	}

	/**
	  * Options to be added to the discussion page (see also admin_settings_init, etc below for Sharing settings page)
	  */

	function admin_discussion_likes_settings_init() {
		// Add a temporary section, until we can move the setting out of there and with the rest of the email notification settings
		add_settings_section( 'likes-notifications', __( 'Likes Notifications', 'jetpack' ), array( $this, 'admin_discussion_likes_settings_section' ), 'discussion' );
		add_settings_field( 'social-notifications', __( 'Email me whenever', 'jetpack' ), array( $this, 'admin_discussion_likes_settings_field' ), 'discussion', 'likes-notifications' );
		// Register the setting
		register_setting( 'discussion', 'social_notifications_like', array( $this, 'admin_discussion_likes_settings_validate' ) );
	}

	function admin_discussion_likes_settings_section() {
		// Atypical usage here.  We emit jquery to move likes notification checkbox to be with the rest of the email notification settings
?>
	<script type="text/javascript">
	jQuery( function( $ )  {
		var table = $( '#social_notifications_like' ).parents( 'table:first' ),
			header = table.prevAll( 'h2:first' ),
			newParent = $( '#moderation_notify' ).parent( 'label' ).parent();

		if ( !table.length || !header.length || !newParent.length ) {
			return;
		}

		newParent.append( '<br/>' ).append( table.end().parent( 'label' ).siblings().andSelf() );
		header.remove();
		table.remove();
	} );
	</script>
<?php
	}

	function admin_likes_get_option( $option ) {
		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			$option_setting = get_blog_option( get_current_blog_id(), $option, 'on' );
		} else {
			$option_setting = get_option( $option, 'on' );
		}

		return intval( 'on' == $option_setting );
	}

	function admin_discussion_likes_settings_field() {
		$like = $this->admin_likes_get_option( 'social_notifications_like' );
?>
		<label><input type="checkbox" id="social_notifications_like" name="social_notifications_like" value="1" <?php checked( $like ); ?> /> <?php esc_html_e( 'Someone likes one of my posts', 'jetpack' ); ?></label>
<?php
	}

	function admin_discussion_likes_settings_validate( $input ) {
		// If it's not set (was unchecked during form submission) or was set to off (during option update), return 'off'.
		if ( !$input || 'off' == $input )
			return 'off';

		// Otherwise, return 'on'.
		return 'on';
	}

	function admin_init() {
		add_filter( 'manage_posts_columns', array( $this, 'add_like_count_column' ) );
		add_filter( 'manage_pages_columns', array( $this, 'add_like_count_column' ) );
		add_action( 'manage_posts_custom_column', array( $this, 'likes_edit_column' ), 10, 2 );
		add_action( 'manage_pages_custom_column', array( $this, 'likes_edit_column' ), 10, 2 );
		add_action( 'admin_print_styles-edit.php', array( $this, 'load_admin_css' ) );
		add_action( "admin_print_scripts-edit.php", array( $this, 'enqueue_admin_scripts' ) );
	}

	function action_init() {
		if ( is_admin() ) {
			return;
		}

		if ( ( defined( 'XMLRPC_REQUEST' ) && XMLRPC_REQUEST ) ||
			 ( defined( 'APP_REQUEST' ) && APP_REQUEST ) ||
			 ( defined( 'REST_API_REQUEST' ) && REST_API_REQUEST ) ||
			 ( defined( 'COOKIE_AUTH_REQUEST' ) && COOKIE_AUTH_REQUEST ) ||
			 ( defined( 'JABBER_SERVER' ) && JABBER_SERVER ) ) {
			return;
		}

		if ( Jetpack_AMP_Support::is_amp_request() ) {
			return;
		}

		if ( $this->in_jetpack ) {
			add_filter( 'the_content', array( &$this, 'post_likes' ), 30, 1 );
			add_filter( 'the_excerpt', array( &$this, 'post_likes' ), 30, 1 );

		} else {
			add_filter( 'post_flair', array( &$this, 'post_likes' ), 30, 1 );
			add_filter( 'post_flair_block_css', array( $this, 'post_flair_service_enabled_like' ) );

			wp_enqueue_script( 'postmessage', '/wp-content/js/postmessage.js', array( 'jquery' ), JETPACK__VERSION, false );
			wp_enqueue_script( 'jetpack_resize', '/wp-content/js/jquery/jquery.jetpack-resize.js', array( 'jquery' ), JETPACK__VERSION, false );
			wp_enqueue_script( 'jetpack_likes_queuehandler', plugins_url( 'queuehandler.js' , __FILE__ ), array( 'jquery', 'postmessage', 'jetpack_resize' ), JETPACK__VERSION, true );
			wp_enqueue_style( 'jetpack_likes', plugins_url( 'jetpack-likes.css', __FILE__ ), array(), JETPACK__VERSION );
		}
	}

	/**
	* Register scripts
	*/
	function register_scripts() {
		wp_register_script(
			'postmessage',
			Jetpack::get_file_url_for_environment( '_inc/build/postmessage.min.js', '_inc/postmessage.js' ),
			array( 'jquery' ),
			JETPACK__VERSION,
			false
		);
		wp_register_script(
			'jetpack_resize',
			Jetpack::get_file_url_for_environment(
				'_inc/build/jquery.jetpack-resize.min.js',
				'_inc/jquery.jetpack-resize.js'
			),
			array( 'jquery' ),
			JETPACK__VERSION,
			false
		);
		wp_register_script(
			'jetpack_likes_queuehandler',
			Jetpack::get_file_url_for_environment(
				'_inc/build/likes/queuehandler.min.js',
				'modules/likes/queuehandler.js'
			),
			array( 'jquery', 'postmessage', 'jetpack_resize' ),
			JETPACK__VERSION,
			true
		);
	}

	/**
	* Load the CSS needed for the wp-admin area.
	*/
	function load_admin_css() {
	?>
		<style type="text/css">
			.vers img { display: none; }
			.metabox-prefs .vers img { display: inline; }
			.fixed .column-likes { width: 5.5em; padding: 8px 0; text-align: left; }
			.fixed .column-stats { width: 5em; }
			.fixed .column-likes .post-com-count {
				-webkit-box-sizing: border-box;
				-moz-box-sizing: border-box;
				box-sizing: border-box;
				display: inline-block;
				padding: 0 8px;
				height: 2em;
				margin-top: 5px;
				-webkit-border-radius: 5px;
				border-radius: 5px;
				background-color: #72777C;
				color: #FFF;
				font-size: 11px;
				line-height: 21px;
			}
			.fixed .column-likes .post-com-count::after { border: none !important; }
			.fixed .column-likes .post-com-count:hover { background-color: #0073AA; }
			.fixed .column-likes .vers:before {
				font: normal 20px/1 dashicons;
				content: '\f155';
				speak: none;
				-webkit-font-smoothing: antialiased;
				-moz-osx-font-smoothing: grayscale;
			}
			@media screen and (max-width: 782px) {
				.fixed .column-likes {
					display: none;
				}
			}
		</style>
		<?php
	}

	/**
	* Load the JS required for loading the like counts.
	*/
	function enqueue_admin_scripts() {
		if ( empty( $_GET['post_type'] ) || 'post' == $_GET['post_type'] || 'page' == $_GET['post_type'] ) {
			if ( $this->in_jetpack ) {
				wp_enqueue_script(
					'likes-post-count',
					Jetpack::get_file_url_for_environment(
						'_inc/build/likes/post-count.min.js',
						'modules/likes/post-count.js'
					),
					array( 'jquery' ),
					JETPACK__VERSION
				);
				wp_enqueue_script(
					'likes-post-count-jetpack',
					Jetpack::get_file_url_for_environment(
						'_inc/build/likes/post-count-jetpack.min.js',
						'modules/likes/post-count-jetpack.js'
					),
					array( 'likes-post-count' ),
					JETPACK__VERSION
				);
			} else {
				wp_enqueue_script( 'jquery.wpcom-proxy-request', "/wp-content/js/jquery/jquery.wpcom-proxy-request.js", array('jquery'), NULL, true );
				wp_enqueue_script( 'likes-post-count', plugins_url( 'likes/post-count.js', dirname( __FILE__ ) ), array( 'jquery' ), JETPACK__VERSION );
				wp_enqueue_script( 'likes-post-count-wpcom', plugins_url( 'likes/post-count-wpcom.js', dirname( __FILE__ ) ), array( 'likes-post-count', 'jquery.wpcom-proxy-request' ), JETPACK__VERSION );
			}
		}
	}

	/**
	* Add "Likes" column data to the post edit table in wp-admin.
	*
	* @param string $column_name
	* @param int $post_id
	*/
	function likes_edit_column( $column_name, $post_id ) {
		if ( 'likes' == $column_name ) {

			if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
				$blog_id = get_current_blog_id();
			} else {
				$blog_id = Jetpack_Options::get_option( 'id' );
			}

			$permalink = get_permalink( get_the_ID() ); ?>
			<a title="" data-post-id="<?php echo (int) $post_id; ?>" class="post-com-count post-like-count" id="post-like-count-<?php echo (int) $post_id; ?>" data-blog-id="<?php echo (int) $blog_id; ?>" href="<?php echo esc_url( $permalink ); ?>#like-<?php echo (int) $post_id; ?>">
				<span class="comment-count">0</span>
			</a>
			<?php
		}
	}

	/**
	* Add a "Likes" column header to the post edit table in wp-admin.
	*
	* @param array $columns
	* @return array
	*/
	function add_like_count_column( $columns ) {
		$date = $columns['date'];
		unset( $columns['date'] );

		$columns['likes'] = '<span class="vers"><img title="' . esc_attr__( 'Likes', 'jetpack' ) . '" alt="' . esc_attr__( 'Likes', 'jetpack' ) . '" src="//s0.wordpress.com/i/like-grey-icon.png" /></span>';
		$columns['date'] = $date;

		return $columns;
	}

	function post_likes( $content ) {
		$post_id = get_the_ID();

		if ( ! is_numeric( $post_id ) || ! $this->settings->is_likes_visible() )
			return $content;

		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			$blog_id = get_current_blog_id();
			$bloginfo = get_blog_details( (int) $blog_id );
			$domain = $bloginfo->domain;
		} else {
			$blog_id = Jetpack_Options::get_option( 'id' );
			$url = home_url();
			$url_parts = parse_url( $url );
			$domain = $url_parts['host'];
		}
		// make sure to include the scripts before the iframe otherwise weird things happen
		add_action( 'wp_footer', 'jetpack_likes_master_iframe', 21 );

		/**
		* if the same post appears more then once on a page the page goes crazy
		* we need a slightly more unique id / name for the widget wrapper.
		*/
		$uniqid = uniqid();

		$src = sprintf( 'https://widgets.wp.com/likes/#blog_id=%1$d&amp;post_id=%2$d&amp;origin=%3$s&amp;obj_id=%1$d-%2$d-%4$s', $blog_id, $post_id, $domain, $uniqid );
		$name = sprintf( 'like-post-frame-%1$d-%2$d-%3$s', $blog_id, $post_id, $uniqid );
		$wrapper = sprintf( 'like-post-wrapper-%1$d-%2$d-%3$s', $blog_id, $post_id, $uniqid );
		$headline = sprintf(
			/** This filter is already documented in modules/sharedaddy/sharing-service.php */
			apply_filters( 'jetpack_sharing_headline_html', '<h3 class="sd-title">%s</h3>', esc_html__( 'Like this:', 'jetpack' ), 'likes' ),
			esc_html__( 'Like this:', 'jetpack' )
		);

		$html  = "<div class='sharedaddy sd-block sd-like jetpack-likes-widget-wrapper jetpack-likes-widget-unloaded' id='$wrapper' data-src='$src' data-name='$name'>";
		$html .= $headline;
		$html .= "<div class='likes-widget-placeholder post-likes-widget-placeholder' style='height: 55px;'><span class='button'><span>" . esc_html__( 'Like', 'jetpack' ) . '</span></span> <span class="loading">' . esc_html__( 'Loading...', 'jetpack' ) . '</span></div>';
		$html .= "<span class='sd-text-color'></span><a class='sd-link-color'></a>";
		$html .= '</div>';

		// Let's make sure that the script is enqueued
		wp_enqueue_script( 'jetpack_likes_queuehandler' );

		return $content . $html;
	}

	function post_flair_service_enabled_like( $classes ) {
		$classes[] = 'sd-like-enabled';
		return $classes;
	}

	function is_admin_bar_button_visible() {
		global $wp_admin_bar;

		if ( ! is_object( $wp_admin_bar ) )
			return false;

		if ( ( ! is_singular( 'post' ) && ! is_attachment() && ! is_page() ) )
			return false;

		if ( ! $this->settings->is_likes_visible() )
			return false;

		if ( ! $this->settings->is_post_likeable() )
			return false;

		/**
		 * Filters whether the Like button is enabled in the admin bar.
		 *
		 * @module likes
		 *
		 * @since 2.2.0
		 *
		 * @param bool true Should the Like button be visible in the Admin bar. Default to true.
		 */
		return (bool) apply_filters( 'jetpack_admin_bar_likes_enabled', true );
	}

	function admin_bar_likes() {
		global $wp_admin_bar;

		$post_id = get_the_ID();

		if ( ! is_numeric( $post_id ) || ! $this->is_admin_bar_button_visible() ) {
			return;
		}

		$protocol = 'http';
		if ( is_ssl() )
			$protocol = 'https';

		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			$blog_id = get_current_blog_id();
			$bloginfo = get_blog_details( (int) $blog_id );
			$domain = $bloginfo->domain;
		} else {
			$blog_id = Jetpack_Options::get_option( 'id' );
			$url = home_url();
			$url_parts = parse_url( $url );
			$domain = $url_parts['host'];
		}
		// make sure to include the scripts before the iframe otherwise weird things happen
		add_action( 'wp_footer', 'jetpack_likes_master_iframe', 21 );

		$src = sprintf( 'https://widgets.wp.com/likes/#blog_id=%2$d&amp;post_id=%3$d&amp;origin=%1$s://%4$s', $protocol, $blog_id, $post_id, $domain );

		$html = "<iframe class='admin-bar-likes-widget jetpack-likes-widget' scrolling='no' frameBorder='0' name='admin-bar-likes-widget' src='$src'></iframe>";

		$node = array(
				'id'   => 'admin-bar-likes-widget',
				'meta' => array(
							'html' => $html
				)
		);

		$wp_admin_bar->add_node( $node );
	}
}

Jetpack_Likes::init();
