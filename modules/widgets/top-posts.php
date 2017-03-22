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
	var $default_title = '';

	function __construct() {
		parent::__construct(
			'top-posts',
			apply_filters( 'jetpack_widget_name', __( 'Top Posts &amp; Pages', 'jetpack' ) ),
			array(
				'description' => __( 'Shows your most viewed posts and pages.', 'jetpack' ),
			)
		);

		$this->default_title =  __( 'Top Posts &amp; Pages', 'jetpack' );

		if ( is_active_widget( false, false, $this->id_base ) ) {
			add_action( 'wp_print_styles', array( $this, 'enqueue_style' ) );
		}
	}

	function enqueue_style() {
		wp_register_style( 'widget-grid-and-list', plugins_url( 'widget-grid-and-list.css', __FILE__ ) );
		wp_enqueue_style( 'widget-grid-and-list' );
	}

	function form( $instance ) {
		$title = isset( $instance['title' ] ) ? $instance['title'] : false;
		if ( false === $title ) {
			$title = $this->default_title;
		}

		$count = isset( $instance['count'] ) ? (int) $instance['count'] : 10;
		if ( $count < 1 || 10 < $count ) {
			$count = 10;
		}

		// 'likes' are not available in Jetpack
		$ordering = isset( $instance['ordering'] ) && 'likes' === $instance['ordering'] ? 'likes' : 'views';

		if ( isset( $instance['display'] ) && in_array( $instance['display'], array( 'grid', 'list', 'text'  ) ) ) {
			$display = $instance['display'];
		} else {
			$display = 'text';
		}

		?>

		<p>
			<label for="<?php echo $this->get_field_id( 'title' ); ?>"><?php esc_html_e( 'Title:', 'jetpack' ); ?></label>
			<input class="widefat" id="<?php echo $this->get_field_id( 'title' ); ?>" name="<?php echo $this->get_field_name( 'title' ); ?>" type="text" value="<?php echo esc_attr( $title ); ?>" />
		</p>

		<p>
			<label for="<?php echo $this->get_field_id( 'count' ); ?>"><?php esc_html_e( 'Maximum number of posts to show (no more than 10):', 'jetpack' ); ?></label>
			<input id="<?php echo $this->get_field_id( 'count' ); ?>" name="<?php echo $this->get_field_name( 'count' ); ?>" type="number" value="<?php echo (int) $count; ?>" min="1" max="10" />
		</p>

		<?php if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) : ?>
		<p>
			<label><?php esc_html_e( 'Order Top Posts &amp; Pages By:', 'jetpack' ); ?></label>
			<ul>
				<li><label><input id="<?php echo $this->get_field_id( 'ordering' ); ?>-likes" name="<?php echo $this->get_field_name( 'ordering' ); ?>" type="radio" value="likes" <?php checked( 'likes', $ordering ); ?> /> <?php esc_html_e( 'Likes', 'jetpack' ); ?></label></li>
				<li><label><input id="<?php echo $this->get_field_id( 'ordering' ); ?>-views" name="<?php echo $this->get_field_name( 'ordering' ); ?>" type="radio" value="views" <?php checked( 'views', $ordering ); ?> /> <?php esc_html_e( 'Views', 'jetpack' ); ?></label></li>
			</ul>
		</p>
		<?php endif; ?>

		<p>
			<label><?php esc_html_e( 'Display as:', 'jetpack' ); ?></label>
			<ul>
				<li><label><input id="<?php echo $this->get_field_id( 'display' ); ?>-text" name="<?php echo $this->get_field_name( 'display' ); ?>" type="radio" value="text" <?php checked( 'text', $display ); ?> /> <?php esc_html_e( 'Text List', 'jetpack' ); ?></label></li>
				<li><label><input id="<?php echo $this->get_field_id( 'display' ); ?>-list" name="<?php echo $this->get_field_name( 'display' ); ?>" type="radio" value="list" <?php checked( 'list', $display ); ?> /> <?php esc_html_e( 'Image List', 'jetpack' ); ?></label></li>
				<li><label><input id="<?php echo $this->get_field_id( 'display' ); ?>-grid" name="<?php echo $this->get_field_name( 'display' ); ?>" type="radio" value="grid" <?php checked( 'grid', $display ); ?> /> <?php esc_html_e( 'Image Grid', 'jetpack' ); ?></label></li>
			</ul>
		</p>

		<p><?php esc_html_e( 'Top Posts &amp; Pages by views are calculated from 24-48 hours of stats. They take a while to change.', 'jetpack' ); ?></p>

		<?php
	}

	function update( $new_instance, $old_instance ) {
		$instance = array();
		$instance['title'] = wp_kses( $new_instance['title'], array() );
		if ( $instance['title'] === $this->default_title ) {
			$instance['title'] = false; // Store as false in case of language change
		}

		$instance['count'] = (int) $new_instance['count'];
		if ( $instance['count'] < 1 || 10 < $instance['count'] ) {
			$instance['count'] = 10;
		}

		// 'likes' are not available in Jetpack
		$instance['ordering'] = isset( $new_instance['ordering'] ) && 'likes' == $new_instance['ordering'] ? 'likes' : 'views';

		if ( isset( $new_instance['display'] ) && in_array( $new_instance['display'], array( 'grid', 'list', 'text'  ) ) ) {
			$instance['display'] = $new_instance['display'];
		} else {
			$instance['display'] = 'text';
		}

		return $instance;
	}

	function widget( $args, $instance ) {
		do_action( 'jetpack_stats_extra', 'widget_view', 'top_posts' );

		$title = isset( $instance['title' ] ) ? $instance['title'] : false;
		if ( false === $title )
			$title = $this->default_title;
		$title = apply_filters( 'widget_title', $title );

		$count = isset( $instance['count'] ) ? (int) $instance['count'] : false;
		if ( $count < 1 || 10 < $count ) {
			$count = 10;
		}

		// 'likes' are not available in Jetpack
		$ordering = isset( $instance['ordering'] ) && 'likes' == $instance['ordering'] ? 'likes' : 'views';

		if ( isset( $instance['display'] ) && in_array( $instance['display'], array( 'grid', 'list', 'text'  ) ) ) {
			$display = $instance['display'];
		} else {
			$display = 'text';
		}

		if ( 'text' != $display ) {
			$get_image_options = array(
				'fallback_to_avatars' => true,
				'gravatar_default' => apply_filters( 'jetpack_static_url', set_url_scheme( 'http://en.wordpress.com/i/logo/white-gray-80.png' ) ),
			);
			if ( 'grid' == $display ) {
				$get_image_options['avatar_size'] = 200;
			} else {
				$get_image_options['avatar_size'] = 40;
			}
			$get_image_options = apply_filters( 'jetpack_top_posts_widget_image_options', $get_image_options );
		}

		if ( function_exists( 'wpl_get_blogs_most_liked_posts' ) && 'likes' == $ordering ) {
			$posts = $this->get_by_likes( $count );
		} else {
			$posts = $this->get_by_views( $count );
		}

		if ( !$posts ) {
			$posts = $this->get_fallback_posts();
		}

		echo $args['before_widget'];
		if ( ! empty( $title ) )
			echo $args['before_title'] . $title . $args['after_title'];

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
						<?php do_action( 'jetpack_widget_top_posts_before_post', $post['post_id'] ); ?>
						<a href="<?php echo esc_url( $post['permalink'] ); ?>" title="<?php echo esc_attr( wp_kses( $post['title'], array() ) ); ?>" class="bump-view" data-bump-view="tp">
							<img src="<?php echo esc_url( $post['image'] ); ?>" alt="<?php echo esc_attr( wp_kses( $post['title'], array() ) ); ?>" data-pin-nopin="true" />
						</a>
						<?php do_action( 'jetpack_widget_top_posts_after_post', $post['post_id'] ); ?>
					</div>
				<?php
				endforeach;
				echo "</div>\n";
			} else {
				echo "<ul class='widgets-list-layout no-grav'>\n";
				foreach ( $posts as $post ) :
				?>
					<li>
						<?php do_action( 'jetpack_widget_top_posts_before_post', $post['post_id'] ); ?>
						<a href="<?php echo esc_url( $post['permalink'] ); ?>" title="<?php echo esc_attr( wp_kses( $post['title'], array() ) ); ?>" class="bump-view" data-bump-view="tp">
							<img src="<?php echo esc_url( $post['image'] ); ?>" class='widgets-list-layout-blavatar' alt="<?php echo esc_attr( wp_kses( $post['title'], array() ) ); ?>" data-pin-nopin="true" />
						</a>
						<div class="widgets-list-layout-links">
							<a href="<?php echo esc_url( $post['permalink'] ); ?>" class="bump-view" data-bump-view="tp">
								<?php echo esc_html( wp_kses( $post['title'], array() ) ); ?>
							</a>
						</div>
						<?php do_action( 'jetpack_widget_top_posts_after_post', $post['post_id'] ); ?>
					</li>
				<?php
				endforeach;
				echo "</ul>\n";
			}
			break;
		default :
			echo '<ul>';
			foreach ( $posts as $post ) :
			?>
				<li>
					<?php do_action( 'jetpack_widget_top_posts_before_post', $post['post_id'] ); ?>
					<a href="<?php echo esc_url( $post['permalink'] ); ?>" class="bump-view" data-bump-view="tp">
						<?php echo esc_html( wp_kses( $post['title'], array() ) ); ?>
					</a>
					<?php do_action( 'jetpack_widget_top_posts_after_post', $post['post_id'] ); ?>
				</li>
			<?php
			endforeach;
			echo '</ul>';
		}

		echo $args['after_widget'];
	}

	/*
	 * Get most liked posts
	 *
	 * ONLY TO BE USED IN WPCOM
	 */
	function get_by_likes( $count ) {
		$post_likes = wpl_get_blogs_most_liked_posts();
		if ( !$post_likes ) {
			return array();
		}

		return $this->get_posts( array_keys( $post_likes ), $count );
	}

	function get_by_views( $count ) {
		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			global $wpdb;

			$post_views = wp_cache_get( "get_top_posts_$count", 'stats' );
			if ( false === $post_views ) {
				$post_views = array_shift( stats_get_daily_history( false, get_current_blog_id(), 'postviews', 'post_id', false, 2, '', $count * 2 + 10, true ) );
				unset( $post_views[0] );
				wp_cache_add( "get_top_posts_$count", $post_views, 'stats', 1200);
			}

			return $this->get_posts( array_keys( $post_views ), $count );
		}

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
