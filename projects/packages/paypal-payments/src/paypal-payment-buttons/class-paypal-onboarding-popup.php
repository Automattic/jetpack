<?php
/**
 * Same-origin popup that runs PayPal's onboarding SDK.
 *
 * @package automattic/jetpack-paypal-payments
 * @since $$next-version$$
 */

namespace Automattic\Jetpack\PaypalPayments;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Hosts PayPal's Partner Referrals SDK in a popup window.
 *
 * PayPal's SDK redirects `window.top` to the return URL when the seller finishes.
 * Run from the editor that reloads it and loses an unsaved post, so the SDK gets
 * a window of its own, where the redirect lands harmlessly. The auth code comes
 * back to the editor over a BroadcastChannel, the way Publicize returns a keyring
 * result in Keyring_Result_Handler.
 */
class PayPal_Onboarding_Popup {

	/**
	 * The admin-post action that opens the popup.
	 */
	const ACTION = 'jetpack_paypal_onboarding';

	/**
	 * The BroadcastChannel name shared with the client.
	 *
	 * Must match ONBOARDING_CHANNEL in src/paypal-payment-buttons/edit.jsx.
	 */
	const CHANNEL = 'jetpack-paypal-onboarding';

	/**
	 * Register the handler.
	 */
	public static function init() {
		add_action( 'admin_post_' . self::ACTION, array( __CLASS__, 'handle' ) );
	}

	/**
	 * The URL the editor opens, minus the environment it picks at click time.
	 *
	 * @return string
	 */
	public static function get_url() {
		return add_query_arg(
			array(
				'action'   => self::ACTION,
				'_wpnonce' => wp_create_nonce( self::ACTION ),
			),
			admin_url( 'admin-post.php' )
		);
	}

	/**
	 * Render the popup.
	 *
	 * @return never
	 */
	public static function handle() {
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_die( esc_html__( 'You are not allowed to connect a PayPal account.', 'jetpack-paypal-payments' ), '', 403 );
		}

		check_admin_referer( self::ACTION );

		$environment = isset( $_GET['environment'] ) ? sanitize_text_field( wp_unslash( $_GET['environment'] ) ) : 'production';
		if ( ! in_array( $environment, array( 'sandbox', 'production' ), true ) ) {
			$environment = 'production';
		}

		nocache_headers();

		// PayPal returns the seller here, inside the popup, where a redirect costs
		// nothing. The auth code rides the return URL in this flow -- under
		// displayMode=minibrowser it would go to partner.js's callback instead.
		if ( isset( $_GET['paypal_done'] ) ) {
			// phpcs:disable WordPress.Security.NonceVerification.Recommended -- PayPal sets these on its own redirect; the nonce was checked above.
			$auth_code = isset( $_GET['authCode'] ) ? sanitize_text_field( wp_unslash( $_GET['authCode'] ) ) : '';
			$shared_id = isset( $_GET['sharedId'] ) ? sanitize_text_field( wp_unslash( $_GET['sharedId'] ) ) : '';
			$returned  = array_keys( $_GET );
			// phpcs:enable WordPress.Security.NonceVerification.Recommended

			self::render_return( $auth_code, $shared_id, $returned );
		}

		$signup_link = PayPal_Partner_Onboarding::generate_signup_link( self::return_url(), $environment );
		if ( is_wp_error( $signup_link ) ) {
			self::render_error( $signup_link->get_error_message() );
		}

		// Straight to PayPal, so the seller's click in the editor is the only one
		// the flow needs. partner.js is not involved: its minibrowser opens a
		// window, which needs a user activation this popup does not carry.
		wp_redirect( $signup_link['action_url'] ); // phpcs:ignore WordPress.Security.SafeRedirect.wp_redirect_wp_redirect -- PayPal's own onboarding URL, off-site by definition.
		exit;
	}

	/**
	 * The URL PayPal sends the seller back to once onboarding finishes.
	 *
	 * @return string
	 */
	private static function return_url() {
		return add_query_arg( 'paypal_done', '1', self::get_url() );
	}

	/**
	 * Report the result of onboarding to the editor and close the window.
	 *
	 * @param string   $auth_code The seller auth code, when PayPal returned one.
	 * @param string   $shared_id The shared ID that goes with it.
	 * @param string[] $returned  Names of the parameters PayPal sent back.
	 * @return never
	 */
	private static function render_return( $auth_code, $shared_id, $returned ) {
		$message = $auth_code && $shared_id
			? __( 'Connecting your account…', 'jetpack-paypal-payments' )
			: __( 'PayPal did not return the credentials needed to finish connecting.', 'jetpack-paypal-payments' );

		$payload = $auth_code && $shared_id
			? array(
				'type'     => 'paypal-onboarding-complete',
				'authCode' => $auth_code,
				'sharedId' => $shared_id,
			)
			: array(
				'type'     => 'paypal-onboarding-incomplete',
				// Names only, never values: enough to tell what PayPal sent without
				// putting an auth code in a console log.
				'returned' => $returned,
			);

		self::render_document( $message, $payload, (bool) $auth_code );
	}

	/**
	 * Report a failure to generate the referral link.
	 *
	 * @param string $message The error to show.
	 * @return never
	 */
	private static function render_error( $message ) {
		self::render_document(
			$message,
			array(
				'type'    => 'paypal-onboarding-incomplete',
				'message' => $message,
			),
			false
		);
	}

	/**
	 * Output the popup document and stop.
	 *
	 * @param string $message What the seller sees while the window is up.
	 * @param array  $payload What to broadcast to the editor.
	 * @param bool   $close   Whether to close the window once the message is sent.
	 * @return never
	 */
	private static function render_document( $message, $payload, $close ) {
		if ( ! headers_sent() ) {
			header( 'Content-Type: text/html; charset=' . get_option( 'blog_charset' ) );
		}

		$json_flags = JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP;
		?>
<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
	<meta charset="<?php echo esc_attr( get_option( 'blog_charset' ) ); ?>" />
	<title><?php esc_html_e( 'Connect with PayPal', 'jetpack-paypal-payments' ); ?></title>
	<style>
		body { margin: 0; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 24px; font-family: system-ui, sans-serif; color: #1e1e1e; text-align: center; }
	</style>
</head>
<body>
	<p><?php echo esc_html( $message ); ?></p>
	<script>
		( function () {
			try {
				var channel = new BroadcastChannel( <?php echo wp_json_encode( self::CHANNEL, $json_flags ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- wp_json_encode with JSON_HEX_TAG. ?> );
				channel.postMessage( <?php echo wp_json_encode( $payload, $json_flags ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- wp_json_encode with JSON_HEX_TAG. ?> );
				channel.close();
			} catch ( e ) {}

			<?php if ( $close ) : ?>
			window.setTimeout( function () {
				window.close();
			}, 50 );
			<?php endif; ?>
		} )();
	</script>
</body>
</html>
		<?php
		exit;
	}
}
