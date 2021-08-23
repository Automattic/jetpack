<?php
/**
 * Helper mapping between WP Admin pages and WordPress.com
 *
 * @package automattic/jetpack
 */

$common_mappings = array(
	'upload.php'                             => 'https://wordpress.com/media/',
	'edit.php'                               => 'https://wordpress.com/posts/',
	'edit-comments.php'                      => 'https://wordpress.com/comments/',
	'import.php'                             => 'https://wordpress.com/import/',
	'edit.php?post_type=page'                => 'https://wordpress.com/pages/',
	'users.php'                              => 'https://wordpress.com/people/team/',
	'options-general.php'                    => 'https://wordpress.com/settings/general/',
	'options-discussion.php'                 => 'https://wordpress.com/settings/discussion/',
	'options-writing.php'                    => 'https://wordpress.com/settings/writing/',
	'themes.php'                             => 'https://wordpress.com/themes/',
	'edit-tags.php?taxonomy=category'        => 'https://wordpress.com/settings/taxonomies/category/',
	'edit-tags.php?taxonomy=post_tag'        => 'https://wordpress.com/settings/taxonomies/post_tag/',
	'edit.php?post_type=jetpack-portfolio'   => 'https://wordpress.com/types/jetpack-portfolio/',
	'edit.php?post_type=jetpack-testimonial' => 'https://wordpress.com/types/jetpack-testimonial/',
);

if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
	// WPCOM Specific mappings.
	$common_mappings['export.php'] = 'https://wordpress.com/export/';
}

return $common_mappings;
