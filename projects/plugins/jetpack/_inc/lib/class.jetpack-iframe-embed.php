<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Tweak a preview when rendered in an iframe.
 * This is used when rendering iFrames in the Calypso app.
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

		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			wp_enqueue_script(
				'jetpack-iframe-embed',
				WPMU_PLUGIN_URL . '/jetpack-iframe-embed/jetpack-iframe-embed.js',
				array( 'jquery' ),
				JETPACK__VERSION,
				false
			);
		} else {
			$ver = sprintf( '%s-%s', gmdate( 'oW' ), defined( 'JETPACK__VERSION' ) ? JETPACK__VERSION : '' );
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
			self::has_get_param( $_GET['iframe'] )
			&& (
				self::has_get_param( $_GET['preview'] )
				|| self::has_get_param( $_GET['theme_preview'] )
			)
			// phpcs:enable WordPress.Security.NonceVerification.Recommended
		);
	}

	/**
	 * Check if URL has specific parameter.
	 *
	 * @param string $parameter Parameter to check for.
	 * @return bool
	 */
	private static function has_get_param( $parameter ) {
		return isset( $parameter ) && 'true' === $parameter;
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
