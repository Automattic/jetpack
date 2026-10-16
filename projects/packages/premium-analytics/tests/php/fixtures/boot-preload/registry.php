<?php
/**
 * Test fixture: stand-in for the wp-build route registry.
 *
 * @package automattic/jetpack-premium-analytics
 */

return array(
	array(
		'name' => 'dashboard',
		'path' => '/',
	),
	array(
		'name' => 'post-detail',
		'path' => '/post/$postId',
	),
	array(
		'name' => 'reports',
		'path' => '/reports/$report',
	),
);
