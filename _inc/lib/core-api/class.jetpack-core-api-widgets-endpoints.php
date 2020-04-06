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
		$widget_base = _get_widget_id_base( $request['id'] );
		$widget_id = (int) substr( $request['id'], strlen( $widget_base ) + 1 );

		switch( $widget_base ) {
			case 'milestone_widget':
				$instances = get_option( 'widget_milestone_widget', array() );

				if (
					class_exists( 'Milestone_Widget' )
					&& is_active_widget( false, $widget_base . '-' . $widget_id, $widget_base )
					&& isset( $instances[ $widget_id ] )
				) {
					$instance = $instances[ $widget_id ];
					$widget = new Milestone_Widget();
					return $widget->get_widget_data( $instance );
				}
		}

		return new WP_Error(
			'not_found',
			esc_html__( 'The requested widget was not found.', 'jetpack' ),
			array( 'status' => 404 )
		);
	}

	/**
	 * Check that the current user has permissions to view widget information.
	 * For the currently supported widget there are no permissions required.
	 *
	 * @since 5.5.0
	 *
	 * @return bool
	 */
	public function can_request() {
		return true;
	}
}
