<?php
/**
 * Module Name: Likes
 * Module Description: Give visitors an easy way to show their appreciation for your content.
 * First Introduced: 2.2
 * Sort Order: 23
 * Requires Connection: Yes
 * Auto Activate: No
 * Module Tags: Social
 */

Jetpack::dns_prefetch( array(
	'//widgets.wp.com',
	'//s0.wp.com',
	'//0.gravatar.com',
	'//1.gravatar.com',
	'//2.gravatar.com',
) );

class Jetpack_Likes {
	var $version = '20141028';

	public static function init() {
		static $instance = NULL;

		if ( ! $instance ) {
			$instance = new Jetpack_Likes;
		}

		return $instance;
	}

	function __construct() {
		$this->in_jetpack = ( defined( 'IS_WPCOM' ) && IS_WPCOM ) ? false : true;

		add_action( 'init', array( &$this, 'action_init' ) );
		add_action( 'admin_init', array( $this, 'admin_init' ) );

		if ( $this->in_jetpack ) {
			add_action( 'jetpack_activate_module_likes',   array( $this, 'maybe_sync_content' ) );
			add_action( 'jetpack_activate_module_likes',   array( $this, 'module_toggle' ) );
			add_action( 'jetpack_deactivate_module_likes', array( $this, 'module_toggle' ) );

			Jetpack::enable_module_configurable( __FILE__ );
			Jetpack::module_configuration_load( __FILE__, array( $this, 'configuration_redirect' ) );

			add_action('admin_print_scripts-settings_page_sharing', array( &$this, 'load_jp_css' ) );
			add_filter( 'sharing_show_buttons_on_row_start', array( $this, 'configuration_target_area' ) );

			$active = Jetpack::get_active_modules();

			if ( ! in_array( 'sharedaddy', $active ) && ! in_array( 'publicize', $active ) ) {
				add_action( 'admin_menu', array( $this, 'sharing_menu' ) );	// we don't have a sharing page yet
			}

			if ( in_array( 'publicize', $active ) && ! in_array( 'sharedaddy', $active ) ) {
				add_action( 'pre_admin_screen_sharing', array( $this, 'sharing_block' ), 20 ); // we have a sharing page but not the global options area
				add_action( 'pre_admin_screen_sharing', array( $this, 'updated_message' ), -10 );
			}

			if( ! in_array( 'sharedaddy', $active ) ) {
				add_action( 'admin_init', array( $this, 'process_update_requests_if_sharedaddy_not_loaded' ) );
				add_action( 'sharing_global_options', array( $this, 'admin_settings_showbuttonon_init' ), 19 );
				add_action( 'sharing_admin_update', array( $this, 'admin_settings_showbuttonon_callback' ), 19 );
				add_action( 'admin_init', array( $this, 'add_meta_box' ) );
			} else {
				add_filter( 'sharing_meta_box_title', array( $this, 'add_likes_to_sharing_meta_box_title' ) );
				add_action( 'start_sharing_meta_box_content', array( $this, 'meta_box_content' ) );
			}

			Jetpack_Sync::sync_options( __FILE__, 'social_notifications_like' );

		} else { // wpcom
			add_action( 'wpmu_new_blog', array( $this, 'enable_comment_likes' ), 10, 1 );
			add_action( 'admin_init', array( $this, 'add_meta_box' ) );
			add_action( 'end_likes_meta_box_content', array( $this, 'sharing_meta_box_content' ) );
			add_filter( 'likes_meta_box_title', array( $this, 'add_likes_to_sharing_meta_box_title' ) );
		}

		add_action( 'admin_init', array( $this, 'admin_discussion_likes_settings_init' ) ); // Likes notifications

		add_action( 'admin_bar_menu', array( $this, 'admin_bar_likes' ), 60 );

		add_action( 'wp_enqueue_scripts', array( $this, 'load_styles_register_scripts' ) );

		add_action( 'save_post', array( $this, 'meta_box_save' ) );
		add_action( 'edit_attachment', array( $this, 'meta_box_save' ) );
		add_action( 'sharing_global_options', array( $this, 'admin_settings_init' ), 20 );
		add_action( 'sharing_admin_update',   array( $this, 'admin_settings_callback' ), 20 );
	}

	function maybe_sync_content() {
		if ( Jetpack::init()->sync->reindex_needed() ) {
			Jetpack::init()->sync->reindex_trigger();
		}
	}

