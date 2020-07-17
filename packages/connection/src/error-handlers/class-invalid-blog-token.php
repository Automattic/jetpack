<?php
/**
 * The Jetpack Connection error handler class for invalid blog tokens
 *
 * @package automattic/jetpack-connection
 */

namespace Automattic\Jetpack\Connection\Error_Handlers;

use Automattic\Jetpack\Connection\Manager;
use Automattic\Jetpack\Connection\Error_Handler;

/**
 * This class handles all the error codes that indicates a broken blog token and
 * suggests the user to reconnect.
 *
 * @since 8.7.0
 */
class Invalid_Blog_Token {

	/**
	 * Number of times we will try to regenerate the blog token
	 *
	 * @var integer
	 */
	private $max_heal_attempts = 1000;

	/**
	 * Name of the option where we store the number of attempts to self heal
	 *
	 * @var string
	 */
	private $attempts_option_name = '_jetpack_connection_blog_token_heal_attempts';

	/**
	 * Set up hooks
	 *
	 * @since 8.7.0
	 *
	 * @param array $errors The array containing verified errors stored in the database.
	 */
	public function __construct( $errors ) {

		/**
		 * Filters the message to be displayed in the admin notices area when there's a invalid blog token xmlrpc error
		 *
		 * Return an empty value to disable the message.
		 *
		 * @since 8.7.0
		 *
		 * @param string $message The error message.
		 */
		$this->message = apply_filters( 'jetpack_connection_invalid_blog_token_admin_notice', __( 'Your connection with WordPress.com seems to be broken. If you\'re experiencing issues, please try reconnecting.', 'jetpack' ) );

		if ( empty( $this->message ) ) {
			return;
		}

		// In this class, we will only handle errors with the blog token, so ignoring if there are only errors with user tokens.
		if ( ! isset( $errors[0] ) && ! isset( $errors['invalid'] ) ) {
			return;
		}

		$this->attempts = (int) get_option( $this->attempts_option_name );

		if ( $this->should_self_heal() ) {
			$this->refresh_blog_token();
		}

		add_action( 'react_connection_errors_initial_state', array( $this, 'jetpack_react_dashboard_error' ) );
		// do not add admin notice to the jetpack dashboard.
		global $pagenow;
		if ( 'admin.php' === $pagenow || isset( $_GET['page'] ) && 'jetpack' === $_GET['page'] ) { // phpcs:ignore
			return;
		}
		add_action( 'admin_notices', array( $this, 'admin_notice' ) );

	}

	/**
	 * Prints an admin notice for the blog token error
	 *
	 * @since 8.7.0
	 *
	 * @return void
	 */
	public function admin_notice() {

		if ( ! current_user_can( 'jetpack_connect' ) ) {
			return;
		}

		?>
		<div class="notice notice-error is-dismissible jetpack-message jp-connect" style="display:block !important;">
			<p><?php echo esc_html( $this->message ); ?></p>
		</div>
		<?php
	}

	/**
	 * Adds the error message to the Jetpack React Dashboard
	 *
	 * @param array $errors The array of errors.
	 * @return array
	 */
	public function jetpack_react_dashboard_error( $errors ) {

		$errors[] = array(
			'code'    => 'invalid_blog_token',
			'message' => $this->message,
			'action'  => 'reconnect',
		);
		return $errors;
	}

	/**
	 * Checks the number of healing attempts and returns a boolean indicating if we should
	 * try again or not
	 *
	 * @return boolean
	 */
	public function should_self_heal() {
		return $this->attempts > 0 && $this->attempts < $this->max_heal_attempts;
	}

	/**
	 * Lock attempts
	 *
	 * @return void
	 */
	private function lock_attempts() {
		update_option( $this->attempts_option_name, -1 );
	}

	/**
	 * Unlock attempts
	 *
	 * @return void
	 */
	private function unlock_attempts() {
		update_option( $this->attempts_option_name, $this->attempts );
	}

	/**
	 * Tries to register the site again and refresh the blog token
	 *
	 * @return void
	 */
	public function refresh_blog_token() {

		$this->lock_attempts();

		$manager = new Manager();

		$heal = $manager->register();
		l( $heal );

		$this->attempts ++;

		if ( true === $heal ) {
			Error_Handler::get_instance()->delete_all_errors();
			delete_option( $this->attempts_option_name );
		} else {
			$this->unlock_attempts();
		}
	}

}
