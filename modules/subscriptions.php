<?php
/**
 * Module Name: Subscriptions
 * Module Description: Allow users to subscribe to your posts and comments and receive notifications via email
 * Jumpstart Description: Give visitors two easy subscription options — while commenting, or via a separate email subscription widget you can display.
 * Sort Order: 9
 * Recommendation Order: 8
 * First Introduced: 1.2
 * Requires Connection: Yes
 * Auto Activate: Yes
 * Module Tags: Social
 * Feature: Engagement, Jumpstart
 * Additional Search Queries: subscriptions, subscription, email, follow, followers, subscribers, signup
 */

add_action( 'jetpack_modules_loaded', 'jetpack_subscriptions_load' );

function jetpack_subscriptions_load() {
	Jetpack::enable_module_configurable( __FILE__ );
	Jetpack::module_configuration_load( __FILE__, 'jetpack_subscriptions_configuration_load' );
}

function jetpack_subscriptions_configuration_load() {
	wp_safe_redirect( admin_url( 'options-discussion.php#jetpack-subscriptions-settings' ) );
	exit;
}

/**
 * Cherry picks keys from `$_SERVER` array.
 *
 * @since 6.0.0
 *
 * @return array An array of server data.
 */
function jetpack_subscriptions_cherry_pick_server_data() {
	$data = array();

	foreach ( $_SERVER as $key => $value ) {
		if ( ! is_string( $value ) || 0 === strpos( $key, 'HTTP_COOKIE' ) ) {
			continue;
		}

		if ( 0 === strpos( $key, 'HTTP_' ) || in_array( $key, array( 'REMOTE_ADDR', 'REQUEST_URI', 'DOCUMENT_URI' ), true ) ) {
			$data[ $key ] = $value;
		}
	}

	return $data;
}

class Jetpack_Subscriptions {
	public $jetpack = false;

	public static $hash;

	/**
	 * Singleton
	 * @static
	 */
	static function init() {
		static $instance = false;

		if ( !$instance ) {
			$instance = new Jetpack_Subscriptions;
		}

		return $instance;
	}

	function __construct() {
		$this->jetpack = Jetpack::init();

		// Don't use COOKIEHASH as it could be shared across installs && is non-unique in multisite.
		// @see: https://twitter.com/nacin/status/378246957451333632
		self::$hash = md5( get_option( 'siteurl' ) );

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

		// Adds post meta checkbox in the post submit metabox
		add_action( 'post_submitbox_misc_actions', array( $this, 'subscription_post_page_metabox' ) );

		add_action( 'transition_post_status', array( $this, 'maybe_send_subscription_email' ), 10, 3 );

		add_filter( 'jetpack_published_post_flags', array( $this, 'set_post_flags' ), 10, 2 );

		add_filter( 'post_updated_messages', array( $this, 'update_published_message' ), 18, 1 );
	}

	/**
	 * Jetpack_Subscriptions::xmlrpc_methods()
	 *
	 * Register subscriptions methods with the Jetpack XML-RPC server.
	 * @param array $methods
	 */
	function xmlrpc_methods( $methods ) {
		return array_merge(
			$methods,
			array(
				'jetpack.subscriptions.subscribe' => array( $this, 'subscribe' ),
			)
		);
	}

	/*
	 * Disable Subscribe on Single Post
	 * Register post meta
	 */
	function subscription_post_page_metabox() {
		if (
			/**
			 * Filter whether or not to show the per-post subscription option.
			 *
			 * @module subscriptions
			 *
			 * @since 3.7.0
			 *
			 * @param bool true = show checkbox option on all new posts | false = hide the option.
			 */
			 ! apply_filters( 'jetpack_allow_per_post_subscriptions', false ) )
		{
			return;
		}

		if ( has_filter( 'jetpack_subscriptions_exclude_these_categories' ) || has_filter( 'jetpack_subscriptions_include_only_these_categories' ) ) {
			return;
		}

		global $post;
		$disable_subscribe_value = get_post_meta( $post->ID, '_jetpack_dont_email_post_to_subs', true );
		// only show checkbox if post hasn't been published and is a 'post' post type.
		if ( get_post_status( $post->ID ) !== 'publish' && get_post_type( $post->ID ) == 'post' ) :
			// Nonce it
			wp_nonce_field( 'disable_subscribe', 'disable_subscribe_nonce' );
			?>
			<div class="misc-pub-section">
				<label for="_jetpack_dont_email_post_to_subs"><?php _e( 'Jetpack Subscriptions:', 'jetpack' ); ?></label><br>
				<input type="checkbox" name="_jetpack_dont_email_post_to_subs" id="jetpack-per-post-subscribe" value="1" <?php checked( $disable_subscribe_value, 1, true ); ?> />
				<?php _e( 'Don&#8217;t send this to subscribers', 'jetpack' ); ?>
			</div>
		<?php endif;
	}

