import { expect, type FrameLocator, type Page } from '@playwright/test';
import { testingUser } from './utils';
import type { Scenario, Surface } from './sites';

const JETPACK_IFRAME = 'iframe[name="jetpack_remote_comment"]';

/**
 * Drives the Verbum comment form, hiding the one thing that differs between platforms:
 * where the form lives. Taking the iframe away (milestone 3) makes `root` the page
 * everywhere and leaves the specs untouched.
 */
export class VerbumForm {
	readonly root: Page | FrameLocator;

	constructor(
		private readonly page: Page,
		private readonly surface: Surface
	) {
		this.root = surface.iframe ? page.frameLocator( JETPACK_IFRAME ) : page;
	}

	get submitButton() {
		return this.root.locator( '#comment-submit' );
	}

	// The login / subscription panel above the submit button.
	get panel() {
		return this.root.locator( '.verbum-subscriptions' );
	}

	get textarea() {
		return this.root.locator( 'textarea#comment' );
	}

	// Only rendered when the block editor is enabled; it stands in until the editor loads.
	get editorPlaceholder() {
		return this.root.locator( '.verbum-editor-wrapper' );
	}

	get blockEditor() {
		return this.root
			.frameLocator( 'iframe[name="editor-canvas"]' )
			.locator( 'p[contenteditable="true"]' );
	}

	// Load the post for a scenario and wait for Verbum to render.
	async open( scenario: Scenario ) {
		const url = this.surface.posts[ scenario ];
		if ( ! url ) {
			throw new Error(
				`No ${ scenario } post is configured for the ${ this.surface.name } surface.`
			);
		}

		await this.page.goto( `${ url }#respond` );
		await this.dismissCookieConsent();
		await expect( this.submitButton ).toBeVisible();
	}

	async write( comment: string ) {
		if ( ( await this.editorPlaceholder.count() ) === 0 ) {
			await this.textarea.pressSequentially( comment );
			return;
		}

		// The placeholder swaps itself for the block editor on first click, then falls back
		// to the textarea if that editor can't be fetched from widgets.wp.com.
		await this.editorPlaceholder.click();
		try {
			await this.blockEditor.waitFor( { timeout: 15000 } );
		} catch {
			await this.textarea.pressSequentially( comment );
			return;
		}

		await this.blockEditor.pressSequentially( comment );
	}

	// Submit, then confirm the comment is published on the post.
	async submit( comment: string ) {
		await this.submitButton.click();
		await this.dismissSubscriptionModal();
		await this.page.waitForLoadState( 'domcontentloaded' );
		await expect( this.page.getByText( comment ) ).toBeVisible();
	}

	// Log in through the WordPress.com popup — the one identity path offered on every
	// surface. Signing in to the host site instead (`hc_post_as=jetpack`) needs per-site
	// credentials and is covered by the manual checklist in README.md.
	async logIn() {
		const popupPromise = this.page.waitForEvent( 'popup' );
		await this.root.locator( 'button.social-button.wordpress' ).first().click();
		const popup = await popupPromise;

		await popup.getByLabel( 'Email Address or Username' ).fill( testingUser.username );
		await popup.getByRole( 'button', { name: 'Continue', exact: true } ).click();
		await popup.getByLabel( 'Password' ).fill( testingUser.password );
		await popup.getByRole( 'button', { name: 'Log In' } ).click();

		await expect( this.root.locator( '.verbum__user-name' ) ).toContainText( testingUser.username );
	}

	// WordPress.com shows a consent banner in some regions, and it covers the form.
	private async dismissCookieConsent() {
		try {
			await this.page
				.frameLocator( '#cmp-app-container iframe' )
				.getByRole( 'button', { name: 'I Agree!' } )
				.click( { timeout: 5000 } );
		} catch {
			// It's ok if it wasn't there to be dismissed.
		}
	}

	// Simple sites interpose a subscription offer before landing on the new comment.
	private async dismissSubscriptionModal() {
		if ( this.surface.iframe ) {
			return;
		}

		try {
			await this.root
				.locator( '.verbum-simple-subscribe-modal__close-button' )
				.click( { timeout: 15000 } );
		} catch {
			// Skipped for site members and when the modal is turned off.
		}
	}
}
