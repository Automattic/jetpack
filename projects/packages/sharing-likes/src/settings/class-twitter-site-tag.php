<?php
/**
 * The Twitter Site Tag setting on Settings > Sharing.
 *
 * @package automattic/jetpack-sharing-likes
 */

declare( strict_types = 1 );

namespace Automattic\Jetpack\Sharing_Likes\Settings;

/**
 * The Twitter username Twitter Cards name as the site's owner.
 *
 * Not gated on the Sharing module: the Sharing Buttons block reads it too, so
 * whichever section hosts the settings table renders it.
 */
final class Twitter_Site_Tag {

	/**
	 * Option holding the username, without its leading `@`. Also the field name.
	 */
	public const OPTION = 'jetpack-twitter-cards-site-tag';

	/**
	 * Whether the setting has anything to configure on this site.
	 */
	public static function is_available(): bool {
		return Environment::twitter_site_tag_used();
	}

	/**
	 * Table rows for the setting, headed by the feature it configures.
	 */
	public static function render(): string {
		if ( ! self::is_available() ) {
			return '';
		}

		// `style="width: auto"` on the description is load-bearing: sharedaddy's admin
		// stylesheet constrains `.description` to 180px for the services table's columns.
		return sprintf(
			'<tr><td colspan="2"><h3>%1$s</h3></td></tr>
			<tr valign="top">
				<th scope="row"><label for="%2$s">%3$s</label></th>
				<td>
					<input type="text" id="%2$s" class="regular-text" name="%2$s" value="%4$s" />
					<p class="description" style="width: auto;">%5$s</p>
				</td>
			</tr>',
			esc_html__( 'Twitter Cards', 'jetpack-sharing-likes' ),
			esc_attr( self::OPTION ),
			esc_html__( 'Twitter Site Tag', 'jetpack-sharing-likes' ),
			esc_attr( (string) get_option( self::OPTION, '' ) ),
			esc_html__( 'The Twitter username of the owner of this site’s domain.', 'jetpack-sharing-likes' )
		);
	}

	/**
	 * Save the posted username. Callers verify the nonce.
	 */
	public static function save(): void {
		if ( ! self::is_available() ) {
			return;
		}

		// Not `sanitize_text_field()`, which encodes a stray `<` rather than dropping it:
		// the REST writer in plugins/jetpack sanitizes this same option with tag stripping.
		// phpcs:ignore WordPress.Security.NonceVerification.Missing -- verified by the caller.
		$posted = isset( $_POST[ self::OPTION ] ) && is_string( $_POST[ self::OPTION ] ) ? wp_strip_all_tags( wp_unslash( $_POST[ self::OPTION ] ) ) : '';

		// Trim after the `@`, not just before it: `@ jetpack` would otherwise store a leading space.
		update_option( self::OPTION, trim( ltrim( $posted, '@' ) ) );
	}
}
