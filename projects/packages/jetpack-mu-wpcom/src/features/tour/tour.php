<?php
use Automattic\Jetpack\Jetpack_Mu_Wpcom;

function enqueue_tour_scripts() {
    $script_version = filemtime( Jetpack_Mu_Wpcom::BASE_DIR . 'build/tour/tour.js' );

    echo "<div id='wpcom-tour' style='border: 3px solid red;'></div>";

	wp_enqueue_script(
		'wpcom-tour-script',
		plugins_url( 'build/tour/tour.js', Jetpack_Mu_Wpcom::BASE_FILE ),
		[],
		$script_version,
		true
	);

	wp_localize_script(
		'wpcom-tour-script',
		'tourConfig',
		array()
	);
}
add_action( 'admin_enqueue_scripts', 'enqueue_tour_scripts', 100 );
