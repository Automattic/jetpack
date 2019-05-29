<?php

require dirname( __FILE__ ) . '/base.php';

/**
 * Main Comments class
 *
 * @package JetpackComments
 * @version 1.4
 * @since   1.4
 */
class Jetpack_Comments extends Highlander_Comments_Base {

	/** Variables *************************************************************/

	/**
	 * Possible comment form sources
	 * @var array
	 */
	public $id_sources = array();

	/**
	 * URL
	 * @var string
	 */
	public $signed_url = '';

	/**
	 * The default comment form color scheme
	 * @var string
	 * @see ::set_default_color_theme_based_on_theme_settings()
	 */
	public $default_color_scheme = 'light';

	/** Methods ***************************************************************/

	public static function init() {
		static $instance = false;

		if ( ! $instance ) {
			$instance = new Jetpack_Comments;
		}

		return $instance;
	}

	/**
	 * Main constructor for Comments
	 *
	 * @since JetpackComments (1.4)
	 */
	public function __construct() {
		parent::__construct();

		// Comments is loaded

		/**
		 * Fires after the Jetpack_Comments object has been instantiated
		 *
		 * @module comments
		 *
		 * @since  1.4.0
		 *
		 * @param array $jetpack_comments_loaded First element in array of type Jetpack_Comments
		 **/
		do_action_ref_array( 'jetpack_comments_loaded', array( $this ) );
		add_action( 'after_setup_theme', array( $this, 'set_default_color_theme_based_on_theme_settings' ), 100 );
	}

	public function set_default_color_theme_based_on_theme_settings() {
		if ( function_exists( 'twentyeleven_get_theme_options' ) ) {
			$theme_options      = twentyeleven_get_theme_options();
			$theme_color_scheme = isset( $theme_options['color_scheme'] ) ? $theme_options['color_scheme'] : 'transparent';
		} else {
			$theme_color_scheme = get_theme_mod( 'color_scheme', 'transparent' );
		}
		// Default for $theme_color_scheme is 'transparent' just so it doesn't match 'light' or 'dark'
		// The default for Jetpack's color scheme is still defined above as 'light'

		if ( false !== stripos( $theme_color_scheme, 'light' ) ) {
			$this->default_color_scheme = 'light';
		} elseif ( false !== stripos( $theme_color_scheme, 'dark' ) ) {
			$this->default_color_scheme = 'dark';
		}
	}

	/** Private Methods *******************************************************/

	/**
	 * Set any global variables or class variables
	 * @since JetpackComments (1.4)
	 */
	protected function setup_globals() {
		parent::setup_globals();

		// Sources
		$this->id_sources = array(
			'guest',
			'jetpack',
			'wordpress',
			'twitter',
			'facebook',
		);
	}

	/**
	 * Setup actions for methods in this class
	 * @since JetpackComments (1.4)
	 */
	protected function setup_actions() {
		parent::setup_actions();

		// Selfishly remove everything from the existing comment form
		remove_all_actions( 'comment_form_before' );

		// Selfishly add only our actions back to the comment form
		add_action( 'comment_form_before', array( $this, 'comment_form_before' ) );
		add_action( 'comment_form_after', array( $this, 'comment_form_after' ), 1 ); // Set very early since we remove everything outputed before our action.

		// Before a comment is posted
		add_action( 'pre_comment_on_post', array( $this, 'pre_comment_on_post' ), 1 );

		// After a comment is posted
		add_action( 'comment_post', array( $this, 'add_comment_meta' ) );
	}

	/**
	 * Setup filters for methods in this class
	 * @since 1.6.2
	 */
	protected function setup_filters() {
		parent::setup_filters();

		add_filter( 'comment_post_redirect', array( $this, 'capture_comment_post_redirect_to_reload_parent_frame' ), 100 );
		add_filter( 'get_avatar', array( $this, 'get_avatar' ), 10, 4 );
	}

