<?php
/**
 * Fixture data for admin menu tests.
 *
 * @package Jetpack
 */

/**
 * Menu fixture data.
 *
 * @return \string[][]
 */
function get_menu_fixture() {
	return array(
		2  => array(
			'Dashboard',
			'read',
			'index.php',
			'',
			'menu-top menu-top-first menu-icon-dashboard',
			'menu-dashboard',
			'dashicons-dashboard',
		),
		3  => array(
			'Jetpack',
			'jetpack_admin_page',
			'jetpack',
			'Jetpack',
			'menu-top toplevel_page_jetpack',
			'toplevel_page_jetpack',
			'div',
		),
		4  => array(
			'',
			'read',
			'separator1',
			'',
			'wp-menu-separator',
		),
		10 => array(
			'Media',
			'upload_files',
			'upload.php',
			'',
			'menu-top menu-icon-media',
			'menu-media',
			'dashicons-admin-media',
		),
		15 => array(
			'Links',
			'manage_links',
			'edit-tags.php?taxonomy=link_category',
			'',
			'menu-top menu-icon-links',
			'menu-links',
			'dashicons-admin-links',
		),
		25 => array(
			'Comments <span class="awaiting-mod count-3"><span class="pending-count" aria-hidden="true">3</span><span class="comments-in-moderation-text screen-reader-text">3 Comments in moderation</span></span>',
			'edit_posts',
			'edit-comments.php',
			'',
			'menu-top menu-icon-comments',
			'menu-comments',
			'dashicons-admin-comments',
		),
		5  => array(
			'Posts',
			'edit_posts',
			'edit.php',
			'',
			'menu-top menu-icon-post open-if-no-js',
			'menu-posts',
			'dashicons-admin-post',
		),
		20 => array(
			'Pages',
			'edit_pages',
			'edit.php?post_type=page',
			'',
			'menu-top menu-icon-page',
			'menu-pages',
			'dashicons-admin-page',
		),
		59 => array(
			'',
			'read',
			'separator2',
			'',
			'wp-menu-separator',
		),
		60 => array(
			'Appearance',
			'switch_themes',
			'themes.php',
			'',
			'menu-top menu-icon-appearance',
			'menu-appearance',
			'dashicons-admin-appearance',
		),
		65 => array(
			'Plugins <span class="update-plugins count-4"><span class="plugin-count">4</span></span>',
			'activate_plugins',
			'plugins.php',
			'',
			'menu-top menu-icon-plugins',
			'menu-plugins',
			'dashicons-admin-plugins',
		),
		70 => array(
			'Users <span class="update-plugins count-0"><span class="plugin-count">0</span></span>',
			'list_users',
			'users.php',
			'',
			'menu-top menu-icon-users',
			'menu-users',
			'dashicons-admin-users',
		),
		75 => array(
			'Tools',
			'edit_posts',
			'tools.php',
			'',
			'menu-top menu-icon-tools',
			'menu-tools',
			'dashicons-admin-tools',
		),
		80 => array(
			'Settings',
			'manage_options',
			'options-general.php',
			'',
			'menu-top menu-icon-settings',
			'menu-settings',
			'dashicons-admin-settings',
		),
	);
}

/**
 * Submenu fixture data.
 *
 * @return \string[][][]
 */
