<?php
function jetpack_init_gplus_authorship_admin() {
	$gplus_admin = new GPlus_Authorship_Admin;
	add_action( 'save_post', array( 'GPlus_Authorship_Admin', 'save_post_meta' ) );
}
add_action( 'init', 'jetpack_init_gplus_authorship_admin' );

class GPlus_Authorship_Admin {

	public function __construct() {
		$this->in_jetpack = ( defined( 'IS_WPCOM' ) && IS_WPCOM ) ? false : true;

		if ( $this->in_jetpack ) {
			$active = Jetpack::get_active_modules();
			if ( ! in_array( 'sharedaddy', $active ) && ! in_array( 'publicize', $active ) && ! in_array( 'likes', $active ) ) {
				add_action( 'admin_menu', array( $this, 'sharing_menu' ) );	// we don't have a sharing page yet
			}

			add_action( 'jetpack_activate_module_likes',   array( $this, 'module_toggle' ) );
			add_action( 'jetpack_deactivate_module_likes', array( $this, 'module_toggle' ) );

			Jetpack::enable_module_configurable( __FILE__ );
			Jetpack::module_configuration_load( __FILE__, array( $this, 'configuration_redirect' ) );
		}

		// The visible UI elements for the user
		add_action( 'load-settings_page_sharing', array( $this, 'load_management_script_assets' ) );
		add_action( 'pre_admin_screen_sharing', array( $this, 'connection_screen' ), 15 );
		add_action( 'admin_init', array( $this, 'add_meta_box' ) );
		add_action( 'do_meta_boxes', array( $this, 'should_we_show_the_meta_box' ) );
		add_action( 'sharing_global_options', array( $this, 'admin_settings_init' ), 20 );
		add_action( 'sharing_admin_update',   array( $this, 'admin_settings_callback' ), 20 );

		if ( $this->in_jetpack )
			add_action( 'pre_admin_screen_sharing', array( $this, 'jetpack_disconnect' ), 10 );
	}

	function module_toggle() {
		$jetpack = Jetpack::init();
		$jetpack->sync->register( 'noop' );
	}

	/**
	 * Redirects to the likes section of the sharing page.
	 */
	function configuration_redirect() {
		wp_safe_redirect( admin_url( 'options-general.php?page=sharing#gplus' ) );
		die();
	}

	/**
	 * Adds the 'sharing' menu to the settings menu.
	 * Only ran if sharedaddy, publicize, and likes are not already active.
	 */
	function sharing_menu() {
		add_submenu_page( 'options-general.php', esc_html__( 'Sharing Settings', 'jetpack' ), esc_html__( 'Sharing', 'jetpack' ), 'manage_options', 'sharing', array( $this, 'sharing_page' ) );
	}

	/**
	 * Provides a sharing page with the sharing_global_options hook
	 * so we can display the setting.
	 * Only ran if sharedaddy and publicize are not already active.
	 */
	function sharing_page() { ?>
		<div class="wrap">
			<div class="icon32" id="icon-options-general"><br /></div>
			<h2><?php esc_html_e( 'Sharing Settings', 'jetpack' ); ?></h2>
			<?php do_action( 'pre_admin_screen_sharing' ) ?>
		</div><?php
	}


	public function load_management_script_assets() {
		if ( $this->in_jetpack )
			$pm = plugins_url( '_inc/postmessage.js', dirname( dirname ( dirname(__FILE__) ) ) );
		else
			$pm = '/wp-content/js/postmessage.js';
		wp_enqueue_script( 'postmessage', $pm, array( 'jquery' ) );
		wp_enqueue_script( 'gplus-listener', plugins_url( 'listener.js', __FILE__ ), array( 'jquery', 'postmessage' ) );
		wp_localize_script( 'gplus-listener', 'GPlusL10n', array(
			'connected'     => __( 'Your Google+ account has been connected.', 'jetpack' ),
			'unknownError'  => __( 'There was a problem connecting your Google+ account. Please try again.', 'jetpack' ),
			'accessDenied'  => __( "You must click 'Accept' in the Google+ dialog to connect your account.", 'jetpack' ),
		) );
		wp_enqueue_style( 'gplus', plugins_url( 'style.css', __FILE__ ) );
	}

	public function jetpack_disconnect() {
		if ( empty( $_GET['disconnect'] ) || 'gplus' != $_GET['disconnect'] )
			return;

		global $current_user;
		// security check - did we actually want to disconnect?
		$nonce = $_GET['_wpnonce'];
		if ( !wp_verify_nonce( $nonce, 'disconnect-gplus' ) )
			return;

		$connections = get_option( 'gplus_authors', array() );

		Jetpack::load_xml_rpc_client();
		$xml = new Jetpack_IXR_Client();
		$xml->query( 'jetpack.disconnectGooglePlus', $connections[ $current_user->ID ]['id'] );

		if ( !$xml->isError() ) {
			unset( $connections[ $current_user->ID ] );
			update_option( 'gplus_authors', $connections );
		} else {
			// @todo error
		}
	}