	function module_toggle() {
		$jetpack = Jetpack::init();
		$jetpack->sync->register( 'noop' );
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
	 * Load style on the front end.
	 * @return null
	 */
	function load_styles_register_scripts() {

		wp_enqueue_style( 'jetpack_likes', plugins_url( 'likes/style.css', __FILE__ ), array(), JETPACK__VERSION );
		if( $this->in_jetpack ) {
			$this->register_scripts();
		}
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
	 * Replaces the "Sharing" title for the post screen metabox with "Likes and Shares"
	 * @param string $title The current title of the metabox, not needed/used.
	 */
	function add_likes_to_sharing_meta_box_title( $title ) {
		return __( 'Likes and Shares', 'jetpack' );
	}

	/**
	 * Adds a metabox to the post screen if the sharing one doesn't currently exist.
	 */
	function add_meta_box() {
		if ( apply_filters( 'post_flair_disable', false ) )
			return;

		$post_types = get_post_types( array( 'public' => true ) );
		$title = apply_filters( 'likes_meta_box_title', __( 'Likes', 'jetpack' ) );
		foreach( $post_types as $post_type ) {
			add_meta_box( 'likes_meta', $title, array( $this, 'meta_box_content' ), $post_type, 'advanced', 'high' );
		}
	}

	function meta_box_save( $post_id ) {
		if ( defined('DOING_AUTOSAVE') && DOING_AUTOSAVE )
			return $post_id;

		if ( empty( $_POST['wpl_like_status_hidden'] ) )
			return $post_id;

		// Record sharing disable. Only needs to be done for WPCOM
		if ( ! $this->in_jetpack ) {
			if ( isset( $_POST['post_type'] ) && in_array( $_POST['post_type'], get_post_types( array( 'public' => true ) ) ) ) {
				if ( ! isset( $_POST['wpl_enable_post_sharing'] ) ) {
					update_post_meta( $post_id, 'sharing_disabled', 1 );
				} else {
					delete_post_meta( $post_id, 'sharing_disabled' );
				}
			}
		}

		if ( 'post' == $_POST['post_type'] ) {
			if ( !current_user_can( 'edit_post', $post_id ) ) {
				return $post_id;
			}
		}

		// Record a change in like status for this post - only if it contradicts the
		// site like setting.
		if ( ( $this->is_enabled_sitewide() && empty( $_POST['wpl_enable_post_likes'] ) ) || ( ! $this->is_enabled_sitewide() && !empty( $_POST['wpl_enable_post_likes'] ) ) ) {
			update_post_meta( $post_id, 'switch_like_status', 1 );
			//$g_gif = file_get_contents( 'http://pixel.wp.com/g.gif?v=wpcom-no-pv&x_likes=switched_post_like_status' ); @todo stat
		} else {
			delete_post_meta( $post_id, 'switch_like_status' );
		}

		return $post_id;
	}

	/**
	 * Shows the likes option in the post screen metabox.
	 */
	function meta_box_content( $post ) {
		$post_id = ! empty( $post->ID ) ? (int) $post->ID : get_the_ID();
		$checked         = true;
		$disabled        = ! $this->is_enabled_sitewide();
		$switched_status = get_post_meta( $post_id, 'switch_like_status', true );

		if ( $disabled && empty( $switched_status ) || false == $disabled && !empty( $switched_status ) )
			$checked = false;

		do_action( 'start_likes_meta_box_content', $post );
		?>

		<p>
			<label for="wpl_enable_post_likes">
				<input type="checkbox" name="wpl_enable_post_likes" id="wpl_enable_post_likes" value="1" <?php checked( $checked ); ?>>
				<?php esc_html_e( 'Show likes.', 'jetpack' ); ?>
			</label>
			<input type="hidden" name="wpl_like_status_hidden" value="1" />
		</p> <?php
		do_action( 'end_likes_meta_box_content', $post );
	}

	/**
	 * WordPress.com: Metabox option for sharing (sharedaddy will handle this on the JP blog)
	 */
	function sharing_meta_box_content( $post ) {
		$post_id = ! empty( $post->ID ) ? (int) $post->ID : get_the_ID();
		$disabled = get_post_meta( $post_id, 'sharing_disabled', true ); ?>
		<p>
			<label for="wpl_enable_post_sharing">
				<input type="checkbox" name="wpl_enable_post_sharing" id="wpl_enable_post_sharing" value="1" <?php checked( !$disabled ); ?>>
				<?php _e( 'Show sharing buttons.', 'jetpack' ); ?>
			</label>
			<input type="hidden" name="wpl_sharing_status_hidden" value="1" />
		</p> <?php
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
			header = table.prevAll( 'h3:first' ),
			newParent = $( '#moderation_notify' ).parent( 'label' ).parent();

		if ( !table.size() || !header.size() || !newParent.size() ) {
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

	/**
	 * The actual options block to be inserted into the sharing page.
	 */
	function admin_settings_init() { ?>
		<tr>
			<th scope="row">
				<label><?php esc_html_e( 'WordPress.com Likes are', 'jetpack' ); ?></label>
			</th>
			<td>
				<div>
					<label>
						<input type="radio" class="code" name="wpl_default" value="on" <?php checked( $this->is_enabled_sitewide(), true ); ?> />
						<?php esc_html_e( 'On for all posts', 'jetpack' ); ?>
					</label>
				</div>
				<div>
					<label>
						<input type="radio" class="code" name="wpl_default" value="off" <?php checked( $this->is_enabled_sitewide(), false ); ?> />
						<?php esc_html_e( 'Turned on per post', 'jetpack' ); ?>
					</label>
				<div>
			</td>
		</tr>
		<?php if ( ! $this->in_jetpack ) : ?>
		<tr>
			<th scope="row">
				<label><?php esc_html_e( 'WordPress.com Reblog Button', 'jetpack' ); ?></label>
			</th>
			<td>
				<div>
					<label>
						<input type="radio" class="code" name="jetpack_reblogs_enabled" value="on" <?php checked( $this->reblogs_enabled_sitewide(), true ); ?> />
						<?php esc_html_e( 'Show the Reblog button on posts', 'jetpack' ); ?>
					</label>
				</div>
				<div>
					<label>
						<input type="radio" class="code" name="jetpack_reblogs_enabled" value="off" <?php checked( $this->reblogs_enabled_sitewide(), false ); ?> />
						<?php esc_html_e( 'Don\'t show the Reblog button on posts', 'jetpack' ); ?>
					</label>
				<div>
			</td>
		</tr>
		<tr>
			<th scope="row">
				<label><?php esc_html_e( 'Comment Likes are', 'jetpack' ); ?></label>
			</th>
			<td>
				<div>
					<label>
						<input type="checkbox" class="code" name="jetpack_comment_likes_enabled" value="1" <?php checked( $this->is_comments_enabled(), true ); ?> />
						<?php esc_html_e( 'On for all comments', 'jetpack' ); ?>
					</label>
				</div>
			</td>
		</tr>
		<?php endif; ?>
		</tbody> <?php // closes the tbody attached to sharing_show_buttons_on_row_start... ?>
	<?php }

	/**
	 * If sharedaddy is not loaded, we don't have the "Show buttons on" yet, so we need to add that since it affects likes too.
	 */
	function admin_settings_showbuttonon_init() { ?>
		<?php echo apply_filters( 'sharing_show_buttons_on_row_start', '<tr valign="top">' ); ?>
	  	<th scope="row"><label><?php _e( 'Show buttons on', 'jetpack' ); ?></label></th>
		<td>
			<?php
				$br = false;
				$shows = array_values( get_post_types( array( 'public' => true ) ) );
				array_unshift( $shows, 'index' );
				$global = $this->get_options();
				foreach ( $shows as $show ) :
					if ( 'index' == $show ) {
						$label = __( 'Front Page, Archive Pages, and Search Results', 'jetpack' );
					} else {
						$post_type_object = get_post_type_object( $show );
						$label = $post_type_object->labels->name;
					}
			?>
				<?php if ( $br ) echo '<br />'; ?><label><input type="checkbox"<?php checked( in_array( $show, $global['show'] ) ); ?> name="show[]" value="<?php echo esc_attr( $show ); ?>" /> <?php echo esc_html( $label ); ?></label>
			<?php	$br = true; endforeach; ?>
		</td>
	  	<?php echo apply_filters( 'sharing_show_buttons_on_row_end', '</tr>' ); ?>
	<?php }


	/**
	 * If sharedaddy is not loaded, we still need to save the the settings of the "Show buttons on" option.
	 */
	function admin_settings_showbuttonon_callback() {
		$options = get_option( 'sharing-options' );
		if ( !is_array( $options ) )
			$options = array();

		$shows = array_values( get_post_types( array( 'public' => true ) ) );
		$shows[] = 'index';
		$data = $_POST;

		if ( isset( $data['show'] ) ) {
			if ( is_scalar( $data['show'] ) ) {
				switch ( $data['show'] ) {
					case 'posts' :
						$data['show'] = array( 'post', 'page' );
					break;
					case 'index' :
						$data['show'] = array( 'index' );
					break;
					case 'posts-index' :
						$data['show'] = array( 'post', 'page', 'index' );
					break;
				}
			}

			if ( $data['show'] = array_intersect( $data['show'], $shows ) ) {
				$options['global']['show'] = $data['show'];
			}
		} else {
			$options['global']['show'] = array();
		}

		update_option( 'sharing-options', $options );
	}

	/**
	 * Adds the admin update hook so we can save settings even if Sharedaddy is not enabled.
	 */
	function process_update_requests_if_sharedaddy_not_loaded() {
		if ( isset( $_GET['page'] ) && ( $_GET['page'] == 'sharing.php' || $_GET['page'] == 'sharing' ) ) {
			if ( isset( $_POST['_wpnonce'] ) && wp_verify_nonce( $_POST['_wpnonce'], 'sharing-options' ) ) {
				/** This action is documented in modules/sharedaddy/sharing.php */
				do_action( 'sharing_admin_update' );
				wp_safe_redirect( admin_url( 'options-general.php?page=sharing&update=saved' ) );
				die();
			}
		}
	}

	/**
	 * Saves the setting in the database, bumps a stat on WordPress.com
	 */
	function admin_settings_callback() {
		// We're looking for these, and doing a dance to set some stats and save
		// them together in array option.
		$new_state = !empty( $_POST['wpl_default'] ) ? $_POST['wpl_default'] : 'on';
		$db_state  = $this->is_enabled_sitewide();

		$reblogs_new_state = !empty( $_POST['jetpack_reblogs_enabled'] ) ? $_POST['jetpack_reblogs_enabled'] : 'on';
		$reblogs_db_state = $this->reblogs_enabled_sitewide();
		/** Default State *********************************************************/

		// Checked (enabled)
		switch( $new_state ) {
			case 'off' :
				if ( true == $db_state && ! $this->in_jetpack ) {
					$g_gif = file_get_contents( 'http://pixel.wp.com/g.gif?v=wpcom-no-pv&x_likes=disabled_likes' );
				}
				update_option( 'disabled_likes', 1 );
				break;
			case 'on'  :
			default:
				if ( false == $db_state && ! $this->in_jetpack ) {
					$g_gif = file_get_contents( 'http://pixel.wp.com/g.gif?v=wpcom-no-pv&x_likes=reenabled_likes' );
				}
				delete_option( 'disabled_likes' );
				break;
		}

		switch( $reblogs_new_state ) {
			case 'off' :
				if ( true == $reblogs_db_state && ! $this->in_jetpack ) {
					$g_gif = file_get_contents( 'http://pixel.wp.com/g.gif?v=wpcom-no-pv&x_reblogs=disabled_reblogs' );
				}
				update_option( 'disabled_reblogs', 1 );
				break;
			case 'on'  :
			default:
				if ( false == $reblogs_db_state && ! $this->in_jetpack ) {
					$g_gif = file_get_contents( 'http://pixel.wp.com/g.gif?v=wpcom-no-pv&x_reblogs=reenabled_reblogs' );
				}
				delete_option( 'disabled_reblogs' );
				break;
		}

		// comment setting
		$new_comments_state = !empty( $_POST['jetpack_comment_likes_enabled'] ) ? $_POST['jetpack_comment_likes_enabled'] : false;
		switch( (bool) $new_comments_state ) {
			case true:
				update_option( 'jetpack_comment_likes_enabled', 1 );
			break;
			case false:
			default:
				update_option( 'jetpack_comment_likes_enabled', 0 );
			break;
		}
	}

	/**
	 * Force comment likes on for a blog
	 * Used when a new blog is created
	 */
	function enable_comment_likes( $blog_id ) {
		switch_to_blog( $blog_id );
		update_option( 'jetpack_comment_likes_enabled', 1 );
		restore_current_blog();
	}

	/**
	 * Adds the 'sharing' menu to the settings menu.
	 * Only ran if sharedaddy and publicize are not already active.
	 */
	function sharing_menu() {
		add_submenu_page( 'options-general.php', esc_html__( 'Sharing Settings', 'jetpack' ), esc_html__( 'Sharing', 'jetpack' ), 'manage_options', 'sharing', array( $this, 'sharing_page' ) );
	}

	/**
	 * Provides a sharing page with the sharing_global_options hook
	 * so we can display the setting.
	 * Only ran if sharedaddy and publicize are not already active.
	 */
	function sharing_page() {
		$this->updated_message(); ?>
		<div class="wrap">
			<div class="icon32" id="icon-options-general"><br /></div>
			<h2><?php esc_html_e( 'Sharing Settings', 'jetpack' ); ?></h2>
			<?php do_action( 'pre_admin_screen_sharing' ) ?>
			<?php $this->sharing_block(); ?>
		</div> <?php
	}

	/**
	 * Returns the settings have been saved message.
	 */
	function updated_message() {
		if ( isset( $_GET['update'] ) && $_GET['update'] == 'saved' )
			echo '<div class="updated"><p>' . esc_html__( 'Settings have been saved', 'jetpack' ) . '</p></div>';
	}

	/**
	 * Returns just the "sharing buttons" w/ like option block, so it can be inserted into different sharing page contexts
	 */
	function sharing_block() { ?>
		<h3><?php esc_html_e( 'Sharing Buttons', 'jetpack' ); ?></h3>
		<form method="post" action="">
		<table class="form-table">
		<tbody>
			<?php
			/** This action is documented in modules/sharedaddy/sharing.php */
			do_action( 'sharing_global_options' );
			?>
		</tbody>
		</table>

		<p class="submit">
			<input type="submit" name="submit" class="button-primary" value="<?php esc_attr_e( 'Save Changes', 'jetpack' ); ?>" />
		</p>

		<input type="hidden" name="_wpnonce" value="<?php echo wp_create_nonce( 'sharing-options' );?>" />
		</form> <?php
	}

	function admin_init() {
		add_filter( 'manage_posts_columns', array( $this, 'add_like_count_column' ) );
		add_filter( 'manage_pages_columns', array( $this, 'add_like_count_column' ) );
		add_action( 'manage_posts_custom_column', array( $this, 'likes_edit_column' ), 10, 2 );
		add_action( 'manage_pages_custom_column', array( $this, 'likes_edit_column' ), 10, 2 );
		add_action( 'admin_print_styles-edit.php', array( $this, 'load_admin_css' ) );
		add_action( "admin_print_scripts-edit.php", array( $this, 'enqueue_admin_scripts' ) );

		if ( $this->in_jetpack ) {
			$post_stati = get_post_stati( array( 'public' => true ) ); // All public post stati
			$post_stati[] = 'private';                                 // Content from private stati will be redacted
			Jetpack_Sync::sync_posts( __FILE__, array(
				'post_types' => get_post_types( array( 'public' => true ) ),
				'post_stati' => $post_stati,
				) );
		}
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

		// Comment Likes widget has been disabled, pending performance improvements.
		// add_filter( 'comment_text', array( &$this, 'comment_likes' ), 10, 2 );

		if ( $this->in_jetpack ) {
			add_filter( 'the_content', array( &$this, 'post_likes' ), 30, 1 );
			add_filter( 'the_excerpt', array( &$this, 'post_likes' ), 30, 1 );

		} else {
			add_filter( 'post_flair', array( &$this, 'post_likes' ), 30, 1 );
			add_filter( 'post_flair_block_css', array( $this, 'post_flair_service_enabled_like' ) );

			wp_enqueue_script( 'postmessage', '/wp-content/js/postmessage.js', array( 'jquery' ), JETPACK__VERSION, false );
			wp_enqueue_script( 'jquery_inview', '/wp-content/js/jquery/jquery.inview.js', array( 'jquery' ), JETPACK__VERSION, false );
			wp_enqueue_script( 'jetpack_resize', '/wp-content/js/jquery/jquery.jetpack-resize.js', array( 'jquery' ), JETPACK__VERSION, false );
			wp_enqueue_style( 'jetpack_likes', plugins_url( 'jetpack-likes.css', __FILE__ ), array(), JETPACK__VERSION );
		}
	}

	/**
	* Register scripts
	*/
	function register_scripts() {
		// Lets register all the sciprts
		wp_register_script( 'postmessage', plugins_url( '_inc/postmessage.js', dirname(__FILE__) ), array( 'jquery' ), JETPACK__VERSION, false );
		wp_register_script( 'jquery_inview', plugins_url( '_inc/jquery.inview.js', dirname(__FILE__) ), array( 'jquery' ), JETPACK__VERSION, false );
		wp_register_script( 'jetpack_resize', plugins_url( '_inc/jquery.jetpack-resize.js' , dirname(__FILE__) ), array( 'jquery' ), JETPACK__VERSION, false );
		wp_register_script( 'jetpack_likes_queuehandler', plugins_url( 'likes/queuehandler.js' , __FILE__ ), array( 'jquery', 'postmessage', 'jetpack_resize', 'jquery_inview' ), JETPACK__VERSION, true );
	}

	/**
	* Load the CSS needed for the wp-admin area.
	*/
	function load_admin_css() {
		?>
		<style type="text/css">
			.fixed .column-likes { width: 5em; padding-top: 8px; text-align: center !important; }
			.fixed .column-stats { width: 5em; }
			.fixed .column-likes .post-com-count { background-image: none; }
			.fixed .column-likes .post-com-count::after { border: none !important; }
			.fixed .column-likes .comment-count { background-color: #bbb; }
			.fixed .column-likes .comment-count:hover { background-color: #2ea2cc; }
			.fixed .column-likes .vers img { display: none; }
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
				wp_enqueue_script( 'likes-post-count', plugins_url( 'modules/likes/post-count.js', dirname( __FILE__ ) ), array( 'jquery' ), JETPACK__VERSION );
				wp_enqueue_script( 'likes-post-count-jetpack', plugins_url( 'modules/likes/post-count-jetpack.js', dirname( __FILE__ ) ), array( 'likes-post-count' ), JETPACK__VERSION );
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
		global $post;

		if ( ! $this->is_likes_visible() )
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
		add_action( 'wp_footer', array( $this, 'likes_master' ), 21 );

		/**
		* if the same post appears more then once on a page the page goes crazy
		* we need a slightly more unique id / name for the widget wrapper.
		*/
		$uniqid = uniqid();

		$src = sprintf( '//widgets.wp.com/likes/#blog_id=%1$d&amp;post_id=%2$d&amp;origin=%3$s&amp;obj_id=%1$d-%2$d-%4$s', $blog_id, $post->ID, $domain, $uniqid );
		$name = sprintf( 'like-post-frame-%1$d-%2$d-%3$s', $blog_id, $post->ID, $uniqid );
		$wrapper = sprintf( 'like-post-wrapper-%1$d-%2$d-%3$s', $blog_id, $post->ID, $uniqid );

		$html  = "<div class='sharedaddy sd-block sd-like jetpack-likes-widget-wrapper jetpack-likes-widget-unloaded' id='$wrapper' data-src='$src' data-name='$name'><h3 class='sd-title'>" . esc_html__( 'Like this:', 'jetpack' ) . '</h3>';
		$html .= "<div class='likes-widget-placeholder post-likes-widget-placeholder' style='height:55px'><span class='button'><span>" . esc_html__( 'Like', 'jetpack' ) . '</span></span> <span class="loading">' . esc_html__( 'Loading...', 'jetpack' ) . '</span></div>';
		$html .= "<span class='sd-text-color'></span><a class='sd-link-color'></a>";
		$html .= '</div>';

		// Lets make sure that the script is enqued
		wp_enqueue_script( 'jetpack_likes_queuehandler' );

		return $content . $html;
	}

	function comment_likes( $content, $comment = null ) {
		if ( empty( $comment ) )
			return $content;

		if ( ! $this->is_comments_enabled() )
			return $content;

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
		add_action( 'wp_footer', array( $this, 'likes_master' ), 21 );

		$src = sprintf( '%1$s://widgets.wp.com/likes/#blog_id=%2$d&amp;comment_id=%3$d&amp;origin=%1$s://%4$s', $protocol, $blog_id, $comment->comment_ID, $domain );
		$name = sprintf( 'like-comment-frame-%1$d-%2$d', $blog_id, $comment->comment_ID );
		$wrapper = sprintf( 'like-comment-wrapper-%1$d-%2$d', $blog_id, $comment->comment_ID );

		$html  = "<div><div class='jetpack-likes-widget-wrapper jetpack-likes-widget-unloaded' id='$wrapper'>";
		$html .= "<iframe class='comment-likes-widget jetpack-likes-widget' name='$name' height='16px' width='100%' data='$src'></iframe>";
		$html .= '</div></div>';
		return $content . $html;
	}

	function post_flair_service_enabled_like( $classes ) {
		$classes[] = 'sd-like-enabled';
		return $classes;
	}

	function admin_bar_likes() {
		global $wp_admin_bar, $post;

		if ( ! $this->is_admin_bar_button_visible() ) {
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
		add_action( 'wp_footer', array( $this, 'likes_master' ), 21 );

		$src = sprintf( '%1$s://widgets.wp.com/likes/#blog_id=%2$d&amp;post_id=%3$d&amp;origin=%1$s://%4$s', $protocol, $blog_id, $post->ID, $domain );

		$html = "<iframe class='admin-bar-likes-widget jetpack-likes-widget' scrolling='no' frameBorder='0' name='admin-bar-likes-widget' src='$src'></iframe>";

		$node = array(
				'id'   => 'admin-bar-likes-widget',
				'meta' => array(
							'html' => $html
				)
		);

		$wp_admin_bar->add_node( $node );
	}

	/**
	 * This function needs to get loaded after the scripts get added to the page.
	 *
	 */
	function likes_master() {
		$protocol = 'http';
		if ( is_ssl() )
			$protocol = 'https';

		if ( version_compare( $GLOBALS['wp_version'], '3.8-alpha', '>=' ) ) {
			add_filter( 'mp6_enabled', '__return_true', 97 );
		}

		$_locale = get_locale();

		// We have to account for WP.org vs WP.com locale divergence
		if ( $this->in_jetpack ) {
			if ( ! defined( 'JETPACK__GLOTPRESS_LOCALES_PATH' ) || ! file_exists( JETPACK__GLOTPRESS_LOCALES_PATH ) ) {
				return false;
			}

			require_once JETPACK__GLOTPRESS_LOCALES_PATH;

			$gp_locale = GP_Locales::by_field( 'wp_locale', $_locale );
			$_locale = isset( $gp_locale->slug ) ? $gp_locale->slug : '';
		}

		$likes_locale = ( '' == $_locale || 'en' == $_locale ) ? '' : '&amp;lang=' . strtolower( $_locale );

		$src = sprintf( '%1$s://widgets.wp.com/likes/master.html?ver=%2$s#ver=%2$s%3$s&amp;mp6=%4$d', $protocol, $this->version, $likes_locale, apply_filters( 'mp6_enabled', 0 ) );

		$likersText = wp_kses( __( '<span>%d</span> bloggers like this:', 'jetpack' ), array( 'span' => array() ) );
		?>
		<iframe src='<?php echo $src; ?>' scrolling='no' id='likes-master' name='likes-master' style='display:none;'></iframe>
		<div id='likes-other-gravatars'><div class="likes-text"><?php echo $likersText; ?></div><ul class="wpl-avatars sd-like-gravatars"></ul></div>
		<?php
	}

	/**
	 * Get the 'disabled_likes' option from the DB of the current blog.
	 *
	 * @return array
	 */
	function get_options() {
		$setting             = array();
		$setting['disabled'] = get_option( 'disabled_likes'  );
		$sharing             = get_option( 'sharing-options' );

		// Default visibility settings
		if ( ! isset( $sharing['global']['show'] ) ) {
			$sharing['global']['show'] = array( 'post', 'page' );

		// Scalar check
		} elseif ( is_scalar( $sharing['global']['show'] ) ) {
			switch ( $sharing['global']['show'] ) {
				case 'posts' :
					$sharing['global']['show'] = array( 'post', 'page' );
					break;
				case 'index' :
					$sharing['global']['show'] = array( 'index' );
					break;
				case 'posts-index' :
					$sharing['global']['show'] = array( 'post', 'page', 'index' );
					break;
			}
		}

		// Ensure it's always an array (even if not previously empty or scalar)
		$setting['show'] = !empty( $sharing['global']['show'] ) ? (array) $sharing['global']['show'] : array();

		return apply_filters( 'wpl_get_options', $setting );
	}

	/** _is_ functions ************************************************************/

	/**
	 * Are likes visible in this context?
	 *
	 * Some of this code was taken and modified from sharing_display() to ensure
	 * similar logic and filters apply here, too.
	 */
	function is_likes_visible() {

		global $post, $wp_current_filter;              // Used to apply 'sharing_show' filter

		// Never show on feeds or previews
		if ( is_feed() || is_preview() || is_comments_popup() ) {
			$enabled = false;

		// Not a feed or preview, so what is it?
		} else {

			if ( in_the_loop() ) {
				// If in the loop, check if the current post is likeable
				$enabled = $this->is_post_likeable();
			} else {
				// Otherwise, check and see if likes are enabled sitewide
				$enabled = $this->is_enabled_sitewide();
			}

			if ( post_password_required() )
				$enabled = false;

			if ( in_array( 'get_the_excerpt', (array) $wp_current_filter ) ) {
				$enabled = false;
			}

			// Sharing Setting Overrides ****************************************

			// Single post including custom post types
			if ( is_single() ) {
				if ( ! $this->is_single_post_enabled( $post->post_type ) ) {
					$enabled = false;
				}

			// Single page
			} elseif ( is_page() ) {
				if ( ! $this->is_single_page_enabled() ) {
					$enabled = false;
				}

			// Attachment
			} elseif ( is_attachment() ) {
				if ( ! $this->is_attachment_enabled() ) {
					$enabled = false;
				}

			// All other loops
			} elseif ( ! $this->is_index_enabled() ) {
				$enabled = false;
			}
		}

		if( is_object( $post ) ) {
			// Check that the post is a public, published post.
			if ( 'attachment' == $post->post_type ) {
				$post_status = get_post_status( $post->post_parent );
			} else {
				$post_status = $post->post_status;
			}
			if ( 'publish' != $post_status ) {
				$enabled = false;
			}
		}

		// Run through the sharing filters
		/** This filter is documented in modules/sharedaddy/sharing-service.php */
		$enabled = apply_filters( 'sharing_show', $enabled, $post );

		return (bool) apply_filters( 'wpl_is_likes_visible', $enabled );
	}

	/**
	 * Returns the current state of the "WordPress.com Likes are" option.
	 * @return boolean true if enabled sitewide, false if not
	 */
	function is_enabled_sitewide() {
		return (bool) apply_filters( 'wpl_is_enabled_sitewide', ! get_option( 'disabled_likes' ) );
	}

	/**
	 * Returns the current state of the "WordPress.com Reblogs are" option.
	 * @return boolean true if enabled sitewide, false if not
	 */
	function reblogs_enabled_sitewide() {
		return (bool) apply_filters( 'wpl_reblogging_enabled_sitewide', ! get_option( 'disabled_reblogs' ) );
	}

	/**
	 * Returns if comment likes are enabled. Defaults to 'off'
	 * @todo decide what the default should be
	 * @return boolean true if we should show comment likes, false if not
	 */
	function is_comments_enabled() {
		return (bool) apply_filters( 'jetpack_comment_likes_enabled', get_option( 'jetpack_comment_likes_enabled', false ) );
	}

	function is_admin_bar_button_visible() {
		global $wp_admin_bar;

		if ( ! is_object( $wp_admin_bar ) )
			return false;

		if ( ( ! is_singular( 'post' ) && ! is_attachment() && ! is_page() ) )
			return false;

		if ( ! $this->is_likes_visible() )
			return false;

		if ( ! $this->is_post_likeable() )
			return false;

		return (bool) apply_filters( 'jetpack_admin_bar_likes_enabled', true );
	}

	/**
	 * Are likes enabled for this post?
	 *
	 * @param int $post_id
	 * @retun bool
	 */
	function is_post_likeable( $post_id = 0 ) {
		$post = get_post( $post_id );
		if ( !$post || is_wp_error( $post ) ) {
			return false;
		}

		$sitewide_likes_enabled = (bool) Jetpack_Likes::is_enabled_sitewide();
		$post_likes_switched    = (bool) get_post_meta( $post->ID, 'switch_like_status', true );

		$post_likes_enabled = $sitewide_likes_enabled;
		if ( $post_likes_switched ) {
			$post_likes_enabled = ! $post_likes_enabled;
		}

		return $post_likes_enabled;
	}

	/**
	 * Are Post Likes enabled on archive/front/search pages?
	 *
	 * @return bool
	 */
	function is_index_enabled() {
		$options = $this->get_options();
		return (bool) apply_filters( 'wpl_is_index_disabled', (bool) in_array( 'index', $options['show'] ) );
	}

	/**
	 * Are Post Likes enabled on single posts?
	 *
	 * @param String $post_type custom post type identifier
	 * @return bool
	 */
	function is_single_post_enabled( $post_type = 'post' ) {
		$options = $this->get_options();
		return (bool) apply_filters(
			"wpl_is_single_{$post_type}_disabled",
			(bool) in_array( $post_type, $options['show'] )
		);
	}

	/**
	 * Are Post Likes enabled on single pages?
	 *
	 * @return bool
	 */
	function is_single_page_enabled() {
		$options = $this->get_options();
		return (bool) apply_filters( 'wpl_is_single_page_disabled', (bool) in_array( 'page', $options['show'] ) );
	}

	/**
	 * Are Media Likes enabled on single pages?
	 *
	 * @return bool
	 */
	function is_attachment_enabled() {
		$options = $this->get_options();
		return (bool) apply_filters( 'wpl_is_attachment_disabled', (bool) in_array( 'attachment', $options['show'] ) );
	}
}

Jetpack_Likes::init();
