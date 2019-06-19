<?php

use Automattic\Jetpack\Asset_Tools;

/**
 * GitHub's Gist site supports oEmbed but their oembed provider only
 * returns raw HTML (no styling) and the first little bit of the code.
 *
 * Their JavaScript-based embed method is a lot better, so that's what we're using.
 *
 * Supported formats:
 * Full URL: https://gist.github.com/57cc50246aab776e110060926a2face2
 * Full URL with username: https://gist.github.com/jeherve/57cc50246aab776e110060926a2face2
 * Full URL linking to specific file: https://gist.github.com/jeherve/57cc50246aab776e110060926a2face2#file-wp-config-php
 * Full URL, no username, linking to specific file: https://gist.github.com/57cc50246aab776e110060926a2face2#file-wp-config-php
 * Gist ID: [gist]57cc50246aab776e110060926a2face2[/gist]
 * Gist ID within tag: [gist 57cc50246aab776e110060926a2face2]
 * Gist ID with username: [gist jeherve/57cc50246aab776e110060926a2face2]
 * Gist private ID with username: [gist xknown/fc5891af153e2cf365c9]
 *
 * @package Jetpack
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
function github_gist_embed_handler( $matches, $attr, $url, $rawattr ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
	// Let the shortcode callback do all the work.
	return github_gist_shortcode( $matches, $url );
}

/**
 * Extract an ID from a Gist shortcode or a full Gist URL.
 *
 * @since 7.3.0
 *
 * @param string $gist Gist shortcode or full Gist URL.
 *
 * @return array $gist_info {
 * Array of information about our gist.
 *     @type string $id   Unique identifier for the gist.
 *     @type string $file File name if the gist links to a specific file.
 * }
 */
function jetpack_gist_get_shortcode_id( $gist = '' ) {
	$gist_info = array(
		'id'   => '',
		'file' => '',
	);
	// Simple shortcode, with just an ID.
	if ( ctype_alnum( $gist ) ) {
		$gist_info['id'] = $gist;
	}

	// Full URL? Only keep the relevant parts.
	$parsed_url = wp_parse_url( $gist );
	if (
		! empty( $parsed_url )
		&& is_array( $parsed_url )
		&& isset( $parsed_url['scheme'], $parsed_url['host'], $parsed_url['path'] )
	) {
		// Not a Gist URL? Bail.
		if ( 'gist.github.com' !== $parsed_url['host'] ) {
			return array(
				'id'   => '',
				'file' => '',
			);
		}

		// Keep the file name if there was one.
		if ( ! empty( $parsed_url['fragment'] ) ) {
			$gist_info['file'] = preg_replace( '/(?:file-)(.+)/', '$1', $parsed_url['fragment'] );
		}

		// Keep the unique identifier without any leading or trailing slashes.
		if ( ! empty( $parsed_url['path'] ) ) {
			$gist_info['id'] = preg_replace( '/^\/([^\.]+)\./', '$1', $parsed_url['path'] );
			// Overwrite $gist with our identifier to clean it up below.
			$gist = $gist_info['id'];
		}
	}

	// Not a URL nor an ID? Look for "username/id", "/username/id", or "id", and only keep the ID.
	if ( preg_match( '#^/?(([a-z0-9_-]+/)?([a-z0-9]+))$#i', $gist, $matches ) ) {
		$gist_info['id'] = $matches[3];
	}

	return $gist_info;
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
		if ( current_user_can( 'edit_posts' ) ) {
			return esc_html__( 'Please specify a Gist URL or ID.', 'jetpack' );
		} else {
			return '<!-- Missing Gist ID -->';
		}
	}

	$id = ( ! empty( $content ) ) ? $content : $atts[0];

	// Parse a URL to get an ID we can use.
	$gist_info = jetpack_gist_get_shortcode_id( $id );
	if ( empty( $gist_info['id'] ) ) {
		if ( current_user_can( 'edit_posts' ) ) {
			return esc_html__( 'The Gist ID you provided is not valid. Please try a different one.', 'jetpack' );
		} else {
			return '<!-- Invalid Gist ID -->';
		}
	} else {
		// Add trailing .json to all unique gist identifiers.
		$id = $gist_info['id'] . '.json';
	}

	// The file name can come from the URL passed, or from a shortcode attribute.
	if ( ! empty( $gist_info['file'] ) ) {
		$file = $gist_info['file'];
	} elseif ( ! empty( $atts['file'] ) ) {
		$file = $atts['file'];
	} else {
		$file = '';
	}

	// Replace - by . to get a real file name from slug.
	if ( ! empty( $file ) ) {
		// Find the last -.
		$dash_position = strrpos( $file, '-' );
		if ( false !== $dash_position ) {
			// Replace the - by a period.
			$file = substr_replace( $file, '.', $dash_position, 1 );
		}

		$file = rawurlencode( $file );
	}

	if (
		class_exists( 'Jetpack_AMP_Support' )
		&& Jetpack_AMP_Support::is_amp_request()
	) {
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

	// URL points to the entire gist, including the file name if there was one.
	$id = ( ! empty( $file ) ? $id . '?file=' . $file : $id );

	$asset_tools = new Asset_Tools();
	wp_enqueue_script(
		'jetpack-gist-embed',
		$asset_tools->get_file_url_for_environment( '_inc/build/shortcodes/js/gist.min.js', 'modules/shortcodes/js/gist.js' ),
		array( 'jquery' ),
		JETPACK__VERSION,
		true
	);

	// inline style to prevent the bottom margin to the embed that themes like TwentyTen, et al., add to tables.
	$return = '<style>.gist table { margin-bottom: 0; }</style><div class="gist-oembed" data-gist="' . esc_attr( $id ) . '"></div>';

	if (
		// No need to check for a nonce here, that's already handled by Core further up.
		// phpcs:disable WordPress.Security.NonceVerification.Missing
		isset( $_POST['type'] )
		&& 'embed' === $_POST['type']
		&& isset( $_POST['action'] )
		&& 'parse-embed' === $_POST['action']
		// phpcs:enable WordPress.Security.NonceVerification.Missing
	) {
		return github_gist_simple_embed( $id );
	}

	return $return;
}

/**
 * Use script tag to load shortcode in editor.
 * Can't use wp_enqueue_script here.
 *
 * @since 3.9.0
 *
 * @param string $id The ID of the gist.
 */
function github_gist_simple_embed( $id ) {
	$id = str_replace( 'json', 'js', $id );
	return '<script src="' . esc_url( "https://gist.github.com/$id" ) . '"></script>'; // phpcs:ignore WordPress.WP.EnqueuedResources.NonEnqueuedScript
}
