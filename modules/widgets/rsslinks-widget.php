<?php
/**
 * Module Name: RSS Links Widget
 * Module Description: Easily add RSS links to your theme's sidebar.
 * Sort Order: 20
 * First Introduced: 1.2
 */

class Jetpack_RSS_Links_Widget extends WP_Widget {

	function Jetpack_RSS_Links_Widget() {
		$widget_ops = array('classname' => 'widget_rss_links', 'description' => __("Links to your blog's RSS feeds", 'jetpack') );
		$this->WP_Widget('rss_links', __('RSS Links (Jetpack)', 'jetpack'), $widget_ops);
	}

	function widget($args, $instance) {
		extract( $args );

		$title = apply_filters( 'widget_title', $instance['title'] );
		echo $before_widget;

		if ( $title )
			echo $before_title . stripslashes( $title ) . $after_title;

		if ( 'text' == $instance['format'] ) echo '<ul>';

		if ( 'posts' == $instance['display'] ) {
			$this->_rss_link('posts', $instance);
		} elseif ( 'comments' == $instance['display'] ) {
			$this->_rss_link('comments', $instance);
		} elseif ( 'posts-comments' == $instance['display'] ) {
			$this->_rss_link('posts', $instance);
			$this->_rss_link('comments', $instance);
		}

		if ( 'text' == $instance['format'] ) echo '</ul>';

		echo "\n" . $after_widget;
	}

	function update($new_instance, $old_instance) {
		$instance = $old_instance;

		$instance['title'] = wp_filter_nohtml_kses( $new_instance['title'] );
		$instance['display'] = $new_instance['display'];
		$instance['format'] = $new_instance['format'];
		$instance['imagesize'] = $new_instance['imagesize'];
		$instance['imagecolor'] = $new_instance['imagecolor'];

		return $instance;
	}

	function form($instance) {
		$instance = wp_parse_args( (array) $instance, array('title' => '', 'display' => 'posts-comments', 'format' => 'text') );

		$title = stripslashes( $instance['title'] );
		$display = $instance['display'];
		$format = $instance['format'];
		$image_size = isset( $instance['imagesize'] ) ? $instance['imagesize'] : 0 ;
		$image_color = isset( $instance['imagecolor'] ) ? $instance['imagecolor'] : 'red';

		echo '<p><label for="' . $this->get_field_id('title') . '">' . esc_html__('Title:', 'jetpack') . '
		<input class="widefat" id="' . $this->get_field_id('title') . '" name="' . $this->get_field_name('title') . '" type="text" value="' . esc_attr($title) . '" />
		</label></p>';

		$displays = array(
			'posts'          => __('Posts', 'jetpack'),
			'comments'       => __('Comments', 'jetpack'),
			'posts-comments' => __('Posts & Comments', 'jetpack')
		);
		echo '<p><label for="' . $this->get_field_id('display') . '">' . esc_html__('Feed(s) to Display:', 'jetpack') . '
		<select class="widefat" id="' . $this->get_field_id('display') . '" name="' . $this->get_field_name('display') . '">';
		foreach ( $displays as $display_option => $label ) {
			echo '<option value="' . esc_attr($display_option) . '"';
			if ( $display_option == $display ) echo ' selected="selected"';
			echo '>' . esc_html($label) . '</option>' . "\n";
		}
		echo '</select></label></p>';

		$formats = array(
			'text'       => __('Text Link', 'jetpack'),
			'image'      => __('Image Link', 'jetpack'),
			'text-image' => __('Text & Image Links', 'jetpack')
		);
		echo '<p><label for="' . $this->get_field_id('format') . '">' . __('Format:', 'jetpack') . '
		<select class="widefat" id="' . $this->get_field_id('format') . '" name="' . $this->get_field_name('format') . '" onchange="if ( this.value == \'text\' ) jQuery( \'#' . $this->get_field_id('image-settings') . '\' ).fadeOut(); else jQuery( \'#' . $this->get_field_id('image-settings') . '\' ).fadeIn();">';
		foreach ( $formats as $format_option => $label ) {
			echo '<option value="' . esc_attr($format_option) . '"';
			if ( $format_option == $format ) echo ' selected="selected"';
			echo '>' . esc_html($label) . '</option>' . "\n";
		}
		echo '</select></label></p>';

		echo '<div id="' . $this->get_field_id('image-settings') . '"';
		if ( 'text' == $format ) echo ' style="display: none;"';
		echo '><h3>' . esc_html__('Image Settings:', 'jetpack') . '</h3>';

		$sizes = array(
			'small'  => __('Small', 'jetpack'),
			'medium' => __('Medium', 'jetpack'),
			'large'  => __('Large', 'jetpack')
		);
		echo '<p><label for="' . $this->get_field_id('imagesize') . '">' . esc_html__('Image Size:', 'jetpack') . '
		<select class="widefat" id="' . $this->get_field_id('imagesize') . '" name="' . $this->get_field_name('imagesize') . '">';
		foreach ( $sizes as $size => $label ) {
			echo '<option value="' . esc_attr($size) . '"';
			if ( $size == $image_size ) echo ' selected="selected"';
			echo '>' . esc_html($label) . '</option>' . "\n";
		}
		echo '</select></label></p>';

		$colors = array(
			'red'    => __('Red', 'jetpack'),
			'orange' => __('Orange', 'jetpack'),
			'green'  => __('Green', 'jetpack'),
			'blue'   => __('Blue', 'jetpack'),
			'purple' => __('Purple', 'jetpack'),
			'pink'   => __('Pink', 'jetpack'),
			'silver' => __('Silver', 'jetpack'),
		);
		echo '<p><label for="' . $this->get_field_id('imagecolor') . '">' . esc_html__('Image Color:', 'jetpack') . '
		<select class="widefat" id="' . $this->get_field_id('imagecolor') . '" name="' . $this->get_field_name('imagecolor') . '">';
		foreach ( $colors as $color => $label ) {
			echo '<option value="' . esc_attr($color) . '"';
			if ( $color == $image_color ) echo ' selected="selected"';
			echo '>' . esc_html($label) . '</option>' . "\n";
		}
		echo '</select></label></p></div>';
	}

