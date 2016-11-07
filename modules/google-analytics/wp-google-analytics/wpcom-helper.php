<?php

// Since _get_options is a private method, we have this custom helper.
function wpcom_wga_get_tracking_code() {
	$options = get_option( 'wga', array() );

	if ( isset( $options['code'] )
		&& preg_match( '#UA-[\d-]+#', $options['code'], $matches ) ) {
			return $options['code'];
	}

	return false;
}

add_filter( 'amp_post_template_analytics', 'wpcom_amp_add_wga_analytics' );

function wpcom_amp_add_wga_analytics( $analytics ) {
	if ( ! is_array( $analytics ) ) {
		$analytics = array();
	}

	$tracking_code = wpcom_wga_get_tracking_code();

	if ( ! $tracking_code ) {
		return $analytics;
	}

	$analytics['wp-google-analytics'] = array(
		'type' => 'googleanalytics',
		'attributes' => array(),
		'config_data' => array(
			'vars' => array(
				'account' => $tracking_code,
			),
			'triggers' => array(
				'trackPageview' => array(
					'on' => 'visible',
					'request' => 'pageview',
					'vars' => array(
						'title' => get_the_title(),
						'ampdocUrl' => get_permalink(),
					),
				),
			),
		),
	);

	return $analytics;
}
