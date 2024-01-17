<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Module: Comments
 *
 * @package automattic/jetpack
 */

require __DIR__ . '/base.php';
use Automattic\Jetpack\Connection\Tokens;
use Automattic\Jetpack\Status\Host;

/**
 * Main Comments class
 *
 * @package automattic/jetpack
 * @since   1.4
 */
class Jetpack_Comments extends Highlander_Comments_Base {

	/** Variables *************************************************************/

	/**
	 * Possible comment form sources - empty array as default
	 *
	 * @var array
	 */
	public $id_sources = array();

	/**
	 * Remote comment URL - empty string as default
	 *
	 * @var string
	 */
	public $signed_url = '';

	/**
	 * The default comment form color scheme - default is light
	 *
	 * @var string
	 * @see ::set_default_color_theme_based_on_theme_settings()
	 */
	public $default_color_scheme = 'light';

	/** Methods ***************************************************************/

	/**
	 * Initialize class
	 */
	public static function init() {
		static $instance = false;

		if ( ! $instance ) {
			$instance = new Jetpack_Comments();
		}

		return $instance;
	}

	/**
	 * Main constructor for Comments
	 *
	 * @since 1.4
	 */
	public function __construct() {
		parent::__construct();

		// Comments is loaded.

		/**
		 * Fires after the Jetpack_Comments object has been instantiated
		 *
		 * @module comments
		 *
		 * @since  1.4.0
		 *
		 * @param array $jetpack_comments_loaded First element in array of type Jetpack_Comments
		 */
		do_action_ref_array( 'jetpack_comments_loaded', array( $this ) );
		add_action( 'after_setup_theme', array( $this, 'set_default_color_theme_based_on_theme_settings' ), 100 );
	}

	/**
	 * Set the default comments color theme based on theme settings
	 */
	public function set_default_color_theme_based_on_theme_settings() {
		if ( function_exists( 'twentyeleven_get_theme_options' ) ) {
			$theme_options      = twentyeleven_get_theme_options();
			$theme_color_scheme = isset( $theme_options['color_scheme'] ) ? $theme_options['color_scheme'] : 'transparent';
		} else {
			$theme_color_scheme = get_theme_mod( 'color_scheme', 'transparent' );
		}
		// Default for $theme_color_scheme is 'transparent' just so it doesn't match 'light' or 'dark'.
		// The default for Jetpack's color scheme is still defined above as 'light'.

		if ( false !== stripos( $theme_color_scheme, 'light' ) ) {
			$this->default_color_scheme = 'light';
		} elseif ( false !== stripos( $theme_color_scheme, 'dark' ) ) {
			$this->default_color_scheme = 'dark';
		}
	}

	/** Private Methods *******************************************************/

	/**
	 * Set any global variables or class variables
	 *
	 * This is primarily defining the comment form sources.
	 *
	 * @since 1.4
	 */
	protected function setup_globals() {
		parent::setup_globals();

		// Sources.
		$this->id_sources = array(
			'guest',
			'jetpack',
			'wordpress',
			'facebook',
		);
	}

	/**
	 * Setup actions for methods in this class
	 *
	 * @since 1.4
	 */
	protected function setup_actions() {
		parent::setup_actions();

		// Selfishly remove everything from the existing comment form.
		remove_all_actions( 'comment_form_before' );

		// Selfishly add only our actions back to the comment form.
		add_action( 'comment_form_before', array( $this, 'comment_form_before' ) );
		add_action( 'comment_form_after', array( $this, 'comment_form_after' ), 1 ); // Set very early since we remove everything outputed before our action.

		// Before a comment is posted.
		add_action( 'pre_comment_on_post', array( $this, 'pre_comment_on_post' ), 1 );

		// After a comment is posted.
		add_action( 'comment_post', array( $this, 'add_comment_meta' ) );
	}

	/**
	 * Setup filters for methods in this class
	 *
	 * @since 1.6.2
	 */
	protected function setup_filters() {
		parent::setup_filters();

		add_filter( 'comment_post_redirect', array( $this, 'capture_comment_post_redirect_to_reload_parent_frame' ), 100 );
		add_filter( 'comment_duplicate_trigger', array( $this, 'capture_comment_duplicate_trigger' ), 100 );
		add_filter( 'get_avatar', array( $this, 'get_avatar' ), 10, 4 );
		// Fix comment reply link when `comment_registration` is required.
		add_filter( 'comment_reply_link', array( $this, 'comment_reply_link' ), 10, 4 );
	}

