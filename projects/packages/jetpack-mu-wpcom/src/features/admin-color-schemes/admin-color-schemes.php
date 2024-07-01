<?php
/**
 * Additional admin color schemes.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Masterbar\Admin_Color_Schemes;
use Automattic\Jetpack\Status\Host;

// @TODO Ideally we should remove this feature entirely and update Jetpack_Mu_Wpcom::load_features to initialize
// Masterbar for both WoA and Simple sites.
// This would require removing the relevant Masterbar code on WPCOM and rely on the package only.
if ( function_exists( 'wpcom_is_nav_redesign_enabled' ) && wpcom_is_nav_redesign_enabled() && ( new Host() )->is_wpcom_simple() ) {
	new Admin_Color_Schemes();
}
