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
	$version = gmdate( 'YW' );

	$_locale = get_locale();

	if ( ! defined( 'JETPACK__GLOTPRESS_LOCALES_PATH' ) || ! file_exists( JETPACK__GLOTPRESS_LOCALES_PATH ) ) {
		return false;
	}

	require_once JETPACK__GLOTPRESS_LOCALES_PATH;

	$gp_locale = GP_Locales::by_field( 'wp_locale', $_locale );
	$_locale   = isset( $gp_locale->slug ) ? $gp_locale->slug : '';

	$likes_locale = ( '' === $_locale || 'en' === $_locale ) ? '' : '&amp;lang=' . strtolower( $_locale );
	/** This filter is documented in projects/plugins/jetpack/modules/likes.php */
	$new_layout       = apply_filters( 'likes_new_layout', true ) ? '&amp;n=1' : '';
	$new_layout_class = $new_layout ? 'wpl-new-layout' : '';

	$src = sprintf(
		'https://widgets.wp.com/likes/master.html?ver=%1$s#ver=%1$s%2$s%3$s',
		$version,
		$likes_locale,
		$new_layout
	);

	if ( $new_layout ) {
		// The span content is replaced by queuehandler when showOtherGravatars is called.
		$likers_text = wp_kses( '<span>%d</span>', array( 'span' => array() ) );
	} else {
		/* translators: The value of %d is not available at the time of output */
		$likers_text = wp_kses( __( '<span>%d</span> bloggers like this:', 'jetpack' ), array( 'span' => array() ) );
	}
	?>
	<iframe src='<?php echo esc_url( $src ); ?>' scrolling='no' id='likes-master' name='likes-master' style='display:none;'></iframe>
	<div id='likes-other-gravatars' class='<?php echo esc_attr( $new_layout_class ); ?>'><div class="likes-text"><?php echo $likers_text; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?></div><ul class="wpl-avatars sd-like-gravatars"></ul></div>
	<?php
}
