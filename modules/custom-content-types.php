<?php

/**
 * Module Name: Custom Content Types
 * Module Description: Organize and display different types of content on your site, separate from posts and pages.
 * First Introduced: 3.1
 * Requires Connection: No
 * Auto Activate: Yes
 * Module Tags: Writing
 * Sort Order: 34
 */

function jetpack_load_custom_post_types() {
	include dirname( __FILE__ ) . "/custom-post-types/portfolios.php";
}

function jetpack_custom_post_types_loaded() {
	Jetpack::enable_module_configurable( __FILE__ );
	Jetpack::module_configuration_load( __FILE__, 'jetpack_custom_post_types_configuration_load' );
}
add_action( 'jetpack_modules_loaded', 'jetpack_custom_post_types_loaded' );

function jetpack_custom_post_types_configuration_load() {
	wp_safe_redirect( admin_url( 'options-writing.php#cpt-options' ) );
	exit;
}

// Add Settings Section for CPT
function jetpack_cpt_settings_api_init() {
	add_settings_section(
		'jetpack_cpt_section',
		'<span id="cpt-options">' . __( 'Your Custom Content Types', 'jetpack' ) . '</span>',
		'jetpack_cpt_section_callback',
		'writing'
	);
}
add_action( 'admin_init', 'jetpack_cpt_settings_api_init' );

/*
 * Settings Description
 *
 * @TODO change link from /portfolio to some global CPT page that we still need to create
 */
function jetpack_cpt_section_callback() {
	?>
	<p>
		<?php esc_html_e( 'Use these settings to display different types of content on your site.', 'jetpack' ); ?>
		<a target="_blank" href="http://en.support.wordpress.com/portfolios/"><?php esc_html_e( 'Learn More', 'jetpack' ); ?></a>
	</p>
	<?php
}

jetpack_load_custom_post_types();
