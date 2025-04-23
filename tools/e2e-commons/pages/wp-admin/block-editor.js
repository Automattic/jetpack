import { resolveSiteUrl } from '../../helpers/utils-helper.js';
import WpPage from '../wp-page.js';

export default class BlockEditorPage extends WpPage {
	constructor( page ) {
		const url = resolveSiteUrl() + '/wp-admin/post-new.php';
		super( page, { expectedSelectors: [ '#editor' ], url } );
	}

	/**
	 * Returns the editor top bar locator.
	 *
	 * @return {import('@playwright/test').Locator} The editor top bar locator.
	 */
	getEditorTopBar() {
		return this.page.getByRole( 'region', { name: 'Editor top bar' } );
	}

	/**
	 * Returns the editor settings sidebar locator.
	 *
	 * @return {import('@playwright/test').Locator} The editor settings sidebar locator.
	 */
	getEditorSettingsSidebar() {
		return this.page.getByRole( 'region', { name: 'Editor settings' } );
	}

	/**
	 * Returns the more options button instance.
	 *
	 * @return {import('@playwright/test').Locator} The more options button locator.
	 */
	getMoreOptionsButton() {
		return this.getEditorTopBar().getByRole( 'button', {
			name: 'Options',
			exact: true,
		} );
	}

	/**
	 * Given a Locator, determines whether the target button/toggle is
	 * in an expanded state.
	 *
	 * If the toggle is in the on state or otherwise in an expanded
	 * state, this method will return true. Otherwise, false.
	 *
	 * @param {import('@playwright/test').Locator} target - Target button.
	 * @return {Promise<boolean>} True if target is in an expanded state. False otherwise.
	 */
	async #targetIsOpen( target ) {
		const checked = await target.getAttribute( 'aria-checked' );
		const pressed = await target.getAttribute( 'aria-pressed' );
		const expanded = await target.getAttribute( 'aria-expanded' );
		return checked === 'true' || pressed === 'true' || expanded === 'true';
	}

	/* Editor Settings sidebar */

	/**
	 * Opens the editor settings.
	 *
	 * @param {string} target - The target to open. Can be 'Settings', 'Jetpack', 'Jetpack Social'.
	 */
	async openSettings( target = 'Settings' ) {
		let button = this.getEditorTopBar().getByLabel( target );

		// For other pinned settings, we need to open the options menu
		// because those are hidden on mobile/small screens
		if ( target !== 'Settings' ) {
			await this.openMoreOptionsMenu();

			button = this.page.getByRole( 'menuitemcheckbox', { name: target } );
		}

		if ( await this.#targetIsOpen( button ) ) {
			await this.closeMoreOptionsMenu();
			return;
		}

		await button.click();
	}

	/**
	 * Opens the more options menu (three dots).
	 */
	async openMoreOptionsMenu() {
		const button = this.getMoreOptionsButton();

		if ( await this.#targetIsOpen( button ) ) {
			return;
		}

		await button.click();
	}

	/**
	 * Closes the more options menu.
	 */
	async closeMoreOptionsMenu() {
		const button = this.getMoreOptionsButton();

		if ( await this.#targetIsOpen( button ) ) {
			await button.click();
		}
	}
}
