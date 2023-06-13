<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

// phpcs:disable Universal.Files.SeparateFunctionsFromOO.Mixed -- TODO: Move classes to appropriately-named class files.

// @todo Fix performance issues before shipping.
// add_action( 'widgets_init', 'follow_button_register_widget' );
/**
 * Register the Follow Button widget.
 */
function follow_button_register_widget() {
	if ( Jetpack::is_connection_ready() ) {
		register_widget( 'Jetpack_Follow_Button_Widget' );
	}
}

/**
 * Jetpack_Follow_Button_Widget main class.
 */
class Jetpack_Follow_Button_Widget extends WP_Widget {

	/**
	 * Jetpack_Follow_Button_Widget constructor.
	 */
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

	/**
	 * Front-end display of widget.
	 *
	 * @see WP_Widget::widget() for more information on widget parameters.
	 *
	 * @param array $args     Widget arguments.
	 * @param array $instance Saved values from database.
	 */
	public function widget( $args, $instance ) {
		$attributes = array();
		$instance   = wp_parse_args(
			(array) $instance,
			array(
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

		$localized = array(
			'titles' => array(
				'timelines'    => __( 'Embeddable Timelines', 'jetpack' ),
				'followButton' => __( 'Follow Button', 'jetpack' ),
				'wpEmbeds'     => __( 'WordPress Embeds', 'jetpack' ),
			),
		);

		echo $args['before_widget']; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		?>

		<a
			class="wordpress-follow-button"
			href="<?php echo esc_url( home_url() ); ?>"
			data-blog="<?php echo esc_url( home_url() ); ?>"
			data-lang="<?php echo esc_attr( $wpcom_locale ); ?>"
									<?php
									if ( ! empty( $attributes ) ) {
										echo implode( ' ', $attributes ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
									}
									?>
		>
			<?php
			/* Translators: %s is the site name. */
			sprintf( __( 'Follow %s on WordPress.com', 'jetpack' ), get_bloginfo( 'name' ) );
			?>
		</a>
		<script type="text/javascript">(function(d){window.wpcomPlatform = <?php echo wp_json_encode( $localized, JSON_HEX_TAG | JSON_HEX_AMP ); ?>;var f = d.getElementsByTagName('SCRIPT')[0], p = d.createElement('SCRIPT');p.type = 'text/javascript';p.async = true;p.src = '//widgets.wp.com/platform.js';f.parentNode.insertBefore(p,f);}(document));</script>

		<?php
		echo $args['after_widget']; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped

		/** This action is documented in modules/widgets/gravatar-profile.php */
		do_action( 'jetpack_stats_extra', 'widget_view', 'follow_button' );
	}

	/**
	 * Back-end widget form.
	 *
	 * @see WP_Widget::form() for more information on parameters.
	 *
	 * @param array $instance Previously saved values from database.
	 */
	public function form( $instance ) {
		$instance = wp_parse_args(
			(array) $instance,
			array(
				'show_name'  => 1,
				'show_count' => 0,
			)
		);

		$show_name  = isset( $instance['show_name'] ) ? (bool) $instance['show_name'] : false;
		$show_count = isset( $instance['show_count'] ) ? (bool) $instance['show_count'] : false;
		?>

		<p>
		<input type="checkbox" class="checkbox" id="<?php echo esc_attr( $this->get_field_id( 'show_name' ) ); ?>" name="<?php echo esc_attr( $this->get_field_name( 'show_name' ) ); ?>"<?php checked( $show_name ); ?> />
		<label for="<?php echo esc_attr( $this->get_field_id( 'show_name' ) ); ?>"><?php esc_html_e( 'Show blog name', 'jetpack' ); ?></label>
		<br />
		<input type="checkbox" class="checkbox" id="<?php echo esc_attr( $this->get_field_id( 'show_count' ) ); ?>" name="<?php echo esc_attr( $this->get_field_name( 'show_count' ) ); ?>"<?php checked( $show_count ); ?> />
		<label for="<?php echo esc_attr( $this->get_field_id( 'show_count' ) ); ?>"><?php esc_html_e( 'Show follower count', 'jetpack' ); ?></label>
		</p>

		<?php
	}

	/**
	 * Update widget.
	 *
	 * @see WP_Widget::update()
	 *
	 * @param array $new_instance New widget instance data.
	 * @param array $old_instance Old widget instance data.
	 */
	public function update( $new_instance, $old_instance ) {
		$old_instance['show_name']  = ! empty( $new_instance['show_name'] ) ? 1 : 0;
		$old_instance['show_count'] = ! empty( $new_instance['show_count'] ) ? 1 : 0;
		return $old_instance;
	}
}
