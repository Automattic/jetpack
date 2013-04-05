<?php
/**
 * Module Name: Subscriptions
 * Module Description: Allow users to subscribe to your posts and comments to receive a notification via email.
 * Sort Order: 3
 * First Introduced: 1.2
 * Requires Connection: Yes
 */

add_action( 'jetpack_modules_loaded', 'jetpack_subscriptions_load' );

Jetpack_Sync::sync_options( __FILE__,
	'home',
	'blogname',
	'siteurl',
	'page_on_front',
	'permalink_structure',
	'category_base',
	'rss_use_excerpt',
	'subscription_options',
	'stb_enabled',
	'stc_enabled',
	'tag_base'
);

Jetpack_Sync::sync_posts( __FILE__ );
Jetpack_Sync::sync_comments( __FILE__ );

function jetpack_subscriptions_load() {
	Jetpack::enable_module_configurable( __FILE__ );
	Jetpack::module_configuration_load( __FILE__, 'jetpack_subscriptions_configuration_load' );
}

function jetpack_subscriptions_configuration_load() {
	wp_safe_redirect( admin_url( 'options-discussion.php#jetpack-subscriptions-settings' ) );
	exit;
}

class Jetpack_Subscriptions {
	var $jetpack = false;

	/**
	 * Singleton
	 * @static
	 */
	function init() {
		static $instance = false;

		if ( !$instance ) {
			$instance = new Jetpack_Subscriptions;
		}

		return $instance;
	}

	function Jetpack_Subscriptions() {
		$this->jetpack = Jetpack::init();

		add_filter( 'jetpack_xmlrpc_methods', array( $this, 'xmlrpc_methods' ) );

		// @todo remove sync from subscriptions and move elsewhere...

		// Add Configuration Page
		add_action( 'admin_init', array( $this, 'configure' ) );

		// Set up the subscription widget.
		add_action( 'widgets_init', array( $this, 'widget_init' ) );

		// Catch subscription widget submits
		if ( isset( $_REQUEST['jetpack_subscriptions_widget'] ) )
			add_action( 'template_redirect', array( $this, 'widget_submit' ) );

		// Set up the comment subscription checkboxes
		add_action( 'comment_form', array( $this, 'comment_subscribe_init' ) );

		// Catch comment posts and check for subscriptions.
		add_action( 'comment_post', array( $this, 'comment_subscribe_submit' ), 50, 2 );
	}

	function post_is_public( $the_post ) {
		if ( !$post = get_post( $the_post ) ) {
			return false;
		}

		return 'publish' === $post->post_status && strlen( (string) $post->post_password ) < 1;
	}

	/**
	 * Jetpack_Subscriptions::xmlrpc_methods()
	 *
	 * Register subscriptions methods with the Jetpack XML-RPC server.
	 * @param array $methods
	 */
	function xmlrpc_methods( $methods ) {
		return array_merge( $methods, array(
			'jetpack.subscriptions.subscribe' => array( $this, 'subscribe' ),
		) );
	}

	/**
	 * Jetpack_Subscriptions::configure()
	 *
	 * Jetpack Subscriptions configuration screen.
	 */
	function configure() {
		// Create the section
		add_settings_section(
			'jetpack_subscriptions',
			__( 'Jetpack Subscriptions Settings', 'jetpack' ),
			array( $this, 'subscriptions_settings_section' ),
			'discussion'
		);

		/** Subscribe to Posts ***************************************************/

		add_settings_field(
			'jetpack_subscriptions_post_subscribe',
			__( 'Follow Blog', 'jetpack' ),
			array( $this, 'subscription_post_subscribe_setting' ),
			'discussion',
			'jetpack_subscriptions'
		);

		register_setting(
			'discussion',
			'stb_enabled'
		);

		/** Subscribe to Comments ******************************************************/

		add_settings_field(
			'jetpack_subscriptions_comment_subscribe',
			__( 'Follow Comments', 'jetpack' ),
			array( $this, 'subscription_comment_subscribe_setting' ),
			'discussion',
			'jetpack_subscriptions'
		);

		register_setting(
			'discussion',
			'stc_enabled'
		);

		/** Subscription Messaging Options ******************************************************/

		register_setting(
			'reading',
			'subscription_options',
			array( $this, 'validate_settings' )
		);

		add_settings_section(
			'email_settings',
			__( 'Follower Settings', 'jetpack' ),
			array( $this, 'reading_section' ),
			'reading'
		);

		add_settings_field(
			'invitation',
			__( 'Blog follow email text' , 'jetpack' ),
			array( $this, 'setting_invitation' ),
			'reading',
			'email_settings'
		);

		add_settings_field(
			'comment-follow',
			__( 'Comment follow email text', 'jetpack' ),
			array( $this, 'setting_comment_follow' ),
			'reading',
			'email_settings'
		);
	}

