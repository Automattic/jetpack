<?php
/**
 * Module Name: RSS Links Widget
 * Module Description: Easily add RSS links to your theme's sidebar.
 * Sort Order: 20
 * First Introduced: 1.2
 */

class Jetpack_RSS_Links_Widget extends WP_Widget {

	function __construct() {
		$widget_ops = array(
			'classname'                   => 'widget_rss_links',
			'description'                 => __( "Links to your blog's RSS feeds", 'jetpack' ),
			'customize_selective_refresh' => true,
		);
		parent::__construct(
			'rss_links',
			/** This filter is documented in modules/widgets/facebook-likebox.php */
			apply_filters( 'jetpack_widget_name', __( 'RSS Links', 'jetpack' ) ),
			$widget_ops
		);
	}

	function widget( $args, $instance ) {
		$instance = wp_parse_args( (array) $instance, $this->defaults() );

		extract( $args );

		/** This filter is documented in core/src/wp-includes/default-widgets.php */
		$title = apply_filters( 'widget_title', $instance['title'] );
		echo $before_widget;

		if ( $title ) {
			echo $before_title . stripslashes( $title ) . $after_title;
		}

		if ( 'text' == $instance['format'] ) {
			echo '<ul>';
		}

		if ( 'posts' == $instance['display'] ) {
			$this->_rss_link( 'posts', $instance );
		} elseif ( 'comments' == $instance['display'] ) {
			$this->_rss_link( 'comments', $instance );
		} elseif ( 'posts-comments' == $instance['display'] ) {
			$this->_rss_link( 'posts', $instance );
			$this->_rss_link( 'comments', $instance );
		}

		if ( 'text' == $instance['format'] ) {
			echo '</ul>';
		}

		echo "\n" . $after_widget;

		/** This action is documented in modules/widgets/gravatar-profile.php */
		do_action( 'jetpack_stats_extra', 'widget_view', 'rss-links' );
	}

	/**
	 * Return an associative array of default values
	 * These values are used in new widgets as well as when sanitizing input.
	 *
	 * @return array Array of default values for the Widget's options
	 */
	function defaults() {
		return array(
			'title'   => '',
			'display' => 'posts-comments',
			'format'  => 'text',
		);
	}

	function update( $new_instance, $old_instance ) {
		$instance = $old_instance;

		$instance['title']      = wp_filter_nohtml_kses( $new_instance['title'] );
		$instance['display']    = $new_instance['display'];
		$instance['format']     = $new_instance['format'];
		$instance['imagesize']  = $new_instance['imagesize'];
		$instance['imagecolor'] = $new_instance['imagecolor'];

		return $instance;
	}

	function form( $instance ) {
		$instance = wp_parse_args( (array) $instance, $this->defaults() );

		$title       = stripslashes( $instance['title'] );
		$display     = $instance['display'];
		$format      = $instance['format'];
		$image_size  = isset( $instance['imagesize'] ) ? $instance['imagesize'] : 0;
		$image_color = isset( $instance['imagecolor'] ) ? $instance['imagecolor'] : 'red';

		echo '<p><label for="' . $this->get_field_id( 'title' ) . '">' . esc_html__( 'Title:', 'jetpack' ) . '
		<input class="widefat" id="' . $this->get_field_id( 'title' ) . '" name="' . $this->get_field_name( 'title' ) . '" type="text" value="' . esc_attr( $title ) . '" />
		</label></p>';

		$displays = array(
			'posts'          => __( 'Posts', 'jetpack' ),
			'comments'       => __( 'Comments', 'jetpack' ),
			'posts-comments' => __( 'Posts & Comments', 'jetpack' ),
		);
		echo '<p><label for="' . $this->get_field_id( 'display' ) . '">' . esc_html__( 'Feed(s) to Display:', 'jetpack' ) . '
		<select class="widefat" id="' . $this->get_field_id( 'display' ) . '" name="' . $this->get_field_name( 'display' ) . '">';
		foreach ( $displays as $display_option => $label ) {
			echo '<option value="' . esc_attr( $display_option ) . '"';
			if ( $display_option == $display ) {
				echo ' selected="selected"';
			}
			echo '>' . esc_html( $label ) . '</option>' . "\n";
		}
		echo '</select></label></p>';

		$formats = array(
			'text'       => __( 'Text Link', 'jetpack' ),
			'image'      => __( 'Image Link', 'jetpack' ),
			'text-image' => __( 'Text & Image Links', 'jetpack' ),
		);
		echo '<p><label for="' . $this->get_field_id( 'format' ) . '">' . _x( 'Format:', 'Noun', 'jetpack' ) . '
		<select class="widefat" id="' . $this->get_field_id( 'format' ) . '" name="' . $this->get_field_name( 'format' ) . '" onchange="if ( this.value == \'text\' ) jQuery( \'#' . $this->get_field_id( 'image-settings' ) . '\' ).fadeOut(); else jQuery( \'#' . $this->get_field_id( 'image-settings' ) . '\' ).fadeIn();">';
		foreach ( $formats as $format_option => $label ) {
			echo '<option value="' . esc_attr( $format_option ) . '"';
			if ( $format_option == $format ) {
				echo ' selected="selected"';
			}
			echo '>' . esc_html( $label ) . '</option>' . "\n";
		}
		echo '</select></label></p>';

		echo '<div id="' . $this->get_field_id( 'image-settings' ) . '"';
		if ( 'text' == $format ) {
			echo ' style="display: none;"';
		}
		echo '><h3>' . esc_html__( 'Image Settings:', 'jetpack' ) . '</h3>';

		$sizes = array(
			'small'  => __( 'Small', 'jetpack' ),
			'medium' => __( 'Medium', 'jetpack' ),
			'large'  => __( 'Large', 'jetpack' ),
		);
		echo '<p><label for="' . $this->get_field_id( 'imagesize' ) . '">' . esc_html__( 'Image Size:', 'jetpack' ) . '
		<select class="widefat" id="' . $this->get_field_id( 'imagesize' ) . '" name="' . $this->get_field_name( 'imagesize' ) . '">';
		foreach ( $sizes as $size => $label ) {
			echo '<option value="' . esc_attr( $size ) . '"';
			if ( $size == $image_size ) {
				echo ' selected="selected"';
			}
			echo '>' . esc_html( $label ) . '</option>' . "\n";
		}
		echo '</select></label></p>';

		$colors = array(
			'red'    => __( 'Red', 'jetpack' ),
			'orange' => __( 'Orange', 'jetpack' ),
			'green'  => __( 'Green', 'jetpack' ),
			'blue'   => __( 'Blue', 'jetpack' ),
			'purple' => __( 'Purple', 'jetpack' ),
			'pink'   => __( 'Pink', 'jetpack' ),
			'silver' => __( 'Silver', 'jetpack' ),
		);
		echo '<p><label for="' . $this->get_field_id( 'imagecolor' ) . '">' . esc_html__( 'Image Color:', 'jetpack' ) . '
		<select class="widefat" id="' . $this->get_field_id( 'imagecolor' ) . '" name="' . $this->get_field_name( 'imagecolor' ) . '">';
		foreach ( $colors as $color => $label ) {
			echo '<option value="' . esc_attr( $color ) . '"';
			if ( $color == $image_color ) {
				echo ' selected="selected"';
			}
			echo '>' . esc_html( $label ) . '</option>' . "\n";
		}
		echo '</select></label></p></div>';
	}

