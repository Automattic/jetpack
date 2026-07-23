import { VALID_SECTIONS } from '../constants';
import {
	getSectionTextarea,
	getBlockModalTextarea,
	readSectionDraft,
	readAllSectionDrafts,
	areAllSectionDraftsEmpty,
	subscribeToDrafts,
	notifyDraftChange,
	startDraftTracking,
} from '../lib/drafts';
import { renderSections, renderBlockModal } from './fixtures';

// Flush the MutationObserver microtask so observer-driven notifications land.
const flushObserver = () => new Promise( resolve => setTimeout( resolve, 0 ) );

describe( 'drafts', () => {
	afterEach( () => {
		document.body.innerHTML = '';
	} );

	describe( 'getSectionTextarea', () => {
		it( 'returns the textarea for a section slug', () => {
			renderSections();
			const textarea = getSectionTextarea( 'site' );
			expect( textarea ).toBeInstanceOf( HTMLTextAreaElement );
			expect( textarea.closest( '[data-slug]' ).dataset.slug ).toBe( 'site' );
		} );

		it( 'returns null when the section is not in the DOM', () => {
			expect( getSectionTextarea( 'site' ) ).toBeNull();
		} );
	} );

	describe( 'getBlockModalTextarea', () => {
		it( 'returns the modal textarea', () => {
			const { modal, textarea } = renderBlockModal( 'Keep it short.' );
			expect( getBlockModalTextarea( modal ) ).toBe( textarea );
		} );

		it( 'returns null without a modal', () => {
			expect( getBlockModalTextarea( null ) ).toBeNull();
		} );
	} );

	describe( 'readSectionDraft', () => {
		it( 'returns the current textarea value', () => {
			renderSections( { copy: 'Use sentence case.' } );
			expect( readSectionDraft( 'copy' ) ).toBe( 'Use sentence case.' );
		} );

		it( 'returns an empty string when the section is missing', () => {
			expect( readSectionDraft( 'copy' ) ).toBe( '' );
		} );

		it( 'reflects edits made after render', () => {
			renderSections();
			getSectionTextarea( 'images' ).value = 'Use webp.';
			expect( readSectionDraft( 'images' ) ).toBe( 'Use webp.' );
		} );
	} );

	describe( 'readAllSectionDrafts', () => {
		it( 'returns a value for every valid section', () => {
			renderSections( { site: 'A travel blog.' } );
			const drafts = readAllSectionDrafts();
			expect( Object.keys( drafts ).sort() ).toEqual( [ ...VALID_SECTIONS ].sort() );
			expect( drafts.site ).toBe( 'A travel blog.' );
			expect( drafts.copy ).toBe( '' );
		} );
	} );

	describe( 'areAllSectionDraftsEmpty', () => {
		it( 'is true with no content and false once any section has text', () => {
			renderSections();
			expect( areAllSectionDraftsEmpty() ).toBe( true );
			getSectionTextarea( 'additional' ).value = 'Cite sources.';
			expect( areAllSectionDraftsEmpty() ).toBe( false );
		} );
	} );

	describe( 'subscription', () => {
		it( 'notifies subscribers and stops after unsubscribe', () => {
			const listener = jest.fn();
			const unsubscribe = subscribeToDrafts( listener );

			notifyDraftChange();
			expect( listener ).toHaveBeenCalledTimes( 1 );

			unsubscribe();
			notifyDraftChange();
			expect( listener ).toHaveBeenCalledTimes( 1 );
		} );

		it( 'notifies on input events that change a watched draft', async () => {
			renderSections();
			startDraftTracking();
			await flushObserver();

			const listener = jest.fn();
			const unsubscribe = subscribeToDrafts( listener );

			const textarea = getSectionTextarea( 'site' );
			textarea.value = 'A new draft.';
			textarea.dispatchEvent( new Event( 'input', { bubbles: true } ) );
			expect( listener ).toHaveBeenCalledTimes( 1 );

			unsubscribe();
		} );

		it( 'sees draft edits even when a page handler stops the bubbling input event', async () => {
			renderSections();
			startDraftTracking();
			await flushObserver();

			const listener = jest.fn();
			const unsubscribe = subscribeToDrafts( listener );

			const textarea = getSectionTextarea( 'site' );
			// A page-owned handler that swallows the event on the way up. The
			// draft listener is attached in the capture phase precisely so this
			// cannot hide an edit; a bubble-phase listener would miss it.
			textarea.parentElement.addEventListener( 'input', e => e.stopPropagation() );

			textarea.value = 'Captured despite stopPropagation.';
			textarea.dispatchEvent( new Event( 'input', { bubbles: true } ) );

			expect( listener ).toHaveBeenCalledTimes( 1 );
			unsubscribe();
		} );

		it( 'does not notify on input events in unrelated fields', async () => {
			renderSections();
			startDraftTracking();

			const unrelated = document.createElement( 'input' );
			document.body.appendChild( unrelated );
			await flushObserver();

			const listener = jest.fn();
			const unsubscribe = subscribeToDrafts( listener );

			unrelated.value = 'searching…';
			unrelated.dispatchEvent( new Event( 'input', { bubbles: true } ) );
			expect( listener ).not.toHaveBeenCalled();

			unsubscribe();
		} );

		it( 'attaches the listeners only once across repeated starts', async () => {
			renderSections();
			startDraftTracking();
			startDraftTracking();
			await flushObserver();

			const listener = jest.fn();
			const unsubscribe = subscribeToDrafts( listener );

			const textarea = getSectionTextarea( 'site' );
			textarea.value = 'Only one notification.';
			textarea.dispatchEvent( new Event( 'input', { bubbles: true } ) );
			expect( listener ).toHaveBeenCalledTimes( 1 );

			unsubscribe();
		} );

		it( 'notifies on a silent draft change that lands with form-state attribute churn', async () => {
			renderSections();
			// Stand-in for the Save/Clear button whose disabled state flips as
			// part of a form reset — `disabled` is one of the attributes the
			// observer still watches after narrowing its attribute filter.
			const saveButton = document.createElement( 'button' );
			document.body.appendChild( saveButton );
			startDraftTracking();
			await flushObserver();

			const listener = jest.fn();
			const unsubscribe = subscribeToDrafts( listener );

			// Gutenberg resetting a form (e.g. Clear guidelines) writes the value
			// through React with no input event, alongside button-state churn.
			getSectionTextarea( 'copy' ).value = 'changed silently';
			saveButton.setAttribute( 'disabled', '' );
			await flushObserver();

			expect( listener ).toHaveBeenCalled();
			unsubscribe();
		} );

		it( 'notifies on a silent draft change that lands with only childList churn', async () => {
			renderSections();
			startDraftTracking();
			await flushObserver();

			const listener = jest.fn();
			const unsubscribe = subscribeToDrafts( listener );

			// The reset's snackbar/dialog nodes appear and disappear (childList),
			// which the observer watches unconditionally — caught with no
			// attribute change at all.
			getSectionTextarea( 'copy' ).value = 'changed silently';
			document.body.appendChild( document.createElement( 'div' ) );
			await flushObserver();

			expect( listener ).toHaveBeenCalled();
			unsubscribe();
		} );

		it( 'ignores cosmetic attribute churn that is not a form-state signal', async () => {
			renderSections();
			startDraftTracking();
			await flushObserver();

			const listener = jest.fn();
			const unsubscribe = subscribeToDrafts( listener );

			// A silent value change paired only with a filtered-out attribute
			// (here `style`) is intentionally not caught: the narrowed observer
			// skips cosmetic churn, so nothing re-reads the value until real
			// form-state churn or an input event arrives.
			getSectionTextarea( 'copy' ).value = 'changed silently';
			document.body.setAttribute( 'style', 'color: red' );
			await flushObserver();

			expect( listener ).not.toHaveBeenCalled();
			unsubscribe();
		} );

		it( 'does not notify on DOM churn while draft values are unchanged', async () => {
			renderSections();
			startDraftTracking();
			await flushObserver();

			const listener = jest.fn();
			const unsubscribe = subscribeToDrafts( listener );

			const div = document.createElement( 'div' );
			document.body.appendChild( div );
			div.remove();
			await flushObserver();

			expect( listener ).not.toHaveBeenCalled();
			unsubscribe();
		} );
	} );
} );
