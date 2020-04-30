<?php
/**
 * Display the Subscriptions Widget
 * on WordPress.com or in Jetpack
 *
 * @package Jetpack
 */

namespace Automattic\Jetpack\Subscriptions;

use Automattic\Jetpack\Subscriptions\Helpers;
use Blog_Subscription_Widget;
use WP_Widget;

if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
	class_alias( 'Automattic\Jetpack\Subscriptions\Widget', 'Blog_Subscription_Widget' );
}

/**
 * Register our Widget.
 */
function register() {
	register_widget( Widget::class );
}
add_action( 'widgets_init', __NAMESPACE__ . '\register' );

/**
 * Display a widget allowing one to subscribe to your site.
 * Supports both Jetpack and WordPress.com environments.
 */
class Widget extends WP_Widget {
	/**
	 * Unique number for the widget.
	 *
	 * @var int
	 */
	private static $instance_count = 0;

	/**
	 * When printing the submit button, what tags are allowed
	 *
	 * @var array
	 */
	private static $allowed_html_tags_for_submit_button = array( 'br' => array() );

	/**
	 * Use this variable when printing the message after submitting an email in subscription widgets
	 *
	 * @var array what tags are allowed
	 */
	public static $allowed_html_tags_for_message = array(
		'a'  => array(
			'href'   => array(),
			'title'  => array(),
			'rel'    => array(),
			'target' => array(),
		),
		'br' => array(),
		'p'  => array(),
	);

	/**
	 * Constructor
	 */
	public function __construct() {
		$widget_ops = array(
			'classname'                   => 'widget_blog_subscription jetpack_subscription_widget',
			'description'                 => __( 'Add an email signup form to allow people to subscribe to your blog.', 'jetpack' ),
			'customize_selective_refresh' => true,
		);

		$name = Helpers::is_jetpack() ?
			/** This filter is documented in modules/widgets/facebook-likebox.php */
			apply_filters( 'jetpack_widget_name', __( 'Blog Subscriptions', 'jetpack' ) )
			: __( 'Follow Blog', 'jetpack' );

		parent::__construct(
			'blog_subscription',
			$name,
			$widget_ops
		);

		if (
			Helpers::is_jetpack()
			&& (
				is_active_widget( false, false, $this->id_base )
				|| is_active_widget( false, false, 'monster' )
				|| is_customize_preview()
			)
		) {
			add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_style' ) );
		}
	}

	/**
	 * Enqueue the form's CSS.
	 *
	 * @since 4.5.0
	 */
	public function enqueue_style() {
		wp_enqueue_style(
			'jetpack-subscriptions',
			plugins_url( 'subscriptions.css', __FILE__ ),
			array(),
			JETPACK__VERSION
		);
	}

	/**
	 * The default args for rendering a subscription form.
	 *
	 * @return array
	 */
	private static function defaults() {
		$defaults = array(
			'show_subscribers_total'     => true,
			'show_only_email_and_button' => false,
		);

		if ( Helpers::is_jetpack() ) {
			$defaults['title']                 = esc_html__( 'Subscribe to Blog via Email', 'jetpack' );
			$defaults['subscribe_text']        = esc_html__( 'Enter your email address to subscribe to this blog and receive notifications of new posts by email.', 'jetpack' );
			$defaults['subscribe_placeholder'] = esc_html__( 'Email Address', 'jetpack' );
			$defaults['subscribe_button']      = esc_html__( 'Subscribe', 'jetpack' );
			$defaults['success_message']       = esc_html__( "Success! An email was just sent to confirm your subscription. Please find the email now and click 'Confirm Follow' to start subscribing.", 'jetpack' );
		}

		if ( Helpers::is_wpcom() ) {
			// phpcs:disable WordPress.WP.I18n.MissingArgDomain -- These strings are only used on WordPress.com.
			$defaults['title']               = __( 'Follow Blog via Email' );
			$defaults['title_following']     = __( 'You are following this blog' );
			$defaults['subscribe_text']      = __( 'Enter your email address to follow this blog and receive notifications of new posts by email.' );
			$defaults['subscribe_button']    = __( 'Follow' );
			$defaults['subscribe_logged_in'] = __( 'Click to follow this blog and receive notifications of new posts by email.' );
			// phpcs:enable WordPress.WP.I18n.MissingArgDomain
		}

		return $defaults;
	}

