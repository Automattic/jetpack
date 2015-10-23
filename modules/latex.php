<?php
/**
 * Module Name: Beautiful Math
 * Module Description: Use MathJax in posts and pages for complex equations and other geekery.
 * Sort Order: 12
 * First Introduced: 1.1
 * Requires Connection: No
 * Auto Activate: Yes
 * Module Tags: Writing
 * Additional Search Queries: latex, math, equation, equations, formula, code
 */

/**
 * LaTeX support.
 *
 * Backward compatibility requires support for both "[latex][/latex]", and
 * "$latex $" shortcodes.
 *
 * $latex e^{\i \pi} + 1 = 0$  ->  [latex]e^{\i \pi} + 1 = 0[/latex]
 * $latex [a, b]$              ->  [latex][a, b][/latex]
 */

class Jetpack_Latex {
	/**
	 * Singleton.
	 *
	 * @since 3.8.0
	 * @access private
	 * @var Jetpack_Latex
	 */
	private static $__instance = null;

	/**
	 * Whether or not MathJax.js has been output on the current page.
	 *
	 * @since 3.8.0
	 * @access private
	 * @var boolean
	 */
	private $has_output_scripts = false;

	/**
	 * Get singleton.
	 *
	 * @since 3.8.0
	 *
	 * @return Jetpack_Latex
	 */
	public static function instance() {
		if ( ! self::$__instance ) {
			self::$__instance = new self();
		}

		return self::$__instance;
	}

	/**
	 * Add actions, filters, and the shortcode for Latex.
	 *
	 * @since 3.8.0
	 */
	public function __construct() {
		add_action( 'wp_head', array( $this, 'latex_mathjax_config_output' ), 2 );
		add_action( 'wp_enqueue_scripts', array( $this, 'latex_enqueue_scripts' ) );

		add_filter( 'no_texturize_shortcodes', array( $this, 'latex_no_texturize' ) );

		add_filter( 'the_content', array( $this, 'latex_markup' ), 9 ); // before wptexturize
		add_filter( 'comment_text', array( $this, 'latex_markup' ), 9 ); // before wptexturize
		add_shortcode( 'latex', array( $this, 'latex_shortcode' ) );
	}

	/**
	 * MathJax configuration.
	 *
	 * In-line MathJax configuration options give us more granularity than simply
	 * picking one of the built-in configurations. It also makes it filterable.
	 *
	 * @since 3.8.0
	 *
	 * @link http://docs.mathjax.org/en/latest/configuration.html#using-in-line-configuration-options
	 *
	 * @return array
	 */
	public function latex_mathjax_config() {
		$config = array(
			// TeX-AMS_HTML.js allows math to be specified in TeX or LaTeX notation, with the AMSmath and AMSsymbols packages included, and produces output using the HTML-CSS output processor.
			'config' => array( 'TeX-AMS_HTML.js' ),
			'jax'    => array(
				'input/TeX',
				'output/HTML-CSS',
				'output/CommonHTML',
			),
			'extensions' => array(
				'tex2jax.js',
				'CHTML-preview.js',
				'Safe.js'
			),
			'TeX' => array(
				'extensions' => array(
					'AMSmath.js',
					'AMSsymbols.js',
				),
				'Macros' => array(
					// \i command sequence is supported by WP Latex but not MathJax.
					'i' => "{\\imath}",
					// \j command sequence is supported by WP Latex but not MathJax.
					'j' => "{\\jmath}",
				),
			),
			'tex2jax' => array(
				'inlineMath' => array(
					array( '$latex ', '$' ),
				),
				// Disable display math.
				'displayMath' => array(),
				// Do not process \ref{...} commands outside of math mode.
				'processRefs' => false,
				// Do not process LaTeX environments outside of math mode.
				'processEnvironments' => false,
				// Elements with this class will not be processed by MathJax.
				'ignoreClass' => 'math_ignore',
				// Elements with this class inside of ignored elements will be processed.
				'processClass' => 'math_process',
			),
			// Specify a z-index for MathMenu so it appears properly when used inside modals.
			'MathMenu' => array(
				'styles' => array(
					'.MathJax_Menu' => array('z-index' => 2001),
				),
			),
			// 'showMathMenu' => false,
		);

		// Users who can edit posts or pages should see math parse error details.
		if ( current_user_can( 'edit_posts' ) || current_user_can( 'edit_pages' ) ) {
			$config['TeX']['noErrors']    = array( 'disabled' => true );
			$config['TeX']['noUndefined'] = array( 'disabled' => true );
		}

		return $config;
	}

