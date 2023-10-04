<?php
/**
 * Gutenberg's Block Theme Previews feature
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Assets;

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

/**
 * Enqueue the block theme previews script
 *
 * @since 4.14.0
 */
Assets::register_script(
	'jetpack-mu-wpcom',
	'../../../build/features/block-theme-previews/block-theme-previews.js',
	__FILE__,
	array(
		'in_footer'  => true,
		'textdomain' => 'jetpack-mu-wpcom',
	)
);
Assets::enqueue_script( 'jetpack-mu-wpcom' );
