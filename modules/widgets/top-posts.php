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
		( ! defined( 'IS_WPCOM' ) || ! IS_WPCOM )
	&&
		! function_exists( 'stats_get_from_restapi' )
	) {
		return;
	}

	register_widget( 'Jetpack_Top_Posts_Widget' );
}

class Jetpack_Top_Posts_Widget extends WP_Widget {
	public $alt_option_name = 'widget_stats_topposts';
	public $default_title   = '';

	function __construct() {
		parent::__construct(
			'top-posts',
			/** This filter is documented in modules/widgets/facebook-likebox.php */
			apply_filters( 'jetpack_widget_name', __( 'Top Posts &amp; Pages', 'jetpack' ) ),
			array(
				'description'                 => __( 'Shows your most viewed posts and pages.', 'jetpack' ),
				'customize_selective_refresh' => true,
			)
		);

		$this->default_title = __( 'Top Posts &amp; Pages', 'jetpack' );

		if ( is_active_widget( false, false, $this->id_base ) || is_customize_preview() ) {
			add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_style' ) );
		}

		/**
		 * Add explanation about how the statistics are calculated.
		 *
		 * @module widgets
		 *
		 * @since 3.9.3
		 */
		add_action( 'jetpack_widget_top_posts_after_fields', array( $this, 'stats_explanation' ) );
	}

	function enqueue_style() {
		wp_register_style( 'jetpack-top-posts-widget', plugins_url( 'top-posts/style.css', __FILE__ ), array(), '20141013' );
		wp_enqueue_style( 'jetpack-top-posts-widget' );
	}

