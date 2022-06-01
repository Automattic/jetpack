<?php
namespace Automattic\P2\Plugins\Blocks\P2Embed;

function render_callback( $attributes, $content, $pattern = '' ) {
	$url   = $attributes['url'] ?? '';
	$align = $attributes['align'] ?? '';
	// The class name that affects alignment is called alignwide, alignfull, etc
	$align = $align ? " align$align" : '';

	if ( '' === $attributes['url'] ) {
		return '';
	}

	if ( $pattern && ! preg_match( $pattern, $url ) ) {
		return '';
	}

	$html =
		'<figure class="wp-block-p2-embed' . esc_attr( $align ) . '">' .
			'<div class="wp-block-p2-embed__wrapper">' .
				'<iframe src="' . esc_url( $url ) . '" allowFullScreen frameborder="0" title="An embed" height="450"></iframe>' .
			'</div>' .
		'</figure>';
	return $html;
}

