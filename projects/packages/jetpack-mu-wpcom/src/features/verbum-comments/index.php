<?php
/**
 * Plugin Name: Verbum Comments Experience
 * Description: Preact app for commenting on WordPress.com sites
 * Author: Vertex
 */

namespace Automattic\Jetpack;

require_once __DIR__ . '/assets/verbum-auth.php';
require_once __DIR__ . '/assets/verbum-embed.php';
require_once __DIR__ . '/assets/gutenberg-comments.php';

class Verbum_Comments {
	public $blog_id;

	public function __construct() {
		$this->blog_id = get_current_blog_id();

		// Jetpack loads the app via an iframe, so we need to get the blog id from the query string.
		if ( isset( $_GET['blogid'] ) ) {
			$this->blog_id = intval( $_GET['blogid'] );
		}

		// Selfishly remove everything from the existing comment form
		add_filter( 'comment_form_field_comment', '__return_false', 11 );
		add_filter( 'comment_form_logged_in', '__return_empty_string' );
		add_filter( 'comment_form_defaults', array( $this, 'comment_form_defaults' ), 20 );
		remove_action( 'comment_form', 'subscription_comment_form' );
		remove_all_filters( 'comment_form_default_fields' );
		add_filter( 'comment_form_default_fields', array( $this, 'comment_form_default_fields' ) );
		add_action( 'clear_auth_cookie', array( $this, 'clear_fb_cookies' ) );

		// Fix comment reply link when `comment_registration` is required.
		add_filter( 'comment_reply_link', array( $this, 'comment_reply_link' ), 10, 4 );

		// Add Verbum.
		add_action( 'comment_form_must_log_in_after', array( $this, 'verbum_render_element' ) );
		add_filter( 'comment_form_submit_field', array( $this, 'verbum_render_element' ) );
		add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_assets' ) );

		// Do things before the comment is accepted.
		add_action( 'pre_comment_on_post', array( $this, 'check_comment_allowed' ) );
		add_action( 'pre_comment_on_post', array( $this, 'allow_logged_out_user_to_comment_as_external' ), 100 ); // Set priority high to run after check to make sure they are logged in to the external service.
		add_filter( 'preprocess_comment', array( $this, 'verify_external_account' ), 0 );

		// After the comment is saved, we add meta data to the comment.
		add_action( 'comment_post', array( $this, 'add_verbum_meta_data' ) );

		// Load the Gutenberg editor for comments.
		if (
			$this->should_load_gutenberg_comments()
		) {
			new \Verbum_Gutenberg_Editor();
		}
	}

	/**
	 * Load the div where Verbum app is rendered.
	 */
	public function verbum_render_element() {
		$color_scheme = get_blog_option( $this->blog_id, 'jetpack_comment_form_color_scheme' );
		$comment_url  = site_url( '/wp-comments-post.php' );

		if ( ! $color_scheme || '' === $color_scheme ) {
			// Default to transparent because it is more adaptable than white or dark.
			$color_scheme = 'transparent';
		}

		$verbum = '<div id="comment-form__verbum" class="' . $color_scheme . '"></div>' . $this->hidden_fields();

		// If the blog requires login, Verbum need to be wrapped in a <form> to work.
		// Verbum is given `mustLogIn` to handle the login flow.
		if ( get_option( 'comment_registration' ) && ! is_user_logged_in() ) {
			// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
			echo "<form action=\"$comment_url\" method=\"post\" id=\"commentform\" class=\"comment-form\">$verbum</form>";
		} else {
			return $verbum;
		}
	}

