<?php

/**
 * VideoPress in Jetpack
 *
 */
class Jetpack_VideoPress {
	/** @var string */
	public $module = 'videopress';

	/** @var string */
	public $option_name = 'videopress';

	/** @var int */
	public $version = 5;

	/** @var array */
	public $jetpack_plans_with_videopress = array( 'jetpack_premium', 'jetpack_business' );

	/**
	 * Singleton
	 */
	public static function init() {
		static $instance = false;

		if ( ! $instance ) {
			$instance = new Jetpack_VideoPress;
		}

		return $instance;
	}

	function __construct() {
		//$this->version = time(); // <s>ghost</s> cache busters!
		add_action( 'init', array( $this, 'on_init' ) );
		add_action( 'jetpack_activate_module_videopress', array( $this, 'jetpack_module_activated' ) );
		add_action( 'jetpack_deactivate_module_videopress', array( $this, 'jetpack_module_deactivated' ) );
	}

	/**
	 * Fires on init since is_connection_owner should wait until the user is initialized by $wp->init();
	 */
	function on_init() {
		// Only the connection owner can configure this module.
		if ( $this->is_connection_owner() ) {
			Jetpack::enable_module_configurable( $this->module );
			Jetpack::module_configuration_load( $this->module, array( $this, 'jetpack_configuration_load' ) );
			Jetpack::module_configuration_screen( $this->module, array( $this, 'jetpack_configuration_screen' ) );
		}

		add_action( 'wp_enqueue_media', array( $this, 'enqueue_admin_scripts' ) );

		// Load these at priority -1 so they're fired before Core's are.
		add_action( 'wp_ajax_query-attachments', array( $this, 'wp_ajax_query_attachments' ), -1 );
		add_action( 'wp_ajax_save-attachment', array( $this, 'wp_ajax_save_attachment' ), -1 );
		add_action( 'wp_ajax_save-attachment-compat', array( $this, 'wp_ajax_save_attachment' ), -1 );
		add_action( 'wp_ajax_delete-post', array( $this, 'wp_ajax_delete_post' ), -1 );
		add_action( 'wp_ajax_videopress-update-transcoding-status', array(
			$this,
			'wp_ajax_update_transcoding_status'
		), -1 );

		add_action( 'wp_ajax_videopress-get-upload-token', array( $this, 'wp_ajax_videopress_get_upload_token' ) );
		add_filter( 'plupload_default_settings', array( $this, 'videopress_pluploder_config' ) );

		add_filter( 'videopress_shortcode_options', array( $this, 'videopress_shortcode_options' ) );
		add_filter( 'jetpack_xmlrpc_methods', array( $this, 'xmlrpc_methods' ) );
		add_filter( 'wp_get_attachment_url', array( $this, 'update_attachment_url_for_videopress' ), 10, 2 );

		// Add media list filters. These help keep bad videopress posts from appearing in the feed.
		add_filter( 'ajax_query_attachments_args', array( $this, 'ajax_query_attachments_args' ), 10, 1 );
		add_action( 'pre_get_posts', array( $this, 'media_list_table_query' ) );

		VideoPress_Scheduler::init();
	}

	/**
	 * Ajax method that is used by the VideoPress uploader to get a token to upload a file to the wpcom api.
	 *
	 * @return void
	 */
	function wp_ajax_videopress_get_upload_token() {

		$options = $this->get_options();

		$args = array(
			'method' => 'POST',
		);

		$endpoint = "sites/{$options['blog_id']}/media/token";
		$result   = Jetpack_Client::wpcom_json_api_request_as_blog( $endpoint, Jetpack_Client::WPCOM_JSON_API_VERSION, $args );

		if ( is_wp_error( $result ) ) {
			wp_send_json_error( array( 'message' => __( 'Could not obtain a VideoPress upload token. Please try again later.', 'jetpack' ) ) );

			return;
		}

		$response = json_decode( $result['body'], true );

		if ( empty( $response['upload_blog_id'] ) || empty( $response['upload_token'] ) ) {
			wp_send_json_error( array( 'message' => __( 'Could not obtain a VideoPress upload token. Please try again later.', 'jetpack' ) ) );

			return;
		}

		$title = sanitize_title( basename( $_POST['filename'] ) );

		$response['upload_action_url'] = self::make_media_upload_path( $response['upload_blog_id'] );
		$response['upload_media_id']   = $this->create_new_media_item( $title );

		wp_send_json_success( $response );
	}