	public function connection_screen() { ?>
		<div id="gplus"></div>
		<div class="gplus-sharing-screen">
		<h3><?php _e( 'Google+ Profile', 'jetpack' ) ?></h3><?php
		 $this->disconnected_message();
		if ( GPlus_Authorship_Utils::is_current_user_connected() ) {
			$this->connected_message();
		} else {
			$this->connect_button();
			?><div id="result"></div><?php // where output from Javascript (success/error messages) are placed
		} ?>
		</div><?php
	}

	private function disconnect_button() { ?>
		<a href="<?php echo wp_nonce_url( 'options-general.php?page=sharing&disconnect=gplus', 'disconnect-gplus' ); ?>" id="disconnect-gplus" class="pub-disconnect-button" title="<?php _e( 'Disconnect', 'jetpack'); ?>">&times;</a><?php
	}

	private function connect_button() { ?>
		<?php _e( 'Connect your WordPress account to Google+ to add this blog to your Google+ profile and improve the visibility of your blog posts on Google.', 'jetpack' ) ?></p>
		<iframe src="//dashboard.wordpress.com/wp-admin/options-general.php?page=gplus-authorship&amp;gplus=frame&amp;blog_id=<?php echo intval( GPlus_Authorship_Utils::get_blog_id() ); ?>&amp;jpstate=<?php echo wp_create_nonce( 'gplus-connect' ); ?>" width="400" height="45" style="overflow:none;" scrolling="no"></iframe>
		<p><small><a href="http://support.wordpress.com/google-plus-profile/" target="_blank"><?php esc_html_e( 'Need help?', 'jetpack' ); ?></a></small></p><?php
	}

	private function disconnected_message() {
		global $publicize;
		if ( !empty( $_GET['disconnect'] ) && 'gplus' == $_GET['disconnect'] ) {
			if ( isset( $publicize->disconnected_from_authorship ) && $publicize->disconnected_from_authorship ) { ?>
				<div class="updated"><p><?php echo sprintf( __( "Your Google+ profile and WordPress.com accounts have been disconnected, including your Publicize connections. If you no longer wish to be associated with this blog on Google we recommend that you also remove the blog URL from your <a href='%s' target='_blank'>Google+ profile</a>.", 'jetpack' ), 'http://plus.google.com/me/about/edit/co' ); ?></p></div><?php
			} else { ?>
				<div class="updated"><p><?php echo sprintf( __( "Your Google+ profile and WordPress.com accounts have been disconnected. If you no longer wish to be associated with this blog on Google we recommend that you also remove the blog URL from your <a href='%s' target='_blank'>Google+ profile</a>.", 'jetpack' ), 'http://plus.google.com/me/about/edit/co' ); ?></p></div><?php
			}
		}
	}

	function admin_settings_init() { ?>
		<tr>
			<th scope="row">
			<label><?php esc_html_e( 'Google+', 'jetpack' ); ?></label>
		</th>
		<td>
			<div>
				<label>
				<input type="checkbox" class="hidegplus" name="hidegplus" value="on" <?php checked( get_option( 'hide_gplus', false ) ); ?> />
				</label>

				<?php esc_html_e( 'Hide my Google+ profile from displaying in the sharing area of my posts.', 'jetpack' ); ?>
			</div>		
		</td>
		</tr><?php
	}

	function admin_settings_callback() {
		$new_state = isset( $_POST['hidegplus'] ) ? $_POST['hidegplus'] : 'off';
		switch( $new_state ) {
			case 'on' :
				update_option( 'hide_gplus', 1 );
				break;
			case 'off'  :
			default:
				delete_option( 'hide_gplus' );
				break;
		}
	}

	private function connected_message() {
		$users_gplus_info = GPlus_Authorship_Utils::get_current_users_gplus_info(); ?>
		<p><?php _e( 'Your posts will be associated with your Google+ profile.', 'jetpack' ); ?></p>

		<div id="gplus-connection-details">
			<div class="gplus-disconnect">
				<?php $this->disconnect_button(); ?>
			</div>
			<img src="<?php echo esc_url( $users_gplus_info['profile_image'] ); ?>?sz=50" alt="" />
			<p>
				<span class="gplus-user"><a href="<?php echo esc_url( $users_gplus_info['url'] ); ?>"><?php echo esc_html( $users_gplus_info['name'] ); ?></a></span>
				<span class="gplus-connected"><?php esc_html_e( 'Connected', 'jetpack' ); ?></span>
			</p>
			<div class="gplus-clear"></div>

		</div><?php
	}

