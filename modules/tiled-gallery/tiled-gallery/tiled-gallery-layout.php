<?php

abstract class Jetpack_Tiled_Gallery_Layout {
	protected $type; // Defined in child classes
	public $attachments;
	public $link;
	public $grayscale;

	public function __construct( $attachments, $link, $grayscale ) {
		$this->attachments = $attachments;
		$this->link = $link;
		$this->needs_attachment_link = ! ( isset( $link ) && $link == 'file' );
		$this->grayscale = $grayscale;
	}

	abstract public function HTML();

	public function get_attachment_link( $attachment_id, $orig_file ) {
		if ( isset( $this->link ) && $this->link == 'file' )
			return $orig_file;
		else
			return get_attachment_link( $attachment_id );
	}

	function generate_carousel_container() {
		global $post;

		$html = '<div '. $this->gallery_classes() . ' data-original-width="' . esc_attr( Jetpack_Tiled_Gallery::get_content_width() ) . '">';
		$blog_id = (int) get_current_blog_id();

		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			$likes_blog_id = $blog_id;
		} else {
			$likes_blog_id = Jetpack_Options::get_option( 'id' );
		}

		if ( in_array( 'carousel', Jetpack::get_active_modules() ) || 'carousel' == $this->atts['link'] ) {
			$extra_data = array( 'data-carousel-extra' => array( 'blog_id' => $blog_id, 'permalink' => get_permalink( isset( $post->ID ) ? $post->ID : 0 ), 'likes_blog_id' => $likes_blog_id ) );
		} else {
			$extra_data = array();
		}

		foreach ( (array) $extra_data as $data_key => $data_values ) {
			$html = str_replace( '<div ', '<div ' . esc_attr( $data_key ) . "='" . json_encode( $data_values ) . "' ", $html );
		}

		return $html;
	}

	function generate_carousel_image_args( $image ) {
		$attachment_id = $image->ID;
		$orig_file       = wp_get_attachment_url( $attachment_id );
		$meta            = wp_get_attachment_metadata( $attachment_id );
		$size            = isset( $meta['width'] ) ? intval( $meta['width'] ) . ',' . intval( $meta['height'] ) : '';
		$img_meta        = ( ! empty( $meta['image_meta'] ) ) ? (array) $meta['image_meta'] : array();
		$comments_opened = intval( comments_open( $attachment_id ) );

		$medium_file_info = wp_get_attachment_image_src( $attachment_id, 'medium' );
		$medium_file      = isset( $medium_file_info[0] ) ? $medium_file_info[0] : '';

		$large_file_info  = wp_get_attachment_image_src( $attachment_id, 'large' );
		$large_file       = isset( $large_file_info[0] ) ? $large_file_info[0] : '';
		$attachment_title = wptexturize( $image->post_title );
		$attachment_desc  = wpautop( wptexturize( $image->post_content ) );

        // Not yet providing geo-data, need to "fuzzify" for privacy
		if ( ! empty( $img_meta ) ) {
            foreach ( $img_meta as $k => $v ) {
                if ( 'latitude' == $k || 'longitude' == $k )
                    unset( $img_meta[$k] );
            }
        }

		$img_meta = json_encode( array_map( 'strval', $img_meta ) );

		$output = sprintf(
				'data-attachment-id="%1$d" data-orig-file="%2$s" data-orig-size="%3$s" data-comments-opened="%4$s" data-image-meta="%5$s" data-image-title="%6$s" data-image-description="%7$s" data-medium-file="%8$s" data-large-file="%9$s"',
				esc_attr( $attachment_id ),
				esc_url( wp_get_attachment_url( $attachment_id ) ),
				esc_attr( $size ),
				esc_attr( $comments_opened ),
				esc_attr( json_encode( array_map( 'strval', $img_meta ) ) ),
				esc_attr( $attachment_title ),
				esc_attr( $attachment_desc ),
				esc_url( $medium_file ),
				esc_url( $large_file )
			);
		return $output;
	}

	public function gallery_classes() {
		$classes = 'class="tiled-gallery type-' . esc_attr( $this->type ) . ' tiled-gallery-unresized"';
		return $classes;
	}

}
?>