	/**
	 * Get VideoPress options
	 */
	function get_options() {
		$defaults = array(
			'blog_id'      => 0,
			'freedom'      => false,
			'hd'           => true,
			'meta'         => array(
				'max_upload_size' => 0,
			),
		);

		$options = Jetpack_Options::get_option( $this->option_name, array() );

		// If options have not been saved yet, check for older VideoPress plugin options.
		if ( empty( $options ) ) {
			$options['freedom'] = (bool) get_option( 'video_player_freedom', false );
			$options['hd']      = (bool) get_option( 'video_player_high_quality', false );
		}

		$options = array_merge( $defaults, $options );

		// Add in the site id to the VideoPress options. Added at the bottom the ensure this cannot be overridden.

		if ( $options['blog_id'] == 0 && $this->isVideoPressIncludedInJetpackPlan() ) {
			$options['blog_id'] = Jetpack_Options::get_option( 'id' );
		}

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
		if ( ! $this->is_connection_owner() ) {
			return;
		}

		$options = $this->get_options();

		if ( $this->isVideoPressIncludedInJetpackPlan() ) {
			$options['blog_id'] = Jetpack_Options::get_option( 'id' );
		}

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
			'args'          => $args,
			'video_blog_id' => $options['blog_id'],
			'caps'          => array(),
		);

		// Let Jetpack know about our local caps.
		foreach ( array( 'edit_videos', 'delete_videos' ) as $cap ) {
			if ( $this->can( $cap ) ) {
				$params['caps'][] = $cap;
			}
		}

		$xml->query( $method, $params );

		if ( $xml->isError() ) {
			return new WP_Error( 'xml_rpc_error', 'An XML-RPC error has occurred.' );
		}

		$response = $xml->getResponse();

		// If there's any metadata with the response, save it for future use.
		if ( is_array( $response ) && isset( $response['meta'] ) ) {
			$options = $this->get_options();
			if ( $response['meta'] !== $options['meta'] ) {
				$options['meta'] = array_merge( $options['meta'], $response['meta'] );
				$this->update_options( $options );
			}
		}

		if ( is_array( $response ) && isset( $response['result'] ) ) {
			return $response['result'];
		}

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

			$options['freedom'] = isset( $_POST['videopress-freedom'] );
			$options['hd']      = isset( $_POST['videopress-hd'] );

