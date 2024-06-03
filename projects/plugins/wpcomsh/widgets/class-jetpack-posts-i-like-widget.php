<?php // phpcs:ignore Squiz.Commenting.FileComment.Missing

/**
 * Posts I Like Widget
 */
class Jetpack_Posts_I_Like_Widget extends WP_Widget {
	/**
	 * Widget settings.
	 *
	 * @var array $defaults
	 */
	public $defaults = array();

	/**
	 * Registers the widget with WordPress.
	 */
	public function __construct() {
		parent::__construct(
			'jetpack_posts_i_like', // Base ID
			__( 'Posts I Like', 'wpcomsh' ), // Name
			array(
				'description' => __( 'A list of the posts I most recently liked', 'wpcomsh' ),
			)
		);

		$this->defaults = array(
			'title'   => __( 'Posts I Like', 'wpcomsh' ),
			'liker'   => 0,
			'number'  => 5,
			'display' => 'list',
		);

		if ( is_active_widget( false, false, $this->id_base ) || is_active_widget( false, false, 'monster' ) ) {
			add_action( 'wp_print_styles', array( $this, 'enqueue_style' ) );
			add_action( 'wp_print_scripts', array( $this, 'enqueue_script' ) );
		}
	}

	/**
	 * Enqueue style.
	 */
	public function enqueue_style() {
		wp_enqueue_style( 'widget-grid-and-list' );
	}

	/**
	 * Enqueue script.
	 */
	public function enqueue_script() {
		wp_enqueue_script( 'widget-bump-view' );
	}

	/**
	 * Back-end widget form.
	 *
	 * @see WP_Widget::form()
	 *
	 * @param array $instance Previously saved values from database.
	 * @return never
	 */
	public function form( $instance ) {
		// outputs the options form on admin
		$instance = array_merge( $this->defaults, $instance );

		$title  = $instance['title'];
		$number = (int) $instance['number'];

		if ( $number < 1 ) {
			$number = 1;
		} elseif ( $number > 15 ) {
			$number = 15;
		}

		$liker = $instance['liker'];
		// If the liker is a wpcom user, convert it into a local user.
		if ( empty( $instance['local_liker'] ) ) {
			$liker = self::get_local_user_from_wpcom_user( $liker );
		}
		if ( 0 === $liker ) {
			$liker = get_current_user_id();
		}

		$display = ( 'grid' === $instance['display'] ) ? 'grid' : 'list';

		?>
		<p>
			<label for="<?php echo esc_attr( $this->get_field_id( 'title' ) ); ?>"><?php esc_html_e( 'Title:', 'wpcomsh' ); ?></label>
			<input class="widefat" id="<?php echo esc_attr( $this->get_field_id( 'title' ) ); ?>" name="<?php echo esc_attr( $this->get_field_name( 'title' ) ); ?>" type="text" value="<?php echo esc_attr( $title ); ?>" />
		</p>

		<p>
			<label for="<?php echo esc_attr( $this->get_field_id( 'number' ) ); ?>"><?php esc_html_e( 'Number of posts to show (1 to 15):', 'wpcomsh' ); ?></label>
			<input id="<?php echo esc_attr( $this->get_field_id( 'number' ) ); ?>" name="<?php echo esc_attr( $this->get_field_name( 'number' ) ); ?>" type="number" value="<?php echo (int) $number; ?>" min="1" max="15" />
		</p>

		<p>
			<label><?php esc_html_e( 'Display as:', 'wpcomsh' ); ?></label>
				<ul>
					<li><label><input id="<?php echo esc_attr( $this->get_field_id( 'display' ) ); ?>-list" name="<?php echo esc_attr( $this->get_field_name( 'display' ) ); ?>" type="radio" value="list" <?php checked( 'list', $display ); ?> /> <?php esc_html_e( 'List', 'wpcomsh' ); ?></label></li>
					<li><label><input id="<?php echo esc_attr( $this->get_field_id( 'display' ) ); ?>-grid" name="<?php echo esc_attr( $this->get_field_name( 'display' ) ); ?>" type="radio" value="grid" <?php checked( 'grid', $display ); ?> /> <?php esc_html_e( 'Grid', 'wpcomsh' ); ?></label></li>
				</ul>
		</p>
		<?php

		$liker_dropdown = wp_dropdown_users(
			array(
				'selected'                => $liker,
				'name'                    => $this->get_field_name( 'liker' ),
				'id'                      => $this->get_field_id( 'liker' ),
				'echo'                    => false,
				'hide_if_only_one_author' => true,
			)
		);

		if ( $liker_dropdown ) :
			?>
			<p>
				<label for="<?php echo esc_attr( $this->get_field_id( 'liker' ) ); ?>"><?php esc_html_e( "Author's likes to display:", 'wpcomsh' ); ?></label>
				<?php echo $liker_dropdown; /* phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- as this is HTML code from core's wp_dropdown_users() */ ?>
			</p>
		<?php else : ?>
			<input type="hidden"
				id="<?php echo esc_attr( $this->get_field_id( 'liker' ) ); ?>"
				name="<?php echo esc_attr( $this->get_field_name( 'liker' ) ); ?>"
				value="<?php echo (int) $liker; ?>"
			/>
			<?php
		endif;
	}

