import { Editor } from '@wordpress/e2e-test-utils-playwright';

export default class EditorPage extends Editor {
	/**
	 * Returns the editor top bar locator.
	 *
	 * @return {import('@playwright/test').Locator} The editor top bar locator.
	 */
	getEditorTopBar(): import('@playwright/test').Locator {
		return this.page.getByRole( 'region', { name: 'Editor top bar' } );
	}

	/**
	 * Returns the editor settings sidebar locator.
	 *
	 * @return {import('@playwright/test').Locator} The editor settings sidebar locator.
	 */
	getEditorSettingsSidebar(): import('@playwright/test').Locator {
		return this.page.getByRole( 'region', { name: 'Editor settings' } );
	}

	/**
	 * Returns the more options button instance.
	 *
	 * @return {import('@playwright/test').Locator} The more options button locator.
	 */
	getMoreOptionsButton(): import('@playwright/test').Locator {
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
	async #targetIsOpen( target: import('@playwright/test').Locator ): Promise< boolean > {
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
	async openSettings( target: string = 'Settings' ) {
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
