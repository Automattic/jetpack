<?php

/**
 * Placeholder to load 3rd party plugin tweaks until a legit system
 * is architected
 */

require_once( JETPACK__PLUGIN_DIR . '3rd-party/buddypress.php' );
require_once( JETPACK__PLUGIN_DIR . '3rd-party/wpml.php' );
require_once( JETPACK__PLUGIN_DIR . '3rd-party/bitly.php' );
require_once( JETPACK__PLUGIN_DIR . '3rd-party/bbpress.php' );
require_once( JETPACK__PLUGIN_DIR . '3rd-party/woocommerce.php' );
require_once( JETPACK__PLUGIN_DIR . '3rd-party/domain-mapping.php' );
require_once( JETPACK__PLUGIN_DIR . '3rd-party/qtranslate-x.php' );
require_once( JETPACK__PLUGIN_DIR . '3rd-party/vaultpress.php' );
require_once( JETPACK__PLUGIN_DIR . '3rd-party/beaverbuilder.php' );
require_once( JETPACK__PLUGIN_DIR . '3rd-party/debug-bar.php' );
require_once( JETPACK__PLUGIN_DIR . '3rd-party/class.jetpack-modules-overrides.php' );

// We can't load this conditionally since polldaddy add the call in class constuctor.
require_once( JETPACK__PLUGIN_DIR . '3rd-party/polldaddy.php' );
require_once( JETPACK__PLUGIN_DIR . '3rd-party/woocommerce-services.php' );
