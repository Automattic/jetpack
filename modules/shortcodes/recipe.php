<?php

/**
 * Embed recipe 'cards' in post, with basic styling and print functionality
 *
 * To Do
 * - defaults settings
 * - basic styles/themecolor styles
 * - validation/sanitization
 * - print styles
 */
class Jetpack_Recipes {

	private $scripts_and_style_included = false;

	function __construct() {
		add_action( 'init', array( $this, 'action_init' ) );

		// Add itemprop to allowed tags for wp_kses_post, so we can use it for better Schema compliance.
		global $allowedposttags;
		$tags = array( 'li', 'ol', 'img' );
		foreach ( $tags as $tag ) {
			if ( ! is_array( $allowedposttags[ $tag ] ) ) {
				$allowedposttags[ $tag ] = array();
			}
			$allowedposttags[ $tag ]['itemprop'] = array();
		}
	}

	function action_init() {
		// Enqueue styles if [recipe] exists
		add_action( 'wp_head', array( $this, 'add_scripts' ), 1 );

		// Render [recipe], along with other shortcodes that can be nested within.
		add_shortcode( 'recipe', array( $this, 'recipe_shortcode' ) );
		add_shortcode( 'recipe-notes', array( $this, 'recipe_notes_shortcode' ) );
		add_shortcode( 'recipe-ingredients', array( $this, 'recipe_ingredients_shortcode' ) );
		add_shortcode( 'recipe-directions', array( $this, 'recipe_directions_shortcode' ) );
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

		if ( is_rtl() ) {
			wp_enqueue_style( 'jetpack-recipes-style', plugins_url( '/css/rtl/recipes-rtl.css', __FILE__ ), array(), '20130919' );
		} else {
			wp_enqueue_style( 'jetpack-recipes-style', plugins_url( '/css/recipes.css', __FILE__ ), array(), '20130919' );
		}

		wp_add_inline_style( 'jetpack-recipes-style', self::themecolor_styles() ); // add $themecolors-defined styles

		wp_enqueue_script( 'jetpack-recipes-printthis', plugins_url( '/js/recipes-printthis.js', __FILE__ ), array( 'jquery' ), '20131230' );
		wp_enqueue_script( 'jetpack-recipes-js',        plugins_url( '/js/recipes.js', __FILE__ ), array( 'jquery', 'jetpack-recipes-printthis' ), '20131230' );

		$title_var     = wp_title( '|', false, 'right' );
		$print_css_var = plugins_url( '/css/recipes-print.css', __FILE__ );

		wp_localize_script( 'jetpack-recipes-js', 'jetpack_recipes_vars', array( 'pageTitle' => $title_var, 'loadCSS' => $print_css_var ) );
	}

	/**
	 * Our [recipe] shortcode.
	 * Prints recipe data styled to look good on *any* theme.
	 *
	 * @return string HTML for recipe shortcode.
	 */
	static function recipe_shortcode( $atts, $content = '' ) {
		$atts = shortcode_atts(
			array(
				'title'       => '', //string
				'servings'    => '', //intval
				'time'        => '', //string
				'difficulty'  => '', //string
				'print'       => '', //string
				'image'       => '', //string
				'description' => '', //string
			), $atts, 'recipe'
		);

		return self::recipe_shortcode_html( $atts, $content );
	}