	/**
	 * Get the comment avatar from Gravatar or Twitter/Facebook.
	 *
	 * Leaving the Twitter reference for legacy comments even though support is no longer offered.
	 *
	 * @since 1.4
	 *
	 * @param string $avatar  Current avatar URL.
	 * @param string $comment Comment for the avatar.
	 * @param int    $size    Size of the avatar.
	 *
	 * @return string New avatar
	 */
	public function get_avatar( $avatar, $comment, $size ) {
		if ( ! isset( $comment->comment_post_ID ) || ! isset( $comment->comment_ID ) ) {
			// it's not a comment - bail.
			return $avatar;
		}

		// Detect whether it's a Facebook avatar.
		$foreign_avatar          = get_comment_meta( $comment->comment_ID, 'hc_avatar', true );
		$foreign_avatar_hostname = wp_parse_url( $foreign_avatar, PHP_URL_HOST );
		if ( ! $foreign_avatar_hostname ||
			! preg_match( '/\.?(graph\.facebook\.com|twimg\.com)$/', $foreign_avatar_hostname ) ) {
			return $avatar;
		}

		// Return the Facebook or Twitter avatar.
		return preg_replace( '#src=([\'"])[^\'"]+\\1#', 'src=\\1' . esc_url( set_url_scheme( $this->photon_avatar( $foreign_avatar, $size ), 'https' ) ) . '\\1', $avatar );
	}

	/**
	 * Set comment reply link.
	 * This is to fix the reply link when comment registration is required.
	 *
	 * @param string     $reply_link The HTML markup for the comment reply link.
	 * @param array      $args An array of arguments overriding the defaults.
	 * @param WP_Comment $comment The object of the comment being replied.
	 * @param WP_Post    $post    The WP_Post object.
	 *
	 * @return string New reply link.
	 */
	public function comment_reply_link( $reply_link, $args, $comment, $post ) {
		// This is only necessary if comment_registration is required to post comments
		if ( ! get_option( 'comment_registration' ) ) {
			return $reply_link;
		}

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

		return <<<HTML
			$before_link
			<a class="comment-reply-link" href="$reply_url" onclick="return addComment.moveForm( '$add_below-$comment->comment_ID', '$comment->comment_ID', '$respond_id', '$post->ID' )">$reply_text</a>
			$after_link
HTML;
	}

	/**
	 * Get the site's blog token.
	 * This can be used to bypass Comments entirely if Jetpack is not properly connected.
	 *
	 * @since 11.2
	 *
	 * @return bool|object False if not properly connected. Object with the blog token if connected.
	 */
	private function get_blog_token() {
		$blog_token = ( new Tokens() )->get_access_token();
		// If we have no token, bail.
		if ( ! $blog_token || is_wp_error( $blog_token ) ) {
			return false;
		}

		return $blog_token;
	}

	/** Output Methods ********************************************************/