	/**
	 * Discussions setting section blurb
	 *
	 */
	function subscriptions_settings_section() {
	?>

		<p id="jetpack-subscriptions-settings"><?php _e( 'Change whether your visitors can subscribe to your posts or comments or both.', 'jetpack' ); ?></p>

	<?php
	}

	/**
	 * Post Subscriptions Toggle
	 *
	 */
	function subscription_post_subscribe_setting() {

		$stb_enabled = get_option( 'stb_enabled', 1 ); ?>

		<p class="description">
			<input type="checkbox" name="stb_enabled" id="jetpack-post-subscribe" value="1" <?php checked( $stb_enabled, 1 ); ?> />
			<?php _e( "Show a <em>'follow blog'</em> option in the comment form", 'jetpack' ); ?>
		</p>
	<?php
	}

	/**
	 * Comments Subscriptions Toggle
	 *
	 */
	function subscription_comment_subscribe_setting() {

		$stc_enabled = get_option( 'stc_enabled', 1 ); ?>

		<p class="description">
			<input type="checkbox" name="stc_enabled" id="jetpack-comment-subscribe" value="1" <?php checked( $stc_enabled, 1 ); ?> />
			<?php _e( "Show a <em>'follow comments'</em> option in the comment form", 'jetpack' ); ?>
		</p>

	<?php
	}

	function validate_settings( $settings ) {
		global $allowedposttags;

		$default = $this->get_default_settings();

		// Blog Follow
		$settings['invitation'] = trim( wp_kses( $settings['invitation'], $allowedposttags ) );
		if ( empty( $settings['invitation'] ) )
			$settings['invitation'] = $default['invitation'];

		// Comments Follow (single post)
		$settings['comment_follow'] = trim( wp_kses( $settings['comment_follow'], $allowedposttags ) );
		if ( empty( $settings['comment_follow'] ) )
			$settings['comment_follow'] = $default['comment_follow'];

		return $settings;
	}

	public function reading_section() {
		_e( 'These settings change emails sent from your blog to followers.' , 'jetpack');
	}

	public function setting_invitation() {
		$settings = $this->get_settings();
		echo '<textarea name="subscription_options[invitation]" class="large-text" cols="50" rows="5">'.$settings['invitation'].'</textarea>';
		echo '<p><span class="description">'.__( 'Introduction text sent when someone follows your blog. (Site and confirmation details will be automatically added for you.)' , 'jetpack').'</span></p>';
	}

	public function setting_comment_follow() {
		$settings = $this->get_settings();
		echo '<textarea name="subscription_options[comment_follow]" class="large-text" cols="50" rows="5">'.$settings['comment_follow'].'</textarea>';
		echo '<p><span class="description">'.__( 'Introduction text sent when someone follows a post on your blog. (Site and confirmation details will be automatically added for you.)' , 'jetpack').'</span></p>';
	}

	function get_default_settings() {
		return array(
			'invitation'             => __( "Howdy.\n\nYou recently followed this blog's posts. This means you will receive each new post by email.\n\nTo activate, click confirm below. If you believe this is an error, ignore this message and we'll never bother you again." , 'jetpack'),
			'comment_follow'  => __( "Howdy.\n\nYou recently followed one of my posts. This means you will receive an email when new comments are posted.\n\nTo activate, click confirm below. If you believe this is an error, ignore this message and we'll never bother you again." , 'jetpack')
		);
	}

