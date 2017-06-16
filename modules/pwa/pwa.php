<?php
/**
 * Plugin Name: PWA
 * Description: Add Progressive Web App support to your WordPress site.
 * Plugin URI: https://github.com/automattic/jetpack
 * Author: Automattic
 * Author URI: https://automattic.com
 * Version: 0.4.2
 * Text Domain: pwa
 * Domain Path: /languages/
 * License: GPLv2 or later
 */

define( 'PWA_SW_QUERY_VAR', 'jetpack_service_worker' );
define( 'PWA_MANIFEST_QUERY_VAR', 'jetpack_app_manifest' );
add_action( 'jetpack_activate_module_pwa', 'pwa_activate' );
add_action( 'jetpack_deactivate_module_pwa', 'pwa_deactivate' );
add_filter( 'query_vars', 'pwa_register_query_vars' );
add_action( 'wp_enqueue_scripts', 'pwa_enqueue_script' );
add_action( 'wp_head', 'pwa_render_manifest_link' );
add_action( 'admin_head', 'pwa_render_manifest_link' );
add_action( 'template_redirect', 'pwa_render_custom_assets', 1 );

function pwa_activate() {
	if ( ! did_action( 'pwa_init' ) ) {
		pwa_init();
	}
	flush_rewrite_rules();
}

function pwa_deactivate() {
	flush_rewrite_rules();
}

function pwa_register_query_vars( $vars ) {
    $vars[] = PWA_SW_QUERY_VAR;
    $vars[] = PWA_MANIFEST_QUERY_VAR;
    return $vars;
}

add_action( 'init', 'pwa_init' );
function pwa_init() {
	if ( false === apply_filters( 'pwa_is_enabled', true ) ) {
		return;
	}

	do_action( 'pwa_init' );
    add_rewrite_rule('service-worker.js$', 'index.php?' . PWA_SW_QUERY_VAR . '=1', 'top');
    wp_register_script( 'jetpack-register-service-worker', plugins_url( 'assets/register-service-worker.js', __FILE__ ), false, '1.5' );
}

function pwa_render_custom_assets() {
    global $wp_query;

    if ( $wp_query->get( PWA_SW_QUERY_VAR ) ) {
        header( 'Content-Type: application/javascript; charset=utf-8' );
        echo file_get_contents( plugin_dir_path( __FILE__ ) . 'assets/service-worker.js' );
        exit;
    }

    if ( $wp_query->get( PWA_MANIFEST_QUERY_VAR ) ) {
        $theme_color = pwa_get_theme_color();

        $manifest = array(
            'start_url'  => get_bloginfo( 'url' ),
            'short_name' => get_bloginfo( 'name' ),
            'name'       => get_bloginfo( 'name' ),
            'display'    => 'standalone',
            'background_color' => $theme_color,
            'theme_color' => $theme_color,
        );

        $icon_48 = pwa_site_icon_url( 48 );

        if ( $icon_48 ) {
            $manifest[ 'icons' ] = array(
                array(
                    'src' => $icon_48,
                    'sizes' => '48x48' 
                ),
                array(
                    'src' => pwa_site_icon_url( 192 ),
                    'sizes' => '192x192' 
                ),
                array(
                    'src' => pwa_site_icon_url( 512 ),
                    'sizes' => '512x512' 
                )
            );
        }

        wp_send_json( $manifest );
    }
}

function pwa_site_icon_url( $size ) {
    $url = get_site_icon_url( $size );

    if ( ! $url ) {
        if ( ! function_exists( 'jetpack_site_icon_url' ) ) {
            require_once( JETPACK__PLUGIN_DIR . 'modules/site-icon/site-icon-functions.php' );
        }
        $url = jetpack_site_icon_url( null, $size );
    }

    return $url;
}

function pwa_enqueue_script() {
    wp_enqueue_script( 'jetpack-register-service-worker' );
}

function pwa_get_theme_color() {
     // if we have AMP enabled, use those colors?
    if ( class_exists( 'AMP_Customizer_Settings' ) ) {
        $amp_settings = apply_filters( 'amp_post_template_customizer_settings', AMP_Customizer_Settings::get_settings(), null );
        $theme_color = $amp_settings['header_background_color'];
    } elseif ( current_theme_supports( 'custom-background' ) ) {
        $theme_color = get_theme_support( 'custom-background' )->{'default-color'};
    } else {
        $theme_color = '#FFF';
    }

    return apply_filters( 'jetpack_pwa_background_color', $theme_color );
}

function pwa_render_manifest_link() {
    ?>
        <link rel="manifest" href="/index.php?<?php echo PWA_MANIFEST_QUERY_VAR; ?>=1">
        <meta name="theme-color" content="<?php echo pwa_get_theme_color(); ?>">
    <?php
}