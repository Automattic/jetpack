<?php
/**
 * The site-origin page WordPress.com sends the popup back to.
 *
 * @package automattic/jetpack-comments
 */

namespace Automattic\Jetpack\Comments\Identity;

/**
 * Serves the landing page named in WordPress.com's redirect_uri. It runs on the
 * site's own origin, so its BroadcastChannel and any cookie it sets are
 * first-party.
 *
 * The page gets the code, state and error out of the URL fragment, strips them
 * from the address bar at once, and then either signals the opener (the popup
 * path) or redeems and returns the reader home (the redirect fallback). The
 * order matters: the code must never sit in a URL that can be shared or logged.
 */
class Landing {

	/**
	 * Hook the landing handler.
	 *
	 * @return void
	 */
	public static function init() {
		add_action( 'template_redirect', array( __CLASS__, 'maybe_handle' ), 1 );
	}

	/**
	 * Serve the landing page when this request is one.
	 *
	 * @return void
	 */
	public static function maybe_handle() {
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- routing only; nothing is read from the query but a fixed marker.
		if ( ! isset( $_GET['jetpack-comment-identity'] ) || 'landing' !== $_GET['jetpack-comment-identity'] ) {
			return;
		}

		nocache_headers();
		if ( ! headers_sent() ) {
			header( 'Content-Type: text/html; charset=' . get_option( 'blog_charset' ) );
		}

		$config = wp_json_encode(
			array(
				'channel'   => Checkpoint::CHANNEL,
				'redeemUrl' => rest_url( REST_Controller::NAMESPACE . '/identity/redeem' ),
				'nonce'     => wp_create_nonce( 'wp_rest' ),
				'home'      => home_url( '/' ),
			),
			JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT
		);

		?>
<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
	<meta charset="<?php echo esc_attr( get_option( 'blog_charset' ) ); ?>" />
	<meta name="robots" content="noindex,nofollow" />
	<title></title>
</head>
<body>
	<p><?php esc_html_e( 'You can close this window now.', 'jetpack-comments' ); ?></p>
	<script>
	( function () {
		var config = <?php echo $config; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- wp_json_encode with HEX flags. ?>;

		// Pull the result out of the fragment, then strip it from the URL before
		// anything else, so the code cannot be shared, logged or restored.
		var hash = window.location.hash.replace( /^#/, '' );
		var params = new URLSearchParams( hash );
		var code = params.get( 'code' ) || '';
		var state = params.get( 'state' ) || '';
		var error = params.get( 'error' ) || '';

		try {
			window.history.replaceState( null, '', window.location.pathname + window.location.search );
		} catch ( e ) {}

		var mode = new URLSearchParams( window.location.search ).get( 'mode' );

		if ( 'redirect' !== mode ) {
			// Popup path: hand the result to the opener, which holds the state it
			// issued and does the redemption. Then close.
			try {
				var channel = new BroadcastChannel( config.channel );
				channel.postMessage( { type: config.channel, state: state, code: code, error: error } );
				channel.close();
			} catch ( e ) {}

			window.setTimeout( function () {
				window.close();
			}, 50 );
			return;
		}

		// Redirect fallback: no opener to talk to. Check the state we stored
		// before leaving, redeem here, then send the reader back where they were.
		var storedState = '';
		var returnUrl = config.home;
		try {
			storedState = window.sessionStorage.getItem( 'jetpack-comment-identity-state' ) || '';
			returnUrl = window.sessionStorage.getItem( 'jetpack-comment-identity-return' ) || config.home;
			window.sessionStorage.removeItem( 'jetpack-comment-identity-state' );
			window.sessionStorage.removeItem( 'jetpack-comment-identity-return' );
		} catch ( e ) {}

		var goBack = function () {
			window.location.replace( returnUrl );
		};

		if ( error || ! code || ! state || state !== storedState ) {
			goBack();
			return;
		}

		fetch( config.redeemUrl, {
			method: 'POST',
			credentials: 'same-origin',
			headers: { 'Content-Type': 'application/json', 'X-WP-Nonce': config.nonce },
			body: JSON.stringify( { code: code } ),
		} ).then( goBack, goBack );
	} )();
	</script>
</body>
</html>
		<?php
		exit;
	}
}
