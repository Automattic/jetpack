<?php
/*
Plugin Name: Custom Colors
Plugin URI: http://automattic.com/
Description: Part of the WordPress.com Custom Design upgrade, this plugin allows you to easily add a customized color palette and background pattern to your blog.
Version: 1.1
Author: Automattic
Author URI: http://automattic.com/
License: GNU General Public License v2 or later
License URI: http://www.gnu.org/licenses/gpl-2.0.html
*/


class Colors_Manager {

	protected static $colors = array();
	protected static $default_colors = array();
	protected static $text_colors = array();
	protected static $extra_colors = array();
	protected static $labels = array();
	protected static $color_palettes = array();

	/**
	 * Themes that will never support Custom Colors.
	 *
	 * Criteria for not supporting:
	 * 1. Two years or older and not in the top 50 is usage.
	 * 2. Not a good match because of odd use of colors or images.
	 * 3. Retired, ignored, and mobile.
	 *
	 * @var array
	 */
	protected static $never_support = array(
		'pub/almost-spring',
		'pub/banana-smoothie',
		'pub/blue-green',
		'pub/classic',
		'pub/connections',
		'pub/dark-wood',
		'pub/daydream',
		'pub/duotone',
		'pub/dusk',
		'pub/duster',
		'pub/emire',
		'pub/fadtastic',
		'pub/fauna',
		'pub/fleur',
		'pub/flower-power',
		'pub/fresh-bananas',
		'pub/fusion',
		'pub/green-marinee',
		'pub/grid-focus',
		'pub/hemingway',
		'pub/jentri',
		'pub/journalist-13',
		'pub/k2',
		'pub/kubrick',
		'pub/light',
		'pub/minileven',
		'pub/monotone',
		'pub/neat',
		'pub/neo-sapien-05',
		'pub/notesil',
		'pub/ocadia',
		'pub/pool',
		'pub/prologue',
		'pub/quentin',
		'pub/redoable-lite',
		'pub/rounded',
		'pub/rubric',
		'pub/sandbox',
		'pub/sandbox-10',
		'pub/sandbox-16',
		'pub/sandbox-161',
		'pub/sandbox-162',
		'pub/sapphire',
		'pub/silver-black',
		'pub/solipsus',
		'pub/steira',
		'pub/sunburn',
		'pub/supposedly-clean',
		'pub/sweet-blossoms',
		'pub/tarski',
		'pub/thirteen',
		'pub/toni',
		'pub/toolbox',
		'pub/treba',
		'pub/twenty-eight',
		'pub/under-the-influence',
		'pub/unsleepable',
		'pub/vermilion-christmas',
		'pub/whiteasmilk',
		'pub/wp-mobile',
		'pub/wptouch',
		'pub/_s',
	);

	public static function init() {
		if ( ! apply_filters( 'enable_custom_customizer', true ) ) {
			return;
		}

		if ( self::theme_has_set_colors() ) {
			self::override_themecolors();
			add_filter( 'body_class', array( __CLASS__, 'body_class' ) );
			add_action( 'wp_head', array( __CLASS__, 'print_theme_css' ) );
		}
	}

	/**
	 * A helper function to pick an unspecified theme based on the current context.
	 * @param  boolean|string $theme A theme that, if false, the function will specify
	 * @return string         The theme.
	 */
	protected static function pick_theme( $theme = false ) {
		if ( false !== $theme )
			return $theme;

		$theme = get_option( 'stylesheet' );

		// In an Ajax call from the Customizer, we might be previewing a separate theme.
		// Detect that and use it if it's there.
		if ( defined( 'DOING_AJAX' ) && DOING_AJAX ) {
			$parsed_url = parse_url( $_SERVER['HTTP_REFERER'] );
			if ( $parsed_url && ! isset( $parsed_url['query'] ) )
				return $theme;
			wp_parse_str( $parsed_url['query'], $query_parts );
			if ( isset( $query_parts['theme'] ) )
				return $query_parts['theme'];
		}
		return $theme;
	}

