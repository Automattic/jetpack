<?php
/**
 * VideoPress in Jetpack
 *
 */
class Jetpack_VideoPress {
	public $module = 'videopress';
	public $option_name = 'videopress';
	public $version = 4;

	/**
	 * Singleton
	 */
	public static function init() {
		static $instance = false;

		if ( ! $instance )
			$instance = new Jetpack_VideoPress;

		return $instance;
	}

	function __construct() {
		$this->version = time(); // <s>ghost</s> cache busters!
		add_action( 'init', array( $this, 'on_init' ) );
		add_action( 'jetpack_activate_module_videopress', array( $this, 'jetpack_module_activated' ) );
		add_action( 'jetpack_deactivate_module_videopress', array( $this, 'jetpack_module_deactivated' ) );
	}

	/**
	 * Fires on init since is_connection_owner should wait until the user is initialized by $wp->init();
	 */
	function on_init() {
		$options = $this->get_options();

		// Only the connection owner can configure this module.
		if ( $this->is_connection_owner() ) {
			Jetpack::enable_module_configurable( $this->module );
			Jetpack::module_configuration_load( $this->module, array( $this, 'jetpack_configuration_load' ) );
			Jetpack::module_configuration_screen( $this->module, array( $this, 'jetpack_configuration_screen' ) );
		}

		// Only if the current user can manage the VideoPress library and one has been connected.
		if ( $this->can( 'read_videos' ) && $options['blog_id'] ) {
			add_action( 'wp_enqueue_media', array( $this, 'enqueue_admin_scripts' ) );
			add_action( 'print_media_templates', array( $this, 'print_media_templates' ) );

			// Load these at priority -1 so they're fired before Core's are.
			add_action( 'wp_ajax_query-attachments', array( $this, 'wp_ajax_query_attachments' ), -1 );
			add_action( 'wp_ajax_save-attachment', array( $this, 'wp_ajax_save_attachment' ), -1 );
			add_action( 'wp_ajax_save-attachment-compat', array( $this, 'wp_ajax_save_attachment' ), -1 );
			add_action( 'wp_ajax_delete-post', array( $this, 'wp_ajax_delete_post' ), -1 );

			add_action( 'admin_menu', array( $this, 'admin_menu' ) );
		}

		if ( $this->can( 'upload_videos' ) && $options['blog_id'] ) {
			add_action( 'wp_ajax_videopress-get-upload-token', array( $this, 'wp_ajax_videopress_get_upload_token' ) );
		}

		add_filter( 'videopress_shortcode_options', array( $this, 'videopress_shortcode_options' ) );
	}

	function wp_ajax_videopress_get_upload_token() {
		if ( ! $this->can( 'upload_videos' ) )
			return wp_send_json_error();

		$result = $this->query( 'jetpack.vpGetUploadToken' );
		if ( is_wp_error( $result ) )
			return wp_send_json_error( array( 'message' => __( 'Could not obtain a VideoPress upload token. Please try again later.', 'jetpack' ) ) );

		$response = $result;
		if ( empty( $response['videopress_blog_id'] ) || empty( $response['videopress_token'] ) || empty( $response[ 'videopress_action_url' ] ) )
			return wp_send_json_error( array( 'message' => __( 'Could not obtain a VideoPress upload token. Please try again later.', 'jetpack' ) ) );

		return wp_send_json_success( $response );
	}

	/**
	 * Get VideoPress options
	 */
	function get_options() {
		$defaults = array(
			'blogs' => array(),
			'blog_id' => 0,
			'access' => '',
			'allow-upload' => false,
			'freedom' => false,
			'hd' => false,
			'meta' => array(
				'max_upload_size' => 0,
			),
		);

		$options = Jetpack_Options::get_option( $this->option_name, array() );

		// If options have not been saved yet, check for older VideoPress plugin options.
		if ( empty( $options ) ) {
			$options['freedom'] = (bool) get_option( 'video_player_freedom', false );
			$options['hd'] = (bool) get_option( 'video_player_high_quality', false );
		}

		$options = array_merge( $defaults, $options );
		return $options;
	}

	/**
	 * Update VideoPress options
	 */
	function update_options( $options ) {
		Jetpack_Options::update_option( $this->option_name, $options );
	}