	function form( $instance ) {
		$instance = wp_parse_args( (array) $instance, $this->defaults() );

		if ( false === $instance['title'] ) {
			$instance['title'] = $this->default_title;
		}
		$title = stripslashes( $instance['title'] );

		$count = isset( $instance['count'] ) ? (int) $instance['count'] : 10;
		if ( $count < 1 || 10 < $count ) {
			$count = 10;
		}

		$allowed_post_types = array_values( get_post_types( array( 'public' => true ) ) );
		$types              = isset( $instance['types'] ) ? (array) $instance['types'] : array( 'post', 'page' );

		// 'likes' are not available in Jetpack
		$ordering = isset( $instance['ordering'] ) && 'likes' === $instance['ordering'] ? 'likes' : 'views';

		if ( isset( $instance['display'] ) && in_array( $instance['display'], array( 'grid', 'list', 'text' ) ) ) {
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
			<label for="<?php echo $this->get_field_id( 'types' ); ?>"><?php esc_html_e( 'Types of pages to display:', 'jetpack' ); ?></label>
			<ul>
				<?php
				foreach ( $allowed_post_types as $type ) {
					// Get the Post Type name to display next to the checkbox
					$post_type_object = get_post_type_object( $type );
					$label            = $post_type_object->labels->name;

					$checked = '';
					if ( in_array( $type, $types ) ) {
						$checked = 'checked="checked" ';
					}
					?>

					<li><label>
						<input value="<?php echo esc_attr( $type ); ?>" name="<?php echo $this->get_field_name( 'types' ); ?>[]" id="<?php echo $this->get_field_id( 'types' ); ?>-<?php echo $type; ?>" type="checkbox" <?php echo $checked; ?>>
						<?php echo esc_html( $label ); ?>
					</label></li>

				<?php } // End foreach ?>
			</ul>
		</p>

		<p>
			<label><?php esc_html_e( 'Display as:', 'jetpack' ); ?></label>
			<ul>
				<li><label><input id="<?php echo $this->get_field_id( 'display' ); ?>-text" name="<?php echo $this->get_field_name( 'display' ); ?>" type="radio" value="text" <?php checked( 'text', $display ); ?> /> <?php esc_html_e( 'Text List', 'jetpack' ); ?></label></li>
				<li><label><input id="<?php echo $this->get_field_id( 'display' ); ?>-list" name="<?php echo $this->get_field_name( 'display' ); ?>" type="radio" value="list" <?php checked( 'list', $display ); ?> /> <?php esc_html_e( 'Image List', 'jetpack' ); ?></label></li>
				<li><label><input id="<?php echo $this->get_field_id( 'display' ); ?>-grid" name="<?php echo $this->get_field_name( 'display' ); ?>" type="radio" value="grid" <?php checked( 'grid', $display ); ?> /> <?php esc_html_e( 'Image Grid', 'jetpack' ); ?></label></li>
			</ul>
		</p>
		<?php

		/**
		 * Fires after the fields are displayed in the Top Posts Widget settings in wp-admin.
		 *
		 * Allow adding extra content after the fields are displayed.
		 *
		 * @module widgets
		 *
		 * @since 3.9.3
		 *
		 * @param array $args {
		 *     @param array $instance The widget instance.
		 *     @param object $this The class object.
		 * }
		 */
		do_action( 'jetpack_widget_top_posts_after_fields', array( $instance, $this ) );
	}

	/**
	 * Explains how the statics are calculated.
	 */
	function stats_explanation() {
		?>

		<p><?php esc_html_e( 'Top Posts &amp; Pages by views are calculated from 24-48 hours of stats. They take a while to change.', 'jetpack' ); ?></p>
								<?php
	}

	function update( $new_instance, $old_instance ) {
		$instance          = array();
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

		$allowed_post_types = array_values( get_post_types( array( 'public' => true ) ) );
		$instance['types']  = $new_instance['types'];
		foreach ( $new_instance['types'] as $key => $type ) {
			if ( ! in_array( $type, $allowed_post_types ) ) {
				unset( $new_instance['types'][ $key ] );
			}
		}

		if ( isset( $new_instance['display'] ) && in_array( $new_instance['display'], array( 'grid', 'list', 'text' ) ) ) {
			$instance['display'] = $new_instance['display'];
		} else {
			$instance['display'] = 'text';
		}

		/**
		 * Filters Top Posts Widget settings before they're saved.
		 *
		 * @module widgets
		 *
		 * @since 3.9.3
		 *
		 * @param array $instance The santized widget instance. Only contains data processed by the current widget.
		 * @param array $new_instance The new widget instance before sanitization.
		 */
		$instance = apply_filters( 'jetpack_top_posts_saving', $instance, $new_instance );

		return $instance;
	}

	function widget( $args, $instance ) {
		/** This action is documented in modules/widgets/gravatar-profile.php */
		do_action( 'jetpack_stats_extra', 'widget_view', 'top_posts' );

		$instance = wp_parse_args( (array) $instance, $this->defaults() );

		$title = isset( $instance['title'] ) ? $instance['title'] : false;
		if ( false === $title ) {
			$title = $this->default_title;
		}
		/** This filter is documented in core/src/wp-includes/default-widgets.php */
		$title = apply_filters( 'widget_title', $title );

		$count = isset( $instance['count'] ) ? (int) $instance['count'] : false;
		if ( $count < 1 || 10 < $count ) {
			$count = 10;
		}
		/**
		 * Control the number of displayed posts.
		 *
		 * @module widgets
		 *
		 * @since 3.3.0
		 *
		 * @param string $count Number of Posts displayed in the Top Posts widget. Default is 10.
		 */
		$count = apply_filters( 'jetpack_top_posts_widget_count', $count );

		$types = isset( $instance['types'] ) ? (array) $instance['types'] : array( 'post', 'page' );

		// 'likes' are not available in Jetpack
		$ordering = isset( $instance['ordering'] ) && 'likes' == $instance['ordering'] ? 'likes' : 'views';

		if ( isset( $instance['display'] ) && in_array( $instance['display'], array( 'grid', 'list', 'text' ) ) ) {
			$display = $instance['display'];
		} else {
			$display = 'text';
		}

		if ( 'text' != $display ) {
			$get_image_options = array(
				'fallback_to_avatars' => true,
				/** This filter is documented in modules/stats.php */
				'gravatar_default'    => apply_filters( 'jetpack_static_url', set_url_scheme( 'https://en.wordpress.com/i/logo/white-gray-80.png' ) ),
				'avatar_size'         => 40,
				'width'               => null,
				'height'              => null,
			);
			if ( 'grid' == $display ) {
				$get_image_options['avatar_size'] = 200;
			}
			/**
			 * Top Posts Widget Image options.
			 *
			 * @module widgets
			 *
			 * @since 1.8.0
			 *
			 * @param array $get_image_options {
			 * Array of Image options.
			 * @type bool true Should we default to Gravatars when no image is found? Default is true.
			 * @type string $gravatar_default Default Image URL if no Gravatar is found.
			 * @type int $avatar_size Default Image size.
			 * @type mixed $width Image width, not set by default and $avatar_size is used instead.
			 * @type mixed $height Image height, not set by default and $avatar_size is used instead.
			 * }
			 */
			$get_image_options = apply_filters( 'jetpack_top_posts_widget_image_options', $get_image_options );
		}

		if ( function_exists( 'wpl_get_blogs_most_liked_posts' ) && 'likes' == $ordering ) {
			$posts = $this->get_by_likes( $count );
		} else {
			$posts = $this->get_by_views( $count, $args );
		}

		// Filter the returned posts. Remove all posts that do not match the chosen Post Types.
		if ( isset( $types ) ) {
			foreach ( $posts as $k => $post ) {
				if ( ! in_array( $post['post_type'], $types ) ) {
					unset( $posts[ $k ] );
				}
			}
		}

		if ( ! $posts ) {
			$posts = $this->get_fallback_posts();
		}

		echo $args['before_widget'];
		if ( ! empty( $title ) ) {
			echo $args['before_title'] . $title . $args['after_title'];
		}

		if ( ! $posts ) {
			$link = 'https://jetpack.com/support/getting-more-views-and-traffic/';
			if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
				$link = 'http://en.support.wordpress.com/getting-more-site-traffic/';
			}

			if ( current_user_can( 'edit_theme_options' ) ) {
				echo '<p>' . sprintf(
					__( 'There are no posts to display. <a href="%s" target="_blank">Want more traffic?</a>', 'jetpack' ),
					esc_url( $link )
				) . '</p>';
			}

			echo $args['after_widget'];
			return;
		}

		/**
		 * Filter the layout of the Top Posts Widget
		 *
		 * @module widgets
		 *
		 * @since 6.4.0
		 *
		 * @param string $layout layout of the Top Posts Widget (empty string)
		 * @param array $posts IDs of the posts to be displayed
		 * @param array $display Display option from widget form
		 */
		$layout = apply_filters( 'jetpack_top_posts_widget_layout', '', $posts, $display );
		if ( ! empty( $layout ) ) {
			echo $layout;
			echo $args['after_widget'];
			return;
		}

		switch ( $display ) {
			case 'list':
			case 'grid':
				// Keep the avatar_size as default dimensions for backward compatibility.
				$width  = (int) $get_image_options['avatar_size'];
				$height = (int) $get_image_options['avatar_size'];

				// Check if the user has changed the width.
				if ( ! empty( $get_image_options['width'] ) ) {
					$width = (int) $get_image_options['width'];
				}

				// Check if the user has changed the height.
				if ( ! empty( $get_image_options['height'] ) ) {
					$height = (int) $get_image_options['height'];
				}

				foreach ( $posts as &$post ) {
					$image         = Jetpack_PostImages::get_image(
						$post['post_id'],
						array(
							'fallback_to_avatars' => true,
							'width'               => (int) $width,
							'height'              => (int) $height,
							'avatar_size'         => (int) $get_image_options['avatar_size'],
						)
					);
					$post['image'] = $image['src'];
					if ( 'blavatar' != $image['from'] && 'gravatar' != $image['from'] ) {
						$post['image'] = jetpack_photon_url( $post['image'], array( 'resize' => "$width,$height" ) );
					}
				}

				unset( $post );

				if ( 'grid' == $display ) {
					echo "<div class='widgets-grid-layout no-grav'>\n";
					foreach ( $posts as $post ) :
					?>
					<div class="widget-grid-view-image">
						<?php
						/**
						 * Fires before each Top Post result, inside <li>.
						 *
						 * @module widgets
						 *
						 * @since 3.2.0
						 *
						 * @param string $post['post_id'] Post ID.
						 */
						do_action( 'jetpack_widget_top_posts_before_post', $post['post_id'] );

						/**
						 * Filter the permalink of items in the Top Posts widget.
						 *
						 * @module widgets
						 *
						 * @since 4.4.0
						 *
						 * @param string $post['permalink'] Post permalink.
						 * @param array  $post              Post array.
						 */
						$filtered_permalink = apply_filters( 'jetpack_top_posts_widget_permalink', $post['permalink'], $post );

						?>
						<a href="<?php echo esc_url( $filtered_permalink ); ?>" title="<?php echo esc_attr( wp_kses( $post['title'], array() ) ); ?>" class="bump-view" data-bump-view="tp">
							<img width="<?php echo absint( $width ); ?>" height="<?php echo absint( $height ); ?>" src="<?php echo esc_url( $post['image'] ); ?>" alt="<?php echo esc_attr( wp_kses( $post['title'], array() ) ); ?>" data-pin-nopin="true" />
						</a>
						<?php
						/**
						 * Fires after each Top Post result, inside <li>.
						 *
						 * @module widgets
						 *
						 * @since 3.2.0
						 *
						 * @param string $post['post_id'] Post ID.
						 */
						do_action( 'jetpack_widget_top_posts_after_post', $post['post_id'] );
						?>
						</div>
					<?php
					endforeach;
					echo "</div>\n";
				} else {
					echo "<ul class='widgets-list-layout no-grav'>\n";
					foreach ( $posts as $post ) :
					?>
					<li>
						<?php
						/** This action is documented in modules/widgets/top-posts.php */
						do_action( 'jetpack_widget_top_posts_before_post', $post['post_id'] );

						/** This filter is documented in modules/widgets/top-posts.php */
						$filtered_permalink = apply_filters( 'jetpack_top_posts_widget_permalink', $post['permalink'], $post );
						?>
						<a href="<?php echo esc_url( $filtered_permalink ); ?>" title="<?php echo esc_attr( wp_kses( $post['title'], array() ) ); ?>" class="bump-view" data-bump-view="tp">
							<img width="<?php echo absint( $width ); ?>" height="<?php echo absint( $height ); ?>" src="<?php echo esc_url( $post['image'] ); ?>" class='widgets-list-layout-blavatar' alt="<?php echo esc_attr( wp_kses( $post['title'], array() ) ); ?>" data-pin-nopin="true" />
						</a>
						<div class="widgets-list-layout-links">
							<a href="<?php echo esc_url( $filtered_permalink ); ?>" class="bump-view" data-bump-view="tp">
								<?php echo esc_html( wp_kses( $post['title'], array() ) ); ?>
							</a>
						</div>
						<?php
						/** This action is documented in modules/widgets/top-posts.php */
						do_action( 'jetpack_widget_top_posts_after_post', $post['post_id'] );
						?>
						</li>
					<?php
					endforeach;
					echo "</ul>\n";
				}
				break;
			default:
				echo '<ul>';
				foreach ( $posts as $post ) :
				?>
				<li>
					<?php
					/** This action is documented in modules/widgets/top-posts.php */
					do_action( 'jetpack_widget_top_posts_before_post', $post['post_id'] );

					/** This filter is documented in modules/widgets/top-posts.php */
					$filtered_permalink = apply_filters( 'jetpack_top_posts_widget_permalink', $post['permalink'], $post );
					?>
					<a href="<?php echo esc_url( $filtered_permalink ); ?>" class="bump-view" data-bump-view="tp">
						<?php echo esc_html( wp_kses( $post['title'], array() ) ); ?>
					</a>
					<?php
					/** This action is documented in modules/widgets/top-posts.php */
					do_action( 'jetpack_widget_top_posts_after_post', $post['post_id'] );
					?>
					</li>
				<?php
				endforeach;
				echo '</ul>';
		}

		echo $args['after_widget'];
	}