	/**
	 * Enqueue Assets
	 */
	public function enqueue_assets() {
		if (
			! ( is_singular() && comments_open() )
			&& ! ( is_front_page() && is_page() && comments_open() )
		) {
			return;
		}

		$version_js       = filemtime( __DIR__ . '/verbum-comments.js' );
		$version_css      = filemtime( __DIR__ . '/verbum-comments.css' );
		$connect_url      = site_url( '/public.api/connect/?action=request' );
		$primary_redirect = get_primary_redirect();

		if ( strpos( $primary_redirect, '.wordpress.com' ) === false ) {
			$connect_url = add_query_arg( 'domain', $primary_redirect, $connect_url );
		}

		// Enqueue styles
		wp_enqueue_style( 'verbum', plugins_url( '/verbum-comments.css', __FILE__ ), array(), $version_css );

		// Enqueue scripts
		wp_register_script(
			'verbum',
			plugins_url( 'verbum-comments.js', __FILE__ ),
			array(),
			$version_js,
			array(
				'strategy'  => 'defer',
				'in_footer' => true,
			)
		);
		\WP_Enqueue_Dynamic_Script::enqueue_script( 'verbum' );

		// Enqueue settings separately since the main script is dynamic.
		// We need the VerbumComments object to be available before the main script is loaded.
		wp_register_script(
			'verbum-settings',
			false,
			array(),
			$version_js,
			array(
				'strategy'  => 'defer',
				'in_footer' => true,
			)
		);

		$blog_details    = get_blog_details( $this->blog_id );
		$is_blog_atomic  = is_blog_atomic( $blog_details );
		$is_blog_jetpack = is_blog_jetpack( $blog_details );

		$subscribe_to_blog    = isset( $_GET['stb_enabled'] ) ? boolval( $_GET['stb_enabled'] ) : false;
		$subscribe_to_comment = isset( $_GET['stc_enabled'] ) ? boolval( $_GET['stc_enabled'] ) : false;

		// If it is simple, we set it to true. Simple sites return inconsistent results.
		if ( ! $is_blog_atomic && ! $is_blog_jetpack ) {
			$subscribe_to_blog    = true;
			$subscribe_to_comment = true;
		}

		// Jetpack Comments client side logged in user data
		$__get                        = stripslashes_deep( $_GET );
		$email_hash                   = isset( $__get['hc_useremail'] ) && is_string( $__get['hc_useremail'] ) ? $__get['hc_useremail'] : '';
		$jetpack_username             = isset( $__get['hc_username'] ) && is_string( $__get['hc_username'] ) ? $__get['hc_username'] : '';
		$jetpack_user_id              = isset( $__get['hc_userid'] ) && is_numeric( $__get['hc_userid'] ) ? (int) $__get['hc_userid'] : 0;
		$jetpack_signature            = isset( $__get['sig'] ) && is_string( $__get['sig'] ) ? $__get['sig'] : '';
		list( $jetpack_avatar )       = wpcom_get_avatar_url( "$email_hash@md5.gravatar.com" );
		$comment_registration_enabled = boolval( get_blog_option( $this->blog_id, 'comment_registration' ) );
		$post_id                      = isset( $_GET['postid'] ) ? intval( $_GET['postid'] ) : get_queried_object_id();
		$locale                       = get_locale();

		$vbe_cache_buster = filemtime( ABSPATH . '/widgets.wp.com/verbum-block-editor/build_meta.json' );

		wp_add_inline_script(
			'verbum-settings',
			'window.VerbumComments = ' . json_encode(
				array(
					'Log in or provide your name and email to leave a reply.' => __( 'Log in or provide your name and email to leave a reply.' ),
					'Receive web and mobile notifications for posts on this site.' => __( 'Receive web and mobile notifications for posts on this site.' ),
					'Name'                              => __( 'Name' ),
					'Email (address never made public)' => __( 'Email (address never made public)' ),
					'Website (optional)'                => __( 'Website (optional)' ),
					'Leave a reply. (log in optional)'  => __( 'Leave a reply. (log in optional)' ),
					'Log in to leave a reply.'          => __( 'Log in to leave a reply.' ),
					/* translators: %s is the name of the provider (WordPress, Facebook, Twitter) */
					'Logged in via %s'                  => __( 'Logged in via %s' ),
					'Log out'                           => __( 'Log out' ),
					'Email'                             => __( 'Email' ),
					'(Address never made public)'       => __( '(Address never made public)'), // phpcs:ignore PEAR.Functions.FunctionCallSignature.SpaceBeforeCloseBracket
					'Instantly'                         => __( 'Instantly' ),
					'Daily'                             => __( 'Daily' ),
					'Reply'                             => __( 'Reply' ),
					'WordPress'                         => __( 'WordPress' ),
					'Weekly'                            => __( 'Weekly' ),
					'Notify me of new posts'            => __( 'Notify me of new posts' ),
					'Email me new posts'                => __( 'Email me new posts' ),
					'Email me new comments'             => __( 'Email me new comments' ),
					'Cancel'                            => __( 'Cancel' ),
					'Write a comment...'                => __( 'Write a Comment...' ),
					'Website'                           => __( 'Website' ),
					'Optional'                          => __( 'Optional' ),
					/* translators: Success message of a modal when user subscribes */
					'We\'ll keep you in the loop!'      => __( 'We\'ll keep you in the loop!' ),
					'Loading your comment...'           => __( 'Loading your comment...' ),
					'Never miss a beat!'                => __( 'Never miss a beat!' ),
					'Interested in getting blog post updates? Simply click the button below to stay in the loop!' => __( 'Interested in getting blog post updates? Simply click the button below to stay in the loop!' ),
					'Enter your email address'          => __( 'Enter your email address' ),
					'Subscribe'                         => __( 'Subscribe' ),
					'Comment sent successfully'         => __( 'Comment sent successfully' ),
					'Save my name, email, and website in this browser for the next time I comment.' => __( 'Save my name, email, and website in this browser for the next time I comment.' ),
					'siteId'                            => $this->blog_id,
					'postId'                            => $post_id,
					'mustLogIn'                         => $comment_registration_enabled && ! is_user_logged_in(),
					'requireNameEmail'                  => boolval( get_blog_option( $this->blog_id, 'require_name_email' ) ),
					'commentRegistration'               => $comment_registration_enabled,
					'connectURL'                        => $connect_url,
					'logoutURL'                         => html_entity_decode( wp_logout_url() ),
					'homeURL'                           => home_url( '/' ),
					'subscribeToBlog'                   => $subscribe_to_blog,
					'subscribeToComment'                => $subscribe_to_comment,
					'isJetpackCommentsLoggedIn'         => is_jetpack_comments() && is_jetpack_comments_user_logged_in(),
					'jetpackUsername'                   => $jetpack_username,
					'jetpackUserId'                     => $jetpack_user_id,
					'jetpackSignature'                  => $jetpack_signature,
					'jetpackAvatar'                     => $jetpack_avatar,
					'enableBlocks'                      => boolval( $this->should_load_gutenberg_comments() ),
					'enableSubscriptionModal'           => boolval( $this->should_show_subscription_modal() ),
					'currentLocale'                     => $locale,
					'isJetpackComments'                 => is_jetpack_comments(),
					'allowedBlocks'                     => \Verbum_Gutenberg_Editor::get_allowed_blocks(),
					'embedNonce'                        => wp_create_nonce( 'embed_nonce' ),
					'verbumBundleUrl'                   => plugins_url( 'dist/index.js', __FILE__ ),
					'isRTL'                             => is_rtl( $locale ),
					'vbeCacheBuster'                    => $vbe_cache_buster,
				)
			),
			'before'
		);

		wp_enqueue_script( 'verbum-settings' );

		wp_enqueue_script(
			'verbum-dynamic-loader',
			plugins_url( 'assets/dynamic-loader.js', __FILE__ ),
			array(),
			$version_js,
			array(
				'strategy'  => 'defer',
				'in_footer' => true,
			)
		);
	}

