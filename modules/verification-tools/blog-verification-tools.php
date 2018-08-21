<?php

// Edit here to add new services
function jetpack_verification_services() {
	return array(
			'google' => array(
			'name'   =>'Google Search Console',
			'key'    =>'google-site-verification',
			'format' =>'dBw5CvburAxi537Rp9qi5uG2174Vb6JwHwIRwPSLIK8',
			'url'    => 'https://www.google.com/webmasters/tools/',
		),
		'bing' => array(
			'name'   =>'Bing Webmaster Center',
			'key'    =>'msvalidate.01',
			'format' =>'12C1203B5086AECE94EB3A3D9830B2E',
			'url'    => 'http://www.bing.com/webmaster/',
		 ),
		'pinterest' => array(
			'name'   => 'Pinterest Site Verification',
			'key'    => 'p:domain_verify',
			'format' => 'f100679e6048d45e4a0b0b92dce1efce',
			'url'    => 'https://pinterest.com/website/verify/',
		),
		'yandex'     => array(
			'name'   => 'Yandex.Webmaster',
			'key'    => 'yandex-verification',
			'format' => '44d68e1216009f40',
			'url'    => 'https://webmaster.yandex.com/sites/',
		),
	);
}


function jetpack_verification_options_init() {
	register_setting( 'verification_services_codes_fields', 'verification_services_codes', 'jetpack_verification_validate' );
}
add_action( 'admin_init', 'jetpack_verification_options_init' );
