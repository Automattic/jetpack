<?php

/**
 * Module Name: Jetpack Comments
 * Module Description: A new comment system that has integrated social media login options.
 * First Introduced: 0:1.2.3
 * Sort Order: 2
 */

/**
 * Main Jetpack Comments class
 *
 * @package JetpackComments
 * @version 1.4
 * @since 1.4
 */
class Jetpack_Comments {

	/** Variables *************************************************************/

	/**
	 * The default comment form greeting
	 * @var string
	 */
	var $default_greeting = ''; // Set in constructor

	/**
	 * The default comment form color scheme
	 * @var string
	 */
	var $default_color_scheme = '';

	/**
	 * The default comment form custom CSS url
	 * @var string
	 */
	var $default_custom_css_url = '';

	/**
	 * The default comment form color scheme
	 * @var string
	 */
	var $color_schemes = array();

	/**
	 * Possible comment form sources
	 * @var array
	 */
	var $id_sources = array();

	/**
	 * URL
	 * @var string
	 */
	var $signed_url = '';

	/** Methods ***************************************************************/

	/**
	 * Main constructor for Jetpack Comments
	 *
	 * @since JetpackComments (1.4)
	 */
	public function __construct() {
		$this->setup_globals();
		$this->setup_actions();
		$this->setup_filters();

		// Jetpack Comments is loaded
		do_action_ref_array( 'jetpack_comments_loaded', array( $this ) );
	}

	/** Private Methods *******************************************************/

	/**
	 * Set any global variables or class variables
	 * @since JetpackComments (1.4)
	 */
	private function setup_globals() {

		// Default option values
		$this->default_greeting       = __( 'Leave a Reply', 'jetpack' );
		$this->default_color_scheme   = 'light';
		$this->default_custom_css_url = '';

		// Possible color schemes
		$this->color_schemes = array(
			'light'        => __( 'Light',        'jetpack' ),
			'dark'         => __( 'Dark',         'jetpack' ),
			'transparent'  => __( 'Transparent',  'jetpack' ),
		);

		// Sources
		$this->id_sources = array(
			'guest',
			'jetpack',
			'wordpress',
			'twitter',
			'facebook'
		);
	}

	/**
	 * Setup actions for methods in this class
	 * @since JetpackComments (1.4)
	 */
	private function setup_actions() {

		// Setup settings
		add_action( 'admin_init', array( $this, 'add_settings' ) );

		// Selfishly remove everything from the existing comment form
		remove_all_actions( 'comment_form_before' );
		remove_all_actions( 'comment_form_after'  );

		// Selfishly add only our actions back to the comment form
		add_action( 'comment_form_before', array( $this, 'comment_form_before' ) );
		add_action( 'comment_form_after',  array( $this, 'comment_form_after'  ) );

		// Before a comment is posted
		add_action( 'pre_comment_on_post', array( $this, 'pre_comment_on_post' ), 1 );
		add_action( 'pre_comment_on_post', array( $this, 'allow_logged_out_user_to_comment_as_external' ) );

		// After a comment is posted
		add_action( 'comment_post', array( $this, 'set_comment_and_tab_cookies' ) );
		add_action( 'comment_post', array( $this, 'add_comment_meta'            ) );

		// Add some JS to the footer
		add_action( 'wp_footer', array( $this, 'watch_comment_parent' ), 100 );
	}

	/**
	 * Setup filters for methods in this class
	 *
	 * @since JetpackComments (1.4)
	 */
	private function setup_filters() {
		add_filter( 'comments_array',     array( $this, 'comments_array' ) );
		add_filter( 'preprocess_comment', array( $this, 'allow_logged_in_user_to_comment_as_guest' ), 0 );
		add_filter( 'get_avatar',         array( $this, 'get_avatar' ), 10, 4 );
	}

	/** Output Methods ********************************************************/

	/**
	 * Start capturing the core comment_form() output
	 * @since JetpackComments (1.4)
	 */
	public function comment_form_before() {
		ob_start();
	}

