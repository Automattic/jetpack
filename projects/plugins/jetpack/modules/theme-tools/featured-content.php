<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Theme Tools: functions for Featured Content enhancements.
 *
 * @package automattic/jetpack
 */
use Automattic\Jetpack\Status\Host;

if ( ! class_exists( 'Featured_Content' ) && isset( $GLOBALS['pagenow'] ) && 'plugins.php' !== $GLOBALS['pagenow'] ) {

	/**
	 * Featured Content.
	 *
	 * This module will allow users to define a subset of posts to be displayed in a
	 * theme-designated featured content area.
	 *
	 * This feature will only be activated for themes that declare that they support
	 * it. This can be done by adding code similar to the following during the
	 * "after_setup_theme" action:
	 *
	 * add_theme_support( 'featured-content', array(
	 *     'filter'     => 'mytheme_get_featured_content',
	 *     'max_posts'  => 20,
	 *     'post_types' => array( 'post', 'page' ),
	 * ) );
	 *
	 * For maximum compatibility with different methods of posting users will
	 * designate a featured post tag to associate posts with. Since this tag now has
	 * special meaning beyond that of a normal tags, users will have the ability to
	 * hide it from the front-end of their site.
	 *
	 * @deprecated 13.6 Moved to Classic Theme Helper package.
	 */
	class Featured_Content {
		/**
		 * The maximum number of posts that a Featured Content area can contain. We
		 * define a default value here but themes can override this by defining a
		 * "max_posts" entry in the second parameter passed in the call to
		 * add_theme_support( 'featured-content' ).
		 *
		 * @deprecated 13.6 Moved to Classic Theme Helper package.
		 * @see Featured_Content::init()
		 * @var int
		 */
		public static $max_posts = 15;

		/**
		 * The registered post types supported by Featured Content. Themes can add
		 * Featured Content support for registered post types by defining a
		 * 'post_types' argument (string|array) in the call to
		 * add_theme_support( 'featured-content' ).
		 *
		 * @deprecated 13.6 Moved to Classic Theme Helper package.
		 * @see Featured_Content::init()
		 * @var array
		 */
		public static $post_types = array( 'post' );

		/**
		 * The tag that is used to mark featured content. Users can define
		 * a custom tag name that will be stored in this variable.
		 *
		 * @deprecated 13.6 Moved to Classic Theme Helper package.
		 * @see Featured_Content::hide_featured_term
		 * @var string
		 */
		public static $tag;

		/**
		 * Instantiate.
		 *
		 * All custom functionality will be hooked into the "init" action.
		 *
		 * @deprecated 13.6 Moved to Classic Theme Helper package.
		 */
		public static function setup() {
			_deprecated_function( __METHOD__, 'jetpack-13.6', 'Automattic\\Jetpack\\Classic_Theme_Helper\\Featured_Content::setup' );
			Automattic\Jetpack\Classic_Theme_Helper\Featured_Content::setup();
		}

		/**
		 * Conditionally hook into WordPress.
		 *
		 * Themes must declare that they support this module by adding
		 * add_theme_support( 'featured-content' ); during after_setup_theme.
		 *
		 * If no theme support is found there is no need to hook into WordPress. We'll
		 * just return early instead.
		 *
		 * @deprecated 13.6 Moved to Classic Theme Helper package.
		 *
		 * @uses Featured_Content::$max_posts
		 */
		public static function init() {
			_deprecated_function( __METHOD__, 'jetpack-13.6', 'Automattic\\Jetpack\\Classic_Theme_Helper\\Featured_Content\\init' );
			return Automattic\Jetpack\Classic_Theme_Helper\Featured_Content::init();
		}

		/**
		 * Hide "featured" tag from the front-end.
		 *
		 * Has to run on wp_loaded so that the preview filters of the customizer
		 * have a chance to alter the value.
		 *
		 * @deprecated 13.6 Moved to Classic Theme Helper package.
		 */
		public static function wp_loaded() {
			_deprecated_function( __METHOD__, 'jetpack-13.6', 'Automattic\\Jetpack\\Classic_Theme_Helper\\Featured_Content\\wp_loaded' );
			return Automattic\Jetpack\Classic_Theme_Helper\Featured_Content::wp_loaded();
		}

		/**
		 * Get featured posts
		 *
		 * This method is not intended to be called directly. Theme developers should
		 * place a filter directly in their theme and then pass its name as a value of
		 * the "filter" key in the array passed as the $args parameter during the call
		 * to: add_theme_support( 'featured-content', $args ).
		 *
		 * @deprecated 13.6 Moved to Classic Theme Helper package.
		 * @uses Featured_Content::get_featured_post_ids()
		 *
		 * @return array
		 */
		public static function get_featured_posts() {
			_deprecated_function( __METHOD__, 'jetpack-13.6', 'Automattic\\Jetpack\\Classic_Theme_Helper\\Featured_Content\\get_featured_posts' );
			return Automattic\Jetpack\Classic_Theme_Helper\Featured_Content::get_featured_posts();
		}

		/**
		 * Get featured post IDs
		 *
		 * This function will return the an array containing the post IDs of all
		 * featured posts.
		 *
		 * Sets the "featured_content_ids" transient.
		 *
		 * @deprecated 13.6 Moved to Classic Theme Helper package.
		 * @return array Array of post IDs.
		 */
		public static function get_featured_post_ids() {
			_deprecated_function( __METHOD__, 'jetpack-13.6', 'Automattic\\Jetpack\\Classic_Theme_Helper\\Featured_Content\\get_featured_post_ids' );
			return Automattic\Jetpack\Classic_Theme_Helper\Featured_Content::get_featured_post_ids();
		}

		/**
		 * Delete Transient.
		 *
		 * Hooks in the "save_post" action.
		 *
		 * @deprecated 13.6 Moved to Classic Theme Helper package.
		 * @see Featured_Content::validate_settings().
		 */
		public static function delete_transient() {
			_deprecated_function( __METHOD__, 'jetpack-13.6', 'Automattic\\Jetpack\\Classic_Theme_Helper\\Featured_Content\\delete_transient' );
			Automattic\Jetpack\Classic_Theme_Helper\Featured_Content::delete_transient();
		}

		/**
		 * Flush the Post Tag relationships cache.
		 *
		 * Hooks in the "update_option_featured-content" action.
		 *
		 * @deprecated 13.6 Moved to Classic Theme Helper package.
		 * @param array $prev Previous option data.
		 * @param array $opts New option data.
		 */
		public static function flush_post_tag_cache( $prev, $opts ) {
			_deprecated_function( __METHOD__, 'jetpack-13.6', 'Automattic\\Jetpack\\Classic_Theme_Helper\\Featured_Content\\flush_post_tag_cache' );
			Automattic\Jetpack\Classic_Theme_Helper\Featured_Content::flush_post_tag_cache( $prev, $opts );
		}

		/**
		 * Exclude featured posts from the blog query when the blog is the front-page,
		 * and user has not checked the "Also display tagged posts outside the Featured Content area" checkbox.
		 *
		 * Filter the home page posts, and remove any featured post ID's from it.
		 * Hooked onto the 'pre_get_posts' action, this changes the parameters of the
		 * query before it gets any posts.
		 *
		 * @deprecated 13.6 Moved to Classic Theme Helper package.
		 * @uses Featured_Content::get_featured_post_ids();
		 * @uses Featured_Content::get_setting();
		 * @param WP_Query $query WP_Query object.
		 * @return WP_Query Possibly modified WP_Query
		 */
		public static function pre_get_posts( $query ) {
			_deprecated_function( __METHOD__, 'jetpack-13.6', 'Automattic\\Jetpack\\Classic_Theme_Helper\\Featured_Content\\pre_get_posts' );

			return Automattic\Jetpack\Classic_Theme_Helper\Featured_Content::pre_get_posts( $query );
		}

		/**
		 * Reset tag option when the saved tag is deleted.
		 *
		 * It's important to mention that the transient needs to be deleted, too.
		 * While it may not be obvious by looking at the function alone, the transient
		 * is deleted by Featured_Content::validate_settings().
		 *
		 * Hooks in the "delete_post_tag" action.
		 *
		 * @deprecated 13.6 Moved to Classic Theme Helper package.
		 * @see Featured_Content::validate_settings().
		 *
		 * @param int $tag_id The term_id of the tag that has been deleted.
		 * @return void
		 */
		public static function delete_post_tag( $tag_id ) {
			_deprecated_function( __METHOD__, 'jetpack-13.6', 'Automattic\\Jetpack\\Classic_Theme_Helper\\Featured_Content\\delete_post_tag' );
			Automattic\Jetpack\Classic_Theme_Helper\Featured_Content::delete_post_tag( $tag_id );
		}

		/**
		 * Hide featured tag from displaying when global terms are queried from
		 * the front-end.
		 *
		 * Hooks into the "get_terms" filter.
		 *
		 * @deprecated 13.6 Moved to Classic Theme Helper package.
		 * @uses Featured_Content::get_setting()
		 *
		 * @param array $terms A list of term objects. This is the return value of get_terms().
		 * @param array $taxonomies An array of taxonomy slugs.
		 * @param array $args Array of get_terms() arguments.
		 * @return array $terms
		 */
		public static function hide_featured_term( $terms, $taxonomies, $args ) {
			_deprecated_function( __METHOD__, 'jetpack-13.6', 'Automattic\\Jetpack\\Classic_Theme_Helper\\Featured_Content\\hide_featured_term' );

			return Automattic\Jetpack\Classic_Theme_Helper\Featured_Content::hide_featured_term( $terms, $taxonomies, $args );
		}

		/**
		 * Hide featured tag from displaying when terms associated with a post object
		 * are queried from the front-end.
		 *
		 * Hooks into the "get_the_terms" filter.
		 *
		 * @deprecated 13.6 Moved to Classic Theme Helper package.
		 * @uses Featured_Content::get_setting()
		 *
		 * @param array $terms A list of term objects. This is the return value of get_the_terms().
		 * @param int   $id The ID field for the post object that terms are associated with.
		 * @param array $taxonomy An array of taxonomy slugs.
		 * @return array $terms
		 */
		public static function hide_the_featured_term( $terms, $id, $taxonomy ) {
			_deprecated_function( __METHOD__, 'jetpack-13.6', 'Automattic\\Jetpack\\Classic_Theme_Helper\\Featured_Content\\hide_the_featured_term' );

			return Automattic\Jetpack\Classic_Theme_Helper\Featured_Content::hide_the_featured_term( $terms, $id, $taxonomy );
		}

		/**
		 * Register custom setting on the Settings -> Reading screen.
		 *
		 * @deprecated 13.6 Moved to Classic Theme Helper package.
		 * @uses Featured_Content::render_form()
		 * @uses Featured_Content::validate_settings()
		 *
		 * @return void
		 */
		public static function register_setting() {
			_deprecated_function( __METHOD__, 'jetpack-13.6', 'Automattic\\Jetpack\\Classic_Theme_Helper\\Featured_Content\\register_setting' );
			Automattic\Jetpack\Classic_Theme_Helper\Featured_Content::register_setting();
		}

		/**
		 * Add settings to the Customizer.
		 *
		 * @deprecated 13.6 Moved to Classic Theme Helper package.
		 * @param WP_Customize_Manager $wp_customize Theme Customizer object.
		 */
		public static function customize_register( $wp_customize ) {
			_deprecated_function( __METHOD__, 'jetpack-13.6', 'Automattic\\Jetpack\\Classic_Theme_Helper\\Featured_Content\\customize_register' );
			Automattic\Jetpack\Classic_Theme_Helper\Featured_Content::customize_register( $wp_customize );
		}

		/**
		 * Enqueue the tag suggestion script.
		 *
		 * @deprecated 13.6 Moved to Classic Theme Helper package.
		 */
		public static function enqueue_scripts() {
			_deprecated_function( __METHOD__, 'jetpack-13.6', 'Automattic\\Jetpack\\Classic_Theme_Helper\\Featured_Content\\enqueue_scripts' );
			Automattic\Jetpack\Classic_Theme_Helper\Featured_Content::enqueue_scripts();
		}

		/**
		 * Renders all form fields on the Settings -> Reading screen.
		 *
		 * @deprecated 13.6 Moved to Classic Theme Helper package.
		 */
		public static function render_form() {
			_deprecated_function( __METHOD__, 'jetpack-13.6', 'Automattic\\Jetpack\\Classic_Theme_Helper\\Featured_Content\\render_form' );
			Automattic\Jetpack\Classic_Theme_Helper\Featured_Content::render_form();
		}

		/**
		 * Get settings
		 *
		 * Get all settings recognized by this module. This function will return all
		 * settings whether or not they have been stored in the database yet. This
		 * ensures that all keys are available at all times.
		 *
		 * In the event that you only require one setting, you may pass its name as the
		 * first parameter to the function and only that value will be returned.
		 *
		 * @deprecated 13.6 Moved to Classic Theme Helper package.
		 * @param string $key The key of a recognized setting.
		 * @return mixed Array of all settings by default. A single value if passed as first parameter.
		 */
		public static function get_setting( $key = 'all' ) {
			_deprecated_function( __METHOD__, 'jetpack-13.6', 'Automattic\\Jetpack\\Classic_Theme_Helper\\Featured_Content\\get_setting' );
			return Automattic\Jetpack\Classic_Theme_Helper\Featured_Content::get_setting( $key );
		}

		/**
		 * Validate settings
		 *
		 * Make sure that all user supplied content is in an expected format before
		 * saving to the database. This function will also delete the transient set in
		 * Featured_Content::get_featured_content().
		 *
		 * @deprecated 13.6 Moved to Classic Theme Helper package.
		 * @uses Featured_Content::delete_transient()
		 *
		 * @param array $input Array of settings input.
		 * @return array $output
		 */
		public static function validate_settings( $input ) {
			_deprecated_function( __METHOD__, 'jetpack-13.6', 'Automattic\\Jetpack\\Classic_Theme_Helper\\Featured_Content\\validate_settings' );
			return Automattic\Jetpack\Classic_Theme_Helper\Featured_Content::validate_settings( $input );
		}

		/**
		 * Removes the quantity setting from the options array.
		 *
		 * @deprecated 13.6 Moved to Classic Theme Helper package.
		 * @return void
		 */
		public static function switch_theme() {
			_deprecated_function( __METHOD__, 'jetpack-13.6', 'Automattic\\Jetpack\\Classic_Theme_Helper\\Featured_Content\\switch_theme' );
			Automattic\Jetpack\Classic_Theme_Helper\Featured_Content::switch_theme();
		}

		/**
		 * Update Featured Content term data as necessary when a shared term is split.
		 *
		 * @deprecated 13.6 Moved to Classic Theme Helper package.
		 * @param int    $old_term_id ID of the formerly shared term.
		 * @param int    $new_term_id ID of the new term created for the $term_taxonomy_id.
		 * @param int    $term_taxonomy_id ID for the term_taxonomy row affected by the split.
		 * @param string $taxonomy Taxonomy for the split term.
		 */
		public static function jetpack_update_featured_content_for_split_terms( $old_term_id, $new_term_id, $term_taxonomy_id, $taxonomy ) {
			_deprecated_function( __METHOD__, 'jetpack-13.6', 'Automattic\\Jetpack\\Classic_Theme_Helper\\Featured_Content\\jetpack_update_featured_content_for_split_terms' );
			Automattic\Jetpack\Classic_Theme_Helper\Featured_Content::jetpack_update_featured_content_for_split_terms( $old_term_id, $new_term_id, $term_taxonomy_id, $taxonomy );
		}
	}

	if ( ! ( new Host() )->is_wpcom_platform() ) {
		Automattic\Jetpack\Classic_Theme_Helper\Featured_Content::setup();
	}
}