	/**
	 * Renders the widget's options form in wp-admin.
	 *
	 * @param array $instance Widget options.
	 */
	public function form( $instance ) {
		$instance               = wp_parse_args( (array) $instance, $this->defaults() );
		$show_subscribers_total = checked( $instance['show_subscribers_total'], true, false );

		if ( Helpers::is_jetpack() ) {
			$this->jetpack_widget_admin_form( $instance, $show_subscribers_total );
		}

		if ( Helpers::is_wpcom() ) {
			$this->wpcom_widget_admin_form( $instance, $show_subscribers_total );
		}
	}

	/**
	 * Render the form in the Jetpack environment.
	 *
	 * @param array  $instance               Widget options.
	 * @param string $show_subscribers_total checked attribute or empty string.
	 */
	private function jetpack_widget_admin_form( $instance, $show_subscribers_total ) {
		$title                 = stripslashes( $instance['title'] );
		$subscribe_text        = stripslashes( $instance['subscribe_text'] );
		$subscribe_placeholder = stripslashes( $instance['subscribe_placeholder'] );
		$subscribe_button      = stripslashes( $instance['subscribe_button'] );
		$success_message       = stripslashes( $instance['success_message'] );
		$subs_fetch            = Helpers::fetch_subscriber_count();
		if ( 'failed' === $subs_fetch['status'] ) {
			printf(
				'<div class="error inline"><p>%s: %s</p></div>',
				esc_html( $subs_fetch['code'] ),
				esc_html( $subs_fetch['message'] )
			);
		}
		$subscribers_total = number_format_i18n( $subs_fetch['value'] );

		?>
		<p>
			<label for="<?php echo esc_attr( $this->get_field_id( 'title' ) ); ?>">
				<?php esc_html_e( 'Widget title:', 'jetpack' ); ?>
				<input
					type="text"
					class="widefat"
					id="<?php echo esc_attr( $this->get_field_id( 'title' ) ); ?>"
					name="<?php echo esc_attr( $this->get_field_name( 'title' ) ); ?>"
					value="<?php echo esc_attr( $title ); ?>"
				/>
			</label>
		</p>
		<p>
			<label for="<?php echo esc_attr( $this->get_field_id( 'subscribe_text' ) ); ?>">
				<?php esc_html_e( 'Optional text to display to your readers:', 'jetpack' ); ?>
				<textarea
					class="widefat"
					id="<?php echo esc_attr( $this->get_field_id( 'subscribe_text' ) ); ?>"
					name="<?php echo esc_attr( $this->get_field_name( 'subscribe_text' ) ); ?>"
					rows="3"
				><?php echo esc_html( $subscribe_text ); ?></textarea>
			</label>
		</p>
		<p>
			<label for="<?php echo esc_attr( $this->get_field_id( 'subscribe_placeholder' ) ); ?>">
				<?php esc_html_e( 'Subscribe Placeholder:', 'jetpack' ); ?>
				<input
					type="text"
					class="widefat"
					id="<?php echo esc_attr( $this->get_field_id( 'subscribe_placeholder' ) ); ?>"
					name="<?php echo esc_attr( $this->get_field_name( 'subscribe_placeholder' ) ); ?>"
					value="<?php echo esc_attr( $subscribe_placeholder ); ?>"
				/>
			</label>
		</p>
		<p>
			<label for="<?php echo esc_attr( $this->get_field_id( 'subscribe_button' ) ); ?>">
				<?php esc_html_e( 'Subscribe Button:', 'jetpack' ); ?>
				<input
					type="text"
					class="widefat"
					id="<?php echo esc_attr( $this->get_field_id( 'subscribe_button' ) ); ?>"
					name="<?php echo esc_attr( $this->get_field_name( 'subscribe_button' ) ); ?>"
					value="<?php echo esc_attr( $subscribe_button ); ?>"
				/>
			</label>
		</p>
		<p>
			<label for="<?php echo esc_attr( $this->get_field_id( 'success_message' ) ); ?>">
				<?php esc_html_e( 'Success Message Text:', 'jetpack' ); ?>
				<textarea
					class="widefat"
					id="<?php echo esc_attr( $this->get_field_id( 'success_message' ) ); ?>"
					name="<?php echo esc_attr( $this->get_field_name( 'success_message' ) ); ?>"
					rows="5"
				><?php echo esc_html( $success_message ); ?></textarea>
			</label>
		</p>
		<p>
			<label for="<?php echo esc_attr( $this->get_field_id( 'show_subscribers_total' ) ); ?>">
				<input
					type="checkbox"
					id="<?php echo esc_attr( $this->get_field_id( 'show_subscribers_total' ) ); ?>"
					name="<?php echo esc_attr( $this->get_field_name( 'show_subscribers_total' ) ); ?>"
					value="1"
					<?php echo $show_subscribers_total; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
				/>
				<?php
				echo esc_html(
					sprintf(
						/* translators: placeholder is a number */
						_n(
							'Show total number of subscribers? (%s subscriber)',
							'Show total number of subscribers? (%s subscribers)',
							$subscribers_total,
							'jetpack'
						),
						$subscribers_total
					)
				);
				?>
			</label>
		</p>
		<?php
	}

