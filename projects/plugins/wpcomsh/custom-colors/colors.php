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

define( 'WPCOM_USE_CACHED_COLORS', false );

class Colors_Manager_Common {

	protected static $colors         = array();
	protected static $default_colors = array();
	protected static $text_colors    = array();
	protected static $extra_colors   = array();
	protected static $labels         = array();
	protected static $color_palettes = array();

	protected static $is_gutenberg = false;

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

	const COLOURLOVERS_HOST = 'http://colourlovers.com.s3.amazonaws.com/';

	public static function init() {
		if ( ! apply_filters( 'enable_custom_customizer', true ) ) {
			return;
		}

		if ( self::is_gutenberg() ) {
			// This will load the annotations.
			self::has_annotations();

			// CSS only to be printed if colors are set, on the editor.
			if ( self::theme_has_set_colors() ) {
				self::override_themecolors();

				// NOTE: Using `get_called_class()` here is crucial for the Gutenberg styles to be processed.
				add_action( 'enqueue_block_editor_assets', array( get_called_class(), 'print_block_editor_css' ) );
			}
		} else {
			// Classic Background stats
			add_action( 'admin_enqueue_scripts', array( __CLASS__, 'enqueue_classic_stats' ) );
			// always load ajax actions
			add_action( 'wp_ajax_color_palettes', array( __CLASS__, 'ajax_color_palettes' ) );
			add_action( 'wp_ajax_generate_palette', array( __CLASS__, 'ajax_generate_palette' ) );
			add_action( 'wp_ajax_color_recommendations', array( __CLASS__, 'ajax_color_recommendations' ) );
			add_action( 'wp_ajax_pattern_recommendations', array( __CLASS__, 'ajax_pattern_recommendations' ) );

			// Notice in the core bg admin screen
			add_action( 'admin_print_styles-appearance_page_custom-background', array( __CLASS__, 'core_bg_enqueue_styles' ) );
			add_action( 'admin_notices', array( __CLASS__, 'core_bg_admin_notice' ) );

			// Replace the Backgrounds link with a link to this plugin's section
			add_action( 'admin_menu', array( __CLASS__, 'modify_admin_menu_links' ) );

			// Load the Colors API class for fetching palettes and patterns from WordPress.com.
			require_once __DIR__ . '/colors-api.php';

			$current_theme = get_option( 'stylesheet' );

			// High priority so that no other code manages to modify our URL before we do.  The default URL
			// saved for background_image isn't meant to ever be used as is.
			add_filter( 'pre_update_option_theme_mods_' . $current_theme, array( __CLASS__, 'format_colourlovers_urls' ), 1, 2 );
			add_action( 'update_option_theme_mods_' . $current_theme, array( __CLASS__, 'save_colourlovers_metadata' ), 10, 2 );

			add_action( 'init', array( __CLASS__, 'register_scripts_and_styles' ), 20 );

			// stuff for the customizer - only load if there are annotations.
			if ( self::has_annotations() ) {
				add_action( 'customize_register', array( __CLASS__, 'in_customizer' ), 10 );
				add_action( 'customize_register', array( __CLASS__, 'theme_colors_js' ) );
				add_action( 'customize_controls_init', array( __CLASS__, 'spinner_scripts' ) );
			}

			// CSS only to be printed if colors are set.
			if ( self::theme_has_set_colors() ) {
				self::override_themecolors();
				add_filter( 'body_class', array( __CLASS__, 'body_class' ) );
				add_action( 'wp_head', array( __CLASS__, 'print_theme_css' ), 20 );
			}

			add_filter( 'tonesque_image_url', array( __CLASS__, 'gravatar_image_url' ) );
		}
	}

	/**
	 * Checks if we're in Gutenberg (Editor) mode.
	 *
	 * @see https://stackoverflow.com/a/14919877
	 */
	private static function is_gutenberg() {
		return static::$is_gutenberg;
	}

	static function enqueue_classic_stats( $hook ) {
		if ( 'appearance_page_custom-background' == $hook ) {
			wp_enqueue_script(
				'custom-bg-classic-stats',
				plugins_url( 'js/classic-background-stats.js', __FILE__ ),
				array( 'jquery' ),
				'20140310',
				true
			);
		}
	}

	/**
	 * The Background menu in wp-admin autofocuses the Background section in the
	 * Customizer, but on wpcom that section is removed, so we need to redirect
	 * that link to this section instead.
	 */
	public static function modify_admin_menu_links() {
		global $submenu;
		if ( ! isset( $submenu ) || ! isset( $submenu['themes.php'] ) || ! isset( $submenu['themes.php'][20] ) ) {
			return;
		}
		$colors_section               = admin_url( 'customize.php?autofocus%5Bsection%5D=colors_manager_tool' );
		$submenu['themes.php'][20][2] = esc_url( $colors_section );
	}

	static function core_bg_enqueue_styles() {
		wp_enqueue_style( 'colors-core-bg-notice', plugins_url( 'css/core-bg-notice.css', __FILE__ ) );
	}

	static function core_bg_admin_notice() {
		// just Appearance -> Background
		if ( 'appearance_page_custom-background' !== $GLOBALS['page_hook'] ) {
			return;
		}

		require __DIR__ . '/core-bg-admin-notice.php';
	}

	/**
	 * A helper function to pick an unspecified theme based on the current context.
	 *
	 * @param  boolean|string $theme A theme that, if false, the function will specify
	 * @return string         The theme.
	 */
	protected static function pick_theme( $theme = false ) {
		if ( false !== $theme ) {
			return $theme;
		}

		$theme = get_option( 'stylesheet' );

		// In an Ajax call from the Customizer, we might be previewing a separate theme.
		// Detect that and use it if it's there.

		if ( defined( 'DOING_AJAX' ) && DOING_AJAX ) {
			if ( ! isset( $_SERVER['HTTP_REFERER'] ) ) {
				return $theme;
			}
			$parsed_url = parse_url( $_SERVER['HTTP_REFERER'] );
			if ( $parsed_url && ! isset( $parsed_url['query'] ) ) {
				return $theme;
			}
			wp_parse_str( $parsed_url['query'], $query_parts );
			if ( isset( $query_parts['theme'] ) ) {
				return $query_parts['theme'];
			}
		}
		return $theme;
	}

	/**
	 * Does the theme have annotations? Will load them as well.
	 *
	 * @return boolean theme has annotations
	 */
	static function has_annotations( $theme = false ) {
		// if we're not gonna support it, avoid the filesys hit
		if ( self::will_never_support( $theme ) ) {
			return false;
		}
		// if $colors is populated, we've run some add_color_rule calls.
		// but skip if we directly asked for a theme to avoid false positives
		if ( ! $theme && ! empty( self::$colors ) ) {
			return true;
		}
		// if we called a direct string, we probably don't want to actually load them
		if ( $theme ) {
			$file = get_template_directory() . '/inc/wpcom-colors.php';
			return is_readable( $file );
		}
		// try to load annotations, which returns status of finding them.
		return self::load_annotations( $theme );
	}

