<?php
/**
 * Module Name: Image Widget
 * Module Description: Easily add images to your theme's sidebar.
 * Sort Order: 20
 * First Introduced: 1.2
 */

class Jetpack_Image_Widget extends WP_Widget {

	function Jetpack_Image_Widget() {
		$widget_ops = array( 'classname' => 'widget_image', 'description' => __( "Display an image in your sidebar", 'jetpack' ) );
		$control_ops = array( 'width' => 400 );
		$this->WP_Widget( 'image', __( 'Image (Jetpack)', 'jetpack' ), $widget_ops, $control_ops );
	}

	function widget( $args, $instance ) {
		extract( $args );

		echo $before_widget;

		$title = apply_filters( 'widget_title', $instance['title'] );

		if ( $title )
			echo $before_title . esc_html( $title ) . $after_title;

		if ( '' != $instance['img_url'] ) {

			$output = '<img src="' . esc_attr( $instance['img_url'] ) .'" ';
			if ( '' != $instance['alt_text'] )
				$output .= 'alt="' . esc_attr( $instance['alt_text'] ) .'" ';
			if ( '' != $instance['img_title'] )
				$output .= 'title="' . esc_attr( $instance['img_title'] ) .'" ';
			if ( '' == $instance['caption'] )
				$output .= 'class="align' . esc_attr( $instance['align'] ) . '" ';
			if ( '' != $instance['img_width'] )
				$output .= 'width="' . esc_attr( $instance['img_width'] ) .'" ';
			if ( '' != $instance['img_height'] )
				$output .= 'height="' . esc_attr( $instance['img_height'] ) .'" ';
			$output .= '/>';
			if ( '' != $instance['link'] )
				$output = '<a href="' . esc_attr( $instance['link'] ) . '">' . $output . '</a>';
			if ( '' != $instance['caption'] )
				$caption = apply_filters( 'widget_text', $instance['caption'] );
				$output = '[caption align="align' .  esc_attr( $instance['align'] ) . '" width="' . esc_attr( $instance['img_width'] ) .'"]' . $output . ' ' . $caption . '[/caption]'; // wp_kses_post caption on update 

			echo '<div class="jetpack-image-container">' . do_shortcode( $output ) . '</div>';
		}

		echo "\n" . $after_widget;
	}

	function update( $new_instance, $old_instance ) {
		 $allowed_caption_html = array( 
		 	'a' => array( 
		 		'href' => array(), 
		 		'title' => array(),
		 		), 
		 	'b' => array(), 
		 	'em' => array(), 
		 	'i' => array(), 
		 	'p' => array(), 
		 	'strong' => array() 
		 	);

		$instance = $old_instance;

		$instance['title']      = strip_tags( $new_instance['title'] );
		$instance['img_url']    = esc_url( $new_instance['img_url'], null, 'display' );
		$instance['alt_text']   = strip_tags( $new_instance['alt_text'] );
		$instance['img_title']  = strip_tags( $new_instance['img_title'] );
		$instance['caption']    = wp_kses( stripslashes($new_instance['caption'] ), $allowed_caption_html ); 
		$instance['align']      = $new_instance['align'];
		$instance['img_width']  = absint( $new_instance['img_width'] );
		$instance['img_height'] = absint( $new_instance['img_height'] );
		$instance['link']       = esc_url( $new_instance['link'], null, 'display' );

		return $instance;
	}

