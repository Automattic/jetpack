<?php

/*
 * Currently, this widget depends on the Stats Module. To not load this file
 * when the Stats Module is not active would potentially bypass Jetpack's
 * fatal error detection on module activation, so we always load this file.
 * Instead, we don't register the widget if the Stats Module isn't active.
 */

/**
 * Register the widget for use in Appearance -> Widgets
 */
add_action( 'widgets_init', 'jetpack_top_posts_widget_init' );

function jetpack_top_posts_widget_init() {
	// Currently, this widget depends on the Stats Module
	if (
		( !defined( 'IS_WPCOM' ) || !IS_WPCOM )
	&&
		!function_exists( 'stats_get_csv' )
	) {
		return;
	}

	register_widget( 'Jetpack_Top_Posts_Widget' );
}

class Jetpack_Top_Posts_Widget extends WP_Widget {
	var $alt_option_name = 'widget_stats_topposts';

	function __construct() {
		$widget_ops 	= array(
			'classname'   => 'top-posts',
			'description' => __( 'Shows your most viewed posts and pages.', 'jetpack' )
		);

		$this->WP_Widget( 'top-posts', apply_filters( 'jetpack_widget_name', __( 'Top Posts &amp; Pages', 'jetpack' ) ), $widget_ops );
	}

	public function widget( $args, $instance ) {
		$this->enqueue_style();

		extract( $args );

		echo $before_widget . "\n";

		// Display the Widget title
		$title = apply_filters( 'widget_title', $instance['title'] );

		if ( $title ) {
			echo $before_title . esc_html( $title ) . $after_title . "\n";
		}

		// Display the posts
		$count   = $instance['count'];
		$display = $instance['display'];
		$posts   = $this->get_by_views( $count );

		if ( !$posts ) {
			$posts = $this->get_fallback_posts();
		}

		if ( !$posts ) {
			if ( current_user_can( 'edit_theme_options' ) ) {
				echo '<p>' . sprintf(
					__( 'There are no posts to display. <a href="%s">Want more traffic?</a>', 'jetpack' ),
					'http://en.support.wordpress.com/getting-more-site-traffic/'
				) . '</p>';
			}

			echo $args['after_widget'];
			return;
		}

		if ( 'text' != $display ) {
			$get_image_options = array(
				'fallback_to_avatars' => true,
				'gravatar_default' => apply_filters( 'jetpack_static_url', set_url_scheme( 'http://en.wordpress.com/i/logo/white-gray-80.png' ) ),
			);
			if ( 'grid' == $display ) {
				if ( $count %2 != 0 ) {
					$count++;
				}

				$get_image_options['avatar_size'] = 200;
			} else {
				$get_image_options['avatar_size'] = 40;
			}
			$get_image_options = apply_filters( 'jetpack_top_posts_widget_image_options', $get_image_options );
		}

		switch ( $display ) {
		case 'list' :
		case 'grid' :
			wp_enqueue_style( 'widget-grid-and-list' );
			foreach ( $posts as &$post ) {
				$image = Jetpack_PostImages::get_image( $post['post_id'], array( 'fallback_to_avatars' => true ) );
				$post['image'] = $image['src'];
				if ( 'blavatar' != $image['from'] && 'gravatar' != $image['from'] ) {
					$size = (int) $get_image_options['avatar_size'];
					$post['image'] = jetpack_photon_url( $post['image'], array( 'resize' => "$size,$size" ) );
				}
			}

			unset( $post );

			if ( 'grid' == $display ) {
				echo "<div class='widgets-grid-layout no-grav'>\n";
				foreach ( $posts as $post ) :
				?>
					<div class="widget-grid-view-image">
						<a href="<?php echo esc_url( $post['permalink'] ); ?>" title="<?php echo esc_attr( wp_kses( $post['title'], array() ) ); ?>" class="bump-view" data-bump-view="tp"><img src="<?php echo esc_url( $post['image'] ); ?>" alt="<?php echo esc_attr( wp_kses( $post['title'], array() ) ); ?>" /></a>
					</div>

				<?php
				endforeach;
				echo "</div>\n";
			} else {
				echo "<ul class='widgets-list-layout no-grav'>\n";
				foreach ( $posts as $post ) :
				?>
					<li>
						<img src="<?php echo esc_url( $post['image'] ); ?>" class='widgets-list-layout-blavatar' alt="<?php echo esc_attr( wp_kses( $post['title'], array() ) ); ?>" />
						<div class="widgets-list-layout-links"><a href="<?php echo esc_url( $post['permalink'] ); ?>" class="bump-view" data-bump-view="tp"><?php echo esc_html( wp_kses( $post['title'], array() ) ); ?></a></div>
					</li>
				<?php
				endforeach;
				echo "</ul>\n";
			}
			break;
		default :
			echo '<ul>';
			foreach ( $posts as $post ) {
				echo '<li><a href="' . esc_url( $post['permalink'] ) . '" class="bump-view" data-bump-view="tp">' . esc_html( $post['title'] ) . "</a></li>\n";
			}
			echo '</ul>';
		}

		echo $args['after_widget'];
	}

