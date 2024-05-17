<?php

class WP_Super_Cache_Rest_Get_Cache extends WP_REST_Controller {

	/**
	 * Get a collection of items
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return WP_Error|WP_REST_Response
	 */
	public function callback( $request ) {
		global $valid_nonce;

		$valid_nonce = true;
		$_GET[ 'listfiles' ] = 1;
		$sizes = wpsc_generate_sizes_array();
		$supercachedir = get_supercache_dir();
		$list = wpsc_dirsize( $supercachedir, $sizes );
		$return_list = array();

		foreach( $list as $type => $file_list ) {
			foreach ( $file_list as $state => $value ) {
				if ( is_array( $value ) ) {
					foreach( $value as $filenames ) {
						foreach( $filenames as $filename => $t ) {
							if ( $type == 'wpcache' ) {
								$filename = dirname( $filename );
							}
							if ( false == isset( $return_list[ $type ][ $state ] ) || false == in_array( $filename, $return_list[ $type ][ $state ] ) )
								$return_list[ $type ][ $state ][] = $filename;
						}
					}
				}
			}

			if ( isset ( $return_list[ $type ] ) ) {
				$list[ $type ] = $return_list[ $type ];
			}

			unset( $return_list[ $type ] );
		}

		return rest_ensure_response( $list );
	}
}