	/**
	 * Runs when the VideoPress module is activated.
	 */
	function jetpack_module_activated() {
		if ( ! $this->is_connection_owner() )
			return;

		$options = $this->get_options();

		// Ask WordPress.com for a list of VideoPress blogs
		$result = $this->query( 'jetpack.vpGetBlogs' );
		if ( ! is_wp_error( $result ) )
			$options['blogs'] = $result;

		// If there's at least one available blog, let's use it.
		if ( is_array( $options['blogs'] ) && count( $options['blogs'] ) > 0 )
			$options['blog_id'] = $options['blogs'][0]['blog_id'];

		$this->update_options( $options );
	}

	/**
	 * Runs when the VideoPress module is deactivated.
	 */
	function jetpack_module_deactivated() {
		Jetpack_Options::delete_option( $this->option_name );
	}

	/**
	 * Remote Query
	 *
	 * Performs a remote XML-RPC query using Jetpack's IXR Client. And also
	 * appends some useful stuff about this setup to the query.
	 *
	 * @return the Jetpack_IXR_Client object after querying.
	 */
	function query( $method, $args = null ) {
		$options = $this->get_options();
		Jetpack::load_xml_rpc_client();
		$xml = new Jetpack_IXR_Client( array(
			'user_id' => JETPACK_MASTER_USER, // All requests are on behalf of the connection owner.
		) );

		$params = array(
			'args' => $args,
			'video_blog_id' => $options['blog_id'],
			'caps' => array(),
		);

		// Let Jetpack know about our local caps.
		foreach ( array( 'read_videos', 'edit_videos', 'delete_videos', 'upload_videos' ) as $cap )
			if ( $this->can( $cap ) )
				$params['caps'][] = $cap;

		$xml->query( $method, $params );

		if ( $xml->isError() )
			return new WP_Error( 'xml_rpc_error', 'An XML-RPC error has occurred.' );

		$response = $xml->getResponse();

		// If there's any metadata with the response, save it for future use.
		if ( is_array( $response ) && isset( $response['meta'] ) ) {
			$options = $this->get_options();
			if ( $response['meta'] !== $options['meta'] ) {
				$options['meta'] = array_merge( $options['meta'], $response['meta'] );
				$this->update_options( $options );
			}
		}

		if ( is_array( $response ) && isset( $response['result'] ) )
			return $response['result'];

		return $response;
	}

	/**
	 * Runs before the VideoPress Configuration screen loads, useful
	 * to update options and yield errors.
	 */
	function jetpack_configuration_load() {
		$this->enqueue_admin_scripts();

		/**
		 * Save configuration
		 */
		if ( ! empty( $_POST['action'] ) && $_POST['action'] == 'videopress-save' ) {
			check_admin_referer( 'videopress-settings' );
			$options = $this->get_options();

			if ( isset( $_POST['blog_id'] ) && in_array( $_POST['blog_id'], wp_list_pluck( $options['blogs'], 'blog_id' ) ) )
				$options['blog_id'] = $_POST['blog_id'];

			// Allow the None setting too.
			if ( isset( $_POST['blog_id'] ) && $_POST['blog_id'] == 0 )
				$options['blog_id'] = 0;

			/**
			 * @see $this->can()
			 */
			if ( isset( $_POST['videopress-access'] ) && in_array( $_POST['videopress-access'], array( '', 'read', 'edit', 'delete' ) ) )
				$options['access'] = $_POST['videopress-access'];

			$options['freedom'] = isset( $_POST['videopress-freedom'] );
			$options['hd'] = isset( $_POST['videopress-hd'] );

			// Allow upload only if some level of access has been granted, and uploads were allowed.
			$options['allow-upload'] = false;
			if ( ! empty( $options['access'] ) && isset( $_POST['videopress-upload'] ) )
				$options['allow-upload'] = true;

			$this->update_options( $options );
			Jetpack::state( 'message', 'module_configured' );
			wp_safe_redirect( Jetpack::module_configuration_url( $this->module ) );
		}

		/**
		 * Refresh the list of available WordPress.com blogs
		 */
		if ( ! empty( $_GET['videopress'] ) && $_GET['videopress'] == 'refresh-blogs' ) {
			check_admin_referer( 'videopress-settings' );
			$options = $this->get_options();

			$result = $this->query( 'jetpack.vpGetBlogs' );
			if ( ! is_wp_error( $result ) ) {
				$options['blogs'] = $result;
				$this->update_options( $options );
			}

			wp_safe_redirect( Jetpack::module_configuration_url( $this->module ) );
		}
	}

