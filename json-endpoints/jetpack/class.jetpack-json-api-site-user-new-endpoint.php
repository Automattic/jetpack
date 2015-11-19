<?php
class WPCOM_JSON_API_Site_User_New_Endpoint extends Jetpack_JSON_API_Endpoint {

	protected $needed_capabilities = 'create_users';

	protected function validate_input( $object ) {
		$input = $this->input();
		$this->user = array();
		foreach ( $input as $key => $value ) {
			if ( ! is_array( $value ) ) {
				$value = trim( $value );
			}
			$value = wp_unslash( $value );
			switch ( $key ) {
				case 'first_name':
				case 'last_name':
				case 'user_pass':
				case 'roles':
					$this->user[ $key ] = $value;
					break;
				case 'login':
					$this->user[ 'user_login' ] = $value;
					break;
				case 'email':
					$this->user[ 'user_email' ] = $value;
					break;
				case 'display_name':
				case 'name':
					$user[ 'display_name' ] = $value;
					break;
			}
		}
		if ( empty( $this->user['user_login'] ) || empty( $this->user['user_email'] ) ) {
			return new WP_Error( 'Create User Error', 'user_login and user_email can\'t be empty', 400 );
		}
		if ( is_multisite() ) {
			$result = wpmu_validate_user_signup( $this->user[ 'user_login' ], $this->user[ 'user_email' ] );
			if ( is_wp_error( $result['errors'] ) && ! empty( $result['errors']->errors ) ) {
				return $result['errors'];
			}
		}
		if ( empty( $this->user['user_pass'] ) ){
			$this->user['user_pass'] = wp_generate_password();
		}
		return true;
	}
	/**
	 * Creates a new user
	 *
	 * @return (array)
	 */
	public function result() {
		if ( is_multisite() ) {
			$user_id = wpmu_create_user( $this->user[ 'user_login' ], $this->user[ 'user_pass' ], $this->user[ 'user_email' ] );
			if ( ! $user_id ) {
				return new WP_Error( 'Create User Error', 'There was an error while creating the user', 400 );
			}
			$this->user[ 'ID' ] = $user_id;
			$user_id = wp_update_user( $this->user );
			if ( is_wp_error( $user_id ) ) {
				return $user_id;
			}
		} else {
			$user_id = wp_insert_user( $this->user );
			if ( is_wp_error( $user_id ) ) {
				return $user_id;
			}
			$user[ 'ID' ] = $user_id;
		}

		if ( is_wp_error( $user_id ) ) {
			return $user_id;
		}
		return $this->get_user( $user_id );
	}

	public function get_user( $user_id ) {
		$the_user = $this->get_author( $user_id, true );
		if ( $the_user && ! is_wp_error( $the_user ) ) {
			$userdata = get_userdata( $user_id );
			$the_user->roles = ! is_wp_error( $userdata ) ? $userdata->roles : array();
		}
		return $the_user;
	}

}