	/**
	 * Remove some of the default comment_form args because they are not needed.
	 */
	public function comment_form_defaults( $args ) {
		return array_merge(
			$args,
			array(
				'comment_field'        => '',
				'must_log_in'          => '',
				'logged_in_as'         => '',
				'comment_notes_before' => '',
				'comment_notes_after'  => '',
				'title_reply'          => __( 'Leave a Reply' ),
				/* translators: % is the original posters name */
				'title_reply_to'       => __( 'Leave a Reply to %s' ),
				'cancel_reply_link'    => __( 'Cancel reply' ),
			)
		);
	}

	/**
	 * Set comment reply link.
	 * This is to fix the reply link when comment registration is required.
	 */
	public function comment_reply_link( $reply_link, $args, $comment, $post ) {
		// This is only necessary if comment_registration is required to post comments
		if ( ! get_option( 'comment_registration' ) ) {
			return $reply_link;
		}

		$comment    = get_comment( $comment );
		$respond_id = esc_attr( $args['respond_id'] );
		$add_below  = esc_attr( $args['add_below'] );
		/* This is to accommodate some themes that add an SVG to the Reply link like twenty-seventeen. */
		$reply_text  = wp_kses(
			$args['reply_text'],
			array(
				'svg' => array(
					'class'           => true,
					'aria-hidden'     => true,
					'aria-labelledby' => true,
					'role'            => true,
					'xmlns'           => true,
					'width'           => true,
					'height'          => true,
					'viewbox'         => true,
				),
				'use' => array(
					'href'       => true,
					'xlink:href' => true,
				),
			)
		);
		$before_link = wp_kses( $args['before'], wp_kses_allowed_html( 'post' ) );
		$after_link  = wp_kses( $args['after'], wp_kses_allowed_html( 'post' ) );

		$reply_url = esc_url( add_query_arg( 'replytocom', $comment->comment_ID . '#' . $respond_id ) );

		$link = <<<HTML
			$before_link
			<a class="comment-reply-link" href="$reply_url" onclick="return addComment.moveForm( '$add_below-$comment->comment_ID', '$comment->comment_ID', '$respond_id', '$post->ID' )">$reply_text</a>
			$after_link
			HTML;

		return $link;
	}