	/**
	 * Sanitize widget form values as they are saved.
	 *
	 * @see WP_Widget::update()
	 *
	 * @param array $new_instance Values just sent to be saved.
	 * @param array $old_instance Previously saved values from database.
	 *
	 * @return array Updated safe values to be saved.
	 */
	public function update( $new_instance, $old_instance ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		// processes widget options to be saved

		$instance          = array();
		$instance['title'] = wp_kses( $new_instance['title'], array() );
		if ( $instance['title'] === $this->defaults['title'] ) {
			$instance['title'] = false; // Store as false in case of language change
		}

		$instance['number'] = (int) $new_instance['number'];
		if ( $instance['number'] < 1 ) {
			$instance['number'] = 1;
		} elseif ( $instance['number'] > 15 ) {
			$instance['number'] = 15;
		}

		$instance['display'] = isset( $new_instance['display'] ) && 'grid' === $new_instance['display'] ? 'grid' : 'list';

		$instance['liker'] = (int) $new_instance['liker'];
		if ( ! is_user_member_of_blog( $instance['liker'] ) ) {
			$instance['liker'] = 0;
		}

		$instance['local_liker'] = true;

		return $instance;
	}

	/**
	 * Front-end display of widget.
	 *
	 * @see WP_Widget::widget()
	 *
	 * @param array $args     Widget arguments.
	 * @param array $instance Saved values from database.
	 */
	public function widget( $args, $instance ) {
		// Set default values to avoid displaying undeinfed index notices
		$instance = array_merge( $this->defaults, $instance );
		$title    = apply_filters( 'widget_title', $instance['title'] );

		/**
		 * Use the Like's API to load all of a user's ($instance['liker']) likes
		 * and put them all in a posts_i_like array so we can easily output it based on grid or list
		 */
		$liker             = $instance['liker'] ?? null;
		$number_to_display = $instance['number'];

		$get_image_options = array(
			'from_html'           => true,
			'fallback_to_avatars' => true,
			'gravatar_default'    => 'https://s0.wp.com/i/logo/white-gray-80.png',
		);

		if ( 'grid' === $instance['display'] ) {
			// for grid display, we need an even number so it looks ok
			$number_to_display               += $number_to_display % 2;
			$get_image_options['avatar_size'] = 200;
		} else {
			$get_image_options['avatar_size'] = 40;
		}

		// If the liker is a wpcom user, convert it into a local user.
		if ( $liker && empty( $instance['local_liker'] ) ) {
			$liker = self::get_local_user_from_wpcom_user( $liker );
		}

		$posts_i_like = array();
		if ( $liker && is_user_member_of_blog( $liker ) ) {
			$force_update = is_customize_preview();
			$posts        = $this->get_liked_posts( $liker, $number_to_display, $force_update );

			foreach ( $posts as $post ) {
				$posts_i_like[] = (object) $post;
			}

			do_action( 'jetpack_stats_extra', 'widget_view', 'posts_i_like' );
		}

		$current_user_controls_widget = ( is_user_logged_in() && get_current_user_id() === $liker ) || current_user_can( 'edit_theme_options' );
		if ( ! $posts_i_like ) {
			// Bail if There are no likes and the current user can do nothing about it.
			if ( ! $current_user_controls_widget ) {
				return;
			}
		}

		echo $args['before_widget']; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped

		if ( ! empty( $title ) ) {
			echo $args['before_title'] . esc_html( $title ) . $args['after_title']; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		}

		if ( $posts_i_like ) {
			if ( 'grid' === $instance['display'] ) {
				$output = '';

				echo "<div class='widgets-grid-layout no-grav'>";

				foreach ( $posts_i_like as $post ) {
					$hover_text = sprintf(
						/* translators: %1$s is the post title, %1$s is the blog name. */
						_x( '%1$s on %2$s', '1: Post Title, 2: Blog Name', 'wpcomsh' ),
						wp_kses( $post->post_title, array() ),
						wp_kses( $post->blog_name, array() )
					);

					$output .= "<div class='widget-grid-view-image'>";
					$output .= "<a href='" . esc_url( $post->post_permalink ) . "' title='" . esc_attr( $hover_text ) . "' class='bump-view' data-bump-view='pil'>";
					$output .= "<img src='" . esc_url( $post->post_image ) . "'/>";
					$output .= '</a>';
					$output .= '</div>';
				}

				echo $output; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- as this is intentially complex HTML and the vars have been escaped already.

				echo '</div>';

			} else {
				echo "<ul class='widgets-list-layout no-grav'>";

				foreach ( $posts_i_like as $post ) {
					echo '<li>';
					echo "<img src='" . esc_url( $post->post_image ) . "' class='widgets-list-layout-blavatar' />";
					echo "<div class='widgets-list-layout-links'><a href='" . esc_url( $post->post_permalink ) . "' class='bump-view' data-bump-view='pil'>" . esc_html( $post->post_title ) . '</a> ';
					echo '<span>' . esc_html__( 'on', 'wpcomsh' );
					echo "&nbsp;<a href='" . esc_url( $post->blog_url ) . "' class='bump-view' data-bump-view='pil'>" . esc_html( $post->blog_name ) . '</a>';
					echo '</span></div>';
					echo '</li>';
				}

				echo '</ul>';
			}
		} elseif ( $current_user_controls_widget ) {
			echo '<p>' . sprintf(
				wp_kses(
					// translators: %s is a URL to the widgets settings page.
					__( 'You have not recently liked any posts. Once you do, this <a href="%s">Posts I Like</a> widget will display them.', 'wpcomsh' ),
					array(
						'a' => array( 'href' => array() ),
					)
				),
				esc_url( admin_url( 'widgets.php' ) )
			) . '</p>';
		}

		echo $args['after_widget']; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	}