	public static function defaults() {
		return array(
			'title'    => esc_html__( 'Top Posts &amp; Pages', 'jetpack' ),
			'count'    => absint( 10 ),
			'types'    => array( 'post', 'page' ),
			'ordering' => 'views',
			'display'  => 'text',
		);
	}

	/*
	 * Get most liked posts
	 *
	 * ONLY TO BE USED IN WPCOM
	 */
	function get_by_likes( $count ) {
		$post_likes = wpl_get_blogs_most_liked_posts();
		if ( ! $post_likes ) {
			return array();
		}

		return $this->get_posts( array_keys( $post_likes ), $count );
	}

	function get_by_views( $count, $args ) {
		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			global $wpdb;

			$post_views = wp_cache_get( "get_top_posts_$count", 'stats' );
			if ( false === $post_views ) {
				$post_views = array_shift( stats_get_daily_history( false, get_current_blog_id(), 'postviews', 'post_id', false, 2, '', $count * 2 + 10, true ) );
				unset( $post_views[0] );
				wp_cache_add( "get_top_posts_$count", $post_views, 'stats', 1200 );
			}

			return $this->get_posts( array_keys( $post_views ), $count );
		}

		/**
		 * Filter the number of days used to calculate Top Posts for the Top Posts widget.
		 * We do not recommend accessing more than 10 days of results at one.
		 * When more than 10 days of results are accessed at once, results should be cached via the WordPress transients API.
		 * Querying for -1 days will give results for an infinite number of days.
		 *
		 * @module widgets
		 *
		 * @since 3.9.3
		 *
		 * @param int 2 Number of days. Default is 2.
		 * @param array $args The widget arguments.
		 */
		$days = (int) apply_filters( 'jetpack_top_posts_days', 2, $args );