	/**
	 * Loop through all available fields and remove them.
	 *
	 * @param  array $fields
	 * @return array $fields with no HTML.
	 */
	public function comment_form_default_fields( $fields ) {
		foreach ( $fields as $field => $html ) {
			remove_all_filters( "comment_form_field_{$field}" );
			add_filter( "comment_form_field_{$field}", '__return_false', 100 );
		}

		return $fields;
	}

	/**
	 * Clear FB comments on logout. wp-login.php doesn't clear these by default.
	 *
	 * @return void
	 */
	public function clear_fb_cookies() {
		setcookie( 'wpc_fbc', ' ', time() - YEAR_IN_SECONDS, COOKIEPATH, COOKIE_DOMAIN );
	}

	/**
	 * Check Facebook token and return the user data.
	 */
	public static function verify_facebook_identity() {
		$data = wp_parse_args( isset( $_COOKIE['wpc_fbc'] ) ? sanitize_text_field( wp_unslash( $_COOKIE['wpc_fbc'] ) ) : array() );

		if ( empty( $data['access_token'] ) ) {
			return new \WP_Error( 'facebook', __( 'Error: your Facebook login has expired.' ) );
		}

		// Make a new request using the access token we were given.
		$request = wp_remote_get( 'https://graph.facebook.com/v6.0/me?fields=name,email,picture,id&access_token=' . urlencode( $data['access_token'] ) );
		if ( 200 != wp_remote_retrieve_response_code( $request ) ) {
			return new \WP_Error( 'facebook', __( 'Error: your Facebook login has expired.' ) );
		}

		$body = wp_remote_retrieve_body( $request );
		$json = json_decode( $body );

		if ( ! $body || ! $json ) {
			return new \WP_Error( 'facebook', __( 'Error: your Facebook login has expired.' ) );
		}

		return $json;
	}

	/**
	 * Allows a logged out user to leave a comment as a facebook credentialed user.
	 * Overrides WordPress' core comment_registration option to treat the commenter as "registered" (verified) users.
	 */
	public function allow_logged_out_user_to_comment_as_external() {
		$service = isset( $_POST['hc_post_as'] ) ? sanitize_text_field( wp_unslash( $_POST['hc_post_as'] ) ) : false; // phpcs:ignore WordPress.Security.NonceVerification.Missing -- nonce checked before saving comment

		if ( $service !== 'facebook' ) {
			return;
		}

		add_filter( 'pre_option_comment_registration', '__return_zero' );
		add_filter( 'pre_option_require_name_email', '__return_zero' );
	}

	/**
	 * Check if the comment is allowed by verifying the Facebook token.
	 *
	 * @return WP_Error|comment_data The comment data if the comment is allowed, or a WP_Error if not.
	 */
	public function verify_external_account( $comment_data ) {
		$service = isset( $_POST['hc_post_as'] ) ? sanitize_text_field( wp_unslash( $_POST['hc_post_as'] ) ) : false; // phpcs:ignore WordPress.Security.NonceVerification.Missing -- nonce checked before saving comment

		if ( $service === 'facebook' ) {
			$fb_comment_data = self::verify_facebook_identity();

			if ( is_wp_error( $fb_comment_data ) ) {
				wp_die( esc_html( $fb_comment_data->get_error_message() ) );
			}

			$comment_data['highlander'] = 'facebook';
		}

		return $comment_data;
	}

