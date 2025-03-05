<?php
/**
 * Hide/remove the Elementor Beta/Developer edition notice
 *
 * @package wpcomsh
 */

/**
 * Use filter to remove the Elementor Developer Notice.
 *
 * @param array $notices The array of admin notices from Elementor.
 * @return array Modified array without the Elementor Developer Notice.
 */
function remove_elementor_dev_notice( $notices ) {

    if ( is_array( $notices ) ) {
        if ( class_exists( 'Elementor\Core\Admin\Notices\Elementor_Dev_Notice' ) ) {
            foreach ( $notices as $key => $notice ) {
                if ( $notice instanceof Elementor\Core\Admin\Notices\Elementor_Dev_Notice ) {
                    unset( $notices[ $key ] );
                }
            }
        }
    }

    return $notices;
}

add_filter( 'elementor/core/admin/notices', 'remove_elementor_dev_notice' );