	/**
	 * Renders the VideoPress Configuration screen in Jetpack.
	 */
	function jetpack_configuration_screen() {
		$options = $this->get_options();
		$refresh_url = wp_nonce_url( add_query_arg( 'videopress', 'refresh-blogs' ), 'videopress-settings' );
		?>
		<div class="narrow">
			<form method="post" id="videopress-settings">
				<input type="hidden" name="action" value="videopress-save" />
				<?php wp_nonce_field( 'videopress-settings' ); ?>

				<table id="menu" class="form-table">
					<tr>
						<th scope="row" colspan="2">
							<p><?php _e( 'Please note that the VideoPress module requires a WordPress.com account with an active <a href="http://store.wordpress.com/premium-upgrades/videopress/" target="_blank">VideoPress subscription</a>.', 'jetpack' ); ?></p>
						</th>
					</tr>
					<tr>
						<th scope="row">
							<label><?php _e( 'Connected WordPress.com Blog', 'jetpack' ); ?></label>
						</th>
						<td>
							<select name="blog_id">
								<option value="0" <?php selected( $options['blog_id'], 0 ); ?>> <?php esc_html_e( 'None', 'jetpack' ); ?></option>
								<?php foreach ( $options['blogs'] as $blog ) : ?>
								<option value="<?php echo absint( $blog['blog_id'] ); ?>" <?php selected( $options['blog_id'], $blog['blog_id'] ); ?>><?php echo esc_html( $blog['name'] ); ?> (<?php echo esc_html( $blog['domain'] ); ?>)</option>
								<?php endforeach; ?>
							</select>
							<p class="description"><?php _e( 'Only videos from the selected blog will be available in your media library.', 'jetpack' ); ?>
								<?php printf( __( '<a href="%s">Click here</a> to refresh this list.', 'jetpack' ), esc_url( $refresh_url ) ); ?>
							</p>
						</td>
					</tr>
					<tr>
						<th scope="row">
							<label><?php _e( 'Video Library Access', 'jetpack' ); ?></label>
						</th>
						<td>
							<label><input type="radio" name="videopress-access" value="" <?php checked( '', $options['access'] ); ?> />
								<?php _e( 'Do not allow other users to access my VideoPress library', 'jetpack' ); ?></label><br/>
							<label><input type="radio" name="videopress-access" value="read" <?php checked( 'read', $options['access'] ); ?> />
								<?php _e( 'Allow users to access my videos', 'jetpack' ); ?></label><br/>
							<label><input type="radio" name="videopress-access" value="edit" <?php checked( 'edit', $options['access'] ); ?> />
								<?php _e( 'Allow users to access and edit my videos', 'jetpack' ); ?></label><br/>
							<label><input type="radio" name="videopress-access" value="delete" <?php checked( 'delete', $options['access'] ); ?> />
								<?php _e( 'Allow users to access, edit, and delete my videos', 'jetpack' ); ?></label><br/><br />

							<label><input type="checkbox" name="videopress-upload" value="1" <?php checked( $options['allow-upload'] ); ?> />
								<?php _e( 'Allow users to upload videos', 'jetpack' ); ?></label><br />
						</td>
					</tr>
					<tr>
						<th scope="row">
							<label for="videopress-freedom"><?php _e( 'Free formats', 'jetpack' ); ?></label>
						</th>
						<td>
							<label><input type="checkbox" name="videopress-freedom" id="videopress-freedom" <?php checked( $options['freedom'] ); ?> />
								<?php _e( 'Only display videos in free software formats', 'jetpack' ); ?></label>
							<p class="description"><?php _e( 'Ogg file container with Theora video and Vorbis audio. Note that some browsers are unable to play free software video formats, including Internet Explorer and Safari.', 'jetpack' ); ?></p>
						</td>
					</tr>
					<tr>
						<th scope="row">
							<label for="videopress-hd"><?php _e( 'Default quality', 'jetpack' ); ?></label>
						</th>
						<td>
							<label><input type="checkbox" name="videopress-hd" id="videopress-hd" <?php checked( $options['hd'] ); ?> />
								<?php _e( 'Display higher quality video by default.', 'jetpack' ); ?></label>
							<p class="description"><?php _e( 'This setting may be overridden for individual videos.', 'jetpack' ); ?></p>
						</td>
					</tr>
				</table>

				<?php submit_button(); ?>
			</form>
		</div>
		<?php
	}

