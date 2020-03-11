<?php

/**
 * Inline PDFs
 * Takes one-line embeds of a PDF URL (*.pdf), and attempts to embed it directly in the post instead of leaving it as a link.
 */
wp_embed_register_handler( 'inline-pdfs', '#https?://[^<]*\.pdf$#i', 'inline_pdf_embed_handler' );

function inline_pdf_embed_handler( $matches, $attr, $url ) {
	return sprintf(
		'<object data="%1$s" type="application/pdf" width="100%%" height="800">
		  <p><a href="%1$s">%1$s</a></p>
		</object>',
		esc_attr( $url )
	);
}
