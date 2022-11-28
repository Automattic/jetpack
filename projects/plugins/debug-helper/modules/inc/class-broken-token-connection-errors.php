<?php // phpcs:disable WordPress.PHP.DevelopmentFunctions.error_log_print_r
/**
 * View and trigger connection errors.
 *
 * @package automattic/jetpack-debug-helper.
 */

use Automattic\Jetpack\Connection\Error_Handler;

/**
 * Class Broken_Token_Connection_Errors
 */
class Broken_Token_Connection_Errors {

	/**
	 * Initialize the hooks and load initial data into the object.
	 */
	public function __construct() {

		add_action( 'admin_menu', array( $this, 'register_submenu_page' ), 1000 );

		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_scripts' ) );

		add_action( 'admin_post_clear_all_connection_errors', array( $this, 'admin_post_clear_all_connection_errors' ) );
		add_action( 'admin_post_clear_all_verified_connection_errors', array( $this, 'admin_post_clear_all_verified_connection_errors' ) );
		add_action( 'admin_post_refresh_verified_errors_list', array( $this, 'admin_post_refresh_verified_errors_list' ) );
		add_action( 'admin_post_create_error', array( $this, 'admin_post_create_error' ) );
		add_action( 'admin_post_clear_all_errors', array( $this, 'admin_post_clear_all_errors' ) );

		$this->error_manager   = Error_Handler::get_instance();
		$this->stored_errors   = $this->error_manager->get_stored_errors();
		$this->verified_errors = $this->error_manager->get_verified_errors();
		$this->dev_debug_on    = defined( 'JETPACK_DEV_DEBUG' ) && JETPACK_DEV_DEBUG;
	}

	/**
	 * Enqueue scripts.
	 *
	 * @param string $hook Called hook.
	 */
	public function enqueue_scripts( $hook ) {
		if ( 'jetpack-debug_page_broken-token-connection-errors' === $hook ) {
			wp_enqueue_script( 'broken_token_connection_errors', plugin_dir_url( __FILE__ ) . 'js/connection-errors.js', array( 'jquery' ), JETPACK_DEBUG_HELPER_VERSION, true );
			wp_localize_script(
				'broken_token_connection_errors',
				'jetpack_broken_token_connection_errors',
				array(
					'verify_error_url'              => get_rest_url() . 'jetpack/v4/verify_xmlrpc_error',
					'admin_post_url'                => admin_url( 'admin-post.php' ),
					'refresh_verified_errors_nonce' => wp_create_nonce( 'refresh-verified-errors' ),
				)
			);
		}
	}

	/**
	 * Register submenu page.
	 */
	public function register_submenu_page() {
		add_submenu_page(
			'jetpack-debug-tools',
			'Connection Errors',
			'Connection Errors',
			'manage_options',
			'broken-token-connection-errors',
			array( $this, 'render_ui' ),
			99
		);
	}

	/**
	 * Render UI.
	 */
	public function render_ui() {
		?>
			<h1>Connection errors</h1>
			<p>
				This page helps you to trigger connection errors with invalid signatures.
			</p>
			<?php if ( $this->dev_debug_on ) : ?>
				<div class="notice notice-success">
					<p>JETPACK_DEV_DEBUG constant is ON. This means every error will be reported. You're good to test.</p>
				</div>
			<?php else : ?>
				<div class="notice notice-warning">
					<p>JETPACK_DEV_DEBUG constant is OFF. This means an error will only be reported once evey hour. Set it to true so you can test it.</p>
				</div>
			<?php endif; ?>

			<p>
				Now head to <a href="https://jetpack.com/debug/?url=<?php echo esc_url_raw( get_home_url() ); ?>">Jetpack Debugger</a> and trigger some requests!
			</p>
			<form action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>" method="post">
				<input type="hidden" name="action" value="create_error">
				<?php wp_nonce_field( 'create-error' ); ?>
				<h3>
					Create fake errors
				</h3>
				<p>
					<input type="radio" name="token_type" value="blog" checked /> With the blog token
					<input type="radio" name="token_type" value="user"  /> With a user token
					|
					<input type="radio" name="verified" value="yes" checked /> Verified
					<input type="radio" name="verified" value="no"  /> Not verified
				</p>
				<p>
					<input type="submit" value="Create error" class="button button-primary">
				</p>
			</form>

			<p>
				<form action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>" method="post">
					<input type="hidden" name="action" value="clear_all_errors">
					<?php wp_nonce_field( 'clear-all-errors' ); ?>
					<input type="submit" value="Clear all errors" class="button button-primary">
				</form>
			</p>

			<div id="current_connection_errors">


				<form action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>" method="post">
					<input type="hidden" name="action" value="clear_all_connection_errors">
					<?php wp_nonce_field( 'clear-connection-errors' ); ?>
					<h2>
						Current Unverified Errors
						<input type="submit" value="Clear all unverified errors" class="button button-primary">
					</h2>
				</form>
				<p>
					Unverified errors are errors that were detected but that we don't know if they are legit and came from WP.com
				</p>
				<p>
					After an error is detected, we send a request to WP.COM and ask it to reach back to us with a nonce to confirm the error is legit. They do this by sending a request to the verify error API endpoint. You can simulate this request clicking on the "Verify error" buttons below.
				</p>
				<div id="stored-connection-error">
					<?php $this->print_current_errors(); ?>
				</div>
				<div id="verified-connection-error">
					<form action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>" method="post">
						<input type="hidden" name="action" value="clear_all_verified_connection_errors">
						<?php wp_nonce_field( 'clear-verified-connection-errors' ); ?>
						<h2>
							Current Verified Errors
							<input type="submit" value="Clear all verified errors" class="button button-primary">
						</h2>
					</form>
					<p>
						Verified errors are errors we know are legit and now we will display them to the user or do some self healing, depending on the error.
					</p>
					<div id="verified_errors_list">
						<?php $this->print_verified_errors(); ?>
					</div>
				</div>
			</div>

		<?php
	}