	/**
	 * Checks whether or not the post should be emailed to subscribers
	 *
	 * It checks for the following things in order:
	 * - Usage of filter jetpack_subscriptions_exclude_these_categories
	 * - Usage of filter jetpack_subscriptions_include_only_these_categories
	 * - Existence of the per-post checkbox option
	 *
	 * Only one of these can be used at any given time.
	 *
	 * @param $new_status string - the "new" post status of the transition when saved
	 * @param $old_status string - the "old" post status of the transition when saved
	 * @param $post obj - The post object
	 */
	function maybe_send_subscription_email( $new_status, $old_status, $post ) {

		if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
			return;
		}

		// Make sure that the checkbox is preseved
		if ( ! empty( $_POST['disable_subscribe_nonce'] ) && wp_verify_nonce( $_POST['disable_subscribe_nonce'], 'disable_subscribe' ) ) {
			$set_checkbox = isset( $_POST['_jetpack_dont_email_post_to_subs'] ) ? 1 : 0;
			update_post_meta( $post->ID, '_jetpack_dont_email_post_to_subs', $set_checkbox );
		}
	}

	function update_published_message( $messages ) {
		global $post;
		if ( ! $this->should_email_post_to_subscribers( $post ) ) {
			return $messages;
		}

		$view_post_link_html = sprintf( ' <a href="%1$s">%2$s</a>',
			esc_url( get_permalink( $post ) ),
			__( 'View post', 'jetpack' )
		);

		$messages['post'][6] = sprintf(
			/* translators: Message shown after a post is published */
			esc_html__( 'Post published and sending emails to subscribers.', 'jetpack' )
			) . $view_post_link_html;
		return $messages;
	}

	public function should_email_post_to_subscribers( $post ) {
		$should_email = true;
		if ( get_post_meta( $post->ID, '_jetpack_dont_email_post_to_subs', true ) ) {
			return false;
		}

		// Only posts are currently supported
		if ( $post->post_type !== 'post' ) {
			return false;
		}

		/**
		 * Array of categories that will never trigger subscription emails.
		 *
		 * Will not send subscription emails from any post from within these categories.
		 *
		 * @module subscriptions
		 *
		 * @since 3.7.0
		 *
		 * @param array $args Array of category slugs or ID's.
		 */
		$excluded_categories = apply_filters( 'jetpack_subscriptions_exclude_these_categories', array() );

		// Never email posts from these categories
		if ( ! empty( $excluded_categories ) && in_category( $excluded_categories, $post->ID ) ) {
			$should_email = false;
		}

		/**
		 * ONLY send subscription emails for these categories
		 *
		 * Will ONLY send subscription emails to these categories.
		 *
		 * @module subscriptions
		 *
		 * @since 3.7.0
		 *
		 * @param array $args Array of category slugs or ID's.
		 */
		$only_these_categories = apply_filters( 'jetpack_subscriptions_exclude_all_categories_except', array() );

		// Only emails posts from these categories
		if ( ! empty( $only_these_categories ) && ! in_category( $only_these_categories, $post->ID ) ) {
			$should_email = false;
		}

		return $should_email;
	}

	function set_post_flags( $flags, $post ) {
		$flags['send_subscription'] = $this->should_email_post_to_subscribers( $post );
		return $flags;
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
			__( 'Blog follow email text', 'jetpack' ),
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
		echo '<p id="follower-settings">';
		_e( 'These settings change emails sent from your blog to followers.', 'jetpack' );
		echo '</p>';
	}

	public function setting_invitation() {
		$settings = $this->get_settings();
		echo '<textarea name="subscription_options[invitation]" class="large-text" cols="50" rows="5">' . esc_textarea( $settings['invitation'] ) . '</textarea>';
		echo '<p><span class="description">'.__( 'Introduction text sent when someone follows your blog. (Site and confirmation details will be automatically added for you.)', 'jetpack' ).'</span></p>';
	}

	public function setting_comment_follow() {
		$settings = $this->get_settings();
		echo '<textarea name="subscription_options[comment_follow]" class="large-text" cols="50" rows="5">' . esc_textarea( $settings['comment_follow'] ) . '</textarea>';
		echo '<p><span class="description">'.__( 'Introduction text sent when someone follows a post on your blog. (Site and confirmation details will be automatically added for you.)', 'jetpack' ).'</span></p>';
	}

	function get_default_settings() {
		return array(
			'invitation'     => __( "Howdy.\n\nYou recently followed this blog's posts. This means you will receive each new post by email.\n\nTo activate, click confirm below. If you believe this is an error, ignore this message and we'll never bother you again.", 'jetpack' ),
			'comment_follow' => __( "Howdy.\n\nYou recently followed one of my posts. This means you will receive an email when new comments are posted.\n\nTo activate, click confirm below. If you believe this is an error, ignore this message and we'll never bother you again.", 'jetpack' )
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
	function subscribe( $email, $post_ids = 0, $async = true, $extra_data = array() ) {
		if ( !is_email( $email ) ) {
			return new Jetpack_Error( 'invalid_email' );
		}

		if ( !$async ) {
			Jetpack::load_xml_rpc_client();
			$xml = new Jetpack_IXR_ClientMulticall();
		}

		foreach ( (array) $post_ids as $post_id ) {
			$post_id = (int) $post_id;
			if ( $post_id < 0 ) {
				return new Jetpack_Error( 'invalid_post_id' );
			} else if ( $post_id && !$post = get_post( $post_id ) ) {
				return new Jetpack_Error( 'unknown_post_id' );
			}

			if ( $async ) {
				Jetpack::xmlrpc_async_call( 'jetpack.subscribeToSite', $email, $post_id, serialize( $extra_data ) );
			} else {
				$xml->addCall( 'jetpack.subscribeToSite', $email, $post_id, serialize( $extra_data ) );
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
		foreach ( (array) $responses as $response ) {
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

		$subscribe = Jetpack_Subscriptions::subscribe(
												$_REQUEST['email'],
												0,
												false,
												array(
													'source'         => 'widget',
													'widget-in-use'  => is_active_widget( false, false, 'blog_subscription', true ) ? 'yes' : 'no',
													'comment_status' => '',
													'server_data'    => jetpack_subscriptions_cherry_pick_server_data(),
												)
		);

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

		switch ( $error ) {
			case false:
				$result = 'success';
				break;
			case 'invalid_email':
				$result = $error;
				break;
			case 'blocked_email':
				$result = 'opted_out';
				break;
			case 'active':
			case 'pending':
				$result = 'already';
				break;
			default:
				$result = 'error';
				break;
		}

		$redirect = add_query_arg( 'subscribe', $result );

		/**
		 * Fires on each subscription form submission.
		 *
		 * @module subscriptions
		 *
		 * @since 3.7.0
		 *
		 * @param string $result Result of form submission: success, invalid_email, already, error.
		 */
		do_action( 'jetpack_subscriptions_form_submission', $result );

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
		$blog_checked     = '';

		// Check for a comment / blog submission and set a cookie to retain the setting and check the boxes.
		if ( isset( $_COOKIE[ 'jetpack_comments_subscribe_' . self::$hash . '_' . $post->ID ] ) ) {
			$comments_checked = ' checked="checked"';
		}

		if ( isset( $_COOKIE[ 'jetpack_blog_subscribe_' . self::$hash ] ) ) {
			$blog_checked = ' checked="checked"';
		}

		// Some themes call this function, don't show the checkbox again
		remove_action( 'comment_form', 'subscription_comment_form' );

		// Check if Mark Jaquith's Subscribe to Comments plugin is active - if so, suppress Jetpack checkbox

		$str = '';

		if ( FALSE === has_filter( 'comment_form', 'show_subscription_checkbox' ) && 1 == get_option( 'stc_enabled', 1 ) && empty( $post->post_password ) && 'post' == get_post_type() ) {
			// Subscribe to comments checkbox
			$str .= '<p class="comment-subscription-form"><input type="checkbox" name="subscribe_comments" id="subscribe_comments" value="subscribe" style="width: auto; -moz-appearance: checkbox; -webkit-appearance: checkbox;"' . $comments_checked . ' /> ';
			$comment_sub_text = __( 'Notify me of follow-up comments by email.', 'jetpack' );
			$str .=	'<label class="subscribe-label" id="subscribe-label" for="subscribe_comments">' . esc_html(
				/**
				 * Filter the Subscribe to comments text appearing below the comment form.
				 *
				 * @module subscriptions
				 *
				 * @since 3.4.0
				 *
				 * @param string $comment_sub_text Subscribe to comments text.
				 */
				apply_filters( 'jetpack_subscribe_comment_label', $comment_sub_text )
			) . '</label>';
			$str .= '</p>';
		}

		if ( 1 == get_option( 'stb_enabled', 1 ) ) {
			// Subscribe to blog checkbox
			$str .= '<p class="comment-subscription-form"><input type="checkbox" name="subscribe_blog" id="subscribe_blog" value="subscribe" style="width: auto; -moz-appearance: checkbox; -webkit-appearance: checkbox;"' . $blog_checked . ' /> ';
			$blog_sub_text = __( 'Notify me of new posts by email.', 'jetpack' );
			$str .=	'<label class="subscribe-label" id="subscribe-blog-label" for="subscribe_blog">' . esc_html(
				/**
				 * Filter the Subscribe to blog text appearing below the comment form.
				 *
				 * @module subscriptions
				 *
				 * @since 3.4.0
				 *
				 * @param string $comment_sub_text Subscribe to blog text.
				 */
				apply_filters( 'jetpack_subscribe_blog_label', $blog_sub_text )
			) . '</label>';
			$str .= '</p>';
		}

		/**
		 * Filter the output of the subscription options appearing below the comment form.
		 *
		 * @module subscriptions
		 *
		 * @since 1.2.0
		 *
		 * @param string $str Comment Subscription form HTML output.
		 */
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

		$comment = get_comment( $comment_id );

		// Set cookies for this post/comment
		$this->set_cookies( isset( $_REQUEST['subscribe_comments'] ), $comment->comment_post_ID, isset( $_REQUEST['subscribe_blog'] ) );

		if ( !isset( $_REQUEST['subscribe_comments'] ) && !isset( $_REQUEST['subscribe_blog'] ) )
			return;

		$post_ids = array();

		if ( isset( $_REQUEST['subscribe_comments'] ) )
			$post_ids[] = $comment->comment_post_ID;

		if ( isset( $_REQUEST['subscribe_blog'] ) )
			$post_ids[] = 0;

		$result = Jetpack_Subscriptions::subscribe(
									$comment->comment_author_email,
									$post_ids,
									true,
									array(
										'source'         => 'comment-form',
										'widget-in-use'  => is_active_widget( false, false, 'blog_subscription', true ) ? 'yes' : 'no',
										'comment_status' => $approved,
										'server_data'    => jetpack_subscriptions_cherry_pick_server_data(),
									)
		);

		/**
		 * Fires on each comment subscription form submission.
		 *
		 * @module subscriptions
		 *
		 * @since 5.5.0
		 *
		 * @param NULL|WP_Error $result Result of form submission: NULL on success, WP_Error otherwise.
		 * @param Array $post_ids An array of post IDs that the user subscribed to, 0 means blog subscription.
		 */
		do_action( 'jetpack_subscriptions_comment_form_submission', $result, $post_ids );
	}

	/**
	 * Jetpack_Subscriptions::set_cookies()
	 *
	 * Set a cookie to save state on the comment and post subscription checkboxes.
	 *
	 * @param bool $subscribe_to_post Whether the user chose to subscribe to subsequent comments on this post.
	 * @param int $post_id If $subscribe_to_post is true, the post ID they've subscribed to.
	 * @param bool $subscribe_to_blog Whether the user chose to subscribe to all new posts on the blog.
	 */
	function set_cookies( $subscribe_to_post = false, $post_id = null, $subscribe_to_blog = false ) {
		$post_id = intval( $post_id );

		/** This filter is already documented in core/wp-includes/comment-functions.php */
		$cookie_lifetime = apply_filters( 'comment_cookie_lifetime',       30000000 );

		/**
		 * Filter the Jetpack Comment cookie path.
		 *
		 * @module subscriptions
		 *
		 * @since 2.5.0
		 *
		 * @param string COOKIEPATH Cookie path.
		 */
		$cookie_path     = apply_filters( 'jetpack_comment_cookie_path',   COOKIEPATH );

		/**
		 * Filter the Jetpack Comment cookie domain.
		 *
		 * @module subscriptions
		 *
		 * @since 2.5.0
		 *
		 * @param string COOKIE_DOMAIN Cookie domain.
		 */
		$cookie_domain   = apply_filters( 'jetpack_comment_cookie_domain', COOKIE_DOMAIN );

		if ( $subscribe_to_post && $post_id >= 0 ) {
			setcookie( 'jetpack_comments_subscribe_' . self::$hash . '_' . $post_id, 1, time() + $cookie_lifetime, $cookie_path, $cookie_domain );
		} else {
			setcookie( 'jetpack_comments_subscribe_' . self::$hash . '_' . $post_id, '', time() - 3600, $cookie_path, $cookie_domain );
		}

		if ( $subscribe_to_blog ) {
			setcookie( 'jetpack_blog_subscribe_' . self::$hash, 1, time() + $cookie_lifetime, $cookie_path, $cookie_domain );
		} else {
			setcookie( 'jetpack_blog_subscribe_' . self::$hash, '', time() - 3600, $cookie_path, $cookie_domain );
		}
	}

}

Jetpack_Subscriptions::init();


/***
 * Blog Subscription Widget
 */

class Jetpack_Subscriptions_Widget extends WP_Widget {
	function __construct() {
		$widget_ops  = array(
			'classname' => 'jetpack_subscription_widget',
			'description' => esc_html__( 'Add an email signup form to allow people to subscribe to your blog.', 'jetpack' ),
			'customize_selective_refresh' => true,
		);

		parent::__construct(
			'blog_subscription',
			/** This filter is documented in modules/widgets/facebook-likebox.php */
			apply_filters( 'jetpack_widget_name', __( 'Blog Subscriptions', 'jetpack' ) ),
			$widget_ops
		);

		if ( is_active_widget( false, false, $this->id_base ) || is_active_widget( false, false, 'monster' ) || is_customize_preview() ) {
			add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_style' ) );
		}
	}

	/**
	 * Enqueue the form's CSS.
	 *
	 * @since 4.5.0
	 */
	function enqueue_style() {
		wp_register_style( 'jetpack-subscriptions', plugins_url( 'subscriptions/subscriptions.css', __FILE__ ) );
		wp_enqueue_style( 'jetpack-subscriptions' );
	}

	function widget( $args, $instance ) {
		if (
			( ! defined( 'IS_WPCOM' ) || ! IS_WPCOM ) &&
			/** This filter is already documented in modules/contact-form/grunion-contact-form.php */
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

		/** This action is already documented in modules/widgets/gravatar-profile.php */
		do_action( 'jetpack_stats_extra', 'widget_view', 'jetpack_subscriptions' );

		$source                 = 'widget';
		$instance            	= wp_parse_args( (array) $instance, $this->defaults() );
		$subscribe_text      	= isset( $instance['subscribe_text'] )        ? stripslashes( $instance['subscribe_text'] )        : '';
		$subscribe_placeholder 	= isset( $instance['subscribe_placeholder'] ) ? stripslashes( $instance['subscribe_placeholder'] ) : '';
		$subscribe_button    	= isset( $instance['subscribe_button'] )      ? stripslashes( $instance['subscribe_button'] )      : '';
		$success_message    	= isset( $instance['success_message'] )       ? stripslashes( $instance['success_message'] )      : '';
		$widget_id              = esc_attr( !empty( $args['widget_id'] )      ? esc_attr( $args['widget_id'] ) : mt_rand( 450, 550 ) );

		$show_subscribers_total = (bool) $instance['show_subscribers_total'];
		$subscribers_total      = $this->fetch_subscriber_count(); // Only used for the shortcode [total-subscribers]

		// Give the input element a unique ID
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

		// Display the subscription form
		echo $args['before_widget'];

		// Only show the title if there actually is a title
		if( ! empty( $instance['title'] ) ) {
			echo $args['before_title'] . esc_attr( $instance['title'] ) . $args['after_title'] . "\n";
		}

		$referer = set_url_scheme( 'http://' . $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI'] );

		// Display any errors
		if ( isset( $_GET['subscribe'] ) ) :
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
		endif;

		// Display a subscribe form
		if ( isset( $_GET['subscribe'] ) && 'success' == $_GET['subscribe'] ) { ?>
			<?php
		} else { ?>
			<form action="#" method="post" accept-charset="utf-8" id="subscribe-blog-<?php echo $widget_id; ?>">
				<?php
				if ( ! isset ( $_GET['subscribe'] ) || 'success' != $_GET['subscribe'] ) {
					?><div id="subscribe-text"><?php echo wpautop( str_replace( '[total-subscribers]', number_format_i18n( $subscribers_total['value'] ), $subscribe_text ) ); ?></div><?php
				}

				if ( $show_subscribers_total && 0 < $subscribers_total['value'] ) {
					echo wpautop( sprintf( _n( 'Join %s other subscriber', 'Join %s other subscribers', $subscribers_total['value'], 'jetpack' ), number_format_i18n( $subscribers_total['value'] ) ) );
				}
				if ( ! isset ( $_GET['subscribe'] ) || 'success' != $_GET['subscribe'] ) { ?>
					<p id="subscribe-email">
						<label id="jetpack-subscribe-label" for="<?php echo esc_attr( $subscribe_field_id ) . '-' . esc_attr( $widget_id ); ?>">
							<?php echo !empty( $subscribe_placeholder ) ? esc_html( $subscribe_placeholder ) : esc_html__( 'Email Address:', 'jetpack' ); ?>
						</label>
						<input type="email" name="email" required="required" class="required" value="<?php echo esc_attr( $subscribe_email ); ?>" id="<?php echo esc_attr( $subscribe_field_id ) . '-' . esc_attr( $widget_id ); ?>" placeholder="<?php echo esc_attr( $subscribe_placeholder ); ?>" />
					</p>

					<p id="subscribe-submit">
						<input type="hidden" name="action" value="subscribe" />
						<input type="hidden" name="source" value="<?php echo esc_url( $referer ); ?>" />
						<input type="hidden" name="sub-type" value="<?php echo esc_attr( $source ); ?>" />
						<input type="hidden" name="redirect_fragment" value="<?php echo $widget_id; ?>" />
						<?php
							if ( is_user_logged_in() ) {
								wp_nonce_field( 'blogsub_subscribe_'. get_current_blog_id(), '_wpnonce', false );
							}
						?>
						<input type="submit" value="<?php echo esc_attr( $subscribe_button ); ?>" name="jetpack_subscriptions_widget" />
					</p>
				<?php }?>
			</form>

			<script>
			/*
			Custom functionality for safari and IE
			 */
			(function( d ) {
				// In case the placeholder functionality is available we remove labels
				if ( ( 'placeholder' in d.createElement( 'input' ) ) ) {
					var label = d.querySelector( 'label[for=subscribe-field-<?php echo $widget_id; ?>]' );
						label.style.clip 	 = 'rect(1px, 1px, 1px, 1px)';
						label.style.position = 'absolute';
						label.style.height   = '1px';
						label.style.width    = '1px';
						label.style.overflow = 'hidden';
				}

				// Make sure the email value is filled in before allowing submit
				var form = d.getElementById('subscribe-blog-<?php echo $widget_id; ?>'),
					input = d.getElementById('<?php echo esc_attr( $subscribe_field_id ) . '-' . esc_attr( $widget_id ); ?>'),
					handler = function( event ) {
						if ( '' === input.value ) {
							input.focus();

							if ( event.preventDefault ){
								event.preventDefault();
							}

							return false;
						}
					};

				if ( window.addEventListener ) {
					form.addEventListener( 'submit', handler, false );
				} else {
					form.attachEvent( 'onsubmit', handler );
				}
			})( document );
			</script>
		<?php } ?>
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

			$xml = new Jetpack_IXR_Client( array( 'user_id' => JETPACK_MASTER_USER, ) );

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

		$instance['title']					= wp_kses( stripslashes( $new_instance['title'] ), array() );
		$instance['subscribe_text']			= wp_filter_post_kses( stripslashes( $new_instance['subscribe_text'] ) );
		$instance['subscribe_placeholder']	= wp_kses( stripslashes( $new_instance['subscribe_placeholder'] ), array() );
		$instance['subscribe_button']		= wp_kses( stripslashes( $new_instance['subscribe_button'] ), array() );
		$instance['success_message']		= wp_kses( stripslashes( $new_instance['success_message'] ), array() );
		$instance['show_subscribers_total']	= isset( $new_instance['show_subscribers_total'] ) && $new_instance['show_subscribers_total'];

		return $instance;
	}

	public static function defaults() {
		return array(
			'title'               	 => esc_html__( 'Subscribe to Blog via Email', 'jetpack' ),
			'subscribe_text'      	 => esc_html__( 'Enter your email address to subscribe to this blog and receive notifications of new posts by email.', 'jetpack' ),
			'subscribe_placeholder'	 => esc_html__( 'Email Address', 'jetpack' ),
			'subscribe_button'    	 => esc_html__( 'Subscribe', 'jetpack' ),
			'success_message'    	 => esc_html__( "Success! An email was just sent to confirm your subscription. Please find the email now and click 'Confirm Follow' to start subscribing.", 'jetpack' ),
			'show_subscribers_total' => true,
		);
	}

	function form( $instance ) {
		$instance = wp_parse_args( (array) $instance, $this->defaults() );

		$title               	= stripslashes( $instance['title'] );
		$subscribe_text      	= stripslashes( $instance['subscribe_text'] );
		$subscribe_placeholder 	= stripslashes( $instance['subscribe_placeholder'] );
		$subscribe_button    	= stripslashes( $instance['subscribe_button'] );
		$success_message		= stripslashes( $instance['success_message']);
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
		<textarea class="widefat" id="<?php echo $this->get_field_id( 'subscribe_text' ); ?>" name="<?php echo $this->get_field_name( 'subscribe_text' ); ?>" rows="3"><?php echo esc_html( $subscribe_text ); ?></textarea>
	</label>
</p>
<p>
	<label for="<?php echo $this->get_field_id( 'subscribe_placeholder' ); ?>">
		<?php esc_html_e( 'Subscribe Placeholder:', 'jetpack' ); ?>
		<input class="widefat" id="<?php echo $this->get_field_id( 'subscribe_placeholder' ); ?>" name="<?php echo $this->get_field_name( 'subscribe_placeholder' ); ?>" type="text" value="<?php echo esc_attr( $subscribe_placeholder ); ?>" />
	</label>
</p>
<p>
	<label for="<?php echo $this->get_field_id( 'subscribe_button' ); ?>">
		<?php _e( 'Subscribe Button:', 'jetpack' ); ?>
		<input class="widefat" id="<?php echo $this->get_field_id( 'subscribe_button' ); ?>" name="<?php echo $this->get_field_name( 'subscribe_button' ); ?>" type="text" value="<?php echo esc_attr( $subscribe_button ); ?>" />
	</label>
</p>
<p>
	<label for="<?php echo $this->get_field_id( 'success_message' ); ?>">
		<?php _e( 'Success Message Text:', 'jetpack' ); ?>
		<textarea class="widefat" id="<?php echo $this->get_field_id( 'success_message' ); ?>" name="<?php echo $this->get_field_name( 'success_message' ); ?>" rows="5"><?php echo esc_html( $success_message ); ?></textarea>
	</label>
</p>
<p>
	<label for="<?php echo $this->get_field_id( 'show_subscribers_total' ); ?>">
		<input type="checkbox" id="<?php echo $this->get_field_id( 'show_subscribers_total' ); ?>" name="<?php echo $this->get_field_name( 'show_subscribers_total' ); ?>" value="1"<?php echo $show_subscribers_total; ?> />
		<?php echo esc_html( sprintf( _n( 'Show total number of subscribers? (%s subscriber)', 'Show total number of subscribers? (%s subscribers)', $subscribers_total, 'jetpack' ), $subscribers_total ) ); ?>
	</label>
</p>
<?php
	}
}

add_shortcode( 'jetpack_subscription_form', 'jetpack_do_subscription_form' );
add_shortcode( 'blog_subscription_form', 'jetpack_do_subscription_form' );

function jetpack_do_subscription_form( $instance ) {
	if ( empty( $instance ) || ! is_array( $instance ) ) {
		$instance = array();
	}
	$instance['show_subscribers_total'] = empty( $instance['show_subscribers_total'] ) ? false : true;

	$instance = shortcode_atts(
		Jetpack_Subscriptions_Widget::defaults(),
		$instance,
		'jetpack_subscription_form'
	);
	$args = array(
		'before_widget' => sprintf( '<div class="%s">', 'jetpack_subscription_widget' ),
	);
	ob_start();
	the_widget( 'Jetpack_Subscriptions_Widget', $instance, $args );
	$output = ob_get_clean();
	return $output;
}
