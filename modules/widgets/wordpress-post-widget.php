<?php
/**
 * Plugin Name: Display Recent WordPress Posts Widget
 * Description: Displays recent posts from a WordPress.com or Jetpack-enabled self-hosted WordPress site. 
 * Version: 1.0
 * Author: Brad Angelcyk, Kathryn Presner, Justin Shreve, Carolyn Sonnek
 * Author URI: http://automattic.com
 * License: GPL2
 */
add_action( 'widgets_init', 'jetpack_display_posts_widget' );
function jetpack_display_posts_widget() {
	 register_widget( 'Jetpack_Display_Posts_Widget' );
}

/**
* Displays a list of recent posts from a WordPress.com or Jetpack-enabled blog.
*/
class Jetpack_Display_Posts_Widget extends WP_Widget {

	public function __construct() {
		parent::__construct(
			'jetpack_display_posts_widget', // internal id
			__( 'Display WordPress Posts (Jetpack)', 'jetpack' ), // wp-admin title
			array(
				'description' => __( 'Displays a list of recent posts from another WordPress.com or Jetpack-enabled blog.', 'jetpack' ), // description
			)
		);
	}

	/** Set up the widget display on the front end
	*/
	public function widget( $args, $instance ) {
		$title = apply_filters( 'widget_title', $instance['title'] );

		wp_enqueue_style( 'jetpack_display_posts_widget', plugins_url( 'wordpress-post-widget/style.css' ) );

		$site = $instance['url'];
		$site = urlencode( $site );
		$api_url = "https://public-api.wordpress.com/rest/v1/sites/" . $site;

		$data_from_cache = get_transient( 'wp-site-info-' . $instance['url'], 'display-posts-widget' );
		if ( false === $data_from_cache ) {
			$response = wp_remote_get( $api_url );
			set_transient( 'wp-site-info-' . $instance['url'], $response, 'display-posts-widget', ( 10 * MINUTE_IN_SECONDS ) );
		} else {
			$response = $data_from_cache;
		}

		$site_info = json_decode( $response ['body'] );

		echo $args['before_widget'];

		if ( empty( $site_info->ID ) ) {
			echo "<p>" . __( 'We cannot load blog data at this time.', 'jetpack' ) . "</p>";
			echo $args['after_widget'];
			return;
		}

		if ( ! empty( $title ) ) {
			echo $args['before_title'] . esc_html( $title . ": " . $site_info->name ) . $args['after_title'];
		}
		else {
			echo $args['before_title'] . esc_html( $site_info->name ) . $args['after_title'];
		}

		$number_of_posts = $instance['number_of_posts'];

		$data_from_cache = get_transient( 'wp-post-info-' . $instance['url'], 'display-posts-widget' );
		if ( false === $data_from_cache ) {
			$response = wp_remote_get( $api_url . '/posts' );
			set_transient( 'wp-post-info-' . $instance['url'], $response, 'display-posts-widget', ( 10 * MINUTE_IN_SECONDS ) );
		} else {
			$response = $data_from_cache;
		}

		if ( is_a( $response, 'WP_Error' ) ) {
			echo "<p>" . __( 'We cannot load blog data at this time.', 'jetpack' ) . "</p>";
			echo $args['after_widget'];
			return;
		}

		$posts_info = json_decode( $response['body'] );

		echo "<div class='jetpack-display-remote-posts'>";

		if ( isset( $posts_info->error ) && 'jetpack_error' == $posts_info->error ) {
			echo '<p>' . __( 'We cannot display posts for this blog.', 'jetpack' ) . '</p>';
			echo $args['after_widget'];
			return;
		}

		for ( $i = 0; $i < $number_of_posts; $i++ ) {
			$single_post = $posts_info->posts[$i];
			$post_title = ( $single_post->title ) ? esc_html( $single_post->title ) : '( No Title )';

			echo "<h4><a href='" . esc_url( $single_post->URL ) . "'>". $post_title . "</a></h4>" . "\n";
			if ( ( $instance['featured_image'] == true ) && ( ! empty ( $single_post->featured_image) ) ) {
				$featured_image = ( $single_post->featured_image ) ? $single_post->featured_image  : '';
				echo "<img src='" . $featured_image . "'>";
			}

			if ( $instance['show_excerpts'] == true ) {
				$post_excerpt = ( $single_post->excerpt ) ? $single_post->excerpt  : '';
				echo $post_excerpt;
			}

		}

		echo "</div>";

		echo $args['after_widget'];
	}

