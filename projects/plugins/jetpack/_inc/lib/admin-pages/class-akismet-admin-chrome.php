<?php
/**
 * Renders the unified Jetpack admin header and footer chrome on Akismet's admin pages.
 *
 * Akismet (5.7+) exposes two action hooks in its admin views:
 *  - `akismet_header`: when an action is registered, it REPLACES Akismet's default masthead.
 *  - `akismet_footer`: rendered at the bottom of every admin view; empty by default.
 *
 * This integration consumes those hooks from the Jetpack plugin so that Akismet's pages
 * share the same branded header bar, standardized footer AND contained layout as the rest
 * of the unified Jetpack admin (the `@wordpress/admin-ui` page header + `JetpackFooter` look
 * used by My Jetpack, Protect, Social, etc.): a fixed header, an internally-scrolling middle
 * and a footer pinned to the bottom of the viewport.
 *
 * The markup mirrors the admin-ui page header and `.jetpack-footer` component, and the
 * styling is a small self-contained stylesheet (no external CSS, no JS, no build step) that
 * reproduces the measured computed styles of those components plus the
 * `jetpack-admin-page-layout` mixin, adapted to Akismet's markup
 * (`#wpbody-content > #akismet-plugin-container > header / .akismet-lower / footer`). This
 * keeps the integration resilient to the CSS-Module class hashing used by the real React
 * components.
 *
 * NOTE: This class does not modify the Akismet plugin in any way. It only registers
 * callbacks on Akismet's own action hooks.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Redirect;
use Automattic\Jetpack\Status;
use Automattic\Jetpack\Status\Host;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Wires the unified Jetpack header, footer and contained layout onto Akismet's admin pages.
 */
class Akismet_Admin_Chrome {

	/**
	 * The green Jetpack logo mark, sized via the `height` attribute by callers.
	 *
	 * @param int $height Pixel height of the logo.
	 * @return string SVG markup.
	 */
	private function jetpack_logo( $height ) {
		return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" height="' . (int) $height . '" class="jp-akismet-logo" aria-hidden="true"><path fill="#069e08" d="M16,0C7.2,0,0,7.2,0,16s7.2,16,16,16s16-7.2,16-16S24.8,0,16,0z M15,19H7l8-16V19z M17,29V13h8L17,29z"></path></svg>';
	}

	/**
	 * The Akismet logo mark — the green rounded square with the white "A", taken from
	 * Akismet's own `akismet-refresh-logo.svg`. Sized via the `height` attribute by callers.
	 *
	 * @param int $height Pixel height of the logo.
	 * @return string SVG markup.
	 */
	private function akismet_logo( $height ) {
		return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 44 44" height="' . (int) $height . '" class="jp-akismet-mark" aria-hidden="true"><rect width="44" height="44" fill="#357B49" rx="6"/><path fill="#fff" fill-rule="evenodd" d="m29.746 28.31-6.392-16.797c-.152-.397-.305-.672-.789-.675-.673 0-1.408.611-1.746 1.316l-7.378 16.154c-.072.16-.143.311-.214.454-.5.995-1.045 1.546-2.357 1.626a.399.399 0 0 0-.16.033l-.01.004a.399.399 0 0 0-.23.392v.01c0 .054.01.106.03.155l.004.01a.416.416 0 0 0 .394.252h6.212a.417.417 0 0 0 .307-.12.416.416 0 0 0 .124-.305.398.398 0 0 0-.105-.302.399.399 0 0 0-.294-.127c-.757 0-2.197-.062-2.197-1.164.02-.318.103-.63.245-.916l1.399-3.152c.52-1.163 1.654-1.163 2.572-1.163h5.843c.023 0 .044 0 .062.003.13.014.16.081.214.242l1.534 4.07a2.857 2.857 0 0 1 .216 1.04c0 .054-.003.104-.01.153-.09.726-.831.887-1.49.887a.4.4 0 0 0-.294.127l-.007.008-.007.008a.401.401 0 0 0-.092.286v.01c0 .054.01.106.03.155l.005.01a.42.42 0 0 0 .395.252h7.011a.413.413 0 0 0 .279-.13.412.412 0 0 0 .11-.297.387.387 0 0 0-.09-.294.388.388 0 0 0-.277-.135c-1.448-.122-2.295-.643-2.847-2.08Zm-11.985-5.844 2.847-6.304c.361-.728.659-1.486.889-2.265 0-.06.03-.092.06-.092s.061.032.061.091c.02.122.045.247.073.374.197.888.584 1.878.914 2.723l.176.453 1.684 4.529a.927.927 0 0 1 .092.4.473.473 0 0 1-.009.094c-.041.202-.228.272-.602.272h-6.063c-.122 0-.184-.03-.184-.092a.36.36 0 0 1 .062-.183Zm17.107-.721c0 .786-.446 1.231-1.25 1.231-.806 0-1.125-.409-1.125-1.034 0-.786.465-1.231 1.25-1.231.785 0 1.125.427 1.125 1.034ZM9.629 23.002c.803 0 1.25-.447 1.25-1.231 0-.607-.343-1.036-1.128-1.036-.785 0-1.25.447-1.25 1.231 0 .625.325 1.036 1.128 1.036Z" clip-rule="evenodd"/></svg>';
	}

