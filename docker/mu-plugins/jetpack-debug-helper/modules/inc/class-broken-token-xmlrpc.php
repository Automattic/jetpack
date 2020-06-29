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

		add_action( 'admin_post_clear_all_xmlrpc_errors', array( $this, 'admin_post_clear_all_xmlrpc_errors' ) );

		$this->error_manager = new Error_Handler();
		$this->stored_errors = $this->error_manager->get_stored_errors();
		$this->dev_debug_on  = defined( 'JETPACK_DEV_DEBUG' ) && JETPACK_DEV_DEBUG;
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
				<div id="stored-xmlrpc-error">
					<?php $this->print_current_errors(); ?>
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
				<form action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>" method="post">
					<input type="hidden" name="action" value="verify_error">
					<input type="hidden" name="nonce" value="<?php echo esc_attr( $error['error_data']['nonce'] ); ?>">
					<?php wp_nonce_field( 'verify-error' ); ?>
					<input type="submit" value="Verify error" class="button button-primary">
				</form>
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
