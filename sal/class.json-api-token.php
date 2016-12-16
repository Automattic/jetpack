<?php

/**
 * So that we have a real class instead of just passing around an array
 */
class SAL_Token {

	public $blog_id;
	public $user_id;
	public $scope;
	public $client_id;
	public $external_user_id;
	public $external_user_code;
	public $auth_type;

	function __construct( $blog_id, $user_id, $scope, $client_id, $external_user_id, $external_user_code, $auth_type ) {
		$this->blog_id = $blog_id; // if blog_id is set and scope is not global, limit to that blog
		$this->user_id = $user_id;
		$this->client_id = $client_id;
		$this->scope = $scope; 
		$this->external_user_id = $external_user_id;
		$this->external_user_code = $external_user_code;
		$this->auth_type = $auth_type;
	}

	public function is_global() {
		return $scope === 'global';
	}

	static function for_anonymous_user() {
		return new SAL_Token( 
			null, 
			get_current_user_id(), 
			null, // there's only ever one scope in our current API implementation, auth or global
			null,
			null, 
			null, 
			null
		);
	}

	static function from_rest_token( $token ) {
		$user_id = isset( $token['user_id'] ) ? $token['user_id'] : get_current_user_id();
		$scope = isset( $token['scope'] ) ? $token['scope'][0] : null;
		$client_id = isset( $token['client_id'] ) ? $token['client_id'] : null;
		$external_user_id = isset( $token['external_user_id'] ) ? $token['external_user_id'] : null;
		$external_user_code = isset( $token['external_user_code'] ) ? $token['external_user_code'] : null;
		$auth = isset( $token['auth'] ) ? $token['auth'] : null;	

		return new SAL_Token( 
			$token['blog_id'], 
			$user_id,
			$scope, // there's only ever one scope in our current API implementation, auth or global
			$client_id,
			$external_user_id, 
			$external_user_code, 
			$auth
		);
	}
}
