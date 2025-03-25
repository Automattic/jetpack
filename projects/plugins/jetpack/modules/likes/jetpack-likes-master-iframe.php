<?php
/**
 * Jetpack likes iframe.
 *
 * @package jetpack
 */

/**
 * This function needs to get loaded after the like scripts get added to the page.
 */
function jetpack_likes_master_iframe() {
	$version = gmdate( 'Ymd' );

	$_locale = get_locale();

	if ( ! defined( 'JETPACK__GLOTPRESS_LOCALES_PATH' ) || ! file_exists( JETPACK__GLOTPRESS_LOCALES_PATH ) ) {
		return false;
	}

	require_once JETPACK__GLOTPRESS_LOCALES_PATH;

	$gp_locale = GP_Locales::by_field( 'wp_locale', $_locale );
	if ( ! $gp_locale ) {
		$gp_locale = GP_Locales::by_slug( $_locale );
	}
	$_locale = isset( $gp_locale->slug ) ? $gp_locale->slug : '';

	$likes_locale = ( '' === $_locale || 'en' === $_locale ) ? '' : '&amp;lang=' . strtolower( $_locale );

	$src = sprintf( 'https://widgets.wp.com/likes/master.html?ver=%1$s#ver=%1$s%2$s', $version, $likes_locale );

	/**
	 * Filters the Likes iframe src, if any parameters need to be overridden or tracked.
	 *
	 * @module likes
	 *
	 * @since 14.1
	 *
	 * @param string URL to https://widgets.wp.com/ with various arguments appended to the get string and fragment.
	 */
	$src = apply_filters( 'jetpack_likes_iframe_src', $src );

	// The span content is replaced by queuehandler when showOtherGravatars is called.
	$likers_text = wp_kses( '<span>%d</span>', array( 'span' => array() ) );
	?>
	<iframe src='<?php echo esc_url( $src ); ?>' scrolling='no' id='likes-master' name='likes-master' style='display:none;'></iframe>
	<div id='likes-other-gravatars' role="dialog" aria-hidden="true" tabindex="-1"><div class="likes-text"><?php echo $likers_text; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?></div><ul class="wpl-avatars sd-like-gravatars"></ul></div>
	<?php
}
