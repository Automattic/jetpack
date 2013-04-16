<?php
class Jetpack_Readmill_Widget extends WP_Widget {
	var $default_title, $default_size;

	/**
	 * Registers the widget with WordPress.
	 */
	function __construct() {
		parent::__construct(
	 		'jetpack_readmill_widget', // Base ID
	 		apply_filters( 'jetpack_widget_name', esc_html__( 'Send To Readmill', 'jetpack' ) ),
			array(
				'description' => esc_html__( 'Readmill is the best book reader for phones and tablets. With this widget you can enable users to send a book to their device with one click.', 'jetpack' ),
			)
		);

		if ( is_active_widget( false, false, $this->id_base ) || is_active_widget( false, false, 'monster' ) ) {
			add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_script' ) );
		}

		$this->default_title = __( 'Send To Readmill', 'jetpack' );
		$this->default_size  = 'large';
	}

	function enqueue_script() {
		wp_enqueue_script( 'readmill', 'https://platform.readmill.com/send.js', array(), '20130220', false );
	}

	/**
	 * Back-end widget form.
	 *
	 * @see WP_Widget::form()
	 *
	 * @param array $instance Previously saved values from database.
	 */
 	function form( $instance ) {
		$title = isset( $instance['title' ] ) ? $instance['title'] : false;
		if ( false === $title ) {
			$title = $this->default_title;
		}

		$epub_link = isset( $instance['epub_link'] ) ? $instance['epub_link'] : '';
		$buy_link  = isset( $instance['buy_link'] )  ? $instance['buy_link']  : '';
		$size      = isset( $instance['size'] )      ? $instance['size']      : $this->default_size;
		?>

		<p><?php printf( __( "Just enter the URL to your book, make sure it's a PDF or EPUB file, and you are ready to go. For more help, head to <a href='%s'>the Readmill WordPress Widget support page</a>.", 'jetpack' ), 'http://en.support.wordpress.com/widgets/readmill/' ); ?></p>

		<p>
			<label for="<?php echo $this->get_field_id( 'title' ); ?>"><?php esc_html_e( 'Title:', 'jetpack' ); ?></label>
			<input class="widefat" id="<?php echo $this->get_field_id( 'title' ); ?>" name="<?php echo $this->get_field_name( 'title' ); ?>" type="text" value="<?php echo esc_attr( $title ); ?>" />
		</p>

		<p>
			<label for="<?php echo $this->get_field_id( 'epub_link' ); ?>"><?php esc_html_e( 'Download URL:', 'jetpack' ); ?></label>
			<input class="widefat" id="<?php echo $this->get_field_id( 'epub_link' ); ?>" name="<?php echo $this->get_field_name( 'epub_link' ); ?>" type="text" value="<?php echo esc_attr( $epub_link ); ?>" />
		</p>

		<p>
			<label for="<?php echo $this->get_field_id( 'buy_link' ); ?>"><?php esc_html_e( 'Item URL:', 'jetpack' ); ?></label>
			<input class="widefat" id="<?php echo $this->get_field_id( 'buy_link' ); ?>" name="<?php echo $this->get_field_name( 'buy_link' ); ?>" type="text" value="<?php echo esc_attr( $buy_link ); ?>" />
		</p>

		<p>
			<label><?php esc_html_e( 'What size icon?', 'jetpack' ); ?></label>
			<ul>
				<li><label><input id="<?php echo $this->get_field_id( 'size' ); ?>-few"  name="<?php echo $this->get_field_name( 'size' ); ?>" type="radio" value="large" <?php checked( 'large', $size ); ?> /> <?php esc_html_e( 'Large', 'jetpack' ); ?></label></li>
				<li><label><input id="<?php echo $this->get_field_id( 'size' ); ?>-lots" name="<?php echo $this->get_field_name( 'size' ); ?>" type="radio" value="small" <?php checked( 'small', $size ); ?> /> <?php esc_html_e( 'Small', 'jetpack' ); ?></label></li>
			</ul>
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
	 * @return array Updated safe values to be saved.
	 */
	function update( $new_instance, $old_instance ) {
		$instance = array();
		$instance['title']     = wp_kses( $new_instance['title'],     array() );
		$instance['epub_link'] = wp_kses( $new_instance['epub_link'], array() );
		$instance['buy_link']  = wp_kses( $new_instance['buy_link'],  array() );
		$instance['size']      = wp_kses( $new_instance['size'],      array() );

		if ( $this->default_title === $instance['title'] ) {
			$instance['title'] = false; // Store as false in case of language change
		}

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
		$title = isset( $instance['title' ] ) ? $instance['title'] : false;

		if ( false === $title )
			$title = $this->default_title;

		$title = apply_filters( 'widget_title', $title );

		echo $args['before_widget'];

		if ( ! empty( $title ) )
			echo $args['before_title'] . $title . $args['after_title'];

		$epub_link = isset( $instance['epub_link'] ) ? $instance['epub_link'] : '';
		$buy_link  = isset( $instance['buy_link'] )  ? $instance['buy_link']  : '';
		$size      = isset( $instance['size'] )      ? $instance['size']      : $this->default_size;

		if ( empty( $epub_link ) && current_user_can( 'edit_theme_options' ) ) :
			?><p><?php esc_html_e( 'Your ePub link is empty. Provide an ePub link to display the Send to Readmill widget.', 'jetpack' ); ?></p><?php
		else :
			?><a class="send-to-readmill" href="https://readmill.com" data-download-url="<?php echo esc_attr( $epub_link ); ?>" data-buy-url="<?php echo esc_attr( $epub_link ); ?>" data-display="<?php echo esc_attr( $size ); ?>">Send to Readmill</a><?php
		endif;

		echo $args['after_widget'];
	}
}

function jetpack_readmill_widget_init() {
	register_widget( 'Jetpack_Readmill_Widget' );
}

add_action( 'widgets_init', 'jetpack_readmill_widget_init' );
