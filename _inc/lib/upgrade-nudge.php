<?php
/**
 * Upgrade Nudge Library
 *
 * Display a plan upgrade nudge on the frontend
 */

class Jetpack_Upgrade_Nudge {

	/**
	 * Return a message telling the user to upgrade to enable the block.
	 *
	 * @since 7.6.0
	 *
	 * @return string The message telling the user to upgrade
	 */
    public static function get_upgrade_message() {
        $support_url = ( defined( 'IS_WPCOM' ) && IS_WPCOM )
        ? 'https://support.wordpress.com/simple-payments/'
        : 'https://jetpack.com/support/simple-payment-button/';

        return sprintf(
            wp_kses(
                __( 'Your plan doesn\'t include Simple Payments. <a href="%s" rel="noopener noreferrer" target="_blank">Learn more and upgrade</a>.', 'jetpack' ),
                array( 'a' => array( 'href' => array(), 'rel' => array(), 'target' => array() ) )
            ),
            esc_url( $support_url )
        );
    }
}