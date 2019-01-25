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

		// Catch subscription widget submits
		if ( isset( $_REQUEST['jetpack_subscriptions_widget'] ) )
			add_action( 'template_redirect', array( $this, 'widget_submit' ) );

		// Set up the comment subscription checkboxes
		add_filter( 'comment_form_submit_button', array( $this, 'comment_subscribe_init' ), 10, 2 );

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
	 *
	 * @param string $submit_button HTML markup for the submit button.
	 * @param array  $args          Arguments passed to `comment_form()`.
	 */
	function comment_subscribe_init( $submit_button, $args ) {
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
		$str = apply_filters( 'jetpack_comment_subscription_form', $str );

		return $str . $submit_button;
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

include dirname( __FILE__ ) . '/subscriptions/views.php';
