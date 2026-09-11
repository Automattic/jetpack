<?php
/**
 * Handles form submissions from Settings > Sharing.
 *
 * @package automattic/jetpack
 */

declare( strict_types = 1 );

namespace Automattic\Jetpack\Plugin\Sharing_Settings;

use Automattic\Jetpack\Modules;

/**
 * Processes the screen's form submissions.
 *
 * Each section posts its own action with its own nonce, so saving one section
 * never runs another section's handlers.
 */
final class Post_Handler {

	/**
	 * Field naming the requested action.
	 */
	private const ACTION_FIELD = 'jetpack_sharing_action';

	/**
	 * Hook the handler up.
	 */
	public static function init(): void {
		add_action( 'admin_init', array( __CLASS__, 'maybe_handle' ) );
	}

	/**
	 * Dispatch a submission, if this request is one.
	 */
	public static function maybe_handle(): void {
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- identifying the screen; the nonce is verified below.
		if ( ! isset( $_GET['page'] ) || Sharing_Settings_Page::SLUG !== $_GET['page'] ) {
			return;
		}

		// phpcs:ignore WordPress.Security.NonceVerification.Missing -- verified per action below.
		if ( ! isset( $_POST[ self::ACTION_FIELD ] ) ) {
			return;
		}

		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}

		// phpcs:ignore WordPress.Security.NonceVerification.Missing -- verified per action below.
		$action = sanitize_key( wp_unslash( $_POST[ self::ACTION_FIELD ] ) );

		switch ( $action ) {
			case 'activate-likes':
				self::activate_module( 'likes', Likes_Section::NONCE_ACTION );
				break;
			case 'activate-sharing':
				self::activate_module( 'sharedaddy', Sharing_Section::NONCE_ACTION );
				break;
		}
	}

	/**
	 * Turn a module back on, then reload the screen.
	 *
	 * Only ever used to switch a feature on. Switching off is a setting on this
	 * screen, not a module change, so the two never compete.
	 *
	 * @param string $module       Module slug.
	 * @param string $nonce_action Nonce action the submitting section uses.
	 */
	private static function activate_module( string $module, string $nonce_action ): void {
		check_admin_referer( $nonce_action );

		( new Modules() )->activate( $module, false, false );

		wp_safe_redirect( admin_url( 'options-general.php?page=' . Sharing_Settings_Page::SLUG ) );
		exit;
	}

	/**
	 * Markup for a button that switches a feature back on.
	 *
	 * @param string $action       Action name, matching a case above.
	 * @param string $nonce_action Nonce action for the submitting section.
	 * @param string $label        Button label.
	 */
	public static function render_activate_form( string $action, string $nonce_action, string $label ): void {
		?>
		<form method="post" action="">
			<input type="hidden" name="<?php echo esc_attr( self::ACTION_FIELD ); ?>" value="<?php echo esc_attr( $action ); ?>" />
			<?php wp_nonce_field( $nonce_action ); ?>
			<p><button type="submit" class="button button-primary"><?php echo esc_html( $label ); ?></button></p>
		</form>
		<?php
	}
}
