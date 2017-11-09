<?php

class Jetpack_PWA_Manifest {
	/**
	 * @var Jetpack_PWA_Manifest
	 */
	private static $__instance = null;

	/**
	 * When this query var is present, display the PWA manifest.
	 *
	 * @var string
	 */
	const PWA_MANIFEST_QUERY_VAR = 'jetpack_app_manifest';

	/**
	 * Singleton implementation
	 *
	 * @return Jetpack_PWA_Manifest
	 */
	public static function instance() {
		if ( is_null( self::$__instance ) ) {
			self::$__instance = new Jetpack_PWA_Manifest;
		}

		return self::$__instance;
	}

	/**
	 * Registers actions the first time that instance() is called.
	 */
	private function __construct() {
		add_action( 'wp_head', array( $this, 'render_manifest_link' ) );
		add_action( 'amp_post_template_head', array( $this, 'render_manifest_link' ) );
		add_action( 'template_redirect', array( $this, 'render_manifest_json' ), 2 );
	}

	function render_manifest_link() {
		?>
			<link rel="manifest" href="<?php echo esc_url_raw( $this->get_manifest_url() ); ?>">
			<meta name="theme-color" content="<?php echo esc_attr( Jetpack_PWA_Helpers::get_theme_color() ); ?>">
		<?php
	}

	public function get_manifest_url() {
		return add_query_arg(
			self::PWA_MANIFEST_QUERY_VAR, '1', home_url()
		);
	}

	function render_manifest_json() {
		// Do not load manifest in multiple locations
		if ( is_front_page() && isset( $_GET[ self::PWA_MANIFEST_QUERY_VAR ] ) && $_GET[ self::PWA_MANIFEST_QUERY_VAR ] ) {
			@ini_set( 'display_errors', false ); // Display errors can cause the XML to be not well formed.

			$theme_color = Jetpack_PWA_Helpers::get_theme_color();

			$manifest = array(
				'name'       => get_bloginfo( 'name' ),
				'start_url'  => get_home_url(),
				'short_name' => substr( get_bloginfo( 'name' ), 0, 12 ),
				'display'    => 'standalone',
				'background_color' => $theme_color,
				'theme_color'      => $theme_color,
			);

			if ( $description = get_bloginfo( 'description' ) ) {
				$manifest['description'] = $description;
			}

			$manifest['icons'] = array_map(
				array( $this, 'build_icon_object' ),
				Jetpack_PWA_Helpers::get_default_manifest_icon_sizes()
			);

			/**
			 * Allow overriding the manifest.
			 *
			 * @since 5.6.0
			 *
			 * @param array $manifest
			 */
			$manifest = apply_filters( 'jetpack_pwa_manifest', $manifest );

			wp_send_json( $manifest );
		}
	}

	function build_icon_object( $size ) {
		return array(
			'src' => Jetpack_PWA_Helpers::site_icon_url( $size ),
			'sizes' => sprintf( '%1$dx%1$d', $size ),
		);
	}
}