	/**
	 * Get the comment avatar from Gravatar, Twitter, or Facebook
	 *
	 * @since JetpackComments (1.4)
	 *
	 * @param string $avatar  Current avatar URL
	 * @param string $comment Comment for the avatar
	 * @param int    $size    Size of the avatar
	 * @param string $default Not used
	 *
	 * @return string New avatar
	 */
	public function get_avatar( $avatar, $comment, $size, $default ) {
		if ( ! isset( $comment->comment_post_ID ) || ! isset( $comment->comment_ID ) ) {
			// it's not a comment - bail
			return $avatar;
		}

		// Detect whether it's a Facebook or Twitter avatar
		$foreign_avatar          = get_comment_meta( $comment->comment_ID, 'hc_avatar', true );
		$foreign_avatar_hostname = parse_url( $foreign_avatar, PHP_URL_HOST );
		if ( ! $foreign_avatar_hostname ||
			! preg_match( '/\.?(graph\.facebook\.com|twimg\.com)$/', $foreign_avatar_hostname ) ) {
			return $avatar;
		}

		// Return the FB or Twitter avatar
		return preg_replace( '#src=([\'"])[^\'"]+\\1#', 'src=\\1' . esc_url( set_url_scheme( $this->photon_avatar( $foreign_avatar, $size ), 'https' ) ) . '\\1', $avatar );
	}

	/** Output Methods ********************************************************/

	/**
	 * Start capturing the core comment_form() output
	 * @since JetpackComments (1.4)
	 */
	public function comment_form_before() {
		/**
		 * Filters the setting that determines if Jetpagk comments should be enabled for
		 * the current post type.
		 *
		 * @module comments
		 *
		 * @since  3.8.1
		 *
		 * @param boolean $return Should comments be enabled?
		 */
		if ( ! apply_filters( 'jetpack_comment_form_enabled_for_' . get_post_type(), true ) ) {
			return;
		}

		// Add some JS to the footer
		add_action( 'wp_footer', array( $this, 'watch_comment_parent' ), 100 );

		ob_start();
	}