	/**
	 * Render the form in the WordPress.com environment.
	 *
	 * @param array  $instance               Widget options.
	 * @param string $show_subscribers_total checked attribute or empty string.
	 */
	private function wpcom_widget_admin_form( $instance, $show_subscribers_total ) {
		$title               = esc_attr( stripslashes( $instance['title'] ) );
		$title_following     = esc_attr( stripslashes( $instance['title_following'] ) );
		$subscribe_text      = esc_attr( stripslashes( $instance['subscribe_text'] ) );
		$subscribe_logged_in = esc_attr( stripslashes( $instance['subscribe_logged_in'] ) );
		$subscribe_button    = esc_attr( stripslashes( $instance['subscribe_button'] ) );
		$subscribers_total   = Helpers::fetch_subscriber_count();

		// phpcs:disable WordPress.WP.I18n.MissingArgDomain -- These strings are only used on WordPress.com.
		?>
		<p>
			<label for="<?php echo esc_attr( $this->get_field_id( 'title' ) ); ?>">
				<?php esc_html_e( 'Widget title for non-followers:' ); ?>
				<input
					type="text"
					class="widefat"
					id="<?php echo esc_attr( $this->get_field_id( 'title' ) ); ?>"
					name="<?php echo esc_attr( $this->get_field_name( 'title' ) ); ?>"
					value="<?php echo esc_attr( $title ); ?>"
				/>
			</label>
		</p>
		<p>
			<label for="<?php echo esc_attr( $this->get_field_id( 'title_following' ) ); ?>">
				<?php esc_html_e( 'Widget title for followers:' ); ?>
				<input
					type="text"
					class="widefat"
					id="<?php echo esc_attr( $this->get_field_id( 'title_following' ) ); ?>"
					name="<?php echo esc_attr( $this->get_field_name( 'title_following' ) ); ?>"
					value="<?php echo esc_attr( $title_following ); ?>"
				/>
			</label>
		</p>
		<p>
			<label for="<?php echo esc_attr( $this->get_field_id( 'subscribe_logged_in' ) ); ?>">
				<?php esc_html_e( 'Optional text to display to logged in WordPress.com users:' ); ?>
				<textarea
					type="text"
					style="width: 95%"
					id="<?php echo esc_attr( $this->get_field_id( 'subscribe_logged_in' ) ); ?>"
					name="<?php echo esc_attr( $this->get_field_name( 'subscribe_logged_in' ) ); ?>"
				>
					<?php echo esc_html( $subscribe_logged_in ); ?>
				</textarea>
			</label>
		</p>
		<p>
			<label for="<?php echo esc_attr( $this->get_field_id( 'subscribe_text' ) ); ?>">
				<?php esc_html_e( 'Optional text to display to non-WordPress.com users:' ); ?>
				<textarea
					type="text"
					style="width: 95%"
					id="<?php echo esc_attr( $this->get_field_id( 'subscribe_text' ) ); ?>"
					name="<?php echo esc_attr( $this->get_field_name( 'subscribe_text' ) ); ?>"
				>
					<?php echo esc_html( $subscribe_text ); ?>
				</textarea>
			</label>
		</p>
		<p>
			<label for="<?php echo esc_attr( $this->get_field_id( 'subscribe_button' ) ); ?>">
				<?php esc_html_e( 'Follow Button Text:' ); ?>
				<input
					type="text"
					class="widefat"
					id="<?php echo esc_attr( $this->get_field_id( 'subscribe_button' ) ); ?>"
					name="<?php echo esc_attr( $this->get_field_name( 'subscribe_button' ) ); ?>"
					value="<?php echo esc_attr( $subscribe_button ); ?>"
				/>
			</label>
		</p>
		<p>
			<label for="<?php echo esc_attr( $this->get_field_id( 'show_subscribers_total' ) ); ?>">
				<input
					type="checkbox"
					id="<?php echo esc_attr( $this->get_field_id( 'show_subscribers_total' ) ); ?>"
					name="<?php echo esc_attr( $this->get_field_name( 'show_subscribers_total' ) ); ?>"
					value="1"
					<?php echo $show_subscribers_total; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
				/>
				<?php
				echo esc_html(
					sprintf(
						/* translators: placeholder is a number. */
						_n(
							'Show total number of followers? (%s follower)',
							'Show total number of followers? (%s followers)',
							$subscribers_total
						),
						number_format_i18n( $subscribers_total )
					)
				);
				?>
			</label>
		</p>
		<?php
		// phpcs:enable WordPress.WP.I18n.MissingArgDomain
	}