	function _rss_link( $type = 'posts', $args ) {
		if ( 'posts' == $type ) {
			$type_text = __( 'Posts', 'jetpack' );
			$rss_type = 'rss2_url';
		} elseif ( 'comments' == $type ) {
			$type_text = __( 'Comments', 'jetpack' );
			$rss_type = 'comments_rss2_url';
		}

		$subscribe_to = sprintf( __( 'Subscribe to %s', 'jetpack'), $type_text );

		$link_item = '';
		$format = $args['format'];
		if ( 'image' == $format || 'text-image' == $format )
			$link_item = '<a href="' . get_bloginfo($rss_type) . '" title="' . esc_attr( $subscribe_to ) . '"><img src="' . esc_url( plugins_url( 'images/rss/' . $args['imagecolor'] . '-' . $args['imagesize'] . '.png', dirname( dirname( __FILE__ ) ) ) ) . '" alt="RSS Feed" /></a>';
		if ( 'text-image' == $format )
			$link_item .= '&nbsp;<a href="' . get_bloginfo($rss_type) . '" title="' . esc_attr( $subscribe_to ) . '">' . esc_html__('RSS - ' . $type_text, 'jetpack'). '</a>';
		if ( 'text' == $format )
			$link_item = '<a href="' . get_bloginfo($rss_type) . '" title="' . esc_attr( $subscribe_to ) . '">' . esc_html__('RSS - ' . $type_text, 'jetpack'). '</a>';

		if ( 'text' == $format )
			echo '<li>';
		else
			echo '<p>';
		echo $link_item;
		if ( 'text' == $format )
			echo '</li>';
		else
			echo '</p>';

	}
} //Class Jetpack_RSS_Links_Widget

function jetpack_rss_links_widget_init() {
	register_widget('Jetpack_RSS_Links_Widget');
}
add_action( 'widgets_init', 'jetpack_rss_links_widget_init' );
?>
