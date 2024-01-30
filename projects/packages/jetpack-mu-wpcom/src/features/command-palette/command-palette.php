<?php

function wpcom_command_palette_enqueue() {
	wp_enqueue_script(
		'wpcom-command-palette',
		plugins_url( 'build/command-palette/command-palette.js', __FILE__),
		array(),
		1,
		true
	);
}


add_action( 'admin_enqueue_scripts', 'wpcom_command_palette_enqueue');
