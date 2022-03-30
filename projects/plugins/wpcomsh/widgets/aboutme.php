<?php
/**
 * [DEPRECATION]: This widget was deprecated on 2016-07-01.
 * This code has been copied from https://wpcom.trac.automattic.com/browser/trunk/wp-content/mu-plugins/widgets/aboutme.php
 * and significant parts of it that are deprecated were removed in the process.
 */

/**
 * Adds Aboutme_Widget widget.
 */
class Aboutme_Widget extends WP_Widget {
	/**
	 * Register widget with WordPress.
	 */
	public function __construct() {
		$widget_ops = array(
			'classname'   => 'aboutme_widget',
			'description' => __( 'Display your about.me profile with thumbnail', 'wpcomsh' ),
		);
		parent::__construct( 'aboutme_widget', __( 'About.me Widget', 'wpcomsh' ), $widget_ops );
	}

	/**
	 * Front-end display of widget.
	 *
	 * @param array $args Widget arguments.
	 * @param array $instance Saved values from database.
	 */
	public function widget( $args, $instance ) {
		// [DEPRECATION]: Since we are after the dep. date show admins
		// the warning message, otherwise just display a link to their
		// about.me page
		if ( current_user_can( 'edit_theme_options' ) ) {
			?>
			<h2>
				<?php
				printf(
					wp_kses(
						__(
							'The about.me widget is no longer available. To remove this widget, ' .
							'<a href="%s">visit your settings</a>. This message is not shown to visitors to your site.',
							'wpcomsh'
						),
						array( 'a' => array( 'href' => array() ) )
					),
					admin_url( 'widgets.php' )
				);
				?>
			</h2>
			<?php
		}
		if ( ! empty( $data['profile_url'] ) ) {
			?>
			<h2>
				<a href="<?php echo esc_url( $data['profile_url'] ); ?>" target="_blank" rel="me">
					<?php echo esc_html( $data['profile_url'] ); ?>
				</a>
			</h2>
			<?php
		}
	}

