<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Register a portfolio post type and handle displaying it anywhere on the site.
 *
 * @package automattic/jetpack
 */

if ( ! class_exists( 'Jetpack_Portfolio' ) ) {
	/**
	 * Jetpack Portfolio.
	 */
	class Jetpack_Portfolio {

		/**
		 * Store an instance of the new class
		 *
		 * @var Automattic\Jetpack\Classic_Theme_Helper\Jetpack_Portfolio
		 */
		protected $new_instance;

		/**
		 * Initialize class.
		 *
		 * @deprecated 13.9 Moved to Classic Theme Helper package.
		 */
		public static function init() {
			_deprecated_function( __FUNCTION__, 'jetpack-13.9' );
			return Automattic\Jetpack\Classic_Theme_Helper\Jetpack_Portfolio::init();
		}

		/**
		 * Conditionally hook into WordPress.
		 *
		 * Setup user option for enabling CPT
		 * If user has CPT enabled, show in admin
		 */
		public function __construct() {
			$this->new_instance = new Automattic\Jetpack\Classic_Theme_Helper\Jetpack_Portfolio();
		}

		/**
		 * Forward all method calls to the Jetpack_Portfolio class.
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
		 * Forward all static method calls to the Jetpack_Portfolio class.
		 *
		 * @param string $name The name of the method.
		 * @param array  $arguments The arguments to pass to the method.
		 *
		 * @throws Exception If the method is not found.
		 */
		public static function __callStatic( $name, $arguments ) {
			if ( method_exists( Automattic\Jetpack\Classic_Theme_Helper\Jetpack_Portfolio::class, $name ) ) {
				return call_user_func_array( array( Automattic\Jetpack\Classic_Theme_Helper\Jetpack_Portfolio::class, $name ), $arguments );
			} else {
				// Handle cases where the method is not found
				throw new Exception( sprintf( 'Undefined static method: %s', esc_html( $name ) ) );
			}
		}

		/**
		 * Registers the custom post types and adds action/filter handlers, but
		 * only if the site supports it
		 *
		 * @deprecated 13.9 Moved to Classic Theme Helper package.
		 */
		public function maybe_register_cpt() {
			_deprecated_function( __FUNCTION__, 'jetpack-13.9' );
			$this->new_instance->maybe_register_cpt();
		}

		/**
		 * Add a checkbox field in 'Settings' > 'Writing'
		 * for enabling CPT functionality.
		 *
		 * @deprecated 13.9 Moved to Classic Theme Helper package.
		 *
		 * @return void
		 */
		public function settings_api_init() {
			_deprecated_function( __FUNCTION__, 'jetpack-13.9' );
			$this->new_instance->settings_api_init();
		}

		/**
		 * HTML code to display a checkbox true/false option
		 * for the Portfolio CPT setting.
		 *
		 * @deprecated 13.9 Moved to Classic Theme Helper package.
		 *
		 * @return void
		 */
		public function setting_html() {
			_deprecated_function( __FUNCTION__, 'jetpack-13.9' );
			$this->new_instance->setting_html();
		}

		/**
		 * Bump Portfolio > New Activation stat.
		 *
		 * @deprecated 13.9 Moved to Classic Theme Helper package.
		 */
		public function new_activation_stat_bump() {
			_deprecated_function( __FUNCTION__, 'jetpack-13.9' );
			$this->new_instance->new_activation_stat_bump();
		}

		/**
		 * Bump Portfolio > Option On/Off stats to get total active.
		 *
		 * @deprecated 13.9 Moved to Classic Theme Helper package.
		 * @param mixed $old The old option value.
		 * @param mixed $new The new option value.
		 */
		public function update_option_stat_bump( $old, $new ) {
			_deprecated_function( __FUNCTION__, 'jetpack-13.9' );
			$this->new_instance->update_option_stat_bump( $old, $new );
		}

		/**
		 * Bump Portfolio > Published Projects stat when projects are published.
		 *
		 * @deprecated 13.9 Moved to Classic Theme Helper package.
		 */
		public function new_project_stat_bump() {
			_deprecated_function( __FUNCTION__, 'jetpack-13.9' );
			$this->new_instance->new_project_stat_bump();
		}

		/**
		 * Flush permalinks when CPT option is turned on/off
		 *
		 * @deprecated 13.9 Moved to Classic Theme Helper package.
		 */
		public function flush_rules_on_enable() {
			_deprecated_function( __FUNCTION__, 'jetpack-13.9' );
			$this->new_instance->flush_rules_on_enable();
		}

		/**
		 * Count published projects and flush permalinks when first projects is published
		 *
		 * @deprecated 13.9 Moved to Classic Theme Helper package.
		 */
		public function flush_rules_on_first_project() {
			_deprecated_function( __FUNCTION__, 'jetpack-13.9' );
			$this->new_instance->flush_rules_on_first_project();
		}

		/**
		 * Flush permalinks when CPT supported theme is activated
		 *
		 * @deprecated 13.9 Moved to Classic Theme Helper package.
		 */
		public function flush_rules_on_switch() {
			_deprecated_function( __FUNCTION__, 'jetpack-13.9' );
			$this->new_instance->flush_rules_on_switch();
		}

		/**
		 * On plugin/theme activation, check if current theme supports CPT
		 *
		 * @deprecated 13.9 Moved to Classic Theme Helper package.
		 */
		public static function activation_post_type_support() {
			_deprecated_function( __FUNCTION__, 'jetpack-13.9' );
			Automattic\Jetpack\Classic_Theme_Helper\Jetpack_Portfolio::activation_post_type_support();
		}

		/**
		 * On theme switch, check if CPT item exists and disable if not
		 *
		 * @deprecated 13.9 Moved to Classic Theme Helper package.
		 */
		public function deactivation_post_type_support() {
			_deprecated_function( __FUNCTION__, 'jetpack-13.9' );
			$this->new_instance->deactivation_post_type_support();
		}

		/**
		 * Register Post Type
		 *
		 * @deprecated 13.9 Moved to Classic Theme Helper package.
		 */
		public function register_post_types() {
			_deprecated_function( __FUNCTION__, 'jetpack-13.9' );
			$this->new_instance->register_post_types();
		}

		/**
		 * Update messages for the Portfolio admin.
		 *
		 * @deprecated 13.9 Moved to Classic Theme Helper package.
		 * @param array $messages Existing post update messages.
		 */
		public function updated_messages( $messages ) {
			_deprecated_function( __FUNCTION__, 'jetpack-13.9' );
			$this->new_instance->updated_messages( $messages );
		}

		/**
		 * Change ‘Title’ column label
		 * Add Featured Image column
		 *
		 * @deprecated 13.9 Moved to Classic Theme Helper package.
		 *
		 * @param array $columns An array of column names.
		 */
		public function edit_admin_columns( $columns ) {
			_deprecated_function( __FUNCTION__, 'jetpack-13.9' );
			$this->new_instance->edit_admin_columns( $columns );
		}

		/**
		 * Add featured image to column
		 *
		 * @deprecated 13.9 Moved to Classic Theme Helper package.
		 *
		 * @param string $column  The name of the column to display.
		 * @param int    $post_id The current post ID.
		 */
		public function image_column( $column, $post_id ) {
			_deprecated_function( __FUNCTION__, 'jetpack-13.9' );
			$this->new_instance->image_column( $column, $post_id );
		}

		/**
		 * Adjust image column width
		 *
		 * @deprecated 13.9 Moved to Classic Theme Helper package.
		 *
		 * @param string $hook Page hook.
		 */
		public function enqueue_admin_styles( $hook ) {
			_deprecated_function( __FUNCTION__, 'jetpack-13.9' );
			$this->new_instance->enqueue_admin_styles( $hook );
		}

		/**
		 * Adds portfolio section to the Customizer.
		 *
		 * @deprecated 13.9 Moved to Classic Theme Helper package.
		 *
		 * @param WP_Customize_Manager $wp_customize Customizer instance.
		 */
		public function customize_register( $wp_customize ) {
			_deprecated_function( __FUNCTION__, 'jetpack-13.9' );
			$this->new_instance->customize_register( $wp_customize );
		}

		/**
		 * Follow CPT reading setting on CPT archive and taxonomy pages
		 *
		 * @deprecated 13.9 Moved to Classic Theme Helper package.
		 *  @param WP_Query $query A WP_Query instance.
		 */
		public function query_reading_setting( $query ) {
			_deprecated_function( __FUNCTION__, 'jetpack-13.9' );
			$this->new_instance->query_reading_setting( $query );
		}

		/**
		 * If Infinite Scroll is set to 'click', use our custom reading setting instead of core's `posts_per_page`.
		 *
		 * @deprecated 13.9 Moved to Classic Theme Helper package.
		 * @param array $settings Array of Infinite Scroll settings.
		 */
		public function infinite_scroll_click_posts_per_page( $settings ) {
			_deprecated_function( __FUNCTION__, 'jetpack-13.9' );
			$this->new_instance->infinite_scroll_click_posts_per_page( $settings );
		}

		/**
		 * Filter the results of infinite scroll to make sure we get `lastbatch` right.
		 *
		 * @deprecated 13.9 Moved to Classic Theme Helper package.
		 * @param array    $results    Array of Infinite Scroll results.
		 * @param array    $query_args Array of main query arguments.
		 * @param WP_Query $query      WP Query.
		 */
		public function infinite_scroll_results( $results, $query_args, $query ) {
			_deprecated_function( __FUNCTION__, 'jetpack-13.9' );
			$this->new_instance->infinite_scroll_results( $results, $query_args, $query );
		}

		/**
		 * Add CPT to Dotcom sitemap
		 *
		 * @deprecated 13.9 Moved to Classic Theme Helper package.
		 * @param array $post_types Array of post types included in sitemap.
		 */
		public function add_to_sitemap( $post_types ) {
			_deprecated_function( __FUNCTION__, 'jetpack-13.9' );
			$this->new_instance->add_to_sitemap( $post_types );
		}

		/**
		 * Add to REST API post type allowed list.
		 *
		 * @deprecated 13.9 Moved to Classic Theme Helper package.
		 * @param array $post_types Array of post types to add to the allowed list. Default to `array( 'post', 'page', 'revision' )`.
		 */
		public function allow_portfolio_rest_api_type( $post_types ) {
			_deprecated_function( __FUNCTION__, 'jetpack-13.9' );
			$this->new_instance->allow_portfolio_rest_api_type( $post_types );
		}

		/**
		 * Our [portfolio] shortcode.
		 * Prints Portfolio data styled to look good on *any* theme.
		 *
		 * @deprecated 13.9 Moved to Classic Theme Helper package.
		 * @param array $atts Shortcode attributes.
		 *
		 * @return string html
		 */
		public static function portfolio_shortcode( $atts ) {
			_deprecated_function( __FUNCTION__, 'jetpack-13.9' );
			return Automattic\Jetpack\Classic_Theme_Helper\Jetpack_Portfolio::portfolio_shortcode( $atts );
		}
	}
}