	function add_meta_box() {
		$gplus_connections = GPlus_Authorship_Utils::get_all_gplus_authors();
		if ( empty( $gplus_connections ) || count( $gplus_connections ) < 1 )
			return;

		$types = array( 'post' );
		$types = apply_filters( 'gplus_modify_post_types', $types );
		foreach( $types as $type ) {
			add_meta_box( 'gplus_authorship', __( 'Google+', 'jetpack' ), array( $this, 'post_screen_meta_box' ), $type, 'advanced', 'high' );
		}
	}

	function should_we_show_the_meta_box( $page ) {
		if ( 'post' != $page )
			return;

		global $post;
		$gplus_connections = GPlus_Authorship_Utils::get_all_gplus_authors();
		if ( empty( $gplus_connections ) || count( $gplus_connections ) < 1 )
			remove_meta_box( 'gplus_authorship', 'post', 'advanced' );
		$users_gplus_info = GPlus_Authorship_Utils::get_post_authors_gplus_info( $post );
		if ( empty( $users_gplus_info ) )
			remove_meta_box( 'gplus_authorship', 'post', 'advanced' );
	}

	function post_screen_meta_box( $post = '' ) {
		wp_enqueue_style( 'gplus', plugins_url( 'style.css', __FILE__ ) );
		$enabled_on_post = true;
		$meta = get_post_meta( $post->ID, 'gplus_authorship_disabled', true );
		if ( isset( $meta ) && true == $meta )
			$enabled_on_post = false;
		$users_gplus_info = GPlus_Authorship_Utils::get_post_authors_gplus_info( $post );?>
		<p>
			<label for="gplus_authorship_enable">
				<input type="checkbox" name="gplus_authorship" id="gplus_authorship_enable" value="1" <?php checked( $enabled_on_post ); ?>>
				<?php esc_html_e( 'Associate my Google+ information with this post.', 'jetpack' ); ?> <br />
				<?php if ( !empty( $users_gplus_info ) ) { ?>
				<div class="gplus-post-meta-box">
					<img src="<?php echo esc_url( $users_gplus_info['profile_image'] ); ?>?sz=25" alt="" />
					<em><?php echo __( sprintf( 'Profile: <a href="%s" target="_blank">%s</a>', esc_url( $users_gplus_info['url'] ), esc_html( $users_gplus_info['name'] ) ), 'jetpack' ); ?></em>
				</div>
				<?php } ?>
			</label>
		</p><?php
	}

	static function save_post_meta( $post_id ) {
		if ( defined('DOING_AUTOSAVE') && DOING_AUTOSAVE )
			return $post_id;
		global $post;
		$authors = get_option( 'gplus_authors', array() );
		if ( empty( $authors ) || empty( $post ) )
			return $post_id;
		if ( empty( $authors[ $post->post_author ] ) )
			return $post_id;
		if ( isset( $_POST['post_type'] ) && ( 'post' == $_POST['post_type'] ) ) {
			if ( empty( $_POST['gplus_authorship'] ) ) {
				update_post_meta( $post_id, 'gplus_authorship_disabled', 1 );
			} else {
				delete_post_meta( $post_id, 'gplus_authorship_disabled' );
			}
		}

		return $post_id;
	}

}

class GPlus_Authorship_Utils {

	static function get_blog_id() {
		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			$blog_id = get_current_blog_id();
		} else {
			$jetpack = Jetpack::init();
			$blog_id = $jetpack->get_option( 'id' );
		}
		return $blog_id;
	}

	static function can_current_user_connect( $_blog_id = false ) {
		global $current_user;
		if ( !$_blog_id )
			$_blog_id = GPlus_Authorship_Utils::get_blog_id();
		if ( is_user_member_of_blog( $current_user->ID, $_blog_id ) || is_super_admin( $current_user->ID ) )
			return true;
		return false;
	}

	static function is_current_user_connected( $_blog_id = false ) {
		if ( $_blog_id )
			switch_to_blog( $_blog_id );
		$gplus = self::get_current_users_gplus_info();
		if ( $_blog_id )
			restore_current_blog();
		return (bool) !empty( $gplus );
	}

	static function get_all_gplus_authors() {
		 return get_option( 'gplus_authors', array() );
	}

	static function get_current_users_gplus_info() {
		global $current_user;
		$all = self::get_all_gplus_authors();
		return ( empty( $all[ $current_user->ID ] ) ? array() : $all[ $current_user->ID ] );
	}

	static function get_post_authors_gplus_info( $post ) {
		$id = $post->post_author;
		$all = self::get_all_gplus_authors();
		return ( empty( $all[ $id ] ) ? array() : $all[ $id ] );
	}

}