	function admin_menu() {
		add_media_page( __( 'VideoPress Library', 'jetpack' ), __( 'VideoPress', 'jetpack' ), 'upload_files', 'videopress-library', array( $this, 'admin_menu_library' ) );
	}

	function admin_menu_library() {
		wp_enqueue_media();
		$this->enqueue_admin_scripts();
		?>
		<div class="wrap" style="max-width: 600px;">
			<?php screen_icon(); ?>
	        <h2><?php _e( 'VideoPress Library', 'jetpack' ); ?></h2>
	        <p><?php _e( 'Use the button below to browse your VideoPress Library. Note that you can also browse your VideoPress Library while editing a post or page by using the <strong>Add Media</strong> button in the post editor.', 'jetpack' ); ?></p>
	        <p class="hide-if-no-js"><a href="#" id="videopress-browse" class="button"><?php _e( 'Browse Your VideoPress Library', 'jetpack' ); ?></a></p>
	        <p class="hide-if-js description"><?php _e( 'Please enable JavaScript support in your browser to use VideoPress.', 'jetpack' ); ?></p>
	    </div>
		<?php
	}

	/**
	 * A can of coke
	 *
	 * Similar to current_user_can, but internal to VideoPress. Returns
	 * true if the given VideoPress capability is allowed by the given user.
	 */
	function can( $cap, $user_id = false ) {
		if ( ! $user_id )
			$user_id = get_current_user_id();

		// Connection owners are allowed to do all the things.
		if ( $this->is_connection_owner( $user_id ) )
			return true;

		/**
		 * The access setting can be set by the connection owner, to allow sets
		 * of operations to other site users. Each access value corresponds to
		 * an array of things they can do.
		 */

		$options = $this->get_options();
		$map = array(
			'read'   => array( 'read_videos' ),
			'edit'   => array( 'read_videos', 'edit_videos' ),
			'delete' => array( 'read_videos', 'edit_videos', 'delete_videos' ),
		);

		if ( ! array_key_exists( $options['access'], $map ) )
			return false;

		if ( ! in_array( $cap, $map[ $options['access'] ] ) && 'upload_videos' != $cap )
			return false;

		// Additional and intrenal caps checks

		if ( ! user_can( $user_id, 'upload_files' ) )
			return false;

		if ( 'edit_videos' == $cap && ! user_can( $user_id, 'edit_others_posts' ) )
			return false;

		if ( 'delete_videos' == $cap && ! user_can( $user_id, 'delete_others_posts' ) )
			return false;

		if ( 'upload_videos' == $cap && ! $options['allow-upload'] )
			return false;

		return true;
	}

	/**
	 * Returns true if the provided user is the Jetpack connection owner.
	 */
	function is_connection_owner( $user_id = false ) {
		if ( ! $user_id )
			$user_id = get_current_user_id();

		$user_token = Jetpack_Data::get_access_token( JETPACK_MASTER_USER );
		return $user_token && is_object( $user_token ) && isset( $user_token->external_user_id ) && $user_id === $user_token->external_user_id;
	}

