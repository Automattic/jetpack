<?php
/**
 * Handles form submissions from Settings > Sharing.
 *
 * @package automattic/jetpack-sharing-likes
 */

declare( strict_types = 1 );

namespace Automattic\Jetpack\Sharing_Likes\Settings;

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
		if ( ! isset( $_GET['page'] ) || Settings_Page::SLUG !== $_GET['page'] ) {
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

		$redirect = null;

		switch ( $action ) {
			case 'activate-likes':
				$redirect = self::activate_module( 'likes', Likes_Section::NONCE_ACTION );
				break;
			case 'activate-sharing':
				$redirect = self::activate_module( 'sharedaddy', Sharing_Section::NONCE_ACTION );
				break;
			case 'switch-to-block-likes':
				$redirect = self::deactivate_module( 'likes', Likes_Section::NONCE_ACTION );
				break;
			case 'switch-to-block-sharing':
				$redirect = self::deactivate_module( 'sharedaddy', Sharing_Section::NONCE_ACTION );
				break;
			case 'save-likes':
				$redirect = self::save_likes();
				break;
			case 'save-placement':
				$redirect = self::save_placement();
				break;
			case 'save-extras':
				$redirect = self::save_extras();
				break;
		}

		if ( null === $redirect ) {
			return;
		}

		wp_safe_redirect( $redirect );
		exit;
	}

	/**
	 * Stop producing legacy output, so the block can take over.
	 *
	 * This is a migration, not the section's off switch: it is what the Jetpack
	 * dashboard's "Switch to the … block" button does, and it leaves the block
	 * itself untouched.
	 *
	 * @param string $module       Module slug.
	 * @param string $nonce_action Nonce action the submitting section uses.
	 * @return string URL to send the browser back to.
	 */
	private static function deactivate_module( string $module, string $nonce_action ): string {
		check_admin_referer( $nonce_action );

		( new Modules() )->deactivate( $module );

		return self::screen_url( true );
	}

	/**
	 * Save the Like buttons section.
	 *
	 * @return string URL to send the browser back to.
	 */
	private static function save_likes(): string {
		check_admin_referer( Likes_Section::NONCE_ACTION );

		if ( 'off' === self::posted_choice( 'wpl_default' ) ) {
			update_option( 'disabled_likes', 1 );
		} else {
			delete_option( 'disabled_likes' );
		}

		if ( Environment::is_simple_site() ) {
			if ( 'off' === self::posted_choice( 'jetpack_reblogs_enabled' ) ) {
				update_option( 'disabled_reblogs', 1 );
			} else {
				delete_option( 'disabled_reblogs' );
			}

			// phpcs:ignore WordPress.Security.NonceVerification.Missing -- verified above.
			update_option( 'jetpack_comment_likes_enabled', empty( $_POST['jetpack_comment_likes_enabled'] ) ? 0 : 1 );
		}

		return self::screen_url( true );
	}

	/**
	 * Save whatever third parties rendered into the extras section.
	 *
	 * Each of them verifies its own nonce inside `sharing_admin_update`, so this
	 * only has to establish that the request came from this screen.
	 *
	 * @return string URL to send the browser back to.
	 */
	private static function save_extras(): string {
		check_admin_referer( Extras_Section::NONCE_ACTION );

		/** This action is documented in projects/packages/sharing-likes/src/settings/class-services-config.php */
		do_action( 'sharing_admin_update' );

		return self::screen_url( true );
	}

	/**
	 * Save the shared placement section.
	 *
	 * @return string URL to send the browser back to.
	 */
	private static function save_placement(): string {
		check_admin_referer( Placement_Section::NONCE_ACTION );

		$options = get_option( 'sharing-options' );
		if ( ! is_array( $options ) ) {
			$options = array();
		}

		// Sites carry a malformed `global` (see #6121), and writing into it in place
		// would fatal where the services save, which rebuilds it wholesale, does not.
		if ( ! isset( $options['global'] ) || ! is_array( $options['global'] ) ) {
			$options['global'] = array();
		}

		$allowed   = array_values( get_post_types( array( 'public' => true ) ) );
		$allowed[] = 'index';

		// phpcs:ignore WordPress.Security.NonceVerification.Missing, WordPress.Security.ValidatedSanitizedInput -- nonce verified above; the values are checked against an allowlist below.
		$posted = isset( $_POST['show'] ) && is_array( $_POST['show'] ) ? wp_unslash( $_POST['show'] ) : array();
		$posted = array_filter( $posted, 'is_scalar' );

		$options['global']['show'] = array_values( array_intersect( $posted, $allowed ) );

		update_option( 'sharing-options', $options );

		return self::screen_url( true );
	}

	/**
	 * One of a radio group's values, defaulting to "on" when nothing was posted.
	 *
	 * @param string $field Field name.
	 */
	private static function posted_choice( string $field ): string {
		// phpcs:ignore WordPress.Security.NonceVerification.Missing -- callers verify before reading.
		if ( empty( $_POST[ $field ] ) ) {
			return 'on';
		}

		// phpcs:ignore WordPress.Security.NonceVerification.Missing -- callers verify before reading.
		return sanitize_text_field( wp_unslash( $_POST[ $field ] ) );
	}

	/**
	 * The screen this handler posts back to.
	 *
	 * @param bool $saved Whether to ask the screen to confirm a save.
	 */
	private static function screen_url( bool $saved ): string {
		$url = admin_url( 'options-general.php?page=' . Settings_Page::SLUG );

		return $saved ? $url . '&update=saved' : $url;
	}

	/**
	 * Turn a module back on, then reload the screen.
	 *
	 * Reached only from the off variants, where nothing else on the site will
	 * bring the feature back. Offered even when the block is recommended: the
	 * switch to it is a single unconfirmed click, and this is the way back.
	 *
	 * @param string $module       Module slug.
	 * @param string $nonce_action Nonce action the submitting section uses.
	 * @return string URL to send the browser back to.
	 */
	private static function activate_module( string $module, string $nonce_action ): string {
		check_admin_referer( $nonce_action );

		( new Modules() )->activate( $module, false, false );

		return self::screen_url( false );
	}

	/**
	 * Hidden field naming the action a form is submitting.
	 *
	 * @param string $action Action name, matching a case above.
	 */
	public static function render_action_field( string $action ): void {
		printf(
			'<input type="hidden" name="%1$s" value="%2$s" />',
			esc_attr( self::ACTION_FIELD ),
			esc_attr( $action )
		);
	}

	/**
	 * Markup for a single-button form submitting one of the actions above.
	 *
	 * @param string $action       Action name, matching a case above.
	 * @param string $nonce_action Nonce action for the submitting section.
	 * @param string $label        Button label.
	 * @param bool   $primary      Whether this is the only action in its state.
	 */
	public static function render_action_form( string $action, string $nonce_action, string $label, bool $primary = true ): void {
		?>
		<form method="post" action="">
			<input type="hidden" name="<?php echo esc_attr( self::ACTION_FIELD ); ?>" value="<?php echo esc_attr( $action ); ?>" />
			<?php wp_nonce_field( $nonce_action ); ?>
			<p><button type="submit" class="<?php echo esc_attr( $primary ? 'button button-primary' : 'button' ); ?>"><?php echo esc_html( $label ); ?></button></p>
		</form>
		<?php
	}
}
