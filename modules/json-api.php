<?php
/**
 * Module Name: JSON API
 * Module Description: Allow applications to securely access your content.
 * Sort Order: 19
 * First Introduced: 1.9
 * Requires Connection: Yes
 * Auto Activate: Public
 * Module Tags: Writing, Developers
 * Feature: Developer
 * Additional Search Queries: api, rest, develop, developers, json, klout, oauth
 */

add_action( 'jetpack_activate_module_json-api',   array( Jetpack::init(), 'toggle_module_on_wpcom' ) );
add_action( 'jetpack_deactivate_module_json-api', array( Jetpack::init(), 'toggle_module_on_wpcom' ) );
