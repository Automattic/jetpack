<?php

use Automattic\Jetpack\Assets;

use Jetpack_AMP_Support;

use function Automattic\Jetpack\Extensions\Mailchimp\load_assets as render_block;

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
		 * Array contaning the data for the placeholder view.
		 *
		 * @var array
		 */
		protected $placeholder_data;

		/**
		 * Constructor
		 */
		public function __construct() {
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
		public function widget( $args, $instance ) {
			$instance = wp_parse_args(
				$instance,
				array(
					'code'      => '',
					'cssClass'  => '',
					'popupMode' => '',
					'delay'     => '0',
				)
			);

			if ( ! empty( $instance['code'] ) ) {
				// Regular expresion that will match maichimp shortcode.
				$regex = '(\[mailchimp_subscriber_popup[^\]]+\])';

				// Check if the shortcode exists.
				preg_match( $regex, $instance['code'], $matches );

				// Process the shortcode only, if exists.
				if ( ! empty( $matches[0] ) ) {
					echo do_shortcode( $matches[0] );
				}
			} else {
				$instance['interests'] = explode( '_', $instance['interests'] );

				$is_amp_request = class_exists( 'Jetpack_AMP_Support' ) && Jetpack_AMP_Support::is_amp_request();

				$popup_mode   = 'on' === $instance['popupMode'];
				$hidden_style = '';
				if ( $popup_mode && ! $is_amp_request ) {
					$hidden_style = 'style=display:none;';

					wp_enqueue_script(
						'jetpack-mailchimp-popup',
						Assets::get_file_url_for_environment(
							'_inc/build/widgets/mailchimp/js/popup.min.js',
							'modules/widgets/mailchimp/js/popup.js'
						),
						array( 'jquery' ),
						'20200615',
						true
					);

					wp_localize_script(
						'jetpack-mailchimp-popup',
						'jetpackMailchimpPopup',
						array(
							'delay' => $instance['delay'],
						)
					);

					wp_enqueue_style(
						'jetpack-mailchimp-popup-style',
						Assets::get_file_url_for_environment(
							'_inc/build/widgets/mailchimp/css/popup.min.css',
							'modules/widgets/mailchimp/css/popup.css'
						),
						array(),
						'20200615'
					);
				}

				echo sprintf(
					'<div class="%s" %s >%s</div>',
					'jetpack_mailchimp_widget_form',
					esc_html( $hidden_style ),
					// Use the same ouput as the mailchimp block.
					// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
					render_block( $instance )
				);
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
			$instance = array();

			if ( empty( $new_instance['code'] ) || ( ! empty( $new_instance['new_form'] ) && 'on' === $new_instance['new_form'] ) ) {
				$instance['code'] = '';
			}

			$instance['emailPlaceholder']            = sanitize_text_field( $new_instance['emailPlaceholder'] );
			$instance['processingLabel']             = sanitize_text_field( $new_instance['processingLabel'] );
			$instance['successLabel']                = sanitize_text_field( $new_instance['successLabel'] );
			$instance['errorLabel']                  = sanitize_text_field( $new_instance['errorLabel'] );
			$instance['interests']                   = sanitize_text_field( $new_instance['interests'] );
			$instance['signupFieldTag']              = sanitize_text_field( $new_instance['signupFieldTag'] );
			$instance['signupFieldValue']            = sanitize_text_field( $new_instance['signupFieldValue'] );
			$instance['customBackgroundButtonColor'] = sanitize_text_field( $new_instance['customBackgroundButtonColor'] );
			$instance['customTextButtonColor']       = sanitize_text_field( $new_instance['customTextButtonColor'] );
			$instance['css_class']                   = sanitize_text_field( $new_instance['css_class'] );
			$instance['popupMode']                   = ! empty( $new_instance['popupMode'] ) && 'on' === $new_instance['popupMode'] ? 'on' : 'off';
			$instance['delay']                       = sanitize_text_field( $new_instance['delay'] );

			return $instance;
		}

		/**
		 * Enqueue the scripts for the widget.
		 *
		 * @return void
		 */
		public function enqueue_admin_scripts() {
			global $pagenow;

			if ( 'widgets.php' === $pagenow ) {
				wp_enqueue_script(
					'jetpack-mailchimp-admin',
					Assets::get_file_url_for_environment(
						'_inc/build/widgets/mailchimp/js/admin.min.js',
						'modules/widgets/mailchimp/js/admin.js'
					),
					array( 'jquery', 'wp-color-picker' ),
					'20200607',
					true
				);

				wp_enqueue_style( 'wp-color-picker' );
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
			$instance = wp_parse_args(
				$instance,
				array(
					'code'              => '',
					'email_placeholder' => '',
					'processing_text'   => '',
					'success_text'      => '',
					'error_text'        => '',
					'groups'            => '',
					'signup_tag'        => '',
					'signup_value'      => '',
					'button_color'      => '',
					'text_color'        => '',
					'css_class'         => '',
				)
			);

			$this->form_sections = array(
				array(
					'title'  => __( 'Text Elements', 'jetpack' ),
					'fields' => array(
						array(
							'title'       => __( 'Email Placeholder', 'jetpack' ),
							'id'          => 'jetpack_mailchimp_email',
							'placeholder' => __( 'Enter your email', 'jetpack' ),
							'type'        => 'text',
							'name'        => esc_attr( $this->get_field_name( 'emailPlaceholder' ) ),
							'value'       => esc_html( $instance['emailPlaceholder'] ),
						),
					),
				),

				array(
					'title'  => __( 'Notifications', 'jetpack' ),
					'fields' => array(
						array(
							'title'       => __( 'Processing', 'jetpack' ),
							'id'          => 'jetpack_mailchimp_processing_label',
							'placeholder' => __( 'Processing', 'jetpack' ),
							'type'        => 'text',
							'name'        => esc_attr( $this->get_field_name( 'processingLabel' ) ),
							'value'       => esc_html( $instance['processingLabel'] ),
						),

						array(
							'title'       => __( 'Success text', 'jetpack' ),
							'id'          => 'jetpack_mailchimp_success_text',
							'placeholder' => __( 'Success! You are on the list.', 'jetpack' ),
							'type'        => 'text',
							'name'        => esc_attr( $this->get_field_name( 'successLabel' ) ),
							'value'       => esc_html( $instance['successLabel'] ),
						),

						array(
							'title'       => __( 'Error text', 'jetpack' ),
							'id'          => 'jetpack_mailchimp_error_label',
							'placeholder' => __( 'Whoops! There was an error and we could not process your subscription. Please reload the page and try again.', 'jetpack' ),
							'type'        => 'text',
							'name'        => esc_attr( $this->get_field_name( 'errorLabel' ) ),
							'value'       => esc_html( $instance['errorLabel'] ),
						),
					),
				),

				array(
					'title'         => __( 'Mailchimp Groups', 'jetpack' ),
					'fields'        => array(
						array(
							'type' => 'groups',
						),
					),
					'extra_content' => array(
						array(
							'text' => __( 'Learn about groups', 'jetpack' ),
							'link' => 'https://mailchimp.com/help/send-groups-audience/',
							'type' => 'link',
						),
					),
				),

				array(
					'title'         => __( 'Signup Location Tracking', 'jetpack' ),
					'fields'        => array(
						array(
							'title'       => __( 'Signup Field Tag', 'jetpack' ),
							'id'          => 'jetpack_mailchimp_signup_tag',
							'placeholder' => __( 'SIGNUP', 'jetpack' ),
							'type'        => 'text',
							'name'        => esc_attr( $this->get_field_name( 'signupFieldTag' ) ),
							'value'       => esc_html( $instance['signupFieldTag'] ),
						),

						array(
							'title'       => __( 'Signup Field Value', 'jetpack' ),
							'id'          => 'jetpack_mailchimp_signup_value',
							'placeholder' => __( 'website', 'jetpack' ),
							'type'        => 'text',
							'name'        => esc_attr( $this->get_field_name( 'signupFieldValue' ) ),
							'value'       => esc_html( $instance['signupFieldValue'] ),
						),
					),
					'extra_content' => array(
						array(
							'text' => __( 'Learn about signup location tracking(opens in a new tab)', 'jetpack' ),
							'link' => 'https://mailchimp.com/help/determine-webpage-signup-location/',
							'type' => 'link',
						),
					),
				),

				array(
					'title'         => __( 'Mailchimp Connection', 'jetpack' ),
					'extra_content' => array(
						array(
							'text' => __( 'Manage Connection', 'jetpack' ),
							'link' => 'connect_url',
							'type' => 'link',
						),
					),
				),

				array(
					'title'  => __( 'Button Color Settings', 'jetpack' ),
					'fields' => array(
						array(
							'id'      => 'jetpack_mailchimp_button_color',
							'type'    => 'color',
							'value'   => esc_html( $instance['customBackgroundButtonColor'] ),
							'default' => '#cd2653',
							'name'    => esc_attr( $this->get_field_name( 'customBackgroundButtonColor' ) ),
							'label'   => __( 'Button Color', 'jetpack' ),
						),

						array(
							'id'      => 'jetpack_mailchimp_button_text_color',
							'type'    => 'color',
							'value'   => esc_html( $instance['customTextButtonColor'] ),
							'default' => '#ffffff',
							'name'    => esc_attr( $this->get_field_name( 'customTextButtonColor' ) ),
							'label'   => __( 'Button Text Color', 'jetpack' ),
						),
					),
				),

				array(
					'title'  => __( 'Advanced', 'jetpack' ),
					'fields' => array(
						array(
							'title'       => __( 'Additional CSS class(es)', 'jetpack' ),
							'id'          => 'jetpack_mailchimp_css_class',
							'placeholder' => '',
							'help_text'   => __( 'Separate multiple classes with spaces.', 'jetpack' ),
							'type'        => 'text',
							'name'        => esc_attr( $this->get_field_name( 'cssClass' ) ),
							'value'       => esc_html( $instance['cssClass'] ),
						),

						array(
							'title' => __( 'Activate popup mode', 'jetpack' ),
							'type'  => 'checkbox',
							'name'  => esc_attr( $this->get_field_name( 'popupMode' ) ),
							'value' => esc_html( $instance['popupMode'] ),
						),

						array(
							'title'       => __( 'Popup delay (miliseconds)', 'jetpack' ),
							'type'        => 'number',
							'name'        => esc_attr( $this->get_field_name( 'delay' ) ),
							'value'       => esc_html( $instance['delay'] ),
							'placeholder' => '0',
						),
					),
				),
			);

			$this->placeholder_data = array(
				'instructions'    => __( 'You need to connect your Mailchimp account and choose a list in order to start collecting Email subscribers.', 'jetpack' ),
				'setupButtonText' => __( 'Set up Mailchimp form', 'jetpack' ),
				'recheckText'     => __( 'Re-check Connection', 'jetpack' ),
			);

			if ( ! empty( $instance['code'] ) ) {
				?>
					<p class="mailchimp_code">
					<label for="<?php echo esc_attr( $this->get_field_id( 'code' ) ); ?>">
						<?php
							/* translators: %1$s is replaced mailchimp suppoert link */
							echo sprintf( __( 'Code: <a href="%s" target="_blank">( ? )</a>', 'jetpack' ), 'https://en.support.wordpress.com/mailchimp/' );
						?>
					</label>
					<textarea class="widefat" id="<?php echo esc_attr( $this->get_field_id( 'code' ) ); ?>" name="<?php echo esc_attr( $this->get_field_name( 'code' ) ); ?>" rows="3"><?php echo esc_textarea( $instance['code'] ); ?></textarea>
				</p>
				<p class="jetpack_mailchimp_new_form_wrapper">
					<input type="checkbox" id="jetpack_mailchimp_new_form" name="<?php echo esc_attr( $this->get_field_name( 'new_form' ) ); ?>" > <?php echo esc_html__( 'Check this if you want to use the new form for this widget (the code in the box above will be deleted)', 'jetpack' ); ?>
				</p>
				<?php
			}

			?>
			<div class="mailchimp_widget_jetpack_form_wrapper"></div>
			<script>

				var mailchimpAdmin = {
					formData: '<?php echo wp_json_encode( $this->form_sections ); ?>',
					placeholderData: '<?php echo wp_json_encode( $this->placeholder_data ); ?>',
					oldForm: <?php echo ! empty( $instance['code'] ) ? 'true' : 'false'; ?>,
					groups: '<?php echo esc_html( $instance['interests'] ); ?>',
					groupsFieldName: '<?php echo esc_attr( $this->get_field_name( 'interests' ) ); ?>'
				}
				jQuery( window ).trigger( 'jetpack_mailchimp_load_form' );
			</script>
			<?php
		}

	}

}