	/**
	 * Our custom AJAX callback for the query-attachments action
	 * used in the media modal. By-passed if not for VideoPress.
	 */
	function wp_ajax_query_attachments() {

		// Watch for VideoPress calls
		if ( ! isset( $_POST['query']['videopress'] ) )
			return;

		if ( ! $this->can( 'read_videos' ) )
			return wp_send_json_error( 'permission denied' );

		// Get and sanitize query arguments.
		$query_args = $this->sanitize_wp_query_args( $_POST['query'] );

		// Fire a remote WP_Query
		$result = $this->query( 'jetpack.vpQuery', $query_args );

		if ( is_wp_error( $result ) )
			return wp_send_json_error( 'xml rpc request error' );

		$items = $result;

		foreach ( $items as $key => $item ) {

			// Check local permissions
			if ( ! $this->can( 'edit_videos' ) )
				unset( $item['vp_nonces']['update'] );

			if ( ! $this->can( 'delete_videos' ) )
				unset( $item['vp_nonces']['delete'] );

			// Add a second pair of nonces for the .org blog.
			$item['nonces'] = array();
			if ( ! empty( $item['vp_nonces']['update'] ) )
				$item['nonces']['update'] = wp_create_nonce( 'update-videopress-post_' . $item['id'] );

			if ( ! empty( $item['vp_nonces']['delete'] ) )
				$item['nonces']['delete'] = wp_create_nonce( 'delete-videopress-post_' . $item['id'] );

			$item['vp_embed'] = videopress_shortcode_callback( array(
				$item['vp_guid'],
				'autoplay' => true,
				'flashonly' => true,
				'w' => 440,
			) );

			$items[ $key ] = $item;
		}

		wp_send_json_success( $items );
	}

	/**
	 * Sanitize user-provided WP_Query arguments
	 *
	 * These might be sent to the VideoPress server, for a remote WP_Query
	 * call so let's make sure they're sanitized and safe to send.
	 */
	function sanitize_wp_query_args( $args ) {
		$args = shortcode_atts( array(
			'posts_per_page' => 40,
			'orderby' => 'date',
			'order' => 'desc',
			'paged' => 1,
			's' => '',
		), (array) $args, 'wpvideo' );

		$args['posts_per_page'] = absint( $args['posts_per_page'] );

		$args['orderby'] = strtolower( $args['orderby'] );
		$args['orderby'] = ( in_array( $args['orderby'], array( 'date' ) ) ) ? $args['orderby'] : 'date';

		$args['order'] = strtolower( $args['order'] );
		$args['order'] = ( in_array( $args['order'], array( 'asc', 'desc' ) ) ) ? $args['order'] : 'desc';

		$args['paged'] = absint( $args['paged'] );
		$args['s'] = sanitize_text_field( $args['s'] );
		return $args;
	}

	/**
	 * Custom AJAX callback for the save-attachment action. If the request was
	 * not for a VideoPress object, core's fallback action will kick in.
	 */
	function wp_ajax_save_attachment() {
		if ( ! isset( $_POST['is_videopress'] ) )
			return;

		if ( ! $this->can( 'edit_videos' ) )
			return wp_send_json_error( 'permission denied' );

		$post_id = 0;
		if ( ! isset( $_POST['id'] ) || ! $post_id = absint( $_POST['id'] ) )
			wp_send_json_error();

		if ( ! isset( $_POST['vp_nonces']['update'] ) )
			wp_send_json_error();

		check_ajax_referer( 'update-videopress-post_' . $post_id, 'nonce' );

		$changes = ( ! empty( $_POST['changes'] ) ) ? (array) $_POST['changes'] : array();
		$changes = shortcode_atts( array(
			'title' => null,
			'caption' => null,
			'description' => null,

			'vp_share' => null,
			'vp_rating' => null,
		), $changes, 'wpvideo' );

		if ( ! is_null( $changes['vp_share'] ) )
			$changes['vp_share'] = (bool) $changes['vp_share'];

		if ( ! is_null( $changes['vp_rating'] ) )
			$changes['vp_rating'] = ( array_key_exists( $changes['vp_rating'], $this->get_available_ratings() ) ) ? $changes['vp_rating'] : null;

		// Remove null-values
		foreach ( $changes as $key => $value )
			if ( is_null( $value ) )
				unset( $changes[ $key ] );

		$result = $this->query( 'jetpack.vpSaveAttachment', array(
			'post_id' => $post_id,
			'changes' => $changes,
			'nonce' => $_POST['vp_nonces']['update'],
		) );

		if ( is_wp_error( $result ) )
			return wp_send_json_error( 'xml rpc request error' );

		wp_send_json_success();
	}