	/**
	 * Noop the default comment form output, get some options, and output our
	 * tricked out totally radical comment form.
	 *
	 * @since JetpackComments (1.4)
	 */
	public function comment_form_after() {
		/** This filter is documented in modules/comments/comments.php */
		if ( ! apply_filters( 'jetpack_comment_form_enabled_for_' . get_post_type(), true ) ) {
			return;
		}

		// Throw it all out and drop in our replacement
		ob_end_clean();

		// If users are required to be logged in, and they're not, then we don't need to do anything else
		if ( get_option( 'comment_registration' ) && ! is_user_logged_in() ) {
			/**
			 * Changes the log in to comment prompt.
			 *
			 * @module comments
			 *
			 * @since  1.4.0
			 *
			 * @param string $var Default is "You must log in to post a comment."
			 */
			echo '<p class="must-log-in">' . sprintf( apply_filters( 'jetpack_must_log_in_to_comment', __( 'You must <a href="%s">log in</a> to post a comment.', 'jetpack' ) ), wp_login_url( get_permalink() . '#respond' ) ) . '</p>';

			return;
		}

		if ( in_array( 'subscriptions', Jetpack::get_active_modules() ) ) {
			$stb_enabled = get_option( 'stb_enabled', 1 );
			$stb_enabled = empty( $stb_enabled ) ? 0 : 1;

			$stc_enabled = get_option( 'stc_enabled', 1 );
			$stc_enabled = empty( $stc_enabled ) ? 0 : 1;
		} else {
			$stb_enabled = 0;
			$stc_enabled = 0;
		}

		$params = array(
			'blogid'               => Jetpack_Options::get_option( 'id' ),
			'postid'               => get_the_ID(),
			'comment_registration' => ( get_option( 'comment_registration' ) ? '1' : '0' ), // Need to explicitly send a '1' or a '0' for these
			'require_name_email'   => ( get_option( 'require_name_email' ) ? '1' : '0' ),
			'stc_enabled'          => $stc_enabled,
			'stb_enabled'          => $stb_enabled,
			'show_avatars'         => ( get_option( 'show_avatars' ) ? '1' : '0' ),
			'avatar_default'       => get_option( 'avatar_default' ),
			'greeting'             => get_option( 'highlander_comment_form_prompt', __( 'Leave a Reply', 'jetpack' ) ),
			/**
			 * Changes the comment form prompt.
			 *
			 * @module comments
			 *
			 * @since  2.3.0
			 *
			 * @param string $var Default is "Leave a Reply to %s."
			 */
			'greeting_reply'       => apply_filters( 'jetpack_comment_form_prompt_reply', __( 'Leave a Reply to %s', 'jetpack' ) ),
			'color_scheme'         => get_option( 'jetpack_comment_form_color_scheme', $this->default_color_scheme ),
			'lang'                 => get_locale(),
			'jetpack_version'      => JETPACK__VERSION,
		);

		// Extra parameters for logged in user
		if ( is_user_logged_in() ) {
			$current_user           = wp_get_current_user();
			$params['hc_post_as']   = 'jetpack';
			$params['hc_userid']    = $current_user->ID;
			$params['hc_username']  = $current_user->display_name;
			$params['hc_userurl']   = $current_user->user_url;
			$params['hc_useremail'] = md5( strtolower( trim( $current_user->user_email ) ) );
			if ( current_user_can( 'unfiltered_html' ) ) {
				$params['_wp_unfiltered_html_comment'] = wp_create_nonce( 'unfiltered-html-comment_' . get_the_ID() );
			}
		} else {
			$commenter                     = wp_get_current_commenter();
			$params['show_cookie_consent'] = (int) has_action( 'set_comment_cookies', 'wp_set_comment_cookies' );
			$params['has_cookie_consent']  = (int) ! empty( $commenter['comment_author_email'] );
		}

		$blog_token = Jetpack_Data::get_access_token();
		list( $token_key ) = explode( '.', $blog_token->secret, 2 );
		// Prophylactic check: anything else should never happen.
		if ( $token_key && $token_key !== $blog_token->secret ) {
			// Is the token a Special Token (@see class.jetpack-data.php)?
			if ( preg_match( '/^;.\d+;\d+;$/', $token_key, $matches ) ) {
				// The token key for a Special Token is public.
				$params['token_key'] = $token_key;
			} else {
				/*
				 * The token key for a Normal Token is public but
				 * looks like sensitive data. Since there can only be
				 * one Normal Token per site, avoid concern by
				 * sending the magic "use the Normal Token" token key.
				 */
				$params['token_key'] = Jetpack_Data::MAGIC_NORMAL_TOKEN_KEY;
			}
		}

		$signature = Jetpack_Comments::sign_remote_comment_parameters( $params, $blog_token->secret );
		if ( is_wp_error( $signature ) ) {
			$signature = 'error';
		}

		$params['sig']    = $signature;
		$url_origin       = set_url_scheme( 'http://jetpack.wordpress.com' );
		$url              = "{$url_origin}/jetpack-comment/?" . http_build_query( $params );
		$url              = "{$url}#parent=" . urlencode( set_url_scheme( 'http://' . $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI'] ) );
		$this->signed_url = $url;
		$height           = $params['comment_registration'] || is_user_logged_in() ? '315' : '430'; // Iframe can be shorter if we're not allowing guest commenting
		$transparent      = ( $params['color_scheme'] == 'transparent' ) ? 'true' : 'false';

		if ( isset( $_GET['replytocom'] ) ) {
			$url .= '&replytocom=' . (int) $_GET['replytocom'];
		}

		/**
		 * Filter whether the comment title can be displayed.
		 *
		 * @module comments
		 *
		 * @since  4.7.0
		 *
		 * @param bool $show Can the comment be displayed? Default to true.
		 */
		$show_greeting = apply_filters( 'jetpack_comment_form_display_greeting', true );

		// The actual iframe (loads comment form from Jetpack server)
		?>

		<div id="respond" class="comment-respond">
			<?php if ( true === $show_greeting ) : ?>
				<h3 id="reply-title" class="comment-reply-title"><?php comment_form_title( esc_html( $params['greeting'] ), esc_html( $params['greeting_reply'] ) ); ?>
					<small><?php cancel_comment_reply_link( esc_html__( 'Cancel reply', 'jetpack' ) ); ?></small>
				</h3>
			<?php endif; ?>
			<form id="commentform" class="comment-form">
				<iframe title="<?php esc_attr_e( 'Comment Form', 'jetpack' ); ?>" src="<?php echo esc_url( $url ); ?>" style="width:100%; height: <?php echo $height; ?>px; border:0;" name="jetpack_remote_comment" class="jetpack_remote_comment" id="jetpack_remote_comment" sandbox="allow-same-origin allow-top-navigation allow-scripts allow-forms allow-popups"></iframe>
				<?php if ( ! Jetpack_AMP_Support::is_amp_request() ) : ?>
					<!--[if !IE]><!-->
					<script>
						document.addEventListener('DOMContentLoaded', function () {
							var commentForms = document.getElementsByClassName('jetpack_remote_comment');
							for (var i = 0; i < commentForms.length; i++) {
								commentForms[i].allowTransparency = <?php echo $transparent; ?>;
								commentForms[i].scrolling = 'no';
							}
						});
					</script>
					<!--<![endif]-->
				<?php endif; ?>
			</form>
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
		$url_origin = set_url_scheme( 'http://jetpack.wordpress.com' );
		?>

		<!--[if IE]>
		<script type="text/javascript">
			if ( 0 === window.location.hash.indexOf( '#comment-' ) ) {
				// window.location.reload() doesn't respect the Hash in IE
				window.location.hash = window.location.hash;
			}
		</script>
		<![endif]-->
		<script type="text/javascript">
			(function () {
				var comm_par_el = document.getElementById( 'comment_parent' ),
					comm_par = ( comm_par_el && comm_par_el.value ) ? comm_par_el.value : '',
					frame = document.getElementById( 'jetpack_remote_comment' ),
					tellFrameNewParent;

				tellFrameNewParent = function () {
					if ( comm_par ) {
						frame.src = "<?php echo esc_url_raw( $this->signed_url ); ?>" + '&replytocom=' + parseInt( comm_par, 10 ).toString();
					} else {
						frame.src = "<?php echo esc_url_raw( $this->signed_url ); ?>";
					}
				};

				<?php if ( get_option( 'thread_comments' ) && get_option( 'thread_comments_depth' ) ) : ?>

				if ( 'undefined' !== typeof addComment ) {
					addComment._Jetpack_moveForm = addComment.moveForm;

					addComment.moveForm = function ( commId, parentId, respondId, postId ) {
						var returnValue = addComment._Jetpack_moveForm( commId, parentId, respondId, postId ),
							cancelClick, cancel;

						if ( false === returnValue ) {
							cancel = document.getElementById( 'cancel-comment-reply-link' );
							cancelClick = cancel.onclick;
							cancel.onclick = function () {
								var cancelReturn = cancelClick.call( this );
								if ( false !== cancelReturn ) {
									return cancelReturn;
								}

								if ( ! comm_par ) {
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
				}

				<?php endif; ?>

				// Do the post message bit after the dom has loaded.
				document.addEventListener( 'DOMContentLoaded', function () {
					var iframe_url = <?php echo json_encode( esc_url_raw( $url_origin ) ); ?>;
					if ( window.postMessage ) {
						if ( document.addEventListener ) {
							window.addEventListener( 'message', function ( event ) {
								var origin = event.origin.replace( /^http:\/\//i, 'https://' );
								if ( iframe_url.replace( /^http:\/\//i, 'https://' ) !== origin ) {
									return;
								}
								jQuery( frame ).height( event.data );
							});
						} else if ( document.attachEvent ) {
							window.attachEvent( 'message', function ( event ) {
								var origin = event.origin.replace( /^http:\/\//i, 'https://' );
								if ( iframe_url.replace( /^http:\/\//i, 'https://' ) !== origin ) {
									return;
								}
								jQuery( frame ).height( event.data );
							});
						}
					}
				})

			})();
		</script>

		<?php
	}

	/**
	 * Verify the hash included in remote comments.
	 *
	 * @since JetpackComments (1.4)
	 *
	 * @param type $comment Not used
	 */
	public function pre_comment_on_post( $comment ) {
		$post_array = stripslashes_deep( $_POST );

		// Bail if missing the Jetpack token
		if ( ! isset( $post_array['sig'] ) || ! isset( $post_array['token_key'] ) ) {
			unset( $_POST['hc_post_as'] );

			return;
		}

		if ( false !== strpos( $post_array['hc_avatar'], '.gravatar.com' ) ) {
			$post_array['hc_avatar'] = htmlentities( $post_array['hc_avatar'] );
		}

		$blog_token = Jetpack_Data::get_access_token( false, $post_array['token_key'] );
		if ( ! $blog_token ) {
			wp_die( __( 'Unknown security token.', 'jetpack' ), 400 );
		}
		$check = Jetpack_Comments::sign_remote_comment_parameters( $post_array, $blog_token->secret );
		if ( is_wp_error( $check ) ) {
			wp_die( $check );
		}

		// Bail if token is expired or not valid
		if ( ! hash_equals( $check, $post_array['sig'] ) ) {
			wp_die( __( 'Invalid security token.', 'jetpack' ), 400 );
		}

		/** This filter is documented in modules/comments/comments.php */
		if ( ! apply_filters( 'jetpack_comment_form_enabled_for_' . get_post_type( $post_array['comment_post_ID'] ), true ) ) {
			// In case the comment POST is legit, but the comments are
			// now disabled, we don't allow the comment

			wp_die( __( 'Comments are not allowed.', 'jetpack' ), 403 );
		}
	}

	/** Capabilities **********************************************************/

	/**
	 * Add some additional comment meta after comment is saved about what
	 * service the comment is from, the avatar, user_id, etc...
	 *
	 * @since JetpackComments (1.4)
	 *
	 * @param type $comment_id
	 */
	public function add_comment_meta( $comment_id ) {
		$comment_meta = array();

		switch ( $this->is_highlander_comment_post() ) {
			case 'facebook':
				$comment_meta['hc_post_as']         = 'facebook';
				$comment_meta['hc_avatar']          = stripslashes( $_POST['hc_avatar'] );
				$comment_meta['hc_foreign_user_id'] = stripslashes( $_POST['hc_userid'] );
				break;

			case 'twitter':
				$comment_meta['hc_post_as']         = 'twitter';
				$comment_meta['hc_avatar']          = stripslashes( $_POST['hc_avatar'] );
				$comment_meta['hc_foreign_user_id'] = stripslashes( $_POST['hc_userid'] );
				break;

			// phpcs:ignore WordPress.WP.CapitalPDangit
			case 'wordpress':
				// phpcs:ignore WordPress.WP.CapitalPDangit
				$comment_meta['hc_post_as']         = 'wordpress';
				$comment_meta['hc_avatar']          = stripslashes( $_POST['hc_avatar'] );
				$comment_meta['hc_foreign_user_id'] = stripslashes( $_POST['hc_userid'] );
				$comment_meta['hc_wpcom_id_sig']    = stripslashes( $_POST['hc_wpcom_id_sig'] ); //since 1.9
				break;

			case 'jetpack':
				$comment_meta['hc_post_as']         = 'jetpack';
				$comment_meta['hc_avatar']          = stripslashes( $_POST['hc_avatar'] );
				$comment_meta['hc_foreign_user_id'] = stripslashes( $_POST['hc_userid'] );
				break;

		}

		// Bail if no extra comment meta
		if ( empty( $comment_meta ) ) {
			return;
		}

		// Loop through extra meta and add values
		foreach ( $comment_meta as $key => $value ) {
			add_comment_meta( $comment_id, $key, $value, true );
		}
	}

	function capture_comment_post_redirect_to_reload_parent_frame( $url ) {
		if ( ! isset( $_GET['for'] ) || 'jetpack' != $_GET['for'] ) {
			return $url;
		}
		?>
		<!DOCTYPE html>
		<html <?php language_attributes(); ?>>
		<!--<![endif]-->
		<head>
			<meta charset="<?php bloginfo( 'charset' ); ?>" />
			<title><?php printf( __( 'Submitting Comment%s', 'jetpack' ), '&hellip;' ); ?></title>
			<style type="text/css">
				body {
					display: table;
					width: 100%;
					height: 60%;
					position: absolute;
					top: 0;
					left: 0;
					overflow: hidden;
					color: #333;
				}

				h1 {
					text-align: center;
					margin: 0;
					padding: 0;
					display: table-cell;
					vertical-align: middle;
					font-family: "HelveticaNeue-Light", "Helvetica Neue Light", "Helvetica Neue", sans-serif;
					font-weight: normal;
				}

				.hidden {
					opacity: 0;
				}

				h1 span {
					-moz-transition-property: opacity;
					-moz-transition-duration: 1s;
					-moz-transition-timing-function: ease-in-out;

					-webkit-transition-property: opacity;
					-webkit-transition-duration: 1s;
					-webbit-transition-timing-function: ease-in-out;

					-o-transition-property: opacity;
					-o-transition-duration: 1s;
					-o-transition-timing-function: ease-in-out;

					-ms-transition-property: opacity;
					-ms-transition-duration: 1s;
					-ms-transition-timing-function: ease-in-out;

					transition-property: opacity;
					transition-duration: 1s;
					transition-timing-function: ease-in-out;
				}
			</style>
		</head>
		<body>
		<h1><?php printf( __( 'Submitting Comment%s', 'jetpack' ), '<span id="ellipsis" class="hidden">&hellip;</span>' ); ?></h1>
		<script type="text/javascript">
			try {
				window.parent.location = <?php echo json_encode( $url ); ?>;
				window.parent.location.reload(true);
			} catch (e) {
				window.location = <?php echo json_encode( $url ); ?>;
				window.location.reload(true);
			}
			ellipsis = document.getElementById('ellipsis');

			function toggleEllipsis() {
				ellipsis.className = ellipsis.className ? '' : 'hidden';
			}

			setInterval(toggleEllipsis, 1200);
		</script>
		</body>
		</html>
		<?php
		exit;
	}
}

Jetpack_Comments::init();
