<?php
/**
 * Gutenberg's Block Theme Previews feature
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * Always show the correct homepage when previewing a theme in the Site Editor
 *
 * @see https://github.com/Automattic/wp-calypso/issues/79221
 * @since 12.4
 */
add_filter(
	'option_show_on_front',
	function () {
		return 'posts';
	}
);