	/**
	 * Updates a particular instance of a widget when someone saves it in wp-admin.
	 *
	 * @param array $new_instance Old widget options.
	 * @param array $old_instance New widget options.
	 *
	 * @return array
	 */
	public function update( $new_instance, $old_instance ) {
		$instance = $old_instance;

		if ( Helpers::is_jetpack() ) {
			$instance['title']                 = wp_kses( stripslashes( $new_instance['title'] ), array() );
			$instance['subscribe_placeholder'] = wp_kses( stripslashes( $new_instance['subscribe_placeholder'] ), array() );
			$instance['subscribe_button']      = wp_kses( stripslashes( $new_instance['subscribe_button'] ), array() );
			$instance['success_message']       = wp_kses( stripslashes( $new_instance['success_message'] ), array() );
		}

		if ( Helpers::is_wpcom() ) {
			$instance['title']               = wp_strip_all_tags( stripslashes( $new_instance['title'] ) );
			$instance['title_following']     = wp_strip_all_tags( stripslashes( $new_instance['title_following'] ) );
			$instance['subscribe_logged_in'] = wp_filter_post_kses( stripslashes( $new_instance['subscribe_logged_in'] ) );
			$instance['subscribe_button']    = wp_strip_all_tags( stripslashes( $new_instance['subscribe_button'] ) );
		}

		$instance['show_subscribers_total']     = isset( $new_instance['show_subscribers_total'] ) && $new_instance['show_subscribers_total'];
		$instance['show_only_email_and_button'] = isset( $new_instance['show_only_email_and_button'] ) && $new_instance['show_only_email_and_button'];
		$instance['subscribe_text']             = wp_filter_post_kses( stripslashes( $new_instance['subscribe_text'] ) );

		return $instance;
	}

	/**
	 * Renders a full widget either within the context of WordPress widget, or in response to a shortcode.
	 *
	 * @param array $args Display arguments including 'before_title', 'after_title', 'before_widget', and 'after_widget'.
	 * @param array $instance The settings for the particular instance of the widget.
	 */
	public function widget( $args, $instance ) {
		if (
			Helpers::is_jetpack()
			/** This filter is documented in modules/contact-form/grunion-contact-form.php */
			&& false === apply_filters( 'jetpack_auto_fill_logged_in_user', false )
		) {
			$subscribe_email = '';
			$stats_action    = 'jetpack_subscriptions';
		} else {
			$current_user = wp_get_current_user();
			if ( ! empty( $current_user->user_email ) ) {
				$subscribe_email = esc_attr( $current_user->user_email );
			} else {
				$subscribe_email = '';
			}
			$stats_action = 'follow_blog';
		}

		/** This action is documented in modules/widgets/gravatar-profile.php */
		do_action( 'jetpack_stats_extra', 'widget_view', $stats_action );

		$after_widget  = isset( $args['after_widget'] ) ? $args['after_widget'] : '';
		$before_widget = isset( $args['before_widget'] ) ? $args['before_widget'] : '';
		$instance      = wp_parse_args( (array) $instance, $this->defaults() );

		echo $before_widget; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped

		self::$instance_count ++;

		$this->title( $args, $instance );

		$this->status_messages( $instance );

		if ( Helpers::is_wpcom() && Helpers::is_current_user_subscribed() ) {
			$this->form_already_subscribed( $instance );
		} else {
			$this->subscription_form( $args, $instance, $subscribe_email );
		}

		echo "\n";
		echo $after_widget; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	}

	/**
	 * Widget title.
	 * If show_only_email_and_button is true, we will not show a title.
	 *
	 * @param array $args Display arguments including 'before_title', 'after_title', 'before_widget', and 'after_widget'.
	 * @param array $instance The settings for the particular instance of the widget.
	 */
	private function title( $args, $instance ) {
		$show_only_email_and_button = $instance['show_only_email_and_button'];
		$before_title               = isset( $args['before_title'] ) ? $args['before_title'] : '';
		$after_title                = isset( $args['after_title'] ) ? $args['after_title'] : '';
		$title_label_id             = sprintf(
			'subscribe-field%1$s',
			( absint( self::$instance_count ) > 1
				? '-' . absint( self::$instance_count )
				: ''
			)
		);

		if ( Helpers::is_jetpack() && empty( $show_only_email_and_button ) ) {
			$title = esc_attr( $instance['title'] );
		} elseif ( Helpers::is_wpcom() && empty( $show_only_email_and_button ) ) {
			if ( Helpers::is_current_user_subscribed() ) {
				$title = ( ! empty( $instance['title_following'] ) )
					? sprintf(
						'<label for="%1$s>%2$s</label>',
						$title_label_id,
						esc_attr( $instance['title_following'] )
					)
					: '';
			} else {
				$title = ( ! empty( $instance['title'] ) )
					? sprintf(
						'<label for="%1$s>%2$s</label>',
						$title_label_id,
						esc_attr( $instance['title'] )
					)
					: '';
			}
		} else {
			$title = '';
		}

		echo $before_title; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		echo $title; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Escaped earlier, can contain label HTML tags.
		echo $after_title; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		echo "\n";
	}

