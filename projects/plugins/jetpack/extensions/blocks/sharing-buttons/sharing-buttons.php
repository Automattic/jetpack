<?php
/**
 * Sharing Buttons Block.
 *
 * @since 11.x
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\Sharing_Buttons;

use Automattic\Jetpack\Blocks;
use Jetpack_Gutenberg;
/**
 * Registers the block for use in Gutenberg
 * This is done via an action so that we can disable
 * registration if we need to.
 */
function register_block() {
	Blocks::jetpack_register_block(
		__DIR__,
		array( 'render_callback' => __NAMESPACE__ . '\load_assets' )
	);
}
add_action( 'init', __NAMESPACE__ . '\register_block' );

/**
 * Sharing Buttons block registration/dependency declaration.
 *
 * @param array  $attr    Array containing the Sharing Buttons block attributes.
 * @param string $content String containing the Sharing Buttons block content.
 *
 * @return string
 */
function load_assets( $attr, $content ) {
	/*
	 * Enqueue necessary scripts and styles.
	 */
	Jetpack_Gutenberg::load_assets_as_required( __DIR__ );
	return $content;
}

/**
 * Add sharing JavaScript to the footer of a page.
 *
 * @return void
 */
function sharing_add_footer() {
	?>
	<script>
	const variations = ['print', 'facebook', 'linkedin', 'mail', 'mastodon', 'patreon', 'pinterest', 'pocket', 'reddit', 'skype', 'telegram', 'tumblr', 'twitch', 'whatsapp', 'x', 'nextdoor']
	let windowOpen;

	( function () {
		function matches( el, sel ) {
			if ( ! el ) {
				return false;
			}
			return !! (
				( el.matches && el.matches( sel ) ) ||
				( el.msMatchesSelector && el.msMatchesSelector( sel ) )
			);
		}
		variations.forEach(variation => {
			document.querySelectorAll(`a.share-${variation}`).forEach(link => {
				link.addEventListener('click', event => {
					event.preventDefault();

					const el = event.target.closest(`a.share-${variation}`);
					if (!el) return;

					if (windowOpen !== undefined) {
						windowOpen.close();
					}

					const options = 'enubar=1,resizable=1,width=600,height=400';
					windowOpen = window.open(el.getAttribute('href'), `wpcom${variation}`, options);
					if (windowOpen) {
						windowOpen.focus();
					}
				});
			});
		});
	} )();

	</script>
	<?php
}

add_action( 'wp_footer', __NAMESPACE__ . '\sharing_add_footer' );