<?php

define( 'PWA_MANIFEST_QUERY_VAR', 'jetpack_app_manifest' );
class Jetpack_PWA_Manifest {
	private static $__instance = null;
	/**
	 * Singleton implementation
	 *
	 * @return object
	 */
	public static function instance() {
		if ( ! is_a( self::$__instance, 'Jetpack_PWA_Manifest' ) ) {
			self::$__instance = new Jetpack_PWA_Manifest();
		}

		return self::$__instance;
	}

	/**
	 * Registers actions
	 */
	private function __construct() {
		// register WP_Query hooks for manifest and service worker
		add_filter( 'query_vars', array( $this, 'register_query_vars' ) );
		add_action( 'wp_head', array( $this, 'render_manifest_link' ) );
		// add_action( 'admin_head', array( $this, 'render_manifest_link' ) ); // Don't load for wp-admin, for now
		add_action( 'amp_post_template_head', array( $this, 'render_manifest_link' ) ); // AMP
		add_action( 'template_redirect', array( $this, 'render_manifest_json' ), 2 );
	}

	public function register_query_vars( $vars ) {
		$vars[] = PWA_MANIFEST_QUERY_VAR;
		return $vars;
	}

	function render_manifest_link() {
		?>
			<link rel="manifest" href="<?php echo $this->get_manifest_url() ?>">
			<meta name="theme-color" content="<?php echo $this->get_theme_color(); ?>">
		<?php
	}

	private function get_manifest_url() {
		return add_query_arg( PWA_MANIFEST_QUERY_VAR, '1', trailingslashit( site_url() ) . 'index.php' );
	}

	private function get_theme_color() {
		// if we have AMP enabled, use those colors?
	   if ( class_exists( 'AMP_Customizer_Settings' ) ) {
		   $amp_settings = apply_filters( 'amp_post_template_customizer_settings', AMP_Customizer_Settings::get_settings(), null );
		   $theme_color = $amp_settings['header_background_color'];
	   } elseif ( current_theme_supports( 'custom-background' ) ) {
		   $theme_color = get_theme_support( 'custom-background' )->{'default-color'};
	   } else {
		   $theme_color = '#FFF';
	   }

	   return apply_filters( 'jetpack_pwa_background_color', $theme_color );
   }

	function render_manifest_json() {
		global $wp_query;

		if ( $wp_query->get( PWA_MANIFEST_QUERY_VAR ) ) {
			$theme_color = $this->get_theme_color();

			$manifest = array(
				'start_url'  => get_bloginfo( 'url' ),
				'short_name' => get_bloginfo( 'name' ),
				'name'       => get_bloginfo( 'name' ),
				'display'    => 'standalone',
				'background_color' => $theme_color,
				'theme_color' => $theme_color,
				'gcm_sender_id' => '87234302238',
			);

			$pwa = Jetpack_PWA::instance();
			$icon_48 = $pwa->site_icon_url( 48 );

			if ( $icon_48 ) {
				$manifest[ 'icons' ] = array(
					array(
						'src' => $icon_48,
						'sizes' => '48x48'
					),
					array(
						'src' => $pwa->site_icon_url( 192 ),
						'sizes' => '192x192'
					),
					array(
						'src' => $pwa->site_icon_url( 512 ),
						'sizes' => '512x512'
					)
				);
			}

			wp_send_json( $manifest );
		}
	}
}
