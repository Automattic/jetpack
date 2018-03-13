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
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Jetpack_Google_Translate_Widget extends WP_Widget {
	static $instance = null;

	/**
	 * Default widget title.
	 *
	 * @var string $default_title
	 */
	var $default_title;

	/**
	 * Register widget with WordPress.
	 */
	function __construct() {
		parent::__construct(
			'google_translate_widget',
			/** This filter is documented in modules/widgets/facebook-likebox.php */
			apply_filters( 'jetpack_widget_name', __( 'Google Translate', 'jetpack' ) ),
			array(
				'description' => __( 'Provide your readers with the option to translate your site into their preferred language.', 'jetpack' ),
				'customize_selective_refresh' => true
			)
		);
		add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_scripts' ) );

		$this->default_title = esc_html__( 'Translate', 'jetpack' );
	}

	/**
	 * Enqueue frontend JS scripts.
	 */
	public function enqueue_scripts() {
		wp_register_script(
			'google-translate-init',
			Jetpack::get_file_url_for_environment(
				'_inc/build/widgets/google-translate/google-translate.min.js',
				'modules/widgets/google-translate/google-translate.js'
			)
		);
		wp_register_script( 'google-translate', '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit', array( 'google-translate-init' ) );
		// Admin bar is also displayed on top of the site which causes google translate bar to hide beneath.
		// This is a hack to show google translate bar a bit lower.
		wp_add_inline_style( 'admin-bar', '.goog-te-banner-frame { top:32px !important }' );
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
			$instance = wp_parse_args( $instance, array(
				'title' => $this->default_title,
			) );

			/**
			 * Filter the layout of the Google Translate Widget.
			 *
			 * 3 different integers are accepted.
			 * 	0 for the vertical layout.
			 * 	1 for the horizontal layout.
			 * 	2 for the dropdown only.
			 *
			 * @see https://translate.google.com/manager/website/
			 *
			 * @module widgets
			 *
			 * @since 5.5.0
			 *
			 * @param string $layout layout of the Google Translate Widget.
			 */
			$button_layout = apply_filters( 'jetpack_google_translate_widget_layout', 0 );

			if (
				! is_int( $button_layout )
				|| 0 > $button_layout
				|| 2 < $button_layout
			) {
				$button_layout = 0;
			}

			wp_localize_script(
				'google-translate-init',
				'_wp_google_translate_widget',
				array(
					'lang'   => get_locale(),
					'layout' => intval( $button_layout ),
				)
			);
			wp_enqueue_script( 'google-translate-init' );
			wp_enqueue_script( 'google-translate' );

			$title = $instance['title'];

			if ( ! isset( $title ) ) {
				$title = $this->default_title;
			}

			/** This filter is documented in wp-includes/widgets/class-wp-widget-pages.php */
			$title = apply_filters( 'widget_title', $title );

			echo $args['before_widget'];
			if ( ! empty( $title ) ) {
				echo $args['before_title'] . esc_html( $title ) . $args['after_title'];
			}
			echo '<div id="google_translate_element"></div>';
			echo $args['after_widget'];
			self::$instance = $instance;
			/** This action is documented in modules/widgets/gravatar-profile.php */
			do_action( 'jetpack_stats_extra', 'widget_view', 'google-translate' );
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
		$title = isset( $instance['title'] ) ? $instance['title'] : false;
		if ( false === $title ) {
			$title = $this->default_title;
		}
		?>
<p>
	<label for="<?php echo esc_attr( $this->get_field_id( 'title' ) ); ?>"><?php esc_html_e( 'Title:', 'jetpack' ); ?></label>
	<input class="widefat" id="<?php echo esc_attr( $this->get_field_id( 'title' ) ); ?>" name="<?php echo esc_attr( $this->get_field_name( 'title' ) ); ?>" type="text" value="<?php echo esc_attr( $title ); ?>" />
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
		$instance['title'] = wp_kses( $new_instance['title'], array() );
		if ( $instance['title'] === $this->default_title ) {
			$instance['title'] = false; // Store as false in case of language change
		}
		return $instance;
	}

}

/**
 * Register the widget for use in Appearance -> Widgets.
 */
function jetpack_google_translate_widget_init() {
	register_widget( 'Jetpack_Google_Translate_Widget' );
}
add_action( 'widgets_init', 'jetpack_google_translate_widget_init' );