	/**
	 * Verify nonce before accepting comment.
	 *
	 * @return WP_Error|void
	 */
	public function check_comment_allowed() {
		// Don't check if we're using Jetpack Comments.
		if ( is_jetpack_comments() ) {
			return;
		}

		// Check for Highlander Nonce.
		if (
			isset( $_POST['highlander_comment_nonce'] ) &&
			wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['highlander_comment_nonce'] ), 'highlander_comment' ) )
		) {
			return;
		}

		return new \WP_Error( 'verbum', __( 'Error: please try commenting again.' ) );
	}

	/**
	 * Add all our custom fields to the comment meta after it is saved.
	 */
	public function add_verbum_meta_data( $comment_id ) {
		$comment_meta = array();
		// phpcs:disable WordPress.Security.NonceVerification.Missing -- nonce checked before saving comment
		$allowed_subscription_modal_statuses = array( 'showed', 'hidden_is_blog_member', 'hidden_jetpack', 'hidden_disabled', 'hidden_cookies_disabled', 'hidden_subscribe_not_enabled', 'hidden_already_subscribed', 'hidden_views_limit' );
		$hc_avatar                           = isset( $_POST['hc_avatar'] ) ? esc_url_raw( wp_unslash( $_POST['hc_avatar'] ) ) : '';
		$hc_userid                           = isset( $_POST['hc_foreign_user_id'] ) ? sanitize_text_field( wp_unslash( $_POST['hc_foreign_user_id'] ) ) : '';
		$service                             = isset( $_POST['hc_post_as'] ) ? sanitize_text_field( wp_unslash( $_POST['hc_post_as'] ) ) : '';
		$verbum_loaded_editor                = isset( $_POST['verbum_loaded_editor'] ) ? sanitize_text_field( wp_unslash( $_POST['verbum_loaded_editor'] ) ) : '';
		$verbum_subscription_modal_show      = isset( $_POST['verbum_show_subscription_modal'] ) && in_array( $_POST['verbum_show_subscription_modal'], $allowed_subscription_modal_statuses, true ) ? sanitize_text_field( wp_unslash( $_POST['verbum_show_subscription_modal'] ) ) : '';
		// phpcs:enable WordPress.Security.NonceVerification.Missing -- nonce checked before saving comment
		$allowed_comments_sources = array( 'gutenberg', 'textarea', 'textarea-slow-connection' );
		if ( in_array( $verbum_loaded_editor, $allowed_comments_sources ) ) {
			bump_stats_extras( 'verbum-comment-editor', $verbum_loaded_editor );
		}
		if ( $verbum_subscription_modal_show ) {
			bump_stats_extras( 'verbum-subscription-modal', $verbum_subscription_modal_show );
		}
		switch ( $service ) {
			case 'facebook':
				$comment_meta['hc_post_as']         = 'facebook';
				$comment_meta['hc_avatar']          = $hc_avatar;
				$comment_meta['hc_foreign_user_id'] = $hc_userid;

				bump_stats_extras( 'verbum-comment-posted', 'facebook' );
				break;

			case 'wordpress': // phpcs:ignore WordPress.WP.CapitalPDangit.Misspelled
				if ( 'wpcom' === wpcom_blog_site_id_label() ) {
					do_action( 'highlander_wpcom_post_comment_bump_stat', $comment_id ); // phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedHooknameFound
				}
				bump_stats_extras( 'verbum-comment-posted', 'wordpress' ); // phpcs:ignore WordPress.WP.CapitalPDangit.Misspelled
				break;

			case 'jetpack':
				if ( is_jetpack_comments() && is_jetpack_comments_user_logged_in() ) {
					$comment_meta['hc_post_as']         = 'jetpack';
					$comment_meta['hc_avatar']          = check_and_return_post_string( 'hc_avatar' );
					$comment_meta['hc_foreign_user_id'] = check_and_return_post_string( 'hc_userid' );

					bump_stats_extras( 'verbum-comment-posted', 'jetpack' );
				} else {
					jetpack_comments_die( 'JPC_HIGHLANDER_ADD_COMMENT_META' );
				}

				break;
			default:
				if ( is_user_logged_in() ) {
					bump_stats_extras( 'verbum-comment-posted', 'guest-logged-in' );
				} else {
					bump_stats_extras( 'verbum-comment-posted', 'guest' );
				}
				break;
		}

		foreach ( $comment_meta as $key => $value ) {
			add_comment_meta( $comment_id, $key, $value, true );
		}
	}

	/**
	 * Get the hidden fields for the comment form.
	 */
	public function hidden_fields() {
		$post_id                    = isset( $_GET['postid'] ) ? intval( $_GET['postid'] ) : get_queried_object_id();
		$is_current_user_subscribed = isset( $_GET['is_current_user_subscribed'] ) ? intval( $_GET['is_current_user_subscribed'] ) : 0;
		$nonce                      = wp_create_nonce( 'highlander_comment' );
		$hidden_fields              = get_comment_id_fields( $post_id ) . '
			<input type="hidden" name="highlander_comment_nonce" id="highlander_comment_nonce" value="' . esc_attr( $nonce ) . '" />
			<input type="hidden" name="verbum_show_subscription_modal" value="' . $this->subscription_modal_status() . '" />';

		if ( is_jetpack_comments() ) {
			$hidden_fields .= '
				<input type="hidden" name="jetpack-remote-blogid" value="' . $this->blog_id . '" />
				<input type="hidden" name="jetpack-remote-action" value="comment-post" />
				<input type="hidden" name="is_current_user_subscribed" value="' . $is_current_user_subscribed . '" />';

			$jetpack_nonce = isset( $_GET['jetpack_comments_nonce'] ) ? sanitize_text_field( wp_unslash( $_GET['jetpack_comments_nonce'] ) ) : false;
			if ( $jetpack_nonce ) {
				$hidden_fields .= '<input type="hidden" name="jetpack_comments_nonce" value="' . esc_attr( $jetpack_nonce ) . '" />';
			}
		}

		return '<div class="verbum-form-meta">' . $hidden_fields . '</div>';
	}

	/***
	 * Check if we should load the Gutenberg comments.
	 *
	 * Block should be carefully loaded to avoid Forums, P2, etc.
	 */
	public function should_load_gutenberg_comments() {
		// Don't load when jetpack or atomic for now, it does not look cool on dark themes.
		$is_jetpack_site = 522232 === get_current_blog_id();
		if ( $is_jetpack_site ) {
			return false;
		}

		$blog_id               = verbum_get_blog_id();
		$e2e_tests             = has_blog_sticker( 'a8c-e2e-test-blog', $blog_id );
		$has_blocks_flag       = has_blog_sticker( 'verbum-block-comments', $blog_id );
		$gutenberg_query_param = isset( $_GET['verbum_gutenberg'] ) ? intval( $_GET['verbum_gutenberg'] ) : null;
		// This will release to 10% of sites.
		$blog_in_10_percent    = $blog_id % 100 >= 90;
		$is_proxied            = isset( $_SERVER['A8C_PROXIED_REQUEST'] )
			? sanitize_text_field( wp_unslash( $_SERVER['A8C_PROXIED_REQUEST'] ) )
			: defined( 'A8C_PROXIED_REQUEST' ) && A8C_PROXIED_REQUEST;

		// Check if the parameter is set and its value is either 0 or 1, if any random value is passed, it is ignored.
		if ( ! is_null( $gutenberg_query_param ) ) {
			return $gutenberg_query_param === 1;
		}

		// return $is_proxied || $blog_id_in_percent || $e2e_tests || $has_blocks_flag;
		return $has_blocks_flag || $e2e_tests || $blog_in_10_percent;
	}

	public function should_show_subscription_modal() {
		$modal_enabled = get_option( 'jetpack_verbum_subscription_modal', true );
		return ! is_user_member_of_blog( '', $this->blog_id ) && $modal_enabled;
	}

	public function subscription_modal_status() {
		if ( is_user_member_of_blog( '', $this->blog_id ) ) {
			return 'hidden_is_blog_member';
		}
		if ( is_jetpack_comments() ) {
			return 'hidden_jetpack';
		}
		if ( ! get_option( 'jetpack_verbum_subscription_modal', true ) ) {
			return 'hidden_disabled';
		}
		return '';
	}
}
