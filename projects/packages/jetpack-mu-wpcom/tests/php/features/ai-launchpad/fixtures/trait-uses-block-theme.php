<?php
/**
 * Block-theme activation for the AI Launchpad tests.
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * Makes `wp_is_block_theme()` report true, which it otherwise never does in this harness.
 *
 * The test environment ships an empty themes directory, so `wp_get_theme()` resolves to a theme that does
 * not exist on disk and `is_block_theme()` is false — for every test, permanently. A gate keyed off it would
 * then only ever be observed taking its false branch, which is a statement about the harness rather than
 * about the gate. This registers a minimal on-disk block theme (a `style.css` plus the `templates/index.html`
 * that `WP_Theme::is_block_theme()` actually looks for) and points the active stylesheet at it.
 */
trait AI_Launchpad_Uses_Block_Theme {

	/**
	 * `$GLOBALS['wp_theme_directories']` as it was before use_block_theme() ran, or null when it did not run.
	 *
	 * @var array|null
	 */
	private $theme_directories_before = null;

	/**
	 * Activates the fixture block theme for the duration of one test.
	 *
	 * WorDBless restores hooks after each test, so the stylesheet override disappears on its own; the theme
	 * directory is a global and does not, hence restore_theme_directories().
	 */
	private function use_block_theme() {
		$this->theme_directories_before = $GLOBALS['wp_theme_directories'];
		register_theme_directory( __DIR__ . '/themes' );

		$stylesheet = static function () {
			return 'wordbless-block-theme';
		};
		add_filter( 'stylesheet', $stylesheet );
		add_filter( 'template', $stylesheet );
	}

	/**
	 * Unregisters the fixture theme directory. Call from tear_down().
	 */
	private function restore_theme_directories() {
		if ( null !== $this->theme_directories_before ) {
			$GLOBALS['wp_theme_directories'] = $this->theme_directories_before;
			$this->theme_directories_before  = null;
		}
	}
}
