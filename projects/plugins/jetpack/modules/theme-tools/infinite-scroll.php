<?php
/**
 * Theme Tools: Infinite Scroll functions.
 *
 * @package automattic/jetpack
 */

/**
 * The function doesn't do anything.
 *
 * @deprecated $$next-version$$
 *
 * @return void
 */
function jetpack_load_infinite_scroll_annotation() {}

/**
 * Prevent IS from being activated if theme doesn't support it
 *
 * @deprecated $$next-version$$ The function is no longer in use.
 *
 * @filter jetpack_can_activate_infinite-scroll
 * @return bool
 */
function jetpack_can_activate_infinite_scroll() {
	return (bool) current_theme_supports( 'infinite-scroll' );
}