	/**
	 * Start capturing the core comment_form() output
	 *
	 * Comment form output will only be captured if comments are enabled - we return otherwise.
	 *
	 * @since 1.4
	 */
	public function comment_form_before() {
		/**
		 * Filters the setting that determines if Jetpack comments should be enabled for
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

		// If the Jetpack connection is not healthy, bail.
		if ( ! $this->get_blog_token() ) {
			return;
		}

		// Add some JS to the footer.
		add_action( 'wp_footer', array( $this, 'watch_comment_parent' ), 100 );

		ob_start();
	}

	/**
	 * Noop the default comment form output, get some options, and output our
	 * tricked out totally radical comment form.
	 *
	 * @since 1.4
	 */
	public function comment_form_after() {
		/** This filter is documented in modules/comments/comments.php */
		if ( ! apply_filters( 'jetpack_comment_form_enabled_for_' . get_post_type(), true ) ) {
			return;
		}

		$blog_token = $this->get_blog_token();
		// If the Jetpack connection is not healthy, bail.
		if ( ! $blog_token ) {
			return;
		}

		// Throw it all out and drop in our replacement.
		ob_end_clean();

		if ( in_array( 'subscriptions', Jetpack::get_active_modules(), true ) ) {
			$stb_enabled = get_option( 'stb_enabled', 1 );
			$stb_enabled = empty( $stb_enabled ) ? 0 : 1;

			$stc_enabled = get_option( 'stc_enabled', 1 );
			$stc_enabled = empty( $stc_enabled ) ? 0 : 1;
		} else {
			$stb_enabled = 0;
			$stc_enabled = 0;
		}

		$params = array(
			'blogid'                 => Jetpack_Options::get_option( 'id' ),
			'postid'                 => get_the_ID(),
			'comment_registration'   => ( get_option( 'comment_registration' ) ? '1' : '0' ), // Need to explicitly send a '1' or a '0' for these.
			'require_name_email'     => ( get_option( 'require_name_email' ) ? '1' : '0' ),
			'stc_enabled'            => $stc_enabled,
			'stb_enabled'            => $stb_enabled,
			'show_avatars'           => ( get_option( 'show_avatars' ) ? '1' : '0' ),
			'avatar_default'         => get_option( 'avatar_default' ),
			'greeting'               => get_option( 'highlander_comment_form_prompt', __( 'Leave a Reply', 'jetpack' ) ),
			'jetpack_comments_nonce' => wp_create_nonce( 'jetpack_comments_nonce-' . get_the_ID() ),
			/**
			 * Changes the comment form prompt.
			 *
			 * @module comments
			 *
			 * @since  2.3.0
			 *
			 * @param string $var Default is "Leave a Reply to %s."
			 */
			'greeting_reply'         => apply_filters(
				'jetpack_comment_form_prompt_reply',
				/* translators: %s is the displayed username of the post (or comment) author */
				__( 'Leave a Reply to %s', 'jetpack' )
			),
			'color_scheme'           => get_option( 'jetpack_comment_form_color_scheme', $this->default_color_scheme ),
			'lang'                   => get_locale(),
			'jetpack_version'        => JETPACK__VERSION,
		);

		// Extra parameters for logged in user.
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
			// Jetpack_Memberships for logged out users only checks for the jp-premium-content-session cookie
			$params['is_current_user_subscribed'] = class_exists( '\Jetpack_Memberships' ) ? (int) Jetpack_Memberships::is_current_user_subscribed() : 0;
		}

		list( $token_key ) = explode( '.', $blog_token->secret, 2 );
		// Prophylactic check: anything else should never happen.
		if ( $token_key && $token_key !== $blog_token->secret ) {
			// Is the token a Special Token (@see class.tokens.php)?
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
				$params['token_key'] = Tokens::MAGIC_NORMAL_TOKEN_KEY;
			}
		}

		$signature = self::sign_remote_comment_parameters( $params, $blog_token->secret );
		if ( is_wp_error( $signature ) ) {
			$signature = 'error';
		}

		$params['sig'] = $signature;
		$url_origin    = 'https://jetpack.wordpress.com';
		$url           = "{$url_origin}/jetpack-comment/?" . http_build_query( $params );
		// phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- Sniff misses the esc_url_raw.
		$url              = "{$url}#parent=" . rawurlencode( esc_url_raw( set_url_scheme( 'http://' . ( isset( $_SERVER['HTTP_HOST'] ) ? wp_unslash( $_SERVER['HTTP_HOST'] ) : '' ) . ( isset( $_SERVER['REQUEST_URI'] ) ? wp_unslash( $_SERVER['REQUEST_URI'] ) : '' ) ) ) );
		$this->signed_url = $url;
		$height           = $params['comment_registration'] || is_user_logged_in() ? '315' : '430'; // Iframe can be shorter if we're not allowing guest commenting.
		$transparent      = ( 'transparent' === $params['color_scheme'] ) ? 'true' : 'false';