	/**
	 * Does the theme have annotations? Will load them as well.
	 * @return boolean theme has annotations
	 */
	static function has_annotations( $theme = false ) {
		// if we're not gonna support it, avoid the filesys hit
		if ( self::will_never_support( $theme ) )
			return false;
		// if $colors is populated, we've run some add_color_rule calls.
		// but skip if we directly asked for a theme to avoid false positives
		if ( ! $theme && ! empty( self::$colors ) )
			return true;
		// if we called a direct string, we probably don't want to actually load them
		if ( $theme ) {
			$file = get_stylesheet_directory() . '/inc/wpcom-colors.php';
			return is_readable( $file );
		}
		// try to load annotations, which returns status of finding them.
		return self::load_annotations( $theme );
	}

	/**
	 * Do we have colors to work with?
	 * @return boolean active state
	 */
	static function theme_has_set_colors() {
		$opts = get_theme_mod( 'colors_manager', array( 'colors' => false ) );

		if ( ! isset( $opts['colors'] ) ) {
			return false;
		}

		$opts = $opts['colors'];
		// need the softer non-equal on the last in case keys are in different order.
		return self::has_annotations() && ( bool ) $opts && $opts != self::get_default_colors();
	}

	/**
	 * Will the theme never support Custom Colors?
	 * @param  boolean|string $theme Optional theme slug. Uses current theme by default.
	 * @return boolean
	 */
	static function will_never_support( $theme = false ) {
		$theme = self::pick_theme( $theme );
		return in_array( $theme, self::$never_support );
	}

	/**
	 * Add a 'custom-colors' body class to blogs with Custom Colors active
	 */
	static function body_class( $classes ) {
		// filter was only activated if theme had set colors
		// if ( CustomDesign::is_upgrade_active() || CustomDesign::is_previewing() ) {
		// 	$classes[] = 'custom-colors';
		// }

		array_push( $classes, 'custom-colors' );
		return $classes;
	}

	public static function get_default_colors() {
		return self::$default_colors;
	}

	static function is_same_color( $a, $b ) {
		$a = trim( strtolower( $a ), ' #' );
		$b = trim( strtolower( $b ), ' #' );
		return $a == $b;
	}

	static function is_default_palette( $colors ) {
		// a saved palette may have more colors than the default palette. So,
		// iterate over the default palette
		foreach ( self::$default_colors as $id => $default_color ) {
			if ( ! isset( $colors[ $id ] ) ) {
				return false;
			}
			if ( ! self::is_same_color( $default_color, $colors[ $id ] ) ) {
				return false;
			}
		}
		return true;
	}

	public static function should_enable_colors() {
		$opts = get_theme_mod( 'colors_manager', array( 'colors' => false ) );
		if ( ! $opts['colors'] )
			return false;

		$colors = $opts['colors'];

		// If we managed to save the default palette, bail. It does not actually render
		// the same thing as the theme's default style
		if ( self::is_default_palette( $colors ) ) {
			return false;
		}

		// Only featured palettes in free mode
		// if ( self::is_free_mode() && ! self::is_featured_palette( $colors ) ) {
		// 	return false;
		// }

		return apply_filters( 'custom_colors_enable', true );
	}

	static function override_themecolors() {
		global $themecolors;

		if ( ! self::should_enable_colors() ) {
			return;
		}

		if ( ! isset( $opts ) ) {
			return;
		}

		$colors = $opts['colors'];

		$colors['border'] = $colors['fg1'];
		$colors['url'] = $colors['link'];
		$colors['text'] = $colors['txt'];

		unset( $colors['fg1'] );
		unset( $colors['fg2'] );
		unset( $colors['txt'] );

		foreach ( $colors as $role => $color ) {
			if ( $color )
				$themecolors[$role] = substr( $color, 1 );
		}
	}

	static function print_theme_css() {
		if ( ! self::should_enable_colors() ) {
			return;
		}
		$css = self::get_theme_css();
		echo '<style type="text/css" id="custom-colors-css">' . "{$css}</style>\n";
	}