	/**
	 * Custom AJAX callback for the delete-post action, only for VideoPress objects.
	 */
	function wp_ajax_delete_post() {
		if ( ! isset( $_POST['is_videopress'] ) )
			return;

		if ( ! $this->can( 'delete_videos' ) )
			return wp_send_json_error( 'permission denied' );

		$post_id = 0;
		if ( ! isset( $_POST['id'] ) || ! $post_id = absint( $_POST['id'] ) )
			wp_send_json_error();

		if ( ! isset( $_POST['vp_nonces']['delete'] ) )
			wp_send_json_error();

		check_ajax_referer( 'delete-videopress-post_' . $post_id );

		$result = $this->query( 'jetpack.vpDeleteAttachment', array(
			'post_id' => $post_id,
			'nonce' => $_POST['vp_nonces']['delete'],
		) );

		if ( is_wp_error( $result ) )
			return wp_send_json_error( 'xml rpc request error' );

		wp_send_json_success();
	}

	/**
	 * Register VideoPress admin scripts.
	 */
	function enqueue_admin_scripts() {
		if ( did_action( 'videopress_enqueue_admin_scripts' ) )
			return;

		wp_enqueue_script( 'videopress-admin', plugins_url( 'js/videopress-admin.js', __FILE__ ), array( 'jquery', 'media-views', 'media-models' ), $this->version );
		wp_enqueue_style( 'videopress-admin', plugins_url( 'videopress-admin.css', __FILE__ ), array(), $this->version );

		$caps = array();
		foreach( array( 'read_videos', 'edit_videos', 'delete_videos', 'upload_videos' ) as $cap )
			$caps[ $cap ] = $this->can( $cap );

		$l10n = array(
			'selectVideoFile' => __( 'Please select a video file to upload.', 'jetpack' ),
			'videoUploading' => __( 'Your video is uploading... Please do not close this window.', 'jetpack' ),
			'unknownError' => __( 'An unknown error has occurred. Please try again later.', 'jetpack' ),
			'videoUploaded' => __( 'Your video has successfully been uploaded. It will appear in your VideoPress Library shortly.', 'jetpack' ),
			'VideoPressLibraryRouter' => __( 'VideoPress Library', 'jetpack' ),
			'uploadVideoRouter' => __( 'Upload a Video', 'jetpack' ),
			'insertVideoButton' => __( 'Insert Video', 'jetpack' ),

		);

		wp_localize_script( 'videopress-admin', 'VideoPressAdminSettings', array(
			'caps' => $caps,
			'l10n' => $l10n,
		) );
		
		/**
		 * Fires after VideoPress scripts are enqueued in the dashboard.
		 *
		 * @since 2.5.0
		 */
		do_action( 'videopress_enqueue_admin_scripts' );
	}

	/**
	 * Get an array of available ratings. Keys are options, values are labels.
	 */
	function get_available_ratings() {
		return array(
			'G' => 'G',
			'PG-13' => 'PG-13',
			'R-17' => 'R',
			'X-18' => 'X',
		);
	}