	function get_settings() {
		return wp_parse_args( (array) get_option( 'subscription_options', array() ), $this->get_default_settings() );
	}

	/**
	 * Jetpack_Subscriptions::subscribe()
	 *
	 * Send a synchronous XML-RPC subscribe to blog posts or subscribe to post comments request.
	 *
	 * @param string $email
	 * @param array  $post_ids (optional) defaults to 0 for blog posts only: array of post IDs to subscribe to blog's posts
	 * @param bool   $async    (optional) Should the subscription be performed asynchronously?  Defaults to true.
	 *
	 * @return true|Jetpack_Error true on success
	 *	invalid_email   : not a valid email address
	 *	invalid_post_id : not a valid post ID
	 *	unknown_post_id : unknown post
	 *	not_subscribed  : strange error.  Jetpack servers at WordPress.com could subscribe the email.
	 *	disabled        : Site owner has disabled subscriptions.
	 *	active          : Already subscribed.
	 *	unknown         : strange error.  Jetpack servers at WordPress.com returned something malformed.
	 *	unknown_status  : strange error.  Jetpack servers at WordPress.com returned something I didn't understand.
	 */
	function subscribe( $email, $post_ids = 0, $async = true ) {
		if ( !is_email( $email ) ) {
			return new Jetpack_Error( 'invalid_email' );
		}

		if ( !$async ) {
			Jetpack::load_xml_rpc_client();
			$xml = new Jetpack_IXR_ClientMulticall();
		}

		foreach( (array) $post_ids as $post_id ) {
			$post_id = (int) $post_id;
			if ( $post_id < 0 ) {
				return new Jetpack_Error( 'invalid_post_id' );
			} else if ( $post_id && !$post = get_post( $post_id ) ) {
				return new Jetpack_Error( 'unknown_post_id' );
			}

			if ( $async ) {
				Jetpack::xmlrpc_async_call( 'jetpack.subscribeToSite', $email, $post_id );
			} else {
				$xml->addCall( 'jetpack.subscribeToSite', $email, $post_id );
			}
		}

		if ( $async ) {
			return;
		}

		// Call
		$xml->query();

		if ( $xml->isError() ) {
			return $xml->get_jetpack_error();
		}

		$responses = $xml->getResponse();

		$r = array();
		foreach( (array) $responses as $response ) {
			if ( isset( $response['faultCode'] ) || isset( $response['faultString'] ) ) {
				$r[] = $xml->get_jetpack_error( $response['faultCode'], $response['faultString'] );
				continue;
			}

			if ( !is_array( $response[0] ) || empty( $response[0]['status'] ) ) {
				$r[] = new Jetpack_Error( 'unknown' );
				continue;
			}

			switch ( $response[0]['status'] ) {
			case 'error' :
				$r[] = new Jetpack_Error( 'not_subscribed' );
				continue 2;
			case 'disabled' :
				$r[] = new Jetpack_Error( 'disabled' );
				continue 2;
			case 'active' :
				$r[] = new Jetpack_Error( 'active' );
				continue 2;
			case 'pending' :
				$r[] = true;
				continue 2;
			default :
				$r[] = new Jetpack_Error( 'unknown_status', (string) $response[0]['status'] );
				continue 2;
			}
		}

		return $r;
	}

	/**
	 * Jetpack_Subscriptions::widget_init()
	 *
	 * Initialize and register the Jetpack Subscriptions widget.
	 */
	function widget_init() {
		register_widget( 'Jetpack_Subscriptions_Widget' );
	}

