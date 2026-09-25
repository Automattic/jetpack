<?php
/**
 * Shared helpers for subscriptions template parts placement.
 *
 * @package automattic/jetpack-subscriptions
 * @since $$next-version$$
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Class for shared helpers for subscriptions template parts placement.
 *
 * @since $$next-version$$
 */
class Jetpack_Subscribe_Template_Parts {
	/**
	 * Prints a note that only site administrators see, linking to Newsletter settings.
	 *
	 * @since $$next-version$$
	 *
	 * @param string $link_text Settings link text. Defaults to "Turn off".
	 * @return void
	 */
	public static function render_admin_note( $link_text = '' ) {
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}

		if ( '' === $link_text ) {
			$link_text = __( 'Turn off', 'jetpack' );
		}

		// Styled by the Subscribe block's view.scss, which every placement using this note already loads.
		printf(
			'<p class="jetpack-subscribe-admin-note"><span class="jetpack-subscribe-admin-note__visibility">%1$s</span> <a href="%2$s">%3$s</a></p>',
			esc_html__( 'Only admins see this.', 'jetpack' ),
			esc_url( admin_url( 'admin.php?page=jetpack-newsletter&p=%2F%3Ftab%3Dsettings' ) ),
			esc_html( $link_text )
		);
	}
}
