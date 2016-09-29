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

		if ( !$instance ) {
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

		$meta = wp_get_attachment_metadata( $post->ID );

		// If this has not been processed by videopress, we can skip the rest.
		if ( ! isset( $meta['videopress'] ) ) {
			return;
		}

		add_meta_box( 'videopress-media-info', __( 'VideoPress Information', 'jetpack' ), array( $this, 'videopress_information_box' ), 'attachment', 'side', 'core' );
	}

	/**
	 * @param array $post
	 * @param array $attachment
	 *
	 * @return array
	 */
	public function save_fields( $post, $attachment ) {

		$post_id = absint( $post['ID'] );

		$meta = wp_get_attachment_metadata( $post_id );

		// If this has not been processed by videopress, we can skip the rest.
		if ( ! isset( $meta['videopress'] ) ) {
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

			if ( ! empty( $value ) && in_array( $rating, array( 'G', 'PG-13', 'R-17', 'X-18' ) ) ) {
				$values['rating'] = $rating;
			}
		}

		// We set a default here, as if it isn't selected, then we'll turn it off.
		$attachment['display_embed'] = 0;
		if ( isset( $attachment['display_embed'] ) ) {
			$display_embed = $attachment['display_embed'];

			$values['display_embed'] = 'on' === $display_embed  ? 1 : 0;
		}

		$args = array(
			'method'  => 'POST',
		);

		$endpoint = "videos/{$meta['videopress']['guid']}";
		$result = Jetpack_Client::wpcom_json_api_request_as_blog( $endpoint, Jetpack_Client::WPCOM_JSON_API_VERSION, $args, $values );

		if ( is_wp_error( $result ) ) {
			$post['errors']['videopress']['errors'][] = __( 'There was an issue saving your updates to the VideoPress service. Please try again later.' );
			return $post;
		}

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
		if ( ! isset( $meta['videopress'] ) ) {
			return $fields;
		}

		$info = (object) $meta['videopress'];

		unset( $fields['url'] );
		unset( $fields['post_content'] );

		if ( isset( $info->files_status['std']['ogg'] ) && 'done' ===  $info->files_status['std']['ogg'] ) {
			$v_name  = preg_replace( '/\.\w+/', '', basename( $info->path ) );
			$video_name = $v_name . '_fmt1.ogv';
			$ogg_url  = video_cdn_file_url( $info->guid, $video_name );

			$fields['video-ogg'] = array(
				'label' => __('Ogg File URL'),
				'input' => 'html',
				'html'  => "<input type='text' class='urlfield' readonly='readonly' name='attachments[$post_id][oggurl]' value='" . esc_url( $ogg_url, array( 'http', 'https' ) ) . "' />",
				'helps' => __('Location of the Ogg video file.'),
			);
		}

		$fields['post_title']['helps'] = __( 'Title will appear on the first frame of your video' );

		$fields['post_excerpt']['label'] = __( 'Description' );
		$fields['post_excerpt']['input'] = 'textarea';
		$fields['post_excerpt']['value'] = $info->description;

		$fields['display_embed'] = array(
			'label' => __( 'Share' ),
			'input' => 'html',
			'html'  => $this->display_embed_choice( $info )
		);

		$fields['video-rating'] = array(
			'label' => __( 'Rating' ),
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

		// If this has not been processed by videopress, we can skip the rest.
		if ( ! isset( $meta['videopress'] ) ) {
			return;
		}

		$info = (object) $meta['videopress'];

		$formats = array(
			'Standard' => isset( $info->files_status ) ? $info->files_status['std']['mp4'] : null,
			'Ogg Vorbis' => isset( $info->files_status ) ? $info->files_status['std']['ogg'] : null,
			'DVD' => isset( $info->files_status ) ? $info->files_status['dvd'] : null,
			'HD' => isset( $info->files_status ) ? $info->files_status['hd'] : null,
		);

		$embed = "[wpvideo {$info->guid}]";

		$shortcode = '<input type="text" id="plugin-embed" readonly="readonly" style="width:180px;" value="' . esc_attr($embed) . '" onclick="this.focus();this.select();" />';

		$trans_status = '';
		foreach ( $formats as $name => $status) {
			$trans_status .= '<strong>' . $name . ':</strong> ' . ( 'done' === $status  ? 'Done' : 'Processing' ) . '<br>';
		}

		$nonce = wp_create_nonce( 'videopress-update-transcoding-status' );

		$url = 'empty';
		if ( ! empty( $info->url ) ) {
			$url = "<a href=\"{$info->url}\">{$info->url}</a>";
		}

		$poster = 'empty';
		if ( ! empty( $info->poster ) ) {
			$poster = "<img src=\"{$info->poster}\" width=\"175px\">";
		}

		$html = <<< HTML

<div class="misc-pub-section misc-pub-shortcode">Shortcode:</div>
<strong>{$shortcode}</strong>
<div class="misc-pub-section misc-pub-url">Url:</div>
<strong>{$url}</strong>
<div class="misc-pub-section misc-pub-poster">Poster:</div>
<strong>{$poster}</strong>
<div class="misc-pub-section misc-pub-status">Status (<a href="javascript:;" id="videopress-update-transcoding-status">update</a>):</div>
<strong id="videopress-transcoding-status">{$trans_status}</strong>


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
		$out  = "<input type='checkbox' name='attachments[{$info->post_id}][display_embed]' id='$id'";
		if ( $info->display_embed )
			$out .= ' checked="checked"';
		$out .= " /><label for='$id'>" . __( 'Display share menu and allow viewers to embed or download this video' ) . '</label>';
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
			$out .= "<input type='radio' name='attachments[{$info->post_id}][rating]' id='$id' value='$r'";
			if ( $info->rating == $r )
				$out .= ' checked="checked"';
			$out .= " /><label for='$id'>$label</label>";
			unset( $id );
		}
		return $out;
	}
}

// Let's start this thing up.
VideoPress_Edit_Attachment::init();