	/**
	 * Gets posts that are marked as liked.
	 *
	 * @param int  $user_id User ID.
	 * @param int  $post_count Count of posts to retrieve.
	 * @param bool $force_update Whether or not to use cached results if available.
	 */
	public function get_liked_posts( $user_id, $post_count = 5, $force_update = false ) {
		$transient_key = implode( '|', array( 'wpcomsh-post-i-like-widget', $user_id, $post_count ) );

		if ( ! $force_update ) {
			$posts = get_transient( $transient_key );

			if ( false !== $posts ) {
				return $posts;
			}
		}

		$version = 2;
		$path    = 'liked-posts';

		$args = array(
			'url'     => sprintf( '%s/wpcom/v%s/%s?count=%s', JETPACK__WPCOM_JSON_API_BASE, $version, $path, $post_count ),
			'method'  => 'GET',
			'user_id' => $user_id,
			'blog_id' => (int) Jetpack_Options::get_option( 'id' ),
		);

		$response = Automattic\Jetpack\Connection\Client::remote_request( $args );

		if ( is_wp_error( $response ) || 200 !== $response['response']['code'] || empty( $response['body'] ) ) {
			return array();
		}

		$posts = json_decode( $response['body'], true );
		set_transient( $transient_key, $posts, 20 * MINUTE_IN_SECONDS );

		return $posts;
	}

	/**
	 * Get local user id from wpcom user id.
	 *
	 * @param int $user_id wpcom user id.
	 * @return int local user id that connected to the passed wpcom user id. Returns 0 if no result is found.
	 */
	public static function get_local_user_from_wpcom_user( $user_id ) {
		global $wpdb;

		return (int) $wpdb->get_var( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
			$wpdb->prepare(
				"SELECT user_id FROM {$wpdb->usermeta} WHERE meta_key=%s AND meta_value=%s",
				'wpcom_user_id',
				$user_id
			)
		);
	}
}

/**
 * Register the widget for use in Appearance -> Widgets
 */
function jetpack_posts_i_like_widget_init() { // phpcs:ignore Universal.Files.SeparateFunctionsFromOO.Mixed
	register_widget( 'Jetpack_Posts_I_Like_Widget' );
}
add_action( 'widgets_init', 'jetpack_posts_i_like_widget_init' );
