<?php

if ( ! current_user_can( 'jetpack_activate_modules' ) ) {
    exit;
}

if ( isset( $_REQUEST['jumpStartActivate'] ) && 'jump-start-activate' == $_REQUEST['jumpStartActivate'] ) {
    // Activate the modules
    $modules = (array) $_REQUEST['jumpstartModules'];
    $modules = array_map( 'sanitize_key', $modules );
    foreach( $modules as $module ) {
        Jetpack::log( 'activate', $module );
        Jetpack::activate_module( $module, false );
    }
} elseif ( isset( $_REQUEST['jumpStartDeactivate'] ) && 'jump-start-deactivate' == $_REQUEST['jumpStartDeactivate'] ) {
    // Dectivate the modules
    $modules = (array) $_REQUEST['jumpstartModules'];
    $modules = array_map( 'sanitize_key', $modules );
    foreach( $modules as $module ) {
        Jetpack::log( 'deactivate', $module );
        Jetpack::deactivate_module( $module );
        Jetpack::state( 'message', 'module_deactivated' );
    }
}