	/**
	 * Prints the subscription block's status messages after someone has attempted to subscribe.
	 * Either a success message or an error message.
	 *
	 * @param array $instance The settings for the particular instance of the widget.
	 */
	private function status_messages( $instance ) {
		if (
			Helpers::is_jetpack()
			&& isset( $_GET['subscribe'] ) // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		) {
			$status_message = $this->jetpack_status_messages( $instance );
			printf(
				'<%1$s class="%2$s">%3$s</%1$s>',
				( 'success' === $status_message['status'] ? 'div' : 'p' ),
				esc_attr( $status_message['status'] ),
				wp_kses(
					$status_message['message'],
					self::$allowed_html_tags_for_message
				)
			);
		}

		if (
			Helpers::is_wpcom()
			&& Helpers::has_status_message()
		) {
			global $themecolors;

			$status_message = $this->wpcom_status_messages();
			$style          = sprintf(
				'background-color: #%1$s; border: 1px solid #%2$s; color: #%3$s; padding-left: 5px; padding-right: 5px; margin-bottom: 10px;',
				$themecolors['bg'],
				$themecolors['border'],
				$themecolors['text']
			);

			printf(
				'<div style="%1$s">%2$s</div>',
				esc_attr( $style ),
				wp_kses(
					$status_message,
					self::$allowed_html_tags_for_message
				)
			);
		}
	}

	/**
	 * Prints the subscription block's status messages for Jetpack.
	 *
	 * @param array $instance The settings for the particular instance of the widget.
	 *
	 * @return array $status_message Array of info about the message. Status and message.
	 */
	private function jetpack_status_messages( $instance ) {
		$success_message   = isset( $instance['success_message'] ) ? stripslashes( $instance['success_message'] ) : '';
		$subscribers_total = Helpers::fetch_subscriber_count();

		/*
		 * Defaults.
		 */
		$status  = 'success';
		$message = '';

		switch ( $_GET['subscribe'] ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
			case 'invalid_email':
				$status  = 'error';
				$message = esc_html__( 'The email you entered was invalid. Please check and try again.', 'jetpack' );
				break;
			case 'opted_out':
				$status  = 'error';
				$message = sprintf(
					/* translators: 1: Link to Subscription Management page https://subscribe.wordpress.com/, 2: Description of this link */
					__( 'The email address has opted out of subscription emails. <br /> You can manage your preferences at <a href="%1$s" title="%2$s" target="_blank" rel="noopener noreferrer">subscribe.wordpress.com</a>', 'jetpack' ),
					'https://subscribe.wordpress.com/',
					esc_attr__( 'Manage your email preferences.', 'jetpack' )
				);
				break;
			case 'already':
				$status  = 'error';
				$message = sprintf(
					/* translators: 1: Link to Subscription Management page https://subscribe.wordpress.com/, 2: Description of this link */
					__( 'You have already subscribed to this site. Please check your inbox. <br /> You can manage your preferences at <a href="%1$s" title="%2$s" target="_blank" rel="noopener noreferrer">subscribe.wordpress.com</a>', 'jetpack' ),
					'https://subscribe.wordpress.com/',
					esc_attr__( 'Manage your email preferences.', 'jetpack' )
				);
				break;
			case 'many_pending_subs':
				$status  = 'error';
				$message = sprintf(
					/* translators: 1: Link to Subscription Management page https://subscribe.wordpress.com/, 2: Description of this link */
					__( 'You already have several pending email subscriptions. <br /> Approve or delete a few subscriptions at <a href="%1$s" title="%2$s" target="_blank" rel="noopener noreferrer">subscribe.wordpress.com</a> before continuing.', 'jetpack' ),
					'https://subscribe.wordpress.com/',
					esc_attr__( 'Manage your email preferences.', 'jetpack' )
				);
				break;
			case 'pending':
				$status  = 'error';
				$message = sprintf(
					/* translators: 1: Link to Subscription Management page https://subscribe.wordpress.com/, 2: Description of this link */
					__( 'You subscribed this site before but you have not clicked the confirmation link yet. Please check your inbox. <br /> Otherwise, you can manage your preferences at <a href="%1$s" title="%2$s" target="_blank" rel="noopener noreferrer">subscribe.wordpress.com</a>.', 'jetpack' ),
					'https://subscribe.wordpress.com/',
					esc_attr__( 'Manage your email preferences.', 'jetpack' )
				);
				break;
			case 'success':
				$status  = 'success';
				$message = wpautop(
					str_replace(
						'[total-subscribers]',
						number_format_i18n( $subscribers_total['value'] ),
						$success_message
					)
				);
				break;
			default:
				$status  = 'error';
				$message = esc_html__( 'There was an error when subscribing. Please try again.', 'jetpack' );
				break;
		}

		return array(
			'status'  => $status,
			'message' => $message,
		);
	}

