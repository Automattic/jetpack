<?php

// ********** modify blog option 'wp_mobile_template' manually to specify a theme (ex. 'vip/cnnmobile')

// WordPress Mobile Edition
//
// Copyright (c) 2002-2008 Alex King
// http://alexking.org/projects/wordpress
//
// Released under the GPL license
// http://www.opensource.org/licenses/gpl-license.php
//
// **********************************************************************
// This program is distributed in the hope that it will be useful, but
// WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
// *****************************************************************

/*
Plugin Name: WordPress Mobile Edition
Plugin URI: http://alexking.org/projects/wordpress
Description: Show a mobile view of the post/page if the visitor is on a known mobile device. Questions on configuration, etc.? Make sure to read the README.
Author: Alex King
Author URI: http://alexking.org
Version: 2.1a-WPCOM
*/

$_SERVER['REQUEST_URI'] = ( isset($_SERVER['REQUEST_URI']) ? $_SERVER['REQUEST_URI'] : $_SERVER['SCRIPT_NAME'] . (( isset($_SERVER['QUERY_STRING']) ? '?' . $_SERVER['QUERY_STRING'] : '')));

function jetpack_check_mobile() {
	if ( ( defined('XMLRPC_REQUEST') && XMLRPC_REQUEST ) || ( defined('APP_REQUEST') && APP_REQUEST ) )
		return false;
	if ( !isset($_SERVER["HTTP_USER_AGENT"]) || (isset($_COOKIE['akm_mobile']) && $_COOKIE['akm_mobile'] == 'false') )
		return false;
	if ( jetpack_mobile_exclude() )
		return false;
	if ( 1 == get_option('wp_mobile_disable') )
		return false;
	if ( isset($_COOKIE['akm_mobile']) && $_COOKIE['akm_mobile'] == 'true' )
		return true;

	$is_mobile = jetpack_is_mobile();

	return apply_filters( 'jetpack_check_mobile', $is_mobile );
}

function jetpack_mobile_exclude() {
	$exclude = false;
	$pages_to_exclude = array(
		'wp-admin',
		'wp-comments-post.php',
		'wp-mail.php',
		'wp-login.php',
		'wp-activate.php',
	);
	foreach ( $pages_to_exclude as $exclude_page ) {
		if ( strstr( strtolower( $_SERVER['REQUEST_URI'] ), $exclude_page ) )
			$exclude = true;
	}

	if ( defined( 'DOING_AJAX' ) && true === DOING_AJAX )
		$exclude = false;

	if ( isset( $GLOBALS['wp_customize'] ) )
		return true;

	return $exclude;
}

function wp_mobile_get_main_template() {
	remove_action( 'option_template', 'jetpack_mobile_template' );
	$template = get_option( 'template' );
	add_action( 'option_template', 'jetpack_mobile_template' );
	return $template;
}

function wp_mobile_get_main_stylesheet() {
	remove_action( 'option_stylesheet', 'jetpack_mobile_stylesheet' );
	$stylesheet = get_option( 'stylesheet' );
	add_action( 'option_stylesheet', 'jetpack_mobile_stylesheet' );
	return $stylesheet;
}

function jetpack_mobile_stylesheet( $theme ) {
	return apply_filters( 'jetpack_mobile_stylesheet', 'pub/minileven', $theme );
}

function jetpack_mobile_template( $theme ) {
	return apply_filters( 'jetpack_mobile_template', 'pub/minileven', $theme );
}

function jetpack_mobile_available() {
	echo '<div style="text-align:center;margin:10px 0;"><a href="'. home_url( '?ak_action=accept_mobile' ) . '">' . __( 'View Mobile Site', 'jetpack' ) . '</a></div>';
}