	static function get_theme_css() {
		$opts = get_theme_mod( 'colors_manager', array( 'colors' => false, 'cached' => false ) );

		if ( ! empty( $opts['cached'] ) ) {
			return $opts['cached'];
		}

		$colors = $opts['colors'];

		// extra colors/CSS: always on
		$css = self::get_extra_css();

		// user colors
		foreach ( self::$colors as $cat => $rules ) {
			if ( ! isset( $colors[ $cat ] ) ) {
				continue;
			}

			$color = $colors[ $cat ];
			foreach ( $rules as $rule ) {
				$css .= self::css_rule( $rule, $color );
			}
		}

		// minify & cache for future use
		require_once( __DIR__ . '/cssmin.php' );
		$minifier = new CSSmin();
		$css = $minifier->run( $css );

		$opts['cached'] = $css;
		set_theme_mod( 'colors_manager', $opts );

		return $css;
	}

	/**
	 * Function for making theme annotations.
	 * @param string $category The color category. One of bg, txt, link, fg1, fg2
	 * @param string $default_color The default color for this category.
	 * @param array $rules Array of rule arrays. $rule: array( selector, property, opacity );
	 * @param string $selector CSS selector the color category will change
	 * @param string $property The CSS property the CSS selector will set.
	 * @param float $opacity Optional, default 1. Values < 1 will set as rgba, with #hex fallbacks for dumb browsers.
	 * @param bool|string $label Optional. A UI helper label for identifying what a particular color
	 *        will change in the theme.
	 */
	public static function add_color_rule( $category, $default_color, $rules, $label = false ) {
		// extra rules
		if ( 'extra' === $category ) {
			self::$extra_colors[] = array( 'color' => $default_color, 'rules' => $rules );
			return;
		}
		//prime it
		if ( ! isset( self::$colors[$category] ) )
			self::$colors[$category] = array();
		self::$colors[$category] = array_merge( self::$colors[$category], $rules );

		self::$default_colors[$category] = $default_color;
		if ( $label )
			self::$labels[$category] = $label;
	}

	/**
	 * Allow a theme to declare its own color palettes.
	 * @param array $palette An array with 5 colors.
	 */
	public static function add_color_palette( $palette, $title = false ) {
		if ( ! $title ) {
			$theme = wp_get_theme();
			$title = sprintf(
				__( '%s Alternative Scheme %s' ),
				$theme->display( 'Name' ),
				count( self::$color_palettes ) + 1
			);
		}

		$id = sanitize_title_with_dashes( $title );

		self::$color_palettes[ $id ] = compact( 'title', 'palette' );
	}

	/**
	 * Loads theme annotations, and filter them if loaded.
	 * @param  boolean $theme Which theme to check for annotations on. Defaults to current theme.
	 * @return boolean Theme has annotations.
	 */
	protected static function load_annotations( $theme = false ) {
		$theme_name = self::pick_theme( $theme );
		$annotations_file = get_stylesheet_directory() . '/inc/wpcom-colors.php';
		self::prime_color_labels();
		if ( is_readable( $annotations_file ) ) {
			require_once( $annotations_file );
			self::$colors = apply_filters( 'custom_colors_rules', self::$colors, $theme_name );
			self::handle_unset_colors();
			return true;
		}
		return false;
	}

	protected static function handle_unset_colors() {
		foreach( self::$colors as $key => $value ) {
			if ( empty( $value ) ) {
				// set Label to Unused
				self::$labels[$key] = __( 'Unused' );
				unset( self::$colors[$key] );
			}
		}
	}

	/**
	 * Sets default, i10n-ized default color labels that can be overridden in annotations.
	 */
	protected static function prime_color_labels() {
		if ( ! empty( self::$labels ) )
			return;

		self::$labels = array(
			'bg' => __( 'Background' ),
			'txt' => __( 'Headings' ),
			'link' => __( 'Links' ),
			'fg1' => __( 'Accent #1' ),
			'fg2' => __( 'Accent #2' )
		);
	}
}

function add_color_rule( $category, $default_color, $rules, $label = false ) {
	Colors_Manager::add_color_rule( $category, $default_color, $rules, $label );
}

function add_color_palette( $palette, $title = false ) {
	return Colors_Manager::add_color_palette( $palette, $title );
}

add_action( 'init', array( 'Colors_Manager', 'init' ) );