	/**
	 * Prints the subscription block's status messages for WordPress.com.
	 *
	 * @return string $message Status message. Can contain HTML tags.
	 */
	private function wpcom_status_messages() {
		// Message is empty by default.
		$message = '';

		// phpcs:disable WordPress.WP.I18n.MissingArgDomain -- These strings are only used on WordPress.com.
		switch ( $_GET['blogsub'] ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
			case 'confirming':
				$message = sprintf(
					/* translators: placeholder is a link to a contact form. */
					__( 'Thanks for subscribing! You’ll get an email with a link to confirm your subscription. If you don’t get it, please <a href="%1$s" target="_blank" rel="noopener noreferrer">contact us</a>.' ),
					'https://wordpress.com/support/contact/'
				);
				break;
			case 'blocked':
				$message = esc_html__( 'Subscriptions have been blocked for this email address.' );
				break;
			case 'flooded':
				$message = sprintf(
					/* translators: placeholder is a link to our subscription management tool. */
					__( 'You already have several pending email subscriptions. Approve or delete a few through your <a href="%1$s" target="_blank" rel="noopener noreferrer">Subscription Manager</a> before attempting to subscribe to more blogs.' ),
					'https://subscribe.wordpress.com/'
				);
				break;
			case 'spammed':
				$message = sprintf(
					/* translators: placeholder is a link to our subscription management tool. */
					__( 'Because there are many pending subscriptions for this email address, we have blocked the subscription. Please <a href="%1$s" target="_blank" rel="noopener noreferrer">activate or delete</a> pending subscriptions before attempting to subscribe.' ),
					'https://subscribe.wordpress.com/'
				);
				break;
			case 'subscribed':
				$message = esc_html__( 'You are already subscribed to this site.' );
				break;
			case 'pending':
				$message = sprintf(
					/* translators: placeholder is a link to a contact form. */
					__( 'You have a pending subscription already; we just sent you another email. Click the link or <a href="%1$s" target="_blank" rel="noopener noreferrer">contact us</a> if you don’t receive it.' ),
					'https://wordpress.com/support/contact/'
				);
				break;
			case 'confirmed':
				$message = esc_html__( 'Congrats, you’re subscribed! You’ll get an email with the details of your subscription and an unsubscribe link.' );
				break;
		}
		// phpcs:enable WordPress.WP.I18n.MissingArgDomain

		return $message;
	}

	/**
	 * Renders a message to folks who are already subscribed.
	 * Only on WordPress.com.
	 *
	 * @param array $instance The settings for the particular instance of the widget.
	 */
	private function form_already_subscribed( $instance ) {
		$subscribers_total = Helpers::fetch_subscriber_count();
		$edit_subs_url     = 'https://wordpress.com/following/edit/';
		if ( function_exists( 'localized_wpcom_url' ) ) {
			$edit_subs_url = localized_wpcom_url( 'https://wordpress.com/following/edit/', get_user_locale() );
		}
		$show_subscribers_total = (bool) $instance['show_subscribers_total'];

		// phpcs:disable WordPress.WP.I18n.MissingArgDomain -- These strings are only used on WordPress.com.
		if ( $show_subscribers_total && $subscribers_total > 1 ) {
			$subscribers_not_me = $subscribers_total - 1;
			$message            = sprintf(
				/* translators: 1: number of folks following the blog 2: Subscription management URL */
				_n(
					'<p>You are following this blog, along with %1$s other amazing person (<a href="%2$s" target="_blank" rel="noopener noreferrer">manage</a>).</p>',
					'<p>You are following this blog, along with %1$s other amazing people (<a href="%2$s" target="_blank" rel="noopener noreferrer">manage</a>).</p>',
					$subscribers_not_me
				),
				number_format_i18n( $subscribers_not_me ),
				esc_url( $edit_subs_url )
			);
		} else {
			$message = sprintf(
				/* translators: placeholder is a subscription management URL */
				__( '<p>You are following this blog (<a href="%s" target="_blank" rel="noopener noreferrer">manage</a>).</p>' ),
				esc_url( $edit_subs_url )
			);
		}
		// phpcs:enable WordPress.WP.I18n.MissingArgDomain

		echo wp_kses(
			$message,
			self::$allowed_html_tags_for_message
		);
	}