function jetpack_mobile_request_handler() {
	global $wpdb;
	if (isset($_GET['ak_action'])) {
		$url = parse_url( get_bloginfo( 'url' ) );
		$domain = $url['host'];
		if (!empty($url['path'])) {
			$path = $url['path'];
		}
		else {
			$path = '/';
		}
		$redirect = false;
		switch ($_GET['ak_action']) {
			case 'reject_mobile':
				setcookie(
					'akm_mobile'
					, 'false'
					, time() + 300000
					, $path
					, $domain
				);
				$redirect = true;

				do_action( 'mobile_reject_mobile' );
				break;
			case 'force_mobile':
			case 'accept_mobile':
				setcookie(
					'akm_mobile'
					, 'true'
					, time() + 300000
					, $path
					, $domain
				);
				$redirect = true;

				do_action( 'mobile_force_mobile' );
				break;
		}
		if ($redirect) {
			if ( isset( $_GET['redirect_to'] ) && $_GET['redirect_to'] ) {
				$go = urldecode( $_GET['redirect_to'] );
			} else if (!empty($_SERVER['HTTP_REFERER'])) {
				$go = $_SERVER['HTTP_REFERER'];
			}
			else {
				$go = remove_query_arg( array( 'ak_action' ) );
			}
			wp_safe_redirect( $go );
			exit;
		}
	}
}
add_action('init', 'jetpack_mobile_request_handler');

function jetpack_mobile_theme_setup() {
	if ( jetpack_check_mobile() ) {
		// Redirect to download page if user clicked mobile app promo link in mobile footer
		if ( isset( $_GET['app-download'] ) ) {
			do_action( 'mobile_app_promo_download', $_GET['app-download'] );

			switch ( $_GET['app-download'] ) {
				case 'android':
					header( 'Location: market://search?q=pname:org.wordpress.android' );
					exit;
				break;
				case 'ios':
					header( 'Location: http://itunes.apple.com/us/app/wordpress/id335703880?mt=8' );
					exit;
				break;
				case 'blackberry':
					header( 'Location: http://blackberry.wordpress.org/download/' );
					exit;
				break;
			}
		}

		add_action('stylesheet', 'jetpack_mobile_stylesheet');
		add_action('template', 'jetpack_mobile_template');
		add_action('option_template', 'jetpack_mobile_template');
		add_action('option_stylesheet', 'jetpack_mobile_stylesheet');

		if ( class_exists( 'Jetpack_Custom_CSS' ) && method_exists( 'Jetpack_Custom_CSS', 'disable' ) && ! get_option( 'wp_mobile_custom_css' ) )
			add_action( 'init', array( 'Jetpack_Custom_CSS', 'disable' ), 11 );

		do_action( 'mobile_setup' );
	}
}

// Need a hook after plugins_loaded (since this code won't be loaded in Jetpack
// until then) but after init (because it has its own init hooks to add).
add_action( 'setup_theme', 'jetpack_mobile_theme_setup' );

if (isset($_COOKIE['akm_mobile']) && $_COOKIE['akm_mobile'] == 'false') {
	add_action('wp_footer', 'jetpack_mobile_available');
}

function jetpack_mobile_app_promo()  {
	?>
	<script type="text/javascript">
		if ( ! navigator.userAgent.match( /wp-(iphone|android|blackberry|nokia|windowsphone)/i ) ) {
			if ( ( navigator.userAgent.match( /iphone/i ) ) || ( navigator.userAgent.match( /ipod/i ) ) )
			   document.write( '<span id="wpcom-mobile-app-promo" style="margin-top: 10px; font-size: 13px;"><strong>Now Available!</strong> <a href="/index.php?app-download=ios">Download WordPress for iOS</a></span><br /><br />' );
			else if ( ( navigator.userAgent.match( /android/i ) ) && ( null == navigator.userAgent.match( /playbook/i ) && null == navigator.userAgent.match( /bb10/i ) ) )
			   document.write( '<span id="wpcom-mobile-app-promo" style="margin-top: 10px; font-size: 13px;"><strong>Now Available!</strong> <a href="/index.php?app-download=android">Download WordPress for Android</a></span><br /><br />' );
			else if ( ( navigator.userAgent.match( /blackberry/i ) ) || ( navigator.userAgent.match( /playbook/i ) ) || ( navigator.userAgent.match( /bb10/i ) ) )
			   document.write( '<span id="wpcom-mobile-app-promo" style="margin-top: 10px; font-size: 13px;"><strong>Now Available!</strong> <a href="/index.php?app-download=blackberry">Download WordPress for BlackBerry</a></span><br /><br />' );
		}
	</script>
	<?php
}

