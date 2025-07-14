<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Tweak a preview when rendered in an iframe.
 * This is used when rendering iFrames in the Calypso app.
 *
 * This file is shared between WordPress.com and Jetpack.
 * The canonical source is Jetpack and no WordPress.com-specific code should exist in this file.
 *
 * @package automattic/jetpack
 */

/**
 * Tweak a preview when rendered in an iframe.
 */
class Jetpack_Iframe_Embed {
	/**
	 * Initialize class.
	 */
	public static function init() {
		if ( ! self::is_embedding_in_iframe() ) {
			return;
		}

		// Disable the admin bar.
		if ( ! defined( 'IFRAME_REQUEST' ) ) {
			define( 'IFRAME_REQUEST', true );
		}

		// Prevent canonical redirects.
		remove_filter( 'template_redirect', 'redirect_canonical' );

		add_action( 'wp_head', array( 'Jetpack_Iframe_Embed', 'noindex' ), 1 );
		add_action( 'wp_head', array( 'Jetpack_Iframe_Embed', 'base_target_blank' ), 1 );

		add_filter( 'shortcode_atts_video', array( 'Jetpack_Iframe_Embed', 'disable_autoplay' ) );
		add_filter( 'shortcode_atts_audio', array( 'Jetpack_Iframe_Embed', 'disable_autoplay' ) );

		add_filter( 'render_block_data', array( 'Jetpack_Iframe_Embed', 'disable_video_block_attr' ) );
		add_filter( 'render_block', array( 'Jetpack_Iframe_Embed', 'disable_video_rendered_html' ), 10, 2 );

		$ver = sprintf( '%s-%s', gmdate( 'oW' ), defined( 'JETPACK__VERSION' ) ? JETPACK__VERSION : '' );
		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			wp_enqueue_script(
				'jetpack-iframe-embed',
				'/wp-content/mu-plugins/jetpack-iframe-embed/jetpack-iframe-embed.js',
				array( 'jquery' ),
				$ver,
				false
			);
		} else {
			wp_enqueue_script(
				'jetpack-iframe-embed',
				'//s0.wp.com/wp-content/mu-plugins/jetpack-iframe-embed/jetpack-iframe-embed.js',
				array( 'jquery' ),
				$ver,
				false
			);
		}
		wp_localize_script( 'jetpack-iframe-embed', '_previewSite', array( 'siteURL' => get_site_url() ) );
	}

	/**
	 * Check that we are in an iFrame.
	 *
	 * @return bool
	 */
	private static function is_embedding_in_iframe() {
		return (
			// phpcs:disable WordPress.Security.NonceVerification.Recommended -- No nonce needed, we're only checking for a specific screen view.
			isset( $_GET['iframe'] ) && 'true' === $_GET['iframe']
			&& (
				isset( $_GET['preview'] ) && 'true' === $_GET['preview']
				|| isset( $_GET['theme_preview'] ) && 'true' === $_GET['theme_preview']
			)
			// phpcs:enable WordPress.Security.NonceVerification.Recommended
		);
	}

	/**
	 * Disable `autoplay` shortcode attribute in context of an iframe
	 * Added via `shortcode_atts_video` & `shortcode_atts_audio` in `init`
	 *
	 * @param  array $atts The output array of shortcode attributes.
	 *
	 * @return array       The output array of shortcode attributes.
	 */
	public static function disable_autoplay( $atts ) {
		return array_merge( $atts, array( 'autoplay' => false ) );
	}

	/**
	 * Disable `autoplay` and add `muted` to all videopress and core/video blocks in
	 * context of an iframe.
	 *
	 * @param array $parsed_block An associative array of the block being rendered.
	 * @return array The modified block data.
	 */
	public static function disable_video_block_attr( $parsed_block ) {
		if ( ! isset( $parsed_block['blockName'] ) || ! isset( $parsed_block['attrs'] ) ) {
			return $parsed_block;
		}

		if ( $parsed_block['blockName'] === 'videopress/video' || $parsed_block['blockName'] === 'core/video' ) {
			$parsed_block['attrs']['autoplay'] = false;
			$parsed_block['attrs']['muted']    = true;
		}

		return $parsed_block;
	}

	/**
	 * Disable `autoplay` and add `muted` to all blocks which embed videopress iframes.
	 *
	 * @param string $block_content The block content about to be appended.
	 * @param array  $block         The full block, including name and attributes.
	 * @return string Rendered HTML for the embed block.
	 */
	public static function disable_video_rendered_html( $block_content, $block ) {
		if ( $block['blockName'] === 'core/embed' && $block['attrs']['providerNameSlug'] === 'videopress' ) {
			$block_content = self::change_element_src_query_param( $block_content, array( 'tag_name' => 'iframe' ), 'autoPlay', '0' );
			return self::change_element_src_query_param( $block_content, array( 'tag_name' => 'iframe' ), 'muted', '1' );
		}

		if ( $block['blockName'] === 'core/video' ) {
			$block_content = self::change_element_src_query_param( $block_content, array( 'tag_name' => 'iframe' ), 'autoPlay', '0' );
			return self::change_element_src_query_param( $block_content, array( 'tag_name' => 'iframe' ), 'muted', '1' );
		}

		if ( $block['blockName'] === 'jetpack/videopress' ) {
			$block_content = self::change_element_src_query_param( $block_content, array( 'tag_name' => 'iframe' ), 'autoPlay', '0' );
			return self::change_element_src_query_param( $block_content, array( 'tag_name' => 'iframe' ), 'muted', '1' );
		}

		if ( $block['blockName'] === 'core/cover' && $block['attrs']['backgroundType'] === 'video' ) {
			$block_content = self::change_element_src_query_param( $block_content, array( 'class_name' => 'wp-block-cover__video-background' ), 'autoPlay', '0' );
			$block_content = self::change_element_src_query_param( $block_content, array( 'class_name' => 'wp-block-cover__video-background' ), 'muted', '1' );
			return self::change_element_remove_attribute( $block_content, array( 'class_name' => 'wp-block-cover__video-background' ), 'autoplay' );
		}

		return $block_content;
	}

	/**
	 * Finds the first tag that matches the query and updates the `src` attribute by
	 * changing one of its query parameters.
	 *
	 * @param string $block_content         The HTML to process.
	 * @param array  $tag_query             The query to find the tag (e.g., ['tag_name'=>'h1']).
	 * @param string $query_param_name      The name of the attribute to remove.
	 * @param string $new_query_param_value The name of the attribute to remove.
	 * @return string The updated HTML.
	 */
	private static function change_element_src_query_param( $block_content, $tag_query, $query_param_name, $new_query_param_value ) {
		$tags = new WP_HTML_Tag_Processor( $block_content );
		if ( ! $tags->next_tag( $tag_query ) ) {
			return $block_content;
		}

		$src = $tags->get_attribute( 'src' );
		if ( ! $src ) {
			return $block_content;
		}

		$parsed_url = wp_parse_url( $src );
		if ( ! $parsed_url ) {
			return $block_content;
		} elseif ( isset( $parsed_url['query'] ) ) {
			$src_query = $parsed_url['query'];
			parse_str( $src_query, $query_params );
			$query_params[ $query_param_name ] = $new_query_param_value;
		} else {
			$parsed_url['query'] = sprintf( '%s=%s', $query_param_name, $new_query_param_value );
		}

		parse_str( $src_query, $query_params );
		$query_params[ $query_param_name ] = $new_query_param_value;

		if ( isset( $parsed_url['query'] ) ) {
			parse_str( $parsed_url['query'], $query_params );
			$query_params[ $query_param_name ] = $new_query_param_value;
			$parsed_url['query']               = http_build_query( $query_params );
		} else {
			$parsed_url['query'] = rawurlencode( $query_param_name ) . '=' . rawurlencode( $new_query_param_value );
		}

		$new_src = ( isset( $parsed_url['scheme'] ) ? $parsed_url['scheme'] . '://' : '' ) .
			( isset( $parsed_url['host'] ) ? $parsed_url['host'] : '' ) .
			( isset( $parsed_url['port'] ) ? ':' . $parsed_url['port'] : '' ) .
			( isset( $parsed_url['path'] ) ? $parsed_url['path'] : '' ) .
			( isset( $parsed_url['query'] ) ? '?' . $parsed_url['query'] : '' ) .
			( isset( $parsed_url['fragment'] ) ? '#' . $parsed_url['fragment'] : '' );
		$tags->set_attribute( 'src', $new_src );

		return $tags->get_updated_html();
	}

	/**
	 * Removes the specified attribute from the first tag that matches the query.
	 *
	 * @param string $block_content The HTML to process.
	 * @param array  $tag_query     The query to find the tag (e.g., ['tag_name'=>'h1']).
	 * @param string $attr_name     The name of the attribute to remove.
	 * @return string The updated HTML.
	 */
	private static function change_element_remove_attribute( $block_content, $tag_query, $attr_name ) {
		$tags = new WP_HTML_Tag_Processor( $block_content );
		if ( ! $tags->next_tag( $tag_query ) ) {
			return $block_content;
		}

		if ( ! $tags->remove_attribute( $attr_name ) ) {
			return $block_content;
		}

		return $tags->get_updated_html();
	}

	/**
	 * We don't want search engines to index iframe previews
	 * Added via `wp_head` action in `init`
	 */
	public static function noindex() {
		echo '<meta name="robots" content="noindex,nofollow" />';
	}

	/**
	 * Make sure all links and forms open in a new window by default
	 * (unless overridden on client-side by JS)
	 * Added via `wp_head` action in `init`
	 */
	public static function base_target_blank() {
		echo '<base target="_blank" />';
	}
}
