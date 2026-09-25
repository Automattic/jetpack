<?php
/**
 * The "Disable CSS and JS" setting on Settings > Sharing.
 *
 * @package automattic/jetpack-sharing-likes
 */

declare( strict_types = 1 );

namespace Automattic\Jetpack\Sharing_Likes\Settings;

/**
 * Stops sharedaddy enqueuing its own CSS and JS, for themes that bundle them.
 */
final class Sharing_Resources {

	/**
	 * Option `sharing_init()` in `modules/sharedaddy/sharedaddy.php` reads.
	 */
	public const OPTION = 'sharedaddy_disable_resources';

	/**
	 * Field name the checkbox posts.
	 */
	private const FIELD = 'disable_resources';

	/**
	 * Whether the setting has anything to configure on this site.
	 *
	 * It only affects legacy sharing buttons, and Simple never loads `sharedaddy.php`.
	 */
	public static function is_available(): bool {
		return ! Environment::is_simple_site() && Section_State::configures( Sharing_Section::state() );
	}

	/**
	 * Table row for the setting.
	 */
	public static function render(): string {
		if ( ! self::is_available() ) {
			return '';
		}

		return sprintf(
			'<tr valign="top">
				<th scope="row"><label for="disable_css">%1$s</label></th>
				<td>
					<input id="disable_css" type="checkbox" name="%2$s"%3$s /> <small><em>%4$s</em></small>
				</td>
			</tr>',
			esc_html__( 'Disable CSS and JS', 'jetpack-sharing-likes' ),
			esc_attr( self::FIELD ),
			checked( '1', (string) get_option( self::OPTION ), false ),
			esc_html__( 'Advanced. If this option is checked, you must include these files in your theme manually for the sharing links to work.', 'jetpack-sharing-likes' )
		);
	}

	/**
	 * Save the checkbox. Callers verify the nonce.
	 *
	 * Only while it renders: an unchecked box posts nothing, so saving it from
	 * a screen that never showed it would switch the setting off.
	 */
	public static function save(): void {
		if ( ! self::is_available() ) {
			return;
		}

		// phpcs:ignore WordPress.Security.NonceVerification.Missing -- verified by the caller.
		update_option( self::OPTION, isset( $_POST[ self::FIELD ] ) ? 1 : 0 );
	}
}
