import { expect, type FrameLocator, type Locator, type Page } from '@playwright/test';
import { testingUser } from './utils';
import type { Scenario, Surface } from './sites';

const JETPACK_IFRAME = 'iframe[name="jetpack_remote_comment"]';

// `waitFor` throws on timeout; every caller here wants a yes/no instead.
const appears = ( locator: Locator, timeout: number ) =>
	locator.waitFor( { timeout } ).then(
		() => true,
		() => false
	);

/** The subset of the `window.VerbumComments` blob the specs read. */
type VerbumWindow = { VerbumComments?: { enableBlocks?: boolean } };

/**
 * Drives the Verbum comment form, hiding the one thing that differs between platforms:
 * where the form lives. Taking the iframe away (milestone 3) makes `root` the page
 * everywhere and leaves the specs untouched.
 */
export class VerbumForm {
	private readonly root: Page | FrameLocator;

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

	get nameField() {
		return this.root.locator( '#verbum-email-form-name' );
	}

	get emailField() {
		return this.root.locator( '#verbum-email-form-email' );
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
		// The banner covers the form but doesn't stop it rendering, so let the two waits
		// overlap rather than paying for the banner's absence before starting this one.
		const consent = this.dismissCookieConsent();
		await expect( this.submitButton ).toBeVisible();
		await consent;
	}

	// `should_load_gutenberg_comments()` as the client sees it. Reading the flag is
	// race-free, unlike looking for the markup Verbum renders from it — that only appears
	// a tick after first paint, so its absence proves nothing on its own.
	async blocksEnabled(): Promise< boolean > {
		return this.root
			.locator( 'body' )
			.evaluate( () =>
				Boolean( ( window as unknown as VerbumWindow ).VerbumComments?.enableBlocks )
			);
	}

	async write( comment: string ) {
		if ( await this.blockEditorOffered() ) {
			// The placeholder swaps itself for the block editor on first click.
			await this.editorPlaceholder.click();

			if ( await appears( this.blockEditor, 15000 ) ) {
				await this.blockEditor.pressSequentially( comment );
				return;
			}
		}

		// The textarea is `display: none` for as long as the block editor is the chosen
		// input, so it is typeable only once Verbum has settled on it: after failing to
		// fetch the editor from widgets.wp.com, or by never offering it in the first
		// place. Say so plainly rather than typing into something invisible until the
		// test times out.
		await expect( this.textarea ).toBeVisible( { timeout: 5000 } );
		await this.textarea.pressSequentially( comment );
	}

	// Submit, then confirm the comment is published on the post.
	async submit( comment: string ) {
		await this.submitButton.click();
		await this.dismissSubscriptionModal();
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

	// Verbum picks between the block editor and the plain textarea a tick after first
	// paint, and only offers the editor when `isFastConnection()` agrees, so wait the
	// decision out. Guessing early types into a textarea that is about to be hidden.
	private async blockEditorOffered() {
		if ( ! this.surface.blocksEnabled ) {
			return false;
		}

		return appears( this.editorPlaceholder, 5000 );
	}

	// WordPress.com shows a consent banner in some regions, and it covers the form.
	private async dismissCookieConsent() {
		const agree = this.page
			.frameLocator( '#cmp-app-container iframe' )
			.getByRole( 'button', { name: 'I Agree!' } );

		if ( await appears( agree, 5000 ) ) {
			await agree.click();
		}
	}

	// Simple sites interpose a subscription offer before landing on the new comment.
	private async dismissSubscriptionModal() {
		if ( this.surface.iframe ) {
			return;
		}

		// Absent for site members and when the modal is turned off.
		const close = this.root.locator( '.verbum-simple-subscribe-modal__close-button' );

		if ( await appears( close, 15000 ) ) {
			await close.click();
		}
	}
}
