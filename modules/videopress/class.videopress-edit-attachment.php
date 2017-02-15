<?php
/**
 * VideoPress edit attachment screen
 *
 * @since 4.1
 */
class VideoPress_Edit_Attachment {

	/**
	 * Singleton method to initialize the object only once.
	 *
	 * @return VideoPress_Edit_Attachment
	 */
	public static function init() {
		static $instance = null;

		if ( ! $instance ) {
			$instance = new VideoPress_Edit_Attachment();
		}

		return $instance;
	}

	/**
	 * VideoPress_Edit_Attachment constructor.
	 *
	 * Adds in appropriate actions for attachment fields editor, meta boxes and saving.
	 */
	public function __construct() {
		add_filter( 'attachment_fields_to_edit', array( $this, 'fields_to_edit' ), 10, 2 );
		add_filter( 'attachment_fields_to_save', array( $this, 'save_fields' ), 10, 2 );
		add_filter( 'wp_ajax_save-attachment', array( $this, 'save_fields' ), -1 );
		add_filter( 'wp_ajax_save-attachment-compat', array( $this, 'save_fields' ), -1 );

		add_action( 'add_meta_boxes', array( $this, 'configure_meta_boxes' ), 10, 2 );
	}

	/**
	 * @param string  $post_type
	 * @param object  $post
	 */
	public function configure_meta_boxes( $post_type = 'unknown', $post = NULL ) {
		if ( NULL == $post ) {
			$post = (object) array ( 'ID' => 0 );
		}

		if ( 'attachment' != $post_type ) {
			return;
		}

		// If this has not been processed by videopress, we can skip the rest.
		if ( ! is_videopress_attachment( $post->ID ) ) {
			return;
		}

		add_meta_box( 'videopress-media-info', __( 'VideoPress Information', 'jetpack' ), array( $this, 'videopress_information_box' ), 'attachment', 'side', 'core' );
	}

	/**
	 * @param array $post
	 * @param array|null $attachment
	 *
	 * @return array
	 */
	public function save_fields( $post, $attachment = null ) {
		if ( $attachment === null && isset( $_POST['attachment'] ) ) {
			$attachment = $_POST['attachment'];
		}

		if ( ! isset( $attachment['is_videopress_attachment'] ) || $attachment['is_videopress_attachment'] !== 'yes' ) {
			return $post;
		}

		$post_id = absint( $post['ID'] );

		$meta = wp_get_attachment_metadata( $post_id );

		// If this has not been processed by videopress, we can skip the rest.
		if ( ! is_videopress_attachment( $post['ID'] ) ) {
			return $post;
		}

		$values = array();

		// Add the video title & description in, so that we save it properly.
		if ( isset( $_POST['post_title'] ) ) {
			$values['title'] = trim( strip_tags( $_POST['post_title'] ) );
		}

		if ( isset( $_POST['post_excerpt'] ) ) {
			$values['description'] = trim( strip_tags( $_POST['post_excerpt'] ) );
		}

		if ( isset( $attachment['rating'] ) ) {
			$rating = $attachment['rating'];

			if ( ! empty( $rating ) && in_array( $rating, array( 'G', 'PG-13', 'R-17', 'X-18' ) ) ) {
				$values['rating'] = $rating;
			}
		}

		// We set a default here, as if it isn't selected, then we'll turn it off.
		$values['display_embed'] = 0;
		if ( isset( $attachment['display_embed'] ) ) {
			$display_embed = $attachment['display_embed'];

			$values['display_embed'] = 'on' === $display_embed  ? 1 : 0;
		}

		$args = array(
			'method'  => 'POST',
		);

        $guid = get_post_meta( $post_id, 'videopress_guid', true );

		$endpoint = "videos/{$guid}";
		$result = Jetpack_Client::wpcom_json_api_request_as_blog( $endpoint, Jetpack_Client::WPCOM_JSON_API_VERSION, $args, $values );

		if ( is_wp_error( $result ) ) {
			$post['errors']['videopress']['errors'][] = __( 'There was an issue saving your updates to the VideoPress service. Please try again later.', 'jetpack' );
			return $post;
		}

		if ( isset( $values['display_embed'] ) ) {
			$meta['videopress']['display_embed'] = $values['display_embed'];
		}

		if ( isset( $values['rating'] ) ) {
			$meta['videopress']['rating'] = $values['rating'];
		}

		wp_update_attachment_metadata( $post_id, $meta );

		$response = json_decode( $result['body'], true );

		if ( 'true' !== $response ) {
			return $post;
		}

		return $post;
	}