		if ( isset( $_GET['replytocom'] ) ) { //phpcs:ignore WordPress.Security.NonceVerification.Recommended
			$url .= '&replytocom=' . (int) $_GET['replytocom']; //phpcs:ignore WordPress.Security.NonceVerification.Recommended
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

		/**
		 * Filter the comment title tag.
		 *
		 * @module comments
		 * @since 12.4
		 *
		 * @param string $comment_reply_title_tag The comment title tag. Default to h3.
		 */
		$comment_reply_title_tag = apply_filters( 'jetpack_comment_reply_title_tag', 'h3' );

		// The actual iframe (loads comment form from Jetpack server).

		$is_amp = class_exists( Jetpack_AMP_Support::class ) && Jetpack_AMP_Support::is_amp_request();
		?>

		<div id="respond" class="comment-respond">
			<?php
			if ( true === $show_greeting ) :
				printf(
					'<%1$s id="reply-title" class="comment-reply-title">',
					esc_html( $comment_reply_title_tag )
				);

				comment_form_title(
					esc_html( $params['greeting'] ),
					esc_html( $params['greeting_reply'] )
				);
				echo '<small>';
				cancel_comment_reply_link( esc_html__( 'Cancel reply', 'jetpack' ) );
				echo '</small>';

				printf(
					'</%1$s>',
					esc_html( $comment_reply_title_tag )
				);
			endif;
			?>
			<form id="commentform" class="comment-form">
				<iframe
					title="<?php esc_attr_e( 'Comment Form', 'jetpack' ); ?>"
					src="<?php echo esc_url( $url ); ?>"
					<?php if ( $is_amp ) : ?>
						resizable
						layout="fixed-height"
						height="<?php echo esc_attr( $height ); ?>"
					<?php else : ?>
						name="jetpack_remote_comment"
						style="width:100%; height: <?php echo esc_attr( $height ); ?>px; border:0;"
					<?php endif; ?>
					class="jetpack_remote_comment"
					id="jetpack_remote_comment"
					sandbox="allow-same-origin allow-top-navigation allow-scripts allow-forms allow-popups"
				>
					<?php if ( $is_amp ) : ?>
						<button overflow><?php esc_html_e( 'Show more', 'jetpack' ); ?></button>
					<?php endif; ?>
				</iframe>
				<?php if ( ! $is_amp ) : ?>
					<!--[if !IE]><!-->
					<script>
						document.addEventListener('DOMContentLoaded', function () {
							var commentForms = document.getElementsByClassName('jetpack_remote_comment');
							for (var i = 0; i < commentForms.length; i++) {
								commentForms[i].allowTransparency = <?php echo esc_html( $transparent ); ?>;
								commentForms[i].scrolling = 'no';
							}
						});
					</script>
					<!--<![endif]-->
				<?php endif; ?>
			</form>
		</div>

		<?php // Below is required for comment reply JS to work. ?>

		<input type="hidden" name="comment_parent" id="comment_parent" value="" />

		<?php
	}

	/**
	 * Add some JS to wp_footer to watch for hierarchical reply parent change
	 *
	 * If AMP is enabled, we don't make any changes.
	 *
	 * @since 1.4
	 */
	public function watch_comment_parent() {
		if ( class_exists( Jetpack_AMP_Support::class ) && Jetpack_AMP_Support::is_amp_request() ) {
			// @todo Implement AMP support.
			return;
		}
		?>
		<script type="text/javascript">
			const iframe = document.getElementById( 'jetpack_remote_comment' );
			<?php if ( get_option( 'thread_comments' ) && get_option( 'thread_comments_depth' ) ) : ?>
			const watchReply = function() {
				// Check addComment._Jetpack_moveForm to make sure we don't monkey-patch twice.
				if ( 'undefined' !== typeof addComment && ! addComment._Jetpack_moveForm ) {
					// Cache the Core function.
					addComment._Jetpack_moveForm = addComment.moveForm;
					const commentParent = document.getElementById( 'comment_parent' );
					const cancel = document.getElementById( 'cancel-comment-reply-link' );

					function tellFrameNewParent ( commentParentValue ) {
						const url = new URL( iframe.src );
						if ( commentParentValue ) {
							url.searchParams.set( 'replytocom', commentParentValue )
						} else {
							url.searchParams.delete( 'replytocom' );
						}
						if( iframe.src !== url.href ) {
							iframe.src = url.href;
						}
					};

					cancel.addEventListener( 'click', function () {
						tellFrameNewParent( false );
					} );

					addComment.moveForm = function ( _, parentId ) {
						tellFrameNewParent( parentId );
						return addComment._Jetpack_moveForm.apply( null, arguments );
					};
				}
			}
			document.addEventListener( 'DOMContentLoaded', watchReply );
			// In WP 6.4+, the script is loaded asynchronously, so we need to wait for it to load before we monkey-patch the functions it introduces.
			document.querySelector('#comment-reply-js')?.addEventListener( 'load', watchReply );

			<?php endif; ?>

			window.addEventListener( 'message', function ( event ) {
				if ( event.origin !== 'https://jetpack.wordpress.com' ) {
					return;
				}
				iframe.style.height = event.data + 'px';
			});
		</script>
		<?php
	}