	public function form( $instance ) {
		if ( isset( $instance[ 'title' ] ) ) {
			$title = $instance[ 'title' ];
		} else {
			$title = __( 'Recent Posts', 'jetpack' );
		}

		if ( isset( $instance[ 'url' ] ) ) {
			$url = $instance[ 'url' ];
		} else {
			$url = "";
		}

		if ( isset( $instance[ 'number_of_posts' ] ) ) {
			$number_of_posts = $instance[ 'number_of_posts' ];
		} else {
			$number_of_posts = 5;
		}

		if ( isset( $instance[ 'featured_image'] ) ) {
			$featured_image = $instance[ 'featured_image'];
		} else {
			$featured_image = false;
		}

		if ( isset( $instance[ 'show_excerpts'] ) ) {
			$show_excerpts = $instance[ 'show_excerpts'];
		} else {
			$show_excerpts = false;
		}

		?>
		<p>
			<label for="<?php echo $this->get_field_id( 'title' ); ?>"><?php _e( 'Title:', 'jetpack' ); ?></label>
			<input class="widefat" id="<?php echo $this->get_field_id( 'title' ); ?>" name="<?php echo $this->get_field_name( 'title' ); ?>" type="text" value="<?php echo esc_attr( $title ); ?>" />
		</p>

		<p>
			<label for="<?php echo $this->get_field_id( 'url' ); ?>"><?php _e( 'Blog URL:', 'jetpack' ); ?></label>
			<input class="widefat" id="<?php echo $this->get_field_id( 'url' ); ?>" name="<?php echo $this->get_field_name( 'url' ); ?>" type="text" value="<?php echo esc_attr( $url ); ?>" />
			<p>
			<?php _e( "Enter a WordPress.com or Jetpack WordPress site URL.", 'jetpack' ); ?>
			</p>
		</p>
		<p>
			<label for="<?php echo $this->get_field_id( 'number_of_posts' ); ?>"><?php _e( 'Number of Posts to Display:', 'jetpack' ); ?></label>
			<select name="<?php echo $this->get_field_name( 'number_of_posts' ); ?>">
				<?php
					for ($i = 1; $i <= 10; $i++) {
					echo '<option value="' . $i . '" '.selected( $number_of_posts, $i ).'>' . $i . '</option>';
					}
				?>
			</select>
		</p>
		<p>
			<label for="<?php echo $this->get_field_id( 'featured_image' ); ?>"><?php _e( 'Show Featured Image:', 'jetpack' ); ?></label>
			<input type="checkbox" name="<?php echo $this->get_field_name( 'featured_image' ); ?>" <?php checked( $featured_image, 1 ); ?> />
		</p>
		<p>
			<label for="<?php echo $this->get_field_id( 'show_excerpts' ); ?>"><?php _e( 'Show Excerpts:', 'jetpack' ); ?></label>
			<input type="checkbox" name="<?php echo $this->get_field_name( 'show_excerpts' ); ?>" <?php checked( $show_excerpts, 1 ); ?> />
		</p>

		<?php
	}

	public function update( $new_instance, $old_instance ) {
		$instance = array();
		$instance['title'] = ( ! empty( $new_instance['title'] ) ) ? strip_tags( $new_instance['title'] ) : '';
		$instance['url'] = ( ! empty( $new_instance['url'] ) ) ? strip_tags( $new_instance['url'] ) : '';
		$instance['url'] = str_replace( "http://", "", $instance['url'] );
		$instance['url'] = untrailingslashit( $instance['url'] );
		$instance['number_of_posts'] = ( ! empty( $new_instance['number_of_posts'] ) ) ? intval( $new_instance['number_of_posts'] ) : '';
		$instance['featured_image'] = ( ! empty( $new_instance['featured_image'] ) ) ? true : '';
		$instance['show_excerpts'] = ( ! empty( $new_instance['show_excerpts'] ) ) ? true : '';
		return $instance;
	}

}
?>
