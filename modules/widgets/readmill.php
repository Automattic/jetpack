<?php
class Jetpack_Readmill_Widget extends WP_Widget {
	var $default_title, $default_size;

	/**
	 * Registers the widget with WordPress.
	 */
	function __construct() {
		parent::__construct(
			'jetpack_readmill_widget', // Base ID
			apply_filters( 'jetpack_widget_name', esc_html__( 'Retired: Send To Readmill', 'jetpack' ) ),
			array(
				'description' => esc_html__( 'Readmill has closed its doors. http://readmill.com/', 'jetpack' ),
			)
		);
	}

	/**
	 * Back-end widget form.
	 *
	 * @see WP_Widget::form()
	 *
	 * @param array $instance Previously saved values from database.
	 */
	function form( $instance ) {
		?>
		<p><?php printf( __( "<strong>The Readmill reading service has shut down</strong><br /> <a target=\"_blank\" href=\"%s\">Learn More</a>", 'jetpack' ), 'http://readmill.com' ); ?>. </p>
		<p style="color:#A00; ">
			<?php if ( ! defined( 'IS_WPCOM' ) || false == IS_WPCOM ) : ?>
				<p><?php esc_html_e( 'The Send to Readmill widget is no longer working and will be removed completely from Jetpack.', 'jetpack' ); ?></p>
			<?php else : ?>
				<p><?php esc_html_e( 'The Send to Readmill widget is no longer working and will be removed completely.', 'jetpack' );  ?></p>
			<?php endif; ?>
			<em><?php esc_html_e( 'You can remove it yourself now.', 'jetpack' ); ?></em>
			<?php esc_html_e( 'No content is displayed to users who can\'t manage widgets' , 'jetpack' ); ?>
		</p><?php
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
	function update( $new_instance, $old_instance ) {
		$instance = array(); // there is nothing to save
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
	function widget( $args, $instance ) {
		if( current_user_can( 'edit_theme_options' ) ) { ?>

			<div style="border:1px solid #A00; padding:10px; margin:10px 0;color:#A00; background:#FFF; ">
				<p><?php printf( __( "Notice to Administrators:<br /> <strong>The Readmill reading service has shut down</strong> <a target=\"_blank\" href=\"%s\">learn more</a>.", 'jetpack' ), 'http://readmill.com/' );  ?></p>
				<?php if ( ! defined( 'IS_WPCOM' ) || false == IS_WPCOM ) : ?>
					<p><?php esc_html_e( 'The Send to Readmill widget is no longer working and will be removed completely from Jetpack.', 'jetpack' ); ?></p>
				<?php else : ?>
					<p><?php esc_html_e( 'The Send to Readmill widget is no longer working and will be removed completely.', 'jetpack' ); ?></p>
				<?php endif; ?>
				<p><?php printf( __( "You can visit <a href=\"%s\" title=\"Appearance > Widgets\">Appearance > Widgets </a> to remove it from this sidebar.", 'jetpack' ) , esc_url( admin_url( 'widgets.php' ) ) ) ; ?></p>
				<p><?php esc_html_e( 'This notice is only visible to logged in users that can manage widgets', 'jetpack' ); ?>.</p>
			</div>
		<?php
		}
	}
}

function jetpack_readmill_widget_init() {
	register_widget( 'Jetpack_Readmill_Widget' );
}

add_action( 'widgets_init', 'jetpack_readmill_widget_init' );