	function _rss_link( $type = 'posts', $args ) {
		if ( 'posts' == $type ) {
			$type_text = __( 'Posts', 'jetpack' );
			$rss_type  = 'rss2_url';
		} elseif ( 'comments' == $type ) {
			$type_text = __( 'Comments', 'jetpack' );
			$rss_type  = 'comments_rss2_url';
		}

		$subscribe_to = sprintf( __( 'Subscribe to %s', 'jetpack' ), $type_text );

		$link_item = '';
		$format    = $args['format'];

		/**
		 * Filters the target link attribute for the RSS link in the RSS widget.
		 *
		 * @module widgets
		 *
		 * @since 3.4.0
		 *
		 * @param bool false Control whether the link should open in a new tab. Default to false.
		 */
		if ( apply_filters( 'jetpack_rsslinks_widget_target_blank', false ) ) {
			$link_target = '_blank';
		} else {
			$link_target = '_self';
		}

		if ( 'image' == $format || 'text-image' == $format ) {
			/**
			 * Filters the image used as RSS icon in the RSS widget.
			 *
			 * @module widgets
			 *
			 * @since 3.6.0
			 *
			 * @param string $var URL of RSS Widget icon.
			 */
			$link_image = apply_filters( 'jetpack_rss_widget_icon', plugins_url( 'images/rss/' . $args['imagecolor'] . '-' . $args['imagesize'] . '.png', dirname( dirname( __FILE__ ) ) ) );
			$link_item  = '<a target="' . $link_target . '" href="' . get_bloginfo( $rss_type ) . '" title="' . esc_attr( $subscribe_to ) . '"><img src="' . esc_url( $link_image ) . '" alt="RSS Feed" /></a>';
		}
		if ( 'text-image' == $format ) {
			$link_item .= '&nbsp;<a target="' . $link_target . '" href="' . get_bloginfo( $rss_type ) . '" title="' . esc_attr( $subscribe_to ) . '">' . esc_html__( 'RSS - ' . $type_text, 'jetpack' ) . '</a>';
		}
		if ( 'text' == $format ) {
			$link_item = '<a target="' . $link_target . '" href="' . get_bloginfo( $rss_type ) . '" title="' . esc_attr( $subscribe_to ) . '">' . esc_html__( 'RSS - ' . $type_text, 'jetpack' ) . '</a>';
		}

		if ( 'text' == $format ) {
			echo '<li>';
		} else {
			echo '<p>';
		}
		echo $link_item;
		if ( 'text' == $format ) {
			echo '</li>';
		} else {
			echo '</p>';
		}

	}
} // Class Jetpack_RSS_Links_Widget

function jetpack_rss_links_widget_init() {
	register_widget( 'Jetpack_RSS_Links_Widget' );
}
add_action( 'widgets_init', 'jetpack_rss_links_widget_init' );
