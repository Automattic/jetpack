<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Register a Testimonial post type and handle displaying it anywhere on the site.
 *
 * @package automattic/jetpack
 *
 * @phpcs:disable Generic.Files.OneObjectStructurePerFile.MultipleFound
 */

// phpcs:disable Universal.Files.SeparateFunctionsFromOO.Mixed -- TODO: Move classes to appropriately-named class files.

if ( ! class_exists( 'Jetpack_Testimonial' ) ) {
	/**
	 * Add a Testimonial CPT, and display it with a shortcode
	 */
	class Jetpack_Testimonial {

		/**
		 * Store an instance of the new class
		 *
		 * @var Automattic\Jetpack\Classic_Theme_Helper\Jetpack_Testimonial
		 */
		protected $new_instance;

		/**
		 * Initialize class.
		 *
		 * @deprecated 14.2 Moved to Classic Theme Helper package.
		 */
		public static function init() {
			_deprecated_function( __FUNCTION__, 'jetpack-14.2' );
			return Automattic\Jetpack\Classic_Theme_Helper\Jetpack_Testimonial::init();
		}

		/**
		 * Conditionally hook into WordPress.
		 *
		 * Setup user option for enabling CPT.
		 * If user has CPT enabled, show in admin.
		 */
		public function __construct() {
			$this->new_instance = new Automattic\Jetpack\Classic_Theme_Helper\Jetpack_Testimonial();
		}

		/**
		 * Forward all method calls to the Jetpack_Testimonial class.
		 *
		 * @param string $name The name of the method.
		 * @param array  $arguments The arguments to pass to the method.
		 *
		 * @throws Exception If the method is not found.
		 */
		public function __call( $name, $arguments ) {
			if ( method_exists( $this->new_instance, $name ) ) {
				return call_user_func_array( array( $this->new_instance, $name ), $arguments );
			} else {
				// Handle cases where the method is not found
				throw new Exception( sprintf( 'Undefined method: %s', esc_html( $name ) ) );
			}
		}

		/**
		 * Forward all static method calls to the Jetpack_Testimonial class.
		 *
		 * @param string $name The name of the method.
		 * @param array  $arguments The arguments to pass to the method.
		 *
		 * @throws Exception If the method is not found.
		 */
		public static function __callStatic( $name, $arguments ) {
			if ( method_exists( Automattic\Jetpack\Classic_Theme_Helper\Jetpack_Testimonial::class, $name ) ) {
				return call_user_func_array( array( Automattic\Jetpack\Classic_Theme_Helper\Jetpack_Testimonial::class, $name ), $arguments );
			} else {
				// Handle cases where the method is not found
				throw new Exception( sprintf( 'Undefined static method: %s', esc_html( $name ) ) );
			}
		}

		/**
		 * Registers the custom post types and adds action/filter handlers, but
		 * only if the site supports it.
		 *
		 * @deprecated 14.2 Moved to Classic Theme Helper package.
		 */
		public function maybe_register_cpt() {
			_deprecated_function( __FUNCTION__, 'jetpack-14.2' );
			$this->new_instance->maybe_register_cpt();
		}

		/**
		 * Add a checkbox field in 'Settings' > 'Writing'
		 * for enabling CPT functionality.
		 *
		 * @deprecated 14.2 Moved to Classic Theme Helper package.
		 *
		 * @return void
		 */
		public function settings_api_init() {
			_deprecated_function( __FUNCTION__, 'jetpack-14.2' );
			$this->new_instance->settings_api_init();
		}

		/**
		 * HTML code to display a checkbox true/false option
		 * for the CPT setting.
		 *
		 * @deprecated 14.2 Moved to Classic Theme Helper package.
		 *
		 * @return void
		 */
		public function setting_html() {
			_deprecated_function( __FUNCTION__, 'jetpack-14.2' );
			$this->new_instance->setting_html();
		}

		/**
		 * Add to REST API post type allowed list.
		 *
		 *  @param array $post_types Array of allowed post types.
		 * @return array `$post_types` with our type added.
		 */
		public function allow_cpt_rest_api_type( $post_types ) {
			_deprecated_function( __FUNCTION__, 'jetpack-14.2' );
			return $this->new_instance->allow_cpt_rest_api_type( $post_types );
		}

		/**
		 * Bump Testimonial > New Activation stat
		 *
		 * @deprecated 14.2 Moved to Classic Theme Helper package.
		 */
		public function new_activation_stat_bump() {
			_deprecated_function( __FUNCTION__, 'jetpack-14.2' );
			$this->new_instance->new_activation_stat_bump();
		}

		/**
		 * Bump Testimonial > Option On/Off stats to get total active
		 *
		 * @deprecated 14.2 Moved to Classic Theme Helper package.
		 *
		 * @param mixed $old The old option value.
		 * @param mixed $new The new option value.
		 */
		public function update_option_stat_bump( $old, $new ) {
			_deprecated_function( __FUNCTION__, 'jetpack-14.2' );
			$this->new_instance->update_option_stat_bump( $old, $new );
		}

		/**
		 * Bump Testimonial > Published Testimonials stat when testimonials are published
		 *
		 * @deprecated 14.2 Moved to Classic Theme Helper package.
		 */
		public function new_testimonial_stat_bump() {
			_deprecated_function( __FUNCTION__, 'jetpack-14.2' );
			$this->new_instance->new_testimonial_stat_bump();
		}

		/**
		 * Flush permalinks when CPT option is turned on/off
		 *
		 * @deprecated 14.2 Moved to Classic Theme Helper package.
		 */
		public function flush_rules_on_enable() {
			_deprecated_function( __FUNCTION__, 'jetpack-14.2' );
			$this->new_instance->flush_rules_on_enable();
		}

		/**
		 * Count published testimonials and flush permalinks when first testimonial is published
		 *
		 * @deprecated 14.2 Moved to Classic Theme Helper package.
		 */
		public function flush_rules_on_first_testimonial() {
			_deprecated_function( __FUNCTION__, 'jetpack-14.2' );
			$this->new_instance->flush_rules_on_first_testimonial();
		}

		/**
		 * Flush permalinks when CPT supported theme is activated
		 *
		 * @deprecated 14.2 Moved to Classic Theme Helper package.
		 */
		public function flush_rules_on_switch() {
			_deprecated_function( __FUNCTION__, 'jetpack-14.2' );
			$this->new_instance->flush_rules_on_switch();
		}

		/**
		 * On plugin/theme activation, check if current theme supports CPT
		 *
		 * @deprecated 14.2 Moved to Classic Theme Helper package.
		 */
		public static function activation_post_type_support() {
			_deprecated_function( __FUNCTION__, 'jetpack-14.2' );
			Automattic\Jetpack\Classic_Theme_Helper\Jetpack_Testimonial::activation_post_type_support();
		}

		/**
		 * On theme switch, check if CPT item exists and disable if not
		 *
		 * @deprecated 14.2 Moved to Classic Theme Helper package.
		 */
		public function deactivation_post_type_support() {
			_deprecated_function( __FUNCTION__, 'jetpack-14.2' );
			$this->new_instance->deactivation_post_type_support();
		}

		/**
		 * Register Post Type
		 *
		 * @deprecated 14.2 Moved to Classic Theme Helper package.
		 */
		public function register_post_types() {
			_deprecated_function( __FUNCTION__, 'jetpack-14.2' );
			$this->new_instance->register_post_types();
		}

		/**
		 * Update messages for the Testimonial admin.
		 *
		 * @deprecated 14.2 Moved to Classic Theme Helper package.
		 *
		 * @param array $messages Existing post update messages.
		 * @return array Updated `$messages`.
		 */
		public function updated_messages( $messages ) {
			_deprecated_function( __FUNCTION__, 'jetpack-14.2' );
			return $this->new_instance->updated_messages( $messages );
		}

		/**
		 * Change ‘Enter Title Here’ text for the Testimonial.
		 *
		 * @deprecated 14.2 Moved to Classic Theme Helper package.
		 *
		 * @param string $title Placeholder text. Default 'Add title'.
		 * @return string Replacement title.
		 */
		public function change_default_title( $title ) {
			_deprecated_function( __FUNCTION__, 'jetpack-14.2' );
			return $this->new_instance->change_default_title( $title );
		}

		/**
		 * Change ‘Title’ column label on all Testimonials page.
		 *
		 * @deprecated 14.2 Moved to Classic Theme Helper package.
		 *
		 * @param array $columns An array of column names.
		 * @return array Updated array.
		 */
		public function edit_title_column_label( $columns ) {
			_deprecated_function( __FUNCTION__, 'jetpack-14.2' );
			return $this->new_instance->edit_title_column_label( $columns );
		}

		/**
		 * Follow CPT reading setting on CPT archive page
		 *
		 * @deprecated 14.2 Moved to Classic Theme Helper package.
		 *
		 * @param WP_Query $query A WP_Query instance.
		 */
		public function query_reading_setting( $query ) {
			_deprecated_function( __FUNCTION__, 'jetpack-14.2' );
			$this->new_instance->query_reading_setting( $query );
		}

		/**
		 * If Infinite Scroll is set to 'click', use our custom reading setting instead of core's `posts_per_page`.
		 *
		 * @deprecated 14.2 Moved to Classic Theme Helper package.
		 *
		 * @param array $settings Array of Infinite Scroll settings.
		 * @return array Updated `$settings`.
		 */
		public function infinite_scroll_click_posts_per_page( $settings ) {
			_deprecated_function( __FUNCTION__, 'jetpack-14.2' );
			return $this->new_instance->infinite_scroll_click_posts_per_page( $settings );
		}

		/**
		 * Add CPT to Dotcom sitemap
		 *
		 * @deprecated 14.2 Moved to Classic Theme Helper package.
		 *
		 * @param array $post_types Array of post types included in sitemap.
		 * @return array Updated `$post_types`.
		 */
		public function add_to_sitemap( $post_types ) {
			_deprecated_function( __FUNCTION__, 'jetpack-14.2' );
			return $this->new_instance->add_to_sitemap( $post_types );
		}

		/**
		 * Adds a submenu link to the Customizer.
		 *
		 * @deprecated 14.2 Moved to Classic Theme Helper package.
		 */
		public function add_customize_page() {
			_deprecated_function( __FUNCTION__, 'jetpack-14.2' );
			$this->new_instance->add_customize_page();
		}

		/**
		 * Adds testimonial section to the Customizer.
		 *
		 * @deprecated 14.2 Moved to Classic Theme Helper package.
		 *
		 * @param WP_Customize_Manager $wp_customize Customizer instance.
		 */
		public function customize_register( $wp_customize ) {
			_deprecated_function( __FUNCTION__, 'jetpack-14.2' );
			$this->new_instance->customize_register( $wp_customize );
		}

		/**
		 * Add Featured image to theme mod if necessary.
		 *
		 * @deprecated 14.2 Moved to Classic Theme Helper package.
		 *
		 * @param array $opt The value of the current theme modification.
		 * @return array Updated `$opt`.
		 */
		public function coerce_testimonial_image_to_url( $opt ) {
			_deprecated_function( __FUNCTION__, 'jetpack-14.2' );
			return $this->new_instance->coerce_testimonial_image_to_url( $opt );
		}

		/**
		 * Our [testimonial] shortcode.
		 * Prints Testimonial data styled to look good on *any* theme.
		 *
		 * @deprecated 14.2 Moved to Classic Theme Helper package.
		 *
		 * @param array $atts Shortcode attributes.
		 *
		 * @return string HTML from `self::jetpack_testimonial_shortcode_html()`.
		 */
		public static function jetpack_testimonial_shortcode( $atts ) {
			_deprecated_function( __FUNCTION__, 'jetpack-14.2' );
			return Automattic\Jetpack\Classic_Theme_Helper\Jetpack_Testimonial::jetpack_testimonial_shortcode( $atts );
		}
	}

	/**
	 * Additional Testimonial customizer options.
	 *
	 * @deprecated 14.2 Moved to Classic Theme Helper package.
	 */
	function jetpack_testimonial_custom_control_classes() {
		_deprecated_function( __FUNCTION__, 'jetpack-14.2' );
		/**
		 * Clean the title parameter.
		 */
		class Jetpack_Testimonial_Title_Control extends WP_Customize_Control {
			/**
			 * Sanitize content passed to control.
			 *
			 * @deprecated 14.2 Moved to Classic Theme Helper package.
			 *
			 * @param string $value Control value.
			 * @return string Sanitized value.
			 */
			public static function sanitize_content( $value ) {
				_deprecated_function( __FUNCTION__, 'jetpack-14.2' );
				return Automattic\Jetpack\Classic_Theme_Helper\Jetpack_Testimonial_Title_Control::sanitize_content( $value );
			}
		}

		/**
		 * Clean textarea content.
		 */
		class Jetpack_Testimonial_Textarea_Control extends WP_Customize_Control {
			/**
			 * Control type.
			 *
			 * @var string
			 */
			public $type = 'textarea';

			/**
			 * Render the control's content.
			 *
			 * @deprecated 14.2 Moved to Classic Theme Helper package.
			 */
			public function render_content() {
				_deprecated_function( __FUNCTION__, 'jetpack-14.2' );
				$testimonial_textarea_control = new Automattic\Jetpack\Classic_Theme_Helper\Jetpack_Testimonial_Textarea_Control( $this->manager, $this->id, $this->args );
				$testimonial_textarea_control->render_content();
			}

			/**
			 * Sanitize content passed to control.
			 *
			 * @deprecated 14.2 Moved to Classic Theme Helper package.
			 *
			 * @param string $value Control value.
			 * @return string Sanitized value.
			 */
			public static function sanitize_content( $value ) {
				_deprecated_function( __FUNCTION__, 'jetpack-14.2' );
				return Automattic\Jetpack\Classic_Theme_Helper\Jetpack_Testimonial_Textarea_Control::sanitize_content( $value );
			}
		}
	}
}