	public function form( $instance ) {
		$defaults         = $this->defaults();
		$allowed_values   = $this->allowed_values();

		$instance         = wp_parse_args( (array) $instance, $defaults );

		?>

		<p>
			<label for="<?php echo $this->get_field_id( 'title' ); ?>"><?php esc_html_e( 'Title:', 'jetpack' ); ?></label>
			<input class="widefat" id="<?php echo $this->get_field_id( 'title' ); ?>" name="<?php echo $this->get_field_name( 'title' ); ?>" type="text" value="<?php echo esc_attr( $instance['title'] ); ?>" />
		</p>

		<p>
			<label for="<?php echo $this->get_field_id( 'count' ); ?>"><?php esc_html_e( 'Maximum number of posts to show (no more than 10):', 'jetpack' ); ?></label>
			<input id="<?php echo $this->get_field_id( 'count' ); ?>" name="<?php echo $this->get_field_name( 'count' ); ?>" type="number" value="<?php echo (int) $instance['count']; ?>" min="1" max="10" />
		</p>

		<p>
			<label><?php esc_html_e( 'Display as:', 'jetpack' ); ?></label>
			<select name="<?php echo $this->get_field_name( 'display' ); ?>" id="<?php echo $this->get_field_id( 'display' ); ?>" class="widefat">
				<?php foreach ( $allowed_values['display'] as $key => $label ) {
					$selected = '';

					if ( $instance['display'] == $key ) {
						$selected = "selected='selected' ";
					} ?>

					<option value="<?php echo $key; ?>" <?php echo $selected; ?>><?php echo esc_html( $label, 'jetpack' ); ?></option>
				<?php } ?>
			</select>
		</p>

		<p><?php esc_html_e( 'Top Posts &amp; Pages by views are calculated from 24-48 hours of stats. They take a while to change.', 'jetpack' ); ?></p>

		<?php
	}

	public function update( $new_instance, $old_instance ) {
		$instance = $this->sanitize( $new_instance );

		return $instance;
	}

	/**
	 * Sanitize the $instance's values to the set of allowed values. If a value is not acceptable,
	 * it is set to its default.
	 *
	 * Helps keep things nice and secure by whitelisting only allowed values
	 *
	 * @param array $instance The Widget instance to sanitize values for
	 * @return array $instance The Widget instance with values sanitized
	 */
	public function sanitize( $instance ) {
		$allowed_values = $this->allowed_values();
		$defaults       = $this->defaults();

		foreach ( $instance as $key => $value ) {
			$value = trim( $value );

			if ( isset( $allowed_values[ $key ] ) && $allowed_values[ $key ] && ! array_key_exists( $value, $allowed_values[ $key ] ) ) {
				$instance[ $key ] = $defaults[ $key ];
			} else {
				$instance[ $key ] = sanitize_text_field( $value );
			}
		}

		return $instance;
	}

