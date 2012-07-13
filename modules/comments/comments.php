<?php

require dirname( __FILE__ ) . '/base.php';

/**
 * Main Jetpack Comments class
 *
 * @package JetpackComments
 * @version 1.4
 * @since 1.4
 */
class Jetpack_Comments extends Highlander_Comments_Base {

	/** Variables *************************************************************/

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

	/**
	 * The default comment form color scheme
	 * @var string
	 * @see ::set_default_color_theme_based_on_theme_settings()
	 */
	var $default_color_scheme =  'light';

	/** Methods ***************************************************************/

	public static function init() {
		static $instance = false;

		if ( !$instance ) {
			$instance = new Jetpack_Comments;
		}

		return $instance;
	}

	/**
	 * Main constructor for Jetpack Comments
	 *
	 * @since JetpackComments (1.4)
	 */
	public function __construct() {
		parent::__construct();

		// Jetpack Comments is loaded
		do_action_ref_array( 'jetpack_comments_loaded', array( $this ) );
		add_action( 'after_setup_theme', array( $this, 'set_default_color_theme_based_on_theme_settings' ), 100 );
	}

	public function set_default_color_theme_based_on_theme_settings() {
		if ( function_exists( 'twentyeleven_get_theme_options' ) ) {
			$theme_options = twentyeleven_get_theme_options();
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
			'facebook'
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
		remove_all_actions( 'comment_form_after'  );

		// Selfishly add only our actions back to the comment form
		add_action( 'comment_form_before', array( $this, 'comment_form_before' ) );
		add_action( 'comment_form_after',  array( $this, 'comment_form_after'  ) );

		// Before a comment is posted
		add_action( 'pre_comment_on_post', array( $this, 'pre_comment_on_post' ), 1 );

		// After a comment is posted
		add_action( 'comment_post', array( $this, 'add_comment_meta' ) );
	}

	/** Output Methods ********************************************************/

	/**
	 * Start capturing the core comment_form() output
	 * @since JetpackComments (1.4)
	 */
	public function comment_form_before() {
		// Add some JS to the footer
		add_action( 'wp_footer', array( $this, 'watch_comment_parent' ), 100 );

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

		if ( in_array( 'subscriptions', Jetpack::get_active_modules() ) ) {
			$stb_enabled = get_option( 'stb_enabled', 1 );
			$stb_enabled = empty( $stb_enabled ) ? 0 : 1;
		
			$stc_enabled = get_option( 'stc_enabled', 1 );
			$stc_enabled = empty( $stc_enabled ) ? 0 : 1;
		} else {
			$stb_enabled = 0;
			$stc_enabled = 0;
		}

		$params  = array(
			'blogid'               => Jetpack::get_option( 'id' ),
			'postid'               => get_the_ID(),
			'comment_registration' => ( get_option( 'comment_registration' ) ? '1' : '0' ), // Need to explicitly send a '1' or a '0' for these
			'require_name_email'   => ( get_option( 'require_name_email' )   ? '1' : '0' ),
			'stc_enabled'          => $stc_enabled,
			'stb_enabled'          => $stb_enabled,
			'show_avatars'         => ( get_option( 'show_avatars' )         ? '1' : '0' ),
			'avatar_default'       => get_option( 'avatar_default' ),
			'greeting'             => get_option( 'highlander_comment_form_prompt', __( 'Leave a Reply', 'jetpack' ) ),
			'color_scheme'         => get_option( 'jetpack_comment_form_color_scheme', $this->default_color_scheme ),
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

		$signature = Jetpack_Comments::sign_remote_comment_parameters( $params, Jetpack::get_option( 'blog_token' ) );
		if ( is_wp_error( $signature ) ) {
			$signature = 'error';
		}

		$params['sig']    = $signature;
		$url_origin       = ( is_ssl() ? 'https' : 'http' ) . '://jetpack.wordpress.com';
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
				if ( document.addEventListener ) {
					window.addEventListener( 'message', function( event ) {
						if ( <?php echo json_encode( esc_url_raw( $url_origin ) ); ?> !== event.origin ) {
							return;
						}

						jQuery( frame ).height( event.data );
					} );
				} else if ( document.attachEvent ) {
					window.attachEvent( 'message', function( event ) {
						if ( <?php echo json_encode( esc_url_raw( $url_origin ) ); ?> !== event.origin ) {
							return;
						}

						jQuery( frame ).height( event.data );
					} );
				}
			}
		</script>

	<?php
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

		if ( FALSE !== strpos( $post_array['hc_avatar'], '.gravatar.com' ) )
			$post_array['hc_avatar'] = htmlentities( $post_array['hc_avatar'] );

		$check = Jetpack_Comments::sign_remote_comment_parameters( $post_array, Jetpack::get_option( 'blog_token' ) );
		if ( is_wp_error( $check ) ) {
			wp_die( $check );
		}

		// Bail if token is expired or not valid
		if ( $check !== $post_array['sig'] )
			wp_die( __( 'Invalid security token.', 'jetpack' ) );
	}

	/** Capabilities **********************************************************/

	/**
	 * Add some additional comment meta after comment is saved about what
	 * service the comment is from, the avatar, user_id, etc...
	 *
	 * @since JetpackComments (1.4)
	 * @param type $comment_id
	 */
	public function add_comment_meta( $comment_id ) {
		$comment_meta = array();

		switch( $this->is_highlander_comment_post() ) {
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
				$comment_meta['hc_post_as']         = 'wordpress';
				$comment_meta['hc_avatar']          = stripslashes( $_POST['hc_avatar'] );
				$comment_meta['hc_foreign_user_id'] = stripslashes( $_POST['hc_userid'] );
				break;

			case 'jetpack' :
				$comment_meta['hc_post_as']         = 'jetpack';
				$comment_meta['hc_avatar']          = stripslashes( $_POST['hc_avatar'] );
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
}

Jetpack_Comments::init();
