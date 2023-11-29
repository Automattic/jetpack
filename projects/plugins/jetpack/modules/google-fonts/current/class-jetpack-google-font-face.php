<?php
/**
 * Jetpack_Google_Font_Face class
 *
 * @package automattic/jetpack
 */

/**
 * Jetpack Google Font Face disables Font Face hooks in Core that prints **ALL** font faces.
 * Instead, it collects fonts that are used in global styles or block-level settings and
 * print those fonts in use.
 */
class Jetpack_Google_Font_Face {
	/**
	 * The fonts that are used in global styles or block-level settings.
	 *
	 * @var array
	 */
	private $fonts_in_use = array();

	/**
	 * The constructor.
	 */
	public function __construct() {
		// Turns off hooks to print fonts
		add_action( 'wp_loaded', array( $this, 'wp_loaded' ) );
		add_action( 'admin_init', array( $this, 'admin_init' ), 10 );

		// Collect and print fonts in use
		add_action( 'wp_head', array( $this, 'print_font_faces' ), 50 );
		add_filter( 'pre_render_block', array( $this, 'collect_block_fonts' ), 10, 2 );
	}

	/**
	 * Turn off hooks to print fonts on frontend
	 */
	public function wp_loaded() {
		remove_action( 'wp_head', 'wp_print_fonts', 50 );
		remove_action( 'wp_head', 'wp_print_font_faces', 50 );
	}

	/**
	 * Turn off hooks to print fonts on wp-admin
	 */
	public function admin_init() {
		remove_action( 'admin_print_styles', 'wp_print_fonts', 50 );
		remove_action( 'admin_print_styles', 'wp_print_font_faces', 50 );
	}

	/**
	 * Print fonts that are used in global styles or block-level settings.
	 */
	public function print_font_faces() {
		$fonts          = $this->get_fonts();
		$fonts_to_print = array();

		$this->collect_global_styles_fonts();
		$this->fonts_in_use = array_values( array_unique( $this->fonts_in_use, SORT_STRING ) );
		foreach ( $fonts as $font_family => $font_faces ) {
			if ( in_array( _wp_to_kebab_case( $font_family ), $this->fonts_in_use, true ) ) {
				$fonts_to_print[ $font_family ] = $font_faces;
			}
		}

		if ( ! empty( $fonts_to_print ) ) {
			wp_print_font_faces( $fonts_to_print );
		}
	}

	/**
	 * Collect fonts used for global styles settings.
	 */
	public function collect_global_styles_fonts() {
		$global_styles = wp_get_global_styles();

		$global_styles_font_slug = $this->get_font_slug_from_setting( $global_styles );
		if ( $global_styles_font_slug ) {
			$this->add_font( $global_styles_font_slug );
		}

		if ( isset( $global_styles['blocks'] ) ) {
			foreach ( $global_styles['blocks'] as $setting ) {
				$font_slug = $this->get_font_slug_from_setting( $setting );

				if ( $font_slug ) {
					$this->add_font( $font_slug );
				}
			}
		}

		if ( isset( $global_styles['elements'] ) ) {
			foreach ( $global_styles['elements'] as $setting ) {
				$font_slug = $this->get_font_slug_from_setting( $setting );

				if ( $font_slug ) {
					$this->add_font( $font_slug );
				}
			}
		}
	}

	/**
	 * Collect fonts used for block-level settings.
	 *
	 * @filter pre_render_block
	 *
	 * @param string|null $content The pre-rendered content. Default null.
	 * @param array       $parsed_block The block being rendered.
	 */
	public function collect_block_fonts( $content, $parsed_block ) {
		if ( ! is_admin() && isset( $parsed_block['attrs']['fontFamily'] ) ) {
			$block_font_family = $parsed_block['attrs']['fontFamily'];
			$this->add_font( $block_font_family );
		}

		return $content;
	}

	/**
	 * Add the specify font to the fonts_in_use list.
	 *
	 * @param string $font_slug The font slug.
	 */
	public function add_font( $font_slug ) {
		$this->fonts_in_use[] = _wp_to_kebab_case( $font_slug );
	}

	/**
	 * Get all font definitions from theme json.
	 */
	public function get_fonts() {
		$fonts = WP_Font_Face_Resolver::get_fonts_from_theme_json();

		// The font definition might define an alias slug name, so we have to add the map from the slug name to font faces.
		// See https://github.com/WordPress/twentytwentyfour/blob/df92472089ede6fae5924c124a93c843b84e8cbd/theme.json#L215.
		$theme_json = WP_Theme_JSON_Resolver::get_theme_data();
		$raw_data   = $theme_json->get_data();
		if ( ! empty( $raw_data['settings']['typography']['fontFamilies'] ) ) {
			foreach ( $raw_data['settings']['typography']['fontFamilies'] as $font ) {
				$font_family_name = $this->get_font_family_name( $font );
				$font_slug        = isset( $font['slug'] ) ? $font['slug'] : '';
				if ( $font_slug && ! array_key_exists( $font_slug, $fonts ) && array_key_exists( $font_family_name, $fonts ) ) {
					$fonts[ $font_slug ] = $fonts[ $font_family_name ];
				}
			}
		}

		return $fonts;
	}

	/**
	 * Get the font family name from a font.
	 *
	 * @param array $font The font definition object.
	 */
	public function get_font_family_name( $font ) {
		$font_family = $font['fontFamily'];
		if ( str_contains( $font_family, ',' ) ) {
			$font_family = explode( ',', $font_family )[0];
		}

		return trim( $font_family, "\"'" );
	}

	/**
	 * Get the font family slug from a settings array.
	 *
	 * @param array $setting The settings object.
	 *
	 * @return string|null
	 */
	public function get_font_slug_from_setting( $setting ) {
		if ( ! isset( $setting['typography']['fontFamily'] ) ) {
			return null;
		}

		$font_family = $setting['typography']['fontFamily'];

		// Full string: var(--wp--preset--font-family--slug).
		// We do not care about the origin of the font, only its slug.
		preg_match( '/font-family--(?P<slug>.+)\)$/', $font_family, $matches );

		if ( isset( $matches['slug'] ) ) {
			return $matches['slug'];
		}

		// Full string: var:preset|font-family|slug
		// We do not care about the origin of the font, only its slug.
		preg_match( '/font-family\|(?P<slug>.+)$/', $font_family, $matches );

		if ( isset( $matches['slug'] ) ) {
			return $matches['slug'];
		}

		return $font_family;
	}
}
