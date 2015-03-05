<?php

if ( ! current_user_can( 'jetpack_activate_modules' ) ) {
    exit;
}

if ( isset( $_REQUEST['jumpStartActivate'] ) && 'jump-start-activate' == $_REQUEST['jumpStartActivate'] ) {
    // Activate the modules
    $modules = $_REQUEST['jumpstartModSlug'];
    foreach( $modules as $module => $value ) {
        Jetpack::log( 'activate', $value['module_slug'] );
        Jetpack::activate_module( $value['module_slug'], false, false );
        Jetpack::state( 'message', 'no_message' );
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
    }
    ?>

    Success Message!

<?php } elseif ( isset( $_REQUEST['jumpStartDeactivate'] ) && 'jump-start-deactivate' == $_REQUEST['jumpStartDeactivate'] ) {
    // Dectivate the modules
    $modules = (array) $_REQUEST['jumpstartModSlug'];
    foreach( $modules as $module => $value ) {
        Jetpack::log( 'deactivate', $value['module_slug'] );
        Jetpack::deactivate_module( $value['module_slug'] );
        Jetpack::state( 'message', 'no_message' );
    }

    update_option( 'jetpack_dismiss_jumpstart', false );

    echo "reload the page";
} elseif ( isset( $_REQUEST['disableJumpStart'] ) && true == $_REQUEST['disableJumpStart'] ) {
    update_option( 'jetpack_dismiss_jumpstart', true );
}
