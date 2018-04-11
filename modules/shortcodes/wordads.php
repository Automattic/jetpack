<?php

/**
 * Embed WordAds 'add' in post
 *
 */
class Jetpack_WordAds_Shortcode {

	private $scripts_and_style_included = false;

	function __construct() {
		add_action( 'init', array( $this, 'action_init' ) );

		//add_filter( 'wp_kses_allowed_html', array( $this, 'add_recipes_kses_rules' ), 10, 2 );
	}

	/**
	 * Register our shortcode and enqueue necessary files.
	 */
	function action_init() {
		// Enqueue styles if [recipe] exists.
		// add_action( 'wp_head', array( $this, 'add_scripts' ), 1 );

		// Render [recipe], along with other shortcodes that can be nested within.
		add_shortcode( 'wordad', array( $this, 'wordads_shortcode' ) );
	}
	/**
	 * Enqueue scripts and styles
	 */
	function add_scripts() {
		if ( empty( $GLOBALS['posts'] ) || ! is_array( $GLOBALS['posts'] ) ) {
			return;
		}

		foreach ( $GLOBALS['posts'] as $p ) {
			if ( has_shortcode( $p->post_content, 'recipe' ) ) {
				$this->scripts_and_style_included = true;
				break;
			}
		}

		if ( ! $this->scripts_and_style_included ) {
			return;
		}

		wp_enqueue_style( 'jetpack-recipes-style', plugins_url( '/css/recipes.css', __FILE__ ), array(), '20130919' );
		wp_style_add_data( 'jetpack-recipes-style', 'rtl', 'replace' );

		// add $themecolors-defined styles.
		wp_add_inline_style( 'jetpack-recipes-style', self::themecolor_styles() );

		wp_enqueue_script(
			'jetpack-recipes-printthis',
			Jetpack::get_file_url_for_environment( '_inc/build/shortcodes/js/recipes-printthis.min.js', 'modules/shortcodes/js/recipes-printthis.js' ),
			array( 'jquery' ),
			'20170202'
		);

		wp_enqueue_script(
			'jetpack-recipes-js',
			Jetpack::get_file_url_for_environment( '_inc/build/shortcodes/js/recipes.min.js', 'modules/shortcodes/js/recipes.js' ),
			array( 'jquery', 'jetpack-recipes-printthis' ),
			'20131230'
		);

		$title_var     = wp_title( '|', false, 'right' );
		$rtl           = is_rtl() ? '-rtl' : '';
		$print_css_var = plugins_url( "/css/recipes-print{$rtl}.css", __FILE__ );

		wp_localize_script(
			'jetpack-recipes-js',
			'jetpack_recipes_vars',
			array(
				'pageTitle' => $title_var,
				'loadCSS' => $print_css_var,
			)
		);
	}

	/**
	 * Our [recipe] shortcode.
	 * Prints recipe data styled to look good on *any* theme.
	 *
	 * @param array  $atts    Array of shortcode attributes.
	 * @param string $content Post content.
	 *
	 * @return string HTML for recipe shortcode.
	 */
	static function wordads_shortcode( $atts, $content = '' ) {
		$atts = shortcode_atts(
			array(
			), $atts, 'wordads'
		);

		return self::wordads_shortcode_html( $atts, $content );
	}

	/**
	 * The recipe output
	 *
	 * @param array  $atts    Array of shortcode attributes.
	 * @param string $content Post content.
	 *
	 * @return string HTML output
	 */
	static function wordads_shortcode_html( $atts, $content = '' ) {
		global $wordads;

		if ( empty( $wordads ) ) {
			return __( '<div>The WordAds module is not active</div>' );
		}

		$html = '<div class="jetpack-wordad" itemscope itemtype="https://schema.org/WPAdBlock">';

		$html .= 'Here\'s your ad sir</div>';

		$html = $wordads->insert_ad( $html );

		return $html;
	}
}

new Jetpack_WordAds_Shortcode();