	/**
	 * Print current errors.
	 */
	public function print_current_errors() {
		foreach ( $this->stored_errors as $error_code => $error_group ) {

			echo '<h4>' . esc_html( $error_code ) . '</h4>';

			foreach ( $error_group as $user_id => $error ) {
				?>
				<b>User: <?php echo esc_html( $user_id ); ?></b>
				<pre><?php print_r( $error ); ?></pre>

				<input type="button" value="Verify error (via API)" data-nonce="<?php echo esc_attr( $error['nonce'] ); ?>" class="button button-primary verify-error">

				<hr />
				<?php
			}
		}
	}

	/**
	 * Print verified errors.
	 */
	public function print_verified_errors() {
		foreach ( $this->verified_errors as $error_code => $error_group ) {

			echo '<h4>' . esc_html( $error_code ) . '</h4>';

			foreach ( $error_group as $user_id => $error ) {
				?>
				<b>User: <?php echo esc_html( $user_id ); ?></b>
				<pre><?php print_r( $error ); ?></pre>
				<hr />
				<?php
			}
		}
	}

	/**
	 * Clear all connection errors.
	 */
	public function admin_post_clear_all_errors() {
		check_admin_referer( 'clear-all-errors' );
		$this->error_manager->delete_all_errors();
		$this->admin_post_redirect_referrer();
	}

	/**
	 * Clear all unverified connection errors.
	 */
	public function admin_post_clear_all_connection_errors() {
		check_admin_referer( 'clear-connection-errors' );
		$this->error_manager->delete_stored_errors();
		$this->admin_post_redirect_referrer();
	}

	/**
	 * Clear all verified connection errors.
	 */
	public function admin_post_clear_all_verified_connection_errors() {
		check_admin_referer( 'clear-verified-connection-errors' );
		$this->error_manager->delete_verified_errors();
		$this->admin_post_redirect_referrer();
	}

	/**
	 * Return the list of verified errors to dynamically refresh the interface
	 */
	public function admin_post_refresh_verified_errors_list() {
		check_admin_referer( 'refresh-verified-errors' );
		$this->print_verified_errors();
		exit;
	}

	/**
	 * Just redirects back to the referrer. Keeping it DRY.
	 */
	public function admin_post_redirect_referrer() {
		if ( wp_get_referer() ) {
			wp_safe_redirect( wp_get_referer() );
		} else {
			wp_safe_redirect( get_home_url() );
		}
	}

	/**
	 * Generates a sample WP_Error object in the same format Manager class does for broken signatures
	 *
	 * @param string $error_code The error code you want the error to have.
	 * @param string $user_id The user id you want the token to have.
	 * @param string $error_type The error type: 'xmlrpc' or 'rest'.
	 *
	 * @return \WP_Error
	 */
	public function get_sample_error( $error_code, $user_id, $error_type = 'xmlrpc' ) {

		$signature_details = array(
			'token'     => 'dhj938djh938d:1:' . $user_id,
			'timestamp' => time(),
			'nonce'     => 'asd3d32d',
			'body_hash' => 'dsf34frf',
			'method'    => 'POST',
			'url'       => 'https://example.org',
			'signature' => 'sdf234fe',
		);

		return new \WP_Error(
			$error_code,
			'An error was triggered',
			compact( 'signature_details', 'error_type' )
		);

	}

	/**
	 * Creates a fake error
	 */
	public function admin_post_create_error() {
		check_admin_referer( 'create-error' );

		$user_id = isset( $_POST['token_type'] ) && 'user' === $_POST['token_type'] ? 1 : 0;

		$error = $this->get_sample_error( 'invalid_token', $user_id );

		$this->error_manager->store_error( $error );

		if ( isset( $_POST['verified'] ) && 'yes' === $_POST['verified'] ) {
			$errors = $this->error_manager->get_stored_errors();
			if ( isset( $errors['invalid_token'] ) && isset( $errors['invalid_token'][ $user_id ] ) ) {
				$this->error_manager->verify_error( $errors['invalid_token'][ $user_id ] );
			}
		}

		$this->admin_post_redirect_referrer();
	}

}

// phpcs:enable