	/**
	 * Jetpack_Subscriptions::widget_submit()
	 *
	 * When a user submits their email via the blog subscription widget, check the details and call the subsribe() method.
	 */
	function widget_submit() {
		// Check the nonce.
		if ( is_user_logged_in() ) {
			check_admin_referer( 'blogsub_subscribe_' . get_current_blog_id() );
		}

		if ( empty( $_REQUEST['email'] ) )
			return false;

		$redirect_fragment = false;
		if ( isset( $_REQUEST['redirect_fragment'] ) ) {
			$redirect_fragment = preg_replace( '/[^a-z0-9_-]/i', '', $_REQUEST['redirect_fragment'] );
		}
		if ( !$redirect_fragment ) {
			$redirect_fragment = 'subscribe-blog';
		}

		$subscribe = Jetpack_Subscriptions::subscribe( $_REQUEST['email'], 0, false );

		if ( is_wp_error( $subscribe ) ) {
			$error = $subscribe->get_error_code();
		} else {
			$error = false;
			foreach ( $subscribe as $response ) {
				if ( is_wp_error( $response ) ) {
					$error = $response->get_error_code();
					break;
				}
			}
		}

		if ( $error ) {
			switch( $error ) {
				case 'invalid_email':
					$redirect = add_query_arg( 'subscribe', 'invalid_email' );
					break;
				case 'active': case 'pending':
					$redirect = add_query_arg( 'subscribe', 'already' );
					break;
				default:
					$redirect = add_query_arg( 'subscribe', 'error' );
					break;
			}
		} else {
			$redirect = add_query_arg( 'subscribe', 'success' );
		}

		wp_safe_redirect( "$redirect#$redirect_fragment" );
		exit;
	}

	/**
	 * Jetpack_Subscriptions::comment_subscribe_init()
	 *
	 * Set up and add the comment subscription checkbox to the comment form.
	 */
	 function comment_subscribe_init() {
	 	global $post;

	 	$comments_checked = '';
	 	$blog_checked = '';

	 	// Check for a comment / blog submission and set a cookie to retain the setting and check the boxes.
	 	if ( isset( $_COOKIE[ 'jetpack_comments_subscribe_' . COOKIEHASH ] ) && $_COOKIE[ 'jetpack_comments_subscribe_' . COOKIEHASH ] == $post->ID )
	 		$comments_checked = ' checked="checked"';

	 	if ( isset( $_COOKIE[ 'jetpack_blog_subscribe_' . COOKIEHASH ] ) )
	 		$blog_checked = ' checked="checked"';

		// Some themes call this function, don't show the checkbox again
		remove_action( 'comment_form', 'subscription_comment_form' );

		// Check if Mark Jaquith's Subscribe to Comments plugin is active - if so, suppress Jetpack checkbox

		$str = '';

		if ( FALSE === has_filter( 'comment_form', 'show_subscription_checkbox' ) && 1 == get_option( 'stc_enabled', 1 ) ) {
			// Subscribe to comments checkbox
			$str .= '<p class="comment-subscription-form"><input type="checkbox" name="subscribe_comments" id="subscribe_comments" value="subscribe" style="width: auto; -moz-appearance: checkbox; -webkit-appearance: checkbox;"' . $comments_checked . ' /> ';
			$str .= '<label class="subscribe-label" id="subscribe-label" for="subscribe_comments" style="display: inline;">' . __( 'Notify me of follow-up comments by email.', 'jetpack' ) . '</label>';
			$str .= '</p>';
		}

		if ( 1 == get_option( 'stb_enabled', 1 ) ) {
			// Subscribe to blog checkbox
			$str .= '<p class="comment-subscription-form"><input type="checkbox" name="subscribe_blog" id="subscribe_blog" value="subscribe" style="width: auto; -moz-appearance: checkbox; -webkit-appearance: checkbox;"' . $blog_checked . ' /> ';
			$str .=	'<label class="subscribe-label" id="subscribe-blog-label" for="subscribe_blog" style="display: inline;">' . __( 'Notify me of new posts by email.', 'jetpack' ) . '</label>';
			$str .= '</p>';
		}

		echo apply_filters( 'jetpack_comment_subscription_form', $str );
	 }

	/**
	 * Jetpack_Subscriptions::comment_subscribe_init()
	 *
	 * When a user checks the comment subscribe box and submits a comment, subscribe them to the comment thread.
	 */
	 function comment_subscribe_submit( $comment_id, $approved ) {
		if ( 'spam' === $approved ) {
			return;
		}

		// Set cookies for this post/comment
		$this->set_cookies( isset( $_REQUEST['subscribe_comments'] ), isset( $_REQUEST['subscribe_blog'] ) );

	 	if ( !isset( $_REQUEST['subscribe_comments'] ) && !isset( $_REQUEST['subscribe_blog'] ) )
			return;

		$comment = get_comment( $comment_id );
		$post_ids = array();

		if ( isset( $_REQUEST['subscribe_comments'] ) )
			$post_ids[] = $comment->comment_post_ID;

		if ( isset( $_REQUEST['subscribe_blog'] ) )
			$post_ids[] = 0;

		Jetpack_Subscriptions::subscribe( $comment->comment_author_email, $post_ids );
	 }

