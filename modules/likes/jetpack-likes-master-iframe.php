<?php

/**
 * This function needs to get loaded after the like scripts get added to the page.
 */
function jetpack_likes_master_iframe() {
	$version = '20170629';
	$in_jetpack = ( defined( 'IS_WPCOM' ) && IS_WPCOM ) ? false : true;

	$_locale = get_locale();

	// We have to account for w.org vs WP.com locale divergence
	if ( $in_jetpack ) {
		if ( ! defined( 'JETPACK__GLOTPRESS_LOCALES_PATH' ) || ! file_exists( JETPACK__GLOTPRESS_LOCALES_PATH ) ) {
			return false;
		}

		require_once JETPACK__GLOTPRESS_LOCALES_PATH;

		$gp_locale = GP_Locales::by_field( 'wp_locale', $_locale );
		$_locale = isset( $gp_locale->slug ) ? $gp_locale->slug : '';
	}

	$likes_locale = ( '' == $_locale || 'en' == $_locale ) ? '' : '&amp;lang=' . strtolower( $_locale );

	$src = sprintf(
		'https://widgets.wp.com/likes/master.html?ver=%1$s#ver=%1$s%2$s',
		$version,
		$likes_locale
	);

	/* translators: The value of %d is not available at the time of output */
	$likersText = wp_kses( __( '<span>%d</span> bloggers like this:', 'jetpack' ), array( 'span' => array() ) );
	?>
	<iframe src='<?php echo $src; ?>' scrolling='no' id='likes-master' name='likes-master' style='display:none;'></iframe>
	<div id='likes-other-gravatars'><div class="likes-text"><?php echo $likersText; ?></div><ul class="wpl-avatars sd-like-gravatars"></ul></div>
	<?php
}
