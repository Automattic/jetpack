<?php

use Automattic\Jetpack\Assets;

if ( ! class_exists( 'Jetpack_MailChimp_Subscriber_Popup_Widget' ) ) {

	if ( ! class_exists( 'MailChimp_Subscriber_Popup' ) ) {
		include_once JETPACK__PLUGIN_DIR . 'modules/shortcodes/mailchimp.php';
	}

	//register MailChimp Subscriber Popup widget
	function jetpack_mailchimp_subscriber_popup_widget_init() {
		register_widget( 'Jetpack_MailChimp_Subscriber_Popup_Widget' );
	}

	add_action( 'widgets_init', 'jetpack_mailchimp_subscriber_popup_widget_init' );

	/**
	 * Add a MailChimp subscription form.
	 */
	class Jetpack_MailChimp_Subscriber_Popup_Widget extends WP_Widget {

		/**
		 * Array contaning the section and fields of the widget form.
		 *
		 * @var array
		 */
		protected $form_sections;

		/**
		 * Constructor
		 */
		function __construct() {
			parent::__construct(
				'widget_mailchimp_subscriber_popup',
				/** This filter is documented in modules/widgets/facebook-likebox.php */
				apply_filters( 'jetpack_widget_name', __( 'MailChimp Subscriber Popup', 'jetpack' ) ),
				array(
					'classname'                   => 'widget_mailchimp_subscriber_popup',
					'description'                 => __( 'Allows displaying a popup subscription form to visitors.', 'jetpack' ),
					'customize_selective_refresh' => true,
				)
			);

			$this->form_sections = array(
				array(
					'title'  => esc_html__( 'Text Elements', 'jetpack' ),
					'fields' => array(
						array(
							'title'       => esc_html__( 'Email Placeholder', 'jetpack' ),
							'id'          => 'jetpack_mailchimp_email',
							'placeholder' => esc_html__( 'Enter your email', 'jetpack' ),
							'type'        => 'text',
						),
					),
				),

				array(
					'title'  => esc_html__( 'Notifications', 'jetpack' ),
					'fields' => array(
						array(
							'title'       => esc_html__( 'Processing', 'jetpack' ),
							'id'          => 'jetpack_mailchimp_processing_text',
							'placeholder' => esc_html__( 'Processing', 'jetpack' ),
							'type'        => 'text',
						),

						array(
							'title'       => esc_html__( 'Success text', 'jetpack' ),
							'id'          => 'jetpack_mailchimp_success_text',
							'placeholder' => esc_html__( 'Success! You\'re on the list.', 'jetpack' ),
							'type'        => 'text',
						),

						array(
							'title'       => esc_html__( 'Error text', 'jetpack' ),
							'id'          => 'jetpack_mailchimp_error_text',
							'placeholder' => esc_html__( 'Whoops! There was an error and we couldn\'t process your subscription. Please reload the page and try again.', 'jetpack' ),
							'type'        => 'text',
						),
					),
				),

				array(
					'title'  => esc_html__( 'Mailchimp Groups', 'jetpack' ),
					'fields' => array(
						array(
							'type' => 'groups',
						),
					),
				),

				array(
					'title'         => esc_html__( 'Signup Location Tracking', 'jetpack' ),
					'fields'        => array(
						array(
							'title'       => esc_html__( 'Signup Field Tag', 'jetpack' ),
							'id'          => 'jetpack_mailchimp_signup_tag',
							'placeholder' => esc_html__( 'SIGNUP', 'jetpack' ),
							'type'        => 'text',
						),

						array(
							'title'       => esc_html__( 'Signup Field Value', 'jetpack' ),
							'id'          => 'jetpack_mailchimp_signup_value',
							'placeholder' => esc_html__( 'website', 'jetpack' ),
							'type'        => 'text',
						),
					),
					'extra_content' => array(
						'text' => esc_html__( 'Learn about signup location tracking(opens in a new tab)', 'jetpack' ),
						'link' => 'https://mailchimp.com/help/determine-webpage-signup-location/',
						'type' => 'link',
					),
				),

				array(
					'title'         => esc_html__( 'Mailchimp Groups', 'jetpack' ),
					'extra_content' => array(
						'text' => esc_html__( 'Manage Connection', 'jetpack' ),
						'link' => 'https://jetpack.com/redirect?source=calypso-marketing-connections&site=[site_url]&query=mailchimp',
						'type' => 'link',
					),
				),

				array(
					'title'  => esc_html__( 'Button Color Settings', 'jetpack' ),
					'fields' => array(
						array(
							'id'   => 'jetpack_mailchimp_button_color',
							'type' => 'color',
						),

						array(
							'id'   => 'jetpack_mailchimp_button_text_color',
							'type' => 'color',
						),
					),
				),

				array(
					'title'  => esc_html__( 'Advanced', 'jetpack' ),
					'fields' => array(
						array(
							'title'       => esc_html__( 'Additional CSS class(es)', 'jetpack' ),
							'id'          => 'jetpack_mailchimp_css_class',
							'placeholder' => '',
							'help_text'   => esc_html__( 'Separate multiple classes with spaces.', 'jetpack' ),
							'type'        => 'text',
						),
					),
				),
			);

			add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_admin_scripts' ) );
		}

		/**
		 * Outputs the HTML for this widget.
		 *
		 * @param array $args     An array of standard parameters for widgets in this theme.
		 * @param array $instance An array of settings for this widget instance.
		 *
		 * @return void Echoes it's output
		 **/
		function widget( $args, $instance ) {
			$instance = wp_parse_args( $instance, array( 'code' => '' ) );

			// Regular expresion that will match maichimp shortcode.
			$regex = '(\[mailchimp_subscriber_popup[^\]]+\])';

			// Check if the shortcode exists.
			preg_match( $regex, $instance['code'], $matches );

			// Process the shortcode only, if exists.
			if ( ! empty( $matches[0] ) ) {
				echo do_shortcode( $matches[0] );
			}

			/** This action is documented in modules/widgets/gravatar-profile.php */
			do_action( 'jetpack_stats_extra', 'widget_view', 'mailchimp_subscriber_popup' );
		}


		/**
		 * Deals with the settings when they are saved by the admin.
		 *
		 * @param array $new_instance New configuration values.
		 * @param array $old_instance Old configuration values.
		 *
		 * @return array
		 */
		public function update( $new_instance, $old_instance ) {
			$instance         = array();
			$instance['code'] = MailChimp_Subscriber_Popup::reversal( $new_instance['code'] );

			return $instance;
		}

		/**
		 * Output the mailchimp form.
		 *
		 * @return void
		 */
		public function form_data() {
			?>
			<div class="mailchimp_form">
				<div class="section">
					<div class="section_toggler">
						<span class="section_title"><?php echo esc_html__( 'Text Elements', 'jetpack' ); ?></span>
					</div>
					<div class="section_content">
						<div class="field">
							<label for="jetpack_mailchimp_email"><?php echo esc_html__( 'Email Placeholder', 'jetpack' ); ?></label>
							<input type="text" placeholder="<?php echo esc_html__( 'Enter your email', 'jetpack' ); ?>" value="" id="jetpack_mailchimp_email">
						</div>
					</div>
				</div>
				<div class="section">
					<div class="section_toggler">
						<span class="section_title"><?php echo esc_html__( 'Notifications', 'jetpack' ); ?></span>
					</div>
					<div class="section_content">
						<div class="field">
							<label for="jetpack_mailchimp_processing_text"><?php echo esc_html__( 'Processing', 'jetpack' ); ?></label>
							<input type="text" placeholder="<?php echo esc_html__( 'Processing', 'jetpack' ); ?>" value="" id="jetpack_mailchimp_processing_text">
						</div>
						<div class="field">
							<label for="jetpack_mailchimp_success_text"><?php echo esc_html__( 'Success text', 'jetpack' ); ?></label>
							<input type="text" placeholder="<?php echo esc_html__( 'Success! You\'re on the list.', 'jetpack' ); ?>" value="" id="jetpack_mailchimp_success_text">
						</div>
						<div class="field">
							<label for="jetpack_mailchimp_error_text"><?php echo esc_html__( 'Error text', 'jetpack' ); ?></label>
							<input type="text" placeholder="<?php echo esc_html__( 'Whoops! There was an error and we couldn\'t process your subscription. Please reload the page and try again.', 'jetpack' ); ?>" value="" id="jetpack_mailchimp_error_text">
						</div>
					</div>
				</div>
				<div class="section">
					<div class="section_toggler">
						<span class="section_title"><?php echo esc_html__( 'Mailchimp Groups', 'jetpack' ); ?></span>
					</div>
					<div class="section_content">
						<a href=""><?php echo esc_html__( 'Learn about groups', 'jetpack' ); ?></a>
					</div>
				</div>
				<div class="section">
					<div class="section_toggler">
						<span class="section_title"><?php echo esc_html__( 'Signup Location Tracking', 'jetpack' ); ?></span>
					</div>
					<div class="section_content">
						<div class="field">
							<label for="jetpack_mailchimp_signup_tag"><?php echo esc_html__( 'Signup Field Tag', 'jetpack' ); ?></label>
							<input type="text" placeholder="<?php echo esc_html__( 'SIGNUP', 'jetpack' ); ?>" value="" id="jetpack_mailchimp_signup_tag">
						</div>
						<div class="field">
							<label for="jetpack_mailchimp_signup_value"><?php echo esc_html__( 'Signup Field Value', 'jetpack' ); ?></label>
							<input type="text" placeholder="<?php echo esc_html__( 'website', 'jetpack' ); ?>" value="" id="jetpack_mailchimp_signup_value">
						</div>
						<a href=""><?php echo esc_html__( 'Learn about signup location tracking(opens in a new tab)', 'jetpack' ); ?></a>
					</div>
				</div>
				<div class="section">
					<div class="section_toggler">
						<span class="section_title"><?php echo esc_html__( 'Mailchimp Groups', 'jetpack' ); ?></span>
					</div>
					<div class="section_content">
						<a href=""><?php echo esc_html__( 'Manage Connection', 'jetpack' ); ?></a>
					</div>
				</div>
			</div>
			<?php
		}

		/**
		 * Add the scripts for the widget.
		 *
		 * @return void
		 */
		public function enqueue_admin_scripts() {
			global $pagenow;

			if ( 'widgets.php' === $pagenow ) {
				wp_enqueue_script(
					'mailchimp-admin',
					Assets::get_file_url_for_environment(
						'_inc/build/widgets/mailchimp/js/admin.min.js',
						'modules/widgets/mailchimp/js/admin.js'
					),
					array(),
					'20200607',
					true
				);

				wp_localize_script(
					'mailchimp-admin',
					'mailchimpAdmin',
					array(
						'formSections' => $this->form_sections,
					)
				);
			}
		}


		/**
		 * Displays the form for this widget on the Widgets page of the WP Admin area.
		 *
		 * @param array $instance Instance configuration.
		 *
		 * @return void
		 */
		public function form( $instance ) {
			$instance = wp_parse_args( $instance, array( 'code' => '' ) );

			if ( empty( $instance['code'] ) ) {
				?>
					<p class="mailchimp_widget_jetpack_form_wrapper"></p>
				<?php
				return;
			}

			?>

			<p class="mailchimp_code">
				<label for="<?php echo esc_attr( $this->get_field_id( 'code' ) ); ?>">
					<?php printf( __( 'Code: <a href="%s" target="_blank">( ? )</a>', 'jetpack' ), 'https://en.support.wordpress.com/mailchimp/' ); ?>
				</label>
				<textarea class="widefat" id="<?php echo esc_attr( $this->get_field_id( 'code' ) ); ?>" name="<?php echo esc_attr( $this->get_field_name( 'code' ) ); ?>" rows="3"><?php echo esc_textarea( $instance['code'] ); ?></textarea>
			</p>
			<p class="mailchimp_widget_jetpack_form_wrapper"></p>
			<?php
		}

	}

}