	/**
	 * Jetpack_Subscriptions::set_cookies()
	 *
	 * Set a cookie to save state on the comment and post subscription checkboxes.
	 */
	 function set_cookies( $comments = true, $posts = true ) {
	 	global $post;

		$cookie_lifetime = apply_filters( 'comment_cookie_lifetime', 30000000 );

		if ( $comments )
			setcookie( 'jetpack_comments_subscribe_' . COOKIEHASH, $post->ID, time() + $cookie_lifetime, COOKIEPATH, COOKIE_DOMAIN );
		else
			setcookie( 'jetpack_comments_subscribe_' . COOKIEHASH, '', time() - 3600, COOKIEPATH, COOKIE_DOMAIN );

		if ( $posts )
			setcookie( 'jetpack_blog_subscribe_' . COOKIEHASH, 1, time() + $cookie_lifetime, COOKIEPATH, COOKIE_DOMAIN );
		else
			setcookie( 'jetpack_blog_subscribe_' . COOKIEHASH, '', time() - 3600, COOKIEPATH, COOKIE_DOMAIN );
	 }
}

Jetpack_Subscriptions::init();


/***
 * Blog Subscription Widget
 */

class Jetpack_Subscriptions_Widget extends WP_Widget {
	function Jetpack_Subscriptions_Widget() {
		$widget_ops  = array( 'classname' => 'jetpack_subscription_widget', 'description' => __( 'Add an email signup form to allow people to subscribe to your blog.', 'jetpack' ) );
		$control_ops = array( 'width' => 300 );

		$this->WP_Widget( 'blog_subscription', __( 'Blog Subscriptions (Jetpack)', 'jetpack' ), $widget_ops, $control_ops );
	}