	/**
	 * Do we have colors to work with?
	 *
	 * @return boolean active state
	 */
	static function theme_has_set_colors() {
		$opts = get_theme_mod( 'colors_manager', array( 'colors' => false ) );

		if ( ! isset( $opts['colors'] ) ) {
			return false;
		}

		$opts = $opts['colors'];
		// need the softer non-equal on the last in case keys are in different order.
		return self::has_annotations() && (bool) $opts && $opts != self::get_default_colors();
	}

	/**
	 * Will the theme never support Custom Colors?
	 *
	 * @param  boolean|string $theme Optional theme slug. Uses current theme by default.
	 * @return boolean
	 */
	static function will_never_support( $theme = false ) {
		$theme = self::pick_theme( $theme );
		return in_array( $theme, self::$never_support );
	}

	/**
	 * Admin Javascript and CSS
	 */
	static function admin_scripts_and_css() {
		wp_enqueue_style( 'colors-tool' );
		wp_enqueue_style( 'noticons' );
		wp_enqueue_script( 'colors-tool' );
		// wp_enqueue_style( 'hover-bubbles' );

		$settings = array(
			'defaultColors'     => self::get_default_colors(),
			'themeSupport'      => array( 'customBackground' => current_theme_supports( 'custom-background' ) ),
			'defaultImage'      => get_theme_support( 'custom-background', 'default-image' ),
			'topPatterns'       => self::get_patterns( array( 'limit' => 30 ) ),
			'genPalette'        => esc_js( __( 'Generating...' ) ),
			'backgroundTitle'   => esc_js( __( 'Background' ) ),
			'colorsTitle'       => esc_js( __( 'Colors' ) ),
			'mediaTitle'        => esc_js( __( 'Select background image' ) ),
			'mediaSelectButton' => esc_js( __( 'Select' ) ),
		);

		wp_localize_script( 'colors-tool', 'ColorsTool', $settings );
	}

	static function register_scripts_and_styles() {
		// register styles
		wp_register_style( 'colors-tool', plugins_url( 'css/colors-control.css', __FILE__ ), null, '20220727' );
		wp_register_style( 'noticons', '//s0.wp.com/i/noticons/noticons.css', null, '20120621', 'all' );

		// register scripts
		wp_register_script( 'Color.js', plugins_url( 'js/color.js', __FILE__ ), array(), '20121210', true );
		wp_register_script( 'colors-instapreview', plugins_url( 'js/colors-theme-preview.js', __FILE__ ), array( 'customize-preview', 'jquery', 'Color.js' ), '20121210', true );
		wp_register_script( 'colors-tool', plugins_url( 'js/colors-control.js', __FILE__ ), array( 'customize-controls', 'iris' ), '20160726', true );
		wp_register_script( 'spin', plugins_url( 'js/spin.js', __FILE__ ), array(), '1.3', true );
		wp_register_script( 'jquery.spin', plugins_url( 'js/jquery.spin.js', __FILE__ ), array( 'spin' ), '20210111', true );
	}

	/**
	 * Add a 'custom-colors' body class to blogs with Custom Colors active
	 */
	static function body_class( $classes ) {
		array_push( $classes, 'custom-colors' );
		return $classes;
	}

	/**
	 * Enqueue WP.com spinner scripts.
	 */
	static function spinner_scripts() {
		wp_enqueue_script( 'spin' );
		wp_enqueue_script( 'jquery.spin' );
	}

	/**
	 * Constructs the color array
	 */
	static function get_colors() {
		$opts   = get_theme_mod( 'colors_manager', array( 'colors' => false ) );
		$colors = ( $opts['colors'] ) ? $opts['colors'] : self::$default_colors;
		unset( $colors['undefined'] );
		return $colors;
	}

	public static function get_default_colors() {
		return self::$default_colors;
	}

	static function get_color_slots() {
		return array( 'bg', 'txt', 'link', 'fg1', 'fg2' );
	}

	/**
	 * The Color Grid
	 *
	 * This method outputs the core UI structure of the colors tool
	 * Includes color_palettes.
	 */
	public static function color_grid() {
		?>
		<script type="text/template" id="tmpl-background-change">
			<div class="background-rectangle">
				<div class="done"><span class="float-button"><?php esc_html_e( 'Done', 'colors' ); ?></span></div>
			</div>
			<a class="button background-options"><?php esc_html_e( 'Options', 'colors' ); ?></a>
			<a class="button select-image"><?php esc_html_e( 'Select Image', 'colors' ); ?></a>
			<div class="sep"></div>
			<div class="view background-options"></div>
		</script>

		<script type="text/template" id="tmpl-background-options">
			<p class="radios">
				<?php esc_html_e( 'Position', 'colors' ); ?>
				<input type="radio" id="position_x_right" name="position_x" value="right">
				<label title="<?php esc_attr_e( 'Right', 'colors' ); ?>" for="position_x_right"><span class="dashicons dashicons-editor-alignright"></span></label>
				<input type="radio" id="position_x_center" name="position_x" value="center">
				<label title="<?php esc_attr_e( 'Center', 'colors' ); ?>" for="position_x_center"><span class="dashicons dashicons-editor-aligncenter"></span></label>
				<input type="radio" id="position_x_left" name="position_x" value="left">
				<label title="<?php esc_attr_e( 'Left', 'colors' ); ?>" for="position_x_left"><span class="dashicons dashicons-editor-alignleft"></span></label>
			</p>

			<p class="radios">
				<?php esc_html_e( 'Repeat', 'colors' ); ?>
				<input type="radio" id="repeat" name="repeat" value="repeat">
				<label title="<?php esc_attr_e( 'Tile', 'colors' ); ?>" for="repeat"><span class="noticon noticon-gridview"></span></label>
				<input type="radio" id="repeat-y" name="repeat" value="repeat-y">
				<label title="<?php esc_attr_e( 'Vertically', 'colors' ); ?>" for="repeat-y"><span class="noticon noticon-tile-vertically"></label>
				<input type="radio" id="repeat-x" name="repeat" value="repeat-x">
				<label title="<?php esc_attr_e( 'Horizontally', 'colors' ); ?>" for="repeat-x"><span class="noticon noticon-tile-horizontally"></label>
				<input type="radio" id="repeat-no-repeat" name="repeat" value="no-repeat">
				<label title="<?php esc_attr_e( 'None', 'colors' ); ?>" for="repeat-no-repeat"><span class="noticon noticon-tile-none"></label>
			</p>

			<p class="radios">
				<?php esc_html_e( 'Fixed Position', 'colors' ); ?>
				<input id="attachment-fixed" type="checkbox" name="attachment" value="fixed">
				<label for="attachment-fixed"><span class="dashicons dashicons-admin-post"></span></label>
			</p>

			<p class="radios">
				<?php esc_html_e( 'Underlying color', 'colors' ); ?>
				<input id="underlying-color" class="underlying-color" name="color">
				<label for="underlying-color" class="underlying-color"><span class="dashicons"></span></label>
			</p>

			<div class="iris-container"></div>

			<p class="bottom">
				<a href="#" class="hide-image"><?php esc_html_e( 'Hide background image', 'colors' ); ?></a>
			</p>

		</script>

		<div id="background-change">
		</div>
		<div id="color-picker" class="color-picker">
			<ul class="color-grid main" id="color-grid">
				<?php
				foreach ( self::get_color_slots() as $cat ) {
					if ( 'bg' == $cat ) {
						$change = esc_html__( 'Change', 'colors' );
						$change = "<span class=\"change-background float-button\">{$change}</span>";
					} else {
						$change = '';
					}
					$title = esc_attr( self::$labels[ $cat ] );
					$class = isset( self::$colors[ $cat ] ) ? $cat : "{$cat} unavailable";
					if ( 'bg' === $cat ) {
						// background is always available for back compat with core
						$class = 'bg';
					}
					echo "<li data-role='{$cat}' class='{$class} clr' data-title='{$title}'>{$change}</li>";
				}
				?>
			</ul>
			<span class="action-button-wrap">
				<a class="revert revert-default button" title="<?php esc_attr_e( 'Go back to your theme&rsquo;s default colors' ); ?>"><?php esc_html_e( 'Default' ); ?></a>
			</span>
			<span id="color-tooltip"></span>
			<div id="the-bg-picker-prompt" style="display: none;">
				<span class="customize-control-title"><?php esc_html_e( 'Customize Your Background', 'colors' ); ?></span>
				<div>
					<a href="#" class="bg choose-color">O</a>
					<h4>Change <b>Color</b></h4>
				</div>
				<div>
					<a href="#" class="bg choose-pattern">O</a>
					<h4>Choose <b>Image</b></h4>
				</div>
			</div>
			<div class="the-picker" id="the-picker">
				<span class="color-label" id="color-reference"></span>
				<p><?php esc_html_e( 'These are colors that work well with the other colors in your palette:' ); ?></p>
				<ul class="color-suggestions">
					<li></li>
					<li></li>
					<li></li>
					<li></li>
					<li></li>
					<li></li>
					<li></li>
					<li></li>
					<li></li>
					<li></li>
					<li></li>
					<li></li>
				</ul>
				<p class="iris-launch"><?php _e( 'You can also <a href="#" id="pick-your-nose">pick your own color</a>.' ); ?></p>
				<div id="iris-container" class="hidden">
					<input type="text" id="iris" />
				</div>
			</div>
			<?php Colors_Manager::color_palettes(); ?>
			<?php Colors_Manager::color_patterns(); ?>
		</div>
		<?php
	}

