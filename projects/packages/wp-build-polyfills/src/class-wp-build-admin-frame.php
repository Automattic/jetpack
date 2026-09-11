<?php
/**
 * Frame fixes for the `@wordpress/boot` single-page layout in wp-admin.
 *
 * @package automattic/jetpack-wp-build-polyfills
 */

namespace Automattic\Jetpack\WP_Build_Polyfills;

/**
 * Reconciles the boot single-page layout with the wp-admin frame: the backdrop
 * continues the admin menu color, and the app keeps its own scroller when the
 * admin menu is taller than the viewport.
 *
 * `@wordpress/admin-ui` derives the backdrop from a fixed map of Core color
 * schemes and falls back to a near-black `modern` seed for any other scheme,
 * WordPress.com and third-party ones included. On WordPress 7.0+ the boot
 * module that runs is Core's bundled copy, so the override is applied from
 * PHP around the page: a stylesheet printed on `admin_head` and a script
 * printed on `in_admin_header` that samples the rendered menu background into
 * a custom property on the root element.
 *
 * The frame is also held steady: painted before boot mounts, and captured whole
 * by the cross-document view transitions Core enables in wp-admin.
 *
 * Pages without a boot layout are unaffected: the selectors match nothing.
 */
class WP_Build_Admin_Frame {

	/**
	 * Hook the stylesheet, the render hold and the frame script. Safe to call repeatedly.
	 *
	 * @return void
	 */
	public static function register() {
		add_action( 'admin_head', array( self::class, 'print_styles' ) );
		add_action( 'admin_head', array( self::class, 'print_render_hold' ) );
		add_action( 'in_admin_header', array( self::class, 'print_script' ) );
	}

	/**
	 * Print the backdrop and scroll-containment overrides.
	 *
	 * The backdrop selectors are (1,1,0), so they outrank the layout rule boot injects
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

			/*
			 * Boot's layout is absolutely positioned against `#wpbody`, which grows
			 * with the admin menu: a menu taller than the viewport stretches the app
			 * and scrolls its sticky header away, so cap `#wpbody` to the viewport to
			 * give the app back its own scroller. Below 783px the menu is off-canvas
			 * and the template scrolls `#wpwrap` instead. Drop this once every boot
			 * this package can run against pins its own layout: Core's bundled copy
			 * from WordPress 7.0, and the polyfilled one below that
			 * (WordPress/gutenberg#82114).
			 */
			@media (min-width: 783px) {
				body.js:has([id$="-wp-admin-app"]:empty) #wpbody,
				body:has(.boot-layout--single-page) #wpbody,
				body:has([class*="__layout-single-page"]) #wpbody {
					position: sticky;
					top: var(--wp-admin--admin-bar--height, 32px);
					height: calc(100vh - var(--wp-admin--admin-bar--height, 32px));
				}

				/*
				 * Paint boot's stage on the empty app container until it mounts, where the
				 * page template's critical CSS would otherwise leave the area white.
				 */
				body.js:has([id$="-wp-admin-app"]:empty) {
					background: var(--wp-build-admin-menu-background, #fff);
				}
				body.js [id$="-wp-admin-app"]:empty {
					position: absolute;
					inset-block: 0 8px;
					inset-inline: 0 8px;
					border-radius: var(--wpds-border-radius-xl, 12px);
					background: var(--wpds-color-background-surface-neutral, #fff);
				}
			}
		</style>
		<?php
	}

	/**
	 * Hold the first render of a wp-build page until the document has parsed.
	 *
	 * Otherwise a cross-document view transition captures the page before its admin
	 * menu and bar exist. An empty inline script is never prepared, so keep the body.
	 *
	 * @return void
	 */
	public static function print_render_hold() {
		if ( ! preg_grep( '/-wp-admin-prerequisites$/', wp_scripts()->queue ) ) {
			return;
		}

		wp_print_inline_script_tag(
			'/* Hold the first render until the document has parsed. */',
			array(
				'id'       => 'wp-build-admin-frame-render-hold',
				'type'     => 'module',
				'blocking' => 'render',
			)
		);
	}

	/**
	 * Print the script that samples the admin menu background and keeps boot's
	 * stage out of cross-document view transitions.
	 *
	 * Runs right after `#adminmenuback` is printed and before the layout
	 * mounts, which is why the property goes on the root element.
	 *
	 * @return void
	 */
	public static function print_script() {
		$script = <<<'JS'
( function () {
	// An old-only stage snapshot zooms out over the next page, so let the root carry it.
	var stages = [];
	window.addEventListener( 'pageswap', function ( event ) {
		if ( ! event.viewTransition ) {
			return;
		}
		stages = Array.prototype.slice.call( document.querySelectorAll(
			'.boot-layout--single-page .boot-layout__stage, .boot-layout--single-page .boot-layout__inspector, [class*="__layout-single-page"] [class*="__stage"], [class*="__layout-single-page"] [class*="__inspector"]'
		) );
		stages.forEach( function ( stage ) {
			stage.style.viewTransitionName = 'none';
		} );
	} );
	window.addEventListener( 'pagereveal', function () {
		stages.forEach( function ( stage ) {
			stage.style.viewTransitionName = '';
		} );
		stages = [];
	} );

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
