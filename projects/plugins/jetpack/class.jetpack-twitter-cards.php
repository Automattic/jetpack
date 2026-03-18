<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Jetpack Twitter Card handling.
 *
 * @deprecated 15.6 Use Automattic\Jetpack\Post_Media\Twitter_Cards instead.
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Post_Media\Twitter_Cards;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Twitter Cards
 *
 * @deprecated 15.6 Use Automattic\Jetpack\Post_Media\Twitter_Cards instead.
 *
 * @see Automattic\Jetpack\Post_Media\Twitter_Cards
 */
class Jetpack_Twitter_Cards {

	/**
	 * Adds Twitter Card tags.
	 *
	 * @deprecated 15.6 Use Automattic\Jetpack\Post_Media\Twitter_Cards::twitter_cards_tags() instead.
	 *
	 * @param array $og_tags Existing OG tags.
	 *
	 * @return array OG tags inclusive of Twitter Card output.
	 */
	public static function twitter_cards_tags( $og_tags ) {
		_deprecated_function( __METHOD__, '15.6', 'Automattic\Jetpack\Post_Media\Twitter_Cards::twitter_cards_tags' );
		return Twitter_Cards::twitter_cards_tags( $og_tags );
	}

	/**
	 * Sanitize the Twitter user by normalizing the @.
	 *
	 * @deprecated 15.6 Use Automattic\Jetpack\Post_Media\Twitter_Cards::sanitize_twitter_user() instead.
	 *
	 * @param string $str Twitter user value.
	 *
	 * @return string Twitter user value.
	 */
	public static function sanitize_twitter_user( $str ) {
		_deprecated_function( __METHOD__, '15.6', 'Automattic\Jetpack\Post_Media\Twitter_Cards::sanitize_twitter_user' );
		return Twitter_Cards::sanitize_twitter_user( $str );
	}

	/**
	 * Determines if a site tag is one of the default WP.com/Jetpack ones.
	 *
	 * @deprecated 15.6 Use Automattic\Jetpack\Post_Media\Twitter_Cards::is_default_site_tag() instead.
	 *
	 * @param string $site_tag Site tag.
	 *
	 * @return bool True if the default site tag is being used.
	 */
	public static function is_default_site_tag( $site_tag ) {
		_deprecated_function( __METHOD__, '15.6', 'Automattic\Jetpack\Post_Media\Twitter_Cards::is_default_site_tag' );
		return Twitter_Cards::is_default_site_tag( $site_tag );
	}

	/**
	 * Give priority to the creator tag if using the default site tag.
	 *
	 * @deprecated 15.6 Use Automattic\Jetpack\Post_Media\Twitter_Cards::prioritize_creator_over_default_site() instead.
	 *
	 * @param string $site_tag Site tag.
	 * @param array  $og_tags OG tags.
	 *
	 * @return string Site tag.
	 */
	public static function prioritize_creator_over_default_site( $site_tag, $og_tags = array() ) {
		_deprecated_function( __METHOD__, '15.6', 'Automattic\Jetpack\Post_Media\Twitter_Cards::prioritize_creator_over_default_site' );
		return Twitter_Cards::prioritize_creator_over_default_site( $site_tag, $og_tags );
	}

	/**
	 * Define the Twitter Card type based on image count.
	 *
	 * @deprecated 15.6 Use Automattic\Jetpack\Post_Media\Twitter_Cards::twitter_cards_define_type_based_on_image_count() instead.
	 *
	 * @param array $og_tags Existing OG tags.
	 * @param array $extract Result of the Image Extractor class.
	 *
	 * @return array
	 */
	public static function twitter_cards_define_type_based_on_image_count( $og_tags, $extract ) {
		_deprecated_function( __METHOD__, '15.6', 'Automattic\Jetpack\Post_Media\Twitter_Cards::twitter_cards_define_type_based_on_image_count' );
		return Twitter_Cards::twitter_cards_define_type_based_on_image_count( $og_tags, $extract );
	}

	/**
	 * Updates the Twitter Card output.
	 *
	 * @deprecated 15.6 Use Automattic\Jetpack\Post_Media\Twitter_Cards::twitter_cards_output() instead.
	 *
	 * @param string $og_tag A single OG tag.
	 *
	 * @return string Result of the OG tag.
	 */
	public static function twitter_cards_output( $og_tag ) {
		_deprecated_function( __METHOD__, '15.6', 'Automattic\Jetpack\Post_Media\Twitter_Cards::twitter_cards_output' );
		return Twitter_Cards::twitter_cards_output( $og_tag );
	}

	/**
	 * Adds settings section and field.
	 *
	 * @deprecated 15.6 Use Automattic\Jetpack\Post_Media\Twitter_Cards::settings_init() instead.
	 */
	public static function settings_init() {
		_deprecated_function( __METHOD__, '15.6', 'Automattic\Jetpack\Post_Media\Twitter_Cards::settings_init' );
		Twitter_Cards::settings_init();
	}

	/**
	 * Add global sharing options.
	 *
	 * @deprecated 15.6 Use Automattic\Jetpack\Post_Media\Twitter_Cards::sharing_global_options() instead.
	 */
	public static function sharing_global_options() {
		_deprecated_function( __METHOD__, '15.6', 'Automattic\Jetpack\Post_Media\Twitter_Cards::sharing_global_options' );
		Twitter_Cards::sharing_global_options();
	}

	/**
	 * Get the Twitter Via tag.
	 *
	 * @deprecated 15.6 Use Automattic\Jetpack\Post_Media\Twitter_Cards::site_tag() instead.
	 *
	 * @return string Twitter via tag.
	 */
	public static function site_tag() {
		_deprecated_function( __METHOD__, '15.6', 'Automattic\Jetpack\Post_Media\Twitter_Cards::site_tag' );
		return Twitter_Cards::site_tag();
	}

	/**
	 * Output the settings field.
	 *
	 * @deprecated 15.6 Use Automattic\Jetpack\Post_Media\Twitter_Cards::settings_field() instead.
	 */
	public static function settings_field() {
		_deprecated_function( __METHOD__, '15.6', 'Automattic\Jetpack\Post_Media\Twitter_Cards::settings_field' );
		Twitter_Cards::settings_field();
	}

	/**
	 * Validate the settings submission.
	 *
	 * @deprecated 15.6 Use Automattic\Jetpack\Post_Media\Twitter_Cards::settings_validate() instead.
	 */
	public static function settings_validate() {
		_deprecated_function( __METHOD__, '15.6', 'Automattic\Jetpack\Post_Media\Twitter_Cards::settings_validate' );
		Twitter_Cards::settings_validate();
	}

	/**
	 * Initiates the class.
	 *
	 * @deprecated 15.6 Use Automattic\Jetpack\Post_Media\Twitter_Cards::init() instead.
	 */
	public static function init() {
		_deprecated_function( __METHOD__, '15.6', 'Automattic\Jetpack\Post_Media\Twitter_Cards::init' );
		Twitter_Cards::init();
	}
}

Twitter_Cards::init();
