<?php
/**
 * Plugin Name: Google Translate Widget for WordPress.com
 * Plugin URI: http://automattic.com
 * Description: Add a widget for automatic translation
 * Author: Artur Piszek
 * Version: 0.1
 * Author URI: http://automattic.com
 * Text Domain: jetpack
 */
class Google_Translate_Widget extends WP_Widget {
	static $instance = null;

	/**
	 * Register widget with WordPress.
	 */
	function __construct() {
		parent::__construct(
			'google_translate_widget',
			/** This filter is documented in modules/widgets/facebook-likebox.php */
			apply_filters( 'jetpack_widget_name', __( 'Google Translate', 'jetpack' ) ),
			array( 'description' => __( 'Automatic translation of your site content', 'jetpack' ) )
		);
		wp_register_script( 'google-translate-init', plugins_url( 'google-translate/google-translate.js', __FILE__ ) );
		wp_register_script( 'google-translate', '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit', [ 'google-translate-init' ] );
	}

	/**
	 * Display the Widget.
	 *
	 * @see WP_Widget::widget()
	 *
	 * @param array $args     Display arguments.
	 * @param array $instance The settings for the particular instance of the widget.
	 */
	public function widget( $args, $instance ) {
		// We never should show more than 1 instance of this.
		if ( null === self::$instance ) {
			/** This filter is documented in core/src/wp-includes/default-widgets.php */
			$title = apply_filters( 'widget_title', $instance['title'] );
			echo $args['before_widget'];
			if ( ! empty( $title ) ) {
				echo $args['before_title'] . esc_html( $title ) . $args['after_title'];
			}
			wp_localize_script( 'google-translate-init', '_wp_google_translate_widget', array( lang => get_locale() ) );
			wp_enqueue_script( 'google-translate-init' );
			wp_enqueue_script( 'google-translate' );
			echo '<div id="google_translate_element"></div>';
			echo $args['after_widget'];
			self::$instance = $instance;
			// Admin bar is also displayed on top of the site which causes google translate bar to hide beneath.
			// This is a hack to show google translate bar a bit lower.
			if ( is_admin_bar_showing() ) {
				echo '<style>.goog-te-banner-frame { top:32px !important } </style>';
			}
		}
	}

	/**
	 * Widget form in the dashboard.
	 *
	 * @see WP_Widget::form()
	 *
	 * @param array $instance Previously saved values from database.
	 */
	public function form( $instance ) {
		if ( isset( $instance['title'] ) ) {
			$title = $instance['title'];
		} else {
			$title = '';
		}
		?>
<p>
	<label for="<?php echo $this->get_field_id( 'title' ); ?>"><?php esc_html_e( 'Title:', 'jetpack' ); ?></label>
	<input class="widefat" id="<?php echo $this->get_field_id( 'title' ); ?>" name="<?php echo $this->get_field_name( 'title' ); ?>" type="text" value="<?php echo esc_attr( $title ); ?>" />
</p>
		<?php
	}

	/**
	 * Sanitize widget form values as they are saved.
	 *
	 * @see WP_Widget::update()
	 *
	 * @param array $new_instance Values just sent to be saved.
	 * @param array $old_instance Previously saved values from database.
	 *
	 * @return array $instance Updated safe values to be saved.
	 */
	public function update( $new_instance, $old_instance ) {
		$instance = array();
		$instance['title'] = ( ! empty( $new_instance['title'] ) ) ? strip_tags( $new_instance['title'] ) : '';
		return $instance;
	}

}

/**
 * Register the widget for use in Appearance -> Widgets.
 */
function jetpack_google_translate_widget_init() {
	register_widget( 'Google_Translate_Widget' );
}
add_action( 'widgets_init', 'jetpack_google_translate_widget_init' );
