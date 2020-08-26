<?php
// Related: https://github.com/CherryFramework/cherry-framework/issues/178
// Makes incorrect assumptions about ABSPATH and wp-content location
function wpcomsh_hotfix_cherry_core_base_url( $url ) {
	return str_replace( WP_CONTENT_DIR, '/wp-content/', $url );
}
add_filter( 'cherry_core_base_url', 'wpcomsh_hotfix_cherry_core_base_url' );

// On Atomic v2 we require the path within the webroot to be the one passed to X-Accel-Redirect
function wpcomsh_woocommerce_download_file_xsendfile_x_accel_redirect_file_path( $xsendfile_path ) {
	if ( 0 === strpos( $xsendfile_path, 'srv/htdocs/' ) ) {
		$xsendfile_path = substr_replace( $xsendfile_path, '', 0, /* strlen( 'srv/htdocs/' ) */ 11 );
	}
	return $xsendfile_path;
}
add_filter( 'woocommerce_download_file_xsendfile_x_accel_redirect_file_path', 'wpcomsh_woocommerce_download_file_xsendfile_x_accel_redirect_file_path' );

// We define a Akismet Key at the Platform Level which is always assumed to be valid so don't check it all the time.
// Related: https://github.com/Automattic/jetpack/issues/12382
function wpcomsh_pre_transient_jetpack_akismet_key_is_valid( $_false ) {
    return 'valid';
}
add_filter( 'pre_transient_jetpack_akismet_key_is_valid', 'wpcomsh_pre_transient_jetpack_akismet_key_is_valid' );

// Patched function version. Based on Gutenberg 8.7.0:
// https://github.com/WordPress/gutenberg/blob/828c21a931f8292d1386a0e0c2614a97e0c20910/lib/blocks.php#L230-L291
// This patch is applied: https://github.com/WordPress/gutenberg/pull/24447
function wpcomsh_patched_gutenberg_experimental_apply_classnames_and_styles( $block_content, $block ) {
	if ( ! isset( $block['attrs'] ) ) {
		return $block_content;
	}

	$block_type = WP_Block_Type_Registry::get_instance()->get_registered( $block['blockName'] );
	// If no render_callback, assume styles have been previously handled.
	if ( ! $block_type || ! $block_type->render_callback || empty( $block_type->supports ) ) {
		return $block_content;
	}

	// Check what style features the block supports.
	$supports = gutenberg_experimental_global_styles_get_supported_styles( $block_type->supports );

	$attributes = array();
	$attributes = gutenberg_experimental_build_css_colors( $attributes, $block['attrs'], $supports );
	$attributes = gutenberg_experimental_build_css_typography( $attributes, $block['attrs'], $supports );
	$attributes = gutenberg_build_css_block_alignment( $attributes, $block['attrs'], $supports );

	if ( ! count( $attributes ) ) {
		return $block_content;
	}

	// We need to wrap the block in order to handle UTF-8 properly.
	$wrapper_left  = '<html><head><meta http-equiv="Content-Type" content="text/html; charset=utf-8"></head><body>';
	$wrapper_right = '</body></html>';

	$dom = new DOMDocument( '1.0', 'utf-8' );

	// Suppress warnings from this method from polluting the front-end.
	// @codingStandardsIgnoreStart

	// WPCOMSH: This is the patched line from https://github.com/WordPress/gutenberg/pull/24447
	if ( ! @$dom->loadHTML( $wrapper_left . $block_content . $wrapper_right , LIBXML_HTML_NODEFDTD | LIBXML_COMPACT ) ) {
	// @codingStandardsIgnoreEnd
		return $block_content;
	}

	$xpath      = new DOMXPath( $dom );
	$block_root = $xpath->query( '/html/body/*' )[0];

	if ( empty( $block_root ) ) {
		return $block_content;
	}

	// Some inline styles may be added without ending ';', add this if necessary.
	$current_styles = trim( $block_root->getAttribute( 'style' ), ' ' );
	if ( strlen( $current_styles ) > 0 && substr( $current_styles, -1 ) !== ';' ) {
		$current_styles = $current_styles . ';';
	};

	// Merge and dedupe new and existing classes and styles.
	$classes_to_add = esc_attr( implode( ' ', array_key_exists( 'css_classes', $attributes ) ? $attributes['css_classes'] : array() ) );
	$styles_to_add  = esc_attr( implode( ' ', array_key_exists( 'inline_styles', $attributes ) ? $attributes['inline_styles'] : array() ) );
	$new_classes    = implode( ' ', array_unique( explode( ' ', ltrim( $block_root->getAttribute( 'class' ) . ' ' ) . $classes_to_add ) ) );
	$new_styles     = implode( ' ', array_unique( explode( ' ', $current_styles . ' ' . $styles_to_add ) ) );

	// Apply new styles and classes.
	if ( ! empty( $new_classes ) ) {
		$block_root->setAttribute( 'class', $new_classes );
	}

	if ( ! empty( $new_styles ) ) {
		$block_root->setAttribute( 'style', $new_styles );
	}

	return str_replace( array( $wrapper_left, $wrapper_right ), '', $dom->saveHtml() );
}

function wpcomsh_hotfix_gutenberg_8_7_x_encoding() {
	remove_filter( 'render_block', 'gutenberg_experimental_apply_classnames_and_styles', 10 );
	add_filter( 'render_block', 'wpcomsh_patched_gutenberg_experimental_apply_classnames_and_styles', 10, 2 );
}

function wpcomsh_hotfix_gutenberg() {
	// Gutenberg provides this function. We depend on it and it should be exist.
	if ( ! defined( 'GUTENBERG_VERSION' ) ) {
		return;
	}

	// Apply fixes by Gutenberg version.
	if ( '8.7.0' === GUTENBERG_VERSION ||  '8.7.1' === GUTENBERG_VERSION ) {
		wpcomsh_hotfix_gutenberg_8_7_x_encoding();
	}
}
add_action( 'plugins_loaded', 'wpcomsh_hotfix_gutenberg' );