	/**
	 * Get the upload api path.
	 *
	 * @param string $guid
	 * @return string
	 */
	public function make_video_api_path( $guid ) {
		return sprintf(
			'%s://%s/rest/v%s/videos/%s',
			'https',
			'public-api.wordpress.com', //JETPACK__WPCOM_JSON_API_HOST,
			Jetpack_Client::WPCOM_JSON_API_VERSION,
			$guid
		);
	}


	/**
	 * Creates an array of video fields to edit based on transcoded videos.
	 *
	 * @param array $fields video fields of interest
	 * @param stdClass $post post object
	 * @return array modified version of video fields for administrative interface display
	 */
	public function fields_to_edit( $fields, $post ) {
		$post_id = absint( $post->ID );

		$meta = wp_get_attachment_metadata( $post_id );

		// If this has not been processed by videopress, we can skip the rest.
		if ( ! is_videopress_attachment( $post_id ) || ! isset( $meta['videopress'] ) ) {
			return $fields;
		}

		$info = (object) $meta['videopress'];
        $file_statuses = isset( $meta['file_statuses'] ) ? $meta['file_statuses'] : array();

        $guid = get_post_meta( $post_id, 'videopress_guid', true );

		unset( $fields['url'] );
		unset( $fields['post_content'] );

		if ( isset( $file_statuses['ogg'] ) && 'done' ===  $file_statuses['ogg'] ) {
			$v_name  = preg_replace( '/\.\w+/', '', basename( $info->path ) );
			$video_name = $v_name . '_fmt1.ogv';
			$ogg_url  = videopress_cdn_file_url( $guid, $video_name );

			$fields['video-ogg'] = array(
				'label' => __( 'Ogg File URL', 'jetpack' ),
				'input' => 'html',
				'html'  => "<input type='text' class='urlfield' readonly='readonly' name='attachments[$post_id][oggurl]' value='" . esc_url( $ogg_url, array( 'http', 'https' ) ) . "' />",
				'helps' => __( 'Location of the Ogg video file.', 'jetpack' ),
			);
		}

		$fields['post_title']['helps'] = __( 'Title will appear on the first frame of your video', 'jetpack' );

		$fields['post_excerpt']['label'] = _x( 'Description', 'A header for the short description display', 'jetpack' );
		$fields['post_excerpt']['input'] = 'textarea';
		$fields['post_excerpt']['value'] = $info->description;

		$fields['is_videopress_attachment'] = array(
			'input' => 'hidden',
			'value' => 'yes',
		);

		$fields['videopress_shortcode'] = array(
			'label'         => _x( 'Shortcode', 'A header for the shortcode display', 'jetpack' ),
			'input'         => 'html',
			'html'          => "<input type=\"text\" name=\"videopress_shortcode\" value=\"[videopress {$guid}]\" readonly=\"readonly\"/>",
			'show_in_modal' => true,
			'show_in_edit'  => false,
		);

		$fields['display_embed'] = array(
			'label' => _x( 'Share', 'A header for the video sharing options area', 'jetpack' ),
			'input' => 'html',
			'html'  => $this->display_embed_choice( $info )
		);

		$fields['video-rating'] = array(
			'label' => _x( 'Rating', 'A header for the video rating area', 'jetpack' ),
			'input' => 'html',
			'html'  => $this->display_rating( $info )
		);

		return $fields;
	}

