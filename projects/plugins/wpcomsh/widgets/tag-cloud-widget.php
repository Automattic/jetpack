<?php

add_action( 'widgets_init', 'wpcom_tag_cloud_replace_core', 11 );

function wpcom_tag_cloud_replace_core() {
	unregister_widget( 'WP_Widget_Tag_Cloud' );
	register_widget( 'WPCOM_Tag_Cloud_Widget' );
}

class WPCOM_Tag_Cloud_Widget extends WP_Widget {
	/**
	 * Sets up a new Tag Cloud widget instance.
	 *
	 * @since 2.8.0
	 */
	public function __construct() {
		$widget_ops = array(
			'description'                 => __( 'A cloud of your most used tags.', 'wpcomsh' ),
			'customize_selective_refresh' => true,
		);
		parent::__construct( 'tag_cloud', __( 'Tag Cloud', 'wpcomsh' ), $widget_ops );
	}

	/**
	 * Outputs the content for the current Tag Cloud widget instance.
	 *
	 * @param array $args Display arguments including 'before_title', 'after_title',
	 *                        'before_widget', and 'after_widget'.
	 * @param array $instance Settings for the current Tag Cloud widget instance.
	 *
	 * @since 2.8.0
	 */
	public function widget( $args, $instance ) {
		$current_taxonomy = $this->_get_current_taxonomy( $instance );

		if ( ! empty( $instance['title'] ) ) {
			$title = $instance['title'];
		} else {
			if ( 'post_tag' === $current_taxonomy ) {
				$title = __( 'Tags', 'wpcomsh' );
			} else {
				$tax   = get_taxonomy( $current_taxonomy );
				$title = $tax->labels->name;
			}
		}

		$show_count = ! empty( $instance['count'] );

		$tag_cloud = wp_tag_cloud(
			/**
			 * Filters the taxonomy used in the Tag Cloud widget.
			 *
			 * @param array $args Args used for the tag cloud widget.
			 * @param array $instance Array of settings for the current widget.
			 *
			 * @since 4.9.0 Added the `$instance` parameter.
			 *
			 * @see wp_tag_cloud()
			 *
			 * @since 2.8.0
			 * @since 3.0.0 Added taxonomy drop-down.
			 */
			apply_filters(
				'widget_tag_cloud_args',
				array(
					'taxonomy'   => $current_taxonomy,
					'echo'       => false,
					'number'     => empty( $instance['max_tags'] ) ? 0 : $instance['max_tags'],
					'show_count' => $show_count,
				),
				$instance
			)
		);

		if ( empty( $tag_cloud ) ) {
			return;
		}

		/** This filter is documented in wp-includes/widgets/class-wp-widget-pages.php */
		$title = apply_filters( 'widget_title', $title, $instance, $this->id_base );

		echo $args['before_widget'];
		if ( $title ) {
			echo $args['before_title'] . $title . $args['after_title'];
		}

		echo '<div class="tagcloud">';

		echo $tag_cloud;

		echo "</div>\n";
		echo $args['after_widget'];
	}

	/**
	 * Handles updating settings for the current Tag Cloud widget instance.
	 *
	 * @param array $new_instance New settings for this instance as input by the user via
	 *                            WP_Widget::form().
	 * @param array $old_instance Old settings for this instance.
	 *
	 * @return array Settings to save or bool false to cancel saving.
	 * @since 2.8.0
	 */
	public function update( $new_instance, $old_instance ) {
		$instance             = array();
		$instance['title']    = sanitize_text_field( $new_instance['title'] );
		$instance['count']    = ! empty( $new_instance['count'] ) ? 1 : 0;
		$instance['taxonomy'] = stripslashes( $new_instance['taxonomy'] );
		$instance['max_tags'] = empty( $new_instance['max_tags'] ) ? 0 : (int) $new_instance['max_tags'];

		return $instance;
	}

	/**
	 * Outputs the Tag Cloud widget settings form.
	 *
	 * @param array $instance Current settings.
	 *
	 * @since 2.8.0
	 */
	public function form( $instance ) {
		$current_taxonomy  = $this->_get_current_taxonomy( $instance );
		$title_id          = $this->get_field_id( 'title' );
		$count             = isset( $instance['count'] ) ? (bool) $instance['count'] : false;
		$instance['title'] = ! empty( $instance['title'] ) ? esc_attr( $instance['title'] ) : '';
		$max_tags          = empty( $instance['max_tags'] ) ? 0 : $instance['max_tags'];

		echo '<p><label for="' . $title_id . '">' . __( 'Title:', 'wpcomsh' ) . '</label>
			<input type="text" class="widefat" id="' . $title_id . '" name="' . $this->get_field_name( 'title' ) . '" value="' . $instance['title'] . '" />
		</p>';

		$max_tags_id = $this->get_field_id( 'max_tags' );
		echo '<p><label for="' . $max_tags_id . '">' . __( 'Number of Tags:', 'wpcomsh' ) . '</label>
		     <input type="number" class="widefat" id="' . $max_tags_id . '" name="' . $this->get_field_name( 'max_tags' ) . '" value="' . esc_attr( $max_tags ) . '" />
		     <small>' . __( 'Maximum number of tags displayed', 'wpcomsh' ) . '</small>
		</p>';

		$taxonomies = get_taxonomies( array( 'show_tagcloud' => true ), 'object' );
		$id         = $this->get_field_id( 'taxonomy' );
		$name       = $this->get_field_name( 'taxonomy' );
		$input      = '<input type="hidden" id="' . $id . '" name="' . $name . '" value="%s" />';

		$count_checkbox = sprintf(
			'<p><input type="checkbox" class="checkbox" id="%1$s" name="%2$s"%3$s /> <label for="%1$s">%4$s</label></p>',
			$this->get_field_id( 'count' ),
			$this->get_field_name( 'count' ),
			checked( $count, true, false ),
			__( 'Show tag counts', 'wpcomsh' )
		);

		switch ( count( $taxonomies ) ) {

			// No tag cloud supporting taxonomies found, display error message.
			case 0:
				echo '<p>' . __( 'The tag cloud will not be displayed since there are no taxonomies that support the tag cloud widget.', 'wpcomsh' ) . '</p>';
				printf( $input, '' );
				break;

			// Just a single tag cloud supporting taxonomy found, no need to display a select.
			case 1:
				$keys     = array_keys( $taxonomies );
				$taxonomy = reset( $keys );
				printf( $input, esc_attr( $taxonomy ) );
				echo $count_checkbox;
				break;

			// More than one tag cloud supporting taxonomy found, display a select.
			default:
				printf(
					'<p><label for="%1$s">%2$s</label>' .
					'<select class="widefat" id="%1$s" name="%3$s">',
					$id,
					__( 'Taxonomy:', 'wpcomsh' ),
					$name
				);

				foreach ( $taxonomies as $taxonomy => $tax ) {
					printf(
						'<option value="%s"%s>%s</option>',
						esc_attr( $taxonomy ),
						selected( $taxonomy, $current_taxonomy, false ),
						$tax->labels->name
					);
				}

				echo '</select></p>' . $count_checkbox;
		}
	}

	/**
	 * Retrieves the taxonomy for the current Tag cloud widget instance.
	 *
	 * @param array $instance Current settings.
	 *
	 * @return string Name of the current taxonomy if set, otherwise 'post_tag'.
	 * @since 4.4.0
	 */
	public function _get_current_taxonomy( $instance ) {
		if ( ! empty( $instance['taxonomy'] ) && taxonomy_exists( $instance['taxonomy'] ) ) {
			return $instance['taxonomy'];
		}

		return 'post_tag';
	}
}
