<?php
/**
 * Adds the generated performance report url for each page and also in v1 site settings payload for homepage.
 *
 * @package performance-profiler
 */

/**
 * Adds the generated performance report url for each page.
 */
function wpcom_performance_url_rest_field() {
	register_rest_field(
		'page',
		'wpcom_performance_report_url',
		array(
			'get_callback'    => 'wpcom_performance_report_url_get_value',
			'update_callback' => 'wpcom_performance_report_url_update_value',
			'schema'          => array(
				'type'        => 'string',
				'description' => __( 'The performance report URL for this page.', 'wpcomsh' ),
				'default'     => '',
			),
		)
	);
}

/**
 * Filter the performance report URL field.
 *
 * @param WP_REST_Response $response The response object.
 * @param WP_Post          $post     The post object.
 * @param WP_REST_Request  $request  The request object.
 * @return WP_REST_Response
 */
function filter_wpcom_performance_report_url( $response, $post, $request ) {
	$fields = $request->get_param( '_fields' );

	if ( is_string( $fields ) ) {
		$fields = explode( ',', $fields );
	}

	if ( ! is_array( $fields ) ) {
		$fields = array();
	}

	if ( empty( $fields ) || ! in_array( 'wpcom_performance_report_url', $fields, true ) ) {
		unset( $response->data['wpcom_performance_report_url'] );
	}

	return $response;
}

add_filter( 'rest_prepare_page', 'filter_wpcom_performance_report_url', 10, 3 );

/**
 * Get the performance report URL callback.
 *
 * @param array $object The object being requested.
 * @return string|null The performance report URL.
 */
function wpcom_performance_report_url_get_value( $object ) {
	return get_post_meta( $object['id'], '_wpcom_performance_report_url', true );
}

/**
 * Update callback for the performance report URL.
 *
 * @param  mixed  $value The new value of the field.
 * @param  object $object The object being updated.
 * @return bool|int|null
 */
function wpcom_performance_report_url_update_value( $value, $object ) {
	if ( ! $value || ! is_string( $value ) ) {
		return;
	}
	return update_post_meta( $object->ID, '_wpcom_performance_report_url', sanitize_url( $value ) );
}

add_action( 'rest_api_init', 'wpcom_performance_url_rest_field' );

/**
 * Registers the performance report URL settings field.
 */
function wpcom_performance_report_url_settings_field() {
	register_setting(
		'wpcom_performance_profiler',
		'wpcom_performance_report_url',
		array(
			'type'        => 'string',
			'description' => __( 'The performance report URL for this site.', 'wpcomsh' ),
			'default'     => '',
		)
	);
}

add_action( 'rest_api_init', 'wpcom_performance_report_url_settings_field' );

/**
 * Adds settings to the v1 API site settings endpoint.
 *
 * @param array $settings A single site's settings.
 * @return array
 */
function wpcom_performance_url_get_options_v1_api( $settings ) {
	$settings['wpcom_performance_report_url'] = get_option( 'wpcom_performance_report_url', '' );
	return $settings;
}

add_filter( 'site_settings_endpoint_get', 'wpcom_performance_url_get_options_v1_api' );

/**
 * Updates settings via public-api.wordpress.com.
 *
 * @param array $input             Associative array of site settings to be updated.
 *                                 Cast and filtered based on documentation.
 * @param array $unfiltered_input  Associative array of site settings to be updated.
 *                                 Neither cast nor filtered. Contains raw input.
 * @return array
 */
function wpcom_performance_url_update_options_v1_api( $input, $unfiltered_input ) {
	if ( isset( $unfiltered_input['wpcom_performance_report_url'] ) ) {
		$input['wpcom_performance_report_url'] = sanitize_url( $unfiltered_input['wpcom_performance_report_url'] );
	}

	return $input;
}

add_filter( 'rest_api_update_site_settings', 'wpcom_performance_url_update_options_v1_api', 10, 2 );
