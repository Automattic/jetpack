<?php
/**
 * Module Name: Manage
 * Module Description: Manage all your sites from a centralized place, https://wordpress.com/sites.
 * Jumpstart Description: helps you remotely manage plugins, turn on automated updates, and more from <a href="https://wordpress.com/plugins/" target="_blank">wordpress.com</a>.
 * Sort Order: 1
 * Recommendation Order: 3
 * First Introduced: 3.4
 * Requires Connection: Yes
 * Auto Activate: No
 * Module Tags: Centralized Management, Recommended
 * Feature: Recommended, Jumpstart
 */

add_action( 'jetpack_activate_module_manage', array( Jetpack::init(), 'toggle_module_on_wpcom' ) );
add_action( 'jetpack_deactivate_module_manage', array( Jetpack::init(), 'toggle_module_on_wpcom' )  );
