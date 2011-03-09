<?php
/**
 * slideshow and slideguest shortcodes for slide.com
 * [slideshow id=2233785415202545677&w=426&h=320]
 */ 

function slide_embed_to_short_code( $content ) {
	global $content_width;

	if ( false === strpos( $content, 'slide.com/widgets' ) )
		return $content;

	$regexp = '!<div><embed((?:\s+\w+="[^"]*")*)\s+src="http://widget[^"]+slide\.com/widgets/slideticker\.swf"((?:\s+\w+="[^"]*")*)\s*(?:/?>|>\s*</embed>)\s*<div(?:\s+[^>]+).*?slide\.com/p1/.*?slide\.com/p2.*?</div>\s*</div>!i';
	$regexp_ent = htmlspecialchars( $regexp, ENT_NOQUOTES );

	foreach ( array( 'regexp', 'regexp_ent' ) as $reg ) {
		if ( !preg_match_all( $$reg, $content, $matches, PREG_SET_ORDER ) )
			continue;

		foreach ( $matches as $match ) {
			$params = $match[1] . $match[2];
			if ( 'regexp_ent' == $reg ) 
				$params = html_entity_decode( $params );

			$params = wp_kses_hair( $params, array( 'http' ) );
			if ( !isset( $params['type'] ) || 'application/x-shockwave-flash' != $params['type']['value'] || !isset( $params['flashvars'] ) )
				continue;

			wp_parse_str( html_entity_decode( $params['flashvars']['value'] ), $flashvars );

			if ( empty( $flashvars['channel'] ) )
				continue;

			$id = $flashvars['channel'];

			$width = 400;
			if ( ! empty( $params['width']['value'] ) )
				$width = (int) $params['width']['value'];
			elseif ( ! empty( $params['style']['value'] ) && preg_match( '/width\s*:\s*(\d+)/i', $params['style']['value'], $width_match ) )
				$width = (int) $width_match[1];

			$height = 300;
			if ( ! empty( $params['height']['value'] ) )
				$height = (int) $params['height']['value'];
			elseif ( ! empty( $params['style']['value'] ) && preg_match( '/height\s*:\s*(\d+)/i', $params['style']['value'], $height_match ) )
				$height = (int) $height_match[1];

			if ( $content_width && $width > $content_width ) {
				$height = intval( $height * $content_width / $width );
				$width = $content_width;
			}

			$content = str_replace( $match[0], "[slideshow id={$id}&amp;w={$width}&amp;h={$height}]", $content );
		}
	}

	return $content;
}
add_filter( 'pre_kses', 'slide_embed_to_short_code' );

function slideshow_shortcode( $atts ) {
	return slide_embed( 'slideshow', $atts );
}

function slideguest_shortcode( $atts ) {
	return slide_embed( 'slideguest', $atts );
}

function slide_markup( $content ) {
	return preg_replace( '!\[(slideshow|slideguest) (id=.+|[0-9]+)]!ie', 'slide_embed("$1", "$2")', $content );
}

function slide_embed( $type, $atts ) {
	$param = shortcode_new_to_old_params( $atts );

	if ( ctype_digit( $param ) ) {
		$id = $param;
		$w  = 426;
		$h  = 320;
	} else {
		parse_str( $param, $params );		
		if ( count( $params ) != 3 || !isset( $params['id'] ) || !isset( $params['w'] ) || !isset( $params['h'] ) )
			return '<!-- Slide.com error: provide id, w, h -->';

		extract( $params );
		if ( !ctype_digit( $id ) || !ctype_digit( $w ) || !ctype_digit( $h ) )
			return '<!-- Slide.com error: provide integers -->';
	}

	$partition = sprintf( '%02x', $id % 256 );

	if ( 'slideshow' == $type )
		return "<div><embed src='http://widget-$partition.slide.com/widgets/slideticker.swf' type='application/x-shockwave-flash' quality='high' scale='noscale' salign='l' wmode='transparent' flashvars='site=widget-$partition.slide.com&channel=$id&cy=wp&il=1' width='$w' height='$h' name='flashticker' align='middle' /><div style='width: {$w}px;text-align:left;'><a href='http://www.slide.com/pivot?ad=0&tt=0&sk=0&cy=wp&th=0&id=$id&map=1' target='_blank'><img src='http://widget-$partition.slide.com/p1/$id/wp_t000_v000_a000_f00/images/xslide1.gif' border='0' ismap='ismap' /></a> <a href='http://www.slide.com/pivot?ad=0&tt=0&sk=0&cy=wp&th=0&id=$id&map=2' target='_blank'><img src='http://widget-$partition.slide.com/p2/$id/wp_t000_v000_a000_f00/images/xslide2.gif' border='0' ismap='ismap' /></a></div></div>";
	else
		return "<div><embed src='http://widget-$partition.slide.com/widgets/slidemap.swf' type='application/x-shockwave-flash' quality='high' scale='noscale' salign='l' wmode='transparent' flashvars='site=widget-$partition.slide.com&channel=$id&cy=wp&il=1' width='$w' height='$h' name='flashticker' align='middle' /><div style='width:{$w}px;text-align:left;'><a href='http://www.slide.com/pivot?ad=0&tt=0&sk=0&cy=wp&th=0&id=$id&map=5' target='_blank'><img src='http://widget-$partition.slide.com/c1/$id/wp_t000_v000_a000_f00/images/xslide1.gif' border='0' ismap='ismap' /></a> <a href='http://www.slide.com/pivot?ad=0&tt=0&sk=0&cy=wp&th=0&id=$id&map=6' target='_blank'><img src='http://widget-$partition.slide.com/c2/$id/wp_t000_v000_a000_f00/images/xslide6.gif' border='0' ismap='ismap' /></a></div></div>";

}

/**
 * slideshow_find_handler resolves a conflict between slide.com and WordPress.com slideshow
 */ 
add_shortcode( 'slideguest', 'slideguest_shortcode' );
add_shortcode( 'slideshow', 'slideshow_shortcode' );