	/**
	 * Output in-line MathJax configuration.
	 *
	 * @since 3.8.0
	 *
	 * @link http://docs.mathjax.org/en/latest/configuration.html#using-in-line-configuration-options
	 * @link https://github.com/mathjax/MathJax-website/commit/df7f655623b1a6fc0bc637d9f4b47cb3461aa118
	 */
	public function latex_mathjax_config_output() {
		/**
		 * Allow MathJax configuration to be overridden.
		 *
		 * There are many more configuration options available than are outlined
		 * here. Please see the MathJax documentation for a full list.
		 *
		 * @link http://docs.mathjax.org/en/latest/index.html
		 *
		 * @since 3.8.0
		 *
		 * @param array $config {
		 *     In-line MathJax configuration options.
		 *
		 *     @type array $config     Use a pre-defined configuration file.
		 *     @type array $jax        Specify input and output methods for MathJax.
		 *     @type array $extensions Specify which MathJax extensions to load.
		 *     @type array $TeX        Define Macros, specify which TeX extensions to load, and more.
		 *     @type array $tex2jax    Define math delimiters and other options.
		 *     @type array $MathMenu   Control the contextual menu that is available on mathematics that are typeset by MathJax.
		 * }
		 */
		$config = apply_filters( 'latex_mathjax_config', $this->latex_mathjax_config() );

		?>
		<script type="text/x-mathjax-config">
			MathJax.Hub.Register.StartupHook( 'MathMenu Ready', function() {
				MathJax.Menu.BGSTYLE['z-index'] = 2000;
			} );
			MathJax.Hub.Config( <?php echo wp_json_encode( $config ); ?> );
		</script>
	<?php }

	/**
	 * Output MathJax.js script tag on the page if it hasn't already been done.
	 *
	 * @since 3.8.0
	 *
	 * @link http://docs.mathjax.org/en/latest/configuration.html#using-in-line-configuration-options
	 * @link https://github.com/mathjax/MathJax-website/commit/df7f655623b1a6fc0bc637d9f4b47cb3461aa118
	 *
	 * @return boolean
	 */
	public function output_mathjax_script() {
		if ( true === $this->has_output_scripts ) {
			return false;
		}

		$this->has_output_scripts = true;

		$mathjax_url = 'https://cdn.mathjax.org/mathjax/latest/MathJax.js';

		if ( $locale = get_locale() ) {
			$_locale = explode('_', $locale);
			$mathjax_url .= '?locale=' . $_locale[0];
		}

		/**
		 * Allow MathJax URL to be overridden.
		 *
		 * @since 3.8.0
		 *
		 * @param string $mathjax_url MathJax.js URL.
		 */
		$mathjax_url = apply_filters( 'latex_mathjax_url', $mathjax_url );

		wp_enqueue_script( 'latex_mathjax', $mathjax_url, array(), null, true );

		return true;
	}

	/**
	 * Find and process LaTeX markup.
	 *
	 * @since 1.1
	 *
	 * @param  string $content
	 * @return string
	 */
	public function latex_markup( $content ) {
		$regex = '%
			\$latex(?:=\s*|\s+)
			((?:
				[^$]+ # Not a dollar
			|
				(?<=(?<!\\\\)\\\\)\$ # Dollar preceded by exactly one slash
			)+)
			(?<!\\\\)\$ # Dollar preceded by zero slashes
		%ix';
		return preg_replace_callback( $regex, array( $this, 'latex_src' ), $content );
	}

