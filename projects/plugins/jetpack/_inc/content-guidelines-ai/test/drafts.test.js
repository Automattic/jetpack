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

		it( 'notifies when a draft changes without an input event, on the next DOM mutation', async () => {
			renderSections();
			startDraftTracking();
			await flushObserver();

			const listener = jest.fn();
			const unsubscribe = subscribeToDrafts( listener );

			// Gutenberg resetting a form (e.g. Clear guidelines) writes the value
			// through React with no input event, alongside other DOM churn.
			getSectionTextarea( 'copy' ).value = 'changed silently';
			document.body.setAttribute( 'data-churn', '1' );
			await flushObserver();

			expect( listener ).toHaveBeenCalled();
			unsubscribe();
		} );

		it( 'does not notify on DOM churn while draft values are unchanged', async () => {
			renderSections();
			startDraftTracking();
			await flushObserver();

			const listener = jest.fn();
			const unsubscribe = subscribeToDrafts( listener );

			document.body.setAttribute( 'data-churn', '2' );
			const div = document.createElement( 'div' );
			document.body.appendChild( div );
			div.remove();
			await flushObserver();

			expect( listener ).not.toHaveBeenCalled();
			unsubscribe();
		} );
	} );
} );
