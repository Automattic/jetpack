<?php
/**
 * Module Name: Enhanced Distribution
 * Module Description: Share your public posts and comments to search engines and other services in real-time.
 * Sort Order: 100
 * First Introduced: 1.2
 */

add_action( 'jetpack_modules_loaded', 'jetpack_enhanced_distribution_load' );
 
function jetpack_enhanced_distribution_load() {
	Jetpack_Sync::sync_posts( __FILE__ );
	Jetpack_Sync::sync_comments( __FILE__ );
}
