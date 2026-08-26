<?php
/**
 * Backdrop for the `@wordpress/boot` single-page layout in wp-admin.
 *
 * @package automattic/jetpack-wp-build-polyfills
 */

namespace Automattic\Jetpack\WP_Build_Polyfills;

/**
 * Makes the boot single-page backdrop continue the wp-admin menu color.
 *
 * `@wordpress/admin-ui` derives the backdrop from a fixed map of Core color
 * schemes and falls back to a near-black `modern` seed for any other scheme,
 * WordPress.com and third-party ones included. On WordPress 7.0+ the boot
 * module that runs is Core's bundled copy, so the override is applied from
 * PHP around the page: a stylesheet printed on `admin_head` and a script
 * printed on `in_admin_header` that samples the rendered menu background into
 * a custom property on the root element.
 *
 * Pages without a boot layout are unaffected: the selectors match nothing.
 */
class WP_Build_Admin_Frame {

	/**
	 * Hook the stylesheet and the sampling script. Safe to call repeatedly.
	 *
	 * @return void
	 */
	public static function register() {
		add_action( 'admin_head', array( self::class, 'print_styles' ) );
		add_action( 'in_admin_header', array( self::class, 'print_script' ) );
	}

	/**
	 * Print the backdrop override.
	 *
	 * Both selectors are (1,1,0), so they outrank the layout rule boot injects
	 * at runtime. The fallbacks keep boot's own colors when the sampling script
	 * did not run.
	 *
	 * @return void
	 */
	public static function print_styles() {
		// The layout root is `.boot-layout--single-page` up to boot 0.20. From
		// boot 0.21 (WordPress/gutenberg#81756, Gutenberg 23.9) the styles are
		// CSS Modules and the class is `_<hash>__layout-single-page`, so the
		// attribute selector matches the local name whatever the hash is.
		?>
		<style id="wp-build-admin-frame-css">
			#wpcontent .boot-layout--single-page,
			#wpcontent [class*="__layout-single-page"] {
				background: var(--wp-build-admin-menu-background, var(--wpds-color-background-surface-neutral-weak));
			}
			body:has(.boot-layout--single-page),
			body:has([class*="__layout-single-page"]) {
				background: var(--wp-build-admin-menu-background, #fff);
			}
		</style>
		<?php
	}

	/**
	 * Print the script that samples the admin menu background.
	 *
	 * Runs right after `#adminmenuback` is printed and before the layout
	 * mounts, which is why the property goes on the root element.
	 *
	 * @return void
	 */
	public static function print_script() {
		$script = <<<'JS'
( function () {
	var menu = document.getElementById( 'adminmenuback' );
	if ( ! menu ) {
		return;
	}
	var color = window.getComputedStyle( menu ).backgroundColor;
	if ( ! color || 'rgba(0, 0, 0, 0)' === color || 'transparent' === color ) {
		return;
	}
	document.documentElement.style.setProperty( '--wp-build-admin-menu-background', color );
} )();
JS;

		wp_print_inline_script_tag( $script, array( 'id' => 'wp-build-admin-frame-js' ) );
	}
}
