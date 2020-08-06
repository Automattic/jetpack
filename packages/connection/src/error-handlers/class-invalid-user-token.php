<?php
/**
 * The Jetpack Connection error handler class for invalid user tokens
 *
 * @package automattic/jetpack-connection
 */

namespace Automattic\Jetpack\Connection\Error_Handlers;

/**
 * This class handles all the error codes that indicates the token for the current user is broken and
 * suggests the user to reconnect.
 *
 * @since 8.9.0
 */
class Invalid_User_Token {

	/**
	 * Set up hooks
	 *
	 * @since 8.9.0
	 *
	 * @param array $errors The array containing verified errors stored in the database.
	 */
	public function __construct( $errors ) {

		/**
		 * Filters the message to be displayed in the admin notices area when there's a invalid user token xmlrpc error
		 *
		 * Return an empty value to disable the message.
		 *
		 * @since 8.9.0
		 *
		 * @param string $message The error message.
		 */
		$this->message = apply_filters( 'jetpack_connection_invalid_user_token_message', __( 'Your connection with WordPress.com seems to be broken. If you\'re experiencing issues, please try reconnecting.', 'jetpack' ) );

		// In this class, we will only handle errors with the current user token.
		if ( ! isset( $errors[ get_current_user_id() ] ) ) {
			return;
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
	 * Prints an admin notice for the user token error
	 *
	 * @since 8.9.0
	 *
	 * @return void
	 */
	public function admin_notice() {

		if ( ! current_user_can( 'jetpack_connect' ) ) {
			return;
		}

		/**
		 * Fires inside the admin_notices hook just before displaying the error message for a borken user token.
		 *
		 * If you want to disable the default message from being displayed, return an emtpy value in the jetpack_connection_invalid_user_token_message filter.
		 *
		 * @since 8.9.0
		 *
		 * @param string $message The message that will be displayed by default.
		 */
		do_action( 'jetpack_connection_invalid_user_token_admin_notice', $this->message );

		if ( empty( $this->message ) ) {
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
	 * @since 8.9.0
	 *
	 * @param array $errors The array of errors.
	 * @return array
	 */
	public function jetpack_react_dashboard_error( $errors ) {

		if ( ! empty( $this->message ) ) {
			$errors[] = array(
				'code'    => 'invalid_user_token',
				'message' => $this->message,
				'action'  => 'reconnect',
			);
		}

		return $errors;
	}


}
