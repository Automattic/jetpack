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
        Jetpack::activate_module( $module, false, false );
    }

    // Set the default sharing buttons if none are set
    $sharing_services = get_option( 'sharing-services' );
    if ( empty( $sharing_services['visible'] ) ) {
        $visible = array(
            'twitter',
            'facebook',
            'google-plus-1',
        );
        $hidden = array();
        update_option( 'sharing-services', array( 'visible' => $visible, 'hidden' => $hidden ) );
    } ?>

    Activated

<?php } elseif ( isset( $_REQUEST['jumpStartDeactivate'] ) && 'jump-start-deactivate' == $_REQUEST['jumpStartDeactivate'] ) {
    // Dectivate the modules
    $modules = (array) $_REQUEST['jumpstartModules'];
    $modules = array_map( 'sanitize_key', $modules );
    foreach( $modules as $module ) {
        Jetpack::log( 'deactivate', $module );
        Jetpack::deactivate_module( $module );
        Jetpack::state( 'message', 'module_deactivated' );
    }
}
