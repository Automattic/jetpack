<?php
/**
 * Widget information getter endpoint.
 *
 */
class Jetpack_Core_API_Widget_Endpoint {

	/**
	 * @since 5.5.0
	 *
	 * @param WP_REST_Request $request {
	 *     Array of parameters received by request.
	 *
	 *     @type string $id Widget id.
	 * }
	 *
	 * @return WP_REST_Response|WP_Error A REST response if the request was served successfully, otherwise an error.
	 */
	public function process( $request ) {
		$widgets = get_option( 'sidebars_widgets', array() );

		$widget_base = _get_widget_id_base( $request['id'] );
		$widget_id = (int) substr( $request['id'], strlen( $widget_base ) + 1 );

		$instances = get_option( 'widget_' . $widget_base, array() );

		$instance = $instances[ $widget_id ];

		$widget = new Milestone_Widget();

		return $widget->get_widget_data( $instance );
	}

	/**
	 * Check that the current user has permissions to manage Jetpack modules.
	 *
	 * @since 4.3.0
	 *
	 * @return bool
	 */
	public function can_request() {
		return true;
	}
}
