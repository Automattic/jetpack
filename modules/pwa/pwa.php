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

 /**
  * Include the following PWA capabilities:
  * - cache the home page and posts/pages
  * - cache all CSS and JS
  * - show offline/online status using body class "jetpack__offline"
  * TODO:
  * - push updates
  * - how to cache within wp-admin?
  * - hook WP's native cache functions to expire and push updates to sites
  */

define( 'PWA_SW_QUERY_VAR', 'jetpack_service_worker' );
define( 'PWA_MANIFEST_QUERY_VAR', 'jetpack_app_manifest' );

// module activation
add_action( 'jetpack_activate_module_pwa', 'pwa_activate' );
add_action( 'jetpack_deactivate_module_pwa', 'pwa_deactivate' );

// register WP_Query hooks for manifest and service worker
add_filter( 'query_vars', 'pwa_register_query_vars' );

// manifest
add_action( 'wp_head', 'pwa_render_manifest_link' );
// add_action( 'admin_head', 'pwa_render_manifest_link' ); // Don't load for wp-admin, for now
add_action( 'amp_post_template_head', 'pwa_render_manifest_link' ); // AMP

// service worker
add_action( 'template_redirect', 'pwa_force_https', 1 );
add_action( 'wp_enqueue_scripts', 'pwa_enqueue_script' );
add_action( 'template_redirect', 'pwa_render_custom_assets', 2 );
add_action( 'amp_post_template_head', 'pwa_render_amp_serviceworker_script' ); // AMP
add_action( 'amp_post_template_footer', 'pwa_render_amp_serviceworker_element' ); // AMP

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
    wp_register_script( 'jetpack-register-service-worker', plugins_url( 'assets/js/register-service-worker.js', __FILE__ ), false, '1.5' );
    wp_register_script( 'jetpack-show-network-status', plugins_url( 'assets/js/show-network-status.js', __FILE__ ), false, '1.5' );
	wp_register_style( 'jetpack-show-network-status', plugins_url( 'assets/css/show-network-status.css', __FILE__ ) );

	wp_localize_script(
		'jetpack-register-service-worker',
		'pwa_vars',
		array(
			'service_worker_url' => pwa_get_service_worker_url(),
			'admin_url' => admin_url(),
		)
	);
}

function pwa_render_custom_assets() {
    global $wp_query;

    if ( $wp_query->get( PWA_SW_QUERY_VAR ) ) {
		header( 'Content-Type: application/javascript; charset=utf-8' );
		// fake localize - service worker is not loaded in page context, so regular localize doesn't work
        echo preg_replace( '/pwa_vars.admin_url/', admin_url(), file_get_contents( plugin_dir_path( __FILE__ ) . 'assets/js/service-worker.js' ) );
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
    wp_enqueue_script( 'jetpack-show-network-status' );
    wp_enqueue_style( 'jetpack-show-network-status' );
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
        <link rel="manifest" href="<?php echo pwa_get_manifest_url() ?>">
        <meta name="theme-color" content="<?php echo pwa_get_theme_color(); ?>">
    <?php
}

function pwa_render_amp_serviceworker_script() {
    ?>
        <script async custom-element="amp-install-serviceworker" src="https://cdn.ampproject.org/v0/amp-install-serviceworker-0.1.js"></script>
    <?php
}

function pwa_render_amp_serviceworker_element() {
    ?>
        <amp-install-serviceworker src="<?php echo pwa_get_service_worker_url() ?>" layout="nodisplay"></amp-install-serviceworker>
    <?php
}

function pwa_force_https () {
	if ( !is_ssl() ) {
		wp_redirect('https://' . $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI'], 301 );
		exit();
	}
}

function pwa_get_manifest_url() {
	return add_query_arg( PWA_MANIFEST_QUERY_VAR, '1', trailingslashit( site_url() ) . 'index.php' );
}

function pwa_get_service_worker_url() {
	return add_query_arg( PWA_SW_QUERY_VAR, '1', trailingslashit( site_url() ) . 'index.php' );
}