add_action( 'wp_mobile_theme_footer', 'jetpack_mobile_app_promo' );

/**
 * Adds an option to allow your Custom CSS to also be applied to the Mobile Theme.
 * It's disabled by default, but this should allow people who know what they're
 * doing to customize the mobile theme.
 */
function jetpack_mobile_css_settings() {
	$mobile_css = get_option( 'wp_mobile_custom_css' );

	?>
	<div class="misc-pub-section">
		<label><?php esc_html_e( 'Mobile-compatible:', 'jetpack' ); ?></label>
		<span id="mobile-css-display"><?php echo $mobile_css ? __( 'Yes', 'jetpack' ) : __( 'No', 'jetpack' ); ?></span>
		<a class="edit-mobile-css hide-if-no-js" href="#mobile-css"><?php echo esc_html_e( 'Edit', 'jetpack' ); ?></a>
		<div id="mobile-css-select" class="hide-if-js">
			<input type="hidden" name="mobile_css" id="mobile-css" value="<?php echo intval( $mobile_css ); ?>" />
			<label>
				<input type="checkbox" id="mobile-css-visible" <?php checked( get_option( 'wp_mobile_custom_css' ) ); ?> />
				<?php esc_html_e( 'Include this CSS in the Mobile Theme', 'jetpack' ); ?>
			</label>
			<p>
				<a class="save-mobile-css hide-if-no-js button" href="#mobile-css"><?php esc_html_e( 'OK', 'jetpack' ); ?></a>
				<a class="cancel-mobile-css hide-if-no-js" href="#mobile-css"><?php esc_html_e( 'Cancel', 'jetpack' ); ?></a>
			</p>
		</div>
	</div>
	<script type="text/javascript">
		jQuery( function ( $ ) {
			$( '.edit-mobile-css' ).bind( 'click', function ( e ) {
				e.preventDefault();

				$( '#mobile-css-select' ).slideDown();
				$( this ).hide();
			} );

			$( '.cancel-mobile-css' ).bind( 'click', function ( e ) {
				e.preventDefault();

				$( '#mobile-css-select' ).slideUp( function () {
					$( '.edit-mobile-css' ).show();

					$( '#mobile-css-visible' ).prop( 'checked', $( '#mobile-css' ).val() == '1' );
				} );
			} );

			$( '.save-mobile-css' ).bind( 'click', function ( e ) {
				e.preventDefault();

				$( '#mobile-css-select' ).slideUp();
				$( '#mobile-css-display' ).text( $( '#mobile-css-visible' ).prop( 'checked' ) ? 'Yes' : 'No' );
				$( '#mobile-css' ).val( $( '#mobile-css-visible' ).prop( 'checked' ) ? '1' : '0' );
				$( '.edit-mobile-css' ).show();
			} );
		} );
	</script>
	<?php
}

add_action( 'custom_css_submitbox_misc_actions', 'jetpack_mobile_css_settings' );

function jetpack_mobile_customizer_controls( $wp_customize ) {
	$wp_customize->add_setting( 'wp_mobile_custom_css' , array(
		'default' => true,
		'transport' => 'postMessage',
		'type' => 'option'
	) );

	$wp_customize->add_control( 'jetpack_mobile_css_control', array(
		'type' => 'checkbox',
		'label' => __( 'Include this CSS in the Mobile Theme', 'jetpack' ),
		'section' => 'jetpack_custom_css',
		'settings' => 'wp_mobile_custom_css',
	) );
}

add_action( 'jetpack_custom_css_customizer_controls', 'jetpack_mobile_customizer_controls' );

function jetpack_mobile_save_css_settings() {
	update_option( 'wp_mobile_custom_css', isset( $_POST['mobile_css'] ) && ! empty( $_POST['mobile_css'] ) );
}

add_action( 'safecss_save_pre', 'jetpack_mobile_save_css_settings' );
