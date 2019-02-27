<?php
/**
 * Register the widget for use in Appearance -> Widgets
 */
add_action( 'widgets_init', 'jetpack_goodreads_widget_init' );

function jetpack_goodreads_widget_init() {
	register_widget( 'WPCOM_Widget_Goodreads' );
}

/**
 * Goodreads widget class
 * Display a user's Goodreads shelf.
 * Customize user_id, title, and shelf
 *
 */
class WPCOM_Widget_Goodreads extends WP_Widget {

	private $goodreads_widget_id = 0;

	function __construct() {
		parent::__construct(
			'wpcom-goodreads',
			/** This filter is documented in modules/widgets/facebook-likebox.php */
			apply_filters( 'jetpack_widget_name', __( 'Goodreads', 'jetpack' ) ),
			array(
				'classname'                   => 'widget_goodreads',
				'description'                 => __( 'Display your books from Goodreads', 'jetpack' ),
				'customize_selective_refresh' => true,
			)
		);
		// For user input sanitization and display
		$this->shelves = array(
			'read'              => _x( 'Read', 'past participle: books I have read', 'jetpack' ),
			'currently-reading' => __( 'Currently Reading', 'jetpack' ),
			'to-read'           => _x( 'To Read', 'my list of books to read', 'jetpack' ),
		);

		if ( is_active_widget( '', '', 'wpcom-goodreads' ) || is_customize_preview() ) {
			add_action( 'wp_print_styles', array( $this, 'enqueue_style' ) );
		}
	}

	function enqueue_style() {
		wp_enqueue_style( 'goodreads-widget', plugins_url( 'goodreads/css/goodreads.css', __FILE__ ) );
		wp_style_add_data( 'goodreads-widget', 'rtl', 'replace' );
	}

	function widget( $args, $instance ) {
		/** This action is documented in modules/widgets/gravatar-profile.php */
		do_action( 'jetpack_stats_extra', 'widget_view', 'goodreads' );

		/** This filter is documented in core/src/wp-includes/default-widgets.php */
		$title = apply_filters( 'widget_title', isset( $instance['title'] ) ? $instance['title'] : '' );

		if ( empty( $instance['user_id'] ) || 'invalid' === $instance['user_id'] ) {
			if ( current_user_can( 'edit_theme_options' ) ) {
				echo $args['before_widget'];
				echo '<p>' . sprintf(
					__( 'You need to enter your numeric user ID for the <a href="%1$s">Goodreads Widget</a> to work correctly. <a href="%2$s" target="_blank">Full instructions</a>.', 'jetpack' ),
					esc_url( admin_url( 'widgets.php' ) ),
					'https://support.wordpress.com/widgets/goodreads-widget/#goodreads-user-id'
				) . '</p>';
				echo $args['after_widget'];
			}
			return;
		}

		if ( ! array_key_exists( $instance['shelf'], $this->shelves ) ) {
			return;
		}

		$instance['user_id'] = absint( $instance['user_id'] );

		// Set widget ID based on shelf.
		$this->goodreads_widget_id = $instance['user_id'] . '_' . $instance['shelf'];

		if ( empty( $title ) ) {
			$title = esc_html__( 'Goodreads', 'jetpack' );
		}

		echo $args['before_widget'];
		echo $args['before_title'] . $title . $args['after_title'];

		$goodreads_url = 'https://www.goodreads.com/review/custom_widget/' . urlencode( $instance['user_id'] ) . '.' . urlencode( $instance['title'] ) . ':%20' . urlencode( $instance['shelf'] ) . '?cover_position=&cover_size=small&num_books=5&order=d&shelf=' . urlencode( $instance['shelf'] ) . '&sort=date_added&widget_bg_transparent=&widget_id=' . esc_attr( $this->goodreads_widget_id );

		echo '<div class="gr_custom_widget" id="gr_custom_widget_' . esc_attr( $this->goodreads_widget_id ) . '"></div>' . "\n";
		echo '<script src="' . esc_url( $goodreads_url ) . '"></script>' . "\n";

		echo $args['after_widget'];
	}

	function goodreads_user_id_exists( $user_id ) {
		$url      = "https://www.goodreads.com/user/show/$user_id/";
		$response = wp_remote_head(
			$url, array(
				'httpversion' => '1.1',
				'timeout'     => 3,
				'redirection' => 2,
			)
		);
		if ( 200 === wp_remote_retrieve_response_code( $response ) ) {
			return true;
		} else {
			return false;
		}
	}

	function update( $new_instance, $old_instance ) {
		$instance = $old_instance;

		$instance['user_id'] = trim( wp_kses( stripslashes( $new_instance['user_id'] ), array() ) );
		if ( ! empty( $instance['user_id'] ) && ( ! isset( $old_instance['user_id'] ) || $instance['user_id'] !== $old_instance['user_id'] ) ) {
			if ( ! $this->goodreads_user_id_exists( $instance['user_id'] ) ) {
				$instance['user_id'] = 'invalid';
			}
		}
		$instance['title'] = wp_kses( stripslashes( $new_instance['title'] ), array() );
		$shelf             = wp_kses( stripslashes( $new_instance['shelf'] ), array() );
		if ( array_key_exists( $shelf, $this->shelves ) ) {
			$instance['shelf'] = $shelf;
		}

		return $instance;
	}

	function form( $instance ) {
		//Defaults
		$instance = wp_parse_args(
			(array) $instance, array(
				'user_id' => '',
				'title'   => 'Goodreads',
				'shelf'   => 'read',
			)
		);

		echo '<p><label for="' . esc_attr( $this->get_field_id( 'title' ) ) . '">' . esc_html__( 'Title:', 'jetpack' ) . '
		<input class="widefat" id="' . esc_attr( $this->get_field_id( 'title' ) ) . '" name="' . esc_attr( $this->get_field_name( 'title' ) ) . '" type="text" value="' . esc_attr( $instance['title'] ) . '" />
		</label></p>
		<p><label for="' . esc_attr( $this->get_field_id( 'user_id' ) ) . '">';
		printf( __( 'Goodreads numeric user ID <a href="%s" target="_blank">(instructions)</a>:', 'jetpack' ), 'https://en.support.wordpress.com/widgets/goodreads-widget/#goodreads-user-id' );
		if ( 'invalid' === $instance['user_id'] ) {
			printf( '<br /><small class="error">%s</small>&nbsp;', __( 'Invalid User ID, please verify and re-enter your Goodreads numeric user ID.', 'jetpack' ) );
			$instance['user_id'] = '';
		}
		echo '<input class="widefat" id="' . esc_attr( $this->get_field_id( 'user_id' ) ) . '" name="' . esc_attr( $this->get_field_name( 'user_id' ) ) . '" type="text" value="' . esc_attr( $instance['user_id'] ) . '" />
		</label></p>
		<p><label for="' . esc_attr( $this->get_field_id( 'shelf' ) ) . '">' . esc_html__( 'Shelf:', 'jetpack' ) . '
		<select class="widefat" id="' . esc_attr( $this->get_field_id( 'shelf' ) ) . '" name="' . esc_attr( $this->get_field_name( 'shelf' ) ) . '" >';
		foreach ( $this->shelves as $_shelf_value => $_shelf_display ) {
			echo "\t<option value='" . esc_attr( $_shelf_value ) . "'" . selected( $_shelf_value, $instance['shelf'] ) . '>' . $_shelf_display . "</option>\n";
		}
		echo '</select>
		</label></p>
		';
	}
}
