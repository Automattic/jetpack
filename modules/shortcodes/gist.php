<?php
/**
 * GitHub's Gist site supports oEmbed but their oembed provider only
 * returns raw HTML (no styling) and the first little bit of the code.
 *
 * Their JavaScript-based embed method is a lot better, so that's what we're using.
 */

wp_embed_register_handler( 'github-gist', '#https?://gist\.github\.com/([a-zA-Z0-9/]+)(\#file\-[a-zA-Z0-9\_\-]+)?#', 'github_gist_embed_handler' );
add_shortcode( 'gist', 'github_gist_shortcode' );

/**
 * Handle gist embeds.
 *
 * @since 2.8.0
 *
 * @global WP_Embed $wp_embed
 *
 * @param array  $matches Results after parsing the URL using the regex in wp_embed_register_handler().
 * @param array  $attr    Embed attributes.
 * @param string $url     The original URL that was matched by the regex.
 * @param array  $rawattr The original unmodified attributes.
 * @return string The embed HTML.
 */
function github_gist_embed_handler( $matches, $attr, $url, $rawattr ) {
	// Let the shortcode callback do all the work
	return github_gist_shortcode( $matches, $url );
}

/**
 * Callback for gist shortcode.
 *
 * @since 2.8.0
 *
 * @param array  $atts Attributes found in the shortcode.
 * @param string $content Content enclosed by the shortcode.
 *
 * @return string The gist HTML.
 */
function github_gist_shortcode( $atts, $content = '' ) {

	if ( empty( $atts[0] ) && empty( $content ) ) {
		return '<!-- Missing Gist ID -->';
	}

	$id = ( ! empty( $content ) ) ? $content : $atts[0];

	// Parse a URL
	if ( ! is_numeric( $id ) ) {
		$id = preg_replace( '#https?://gist.github.com/([a-zA-Z0-9]+)#', '$1', $id );
	}

	if ( ! $id ) {
		return '<!-- Invalid Gist ID -->';
	}

	if ( Jetpack_AMP_Support::is_amp_request() ) {
		/*
		 * According to <https://www.ampproject.org/docs/reference/components/amp-gist#height-(required)>:
		 *
		 * > Note: You must find the height of the gist by inspecting it with your browser (e.g., Chrome Developer Tools).
		 *
		 * However, this does not seem to be the case any longer. The actual height of the content does get set in the
		 * page after loading. So this is just the initial height.
		 * See <https://github.com/ampproject/amphtml/pull/17738>.
		 */
		$height = 240;

		$parsed_url = wp_parse_url( $id );

		// Strip Github user name.
		$id = preg_replace( '#^.*/(?=[a-z0-9]+)#', '', $parsed_url['path'] );

		$file = null;
		if ( ! empty( $parsed_url['query'] ) ) {
			$query_args = wp_parse_args( $parsed_url['query'] );
			if ( isset( $query_args['file'] ) ) {
				$file = $query_args['file'];
			}
		}
		if ( ! $file && ! empty( $parsed_url['fragment'] ) && preg_match( '#^file-(.+)#', $parsed_url['fragment'], $matches ) ) {
			$file = $matches[1];

			// Make best guess of file for fragment that was slugified.
			$file = preg_replace( '/-(\w+)/', '.$1', $file );
		}

		$amp_tag = sprintf(
			'<amp-gist layout="fixed-height" data-gistid="%s" height="%s"',
			esc_attr( basename( $id, '.json' ) ),
			esc_attr( $height )
		);
		if ( ! empty( $file ) ) {
			$amp_tag .= sprintf( ' data-file="%s"', esc_attr( $file ) );
		}
		$amp_tag .= '></amp-gist>';
		return $amp_tag;
	}

	wp_enqueue_script(
		'jetpack-gist-embed',
		Jetpack::get_file_url_for_environment( '_inc/build/shortcodes/js/gist.min.js', 'modules/shortcodes/js/gist.js' ),
		array( 'jquery' ),
		false,
		true
	);

	if ( false !== strpos( $id, '#file-' ) ) {
		// URL points to a specific file in the gist
		$id = str_replace( '#file-', '.json?file=', $id );
		$id = preg_replace( '/\-(?!.*\-)/', '.', $id );
	} else {
		$file = ( ! empty( $atts['file'] ) ) ? '?file=' . urlencode( $atts['file'] ) : '';
		// URL points to the entire gist
		$id .= ".json$file";
	}

	// inline style to prevent the bottom margin to the embed that themes like TwentyTen, et al., add to tables
	$return = '<style>.gist table { margin-bottom: 0; }</style><div class="gist-oembed" data-gist="' . esc_attr( $id ) . '"></div>';

	if ( isset( $_POST['type'] ) && 'embed' === $_POST['type'] &&
		 isset( $_POST['action'] ) && 'parse-embed' === $_POST['action'] ) {
		return github_gist_simple_embed( $id );
	}

	return $return;
}

/**
 * Use script tag to load shortcode in editor.
 *
 * @since 3.9.0
 *
 * @param string $id The ID of the gist.
 *
 * @return string
 */
function github_gist_simple_embed( $id ) {
	$id = str_replace( 'json', 'js', $id );
	return '<script type="text/javascript" src="https://gist.github.com/' . $id . '"></script>';
}
