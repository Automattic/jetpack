<?php
/**
 * SEO Plugin.
 *
 * @since 7.1.0
 *
 * @package Jetpack
 */

Jetpack_Gutenberg::set_extension_available( 'jetpack-seo' );

/**
 * Registers the `advanced_seo_description` post_meta for use in the REST API.
 */
function jetpack_register_seo_post_meta() {
    $args = array(
        'type' => 'string',
        'description' => __( 'Custom post description to be used in HTML <meta /> tag.', 'jetpack' ),
        'single' => true,
        'default' => '',
        'show_in_rest' => array(
            'name' => 'advanced_seo_description'
        ),
    );

    register_meta( 'post', 'advanced_seo_description', $args );
}

add_action( 'init', 'jetpack_register_seo_post_meta', 20 );