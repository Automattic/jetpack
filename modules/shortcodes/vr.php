<?php

function vr_viewer_get_viewer_url_params( $params ) {
	$url_params = array();

	if ( isset( $params['rotation'] ) ) {
		$url_params['rotation'] = intval( $params['rotation'], 10 );
	}

	if ( isset( $params['view'] ) && in_array( $params['view'], array( 'cinema', '360' ), true ) ) {
		$url_params['view'] = $params['view'];
	}

	if ( $params['preview'] ) {
		$url_params['preview'] = 1;
	}

	if ( isset( $params['url'] ) ) {
		return array_merge( $url_params, array( 'url' => $params['url'] ) );
	} else if ( isset( $params['guid'] ) ) {
		return array_merge( $url_params, array( 'guid' => $params['guid'] ) );
	}

	return false;
}

function vr_viewer_iframe_padding( $view ) {
	if ( $view === '360' ) {
		return '100%'; // 1:1 square aspect for 360
	}

	return '50%'; // 2:1 panorama aspect
}

function vr_viewer_get_html( $url_params ) {
	$iframe = add_query_arg( $url_params, 'https://vr.me.sh/view/' );

	$rtn  = '<div style="position: relative; max-width: 720px; margin-left: auto; margin-right: auto; overflow: hidden;">';
	$rtn .= '<div style="padding-top: '. vr_viewer_iframe_padding( $url_params['view'] ).';"></div>';
	$rtn .= '<iframe style="position: absolute; top: 0; right: 0; bottom: 0; left: 0; height: 100%" allowfullscreen="true" frameborder="0" width="100%" height="300" src="'.esc_url( $iframe ).'">';
	$rtn .= '</iframe>';
	$rtn .= '</div>';

	return $rtn;
}

function vr_viewer_shortcode( $atts ) {

	$params = shortcode_atts( array(
		0          => null,
		'url'      => null,
		'src'      => null,
		'guid'     => null,
		'rotation' => null,
		'view'     => null,
		'preview'  => false,
	), $atts );

	// We offer a few ways to specify the URL
	if ( $params[0] ) {
		$params['url'] = $params[0];
	} else if ( $params['src'] ) {
		$params['url'] = $params['src'];
	}

	$url_params = vr_viewer_get_viewer_url_params( $params );
	if ( $url_params ) {
		return vr_viewer_get_html( $url_params );
	}

	return '[vr] shortcode requires a data source to be given';
}

add_shortcode( 'vr', 'vr_viewer_shortcode' );