	/**
	 * Render LaTeX markup with colors and size.
	 *
	 * @since 1.1
	 *
	 * @param  array $matches RegEx matches from preg_replace_callback in latex_markup.
	 * @return string         LaTeX expression.
	 */
	public function latex_src( $matches ) {
		$latex = $matches[1];

		$bg = $this->get_default_color( 'bg' );
		$fg = $this->get_default_color( 'text', '000' );
		$s = 0;

		$latex = $this->entity_decode( $latex );
		if ( preg_match( '/.+(&fg=[0-9a-f]{6}).*/i', $latex, $fg_matches ) ) {
			$fg = substr( $fg_matches[1], 4 );
			$latex = str_replace( $fg_matches[1], '', $latex );
		}
		if ( preg_match( '/.+(&bg=[0-9a-f]{6}).*/i', $latex, $bg_matches ) ) {
			$bg = substr( $bg_matches[1], 4 );
			$latex = str_replace( $bg_matches[1], '', $latex );
		}
		if ( preg_match( '/.+(&s=[0-9-]{1,2}).*/i', $latex, $s_matches ) ) {
			$s = (int) substr( $s_matches[1], 3 );
			$latex = str_replace( $s_matches[1], '', $latex );
		}

		return $this->render( $latex, $fg, $bg, $s );
	}

	/**
	 * Get colors for LaTeX expressions.
	 *
	 * @since 1.1
	 *
	 * @global array $themecolors
	 *
	 * @param  string $color
	 * @param  string $default_color Default 'ffffff'.
	 * @return string
	 */
	public function get_default_color( $color, $default_color = 'ffffff' ) {
		global $themecolors;
		return isset($themecolors[$color]) ? $themecolors[$color] : $default_color;
	}

	/**
	 * Decode HTML entities in LaTeX expressions.
	 *
	 * @since 1.1
	 *
	 * @param  string $latex LaTeX expression.
	 * @return string        LaTeX expression.
	 */
	public function entity_decode( $latex ) {
		return str_replace( array( '&lt;', '&gt;', '&quot;', '&#039;', '&#038;', '&amp;', "\n", "\r" ), array( '<', '>', '"', "'", '&', '&', ' ', ' ' ), $latex );
	}

	/**
	 * Convert latex shortcode size into points (pt in CSS).
	 *
	 * This is truer to WP Latex size than converting to LaTeX size commands.
	 * LaTeX size commands can still be used directly if desired, of course.
	 *
	 * @since 3.8.0
	 *
	 * @param  int $s
	 * @return mixed  Font size in points if successful, otherwise false.
	 */
	public function latex_size_pt( $s ) {
		switch ( (int) $s ) {
			case 1 :
				return '12pt';
			case 2 :
				return '14.4pt';
			case 3 :
				return '17.28pt';
			case 4 :
				return '20.74pt';
			case 5 :
				return '24.88pt';
			case -1 :
				return '11pt'; // 9 in LaTeX
			case -2 :
				return '10pt'; // 7 in LaTeX
			case -3 :
				return '8pt'; // 6 in LaTeX
			case -4 :
				return '7pt'; // 5 in LaTeX
			default :
				return false;
		}
	}

	/**
	 * Workarounds for shortcomings in MathJax's rendering.
	 *
	 * @since 3.8.0
	 *
	 * @param  strign $latex LaTeX expression.
	 * @param  string  $fg   Foreground color.
	 * @param  string  $bg   Background color.
	 * @param  integer $s    Font size.
	 * @return mixed         String if successful, otherwise false.
	 */
	public function mathjax_text_mode_workarounds( $latex, $fg, $bg, $s ) {
		switch ( $latex ) {
			case '\LaTeX' :
			case '\TeX' :
				return '$latex \mathrm{' . $latex . '}$';
			case '\AmS' :
				$img_tag = '<img src="//s0.wp.com/latex.php?latex=%%5CAmS&amp;bg=%s&amp;fg=%s&amp;s=%s&amp;zoom=2" alt="\AmS" title="\AmS" class="latex" width="40" height="17" srcset="//s0.wp.com/latex.php?latex=%%5CAmS&amp;bg=%s&amp;fg=%s&amp;s=%s&amp;zoom=2 2x" scale="2">';
				return sprintf( $img_tag, $bg, $fg, $s, $bg, $fg, $s );
			case '\AmS-\TeX' :
				$img_tag = '<img src="//s0.wp.com/latex.php?latex=%%5CAmS-%%5CTeX&amp;bg=%s&amp;fg=%s&amp;s=%s&amp;zoom=2" alt="\AmS-\TeX" title="\AmS-\TeX" class="latex" width="74" height="18" srcset="//s0.wp.com/latex.php?latex=%%5CAmS-%%5CTeX&amp;bg=%s&amp;fg=%s&amp;s=%s&amp;zoom=2 2x" scale="2">';
				return sprintf( $img_tag, $bg, $fg, $s, $bg, $fg, $s );
			case '\AmS-\LaTeX' :
				$img_tag = '<img src="//s0.wp.com/latex.php?latex=%%5CAmS-%%5CLaTeX&amp;bg=%s&amp;fg=%s&amp;s=%s&amp;zoom=2" alt="\AmS-\LaTeX" title="\AmS-\LaTeX" class="latex" width="85" height="18" srcset="//s0.wp.com/latex.php?latex=%%5CAmS-%%5CLaTeX&amp;bg=%s&amp;fg=%s&amp;s=%s&amp;zoom=2 2x" scale="2">';
				return sprintf( $img_tag, $bg, $fg, $s, $bg, $fg, $s );
			default:
				return false;
		}
	}

