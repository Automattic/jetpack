<?php // phpcs:disable WordPress.PHP.DevelopmentFunctions.error_log_print_r
/**
 * XMLRPC Brokeness.
 *
 * @package Jetpack.
 */

use Automattic\Jetpack\Connection\Error_Handler;

/**
 * Class Broken_Token_XmlRpc
 */
class Broken_Token_XmlRpc {

	/**
	 * Broken_Token_XmlRpc constructor.
	 */
	public function __construct() {

		add_action( 'admin_menu', array( $this, 'register_submenu_page' ), 1000 );

		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_scripts' ) );

		add_action( 'admin_post_clear_all_xmlrpc_errors', array( $this, 'admin_post_clear_all_xmlrpc_errors' ) );
		add_action( 'admin_post_clear_all_verified_xmlrpc_errors', array( $this, 'admin_post_clear_all_verified_xmlrpc_errors' ) );
		add_action( 'admin_post_refresh_verified_errors_list', array( $this, 'admin_post_refresh_verified_errors_list' ) );

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
		if ( 'jetpack_page_broken-token-xmlrpc-errors' === $hook ) {
			wp_enqueue_script( 'broken_token_xmlrpc_errors', plugin_dir_url( __FILE__ ) . 'js/xmlrpc-errors.js', array( 'jquery' ), JETPACK_DEBUG_HELPER_VERSION, true );
			wp_localize_script(
				'broken_token_xmlrpc_errors',
				'jetpack_broken_token_xmlrpc_errors',
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
			'jetpack',
			'XML-RPC Errors',
			'XML-RPC Errors',
			'manage_options',
			'broken-token-xmlrpc-errors',
			array( $this, 'render_ui' ),
			99
		);
	}

	/**
	 * Render UI.
	 */
	public function render_ui() {
		?>
			<h1>XML-RPC errors</h1>
			<p>
				This page helps you to trigger XML-RPC requests with invalid signatures.
			</p>
			<?php if ( $this->dev_debug_on ) : ?>
				<div class="notice notice-success">
					<p>JETPACK_DEV_DEBUG constant is ON. This means every xml-rpc error will be reported. You're good to test.</p>
				</div>
			<?php else : ?>
				<div class="notice notice-warning">
					<p>JETPACK_DEV_DEBUG constant is OFF. This means xml-rpc error will only be reported once evey hour. Set it to true so you can test it.</p>
				</div>
			<?php endif; ?>

			<p>
				Now head to <a href="https://jetpack.com/debug/?url=<?php echo esc_url_raw( get_home_url() ); ?>">Jetpack Debugger</a> and trigger some requests!
			</p>

			<div id="current_xmlrpc_errors">


				<form action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>" method="post">
					<input type="hidden" name="action" value="clear_all_xmlrpc_errors">
					<?php wp_nonce_field( 'clear-xmlrpc-errors' ); ?>
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
				<div id="stored-xmlrpc-error">
					<?php $this->print_current_errors(); ?>
				</div>
				<div id="verified-xmlrpc-error">
					<form action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>" method="post">
						<input type="hidden" name="action" value="clear_all_verified_xmlrpc_errors">
						<?php wp_nonce_field( 'clear-verified-xmlrpc-errors' ); ?>
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
	 * Clear all XMLRPC Errors.
	 */
	public function admin_post_clear_all_xmlrpc_errors() {
		check_admin_referer( 'clear-xmlrpc-errors' );
		$this->error_manager->delete_stored_errors();
		$this->admin_post_redirect_referrer();
	}

	/**
	 * Clear all verified XMLRPC Errors.
	 */
	public function admin_post_clear_all_verified_xmlrpc_errors() {
		check_admin_referer( 'clear-verified-xmlrpc-errors' );
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

}

// phpcs:enable
