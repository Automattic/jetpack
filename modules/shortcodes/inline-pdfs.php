<?php
/**
 * Embed support for Inline PDFs
 *
 * Takes a plain-text PDF URL (*.pdf), and attempts to embed it directly
 * in the post instead of leaving it as a bare link.
 *
 * @package Jetpack
 */

wp_embed_register_handler( 'inline-pdfs', '#https?://[^<]*\.pdf$#i', 'jetpack_inline_pdf_embed_handler' );

/**
 * Callback to modify the output of embedded PDF files.
 *
 * @param array $matches Regex partial matches against the URL passed.
 * @param array $attr    Attributes received in embed response.
 * @param array $url     Requested URL to be embedded.
 */
function jetpack_inline_pdf_embed_handler( $matches, $attr, $url ) {
	/** This action is documented in modules/widgets/social-media-icons.php */
	do_action( 'jetpack_bump_stats_extras', 'embeds', 'inline-pdf' );

	if ( class_exists( 'Jetpack_AMP_Support' ) && Jetpack_AMP_Support::is_amp_request() ) {
		return sprintf(
			'<p><a href="%1$s">%2$s</a></p>',
			esc_url( $url ),
			esc_html__( 'PDF Document', 'jetpack' )
		);
	}

	$filename      = basename( wp_parse_url( $url, PHP_URL_PATH ) );
	$fallback_text = sprintf(
		/* translators: Placeholder is a file name, for example "file.pdf" */
		esc_html__( 'Click to access %1$s', 'jetpack' ),
		$filename
	);

	return sprintf(
		'<object data="%1$s" type="application/pdf" width="100%%" height="800">
			<p><a href="%1$s">%2$s</a></p>
		</object>',
		esc_attr( $url ),
		$fallback_text
	);
}