	/**
	 * Verify the hash included in remote comments.
	 *
	 * If the Jetpack token is missing we return nothing,
	 * and if the token is unknown or invalid, or comments not allowed, an error is returned.
	 *
	 * @since 1.4
	 */
	public function pre_comment_on_post() {
		$post_array = stripslashes_deep( $_POST );

		// Bail if missing the Jetpack token.
		if ( ! isset( $post_array['sig'] ) || ! isset( $post_array['token_key'] ) ) {
			unset( $_POST['hc_post_as'] );

			return;
		}

		if ( empty( $post_array['jetpack_comments_nonce'] ) || ! wp_verify_nonce( $post_array['jetpack_comments_nonce'], "jetpack_comments_nonce-{$post_array['comment_post_ID']}" ) ) {
				wp_die( esc_html__( 'Nonce verification failed.', 'jetpack' ), 400 );
		}

		if ( str_contains( $post_array['hc_avatar'], '.gravatar.com' ) ) {
			$post_array['hc_avatar'] = htmlentities( $post_array['hc_avatar'], ENT_COMPAT );
		}

		$blog_token = ( new Tokens() )->get_access_token( false, $post_array['token_key'] );
		if ( ! $blog_token || is_wp_error( $blog_token ) ) {
			wp_die( esc_html__( 'Unknown security token.', 'jetpack' ), 400 );
		}
		$check = self::sign_remote_comment_parameters( $post_array, $blog_token->secret );
		if ( is_wp_error( $check ) ) {
			wp_die( esc_html( $check ) );
		}

		// Bail if token is expired or not valid.
		if ( ! hash_equals( $check, $post_array['sig'] ) ) {
			wp_die( esc_html__( 'Invalid security token.', 'jetpack' ), 400 );
		}

		/** This filter is documented in modules/comments/comments.php */
		if ( ! apply_filters( 'jetpack_comment_form_enabled_for_' . get_post_type( $post_array['comment_post_ID'] ), true ) ) {
			// In case the comment POST is legit, but the comments are
			// now disabled, we don't allow the comment.

			wp_die( esc_html__( 'Comments are not allowed.', 'jetpack' ), 403 );
		}
	}

	/** Capabilities **********************************************************/

	/**
	 * Add some additional comment meta after comment is saved about what
	 * service the comment is from, the avatar, user_id, etc...
	 *
	 * @since 1.4
	 *
	 * @param int $comment_id The comment ID.
	 */
	public function add_comment_meta( $comment_id ) {
		$comment_meta = array();

		// phpcs:disable WordPress.Security.NonceVerification.Missing
		switch ( $this->is_highlander_comment_post() ) {
			case 'facebook':
				$comment_meta['hc_post_as']         = 'facebook';
				$comment_meta['hc_avatar']          = isset( $_POST['hc_avatar'] ) ? filter_var( wp_unslash( $_POST['hc_avatar'] ) ) : null;
				$comment_meta['hc_foreign_user_id'] = isset( $_POST['hc_userid'] ) ? filter_var( wp_unslash( $_POST['hc_userid'] ) ) : null;
				break;

			// phpcs:ignore WordPress.WP.CapitalPDangit
			case 'wordpress':
				// phpcs:ignore WordPress.WP.CapitalPDangit
				$comment_meta['hc_post_as']         = 'wordpress';
				$comment_meta['hc_avatar']          = isset( $_POST['hc_avatar'] ) ? filter_var( wp_unslash( $_POST['hc_avatar'] ) ) : null;
				$comment_meta['hc_foreign_user_id'] = isset( $_POST['hc_userid'] ) ? filter_var( wp_unslash( $_POST['hc_userid'] ) ) : null;
				$comment_meta['hc_wpcom_id_sig']    = isset( $_POST['hc_wpcom_id_sig'] ) ? filter_var( wp_unslash( $_POST['hc_wpcom_id_sig'] ) ) : null; // since 1.9.
				break;

			case 'jetpack':
				$comment_meta['hc_post_as']         = 'jetpack';
				$comment_meta['hc_avatar']          = isset( $_POST['hc_avatar'] ) ? filter_var( wp_unslash( $_POST['hc_avatar'] ) ) : null;
				$comment_meta['hc_foreign_user_id'] = isset( $_POST['hc_userid'] ) ? filter_var( wp_unslash( $_POST['hc_userid'] ) ) : null;
				break;

		}
		// phpcs:enable WordPress.Security.NonceVerification.Missing

		// Bail if no extra comment meta.
		if ( empty( $comment_meta ) ) {
			return;
		}

		// Loop through extra meta and add values.
		foreach ( $comment_meta as $key => $value ) {
			add_comment_meta( $comment_id, $key, $value, true );
		}
	}