function get_submenu_fixture() {
	return array(
		'index.php'                            => array(
			0  => array(
				'Home',
				'read',
				'index.php',
			),
			10 => array(
				'Updates <span class="update-plugins count-4"><span class="update-count">4</span></span>',
				'update_core',
				'update-core.php',
			),
		),
		'upload.php'                           => array(
			5  => array(
				'Library',
				'upload_files',
				'upload.php',
			),
			10 => array(
				'Add New',
				'upload_files',
				'media-new.php',
			),
		),
		'edit-comments.php'                    => array(
			0 => array(
				'All Comments',
				'edit_posts',
				'edit-comments.php',
			),
		),
		'edit.php'                             => array(
			5  => array(
				'All Posts',
				'edit_posts',
				'edit.php',
			),
			10 => array(
				'Add New',
				'edit_posts',
				'post-new.php',
			),
			15 => array(
				'Categories',
				'manage_categories',
				'edit-tags.php?taxonomy=category',
			),
			16 => array(
				'Tags',
				'manage_post_tags',
				'edit-tags.php?taxonomy=post_tag',
			),
		),
		'edit.php?post_type=page'              => array(
			5  => array(
				'All Pages',
				'edit_pages',
				'edit.php?post_type=page',
			),
			10 => array(
				'Add New',
				'edit_pages',
				'post-new.php?post_type=page',
			),
		),
		'themes.php'                           => array(
			5  => array(
				'Themes',
				'switch_themes',
				'themes.php',
			),
			6  => array(
				'Customize',
				'customize',
				'customize.php?return=%2Ftrunk%2Fwp-admin%2Fadmin.php%3Fpage%3Djetpack',
				'',
				'hide-if-no-customize',
			),
			10 => array(
				'Menus',
				'edit_theme_options',
				'nav-menus.php',
			),
			11 => array(
				'Widgets',
				'edit_theme_options',
				'gutenberg-widgets',
				'Widgets',
			),
			13 => array(
				'Theme Editor',
				'edit_themes',
				'theme-editor.php',
				'Theme Editor',
			),
		),
		'plugins.php'                          => array(
			5  => array(
				'Installed Plugins',
				'activate_plugins',
				'plugins.php',
			),
			10 => array(
				'Add New',
				'install_plugins',
				'plugin-install.php',
			),
			15 => array(
				'Plugin Editor',
				'edit_plugins',
				'plugin-editor.php',
			),
		),
		'users.php'                            => array(
			5  => array(
				'All Users',
				'list_users',
				'users.php',
			),
			10 => array(
				'Add New',
				'create_users',
				'user-new.php',
			),
			15 => array(
				'Profile',
				'read',
				'profile.php',
			),
		),
		'tools.php'                            => array(
			5  => array(
				'Available Tools',
				'edit_posts',
				'tools.php',
			),
			10 => array(
				'Import',
				'import',
				'import.php',
			),
			15 => array(
				'Export',
				'export',
				'export.php',
			),
			20 => array(
				'Site Health',
				'view_site_health_checks',
				'site-health.php',
			),
			25 => array(
				'Export Personal Data',
				'export_others_personal_data',
				'export-personal-data.php',
			),
			30 => array(
				'Erase Personal Data',
				'erase_others_personal_data',
				'erase-personal-data.php',
			),
		),
		'options-general.php'                  => array(
			10 => array(
				'General',
				'manage_options',
				'options-general.php',
			),
			15 => array(
				'Writing',
				'manage_options',
				'options-writing.php',
			),
			20 => array(
				'Reading',
				'manage_options',
				'options-reading.php',
			),
			25 => array(
				'Discussion',
				'manage_options',
				'options-discussion.php',
			),
			30 => array(
				'Media',
				'manage_options',
				'options-media.php',
			),
			40 => array(
				'Permalinks',
				'manage_options',
				'options-permalink.php',
			),
			45 => array(
				'Privacy',
				'manage_privacy_options',
				'options-privacy.php',
			),
			46 => array(
				'Approve User',
				'promote_users',
				'wp-approve-user',
				'Approve User',
			),
			47 => array(
				'',
				'manage_options',
				'sharing',
				'',
			),
		),
		'edit-tags.php?taxonomy=link_category' => array(
			15 => array(
				'Link Categories',
				'manage_categories',
				'edit-tags.php?taxonomy=link_category',
			),
		),

		''                                     => array(
			0 => array(
				'',
				'manage_options',
				'jetpack-debugger',
				'Debugging Center',
			),
			1 => array(
				'Settings',
				'jetpack_manage_modules',
				'jetpack_modules',
				'Jetpack Settings',
			),
			2 => array(
				'',
				'jetpack_admin_page',
				'jetpack_about',
				'About Jetpack',
			),
		),
		'edit.php?post_type=feedback'          => array(
			0 => array(
				'Feedback',
				'edit_pages',
				'edit.php?post_type=feedback',
				'',
			),
			1 => array(
				'Export CSV',
				'export',
				'feedback-export',
				'Export feedback as CSV',
			),
		),
		'jetpack'                              => array(
			1 => array(
				'Dashboard',
				'jetpack_admin_page',
				'jetpack#/dashboard',
				'Dashboard',
			),
			2 => array(
				'Settings',
				'jetpack_admin_page',
				'jetpack#/settings',
				'Settings',
			),
		),
	);
}