	/**
	 * Renders a form allowing folks to subscribe to the blog.
	 *
	 * @param array  $args            Display arguments including 'before_title', 'after_title', 'before_widget', and 'after_widget'.
	 * @param array  $instance        The settings for the particular instance of the widget.
	 * @param string $subscribe_email The email to use to prefill the form.
	 */
	private function subscription_form( $args, $instance, $subscribe_email ) {
		$widget_id = ! empty( $args['widget_id'] )
			? esc_attr( $args['widget_id'] )
			: wp_rand( 450, 550 );

		if ( Helpers::is_wpcom() && ! Helpers::has_status_message() ) {
			$this->wpcom_subscription_form( $instance, $widget_id );
		}

		if ( Helpers::is_jetpack() ) {
			$this->jetpack_subscription_form( $instance, $subscribe_email, $widget_id );
		}
	}

	/**
	 * Render the form on the frontend of Jetpack sites.
	 *
	 * @param array  $instance        The settings for the particular instance of the widget.
	 * @param string $subscribe_email The email to use to prefill the form.
	 * @param string $widget_id       Unique Widget ID.
	 */
	private function jetpack_subscription_form( $instance, $subscribe_email, $widget_id ) {
		/**
		 * Filter the subscription form's ID prefix.
		 *
		 * @module subscriptions
		 *
		 * @since 2.7.0
		 *
		 * @param string subscribe-field Subscription form field prefix.
		 * @param int    $widget_id      Widget ID.
		 */
		$subscribe_field_id = apply_filters( 'subscribe_field_id', 'subscribe-field', $widget_id );
		$subscribers_total  = Helpers::fetch_subscriber_count();
		?>
		<form action="#" method="post" accept-charset="utf-8" id="subscribe-blog-<?php echo esc_attr( $widget_id ); ?>">
			<?php
			if (
				empty( $instance['show_only_email_and_button'] )
				&& ( ! isset( $_GET['subscribe'] ) || 'success' !== $_GET['subscribe'] ) // phpcs:ignore WordPress.Security.NonceVerification.Recommended
			) {
				printf(
					'<div id="subscribe-text">%1$s</div>',
					wp_kses(
						wpautop(
							str_replace(
								'[total-subscribers]',
								number_format_i18n( $subscribers_total['value'] ),
								$instance['subscribe_text']
							)
						),
						self::$allowed_html_tags_for_message
					)
				);
			}

			if ( $instance['show_subscribers_total'] && 0 < $subscribers_total['value'] ) {
				echo esc_html(
					sprintf( /* translators: %s: number of folks following the blog */
						_n(
							'Join %s other subscriber',
							'Join %s other subscribers',
							$subscribers_total['value'],
							'jetpack'
						),
						number_format_i18n( $subscribers_total['value'] )
					)
				);
			}

			if ( ! isset( $_GET['subscribe'] ) || 'success' !== $_GET['subscribe'] ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
				echo '<p id="subscribe-email">';

				printf(
					'<label id="jetpack-subscribe-label" class="screen-reader-text" for="%1$s">%2$s</label>',
					esc_attr( $subscribe_field_id ) . '-' . esc_attr( $widget_id ),
					! empty( $instance['subscribe_placeholder'] )
						? esc_html( $instance['subscribe_placeholder'] )
						: esc_html__( 'Email Address:', 'jetpack' )
				);

				printf(
					'<input
						type="email"
						name="email"
						required="required"
						class="required"
						value="%1$s"
						id="%2$s"
						placeholder="%3$s"
					/>
					',
					esc_attr( $subscribe_email ),
					esc_attr( $subscribe_field_id ) . '-' . esc_attr( $widget_id ),
					! empty( $instance['subscribe_placeholder'] )
						? esc_attr( $instance['subscribe_placeholder'] )
						: ''
				);

				echo '</p>';

				// Submit button.
				$this->form_submit_button( $widget_id, $instance );
			}
			?>
		</form>
		<?php
	}

