<?php

class Jetpack_Data {
	/**
	 * Gets locally stored token
	 *
	 * @return object|false
	 */
	public static function get_access_token( $user_id = false ) {
		if ( $user_id ) {
			if ( !$tokens = Jetpack_Options::get_option( 'user_tokens' ) ) {
				return false;
			}
			if ( $user_id === JETPACK_MASTER_USER ) {
				if ( !$user_id = Jetpack_Options::get_option( 'master_user' ) ) {
					return false;
				}
			}
			if ( !isset( $tokens[$user_id] ) || !$token = $tokens[$user_id] ) {
				return false;
			}
			$token_chunks = explode( '.', $token );
			if ( empty( $token_chunks[1] ) || empty( $token_chunks[2] ) ) {
				return false;
			}
			if ( $user_id != $token_chunks[2] ) {
				return false;
			}
			$token = "{$token_chunks[0]}.{$token_chunks[1]}";
		} else {
			$token = Jetpack_Options::get_option( 'blog_token' );
			if ( empty( $token ) ) {
				return false;
			}
		}

		return (object) array(
			'secret' => $token,
			'external_user_id' => (int) $user_id,
		);
	}
}