	/**
	 * Print a valid MathJax expression.
	 *
	 * Wraps LaTeX expression with LaTeX font size command sequence when necessary.
	 * Wraps expression in a span to control colors when necessary.
	 *
	 * @since 1.1
	 *
	 * @param  string  $latex LaTeX expression.
	 * @param  string  $fg    Foreground color.
	 * @param  string  $bg    Background color.
	 * @param  integer $s     Font size. Default '0'.
	 * @return string         LaTeX expression.
	 */
	public function render( $latex, $fg, $bg, $s = 0 ) {
		// Output MathJax if it's not already on the page.
		$this->output_mathjax_script();

		$latex_size_pt   = $this->latex_size_pt( $s );
		$styles          = array();
		$text_mode_value = $this->mathjax_text_mode_workarounds( trim( $latex ), $fg, $bg, $s );

		if ( $fg ) {
			$styles[] = 'color: #' . $fg . ';';
		}
		if ( $bg ) {
			$styles[] = 'background-color: #' . $bg . ';';
		}
		if ( $latex_size_pt ) {
			$styles[] = 'font-size: ' . $latex_size_pt . ';';
		}

		if ( $text_mode_value ) {
			$output   = $text_mode_value;
			$styles[] = 'line-height: 0;';
		} else {
			$output = sprintf('$latex %s$', $latex);
		}

		if ( $styles ) {
			$output = sprintf('<span style="display: inline-block;%s">%s</span>',
				implode('', $styles),
				$output
			);
		}

		return $output;
	}

	/**
	 * The shortcode way. The attributes are the same as the old ones - 'fg' and 'bg', instead of foreground
	 * and background, and 's' is for the font size.
	 *
	 * @since 1.1
	 *
	 * Example: [latex s=4 bg=00f fg=ff0]\LaTeX[/latex]
	 *
	 * @param array   $atts
	 * @param string  $content Default ''.
	 * @return string LaTeX expression.
	 */
	public function latex_shortcode( $atts, $content = '' ) {
		$atts = shortcode_atts( array(
			's'  => 0,
			'bg' => $this->get_default_color( 'bg' ),
			'fg' => $this->get_default_color( 'text', '000' )
		), $atts, 'latex' );

		return $this->render( $this->entity_decode( $content ), $atts['fg'], $atts['bg'], $atts['s'] );
	}

	/**
	 * LaTeX needs to be untexturized.
	 *
	 * @since 1.1
	 *
	 * @param  array $shortcodes
	 * @return array
	 */
	public function latex_no_texturize( $shortcodes ) {
		$shortcodes[] = 'latex';
		return $shortcodes;
	}

	/**
	 * Enqueue Latex helper script.
	 *
	 * @uses wp_enqueue_script, plugins_url
	 * @action wp_enqueue_script
	 * @return null
	 */
	public function latex_enqueue_scripts() {
		wp_enqueue_script( 'latex', plugins_url( 'modules/latex/latex.js', JETPACK__PLUGIN_FILE ), array( 'jquery' ), null, true );
	}
}

Jetpack_Latex::instance();
