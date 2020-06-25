<?php
/**
 * The Jetpack Connection error handler class for invalid blog tokens
 *
 * @package automattic/jetpack-connection
 */

namespace Automattic\Jetpack\Connection\Error_Handlers;

/**
 * This class handles all the error codes that indicates a broken blog token and
 * suggests the user to reconnect.
 *
 * @since 8.7.0
 */
class Invalid_Blog_Token {

	/**
	 * Set up hooks
	 *
	 * @since 8.7.0
	 *
	 * @param array $errors The array containing verified errors stored in the database.
	 */
	public function __construct( $errors ) {

		// In this class, we will only handle errors with the blog token, so ignoring if there are only errors with user tokens.
		if ( ! isset( $errors[0] ) || ! isset( $errors['invalid'] ) ) {
			add_action( 'admin_notices', array( $this, 'admin_notice' ) );
		}

	}

	/**
	 * Prints an admin notice for the blog token error
	 *
	 * @since 8.7.0
	 *
	 * @return void
	 */
	public function admin_notice() {
		?>
		<div class="notice notice-error is-dismissible jetpack-message jp-connect" style="display:block !important;">
			<p><?php esc_html_e( 'Your connection with WordPress.com seems to be broken. If you\'re experiencing issues, please try to reconnect.', 'jetpack' ); ?></p>
		</div>
		<?php
	}


}
