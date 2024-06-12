<?php // phpcs:ignore Squiz.Commenting.FileComment.Missing
/**
 * Freshly Pressed widget from WordPress.com.
 */
class WPCOM_Freshly_Pressed_Widget extends WP_Widget {

	/**
	 * Constructor.
	 */
	public function __construct() {
		$widget_ops  = array(
			'classname'   => 'widget_freshly_pressed',
			'description' => __( 'Display a Freshly Pressed badge in your sidebar', 'wpcomsh' ),
		);
		$control_ops = array( 'width' => 250 );
		parent::__construct( 'freshly_pressed', __( 'Freshly Pressed', 'wpcomsh' ), $widget_ops, $control_ops );
	}

	/**
	 * Display the widget.
	 *
	 * @param array $args     Widget arguments.
	 * @param array $instance Widget instance.
	 */
	public function widget( $args, $instance ) {
		$defaults = array(
			'title' => '',
			'badge' => 'rectangle',
		);
		$instance = wp_parse_args( (array) $instance, $defaults );

		echo $args['before_widget']; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped

		$title = apply_filters( 'widget_title', $instance['title'] );

		if ( $title ) {
			echo $args['before_title'] . esc_html( $title ) . $args['after_title']; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		}

		$badge_size = $this->get_badge_size( $instance['badge'] );

		echo '<a href="http://discover.wordpress.com/" title="Featured on Freshly Pressed"><img src="' . esc_url( $this->get_badge_url( $instance['badge'] ) ) . '" width="' . (int) $badge_size['width'] . 'px" height="' . (int) $badge_size['height'] . 'px" /></a>';

		echo "\n" . $args['after_widget']; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped

		do_action( 'jetpack_stats_extra', 'widget_view', 'freshly_pressed' );
	}

	/**
	 * Update the widget settings.
	 *
	 * @param array $new_instance New settings.
	 * @param array $old_instance Old settings.
	 */
	public function update( $new_instance, $old_instance ) {
		$instance = $old_instance;

		$instance['title'] = wp_strip_all_tags( $new_instance['title'] );
		$instance['badge'] = esc_attr( $new_instance['badge'] );

		return $instance;
	}

	/**
	 * Display the widget settings form.
	 *
	 * @param array $instance Current settings.
	 * @return never
	 */
	public function form( $instance ) {
		$defaults = array(
			'title' => '',
			'badge' => 'rectangle',
		);
		$instance = wp_parse_args( (array) $instance, $defaults );

		$title = esc_attr( $instance['title'] );
		$badge = esc_attr( $instance['badge'] );

		echo '<p><label for="' . esc_attr( $this->get_field_id( 'title' ) ) . '">' . esc_html__( 'Title:', 'wpcomsh' ) . '
		<input class="widefat" id="' . esc_attr( $this->get_field_id( 'title' ) ) . '" name="' . esc_attr( $this->get_field_name( 'title' ) ) . '" type="text" value="' . esc_attr( $title ) . '" />
		</label></p>

		<p>' . esc_html__( 'Choose an image to display in your sidebar:', 'wpcomsh' ) . '<br /><br />';

		foreach ( $this->badges() as $badge_name => $badge_ops ) {
			echo '<input type="radio" name="' . esc_attr( $this->get_field_name( 'badge' ) ) . '" value="' . esc_attr( $badge_name ) . '" ' . checked( $badge_name, $badge, false ) . '/> <img src="' . esc_url( $this->get_badge_url( $badge_name ) ) . '" width="' . intval( $badge_ops['width'] ) . 'px" height="' . intval( $badge_ops['height'] ) . 'px" style="vertical-align: middle" /><br /><br />';
		}

		echo '</select></p>';
	}

	/**
	 * Get badge URL.
	 *
	 * @param string $badge Badge type.
	 *
	 * @return string Badge URL.
	 */
	public function get_badge_url( $badge ) {
		return 'https://s0.wp.com/i/badges/freshly-pressed-' . $badge . '.png';
	}

	/**
	 * Get badge types.
	 *
	 * @return array[] Badge types.
	 */
	public function badges() {
		return array(
			'rectangle' => array(
				'width'  => 200,
				'height' => 62,
			),
			'circle'    => array(
				'width'  => 150,
				'height' => 150,
			),
		);
	}

	/**
	 * Get badge type size.
	 *
	 * @param string $badge Badge type.
	 *
	 * @return array{width: int, height: int}
	 */
	public function get_badge_size( $badge ) {
		$badges = $this->badges();

		return $badges[ $badge ];
	}
}

/**
 * Only activate the widget for users that already have an instance of it.
 */
function wpcom_freshly_pressed_widget_init() { // phpcs:ignore Universal.Files.SeparateFunctionsFromOO.Mixed
	if ( is_active_widget( false, false, 'freshly_pressed' ) ) {
		register_widget( 'WPCOM_Freshly_Pressed_Widget' );
	}
}
add_action( 'widgets_init', 'wpcom_freshly_pressed_widget_init' );
