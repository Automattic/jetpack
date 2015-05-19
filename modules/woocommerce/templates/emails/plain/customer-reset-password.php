<?php
/**
 * Customer Reset Password email
 *
 * @author  WooThemes
 * @package WooCommerce/Templates/Emails/Plain
 * @version 2.3.0
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly
}

echo "= " . $email_heading . " =\n\n";

echo __( 'Someone requested that the password be reset for the following account:', 'woocommerce' ) . "\r\n\r\n";
echo esc_url( network_home_url( '/' ) ) . "\r\n\r\n";
echo sprintf( __( 'Username: %s', 'woocommerce' ), $user_login ) . "\r\n\r\n";
echo __( 'If this was a mistake, just ignore this email and nothing will happen.', 'woocommerce' ) . "\r\n\r\n";
echo __( 'To reset your password, visit the following address:', 'woocommerce' ) . "\r\n\r\n";

echo esc_url( add_query_arg( array( 'key' => $reset_key, 'login' => $user_login ), wc_get_endpoint_url( 'lost-password', '', wc_get_page_permalink( 'myaccount' ) ) ) ) . "\r\n";

echo "\n=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=\n\n";

echo apply_filters( 'woocommerce_email_footer_text', get_option( 'woocommerce_email_footer_text' ) );
