<?php
/*
Plugin Name: Google Translate Widget for WordPress.com
Plugin URI: http://automattic.com
Description: Add a widget for automatic translation
Author: Artur Piszek
Version: 0.1
Author URI: http://automattic.com
Text Domain: jetpack
*/

class Google_Translate_Widget extends WP_Widget {
	static $instance = null;

	function __construct() {
		parent::__construct(
			'google_translate_widget',
			apply_filters( 'jetpack_widget_name', __( 'Google Translate', 'jetpack' ) ),
			array( 'description' => __( 'Automatic translation of your site content', 'jetpack' ), ) 
		);
		wp_register_script( 'google-translate-init', plugins_url( 'google-translate/google-translate.js', __FILE__ ) );
		wp_register_script( 'google-translate', '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit', [ 'google-translate-init' ] );
	}

	public function widget( $args, $instance ) {
		// We never should show more than 1 instance of this
		if ( self::$instance === null ) {
			$title = apply_filters( 'widget_title', $instance['title'] );
			echo $args['before_widget'];
			if ( ! empty( $title ) ) {
				echo $args['before_title'] . $title . $args['after_title'];			
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
			
	public function form( $instance ) {
		if ( isset( $instance[ 'title' ] ) ) {
			$title = $instance[ 'title' ];
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
		
	// Updating widget replacing old instances with new
	public function update( $new_instance, $old_instance ) {
		$instance = array();
		$instance['title'] = ( ! empty( $new_instance['title'] ) ) ? strip_tags( $new_instance['title'] ) : '';
		return $instance;
	}
}

function load_Google_Translate_Widget() {
	register_widget( 'Google_Translate_Widget' );
}
add_action( 'widgets_init', 'load_Google_translate_widget' );

