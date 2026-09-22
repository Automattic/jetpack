<?php
/**
 * Jetpack_Google_Font_Face class
 *
 * @package automattic/jetpack
 */

/**
 * Prints used legacy catalogue faces while native font printers handle theme and user fonts.
 *
 * @phan-constructor-used-for-side-effects
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
		// Retire the legacy printer while keeping native font-face printing.
		add_action( 'wp_loaded', array( $this, 'wp_loaded' ) );
		add_action( 'current_screen', array( $this, 'current_screen' ), 10 );

		// Collect and print fonts in use
		if ( wp_is_block_theme() ) {
			add_action( 'wp_head', array( $this, 'print_font_faces' ), 50 );
		} else {
			// In classic themes wp_head runs before the blocks are processed to collect the block fonts.
			add_action( 'wp_footer', array( $this, 'print_font_faces' ), 50 );
		}
		add_filter( 'pre_render_block', array( $this, 'collect_block_fonts' ), 10, 2 );
	}

	/**
	 * Turn off the legacy webfonts printer on the frontend.
	 */
	public function wp_loaded() {
		remove_action( 'wp_head', 'wp_print_fonts', 50 );
	}

	/**
	 * Turn off hooks to print fonts on wp-admin, except for GB editor pages.
	 */
	public function current_screen() {
		remove_action( 'admin_print_styles', 'wp_print_fonts', 50 );

		if ( ! $this->is_block_editor() ) {
			remove_action( 'admin_print_styles', 'wp_print_font_faces', 50 );
		}
	}

	/**
	 * Print fonts that are used in global styles or block-level settings.
	 */
	public function print_font_faces() {
		if ( jetpack_google_fonts_load_font_faces() ) {
			return;
		}

		$this->collect_global_styles_fonts();
		$fonts_in_use = array_fill_keys( $this->fonts_in_use, true );
		if ( empty( $fonts_in_use ) ) {
			return;
		}

		$settings        = function_exists( 'gutenberg_get_global_settings' )
			? gutenberg_get_global_settings()
			: wp_get_global_settings();
		$native_slugs    = array();
		$native_families = array();
		foreach ( $settings['typography']['fontFamilies'] ?? array() as $origin => $families ) {
			foreach ( $families as $family ) {
				if ( 'default' === $origin && empty( $family['fontFace'] ) ) {
					continue;
				}
				if ( empty( $family['fontFamily'] ) ) {
					continue;
				}
				$key = $this->format_font( self::get_font_family_name( $family ) );
				if ( ! empty( $family['slug'] ) ) {
					$native_slugs[ $this->format_font( $family['slug'] ) ] = $key;
				}
				if ( ! empty( $family['fontFace'] ) ) {
					$native_families[ $key ] = true;
				}
			}
		}

		// Presets without their own faces can still refer to a legacy catalogue family.
		$fonts_in_use = array_fill_keys(
			array_map(
				static function ( $font ) use ( $native_slugs ) {
					return $native_slugs[ $font ] ?? $font;
				},
				array_keys( $fonts_in_use )
			),
			true
		);

		$data = jetpack_get_google_fonts_data();
		if ( empty( $data['fontFamilies'] ) ) {
			return;
		}
		$available_fonts = jetpack_get_available_google_fonts_map( $data );
		$fonts_to_print  = array();
		foreach ( $data['fontFamilies'] as $family ) {
			if ( empty( $available_fonts[ $family['name'] ] ) || empty( $family['fontFace'] ) ) {
				continue;
			}

			$name = self::get_font_family_name( $family );
			$key  = $this->format_font( $name );
			$slug = $this->format_font( $family['slug'] );
			// Native sources and presets that replace this family take precedence.
			if ( isset( $native_families[ $key ] ) || ( isset( $native_slugs[ $slug ] ) && $native_slugs[ $slug ] !== $key ) ) {
				continue;
			}
			if ( ! isset( $fonts_in_use[ $slug ] ) && ! isset( $fonts_in_use[ $key ] ) ) {
				continue;
			}

			$faces = array();
			foreach ( $family['fontFace'] as $face ) {
				$face['font-family'] = $name;
				if ( ! empty( $face['src'] ) ) {
					$face['src'] = array_map(
						static function ( $src ) {
							return str_starts_with( $src, 'file:./' ) ? get_theme_file_uri( substr( $src, 7 ) ) : $src;
						},
						(array) $face['src']
					);
				}
				$converted = array();
				foreach ( $face as $property => $value ) {
					$converted[ _wp_to_kebab_case( $property ) ] = $value;
				}
				$faces[] = $converted;
			}
			$fonts_to_print[] = $faces;
		}

		if ( ! empty( $fonts_to_print ) ) {
			wp_print_font_faces( $fonts_to_print );
		}
	}

	/**
	 * Collect fonts used for global styles settings.
	 */
	public function collect_global_styles_fonts() {
		$global_styles = function_exists( 'gutenberg_get_global_styles' )
			? gutenberg_get_global_styles()
			: wp_get_global_styles();

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
		if ( is_string( $font_slug ) ) {
			$this->fonts_in_use[] = $this->format_font( $font_slug );
		}
	}

	/**
	 * Format the given font slug.
	 *
	 * @example "ABeeZee" formats to "abeezee"
	 * @example "ADLaM Display" formats to "adlam-display"
	 * @param string $font_slug The font slug.
	 * @return string The formatted font slug.
	 */
	public function format_font( $font_slug ) {
		return _wp_to_kebab_case( strtolower( $font_slug ) );
	}

	/**
	 * Get the font slug aliases that maps the font slug to the font family if they are different.
	 *
	 * The font definition may define an alias slug name, so we have to add the map from the slug name to the font family.
	 * See https://github.com/WordPress/twentytwentyfour/blob/df92472089ede6fae5924c124a93c843b84e8cbd/theme.json#L215.
	 */
	public function get_font_slug_aliases() {
		$font_slug_aliases = array();

		$theme_json = WP_Theme_JSON_Resolver::get_theme_data();
		$raw_data   = $theme_json->get_data();
		if ( ! empty( $raw_data['settings']['typography']['fontFamilies'] ) ) {
			foreach ( $raw_data['settings']['typography']['fontFamilies'] as $font ) {
				if ( ! isset( $font['fontFamily'] ) ) {
					continue;
				}
				$font_family_name = $this->format_font( $this->get_font_family_name( $font ) );
				$font_slug        = $font['slug'] ?? '';
				if ( $font_slug && $font_slug !== $font_family_name && ! array_key_exists( $font_slug, $font_slug_aliases ) ) {
					$font_slug_aliases[ $font_slug ] = $font_family_name;
				}
			}
		}

		return $font_slug_aliases;
	}

	/**
	 * Get the font family name from a font.
	 *
	 * @param array $font The font definition object.
	 */
	public static function get_font_family_name( $font ) {
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

		// The font family may be a reference to a path to the value stored at that location,
		// e.g.: { "ref": "styles.elements.heading.typography.fontFamily" }.
		// Ignore it as we also get the value stored at that location from the setting.
		if ( ! is_string( $font_family ) ) {
			return null;
		}

		// A preset reference can include a var() fallback and a trailing font stack.
		preg_match( '/^\s*var\(\s*--wp--preset--font-family--(?P<slug>[^\s,()]+)\s*[,)]/', $font_family, $matches );

		if ( isset( $matches['slug'] ) ) {
			return $matches['slug'];
		}

		// Full string: var:preset|font-family|slug
		// We do not care about the origin of the font, only its slug.
		preg_match( '/^\s*var:preset\|font-family\|(?P<slug>[^\s,]+)/', $font_family, $matches );

		if ( isset( $matches['slug'] ) ) {
			return $matches['slug'];
		}

		return self::get_font_family_name( $setting['typography'] );
	}

	/**
	 * Check if the current screen is the block editor.
	 *
	 * @return bool
	 */
	public function is_block_editor() {
		if ( function_exists( 'get_current_screen' ) ) {
			$current_screen = get_current_screen();
			if ( ! empty( $current_screen ) && method_exists( $current_screen, 'is_block_editor' ) && $current_screen->is_block_editor() ) {
				return true;
			}
		}

		return false;
	}
}