	/**
	 * Back-end widget form.
	 *
	 * @param array $instance Previously saved values from database.
	 */
	public function form( $instance ) {
		$instance  = wp_parse_args(
			(array) $instance,
			array(
				'title'     => 'about.me',
				'fontsize'  => 'large',
				'photo'     => 'background',
				'client_id' => '',
				'error'     => 0,
				'debug_url' => '',
				'src_url'   => str_ireplace(
					array(
						'https://',
						'http://',
					),
					'',
					get_site_url()
				),
				'username'  => '',
				'headline'  => '1',
				'biography' => 1,
				'apps'      => 1,
				'links'     => 1,
			)
		);
		$title     = $instance['title'];
		$fontsize  = $instance['fontsize'];
		$photo     = 'no-photo' === $instance['photo'] ? 'no-photo' : 'background';
		$username  = array_key_exists( 'username', $instance ) ? $instance['username'] : '';
		$headline  = array_key_exists( 'headline', $instance ) ? $instance['headline'] : '1';
		$biography = array_key_exists( 'biography', $instance ) ? $instance['biography'] : '1';
		$apps      = array_key_exists( 'apps', $instance ) ? $instance['apps'] : '1';

		?>
		<p>
			<strong style="color: #ff6347;">
				<?php
				_e(
					'The about.me widget will no longer be available after July 1, 2016. ' .
						  'After this date, the widget will display a simple text link to your about.me profile. ' .
						  'Please remove this widget.',
					'wpcomsh'
				);
				?>
			</strong>
		</p>
		<p>
			<label for="<?php echo $this->get_field_id( 'title' ); ?>"><?php _e( 'Widget title', 'wpcomsh' ); ?>
				:</label>
			<input id="<?php echo $this->get_field_id( 'title' ); ?>"
				   name="<?php echo $this->get_field_name( 'title' ); ?>" type="text"
				   value="<?php echo esc_attr( $title ); ?>"/>
		</p>
		<p>
			<label for="<?php echo $this->get_field_id( 'username' ); ?>"><?php _e( 'Your about.me URL', 'wpcomsh' ); ?>
				:</label>
			<input id="<?php echo $this->get_field_id( 'username' ); ?>"
				   name="<?php echo $this->get_field_name( 'username' ); ?>" value="<?php echo esc_url( $username ); ?>"
				   style="width: 100%;" type="text"/>
		</p>
		<p>
			<label for="<?php echo $this->get_field_id( 'fontsize' ); ?>"><?php _e( 'Name', 'wpcomsh' ); ?>:</label>
			<select id="<?php echo $this->get_field_id( 'fontsize' ); ?>"
					name="<?php echo $this->get_field_name( 'fontsize' ); ?>">
				<option
					value='x-large' <?php selected( $fontsize, 'x-large' ); ?>><?php _e( 'Display X-Large', 'wpcomsh' ); ?></option>
				<option
					value='large' <?php selected( $fontsize, 'large' ); ?>><?php _e( 'Display Large', 'wpcomsh' ); ?></option>
				<option
					value='medium' <?php selected( $fontsize, 'medium' ); ?>><?php _e( 'Display Medium', 'wpcomsh' ); ?></option>
				<option
					value='small' <?php selected( $fontsize, 'small' ); ?>><?php _e( 'Display Small', 'wpcomsh' ); ?></option>
				<option
					value='no-name' <?php selected( $fontsize, 'no-name' ); ?>><?php _e( "Don't Display Name", 'wpcomsh' ); ?></option>
			</select>
		</p>
		<p>
			<label for="<?php echo $this->get_field_id( 'photo' ); ?>"><?php _e( 'Photo', 'wpcomsh' ); ?>:
				<input type="checkbox" id="<?php echo $this->get_field_id( 'photo' ); ?>"
					   name="<?php echo $this->get_field_name( 'photo' ); ?>"
					   value="background" <?php checked( $photo, 'background' ); ?> />
			</label>
		</p>
		<p>
			<label for="<?php echo $this->get_field_id( 'headline' ); ?>"><?php _e( 'Headline', 'wpcomsh' ); ?>:
				<input type="checkbox" id="<?php echo $this->get_field_id( 'headline' ); ?>"
					   name="<?php echo $this->get_field_name( 'headline' ); ?>"
					   value="1" <?php checked( $headline, '1' ); ?> />
			</label>
		</p>
		<p>
			<label for="<?php echo $this->get_field_id( 'biography' ); ?>"><?php _e( 'Biography', 'wpcomsh' ); ?>:
				<input type="checkbox" id="<?php echo $this->get_field_id( 'biography' ); ?>"
					   name="<?php echo $this->get_field_name( 'biography' ); ?>"
					   value="1" <?php checked( $biography, '1' ); ?> />
			</label>
		</p>
		<p>
			<label for="<?php echo $this->get_field_id( 'apps' ); ?>"><?php _e( 'Apps', 'wpcomsh' ); ?>:
				<input type="checkbox" id="<?php echo $this->get_field_id( 'apps' ); ?>"
					   name="<?php echo $this->get_field_name( 'apps' ); ?>"
					   value="1" <?php checked( $apps, '1' ); ?> />
			</label>
		</p>
		<p>
			<input type="hidden" id="<?php echo $this->get_field_id( 'client_id' ); ?>"
				   name="<?php echo $this->get_field_name( 'client_id' ); ?>"
				   value="<?php echo esc_attr( $instance['client_id'] ); ?>">
			<input type="hidden" id="<?php echo $this->get_field_id( 'error' ); ?>"
				   name="<?php echo $this->get_field_name( 'error' ); ?>"
				   value="<?php echo esc_attr( $instance['error'] ); ?>">
			<input type="hidden" id="<?php echo $this->get_field_id( 'src_url' ); ?>"
				   name="<?php echo $this->get_field_name( 'src_url' ); ?>"
				   value="<?php echo esc_attr( $instance['src_url'] ); ?>">
		</p>
		<?php
	}
}

// register Aboutme_Widget widget
function aboutme_widget_init() {
	// [DEPRECATION]: Only register widget if active widget exists already
	$has_widget = is_active_widget( false, false, 'aboutme_widget', false );
	if ( false === $has_widget ) {
		return;
	}

	register_widget( 'Aboutme_Widget' );
}

add_action( 'widgets_init', 'aboutme_widget_init' );
