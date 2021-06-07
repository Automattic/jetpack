<?php
/**
 * Customizations for unsupported plan Atomic sites.
 *
 * To enable and disable specific functionality for unsupported plan Atomic sites.
 * 
 * @package wpcomsh
 */

/**
 * If this site has an unsupported WPCOM plan, remove the Settings > Permalinks submenu item.
 */
function wpcomsh_remove_permalinks_menu_item_unsupported_plan() {
    if ( Atomic_Plan_Manager::has_atomic_supported_plan() ) {
        return;
    }

    remove_submenu_page( 'options-general.php', 'options-permalink.php' );
}
add_action( 'admin_menu', 'wpcomsh_remove_permalinks_menu_item_unsupported_plan' );

/**
 * Disables the Permalink options admin page when site has an unsupported WPCOM plan.
 * Allows proxied users to access the page.
 */
function wpcomsh_disable_permalink_page_unsupported_plan() {
    if ( Atomic_Plan_Manager::has_atomic_supported_plan() ) {
        return;
    }

    if ( ! ( defined( 'AT_PROXIED_REQUEST' ) && AT_PROXIED_REQUEST ) ) {
        wp_die( __( 'You do not have permission to access this page.', 'wpcomsh' ), '', array(
            'back_link' => true,
            'response' => 403,
        ) );
    } else {
        add_action( 'admin_notices', function() {
            echo '<div class="notice notice-warning"><p>' . esc_html__( 'Proxied only: You can see this because you are proxied. Do not use this if you don\'t know why you are here.', 'wpcomsh' ) . '</p></div>';
        } );
    }
}
add_action( 'load-options-permalink.php', 'wpcomsh_disable_permalink_page_unsupported_plan' );
