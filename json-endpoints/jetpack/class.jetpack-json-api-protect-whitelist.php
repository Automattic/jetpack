<?php

class Jetpack_JSON_API_Protect_Whitelist extends Jetpack_JSON_API_Endpoint {
	protected $needed_capabilities = 'activate_plugins';

	public function callback( $path = '', $blog_id = 0, $object = null ) {
		if ( is_wp_error( $error = $this->validate_call( $blog_id, $this->needed_capabilities ) ) ) {
			return $error;
		}

		if ( $this->method == 'POST' ) {
			return $this->validate_input( $object );
		}
		return $this->result();
	}

	protected function validate_input( $object ) {
		$args = $this->input();
		if ( ! isset( $args['whitelist'] ) || ! isset( $args['global'] ) ) {
			return new WP_Error( 'invalid_arguments', __( 'Invalid arguments', 'jetpack' ));
		}

		$result = $this->save_whitelist( $args['whitelist'], $args['global'] );

		if( ! $result ) {
			return new WP_Error( 'invalid_ip', __( 'One or more of your IP Addresses are invalid.', 'jetpack' ));
		}

		return $this->result();
	}

	public function result() {
		$whitelist = array(
			'whitelist' => get_site_option( 'jetpack_protect_whitelist' ),
		);
		return $whitelist;
	}

	public function save_whitelist( $whitelist, $global ) {
		global $current_user;
		$whitelist_error = false;
		$whitelist = is_array( $whitelist ) ? $whitelist : array();
		$new_items = array();

		// validate each item
		foreach( $whitelist as $item ) {

			if ( ! isset( $item['range'] ) ) {
				$whitelist_error = true;
				break;
			}

			if ( ! in_array( $item['range'], array( '1', '0' ) ) ) {
				$whitelist_error = true;
				break;
			}

			$range              = $item['range'];
			$new_item           = new stdClass();
			$new_item->range    = (bool) $range;
			$new_item->global   = $global;
			$new_item->user_id  = $current_user->ID;

			if ( $range ) {

				if ( ! isset( $item['range_low'] ) || ! isset( $item['range_high'] ) ) {
					$whitelist_error = true;
					break;
				}

				if ( ! inet_pton( $item['range_low'] ) || ! inet_pton( $item['range_high'] ) ) {
					$whitelist_error = true;
					break;
				}

				$new_item->range_low    = $item['range_low'];
				$new_item->range_high   = $item['range_high'];

			} else {

				if ( ! isset( $item['ip_address'] ) ) {
					$whitelist_error = true;
					break;
				}

				if ( ! inet_pton( $item['ip_address'] ) ) {
					$whitelist_error = true;
					break;
				}

				$new_item->ip_address = $item['ip_address'];
			}

			$new_items[] = $new_item;

		} // end item loop

		if ( ! empty( $whitelist_error ) ) {
			return false;
		}

		// merge new items with un-editable items
		$existing_whitelist     = get_site_option( 'jetpack_protect_whitelist', array() );
		$current_user_whitelist = wp_list_filter( $existing_whitelist, array( 'user_id' => $current_user->ID, 'global'=>  ! $global) );
		$other_user_whtielist   = wp_list_filter( $existing_whitelist, array( 'user_id' => $current_user->ID ), 'NOT' );
		$new_whitelist          = array_merge( $new_items, $current_user_whitelist, $other_user_whtielist );

		update_site_option( 'jetpack_protect_whitelist', $new_whitelist );
		return true;
	}
}