	/**
	 * Return a multi-dimensional array of allowed values (and their labels) for all widget form
	 * elements
	 *
	 * To allow all values on an input, omit it from the returned array
	 *
	 * @return array Array of allowed values for each option
	 */
	public function allowed_values() {
		$max_posts = 10;

		// Create an associative array of allowed post values. This just automates the generation of
		// post <option>s, from 1 to $max_posts
		$allowed_posts = array_combine( range( 1, $max_posts ), range( 1, $max_posts ) );

		return array(
			'count'	  => $allowed_posts,
			'display'	=> array(
				'grid'   => __( 'Grid', 'jetpack' ),
				'list'   => __( 'List', 'jetpack' ),
				'text'   => __( 'Text', 'jetpack' ),
			)
		);
	}

	/**
	 * Return an associative array of default values
	 *
	 * These values are used in new widgets as well as when sanitizing input. If a given value is not allowed,
	 * as defined in allowed_values(), that input is set to the default value defined here.
	 *
	 * @return array Array of default values for the Widget's options
	 */
	public function defaults() {
		return array(
			'title'     => 'Top Posts &amp; Pages',
			'count'     => '10',
			'display'   => 'text'
		);
	}

	public function enqueue_style() {
		wp_register_style( 'widget-grid-and-list', plugins_url( 'widget-grid-and-list.css', __FILE__ ) );

		wp_enqueue_style( 'widget-grid-and-list' );
	}


	function get_by_views( $count ) {
		$days = (int) apply_filters( 'jetpack_top_posts_days', 2 );

		if ( $days < 1 ) {
			$days = 2;
		}

		if ( $days > 10 ) {
			$days = 10;
		}

		$post_view_posts = stats_get_csv( 'postviews', array( 'days' => absint( $days ), 'limit' => 11 ) );
		if ( !$post_view_posts ) {
			return array();
		}

		$post_view_ids = array_filter( wp_list_pluck( $post_view_posts, 'post_id' ) );
		if ( !$post_view_ids ) {
			return array();
		}

		return $this->get_posts( $post_view_ids, $count );
	}

	function get_fallback_posts() {
		if ( current_user_can( 'edit_theme_options' ) ) {
			return array();
		}

		$post_query = new WP_Query;

		$posts = $post_query->query( array(
			'posts_per_page' => 1,
			'post_status' => 'publish',
			'post_type' => array( 'post', 'page' ),
			'no_found_rows' => true,
		) );

		if ( !$posts ) {
			return array();
		}

		$post = array_pop( $posts );

		return $this->get_posts( $post->ID, 1 );
	}

	function get_posts( $post_ids, $count ) {
		$counter = 0;

		$posts = array();
		foreach ( (array) $post_ids as $post_id ) {
			$post = get_post( $post_id );

			if ( !$post )
				continue;

			// Only posts and pages, no attachments
			if ( 'attachment' == $post->post_type )
				continue;

			// hide private and password protected posts
			if ( 'publish' != $post->post_status || !empty( $post->post_password ) || empty( $post->ID ) )
				continue;

			// Both get HTML stripped etc on display
			if ( empty( $post->post_title ) ) {
				$title_source = $post->post_content;
				$title = wp_html_excerpt( $title_source, 50 );
				$title .= '&hellip;';
			} else {
				$title = $post->post_title;
			}

			$permalink = get_permalink( $post->ID );

			$posts[] = compact( 'title', 'permalink', 'post_id' );
			$counter++;

			if ( $counter == $count )
				break; // only need to load and show x number of likes
		}

		return apply_filters( 'jetpack_widget_get_top_posts', $posts, $post_ids, $count );
	}
}
