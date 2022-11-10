<?php

use Automattic\Jetpack_Boost\Admin\Admin;

// Load guide on the front-end via the admin bar
function jetpack_boost_guide_scripts()
{
	// Disable in Admin Dashboard
	if (is_admin()) {
		return;
	}

	wp_enqueue_script('guide', plugins_url('dist/guide.js', __FILE__), array(), '1.0.0', true);
	wp_enqueue_style('guide', plugins_url('dist/guide.css', __FILE__), array(), '1.0.0', 'screen');
}
add_action('wp_enqueue_scripts', 'jetpack_boost_guide_scripts');


/**
 * @param WP_Admin_Bar $bar
 */
function jetpack_boost_guide_menu($bar)
{
	// Disable in Admin Dashboard
	if (is_admin()) {
		return;
	}

	$bar->add_menu(array(
		'id'     => 'jetpack-boost-image-guide',
		'parent' => null,
		'group'  => null,
		'title'  => __('Jetpack Boost', 'jetpack-boost'),
		'href'   => admin_url('admin.php?page=' . Admin::MENU_SLUG),
		'meta'   => array(
			'target'   => '_self',
			'class'    => 'jetpack-boost-image-guide',
		),
	));
}


add_action('admin_bar_menu', 'jetpack_boost_guide_menu', 500);