	public static function print_current_color_grid() {
		if ( ! self::theme_has_set_colors() ) {
			return;
		}
		?>
		<ul class="color-grid main">
			<?php
			foreach ( self::get_colors() as $cat => $value ) {
				$class = isset( self::$colors[ $cat ] ) ? $cat : "{$cat} unavailable";
				$title = esc_attr( self::$labels[ $cat ] );
				echo "<li class='{$class}' style='background-color: {$value}' title='{$title}'>{$value}</li>";
			}
			?>
		</ul>
		<?php
	}

	public static function ajax_color_palettes() {
		$palettes = self::get_color_palettes( $_REQUEST );

		$response = array( 'palettes' => $palettes );

		header( 'Content-Type: text/javascript' );
		echo json_encode( $response );
		die;
	}

	public static function ajax_generate_palette() {
		$response = self::get_generated_palette( $_REQUEST );
		header( 'Content-Type: text/javascript' );
		echo json_encode( $response );
		die;
	}

	public static function ajax_color_recommendations() {
		$colors = self::get_color_recommendations( $_REQUEST );

		$response = array( 'colors' => $colors );

		header( 'Content-Type: text/javascript' );
		echo json_encode( $response );
		die;
	}

	public static function ajax_pattern_recommendations() {
		$patterns = self::get_pattern_recommendations( $_REQUEST );

		$response = array( 'patterns' => $patterns );

		header( 'Content-Type: text/javascript' );
		echo json_encode( $response );
		die;
	}

	/**
	 * Ensure that COLOURLovers URLs are saved without any imgpress stuff.
	 */
	public static function format_colourlovers_urls( $new_theme_mods, $old_theme_mods ) {
		if ( ! empty( $new_theme_mods['background_image'] ) && false !== strpos( $new_theme_mods['background_image'], '/imgpress?url=' . urlencode( self::COLOURLOVERS_HOST ) ) ) {
			$new_theme_mods['background_image'] = urldecode( array_pop( explode( '/imgpress?url=', $new_theme_mods['background_image'], 2 ) ) );
		}

		return $new_theme_mods;
	}