	/**
	 * The recipe output
	 *
	 * @return string HTML output
	 */
	static function recipe_shortcode_html( $atts, $content = '' ) {
		// Add itemprop to allowed tags for wp_kses_post, so we can use it for better Schema compliance.
		global $allowedtags;
		$allowedtags['li'] = array( 'itemprop' => array () );

		$html = '<div class="hrecipe jetpack-recipe" itemscope itemtype="http://schema.org/Recipe">';

		// Print the recipe title if exists
		if ( '' !== $atts['title'] ) {
			$html .= '<h3 class="jetpack-recipe-title" itemprop="name">' . esc_html( $atts['title'] ) . '</h3>';
		}

		// Print the recipe meta if exists
		if ( '' !== $atts['servings'] || '' != $atts['time'] || '' != $atts['difficulty'] || '' != $atts['print'] ) {
			$html .= '<ul class="jetpack-recipe-meta">';

			if ( '' !== $atts['servings'] ) {
				$html .= sprintf(
					'<li class="jetpack-recipe-servings" itemprop="recipeYield"><strong>%1$s: </strong>%2$s</li>',
					esc_html_x( 'Servings', 'recipe', 'jetpack' ),
					esc_html( $atts['servings'] )
				);
			}

			if ( '' !== $atts['time'] ) {
				$html .= sprintf(
					'<li class="jetpack-recipe-time" itemprop="totalTime"><strong>%1$s: </strong>%2$s</li>',
					esc_html_x( 'Time', 'recipe', 'jetpack' ),
					esc_html( $atts['time'] )
				);
			}

			if ( '' !== $atts['difficulty'] ) {
				$html .= sprintf(
					'<li class="jetpack-recipe-difficulty"><strong>%1$s: </strong>%2$s</li>',
					esc_html_x( 'Difficulty', 'recipe', 'jetpack' ),
					esc_html( $atts['difficulty'] )
				);
			}

			if ( 'false' !== $atts['print'] ) {
				$html .= sprintf(
					'<li class="jetpack-recipe-print"><a href="#">%1$s</a></li>',
					esc_html_x( 'Print', 'recipe', 'jetpack' )
				);
			}

			$html .= '</ul>';
		}

		// Output the image, if we have one.
		if ( '' !== $atts['image'] ) {
			$html .= sprintf(
				'<img class="jetpack-recipe-image" itemprop="thumbnailUrl" src="%1$s" />',
				esc_url( $atts['image'] )
			);
		}

		// Output the description, if we have one.
		if ( '' !== $atts['description'] ) {
			$html .= sprintf(
				'<p class="jetpack-recipe-description">%1$s</p>',
				esc_html( $atts['description'] )
			);
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

	/**
	 * Our [recipe-notes] shortcode.
	 * Outputs notes, styled in a div.
	 *
	 * @return string HTML for recipe notes shortcode.
	 */
	static function recipe_notes_shortcode( $atts, $content = '' ) {
		$atts = shortcode_atts( array(
			'title' => '', //string
		), $atts, 'recipe-notes' );

		$html ='';

		// Print a title if one exists.
		if ( '' !== $atts['title'] ) {
			$html .= '<h4 class="jetpack-recipe-notes-title">' . esc_html( $atts['title'] ) . '</h4>';
		}

		$html .= '<div class="jetpack-recipe-notes">';

		// Format content using list functionality, if desired.
		$html .= self::output_list_content( $content, 'notes' );

		$html .= '</div>';

		// Sanitize html.
		$html = wp_kses_post( $html );

		// Return the HTML block.
		return $html;
	}

	/**
	 * Our [recipe-ingredients] shortcode.
	 * Outputs notes, styled in a div.
	 *
	 * @return string HTML for recipe ingredients shortcode.
	 */
	static function recipe_ingredients_shortcode( $atts, $content = '' ) {
		$atts = shortcode_atts( array(
			'title' => esc_html_x( 'Ingredients', 'recipe', 'jetpack' ), //string
		), $atts, 'recipe-ingredients' );

		$html = '<div class="jetpack-recipe-ingredients">';

		// Print a title unless the user has opted to exclude it.
		if ( 'false' !== $atts['title'] ) {
			$html .= '<h4 class="jetpack-recipe-ingredients-title">' . esc_html( $atts['title'] ) . '</h4>';
		}

		// Format content using list functionality.
		$html .= self::output_list_content( $content, 'ingredients' );

		$html .= '</div>';

		// Sanitize html.
		$html = wp_kses_post( $html );

		// Return the HTML block.
		return $html;
	}

	/**
	 * Reusable function to check for shortened formatting.
	 * Basically, users can create lists with the following shorthand:
	 * - item one
	 * - item two
	 * - item three
	 * And we'll magically convert it to a list. This has the added benefit
	 * of including itemprops for the recipe schema.
	 *
	 * @return string content formatted as a list item
	 */
	static function output_list_content( $content, $type ) {
		$html ='';

		switch ( $type ) {
			case 'directions' :
				$list_item_replacement = '<li class="jetpack-recipe-directions">${1}</li>';
				$itemprop              = ' itemprop="recipeInstructions"';
				$listtype              = 'ol';
				break;
			case 'ingredients' :
				$list_item_replacement = '<li class="jetpack-recipe-ingredient">${1}</li>';
				$itemprop              = ' itemprop="recipeIngredient"';
				$listtype              = 'ul';
				break;
			default:
				$list_item_replacement = '<li class="jetpack-recipe-notes">${1}</li>';
				$itemprop              = '';
				$listtype              = 'ul';
		}

		// Check to see if the user is trying to use shortened formatting.
		if (
			strpos( $content, '&#8211;' ) !== false ||
			strpos( $content, '&#8212;' ) !== false ||
			strpos( $content, '-' )       !== false ||
			strpos( $content, '*' )       !== false ||
			strpos( $content, '#' )       !== false ||
			strpos( $content, '–' )   !== false || // ndash
			strpos( $content, '—' )   !== false || // mdash
			preg_match( '/\d+\.\s/', $content )
		) {
			// Remove breaks and extra whitespace
			$content = str_replace( "<br />\n", "\n", $content );
			$content = trim( $content );

			$ul_pattern = '/(?:^|\n|\<p\>)+(?:[\-–—]+|\&#8211;|\&#8212;|\*)+\h+(.*)/mi';
			$ol_pattern = '/(?:^|\n|\<p\>)+(?:\d+\.|#+)+\h+(.*)/mi';

			preg_match_all( $ul_pattern, $content, $ul_matches );
			preg_match_all( $ol_pattern, $content, $ol_matches );

			if ( 0 !== count( $ul_matches[0] ) || 0 !== count( $ol_matches[0] ) ) {

				if ( 0 !== count( $ol_matches[0] ) ) {
					$listtype = 'ol';
					$list_item_pattern = $ol_pattern;
				} else {
					$listtype = 'ul';
					$list_item_pattern = $ul_pattern;
				}
				$html .= '<' . $listtype . $itemprop . '>';
				$html .= preg_replace( $list_item_pattern, $list_item_replacement, $content );
				$html .= '</' . $listtype . '>';

				// Strip out any empty <p> tags and stray </p> tags, because those are just silly.
				$empty_p_pattern = '/(<p>)*\s*<\/p>/mi';
				$html = preg_replace( $empty_p_pattern, '', $html );
			} else {
				$html .= do_shortcode( $content );
			}
		} else {
			$html .= do_shortcode( $content );
		}

		// Return our formatted content.
		return $html;
	}

	/**
	 * Our [recipe-directions] shortcode.
	 * Outputs notes, styled in a div.
	 *
	 * @return string HTML for recipe notes shortcode.
	 */
	static function recipe_directions_shortcode( $atts, $content = '' ) {
		$atts = shortcode_atts( array(
				'title' => esc_html_x( 'Directions', 'recipe', 'jetpack' ), //string
		), $atts, 'recipe-directions' );

		$html = '<div class="jetpack-recipe-directions">';

		// Print a title unless the user has specified to exclude it.
		if ( 'false' !== $atts['title'] ) {
			$html .= '<h4 class="jetpack-recipe-directions-title">' . esc_html( $atts['title'] ) . '</h4>';
		}

		// Format content using list functionality.
		$html .= self::output_list_content( $content, 'directions' );

		$html .= '</div>';

		// Sanitize html.
		$html = wp_kses_post( $html );

		// Return the HTML block.
		return $html;
	}

	/**
	 * Use $themecolors array to style the Recipes shortcode
	 *
	 * @print style block
	 * @return string $style
	 */
	function themecolor_styles() {
		global $themecolors;
		$style = '';

		if ( isset( $themecolors ) ) {
			$style .= '.jetpack-recipe { border-color: #' . esc_attr( $themecolors['border'] ) . '; }';
			$style .= '.jetpack-recipe-title { border-bottom-color: #' . esc_attr( $themecolors['link'] ) . '; }';
		}

		return $style;
	}

}

new Jetpack_Recipes();