		/** Handling situations where the number of days makes no sense - allows for unlimited days where $days = -1 */
		if ( 0 == $days || false == $days ) {
			$days = 2;
		}

		$post_view_posts = stats_get_from_restapi( array(), 'top-posts?max=11&summarize=1&num=' . intval( $days ) );

		if ( ! isset( $post_view_posts->summary ) || empty( $post_view_posts->summary->postviews ) ) {
			return array();
		}

		$post_view_ids = array_filter( wp_list_pluck( $post_view_posts->summary->postviews, 'id' ) );

		if ( ! $post_view_ids ) {
			return array();
		}

		return $this->get_posts( $post_view_ids, $count );
	}

	function get_fallback_posts() {
		if ( current_user_can( 'edit_theme_options' ) ) {
			return array();
		}

		$post_query = new WP_Query;

		$posts = $post_query->query(
			array(
				'posts_per_page' => 1,
				'post_status'    => 'publish',
				'post_type'      => array( 'post', 'page' ),
				'no_found_rows'  => true,
			)
		);

		if ( ! $posts ) {
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

			if ( ! $post ) {
				continue;
			}

			/**
			 * Attachment pages use the 'inherit' post status by default.
			 * To be able to remove attachment pages from private and password protect posts,
			 * we need to replace their post status by the parent post' status.
			 */
			if ( 'inherit' == $post->post_status && 'attachment' == $post->post_type ) {
				$post->post_status = get_post_status( $post_id );
			}

			// hide private and password protected posts
			if ( 'publish' != $post->post_status || ! empty( $post->post_password ) ) {
				continue;
			}

			// Both get HTML stripped etc on display
			if ( empty( $post->post_title ) ) {
				$title_source = $post->post_content;
				$title        = wp_html_excerpt( $title_source, 50 );
				$title       .= '&hellip;';
			} else {
				$title = $post->post_title;
			}

			$permalink = get_permalink( $post->ID );

			$post_type = $post->post_type;

			$posts[] = compact( 'title', 'permalink', 'post_id', 'post_type' );
			$counter++;

			if ( $counter == $count ) {
				break; // only need to load and show x number of likes
			}
		}

		/**
		 * Filter the Top Posts and Pages.
		 *
		 * @module widgets
		 *
		 * @since 3.0.0
		 *
		 * @param array $posts Array of the most popular posts.
		 * @param array $post_ids Array of Post IDs.
		 * @param string $count Number of Top Posts we want to display.
		 */
		return apply_filters( 'jetpack_widget_get_top_posts', $posts, $post_ids, $count );
	}
}

/**
 * Create a shortcode to display the widget anywhere.
 *
 * @since 3.9.2
 */
function jetpack_do_top_posts_widget( $instance ) {
	// Post Types can't be entered as an array in the shortcode parameters.
	if ( isset( $instance['types'] ) && is_array( $instance['types'] ) ) {
		$instance['types'] = implode( ',', $instance['types'] );
	}

	$instance = shortcode_atts(
		Jetpack_Top_Posts_Widget::defaults(),
		$instance,
		'jetpack_top_posts_widget'
	);

	// Add a class to allow styling
	$args = array(
		'before_widget' => sprintf( '<div class="%s">', 'jetpack_top_posts_widget' ),
	);

	ob_start();
	the_widget( 'Jetpack_Top_Posts_Widget', $instance, $args );
	$output = ob_get_clean();

	return $output;
}
add_shortcode( 'jetpack_top_posts_widget', 'jetpack_do_top_posts_widget' );
