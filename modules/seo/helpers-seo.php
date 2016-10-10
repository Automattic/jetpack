<?php

/**
 * Used to check whether advanced seo features are enabled.
 *
 * @return bool True if advanced seo features are enabled, false otherwise.
 */
function is_enabled_advanced_seo() {
	// stub
	return true;
}

/**
 * Returns front page meta description for current site.
 *
 * @return string|null Front page meta description string or null.
 */
function get_front_page_meta_description() {
	if ( is_enabled_advanced_seo() ) {
		return get_option( 'advanced_seo_front_page_description', null );
	}
}
