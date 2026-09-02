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

		// PayPal returns the seller to this same page, inside the popup, where the
		// redirect costs nothing. Nothing reads the marker: it exists so the return
		// lands on the branch that closes the window instead of starting over.
		if ( isset( $_GET['paypal_done'] ) ) {
			self::render( $environment, '' );
		}

		$signup_link = PayPal_Partner_Onboarding::generate_signup_link( self::return_url(), $environment );
		if ( is_wp_error( $signup_link ) ) {
			self::render( $environment, '', $signup_link->get_error_message() );
		}

		$action_url = add_query_arg( 'displayMode', 'minibrowser', $signup_link['action_url'] );

		self::render( $environment, $action_url );
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
	 * PayPal's onboarding SDK, per environment.
	 *
	 * @param string $environment 'sandbox' or 'production'.
	 * @return string
	 */
	private static function partner_js_url( $environment ) {
		return 'sandbox' === $environment
			? 'https://www.sandbox.paypal.com/webapps/merchantboarding/js/lib/lightbox/partner.js'
			: 'https://www.paypal.com/webapps/merchantboarding/js/lib/lightbox/partner.js';
	}

	/**
	 * Output the popup document and stop.
	 *
	 * @param string $environment 'sandbox' or 'production'.
	 * @param string $action_url  PayPal's referral URL, or '' to just close the window.
	 * @param string $error       A message to show instead of the connect link.
	 * @return never
	 */
	private static function render( $environment, $action_url, $error = '' ) {
		if ( ! headers_sent() ) {
			header( 'Content-Type: text/html; charset=' . get_option( 'blog_charset' ) );
		}

		$channel = wp_json_encode( self::CHANNEL, JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP );
		?>
<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
	<meta charset="<?php echo esc_attr( get_option( 'blog_charset' ) ); ?>" />
	<title><?php esc_html_e( 'Connect with PayPal', 'jetpack-paypal-payments' ); ?></title>
	<style>
		body { margin: 0; display: flex; align-items: center; justify-content: center; min-height: 100vh; font-family: system-ui, sans-serif; color: #1e1e1e; }
	</style>
</head>
<body>
		<?php if ( $error ) : ?>
		<p><?php echo esc_html( $error ); ?></p>
	<?php elseif ( $action_url ) : ?>
		<p><?php esc_html_e( 'Opening PayPal…', 'jetpack-paypal-payments' ); ?></p>
		<a
			id="paypal-connect"
			href="<?php echo esc_url( $action_url ); ?>"
			data-paypal-button="true"
			data-paypal-onboard-complete="jetpackPayPalOnboardComplete"
			target="PPFrame"
			hidden
		><?php esc_html_e( 'Continue to PayPal', 'jetpack-paypal-payments' ); ?></a>
	<?php else : ?>
		<p><?php esc_html_e( 'You can close this window now.', 'jetpack-paypal-payments' ); ?></p>
	<?php endif; ?>
	<script>
		( function () {
			var channel;
			try {
				channel = new BroadcastChannel( <?php echo $channel; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- wp_json_encode with JSON_HEX_TAG. ?> );
			} catch ( e ) {}

			/*
			 * PayPal calls this by name, in this realm, with the only auth code the
			 * flow ever produces -- the return URL carries a merchant ID and consent
			 * flags but never this.
			 */
			window.jetpackPayPalOnboardComplete = function ( authCode, sharedId ) {
				if ( channel ) {
					channel.postMessage( { type: 'paypal-onboarding-complete', authCode: authCode, sharedId: sharedId } );
				}
			};

			var link = document.getElementById( 'paypal-connect' );
			if ( ! link ) {
				if ( channel ) {
					channel.postMessage( { type: 'paypal-onboarding-returned' } );
					channel.close();
				}
				window.setTimeout( function () {
					window.close();
				}, 50 );
				return;
			}

			// partner.js binds the anchors it finds as it runs, so it is added after
			// the link rather than alongside it.
			var script = document.createElement( 'script' );
			script.src = <?php echo wp_json_encode( self::partner_js_url( $environment ), JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- wp_json_encode with JSON_HEX_TAG. ?>;
			script.onload = function () {
				if ( window.PAYPAL && window.PAYPAL.apps && window.PAYPAL.apps.Signup ) {
					window.PAYPAL.apps.Signup.render();
				}
				link.click();
			};
			script.onerror = function () {
				link.hidden = false;
			};
			document.body.appendChild( script );
		} )();
	</script>
</body>
</html>
		<?php
		exit;
	}
}
