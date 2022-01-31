<?php

// @todo Fix performance issues before shipping.
//add_action( 'widgets_init', 'follow_button_register_widget' );
function follow_button_register_widget() {
	if ( Jetpack::is_connection_ready() ) {
		register_widget( 'Jetpack_Follow_Button_Widget' );
	}
}

class Jetpack_Follow_Button_Widget extends WP_Widget {

	public function __construct() {
		parent::__construct(
			'follow_button_widget',
			/** This filter is documented in modules/widgets/facebook-likebox.php */
			apply_filters( 'jetpack_widget_name', __( 'Follow Button', 'jetpack' ) ),
			array(
				'description'                 => __( 'Add a WordPress.com follow button to allow people to follow your blog easier', 'jetpack' ),
				'customize_selective_refresh' => true,
			)
		);
	}

	public function widget( $args, $instance ) {
		$attributes = array();
		$instance   = wp_parse_args(
			(array) $instance, array(
				'show_name'  => 1,
				'show_count' => 0,
			)
		);

		$wpcom_locale = get_locale();

		if ( ! class_exists( 'GP_Locales' ) ) {
			if ( defined( 'JETPACK__GLOTPRESS_LOCALES_PATH' ) && file_exists( JETPACK__GLOTPRESS_LOCALES_PATH ) ) {
				require JETPACK__GLOTPRESS_LOCALES_PATH;
			}
		}

		if ( class_exists( 'GP_Locales' ) ) {
			$wpcom_locale_object = GP_Locales::by_field( 'wp_locale', $wpcom_locale );
			if ( $wpcom_locale_object instanceof GP_Locale ) {
				$wpcom_locale = $wpcom_locale_object->slug;
			}
		}

		if ( empty( $instance['show_name'] ) ) {
			$attributes[] = 'data-show-blog-name="false"';
		}

		if ( ! empty( $instance['show_count'] ) ) {
			$attributes[] = 'data-show-follower-count="true"';
		}

		echo $args['before_widget'];
		?>

		<a
			class="wordpress-follow-button"
			href="<?php echo esc_url( home_url() ); ?>"
			data-blog="<?php echo esc_url( home_url() ); ?>"
			data-lang="<?php echo esc_attr( $wpcom_locale ); ?>"
									<?php
									if ( ! empty( $attributes ) ) {
										echo implode( ' ', $attributes );}
?>
		>
			<?php sprintf( __( 'Follow %s on WordPress.com', 'jetpack' ), get_bloginfo( 'name' ) ); ?>
		</a>
		<script type="text/javascript">(function(d){var f = d.getElementsByTagName('SCRIPT')[0], p = d.createElement('SCRIPT');p.type = 'text/javascript';p.async = true;p.src = '//widgets.wp.com/platform.js';f.parentNode.insertBefore(p,f);}(document));</script>

		<?php
		echo $args['after_widget'];

		/** This action is documented in modules/widgets/gravatar-profile.php */
		do_action( 'jetpack_stats_extra', 'widget_view', 'follow_button' );
	}

	public function form( $instance ) {
		$instance = wp_parse_args(
			(array) $instance, array(
				'show_name'  => 1,
				'show_count' => 0,
			)
		);

		$show_name  = isset( $instance['show_name'] ) ? (bool) $instance['show_name'] : false;
		$show_count = isset( $instance['show_count'] ) ? (bool) $instance['show_count'] : false;
		?>

		<p>
		<input type="checkbox" class="checkbox" id="<?php echo $this->get_field_id( 'show_name' ); ?>" name="<?php echo $this->get_field_name( 'show_name' ); ?>"<?php checked( $show_name ); ?> />
		<label for="<?php echo $this->get_field_id( 'show_name' ); ?>"><?php esc_html_e( 'Show blog name', 'jetpack' ); ?></label>
		<br />
		<input type="checkbox" class="checkbox" id="<?php echo $this->get_field_id( 'show_count' ); ?>" name="<?php echo $this->get_field_name( 'show_count' ); ?>"<?php checked( $show_count ); ?> />
		<label for="<?php echo $this->get_field_id( 'show_count' ); ?>"><?php esc_html_e( 'Show follower count', 'jetpack' ); ?></label>
		</p>

		<?php
	}

	public function update( $new_instance, $old_instance ) {
		$old_instance['show_name']  = ! empty( $new_instance['show_name'] ) ? 1 : 0;
		$old_instance['show_count'] = ! empty( $new_instance['show_count'] ) ? 1 : 0;
		return $old_instance;
	}
}