	/**
	 * Should show the subscription modal
	 *
	 * @return boolean
	 */
	public function should_show_subscription_modal() {

		// Not allow it to run on self-hosted or simple sites
		if ( ! ( new Host() )->is_wpcom_platform() || ( new Host() )->is_wpcom_simple() ) {
			return false;
		}

		// phpcs:disable WordPress.Security.NonceVerification.Missing
		$is_current_user_subscribed = (bool) isset( $_POST['is_current_user_subscribed'] ) ? filter_var( wp_unslash( $_POST['is_current_user_subscribed'] ) ) : null;

		// Atomic sites with jetpack_verbum_subscription_modal option enabled
		$modal_enabled = ( new Host() )->is_woa_site() && get_option( 'jetpack_verbum_subscription_modal', true );

		return $modal_enabled && ! $is_current_user_subscribed;
	}

	/**
	 * Get the data to send as an event to the parent window on subscription modal
	 *
	 * @param string $url url to redirect to.
	 *
	 * @return array
	 */
	public function get_subscription_modal_data_to_parent( $url ) {
		// phpcs:ignore WordPress.Security.NonceVerification.Missing
		$current_user_email = isset( $_POST['email'] ) ? filter_var( wp_unslash( $_POST['email'] ) ) : null;
		// phpcs:ignore WordPress.Security.NonceVerification.Missing
		$post_id = isset( $_POST['comment_post_ID'] ) ? filter_var( wp_unslash( $_POST['comment_post_ID'] ) ) : null;
		return array(
			'url'          => $url,
			'email'        => $current_user_email,
			'blog_id'      => esc_attr( \Jetpack_Options::get_option( 'id' ) ),
			'post_id'      => esc_attr( $post_id ),
			'lang'         => esc_attr( get_locale() ),
			'is_logged_in' => isset( $_POST['hc_userid'] ),
		);
	}

	/**
	 * Track the hidden event for the subscription modal
	 */
	public function subscription_modal_status_track_event() {
		$tracking_event = 'hidden_disabled';
		// Not allow it to run on self-hosted or simple sites
		if ( ! ( new Host() )->is_wpcom_platform() || ( new Host() )->is_wpcom_simple() ) {
			$tracking_event = 'hidden_self_hosted';
		}

		// phpcs:disable WordPress.Security.NonceVerification.Missing
		$is_current_user_subscribed = (bool) isset( $_POST['is_current_user_subscribed'] ) ? filter_var( wp_unslash( $_POST['is_current_user_subscribed'] ) ) : null;

		if ( $is_current_user_subscribed ) {
			$tracking_event = 'hidden_already_subscribed';
		}

		$jetpack = Jetpack::init();
		// $jetpack->stat automatically prepends the stat group with 'jetpack-'
		$jetpack->stat( 'subscribe-modal-comm', $tracking_event );
		$jetpack->do_stats( 'server_side' );
	}

	/**
	 * Catch the duplicated comment error and show a custom error page
	 *
	 * @return void
	 */
	public function capture_comment_duplicate_trigger() {
		if ( ! isset( $_GET['for'] ) || 'jetpack' !== $_GET['for'] ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
			exit;
		}

		?>
		<!DOCTYPE html>
		<html <?php language_attributes(); ?>>
		<!--<![endif]-->
		<head>
			<meta charset="<?php bloginfo( 'charset' ); ?>" />
			<title>
				<?php
					wp_kses_post(
						printf(
							/* translators: %s is replaced by an ellipsis */
							__( 'Submitting Comment%s', 'jetpack' ), // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
							'&hellip;'
						)
					);
				?>
				</title>
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
					padding-top: 3%;
				}
				div {
					text-align: left;
					margin: 0;
					padding: 0;
					display: table-cell;
					vertical-align: top;
					font-family: "HelveticaNeue-Light", "Helvetica Neue Light", "Helvetica Neue", sans-serif;
					font-weight: normal;
				}

