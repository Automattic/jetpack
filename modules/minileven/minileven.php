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
	if ( jetpack_is_mobile() )
		return true;

	return apply_filters( 'jetpack_check_mobile', false );
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

	if ( ! is_admin() && defined( 'DOING_AJAX' ) && true === DOING_AJAX )
		$exclude = false;

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
	echo '<div style="text-align:center;margin:10px 0;"><a href="'. home_url('?ak_action=accept_mobile') . '">' . __('View Mobile Site') . '</a></div>';
}

function jetpack_mobile_link() {
	echo '<a href="'. home_url('?ak_action=force_mobile') .'">Mobile Edition</a>';
}

if (!function_exists('ak_recent_posts')) {
// this is based almost entirely on:
/*
Plugin Name: Recent Posts
Plugin URI: http://mtdewvirus.com/code/wordpress-plugins/
Description: Returns a list of the most recent posts.
Version: 1.07
Author: Nick Momrik
Author URI: http://mtdewvirus.com/
*/
	function ak_recent_posts($count = 5, $before = '<li>', $after = '</li>', $hide_pass_post = true, $skip_posts = 0, $show_excerpts = false, $where = '', $join = '', $groupby = '') {
		global $wpdb;
		$time_difference = get_settings('gmt_offset');
		$now = gmdate("Y-m-d H:i:s",time());

		$join = apply_filters('posts_join', $join);
		$where = apply_filters('posts_where', $where);
		$groupby = apply_filters('posts_groupby', $groupby);
		if (!empty($groupby)) { $groupby = ' GROUP BY '.$groupby; }

		$request = "SELECT ID, post_title, post_excerpt FROM $wpdb->posts $join WHERE post_status = 'publish' AND post_type != 'page' ";
		if ($hide_pass_post) $request .= "AND post_password ='' ";
		$request .= "AND post_date_gmt < '$now' $where $groupby ORDER BY post_date DESC LIMIT $skip_posts, $count";
		$posts = $wpdb->get_results($request);
		$output = '';
		if ($posts) {
			foreach ($posts as $post) {
				$post_title = stripslashes($post->post_title);
				$permalink = get_permalink($post->ID);
				$output .= $before . '<a href="' . $permalink . '" rel="bookmark" title="Permanent Link: ' . htmlspecialchars($post_title, ENT_COMPAT) . '">' . htmlspecialchars($post_title) . '</a>';
				if($show_excerpts) {
					$post_excerpt = stripslashes($post->post_excerpt);
					$output.= '<br />' . $post_excerpt;
				}
				$output .= $after;
			}
		} else {
			$output .= $before . "None found" . $after;
		}
		echo $output;
	}
}

function jetpack_request_handler() {
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
				$go = get_bloginfo( 'url' );
			}
			wp_safe_redirect( $go );
			exit;
		}
	}
}
add_action('init', 'jetpack_request_handler');

function jetpack_mobile_theme_setup() {
	if ( jetpack_check_mobile() ) {
		add_action('stylesheet', 'jetpack_mobile_stylesheet');
		add_action('template', 'jetpack_mobile_template');
		add_action('option_template', 'jetpack_mobile_template');
		add_action('option_stylesheet', 'jetpack_mobile_stylesheet');

		add_action( 'init', 'disable_safecss_style', 11 );

		do_action( 'mobile_setup' );
	}
}

// Need a hook after plugins_loaded (since this code won't be loaded in Jetpack
// until then) but after init (because it has its own init hooks to add).
add_action( 'setup_theme', 'jetpack_mobile_theme_setup' );

if (isset($_COOKIE['akm_mobile']) && $_COOKIE['akm_mobile'] == 'false') {
	add_action('wp_footer', 'jetpack_mobile_available');
}

add_action( 'wp_footer', 'mobile_admin_bar', 20 );
function mobile_admin_bar() {
	if ( jetpack_is_mobile() ) :
	?>
	<script type="text/javascript" id='mobile-admin-bar'>
		jQuery( function( $ ) {
			var menupop = $( '#wpadminbar .ab-top-menu > li' )
				.unbind( 'mouseover' )
				.unbind( 'mouseout' )
				.click( function ( e ) {
					$( this ).toggleClass( 'hover' );
					$( '#wpadminbar .menupop' ).not( this ).removeClass( 'hover' );
				} )
				.children( 'a' )
					.click( function( e ) {
						e.preventDefault();
					} );
			$( '#wpadminbar' ).css( 'position', 'absolute' );
			$( '#ab-reblog-box' ).css( 'position', 'absolute' );
		} );
	</script>
	<?php
	endif;
}

function jetpack_is_mobile() {
	if ( function_exists( 'is_mobile' ) )
		return is_mobile();

	if ( function_exists( 'wp_is_mobile' ) )
		return wp_is_mobile();

	return false;
}
