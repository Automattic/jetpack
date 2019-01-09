<?php

class Jetpack_Subscriptions_Widget extends WP_Widget {
	static $instance_count = 0;

	function __construct() {
		$widget_ops = array(
			'classname'                   => 'widget_blog_subscription jetpack_subscription_widget',
			'description'                 => esc_html__( 'Add an email signup form to allow people to subscribe to your blog.', 'jetpack' ),
			'customize_selective_refresh' => true,
		);

		$name = self::is_jetpack() ?
			/** This filter is documented in modules/widgets/facebook-likebox.php */
			apply_filters( 'jetpack_widget_name', __( 'Blog Subscriptions', 'jetpack' ) ) :
			__( 'Follow Blog', 'jetpack' );

		parent::__construct(
			'blog_subscription',
			$name,
			$widget_ops
		);

		if ( self::is_jetpack() &&
			 (
				 is_active_widget( false, false, $this->id_base ) ||
				 is_active_widget( false, false, 'monster' ) ||
				 is_customize_preview()
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
	function enqueue_style() {
		wp_register_style(
			'jetpack-subscriptions',
			plugins_url( 'subscriptions.css', __FILE__ ),
			array(),
			JETPACK__VERSION
		);
		wp_enqueue_style( 'jetpack-subscriptions' );
	}

	/**
	 * Renders a full widget either within the context of WordPress widget, or in response to a shortcode.
	 *
	 * @param array $args Display arguments including 'before_title', 'after_title', 'before_widget', and 'after_widget'.
	 * @param array $instance The settings for the particular instance of the widget.
	 */
	function widget( $args, $instance ) {
		if ( self::is_jetpack() &&
		     /** This filter is documented in modules/contact-form/grunion-contact-form.php */
			 false === apply_filters( 'jetpack_auto_fill_logged_in_user', false )
		) {
			$subscribe_email = '';
		} else {
			$current_user = wp_get_current_user();
			if ( ! empty( $current_user->user_email ) ) {
				$subscribe_email = esc_attr( $current_user->user_email );
			} else {
				$subscribe_email = '';
			}
		}

		$stats_action = self::is_jetpack() ? 'jetpack_subscriptions' : 'follow_blog';
		/** This action is documented in modules/widgets/gravatar-profile.php */
		do_action( 'jetpack_stats_extra', 'widget_view', $stats_action );

		$after_widget  = isset( $args['after_widget'] ) ? $args['after_widget'] : '';
		$before_widget = isset( $args['before_widget'] ) ? $args['before_widget'] : '';
		$instance      = wp_parse_args( (array) $instance, $this->defaults() );

		echo $before_widget;

		Jetpack_Subscriptions_Widget::$instance_count ++;

		self::render_widget_title( $args, $instance );

		self::render_widget_status_messages( $instance );

		if ( self::is_current_user_subscribed() ) {
			self::render_widget_already_subscribed( $instance );
		} else {
			self::render_widget_subscription_form( $args, $instance, $subscribe_email );
		}

		echo "\n" . $after_widget;
	}

	/**
	 * Prints the widget's title. If show_only_email_and_button is true, we will not show a title.
	 *
	 * @param array $args Display arguments including 'before_title', 'after_title', 'before_widget', and 'after_widget'.
	 * @param array $instance The settings for the particular instance of the widget.
	 */
	static function render_widget_title( $args, $instance ) {
		$show_only_email_and_button = $instance['show_only_email_and_button'];
		$before_title               = isset( $args['before_title'] ) ? $args['before_title'] : '';
		$after_title                = isset( $args['after_title'] ) ? $args['after_title'] : '';
		if ( self::is_wpcom() && ! $show_only_email_and_button ) {
			if ( self::is_current_user_subscribed() ) {
				if ( ! empty( $instance['title_following'] ) ) {
					echo $before_title . '<label for="subscribe-field' . ( Jetpack_Subscriptions_Widget::$instance_count > 1 ? '-' . Jetpack_Subscriptions_Widget::$instance_count : '' ) . '">' . esc_attr( $instance['title_following'] ) . '</label>' . $after_title . "\n";
				}
			} else {
				if ( ! empty( $instance['title'] ) ) {
					echo $before_title . '<label for="subscribe-field' . ( Jetpack_Subscriptions_Widget::$instance_count > 1 ? '-' . Jetpack_Subscriptions_Widget::$instance_count : '' ) . '">' . esc_attr( $instance['title'] ) . '</label>' . $after_title . "\n";
				}
			}
		}

		if ( self::is_jetpack() && empty( $instance['show_only_email_and_button'] ) ) {
			echo $args['before_title'] . esc_attr( $instance['title'] ) . $args['after_title'] . "\n";
		}
	}

	/**
	 * Prints the subscription block's status messages after someone has attempted to subscribe.
	 * Either a success message or an error message.
	 *
	 * @param array $instance The settings for the particular instance of the widget.
	 */
	static function render_widget_status_messages( $instance ) {
		if ( self::is_jetpack() && isset( $_GET['subscribe'] ) ) {
			$success_message   = isset( $instance['success_message'] ) ? stripslashes( $instance['success_message'] ) : '';
			$subscribers_total = self::fetch_subscriber_count();
			switch ( $_GET['subscribe'] ) :
				case 'invalid_email' : ?>
					<p class="error"><?php esc_html_e( 'The email you entered was invalid. Please check and try again.', 'jetpack' ); ?></p>
					<?php break;
				case 'opted_out' : ?>
					<p class="error"><?php printf( __( 'The email address has opted out of subscription emails. <br /> You can manage your preferences at <a href="%1$s" title="%2$s" target="_blank">subscribe.wordpress.com</a>', 'jetpack' ),
							'https://subscribe.wordpress.com/',
							__( 'Manage your email preferences.', 'jetpack' )
						); ?></p>
					<?php break;
				case 'already' : ?>
					<p class="error"><?php printf( __( 'You have already subscribed to this site. Please check your inbox. <br /> You can manage your preferences at <a href="%1$s" title="%2$s" target="_blank">subscribe.wordpress.com</a>', 'jetpack' ),
							'https://subscribe.wordpress.com/',
							__( 'Manage your email preferences.', 'jetpack' )
						); ?></p>
					<?php break;
				case 'success' : ?>
					<div class="success"><?php echo wpautop( str_replace( '[total-subscribers]', number_format_i18n( $subscribers_total['value'] ), $success_message ) ); ?></div>
					<?php break;
				default : ?>
					<p class="error"><?php esc_html_e( 'There was an error when subscribing. Please try again.', 'jetpack' ); ?></p>
					<?php break;
			endswitch;
		}

		if ( self::is_wpcom() && self::wpcom_has_status_message() ) {
			global $themecolors;
			switch ( $_GET['blogsub'] ) {
				case 'confirming':
					echo "<div style='background-color: #{$themecolors['bg']}; border: 1px solid #{$themecolors['border']}; color: #{$themecolors['text']}; padding-left: 5px; padding-right: 5px; margin-bottom: 10px;'>";
					_e( 'Thanks for subscribing! You&rsquo;ll get an email with a link to confirm your subscription. If you don&rsquo;t get it, please <a href="http://en.support.wordpress.com/contact/">contact us</a>.' );
					echo "</div>";
					break;
				case 'blocked':
					echo "<div style='background-color: #{$themecolors['bg']}; border: 1px solid #{$themecolors['border']}; color: #{$themecolors['text']}; padding-left: 5px; padding-right: 5px; margin-bottom: 10px;'>";
					_e( 'Subscriptions have been blocked for this email address.' );
					echo "</div>";
					break;
				case 'flooded':
					echo "<div style='background-color: #{$themecolors['bg']}; border: 1px solid #{$themecolors['border']}; color: #{$themecolors['text']}; padding-left: 5px; padding-right: 5px; margin-bottom: 10px;'>";
					_e( 'You already have several pending email subscriptions. Approve or delete a few through your <a href="https://subscribe.wordpress.com/">Subscription Manager</a> before attempting to subscribe to more blogs.' );
					echo "</div>";
					break;
				case 'spammed':
					echo "<div style='background-color: #{$themecolors['bg']}; border: 1px solid #{$themecolors['border']}; color: #{$themecolors['text']}; padding-left: 5px; padding-right: 5px; margin-bottom: 10px;'>";
					echo wp_kses_post( sprintf( __( 'Because there are many pending subscriptions for this email address, we have blocked the subscription. Please <a href="%s">activate or delete</a> pending subscriptions before attempting to subscribe.' ), 'https://subscribe.wordpress.com/' ) );
					echo "</div>";
					break;
				case 'subscribed':
					echo "<div style='background-color: #{$themecolors['bg']}; border: 1px solid #{$themecolors['border']}; color: #{$themecolors['text']}; padding-left: 5px; padding-right: 5px; margin-bottom: 10px;'>";
					_e( 'You&rsquo;re already subscribed to this site.' );
					echo "</div>";
					break;
				case 'pending':
					echo "<div style='background-color: #{$themecolors['bg']}; border: 1px solid #{$themecolors['border']}; color: #{$themecolors['text']}; padding-left: 5px; padding-right: 5px; margin-bottom: 10px;'>";
					_e( 'You have a pending subscription already; we just sent you another email. Click the link or <a href="http://en.support.wordpress.com/contact/">contact us</a> if you don&rsquo;t receive it.' );
					echo "</div>";
					break;
				case 'confirmed':
					echo "<div style='background-color: #{$themecolors['bg']}; border: 1px solid #{$themecolors['border']}; color: #{$themecolors['text']}; padding-left: 5px; padding-right: 5px; margin-bottom: 10px;'>";
					_e( 'Congrats, you&rsquo;re subscribed! You&rsquo;ll get an email with the details of your subscription and an unsubscribe link.' );
					echo "</div>";
					break;
			}
		}
	}

	/**
	 * Renders a message to folks who are already subscribed.
	 *
	 * @param array $instance The settings for the particular instance of the widget.
	 *
	 * @return void
	 */
	static function render_widget_already_subscribed( $instance ) {
		if ( self::is_wpcom() ) {
			$subscribers_total = self::fetch_subscriber_count();
			/**
			 * Filter the url for folks to manage their subscriptions.
			 *
			 * @module subscriptions
			 *
			 * @since 6.9
			 *
			 * @param string $url Defaults to https://wordpress.com/following/edit/
			 */
			$edit_subs_url          = apply_filters( 'jetpack_subscriptions_management_url', 'https://wordpress.com/following/edit/' );
			$show_subscribers_total = (bool) $instance['show_subscribers_total'];
			if ( $show_subscribers_total && $subscribers_total > 1 ) :
				$subscribers_not_me = $subscribers_total - 1;
				?>
				<p><?php printf( _n( 'You are following this blog, along with %s other amazing person (<a href="%s">manage</a>).', 'You are following this blog, along with %s other amazing people (<a href="%s">manage</a>).', $subscribers_not_me ), number_format_i18n( $subscribers_not_me ), $edit_subs_url ) ?></p><?php
			else :
				?>
				<p><?php printf( __( 'You are following this blog (<a href="%s">manage</a>).' ), $edit_subs_url ) ?></p><?php
			endif;
		}
	}

	/**
	 * Renders a form allowing folks to subscribe to the blog.
	 *
	 * @param array $args Display arguments including 'before_title', 'after_title', 'before_widget', and 'after_widget'.
	 * @param array $instance The settings for the particular instance of the widget.
	 * @param string $subscribe_email The email to use to prefill the form.
	 */
	static function render_widget_subscription_form( $args, $instance, $subscribe_email ) {
		$show_only_email_and_button = $instance['show_only_email_and_button'];
		$subscribe_logged_in        = isset( $instance['subscribe_logged_in'] ) ? stripslashes( $instance['subscribe_logged_in'] ) : '';
		$show_subscribers_total     = (bool) $instance['show_subscribers_total'];
		$subscribe_text             = empty( $instance['show_only_email_and_button'] ) ?
			stripslashes( $instance['subscribe_text'] ) :
			false;
		$referer                    = ( is_ssl() ? 'https' : 'http' ) . '://' . $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI'];
		$source                     = 'widget';
		$widget_id                  = esc_attr( ! empty( $args['widget_id'] ) ? esc_attr( $args['widget_id'] ) : mt_rand( 450, 550 ) );
		$subscribe_button           = stripslashes( $instance['subscribe_button'] );
		$subscribers_total          = self::fetch_subscriber_count();
		$subscribe_placeholder      = isset( $instance['subscribe_placeholder'] ) ? stripslashes( $instance['subscribe_placeholder'] ) : '';

		if ( self::is_wpcom() && ! self::wpcom_has_status_message() ) {
			global $current_blog;
			$url = defined( 'SUBSCRIBE_BLOG_URL' ) ? SUBSCRIBE_BLOG_URL : '';
			?>
			<form action="<?php echo $url; ?>" method="post" accept-charset="utf-8"
				  id="subscribe-blog<?php if ( Jetpack_Subscriptions_Widget::$instance_count > 1 ) {
					  echo '-' . Jetpack_Subscriptions_Widget::$instance_count;
				  } ?>">
				<?php if ( is_user_logged_in() ) : ?>
					<?php
					if ( ! $show_only_email_and_button ) {
						echo wpautop( $subscribe_logged_in );
					}
					if ( $show_subscribers_total && $subscribers_total ) {
						echo wpautop( sprintf( _n( 'Join %s other follower', 'Join %s other followers', $subscribers_total ), number_format_i18n( $subscribers_total ) ) );
					}
					?>
				<?php else : ?>
					<?php
					if ( ! $show_only_email_and_button ) {
						echo wpautop( $subscribe_text );
					}
					if ( $show_subscribers_total && $subscribers_total ) {
						echo wpautop( sprintf( _n( 'Join %s other follower', 'Join %s other followers', $subscribers_total ), number_format_i18n( $subscribers_total ) ) );
					}
					?>
					<p><input type="text" name="email" style="width: 95%; padding: 1px 2px"
							  placeholder="<?php esc_attr_e( 'Enter your email address' ); ?>" value=""
							  id="subscribe-field<?php if ( Jetpack_Subscriptions_Widget::$instance_count > 1 ) {
								  echo '-' . Jetpack_Subscriptions_Widget::$instance_count;
							  } ?>"/></p>
				<?php endif; ?>

				<p>
					<input type="hidden" name="action" value="subscribe"/>
					<input type="hidden" name="blog_id" value="<?php echo (int) $current_blog->blog_id; ?>"/>
					<input type="hidden" name="source" value="<?php echo esc_url( $referer ); ?>"/>
					<input type="hidden" name="sub-type" value="<?php echo esc_attr( $source ); ?>"/>
					<input type="hidden" name="redirect_fragment" value="<?php echo esc_attr( $widget_id ); ?>"/>
					<?php wp_nonce_field( 'blogsub_subscribe_' . $current_blog->blog_id, '_wpnonce', false ); ?>
					<input type="submit" value="<?php echo esc_attr( $subscribe_button ); ?>"/>
				</p>
			</form>
			<?php
		}

		if ( self::is_jetpack() ) {
			/**
			 * Filter the subscription form's ID prefix.
			 *
			 * @module subscriptions
			 *
			 * @since 2.7.0
			 *
			 * @param string subscribe-field Subscription form field prefix.
			 * @param int $widget_id Widget ID.
			 */
			$subscribe_field_id = apply_filters( 'subscribe_field_id', 'subscribe-field', $widget_id );
			?>
			<form action="#" method="post" accept-charset="utf-8" id="subscribe-blog-<?php echo $widget_id; ?>">
				<?php
				if ( $subscribe_text && ( ! isset ( $_GET['subscribe'] ) || 'success' != $_GET['subscribe'] ) ) {
					?>
					<div id="subscribe-text"><?php echo wpautop( str_replace( '[total-subscribers]', number_format_i18n( $subscribers_total['value'] ), $subscribe_text ) ); ?></div><?php
				}

				if ( $show_subscribers_total && 0 < $subscribers_total['value'] ) {
					echo wpautop( sprintf( _n( 'Join %s other subscriber', 'Join %s other subscribers', $subscribers_total['value'], 'jetpack' ), number_format_i18n( $subscribers_total['value'] ) ) );
				}
				if ( ! isset ( $_GET['subscribe'] ) || 'success' != $_GET['subscribe'] ) { ?>
					<p id="subscribe-email">
						<label id="jetpack-subscribe-label"
							   for="<?php echo esc_attr( $subscribe_field_id ) . '-' . esc_attr( $widget_id ); ?>">
							<?php echo ! empty( $subscribe_placeholder ) ? esc_html( $subscribe_placeholder ) : esc_html__( 'Email Address:', 'jetpack' ); ?>
						</label>
						<input type="email" name="email" required="required" class="required"
							   value="<?php echo esc_attr( $subscribe_email ); ?>"
							   id="<?php echo esc_attr( $subscribe_field_id ) . '-' . esc_attr( $widget_id ); ?>"
							   placeholder="<?php echo esc_attr( $subscribe_placeholder ); ?>"/>
					</p>

					<p id="subscribe-submit">
						<input type="hidden" name="action" value="subscribe"/>
						<input type="hidden" name="source" value="<?php echo esc_url( $referer ); ?>"/>
						<input type="hidden" name="sub-type" value="<?php echo esc_attr( $source ); ?>"/>
						<input type="hidden" name="redirect_fragment" value="<?php echo $widget_id; ?>"/>
						<?php
						if ( is_user_logged_in() ) {
							wp_nonce_field( 'blogsub_subscribe_' . get_current_blog_id(), '_wpnonce', false );
						}
						?>
						<input type="submit" value="<?php echo esc_attr( $subscribe_button ); ?>"
							   name="jetpack_subscriptions_widget"/>
					</p>
				<?php } ?>
			</form>

			<script>
				/*
				Custom functionality for safari and IE
				 */
				( function( d ) {
					// In case the placeholder functionality is available we remove labels
					if (( 'placeholder' in d.createElement( 'input' ) )) {
						var label = d.querySelector( 'label[for=subscribe-field-<?php echo $widget_id; ?>]' );
						label.style.clip = 'rect(1px, 1px, 1px, 1px)';
						label.style.position = 'absolute';
						label.style.height = '1px';
						label.style.width = '1px';
						label.style.overflow = 'hidden';
					}

					// Make sure the email value is filled in before allowing submit
					var form = d.getElementById( 'subscribe-blog-<?php echo $widget_id; ?>' ),
						input = d.getElementById( '<?php echo esc_attr( $subscribe_field_id ) . '-' . esc_attr( $widget_id ); ?>' ),
						handler = function( event ) {
							if ('' === input.value) {
								input.focus();

								if (event.preventDefault) {
									event.preventDefault();
								}

								return false;
							}
						};

					if (window.addEventListener) {
						form.addEventListener( 'submit', handler, false );
					} else {
						form.attachEvent( 'onsubmit', handler );
					}
				} )( document );
			</script>
		<?php }
	}

	/**
	 * Determines if the current user is subscribed to the blog.
	 *
	 * @return bool Is the person already subscribed.
	 */
	static function is_current_user_subscribed() {
		$subscribed = isset( $_GET['subscribe'] ) && 'success' == $_GET['subscribe'];

		/**
		 * Filter if the current user is subscribed to the blog.
		 *
		 * @module subscriptions
		 *
		 * @since 6.9
		 *
		 * @param bool $subscribed Is current user subscribed.
		 */
		return apply_filters( 'jetpack_subscription_widget_is_subscribed', $subscribed );
	}

	/**
	 * Is this script running in the wordpress.com environment?
	 *
	 * @return bool
	 */
	static function is_wpcom() {
		return defined( 'IS_WPCOM' ) && IS_WPCOM;
	}

	/**
	 * Is this script running in a self-hosted environment?
	 *
	 * @return bool
	 */
	static function is_jetpack() {
		return ! self::is_wpcom();
	}

	/**
	 * Used to determine if there is a valid status slug within the wordpress.com environment.
	 *
	 * @return bool
	 */
	static function wpcom_has_status_message() {
		return isset( $_GET['blogsub'] ) &&
			   in_array(
				   $_GET['blogsub'],
				   array(
					   'confirming',
					   'blocked',
					   'flooded',
					   'spammed',
					   'subscribed',
					   'pending',
					   'confirmed',
				   )
			   );
	}

	/**
	 * Determine the amount of folks currently subscribed to the blog.
	 *
	 * @return int|array
	 */
	static function fetch_subscriber_count() {
		$subs_count = 0;

		if ( self::is_jetpack() ) {
			$subs_count = get_transient( 'wpcom_subscribers_total' );
			if ( false === $subs_count || 'failed' == $subs_count['status'] ) {
				Jetpack::load_xml_rpc_client();

				$xml = new Jetpack_IXR_Client( array( 'user_id' => JETPACK_MASTER_USER, ) );

				$xml->query( 'jetpack.fetchSubscriberCount' );

				if ( $xml->isError() ) { // if we get an error from .com, set the status to failed so that we will try again next time the data is requested
					$subs_count = array(
						'status'  => 'failed',
						'code'    => $xml->getErrorCode(),
						'message' => $xml->getErrorMessage(),
						'value'   => ( isset( $subs_count['value'] ) ) ? $subs_count['value'] : 0,
					);
				} else {
					$subs_count = array(
						'status' => 'success',
						'value'  => $xml->getResponse(),
					);
				}

				set_transient( 'wpcom_subscribers_total', $subs_count, 3600 ); // try to cache the result for at least 1 hour
			}
		}

		/**
		 * Filter the total amount of subscribers
		 *
		 * @module subscriptions
		 *
		 * @since 6.9
		 *
		 * @param int|array $subscribed Information about the total amount of subscribers.
		 */
		return apply_filters( 'jetpack_subscription_widget_total_subscribers', $subs_count );
	}

	/**
	 * Updates a particular instance of a widget when someone saves it in wp-admin.
	 *
	 * @param array $new_instance
	 * @param array $old_instance
	 *
	 * @return array
	 */
	function update( $new_instance, $old_instance ) {
		$instance = $old_instance;

		if ( self::is_jetpack() ) {
			$instance['title']                 = wp_kses( stripslashes( $new_instance['title'] ), array() );
			$instance['subscribe_placeholder'] = wp_kses( stripslashes( $new_instance['subscribe_placeholder'] ), array() );
			$instance['subscribe_button']      = wp_kses( stripslashes( $new_instance['subscribe_button'] ), array() );
			$instance['success_message']       = wp_kses( stripslashes( $new_instance['success_message'] ), array() );
		}

		if ( self::is_wpcom() ) {
			$instance['title']               = strip_tags( stripslashes( $new_instance['title'] ) );
			$instance['title_following']     = strip_tags( stripslashes( $new_instance['title_following'] ) );
			$instance['subscribe_logged_in'] = wp_filter_post_kses( stripslashes( $new_instance['subscribe_logged_in'] ) );
			$instance['subscribe_button']    = strip_tags( stripslashes( $new_instance['subscribe_button'] ) );
		}

		$instance['show_subscribers_total']     = isset( $new_instance['show_subscribers_total'] ) && $new_instance['show_subscribers_total'];
		$instance['show_only_email_and_button'] = isset( $new_instance['show_only_email_and_button'] ) && $new_instance['show_only_email_and_button'];
		$instance['subscribe_text']             = wp_filter_post_kses( stripslashes( $new_instance['subscribe_text'] ) );

		return $instance;
	}

	/**
	 * The default args for rendering a subscription form.
	 *
	 * @return array
	 */
	static function defaults() {
		$defaults = array(
			'show_subscribers_total'     => true,
			'show_only_email_and_button' => false
		);

		if ( self::is_jetpack() ) {
			$defaults['title']                 = esc_html__( 'Subscribe to Blog via Email', 'jetpack' );
			$defaults['subscribe_text']        = esc_html__( 'Enter your email address to subscribe to this blog and receive notifications of new posts by email.', 'jetpack' );
			$defaults['subscribe_placeholder'] = esc_html__( 'Email Address', 'jetpack' );
			$defaults['subscribe_button']      = esc_html__( 'Subscribe', 'jetpack' );
			$defaults['success_message']       = esc_html__( "Success! An email was just sent to confirm your subscription. Please find the email now and click 'Confirm Follow' to start subscribing.", 'jetpack' );
		}

		if ( self::is_wpcom() ) {
			$defaults['title']               = __( 'Follow Blog via Email' );
			$defaults['title_following']     = __( 'You are following this blog' );
			$defaults['subscribe_text']      = __( 'Enter your email address to follow this blog and receive notifications of new posts by email.' );
			$defaults['subscribe_button']    = __( 'Follow' );
			$defaults['subscribe_logged_in'] = __( 'Click to follow this blog and receive notifications of new posts by email.' );
		}

		return $defaults;
	}

	/**
	 * Renders the widget's options form in wp-admin.
	 *
	 * @param array $instance
	 */
	function form( $instance ) {
		$instance               = wp_parse_args( (array) $instance, $this->defaults() );
		$show_subscribers_total = checked( $instance['show_subscribers_total'], true, false );


		if ( self::is_wpcom() ) {
			$title               = esc_attr( stripslashes( $instance['title'] ) );
			$title_following     = esc_attr( stripslashes( $instance['title_following'] ) );
			$subscribe_text      = esc_attr( stripslashes( $instance['subscribe_text'] ) );
			$subscribe_logged_in = esc_attr( stripslashes( $instance['subscribe_logged_in'] ) );
			$subscribe_button    = esc_attr( stripslashes( $instance['subscribe_button'] ) );
			$subscribers_total   = self::fetch_subscriber_count();
		}

		if ( self::is_jetpack() ) {
			$title                 = stripslashes( $instance['title'] );
			$subscribe_text        = stripslashes( $instance['subscribe_text'] );
			$subscribe_placeholder = stripslashes( $instance['subscribe_placeholder'] );
			$subscribe_button      = stripslashes( $instance['subscribe_button'] );
			$success_message       = stripslashes( $instance['success_message'] );
			$subs_fetch            = self::fetch_subscriber_count();
			if ( 'failed' == $subs_fetch['status'] ) {
				printf( '<div class="error inline"><p>' . __( '%s: %s', 'jetpack' ) . '</p></div>', esc_html( $subs_fetch['code'] ), esc_html( $subs_fetch['message'] ) );
			}
			$subscribers_total = number_format_i18n( $subs_fetch['value'] );
		}

		if ( self::is_wpcom() ) : ?>
			<p>
				<label for="<?php echo $this->get_field_id( 'title' ); ?>">
					<?php _e( 'Widget title for non-followers:' ); ?>
					<input class="widefat" id="<?php echo $this->get_field_id( 'title' ); ?>"
						   name="<?php echo $this->get_field_name( 'title' ); ?>" type="text"
						   value="<?php echo $title; ?>"/>
				</label>
			</p>
			<p>
				<label for="<?php echo $this->get_field_id( 'title_following' ); ?>">
					<?php _e( 'Widget title for followers:' ); ?>
					<input class="widefat" id="<?php echo $this->get_field_id( 'title_following' ); ?>"
						   name="<?php echo $this->get_field_name( 'title_following' ); ?>" type="text"
						   value="<?php echo $title_following; ?>"/>
				</label>
			</p>
			<p>
				<label for="<?php echo $this->get_field_id( 'subscribe_logged_in' ); ?>">
					<?php _e( 'Optional text to display to logged in WordPress.com users:' ); ?>
					<textarea style="width: 95%" id="<?php echo $this->get_field_id( 'subscribe_logged_in' ); ?>"
							  name="<?php echo $this->get_field_name( 'subscribe_logged_in' ); ?>"
							  type="text"><?php echo $subscribe_logged_in; ?></textarea>
				</label>
			</p>
			<p>
				<label for="<?php echo $this->get_field_id( 'subscribe_text' ); ?>">
					<?php _e( 'Optional text to display to non-WordPress.com users:' ); ?>
					<textarea style="width: 95%" id="<?php echo $this->get_field_id( 'subscribe_text' ); ?>"
							  name="<?php echo $this->get_field_name( 'subscribe_text' ); ?>"
							  type="text"><?php echo $subscribe_text; ?></textarea>
				</label>
			</p>
			<p>
				<label for="<?php echo $this->get_field_id( 'subscribe_button' ); ?>">
					<?php _e( 'Follow Button Text:' ); ?>
					<input class="widefat" id="<?php echo $this->get_field_id( 'subscribe_button' ); ?>"
						   name="<?php echo $this->get_field_name( 'subscribe_button' ); ?>" type="text"
						   value="<?php echo $subscribe_button; ?>"/>
				</label>
			</p>
			<p>
				<label for="<?php echo $this->get_field_id( 'show_subscribers_total' ); ?>">
					<input type="checkbox" id="<?php echo $this->get_field_id( 'show_subscribers_total' ); ?>"
						   name="<?php echo $this->get_field_name( 'show_subscribers_total' ); ?>"
						   value="1"<?php echo $show_subscribers_total; ?> />
					<?php echo esc_html( sprintf( _n( 'Show total number of followers? (%s follower)', 'Show total number of followers? (%s followers)', $subscribers_total ), number_format_i18n( $subscribers_total ) ) ); ?>
				</label>
			</p>
		<?php endif;

		if ( self::is_jetpack() ) : ?>
			<p>
				<label for="<?php echo $this->get_field_id( 'title' ); ?>">
					<?php _e( 'Widget title:', 'jetpack' ); ?>
					<input class="widefat" id="<?php echo $this->get_field_id( 'title' ); ?>"
						   name="<?php echo $this->get_field_name( 'title' ); ?>" type="text"
						   value="<?php echo esc_attr( $title ); ?>"/>
				</label>
			</p>
			<p>
				<label for="<?php echo $this->get_field_id( 'subscribe_text' ); ?>">
					<?php _e( 'Optional text to display to your readers:', 'jetpack' ); ?>
					<textarea class="widefat" id="<?php echo $this->get_field_id( 'subscribe_text' ); ?>"
							  name="<?php echo $this->get_field_name( 'subscribe_text' ); ?>"
							  rows="3"><?php echo esc_html( $subscribe_text ); ?></textarea>
				</label>
			</p>
			<p>
				<label for="<?php echo $this->get_field_id( 'subscribe_placeholder' ); ?>">
					<?php esc_html_e( 'Subscribe Placeholder:', 'jetpack' ); ?>
					<input class="widefat" id="<?php echo $this->get_field_id( 'subscribe_placeholder' ); ?>"
						   name="<?php echo $this->get_field_name( 'subscribe_placeholder' ); ?>" type="text"
						   value="<?php echo esc_attr( $subscribe_placeholder ); ?>"/>
				</label>
			</p>
			<p>
				<label for="<?php echo $this->get_field_id( 'subscribe_button' ); ?>">
					<?php _e( 'Subscribe Button:', 'jetpack' ); ?>
					<input class="widefat" id="<?php echo $this->get_field_id( 'subscribe_button' ); ?>"
						   name="<?php echo $this->get_field_name( 'subscribe_button' ); ?>" type="text"
						   value="<?php echo esc_attr( $subscribe_button ); ?>"/>
				</label>
			</p>
			<p>
				<label for="<?php echo $this->get_field_id( 'success_message' ); ?>">
					<?php _e( 'Success Message Text:', 'jetpack' ); ?>
					<textarea class="widefat" id="<?php echo $this->get_field_id( 'success_message' ); ?>"
							  name="<?php echo $this->get_field_name( 'success_message' ); ?>"
							  rows="5"><?php echo esc_html( $success_message ); ?></textarea>
				</label>
			</p>
			<p>
				<label for="<?php echo $this->get_field_id( 'show_subscribers_total' ); ?>">
					<input type="checkbox" id="<?php echo $this->get_field_id( 'show_subscribers_total' ); ?>"
						   name="<?php echo $this->get_field_name( 'show_subscribers_total' ); ?>"
						   value="1"<?php echo $show_subscribers_total; ?> />
					<?php echo esc_html( sprintf( _n( 'Show total number of subscribers? (%s subscriber)', 'Show total number of subscribers? (%s subscribers)', $subscribers_total, 'jetpack' ), $subscribers_total ) ); ?>
				</label>
			</p>
		<?php endif;
	}
}

function jetpack_do_subscription_form( $instance ) {
	if ( empty( $instance ) || ! is_array( $instance ) ) {
		$instance = array();
	}
	$instance['show_subscribers_total'] = empty( $instance['show_subscribers_total'] ) || 'false' === $instance['show_subscribers_total'] ? false : true;
	$show_only_email_and_button         = isset( $instance['show_only_email_and_button'] ) ? $instance['show_only_email_and_button'] : false;

	$instance = shortcode_atts(
		Jetpack_Subscriptions_Widget::defaults(),
		$instance,
		'jetpack_subscription_form'
	);

	$instance['show_only_email_and_button'] = $show_only_email_and_button;

	$args = array(
		'before_widget' => sprintf( '<div class="%s">', 'jetpack_subscription_widget' ),
	);
	ob_start();
	the_widget( 'Jetpack_Subscriptions_Widget', $instance, $args );
	$output = ob_get_clean();

	return $output;
}

function jetpack_blog_subscriptions_init() {
	register_widget( 'Jetpack_Subscriptions_Widget' );
}

add_action( 'widgets_init', 'jetpack_blog_subscriptions_init' );

add_shortcode( 'jetpack_subscription_form', 'jetpack_do_subscription_form' );
add_shortcode( 'blog_subscription_form', 'jetpack_do_subscription_form' );
jetpack_register_block( 'subscriptions' );
