<?php
/**
 * Minimal stubs for the WordPress.com-only symbols used by the IS_WPCOM
 * one-time-upload-token mint in `src/class-videopresstoken.php`. These live in
 * the wpcom repo (`wp-content/mu-plugins/jetpack/*`) and are not part of the
 * generated `.phan/stubs/wpcom-stubs.php`, so they're declared here. Like
 * `divi-stubs.php`, this file is parsed automatically because it lives under
 * `.phan/stubs/`; it must not be added to the `+stubs` list.
 *
 * @package automattic/jetpack-videopress
 */

namespace {
	\define( 'JETPACK__ANY_USER_TOKEN', -1 );

	// phpcs:disable Squiz.Commenting.FunctionComment.Missing, Generic.CodeAnalysis.EmptyStatement.DetectedFunction
	class Jetpack_Data {
		/**
		 * @param int $blog_id Blog id.
		 * @param int $user_id User id.
		 * @return mixed
		 */
		public static function get_access_token_by_blog_id_user_id( $blog_id, $user_id ) {}
	}

	class Jetpack_Server_Upload_Token {
		/**
		 * @param int   $blog_id       Blog id.
		 * @param mixed $jetpack_token Jetpack access token.
		 * @return array{hash:string,blog_id:int}
		 */
		public static function create_token( $blog_id, $jetpack_token = null ) {}
	}
	// phpcs:enable Squiz.Commenting.FunctionComment.Missing, Generic.CodeAnalysis.EmptyStatement.DetectedFunction
}
