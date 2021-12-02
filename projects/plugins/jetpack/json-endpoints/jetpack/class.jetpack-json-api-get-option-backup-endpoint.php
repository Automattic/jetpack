<?php

class Jetpack_JSON_API_Get_Option_Backup_Endpoint extends Jetpack_JSON_API_Endpoint {
	// /sites/%s/options/backup      -> $blog_id

	protected $needed_capabilities = array(); // This endpoint is only accessible using a site token
	protected $option_names;

	function validate_input( $object ) {
		$query_args = $this->query_args();

		if ( empty( $query_args['name'] ) ) {
			return new WP_Error( 'option_name_not_specified', __( 'You must specify an option name', 'jetpack' ), 400 );
		}

		if ( is_array( $query_args['name'] ) ) {
			$this->option_names = $query_args['name'];
		} else {
			$this->option_names = array( $query_args['name'] );
		}

		return true;
	}

	protected function result() {
		// Disable Sync as this is a read-only operation and triggered by sync activity.
		\Automattic\Jetpack\Sync\Actions::mark_sync_read_only();

		$options = array_map( array( $this, 'get_option_row' ), $this->option_names );
		return array( 'options' => $options );
	}

	private function get_option_row( $name ) {
		global $wpdb;
		return $wpdb->get_row( $wpdb->prepare( "select * from `{$wpdb->options}` where option_name = %s", $name ) );
	}

}
