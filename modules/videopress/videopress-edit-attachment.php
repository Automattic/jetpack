<?php

class VideoPress_Edit_Attachment {
	public static function init() {
		static $instance = false;

		if ( !$instance ) {
			$instance = new VideoPress_Edit_Attachment();
		}

		return $instance;
	}

	public function __construct() {
		add_filter( 'attachment_fields_to_edit', array( $this, 'fields_to_edit' ), 10, 2 );
		add_filter( 'attachment_fields_to_save', array( $this, 'save_fields' ), 10, 2 );
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

		return $post;
	}


	/**
	 * Creates an array of video fields to edit based on transcoded videos.
	 *
	 * @param array $fields video fields of interest
	 * @param array $post post object
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

		$embed = "[wpvideo {$info->guid}]";

		if ( 'done' === $info->fmts_ogg ) {
			$v_name  = preg_replace( '/\.\w+/', '', basename( $info->path ) );
			$video_name = $v_name . '_fmt1.ogv';
			$ogg_url  = video_cdn_file_url( $info->guid, $video_name );

			$fields['video-ogg'] = array(
				'label' => __('Ogg File URL'),
				'input' => 'html',
				'html'  => "<input type='text' class='urlfield' readonly='readonly' name='attachments[$post_id][oggurl]' value='" . clean_url( $ogg_url, array( 'http', 'https' ) ) . "' />",
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

		$fields['video-shortcode'] = array(
			'label' => __( 'Shortcode' ),
			'input' => 'html',
			'html'  => $this->display_shortcode( $info, $embed )
		);

		return $fields;
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
	 * Build HTML to display shortcode link
	 *
	 * @param int $post_id numeric post (attachment) identifier
	 * @param object $info database row from the videos table
	 * @return string input elements of type text with existing stored value shown
	 */
	function display_shortcode( $info, $embed ) {
		$shortcode = '<input type="text" id="plugin-embed" style="width:180px;" value="' . esc_attr($embed) . '" onclick="this.focus();this.select();" />';

		return $shortcode;
	}

	/**
	 * Build HTML to display a form input radio button for video ratings
	 *
	 * @param int $post_id numeric post (attachment) identifier
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

VideoPress_Edit_Attachment::init();