	function form( $instance ) {
		// Defaults
		$instance = wp_parse_args( (array) $instance, array( 'title' => '', 'img_url' => '', 'alt_text' => '', 'img_title' => '', 'caption' => '', 'align' => 'none', 'img_width' => '', 'img_height' => '', 'link' => '' ) );

		$title      = esc_attr( $instance['title'] );
		$img_url    = esc_url( $instance['img_url'], null, 'display' );
		$alt_text   = esc_attr( $instance['alt_text'] );
		$img_title  = esc_attr( $instance['img_title'] );
		$caption    = esc_textarea( $instance['caption'] );
		$align      = esc_attr( $instance['align'] );
		$img_width  = esc_attr( $instance['img_width'] );
		$img_height = esc_attr( $instance['img_height'] );

		if ( !empty( $instance['img_url'] ) ) {
			// Download the url to a local temp file and then process it with getimagesize so we can filter out domains which are blocking us
			$tmp_file = download_url( $instance['img_url'], 30 );
			if ( ! is_wp_error( $tmp_file ) ) {
				$size = getimagesize( $tmp_file );

				if ( '' == $instance['img_width'] ) {
					$width = $size[0];
					$img_width = $width;
				} else {
					$img_width = absint( $instance['img_width'] );
				}

				if ( '' == $instance['img_height'] ) {
					$height = $size[1];
					$img_height = $height;
				} else {
					$img_height = absint( $instance['img_height'] );
				}

				unlink( $tmp_file );
			}
		}

		$link = esc_url( $instance['link'], null, 'display' );

		echo '<p><label for="' . $this->get_field_id( 'title' ) . '">' . esc_html__( 'Widget title:', 'jetpack' ) . '
			<input class="widefat" id="' . $this->get_field_id( 'title' ) . '" name="' . $this->get_field_name( 'title' ) . '" type="text" value="' . $title . '" />
			</label></p>
			<p><label for="' . $this->get_field_id( 'img_url' ) . '">' . esc_html__( 'Image URL:', 'jetpack' ) . '
			<input class="widefat" id="' . $this->get_field_id( 'img_url' ) . '" name="' . $this->get_field_name( 'img_url' ) . '" type="text" value="' . $img_url . '" />
			</label></p>
			<p><label for="' . $this->get_field_id( 'alt_text' ) . '">' . esc_html__( 'Alternate text:', 'jetpack' ) . '  <a href="http://support.wordpress.com/widgets/image-widget/#image-widget-alt-text" target="_blank">( ? )</a>
			<input class="widefat" id="' . $this->get_field_id( 'alt_text' ) . '" name="' . $this->get_field_name( 'alt_text' ) . '" type="text" value="' . $alt_text . '" />
			</label></p>
			<p><label for="' . $this->get_field_id( 'img_title' ) . '">' .  esc_html__( 'Image title:', 'jetpack' ) . ' <a href="http://support.wordpress.com/widgets/image-widget/#image-widget-title" target="_blank">( ? )</a>
			<input class="widefat" id="' . $this->get_field_id( 'img_title' ) . '" name="' . $this->get_field_name( 'img_title' ) . '" type="text" value="' . $img_title . '" />
			</label></p>
			<p><label for="' . $this->get_field_id( 'caption' ) . '">' . esc_html__( 'Caption:', 'jetpack' ) . ' <a href="http://support.wordpress.com/widgets/image-widget/#image-widget-caption" target="_blank">( ? )</a>
			<textarea class="widefat" id="' . $this->get_field_id( 'caption' ) . '" name="' . $this->get_field_name( 'caption' ) . '" rows="2" cols="20">' . $caption . '</textarea> 
			</label></p>';

		$alignments = array(
			'none'   => __( 'None', 'jetpack' ),
			'left'   => __( 'Left', 'jetpack' ),
			'center' => __( 'Center', 'jetpack' ),
			'right'  => __( 'Right', 'jetpack' ),
		);
		echo '<p><label for="' . $this->get_field_id( 'align' ) . '">' .  esc_html__( 'Image Alignment:', 'jetpack' ) . '
			<select id="' . $this->get_field_id( 'align' ) . '" name="' . $this->get_field_name( 'align' ) . '">';
		foreach ( $alignments as $alignment => $alignment_name ) {
			echo  '<option value="' . esc_attr( $alignment ) . '" ';
			if ( $alignment == $align )
				echo 'selected="selected" ';
			echo '>' . esc_html($alignment_name) . "</option>\n";
		}
		echo '</select></label></p>';

		echo '<p><label for="' .  $this->get_field_id( 'img_width' ) . '">' . esc_html__( 'Width:', 'jetpack' ) . '
		<input size="3" id="' .  $this->get_field_id( 'img_width' ) . '" name="' . $this->get_field_name( 'img_width' ) . '" type="text" value="' .  $img_width . '" />
		</label>
		<label for="' . $this->get_field_id( 'img_height' ) . '">' . esc_html__( 'Height:', 'jetpack' ) . '
		<input size="3" id="' . $this->get_field_id( 'img_height' ) . '" name="' . $this->get_field_name( 'img_height' ) . '" type="text" value="' . $img_height . '" />
		</label><br />
		<small>' . esc_html__( "If empty, we will attempt to determine the image size.", 'jetpack' ) . '</small></p>
		<p><label for="' . $this->get_field_id( 'link' ) . '">' . esc_html__( 'Link URL (when the image is clicked):', 'jetpack' ) . '
		<input class="widefat" id="' . $this->get_field_id( 'link' ) . '" name="' . $this->get_field_name( 'link' ) . '" type="text" value="' . $link . '" />
		</label></p>';
	}

} //Class Jetpack_Image_Widget

function jetpack_image_widget_init() {
	register_widget( 'Jetpack_Image_Widget' );
}
add_action( 'widgets_init', 'jetpack_image_widget_init' );
