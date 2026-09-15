import { Editor } from '@wordpress/e2e-test-utils-playwright';
import type { Locator, Page } from '@playwright/test';

export default class EditorPage extends Editor {
	/**
	 * Returns the editor top bar locator.
	 *
	 * @return {Locator} The editor top bar locator.
	 */
	getEditorTopBar(): Locator {
		return this.page.getByRole( 'region', { name: 'Editor top bar' } );
	}

	/**
	 * Returns the editor settings sidebar locator.
	 *
	 * @return {Locator} The editor settings sidebar locator.
	 */
	getEditorSettingsSidebar(): Locator {
		return this.page.getByRole( 'region', { name: 'Editor settings' } );
	}

	/**
	 * Returns the more options button instance.
	 *
	 * @return {Locator} The more options button locator.
	 */
	getMoreOptionsButton(): Locator {
		return this.getEditorTopBar().getByRole( 'button', {
			name: 'Options',
			exact: true,
		} );
	}

	/**
	 * Opens the post preview in a new tab and returns that page.
	 *
	 * Core still labels the menu item "Preview in new tab" while the upstream utility
	 * (2.0.0) only knows the renamed "Preview (opens in a new tab)", so accept both.
	 *
	 * @return {Promise<Page>} The preview page.
	 */
	openPreviewPage = async (): Promise< Page > => {
		await this.getEditorTopBar().getByRole( 'button', { name: 'View', exact: true } ).click();

		const [ previewPage ] = await Promise.all( [
			this.context.waitForEvent( 'page' ),
			this.page
				.getByRole( 'menuitem', { name: /^Preview (in new tab|\(opens in a new tab\))$/i } )
				.click(),
		] );

		return previewPage;
	};

	/**
	 * Given a Locator, determines whether the target button/toggle is
	 * in an expanded state.
	 *
	 * If the toggle is in the on state or otherwise in an expanded
	 * state, this method will return true. Otherwise, false.
	 *
	 * @param {Locator} target - Target button.
	 * @return {Promise<boolean>} True if target is in an expanded state. False otherwise.
	 */
	async #targetIsOpen( target: Locator ): Promise< boolean > {
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

			button = this.page.getByRole( 'menuitemcheckbox', { name: target, exact: true } );
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