	/**
	 * Noop teh default comment form output, get some options, and output our
	 * tricked out totally radical comment form.
	 *
	 * @since JetpackComments (1.4)
	 */
	public function comment_form_after() {

		// Throw it all out and drop in our replacement
		ob_end_clean();

		// If users are required to be logged in, and they're not, then we don't need to do anything else
		if ( get_option( 'comment_registration' ) && !is_user_logged_in() ) {
			echo '<p id="must-log-in-to-comment">' . sprintf( apply_filters( 'jetpack_must_log_in_to_comment', __( 'You must <a href="%s">log in</a> to post a comment.', 'jetpack' ) ), wp_login_url( get_permalink() . '#respond' ) ) . '</p>';
			return;
		}

		$signing = array();
		$params  = array(
			'blogid'               => Jetpack::get_option( 'id' ),
			'postid'               => get_the_ID(),
			'comment_registration' => ( get_option( 'comment_registration' ) ? '1' : '0' ), // Need to explicitly send a '1' or a '0' for these
			'require_name_email'   => ( get_option( 'require_name_email' )   ? '1' : '0' ),
			'stc_enabled'          => ( get_option( 'stc_enabled' )          ? '1' : '0' ),
			'stb_enabled'          => ( get_option( 'stb_enabled' )          ? '1' : '0' ),
			'show_avatars'         => ( get_option( 'show_avatars' )         ? '1' : '0' ),
			'avatar_default'       => get_option( 'avatar_default' ),
			'greeting'             => get_option( 'highlander_comment_form_prompt', __( 'Leave a Reply', 'jetpack' ) ),
			'color_scheme'         => get_option( 'jetpack_comment_form_color_scheme',   0  ),
			//'custom_css_url'       => get_option( 'jetpack_comment_form_custom_css_url', '' ),
			'lang'                 => get_bloginfo( 'language' ),
		);

		// Extra parameters for logged in user
		if ( is_user_logged_in() ) {
			$current_user           = wp_get_current_user();
			$params['hc_post_as']   = 'jetpack';
			$params['hc_userid']    = $current_user->ID;
			$params['hc_username']  = $current_user->display_name;
			$params['hc_userurl']   = $current_user->user_url;
			$params['hc_useremail'] = md5( strtolower( trim( $current_user->user_email ) ) );
			if ( current_user_can( 'unfiltered_html' ) )
				$params['_wp_unfiltered_html_comment'] = wp_create_nonce( 'unfiltered-html-comment_' . get_the_ID() );
		}

		ksort( $params );

		foreach ( $params as $k => $v )
			$signing[] = "{$k}={$v}";

		$url_origin       = ( is_ssl() ? 'https' : 'http' ) . '://jetpack.wordpress.com';
		$params['sig']    = hash_hmac( 'sha1', implode( ':', $signing ), Jetpack::get_option( 'blog_token' ) );
		$url              = "{$url_origin}/jetpack-comment/?" . http_build_query( $params );
		$url              = "{$url}#parent=" . urlencode( ( is_ssl() ? 'https://' : 'http://' ) . $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI'] );
		$this->signed_url = $url;
		$height           = $params['comment_registration'] || is_user_logged_in() ? '315' : '430'; // Iframe can be shorter if we're not allowing guest commenting
		$transparent      = ( $params['color_scheme'] == 'transparent' ) ? 'true' : 'false';

		if ( isset( $_GET['replytocom'] ) ) {
			$url .= '&replytocom=' . (int) $_GET['replytocom'];
		}

		// The actual iframe (loads comment form from Jetpack server)
		?>

		<div id="respond">
			<div id="cancel-comment-reply-link" style="display:none; float:right;"><a href="#"><?php echo esc_html( __( 'Cancel Reply', 'jetpack' ) ); ?></a></div>
			<iframe src="<?php echo esc_url( $url ); ?>" allowtransparency="<?php echo $transparent; ?>" style="width:100%; height: <?php echo $height; ?>px;border:0px;" frameBorder="0" scrolling="no" name="jetpack_remote_comment" id="jetpack_remote_comment"></iframe>
		</div>

		<?php // Below is required for comment reply JS to work ?>

		<input type="hidden" name="comment_parent" id="comment_parent" value="" />

		<?php
	}

	/**
	 * Add some JS to wp_footer to watch for hierarchical reply parent change
	 *
	 * @since JetpackComments (1.4)
	 */
	public function watch_comment_parent() {
		$url_origin = ( is_ssl() ? 'https' : 'http' ) . '://jetpack.wordpress.com';
	?>

		<script type="text/javascript">
			var comm_par = document.getElementById( 'comment_parent' ).value,
			    frame = document.getElementById( 'jetpack_remote_comment' ),
			    tellFrameNewParent;

			tellFrameNewParent = function() {
				if ( comm_par ) {
					frame.src = <?php echo json_encode( esc_url_raw( $this->signed_url ) ); ?> + '&replytocom=' + parseInt( comm_par, 10 ).toString();
				} else {
					frame.src = <?php echo json_encode( esc_url_raw( $this->signed_url ) ); ?>;
				}
			};

			addComment._Jetpack_moveForm = addComment.moveForm;

			addComment.moveForm = function( commId, parentId, respondId, postId ) {
				var returnValue = addComment._Jetpack_moveForm( commId, parentId, respondId, postId ), cancelClick, cancel;

				if ( false === returnValue ) {
					cancel = document.getElementById( 'cancel-comment-reply-link' );
					cancelClick = cancel.onclick;
					cancel.onclick = function() {
						var cancelReturn = cancelClick.call( this );
						if ( false !== cancelReturn ) {
							return cancelReturn;
						}

						if ( !comm_par ) {
							return cancelReturn;
						}

						comm_par = 0;

						tellFrameNewParent();

						return cancelReturn;
					};
				}

				if ( comm_par == parentId ) {
					return returnValue;
				}

				comm_par = parentId;

				tellFrameNewParent();

				return returnValue;
			};

			if ( window.postMessage ) {
				window.addEventListener( 'message', function( event ) {
					if ( <?php echo json_encode( esc_url_raw( $url_origin ) ); ?> !== event.origin ) {
						return;
					}

					jQuery( frame ).height( event.data );
				} );
			}
		</script>

	<?php
	}

	/**
	 * After commenting as a guest while logged in, the user needs to see both:
	 *
	 * ( user_id = blah AND comment_approved = 0 )
	 *
	 * ...and...
	 *
	 * ( comment_author_email = blah AND comment_approved = 0 )
	 *
	 * Core only does the first since the user is logged in.
	 *
	 * Add the second to the comments array.
	 */
	public function comments_array( $comments ) {
		global $wpdb, $post;

		$commenter = $this->get_current_commenter();

		if ( empty( $commenter['user_id'] ) )
			return $comments;

		if ( empty( $commenter['comment_author'] ) )
			return $comments;

		$in_moderation_comments = $wpdb->get_results( $wpdb->prepare(
			"SELECT * FROM {$wpdb->comments} WHERE comment_post_ID = %d AND user_id = 0 AND comment_author = %s AND comment_author_email = %s AND comment_approved = '0' ORDER BY comment_date_gmt",
			$post->ID,
			wp_specialchars_decode( $commenter['comment_author'], ENT_QUOTES ),
			$commenter['comment_author_email']
		) );

		if ( empty( $in_moderation_comments ) )
			return $comments;

		// @todo ZOMG this is still a bad idea
		$comments = array_merge( $comments, $in_moderation_comments );
		usort( $comments, array( $this, 'sort_comments_by_comment_date_gmt' ) );
		return $comments;
	}

	/**
	 * Sort some comments. (See comments_array above)
	 *
	 * @since JetpackComments (1.4)
	 * @param obj $a
	 * @param obj $b
	 * @return int
	 */
	public function sort_comments_by_comment_date_gmt( $a, $b ) {
		if ( $a->comment_date_gmt == $b->comment_date_gmt )
			return 0;

		return ( $a->comment_date_gmt < $b->comment_date_gmt ) ? -1 : 1;
	}

	/**
	 * Get the current commenter's information from their cookie
	 *
	 * @since JetpackComments (1.4)
	 * @return array Commenters information from cookie
	 */
	private function get_current_commenter() {

		// Defaults
		$user_id              = 0;
		$comment_author       = '';
		$comment_author_email = '';
		$comment_author_url   = '';

		if ( isset( $_COOKIE['comment_author_' . COOKIEHASH] ) )
			$comment_author = $_COOKIE['comment_author_' . COOKIEHASH];

		if ( isset( $_COOKIE['comment_author_email_' . COOKIEHASH] ) )
			$comment_author_email = $_COOKIE['comment_author_email_' . COOKIEHASH];

		if ( isset( $_COOKIE['comment_author_url_' . COOKIEHASH] ) )
			$comment_author_url = $_COOKIE['comment_author_url_' . COOKIEHASH];

		if ( is_user_logged_in() ) {
			$user    = wp_get_current_user();
			$user_id = $user->ID;
		}

		return compact( 'comment_author', 'comment_author_email', 'comment_author_url', 'user_id' );
	}

	/**
	 * Verify the hash included in remote comments.
	 *
	 * @since JetpackComments (1.4)
	 * @param type $comment Not used
	 */
	public function pre_comment_on_post( $comment ) {
		$post_array = stripslashes_deep( $_POST );

		// Bail if missing the Jetpack token
		if ( ! isset( $post_array['sig'] ) ) {
			unset( $_POST['hc_post_as'] );
			return;
		}

		$sig = $post_array['sig'];
		unset( $post_array['sig'] );

		if ( FALSE !== strpos( $post_array['hc_avatar'], '.gravatar.com' ) )
			$post_array['hc_avatar'] = htmlentities( $post_array['hc_avatar'] );

		$secret = Jetpack::get_option( 'blog_token' );

		$signing = array();

		foreach( $post_array as $k => $v )
			$signing[] = "{$k}={$v}";

		$check = hash_hmac( 'sha1', implode( ":", $signing ), $secret );

		// Bail if token is expired or not valid
		if ( $sig != $check )
			wp_die( __( 'Invalid security token.', 'jetpack' ) );
	}

	/** Settings **************************************************************/

	/**
	 * Add the Jetpack settings to WordPress's discussions page
	 *
	 * @since JetpackComments (1.4)
	 */
	public function add_settings() {

		// Create the section
		add_settings_section(
			'jetpack_comment_form',
			__( 'Jetpack Comments', 'jetpack' ),
			array( $this, 'comment_form_settings_section' ),
			'discussion'
		);

		/** Clever Greeting ***************************************************/

		add_settings_field(
			'highlander_comment_form_prompt',
			__( 'Greeting Text', 'jetpack' ),
			array( $this, 'comment_form_greeting_setting' ),
			'discussion',
			'jetpack_comment_form'
		);

		register_setting(
			'discussion',
			'highlander_comment_form_prompt',
			array( $this, 'comment_form_greeting_sanitize' )
		);

		/** Color Scheme ******************************************************/

		add_settings_field(
			'jetpack_comment_form_color_scheme',
			__( 'Color Scheme', 'jetpack' ),
			array( $this, 'comment_form_color_scheme_setting' ),
			'discussion',
			'jetpack_comment_form'
		);

		register_setting(
			'discussion',
			'jetpack_comment_form_color_scheme',
			array( $this, 'comment_form_color_scheme_sanitize' )
		);

		/** Custom CSS ********************************************************/

		/** @todo Not ready yet
		add_settings_field(
			'jetpack_comment_form_custom_css_url',
			__( 'Custom CSS', 'jetpack' ),
			array( $this, 'comment_form_custom_css_setting' ),
			'discussion',
			'jetpack_comment_form'
		);

		register_setting(
			'discussion',
			'jetpack_comment_form_custom_css_url',
			array( $this, 'comment_form_custom_css_sanitize' )
		);
		/**/
	}

	/**
	 * Discussions setting section blurb
	 *
	 * @since JetpackComments (1.4)
	 */
	public function comment_form_settings_section() {
	?>

		<p><?php _e( 'Trick-out your Jetpack Comments form with a clever greeting, color-scheme, and custom CSS.', 'jetpack' ); ?></p>

	<?php
	}

	/**
	 * Custom Comment Greeting Text
	 *
	 * @since JetpackComments (1.4)
	 */
	public function comment_form_greeting_setting() {

		// The greeting
		$greeting = get_option( 'highlander_comment_form_prompt', $this->default_greeting ); ?>

		<input type="text" name="highlander_comment_form_prompt" id="jetpack-comment-form-greeting" value="<?php echo esc_attr( $greeting ); ?>" class="regular-text">
		<p class="description"><?php _e( 'A few catchy words to motivate your readers to comment', 'jetpack' ); ?></p>

	<?php
	}

	/**
	 * Sanitize the clever comment greeting
	 *
	 * @since JetpackComments (1.4)
	 * @param type $val
	 * @return string
	 */
	function comment_form_greeting_sanitize( $val ) {

		// Delete if empty or the default
		if ( empty( $val ) || ( $this->default_greeting == $val ) ) {
			delete_option( 'highlander_comment_form_prompt' );
			return false;
		}

		return wp_kses( $val, array() );
	}

	/**
	 * Color Scheme Setting
	 *
	 * @since JetpackComments (1.4)
	 */
	public function comment_form_color_scheme_setting() {

		// The color scheme
		$scheme = get_option( 'jetpack_comment_form_color_scheme', $this->default_color_scheme ); ?>

		<fieldset>
			<legend class="screen-reader-text"><?php _e( 'Color Scheme', 'jetpack' ); ?></legend>

			<?php foreach( $this->color_schemes as $key => $label ) : ?>

				<label>
					<input type="radio" name="jetpack_comment_form_color_scheme" id="jetpack-comment-form-color-scheme" value="<?php echo $key; ?>" <?php checked( $scheme, $key ); ?>>
					<?php echo $label; ?>
				</label>
				<br />

			<?php endforeach; ?>

		</fieldset>

	<?php
	}

	/**
	 * Sanitize the color scheme
	 *
	 * @since JetpackComments (1.4)
	 * @param type $val
	 * @return string
	 */
	public function comment_form_color_scheme_sanitize( $val ) {

		// Delete the option if it's the default
		if ( empty( $val ) || !in_array( $val, array_keys( $this->color_schemes ) ) ) {
			delete_option( 'jetpack_comment_form_color_scheme' );
			$val = $this->default_color_scheme;
		}

		return $val;
	}

	/**
	 * Color Scheme Setting
	 *
	 * @since JetpackComments (1.4)
	 */
	public function comment_form_custom_css_setting() {

		// The color scheme
		$scheme = get_option( 'jetpack_comment_form_custom_css_url', '' ); ?>

		<input type="text" name="jetpack_comment_form_custom_css_url" id="jetpack-comment-form-custom-css" value="<?php echo esc_attr( $scheme ); ?>" class="regular-text code">
		<p class="description"><?php _e( 'The complete URL to a .css file to include in your comment form', 'jetpack' ); ?></p>

	<?php
	}

	/**
	 * Sanitize the custom CSS url
	 *
	 * @since JetpackComments (1.4)
	 * @param type $val
	 * @return string
	 */
	public function comment_form_custom_css_sanitize( $val ) {

		// Delete the option if it's empty
		if ( empty( $val ) ) {
			delete_option( 'jetpack_comment_form_custom_css_url' );
			return false;
		}

		return esc_url_raw( $val );
	}

	/** Capabilities **********************************************************/

	/**
	 * Can a logged out user comment with an external service like Facebook
	 * or Twitter?
	 *
	 * @since JetpackComments (1.4)
	 * @return If no
	 */
	function allow_logged_out_user_to_comment_as_external() {
		if ( !$this->is_jetpack_comment_post( 'facebook', 'twitter' ) ) {
			return;
		}

		add_filter( 'pre_option_comment_registration', '__return_zero' );
	}

	/**
	 * Can a logged in user comment as a logged out user?
	 *
	 * @since JetpackComments (1.4)
	 * @param array $comment_data
	 * @return int
	 */
	function allow_logged_in_user_to_comment_as_guest( $comment_data ) {

		// Bail if user registration is allowed
		if ( get_option( 'comment_registration' ) ) {
			return $comment_data;
		}

		// Bail if user is not logged in or not a post request
		if ( 'post' != strtolower( $_SERVER['REQUEST_METHOD'] ) || ! is_user_logged_in() ) {
			return $comment_data;
		}

		// Bail if this is not a comment post request
		if ( ! $this->is_jetpack_comment_post( 'guest', 'facebook', 'twitter' ) ) {
			return $comment_data;
		}

		$user = wp_get_current_user();

		foreach ( array( 'comment_author' => 'display_name', 'comment_author_email' => 'user_email', 'comment_author_url' => 'user_url' ) as $comment_field => $user_field ) {
			if ( $comment_data[$comment_field] != addslashes( $user->$user_field ) ) {
				return $comment_data; // some other plugin already did something funky
			}
		}

		if ( get_option( 'require_name_email' ) ) {
			if ( 6 > strlen( $_POST['email'] ) || empty( $_POST['author'] ) ) {
				wp_die( __( 'Error: please fill the required fields (name, email).' ) );
			} elseif ( ! is_email( $_POST['email'] ) ) {
				wp_die( __( 'Error: please enter a valid email address.' ) );
			}
		}

		foreach ( array( 'comment_author' => 'author', 'comment_author_email' => 'email', 'comment_author_url' => 'url' ) as $comment_field => $post_field )
			$comment_data[$comment_field] = $_POST[$post_field];

		$comment_data['user_id'] = $comment_data['user_ID'] = 0;

		return $comment_data;
	}

	/**
	 * Is this a Jetpack Comments comment post request?
	 *
	 * @since JetpackComments (1.2)
	 * @return boolean
	 */
	public function is_jetpack_comment_post() {
		if ( empty( $_POST['hc_post_as'] ) ) {
			return;
		}

		if ( func_num_args() ) {
			foreach ( func_get_args() as $id_source ) {
				if ( $id_source === $_POST['hc_post_as'] ) {
					return $id_source;
				}
			}
			return false;
		}

		return is_string( $_POST['hc_post_as'] ) && in_array( $_POST['hc_post_as'], $this->id_sources ) ? $_POST['hc_post_as'] : false;
	}

	/**
	 * Set the comment cookies or bail if comment is invalid
	 *
	 * @since JetpackComments (1.4)
	 * @param type $comment_id
	 * @return If comment is invalid
	 */
	public function set_comment_and_tab_cookies( $comment_id ) {

		// Get comment and bail if it's invalid somehow
		$comment = get_comment( $comment_id );
		if ( empty( $comment ) || is_wp_error( $comment ) )
			return;

		// Clear the autosave cookie
		// setcookie( "comment-{$comment->comment_post_ID}", ' ', time() - 86400, '/' );

		$id_source = $this->is_jetpack_comment_post();
		if ( empty( $id_source ) ) {
			return;
		}

		setcookie( 'hc_post_as', $id_source, time() + 172800, '/', COOKIE_DOMAIN );

		// Set comment author cookies
		if ( ( 'wordpress' != $id_source ) && is_user_logged_in() ) {
			$comment_cookie_lifetime = apply_filters( 'comment_cookie_lifetime', 30000000 );
			setcookie( 'comment_author_'       . COOKIEHASH, $comment->comment_author, time() + $comment_cookie_lifetime,              COOKIEPATH, COOKIE_DOMAIN );
			setcookie( 'comment_author_email_' . COOKIEHASH, $comment->comment_author_email, time() + $comment_cookie_lifetime,        COOKIEPATH, COOKIE_DOMAIN );
			setcookie( 'comment_author_url_'   . COOKIEHASH, esc_url($comment->comment_author_url), time() + $comment_cookie_lifetime, COOKIEPATH, COOKIE_DOMAIN );
		}
	}

	/**
	 * Add some additional comment meta after comment is saved about what
	 * service the comment is from, the avatar, user_id, etc...
	 *
	 * @since JetpackComments (1.4)
	 * @param type $comment_id
	 */
	public function add_comment_meta( $comment_id ) {
		$comment_meta = array();

		switch( $this->is_jetpack_comment_post() ) {
			case 'facebook' :
				$comment_meta['hc_post_as']         = 'facebook';
				$comment_meta['hc_avatar']          = stripslashes( $_POST['hc_avatar'] );
				$comment_meta['hc_foreign_user_id'] = stripslashes( $_POST['hc_userid'] );
				break;

			case 'twitter' :
				$comment_meta['hc_post_as']         = 'twitter';
				$comment_meta['hc_avatar']          = stripslashes( $_POST['hc_avatar'] );
				$comment_meta['hc_foreign_user_id'] = stripslashes( $_POST['hc_userid'] );
				break;

			case 'wordpress' :
				$comment_meta['hc_post_as']			= 'wordpress';
				$comment_meta['hc_avatar']			= stripslashes( $_POST['hc_avatar'] );
				$comment_meta['hc_foreign_user_id'] = stripslashes( $_POST['hc_userid'] );
				break;

			case 'jetpack' :
				$comment_meta['hc_post_as']			= 'jetpack';
				$comment_meta['hc_avatar']			= stripslashes( $_POST['hc_avatar'] );
				$comment_meta['hc_foreign_user_id'] = stripslashes( $_POST['hc_userid'] );
				break;

		}

		// Bail if no extra comment meta
		if ( empty( $comment_meta ) )
			return;

		// Loop through extra meta and add values
		foreach ( $comment_meta as $key => $value )
			add_comment_meta( $comment_id, $key, $value, true );
	}

	/** Avatars ***************************************************************/

	/**
	 * Get the avatar, possibly from Twitter, Facebook, Gravatar, or who knows
	 *
	 * @since JetpackComments (1.4)
	 * @param string $avatar Current avatar URL
	 * @param string $comment Comment for the avatar
	 * @param int $size Size of the avatar
	 * @param string $default Not used
	 * @return string New avatar
	 */
	public function get_avatar( $avatar, $comment, $size, $default ) {

		// it's not a comment
		if ( ! isset( $comment->comment_post_ID ) || ! isset( $comment->comment_ID ) ) {
			return $avatar;
		}

		// Facebook or Twitter
		if ( false === strpos( $comment->comment_author_url, '/www.facebook.com/' ) && false === strpos( $comment->comment_author_url, '/twitter.com/' ) ) {
			return $avatar;
		}

		// Somewhere else
		$foreign_avatar = get_comment_meta( $comment->comment_ID, 'hc_avatar', true );
		if ( empty( $foreign_avatar ) ) {
			return $avatar;
		}

		// Dishout the Imgpress avatar
		return preg_replace( '#src=([\'"])[^\'"]+\\1#', 'src=\\1' . esc_url( $this->imgpress_avatar( $foreign_avatar, $size ) ) . '\\1', $avatar );
	}

	/**
	 * Get an avatar from Imgpress
	 *
	 * @since JetpackComments (1.4)
	 * @param string $url
	 * @param int $size
	 * @return string
	 */
	private function imgpress_avatar( $url, $size ) {

		// Setup the args to use
		$args = urlencode_deep( array(
			'url' 	 => $url,
			'resize' => "$size,$size",
		) );

		$url = apply_filters( 'jetpack_static_url', ( is_ssl() ? 'https://s-ssl.wordpress.com' : 'http://s.wordpress.com' ) . '/imgpress' );
		$url = add_query_arg( $args, $url );

		return $url;
	}
}

$jetpack_comments = new Jetpack_Comments;
