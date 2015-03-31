<?php
/**
 * Embed recipe 'cards' in post, with basic styling and print functionality
 *
 */

class Jetpack_Recipes {

	private $scripts_and_style_included = false;

	function __construct() {
		add_action( 'init', array( $this, 'action_init' ) );
	}

	function action_init() {
		// Enqueue styles if [recipe] exists
		add_action( 'wp_head', array( $this, 'add_scripts' ), 1 );

		// Render [recipe]
		add_shortcode( 'recipe', array( $this, 'recipe_shortcode' ) );
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

		if( is_rtl() ) {
			wp_enqueue_style( 'jetpack-recipes-style',  plugins_url( '/css/rtl/recipes-rtl.css',  __FILE__ ), array(), '20130919' );
		} else {
			wp_enqueue_style( 'jetpack-recipes-style',  plugins_url( '/css/recipes.css',  __FILE__ ), array(), '20130919' );
		}


		wp_enqueue_script( 'jetpack-recipes-printthis', plugins_url( '/js/recipes-printthis.js', __FILE__ ), array( 'jquery' ), '20131230' );
		wp_enqueue_script( 'jetpack-recipes-js',        plugins_url( '/js/recipes.js', __FILE__ ),   array( 'jquery', 'jetpack-recipes-printthis' ), '20131230' );

		$title_var = wp_title( '|', false, 'right' );
		$print_css_var = plugins_url( '/css/recipes-print.css', __FILE__ );

		wp_localize_script( 'jetpack-recipes-js', 'jetpack_recipes_vars', array(
			'pageTitle' => $title_var,
			'loadCSS'   => $print_css_var
		) );
	}

	/**
	 * Our [recipe] shortcode.
	 * Prints recipe data styled to look good on *any* theme.
	 *
	 * @return resume_shortcode_html
	 */
	static function recipe_shortcode( $atts, $content = '' ) {
		$atts = shortcode_atts( array(
			'title'      => '', //string
			'servings'   => '', //intval
			'time'       => '', //string
			'difficulty' => '', //string
			'print'      => '', //string
		), $atts, 'recipe' );

		return self::recipe_shortcode_html( $atts, $content );
	}

	/**
	 * The recipe output
	 *
	 * @return Html
	 */
	static function recipe_shortcode_html( $atts, $content = '' ) {
		$html = false;

		$html = '<div class="hrecipe jetpack-recipe" itemscope itemtype="http://schema.org/Recipe">';

		// Print the recipe title if exists
		if ( '' != $atts['title'] ) {
			$html .= '<h3 class="jetpack-recipe-title" itemprop="name">' . esc_html( $atts['title'] ) . '</h3>';
		}

		// Print the recipe meta if exists
		if ( '' != $atts['servings'] || '' != $atts['time'] || '' != $atts['difficulty'] || '' != $atts['print'] ) {
			$html .= '<ul class="jetpack-recipe-meta">';

			if ( '' != $atts['servings'] ) {
				$html .= sprintf( '<li class="jetpack-recipe-servings" itemprop="recipeYield"><strong>%1s: </strong>%2s</li>',
					__( 'Servings', 'jetpack' ),
					esc_html( $atts['servings'] )
				);
			}

			if ( '' != $atts['time'] ) {
				$html .= sprintf( '<li class="jetpack-recipe-time" itemprop="totalTime"><strong>%1s: </strong>%2s</li>',
					__( 'Time', 'jetpack' ),
					esc_html( $atts['time'] )
				);
			}

			if ( '' != $atts['difficulty'] ) {
				$html .= sprintf( '<li class="jetpack-recipe-difficulty"><strong>%1s: </strong>%2s</li>',
					__( 'Difficulty', 'jetpack' ),
					esc_html( $atts['difficulty'] )
				);
			}

			if ( 'false' != $atts['print'] ) {
				$html .= sprintf( '<li class="jetpack-recipe-print"><a href="#">%1s</a></li>',
					__( 'Print', 'jetpack' )
				);
			}

			$html .= '</ul>';
		}

		// Print content between codes
		$html .= '<div class="jetpack-recipe-content">' . do_shortcode( $content ) . '</div>';

		// Close it up
		$html .= '</div>';

		// If there is a recipe within a recipe, remove the shortcode
		if ( has_shortcode( $html, 'recipe' ) ) {
			remove_shortcode( 'recipe' );
		}

		// Sanitize html
		$html = wp_kses_post( $html );

		// Return the HTML block
		return $html;
	}
}

new Jetpack_Recipes();
