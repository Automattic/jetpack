<?php
/**
 * Enable the `gutenberg-no-tinymce` Gutenberg experiment for all sites.
 *
 * Sites that need TinyMCE can opt out by getting the `enable-tinymce` blog sticker.
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * Add `gutenberg-no-tinymce` to the list of enabled Gutenberg experiments.
 *
 * Both filters are needed: `default_option_` fires when the option doesn't exist
 * in the DB, `option_` fires when it does.
 *
 * @param mixed $experiments The current value of the gutenberg-experiments option.
 * @return array The filtered experiments.
 */
function jetpack_mu_wpcom_enable_gutenberg_no_tinymce( $experiments ) {
	if ( ! is_array( $experiments ) ) {
		$experiments = array();
	}
	$experiments['gutenberg-no-tinymce'] = true;
	return $experiments;
}
add_filter( 'option_gutenberg-experiments', 'jetpack_mu_wpcom_enable_gutenberg_no_tinymce' );
add_filter( 'default_option_gutenberg-experiments', 'jetpack_mu_wpcom_enable_gutenberg_no_tinymce' );

/**
 * Disable the `gutenberg-no-tinymce` experiment on sites with the `enable-tinymce` sticker.
 *
 * Runs at priority 1000 so it overrides the default-on filter above.
 *
 * @param mixed $experiments The current value of the gutenberg-experiments option.
 * @return mixed The filtered experiments.
 */
function jetpack_mu_wpcom_maybe_disable_gutenberg_no_tinymce( $experiments ) {
	if ( ! is_array( $experiments ) ) {
		return $experiments;
	}
	if ( wpcom_has_blog_sticker( 'enable-tinymce', get_wpcom_blog_id() ) ) {
		unset( $experiments['gutenberg-no-tinymce'] );
	}
	return $experiments;
}
add_filter( 'option_gutenberg-experiments', 'jetpack_mu_wpcom_maybe_disable_gutenberg_no_tinymce', 1000 );
add_filter( 'default_option_gutenberg-experiments', 'jetpack_mu_wpcom_maybe_disable_gutenberg_no_tinymce', 1000 );
