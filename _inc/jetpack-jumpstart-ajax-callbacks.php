<?php
if ( 'jump-start-go' == $_REQUEST['jumpStartGo'] ) {
    if ( ! current_user_can( 'jetpack_activate_modules' ) ) {
        exit;
    }
    // Activate the modules
    $modules = (array) $_REQUEST['jumpstartModules'];
    $modules = array_map( 'sanitize_key', $modules );
    foreach( $modules as $module ) {
        Jetpack::log( 'activate', $module );
        Jetpack::activate_module( $module, false );
    }
    ?>
    Activated
<?php
} else { ?>

<?php }
