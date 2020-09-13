<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

use Automattic\Jetpack\Assets;

use function Automattic\Jetpack\Extensions\Mailchimp\load_assets as render_block;

if ( ! class_exists( 'Jetpack_MailChimp_Subscriber_Popup_Widget' ) ) {

	if ( ! class_exists( 'MailChimp_Subscriber_Popup' ) ) {
		include_once JETPACK__PLUGIN_DIR . 'modules/shortcodes/mailchimp.php';
	}

	/**
	 * Register MailChimp Subscriber Popup widget.
	 */
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
		 * Array containing the defaults values for the admin form.
		 *
		 * @var array
		 */
		protected $defaults = array();

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
			// These are the same attributes as the Mailchimp form (extensions/blocks/mailchimp/mailchimp.php), so if the block attributes are changed the these need to be changed accordingly.
			$this->defaults = array(
				'code'                        => '',
				'emailPlaceholder'            => __( 'Enter your email', 'jetpack' ),
				'processingLabel'             => __( 'Processing', 'jetpack' ),
				'successLabel'                => __( 'Success! You are on the list.', 'jetpack' ),
				'errorLabel'                  => __( 'Whoops! There was an error and we could not process your subscription. Please reload the page and try again.', 'jetpack' ),
				'interests'                   => '',
				'signupFieldTag'              => '',
				'signupFieldValue'            => '',
				'customBackgroundButtonColor' => '',
				'customTextButtonColor'       => '',
				'cssClass'                    => '',
				'popupMode'                   => '',
				'delay'                       => '0',
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
				$this->defaults
			);

			if ( ! empty( $instance['code'] ) ) {
				// Process the shortcode only, if exists.
				if ( has_shortcode( $instance['code'], 'mailchimp_subscriber_popup' ) ) {
					echo do_shortcode( $instance['code'] );
				}
			} else {
				$instance['interests'] = empty( $instance['interests'] ) ? array() : explode( '_', $instance['interests'] );

				$is_amp_request = class_exists( 'Jetpack_AMP_Support' ) && Jetpack_AMP_Support::is_amp_request();

				$popup_mode = 'on' === $instance['popupMode'];
				// Use the same output as the block.
				$output       = render_block( $instance, '' );
				$form_classes = 'jetpack-mailchimp-widget-form';

				if ( ! empty( $instance['cssClass'] ) ) {
					$form_classes .= ' ' . $instance['cssClass'];
				}

				$output = sprintf(
					'<div class="%s">%s</div>',
					esc_attr( $form_classes ),
					$output
				);

				if ( $popup_mode ) {

					if ( $is_amp_request ) {

						wp_enqueue_style(
							'jetpack-mailchimp-popup-style',
							Assets::get_file_url_for_environment(
								'_inc/build/widgets/mailchimp/css/popup-amp.min.css',
								'modules/widgets/mailchimp/css/popup-amp.css'
							),
							array(),
							JETPACK__VERSION
						);

						$output = sprintf(
							'<amp-user-notification class="%1$s-wrapper" id="%1$s" layout="nodisplay">
								<div class="jetpack-mailchimp-notification">
									<button class="%1$s-close" on="tap:%1$s.dismiss"></button>
									%2$s
								</div>
							</amp-user-notification>',
							'jetpack-mailchimp-widget',
							$output
						);
					} else {

						wp_enqueue_script(
							'jetpack-mailchimp-popup',
							Assets::get_file_url_for_environment(
								'_inc/build/widgets/mailchimp/js/popup.min.js',
								'modules/widgets/mailchimp/js/popup.js'
							),
							array( 'jquery' ),
							JETPACK__VERSION,
							true
						);

						wp_localize_script(
							'jetpack-mailchimp-popup',
							'jetpackMailchimpPopup',
							array(
								'delay' => esc_html( $instance['delay'] ),
							)
						);

						wp_enqueue_style(
							'jetpack-mailchimp-popup-style',
							Assets::get_file_url_for_environment(
								'_inc/build/widgets/mailchimp/css/popup.min.css',
								'modules/widgets/mailchimp/css/popup.css'
							),
							array(),
							JETPACK__VERSION
						);
						// Add style="display:none;" to the div containing the form.
						$output = preg_replace( '/(class=".+")\s*(>)/', '$1 style="display:none;"$2', $output, 1 );
					}
				}
				// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
				echo $output;
			}

			/** This action is documented in modules/widgets/gravatar-profile.php */
			do_action( 'jetpack_stats_extra', 'widget_view', 'mailchimp_subscriber_popup' );
		}

		//phpcs:disable VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable

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

			$new_instance = wp_parse_args(
				$new_instance,
				$this->defaults
			);

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
			$instance['cssClass']                    = sanitize_text_field( $new_instance['cssClass'] );
			$instance['popupMode']                   = ! empty( $new_instance['popupMode'] ) && 'on' === $new_instance['popupMode'] ? 'on' : 'off';
			$instance['delay']                       = sanitize_text_field( $new_instance['delay'] );

			return $instance;
		}

		//phpcs:enable VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable

		/**
		 * Enqueue the scripts for the widget.
		 *
		 * @return void
		 */
		public function enqueue_admin_scripts() {
			global $pagenow;

			if ( in_array( $pagenow, array( 'widgets.php', 'customize.php' ), true ) ) {
				wp_enqueue_script(
					'jetpack-mailchimp-admin-js',
					Assets::get_file_url_for_environment(
						'_inc/build/widgets/mailchimp/js/admin.min.js',
						'modules/widgets/mailchimp/js/admin.js'
					),
					array( 'jquery', 'wp-color-picker' ),
					'20200607',
					true
				);

				wp_enqueue_style(
					'jetpack-mailchimp-admin-style',
					Assets::get_file_url_for_environment(
						'_inc/build/widgets/mailchimp/css/admin.min.css',
						'modules/widgets/mailchimp/css/admin.css'
					),
					array( 'wp-color-picker' ),
					'20200615'
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
			$instance = wp_parse_args(
				$instance,
				$this->defaults
			);

			$this->form_sections = array(
				array(
					'title'  => __( 'Text Elements', 'jetpack' ),
					'fields' => array(
						array(
							'title'       => __( 'Email Placeholder', 'jetpack' ),
							'id'          => 'jetpack-mailchimp-email',
							'placeholder' => $this->defaults['emailPlaceholder'],
							'default'     => $this->defaults['emailPlaceholder'],
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
							'title'       => $this->defaults['processingLabel'],
							'id'          => 'jetpack-mailchimp-processing-label',
							'placeholder' => $this->defaults['processingLabel'],
							'default'     => $this->defaults['processingLabel'],
							'type'        => 'text',
							'name'        => esc_attr( $this->get_field_name( 'processingLabel' ) ),
							'value'       => esc_html( $instance['processingLabel'] ),
						),

						array(
							'title'       => __( 'Success text', 'jetpack' ),
							'id'          => 'jetpack-mailchimp-success-text',
							'placeholder' => $this->defaults['successLabel'],
							'default'     => $this->defaults['successLabel'],
							'type'        => 'text',
							'name'        => esc_attr( $this->get_field_name( 'successLabel' ) ),
							'value'       => esc_html( $instance['successLabel'] ),
						),

						array(
							'title'       => __( 'Error text', 'jetpack' ),
							'id'          => 'jetpack-mailchimp-error-label',
							'placeholder' => $this->defaults['errorLabel'],
							'default'     => $this->defaults['errorLabel'],
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
							'id'          => 'jetpack-mailchimp-signup-tag',
							'placeholder' => __( 'SIGNUP', 'jetpack' ),
							'default'     => $this->defaults['signupFieldTag'],
							'type'        => 'text',
							'name'        => esc_attr( $this->get_field_name( 'signupFieldTag' ) ),
							'value'       => esc_html( $instance['signupFieldTag'] ),
						),

						array(
							'title'       => __( 'Signup Field Value', 'jetpack' ),
							'id'          => 'jetpack-mailchimp-signup-value',
							'placeholder' => __( 'website', 'jetpack' ),
							'default'     => $this->defaults['signupFieldValue'],
							'type'        => 'text',
							'name'        => esc_attr( $this->get_field_name( 'signupFieldValue' ) ),
							'value'       => esc_html( $instance['signupFieldValue'] ),
						),
					),
					'extra_content' => array(
						array(
							'text' => __( 'Learn about signup location tracking (opens in a new tab)', 'jetpack' ),
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
							'id'      => 'jetpack-mailchimp-button-color',
							'type'    => 'color',
							'value'   => esc_html( $instance['customBackgroundButtonColor'] ),
							'default' => $this->defaults['customBackgroundButtonColor'],
							'name'    => esc_attr( $this->get_field_name( 'customBackgroundButtonColor' ) ),
							'label'   => __( 'Button Color', 'jetpack' ),
						),

						array(
							'id'      => 'jetpack-mailchimp-button-text-color',
							'type'    => 'color',
							'value'   => esc_html( $instance['customTextButtonColor'] ),
							'default' => $this->defaults['customTextButtonColor'],
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
							'id'          => 'jetpack-mailchimp-css-class',
							'placeholder' => '',
							'default'     => $this->defaults['cssClass'],
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
							'title'       => __( 'Popup delay in miliseconds', 'jetpack' ),
							'type'        => 'number',
							'name'        => esc_attr( $this->get_field_name( 'delay' ) ),
							'value'       => esc_html( $instance['delay'] ),
							'default'     => $this->defaults['delay'],
							'placeholder' => '',
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
					<p class="mailchimp-code">
					<label for="<?php echo esc_attr( $this->get_field_id( 'code' ) ); ?>">
						<?php
							// phpcs:disable WordPress.Security.EscapeOutput.OutputNotEscaped
							/* translators: %1$s is replaced mailchimp support link */
							echo sprintf( __( 'Code: <a rel="noopener noreferrer" href="%s" target="_blank">( ? )</a>', 'jetpack' ), 'https://en.support.wordpress.com/mailchimp/' );
							// phpcs:enable WordPress.Security.EscapeOutput.OutputNotEscaped
						?>
					</label>
					<textarea class="widefat" id="<?php echo esc_attr( $this->get_field_id( 'code' ) ); ?>" name="<?php echo esc_attr( $this->get_field_name( 'code' ) ); ?>" rows="3"><?php echo esc_textarea( $instance['code'] ); ?></textarea>
				</p>
				<p class="jetpack-mailchimp-new-form-wrapper">
					<input type="checkbox" id="jetpack-mailchimp-new-form" name="<?php echo esc_attr( $this->get_field_name( 'new_form' ) ); ?>" > <?php echo esc_html__( 'Check this if you want to use the new form for this widget (the code in the box above will be deleted)', 'jetpack' ); ?>
				</p>
				<?php
			}

			?>
			<div class="mailchimp-widget-jetpack-form-wrapper"></div>
			<script>

				var mailchimpAdmin = {
					formData: '<?php echo wp_json_encode( $this->form_sections ); ?>',
					placeholderData: '<?php echo wp_json_encode( $this->placeholder_data ); ?>',
					oldForm: <?php echo ! empty( $instance['code'] ) ? 'true' : 'false'; ?>,
					interests: '<?php echo esc_html( $instance['interests'] ); ?>',
					interestsFieldName: '<?php echo esc_attr( $this->get_field_name( 'interests' ) ); ?>',
					nonce: '<?php echo esc_html( wp_create_nonce( 'wp_rest' ) ); ?>',
					question: '<?php echo esc_html__( 'Are you sure?', 'jetpack' ); ?>'
				};
				jQuery( window ).trigger( 'jetpack_mailchimp_load_form' );
			</script>
			<?php
		}

	}

}
