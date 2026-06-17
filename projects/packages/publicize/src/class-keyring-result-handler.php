<?php
/**
 * Same-origin completion handler for the publicize auth_flow=v2 connect flow.
 *
 * @package automattic/jetpack-publicize
 */

namespace Automattic\Jetpack\Publicize;

/**
 * Handles the popup landing page that public-api redirects back to after a connection is
 * verified (auth_flow=v2).
 *
 * Because Meta/Threads sever `window.opener` via COOP, the popup cannot post its result back
 * to the opener tab. Instead public-api redirects the popup to this same-origin admin-post
 * endpoint, which broadcasts the request_id over a BroadcastChannel that the opener is
 * listening on, then closes itself. The opener then fetches the verified result once.
 */
class Keyring_Result_Handler {

	/**
	 * The admin-post action that the connect popup is redirected back to.
	 */
	const ACTION = 'jetpack_social_keyring_done';

	/**
	 * The BroadcastChannel name shared with the client.
	 *
	 * Must match KEYRING_BROADCAST_CHANNEL in _inc/utils/request-external-access.js.
	 */
	const CHANNEL = 'jetpack-social-keyring';

	/**
	 * Register the handler.
	 */
	public static function init() {
		add_action( 'admin_post_' . self::ACTION, array( __CLASS__, 'handle' ) );
	}

	/**
	 * Output a minimal page that broadcasts the request_id to the opener and closes the popup.
	 *
	 * @return never
	 */
	public static function handle() {
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Read-only: the request_id is an opaque token reflected back to a same-origin BroadcastChannel; nothing is mutated.
		$request_id = isset( $_GET['request_id'] ) ? sanitize_key( wp_unslash( $_GET['request_id'] ) ) : '';

		nocache_headers();

		if ( ! headers_sent() ) {
			header( 'Content-Type: text/html; charset=' . get_option( 'blog_charset' ) );
		}

		$close_warning = esc_html__( 'You can close this window now.', 'jetpack-publicize-pkg' );
		?>
<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
	<meta charset="<?php echo esc_attr( get_option( 'blog_charset' ) ); ?>" />
	<title></title>
</head>
<body>
	<p><?php echo $close_warning; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- already escaped above. ?></p>
	<script>
		( function () {
			try {
				var channel = new BroadcastChannel( <?php echo wp_json_encode( self::CHANNEL, JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP ); ?> );
				channel.postMessage( {
					type: 'keyring-result',
					requestId: <?php echo wp_json_encode( $request_id, JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP ); ?>,
				} );
				channel.close();
			} catch ( e ) {}

			window.setTimeout( function () {
				window.close();
			}, 50 );
		} )();
	</script>
</body>
</html>
		<?php
		exit;
	}
}