	function widget( $args, $instance ) {
		global $current_user;

		$source = 'widget';

		extract( $args );

		$instance            	= wp_parse_args( (array) $instance, $this->defaults() );
		$title               	= isset( $instance['title'] )               ? stripslashes( $instance['title'] )               : '';
		$subscribe_text      	= isset( $instance['subscribe_text'] )      ? stripslashes( $instance['subscribe_text'] )      : '';
		$subscribe_button    	= isset( $instance['subscribe_button'] )    ? stripslashes( $instance['subscribe_button'] )    : '';
		$subscribe_logged_in 	= isset( $instance['subscribe_logged_in'] ) ? stripslashes( $instance['subscribe_logged_in'] ) : '';
		$show_subscribers_total = (bool) $instance['show_subscribers_total'];
		$subscribers_total      = $this->fetch_subscriber_count();

		if ( ! is_array( $subscribers_total ) )
			$show_subscribers_total = FALSE;

		echo $args['before_widget'];
		echo $args['before_title'] . '<label for="subscribe-field">' . esc_attr( $instance['title'] ) . '</label>' . $args['after_title'] . "\n";

		$referer = ( is_ssl() ? 'https' : 'http' ) . '://' . $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI'];

		// Check for subscription confirmation.
		if ( isset( $_GET['subscribe'] ) && 'success' == $_GET['subscribe'] ) : ?>

			<div class="success">
				<p><?php esc_html_e( 'An email was just sent to confirm your subscription. Please find the email now and click activate to start subscribing.', 'jetpack' ); ?></p>
			</div>

		<?php endif;

		// Display any errors
		if ( isset( $_GET['subscribe'] ) ) :
			switch ( $_GET['subscribe'] ) :
				case 'invalid_email' : ?>
					<p class="error"><?php esc_html_e( 'The email you entered was invalid, please check and try again.', 'jetpack' ); ?></p>
				<?php break;
				case 'already' : ?>
					<p class="error"><?php esc_html_e( 'You have already subscribed to this site, please check your inbox.', 'jetpack' ); ?></p>
				<?php break;
				case 'success' :
					echo wpautop( $subscribe_text );
					break;
				default : ?>
					<p class="error"><?php esc_html_e( 'There was an error when subscribing, please try again.', 'jetpack' ) ?></p>
				<?php break;
			endswitch;
		endif;

		// Display a subscribe form ?>
		<form action="" method="post" accept-charset="utf-8" id="subscribe-blog-<?php echo !empty( $args['widget_id'] ) ? esc_attr( $args['widget_id'] ) : mt_rand( 450, 550 ); ?>">
			<?php
			if ( ! isset ( $_GET['subscribe'] ) ) {
				?><p><?php echo $subscribe_text ?></p><?php
			}

			if ( $show_subscribers_total && 0 < $subscribers_total['value'] ) {
				echo wpautop( sprintf( _n( 'Join %s other subscriber', 'Join %s other subscribers', $subscribers_total['value'], 'jetpack' ), number_format_i18n( $subscribers_total['value'] ) ) );
			}
			?>

			<p><input type="text" name="email" style="width: 95%; padding: 1px 2px" value="<?php echo !empty( $current_user->user_email ) ? esc_attr( $current_user->user_email ) : esc_html__( 'Email Address', 'jetpack' ); ?>" id="subscribe-field" onclick="if ( this.value == '<?php esc_html_e( 'Email Address', 'jetpack' ) ?>' ) { this.value = ''; }" onblur="if ( this.value == '' ) { this.value = '<?php esc_html_e( 'Email Address', 'jetpack' ) ?>'; }" /></p>

			<p>
				<input type="hidden" name="action" value="subscribe" />
				<input type="hidden" name="source" value="<?php echo esc_url( $referer ); ?>" />
				<input type="hidden" name="sub-type" value="<?php echo esc_attr( $source ); ?>" />
				<input type="hidden" name="redirect_fragment" value="<?php echo esc_attr( $widget_id ); ?>" />
				<?php
					if ( is_user_logged_in() ) {
						wp_nonce_field( 'blogsub_subscribe_'. get_current_blog_id(), '_wpnonce', false );
					}
				?>
				<input type="submit" value="<?php echo esc_attr( $subscribe_button ); ?>" name="jetpack_subscriptions_widget" />
			</p>
		</form>

		<?php

		echo "\n" . $args['after_widget'];
	}

	function increment_subscriber_count( $current_subs_array = array() ) {
		$current_subs_array['value']++;

		set_transient( 'wpcom_subscribers_total', $current_subs_array, 3600 ); // try to cache the result for at least 1 hour

		return $current_subs_array;
	}

	function fetch_subscriber_count() {
		$subs_count = get_transient( 'wpcom_subscribers_total' );

		if ( FALSE === $subs_count || 'failed' == $subs_count['status'] ) {
			Jetpack:: load_xml_rpc_client();

			$xml = new Jetpack_IXR_Client( array(
				'user_id' => JETPACK_MASTER_USER,
			) );

			$xml->query( 'jetpack.fetchSubscriberCount' );

			if ( $xml->isError() ) { // if we get an error from .com, set the status to failed so that we will try again next time the data is requested
				$subs_count = array(
					'status'  => 'failed',
					'code'    => $xml->getErrorCode(),
					'message' => $xml->getErrorMessage(),
					'value'	  => ( isset( $subs_count['value'] ) ) ? $subs_count['value'] : 0,
				);
			} else {
				$subs_count = array(
					'status' => 'success',
					'value'  => $xml->getResponse(),
				);
			}

			set_transient( 'wpcom_subscribers_total', $subs_count, 3600 ); // try to cache the result for at least 1 hour
		}

		return $subs_count;
	}

	function update( $new_instance, $old_instance ) {
		$instance = $old_instance;

		$instance['title']               	= wp_kses( stripslashes( $new_instance['title'] ), array() );
		$instance['subscribe_text']      	= wp_filter_post_kses( stripslashes( $new_instance['subscribe_text'] ) );
		$instance['subscribe_logged_in'] 	= wp_filter_post_kses( stripslashes( $new_instance['subscribe_logged_in'] ) );
		$instance['subscribe_button']    	= wp_kses( stripslashes( $new_instance['subscribe_button'] ), array() );
		$instance['show_subscribers_total'] = isset( $new_instance['show_subscribers_total'] ) && $new_instance['show_subscribers_total'];

		return $instance;
	}

