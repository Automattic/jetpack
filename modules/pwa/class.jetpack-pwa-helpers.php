<?php
class Jetpack_PWA_Helpers {
	public static function get_default_manifest_icon_sizes() {
		// These icon sizes based on conversation here:
		// https://github.com/GoogleChrome/lighthouse/issues/291
		return array(
			192,
			512,
		);
	}

	public static function site_icon_url( $size = 512 ) {
		$url = function_exists( 'get_site_icon_url' )
			? get_site_icon_url( $size )
			: false;

		// Fall back to built-in WordPress icon
		if ( ! $url && in_array( $size, self::get_default_manifest_icon_sizes() ) ) {
			$url = esc_url_raw(
				plugins_url( "modules/pwa/images/wp-$size.png", JETPACK__PLUGIN_FILE )
			);
		}

		return $url;
	}

	public static function get_theme_color() {
		$theme_color = false;

		// if we have AMP enabled, use those colors?
		if ( class_exists( 'AMP_Customizer_Settings' ) ) {
			/* This filter is documented in wp-content/plugins/amp/includes/class-amp-post-template.php */
			$amp_settings = apply_filters(
				'amp_post_template_customizer_settings',
				AMP_Customizer_Settings::get_settings(),
				null
			);

			if ( isset( $amp_settings['header_background_color'] ) ) {
				$theme_color = $amp_settings['header_background_color'];
			}
		}

		if ( ! $theme_color && current_theme_supports( 'custom-background' ) ) {
			$background_color = get_background_color(); // Returns hex key without hash or empty string
			if ( $background_color ) {
				$theme_color = "#$background_color";
			}
		}

		if ( ! $theme_color ) {
			$theme_color = '#fff';
		}

		/**
		 * Allows overriding the PWA theme color which is used when loading the app.
		 *
		 * @since 5.6.0
		 *
		 * @param string $theme_color
		 */
		return apply_filters( 'jetpack_pwa_background_color', $theme_color );
	}
}