			$this->update_options( $options );
			Jetpack::state( 'message', 'module_configured' );
			wp_safe_redirect( Jetpack::module_configuration_url( $this->module ) );
		}
	}

	/**
	 * Renders the VideoPress Configuration screen in Jetpack.
	 */
	function jetpack_configuration_screen() {
		?>
		<div class="narrow">

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
		if ( ! $user_id ) {
			$user_id = get_current_user_id();
		}

		// Connection owners are allowed to do all the things.
		if ( $this->is_connection_owner( $user_id ) ) {
			return true;
		}

		// Additional and internal caps checks

		if ( ! user_can( $user_id, 'upload_files' ) ) {
			return false;
		}

		if ( 'edit_videos' == $cap && ! user_can( $user_id, 'edit_others_posts' ) ) {
			return false;
		}

		if ( 'delete_videos' == $cap && ! user_can( $user_id, 'delete_others_posts' ) ) {
			return false;
		}

		return true;
	}

	/**
	 * Returns true if the provided user is the Jetpack connection owner.
	 */
	function is_connection_owner( $user_id = false ) {
		if ( ! $user_id ) {
			$user_id = get_current_user_id();
		}

		$user_token = Jetpack_Data::get_access_token( JETPACK_MASTER_USER );

		return $user_token && is_object( $user_token ) && isset( $user_token->external_user_id ) && $user_id === $user_token->external_user_id;
	}

	/**
	 * Our custom AJAX callback for the query-attachments action
	 * used in the media modal. By-passed if not for VideoPress.
	 */
	function wp_ajax_query_attachments() {

		// Watch for VideoPress calls
		if ( ! isset( $_POST['query']['videopress'] ) ) {
			return;
		}

		// Get and sanitize query arguments.
		$query_args = $this->sanitize_wp_query_args( $_POST['query'] );

		// Fire a remote WP_Query
		$result = $this->query( 'jetpack.vpQuery', $query_args );

		if ( is_wp_error( $result ) ) {
			return wp_send_json_error( 'xml rpc request error' );
		}

		$items = $result;

		foreach ( $items as $key => $item ) {

			// Check local permissions
			if ( ! $this->can( 'edit_videos' ) ) {
				unset( $item['vp_nonces']['update'] );
			}

			if ( ! $this->can( 'delete_videos' ) ) {
				unset( $item['vp_nonces']['delete'] );
			}

			// Add a second pair of nonces for the .org blog.
			$item['nonces'] = array();
			if ( ! empty( $item['vp_nonces']['update'] ) ) {
				$item['nonces']['update'] = wp_create_nonce( 'update-videopress-post_' . $item['id'] );
			}

			if ( ! empty( $item['vp_nonces']['delete'] ) ) {
				$item['nonces']['delete'] = wp_create_nonce( 'delete-videopress-post_' . $item['id'] );
			}

			$item['vp_embed'] = videopress_shortcode_callback( array(
				$item['vp_guid'],
				'autoplay'  => true,
				'flashonly' => true,
				'w'         => 440,
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
			'orderby'        => 'date',
			'order'          => 'desc',
			'paged'          => 1,
			's'              => '',
		), (array) $args, 'wpvideo' );

		$args['posts_per_page'] = absint( $args['posts_per_page'] );

		$args['orderby'] = strtolower( $args['orderby'] );
		$args['orderby'] = ( in_array( $args['orderby'], array( 'date' ) ) ) ? $args['orderby'] : 'date';

		$args['order'] = strtolower( $args['order'] );
		$args['order'] = ( in_array( $args['order'], array( 'asc', 'desc' ) ) ) ? $args['order'] : 'desc';

		$args['paged'] = absint( $args['paged'] );
		$args['s']     = sanitize_text_field( $args['s'] );

		return $args;
	}

	/**
	 * Custom AJAX callback for the save-attachment action. If the request was
	 * not for a VideoPress object, core's fallback action will kick in.
	 */
	function wp_ajax_save_attachment() {
		if ( ! isset( $_POST['is_videopress'] ) ) {
			return;
		}

		if ( ! $this->can( 'edit_videos' ) ) {
			return wp_send_json_error( 'permission denied' );
		}

		$post_id = 0;
		if ( ! isset( $_POST['id'] ) || ! $post_id = absint( $_POST['id'] ) ) {
			wp_send_json_error();
		}

		if ( ! isset( $_POST['vp_nonces']['update'] ) ) {
			wp_send_json_error();
		}

		check_ajax_referer( 'update-videopress-post_' . $post_id, 'nonce' );

		$changes = ( ! empty( $_POST['changes'] ) ) ? (array) $_POST['changes'] : array();
		$changes = shortcode_atts( array(
			'title'       => null,
			'caption'     => null,
			'description' => null,

			'vp_share'  => null,
			'vp_rating' => null,
		), $changes, 'wpvideo' );

		if ( ! is_null( $changes['vp_share'] ) ) {
			$changes['vp_share'] = (bool) $changes['vp_share'];
		}

		if ( ! is_null( $changes['vp_rating'] ) ) {
			$changes['vp_rating'] = ( array_key_exists( $changes['vp_rating'], $this->get_available_ratings() ) ) ? $changes['vp_rating'] : null;
		}

		// Remove null-values
		foreach ( $changes as $key => $value ) {
			if ( is_null( $value ) ) {
				unset( $changes[ $key ] );
			}
		}

		$result = $this->query( 'jetpack.vpSaveAttachment', array(
			'post_id' => $post_id,
			'changes' => $changes,
			'nonce'   => $_POST['vp_nonces']['update'],
		) );

		if ( is_wp_error( $result ) ) {
			return wp_send_json_error( 'xml rpc request error' );
		}

		wp_send_json_success();
	}

	/**
	 * Custom AJAX callback for the delete-post action, only for VideoPress objects.
	 */
	function wp_ajax_delete_post() {
		if ( ! isset( $_POST['is_videopress'] ) ) {
			return;
		}

		if ( ! $this->can( 'delete_videos' ) ) {
			return wp_send_json_error( 'permission denied' );
		}

		$post_id = 0;
		if ( ! isset( $_POST['id'] ) || ! $post_id = absint( $_POST['id'] ) ) {
			wp_send_json_error();
		}

		if ( ! isset( $_POST['vp_nonces']['delete'] ) ) {
			wp_send_json_error();
		}

		check_ajax_referer( 'delete-videopress-post_' . $post_id );

		$result = $this->query( 'jetpack.vpDeleteAttachment', array(
			'post_id' => $post_id,
			'nonce'   => $_POST['vp_nonces']['delete'],
		) );

		if ( is_wp_error( $result ) ) {
			return wp_send_json_error( 'xml rpc request error' );
		}

		wp_send_json_success();
	}

	/**
	 * Register VideoPress admin scripts.
	 */
	function enqueue_admin_scripts() {
		if ( did_action( 'videopress_enqueue_admin_scripts' ) ) {
			return;
		}

		if ( $this->shouldOverrideMediaUploader() ) {
			wp_enqueue_script( 'videopress-uploader', plugins_url( 'js/videopress-uploader.js', __FILE__ ), array(
				'jquery',
				'wp-plupload'
			), $this->version );
		}

		wp_enqueue_style( 'videopress-admin', plugins_url( 'videopress-admin.css', __FILE__ ), array(), $this->version );

		$caps = array();
		foreach ( array( 'edit_videos', 'delete_videos' ) as $cap ) {
			$caps[ $cap ] = $this->can( $cap );
		}

		// Leaving these as we may need to encorporate them somewhere else
		$l10n = array(
			'selectVideoFile'         => __( 'Please select a video file to upload.', 'jetpack' ),
			'videoUploading'          => __( 'Your video is uploading... Please do not close this window.', 'jetpack' ),
			'unknownError'            => __( 'An unknown error has occurred. Please try again later.', 'jetpack' ),
			'videoUploaded'           => __( 'Your video has successfully been uploaded. It will appear in your VideoPress Library shortly.', 'jetpack' ),
			'VideoPressLibraryRouter' => __( 'VideoPress Library', 'jetpack' ),
			'uploadVideoRouter'       => __( 'Upload a Video', 'jetpack' ),
			'insertVideoButton'       => __( 'Insert Video', 'jetpack' ),
		);

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
			'G'     => 'G',
			'PG-13' => 'PG-13',
			'R-17'  => 'R',
			'X-18'  => 'X',
		);
	}

	/**
	 * Filters the VideoPress shortcode options, makes sure that
	 * the settings set in Jetpack's VideoPress module are applied.
	 */
	function videopress_shortcode_options( $options ) {
		$videopress_options = $this->get_options();

		if ( false === $options['freedom'] ) {
			$options['freedom'] = $videopress_options['freedom'];
		}

		$options['hd'] = $videopress_options['hd'];

		return $options;
	}

	/**
	 * Adds additional methods the WordPress xmlrpc API for handling VideoPress specific features
	 *
	 * @param array $methods
	 *
	 * @return array
	 */
	public function xmlrpc_methods( $methods ) {

		$methods['jetpack.createMediaItem']      = array( $this, 'xmlrpc_create_media_item' );
		$methods['jetpack.updateVideoPressInfo'] = array( $this, 'xmlrpc_update_videopress_info' );

		return $methods;
	}

	/**
	 * Endpoint to allow the transcoding session to send updated information about the VideoPress video when it completes a stage of transcoding.
	 *
	 * @param array $vp_info
	 *
	 * @return array|bool
	 */
	public function xmlrpc_update_videopress_info( $vp_info ) {

		$errors = null;
		foreach ( $vp_info as $vp_item ) {
			$id   = $vp_item['post_id'];
			$guid = $vp_item['guid'];

			$attachment = get_post( $id );

			if ( ! $attachment ) {
				$errors[] = array(
					'id'    => $id,
					'error' => 'Post not found',
				);

				continue;
			}

			$attachment->guid = $vp_item['original'];
			$attachment->file = $vp_item['original'];

			wp_update_post( $attachment );

			// Update the vp guid and set it to a dirrect meta property.
			update_post_meta( $id, 'videopress_guid', $guid );

			$meta = wp_get_attachment_metadata( $attachment->ID );

			$current_poster = get_post_meta( $id, '_thumbnail_id' );

			$meta['width']             = $vp_item['width'];
			$meta['height']            = $vp_item['height'];
			$meta['original']['url']   = $vp_item['original'];
			$meta['videopress']        = $vp_item;
			$meta['videopress']['url'] = 'https://videopress.com/v/' . $guid;

			if ( ! $current_poster && isset( $vp_item['poster'] ) && ! empty( $vp_item['poster'] ) ) {
				$thumbnail_id = videopress_download_poster_image( $vp_item['poster'], $id );
				update_post_meta( $id, '_thumbnail_id', $thumbnail_id );
			}

			wp_update_attachment_metadata( $attachment->ID, $meta );

			// update the meta to tell us that we're processing or complete
			update_post_meta( $id, 'videopress_status', $this->is_video_finished_processing( $attachment->ID ) ? 'complete' : 'processing' );
		}

		if ( count( $errors ) > 0 ) {
			return array( 'errors' => $errors );

		} else {
			return true;
		}
	}

	/**
	 * This is used by the WPCOM VideoPress uploader in order to create a media item with
	 * specific meta data about an uploaded file. After this, the transcoding session will
	 * update the meta information via the xmlrpc_update_videopress_info() method.
	 *
	 * Note: This method technically handles the creation of multiple media objects, though
	 * in practice this is never done.
	 *
	 * @param array $media
	 *
	 * @return array
	 */
	public function xmlrpc_create_media_item( $media ) {
		$created_items = array();

		foreach ( $media as $media_item ) {

			$media_id = $this->create_new_media_item( sanitize_title( basename( $media_item['url'] ) ) );

			wp_update_attachment_metadata( $media_id, array(
				'original' => array(
					'url' => $media_item['url'],
				),
			) );

			$created_items[] = array(
				'id'   => $media_id,
				'post' => get_post( $media_id ),
			);
		}

		return array( 'media' => $created_items );
	}

	/**
	 * Ajax action to update the video transcoding status from the WPCOM API.
	 *
	 * @return void
	 */
	public function wp_ajax_update_transcoding_status() {
		if ( ! isset( $_POST['post_id'] ) ) {
			wp_send_json_error( array( 'message' => __( 'A valid post_id is required.', 'jetpack' ) ) );

			return;
		}

		$post_id = (int) $_POST['post_id'];

		if ( ! $this->update_video_meta_data( $post_id ) ) {
			wp_send_json_error( array( 'message' => __( 'That post does not have a VideoPress video associated to it..', 'jetpack' ) ) );

			return;
		}

		wp_send_json_success( array(
			'message' => __( 'Status updated', 'jetpack' ),
			'status'  => videopress_get_transcoding_status( $post_id )
		) );
	}

	/**
	 * Update the meta information  status for the given video post.
	 *
	 * @param int $post_id
	 *
	 * @return bool
	 */
	public function update_video_meta_data( $post_id ) {

		$meta = wp_get_attachment_metadata( $post_id );

		// If this has not been processed by VideoPress, we can skip the rest.
		if ( ! $meta || ! isset( $meta['videopress'] ) ) {
			return false;
		}

		$info = (object) $meta['videopress'];

		$result = wp_remote_get( $this->make_video_get_path( $info->guid ) );

		if ( is_wp_error( $result ) ) {
			return false;
		}

		$response = json_decode( $result['body'], true );

		// Update the attachment metadata.
		$meta['videopress'] = $response;

		wp_update_attachment_metadata( $post_id, $meta );

		return true;
	}

	/**
	 * Get the video update path
	 *
	 * @param string $guid
	 *
	 * @return string
	 */
	function make_video_get_path( $guid ) {
		return sprintf(
			'%s://%s/rest/v%s/videos/%s',
			'https',
			JETPACK__WPCOM_JSON_API_HOST,
			Jetpack_Client::WPCOM_JSON_API_VERSION,
			$guid
		);
	}

	/**
	 * An override for the attachment url, which returns back the WPCOM videopress original url,
	 * if it is set to the the objects metadata. this allows us to show the original uploaded
	 * file on the WPCOM architecture, instead of the locally uplodaded file,
	 * which doeasn't exist.
	 *
	 * @param string $url
	 * @param int $post_id
	 *
	 * @return mixed
	 */
	public function update_attachment_url_for_videopress( $url, $post_id ) {

		if ( get_post_mime_type( $post_id ) === 'video/videopress' ) {
			$meta = wp_get_attachment_metadata( $post_id );

			if ( isset( $meta['original']['url'] ) ) {
				$url = $meta['original']['url'];
			}
		}

		return $url;
	}

	/**
	 * @param string $title
	 *
	 * @return int|WP_Error
	 */
	public function create_new_media_item( $title ) {
		$post = array(
			'post_type'      => 'attachment',
			'post_mime_type' => 'video/videopress',
			'post_title'     => $title,
			'post_content'   => '',
		);

		$media_id = wp_insert_post( $post );

		add_post_meta( $media_id, 'videopress_status', 'new' );

		return $media_id;
	}

	/**
	 * Get the upload api path.
	 *
	 * @param int $blog_id The id of the blog we're uploading to.
	 *
	 * @return string
	 */
	protected function make_media_upload_path( $blog_id ) {
		return sprintf(
			'https://%s/rest/v1.1/sites/%s/videos/new',
			JETPACK__WPCOM_JSON_API_HOST,
			$blog_id
		);
	}

	/**
	 * Modify the default plupload config to turn on videopress specific filters.
	 */
	public function videopress_pluploder_config( $config ) {

		if ( ! isset( $config['filters']['max_file_size'] ) ) {
			$config['filters']['max_file_size'] = wp_max_upload_size() . 'b';
		}

		$config['filters']['videopress_check_uploads'] = $config['filters']['max_file_size'];

		// We're doing our own check in the videopress_check_uploads filter.
		unset( $config['filters']['max_file_size'] );

		return $config;
	}

	/**
	 * Media Grid:
	 * Filter out any videopress video posters that we've downloaded,
	 * so that they don't seem to display twice.
	 *
	 * @param array $args
	 *
	 * @return array
	 */
	public function ajax_query_attachments_args( $args ) {

		$args['meta_query'] = $this->add_status_check_to_meta_query( isset( $args['meta_query'] ) ? $args['meta_query'] : array() );

		return $args;
	}

	/**
	 * Media List:
	 * Do the same as ^^ but for the list view.
	 *
	 * @param WP_Query $query
	 *
	 * @return array
	 */
	public function media_list_table_query( $query ) {
		if ( is_admin() && $query->is_main_query() && ( 'upload' === get_current_screen()->id ) ) {
			$meta_query = $this->add_status_check_to_meta_query( $query->get( 'meta_query' ) );

			$query->set( 'meta_query', $meta_query );
		}
	}

	/**
	 * Add the a videopress_status check to the meta query and if it has a `videopress_status` only include those with
	 * a status of 'completed' or 'processing'.
	 *
	 * @param array $meta_query
	 *
	 * @return array
	 */
	protected function add_status_check_to_meta_query( $meta_query ) {

		if ( ! is_array( $meta_query ) ) {
			$meta_query = array();
		}

		$meta_query[] = array(
			array(
				'relation' => 'OR',
				array(
					'key'     => 'videopress_status',
					'value'   => array( 'completed', 'processing' ),
					'compare' => 'IN',
				),
				array(
					'key'     => 'videopress_status',
					'compare' => 'NOT EXISTS',
				),
			),
		);

		return $meta_query;
	}

	/**
	 * Check to see if a video has completed processing.
	 *
	 * @param int $post_id
	 *
	 * @return bool
	 */
	public function is_video_finished_processing( $post_id ) {
		$post = get_post( $post_id );

		if ( is_wp_error( $post ) ) {
			return false;
		}

		$meta = wp_get_attachment_metadata( $post->ID );

		if ( ! isset( $meta['videopress'] ) || ! is_array( $meta['videopress'] ) ) {
			return false;
		}

		// These are explicitly declared to avoid doing unnecessary loops across two levels of arrays.
		if ( isset( $meta['videopress']['files_status']['hd'] ) && $meta['videopress']['files_status']['hd'] != 'DONE' ) {
			return false;
		}

		if ( isset( $meta['videopress']['files_status']['dvd'] ) && $meta['videopress']['files_status']['dvd'] != 'DONE' ) {
			return false;
		}

		if ( isset( $meta['videopress']['files_status']['std']['mp4'] ) && $meta['videopress']['files_status']['std']['mp4'] != 'DONE' ) {
			return false;
		}

		if ( isset( $meta['videopress']['files_status']['std']['ogg'] ) && $meta['videopress']['files_status']['std']['ogg'] != 'DONE' ) {
			return false;
		}

		return true;
	}

	/**
	 * Helper function to determine if the media uploader should be overridden.
	 *
	 * The rules are simple, only try to load the script when on the edit post or new post pages.
	 *
	 * @return bool
	 */
	protected function shouldOverrideMediaUploader() {
		global $pagenow;

		// Only load in the admin
		if ( !is_admin() ) {
			return false;
		}

		// Only load on the post or new post page.
		if ( $pagenow !== 'post-new.php' && $pagenow !== 'post.php' ) {
			return false;
		}

		$options = $this->get_options();

		return $options['blog_id'] > 0;
	}

	/**
	 * Does the site have a Jetpack plan attached to it that includes VideoPress
	 *
	 * @todo We might want to cache this.
	 * @return bool
	 */
	protected function isVideoPressIncludedInJetpackPlan() {
		$site_id = Jetpack_Options::get_option( 'id' );
		$result  = Jetpack_Client::wpcom_json_api_request_as_blog( sprintf( '/sites/%d', $site_id ), '1.1' );

		if ( is_wp_error( $result ) ) {
			return false;
		}

		$response = json_decode( $result['body'], true );

		return in_array( $response['plan']['product_slug'], $this->jetpack_plans_with_videopress );
	}
}

// Initialize the module.
Jetpack_VideoPress::init();
