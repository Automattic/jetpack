<?php
/**
 * Utilities for working with Headstart annotations.
 *
 * @package wpcomsh
 */

/**
 * Retrieves the headstart annotation for a given theme.
 *
 * @param string $theme_name The name of the theme.
 * @param string $locale The preferred locale.
 * @param string $fallback_locale The locale that's preferred if $locale is not found.
 *
 * @return object|bool It will return an object that contains the headstart annotation or
 * false if it doesn't exist.
 */
function wpcomsh_headstart_get_annotation( $theme_name, $locale, $fallback_locale ) {
	if ( ! in_array( $locale, array( 'pt-br', 'zh-cn', 'zh-tw' ), true ) ) {
		$locale = strtok( $locale, '-' );
	}

	// 1. Check valid theme.
	$theme = wp_get_theme( $theme_name );
	if ( is_wp_error( $theme->errors() ) ) {
		return false;
	}

	$themes_dir     = WP_CONTENT_DIR . '/themes';
	$annotation_dir = 'inc/headstart';

	// 2. Get annotation file path
	$annotation_uri = $themes_dir . "/$theme_name/$annotation_dir/$locale.json";
	// 3. Check annotation URI.
	if ( ! is_readable( $annotation_uri ) ) {
		// 3.1. Try with fallback locale.
		$annotation_uri = $themes_dir . "/$theme_name/$annotation_dir/$fallback_locale.json";
		if ( ! is_readable( $annotation_uri ) ) {
			// 3.2 Try with wp-content/lib/headstart/class-headstart-annotations.php?r=6bba545e#171.
			$annotation_uri = WP_CONTENT_DIR . '/lib/headstart/annotations/' . $locale . '.json';
			if ( ! is_readable( $annotation_uri ) ) {
				return false;
			}
		}
	}
	// 4. Get annotation content.
	// phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
	$annotation_string = file_get_contents( $annotation_uri );
	// 5. Check for content.
	if ( false === $annotation_string ) {
		return false;
	}

	// 6. Decode content.
	$annotation = json_decode( $annotation_string, true );
	// 7. Check decoded content.
	if (
		empty( $annotation ) ||
		! is_array( $annotation ) ||
		! array_key_exists( 'content', $annotation ) ||
		! is_array( $annotation['content'] )
	) {
		return false;
	}
	// 8. maybe_filter_annotation_for_non_gutenberg_users in headstart/class-headstart-annotations.php.
	$is_gutenberg_user = true;
	if ( class_exists( '\Jetpack_User_Agent_Info' ) ) {
		$is_gutenberg_user = ! \Jetpack_User_Agent_Info::is_mobile_app();
	}
	if ( $is_gutenberg_user ) {
		$annotation = apply_filters( 'headstart_gutenberg_annotation_filter', $annotation, $theme_name, false, false, $locale );
	}
	return $annotation;
}
