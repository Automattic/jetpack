<?php
/**
 * Usage events.
 *
 * @package automattic/jetpack-comments
 */

namespace Automattic\Jetpack\Comments;

use Automattic\Jetpack\Connection\Manager;
use Automattic\Jetpack\Status;
use Automattic\Jetpack\Status\Host;
use Automattic\Jetpack\Terms_Of_Service;
use Automattic\Jetpack\Tracking;

/**
 * Records how the form is used, in Tracks. The browser records the rest through the same gate.
 */
class Tracks {

	/**
	 * Singleton instance.
	 *
	 * @var Tracks|null
	 */
	private static $instance = null;

	/**
	 * Register the hooks. Safe to call more than once.
	 *
	 * @return Tracks
	 */
	public static function init() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}

		return self::$instance;
	}

	/**
	 * Count the comments the form posts.
	 */
	private function __construct() {
		add_action( 'comment_post', array( $this, 'comment_posted' ), 10, 3 );
	}

	/**
	 * Whether events may be recorded: always on WordPress.com, on Atomic outside offline mode,
	 * and elsewhere once the owner agreed to Jetpack's terms, which offline mode also fails.
	 *
	 * @return bool
	 */
	public static function is_enabled() {
		$platform = self::platform();

		return 'simple' === $platform
			|| ( 'atomic' === $platform && ! ( new Status() )->is_offline_mode() )
			|| ( new Terms_Of_Service() )->has_agreed();
	}

	/**
	 * The host the event came from.
	 *
	 * @return string `simple`, `atomic` or `self_hosted`.
	 */
	public static function platform() {
		$host = new Host();

		if ( $host->is_wpcom_simple() ) {
			return 'simple';
		}

		return $host->is_woa_site() ? 'atomic' : 'self_hosted';
	}

	/**
	 * Record an event. A visitor's is recorded under the site's owner, as Jetpack Forms does, and holds nothing they typed.
	 *
	 * @param string $event_name Full event name, e.g. `jetpack_comments_comment_posted`.
	 * @param array  $properties Event properties.
	 * @return void
	 */
	public static function record( $event_name, array $properties = array() ) {
		if ( ! self::is_enabled() ) {
			return;
		}

		$properties['blog_id']  = Checkpoint::blog_id();
		$properties['platform'] = self::platform();
		$properties['version']  = Comments::PACKAGE_VERSION;

		$user = wp_get_current_user();

		if ( ( new Host() )->is_wpcom_simple() ) {
			if ( ! $user->exists() ) {
				$user = get_userdata( (int) wpcom_get_blog_owner( get_current_blog_id() ) );
			}

			if ( ! function_exists( 'tracks_record_event' ) && function_exists( 'require_lib' ) ) {
				require_lib( 'tracks/client' );
			}

			if ( $user && function_exists( 'tracks_record_event' ) ) {
				tracks_record_event( $user, $event_name, $properties );
			}

			return;
		}

		if ( ! $user->exists() ) {
			$user = get_userdata( (int) ( new Manager() )->get_connection_owner_id() );
		}

		if ( ! $user ) {
			return;
		}

		// Atomic does not always store the agreement Tracking checks for; masterbar works around it the same way.
		$agreed = static function ( $value, $name ) {
			return Terms_Of_Service::OPTION_NAME === $name ? true : $value;
		};

		if ( 'atomic' === $properties['platform'] ) {
			add_filter( 'jetpack_options', $agreed, 10, 2 );
		}

		( new Tracking() )->tracks_record_event( $user, $event_name, $properties );

		remove_filter( 'jetpack_options', $agreed, 10 );
	}

	/**
	 * Record a comment the form turned away, where a browser on this site sent it. Anything else is a bot,
	 * and would cost an outbound request to record.
	 *
	 * @param string $reason `nonce`, or the error code the sign-in was refused with.
	 * @return void
	 */
	public static function record_refusal( $reason ) {
		if ( ! empty( $_SERVER['HTTP_ORIGIN'] ) && Checkpoint::is_same_site_request() ) {
			self::record( 'jetpack_comments_comment_refused', array( 'reason' => $reason ) );
		}
	}

	/**
	 * Who posted a comment through the form, and with what.
	 *
	 * @param int        $comment_id  The comment ID.
	 * @param int|string $approved    1, 0, `spam` or `trash`.
	 * @param array      $commentdata Comment data.
	 * @return void
	 */
	public function comment_posted( $comment_id, $approved, $commentdata = array() ) {
		// phpcs:disable WordPress.Security.NonceVerification.Missing -- Comment_Form::verify_nonce() checked it; its presence marks a comment this form sent.
		if ( empty( $_POST[ Comment_Form::NONCE_NAME ] ) ) {
			return;
		}

		$code     = ! empty( $_POST[ Checkpoint::CODE_FIELD ] );
		$passport = ! empty( $_POST[ Checkpoint::PASSPORT_FIELD ] );

		if ( is_user_logged_in() ) {
			$identity = 'user';
		} elseif ( $code || $passport ) {
			// Checkpoint::admit() turned the comment away unless one of these let the commenter in.
			$identity = 'wordpress'; // phpcs:ignore WordPress.WP.CapitalPDangit.MisspelledInText -- Commenter.kind in the app.
		} elseif ( empty( $commentdata['comment_author'] ) && empty( $commentdata['comment_author_email'] ) ) {
			$identity = 'anonymous';
		} else {
			$identity = 'guest';
		}

		// Paragraphs and list items come with every comment and every list.
		$content = (string) ( $commentdata['comment_content'] ?? '' );
		preg_match_all( '#<!-- wp:([a-z0-9-]+(?:/[a-z0-9-]+)?)#', $content, $names );
		$blocks = array_diff( array_unique( $names[1] ), array( 'paragraph', 'list-item' ) );
		sort( $blocks );

		self::record(
			'jetpack_comments_comment_posted',
			array(
				'identity'           => $identity,
				'new_sign_in'        => $code && ! is_user_logged_in(),
				'is_reply'           => ! empty( $commentdata['comment_parent'] ),
				'editor'             => has_blocks( $content ) ? 'blocks' : 'textarea',
				'blocks'             => implode( ',', $blocks ),
				'subscribe_comments' => ! empty( $_POST['subscribe_comments'] ) || ! empty( $_POST['subscribe'] ),
				'subscribe_blog'     => ! empty( $_POST['subscribe_blog'] ),
				'remember_details'   => ! empty( $_POST['wp-comment-cookies-consent'] ),
				'status'             => (string) $approved,
				'post_type'          => (string) get_post_type( (int) ( $commentdata['comment_post_ID'] ?? 0 ) ),
			)
		);
		// phpcs:enable WordPress.Security.NonceVerification.Missing
	}
}
