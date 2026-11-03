<?php
/**
 * Handles form submissions from Settings > Sharing.
 *
 * @package automattic/jetpack-sharing-likes
 */

declare( strict_types = 1 );

namespace Automattic\Jetpack\Sharing_Likes\Settings;

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
				$redirect = self::activate_feature( Placement_Section::FEATURE_LIKES, Likes_Section::NONCE_ACTION );
				break;
			case 'activate-sharing':
				$redirect = self::activate_feature( Placement_Section::FEATURE_SHARING, Sharing_Section::NONCE_ACTION );
				break;
			case 'switch-to-block-likes':
				$redirect = self::switch_likes_to_block();
				break;
			case 'switch-to-block-sharing':
				$redirect = self::switch_sharing_to_block();
				break;
			case 'save-settings':
				$redirect = self::save_settings();
				break;
		}

		if ( null === $redirect ) {
			return;
		}

		wp_safe_redirect( $redirect );
		exit;
	}

	/**
	 * Hand the Sharing buttons over to the block.
	 *
	 * @return string URL to send the browser back to.
	 */
	private static function switch_sharing_to_block(): string {
		check_admin_referer( Sharing_Section::NONCE_ACTION );

		Feature_Actions::switch_to_block( Placement_Section::FEATURE_SHARING );

		return self::redirect_url( true );
	}

	/**
	 * Hand the Like buttons over to the block.
	 *
	 * @return string URL to send the browser back to.
	 */
	private static function switch_likes_to_block(): string {
		check_admin_referer( Likes_Section::NONCE_ACTION );

		Feature_Actions::switch_to_block( Placement_Section::FEATURE_LIKES );

		return self::redirect_url( true );
	}

	/**
	 * Save every section that put fields on the form.
	 *
	 * Only those: the others' fields were not on the screen, and reading their
	 * absence as "off" would switch them off.
	 *
	 * @return string URL to send the browser back to.
	 */
	private static function save_settings(): string {
		check_admin_referer( Settings_Form::NONCE_ACTION );

		$sections           = Settings_Form::posted_sections();
		$comment_likes_held = true;

		// Before placement, because the services save rebuilds the global options it lives in.
		if ( in_array( Settings_Form::SECTION_SHARING, $sections, true ) ) {
			self::save_sharing_options();
		}

		if ( in_array( Settings_Form::SECTION_PLACEMENT, $sections, true ) ) {
			self::save_placement();
		}

		if ( in_array( Settings_Form::SECTION_LIKES, $sections, true ) ) {
			self::save_likes();
		}

		if ( in_array( Settings_Form::SECTION_COMMENT_LIKES, $sections, true ) && Environment::likes_supported() ) {
			$comment_likes_held = self::save_comment_likes();
		}

		// Once, from whichever section rendered `Services_Config::global_options()`; never both.
		if ( array_intersect( array( Settings_Form::SECTION_SHARING, Settings_Form::SECTION_EXTRAS ), $sections ) ) {
			self::save_global_options( $sections );
		}

		return $comment_likes_held
			? self::redirect_url( true )
			: add_query_arg( Settings_Page::COMMENT_LIKES_UNCHANGED, '1', self::redirect_url( true ) );
	}

	/**
	 * Save the rows that close the settings table, ours and then third parties'.
	 *
	 * @param string[] $sections Sections the submitted form carried fields for.
	 */
	private static function save_global_options( array $sections ): void {
		// Only the services section renders it, and `is_available()` can have turned true
		// since the form was built, so the claim decides rather than the environment.
		if ( in_array( Settings_Form::SECTION_SHARING, $sections, true ) ) {
			Sharing_Resources::save();
		}

		Twitter_Site_Tag::save();

		/** This action is documented in projects/packages/sharing-likes/src/settings/class-services-config.php */
		do_action( 'sharing_admin_update' );
	}

	/**
	 * Save the services list's own settings: button style and label.
	 */
	private static function save_sharing_options(): void {
		// The section renders only when this class is loaded, but the request can claim it regardless.
		if ( ! Sharing_Options::is_available() ) {
			return;
		}

		// phpcs:ignore WordPress.Security.NonceVerification.Missing, WordPress.Security.ValidatedSanitizedInput -- verified by the caller; set_global_options() validates each field.
		Sharing_Options::update( $_POST );
	}

	/**
	 * Save the Like buttons settings.
	 */
	private static function save_likes(): void {
		Likes_Options::set_likes_enabled( 'off' !== self::posted_choice( 'wpl_default' ) );

		if ( Environment::is_simple_site() ) {
			Likes_Options::set_reblogs_enabled( 'off' !== self::posted_choice( 'jetpack_reblogs_enabled' ) );
		}
	}

	/**
	 * Save the Comment Likes checkbox.
	 *
	 * @return bool Whether Comment Likes now match the checkbox.
	 */
	private static function save_comment_likes(): bool {
		// phpcs:ignore WordPress.Security.NonceVerification.Missing -- verified by the caller.
		return Comment_Likes_Section::update( ! empty( $_POST['jetpack_comment_likes_enabled'] ) );
	}

	/**
	 * Save where the buttons appear.
	 */
	private static function save_placement(): void {
		// phpcs:ignore WordPress.Security.NonceVerification.Missing, WordPress.Security.ValidatedSanitizedInput -- verified by the caller; update() checks the values against an allowlist.
		$posted = isset( $_POST['show'] ) && is_array( $_POST['show'] ) ? wp_unslash( $_POST['show'] ) : array();

		Placement_Section::update( $posted );
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
	 * Where to send the browser once a submission is handled.
	 *
	 * @param bool $show_saved_notice Whether the screen should confirm a save.
	 */
	private static function redirect_url( bool $show_saved_notice ): string {
		$url = admin_url( 'options-general.php?page=' . Settings_Page::SLUG );

		return $show_saved_notice ? $url . '&update=saved' : $url;
	}

	/**
	 * Turn a feature back on, then reload the screen.
	 *
	 * @param string $feature      One of the `Placement_Section::FEATURE_*` constants.
	 * @param string $nonce_action Nonce action the submitting section uses.
	 * @return string URL to send the browser back to.
	 */
	private static function activate_feature( string $feature, string $nonce_action ): string {
		check_admin_referer( $nonce_action );

		Feature_Actions::activate( $feature );

		return self::redirect_url( false );
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