	function defaults() {
		return array(
			'title'               	 => esc_html__( 'Subscribe to Blog via Email', 'jetpack' ),
			'subscribe_text'      	 => esc_html__( 'Enter your email address to subscribe to this blog and receive notifications of new posts by email.', 'jetpack' ),
			'subscribe_button'    	 => esc_html__( 'Subscribe', 'jetpack' ),
			'subscribe_logged_in' 	 => esc_html__( 'Click to subscribe to this blog and receive notifications of new posts by email.', 'jetpack' ),
			'show_subscribers_total' => true,
		);
	}

	function form( $instance ) {
		$instance = wp_parse_args( (array) $instance, $this->defaults() );

		$title               	= stripslashes( $instance['title'] );
		$subscribe_text      	= stripslashes( $instance['subscribe_text'] );
		$subscribe_button    	= stripslashes( $instance['subscribe_button'] );
		$show_subscribers_total = checked( $instance['show_subscribers_total'], true, false );

		$subs_fetch = $this->fetch_subscriber_count();

		if ( 'failed' == $subs_fetch['status'] ) {
			printf( '<div class="error inline"><p>' . __( '%s: %s', 'jetpack' ) . '</p></div>', esc_html( $subs_fetch['code'] ), esc_html( $subs_fetch['message'] ) );

		}
		$subscribers_total = number_format_i18n( $subs_fetch['value'] );

?>
<p>
	<label for="<?php echo $this->get_field_id( 'title' ); ?>">
		<?php _e( 'Widget title:', 'jetpack' ); ?>
		<input class="widefat" id="<?php echo $this->get_field_id( 'title' ); ?>" name="<?php echo $this->get_field_name( 'title' ); ?>" type="text" value="<?php echo esc_attr( $title ); ?>" />
	</label>
</p>
<p>
	<label for="<?php echo $this->get_field_id( 'subscribe_text' ); ?>">
		<?php _e( 'Optional text to display to your readers:', 'jetpack' ); ?>
		<textarea style="width: 95%" id="<?php echo $this->get_field_id( 'subscribe_text' ); ?>" name="<?php echo $this->get_field_name( 'subscribe_text' ); ?>" type="text"><?php echo esc_html( $subscribe_text ); ?></textarea>
	</label>
</p>
<p>
	<label for="<?php echo $this->get_field_id( 'subscribe_button' ); ?>">
		<?php _e( 'Subscribe Button:', 'jetpack' ); ?>
		<input class="widefat" id="<?php echo $this->get_field_id( 'subscribe_button' ); ?>" name="<?php echo $this->get_field_name( 'subscribe_button' ); ?>" type="text" value="<?php echo esc_attr( $subscribe_button ); ?>" />
	</label>
</p>
<p>
	<label for="<?php echo $this->get_field_id( 'show_subscribers_total' ); ?>">
		<input type="checkbox" id="<?php echo $this->get_field_id( 'show_subscribers_total' ); ?>" name="<?php echo $this->get_field_name( 'show_subscribers_total' ); ?>" value="1"<?php echo $show_subscribers_total; ?> />
		<?php echo esc_html( sprintf( _n( 'Show total number of subscribers? (%s subscriber)', 'Show total number of subscribers? (%s subscribers)', $subscribers_total, 'jetpack' ), number_format_i18n( $subscribers_total ) ) ); ?>
	</label>
</p>
<?php
	}
}

add_shortcode( 'jetpack_subscription_form', 'jetpack_do_subscription_form' );

function jetpack_do_subscription_form( $args ) {
	$args['show_subscribers_total'] = empty( $args['show_subscribers_total'] ) ? false : true;
	$args = shortcode_atts( Jetpack_Subscriptions_Widget::defaults(), $args );
	ob_start();
	the_widget( 'Jetpack_Subscriptions_Widget', $args );
	$output = ob_get_clean();
	return $output;
}