	/**
	 * When a user saves a COLOURLovers palette or pattern, save the CL metadata
	 * for attribution later on.
	 *
	 * Also used to track COLOURlovers asset usage.
	 * See https://mc.a8c.com/s/colourlovers-pattern/ and
	 * https://mc.a8c.com/s/colourlovers-palette/
	 *
	 * 1. Which color palettes are chosen, and overall number of times a pattern is switched to.
	 * 2. Which background patterns are chosen, and the overall number of times a pattern is switched to.
	 */
	public static function save_colourlovers_metadata( $oldvalue, $newvalue ) {
		$mods = $newvalue;

		if ( isset( $oldvalue['background_image'] ) && isset( $newvalue['background_image'] ) && $oldvalue['background_image'] != $newvalue['background_image'] ) {
			$using_colourlovers_pattern = false;

			if ( 0 === strpos( $mods['background_image'], self::COLOURLOVERS_HOST ) ) {
				$matches = array();

				if ( preg_match( '/\/([0-9]+)\.png$/i', $mods['background_image'], $matches ) ) {
					$using_colourlovers_pattern = true;

					$pattern_id = $matches[1];

					if ( empty( $mods['background_image_metadata'] ) || $pattern_id != $mods['background_image_metadata']['pattern_id'] ) {
						$pattern = Colors_API::call( 'patterns', array(), $pattern_id );
						if ( ! is_wp_error( $pattern ) ) {
							set_theme_mod(
								'background_image_metadata',
								array(
									'pattern_id' => $pattern_id,
									'username'   => $pattern['username'],
									'title'      => $pattern['title'],
								)
							);
						}
					}
				}
			}

			if ( ! $using_colourlovers_pattern && ! empty( $mods['background_image_metadata'] ) ) {
				remove_theme_mod( 'background_image_metadata' );
			}
		}

		if ( isset( $newvalue['background_image'] ) && 0 === strpos( $newvalue['background_image'], self::COLOURLOVERS_HOST ) && $newvalue['background_image'] != $newvalue['background_image_thumb'] ) {
			/**
			 * Due to a bug with percent signs in background_image URLs, we need to make sure that
			 * our background image is also saved as the background_image_thumb value.  We need to
			 * do this any time theme_mods is updated, because there is other code aggressively
			 * trying to delete background_image_thumb completely.
			 */
			set_theme_mod( 'background_image_thumb', $newvalue['background_image'] );
		}

		if ( isset( $oldvalue['colors_manager'] ) && isset( $newvalue['colors_manager'] ) && $newvalue['colors_manager']['colors'] != $oldvalue['colors_manager']['colors'] ) {
			if ( empty( $newvalue['colors_manager']['colors'] ) && $newvalue['color_palette_metadata'] ) {
				remove_theme_mod( 'color_palette_metadata' );
			} else {
				require_once __DIR__ . '/class-palette.php';

				$palette = Palette::get( array( 'colors' => $newvalue['colors_manager']['colors'] ) );

				if ( $palette ) {
					if ( empty( $newvalue['color_palette_metadata'] ) || $palette->id != $newvalue['color_palette_metadata']['palette_id'] ) {
						set_theme_mod(
							'color_palette_metadata',
							array(
								'palette_id' => $palette->id,
								'username'   => $palette->username,
								'title'      => $palette->title,
							)
						);
					}
				} else {
					remove_theme_mod( 'color_palette_metadata' );
				}
			}
		}
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

	static function is_featured_palette( $colors ) {

		$featured_palettes = self::$color_palettes;

		foreach ( $colors as $c ) {
			$c = strtolower( $c );
		}

		// look for our palette in featured palettes
		foreach ( $featured_palettes as $p ) {
			$p     = $p['palette'];
			$found = true;
			// for each color of the featured palette
			foreach ( $p as $i => $c ) {
				// we don't care about the background color; non-CD users are
				// free to change it
				if ( 0 == $i ) {
					continue;
				}

				$c = strtolower( $c );
				// if that color isn't in our palette
				if ( ! empty( $c ) && ! in_array( $c, $colors ) ) {
					// try another featured palette
					$found = false;
					break;
				}
			}
			if ( $found ) {
				return true;
			}
		}
		return false;
	}

	public static function should_enable_colors() {
		$opts = get_theme_mod( 'colors_manager', array( 'colors' => false ) );
		if ( ! $opts['colors'] ) {
			return false;
		}

		$colors = $opts['colors'];

		// If we managed to save the default palette, bail. It does not actually render
		// the same thing as the theme's default style
		if ( self::is_default_palette( $colors ) ) {
			return false;
		}

		return apply_filters( 'custom_colors_enable', true );
	}

	/**
	 * Query and return palette data.
	 *
	 * @param array $args [color=>string, limit=>int, offset=int]
	 * @return array An array of color palettes.
	 */
	public static function get_color_palettes( $args = array() ) {
		global $wpdb;

		$defaults = array(
			'color'  => false,
			'limit'  => 6,
			'offset' => 0,
		);

		$args = wp_parse_args( $args, $defaults );

		if ( $args['color'] ) {
			$args['color'] = self::normalize_color( $args['color'] );

			$palettes = wp_cache_get( 'color-palettes-from-' . $args['color'], 'colors' );

			if ( false === $palettes ) {
				$palettes = Colors_API::call( 'palettes', array( 'color' => $args['color'] ) );
				if ( ! is_wp_error( $palettes ) ) {
					wp_cache_set( 'color-palettes-from-' . $args['color'], $palettes, 'colors', MONTH_IN_SECONDS );
				}
			}
		} else {
			$palettes = wp_cache_get( 'color-palettes-top', 'colors' );

			if ( false === $palettes ) {
				$palettes = Colors_API::call( 'palettes' );
				if ( ! is_wp_error( $palettes ) ) {
					wp_cache_set( 'color-palettes-top', $palettes, 'colors', MONTH_IN_SECONDS );
				}
			}
		}

		$palettes = array_slice( $palettes, $args['offset'], $args['limit'] );

		if ( ! empty( $palettes ) ) {
			foreach ( $palettes as $palette_index => $palette ) {
				$colors = array();

				foreach ( self::get_color_slots() as $color_index => $color_key ) {
					if ( count( $palette['colors'] ) == $color_index ) {
						break;
					}

					$colors[ $color_key ] = $palette['colors'][ $color_index ]['hex'];
				}

				$palettes[ $palette_index ]['colors'] = $colors;
			}
		}

		// Shuffle palettes to make them less repetitive
		shuffle( $palettes );

		// Prepend theme-defined palettes to the first set of palettes
		if ( 0 === (int) $args['offset'] ) {
			$palettes = array_merge( self::get_theme_color_palettes(), $palettes );
			$palettes = array_slice( $palettes, 0, (int) $args['limit'] );
		}

		return $palettes;
	}

	public static function gravatar_image_url( $image_url ) {
		$prefix_http     = preg_quote( 'http://www.gravatar.com/avatar/', '/' );
		$prefix_https    = preg_quote( 'https://secure.gravatar.com/avatar/', '/' );
		$gravatar_prefix = sprintf( '/^(%s|%s)/', $prefix_http, $prefix_https );
		$is_gravatar_url = preg_match( $gravatar_prefix, $image_url );

		if ( $is_gravatar_url ) {
			$image_url = preg_replace( '#/([0-9a-f]+)/#', '/$1.jpg', $image_url );
		}

		return $image_url;
	}

	/**
	 * Returns a color palette matching a given image thanks to the Tonesque
	 * lib.
	 *
	 * @param array $args [image=>string]
	 * @return array A single color palette
	 */
	public static function get_generated_palette( $args = array() ) {
		// Some themes, like Ryu, include an older version of Tonesque, which is loaded instead of the version in `/wp-content/lib/`.
		// For now, only load the shared library if Tonesque isn't already present. See #5557.
		if ( ! class_exists( 'Tonesque' ) ) {
			require_lib( 'tonesque' );
		}

		// If the loaded version doesn't have the method needed to support palette generation, abort for now until the themes are updated. See #5557.
		if ( ! method_exists( 'Tonesque', 'grab_points' ) ) {
			return array();
		}

		$defaults = array(
			'image' => false,
		);

		$args = wp_parse_args( $args, $defaults );
		extract( $args, EXTR_SKIP );

		if ( ! $image ) {
			return array();
		}

		$tonesque = new Tonesque( $image );
		$points   = $tonesque->grab_points( 'hex' );

		$roles = self::get_color_slots();
		shuffle( $roles );

		if ( ! is_array( $points ) ) {
			return array();
		}

		$colors = array_combine( $roles, $points );

		$palette = array(
			'id'     => 'generated-palette',
			'colors' => $colors,
		);

		return $palette;
	}

	public static function get_theme_color_palettes() {
		if ( empty( self::$color_palettes ) ) {
			return array();
		}

		$map                = self::get_color_slots();
		$formatted_palettes = array();
		foreach ( self::$color_palettes as $id => $palette ) {
			$formatted_palette = array(
				'id'     => $id,
				'colors' => array(),
			);
			foreach ( $map as $index => $key ) {
				$formatted_palette['colors'][ $key ] = str_replace( '#', '', $palette['palette'][ $index ] );
			}

			$formatted_palettes[] = $formatted_palette;
		}

		return $formatted_palettes;
	}


	/**
	 * Query and return pattern data.
	 *
	 * @param array $args [color=>string, limit=>int, offset=int]
	 * @return array An array of patterns.
	 */
	public static function get_patterns( $args = array() ) {
		global $wpdb;

		$defaults = array(
			'color'  => false,
			'limit'  => 4,
			'offset' => 0,
		);

		$args = wp_parse_args( $args, $defaults );

		if ( $args['color'] ) {
			$args['color'] = self::normalize_color( $args['color'] );

			$patterns = wp_cache_get( 'patterns-from-' . $args['color'], 'colors' );

			if ( false === $patterns ) {
				$patterns = Colors_API::call( 'patterns', array( 'color' => $args['color'] ) );
				if ( ! is_wp_error( $patterns ) ) {
					wp_cache_set( 'patterns-from-' . $args['color'], $patterns, 'colors', MONTH_IN_SECONDS );
				}
			}
		} else {
			$patterns = wp_cache_get( 'patterns-top', 'colors' );

			if ( false === $patterns ) {
				$patterns = Colors_API::call( 'patterns' );
				if ( ! is_wp_error( $patterns ) ) {
					wp_cache_set( 'patterns-top', $patterns, 'colors', MONTH_IN_SECONDS );
				}
			}
		}

		$patterns = array_slice( $patterns, $args['offset'], $args['limit'] );

		if ( ! empty( $patterns ) ) {
			foreach ( $patterns as $pattern_index => $pattern ) {
				$colors = array();

				foreach ( self::get_color_slots() as $color_index => $color_key ) {
					if ( count( $pattern['colors'] ) == $color_index ) {
						break;
					}

					$colors[ $color_key ] = $pattern['colors'][ $color_index ]['hex'];
				}

				$patterns[ $pattern_index ]['colors']            = $colors;
				$patterns[ $pattern_index ]['preview_image_url'] = ( function_exists( 'jetpack_photon_url' ) ) ? jetpack_photon_url( $pattern['preview_image_url'], array(), 'network_path' ) : $pattern['preview_image_url'];
			}
		}

		return $patterns;
	}

	/**
	 * Converts rgb() or hex color codes to the AABBCC format:
	 *
	 * @param string $color An rgb or hex color code.
	 * @return string
	 */
	public static function normalize_color( $color ) {
		if ( false !== strpos( $color, 'rgb' ) ) {
			$color_data       = preg_replace( '/[^0-9\.,]/', '', $color );
			$color_components = explode( ',', $color_data );

			$hex_color = '';

			for ( $i = 0; $i < 3; $i++ ) {
				$hex_equivalent = dechex( intval( $color_components[ $i ] ) );
				if ( strlen( $hex_equivalent ) < 2 ) {
					$hex_color .= '0';
				}
				$hex_color .= $hex_equivalent;
			}

			return strtoupper( $hex_color );
		} else {
			$hex = strtoupper( substr( preg_replace( '/[^0-9A-Z]/i', '', $color ), 0, 6 ) );

			if ( strlen( $hex ) == 3 ) {
				$hex = $hex[0] . $hex[0] . $hex[1] . $hex[1] . $hex[2] . $hex[2];
			} else {
				for ( $i = strlen( $hex ); $i < 6; $i++ ) {
					$hex = '0' . $hex;
				}
			}

			return $hex;
		}
	}

	/**
	 * Finds colors that could be suitable complement to a given set of colors.
	 *
	 * @param array $args [colors=>array[string], color=>string, limit=>int, role=>string]
	 * @return array An array of color codes.
	 */
	public function get_color_recommendations( $args ) {
		global $wpdb;

		$defaults = array(
			'color'  => false,
			'role'   => false,
			'colors' => false,
			'limit'  => 8,
		);

		$args = wp_parse_args( $args, $defaults );

		if ( $args['color'] ) {
			$args['color'] = self::normalize_color( $args['color'] );
		}

		$colors = array();

		foreach ( $args['colors'] as $role => $color ) {
			$color                   = self::normalize_color( $color );
			$args['colors'][ $role ] = $color;

			$palettes = Colors_API::call(
				'palettes',
				array(
					'color' => $color,
					'limit' => 8,
				)
			);

			if ( ! is_wp_error( $palettes ) ) {
				foreach ( $palettes as $palette ) {
					$multiplier = 0;

					foreach ( $palette['colors'] as $_color ) {
						if ( ! $_color ) {
							continue;
						}

						// If this palette contains more than one of the guide colors,
						// give it more weight.
						if ( in_array( $_color, $args['colors'] ) ) {
							$multiplier += 1;
						}
					}

					foreach ( $palette['colors'] as $role => $_color ) {
						if ( ! $_color ) {
							continue;
						}

						$colors[ $_color ] += ( 1 * $multiplier );

						if ( $role == $args['role'] ) {
							$colors[ $_color ] += ( 1 * $multiplier );
						}
					}
				}
			}
		}

		foreach ( $args['colors'] as $color ) {
			unset( $colors[ $color ] );
		}

		if ( $args['color'] ) {
			unset( $colors[ $args['color'] ] );
		}

		arsort( $colors );
		$colors = array_keys( $colors );

		if ( count( $colors ) < 8 ) {
			$more_suggestions = self::color_suggestions( $args['colors'], $args['role'] );
			$colors           = array_merge( $colors, $more_suggestions );

			foreach ( $args['colors'] as $color ) {
				unset( $colors[ $color ] );
			}

			if ( $args['color'] ) {
				unset( $colors[ $args['color'] ] );
			}
		}

		$colors = array_slice( $colors, 0, $args['limit'] );

		return $colors;
	}


	/**
	 * Finds patterns that could be suitable complement to a given set of colors.
	 *
	 * @param array $args [colors=>array[string], limit=>int]
	 * @return array An array of patterns.
	 */
	public static function get_pattern_recommendations( $args ) {
		global $wpdb;

		$defaults = array(
			'colors' => false,
			'limit'  => 4,
		);

		$args = wp_parse_args( $args, $defaults );

		$patterns_by_id = array();
		$pattern_ids    = array();

		foreach ( $args['colors'] as $role => $color ) {
			$color                   = self::normalize_color( $color );
			$args['colors'][ $role ] = $color;

			$color_patterns = Colors_API::call(
				'patterns',
				array(
					'color' => $color,
					'limit' => 5,
				)
			);

			if ( ! is_wp_error( $color_patterns ) ) {
				foreach ( $color_patterns as $pattern ) {
					$patterns_by_id[ $pattern['id'] ] = $pattern;

					if ( ! isset( $pattern_ids[ $pattern['id'] ] ) ) {
						$pattern_ids[ $pattern['id'] ] = 0;
					}
					$pattern_ids[ $pattern['id'] ] += 1;

					foreach ( $pattern['colors'] as $color ) {
						if ( in_array( $color, $args['colors'], true ) ) {
							$pattern_ids[ $pattern['id'] ] += 1;
						}
					}
				}
			}
		}

		arsort( $pattern_ids );
		$pattern_ids = array_keys( $pattern_ids );
		$pattern_ids = array_slice( $pattern_ids, 0, $args['limit'] );

		$patterns = array();

		foreach ( $pattern_ids as $pattern_id ) {
			unset( $patterns_by_id[ $pattern_id ]['colors'] );
			$patterns[] = $patterns_by_id[ $pattern_id ];
		}

		return $patterns;
	}

	/**
	 * Renders the color palettes
	 */
	public static function color_palettes() {
		?>
		<div id="colourlovers-palettes-container">
			<h3><?php esc_html_e( 'Choose a Palette', 'colors' ); ?></h3>
			<div id="colourlovers-palettes"></div>
			<div class="palette-buttons">
				<a class="button next" id="more-palettes"><?php esc_html_e( 'More' ); ?></a>
				<a class="button previous" id="less-palettes" style="display: none;"><?php esc_html_e( 'Back' ); ?></a>
				<a class="button generate" id="generate-palette"><?php esc_html_e( 'Match header image' ); ?></a>
			</div>
		</div>
		<?php
	}

	/**
	 * Renders the pattern grid
	 */
	public static function color_patterns() {
		?>
		<div class="the-pattern-picker" id="the-pattern-picker" style="display: none;">
			<span class="customize-control-title">
				<?php esc_html_e( 'Pick a Background Pattern' ); ?>
			</span>
			<ul id="colourlovers-patterns"></ul>
			<div class="pagination">
				<a id="more-patterns" class="button"><?php esc_html_e( 'More' ); ?></a>
				<a id="less-patterns" class="button previous" style="display: none;"><?php esc_html_e( 'Back' ); ?></a>
			</div>
			<p class="noresults" style="display: none;"><?php esc_html_e( "There aren't any patterns that match your chosen color scheme. It's just too unique!", 'colors' ); ?></p>
		</div>
		<?php
	}

	/**
	 * Make this work inside the Customizer
	 */
	static function in_customizer( $wp_customize ) {
		// Include controller class
		require_once __DIR__ . '/class-colors-controller.php';

		if ( false && class_exists( 'WP_Customize_Panel_Section' ) ) {
			$wp_customize->add_section(
				new WP_Customize_Panel_Section(
					$wp_customize,
					'colors_manager_tool',
					array(
						'title'    => __( 'Colors & Backgrounds' ),
						'priority' => 35,
						'panel'    => 'custom-design',
					)
				)
			);
		} else {
			$wp_customize->add_section(
				'colors_manager_tool',
				array(
					'title'    => __( 'Colors & Backgrounds' ),
					'priority' => 35,
				)
			);
		}

		$setting_opts = array(
			'default'    => self::get_colors(),
			'type'       => 'colorsTool',
			'capability' => 'edit_theme_options',
			'transport'  => 'postMessage',
			'type'       => 'theme_mod',
		);

		if ( is_admin() ) {
			$setting_opts = array_merge(
				$setting_opts,
				array(
					'sanitize_callback'    => array( __CLASS__, 'sanitize_colors_on_save' ),
					'sanitize_js_callback' => array( __CLASS__, 'sanitize_colors' ),
				)
			);
		}

		$wp_customize->add_setting( 'colors_manager[colors]', $setting_opts );

		$wp_customize->add_control(
			new Colors_Manager_Control(
				$wp_customize,
				'colors-tool',
				array(
					'label'    => __( 'Colors' ),
					'section'  => 'colors_manager_tool',
					'settings' => 'colors_manager[colors]',
				)
			)
		);
	}

	static function sanitize_colors_on_save( $set_colors ) {
		// since this function only gets called if the colors changed,
		// we can safely invalidate without further checks
		add_action( 'shutdown', array( __CLASS__, 'delete_cached_css_on_shutdown_because_reasons' ) );
		return self::sanitize_colors( $set_colors );
	}

	static function sanitize_colors( $set_colors ) {
		// let's make sure all of our keys/values are proper
		$colors_wanted = array();
		$cats          = self::get_color_slots();
		if ( ! class_exists( 'Jetpack_color' ) ) {
			require_lib( 'class.color' );
		}
		foreach ( $set_colors as $key => $color ) {
			if ( ! in_array( $key, $cats ) || ! $color ) {
				continue;
			}
			try {
				$color_object          = new Jetpack_Color( $color );
				$colors_wanted[ $key ] = '#' . $color_object->toHex();
			} catch ( Exception $e ) {
			}
		}
		return $colors_wanted;
	}

	private static function delete_cached_css() {
		$colors_manager           = (array) get_theme_mod( 'colors_manager' );
		$colors_manager['cached'] = false;
		set_theme_mod( 'colors_manager', $colors_manager );
	}

	public static function delete_cached_css_on_shutdown_because_reasons() {
		remove_all_filters( 'theme_mod_colors_manager' );
		self::delete_cached_css();
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
		$colors['url']    = $colors['link'];
		$colors['text']   = $colors['txt'];

		unset( $colors['fg1'] );
		unset( $colors['fg2'] );
		unset( $colors['txt'] );

		foreach ( $colors as $role => $color ) {
			if ( $color ) {
				$themecolors[ $role ] = substr( $color, 1 );
			}
		}
	}

	/**
	 * Injects our postMessage listener scripts into the theme
	 */
	static function theme_colors_js( $wp_customize ) {
		if ( $wp_customize->is_preview() && ! is_admin() ) {
			wp_enqueue_script( 'colors-instapreview' );
			$js_data = array(
				'colors'        => self::$colors,
				'defaultColors' => self::get_default_colors(),
				'extraCss'      => self::get_extra_css( true ),
				'extraColors'   => self::$extra_colors,
			);
			wp_localize_script( 'colors-instapreview', 'ColorsTool', $js_data );
		}
	}

	static function print_theme_css() {
		if ( ! self::should_enable_colors() ) {
			return;
		}
		$css = self::get_theme_css();
		echo '<style type="text/css" id="custom-colors-css">' . "{$css}</style>\n";
	}

	public static function print_block_editor_css() {
		if ( ! self::should_enable_colors() ) {
			return;
		}
		$css = self::get_theme_css();

		wp_register_style( 'custom-colors-editor-css', false, null, '20210311' ); // Register an empty stylesheet to append custom CSS to.
		wp_enqueue_style( 'custom-colors-editor-css' );
		wp_add_inline_style( 'custom-colors-editor-css', $css ); // Append inline style to our new stylesheet
	}

	static function get_theme_css() {
		$opts       = get_theme_mod(
			'colors_manager',
			array(
				'colors' => false,
				'cached' => false,
			)
		);
		$has_cached = isset( $opts['cached'] ) && $opts['cached'];

		if ( $has_cached && WPCOM_USE_CACHED_COLORS ) {
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
		require_once __DIR__ . '/lib/cssmin.php';
		$minifier = new CSSmin();
		$css      = $minifier->run( $css );

		$opts['cached'] = $css;
		set_theme_mod( 'colors_manager', $opts );

		return $css;
	}

	// @todo possibly combine all of this into a keyed array to prevent selector duplication bloat
	static function css_rule( $rule, $color ) {
		$css = '';

		if ( isset( $rule[2] ) ) {
			// we'll need it in either case
			if ( ! class_exists( 'Jetpack_color' ) ) {
				require_lib( 'class.color' );
			}

			try {
				$working_color = new Jetpack_Color( $color );
			} catch ( RangeException $e ) {
				$message .= 'rule: ' . print_r( $rule, 1 ) . "\n";
				$message .= 'call: $working_color = new Jetpack_Color( ' . $color . ' );' . "\n";
				self::exception_mailer( $message );
				return '';
			}

			$number = (float) $rule[2];
			// ensure contrast or darken/lighten
			if ( is_string( $rule[2] ) ) {
				$first_char = substr( $rule[2], 0, 1 );
				// darken/lighten
				if ( '+' === $first_char || '-' === $first_char ) {
					$modify = 10 * $number;
					$color  = $working_color->incrementLightness( $modify )->toString();
				} else {
					// hex bg for contrast
					if ( '#' === $first_char ) {
						try {
							$bg_color = new Jetpack_Color( $rule[2] );
						} catch ( RangeException $e ) {
							$message  = 'function: ' . __FUNCTION__ . "\n";
							$message .= 'call: $bg_color = new Jetpack_Color( ' . $rule[2] . ' );' . "\n";
							self::exception_mailer( $message );
							return '';
						}
					}
					// set color bg for contrast
					elseif ( isset( self::$colors[ $rule[2] ] ) ) {
						$set_colors = self::get_colors();
						try {
							$bg_color = new Jetpack_Color( $set_colors[ $rule[2] ] );
						} catch ( RangeException $e ) {
							$message  = 'function: ' . __FUNCTION__ . "\n";
							$message .= 'call: $bg_color = new Jetpack_Color( ' . $set_colors[ $rule[2] ] . ' );' . "\n";
							self::exception_mailer( $message );
							return '';
						}
					}

					// we have a bg color to contrast
					if ( isset( $bg_color ) && is_a( $bg_color, 'Jetpack_Color' ) ) {
						// default contrast of 5, can be overridden with 4th arg.
						$contrast = ( isset( $rule[3] ) ) ? $rule[3] : 5;
						$color    = $working_color->getReadableContrastingColor( $bg_color, $contrast )->toString();
					}
				}
			}
			// alpha
			elseif ( $rule[2] < 1 ) {
				unset( $rule[2] );
				// back compat for non-rgba browsers
				$css  .= self::css_rule( $rule, $color );
				$color = $working_color->toCSS( 'rgba', $number );
			}
		}
		$css .= "{$rule[0]} { {$rule[1]}: {$color};}\n";
		return $css;
	}

	static function get_extra_css( $only_callback = false ) {
		$css      = '';
		$extra_cb = get_theme_support( 'custom_colors_extra_css' );

		if ( is_array( $extra_cb ) && is_callable( $extra_cb[0] ) ) {
			// will work with return values or straight printing
			ob_start();
			$css  = call_user_func( $extra_cb[0] );
			$css .= ob_get_clean();
		}

		if ( $only_callback ) {
			return $css;
		}

		foreach ( self::$extra_colors as $extra ) {
			if ( ! isset( $extra['rules'] ) || ! is_array( $extra['rules'] ) ) {
				continue;
			}
			$color = $extra['color'];
			foreach ( $extra['rules'] as $rule ) {
				$css .= self::css_rule( $rule, $color );
			}
		}
		return $css;
	}

	/**
	 * Function for making theme annotations.
	 *
	 * @param string      $category The color category. One of bg, txt, link, fg1, fg2
	 * @param string      $default_color The default color for this category.
	 * @param array       $rules Array of rule arrays. $rule: array( selector, property, opacity );
	 * @param string      $selector CSS selector the color category will change
	 * @param string      $property The CSS property the CSS selector will set.
	 * @param float       $opacity Optional, default 1. Values < 1 will set as rgba, with #hex fallbacks for dumb browsers.
	 * @param bool|string $label Optional. A UI helper label for identifying what a particular color
	 *        will change in the theme.
	 */
	public static function add_color_rule( $category, $default_color, $rules, $label = false ) {
		// extra rules
		if ( 'extra' === $category ) {
			self::$extra_colors[] = array(
				'color' => $default_color,
				'rules' => $rules,
			);
			return;
		}
		// prime it
		if ( ! isset( self::$colors[ $category ] ) ) {
			self::$colors[ $category ] = array();
		}
		self::$colors[ $category ] = array_merge( self::$colors[ $category ], $rules );

		self::$default_colors[ $category ] = $default_color;
		if ( $label ) {
			self::$labels[ $category ] = $label;
		}
	}

	/**
	 * Allow a theme to declare its own color palettes.
	 *
	 * @param array $palette An array with 5 colors.
	 */
	public static function add_color_palette( $palette, $title = false ) {
		if ( ! $title ) {
			$theme = wp_get_theme();
			$title = sprintf(
				__( '%1$s Alternative Scheme %2$s' ),
				$theme->display( 'Name' ),
				count( self::$color_palettes ) + 1
			);
		}

		$id = sanitize_title_with_dashes( $title );

		self::$color_palettes[ $id ] = compact( 'title', 'palette' );
	}

	/**
	 * Loads theme annotations, and filter them if loaded.
	 *
	 * @param  boolean $theme Which theme to check for annotations on. Defaults to current theme.
	 * @return boolean Theme has annotations.
	 */
	protected static function load_annotations( $theme = false ) {
		$theme_name       = 'pub/' . self::pick_theme( $theme );
		$annotations_file = get_stylesheet_directory() . '/inc/wpcom-colors.php';
		self::prime_color_labels();
		if ( is_readable( $annotations_file ) ) {
			require_once $annotations_file;
			self::$colors = apply_filters( 'custom_colors_rules', self::$colors, $theme_name );
			self::handle_unset_colors();
			return true;
		}
		return false;
	}

	protected static function handle_unset_colors() {
		foreach ( self::$colors as $key => $value ) {
			if ( empty( $value ) ) {
				// set Label to Unused
				self::$labels[ $key ] = __( 'Unused' );
				unset( self::$colors[ $key ] );
			}
		}
	}

	/**
	 * Sets default, i10n-ized default color labels that can be overridden in annotations.
	 */
	protected static function prime_color_labels() {
		if ( ! empty( self::$labels ) ) {
			return;
		}

		self::$labels = array(
			'bg'   => __( 'Background' ),
			'txt'  => __( 'Headings' ),
			'link' => __( 'Links' ),
			'fg1'  => __( 'Accent #1' ),
			'fg2'  => __( 'Accent #2' ),
		);
	}

	/**
	 * Generate color suggestions for a given role from a set of colors.
	 *
	 * @param array  $colors
	 * @param string $role (bg|fg1|fg2|txt|link)
	 * @return array
	 */
	function color_suggestions( $colors, $role ) {
		if ( ! class_exists( 'Jetpack_color' ) ) {
			require_lib( 'class.color' );
		}

		$suggestions = array();

		$suggestions = array_merge( $suggestions, self::color_suggestions_from_palette( $colors, $role ) );
		$suggestions = array_merge( $suggestions, self::color_suggestions_from_math( $colors, $role ) );

		shuffle( $suggestions );

		return $suggestions;
	}

	/**
	 * Generate color suggestions by grabbing a popular palette and applying
	 * it as a transformation to the colors we're using as a guide.
	 *
	 * @param array  $colors
	 * @param string $role (bg|fg1|fg2|txt|link)
	 * @return array
	 */
	function color_suggestions_from_palette( $colors, $role ) {
		$suggestions = array();

		$top_palette = self::get_color_palettes(
			array(
				'limit'  => 1,
				'offset' => rand(
					0,
					100
				),
			)
		);
		$top_palette = $top_palette[0];

		$equivalent_color_hex = $top_palette['colors'][ $role ];

		foreach ( $top_palette['colors'] as $palette_role => $palette_color_hex ) {
			$base_color_hex = $colors[ $palette_role ];
			try {
				// $base_color:$new_color :: $palette_color:$equivalent_color
				$base_color       = new Jetpack_Color( $base_color_hex );
				$palette_color    = new Jetpack_Color( $palette_color_hex );
				$equivalent_color = new Jetpack_Color( $equivalent_color_hex );

				$palette_hsl    = $palette_color->toHsl();
				$equivalent_hsl = $equivalent_color->toHsl();

				$base_color->incrementHue( $equivalent_hsl['h'] - $palette_hsl['h'] );
				$base_color->saturate( $equivalent_hsl['s'] - $palette_hsl['s'] );
				$base_color->lighten( $equivalent_hsl['l'] - $palette_hsl['l'] );

				$suggestions[] = self::normalize_color( $base_color->toHex() );
			} catch ( RangeException $e ) {
				$message  = "Color exception!\n\n";
				$message .= "role: $role\n";
				$message .= "base: $base_color_hex\n";
				$message .= "palette: $palette_color_hex\n";
				$message .= "equiv: $equivalent_color_hex\n";
				$message .= 'colors arg: ' . print_r( $colors, 1 );
				self::exception_mailer( $message );
				continue;
			}
		}

		return $suggestions;
	}

	private static function exception_mailer( $message = 'Needs a message' ) {
		$message .= "\n\nblog: " . home_url() . "\n";
		$message .= 'backtrace: ' . wp_debug_backtrace_summary() . "\n";
		// wp_mail( 'wiebe@automattic.com', 'Color Exception on WordPress.com', $message );
	}

	/**
	 * Use a set of predefined transformations to generate color suggestions
	 * based on roles.
	 *
	 * @param array  $colors
	 * @param string $role (bg|fg1|fg2|txt|link)
	 * @return array
	 */
	function color_suggestions_from_math( $colors, $role ) {
		$suggestions = array();

		// These are the result of a couple of hours of playing around.
		// Nothing here is set in stone.
		$relations = array(
			'bg:fg1'   => array( 'brighter', 'saturate' ),
			'bg:fg2'   => array( 'darker', 'desaturate' ),
			'bg:txt'   => array( '+triad' ),
			'bg:link'  => array( '-triad' ),
			'fg1:bg'   => array( 'desaturate', 'darker' ),
			'fg1:fg2'  => array( '+analog' ),
			'fg1:txt'  => array( '-tetrad' ),
			'fg1:link' => array( 'darker', 'saturate' ),
			'fg2:bg'   => array( 'saturate', 'brighter' ),
			'fg2:fg1'  => array( '-analog' ),
			'fg2:txt'  => array( '-tetrad' ),
			'fg2:link' => array( 'darker', 'saturate' ),
			'txt:bg'   => array( '+triad' ),
			'txt:fg1'  => array( '+tetrad' ),
			'txt:fg2'  => array( '+tetrad' ),
			'txt:link' => array( '-split-complement', 'saturate' ),
			'link:bg'  => array( '-triad' ),
			'link:fg1' => array( 'desaturate', 'brighter' ),
			'link:fg2' => array( 'desaturate', 'brighter' ),
			'link:txt' => array( 'darker', 'saturate' ),
		);

		foreach ( $colors as $known_role => $color_code ) {
			if ( $known_role == $role ) {
				continue;
			}

			$transforms = $relations[ $known_role . ':' . $role ];
			try {
				$new_color = new Jetpack_Color( self::normalize_color( $color_code ) );
			} catch ( RangeException $e ) {
				$message  = 'function: ' . __FUNCTION__ . "\n";
				$message .= 'call: $new_color = new Jetpack_Color( self::normalize_color( ' . $color_code . ' ) );' . "\n";
				$message .= 'normalized color: ' . self::normalize_color( $color_code );
				self::exception_mailer( $message );
				continue;
			}

			foreach ( $transforms as $transform ) {
				switch ( $transform ) {
					case 'complement':
						$new_color->getComplement();
						break;
					case 'brighter':
						$new_color->lighten( 25 );
						break;
					case 'darker':
						$new_color->darken( 25 );
						break;
					case 'grayscale':
						$new_color->toGrayscale();
						break;
					case '+split-complement':
						$new_color->getSplitComplement( 1 );
						break;
					case '-split-complement':
						$new_color->getSplitComplement( -1 );
						break;
					case '+triad':
						$new_color->getTriad( 1 );
						break;
					case '-triad':
						$new_color->getTriad( -1 );
						break;
					case 'saturate':
						$new_color->saturate( 25 );
						break;
					case 'desaturate':
						$new_color->desaturate( 25 );
						break;
					case '+analog':
						$new_color->getAnalog( 1 );
						break;
					case '-analog':
						$new_color->getAnalog( -1 );
						break;
					case '+tetrad':
						$new_color->getTetrad( 1 );
						break;
					case '-tetrad':
						$new_color->getTetrad( -1 );
						break;
				}
			}

			$suggestions[] = self::normalize_color( $new_color->toHex() );
		}

		return $suggestions;
	}
}

class Colors_Manager extends Colors_Manager_Common {

	/* Nothing to override */

}

function add_color_rule( $category, $default_color, $rules, $label = false ) {
	Colors_Manager::add_color_rule( $category, $default_color, $rules, $label );
}

function add_color_palette( $palette, $title = false ) {
	return Colors_Manager::add_color_palette( $palette, $title );
}

class Colors_Manager_Gutenberg extends Colors_Manager_Common {

	protected static $is_gutenberg = true;

	protected static $annotations_file = 'wpcom-editor-colors.php';

}

function colors_manager_gutenberg_load() {
	if ( get_current_screen()->is_block_editor() ) {
		Colors_Manager_Gutenberg::init(); // Gutenberg
	}
}

function load_corresponding_color_manager() {
	global $pagenow;
	if ( is_admin() && 'customize.php' !== $pagenow && ! defined( 'DOING_AJAX' ) ) {
		add_action( 'current_screen', 'colors_manager_gutenberg_load' );
	} else {
		Colors_Manager::init();
	}
}

add_action( 'init', 'load_corresponding_color_manager' );