				h3 {
					margin: 0;
					padding-bottom: 3%;
					font-family: "HelveticaNeue-Light", "Helvetica Neue Light", "Helvetica Neue", sans-serif;
					font-weight: normal;
				}
				a {
					text-decoration: underline;
					color: #333 !important;
				}
			</style>
		</head>
		<body>
		<div>
			<h3>
				<?php
					esc_html_e( 'Duplicate comment detected; it looks as though you’ve already said that!', 'jetpack' );
				?>
			</h3>
			<a href="javascript:backToComments()"><?php esc_html_e( '&laquo; Back', 'jetpack' ); ?></a>
		</div>
		<script type="text/javascript">
			function backToComments() {
				const test = regexp => {
						return regexp.test(navigator.userAgent);
				};
				if (test(/chrome|chromium|crios|safari|edg/i)) {
						history.go(-2);
						return;
				}
				history.back();
			}
		</script>

		</body>
		</html>
		<?php
		exit;
	}

	/**
	 * POST the submitted comment to the iframe
	 *
	 * @param string $url The comment URL origin.
	 */
	public function capture_comment_post_redirect_to_reload_parent_frame( $url ) {
		if ( ! isset( $_GET['for'] ) || 'jetpack' !== $_GET['for'] ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
			return $url;
		}

		$should_show_subscription_modal = $this->should_show_subscription_modal();

		// Track event when not showing the subscription modal
		if ( ! $should_show_subscription_modal ) {
			$this->subscription_modal_status_track_event();
		}
		?>
		<!DOCTYPE html>
		<html <?php language_attributes(); ?>>
		<!--<![endif]-->
		<head>
			<meta charset="<?php bloginfo( 'charset' ); ?>" />
			<title>
				<?php
					wp_kses_post(
						printf(
							/* translators: %s is replaced by an ellipsis */
							__( 'Submitting Comment%s', 'jetpack' ), // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
							'&hellip;'
						)
					);
				?>
				</title>
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
					padding-top: 3%;
				}

				h3 {
					text-align: center;
					margin: 0;
					padding: 0;
					display: table-cell;
					vertical-align: top;
					font-family: "HelveticaNeue-Light", "Helvetica Neue Light", "Helvetica Neue", sans-serif;
					font-weight: normal;
				}

				.hidden {
					opacity: 0;
				}

				h3 span {
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
		<?php if ( ! $should_show_subscription_modal ) { ?>
		<h3>
			<?php
				wp_kses_post(
					printf(
						/* translators: %s is replaced by HTML markup to include an ellipsis */
						__( 'Submitting Comment%s', 'jetpack' ), // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
						'<span id="ellipsis" class="hidden">&hellip;</span>'
					)
				);
			?>
		</h3>
		<script type="text/javascript">
			try {
				window.parent.location = <?php echo wp_json_encode( $url ); ?>;
				window.parent.location.reload(true);
			} catch (e) {
				window.location = <?php echo wp_json_encode( $url ); ?>;
				window.location.reload(true);
			}
			ellipsis = document.getElementById('ellipsis');

			function toggleEllipsis() {
				ellipsis.className = ellipsis.className ? '' : 'hidden';
			}

			setInterval(toggleEllipsis, 1200);
		</script>
		<?php } else { ?>
		<h3>
			<?php
				wp_kses_post(
					print __( 'Comment sent', 'jetpack' ) // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
				);
			?>
		</h3>
		<script type="text/javascript">
			if ( window.parent && window.parent !== window ) {

				window.parent.postMessage(
					{
						type: 'subscriptionModalShow',
						data: <?php echo wp_json_encode( $this->get_subscription_modal_data_to_parent( $url ) ); ?>,
					},
					window.location.origin
				);
			}
		</script>
		<?php } ?>
		</body>
		</html>
		<?php
		exit;
	}
}

Jetpack_Comments::init();