	/**
	 * Additional VideoPress media templates.
	 */
	function print_media_templates() {
		$options = $this->get_options();
		?>
		<script type="text/html" id="tmpl-videopress-attachment">
			<# if ( data.vp_ogg_url ) { #>
			<label class="setting vp-setting">
				<span><?php _e( 'Ogg File URL', 'jetpack' ); ?></span>
				<input type="text" value="{{ data.vp_ogg_url }}" onclick="this.focus();this.select();" readonly />
				<p class="help"><?php _e( 'Location of the Ogg video file.', 'jetpack' ); ?></p>
			</label>
			<# } #>

			<label class="setting vp-setting">
				<span><?php _e( 'Share', 'jetpack' ); ?></span>
				<input class="vp-checkbox" type="checkbox" <# if ( '1' === data.vp_share ) { #>checked<# } #> <# if ( ! data.can.save ) { #>disabled<# } #> />
				<label>
					<?php _e( 'Display share menu and allow viewers to embed or download this video', 'jetpack' ); ?>
				</label>
				<input class="vp-checkbox-text" type="text" value="{{ data.vp_share }}" data-setting="vp_share" style="display:none;" />
			</label>

			<label class="setting vp-setting">
				<span><?php _e( 'Rating', 'jetpack' ); ?></span>

				<?php foreach ( $this->get_available_ratings() as $value => $label ) : ?>
				<input class="vp-radio" type="radio" name="vp-radio-group" id="vp-rating-<?php echo sanitize_html_class( $value ); ?>" value="<?php echo esc_attr( $value ); ?>"
					<# if ( '<?php echo esc_attr( $value ); ?>' === data.vp_rating ) { #>checked<# } #>
					<# if ( ! data.can.save ) { #>disabled<# } #> />
				<label for="vp-rating-<?php echo sanitize_html_class( $value ); ?>"><?php echo esc_html( $label ); ?></label>
				<?php endforeach; ?>

				<input class="vp-radio-text" type="text" value="{{ data.vp_rating }}" data-setting="vp_rating" style="display:none;" />
			</label>

			<label class="setting vp-setting">
				<span><?php _e( 'Shortcode', 'jetpack' ); ?></span>
				<input type="text" value="[wpvideo {{ data.vp_guid }}]" onclick="this.focus();this.select();" readonly />
			</label>

			<label class="setting vp-setting vp-preview">
				<span><?php _e( 'Preview', 'jetpack' ); ?></span>
				<# if ( ! data.vp_thumbnail_url ) { #>
					<span class="videopress-preview-unavailable"><?php esc_html_e( 'The preview is unavailable while this video is being processed.', 'jetpack' ); ?></span>
				<# } else { #>
				<a href="#" class="videopress-preview" id="videopress-thumbnail-{{ data.vp_guid }}" data-videopress-guid="{{ data.vp_guid }}"><img src="{{ data.vp_thumbnail_url }}" /></a>
				<# } #>
			</label>
		</script>

		<script type="text/html" id="tmpl-videopress-media-modal">
			<div class="videopress-modal">
				<p><?php _e( 'Video Preview:', 'jetpack' ); ?></p>
				<div class="videopress-video-container">{{{ data.video }}}</div>
				<p class="submit">
					<a class="videopress-modal-close button" href="#"><?php _e( 'Close', 'jetpack' ); ?></a>
				</p>
			</div>
			<div class="videopress-modal-backdrop"></div>
		</script>

		<script type="text/html" id="tmpl-videopress-uploader">
			<div class="videopress-errors"></div>
			<form class="videopress-upload-form" action="" method="post" target="videopress_upload_frame" enctype="multipart/form-data">
				<input type="hidden" name="action" value="videopress_upload" />
				<input type="hidden" name="videopress_blog_id" value="0" />
				<input type="hidden" name="videopress_token" value="0" />
				<?php $formats = 'ogv, mp4, m4v, mov, wmv, avi, mpg, 3gp, 3g2'; ?>
				<?php
					$max_upload_size = 0;
					if ( ! empty( $options['meta']['max_upload_size'] ) )
						$max_upload_size = absint( $options['meta']['max_upload_size'] );

					$upload_size_unit = $max_upload_size;
					$byte_sizes = array( 'KB', 'MB', 'GB' );

					for ( $u = -1; $upload_size_unit > 1024 && $u < count( $byte_sizes ) - 1; $u++ )
						$upload_size_unit /= 1024;

					if ( $u < 0 ) {
						$upload_size_unit = 0;
						$u = 0;
					} else {
						$upload_size_unit = (int) $upload_size_unit;
					}
				?>
				<p><?php printf( __( 'Use the form below to upload a video to your VideoPress Library. The following video formats are supported: %s. Maximum upload file size is %d%s.', 'jetpack' ), esc_html( $formats ), esc_html( $upload_size_unit ), esc_html( $byte_sizes[ $u ] ) ); ?></p>

				<input type="file" name="videopress_file" />
				<?php submit_button( __( 'Upload Video', 'jetpack' ) ); ?>
			</form>
			<iframe width="0" height="0" name="videopress_upload_frame"></iframe>
		</script>
		<?php
	}

	/**
	 * Filters the VideoPress shortcode options, makes sure that
	 * the settings set in Jetpack's VideoPress module are applied.
	 */
	function videopress_shortcode_options( $options ) {
		$videopress_options = $this->get_options();

		if ( false === $options['freedom'] )
			$options['freedom'] = $videopress_options['freedom'];

		$options['hd'] = $videopress_options['hd'];

		return $options;
	}

}

// Initialize the module.
Jetpack_VideoPress::init();