	/**
	 * Render the form on the frontend of WordPress.com sites.
	 *
	 * @param array  $instance        The settings for the particular instance of the widget.
	 * @param string $widget_id       Unique Widget ID.
	 */
	private function wpcom_subscription_form( $instance, $widget_id ) {
		$url                 = defined( 'SUBSCRIBE_BLOG_URL' ) ? SUBSCRIBE_BLOG_URL : '';
		$instance_unique_id  = self::$instance_count > 1 ? '-' . self::$instance_count : '';
		$subscribers_total   = Helpers::fetch_subscriber_count();
		$display_subscribers = (bool) $instance['show_subscribers_total'] && 0 < $subscribers_total
			? sprintf(
				/* translators: %s: number of folks following the blog */
				_n( // phpcs:ignore WordPress.WP.I18n.MissingArgDomain
					'Join %s other follower',
					'Join %s other followers',
					$subscribers_total
				),
				number_format_i18n( $subscribers_total )
			)
			: '';
		?>
		<form
			action="<?php echo esc_url( $url ); ?>"
			method="post"
			accept-charset="utf-8"
			id="<?php echo esc_attr( 'subscribe-blog' . $instance_unique_id ); ?>"
		>
			<?php

			if ( is_user_logged_in() ) {
				if (
					empty( $instance['show_only_email_and_button'] )
					&& ! empty( $instance['subscribe_logged_in'] )
				) {
					echo wp_kses(
						wpautop( $instance['subscribe_logged_in'] ),
						self::$allowed_html_tags_for_message
					);
				}
				echo esc_html( $display_subscribers );
			} else {
				if ( empty( $instance['show_only_email_and_button'] ) ) {
					echo wp_kses(
						wpautop( $instance['subscribe_text'] ),
						self::$allowed_html_tags_for_message
					);
				}
				echo esc_html( $display_subscribers );

				echo '<p>';

				printf(
					'<input
						type="text"
						name="email"
						style="width: 95%; padding: 1px 10px"
						placeholder="%1$s"
						value=""
						id="%2$s"
					/>',
					esc_attr__( 'Enter your email address', 'jetpack' ),
					esc_attr( 'subscribe-field' . $instance_unique_id )
				);

				echo '</p>';
			}

			// Submit button.
			$this->form_submit_button( $widget_id, $instance );

			?>

		</form>
		<?php
	}

	/**
	 * Submit a Subscription form.
	 *
	 * @param string $widget_id Unique Widget ID.
	 * @param array  $instance  The settings for the particular instance of the widget.
	 */
	private function form_submit_button( $widget_id, $instance ) {
		$referer          = ( is_ssl() ? 'https' : 'http' ) . '://' . $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI'];
		$source           = 'widget';
		$subscribe_button = ! empty( $instance['submit_button_text'] )
			? $instance['submit_button_text']
			: $instance['subscribe_button'];

		if ( Helpers::is_wpcom() ) {
			global $current_blog;
			$blog_id = $current_blog->blog_id;
		} else {
			$blog_id = get_current_blog_id();
		}

		?>
		<p id="subscribe-submit">
			<input type="hidden" name="action" value="subscribe"/>
			<?php if ( Helpers::is_wpcom() ) { ?>
			<input type="hidden" name="blog_id" value="<?php echo absint( $blog_id ); ?>"/>
			<?php } ?>
			<input type="hidden" name="source" value="<?php echo esc_url( $referer ); ?>"/>
			<input type="hidden" name="sub-type" value="<?php echo esc_url( $source ); ?>"/>
			<input type="hidden" name="redirect_fragment" value="<?php echo esc_attr( $widget_id ); ?>"/>
			<?php
			if ( is_user_logged_in() || Helpers::is_wpcom() ) {
				wp_nonce_field( 'blogsub_subscribe_' . absint( $blog_id ) . '_wpnonce', false );
			}
			?>
			<button
				type="submit"
				<?php if ( ! empty( $instance['submit_button_classes'] ) ) { ?>
					class="<?php echo esc_attr( $instance['submit_button_classes'] ); ?>"
				<?php } ?>
				<?php if ( ! empty( $instance['submit_button_styles'] ) ) { ?>
					style="<?php echo esc_attr( $instance['submit_button_styles'] ); ?>"
				<?php } ?>
				<?php if ( Helpers::is_jetpack() ) { ?>
					name="jetpack_subscriptions_widget"
				<?php } ?>
			>
			<?php
				echo wp_kses(
					$subscribe_button,
					self::$allowed_html_tags_for_submit_button
				);
			?>
			</button>
		</p>
		<?php
	}
}
