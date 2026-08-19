import { errors, expect, type FrameLocator, type Locator, type Page } from '@playwright/test';
import { testingUser } from './utils';
import type { Scenario, Surface } from './sites';

const JETPACK_IFRAME = 'iframe[name="jetpack_remote_comment"]';

// `waitFor` throws on timeout; every caller here wants a yes/no instead. Anything else it
// throws is a real fault (an ambiguous selector, a closed page), so let it through rather
// than reporting the element as absent and failing somewhere less obvious.
const appears = ( locator: Locator, timeout: number ) =>
	locator.waitFor( { timeout } ).then(
		() => true,
		error => {
			if ( error instanceof errors.TimeoutError ) {
				return false;
			}
			throw error;
		}
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
	// `attachGutenberg` gives the real editor a second `.verbum-editor-wrapper` and the
	// placeholder outlives it by a tick, so match on the class only the placeholder carries
	// rather than leaving a window where this resolves to two elements.
	get editorPlaceholder() {
		return this.root.locator( '.verbum-editor-wrapper:has(.loading-placeholder)' );
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
		// Both go through `Promise.all` so a failed form wait can't orphan the other and
		// surface later as an unhandled rejection against an unrelated test.
		await Promise.all( [ expect( this.submitButton ).toBeVisible(), this.dismissCookieConsent() ] );
	}

	// `should_load_gutenberg_comments()` as the client sees it. Reading the flag is
	// race-free, unlike looking for the markup Verbum renders from it. That markup only
	// appears a tick after first paint, so its absence proves nothing on its own.
	async blocksEnabled(): Promise< boolean > {
		return this.root.locator( 'body' ).evaluate( () => {
			const settings = ( window as unknown as VerbumWindow ).VerbumComments;

			// Coercing a missing blob to `false` would let "blocks are off" and "the
			// settings never printed" pass the same assertion.
			if ( ! settings ) {
				throw new Error( 'window.VerbumComments is missing: the settings blob never printed.' );
			}

			return Boolean( settings.enableBlocks );
		} );
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
		// Name the stuck gate directly. Clicking a disabled button instead burns the whole
		// test timeout and reports only that the click never landed.
		await expect( this.submitButton ).toBeEnabled();
		await this.submitButton.click();
		await this.dismissSubscriptionModal();
		await expect( this.page.getByText( comment ) ).toBeVisible();
	}

	// Log in through the WordPress.com popup, the one identity path offered on every
	// surface. Signing in to the host site instead (`hc_post_as=jetpack`) needs per-site
	// credentials and is covered by the manual checklist in README.md.
	//
	// Call `write()` first. The social buttons sit in the subscription tray, which is
	// collapsed to `grid-template-rows: 0fr` with `overflow: hidden` until a keyup in the
	// comment field opens it, so clicking before typing has no hit target.
	async logIn() {
		// Both in one `Promise.all` so a failed click can't orphan the popup wait and have
		// it reject 30s later against whichever test is running by then.
		const [ popup ] = await Promise.all( [
			this.page.waitForEvent( 'popup' ),
			this.root.locator( 'button.social-button.wordpress' ).first().click(),
		] );

		// The popup lands on WordPress.com's signup flow, which keeps the log-in form one
		// link away. Optional so the spec survives wpcom serving the form directly again.
		const logInLink = popup.getByRole( 'link', { name: 'Log in', exact: true } );
		if ( await appears( logInLink, 10000 ) ) {
			await logInLink.click();
		}

		// The label reads "Email address or username", but the accessible name comes from
		// the screen-reader copy that qualifies it.
		await popup
			.getByLabel( 'WordPress.com email address or username' )
			.fill( testingUser.username );
		await popup.getByRole( 'button', { name: 'Continue', exact: true } ).click();
		// Exact: the show/hide toggle beside the field is labelled "Show password", and a
		// loose match claims both.
		await popup.getByLabel( 'Password', { exact: true } ).fill( testingUser.password );
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

	// Simple renders Verbum's subscription modal. Atomic renders Jetpack's modal in the
	// host page. Both close controls live on the page rather than inside the Verbum iframe.
	private async dismissSubscriptionModal() {
		// Absent for site members and when the relevant modal is turned off. Only one can
		// render per surface, but `appears()` rethrows a strict-mode violation, so take the
		// first match rather than failing the test if that ever stops being true.
		const close = this.page
			.locator(
				[
					'.verbum-simple-subscribe-modal__close-button',
					'.jetpack-subscription-modal__close a',
				].join( ', ' )
			)
			.first();

		if ( await appears( close, 15000 ) ) {
			await close.click();
		}
	}
}
