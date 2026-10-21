<?php
/**
 * Stand-in for the WordPress.com videos-table lookup by GUID the Channel falls
 * back to on Simple sites. Tests set `$GLOBALS['vp_channel_test_video_info']`.
 *
 * @package automattic/jetpack-videopress
 */

if ( ! function_exists( 'video_get_info_by_guid' ) ) {
	/**
	 * The video record for a GUID.
	 *
	 * @param string $guid VideoPress GUID.
	 * @return object|false
	 * @phan-suppress PhanRedefineFunction The wpcom stub declares it for analysis only.
	 */
	function video_get_info_by_guid( $guid ) {
		$info = $GLOBALS['vp_channel_test_video_info'] ?? null;
		return is_object( $info ) && $info->guid === $guid ? $info : false;
	}
}