	/**
	 * Register the hooks that drive the chrome.
	 *
	 * Safe to call unconditionally: the header/footer callbacks are only ever fired by
	 * Akismet's own admin views, and the inline stylesheet is printed alongside the header.
	 *
	 * Idempotent: this can be wired from more than one place depending on the platform —
	 * `Jetpack_Admin` on Atomic/self-hosted, and `Akismet_Admin_WPCOM` on WordPress.com
	 * Simple sites (the two run under different load orders). The static guard ensures the
	 * `akismet_header` / `akismet_footer` callbacks are only ever registered once, so the
	 * chrome can never render twice regardless of how many call sites fire.
	 */
	public function init_hooks() {
		static $registered = false;
		if ( $registered ) {
			return;
		}
		$registered = true;

		add_action( 'akismet_header', array( $this, 'render_header' ) );
		add_action( 'akismet_footer', array( $this, 'render_footer' ) );
	}

	/**
	 * The self-contained stylesheet reproducing the admin-ui page header + `.jetpack-footer`
	 * computed styles. Printed once, alongside the header.
	 */
	private function print_styles() {
		static $printed = false;
		if ( $printed ) {
			return;
		}
		$printed = true;
		?>
		<style id="jp-akismet-chrome-css">
			/* ── Header (admin-ui page header look) ── */
			.jp-akismet-header {
				display: flex;
				align-items: center;
				box-sizing: border-box;
				min-height: 72px;
				padding: 16px 24px;
				background: #fff;
				/* `box-shadow` (not `border-bottom`) so the hairline never adds to the
					box and nudges the logo/title off the admin-ui header's vertical center. */
				box-shadow: inset 0 -1px 0 #e4e4e4;
			}
			.jp-akismet-header__title {
				display: flex;
				align-items: center;
				gap: 8px;
			}
			/* 24×24 visual slot centering the 20px logo, matching My Jetpack/Boost. */
			.jp-akismet-header__visual {
				display: flex;
				align-items: center;
				justify-content: center;
				flex-shrink: 0;
				width: 24px;
				height: 24px;
			}
			.jp-akismet-header__title h1 {
				margin: 0;
				padding: 0;
				font-size: 15px;
				font-weight: 500;
				line-height: 20px;
				color: #1e1e1e;
			}
			/* ── Footer (.jetpack-footer look) ── */
			.jp-akismet-footer {
				display: flex;
				align-items: center;
				flex-wrap: wrap;
				gap: 24px;
				box-sizing: border-box;
				padding: 20px 24px;
				border-top: 1px solid #e4e4e4;
				background: #fff;
				color: #1e1e1e;
				font-size: 13px;
			}
			.jp-akismet-footer__logo {
				display: flex;
				align-items: center;
				gap: 8px;
				font-weight: 500;
			}
			.jp-akismet-footer__menu {
				display: flex;
				gap: 16px;
			}
			/* `#akismet-plugin-container a` is green in Akismet's own CSS; this scoped
				selector outranks it so the footer links read as neutral grey (#707070,
				matching My Jetpack's footer links). */
			#akismet-plugin-container .jp-akismet-footer__menu a {
				color: #707070;
				text-decoration: none;
			}
			#akismet-plugin-container .jp-akismet-footer__menu a:hover {
				color: #1e1e1e;
				text-decoration: underline;
			}
			.jp-akismet-footer__a8c {
				margin-inline-start: auto;
				display: inline-flex;
				align-items: center;
			}
			/* Mobile: the byline drops its right-push and wraps to its own full-width
				row, left-aligned — matching how JetpackFooter stacks on other pages. */
			@media (max-width: 782px) {
				.jp-akismet-footer__a8c {
					margin-inline-start: 0;
					flex-basis: 100%;
				}
			}
			.jp-akismet-footer__a8c svg path {
				fill: #707070;
			}

			/* ── Hello Dolly ──
				The `.jetpack-admin-page #dolly` treatment (right-aligned, italic,
				WPDS colors) ships in the jetpack-components / My Jetpack admin CSS,
				which doesn't load on Akismet's page — so without this, Dolly's lyric
				falls back to left-aligned here. Re-declare it so Dolly lands top-right
				exactly like every other unified Jetpack admin page. */
			.jetpack-admin-page #dolly {
				float: none;
				text-align: end;
				background: var(--wpds-color-background-surface-neutral-strong, #fff);
				font-style: italic;
				color: var(--wpds-color-foreground-content-neutral-weak, #87a6bc);
				border-bottom: none;
			}
			@media (max-width: 659px) {
				.jetpack-admin-page #dolly {
					display: none;
				}
			}

			/* ── Contained layout: fixed header, scrolling middle, pinned footer ──
				Mirrors the jetpack-admin-page-layout mixin, adapted to Akismet's
				markup (#wpbody-content > #akismet-plugin-container > header/.akismet-lower/footer).
				Scoped to both menu locations: jetpack_page_… and settings_page_…

				The mixin uses physical `left`/`right` because its SCSS is compiled
				through rtlcss, which emits a flipped stylesheet. This inline `<style>`
				has no such build step, so it uses CSS logical properties
				(`inset-inline-*`, `padding-inline-*`, `margin-inline`) to flip with the
				admin menu under RTL locales. */
			body[class*="_page_akismet-key-config"] #wpcontent {
				padding-inline-start: 0;
			}
			body[class*="_page_akismet-key-config"] #wpfooter {
				display: none;
			}
			/* `#screen-meta-links` (the Screen Options / Help tabs container) is always
				emitted by core's admin header even when empty, and core gives it
				`margin: 0 10px 20px 0`. On wp.com Simple sites its contents are hidden
				but the element — and its 20px bottom margin — remain, reserving a blank
				slot at the very top of the page above the Jetpack header. The
				`jetpack-admin-page-layout` mixin hides it for the same reason; do it here
				too. Left UNSCOPED (not under `_page_akismet-key-config`) on purpose: the
				inline stylesheet is only ever printed on Akismet admin views, and Simple
				renders its stats UI under a different slug (`dashboard_page_akismet-stats`),
				so an unscoped rule covers every page this chrome appears on. */
			#screen-meta-links {
				display: none;
			}
			body[class*="_page_akismet-key-config"] #wpbody-content {
				box-sizing: border-box;
				position: fixed;
				top: var(--wp-admin-bar-height, 32px);
				inset-inline-start: 160px;
				inset-inline-end: 0;
				bottom: 0;
				width: auto;
				padding-bottom: 0;
				overflow: hidden;
				display: flex;
				flex-direction: column;
			}
			body[class*="_page_akismet-key-config"].folded #wpbody-content {
				inset-inline-start: 36px;
			}
			@media (max-width: 960px) {
				body[class*="_page_akismet-key-config"].auto-fold #wpbody-content {
					inset-inline-start: 36px;
				}
			}
			@media (min-width: 961px) {
				body[class*="_page_akismet-key-config"].is-nav-unification:not(.folded) #wpbody-content {
					inset-inline-start: 272px;
				}
			}
			body[class*="_page_akismet-key-config"] #akismet-plugin-container {
				flex: 1 1 auto;
				min-height: 0;
				min-width: 0;
				display: flex;
				flex-direction: column;
				/* Drop Akismet's 1px container border: it insets the whole column by 1px,
					pushing the header logo/title off the admin-ui alignment grid. */
				border: 0;
			}
			body[class*="_page_akismet-key-config"] .jp-akismet-header {
				flex-shrink: 0;
			}
			/* The scrollable middle. Target the generic child between header and
				footer (not `.akismet-lower` specifically) so the config, start AND
				stats (bare iframe) views all get a full-width scroll surface. The
				`#wpbody-content` id keeps these rules ahead of Akismet's own
				`.akismet-lower { width: 720px }`. */
			body[class*="_page_akismet-key-config"] #wpbody-content > #akismet-plugin-container > :not(.jp-akismet-header):not(.jp-akismet-footer) {
				flex: 1 1 auto;
				min-height: 0;
				min-width: 0;
				width: auto;
				max-width: none;
				margin: 0;
				overflow: auto;
			}
			/* Move the readable-width restriction onto the content blocks so the
				scroll surface itself spans the full width (scrolling works wherever
				the pointer is), while the cards stay a comfortable column, left-
				aligned with the header. 45rem ≈ Akismet's original 720px column. */
			body[class*="_page_akismet-key-config"] .akismet-lower > * {
				box-sizing: border-box;
				max-width: 45rem;
				margin-inline: auto;
			}
			body[class*="_page_akismet-key-config"] .jp-akismet-footer {
				flex-shrink: 0;
			}
			@media (max-width: 782px) {
				body[class*="_page_akismet-key-config"] #wpbody-content,
				body[class*="_page_akismet-key-config"].folded #wpbody-content,
				body[class*="_page_akismet-key-config"].auto-fold #wpbody-content {
					top: var(--wp-admin-bar-height, 46px);
					inset-inline-start: 0;
				}
			}
		</style>
		<?php
	}

	/**
	 * Render the admin-ui-style header (Akismet logo + title) that replaces Akismet's default masthead.
	 */
	public function render_header() {
		$this->print_styles();
		?>
		<header class="jp-akismet-header">
			<div class="jp-akismet-header__title">
				<span class="jp-akismet-header__visual" aria-hidden="true"><?php echo $this->akismet_logo( 20 ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- static SVG. ?></span>
				<h1><?php esc_html_e( 'Akismet Anti-spam', 'jetpack' ); ?></h1>
			</div>
		</header>
		<?php
	}

	/**
	 * Render the unified Jetpack footer (`.jetpack-footer` look) at the bottom of the page.
	 */
	public function render_footer() {
		// Match wrap_ui(): link the byline to the local About page when Jetpack isn't connectable,
		// otherwise to the external jetpack.com redirect.
		$connectable = ! Jetpack::is_connection_ready() && ! ( new Status() )->is_offline_mode();
		$a8c_url     = ! $connectable
			? admin_url( 'admin.php?page=jetpack_about' )
			: Redirect::get_url( 'jetpack' );
		?>
		<footer class="jp-akismet-footer jetpack-footer" aria-label="<?php esc_attr_e( 'Jetpack', 'jetpack' ); ?>" role="contentinfo">
			<div class="jp-akismet-footer__logo">
				<?php echo $this->jetpack_logo( 16 ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- static SVG. ?>
				<span><?php esc_html_e( 'Jetpack', 'jetpack' ); ?></span>
			</div>
			<?php if ( ! ( new Host() )->is_wpcom_platform() ) : ?>
			<nav class="jp-akismet-footer__menu">
				<a href="<?php echo esc_url( admin_url( 'admin.php?page=my-jetpack#/products' ) ); ?>"><?php echo esc_html_x( 'Products', 'Navigation item', 'jetpack' ); ?></a>
				<a href="<?php echo esc_url( admin_url( 'admin.php?page=my-jetpack#/help' ) ); ?>"><?php echo esc_html_x( 'Help', 'Navigation item', 'jetpack' ); ?></a>
			</nav>
			<?php endif; ?>
			<a class="jp-akismet-footer__a8c" href="<?php echo esc_url( $a8c_url ); ?>" aria-label="<?php esc_attr_e( 'An Automattic Airline', 'jetpack' ); ?>">
				<svg role="img" x="0" y="0" viewBox="0 0 935 38.2" height="7" aria-hidden="true"><path d="M317.1 38.2c-12.6 0-20.7-9.1-20.7-18.5v-1.2c0-9.6 8.2-18.5 20.7-18.5 12.6 0 20.8 8.9 20.8 18.5v1.2C337.9 29.1 329.7 38.2 317.1 38.2zM331.2 18.6c0-6.9-5-13-14.1-13s-14 6.1-14 13v0.9c0 6.9 5 13.1 14 13.1s14.1-6.2 14.1-13.1V18.6zM175 36.8l-4.7-8.8h-20.9l-4.5 8.8h-7L157 1.3h5.5L182 36.8H175zM159.7 8.2L152 23.1h15.7L159.7 8.2zM212.4 38.2c-12.7 0-18.7-6.9-18.7-16.2V1.3h6.6v20.9c0 6.6 4.3 10.5 12.5 10.5 8.4 0 11.9-3.9 11.9-10.5V1.3h6.7V22C231.4 30.8 225.8 38.2 212.4 38.2zM268.6 6.8v30h-6.7v-30h-15.5V1.3h37.7v5.5H268.6zM397.3 36.8V8.7l-1.8 3.1 -14.9 25h-3.3l-14.7-25 -1.8-3.1v28.1h-6.5V1.3h9.2l14 24.4 1.7 3 1.7-3 13.9-24.4h9.1v35.5H397.3zM454.4 36.8l-4.7-8.8h-20.9l-4.5 8.8h-7l19.2-35.5h5.5l19.5 35.5H454.4zM439.1 8.2l-7.7 14.9h15.7L439.1 8.2zM488.4 6.8v30h-6.7v-30h-15.5V1.3h37.7v5.5H488.4zM537.3 6.8v30h-6.7v-30h-15.5V1.3h37.7v5.5H537.3zM569.3 36.8V4.6c2.7 0 3.7-1.4 3.7-3.4h2.8v35.5L569.3 36.8 569.3 36.8zM628 11.3c-3.2-2.9-7.9-5.7-14.2-5.7 -9.5 0-14.8 6.5-14.8 13.3v0.7c0 6.7 5.4 13 15.3 13 5.9 0 10.8-2.8 13.9-5.7l4 4.2c-3.9 3.8-10.5 7.1-18.3 7.1 -13.4 0-21.6-8.7-21.6-18.3v-1.2c0-9.6 8.9-18.7 21.9-18.7 7.5 0 14.3 3.1 18 7.1L628 11.3zM321.5 12.4c1.2 0.8 1.5 2.4 0.8 3.6l-6.1 9.4c-0.8 1.2-2.4 1.6-3.6 0.8l0 0c-1.2-0.8-1.5-2.4-0.8-3.6l6.1-9.4C318.7 11.9 320.3 11.6 321.5 12.4L321.5 12.4z"></path><path d="M37.5 36.7l-4.7-8.9H11.7l-4.6 8.9H0L19.4 0.8H25l19.7 35.9H37.5zM22 7.8l-7.8 15.1h15.9L22 7.8zM82.8 36.7l-23.3-24 -2.3-2.5v26.6h-6.7v-36H57l22.6 24 2.3 2.6V0.8h6.7v35.9H82.8z"></path><path d="M719.9 37l-4.8-8.9H694l-4.6 8.9h-7.1l19.5-36h5.6l19.8 36H719.9zM704.4 8l-7.8 15.1h15.9L704.4 8zM733 37V1h6.8v36H733zM781 37c-1.8 0-2.6-2.5-2.9-5.8l-0.2-3.7c-0.2-3.6-1.7-5.1-8.4-5.1h-12.8V37H750V1h19.6c10.8 0 15.7 4.3 15.7 9.9 0 3.9-2 7.7-9 9 7 0.5 8.5 3.7 8.6 7.9l0.1 3c0.1 2.5 0.5 4.3 2.2 6.1V37H781zM778.5 11.8c0-2.6-2.1-5.1-7.9-5.1h-13.8v10.8h14.4c5 0 7.3-2.4 7.3-5.2V11.8zM794.8 37V1h6.8v30.4h28.2V37H794.8zM836.7 37V1h6.8v36H836.7zM886.2 37l-23.4-24.1 -2.3-2.5V37h-6.8V1h6.5l22.7 24.1 2.3 2.6V1h6.8v36H886.2zM902.3 37V1H935v5.6h-26v9.2h20v5.5h-20v10.1h26V37H902.3z"></path></svg>
			</a>
		</footer>
		<?php
	}
}
