<?php
/*
Plugin Name: Simple Payments
Description: Simple Payments button implemented as a widget.
Version: 1.0
Author: Automattic Inc.
Author URI: http://automattic.com/
License: GPLv2 or later
*/

function jetpack_register_widget_simple_payments() {
	register_widget( 'Simple_Payments_Widget' );
}
add_action( 'widgets_init', 'jetpack_register_widget_simple_payments' );

class Simple_Payments_Widget extends WP_Widget {
	private static $dir       = null;
	private static $url       = null;
	private static $labels    = null;
	private static $defaults  = null;
	private static $config_js = null;

	function __construct() {
		$widget = array(
			'classname'   => 'simple-payments',
			'description' => __( 'Add a simple payment button.', 'jetpack' ),
		);

		parent::__construct(
			'Simple_Payments_Widget',
			/** This filter is documented in modules/widgets/facebook-likebox.php */
			apply_filters( 'jetpack_widget_name', __( 'Simple Payments', 'jetpack' ) ),
			$widget
		);

		self::$dir = trailingslashit( dirname( __FILE__ ) );
		self::$url = plugin_dir_url( __FILE__ );
		// add form labels for translation
		/*
		self::$labels = array(
			'year'    => __( 'year', 'jetpack' ),
		);
		*/

		// add_action( 'wp_enqueue_scripts', array( __class__, 'enqueue_template' ) );
		// add_action( 'admin_enqueue_scripts', array( __class__, 'enqueue_admin' ) );
	}

	public static function enqueue_admin( $hook_suffix ) {
		if ( 'widgets.php' == $hook_suffix ) {
			// wp_enqueue_style( 'milestone-admin', self::$url . 'style-admin.css', array(), '20161215' );
		}
	}

	public static function enqueue_template() {
		// wp_enqueue_script( 'milestone', self::$url . 'milestone.js', array( 'jquery' ), '20160520', true );
	}

    /**
     * Widget
     */
    function widget( $args, $instance ) {
		$instance = $this->sanitize_instance( $instance );


		echo $args['before_widget'];

		$title = apply_filters( 'widget_title', $instance['title'] );
		if ( ! empty( $title ) ) {
			echo $args['before_title'] . $title . $args['after_title'];
		}

		echo '<div class="simple-payments-content">';

		// display the product on the front end here
		echo 'Hello World!';

		echo '</div><!--simple-payments-->';

		echo $args['after_widget'];

	    /** This action is documented in modules/widgets/gravatar-profile.php */
	    do_action( 'jetpack_stats_extra', 'widget_view', 'simple-payments' );
    }

    /**
     * Update
     */
    function update( $new_instance, $old_instance ) {

    }

    /**
     * Form
     */
    function form( $instance ) {
		// $instance = $this->sanitize_instance( $instance );
        ?>

	<div class="simple-payments">
		<p>Clone the simple payment button UI from Calypso here.</p>
        <!--p>
        	<label for="<?php echo $this->get_field_id( 'title' ); ?>"><?php _e( 'Title', 'jetpack' ); ?></label>
        	<input class="widefat" id="<?php echo $this->get_field_id( 'title' ); ?>" name="<?php echo $this->get_field_name( 'title' ); ?>" type="text" value="<?php echo esc_attr( $instance['title'] ); ?>" />
        </p>

        <p>
        	<label for="<?php echo $this->get_field_id( 'event' ); ?>"><?php _e( 'Description', 'jetpack' ); ?></label>
        	<input class="widefat" id="<?php echo $this->get_field_id( 'event' ); ?>" name="<?php echo $this->get_field_name( 'description' ); ?>" type="text" value="<?php echo esc_attr( $instance['event'] ); ?>" />
        </p>

		<p>
			<label for="<?php echo $this->get_field_id( 'message' ); ?>"><?php _e( 'Message', 'jetpack' ); ?></label>
			<textarea id="<?php echo $this->get_field_id( 'message' ); ?>" name="<?php echo $this->get_field_name( 'message' ); ?>" class="widefat" rows="3"><?php echo esc_textarea( $instance['message'] ); ?></textarea>
		</p-->
	</div>

		<?php
    }
}