	/**
	 * @param stdClass $post
	 */
	public function videopress_information_box( $post ) {
		$post_id = absint( $post->ID );

		$meta = wp_get_attachment_metadata( $post_id );
        $guid = get_post_meta( $post_id, 'videopress_guid', true );

		// If this has not been processed by videopress, we can skip the rest.
		if ( ! is_videopress_attachment( $post_id ) ) {
			return;
		}

		$info = (object) $meta['videopress'];

		$status = videopress_get_transcoding_status( $post_id );

		$formats = array(
			'std_mp4' => 'Standard MP4',
			'std_ogg' => 'OGG Vorbis',
			'dvd_mp4' => 'DVD',
			'hd_mp4'  => 'High Definition',
		);

		$embed = "[videopress {$guid}]";

		$shortcode = '<input type="text" id="plugin-embed" readonly="readonly" style="width:180px;" value="' . esc_attr( $embed ) . '" onclick="this.focus();this.select();" />';

		$trans_status = '';
		$all_trans_done = true;
		foreach ( $formats as $status_key => $name ) {
			if ( 'DONE' !== $status[ $status_key ] ) {
				$all_trans_done = false;
			}

			$trans_status .= '- <strong>' . $name . ":</strong> <span id=\"status_$status_key\">" . ( 'DONE' === $status[ $status_key ]  ? 'Done' : 'Processing' ) . '</span><br>';
		}

		$nonce = wp_create_nonce( 'videopress-update-transcoding-status' );

		$url = 'empty';
		if ( ! empty( $guid ) ) {
			$url = videopress_build_url( $guid );
			$url = "<a href=\"{$url}\">{$url}</a>";
		}

		$poster = '<em>Still Processing</em>';
		if ( ! empty( $info->poster ) ) {
			$poster = "<br><img src=\"{$info->poster}\" width=\"175px\">";
		}

		$status_update = '';
		if ( ! $all_trans_done ) {
			$status_update = ' (<a href="javascript:;" id="videopress-update-transcoding-status">update</a>)';
		}

		$html = <<< HTML

<div class="misc-pub-section misc-pub-shortcode">
	<strong>Shortcode</strong><br>
	{$shortcode}
</div> 
<div class="misc-pub-section misc-pub-url">
	<strong>Url</strong>
	{$url}
</div> 
<div class="misc-pub-section misc-pub-poster">
	<strong>Poster</strong>
	{$poster}
</div>
<div class="misc-pub-section misc-pub-status">
	<strong>Transcoding Status$status_update:</strong>
	<div id="videopress-transcoding-status">{$trans_status}</div>
</div>



<script>
	jQuery( function($) {
		$( '#videopress-update-transcoding-status' ).on( "click", function() {
			jQuery.ajax( {
				type: 'post',
				url: 'admin-ajax.php',
				data: { 
					action: 'videopress-update-transcoding-status',
					post_id: '{$post_id}',
					_ajax_nonce: '{$nonce}' 
				},
				complete: function( response ) {
					if ( 200 === response.status ) {
						var statuses = response.responseJSON.data.status;

						for (var key in statuses) {
							$('#status_' + key).text( 'DONE' === statuses[key] ? 'Done' : 'Processing' );
						}
					}
				}
			});
		} );
	} );
</script>
HTML;

		echo $html;
	}

	/**
	 * Build HTML to display a form checkbox for embedcode display preference
	 *
	 * @param object $info database row from the videos table
	 * @return string input element of type checkbox set to checked state based on stored embed preference
	 */
	protected function display_embed_choice( $info ) {
		$id = "attachments-{$info->post_id}-displayembed";
		$out  = "<label for='$id'><input type='checkbox' name='attachments[{$info->post_id}][display_embed]' id='$id'";
		if ( $info->display_embed )
			$out .= ' checked="checked"';
		$out .= " />" . __( 'Display share menu and allow viewers to embed or download this video', 'jetpack' ) . '</label>';
		return $out;
	}

	/**
	 * Build HTML to display a form input radio button for video ratings
	 *
	 * @param object $info database row from the videos table
	 * @return string input elements of type radio with existing stored value selected
	 */
	protected function display_rating( $info ) {
		$out = '';

		$ratings = array(
			'G'     => 'G',
			'PG-13' => 'PG-13',
			'R-17'  => 'R',
			'X-18'  => 'X',
		);

		foreach( $ratings as $r => $label ) {
			$id = "attachments-{$info->post_id}-rating-$r";
			$out .= "<label for=\"$id\"><input type=\"radio\" name=\"attachments[{$info->post_id}][rating]\" id=\"$id\" value=\"$r\"";
			if ( $info->rating == $r ) {
				$out .= ' checked="checked"';
			}

			$out .= " />$label</label>";
			unset( $id );
		}

		return $out;
	}
}

// Let's start this thing up.
VideoPress_Edit_Attachment::init();